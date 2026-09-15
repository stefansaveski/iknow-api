namespace iknow_api.Models
{
    public enum HighSchoolType
    {
        Strucen, Gimnazija
    }

    public class HighSchool
    {
        public int Id { get; set; }
        public float GPA { get; set; }
        public HighSchoolType HighSchoolType { get; set; }
        public int UserId { get; set; }
        public User? User { get; set; }
    }
}
