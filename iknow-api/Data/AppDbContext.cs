using Microsoft.EntityFrameworkCore;
using iknow_api.Models;

namespace iknow_api.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options) { }

        public DbSet<User> User { get; set; }
        public DbSet<ContactInfo> ContactInfo { get; set; }
        public DbSet<HighSchool> HighSchool { get; set; }
        public DbSet<EnrollmentInfo> EnrollmentInfo { get; set; }
    }
}