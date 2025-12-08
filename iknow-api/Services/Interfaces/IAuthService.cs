using iknow_api.DTOs;
using iknow_api.Models;
namespace iknow_api.Services
{
    public interface IAuthService
    {
        Task<bool> RegisterAsync(RegisterDto registerDto);
        Task<AuthResultDto?> LoginAsync(LoginDto loginDto);
        Task<int> GetUsersCountAsync();
        Task<AuthResultDto> GenerateNewJWT(VerifyRefreshTokenDto token);
       
    }
}