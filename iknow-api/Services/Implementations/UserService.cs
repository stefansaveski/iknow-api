using Microsoft.AspNetCore.Mvc;

namespace iknow_api.Core.Services
{
    public class UserService
    {
        private readonly AppDbContext _context;

        public UserService(AppDbContext context)
        {
            _context = context;
        }


    }
}