using iknow_api.Models;
using iknow_api.Data;
using Microsoft.EntityFrameworkCore;

namespace iknow_api.Repositories
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
        
        public async Task<User?> GetUserByIdAsync(int id)
        {
            return await _context.User
                .Include(u => u.ContactInfo)
                .Include(u => u.EnrollmentInfo)
                .Include(u => u.HighSchool)
                .FirstOrDefaultAsync(u => u.Id == id);
        }


        public async Task<User?> GetOnlyUserByIdAsync(int id)
        {
            return await _context.User.FirstOrDefaultAsync(u => u.Id == id);
        }
        public async Task AddUserAsync(User user)
        {
            _context.User.Add(user);
            await _context.SaveChangesAsync();
        }
        public async Task AddContactAsync(ContactInfo contactInfo)
        {
            _context.ContactInfo.Add(contactInfo);
            await _context.SaveChangesAsync();
        }
        public async Task AddEnrollmentAsync(EnrollmentInfo enrollment)
        {
            _context.EnrollmentInfo.Add(enrollment);
            await _context.SaveChangesAsync();
        }   
        public async Task AddHighSchoolAsync(HighSchool highSchool)
        {
            _context.HighSchool.Add(highSchool);
            await _context.SaveChangesAsync();
        }       

        public async Task<int> GetUsersCountAsync()
        {
            return await _context.User.CountAsync();
        }

    }
}