using System.Security.Claims;
using iknow_api.DTOs;
using iknow_api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace iknow_api.Controllers
{
    /// <summary>
    /// UC012 subjects, UC013 active semesters, UC014 professor assignments.
    /// Every action requires the admin role, checked against the validated token.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AdminController : ControllerBase
    {
        private readonly IAdminService _adminService;

        public AdminController(IAdminService adminService)
        {
            _adminService = adminService;
        }

        // ---------- UC012 ----------

        [HttpGet("subjects")]
        public async Task<IActionResult> GetSubjects() =>
            RequireAdmin(out var error) ? Ok(await _adminService.GetSubjectsAsync()) : error;

        [HttpPost("subjects")]
        public async Task<IActionResult> CreateSubject([FromBody] SubjectWriteDto request) =>
            RequireAdmin(out var error) ? Result(await _adminService.CreateSubjectAsync(request)) : error;

        [HttpPut("subjects/{id:int}")]
        public async Task<IActionResult> UpdateSubject(int id, [FromBody] SubjectWriteDto request) =>
            RequireAdmin(out var error) ? Result(await _adminService.UpdateSubjectAsync(id, request)) : error;

        [HttpDelete("subjects/{id:int}")]
        public async Task<IActionResult> DeleteSubject(int id) =>
            RequireAdmin(out var error) ? Result(await _adminService.DeleteSubjectAsync(id)) : error;

        [HttpPost("subjects/{id:int}/majors")]
        public async Task<IActionResult> LinkMajor(int id, [FromBody] MajorLinkDto request) =>
            RequireAdmin(out var error) ? Result(await _adminService.LinkMajorAsync(id, request)) : error;

        [HttpDelete("subjects/{id:int}/majors/{majorId:int}")]
        public async Task<IActionResult> UnlinkMajor(int id, int majorId) =>
            RequireAdmin(out var error) ? Result(await _adminService.UnlinkMajorAsync(id, majorId)) : error;

        [HttpPost("subjects/{id:int}/prerequisites")]
        public async Task<IActionResult> AddPrerequisite(int id, [FromBody] PrerequisiteDto request) =>
            RequireAdmin(out var error) ? Result(await _adminService.AddPrerequisiteAsync(id, request)) : error;

        [HttpDelete("subjects/{id:int}/prerequisites/{dependencyId:int}")]
        public async Task<IActionResult> RemovePrerequisite(int id, int dependencyId) =>
            RequireAdmin(out var error) ? Result(await _adminService.RemovePrerequisiteAsync(id, dependencyId)) : error;

        // ---------- UC013 ----------

        [HttpGet("semesters")]
        public async Task<IActionResult> GetSemesters() =>
            RequireAdmin(out var error) ? Ok(await _adminService.GetSemestersAsync()) : error;

        [HttpPost("semesters")]
        public async Task<IActionResult> CreateSemester([FromBody] SemesterWriteDto request) =>
            RequireAdmin(out var error) ? Result(await _adminService.CreateSemesterAsync(request)) : error;

        // ---------- UC014 ----------

        [HttpGet("schedule/{semesterId:int}")]
        public async Task<IActionResult> GetSchedule(int semesterId)
        {
            if (!RequireAdmin(out var error)) return error;

            var schedule = await _adminService.GetScheduleAsync(semesterId);
            return schedule is null
                ? NotFound(new AdminResultDto { Ok = false, Message = "Semester not found." })
                : Ok(schedule);
        }

        [HttpPost("schedule")]
        public async Task<IActionResult> Assign([FromBody] ScheduleWriteDto request) =>
            RequireAdmin(out var error) ? Result(await _adminService.AssignAsync(request)) : error;

        [HttpDelete("schedule")]
        public async Task<IActionResult> Unassign([FromBody] ScheduleWriteDto request) =>
            RequireAdmin(out var error) ? Result(await _adminService.UnassignAsync(request)) : error;

        // ---------- shared ----------

        [HttpGet("majors")]
        public async Task<IActionResult> GetMajors() =>
            RequireAdmin(out var error) ? Ok(await _adminService.GetMajorsAsync()) : error;

        private IActionResult Result(AdminResultDto result) =>
            result.Ok ? Ok(result) : BadRequest(result);

        /// <summary>
        /// The role comes from the validated token, so it cannot be set by the caller.
        /// </summary>
        private bool RequireAdmin(out IActionResult error)
        {
            var role = User.FindFirst(ClaimTypes.Role)?.Value ?? User.FindFirst("role")?.Value;
            if (!string.Equals(role, nameof(Models.UserRole.Admin), StringComparison.OrdinalIgnoreCase))
            {
                error = StatusCode(403, new AdminResultDto
                {
                    Ok = false,
                    Message = "This endpoint is for administrators."
                });
                return false;
            }

            error = Ok();
            return true;
        }
    }
}
