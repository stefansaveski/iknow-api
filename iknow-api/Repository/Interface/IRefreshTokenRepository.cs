using iknow_api.DTOs;
using iknow_api.Models;
namespace iknow_api.Repositories{
    public interface IRefreshTokenRepository
    {
        Task AddTokenAsync(RefreshToken refreshToken);
        Task<bool> VerifyTokenAsync(VerifyRefreshTokenDto refreshTokenDto);
        Task<bool> DeleteTokenAsync(string refreshTokenDto);
        
    }
}