namespace iknow_api.DTOs
{
    /// <summary>Everything the enrolment form needs to render.</summary>
    public class EnrollmentOptionsDto
    {
        /// <summary>How many subjects an enrolment must contain.</summary>
        public int RequiredSubjects { get; set; }

        /// <summary>Semesters this student has not enrolled in yet.</summary>
        public List<SemesterOptionDto> Semesters { get; set; } = new();

        public List<MajorOptionDto> Majors { get; set; } = new();

        /// <summary>The major from the most recent enrolment, if there is one.</summary>
        public int? DefaultMajorId { get; set; }
    }

    public class SemesterOptionDto
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public int Year { get; set; }
        public string? Type { get; set; }
    }

    public class MajorOptionDto
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public List<SubjectOptionDto> Subjects { get; set; } = new();
    }

    public class SubjectOptionDto
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public string? Code { get; set; }
        public int Credits { get; set; }
        public int MandatorySemester { get; set; }
        /// <summary>True when the student already passed this subject.</summary>
        public bool AlreadyPassed { get; set; }
    }

    public class EnrollSemesterRequestDto
    {
        public int SemesterId { get; set; }
        public int MajorId { get; set; }
        public List<int> SubjectIds { get; set; } = new();
    }

    public class EnrollSemesterResultDto
    {
        public bool Ok { get; set; }
        public string? Message { get; set; }
        public int? EnrolledSemesterId { get; set; }
    }
}
