using System.Collections;

namespace iknow_api.Models
{
    public class UsersBySubject
    {
        public int UserId { get; set; }          // changed from string? to int
        public string? UserName { get; set; }    // changed from int? to string?
        public int Grade { get; set; }
        public int GradeId { get; set; }
    }

    public class SubjectsAndUsers//List<SubjectsAndUsers>
    {
        public string? SubjectName { get; set; }
        public int? SubjectId { get; set; }

        public List<UsersBySubject> Users { get; set; } = new();
    }

    public class AddGrade
    {
        public int StudentId { get; set; }
        public int SubjectId { get; set; }
        public int grade { get; set; }
    }
}