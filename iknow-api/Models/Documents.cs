namespace iknow_api.Models
{
    public class Documents
    {
        public int Id { get; set; }
        public string? name { get; set; }
        public string? body { get; set; }
        public int cost { get; set; }
        public ICollection<UserDocuments>? User { get; set; }
    }
}