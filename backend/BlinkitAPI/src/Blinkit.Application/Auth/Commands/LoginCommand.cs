using Blinkit.Application.Auth.DTOs;
using MediatR;

namespace Blinkit.Application.Auth.Commands;

public record LoginCommand(string Email, string Password) : IRequest<AuthCommandResult>;
