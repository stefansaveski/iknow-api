namespace iknow_api.Models
{
    public class MajorSubjects
    {
        public int MajorId { get; set; }
        public int SubjectId { get; set; }
        public int MandatorySemester { get; set; }
        public int Akreditacija { get; set; }
        public Major? Majors { get; set; }
        public Subject? Subjects { get; set; }
    }
}