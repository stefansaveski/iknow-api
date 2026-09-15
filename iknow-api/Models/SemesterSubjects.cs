namespace iknow_api.Models
{
    // The student is reached through EnrolledSemester.UserId; the ER model
    // links SemestersSubjects to Users only through the professor.
    public class SemesterSubject
    {
        public int Id { get; set; }

        public int EnrolledSemesterId { get; set; }
        public int SubjectId { get; set; }
        public int ProfessorId { get; set; }
        public bool Signature { get; set; }

        public EnrolledSemesters? EnrolledSemester { get; set; }
        public Subject? Subject { get; set; }
        public User? Professor { get; set; }
        public PassedSubject? PassedSubject { get; set; }
    }
}
