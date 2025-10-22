//using iknow_api.Data;
using iknow_api.Models;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;


namespace iknow_api.Controllers
{
    [ApiController]
    [Route("user")]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;

        public UsersController(AppDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        [HttpPost("add")]
        public async Task<IActionResult> Add([FromBody] JsonContent body)
        {
            
            return null;
        }

    }
}