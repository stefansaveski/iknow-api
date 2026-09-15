using iknow_api.Models;

namespace iknow_api.Repositories
{
    public interface IProfRepository
    {
        /// <summary>
        /// Every semester-subject row taught by this professor, with the
        /// enrolment, student, subject, semester and grade loaded.
        /// </summary>
        Task<List<SemesterSubject>> GetTaughtSemesterSubjectsAsync(int professorId);

        /// <summary>
        /// The semester-subject row this professor teaches for one student and
        /// subject. When a student has taken the subject more than once, the
        /// most recent enrolment wins. Null when the professor does not teach
        /// that student in that subject.
        /// </summary>
        Task<SemesterSubject?> FindTaughtSemesterSubjectAsync(int professorId, int studentId, int subjectId);

        Task<PassedSubject?> GetPassedSubjectAsync(int semesterSubjectId);
        Task AddPassedSubjectAsync(PassedSubject passed);
        Task UpdatePassedSubjectAsync(PassedSubject passed);
        Task RemovePassedSubjectAsync(PassedSubject passed);
    }
}
