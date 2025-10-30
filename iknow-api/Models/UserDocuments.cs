namespace iknow_api.Models
{
    public class UserDocuments
    {
        public int UserId { get; set; }
        public int DocumentId { get; set; }
        public User? User{ get; set; }
        public Documents? Documents{ get; set; }
    }
}