namespace iknow_api.DTOs
{
    /// <summary>One subject a professor teaches, with the students enrolled in it.</summary>
    public class SubjectStudentsDto
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public string? Code { get; set; }
        public List<EnrolledStudentDto> Users { get; set; } = new();
    }

    public class EnrolledStudentDto
    {
        /// <summary>users.id - what the grading endpoints expect as StudentId.</summary>
        public int Id { get; set; }
        public string? Name { get; set; }
        /// <summary>users.index - the number a professor actually recognises.</summary>
        public string? Index { get; set; }
        /// <summary>0 when the subject has not been graded yet.</summary>
        public int Grade { get; set; }
        public string? Semester { get; set; }
    }

    public class GradeRequestDto
    {
        public int StudentId { get; set; }
        public int SubjectId { get; set; }
        public int Grade { get; set; }
    }

    public class GradeResultDto
    {
        public bool Ok { get; set; }
        public string? Message { get; set; }
    }
}
