using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using iknow_api.Core.Models;
using iknow_api.Repository.Interfaces;
using iknow_api.Core.Data;

namespace iknow_api.Repository
{
    public class UserRepository : IUserRepository
    {
        private readonly AppDbContext _context;

        public UserRepository(AppDbContext context)
        {
            _context = context;
        }

        public Task<bool> EmailExistsAsync(string email, CancellationToken cancellationToken = default)
            => _context.User.AnyAsync(u => u.Email == email, cancellationToken);

        public async Task<User> AddUserAsync(User user, CancellationToken cancellationToken = default)
        {
            await _context.User.AddAsync(user, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
            return user;
        }

        public Task<User?> GetUserByIdAsync(int id, CancellationToken cancellationToken = default)
            => _context.User.FindAsync(new object[] { id }, cancellationToken).AsTask();
    }
}