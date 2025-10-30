using System.ComponentModel.DataAnnotations.Schema;

namespace iknow_api.Models
{
    public class Major
    {
        public int Id { get; set; }

        public string? Name { get; set; }
        public ICollection<MajorSubjects>? Subjects { get; set; }
    }
}
