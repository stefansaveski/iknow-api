using Microsoft.VisualBasic;

namespace iknow_api.Models
{
    public enum sType
    {
        summer,winter
    }
    public class ActiveSemesters
    {
        public int id { get; set; }
        public int year { get; set; }
        public sType Type { get; set; }
        public ICollection<EnrolledSemesters>? EnrolledSemesters { get; set; }
    }
}