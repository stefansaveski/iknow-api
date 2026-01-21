using iknow_api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace iknow_api.Repositories
{
    public interface IProfRepository
    {
        Task AddGrade(AddGrade grade);
        Task ChangeGrade(int id, int gradeId);
        Task DeleteGrade(int id);
        Task<List<SubjectsAndUsers>> GetSubjectsAndUsers(int profId);
    }
}