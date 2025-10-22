using iknow_api.Core.Models;
using iknow_api.Core.Data;
using iknow_api.Core.Data;
using iknow_api.Core.Models;
using Microsoft.EntityFrameworkCore;

namespace FinXaccesApi.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly AppDbContext _context;

        public UserRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<bool> UserExistsAsync(string username)
        {
            return await _context.User.AnyAsync(u => u.Email == username);
        }

        public async Task<User?> GetUserByUsernameAsync(string username)
        {
            return await _context.User.FirstOrDefaultAsync(u => u.Email == username);
        }

        public async Task AddUserAsync(User user)
        {
            _context.User.Add(user);
            await _context.SaveChangesAsync();
        }

        public async Task<int> GetUsersCountAsync()
        {
            return await _context.User.CountAsync();
        }
    }
}