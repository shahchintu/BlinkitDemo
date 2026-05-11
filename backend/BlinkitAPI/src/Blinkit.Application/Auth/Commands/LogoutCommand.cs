using MediatR;

namespace Blinkit.Application.Auth.Commands;

public record LogoutCommand(string UserId) : IRequest;
