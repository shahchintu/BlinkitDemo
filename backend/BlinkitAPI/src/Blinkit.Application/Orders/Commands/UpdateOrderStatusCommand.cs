using Blinkit.Application.Interfaces;
using Blinkit.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Blinkit.Application.Orders.Commands;

public record UpdateOrderStatusCommand(Guid OrderId, string NewStatus) : IRequest;

public class UpdateOrderStatusCommandHandler(IBlinkitDbContext db) : IRequestHandler<UpdateOrderStatusCommand>
{
    public async Task Handle(UpdateOrderStatusCommand request, CancellationToken ct)
    {
        var order = await db.Orders
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, ct)
            ?? throw new KeyNotFoundException("Order not found");

        if (!Enum.TryParse<OrderStatus>(request.NewStatus, out var newStatus))
            throw new ArgumentException($"Invalid status: {request.NewStatus}");

        order.Status = newStatus;
        await db.SaveChangesAsync(ct);
    }
}
