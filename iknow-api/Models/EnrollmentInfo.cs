using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Net.Http.Headers;

namespace iknow_api.Models
{
    public enum Quota
    {
        drzavna, privatna, stipendija
    }
    public class EnrollmentInfo
    {
        public int Id { get; set; }
        public int enrollmentYear { get; set; }
        public Quota quota { get; set; }
        public int MajorId { get; set; }
        public Major? Major { get; set; }
        public int UserId { get; set; }
        public User? User { get; set; }
        public string? StudyType { get; set; }
        public string? StudyStatus { get; set; }

    }
}
