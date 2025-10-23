using iknow_api.DTOs;

namespace iknow_api.Services
{
    public interface IAuthService
    {
        Task<bool> RegisterAsync(RegisterDto registerDto);
        Task<string?> LoginAsync(LoginDto loginDto);
        Task<int> GetUsersCountAsync();
    }
}