namespace iknow_api.Models
{
    public class SemesterSubject
    {
        public int Id { get; set; } 
        
        public int UserId { get; set; }                 
        public int EnrolledSemesterId { get; set; }
        public int SubjectId { get; set; }
        public int ProfessorId { get; set; }
        
        public User? User { get; set; }                 
        public EnrolledSemesters? EnrolledSemester { get; set; }
        public Subject? Subject { get; set; }
        public User? Professor { get; set; }           
        public PassedSubject? PassedSubject { get; set; }
    }
}