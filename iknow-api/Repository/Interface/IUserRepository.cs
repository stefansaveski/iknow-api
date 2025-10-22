using iknow_api.Core.Models;
namespace FinXaccesApi.Repositories
{
    public interface IUserRepository
    {
        Task<bool> UserExistsAsync(string username);
        Task<User?> GetUserByUsernameAsync(string username);
        Task AddUserAsync(User user);
        Task<int> GetUsersCountAsync();
    }
}