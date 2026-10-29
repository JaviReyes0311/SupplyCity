# SupplyCity API

API intermedia en **ASP.NET Core 8** que conecta el front (HTML/JS) con la base
de datos **Supabase/Postgres**. Reemplaza la antigua capa de scripts PHP.

```
Front (HTML/JS)  ──HTTP/JSON──>  API .NET  ──Npgsql──>  Supabase / Postgres
```

Responsabilidades de esta capa:

1. **Autenticar** usuarios y emitir un **JWT** firmado que lleva el `tenant_id`.
2. **Resolver el tenant** en cada request (lee el token y fija `app.tenant_id`),
   de modo que **Row Level Security (RLS)** de Postgres aísla los datos por empresa.
3. **Exponer endpoints HTTP** que el front consume; el front nunca toca la BD directo.

> El aislamiento multitenant NO depende de que la API ponga `WHERE tenant_id = …`.
> La API fija `app.tenant_id` y la base de datos filtra sola vía RLS. El tenant sale
> del token firmado, no de parámetros del cliente: un usuario no puede pedir datos
> de otro tenant aunque manipule la petición.

---

## Requisitos

| Dependencia | Versión | Para qué |
|-------------|---------|----------|
| .NET SDK | 8.0 (LTS) | Compilar y ejecutar la API |
| Proyecto Supabase | — | Base de datos Postgres (ver `db/` en la raíz del repo) |

Paquetes NuGet (se restauran solos con `dotnet restore` / `dotnet build`):

| Paquete | Versión | Uso |
|---------|---------|-----|
| `Npgsql` | 8.0.5 | Driver de Postgres |
| `Dapper` | 2.1.35 | Micro-ORM para las consultas |
| `Microsoft.AspNetCore.Authentication.JwtBearer` | 8.0.10 | Validación de JWT |
| `Swashbuckle.AspNetCore` | 6.6.2 | Swagger UI (solo en Development) |

---

## Configuración y credenciales

La configuración se divide en dos archivos, **y esto es intencional por seguridad**:

### `appsettings.json` (SÍ se versiona)

Contiene la estructura de configuración con los **valores sensibles vacíos**.
Sirve de plantilla y documenta qué claves existen. No tiene secretos.

### `appsettings.Development.json` (NO se versiona)

Aquí van los **secretos reales**. Está excluido por `.gitignore`, así que
**nunca llega a GitHub**. Cada desarrollador crea el suyo localmente.

El `.gitignore` de este proyecto excluye:

```
bin/                          # artefactos de compilación
obj/                          # artefactos de compilación
appsettings.Development.json  # connection string + clave JWT (SECRETOS)
appsettings.*.Local.json
*.user
```

> Si clonas el repo, **no vas a encontrar** `appsettings.Development.json`:
> tienes que crearlo tú con el contenido de abajo. Es lo esperado, no un error.

### Cómo crear tu `appsettings.Development.json`

Crea el archivo `api/SupplyCity.Api/appsettings.Development.json` con:

```json
{
  "ConnectionStrings": {
    "Postgres": "Host=aws-0-<REGION>.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.<PROJECT_REF>;Password=<TU_DB_PASSWORD>;SSL Mode=Require;Trust Server Certificate=true"
  },
  "Jwt": {
    "Issuer": "SupplyCity.Api",
    "Audience": "SupplyCity.Client",
    "Key": "<CLAVE_JWT_MINIMO_32_CARACTERES>",
    "ExpiresMinutes": 480
  }
}
```

Dónde obtener cada valor:

- **`<REGION>` / `<PROJECT_REF>` / `<TU_DB_PASSWORD>`**: en el panel de Supabase,
  botón **Connect → Session pooler**. Copia el host, el usuario (`postgres.<ref>`)
  y usa la contraseña de la base de datos.
- **`<CLAVE_JWT_...>`**: cualquier cadena aleatoria de 32+ caracteres. En producción
  debe venir de un gestor de secretos (AWS Secrets Manager, etc.), no de un archivo.

> **IMPORTANTE — usar el Session pooler (puerto 5432), no el Transaction (6543).**
> La API fija `app.tenant_id` con un `SET` y luego ejecuta la consulta en la misma
> sesión. El transaction pooler no garantiza la misma sesión entre ambos pasos, así
> que el aislamiento RLS fallaría. Puerto **5432** siempre.

---

## Cómo ejecutar

Desde `api/SupplyCity.Api`:

```bash
dotnet restore      # restaura paquetes NuGet (primera vez)
dotnet build        # compila
dotnet run          # levanta la API
```

En modo Development se habilita **Swagger UI** en `/swagger` para probar los
endpoints desde el navegador.

### Prueba rápida

El archivo `SupplyCity.Api.http` tiene las requests listas (login + productos).
Con las credenciales de prueba del seed (`db/seed/seed_tenants_demo.sql`):

- Usuario: `admin@norte.com` · Password: `admin123`

Flujo: hacer `POST /api/auth/login` → copiar el `token` → llamar
`GET /api/productos` con `Authorization: Bearer <token>`.

---

## Estructura del proyecto

```
api/SupplyCity.Api/
├── Program.cs                 # arranque: DI, JWT, CORS, pipeline
├── appsettings.json           # config plantilla (sin secretos)
├── Controllers/               # endpoints HTTP
│   ├── AuthController.cs       # POST /api/auth/login
│   └── ProductosController.cs  # GET  /api/productos
├── Services/                  # lógica de negocio / acceso a datos
│   ├── AuthService.cs          # valida credenciales + emite JWT
│   └── ProductoRepository.cs   # consulta productos (RLS aplica)
├── Data/                      # conexión a Postgres
│   ├── IDbConnectionFactory.cs
│   └── NpgsqlConnectionFactory.cs   # abre conexión y fija app.tenant_id
├── Multitenancy/              # resolución del tenant por request
│   ├── ITenantContext.cs
│   └── TenantResolutionMiddleware.cs
├── Models/                    # entidades de BD
├── Contracts/                 # DTOs de entrada/salida (lo que ve el front)
└── SupplyCity.Api.http        # requests de prueba
```

---

## Flujo de una petición autenticada

1. El front hace `POST /api/auth/login` con email y password.
2. `AuthService` valida contra la tabla `usuario` (vía la función `auth_find_usuario`,
   necesaria porque RLS bloquea la tabla antes de conocer el tenant) y emite un JWT
   con los claims `tenant_id`, `sucursal_id` y rol.
3. El front guarda el token y lo manda en `Authorization: Bearer <token>` en cada llamada.
4. `TenantResolutionMiddleware` lee el `tenant_id` del token ya validado y lo pone en
   el `ITenantContext` del request.
5. El repositorio pide una conexión **tenant-scoped**: la factory ejecuta
   `set_config('app.tenant_id', …)` y recién ahí corre la consulta. RLS filtra el resto.

---

## Estado de los endpoints

Esto es un **scaffold**: la arquitectura completa (auth + multitenant + RLS) está
probada de punta a punta, pero solo con 2 endpoints. Faltan los de la operación real.

| Función | Script PHP original | Endpoint .NET | Estado |
|---------|---------------------|---------------|--------|
| Login | `login.php` | `POST /api/auth/login` | ✅ |
| Listar productos | `get_productos.php`, `ObtenerInventario.php` | `GET /api/productos` | ✅ |
| Listar usuarios | `ObtenerUsuarios.php` | `GET /api/usuarios` | ⬜ pendiente |
| Registrar usuario | `InsertarUsuario.php` | `POST /api/usuarios` | ⬜ pendiente |
| Guardar carrito | `actualizar_carrito.php` | `PUT /api/carrito` | ⬜ pendiente |
| Verificar stock | `verificar_stock.php` | `POST /api/carrito/verificar-stock` | ⬜ pendiente |
| Procesar venta | `procesar_venta.php` | `POST /api/ventas` | ⬜ pendiente |
| Iniciar turno | (nuevo) | `POST /api/turnos` | ⬜ pendiente |
| Cerrar turno (corte) | (nuevo) | `POST /api/turnos/{id}/cerrar` | ⬜ pendiente |
| Histórico / estadísticas | (nuevo) | `GET /api/turnos/...` | ⬜ pendiente |

El andamiaje difícil (JWT, RLS, conexión, patrón repositorio) ya está resuelto; cada
endpoint nuevo reutiliza ese mismo patrón.

---

## Notas de seguridad

- **Contraseñas**: hoy se validan con SHA-256 (hex) por compatibilidad con el login
  PHP y el seed. Pendiente migrar a PBKDF2/BCrypt y rehashear en el próximo login.
- **Secretos**: nunca comitear `appsettings.Development.json`. En producción usar
  un gestor de secretos, no archivos.
- **CORS**: los orígenes permitidos se configuran en `Cors:AllowedOrigins`
  (por defecto `localhost:5500` / `127.0.0.1:5500` para desarrollo del front).
