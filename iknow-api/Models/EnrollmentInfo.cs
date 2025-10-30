using System.ComponentModel.DataAnnotations.Schema;

namespace iknow_api.Models
{
    public enum Quota
    {
        drzavna, privatna, stipendija
    }
    public enum Major
    {
        SIIS, PIT, KN, KI, IMB, IE, SSP, SEIS
    }
    public class EnrollmentInfo
    {
        public int Id { get; set; }
        public int enrollmentYear { get; set; }
        public Quota quota;
        public Major major { get; set; }
        public int UserId { get; set; }
        public User? User { get; set; }
    }
}
