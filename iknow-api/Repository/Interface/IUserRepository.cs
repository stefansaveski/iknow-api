using iknow_api.Models;
namespace iknow_api.Repositories
{
    public interface IUserRepository
    {
        Task<bool> UserExistsAsync(string username);
        Task<User?> GetUserByUsernameAsync(string username);
        Task AddUserAsync(User user);
        Task AddContactAsync(ContactInfo contactInfo);
        Task AddEnrollmentAsync(EnrollmentInfo enrollment);
        Task AddHighSchoolAsync(HighSchool highSchool);
        Task<int> GetUsersCountAsync();
        Task<User?> GetUserByIdAsync(int id);
        Task<User?> GetOnlyUserByIdAsync(int id);

    }
}