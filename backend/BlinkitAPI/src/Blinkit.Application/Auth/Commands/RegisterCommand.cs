using Blinkit.Application.Auth.DTOs;
using MediatR;

namespace Blinkit.Application.Auth.Commands;

public record RegisterCommand(string FullName, string Email, string Phone, string Password) : IRequest<AuthResponse>;
