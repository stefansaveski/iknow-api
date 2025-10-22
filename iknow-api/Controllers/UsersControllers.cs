using iknow_api.Core.Models;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using iknow_api.Core.Data;
using FinXaccesApi.Repositories;
using iknow_api.Core.Interfaces;

namespace iknow_api.Controllers
{
    [ApiController]
    [Route("user")]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _users;

        public UsersController(IUserService users)
        {
            _users = users;
        }

        [HttpPost("add")]
        public async Task<IActionResult> Add([FromBody] User user)
        {
            var created = await _users.AddUserAsync(user);
            return Ok(created);
        }

        [HttpGet("id/{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var user = await _users.GetUserByIdAsync(id);
            if (user == null)
                return NotFound();
            return Ok(user);
        }
    }
}