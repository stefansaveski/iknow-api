using iknow_api.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using iknow_api.Services;

namespace iknow_api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : Controller
    {
        IUserService _userService;
        public UserController(IUserService userService)
        {
            _userService = userService;
        }
        [Authorize]
        [HttpGet("getUser")]
        public async Task<IActionResult> getUser()
        {
            var authHeader = Request.Headers["Authorization"].ToString();
            if (authHeader.StartsWith("Bearer "))
            {
                var token = authHeader.Substring("Bearer ".Length).Trim();
                // token = your JWT
                var userData = await _userService.GetUserData(token);
                if (userData == null) return Ok(new { info = "can't get info" });
                return Ok(new { Token = userData });
            }
            return null;
            
        }
    }
}
