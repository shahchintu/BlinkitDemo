namespace Blinkit.API.Middleware;

public sealed class GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception for {Path}", context.Request.Path);
            await WriteErrorResponse(context, ex);
        }
    }

    private static async Task WriteErrorResponse(HttpContext context, Exception ex)
    {
        var (statusCode, message) = ex switch
        {
            UnauthorizedAccessException => (StatusCodes.Status401Unauthorized, "Unauthorized"),
            KeyNotFoundException => (StatusCodes.Status404NotFound, ex.Message),
            ArgumentException => (StatusCodes.Status400BadRequest, ex.Message),
            ApplicationException ae when ae.Message is "Email already in use" => (StatusCodes.Status409Conflict, ae.Message),
            ApplicationException ae when ae.Message is "Invalid credentials" or "Invalid refresh token" => (StatusCodes.Status401Unauthorized, ae.Message),
            ApplicationException => (StatusCodes.Status400BadRequest, ex.Message),
            _ => (StatusCodes.Status500InternalServerError, "An unexpected error occurred")
        };

        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/json";

        await context.Response.WriteAsJsonAsync(new
        {
            statusCode,
            message,
            path = context.Request.Path.Value,
            timestamp = DateTime.UtcNow
        });
    }
}
