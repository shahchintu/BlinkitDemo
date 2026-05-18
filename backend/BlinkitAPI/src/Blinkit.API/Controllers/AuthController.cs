using System.Security.Claims;
using Blinkit.Application.Auth.Commands;
using Blinkit.Application.Auth.DTOs;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Blinkit.API.Controllers;

/// <summary>
/// Handles user registration, login, token refresh, and logout.
/// Access tokens (15 min) are returned in the response body.
/// Refresh tokens (7 days) are set as httpOnly cookies.
/// </summary>
[ApiController]
[Route("api/auth")]
public class AuthController(IMediator mediator) : ControllerBase
{
    /// <summary>
    /// Register a new user. Returns 201 with access token on success,
    /// 409 if the email is already taken.
    /// </summary>
    [AllowAnonymous]
    [HttpPost("register")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var result = await mediator.Send(new RegisterCommand(request.FullName, request.Email, request.Phone, request.Password));
        return StatusCode(StatusCodes.Status201Created, result);
    }

    /// <summary>Authenticate with email/password. Sets httpOnly refreshToken cookie.</summary>
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

    /// <summary>Reissue an access token from the httpOnly refresh cookie. Rotates the refresh token.</summary>
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

    /// <summary>Revoke the refresh token and clear the cookie. Angular calls this with a 3-second timeout.</summary>
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

    /// <summary>Reset a user's password directly (no email verification — demo flow).</summary>
    [AllowAnonymous]
    [HttpPost("reset-password")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        try
        {
            await mediator.Send(new ResetPasswordCommand(request.Email, request.NewPassword, request.ConfirmPassword));
            return Ok(new { message = "Password reset successfully" });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (ApplicationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
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
