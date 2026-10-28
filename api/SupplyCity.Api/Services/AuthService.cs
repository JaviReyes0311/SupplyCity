using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Dapper;
using Microsoft.IdentityModel.Tokens;
using SupplyCity.Api.Contracts;
using SupplyCity.Api.Data;
using SupplyCity.Api.Models;

namespace SupplyCity.Api.Services;

public interface IAuthService
{
    Task<LoginResponse?> LoginAsync(LoginRequest req, CancellationToken ct = default);
}

public sealed class AuthService : IAuthService
{
    private readonly IDbConnectionFactory _db;
    private readonly IConfiguration _config;

    public AuthService(IDbConnectionFactory db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    public async Task<LoginResponse?> LoginAsync(LoginRequest req, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
            return null;

        // Login corre SIN tenant fijado: todavía no sabemos a qué tenant pertenece.
        // Buscamos por email de forma global. Nota: email es único POR tenant, así que
        // en teoría dos tenants podrían compartir email. Para este POS (un empleado =
        // una sucursal) asumimos email global único a efectos de login; si en el futuro
        // se permite colisión, el login deberá además recibir el slug del tenant.
        using var conn = await _db.OpenAsync(ct);

        // RLS bloquea sin tenant, por eso esta consulta usa una función SECURITY DEFINER
        // dedicada al login. Ver nota en el repositorio: se consulta vía auth_find_usuario.
        var user = await conn.QuerySingleOrDefaultAsync<Usuario>(
            new CommandDefinition(
                @"SELECT id AS Id, tenant_id AS TenantId, sucursal_id AS SucursalId,
                         email AS Email, password_hash AS PasswordHash,
                         nombre AS Nombre, apellido AS Apellido,
                         tipo_usuario AS TipoUsuario, activo AS Activo
                  FROM auth_find_usuario(@Email)",
                new { req.Email }, cancellationToken: ct));

        if (user is null || !user.Activo)
            return null;

        if (!VerifyPassword(req.Password, user.PasswordHash))
            return null;

        var token = GenerateToken(user);
        return new LoginResponse(
            token, user.Id, user.TenantId, user.SucursalId,
            $"{user.Nombre} {user.Apellido}", user.TipoUsuario);
    }

    // SHA-256 hex, compatible con el login PHP actual y el seed.
    // TODO: migrar a PBKDF2/BCrypt y rehashear en el próximo login.
    private static bool VerifyPassword(string plain, string storedHash)
    {
        var computed = Convert.ToHexString(
            SHA256.HashData(Encoding.UTF8.GetBytes(plain))).ToLowerInvariant();
        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(computed),
            Encoding.UTF8.GetBytes(storedHash.ToLowerInvariant()));
    }

    private string GenerateToken(Usuario user)
    {
        var key = _config["Jwt:Key"] ?? throw new InvalidOperationException("Falta Jwt:Key");
        var creds = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
            SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim("tenant_id", user.TenantId.ToString()),
            new Claim("sucursal_id", user.SucursalId.ToString()),
            new Claim(ClaimTypes.Role, user.TipoUsuario),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var minutes = int.TryParse(_config["Jwt:ExpiresMinutes"], out var m) ? m : 480;
        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(minutes),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
