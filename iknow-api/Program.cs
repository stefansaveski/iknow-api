using System.Text;
using System.Text.Json.Serialization;
using iknow_api.Data;
using iknow_api.Models;
using iknow_api.Repositories;
using iknow_api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Add CORS policy
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>() 
            ?? new[] { "http://localhost:3000" };
        
        policy.WithOrigins(allowedOrigins) // Your frontend URL(s)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false; // only for development
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = "iknow-api",

        ValidateAudience = true,
        ValidAudience = "iknow-api",

        ValidateLifetime = true,

        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
    };
});
// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.AddOpenApi();

// Register DbContext.
// The database lives behind the SSH tunnel: tunnel_scripta.cmd maps
// localhost:9999 to the faculty Postgres server. Start it before the API.
// The enum labels come from sql/ddl.sql, so each CLR enum is mapped onto its
// Postgres type by name; PgEnumLabels covers the members whose label is not
// simply the lowercased member name.
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        npgsql =>
        {
            npgsql.MapEnum<UserRole>("user_role", AppDbContext.ProjectSchema, PgEnumLabels.UserRole);
            npgsql.MapEnum<HighSchoolType>("hs_type", AppDbContext.ProjectSchema, PgEnumLabels.Lowercase);
            npgsql.MapEnum<Quota>("quota_type", AppDbContext.ProjectSchema, PgEnumLabels.Lowercase);
            npgsql.MapEnum<sType>("semester_type", AppDbContext.ProjectSchema, PgEnumLabels.Lowercase);
            npgsql.MapEnum<Grade>("grade_type", AppDbContext.ProjectSchema, PgEnumLabels.Grade);
        }));

// Register your services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserRepository, UserRepository>(); // You'll need to add the UserRepository implementation
builder.Services.AddScoped<IUserService, UserService>();

builder.Services.AddScoped<IRefreshTokenService, RefreshTokenService>();
builder.Services.AddScoped<IUserRepository, UserRepository>(); 
builder.Services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>(); 
builder.Services.AddScoped<IProfRepository, ProfRepository>();
builder.Services.AddScoped<IProfService, ProfService>();
builder.Services.AddScoped<IEnrollmentService, EnrollmentService>();
builder.Services.AddScoped<IAdminService, AdminService>();
builder.Services.AddAuthorization();
var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// Enable CORS - must be called before UseAuthentication and UseAuthorization
app.UseCors("AllowFrontend");

app.UseHttpsRedirection();
app.UseAuthentication(); // <-- must come BEFORE UseAuthorization
app.UseAuthorization();
app.MapControllers();

app.Run();
