
namespace iknow_api.Core.Interfaces
{
    public interface IUserService
    {
        Task<JsonContent> AddUser(JsonContent newUser);
    }
}