using iknow_api.DTOs;

namespace iknow_api.Services
{
    public enum GradeAction
    {
        Add,
        Edit,
        Remove
    }

    public interface IProfService
    {
        Task<List<SubjectStudentsDto>> GetStudentsBySubjectAsync(int professorId);

        Task<GradeResultDto> SetGradeAsync(int professorId, GradeRequestDto request, GradeAction action);
    }
}
