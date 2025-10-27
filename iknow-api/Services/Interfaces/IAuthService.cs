using iknow_api.DTOs;

namespace iknow_api.Services
{
    public interface IAuthService
    {
        Task<bool> RegisterAsync(RegisterDto registerDto);
        Task<AuthResultDto?> LoginAsync(LoginDto loginDto);
        Task<int> GetUsersCountAsync();
    }
}