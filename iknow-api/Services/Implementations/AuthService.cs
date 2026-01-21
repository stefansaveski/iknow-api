using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BCrypt.Net;
using iknow_api.Models;
using iknow_api.DTOs;
using iknow_api.Repositories;
using Microsoft.IdentityModel.Tokens;
using iknow_api.Data;

namespace iknow_api.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUserRepository _userRepository;
        private readonly IRefreshTokenRepository _refreshTokenRepository;
        private readonly IRefreshTokenService _refreshTokenService;
        private readonly IConfiguration _configuration;
        private readonly AppDbContext _context;

        public AuthService(IUserRepository userRepository, IConfiguration configuration,
                            IRefreshTokenService refreshTokenService, IRefreshTokenRepository refreshTokenRepository,
                            AppDbContext context)
        {
            _userRepository = userRepository;
            _configuration = configuration;
            _refreshTokenService = refreshTokenService;
            _refreshTokenRepository = refreshTokenRepository;
            _context = context;
        }

        public async Task<bool> RegisterAsync(RegisterDto registerDto)
        {
            // Debug: Log all incoming DTO values
            Console.WriteLine("=== RegisterDto Debug Info ===");
            Console.WriteLine($"Name: {registerDto.Name}");
            Console.WriteLine($"Email: {registerDto.Email}");
            Console.WriteLine($"majorType: {registerDto.majorType}");
            Console.WriteLine($"enrollmentYear: {registerDto.enrollmentYear}");
            Console.WriteLine($"quotaType: {registerDto.quotaType}");
            Console.WriteLine($"Role: {registerDto.Role}");
            Console.WriteLine($"tip: {registerDto.tip}");
            Console.WriteLine("==============================");

            // Check if user already exists
            if (await _userRepository.UserExistsAsync(registerDto.Email))
                throw new InvalidOperationException("User with this email already exists");

            // Use a transaction to ensure all entities are saved together
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var user = new User
                {
                    Name = registerDto.Name,
                    MiddleName = registerDto.MiddleName,
                    Surname = registerDto.Surname,
                    Index = registerDto.Index,
                    Email = registerDto.Email,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(registerDto.Password),
                    Bday = DateTime.SpecifyKind(registerDto.Bday, DateTimeKind.Utc),
                    CreatedAt = DateTime.UtcNow,
                    Role = (Models.UserRole)registerDto.Role,
                    EMBG = registerDto.EMBG,
                    Nationality = registerDto.nationality,
                    Citizenship = registerDto.citizenship,
                    Gender = registerDto.gender
                };

                _context.User.Add(user);
                await _context.SaveChangesAsync();
                
                int userId = user.Id;
                
                var contactInfo = new ContactInfo
                {
                    UserId = userId,
                    City = registerDto.city,
                    Address = registerDto.address,
                    Municipality = registerDto.municipality,
                    PhoneNumber = registerDto.phoneNumber,
                    MicrosoftEmail = registerDto.microsoftEmail
                };
                
                var enrollmentInfo = new EnrollmentInfo
                {
                    UserId = userId,
                    EnrollmentYear = registerDto.enrollmentYear,
                    Quota = (Models.Quota)registerDto.quotaType,
                    MajorId = registerDto.majorType,
                    StudyStatus = registerDto.studyStatus,
                    StudyType = registerDto.studyType
                };
                
                var highSchool = new HighSchool
                {
                    UserId = userId,
                    GPA = registerDto.gpa,
                    HighSchoolType = (Models.HighSchoolType)registerDto.tip
                };

                _context.ContactInfo.Add(contactInfo);
                _context.EnrollmentInfo.Add(enrollmentInfo);
                _context.HighSchool.Add(highSchool);
                
                // Save all related entities in a single transaction
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                
                return true;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<AuthResultDto?> LoginAsync(LoginDto loginDto)
        {
            var user = await _userRepository.GetUserByUsernameAsync(loginDto.Email);
            if (user == null || !BCrypt.Net.BCrypt.Verify(loginDto.Password, user.PasswordHash))
                return null;

            var result = new AuthResultDto
            {
                AccessToken = CreateToken(user),
                Role = user.Role.ToString()
            };

            if (loginDto.GenerateRefreshToken)
            {
                result.RefreshToken = await _refreshTokenService.GenerateRefreshToken(user.Id);
            }

            return result;
        }

        public async Task<int> GetUsersCountAsync()
        {
            return await _userRepository.GetUsersCountAsync();
        }

        public async Task<AuthResultDto> GenerateNewJWT(VerifyRefreshTokenDto token)
        {
            int userid = await _refreshTokenRepository.GetUserId(token.token) ?? 0;
            User? user = await _userRepository.GetOnlyUserByIdAsync(userid);

            if (user == null)
                throw new InvalidOperationException("User not found for provided refresh token.");

            return new AuthResultDto
            {
                AccessToken = CreateToken(user),
                Role = user.Role.ToString()
            };
        }

        private string CreateToken(User user)
        {
            var claims = new[]
            {
                new Claim("id", user.Id.ToString()),
                new Claim("email", user.Email ?? string.Empty),
                new Claim("role", user.Role.ToString())
            };

            var keyString = _configuration["Jwt:Key"];
            if (string.IsNullOrEmpty(keyString))
                throw new Exception("JWT Key is missing in configuration!");

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(keyString));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var jwt = new JwtSecurityToken(
                issuer: "iknow-api",
                audience: "iknow-api",
                claims: claims,
                expires: DateTime.UtcNow.AddHours(1),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(jwt);
        }
    }
}