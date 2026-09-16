using iknow_api.Data;
using iknow_api.DTOs;
using iknow_api.Models;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace iknow_api.Services
{
    public class EnrollmentService : IEnrollmentService
    {
        /// <summary>An enrolment is exactly this many subjects.</summary>
        public const int RequiredSubjects = 5;

        private readonly AppDbContext _context;

        public EnrollmentService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<EnrollmentOptionsDto> GetOptionsAsync(int studentId)
        {
            var enrolments = await _context.EnrolledSemesters
                .AsNoTracking()
                .Include(es => es.Semester)
                .Where(es => es.UserId == studentId)
                .ToListAsync();

            var takenSemesterIds = enrolments.Select(es => es.SemesterId).ToHashSet();

            var available = await _context.ActiveSemesters
                .AsNoTracking()
                .Where(a => !takenSemesterIds.Contains(a.Id))
                .ToListAsync();

            // Semesters are labelled Year/Year+1, so within a year winter comes first.
            var semesters = available
                .OrderBy(a => a.Year)
                .ThenBy(a => a.Type == sType.summer)
                .Select(a => new SemesterOptionDto
                {
                    Id = a.Id,
                    Year = a.Year,
                    Type = a.Type.ToString(),
                    Name = $"{(a.Type == sType.winter ? "Зимски" : "Летен")}({a.Year}/{a.Year + 1})"
                })
                .ToList();

            var passedSubjectIds = await _context.PassedSubjects
                .AsNoTracking()
                .Where(ps => ps.SemesterSubject!.EnrolledSemester!.UserId == studentId)
                .Select(ps => ps.SemesterSubject!.SubjectId)
                .ToListAsync();
            var passed = passedSubjectIds.ToHashSet();

            var majorRows = await _context.MajorSubjects
                .AsNoTracking()
                .Include(ms => ms.Majors)
                .Include(ms => ms.Subjects)
                .ToListAsync();

            var majors = majorRows
                .Where(ms => ms.Majors != null && ms.Subjects != null)
                .GroupBy(ms => ms.Majors!.Id)
                .Select(g => new MajorOptionDto
                {
                    Id = g.Key,
                    Name = g.First().Majors!.Name,
                    Subjects = g
                        .Select(ms => new SubjectOptionDto
                        {
                            Id = ms.Subjects!.Id,
                            Name = ms.Subjects.Name,
                            Code = ms.Subjects.Code,
                            Credits = ms.Subjects.AwardedCredits ?? 0,
                            MandatorySemester = ms.MandatorySemester,
                            AlreadyPassed = passed.Contains(ms.Subjects.Id)
                        })
                        .OrderBy(x => x.MandatorySemester)
                        .ThenBy(x => x.Name)
                        .ToList()
                })
                .OrderBy(m => m.Name)
                .ToList();

            var latest = enrolments
                .Where(es => es.Semester != null)
                .OrderByDescending(es => es.Semester!.Year)
                .ThenByDescending(es => es.Semester!.Type == sType.summer)
                .FirstOrDefault();

            return new EnrollmentOptionsDto
            {
                RequiredSubjects = RequiredSubjects,
                Semesters = semesters,
                Majors = majors,
                DefaultMajorId = latest?.MajorId
            };
        }

        public async Task<EnrollSemesterResultDto> EnrollAsync(
            int studentId, EnrollSemesterRequestDto request)
        {
            var subjectIds = request.SubjectIds?.Distinct().ToList() ?? new List<int>();

            if (subjectIds.Count != RequiredSubjects)
            {
                return Fail($"Pick exactly {RequiredSubjects} different subjects; got {subjectIds.Count}.");
            }

            if (!await _context.ActiveSemesters.AnyAsync(a => a.Id == request.SemesterId))
            {
                return Fail("That semester does not exist.");
            }

            // enrolled_semesters has UNIQUE (user_id, semester_id); check first so
            // the student gets a sentence rather than a constraint violation.
            if (await _context.EnrolledSemesters.AnyAsync(
                    es => es.UserId == studentId && es.SemesterId == request.SemesterId))
            {
                return Fail("You are already enrolled in that semester.");
            }

            if (!await _context.Majors.AnyAsync(m => m.Id == request.MajorId))
            {
                return Fail("That study programme does not exist.");
            }

            var offered = await _context.MajorSubjects
                .Where(ms => ms.MajorId == request.MajorId)
                .Select(ms => ms.SubjectId)
                .ToListAsync();

            var notOffered = subjectIds.Except(offered).ToList();
            if (notOffered.Count > 0)
            {
                return Fail($"Subject(s) {string.Join(", ", notOffered)} are not offered by that study programme.");
            }

            // semesters_subjects.professor_id is NOT NULL, so every chosen subject
            // needs somebody teaching it that semester.
            var teachers = await _context.ProfessorSubjects
                .Where(ps => ps.SemesterId == request.SemesterId && subjectIds.Contains(ps.SubjectId))
                .ToListAsync();

            // A subject can be taught by more than one professor in the same
            // semester. Spread students over them instead of always taking the
            // lowest id, which would leave the other professor with nobody.
            var currentLoad = await _context.SemesterSubjects
                .Where(ss => subjectIds.Contains(ss.SubjectId)
                          && ss.EnrolledSemester!.SemesterId == request.SemesterId)
                .GroupBy(ss => new { ss.SubjectId, ss.ProfessorId })
                .Select(g => new { g.Key.SubjectId, g.Key.ProfessorId, Count = g.Count() })
                .ToListAsync();

            var loadLookup = currentLoad.ToDictionary(
                x => (x.SubjectId, x.ProfessorId), x => x.Count);

            var professorBySubject = teachers
                .GroupBy(ps => ps.SubjectId)
                .ToDictionary(
                    g => g.Key,
                    // Fewest students first; professor id only breaks ties, so
                    // the choice stays deterministic and testable.
                    g => g.OrderBy(ps => loadLookup.TryGetValue((ps.SubjectId, ps.ProfessorId), out var n) ? n : 0)
                          .ThenBy(ps => ps.ProfessorId)
                          .First().ProfessorId);

            var untaught = subjectIds.Where(id => !professorBySubject.ContainsKey(id)).ToList();
            if (untaught.Count > 0)
            {
                return Fail($"Subject(s) {string.Join(", ", untaught)} are not taught in that semester.");
            }

            var student = await _context.User.FirstOrDefaultAsync(u => u.Id == studentId);
            if (student is null)
            {
                return Fail("Student not found.");
            }

            var now = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified);

            await using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var enrolment = new EnrolledSemesters
                {
                    UserId = studentId,
                    SemesterId = request.SemesterId,
                    MajorId = request.MajorId,
                    // enrolled_semesters.quota is NOT NULL; fall back to the
                    // state quota when the student record has none.
                    QuotaType = student.Quota ?? Models.Quota.drzavna,
                    CratedAt = now,
                    LastChange = now,
                    Verified = null
                };

                _context.EnrolledSemesters.Add(enrolment);
                await _context.SaveChangesAsync();

                foreach (var subjectId in subjectIds)
                {
                    _context.SemesterSubjects.Add(new SemesterSubject
                    {
                        EnrolledSemesterId = enrolment.Id,
                        SubjectId = subjectId,
                        ProfessorId = professorBySubject[subjectId],
                        Signature = false
                    });
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return new EnrollSemesterResultDto
                {
                    Ok = true,
                    Message = $"Enrolled with {subjectIds.Count} subjects.",
                    EnrolledSemesterId = enrolment.Id
                };
            }
            catch (DbUpdateException ex) when (IsUniqueViolation(ex))
            {
                // Two enrolments for the same semester sent at the same time both
                // pass the check above, because each transaction reads the state
                // from before the other one wrote. UNIQUE (user_id, semester_id)
                // is what actually settles it, so the loser gets the same
                // sentence as if the check had caught it.
                await transaction.RollbackAsync();
                return Fail("You are already enrolled in that semester.");
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        /// <summary>23505 is unique_violation.</summary>
        private static bool IsUniqueViolation(DbUpdateException ex) =>
            ex.InnerException is PostgresException { SqlState: "23505" };

        private static EnrollSemesterResultDto Fail(string message) =>
            new() { Ok = false, Message = message };
    }
}
