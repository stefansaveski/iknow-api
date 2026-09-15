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
    public class EnrollmentController : ControllerBase
    {
        private readonly IEnrollmentService _enrollmentService;

        public EnrollmentController(IEnrollmentService enrollmentService)
        {
            _enrollmentService = enrollmentService;
        }

        [HttpGet("options")]
        public async Task<IActionResult> GetOptions()
        {
            if (!TryGetStudentId(out var studentId, out var error))
            {
                return error;
            }

            return Ok(await _enrollmentService.GetOptionsAsync(studentId));
        }

        [HttpPost]
        public async Task<IActionResult> Enroll([FromBody] EnrollSemesterRequestDto request)
        {
            if (!TryGetStudentId(out var studentId, out var error))
            {
                return error;
            }

            var result = await _enrollmentService.EnrollAsync(studentId, request);
            return result.Ok ? Ok(result) : BadRequest(result);
        }

        /// <summary>
        /// Reads the caller from the validated token, so a student can only ever
        /// enrol themselves.
        /// </summary>
        private bool TryGetStudentId(out int studentId, out IActionResult error)
        {
            studentId = 0;
            error = Forbid();

            var role = User.FindFirst(ClaimTypes.Role)?.Value ?? User.FindFirst("role")?.Value;
            if (!string.Equals(role, nameof(Models.UserRole.Student), StringComparison.OrdinalIgnoreCase))
            {
                error = StatusCode(403, new EnrollSemesterResultDto
                {
                    Ok = false,
                    Message = "Only students can enrol in a semester."
                });
                return false;
            }

            var idClaim = User.FindFirst("id")?.Value;
            if (!int.TryParse(idClaim, out studentId))
            {
                error = Unauthorized(new EnrollSemesterResultDto
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
