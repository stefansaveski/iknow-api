using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;
using iknow_api.Models;
using iknow_api.Data;
using Microsoft.EntityFrameworkCore;
using iknow_api.DTOs;

namespace iknow_api.Repositories
{
    public class ProfRepository : IProfRepository
    {
        private readonly AppDbContext _context;

        public ProfRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task AddGrade(AddGrade grade)
        {
            var semesterSubject = await _context.SemesterSubjects
                .Include(ss => ss.PassedSubject)
                .FirstOrDefaultAsync(ss => ss.UserId == grade.StudentId && ss.SubjectId == grade.SubjectId);

            if (semesterSubject == null)
                throw new KeyNotFoundException("Student enrollment for the subject was not found.");

            if (semesterSubject.PassedSubject != null)
            {
                semesterSubject.PassedSubject.Grade = (Grade)grade.grade;
                semesterSubject.PassedSubject.DatePassed = DateTime.UtcNow;
                _context.PassedSubjects.Update(semesterSubject.PassedSubject);
            }
            else
            {
                var passed = new PassedSubject
                {
                    SemesterSubjectId = semesterSubject.Id,
                    Grade = (Grade)grade.grade,
                    DatePassed = DateTime.UtcNow
                };
                await _context.PassedSubjects.AddAsync(passed);
            }

            await _context.SaveChangesAsync();
        }

        public async Task ChangeGrade(int id, int gradeId)
        {
            var passed = await _context.PassedSubjects.FindAsync(id);
            if (passed == null)
                throw new KeyNotFoundException("Grade not found.");

            passed.Grade = (Grade)gradeId;
            passed.DatePassed = DateTime.UtcNow;
            _context.PassedSubjects.Update(passed);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteGrade(int id)
        {
            var passed = await _context.PassedSubjects.FindAsync(id);
            if (passed == null)
                throw new KeyNotFoundException("Grade not found.");

            _context.PassedSubjects.Remove(passed);
            await _context.SaveChangesAsync();
        }

        public async Task<List<SubjectsAndUsers>> GetSubjectsAndUsers(int profId)
        {
            var query = await _context.SemesterSubjects
                .AsNoTracking()
                .Where(ss => ss.ProfessorId == profId)
                .Include(ss => ss.Subject)
                .Include(ss => ss.User)
                .ToListAsync();

            var grouped = query
                .GroupBy(ss => new { ss.SubjectId, SubjectName = ss.Subject != null ? ss.Subject.Name : string.Empty })
                .Select(g => new SubjectsAndUsers
                {
                    SubjectId = g.Key.SubjectId,
                    SubjectName = g.Key.SubjectName,
                    Users = g
                        .Where(x => x.User != null)
                        .Select(x => new UsersBySubject
                        {
                            UserId = x.User!.Id
                            // ...add more mappings here if needed by the DTO...
                        })
                        .GroupBy(u => u.UserId)
                        .Select(ug => ug.First())
                        .ToList()
                })
                .ToList();

            return grouped;
        }
    }
}