using System.ComponentModel.DataAnnotations.Schema;

namespace iknow_api.Models
{
    public enum type
    {
        strucen, gimnazija
    }
    public class HighSchool
    {
        public int Id { get; set; }
        public float GPA { get; set; }
        public type tip { get; set; }

        public int UserId { get; set; }
        public User User { get; set; }
    }
}
