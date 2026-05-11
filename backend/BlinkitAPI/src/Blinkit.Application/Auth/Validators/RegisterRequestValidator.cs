using Blinkit.Application.Auth.DTOs;
using FluentValidation;

namespace Blinkit.Application.Auth.Validators;

public class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.FullName).NotEmpty().MinimumLength(2);
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Phone).NotEmpty().Matches(@"^\d{10}$");
        RuleFor(x => x.Password).NotEmpty().MinimumLength(8);
    }
}
