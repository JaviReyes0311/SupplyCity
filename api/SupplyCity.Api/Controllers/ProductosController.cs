using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SupplyCity.Api.Contracts;
using SupplyCity.Api.Services;

namespace SupplyCity.Api.Controllers;

[ApiController]
[Route("api/productos")]
[Authorize] // requiere JWT válido; el tenant sale del claim, no del cliente
public sealed class ProductosController : ControllerBase
{
    private readonly IProductoRepository _productos;

    public ProductosController(IProductoRepository productos) => _productos = productos;

    /// <summary>Lista los productos activos del tenant autenticado (filtrado por RLS).</summary>
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ProductoDto>>> GetAll(CancellationToken ct)
    {
        var productos = await _productos.GetAllAsync(ct);
        return Ok(productos);
    }
}
