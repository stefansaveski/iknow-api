using Microsoft.EntityFrameworkCore;
using iknow_api.Core.Models;

namespace iknow_api.Core.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options) { }

        public DbSet<User> User { get; set; }
    }
}