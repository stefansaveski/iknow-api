using Microsoft.EntityFrameworkCore;
using iknow_api.Models;

namespace iknow_api.Data
{
    /// <summary>
    /// The schema is owned by sql/ddl.sql, not by EF migrations. Every entity
    /// below is mapped explicitly onto the table and column names in that
    /// script; nothing here may rely on EF naming conventions.
    /// </summary>
    public class AppDbContext : DbContext
    {
        /// <summary>
        /// The schema created by sql/schema_creation.sql. Every table and enum
        /// type is qualified with it, so nothing depends on search_path.
        /// </summary>
        public const string ProjectSchema = "project";

        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options) { }

        public DbSet<User> User { get; set; }
        public DbSet<ContactInfo> ContactInfo { get; set; }
        public DbSet<HighSchool> HighSchool { get; set; }
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

            // The enum types themselves are declared in ddl.sql; this tells EF
            // they exist so it does not try to treat the columns as text.
            modelBuilder.HasPostgresEnum<UserRole>(ProjectSchema, "user_role");
            modelBuilder.HasPostgresEnum<HighSchoolType>(ProjectSchema, "hs_type");
            modelBuilder.HasPostgresEnum<Quota>(ProjectSchema, "quota_type");
            modelBuilder.HasPostgresEnum<sType>(ProjectSchema, "semester_type");
            modelBuilder.HasPostgresEnum<Grade>(ProjectSchema, "grade_type");

            // -------------------------
            // users
            // -------------------------
            modelBuilder.Entity<User>(e =>
            {
                e.ToTable("users", ProjectSchema);
                e.HasKey(u => u.Id);
                e.Property(u => u.Id).HasColumnName("id");
                e.Property(u => u.Name).HasColumnName("name");
                e.Property(u => u.EMBG).HasColumnName("embg");
                e.Property(u => u.Surname).HasColumnName("surname");
                e.Property(u => u.Index).HasColumnName("index");
                e.Property(u => u.Bday).HasColumnName("bday").HasColumnType("timestamp without time zone");
                e.Property(u => u.Email).HasColumnName("email");
                e.Property(u => u.PasswordHash).HasColumnName("password");
                e.Property(u => u.Role).HasColumnName("role");
                e.Property(u => u.Quota).HasColumnName("quota");
                e.Property(u => u.EnrollmentYear).HasColumnName("enrollment_year");
                e.Property(u => u.CreatedAt).HasColumnName("created_at").HasColumnType("timestamp without time zone");
                e.HasIndex(u => u.Email).IsUnique();
            });

            // -------------------------
            // high_school
            // -------------------------
            modelBuilder.Entity<HighSchool>(e =>
            {
                e.ToTable("high_school", ProjectSchema);
                e.HasKey(h => h.Id);
                e.Property(h => h.Id).HasColumnName("id");
                e.Property(h => h.UserId).HasColumnName("user_id");
                e.Property(h => h.GPA).HasColumnName("gpa");
                e.Property(h => h.HighSchoolType).HasColumnName("type");
                e.HasOne(h => h.User)
                 .WithOne(u => u.HighSchool)
                 .HasForeignKey<HighSchool>(h => h.UserId)
                 .OnDelete(DeleteBehavior.Restrict);
            });

            // -------------------------
            // contact
            // -------------------------
            modelBuilder.Entity<ContactInfo>(e =>
            {
                e.ToTable("contact", ProjectSchema);
                e.HasKey(c => c.Id);
                e.Property(c => c.Id).HasColumnName("id");
                e.Property(c => c.UserId).HasColumnName("user_id");
                e.Property(c => c.City).HasColumnName("city");
                e.Property(c => c.Municipality).HasColumnName("municipality");
                e.Property(c => c.Address).HasColumnName("address");
                e.Property(c => c.PhoneNumber).HasColumnName("number");
                e.Property(c => c.MicrosoftEmail).HasColumnName("microsoft_email");
                e.HasOne(c => c.User)
                 .WithOne(u => u.ContactInfo)
                 .HasForeignKey<ContactInfo>(c => c.UserId)
                 .OnDelete(DeleteBehavior.Restrict);
            });

            // -------------------------
            // major
            // -------------------------
            modelBuilder.Entity<Major>(e =>
            {
                e.ToTable("major", ProjectSchema);
                e.HasKey(m => m.Id);
                e.Property(m => m.Id).HasColumnName("id");
                e.Property(m => m.Name).HasColumnName("name");
            });

            // -------------------------
            // active_semesters
            // -------------------------
            modelBuilder.Entity<ActiveSemesters>(e =>
            {
                e.ToTable("active_semesters", ProjectSchema);
                e.HasKey(a => a.Id);
                e.Property(a => a.Id).HasColumnName("id");
                e.Property(a => a.Year).HasColumnName("year");
                e.Property(a => a.Type).HasColumnName("type");
            });

            // -------------------------
            // subjects
            // -------------------------
            modelBuilder.Entity<Subject>(e =>
            {
                e.ToTable("subjects", ProjectSchema);
                e.HasKey(s => s.Id);
                e.Property(s => s.Id).HasColumnName("id");
                e.Property(s => s.Name).HasColumnName("name");
                e.Property(s => s.Code).HasColumnName("code");
                e.Property(s => s.AwardedCredits).HasColumnName("awarded_credits");
                e.Property(s => s.DependencyCredit).HasColumnName("dependency_credit");
            });

            // -------------------------
            // enrolled_semesters
            // -------------------------
            modelBuilder.Entity<EnrolledSemesters>(e =>
            {
                e.ToTable("enrolled_semesters", ProjectSchema);
                e.HasKey(es => es.Id);
                e.Property(es => es.Id).HasColumnName("id");
                e.Property(es => es.UserId).HasColumnName("user_id");
                e.Property(es => es.QuotaType).HasColumnName("quota");
                e.Property(es => es.MajorId).HasColumnName("major_id");
                e.Property(es => es.Note).HasColumnName("note");
                e.Property(es => es.StudentComment).HasColumnName("student_comment");
                e.Property(es => es.CratedAt).HasColumnName("created_at").HasColumnType("timestamp without time zone");
                e.Property(es => es.LastChange).HasColumnName("last_change").HasColumnType("timestamp without time zone");
                e.Property(es => es.Verified).HasColumnName("completed").HasColumnType("timestamp without time zone");
                e.Property(es => es.SemesterId).HasColumnName("semester_id");

                e.HasOne(es => es.User)
                 .WithMany(u => u.Enrolments)
                 .HasForeignKey(es => es.UserId)
                 .OnDelete(DeleteBehavior.Restrict);

                // Note: this deliberately keys off SemesterId. An earlier version
                // pointed the foreign key at es.Id, which silently tied every
                // enrolment to the semester that happened to share its id.
                e.HasOne(es => es.Semester)
                 .WithMany(a => a.EnrolledSemesters)
                 .HasForeignKey(es => es.SemesterId)
                 .OnDelete(DeleteBehavior.Restrict);

                e.HasOne(es => es.Major)
                 .WithMany()
                 .HasForeignKey(es => es.MajorId)
                 .OnDelete(DeleteBehavior.Restrict);
            });

            // -------------------------
            // semesters_subjects
            // -------------------------
            modelBuilder.Entity<SemesterSubject>(e =>
            {
                e.ToTable("semesters_subjects", ProjectSchema);
                e.HasKey(ss => ss.Id);
                e.Property(ss => ss.Id).HasColumnName("id");
                e.Property(ss => ss.EnrolledSemesterId).HasColumnName("enrolled_semesters_id");
                e.Property(ss => ss.SubjectId).HasColumnName("subjects_id");
                e.Property(ss => ss.ProfessorId).HasColumnName("professor_id");
                e.Property(ss => ss.Signature).HasColumnName("signature");

                e.HasOne(ss => ss.Professor)
                 .WithMany(u => u.TeachingSubjects)
                 .HasForeignKey(ss => ss.ProfessorId)
                 .OnDelete(DeleteBehavior.Restrict);

                e.HasOne(ss => ss.Subject)
                 .WithMany(s => s.SemesterSubjects)
                 .HasForeignKey(ss => ss.SubjectId)
                 .OnDelete(DeleteBehavior.Restrict);

                e.HasOne(ss => ss.EnrolledSemester)
                 .WithMany(es => es.SemesterSubjects)
                 .HasForeignKey(ss => ss.EnrolledSemesterId)
                 .OnDelete(DeleteBehavior.Restrict);
            });

            // -------------------------
            // passed_subjects
            // -------------------------
            modelBuilder.Entity<PassedSubject>(e =>
            {
                e.ToTable("passed_subjects", ProjectSchema);
                e.HasKey(ps => ps.Id);
                e.Property(ps => ps.Id).HasColumnName("id");
                e.Property(ps => ps.SemesterSubjectId).HasColumnName("enrolled_id");
                e.Property(ps => ps.Grade).HasColumnName("grade");
                e.Property(ps => ps.DatePassed).HasColumnName("date_passed").HasColumnType("timestamp without time zone");

                e.HasOne(ps => ps.SemesterSubject)
                 .WithOne(ss => ss.PassedSubject)
                 .HasForeignKey<PassedSubject>(ps => ps.SemesterSubjectId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            // -------------------------
            // documents
            // -------------------------
            modelBuilder.Entity<Documents>(e =>
            {
                e.ToTable("documents", ProjectSchema);
                e.HasKey(d => d.Id);
                e.Property(d => d.Id).HasColumnName("id");
                e.Property(d => d.Name).HasColumnName("type");
                e.Property(d => d.Body).HasColumnName("body");
                e.Property(d => d.Cost).HasColumnName("cost");
            });

            // -------------------------
            // user_documents
            // -------------------------
            modelBuilder.Entity<UserDocuments>(e =>
            {
                e.ToTable("user_documents", ProjectSchema);
                e.HasKey(ud => new { ud.UserId, ud.DocumentId });
                e.Property(ud => ud.UserId).HasColumnName("user_id");
                e.Property(ud => ud.DocumentId).HasColumnName("document_id");

                e.HasOne(ud => ud.User)
                 .WithMany(u => u.Documents)
                 .HasForeignKey(ud => ud.UserId)
                 .OnDelete(DeleteBehavior.Cascade);

                e.HasOne(ud => ud.Documents)
                 .WithMany(d => d.User)
                 .HasForeignKey(ud => ud.DocumentId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            // -------------------------
            // token
            // -------------------------
            modelBuilder.Entity<RefreshToken>(e =>
            {
                e.ToTable("token", ProjectSchema);
                e.HasKey(t => t.Id);
                e.Property(t => t.Id).HasColumnName("id");
                e.Property(t => t.UserId).HasColumnName("user_id");
                e.Property(t => t.Token).HasColumnName("token");
                e.Property(t => t.ExpiresAt).HasColumnName("expires_at").HasColumnType("timestamp without time zone");
                e.Property(t => t.IsValid).HasColumnName("is_valid");

                e.HasOne(t => t.User)
                 .WithMany()
                 .HasForeignKey(t => t.UserId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            // -------------------------
            // payment
            // -------------------------
            modelBuilder.Entity<Payment>(e =>
            {
                e.ToTable("payment", ProjectSchema);
                e.HasKey(p => p.Id);
                e.Property(p => p.Id).HasColumnName("id");
                e.Property(p => p.EnrollmentInfoId).HasColumnName("enrollment_id");
                e.Property(p => p.Amount).HasColumnName("amount");

                // No user_id: the student comes from the enrolment. Removing it
                // was the BCNF fix from Phase 5 (enrolled_id -> user_id).
                e.HasOne(p => p.EnrolledSemesters)
                 .WithMany(es => es.Users)
                 .HasForeignKey(p => p.EnrollmentInfoId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            // -------------------------
            // major_subjects
            // -------------------------
            modelBuilder.Entity<MajorSubjects>(e =>
            {
                e.ToTable("major_subjects", ProjectSchema);
                e.HasKey(ms => new { ms.MajorId, ms.SubjectId });
                e.Property(ms => ms.MajorId).HasColumnName("major_id");
                e.Property(ms => ms.SubjectId).HasColumnName("subject_id");
                e.Property(ms => ms.MandatorySemester).HasColumnName("mandatory_semester");

                e.HasOne(ms => ms.Majors)
                 .WithMany(m => m.Subjects)
                 .HasForeignKey(ms => ms.MajorId)
                 .OnDelete(DeleteBehavior.Cascade);

                e.HasOne(ms => ms.Subjects)
                 .WithMany(s => s.Majors)
                 .HasForeignKey(ms => ms.SubjectId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            // -------------------------
            // dependency_subject
            // -------------------------
            modelBuilder.Entity<DependencySubject>(e =>
            {
                e.ToTable("dependency_subject", ProjectSchema);
                e.HasKey(ds => new { ds.SubjectId, ds.DependencyId });
                e.Property(ds => ds.SubjectId).HasColumnName("subject_id");
                e.Property(ds => ds.DependencyId).HasColumnName("dependency_id");

                e.HasOne(ds => ds.Subject)
                 .WithMany(s => s.Dependencies)
                 .HasForeignKey(ds => ds.SubjectId)
                 .OnDelete(DeleteBehavior.Restrict);

                e.HasOne(ds => ds.Dependency)
                 .WithMany(s => s.Dependents)
                 .HasForeignKey(ds => ds.DependencyId)
                 .OnDelete(DeleteBehavior.Restrict);
            });

            // -------------------------
            // professour_subjects  (spelling matches the table in ddl.sql)
            // -------------------------
            modelBuilder.Entity<ProfessorSubjects>(e =>
            {
                e.ToTable("professour_subjects", ProjectSchema);
                e.HasKey(ps => new { ps.ProfessorId, ps.SemesterId, ps.SubjectId });
                e.Property(ps => ps.ProfessorId).HasColumnName("prof_id");
                e.Property(ps => ps.SemesterId).HasColumnName("active_semester_id");
                e.Property(ps => ps.SubjectId).HasColumnName("subject_id");

                e.HasOne(ps => ps.Professor)
                 .WithMany()
                 .HasForeignKey(ps => ps.ProfessorId)
                 .OnDelete(DeleteBehavior.Cascade);

                e.HasOne(ps => ps.Semester)
                 .WithMany()
                 .HasForeignKey(ps => ps.SemesterId)
                 .OnDelete(DeleteBehavior.Cascade);

                e.HasOne(ps => ps.Subject)
                 .WithMany()
                 .HasForeignKey(ps => ps.SubjectId)
                 .OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}
