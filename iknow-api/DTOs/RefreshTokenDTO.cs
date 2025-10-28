namespace iknow_api.DTOs
{
    public class VerifyRefreshTokenDto
    {
        public string token { get; set; }
    }
    public class AuthResultDto
    {
        public string AccessToken { get; set; } = string.Empty;
        public string? RefreshToken { get; set; }
    }
}