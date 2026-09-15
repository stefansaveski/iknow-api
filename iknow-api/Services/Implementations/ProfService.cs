using iknow_api.DTOs;
using iknow_api.Models;
using iknow_api.Repositories;

namespace iknow_api.Services
{
    public class ProfService : IProfService
    {
        private readonly IProfRepository _profRepository;

        public ProfService(IProfRepository profRepository)
        {
            _profRepository = profRepository;
        }

        public async Task<List<SubjectStudentsDto>> GetStudentsBySubjectAsync(int professorId)
        {
            var taught = await _profRepository.GetTaughtSemesterSubjectsAsync(professorId);

            return taught
                .Where(ss => ss.Subject != null && ss.EnrolledSemester?.User != null)
                .GroupBy(ss => ss.Subject!.Id)
                .Select(group =>
                {
                    var subject = group.First().Subject!;
                    return new SubjectStudentsDto
                    {
                        Id = subject.Id,
                        Name = subject.Name,
                        Code = subject.Code,
                        Users = group
                            .Select(ss =>
                            {
                                var student = ss.EnrolledSemester!.User!;
                                var semester = ss.EnrolledSemester.Semester;
                                return new EnrolledStudentDto
                                {
                                    Id = student.Id,
                                    Name = $"{student.Name} {student.Surname}".Trim(),
                                    Index = student.Index,
                                    // 0 means "not graded yet"; the enum starts at 6.
                                    Grade = ss.PassedSubject is null ? 0 : (int)ss.PassedSubject.Grade,
                                    Semester = semester is null
                                        ? null
                                        : $"{(semester.Type == sType.winter ? "Зимски" : "Летен")}({semester.Year}/{semester.Year + 1})"
                                };
                            })
                            .OrderBy(u => u.Name)
                            .ToList()
                    };
                })
                .OrderBy(s => s.Name)
                .ToList();
        }

        public async Task<GradeResultDto> SetGradeAsync(
            int professorId, GradeRequestDto request, GradeAction action)
        {
            // grade_type only declares 6..10, so anything else cannot be stored.
            if (action != GradeAction.Remove && !Enum.IsDefined(typeof(Grade), request.Grade))
            {
                return Fail($"Grade must be between 6 and 10; got {request.Grade}.");
            }

            // This also enforces authorisation: the lookup is scoped to the
            // subjects this professor actually teaches.
            var semesterSubject = await _profRepository.FindTaughtSemesterSubjectAsync(
                professorId, request.StudentId, request.SubjectId);

            if (semesterSubject is null)
            {
                return Fail("You do not teach this student in this subject.");
            }

            var existing = await _profRepository.GetPassedSubjectAsync(semesterSubject.Id);

            switch (action)
            {
                case GradeAction.Add:
                    if (existing is not null)
                    {
                        return Fail("This subject is already graded. Use edit to change the grade.");
                    }
                    await _profRepository.AddPassedSubjectAsync(new PassedSubject
                    {
                        SemesterSubjectId = semesterSubject.Id,
                        Grade = (Grade)request.Grade,
                        // date_passed is `timestamp without time zone`.
                        DatePassed = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified)
                    });
                    return Ok($"Grade {request.Grade} added.");

                case GradeAction.Edit:
                    if (existing is null)
                    {
                        return Fail("This subject has no grade yet. Use add first.");
                    }
                    existing.Grade = (Grade)request.Grade;
                    existing.DatePassed = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified);
                    await _profRepository.UpdatePassedSubjectAsync(existing);
                    return Ok($"Grade changed to {request.Grade}.");

                case GradeAction.Remove:
                    if (existing is null)
                    {
                        return Fail("This subject has no grade to remove.");
                    }
                    await _profRepository.RemovePassedSubjectAsync(existing);
                    return Ok("Grade removed.");

                default:
                    return Fail("Unknown action.");
            }
        }

        private static GradeResultDto Ok(string message) =>
            new() { Ok = true, Message = message };

        private static GradeResultDto Fail(string message) =>
            new() { Ok = false, Message = message };
    }
}
