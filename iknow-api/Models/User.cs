namespace iknow_api.Models
{
    public enum UserRole
    {
        Admin,
        Professor,
        Student
    }

    // Attributes follow the Users entity in the ER model exactly.
    public class User
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public string? EMBG { get; set; }
        public string? Surname { get; set; }
        public string? Index { get; set; }
        public string? Email { get; set; }
        public string? PasswordHash { get; set; }
        public DateTime? Bday { get; set; }
        public DateTime CreatedAt { get; set; }
        public UserRole Role { get; set; }
        public Quota? Quota { get; set; }
        public int? EnrollmentYear { get; set; }

        public HighSchool? HighSchool { get; set; }
        public ContactInfo? ContactInfo { get; set; }
        public ICollection<UserDocuments>? Documents { get; set; }

        // Users 1 --submits-- N EnrolledSemesters
        public ICollection<EnrolledSemesters>? Enrolments { get; set; }

        // Users 1 --teaches-- N SemestersSubjects
        public ICollection<SemesterSubject>? TeachingSubjects { get; set; }
    }
}
