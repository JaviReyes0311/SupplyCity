using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SupplyCity.Api.Contracts;
using SupplyCity.Api.Services;

namespace SupplyCity.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController : ControllerBase
{
    private readonly IAuthService _auth;

    public AuthController(IAuthService auth) => _auth = auth;

    /// <summary>Valida credenciales y devuelve un JWT con el claim tenant_id.</summary>
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<LoginResponse>> Login(
        [FromBody] LoginRequest req, CancellationToken ct)
    {
        var result = await _auth.LoginAsync(req, ct);
        if (result is null)
            return Unauthorized(new { error = "Credenciales inválidas" });

        return Ok(result);
    }
}
