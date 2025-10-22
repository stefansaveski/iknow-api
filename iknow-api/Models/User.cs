

namespace iknow_api.Core.Models
{
    public enum UserRole
    {
        Admin,
        Professor,
        Strudent
    }

    public class User
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public string? Surname { get; set; }
        public string? Index { get; set; }
        public string? Email { get; set; }
        public string? Password { get; set; }
        public DateTime Bday { get; set; }
        public DateTime CreatedAt { get; set; }
        public UserRole Role { get; set; }
    }
}