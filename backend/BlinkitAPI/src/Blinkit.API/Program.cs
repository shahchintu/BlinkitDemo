using System.Text;
using Blinkit.API.Middleware;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// CORS — Angular dev server
builder.Services.AddCors(options =>
{
    options.AddPolicy("BlinkitCors", policy =>
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials());
});

// JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("Jwt:Key is not configured");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audience"],
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

// Global exception handler — must be first
app.UseMiddleware<GlobalExceptionMiddleware>();

// OpenAPI + Scalar
app.UseSwagger();
app.UseSwaggerUI();
app.MapScalarApiReference(options =>
{
    options.Title = "Blinkit API";
    options.Theme = ScalarTheme.Purple;
});

app.UseHttpsRedirection();
app.UseCors("BlinkitCors");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
