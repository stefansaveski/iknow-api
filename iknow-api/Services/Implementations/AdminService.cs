using iknow_api.Data;
using iknow_api.DTOs;
using iknow_api.Models;
using Microsoft.EntityFrameworkCore;

namespace iknow_api.Services
{
    /// <summary>
    /// Backs UC012 (subjects), UC013 (active semesters) and UC014 (professor
    /// assignments). Every method reports constraint problems as a sentence
    /// rather than letting a database exception reach the controller.
    /// </summary>
    public class AdminService : IAdminService
    {
        private readonly AppDbContext _context;

        public AdminService(AppDbContext context)
        {
            _context = context;
        }

        private static string SemesterName(ActiveSemesters s) =>
            $"{(s.Type == sType.winter ? "Зимски" : "Летен")}({s.Year}/{s.Year + 1})";

        // ============================================================
        //  UC012 - subjects
        // ============================================================

        public async Task<List<AdminSubjectDto>> GetSubjectsAsync()
        {
            var subjects = await _context.Subjects.AsNoTracking().ToListAsync();

            var majorLinks = await _context.MajorSubjects.AsNoTracking()
                .Include(ms => ms.Majors).ToListAsync();

            var prerequisites = await _context.DependencySubjects.AsNoTracking().ToListAsync();

            // A subject that students already took cannot be deleted.
            var enrolledCounts = await _context.SemesterSubjects.AsNoTracking()
                .GroupBy(ss => ss.SubjectId)
                .Select(g => new { SubjectId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.SubjectId, x => x.Count);

            var byId = subjects.ToDictionary(s => s.Id);

            return subjects
                .OrderBy(s => s.Code)
                .Select(s => new AdminSubjectDto
                {
                    Id = s.Id,
                    Name = s.Name,
                    Code = s.Code,
                    AwardedCredits = s.AwardedCredits ?? 0,
                    DependencyCredit = s.DependencyCredit,
                    EnrolledCount = enrolledCounts.TryGetValue(s.Id, out var c) ? c : 0,
                    Majors = majorLinks
                        .Where(ms => ms.SubjectId == s.Id)
                        .Select(ms => new SubjectMajorDto
                        {
                            MajorId = ms.MajorId,
                            MajorName = ms.Majors?.Name,
                            MandatorySemester = ms.MandatorySemester
                        })
                        .OrderBy(m => m.MajorName)
                        .ToList(),
                    Prerequisites = prerequisites
                        .Where(d => d.SubjectId == s.Id && byId.ContainsKey(d.DependencyId))
                        .Select(d => new SubjectRefDto
                        {
                            Id = d.DependencyId,
                            Name = byId[d.DependencyId].Name,
                            Code = byId[d.DependencyId].Code
                        })
                        .OrderBy(p => p.Code)
                        .ToList()
                })
                .ToList();
        }

        public async Task<AdminResultDto> CreateSubjectAsync(SubjectWriteDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Code))
            {
                return Fail("Name and code are required.");
            }
            if (request.AwardedCredits <= 0)
            {
                return Fail("Awarded credits must be greater than zero.");
            }
            // subjects.name and subjects.code are both UNIQUE.
            if (await _context.Subjects.AnyAsync(s => s.Name == request.Name))
            {
                return Fail($"A subject named '{request.Name}' already exists.");
            }
            if (await _context.Subjects.AnyAsync(s => s.Code == request.Code))
            {
                return Fail($"Subject code '{request.Code}' is already taken.");
            }

            var subject = new Subject
            {
                Name = request.Name,
                Code = request.Code,
                AwardedCredits = request.AwardedCredits,
                DependencyCredit = request.DependencyCredit
            };
            _context.Subjects.Add(subject);
            await _context.SaveChangesAsync();

            return Ok($"Subject '{subject.Name}' created.", subject.Id);
        }

        public async Task<AdminResultDto> UpdateSubjectAsync(int subjectId, SubjectWriteDto request)
        {
            var subject = await _context.Subjects.FirstOrDefaultAsync(s => s.Id == subjectId);
            if (subject is null) return Fail("Subject not found.");

            if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Code))
            {
                return Fail("Name and code are required.");
            }
            if (request.AwardedCredits <= 0)
            {
                return Fail("Awarded credits must be greater than zero.");
            }
            if (await _context.Subjects.AnyAsync(s => s.Name == request.Name && s.Id != subjectId))
            {
                return Fail($"Another subject is already named '{request.Name}'.");
            }
            if (await _context.Subjects.AnyAsync(s => s.Code == request.Code && s.Id != subjectId))
            {
                return Fail($"Subject code '{request.Code}' is already taken.");
            }

            subject.Name = request.Name;
            subject.Code = request.Code;
            subject.AwardedCredits = request.AwardedCredits;
            subject.DependencyCredit = request.DependencyCredit;
            await _context.SaveChangesAsync();

            return Ok($"Subject '{subject.Name}' updated.", subject.Id);
        }

        public async Task<AdminResultDto> DeleteSubjectAsync(int subjectId)
        {
            var subject = await _context.Subjects.FirstOrDefaultAsync(s => s.Id == subjectId);
            if (subject is null) return Fail("Subject not found.");

            // semesters_subjects references subjects, so a taken subject cannot go.
            var taken = await _context.SemesterSubjects.CountAsync(ss => ss.SubjectId == subjectId);
            if (taken > 0)
            {
                return Fail($"Cannot delete: {taken} enrolment(s) already contain this subject.");
            }

            await using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // The mapping rows must go first; their foreign keys would block the delete.
                var prereqs = await _context.DependencySubjects
                    .Where(d => d.SubjectId == subjectId || d.DependencyId == subjectId)
                    .ToListAsync();
                _context.DependencySubjects.RemoveRange(prereqs);

                var majors = await _context.MajorSubjects
                    .Where(ms => ms.SubjectId == subjectId).ToListAsync();
                _context.MajorSubjects.RemoveRange(majors);

                var teaching = await _context.ProfessorSubjects
                    .Where(ps => ps.SubjectId == subjectId).ToListAsync();
                _context.ProfessorSubjects.RemoveRange(teaching);

                _context.Subjects.Remove(subject);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok($"Subject '{subject.Name}' deleted.");
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<AdminResultDto> LinkMajorAsync(int subjectId, MajorLinkDto request)
        {
            if (!await _context.Subjects.AnyAsync(s => s.Id == subjectId))
                return Fail("Subject not found.");
            if (!await _context.Majors.AnyAsync(m => m.Id == request.MajorId))
                return Fail("Study programme not found.");
            if (request.MandatorySemester < 1)
                return Fail("Semester must be 1 or greater.");

            var existing = await _context.MajorSubjects
                .FirstOrDefaultAsync(ms => ms.SubjectId == subjectId && ms.MajorId == request.MajorId);

            if (existing is not null)
            {
                existing.MandatorySemester = request.MandatorySemester;
                await _context.SaveChangesAsync();
                return Ok("Study programme mapping updated.");
            }

            _context.MajorSubjects.Add(new MajorSubjects
            {
                SubjectId = subjectId,
                MajorId = request.MajorId,
                MandatorySemester = request.MandatorySemester
            });
            await _context.SaveChangesAsync();
            return Ok("Subject added to the study programme.");
        }

        public async Task<AdminResultDto> UnlinkMajorAsync(int subjectId, int majorId)
        {
            var row = await _context.MajorSubjects
                .FirstOrDefaultAsync(ms => ms.SubjectId == subjectId && ms.MajorId == majorId);
            if (row is null) return Fail("That subject is not in that study programme.");

            _context.MajorSubjects.Remove(row);
            await _context.SaveChangesAsync();
            return Ok("Subject removed from the study programme.");
        }

        public async Task<AdminResultDto> AddPrerequisiteAsync(int subjectId, PrerequisiteDto request)
        {
            if (subjectId == request.DependencyId)
            {
                // Mirrors CHECK (subject_id <> dependency_id).
                return Fail("A subject cannot be its own prerequisite.");
            }
            if (!await _context.Subjects.AnyAsync(s => s.Id == subjectId))
                return Fail("Subject not found.");
            if (!await _context.Subjects.AnyAsync(s => s.Id == request.DependencyId))
                return Fail("Prerequisite subject not found.");
            if (await _context.DependencySubjects.AnyAsync(
                    d => d.SubjectId == subjectId && d.DependencyId == request.DependencyId))
                return Fail("That prerequisite is already set.");

            // Refuse a direct cycle: A requires B while B already requires A.
            if (await _context.DependencySubjects.AnyAsync(
                    d => d.SubjectId == request.DependencyId && d.DependencyId == subjectId))
                return Fail("That would create a circular prerequisite.");

            _context.DependencySubjects.Add(new DependencySubject
            {
                SubjectId = subjectId,
                DependencyId = request.DependencyId
            });
            await _context.SaveChangesAsync();
            return Ok("Prerequisite added.");
        }

        public async Task<AdminResultDto> RemovePrerequisiteAsync(int subjectId, int dependencyId)
        {
            var row = await _context.DependencySubjects
                .FirstOrDefaultAsync(d => d.SubjectId == subjectId && d.DependencyId == dependencyId);
            if (row is null) return Fail("That prerequisite is not set.");

            _context.DependencySubjects.Remove(row);
            await _context.SaveChangesAsync();
            return Ok("Prerequisite removed.");
        }

        // ============================================================
        //  UC013 - active semesters
        // ============================================================

        public async Task<List<AdminSemesterDto>> GetSemestersAsync()
        {
            var semesters = await _context.ActiveSemesters.AsNoTracking().ToListAsync();
            var subjects = await _context.Subjects.AsNoTracking().ToListAsync();
            var teaching = await _context.ProfessorSubjects.AsNoTracking().ToListAsync();

            var enrolments = await _context.EnrolledSemesters.AsNoTracking()
                .GroupBy(es => es.SemesterId)
                .Select(g => new { SemesterId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.SemesterId, x => x.Count);

            return semesters
                .OrderByDescending(s => s.Year)
                .ThenByDescending(s => s.Type == sType.summer)
                .Select(s =>
                {
                    var covered = teaching
                        .Where(t => t.SemesterId == s.Id)
                        .Select(t => t.SubjectId)
                        .ToHashSet();

                    return new AdminSemesterDto
                    {
                        Id = s.Id,
                        Year = s.Year,
                        Type = s.Type.ToString(),
                        Name = SemesterName(s),
                        EnrolmentCount = enrolments.TryGetValue(s.Id, out var c) ? c : 0,
                        UncoveredSubjects = subjects
                            .Where(sub => !covered.Contains(sub.Id))
                            .OrderBy(sub => sub.Code)
                            .Select(sub => new SubjectRefDto { Id = sub.Id, Name = sub.Name, Code = sub.Code })
                            .ToList()
                    };
                })
                .ToList();
        }

        public async Task<AdminResultDto> CreateSemesterAsync(SemesterWriteDto request)
        {
            if (!Enum.TryParse<sType>(request.Type, ignoreCase: true, out var type))
            {
                return Fail("Semester type must be 'winter' or 'summer'.");
            }
            if (request.Year < 2000 || request.Year > 2100)
            {
                return Fail("Year looks wrong; expected something between 2000 and 2100.");
            }
            // active_semesters has UNIQUE (year, type).
            if (await _context.ActiveSemesters.AnyAsync(a => a.Year == request.Year && a.Type == type))
            {
                return Fail("That semester is already open.");
            }

            var semester = new ActiveSemesters { Year = request.Year, Type = type };
            _context.ActiveSemesters.Add(semester);
            await _context.SaveChangesAsync();

            return Ok($"Semester {SemesterName(semester)} opened.", semester.Id);
        }

        // ============================================================
        //  UC014 - professor assignments
        // ============================================================

        public async Task<ScheduleDto?> GetScheduleAsync(int semesterId)
        {
            var semester = await _context.ActiveSemesters.AsNoTracking()
                .FirstOrDefaultAsync(a => a.Id == semesterId);
            if (semester is null) return null;

            var subjects = await _context.Subjects.AsNoTracking().ToListAsync();
            var professors = await _context.User.AsNoTracking()
                .Where(u => u.Role == Models.UserRole.Professor).ToListAsync();
            var assignments = await _context.ProfessorSubjects.AsNoTracking()
                .Where(ps => ps.SemesterId == semesterId).ToListAsync();

            var subjectById = subjects.ToDictionary(s => s.Id);
            var profById = professors.ToDictionary(p => p.Id);
            var covered = assignments.Select(a => a.SubjectId).ToHashSet();

            return new ScheduleDto
            {
                SemesterId = semester.Id,
                SemesterName = SemesterName(semester),
                Assignments = assignments
                    .Where(a => subjectById.ContainsKey(a.SubjectId) && profById.ContainsKey(a.ProfessorId))
                    .Select(a => new ScheduleRowDto
                    {
                        SubjectId = a.SubjectId,
                        SubjectName = subjectById[a.SubjectId].Name,
                        SubjectCode = subjectById[a.SubjectId].Code,
                        ProfessorId = a.ProfessorId,
                        ProfessorName = $"{profById[a.ProfessorId].Name} {profById[a.ProfessorId].Surname}".Trim()
                    })
                    .OrderBy(r => r.SubjectCode)
                    .ToList(),
                Load = professors
                    .Select(p => new ProfessorLoadDto
                    {
                        ProfessorId = p.Id,
                        ProfessorName = $"{p.Name} {p.Surname}".Trim(),
                        Subjects = assignments.Count(a => a.ProfessorId == p.Id)
                    })
                    .OrderByDescending(l => l.Subjects).ThenBy(l => l.ProfessorName)
                    .ToList(),
                UncoveredSubjects = subjects
                    .Where(s => !covered.Contains(s.Id))
                    .OrderBy(s => s.Code)
                    .Select(s => new SubjectRefDto { Id = s.Id, Name = s.Name, Code = s.Code })
                    .ToList(),
                AllSubjects = subjects
                    .OrderBy(s => s.Code)
                    .Select(s => new SubjectRefDto { Id = s.Id, Name = s.Name, Code = s.Code })
                    .ToList(),
                Professors = professors
                    .OrderBy(p => p.Surname)
                    .Select(p => new ProfessorRefDto { Id = p.Id, Name = $"{p.Name} {p.Surname}".Trim() })
                    .ToList()
            };
        }

        public async Task<AdminResultDto> AssignAsync(ScheduleWriteDto request)
        {
            var professor = await _context.User
                .FirstOrDefaultAsync(u => u.Id == request.ProfessorId);
            if (professor is null) return Fail("Professor not found.");
            if (professor.Role != Models.UserRole.Professor)
                return Fail("That user is not a professor.");
            if (!await _context.ActiveSemesters.AnyAsync(a => a.Id == request.SemesterId))
                return Fail("Semester not found.");
            if (!await _context.Subjects.AnyAsync(s => s.Id == request.SubjectId))
                return Fail("Subject not found.");

            var exists = await _context.ProfessorSubjects.AnyAsync(
                ps => ps.ProfessorId == request.ProfessorId
                   && ps.SemesterId == request.SemesterId
                   && ps.SubjectId == request.SubjectId);
            if (exists) return Ok("That assignment already exists.");

            _context.ProfessorSubjects.Add(new ProfessorSubjects
            {
                ProfessorId = request.ProfessorId,
                SemesterId = request.SemesterId,
                SubjectId = request.SubjectId
            });
            await _context.SaveChangesAsync();
            return Ok("Professor assigned to the subject.");
        }

        public async Task<AdminResultDto> UnassignAsync(ScheduleWriteDto request)
        {
            var row = await _context.ProfessorSubjects.FirstOrDefaultAsync(
                ps => ps.ProfessorId == request.ProfessorId
                   && ps.SemesterId == request.SemesterId
                   && ps.SubjectId == request.SubjectId);
            if (row is null) return Fail("That assignment does not exist.");

            _context.ProfessorSubjects.Remove(row);
            await _context.SaveChangesAsync();
            return Ok("Assignment removed.");
        }

        public async Task<List<SubjectRefDto>> GetMajorsAsync() =>
            await _context.Majors.AsNoTracking()
                .OrderBy(m => m.Name)
                .Select(m => new SubjectRefDto { Id = m.Id, Name = m.Name, Code = null })
                .ToListAsync();

        private static AdminResultDto Ok(string message, int? id = null) =>
            new() { Ok = true, Message = message, Id = id };

        private static AdminResultDto Fail(string message) =>
            new() { Ok = false, Message = message };
    }
}
