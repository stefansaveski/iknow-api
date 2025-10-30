using System.ComponentModel.DataAnnotations.Schema;

namespace iknow_api.Models
{
    public class ContactInfo
    {
        public int Id { get; set; }
        public string? city { get; set; }
        public string? address { get; set; }
        public string? municipality { get; set; }
        public string? phoneNumber { get; set; }
        public string? microsoftEmail { get; set; }
        
        public int UserId { get; set; }
        public User? User { get; set; }
    }
}
