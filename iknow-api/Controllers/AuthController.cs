using iknow_api.DTOs;
using iknow_api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;

namespace iknow_api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpGet("testdb")]
        public async Task<IActionResult> TestDb()
        {
            try
            {
                var count = await _authService.GetUsersCountAsync();
                return Ok(new { message = "DB connection works!", usersCount = count });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "DB connection failed", error = ex.Message });
            }
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto request)
        {
            var result = await _authService.RegisterAsync(request);
            if (!result) return BadRequest("User already exists");
            return Ok("User registered successfully");
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto request)
        {
            var token = await _authService.LoginAsync(request);
            if (token == null) return Unauthorized("Invalid credentials");
            return Ok(new { Token = token });
        }

        [Authorize]
        [HttpGet("getstring")]
        public async Task<IActionResult> getstring()
        {
            return Ok(new { message = "You are authorized!" });
        }
    }
}