using iknow_api.DTOs;

namespace iknow_api.Services
{
    public interface IRefreshTokenService
    {
        Task<bool> VerifyRefreshToken(VerifyRefreshTokenDto refreshTokenDto);
        Task<string> GenerateRefreshToken(int userid);
    }
}