using System.ComponentModel.DataAnnotations.Schema;

namespace iknow_api.Models
{
    public class ContactInfo
    {
        public int Id { get; set; }
        public string? City { get; set; }
        public string? Address { get; set; }
        public string? Municipality { get; set; }
        public string? PhoneNumber { get; set; }
        public string? MicrosoftEmail { get; set; }
        
        public int UserId { get; set; }
        public User? User { get; set; }
    }
}
