namespace SupplyCity.Api.Models;

public sealed class Producto
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public int SucursalId { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public decimal Precio { get; set; }
    public int Stock { get; set; }
    public int IdCategoria { get; set; }
    public bool Activo { get; set; }
}
