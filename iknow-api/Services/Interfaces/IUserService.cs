using System.Threading;
using System.Threading.Tasks;
using iknow_api.Core.Models;

namespace iknow_api.Core.Interfaces
{
    public interface IUserService
    {
        Task<User> AddUserAsync(User user, CancellationToken cancellationToken = default);
        Task<int> GetUserByIdAsync(int id, CancellationToken cancellationToken = default);
    }
}