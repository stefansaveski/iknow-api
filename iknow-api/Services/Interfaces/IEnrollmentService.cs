using iknow_api.DTOs;

namespace iknow_api.Services
{
    public interface IEnrollmentService
    {
        /// <summary>The semesters, majors and subjects this student may enrol in.</summary>
        Task<EnrollmentOptionsDto> GetOptionsAsync(int studentId);

        /// <summary>
        /// Creates one enrolled_semesters row and its semesters_subjects rows,
        /// or returns why it could not.
        /// </summary>
        Task<EnrollSemesterResultDto> EnrollAsync(int studentId, EnrollSemesterRequestDto request);
    }
}
