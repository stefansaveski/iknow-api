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
        public DbSet<RefreshToken> RefreshToken { get; set; }
        public DbSet<Subject> Subjects { get; set; }
        public DbSet<DependencySubject> DependencySubjects { get; set; }
        public DbSet<Major> Majors { get; set; }
        public DbSet<PassedSubject> PassedSubjects { get; set; }
        public DbSet<EnrolledSemesters> EnrolledSemesters { get; set; }
        public DbSet<ActiveSemesters> ActiveSemesters { get; set; }
        public DbSet<SemesterSubject> SemesterSubjects { get; set; }
        public DbSet<MajorSubjects> MajorSubjects { get; set; }
        public DbSet<UserDocuments> UserDocuments { get; set; }
        public DbSet<Documents> Documents { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<ProfessorSubjects> ProfessorSubjects { get; set; }


        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Major>().HasData(
                new Major { Id = 1, Name = "PIT" },
                new Major { Id = 2, Name = "SIIS" },
                new Major { Id = 3, Name = "SEIS" },
                new Major { Id = 4, Name = "KN" }
            );


            // -------------------------
            // DependencySubject (self-referencing many-to-many)
            // -------------------------
            modelBuilder.Entity<DependencySubject>()
                .HasKey(ds => new { ds.SubjectId, ds.DependencyId });

            modelBuilder.Entity<DependencySubject>()
                .HasOne(ds => ds.Subject)
                .WithMany(s => s.Dependencies)
                .HasForeignKey(ds => ds.SubjectId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<DependencySubject>()
                .HasOne(ds => ds.Dependency)
                .WithMany(s => s.Dependents)
                .HasForeignKey(ds => ds.DependencyId)
                .OnDelete(DeleteBehavior.Restrict);

            // -------------------------
            // MajorSubjects (many-to-many)
            // -------------------------
            modelBuilder.Entity<MajorSubjects>()
                .HasKey(ab => new { ab.MajorId, ab.SubjectId });

            modelBuilder.Entity<MajorSubjects>()
                .HasOne(ab => ab.Majors)
                .WithMany(a => a.Subjects)
                .HasForeignKey(ab => ab.MajorId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<MajorSubjects>()
                .HasOne(ab => ab.Subjects)
                .WithMany(b => b.Majors)
                .HasForeignKey(ab => ab.SubjectId)
                .OnDelete(DeleteBehavior.Cascade);

            // -------------------------
            // UserDocuments (many-to-many)
            // -------------------------
            modelBuilder.Entity<UserDocuments>()
                .HasKey(ab => new { ab.UserId, ab.DocumentId });

            modelBuilder.Entity<UserDocuments>()
                .HasOne(ab => ab.User)
                .WithMany(a => a.Documents)
                .HasForeignKey(ab => ab.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<UserDocuments>()
                .HasOne(ab => ab.Documents)
                .WithMany(b => b.User)
                .HasForeignKey(ab => ab.DocumentId)
                .OnDelete(DeleteBehavior.Cascade);

            // -------------------------
            // Payment (user enrollment)
            // -------------------------
            modelBuilder.Entity<Payment>()
                .HasKey(p => p.Id);

            modelBuilder.Entity<Payment>()
                .HasOne(p => p.User)
                .WithMany(u => u.EnrolledSemesters)
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Payment>()
                .HasOne(p => p.EnrolledSemesters)
                .WithMany(es => es.Users)
                .HasForeignKey(p => p.EnrollmentInfoId)
                .OnDelete(DeleteBehavior.Cascade);

            // -------------------------
            // SemesterSubject (student enrollments and professor assignments)
            // -------------------------
            modelBuilder.Entity<SemesterSubject>()
                .HasKey(ss => ss.Id); // or composite key if you prefer {UserId, EnrolledSemesterId, SubjectId}

            // Student enrollment
            modelBuilder.Entity<SemesterSubject>()
                .HasOne(ss => ss.User)
                .WithMany(u => u.EnrolledSemesterUserSubjects)
                .HasForeignKey(ss => ss.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // Professor teaching
            modelBuilder.Entity<SemesterSubject>()
                .HasOne(ss => ss.Professor)
                .WithMany(u => u.TeachingSubjects)
                .HasForeignKey(ss => ss.ProfessorId)
                .OnDelete(DeleteBehavior.Restrict);

            // Subject relation
            modelBuilder.Entity<SemesterSubject>()
                .HasOne(ss => ss.Subject)
                .WithMany(s => s.SemesterSubjects)
                .HasForeignKey(ss => ss.SubjectId)
                .OnDelete(DeleteBehavior.Restrict);

            // EnrolledSemester relation
            modelBuilder.Entity<SemesterSubject>()
                .HasOne(ss => ss.EnrolledSemester)
                .WithMany(es => es.SemesterSubjects)
                .HasForeignKey(ss => ss.EnrolledSemesterId)
                .OnDelete(DeleteBehavior.Restrict);

            // -------------------------
            // PassedSubject (one-to-one with SemesterSubject)
            // -------------------------
            modelBuilder.Entity<PassedSubject>()
                .HasKey(ps => ps.Id);

            modelBuilder.Entity<PassedSubject>()
                .HasOne(ps => ps.SemesterSubject)
                .WithOne(ss => ss.PassedSubject)
                .HasForeignKey<PassedSubject>(ps => ps.SemesterSubjectId)
                .OnDelete(DeleteBehavior.Cascade);

            // -------------------------
            // ActiveSemesters to EnrolledSemesters (one-to-many)
            // -------------------------
            modelBuilder.Entity<EnrolledSemesters>()
                .HasOne(es => es.Semester)
                .WithMany(a => a.EnrolledSemesters)
                .HasForeignKey(es => es.Id)
                .OnDelete(DeleteBehavior.Restrict);

            // -------------------------
            // ProfessorSubjects (many-to-many: Professor -> Semester -> Subject)
            // -------------------------
            modelBuilder.Entity<ProfessorSubjects>()
                .HasKey(ps => new { ps.ProfessorId, ps.SemesterId, ps.SubjectId });

            modelBuilder.Entity<ProfessorSubjects>()
                .HasOne(ps => ps.Professor)
                .WithMany()
                .HasForeignKey(ps => ps.ProfessorId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ProfessorSubjects>()
                .HasOne(ps => ps.Semester)
                .WithMany()
                .HasForeignKey(ps => ps.SemesterId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ProfessorSubjects>()
                .HasOne(ps => ps.Subject)
                .WithMany()
                .HasForeignKey(ps => ps.SubjectId)
                .OnDelete(DeleteBehavior.Cascade);
        }

    }
}