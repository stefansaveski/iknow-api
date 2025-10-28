namespace iknow_api.DTOs
{
    // Login DTO
    public class LoginDto
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public bool GenerateRefreshToken { get; set; }
    }
    public class GetUserDataDto
    {
        public string JWT { get; set; }
    }

    // Registration DTO
    public class RegisterDto
    {
        public string Name { get; set; } = string.Empty;
        public string Surname { get; set; } = string.Empty;
        public string? Index { get; set; }
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public DateTime Bday { get; set; }
        public UserRole Role { get; set; }
        public float gpa { get; set; }
        public type tip { get; set; }
        public string city { get; set; } = string.Empty;
        public string address { get; set; } = string.Empty;
        public string municipality { get; set; } = string.Empty;
        public string phoneNumber { get; set; } = string.Empty;
        public string microsoftEmail { get; set; } = string.Empty;
        public int enrollmentYear { get; set; }
        public quota quotaType { get; set; }
        public major majorType { get; set; }

    }

    // User response DTO (for returning user data without password)
    public class UserResponseDto
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public string? Surname { get; set; }
        public string? Index { get; set; }
        public string? Email { get; set; }
        public DateTime Bday { get; set; }
        public DateTime CreatedAt { get; set; }
        public UserRole Role { get; set; }
    }

    // User role enum
    public enum UserRole
    {
        Admin,
        Professor,
        Student
    }
    public enum type
    {
        strucen, gimnazija
    }
    public enum quota
    {
        drzavna, privatna, stipendija
    }
    public enum major
    {
        SIIS, PIT, KN, KI, IMB, IE, SSP, SEIS
    }
}