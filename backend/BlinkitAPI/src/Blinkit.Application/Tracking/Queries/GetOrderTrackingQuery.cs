using Blinkit.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Blinkit.Application.Tracking.Queries;

public record DarkStoreInfo(string Name, string Address, decimal Lat, decimal Lng);
public record DeliveryPartnerInfo(string Name, string Phone, decimal Lat, decimal Lng, string InitialsAvatar);
public record CustomerLocationInfo(decimal Lat, decimal Lng, string Address);

public record OrderTrackingDto(
    Guid OrderId,
    string Status,
    int EstimatedMinutes,
    DarkStoreInfo? DarkStore,
    DeliveryPartnerInfo? DeliveryPartner,
    CustomerLocationInfo? CustomerLocation,
    DateTime PlacedAt,
    int ElapsedSeconds);

public record GetOrderTrackingQuery(Guid OrderId, string UserId) : IRequest<OrderTrackingDto>;

public class GetOrderTrackingQueryHandler(IBlinkitDbContext db)
    : IRequestHandler<GetOrderTrackingQuery, OrderTrackingDto>
{
    public async Task<OrderTrackingDto> Handle(GetOrderTrackingQuery request, CancellationToken ct)
    {
        var order = await db.Orders
            .Include(o => o.DarkStore)
            .Include(o => o.Address)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, ct)
            ?? throw new KeyNotFoundException("Order not found");

        if (order.UserId.ToString() != request.UserId)
            throw new UnauthorizedAccessException();

        var elapsed = (DateTime.UtcNow - order.CreatedAt).TotalSeconds;
        var totalSeconds = 8 * 60.0;
        var progress = Math.Min(elapsed / totalSeconds, 1.0);

        var customerLat = order.Address.Lat ?? 23.0225m;
        var customerLng = order.Address.Lng ?? 72.5714m;

        DeliveryPartnerInfo? partner = null;
        DarkStoreInfo? storeInfo = null;

        if (order.DarkStore is not null)
        {
            storeInfo = new DarkStoreInfo(
                order.DarkStore.Name,
                order.DarkStore.Address,
                order.DarkStore.Lat,
                order.DarkStore.Lng);

            var partnerLat = order.DarkStore.Lat + (decimal)progress * (customerLat - order.DarkStore.Lat);
            var partnerLng = order.DarkStore.Lng + (decimal)progress * (customerLng - order.DarkStore.Lng);

            // small jitter for realism
            partnerLat += (decimal)((Random.Shared.NextDouble() - 0.5) * 0.001);
            partnerLng += (decimal)((Random.Shared.NextDouble() - 0.5) * 0.001);

            var name = order.DeliveryPartnerName ?? "Delivery Partner";
            partner = new DeliveryPartnerInfo(
                name,
                order.DeliveryPartnerPhone ?? "",
                partnerLat,
                partnerLng,
                name[0].ToString().ToUpper());
        }

        var customerLocation = new CustomerLocationInfo(
            customerLat,
            customerLng,
            $"{order.Address.Street}, {order.Address.City}");

        var estimatedMinutes = Math.Max(0, 8 - (int)(elapsed / 60));

        return new OrderTrackingDto(
            order.Id,
            order.Status.ToString(),
            estimatedMinutes,
            storeInfo,
            partner,
            customerLocation,
            order.CreatedAt,
            (int)elapsed);
    }
}
