using iknow_api.DTOs;
using iknow_api.Models;
namespace iknow_api.Services
{
    public interface IUserService
    {
        Task<User> GetUserData(string userId);
        Task<List<EnrolledSemesters>> GetUserSemesters(string userId);
    }
}
