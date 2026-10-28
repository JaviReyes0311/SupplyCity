namespace SupplyCity.Api.Contracts;

public sealed record LoginRequest(string Email, string Password);

public sealed record LoginResponse(
    string Token,
    int UserId,
    int TenantId,
    int SucursalId,
    string Nombre,
    string TipoUsuario);
