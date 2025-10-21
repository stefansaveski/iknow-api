using System.Threading;
using System.Threading.Tasks;
using iknow_api.Core.Models;

namespace iknow_api.Repository.Interfaces
{
    public interface IUserRepository
    {
        Task<bool> EmailExistsAsync(string email, CancellationToken cancellationToken = default);
        Task<User> AddUserAsync(User user, CancellationToken cancellationToken = default);
        Task<User?> GetUserByIdAsync(int id, CancellationToken cancellationToken = default);
    }
}