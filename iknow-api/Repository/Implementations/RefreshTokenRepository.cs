using iknow_api.Models;
using iknow_api.Data;
using iknow_api.Models;
using Microsoft.EntityFrameworkCore;
using iknow_api.Services;
using iknow_api.DTOs;

namespace iknow_api.Repositories
{
    public class RefreshTokenRepository : IRefreshTokenRepository
    {
        private readonly AppDbContext _context;

        public RefreshTokenRepository(AppDbContext context)
        {
            _context = context;
        }
        
        public async Task AddTokenAsync(RefreshToken refreshToken)
        {
             _context.RefreshToken.Add(refreshToken);
            await _context.SaveChangesAsync();
        }

        public Task<bool> DeleteTokenAsync(string refreshTokenDto)
        {
            throw new NotImplementedException();
        }


        public async Task<bool> VerifyTokenAsync(VerifyRefreshTokenDto refreshTokenDto)
        {
             return await _context.RefreshToken
            .AnyAsync(rt => rt.Token == refreshTokenDto.token && !rt.IsValid && rt.ExpiresAt > DateTime.UtcNow);
        }
    }
}