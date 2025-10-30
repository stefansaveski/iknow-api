namespace iknow_api.Models
{
    public class DependencySubject
    {
        public int SubjectId { get; set; }
        public int DependencyId { get; set; }
        public Subject? Subject { get; set; }
        public Subject? Dependency { get; set; }
    }
}