using System.Security.Claims;
using iknow_api.DTOs;
using iknow_api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace iknow_api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ProfController : ControllerBase
    {
        private readonly IProfService _profService;

        public ProfController(IProfService profService)
        {
            _profService = profService;
        }

        /// <summary>
        /// The subjects this professor teaches, each with the students enrolled
        /// in it and their grade so far.
        /// </summary>
        [HttpGet("students")]
        public async Task<IActionResult> GetStudents()
        {
            if (!TryGetProfessorId(out var professorId, out var error))
            {
                return error;
            }

            return Ok(await _profService.GetStudentsBySubjectAsync(professorId));
        }

        [HttpPost("grade/add")]
        public Task<IActionResult> AddGrade([FromBody] GradeRequestDto request) =>
            SetGrade(request, GradeAction.Add);

        [HttpPost("grade/edit")]
        public Task<IActionResult> EditGrade([FromBody] GradeRequestDto request) =>
            SetGrade(request, GradeAction.Edit);

        [HttpPost("grade/remove")]
        public Task<IActionResult> RemoveGrade([FromBody] GradeRequestDto request) =>
            SetGrade(request, GradeAction.Remove);

        private async Task<IActionResult> SetGrade(GradeRequestDto request, GradeAction action)
        {
            if (!TryGetProfessorId(out var professorId, out var error))
            {
                return error;
            }

            var result = await _profService.SetGradeAsync(professorId, request, action);
            return result.Ok ? Ok(result) : BadRequest(result);
        }

        /// <summary>
        /// Reads the caller from the validated token and requires the professor
        /// role, so one professor can never act on another one's subjects.
        /// </summary>
        private bool TryGetProfessorId(out int professorId, out IActionResult error)
        {
            professorId = 0;
            error = Forbid();

            var role = User.FindFirst(ClaimTypes.Role)?.Value ?? User.FindFirst("role")?.Value;
            if (!string.Equals(role, nameof(Models.UserRole.Professor), StringComparison.OrdinalIgnoreCase))
            {
                error = StatusCode(403, new GradeResultDto
                {
                    Ok = false,
                    Message = "This endpoint is for professors."
                });
                return false;
            }

            var idClaim = User.FindFirst("id")?.Value;
            if (!int.TryParse(idClaim, out professorId))
            {
                error = Unauthorized(new GradeResultDto
                {
                    Ok = false,
                    Message = "Token has no usable user id."
                });
                return false;
            }

            return true;
        }
    }
}
