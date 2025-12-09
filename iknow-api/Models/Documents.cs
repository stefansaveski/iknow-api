namespace iknow_api.Models
{
    public class Documents
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public string? Body { get; set; }
        public int Cost { get; set; }
        public ICollection<UserDocuments>? User { get; set; }
    }
}