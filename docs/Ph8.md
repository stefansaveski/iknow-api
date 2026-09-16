== Напреден апликативен развој

Backend делот од апликацијата е .NET 9 Web API кој до базата пристапува преку
Entity Framework Core и драјверот Npgsql
([https://www.nuget.org/packages/Npgsql.EntityFrameworkCore.PostgreSQL Npgsql.EntityFrameworkCore.PostgreSQL 9.0.4]).
Базата е зад SSH тунел, па секоја физичка конекција е уште еден канал низ тунелот -
тоа е причината зошто во оваа фаза и трансакциите и pool-от се разгледуваат заедно.

Оваа фаза опфаќа:

 * '''Трансакции''' - кои сценарија пишуваат во повеќе табели и како тие се водат како една целина
 * '''Ниво на изолација''' - што се случува кога два студента запишуваат ист семестар истовремено
 * '''Pooling''' - како се менаџираат конекциите и колку од нив навистина се отвораат

== 1. Трансакции

=== Како EF Core води трансакција

EF Core не бара анотација како {{{@Transactional}}}. Секој повик на
{{{SaveChangesAsync()}}} сам по себе е една трансакција - сите промени натрупани во
контекстот се испраќаат во еден BEGIN/COMMIT. Затоа операција која пишува во повеќе
табели '''еднаш''' не бара ништо дополнително.

Експлицитна трансакција е потребна кога операцијата мора да повика
{{{SaveChangesAsync()}}} '''повеќе пати''', најчесто затоа што вториот запис го
употребува идентификаторот доделен при првиот. Тогаш двата повика се затвораат во
{{{BeginTransactionAsync()}}} ... {{{CommitAsync()}}}, за да не остане запис од
првиот чекор ако вториот падне.

Во апликацијата тоа се три сценарија: регистрација на студент, запишување на
семестар и бришење на предмет.

=== 1.1 Регистрација на студент (UC002)

Корисникот, неговите контакт податоци и средношколските податоци се три табели.
Contact и high_school имаат надворешен клуч кон users, па идентификаторот на
корисникот мора прво да постои - оттука и двата повика на {{{SaveChangesAsync}}}.

{{{#!csharp
public async Task<bool> RegisterAsync(RegisterDto registerDto)
{
    if (await _userRepository.UserExistsAsync(registerDto.Email))
        throw new InvalidOperationException("User with this email already exists");

    // Use a transaction to ensure all entities are saved together
    using var transaction = await _context.Database.BeginTransactionAsync();
    try
    {
        // quota and enrollment_year are attributes of Users in the ER
        // model, so they are set here rather than on a separate entity.
        var user = new User
        {
            Name = registerDto.Name,
            Surname = registerDto.Surname,
            Index = registerDto.Index,
            Email = registerDto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(registerDto.Password),
            Bday = DateTime.SpecifyKind(registerDto.Bday, DateTimeKind.Unspecified),
            CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified),
            Role = (Models.UserRole)registerDto.Role,
            EMBG = registerDto.EMBG,
            Quota = (Models.Quota)registerDto.quotaType,
            EnrollmentYear = registerDto.enrollmentYear
        };

        _context.User.Add(user);
        await _context.SaveChangesAsync();   // <- тука user.Id добива вредност

        int userId = user.Id;

        var contactInfo = new ContactInfo
        {
            UserId = userId,
            City = registerDto.city,
            Address = registerDto.address,
            Municipality = registerDto.municipality,
            PhoneNumber = registerDto.phoneNumber,
            MicrosoftEmail = registerDto.microsoftEmail
        };

        var highSchool = new HighSchool
        {
            UserId = userId,
            GPA = registerDto.gpa,
            HighSchoolType = (Models.HighSchoolType)registerDto.tip
        };

        _context.ContactInfo.Add(contactInfo);
        _context.HighSchool.Add(highSchool);

        // Save all related entities in a single transaction
        await _context.SaveChangesAsync();
        await transaction.CommitAsync();

        return true;
    }
    catch
    {
        await transaction.RollbackAsync();
        throw;
    }
}
}}}

Без трансакцијата, пад при вториот {{{SaveChangesAsync}}} би оставил корисник без
контакт и без средношколски податоци - запис кој ниту може да се употреби, ниту
може да се регистрира повторно, бидејќи е-поштата е UNIQUE.

=== 1.2 Запишување на семестар (UC007)

Запишувањето создава еден ред во enrolled_semesters и '''точно пет''' реда во
semesters_subjects. Редовите за предметите го бараат идентификаторот на
запишувањето, па повторно се работи за два чекора.

{{{#!csharp
await using var transaction = await _context.Database.BeginTransactionAsync();
try
{
    var enrolment = new EnrolledSemesters
    {
        UserId = studentId,
        SemesterId = request.SemesterId,
        MajorId = request.MajorId,
        // enrolled_semesters.quota is NOT NULL; fall back to the
        // state quota when the student record has none.
        QuotaType = student.Quota ?? Models.Quota.drzavna,
        CratedAt = now,
        LastChange = now,
        Verified = null
    };

    _context.EnrolledSemesters.Add(enrolment);
    await _context.SaveChangesAsync();

    foreach (var subjectId in subjectIds)
    {
        _context.SemesterSubjects.Add(new SemesterSubject
        {
            EnrolledSemesterId = enrolment.Id,
            SubjectId = subjectId,
            ProfessorId = professorBySubject[subjectId],
            Signature = false
        });
    }

    await _context.SaveChangesAsync();
    await transaction.CommitAsync();

    return new EnrollSemesterResultDto
    {
        Ok = true,
        Message = $"Enrolled with {subjectIds.Count} subjects.",
        EnrolledSemesterId = enrolment.Id
    };
}
}}}

Овде трансакцијата не е само заштита од полузапишан семестар. Ограничувањето за
големина на запишувањето од Фаза 7 е '''одложен''' тригер:

{{{#!sql
CREATE CONSTRAINT TRIGGER trg_enrolment_size
    AFTER INSERT OR UPDATE OR DELETE ON semesters_subjects
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION check_enrolment_size();
}}}

Одложен тригер се проверува при COMMIT, а не по секој ред. Токму затоа петте
предмети се внесуваат во иста трансакција: ако се внесуваа секој во своја
трансакција, првиот ред ќе беше видлив во база како запишување со еден предмет, а
правилото „најмногу 5 предмети и најмногу 30 кредити“ ќе се проверуваше пет пати
наместо еднаш, на крајот.

=== 1.3 Бришење на предмет (UC012)

Предметот е референциран од три врзни табели. Тие мора да се избришат пред него, а
ако некоја од нив падне, предметот мора да остане недопрен.

{{{#!csharp
// semesters_subjects references subjects, so a taken subject cannot go.
var taken = await _context.SemesterSubjects.CountAsync(ss => ss.SubjectId == subjectId);
if (taken > 0)
{
    return Fail($"Cannot delete: {taken} enrolment(s) already contain this subject.");
}

await using var transaction = await _context.Database.BeginTransactionAsync();
try
{
    // The mapping rows must go first; their foreign keys would block the delete.
    var prereqs = await _context.DependencySubjects
        .Where(d => d.SubjectId == subjectId || d.DependencyId == subjectId)
        .ToListAsync();
    _context.DependencySubjects.RemoveRange(prereqs);

    var majors = await _context.MajorSubjects
        .Where(ms => ms.SubjectId == subjectId).ToListAsync();
    _context.MajorSubjects.RemoveRange(majors);

    var teaching = await _context.ProfessorSubjects
        .Where(ps => ps.SubjectId == subjectId).ToListAsync();
    _context.ProfessorSubjects.RemoveRange(teaching);

    _context.Subjects.Remove(subject);
    await _context.SaveChangesAsync();
    await transaction.CommitAsync();

    return Ok($"Subject '{subject.Name}' deleted.");
}
catch
{
    await transaction.RollbackAsync();
    throw;
}
}}}

=== 1.4 Оценување (UC010) - кога трансакција не е потребна

Внесувањето на оценка пишува во една табела, со еден
{{{SaveChangesAsync}}}, па EF Core сам го обвиткува во трансакција. Додавање на
експлицитна трансакција овде не би променило ништо, освен уште една размена со
серверот.

{{{#!csharp
case GradeAction.Add:
    if (existing is not null)
    {
        return Fail("This subject is already graded. Use edit to change the grade.");
    }
    await _profRepository.AddPassedSubjectAsync(new PassedSubject
    {
        SemesterSubjectId = semesterSubject.Id,
        Grade = (Grade)request.Grade,
        // date_passed is `timestamp without time zone`.
        DatePassed = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Unspecified)
    });
    return Ok($"Grade {request.Grade} added.");
}}}

Вреди да се забележи дека и овде има повеќе од еден запис во базата, но вториот го
прави '''базата''', не апликацијата: тригерот trg_grade_rules од Фаза 7 го
поставува потписот и создава известување за студентот. Бидејќи тие се извршуваат во
истата трансакција како и внесувањето, оценка без потпис и без известување не може
да постои.

=== 1.5 Ниво на изолација и конкурентни запишувања

Ниту EF Core ниту Npgsql не го менуваат нивото на изолација, па важи
стандардното ниво на PostgreSQL - '''READ COMMITTED'''. Тоа значи дека секое
барање во трансакцијата ја гледа состојбата потврдена пред тоа барање, но не ги
гледа незавршените трансакции на другите.

Тоа е доволно за сите сценарија освен за едно. Пред да запише, апликацијата
проверува дали студентот веќе го запишал тој семестар:

{{{#!csharp
// enrolled_semesters has UNIQUE (user_id, semester_id); check first so
// the student gets a sentence rather than a constraint violation.
if (await _context.EnrolledSemesters.AnyAsync(
        es => es.UserId == studentId && es.SemesterId == request.SemesterId))
{
    return Fail("You are already enrolled in that semester.");
}
}}}

Ако студентот два пати кликне на копчето, двете барања ја прават оваа проверка пред
било кое од нив да потврди, па двете ја поминуваат. Проверката во апликација не
може да го спречи тоа - таа чита состојба која во меѓувреме се менува.

Ограничувањето во базата може. Проверено со две истовремени трансакции врз шемата
project:

{{{
-- сесија А                          -- сесија Б (0.5s подоцна)
BEGIN;                               BEGIN;
INSERT INTO enrolled_semesters       INSERT INTO enrolled_semesters
  (user_id, quota, major_id,           (user_id, quota, major_id,
   semester_id)                         semester_id)
VALUES (1, 'drzavna', 1, 3);         VALUES (1, 'drzavna', 1, 3);
SELECT pg_sleep(2);                  -- чека А да заврши
COMMIT;                              ERROR: duplicate key value violates unique
                                     constraint "enrolled_semesters_user_id_semester_id_key"
                                     DETAIL: Key (user_id, semester_id)=(1, 3) already exists.
                                     ROLLBACK
}}}

Втората трансакција не добива грешка веднаш - таа '''чека''' на редот вметнат од
првата, бидејќи PostgreSQL мора прво да види дали првата ќе потврди или ќе се
врати. Дури по COMMIT-от на првата, втората паѓа.

Апликацијата затоа ја фаќа таа грешка и ја претвора во истата реченица која ја враќа
и проверката погоре, наместо студентот да добие 500:

{{{#!csharp
catch (DbUpdateException ex) when (IsUniqueViolation(ex))
{
    // Two enrolments for the same semester sent at the same time both
    // pass the check above, because each transaction reads the state
    // from before the other one wrote. UNIQUE (user_id, semester_id)
    // is what actually settles it, so the loser gets the same
    // sentence as if the check had caught it.
    await transaction.RollbackAsync();
    return Fail("You are already enrolled in that semester.");
}
catch
{
    await transaction.RollbackAsync();
    throw;
}

/// <summary>23505 is unique_violation.</summary>
private static bool IsUniqueViolation(DbUpdateException ex) =>
    ex.InnerException is PostgresException { SqlState: "23505" };
}}}

Значи проверката во апликацијата постои заради пораката, а ограничувањето во базата
заради точноста. Истиот принцип важи и за правилата од Фаза 7: апликацијата ги
проверува за да даде разбирлива порака, а базата ги чува за да важат и кога некој
пишува директно во неа.

== 2. Pooling

=== 2.1 Pool на конекции (Npgsql)

Како и кај Spring Boot, конекциите не се отвораат рачно. Npgsql има вграден pool
кој е вклучен стандардно, па {{{UseNpgsql(connectionString)}}} е доволно.

Стандардните вредности на Npgsql 9.0.4 (отчитани од
{{{NpgsqlConnectionStringBuilder}}}):

{{{
Pooling                     = True
Minimum Pool Size           = 0
Maximum Pool Size           = 100
Connection Idle Lifetime    = 300     (секунди)
Connection Pruning Interval = 10      (секунди)
Timeout                     = 15      (секунди, чекање на слободна конекција)
Command Timeout             = 30      (секунди)
Multiplexing                = False
}}}

Стандардните 100 конекции се премногу за оваа поставеност: серверот е споделен меѓу
сите проекти, а секоја конекција е уште еден канал низ SSH тунелот. Затоа pool-от е
ограничен во самиот connection string:

{{{#!json
"ConnectionStrings": {
  "DefaultConnection": "Host=localhost;Port=9999;Database=db_202526z_va_prj_know2026;Username=db_202526z_va_prj_iknow2026_owner;Password=REDACTED_ROTATE_ME;Search Path=project;Include Error Detail=true;Maximum Pool Size=10;Minimum Pool Size=1;Connection Idle Lifetime=300;Timeout=15"
}
}}}

 * '''Maximum Pool Size=10''' - горна граница на отворени конекции, исто како default-от на HikariCP
 * '''Minimum Pool Size=1''' - една конекција останува отворена, за тунелот да не мора да отвора нов канал за секое прво барање
 * '''Connection Idle Lifetime=300''' - неупотребените конекции над минимумот се затвораат по 5 минути
 * '''Timeout=15''' - ако сите 10 се зафатени, барањето чека најмногу 15 секунди пред да падне

=== 2.2 Pool на DbContext (EF Core)

Покрај конекциите, EF Core може да ги рециклира и самите DbContext објекти. Тоа е
одделен pool: {{{AddDbContextPool}}} ги чува инстанците на контекстот (со нивните
поставки и мапирања), додека Npgsql ги чува физичките конекции под нив.

{{{#!csharp
// AddDbContextPool reuses the DbContext instances themselves; the connections
// underneath them are pooled separately by Npgsql, sized in the connection
// string. Both matter here because every physical connection is one more
// channel through the SSH tunnel.
builder.Services.AddDbContextPool<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        npgsql =>
        {
            npgsql.MapEnum<UserRole>("user_role", AppDbContext.ProjectSchema, PgEnumLabels.UserRole);
            npgsql.MapEnum<HighSchoolType>("hs_type", AppDbContext.ProjectSchema, PgEnumLabels.Lowercase);
            npgsql.MapEnum<Quota>("quota_type", AppDbContext.ProjectSchema, PgEnumLabels.Lowercase);
            npgsql.MapEnum<sType>("semester_type", AppDbContext.ProjectSchema, PgEnumLabels.Lowercase);
            npgsql.MapEnum<Grade>("grade_type", AppDbContext.ProjectSchema, PgEnumLabels.Grade);
        }));
}}}

Ова е применливо бидејќи AppDbContext има само еден конструктор, оној кој прима
{{{DbContextOptions}}}. Контекст кој би примал сопствени зависности (на пример
тековниот корисник) не смее да се рециклира, бидејќи состојбата од едно барање би
протекла во следното.

=== 2.3 Мерење на pool-от

Мерено со апликацијата пуштена врз локална база со истата шема, со броење на
{{{pg_stat_activity}}}:

{{{#!sql
SELECT count(*) FROM pg_stat_activity WHERE datname = 'iknow';
}}}

{{{
состојба                                          отворени конекции
--------------------------------------------------------------------
по стартување и едно барање                              1
за време на 50 истовремени барања                       10
по завршување на барањата                               10
}}}

Првиот ред е Minimum Pool Size=1 - една конекција останува отворена. Вториот ред
покажува дека pool-от расте со оптоварувањето, но застанува точно на Maximum Pool
Size=10; останатите барања чекаат слободна конекција наместо да отворат нова.
Третиот ред покажува дека отворените конекции не се затвораат веднаш - тие остануваат
во pool-от и се затвораат дури по Connection Idle Lifetime, бидејќи повторното
отворање низ тунел е поскапо од држењето отворена конекција.

Истото може да се провери и од страната на тунелот - секоја нова конекција се гледа
како нов канал во логовите на тунел скриптата:

{{{
debug1: Connection to port 9999 forwarding to localhost port 5432 requested.
debug1: channel 2: new direct-tcpip [direct-tcpip] (inactive timeout: 0)
}}}

=== 2.4 Проверка дека апликацијата е поврзана

Контролерот DbHealth го враќа одговорот кој покажува дека тунелот, конекцијата и
мапирањето на ентитетите работат:

{{{#!json
{
  "connected": true,
  "server": "PostgreSQL 18.4 ... on x86_64-pc-linux-gnu, 64-bit",
  "counts": {
    "users": 8,
    "subjects": 20,
    "enrolledSemesters": 4,
    "semesterSubjects": 6,
    "passedSubjects": 4
  }
}
}}}

== Историјат

 '''Верзија 1''' - Прва верзија: трансакции во трите сценарија кои пишуваат во
 повеќе табели, обработка на конкурентни запишувања преку ограничувањето
 UNIQUE (user_id, semester_id), и конфигурација и мерење на pool-от на конекции и
 на DbContext.

== Статус

 ''' [[span(style=color: #FF8000, Во тек )]] '''
