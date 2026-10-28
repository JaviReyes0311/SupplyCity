namespace SupplyCity.Api.Contracts;

public sealed record ProductoDto(
    int Id,
    string Nombre,
    string? Descripcion,
    decimal Precio,
    int Stock,
    int IdCategoria,
    bool Activo);
