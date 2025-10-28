using iknow_api.Repositories;
using iknow_api.Services;
using iknow_api.DTOs;
using Microsoft.AspNetCore.Http.HttpResults;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using iknow_api.Models;

namespace iknow_api.Services
{
    public class UserService : IUserService
    {

        private readonly IUserRepository _userRepository;
        private readonly IConfiguration _configuration;
        public UserService(IUserRepository userRepository, IConfiguration configuration)
        {
            _userRepository = userRepository;
            _configuration = configuration;
        }
        public async Task<User> GetUserData(string JWT)
        {
            var userId = ExtractUserIdFromJwt(JWT);
            if (userId == null)
                return null;

            // Now you can use userId to fetch user data
            var user = await _userRepository.GetUserByIdAsync(userId.Value);
            if(user == null)
                return null;
            else
                return user;
        }

        private int? ExtractUserIdFromJwt(string token)
        {
            try
            {
                var tokenHandler = new JwtSecurityTokenHandler();
                var keyString = _configuration["Jwt:Key"];
                
                if (string.IsNullOrEmpty(keyString))
                    return null;

                var key = Encoding.UTF8.GetBytes(keyString);

                var validationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = true,
                    ValidIssuer = "iknow-api",
                    ValidateAudience = true,
                    ValidAudience = "iknow-api",
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero
                };

                var principal = tokenHandler.ValidateToken(token, validationParameters, out SecurityToken validatedToken);
                
                // Extract the "id" claim that was set in AuthService.CreateToken
                var userIdClaim = principal.FindFirst("id");
                
                if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId))
                {
                    return userId;
                }

                return null;
            }
            catch
            {
                return null;
            }
        }
    }
}
