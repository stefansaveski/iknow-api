using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BCrypt.Net;
using iknow_api.Services;
using iknow_api.Models;
using iknow_api.DTOs;
using iknow_api.Repositories;
using Microsoft.IdentityModel.Tokens;

namespace iknow_api.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUserRepository _userRepository;
        private readonly IRefreshTokenRepository _refreshTokenRepository;
        private readonly IRefreshTokenService _refreshTokenService;
        private readonly IConfiguration _configuration;

        public AuthService(IUserRepository userRepository, IConfiguration configuration
                            , IRefreshTokenService refreshTokenService, IRefreshTokenRepository refreshTokenRepository)
        {
            _userRepository = userRepository;
            _configuration = configuration;
            _refreshTokenService = refreshTokenService;
            _refreshTokenRepository = refreshTokenRepository;
        }

        public async Task<bool> RegisterAsync(RegisterDto registerDto)
        {
            if (await _userRepository.UserExistsAsync(registerDto.Email))
                return false;

            var user = new User
            {
                Name = registerDto.Name,
                Surname = registerDto.Surname,
                Index = registerDto.Index,
                Email = registerDto.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(registerDto.Password),
                Bday = DateTime.SpecifyKind(registerDto.Bday, DateTimeKind.Utc),
                CreatedAt = DateTime.UtcNow,
                Role = (Models.UserRole)registerDto.Role
            };

            await _userRepository.AddUserAsync(user);
            return true;
        }

        public async Task<AuthResultDto?> LoginAsync(LoginDto loginDto)
        {
            var user = await _userRepository.GetUserByUsernameAsync(loginDto.Email);
            if (user == null || !BCrypt.Net.BCrypt.Verify(loginDto.Password, user.PasswordHash))
                return null;

             var result = new AuthResultDto
            {
                AccessToken = CreateToken(user)
            };

            if (loginDto.GenerateRefreshToken)
            {
                int userid = _userRepository.GetUserByUsernameAsync(loginDto.Email).Id;
                result.RefreshToken = await _refreshTokenService.GenerateRefreshToken(userid);
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
            User user = await _userRepository.GetOnlyUserByIdAsync(userid);

            var result = new AuthResultDto
            {
                AccessToken = CreateToken(user)
            };
            
            return result;
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

            var token = new JwtSecurityToken(
                issuer: "iknow-api",
                audience: "iknow-api",
                claims: claims,
                expires: DateTime.UtcNow.AddHours(1),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}