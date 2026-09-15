using iknow_api.DTOs;

namespace iknow_api.Services
{
    public interface IAdminService
    {
        // UC012 - subjects
        Task<List<AdminSubjectDto>> GetSubjectsAsync();
        Task<AdminResultDto> CreateSubjectAsync(SubjectWriteDto request);
        Task<AdminResultDto> UpdateSubjectAsync(int subjectId, SubjectWriteDto request);
        Task<AdminResultDto> DeleteSubjectAsync(int subjectId);
        Task<AdminResultDto> LinkMajorAsync(int subjectId, MajorLinkDto request);
        Task<AdminResultDto> UnlinkMajorAsync(int subjectId, int majorId);
        Task<AdminResultDto> AddPrerequisiteAsync(int subjectId, PrerequisiteDto request);
        Task<AdminResultDto> RemovePrerequisiteAsync(int subjectId, int dependencyId);

        // UC013 - active semesters
        Task<List<AdminSemesterDto>> GetSemestersAsync();
        Task<AdminResultDto> CreateSemesterAsync(SemesterWriteDto request);

        // UC014 - professor assignments
        Task<ScheduleDto?> GetScheduleAsync(int semesterId);
        Task<AdminResultDto> AssignAsync(ScheduleWriteDto request);
        Task<AdminResultDto> UnassignAsync(ScheduleWriteDto request);

        Task<List<SubjectRefDto>> GetMajorsAsync();
    }
}
