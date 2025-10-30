

namespace iknow_api.Models
{
    public enum UserRole
    {
        Admin,
        Professor,
        Strudent
    }

    public class User
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public string? EMBG {get; set; }
        public string? Surname { get; set; }
        public string? Index { get; set; }
        public string? Email { get; set; }
        public string? PasswordHash { get; set; }
        public DateTime Bday { get; set; }
        public DateTime CreatedAt { get; set; }
        public UserRole Role { get; set; }
        public HighSchool? HighSchool { get; set; }
        public ContactInfo? ContactInfo { get; set; }
        public EnrollmentInfo? EnrollmentInfo { get; set; }
        public ICollection<UserDocuments>? Documents { get; set; }
        public ICollection<Payment>? EnrolledSemesters { get; set; }
        public ICollection<SemesterSubject>? EnrolledSemesterUserSubjects { get; set; }

        public ICollection<SemesterSubject>? TeachingSubjects { get; set; }

    }
}