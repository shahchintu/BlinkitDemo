using Blinkit.Application.Interfaces;
using Blinkit.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Blinkit.Application.Admin.Commands;

public record VariantInput(Guid? Id, string Unit, decimal Price, decimal? DiscountPrice, int StockQty, string ImageUrl, int DisplayOrder);
public record AttributeInput(string Key, string Value);

// ── Create Product ────────────────────────────────────────────────────────────
public record CreateProductCommand(
    string Name, Guid CategoryId, string Description,
    List<VariantInput> Variants, List<AttributeInput> Attributes,
    List<string> Tags, List<string> Images) : IRequest<Guid>;

public class CreateProductCommandHandler(IBlinkitDbContext db) : IRequestHandler<CreateProductCommand, Guid>
{
    public async Task<Guid> Handle(CreateProductCommand req, CancellationToken ct)
    {
        var id = Guid.NewGuid();
        var slug = Slugify(req.Name) + "-" + id.ToString("N")[..6];

        var product = new Product
        {
            Id = id, CategoryId = req.CategoryId, Name = req.Name,
            Slug = slug, Description = req.Description, IsActive = true,
        };
        await db.Products.AddAsync(product, ct);

        foreach (var (v, idx) in req.Variants.Select((v, i) => (v, i)))
            await db.ProductVariants.AddAsync(new ProductVariant
            {
                Id = v.Id ?? Guid.NewGuid(), ProductId = id, Unit = v.Unit, Price = v.Price,
                DiscountPrice = v.DiscountPrice, StockQty = v.StockQty,
                ImageUrl = v.ImageUrl, DisplayOrder = v.DisplayOrder > 0 ? v.DisplayOrder : idx + 1,
                IsActive = true,
            }, ct);

        foreach (var a in req.Attributes)
            await db.ProductAttributes.AddAsync(new ProductAttribute
                { Id = Guid.NewGuid(), ProductId = id, Key = a.Key, Value = a.Value }, ct);

        foreach (var tag in req.Tags)
            await db.ProductTags.AddAsync(new ProductTag
                { Id = Guid.NewGuid(), ProductId = id, Tag = tag }, ct);

        foreach (var (url, idx) in req.Images.Select((u, i) => (u, i)))
            await db.ProductImages.AddAsync(new ProductImage
                { Id = Guid.NewGuid(), ProductId = id, ImageUrl = url, DisplayOrder = idx }, ct);

        await db.SaveChangesAsync(ct);
        return id;
    }

    private static string Slugify(string s) =>
        System.Text.RegularExpressions.Regex.Replace(s.ToLowerInvariant(), @"[^a-z0-9]+", "-").Trim('-');
}

// ── Update Product ────────────────────────────────────────────────────────────
public record UpdateProductCommand(
    Guid Id, string Name, Guid CategoryId, string Description,
    List<VariantInput> Variants, List<AttributeInput> Attributes,
    List<string> Tags, List<string> Images) : IRequest;

public class UpdateProductCommandHandler(IBlinkitDbContext db) : IRequestHandler<UpdateProductCommand>
{
    public async Task Handle(UpdateProductCommand req, CancellationToken ct)
    {
        if (req.Variants.Count == 0)
            throw new InvalidOperationException("A product must have at least one variant.");

        var product = await db.Products
            .Include(p => p.Variants).Include(p => p.Attributes)
            .Include(p => p.Tags).Include(p => p.Images)
            .FirstOrDefaultAsync(p => p.Id == req.Id, ct)
            ?? throw new KeyNotFoundException("Product not found");

        product.Name = req.Name;
        product.CategoryId = req.CategoryId;
        product.Description = req.Description;

        // Keep existing variants that are still present in the request; remove the rest.
        // Guard: we already validated Variants.Count > 0 above, so we will never zero-out a product.
        var existingVariantIds = req.Variants.Where(v => v.Id.HasValue).Select(v => v.Id!.Value).ToList();
        var variantsToRemove = product.Variants.Where(v => !existingVariantIds.Contains(v.Id)).ToList();
        db.ProductVariants.RemoveRange(variantsToRemove);

        foreach (var (v, idx) in req.Variants.Select((v, i) => (v, i)))
        {
            if (v.Id.HasValue)
            {
                var existing = product.Variants.FirstOrDefault(ev => ev.Id == v.Id.Value);
                if (existing != null)
                {
                    existing.Unit = v.Unit; existing.Price = v.Price; existing.DiscountPrice = v.DiscountPrice;
                    existing.StockQty = v.StockQty; existing.ImageUrl = v.ImageUrl;
                    existing.DisplayOrder = v.DisplayOrder > 0 ? v.DisplayOrder : idx + 1;
                    continue;
                }
            }

            await db.ProductVariants.AddAsync(new ProductVariant
            {
                Id = v.Id ?? Guid.NewGuid(), ProductId = req.Id, Unit = v.Unit, Price = v.Price,
                DiscountPrice = v.DiscountPrice, StockQty = v.StockQty,
                ImageUrl = v.ImageUrl, DisplayOrder = v.DisplayOrder > 0 ? v.DisplayOrder : idx + 1,
                IsActive = true,
            }, ct);
        }

        db.ProductAttributes.RemoveRange(product.Attributes);
        foreach (var a in req.Attributes)
            await db.ProductAttributes.AddAsync(new ProductAttribute
                { Id = Guid.NewGuid(), ProductId = req.Id, Key = a.Key, Value = a.Value }, ct);

        db.ProductTags.RemoveRange(product.Tags);
        foreach (var tag in req.Tags.Distinct())
            await db.ProductTags.AddAsync(new ProductTag
                { Id = Guid.NewGuid(), ProductId = req.Id, Tag = tag }, ct);

        db.ProductImages.RemoveRange(product.Images);
        foreach (var (url, idx) in req.Images.Distinct().Select((u, i) => (u, i)))
            await db.ProductImages.AddAsync(new ProductImage
                { Id = Guid.NewGuid(), ProductId = req.Id, ImageUrl = url, DisplayOrder = idx }, ct);

        await db.SaveChangesAsync(ct);
    }
}

// ── Delete Product (soft) ─────────────────────────────────────────────────────
public record DeleteProductCommand(Guid Id) : IRequest;

public class DeleteProductCommandHandler(IBlinkitDbContext db) : IRequestHandler<DeleteProductCommand>
{
    public async Task Handle(DeleteProductCommand req, CancellationToken ct)
    {
        var product = await db.Products.Include(p => p.Variants)
            .FirstOrDefaultAsync(p => p.Id == req.Id, ct)
            ?? throw new KeyNotFoundException("Product not found");
        product.IsDeleted = true;
        product.IsActive = false;
        foreach (var v in product.Variants) v.IsActive = false;
        await db.SaveChangesAsync(ct);
    }
}

// ── Toggle Product Active ─────────────────────────────────────────────────────
public record ToggleProductActiveCommand(Guid Id) : IRequest;

public class ToggleProductActiveCommandHandler(IBlinkitDbContext db) : IRequestHandler<ToggleProductActiveCommand>
{
    public async Task Handle(ToggleProductActiveCommand req, CancellationToken ct)
    {
        var product = await db.Products.FindAsync([req.Id], ct)
            ?? throw new KeyNotFoundException("Product not found");
        product.IsActive = !product.IsActive;
        await db.SaveChangesAsync(ct);
    }
}

// ── Variant Commands ──────────────────────────────────────────────────────────
public record AddVariantCommand(Guid ProductId, VariantInput Variant) : IRequest<Guid>;

public class AddVariantCommandHandler(IBlinkitDbContext db) : IRequestHandler<AddVariantCommand, Guid>
{
    public async Task<Guid> Handle(AddVariantCommand req, CancellationToken ct)
    {
        var id = Guid.NewGuid();
        await db.ProductVariants.AddAsync(new ProductVariant
        {
            Id = id, ProductId = req.ProductId, Unit = req.Variant.Unit,
            Price = req.Variant.Price, DiscountPrice = req.Variant.DiscountPrice,
            StockQty = req.Variant.StockQty, ImageUrl = req.Variant.ImageUrl,
            DisplayOrder = req.Variant.DisplayOrder, IsActive = true,
        }, ct);
        await db.SaveChangesAsync(ct);
        return id;
    }
}

public record UpdateVariantCommand(Guid VariantId, VariantInput Variant) : IRequest;

public class UpdateVariantCommandHandler(IBlinkitDbContext db) : IRequestHandler<UpdateVariantCommand>
{
    public async Task Handle(UpdateVariantCommand req, CancellationToken ct)
    {
        var v = await db.ProductVariants.FindAsync([req.VariantId], ct)
            ?? throw new KeyNotFoundException("Variant not found");
        v.Unit = req.Variant.Unit; v.Price = req.Variant.Price;
        v.DiscountPrice = req.Variant.DiscountPrice; v.StockQty = req.Variant.StockQty;
        v.ImageUrl = req.Variant.ImageUrl; v.DisplayOrder = req.Variant.DisplayOrder;
        await db.SaveChangesAsync(ct);
    }
}

public record DeleteVariantCommand(Guid VariantId) : IRequest;

public class DeleteVariantCommandHandler(IBlinkitDbContext db) : IRequestHandler<DeleteVariantCommand>
{
    public async Task Handle(DeleteVariantCommand req, CancellationToken ct)
    {
        var v = await db.ProductVariants.FindAsync([req.VariantId], ct)
            ?? throw new KeyNotFoundException("Variant not found");
        v.IsActive = false;
        await db.SaveChangesAsync(ct);
    }
}

public record ReorderVariantItem(Guid VariantId, int DisplayOrder);
public record ReorderVariantsCommand(Guid ProductId, List<ReorderVariantItem> Items) : IRequest;

public class ReorderVariantsCommandHandler(IBlinkitDbContext db) : IRequestHandler<ReorderVariantsCommand>
{
    public async Task Handle(ReorderVariantsCommand req, CancellationToken ct)
    {
        var ids = req.Items.Select(i => i.VariantId).ToList();
        var variants = await db.ProductVariants
            .Where(v => ids.Contains(v.Id) && v.ProductId == req.ProductId)
            .ToListAsync(ct);
        foreach (var item in req.Items)
        {
            var v = variants.FirstOrDefault(v => v.Id == item.VariantId);
            if (v is not null) v.DisplayOrder = item.DisplayOrder;
        }
        await db.SaveChangesAsync(ct);
    }
}
