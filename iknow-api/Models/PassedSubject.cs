namespace iknow_api.Models
{
    public enum Grade
    {
        Six = 6,
        Seven = 7,
        Eight = 8,
        Nine = 9,
        Ten = 10
    }

    public class PassedSubject
    {
        public int Id { get; set; }
        public int SemesterSubjectId { get; set; }
        public SemesterSubject? SemesterSubject { get; set; }
        public Grade Grade { get; set; }
        public DateTime DatePassed { get; set; }
    }
}
