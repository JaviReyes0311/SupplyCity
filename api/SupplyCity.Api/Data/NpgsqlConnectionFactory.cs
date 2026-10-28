using System.Data;
using Npgsql;

namespace SupplyCity.Api.Data;

public sealed class NpgsqlConnectionFactory : IDbConnectionFactory
{
    private readonly string _connectionString;

    public NpgsqlConnectionFactory(IConfiguration config)
    {
        _connectionString = config.GetConnectionString("Postgres")
            ?? throw new InvalidOperationException(
                "Falta la cadena de conexión 'Postgres' en la configuración.");
    }

    public async Task<IDbConnection> OpenAsync(CancellationToken ct = default)
    {
        var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync(ct);
        return conn;
    }

    public async Task<IDbConnection> OpenTenantScopedAsync(int tenantId, CancellationToken ct = default)
    {
        var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync(ct);

        // Fija el tenant de la sesión. SET LOCAL no sirve fuera de una transacción,
        // así que usamos set_config con is_local=false para la sesión completa.
        // Parametrizado para evitar cualquier inyección por el valor del tenant.
        await using var cmd = new NpgsqlCommand("SELECT set_config('app.tenant_id', @tid, false);", conn);
        cmd.Parameters.AddWithValue("tid", tenantId.ToString());
        await cmd.ExecuteNonQueryAsync(ct);

        return conn;
    }
}
