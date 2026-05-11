using System.Security.Claims;
using Blinkit.Application.Auth.Commands;
using Blinkit.Application.Auth.DTOs;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Blinkit.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(IMediator mediator) : ControllerBase
{
    [AllowAnonymous]
    [HttpPost("register")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var result = await mediator.Send(new RegisterCommand(request.FullName, request.Email, request.Phone, request.Password));
        return StatusCode(StatusCodes.Status201Created, result);
    }

    [AllowAnonymous]
    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var result = await mediator.Send(new LoginCommand(request.Email, request.Password));

        AppendRefreshCookie(result.RefreshToken);

        return Ok(result.Auth);
    }

    [AllowAnonymous]
    [HttpPost("refresh")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Refresh()
    {
        var refreshToken = Request.Cookies["refreshToken"];
        if (string.IsNullOrEmpty(refreshToken))
            return Unauthorized(new { message = "No refresh token" });

        var result = await mediator.Send(new RefreshTokenCommand(refreshToken));

        AppendRefreshCookie(result.RefreshToken);

        return Ok(result.Auth);
    }

    [Authorize]
    [HttpPost("logout")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Logout()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        await mediator.Send(new LogoutCommand(userId));

        Response.Cookies.Delete("refreshToken");

        return NoContent();
    }

    [Authorize]
    [HttpGet("me")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public IActionResult Me()
    {
        var id = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var email = User.FindFirstValue(ClaimTypes.Email)!;
        var fullName = User.FindFirstValue("fullName") ?? string.Empty;
        var role = User.FindFirstValue(ClaimTypes.Role) ?? "User";

        return Ok(new { id, email, fullName, role });
    }

    private void AppendRefreshCookie(string token)
    {
        Response.Cookies.Append("refreshToken", token, new CookieOptions
        {
            HttpOnly = true,
            SameSite = SameSiteMode.Strict,
            Secure = true,
            Expires = DateTimeOffset.UtcNow.AddDays(7)
        });
    }
}
