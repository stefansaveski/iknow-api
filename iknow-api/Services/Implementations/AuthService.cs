using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BCrypt.Net;
using FinXaccesApi.Controllers;
using iknow_api.Core.Models;
using FinXaccesApi.DTOs;
using FinXaccesApi.Repositories;
using Microsoft.IdentityModel.Tokens;

namespace FinXaccesApi.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUserRepository _userRepository;
        private readonly IConfiguration _configuration;

        public AuthService(IUserRepository userRepository, IConfiguration configuration)
        {
            _userRepository = userRepository;
            _configuration = configuration;
        }

        public async Task<bool> RegisterAsync(UserDto userDto)
        {
            if (await _userRepository.UserExistsAsync(userDto.Username))
                return false;

            var user = new User
            {
                Email = userDto.Username,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(userDto.Password)
            };

            await _userRepository.AddUserAsync(user);
            return true;
        }

        public async Task<string?> LoginAsync(UserDto userDto)
        {
            var user = await _userRepository.GetUserByUsernameAsync(userDto.Username);
            if (user == null || !BCrypt.Net.BCrypt.Verify(userDto.Password, user.PasswordHash))
                return null;

            return CreateToken(user);
        }

        public async Task<int> GetUsersCountAsync()
        {
            return await _userRepository.GetUsersCountAsync();
        }

        private string CreateToken(User user)
        {
            var claims = new[]
            {
                new Claim("id", user.Id.ToString()),
                new Claim("username", user.Email)
            };

            var keyString = _configuration["Jwt:Key"];
            if (string.IsNullOrEmpty(keyString))
                throw new Exception("JWT Key is missing in configuration!");

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(keyString));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: "finxacces-api",
                audience: "finxacces-api",
                claims: claims,
                expires: DateTime.Now.AddHours(1),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}