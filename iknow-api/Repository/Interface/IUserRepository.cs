using iknow_api.Models;
namespace iknow_api.Repositories
{
    public interface IUserRepository
    {
        Task<bool> UserExistsAsync(string username);
        Task<User?> GetUserByUsernameAsync(string username);
        Task AddUserAsync(User user);
        Task<int> GetUsersCountAsync();
        Task<User> GetUserByIdAsync(int id);
    }
}