using System.ComponentModel.DataAnnotations.Schema;

namespace iknow_api.Models
{
    public class EnrolledSemesters
    {
        //Add type of semester winter/summer
        public int Id { get; set; }
        public int UserId { get; set; }
        public User? User { get; set; }
        public Quota QuotaType { get; set; }
        public int MajorId { get; set; }
        public string? StudentComment { get; set; }
        public string? Note { get; set; }
        public DateTime CratedAt { get; set; }
        public DateTime? LastChange { get; set; }
        public DateTime? Verified { get; set; }
        public int SemesterId { get; set; }
        public ActiveSemesters? Semester { get; set; }
        public Major? Major { get; set; }
        public ICollection<Payment>? Users { get; set; }
        public ICollection<SemesterSubject>? SemesterSubjects { get; set; }
    }
}
