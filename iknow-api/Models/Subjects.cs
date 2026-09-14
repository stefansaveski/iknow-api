namespace iknow_api.Models
{
    public class Subject
    {
        public int Id { get; set; }                       
        public string? Name { get; set; }                 
        public string? Code { get; set; }                  
        public int? AwardedCredits { get; set; } 
        public int? DependencyCredit { get; set; }
        public ICollection<DependencySubject>? Dependencies { get; set; }   
        public ICollection<DependencySubject>? Dependents { get; set; }
        public ICollection<MajorSubjects>? Majors { get; set; }
        public ICollection<SemesterSubject>? SemesterSubjects { get; set; }
        
    }
}
