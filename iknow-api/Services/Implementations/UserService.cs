//using Microsoft.EntityFrameworkCore;
//using iknow_api.Core.Models;
//using iknow_api.Repository.Interfaces;
//// ...existing code...

//namespace iknow_api.Core.Services
//{
//    public class UserService
//    {
//        private readonly IUserRepository _users;

//        public UserService(IUserRepository users)
//        {
//            _users = users;
//        }

//        public async Task<User> AddUserAsync(User user, CancellationToken cancellationToken = default)
//        {
//            if (user == null) throw new ArgumentNullException(nameof(user));

//            if (!string.IsNullOrWhiteSpace(user.Email))
//            {
//                user.Email = user.Email.Trim();

//                var exists = await _users.EmailExistsAsync(user.Email, cancellationToken);
//                if (exists)
//                    throw new InvalidOperationException("A user with this email already exists.");
//            }

//            return await _users.AddUserAsync(user, cancellationToken);
//        }
//    }
//}