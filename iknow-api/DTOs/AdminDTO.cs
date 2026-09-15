namespace iknow_api.DTOs
{
    // ---------- UC012 subjects ----------

    public class AdminSubjectDto
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public string? Code { get; set; }
        public int AwardedCredits { get; set; }
        public int? DependencyCredit { get; set; }
        public List<SubjectMajorDto> Majors { get; set; } = new();
        public List<SubjectRefDto> Prerequisites { get; set; } = new();
        /// <summary>How many enrolments already contain this subject; it cannot be deleted while this is above zero.</summary>
        public int EnrolledCount { get; set; }
    }

    public class SubjectMajorDto
    {
        public int MajorId { get; set; }
        public string? MajorName { get; set; }
        public int MandatorySemester { get; set; }
    }

    public class SubjectRefDto
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public string? Code { get; set; }
    }

    public class SubjectWriteDto
    {
        public string? Name { get; set; }
        public string? Code { get; set; }
        public int AwardedCredits { get; set; }
        public int? DependencyCredit { get; set; }
    }

    public class MajorLinkDto
    {
        public int MajorId { get; set; }
        public int MandatorySemester { get; set; }
    }

    public class PrerequisiteDto
    {
        public int DependencyId { get; set; }
    }

    // ---------- UC013 semesters ----------

    public class AdminSemesterDto
    {
        public int Id { get; set; }
        public int Year { get; set; }
        public string? Type { get; set; }
        public string? Name { get; set; }
        public int EnrolmentCount { get; set; }
        /// <summary>Subjects with no professor teaching them in this semester.</summary>
        public List<SubjectRefDto> UncoveredSubjects { get; set; } = new();
    }

    public class SemesterWriteDto
    {
        public int Year { get; set; }
        /// <summary>"winter" or "summer".</summary>
        public string? Type { get; set; }
    }

    // ---------- UC014 schedule ----------

    public class ScheduleDto
    {
        public int SemesterId { get; set; }
        public string? SemesterName { get; set; }
        public List<ScheduleRowDto> Assignments { get; set; } = new();
        public List<ProfessorLoadDto> Load { get; set; } = new();
        public List<SubjectRefDto> UncoveredSubjects { get; set; } = new();
        public List<SubjectRefDto> AllSubjects { get; set; } = new();
        public List<ProfessorRefDto> Professors { get; set; } = new();
    }

    public class ScheduleRowDto
    {
        public int SubjectId { get; set; }
        public string? SubjectName { get; set; }
        public string? SubjectCode { get; set; }
        public int ProfessorId { get; set; }
        public string? ProfessorName { get; set; }
    }

    public class ProfessorRefDto
    {
        public int Id { get; set; }
        public string? Name { get; set; }
    }

    public class ProfessorLoadDto
    {
        public int ProfessorId { get; set; }
        public string? ProfessorName { get; set; }
        public int Subjects { get; set; }
    }

    public class ScheduleWriteDto
    {
        public int ProfessorId { get; set; }
        public int SemesterId { get; set; }
        public int SubjectId { get; set; }
    }

    // ---------- shared ----------

    public class AdminResultDto
    {
        public bool Ok { get; set; }
        public string? Message { get; set; }
        public int? Id { get; set; }
    }
}
