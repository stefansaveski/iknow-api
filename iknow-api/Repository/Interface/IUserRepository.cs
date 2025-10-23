using iknow_api.Core.Models;
namespace iknow_api.Repositories
{
    public interface IUserRepository
    {
        Task<bool> UserExistsAsync(string username);
        Task<User?> GetUserByUsernameAsync(string username);
        Task AddUserAsync(User user);
        Task<int> GetUsersCountAsync();
    }
}