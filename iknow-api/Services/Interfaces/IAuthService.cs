using FinXaccesApi.Controllers;
using FinXaccesApi.DTOs;

namespace FinXaccesApi.Services
{
    public interface IAuthService
    {
        Task<bool> RegisterAsync(UserDto userDto);
        Task<string?> LoginAsync(UserDto userDto);
        Task<int> GetUsersCountAsync();
    }
}