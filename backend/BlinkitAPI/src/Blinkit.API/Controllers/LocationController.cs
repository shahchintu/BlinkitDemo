using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Blinkit.API.Controllers;

public record LocationResponse(
    string City,
    string State,
    string Pincode,
    string Area,
    string FullAddress,
    bool IsServiceable);

[ApiController]
[Route("api/location")]
[AllowAnonymous]
public class LocationController(IHttpClientFactory httpClientFactory) : ControllerBase
{
    private static readonly LocationResponse Fallback = new(
        City: "Ahmedabad",
        State: "Gujarat",
        Pincode: "380001",
        Area: "Select Location",
        FullAddress: "Ahmedabad, Gujarat",
        IsServiceable: true);

    [HttpGet("reverse")]
    public async Task<IActionResult> ReverseGeocode(
        [FromQuery] double lat,
        [FromQuery] double lng,
        CancellationToken ct)
    {
        try
        {
            var client = httpClientFactory.CreateClient("Nominatim");
            var url = $"reverse?format=json&lat={lat}&lon={lng}&addressdetails=1";
            var response = await client.GetAsync(url, ct);

            if (!response.IsSuccessStatusCode)
                return Ok(Fallback);

            var json = await response.Content.ReadAsStringAsync(ct);
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            if (!root.TryGetProperty("address", out var address))
                return Ok(Fallback);

            var result = ParseAddress(address);
            return Ok(result);
        }
        catch
        {
            return Ok(Fallback);
        }
    }

    [HttpGet("pincode")]
    public async Task<IActionResult> LookupPincode(
        [FromQuery] string code,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(code) || code.Length != 6 || !code.All(char.IsDigit))
            return BadRequest(new { message = "Invalid pincode" });

        try
        {
            var client = httpClientFactory.CreateClient("Nominatim");
            var url = $"search?postalcode={code}&country=India&format=json&addressdetails=1&limit=1";
            var response = await client.GetAsync(url, ct);

            if (!response.IsSuccessStatusCode)
                return BadRequest(new { message = "Pincode not found" });

            var json = await response.Content.ReadAsStringAsync(ct);
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            if (root.ValueKind != JsonValueKind.Array || root.GetArrayLength() == 0)
                return BadRequest(new { message = "Pincode not found" });

            var first = root[0];
            if (!first.TryGetProperty("address", out var address))
                return BadRequest(new { message = "Pincode not found" });

            var result = ParseAddress(address, code);
            return Ok(result);
        }
        catch
        {
            return BadRequest(new { message = "Pincode not found" });
        }
    }

    private static LocationResponse ParseAddress(JsonElement address, string? knownPincode = null)
    {
        string Get(params string[] keys)
        {
            foreach (var key in keys)
                if (address.TryGetProperty(key, out var val) && val.ValueKind == JsonValueKind.String)
                {
                    var s = val.GetString();
                    if (!string.IsNullOrWhiteSpace(s)) return s;
                }
            return string.Empty;
        }

        var city = Get("city", "town", "county");
        var state = Get("state");
        var pincode = knownPincode ?? Get("postcode");
        var area = Get("suburb", "neighbourhood", "road");

        var addressParts = new[] { area, city, state, pincode }
            .Where(s => !string.IsNullOrWhiteSpace(s));
        var fullAddress = string.Join(", ", addressParts);
        if (string.IsNullOrWhiteSpace(fullAddress))
            fullAddress = Fallback.FullAddress;

        return new LocationResponse(
            City: string.IsNullOrWhiteSpace(city) ? Fallback.City : city,
            State: string.IsNullOrWhiteSpace(state) ? Fallback.State : state,
            Pincode: string.IsNullOrWhiteSpace(pincode) ? Fallback.Pincode : pincode,
            Area: string.IsNullOrWhiteSpace(area) ? "Select Location" : area,
            FullAddress: fullAddress,
            IsServiceable: true);
    }
}
