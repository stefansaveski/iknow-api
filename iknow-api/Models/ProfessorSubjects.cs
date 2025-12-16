
namespace iknow_api.Models
{
    public class ProfessorSubjects
    {
        public int ProfessorId { get; set; }
        public User? Professor { get; set; }
        public int SemesterId { get; set; }
        public ActiveSemesters? Semester { get; set; }
        public int SubjectId { get; set; }
        public Subject? Subject { get; set; }
    }
}

