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
                .Include(u => u.HighSchool)
                // The study programme is reached through the enrolment, since
                // Major hangs off EnrolledSemesters rather than off Users.
                .Include(u => u.Enrolments!)
                    .ThenInclude(es => es.Major)
                .Include(u => u.Enrolments!)
                    .ThenInclude(es => es.Semester)
                .AsSplitQuery()
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
        public async Task AddHighSchoolAsync(HighSchool highSchool)
        {
            _context.HighSchool.Add(highSchool);
            await _context.SaveChangesAsync();
        }       

        public async Task<int> GetUsersCountAsync()
        {
            return await _context.User.CountAsync();
        }
        public async Task<List<EnrolledSemesters>> GetUserSemestersAsync(int id)
        {
            return await _context.EnrolledSemesters
                .AsNoTracking()
                .Include(es => es.Major)
                .Include(es => es.Semester)
                .Include(es => es.SemesterSubjects)
                    .ThenInclude(ss => ss.Subject)
                .Include(es => es.SemesterSubjects)
                    .ThenInclude(ss => ss.Professor)
                .Where(es => es.UserId == id)
                .AsSplitQuery() // This helps avoid cartesian explosion
                .ToListAsync();
        }

        public async Task<List<PassedSubject>> GetUserPassedSubjectsAsync(int id)
        {
            return await _context.PassedSubjects
                .AsNoTracking()
                .Include(ps => ps.SemesterSubject)
                    .ThenInclude(ss => ss.Subject)
                .Include(ps => ps.SemesterSubject)
                    .ThenInclude(ss => ss.EnrolledSemester)
                        .ThenInclude(es => es.Semester)
                .Include(ps => ps.SemesterSubject)
                    .ThenInclude(ss => ss.Professor)
                // The ER model reaches the student through the enrolment,
                // not through a user_id on semesters_subjects.
                .Where(ps => ps.SemesterSubject.EnrolledSemester.UserId == id)
                .ToListAsync();
        }

    }
}