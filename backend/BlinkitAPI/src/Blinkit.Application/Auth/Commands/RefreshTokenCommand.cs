using Blinkit.Application.Auth.DTOs;
using MediatR;

namespace Blinkit.Application.Auth.Commands;

public record RefreshTokenCommand(string RefreshToken) : IRequest<AuthCommandResult>;
