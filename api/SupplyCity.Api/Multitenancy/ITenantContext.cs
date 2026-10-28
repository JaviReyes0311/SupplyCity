namespace SupplyCity.Api.Multitenancy;

/// <summary>
/// Contexto del tenant para el request actual. Lo llena el middleware a partir
/// del claim del JWT y lo consume la capa de datos para fijar app.tenant_id.
/// Scoped: una instancia por request.
/// </summary>
public interface ITenantContext
{
    int? TenantId { get; }
    int? UserId { get; }
    bool IsResolved { get; }
    void Set(int tenantId, int userId);
}

public sealed class TenantContext : ITenantContext
{
    public int? TenantId { get; private set; }
    public int? UserId { get; private set; }
    public bool IsResolved => TenantId.HasValue;

    public void Set(int tenantId, int userId)
    {
        TenantId = tenantId;
        UserId = userId;
    }
}
