using System.Text;
using Blinkit.API.Middleware;
using Blinkit.Application.Auth.Commands;
using Blinkit.Application.Interfaces;
using Blinkit.Domain.Entities;
using Blinkit.Infrastructure.Data;
using Blinkit.Infrastructure.Email;
using Blinkit.Infrastructure.Payment;
using Blinkit.Infrastructure.Repositories;
using Blinkit.Infrastructure.Services;
using Microsoft.AspNetCore.Http.Features;
using Resend;
using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;
using StackExchange.Redis;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// DbContext
builder.Services.AddDbContext<BlinkitDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("Default")));

// Identity
builder.Services.AddIdentity<AppUser, IdentityRole>(options =>
{
    options.Password.RequiredLength = 8;
    options.Password.RequireNonAlphanumeric = false;
    options.User.RequireUniqueEmail = true;
})
.AddEntityFrameworkStores<BlinkitDbContext>()
.AddDefaultTokenProviders();

// Redis distributed cache
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetConnectionString("Redis")
        ?? "localhost:6379";
});

// MediatR
builder.Services.AddMediatR(cfg =>
    cfg.RegisterServicesFromAssembly(typeof(RegisterCommandHandler).Assembly));

// FluentValidation
builder.Services.AddValidatorsFromAssembly(typeof(RegisterCommandHandler).Assembly);

// Services
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddScoped<IRedisCartService, RedisCartService>();
builder.Services.AddScoped<ICouponRepository, CouponRepository>();
builder.Services.AddScoped<IRazorpayService, RazorpayService>();
builder.Services.AddScoped<IEmailService, ResendEmailService>();
builder.Services.AddScoped<IUnsplashService, UnsplashService>();
builder.Services.AddScoped<IImageUploadService, ImageUploadService>();
builder.Services.AddScoped<IBlinkitDbContext>(sp => sp.GetRequiredService<BlinkitDbContext>());

// Task 7: Allow up to 10 MB multipart uploads
builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 10 * 1024 * 1024;
});
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 10 * 1024 * 1024;
});

builder.Services.AddHttpClient("Unsplash");
builder.Services.AddHttpClient("Pexels");
builder.Services.AddHttpClient("Nominatim", client =>
{
    client.BaseAddress = new Uri("https://nominatim.openstreetmap.org/");
    client.DefaultRequestHeaders.Add("User-Agent", "BlinkitCloneApp/1.0");
});

builder.Services.AddSingleton<IConnectionMultiplexer>(_ =>
    ConnectionMultiplexer.Connect(
        builder.Configuration["Redis:ConnectionString"] ?? "localhost:6379"));

// Resend email
builder.Services.AddOptions<ResendClientOptions>()
    .Configure<IConfiguration>((opt, cfg) =>
        opt.ApiToken = cfg["Resend:ApiKey"] ?? string.Empty);

// Warn at startup if email is not configured
if (string.IsNullOrWhiteSpace(builder.Configuration["Resend:ApiKey"]))
    Console.Error.WriteLine("⚠️  Resend:ApiKey is not configured — order confirmation emails will not be sent.");
builder.Services.AddHttpClient<ResendClient>();
builder.Services.AddTransient<IResend>(sp => sp.GetRequiredService<ResendClient>());

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

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
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

builder.Services.AddAuthorization(opts =>
    opts.AddPolicy("AdminOnly", p => p.RequireRole("Admin")));

var app = builder.Build();

// OpenAPI + Scalar
app.UseSwagger();
app.UseSwaggerUI();

// Migrate DB + seed
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<BlinkitDbContext>();
    await db.Database.MigrateAsync();

    var userManager  = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();
    var roleManager  = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();

    if (!await db.Categories.IgnoreQueryFilters().AnyAsync())
        await SeedData.SeedAsync(db, userManager, roleManager);
    else
    {
        // Always ensure roles and admin user exist even if products are already seeded
        foreach (var role in new[] { "Admin", "User" })
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole(role));

        // Seed products for categories that have none (runs once per missing category).
        await SeedData.SeedMissingCategoryProductsAsync(db);

        // Data-fix: ensure every active product has at least one active variant.
        // Products with zero variants break the Angular ADD button (variants[0] is falsy).
        await SeedData.FixZeroVariantProductsAsync(db);
    }

    // Always run data-fix to resolve inverted prices
    await SeedData.FixInvertedPricesAsync(db);
}

// Global exception handler — must be first
app.UseMiddleware<GlobalExceptionMiddleware>();

app.MapScalarApiReference(options =>
{
    options.Title = "Blinkit API";
    options.Theme = ScalarTheme.Purple;
});

app.UseStaticFiles(); // serves wwwroot/uploads/* at /uploads/*
app.UseHttpsRedirection();
app.UseCors("BlinkitCors");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
