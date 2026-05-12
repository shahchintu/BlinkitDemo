using Blinkit.Application.Interfaces;
using Blinkit.Domain.Entities;
using MediatR;

namespace Blinkit.Application.Admin.Commands;

public record CreateCouponCommand(
    string Code, string DiscountType, decimal DiscountValue,
    decimal MinOrderAmount, decimal? MaxDiscountAmount,
    string ValidFor, int? MaxUsage) : IRequest<Guid>;

public class CreateCouponCommandHandler(IBlinkitDbContext db) : IRequestHandler<CreateCouponCommand, Guid>
{
    public async Task<Guid> Handle(CreateCouponCommand req, CancellationToken ct)
    {
        var id = Guid.NewGuid();
        await db.Coupons.AddAsync(new Coupon
        {
            Id = id,
            Code = req.Code.ToUpperInvariant(),
            DiscountType = Enum.Parse<DiscountType>(req.DiscountType),
            DiscountValue = req.DiscountValue,
            MinOrderAmount = req.MinOrderAmount,
            MaxDiscountAmount = req.MaxDiscountAmount,
            ValidFor = Enum.Parse<CouponValidFor>(req.ValidFor),
            MaxUsage = req.MaxUsage,
            IsActive = true,
        }, ct);
        await db.SaveChangesAsync(ct);
        return id;
    }
}

public record UpdateCouponCommand(
    Guid Id, string Code, string DiscountType, decimal DiscountValue,
    decimal MinOrderAmount, decimal? MaxDiscountAmount,
    string ValidFor, int? MaxUsage) : IRequest;

public class UpdateCouponCommandHandler(IBlinkitDbContext db) : IRequestHandler<UpdateCouponCommand>
{
    public async Task Handle(UpdateCouponCommand req, CancellationToken ct)
    {
        var coupon = await db.Coupons.FindAsync([req.Id], ct)
            ?? throw new KeyNotFoundException("Coupon not found");
        coupon.Code = req.Code.ToUpperInvariant();
        coupon.DiscountType = Enum.Parse<DiscountType>(req.DiscountType);
        coupon.DiscountValue = req.DiscountValue;
        coupon.MinOrderAmount = req.MinOrderAmount;
        coupon.MaxDiscountAmount = req.MaxDiscountAmount;
        coupon.ValidFor = Enum.Parse<CouponValidFor>(req.ValidFor);
        coupon.MaxUsage = req.MaxUsage;
        await db.SaveChangesAsync(ct);
    }
}

public record ToggleCouponActiveCommand(Guid Id) : IRequest;

public class ToggleCouponActiveCommandHandler(IBlinkitDbContext db) : IRequestHandler<ToggleCouponActiveCommand>
{
    public async Task Handle(ToggleCouponActiveCommand req, CancellationToken ct)
    {
        var coupon = await db.Coupons.FindAsync([req.Id], ct)
            ?? throw new KeyNotFoundException("Coupon not found");
        coupon.IsActive = !coupon.IsActive;
        await db.SaveChangesAsync(ct);
    }
}
