using iknow_api.Data;
using iknow_api.Models;
using Microsoft.EntityFrameworkCore;

namespace iknow_api.Repositories
{
    public class ProfRepository : IProfRepository
    {
        private readonly AppDbContext _context;

        public ProfRepository(AppDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// A professor teaches a subject for a given enrolment, so the students
        /// are reached through semesters_subjects.professor_id and the student
        /// through the enrolment - matching the ER model, which does not link
        /// SemestersSubjects to a student directly.
        /// </summary>
        private IQueryable<SemesterSubject> TaughtBy(int professorId) =>
            _context.SemesterSubjects
                .Where(ss => ss.ProfessorId == professorId)
                .Include(ss => ss.Subject)
                .Include(ss => ss.PassedSubject)
                .Include(ss => ss.EnrolledSemester!)
                    .ThenInclude(es => es.User)
                .Include(ss => ss.EnrolledSemester!)
                    .ThenInclude(es => es.Semester);

        public async Task<List<SemesterSubject>> GetTaughtSemesterSubjectsAsync(int professorId) =>
            await TaughtBy(professorId)
                .AsNoTracking()
                .AsSplitQuery()
                .ToListAsync();

        public async Task<SemesterSubject?> FindTaughtSemesterSubjectAsync(
            int professorId, int studentId, int subjectId)
        {
            var candidates = await TaughtBy(professorId)
                .Where(ss => ss.SubjectId == subjectId
                          && ss.EnrolledSemester!.UserId == studentId)
                .AsSplitQuery()
                .ToListAsync();

            // Most recent enrolment first. Semesters are labelled Year/Year+1
            // throughout the app, so within one year summer follows winter.
            return candidates
                .OrderByDescending(ss => ss.EnrolledSemester!.Semester!.Year)
                .ThenByDescending(ss => ss.EnrolledSemester!.Semester!.Type == sType.summer)
                .FirstOrDefault();
        }

        public async Task<PassedSubject?> GetPassedSubjectAsync(int semesterSubjectId) =>
            await _context.PassedSubjects
                .FirstOrDefaultAsync(ps => ps.SemesterSubjectId == semesterSubjectId);

        public async Task AddPassedSubjectAsync(PassedSubject passed)
        {
            _context.PassedSubjects.Add(passed);
            await _context.SaveChangesAsync();
        }

        public async Task UpdatePassedSubjectAsync(PassedSubject passed)
        {
            _context.PassedSubjects.Update(passed);
            await _context.SaveChangesAsync();
        }

        public async Task RemovePassedSubjectAsync(PassedSubject passed)
        {
            _context.PassedSubjects.Remove(passed);
            await _context.SaveChangesAsync();
        }
    }
}
