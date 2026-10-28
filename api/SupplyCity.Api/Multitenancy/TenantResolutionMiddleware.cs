using System.Security.Claims;

namespace SupplyCity.Api.Multitenancy;

/// <summary>
/// Extrae tenant_id y sub (userId) de los claims del JWT ya validado y los
/// coloca en el ITenantContext scoped del request. Si no hay claims (endpoints
/// anónimos como login), simplemente no resuelve el tenant.
/// </summary>
public sealed class TenantResolutionMiddleware
{
    private readonly RequestDelegate _next;

    public TenantResolutionMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context, ITenantContext tenant)
    {
        var user = context.User;
        if (user?.Identity?.IsAuthenticated == true)
        {
            var tenantClaim = user.FindFirst("tenant_id")?.Value;
            var subClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value
                           ?? user.FindFirst("sub")?.Value;

            if (int.TryParse(tenantClaim, out var tenantId) &&
                int.TryParse(subClaim, out var userId))
            {
                tenant.Set(tenantId, userId);
            }
        }

        await _next(context);
    }
}
