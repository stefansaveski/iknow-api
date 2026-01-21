using iknow_api.DTOs;
using iknow_api.Models;
namespace iknow_api.Services
{
    public interface IProfService
    {
       Task<List<SubjectsAndUsers>> getSubjectsAndUsers(int ProfId);
       Task addGrade(AddGrade addGrade);
       Task changeGrade(int profId, int gradeId);
       Task deleteGrade(int gradId);
    }
}