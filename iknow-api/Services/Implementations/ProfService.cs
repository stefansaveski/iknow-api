using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BCrypt.Net;
using iknow_api.Services;
using iknow_api.Models;
using iknow_api.DTOs;
using iknow_api.Repositories;
using Microsoft.IdentityModel.Tokens;
using iknow_api.Data;
using Microsoft.EntityFrameworkCore;

namespace iknow_api.Services
{
    public class ProfService : IProfService
    {
        private readonly IProfRepository _repo;

        public ProfService(IProfRepository repo)
        {
            _repo = repo;
        }

        public async Task addGrade(AddGrade addGrade)
        {
            if (addGrade == null) throw new ArgumentNullException(nameof(addGrade));
            if (addGrade.grade < 6 || addGrade.grade > 10) throw new ArgumentOutOfRangeException(nameof(addGrade.grade));
            await _repo.AddGrade(addGrade);
        }

        public async Task changeGrade(int profId, int gradeId)
        {
            if (gradeId < 6 || gradeId > 10) throw new ArgumentOutOfRangeException(nameof(gradeId));
            await _repo.ChangeGrade(profId, gradeId);
        }

        public async Task deleteGrade(int gradId)
        {
            await _repo.DeleteGrade(gradId);
        }

        public async Task<List<SubjectsAndUsers>> getSubjectsAndUsers(int ProfId)
        {
            return await _repo.GetSubjectsAndUsers(ProfId);
        }
    }
}