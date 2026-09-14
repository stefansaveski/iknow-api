using System.ComponentModel.DataAnnotations.Schema;

namespace iknow_api.Models
{
    public class Payment
    {
        public int Id { get; set; }

        public int UserId { get; set; }
        public User? User { get; set; }
        public int EnrollmentInfoId { get; set; }
        public EnrolledSemesters? EnrolledSemesters { get; set; }

    }
}
