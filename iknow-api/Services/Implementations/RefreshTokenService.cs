using iknow_api.DTOs;
using iknow_api.Services;
using System.Security.Cryptography;
using iknow_api.Models;
using iknow_api.Models;
using iknow_api.Repositories;

namespace iknow_api.Services
{
    public class RefreshTokenService : IRefreshTokenService
    {
        private readonly IRefreshTokenRepository _refreshTokenRepository;
        public RefreshTokenService(IRefreshTokenRepository refreshTokenRepository)
        {
            _refreshTokenRepository = refreshTokenRepository;
        }

        public async Task<string> GenerateRefreshToken(int userid)
        {
            var randomNumber = new byte[32];

            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(randomNumber);
            }

            var refreshToken = Convert.ToBase64String(randomNumber);

            RefreshToken refreshTokenModel = new RefreshToken
            {
                Token = refreshToken,
                UserId = userid,
                ExpiresAt = DateTime.SpecifyKind(DateTime.UtcNow.AddMonths(1), DateTimeKind.Unspecified),
                IsValid = true
            };

            await _refreshTokenRepository.AddTokenAsync(refreshTokenModel);

            return refreshToken;
        }

        public async Task<bool> VerifyRefreshToken(VerifyRefreshTokenDto refreshTokenDto)
        {

            return await _refreshTokenRepository.VerifyTokenAsync(refreshTokenDto);
        }

        
    }
}