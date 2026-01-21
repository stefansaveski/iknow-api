using iknow_api.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using iknow_api.Services;
using System.ComponentModel;
using System.Collections.Specialized;
using iknow_api.Models;
using System.Security.Claims;
using Npgsql.Internal;

namespace iknow_api.Controllers
{
    [Authorize(Roles = "Professor")]
    [ApiController]
    [Route("api/[controller]")]
    public class ProfController : ControllerBase
    {
        private readonly IProfService _profService;

        public ProfController(IProfService profService)
        {
            _profService = profService;
        }

        [HttpGet("test")]
        public ActionResult<string> Test()
        {
            var profId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return Ok(profId);
        }

        [HttpGet("subjects")]
        public async Task<ActionResult<List<SubjectsAndUsers>>> GetStudents()
        {
            var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(idClaim, out var profId))
                return Unauthorized();

            var result = await _profService.getSubjectsAndUsers(profId);
            return Ok(result);
        }

        [HttpPost("grade")]
        public async Task<ActionResult> Grade([FromBody] AddGrade grade)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (grade == null)
                return BadRequest();

            if (grade.grade < 6 || grade.grade > 10)
                return BadRequest("Grade must be between 6 and 10.");

            try
            {
                await _profService.addGrade(grade);
                return Ok();
            }
            catch (KeyNotFoundException knf)
            {
                return NotFound(knf.Message);
            }
            catch (ArgumentException ae)
            {
                return BadRequest(ae.Message);
            }
        }

        [HttpDelete("grade/{id}")]
        public async Task<ActionResult> DeleteGrade(int id)
        {
            try
            {
                await _profService.deleteGrade(id);
                return NoContent();
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
        }

        [HttpPut("grade/{id}/{grade}")]
        public async Task<ActionResult> UpdateGrade(int id, int grade)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (grade < 6 || grade > 10)
                return BadRequest("Grade must be between 6 and 10.");

            try
            {
                await _profService.changeGrade(id, grade);
                return NoContent();
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
            catch (ArgumentException ae)
            {
                return BadRequest(ae.Message);
            }
        }
    }
}