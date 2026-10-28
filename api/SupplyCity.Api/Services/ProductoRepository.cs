using Dapper;
using SupplyCity.Api.Contracts;
using SupplyCity.Api.Data;
using SupplyCity.Api.Multitenancy;

namespace SupplyCity.Api.Services;

public interface IProductoRepository
{
    Task<IReadOnlyList<ProductoDto>> GetAllAsync(CancellationToken ct = default);
}

public sealed class ProductoRepository : IProductoRepository
{
    private readonly IDbConnectionFactory _db;
    private readonly ITenantContext _tenant;

    public ProductoRepository(IDbConnectionFactory db, ITenantContext tenant)
    {
        _db = db;
        _tenant = tenant;
    }

    public async Task<IReadOnlyList<ProductoDto>> GetAllAsync(CancellationToken ct = default)
    {
        if (!_tenant.IsResolved)
            throw new InvalidOperationException("Tenant no resuelto para el request.");

        // Conexión con app.tenant_id fijado -> RLS filtra solo este tenant.
        // No hace falta WHERE tenant_id = ...; la política lo hace sola.
        using var conn = await _db.OpenTenantScopedAsync(_tenant.TenantId!.Value, ct);

        var rows = await conn.QueryAsync<ProductoDto>(
            new CommandDefinition(
                @"SELECT id          AS Id,
                         nombre      AS Nombre,
                         descripcion AS Descripcion,
                         precio      AS Precio,
                         stock       AS Stock,
                         id_categoria AS IdCategoria,
                         activo      AS Activo
                  FROM producto
                  WHERE activo = true
                  ORDER BY nombre",
                cancellationToken: ct));

        return rows.AsList();
    }
}
