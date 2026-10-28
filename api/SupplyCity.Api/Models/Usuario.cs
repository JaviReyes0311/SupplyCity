namespace SupplyCity.Api.Models;

public sealed class Usuario
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public int SucursalId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Apellido { get; set; } = string.Empty;
    public string TipoUsuario { get; set; } = "Usuario";
    public bool Activo { get; set; }
}
