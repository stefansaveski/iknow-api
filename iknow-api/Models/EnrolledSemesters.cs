using System.ComponentModel.DataAnnotations.Schema;

namespace iknow_api.Models
{
    public enum Type
    {
        Winter, Summer
    }
    public class EnrolledSemesters
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public User? User { get; set; }
        public int Year { get; set; }
        public int Type { get; set; }
        public Quota QuotaType { get; set; }
        public int MajorId { get; set; }
        public Major? Major { get; set; }
        public ICollection<Payment>? Users { get; set; }
        public ICollection<SemesterSubject>? SemesterSubjects { get; set; }
    }
}
