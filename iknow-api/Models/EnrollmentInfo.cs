using System.ComponentModel.DataAnnotations.Schema;

namespace iknow_api.Models
{
    public enum quota
    {
        drzavna, privatna, stipendija
    }
    public enum major
    {
        SIIS, PIT, KN, KI, IMB, IE, SSP, SEIS
    }
    public class EnrollmentInfo
    {
        public int Id { get; set; }
        public int enrollmentYear { get; set; }
        public quota quota;
        public major major { get; set; }
        public int UserId { get; set; }
        public User User { get; set; }
    }
}
