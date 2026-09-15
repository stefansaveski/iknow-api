using iknow_api.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace iknow_api.Controllers;

[ApiController]
[Route("[controller]")]
public class DbHealthController(AppDbContext db) : ControllerBase
{
    /// <summary>
    /// Verifies that the SSH tunnel is up, the DB credentials work, and that
    /// the entity mapping matches the schema created by sql/ddl.sql.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        try
        {
            // EF projects SqlQuery onto a column named "Value", hence the alias.
            var version = await db.Database
                .SqlQuery<string>($"SELECT version() AS \"Value\"")
                .SingleAsync();

            return Ok(new
            {
                connected = true,
                server = version,
                counts = new
                {
                    users = await db.User.CountAsync(),
                    subjects = await db.Subjects.CountAsync(),
                    enrolledSemesters = await db.EnrolledSemesters.CountAsync(),
                    semesterSubjects = await db.SemesterSubjects.CountAsync(),
                    passedSubjects = await db.PassedSubjects.CountAsync(),
                }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(503, new
            {
                connected = false,
                error = ex.Message,
                hint = "Is tunnel_scripta.cmd running and listening on localhost:9999?"
            });
        }
    }
}
