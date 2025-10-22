using iknow_api.DTOs;

namespace iknow_api.Services
{
    public interface IAuthService
    {
        Task<bool> RegisterAsync(UserDto userDto);
        Task<string?> LoginAsync(UserDto userDto);
        Task<int> GetUsersCountAsync();
    }
}