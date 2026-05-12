using Blinkit.Application.Interfaces;
using Blinkit.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Blinkit.Application.Admin.Commands;

public record CreateCategoryCommand(string Name, string Slug, string IconUrl, int DisplayOrder) : IRequest<Guid>;

public class CreateCategoryCommandHandler(IBlinkitDbContext db) : IRequestHandler<CreateCategoryCommand, Guid>
{
    public async Task<Guid> Handle(CreateCategoryCommand req, CancellationToken ct)
    {
        var id = Guid.NewGuid();
        await db.Categories.AddAsync(new Category
        {
            Id = id, Name = req.Name, Slug = req.Slug,
            IconUrl = req.IconUrl, DisplayOrder = req.DisplayOrder, IsActive = true,
        }, ct);
        await db.SaveChangesAsync(ct);
        return id;
    }
}

public record UpdateCategoryCommand(Guid Id, string Name, string Slug, string IconUrl, int DisplayOrder) : IRequest;

public class UpdateCategoryCommandHandler(IBlinkitDbContext db) : IRequestHandler<UpdateCategoryCommand>
{
    public async Task Handle(UpdateCategoryCommand req, CancellationToken ct)
    {
        var cat = await db.Categories.FindAsync([req.Id], ct)
            ?? throw new KeyNotFoundException("Category not found");
        cat.Name = req.Name; cat.Slug = req.Slug;
        cat.IconUrl = req.IconUrl; cat.DisplayOrder = req.DisplayOrder;
        await db.SaveChangesAsync(ct);
    }
}

public record ReorderCategoryItem(Guid CategoryId, int DisplayOrder);
public record ReorderCategoriesCommand(List<ReorderCategoryItem> Items) : IRequest;

public class ReorderCategoriesCommandHandler(IBlinkitDbContext db) : IRequestHandler<ReorderCategoriesCommand>
{
    public async Task Handle(ReorderCategoriesCommand req, CancellationToken ct)
    {
        var ids = req.Items.Select(i => i.CategoryId).ToList();
        var cats = await db.Categories.Where(c => ids.Contains(c.Id)).ToListAsync(ct);
        foreach (var item in req.Items)
        {
            var c = cats.FirstOrDefault(c => c.Id == item.CategoryId);
            if (c is not null) c.DisplayOrder = item.DisplayOrder;
        }
        await db.SaveChangesAsync(ct);
    }
}

public record ToggleCategoryActiveCommand(Guid Id) : IRequest;

public class ToggleCategoryActiveCommandHandler(IBlinkitDbContext db) : IRequestHandler<ToggleCategoryActiveCommand>
{
    public async Task Handle(ToggleCategoryActiveCommand req, CancellationToken ct)
    {
        var cat = await db.Categories.FindAsync([req.Id], ct)
            ?? throw new KeyNotFoundException("Category not found");
        cat.IsActive = !cat.IsActive;
        await db.SaveChangesAsync(ct);
    }
}
