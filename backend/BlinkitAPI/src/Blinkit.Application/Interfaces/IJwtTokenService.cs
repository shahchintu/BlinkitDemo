using System.Security.Claims;
using Blinkit.Domain.Entities;

namespace Blinkit.Application.Interfaces;

public interface IJwtTokenService
{
    string GenerateAccessToken(AppUser user, IList<string> roles);
    string GenerateRefreshToken();
    ClaimsPrincipal GetPrincipalFromExpiredToken(string token);
}
