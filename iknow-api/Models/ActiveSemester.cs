



namespace iknow_api.Models
{
    public enum sType
    {
        summer,winter
    }
    public class ActiveSemesters
    {
        public int Id { get; set; }
        public int Year { get; set; }
        public sType Type { get; set; }
        public ICollection<EnrolledSemesters>? EnrolledSemesters { get; set; }
    }
}