using System.Data;

namespace SupplyCity.Api.Data;

/// <summary>
/// Entrega conexiones a Postgres. Dos variantes:
///  - OpenAsync: conexión sin contexto de tenant (para login, que aún no tiene tenant).
///  - OpenTenantScopedAsync: conexión con app.tenant_id ya fijado para que RLS filtre.
/// </summary>
public interface IDbConnectionFactory
{
    Task<IDbConnection> OpenAsync(CancellationToken ct = default);

    /// <summary>
    /// Abre una conexión y ejecuta SET app.tenant_id = &lt;tenantId&gt; antes de devolverla.
    /// A partir de ahí, las políticas RLS filtran por ese tenant automáticamente.
    /// Requiere SESSION pooler (puerto 5432): el SET debe persistir en la misma sesión.
    /// </summary>
    Task<IDbConnection> OpenTenantScopedAsync(int tenantId, CancellationToken ct = default);
}
