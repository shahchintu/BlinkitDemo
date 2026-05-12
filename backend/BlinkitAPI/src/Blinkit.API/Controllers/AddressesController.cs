using System.Security.Claims;
using Blinkit.Application.Interfaces;
using Blinkit.Application.Orders.DTOs;
using Blinkit.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Blinkit.API.Controllers;

[ApiController, Route("api/[controller]"), Authorize]
public sealed class AddressesController(IBlinkitDbContext db) : ControllerBase
{
    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new UnauthorizedAccessException());

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var addresses = await db.Addresses
            .Where(a => a.UserId == UserId)
            .OrderByDescending(a => a.IsDefault)
            .Select(a => new AddressDto
            {
                Id = a.Id,
                Label = a.Label,
                Street = a.Street,
                City = a.City,
                Pincode = a.Pincode,
                Lat = a.Lat,
                Lng = a.Lng,
                IsDefault = a.IsDefault,
            })
            .ToListAsync(ct);

        return Ok(addresses);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] UpsertAddressRequest request, CancellationToken ct)
    {
        var hasExisting = await db.Addresses.AnyAsync(a => a.UserId == UserId, ct);
        var address = new Address
        {
            Id = Guid.NewGuid(),
            UserId = UserId,
            Label = request.Label,
            Street = request.Street,
            City = request.City,
            Pincode = request.Pincode,
            Lat = request.Lat,
            Lng = request.Lng,
            IsDefault = !hasExisting,
        };

        await db.Addresses.AddAsync(address, ct);
        await db.SaveChangesAsync(ct);

        return CreatedAtAction(nameof(GetAll), new AddressDto
        {
            Id = address.Id,
            Label = address.Label,
            Street = address.Street,
            City = address.City,
            Pincode = address.Pincode,
            Lat = address.Lat,
            Lng = address.Lng,
            IsDefault = address.IsDefault,
        });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpsertAddressRequest request, CancellationToken ct)
    {
        var address = await db.Addresses.FirstOrDefaultAsync(a => a.Id == id && a.UserId == UserId, ct);
        if (address is null) return NotFound();

        address.Label = request.Label;
        address.Street = request.Street;
        address.City = request.City;
        address.Pincode = request.Pincode;
        address.Lat = request.Lat;
        address.Lng = request.Lng;

        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var address = await db.Addresses.FirstOrDefaultAsync(a => a.Id == id && a.UserId == UserId, ct);
        if (address is null) return NotFound();

        db.Addresses.Remove(address);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpPatch("{id:guid}/set-default")]
    public async Task<IActionResult> SetDefault(Guid id, CancellationToken ct)
    {
        var addresses = await db.Addresses.Where(a => a.UserId == UserId).ToListAsync(ct);
        var target = addresses.FirstOrDefault(a => a.Id == id);
        if (target is null) return NotFound();

        foreach (var a in addresses) a.IsDefault = (a.Id == id);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }
}

public record UpsertAddressRequest(string Label, string Street, string City, string Pincode,
    decimal? Lat = null, decimal? Lng = null);
