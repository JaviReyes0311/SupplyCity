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

### Prueba rápida (solo API)

El archivo `SupplyCity.Api.http` tiene las requests listas (login + productos).
Con las credenciales de prueba del seed (`db/seed/seed_tenants_demo.sql`):

| Tenant | Email | Password |
|--------|-------|----------|
| SupplyCity Norte | `admin@norte.com` | `admin123` |
| SupplyCity Sur | `admin@sur.com` | `admin123` |

Flujo: `POST /api/auth/login` → copiar el `token` → llamar `GET /api/productos`
con `Authorization: Bearer <token>`.

---

## Conexión con el front (módulo de login)

El front consume esta API desde JavaScript. La sesión se maneja de forma
centralizada en `controlador/JS/auth.js`.

### `auth.js` — módulo de sesión

Expone un objeto global `Auth` con:

| Método | Qué hace |
|--------|----------|
| `Auth.setSession(data)` | Guarda token + tenantId + sucursalId + nombre + rol tras el login |
| `Auth.getSession()` | Devuelve la sesión actual (o `null`) |
| `Auth.getToken()` / `getTenantId()` | Accesores rápidos |
| `Auth.isAuthenticated()` | `true` si hay sesión |
| `Auth.requireAuth()` | Guard: si no hay sesión, redirige a `login.html` |
| `Auth.apiFetch(path, opts)` | `fetch` a la API con el `Bearer` token ya puesto; si recibe 401, limpia sesión y manda al login |
| `Auth.logout()` | Limpia la sesión y vuelve al login |

**Persistencia:** `sessionStorage` — la sesión sobrevive recargas (F5) pero se
borra al cerrar la pestaña. En la beta final se evaluará migrar a cookies
`HttpOnly` para mayor seguridad frente a XSS.

**El token NUNCA viaja en la URL.** Siempre en el header `Authorization`.
(El flujo PHP anterior lo pasaba por `?token=` en la URL; eso se eliminó.)

### Páginas y su estado

| Archivo | Rol |
|---------|-----|
| `vista/HTML/login.html` | Carga `auth.js` + `ControladorLogin.js` |
| `controlador/JS/ControladorLogin.js` | `POST /api/auth/login`, guarda sesión, redirige a caseback |
| `vista/HTML/caseback.html` | Protegida con `Auth.requireAuth()` |
| `vista/HTML/Home.html` | Protegida con `Auth.requireAuth()`; muestra el nombre de la sesión; logout vía `Auth.logout()` |

### `API_BASE` y CORS deben coincidir

- `auth.js` apunta a la API en `API_BASE = 'http://localhost:5102'`
  (el puerto HTTP de `launchSettings.json`).
- La API permite CORS solo desde los orígenes de `Cors:AllowedOrigins`
  (por defecto `http://localhost:5500` y `http://127.0.0.1:5500`).

> **Servir el front por HTTP, no por `file://`.** Si abres el HTML con doble clic
> (`file://…`), el navegador bloquea las llamadas por CORS. Usá un servidor estático
> (p. ej. la extensión **Live Server** de VS Code) en el puerto **5500**.

### Probar el login completo (front + API)

1. Rellena `appsettings.Development.json` con tus credenciales de Supabase.
2. Levanta la API: desde `api/SupplyCity.Api`, `dotnet run`.
3. Sirve el front con Live Server (puerto 5500) y abre `vista/HTML/login.html`.
4. Entra con `admin@norte.com` / `admin123`.
   - Éxito → se guarda la sesión y redirige a `caseback.html`.
   - Credenciales malas → muestra "Credenciales inválidas".
5. Si abres `Home.html` sin sesión, te redirige al login (guard `requireAuth`).

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
│   └── NpgsqlConnectionFactory.cs   # abre conexión, SET ROLE authenticated + fija app.tenant_id
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
3. El front guarda el token (en `sessionStorage`, vía `auth.js`) y lo manda en
   `Authorization: Bearer <token>` en cada llamada.
4. `TenantResolutionMiddleware` lee el `tenant_id` del token ya validado y lo pone en
   el `ITenantContext` del request.
5. El repositorio pide una conexión **tenant-scoped**. La factory
   (`NpgsqlConnectionFactory.OpenTenantScopedAsync`) hace dos cosas antes de la query:
   1. `SET ROLE authenticated` — cambia al rol que SÍ respeta RLS (ver nota abajo).
   2. `set_config('app.tenant_id', …)` — fija el tenant de la sesión.
   Recién ahí corre la consulta, y RLS filtra solo las filas del tenant.

### ⚠️ Nota crítica: el rol de conexión y RLS

El usuario del Session pooler (`postgres`) tiene el atributo **`BYPASSRLS`**, que
**ignora todas las políticas RLS**. Si la API consultara directamente con ese rol,
**un tenant vería los datos de todos los demás** — el aislamiento no se aplicaría,
aunque las políticas existan y `FORCE ROW LEVEL SECURITY` esté activo.

Por eso, cada conexión tenant-scoped ejecuta `SET ROLE authenticated` antes de
consultar. El rol `authenticated` (de Supabase) **no** tiene `BYPASSRLS`, así que
las políticas se aplican de verdad. Esto está verificado end-to-end: el tenant 1
solo ve sus productos y el tenant 2 solo los suyos.

> Para producción, lo más limpio es que la API se conecte directamente con un rol
> sin privilegios (en lugar de `postgres` + `SET ROLE`). El `SET ROLE` es una
> solución válida y segura para esta etapa.

---

## Estado de los endpoints

Esto es un **scaffold**: la arquitectura completa (auth + multitenant + RLS) está
probada de punta a punta, pero solo con 2 endpoints. Faltan los de la operación real.

| Función | Script PHP original | Endpoint .NET | Estado |
|---------|---------------------|---------------|--------|
| Login | `login.php` | `POST /api/auth/login` | ✅ verificado e2e |
| Listar productos | `get_productos.php`, `ObtenerInventario.php` | `GET /api/productos` | ✅ verificado e2e (RLS) |
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

### Verificación realizada (login + productos)

Probado end-to-end contra el proyecto Supabase real:

- Login con `admin@norte.com` → `200` con JWT; el payload contiene
  `tenant_id`, `sucursal_id` y rol.
- `GET /api/productos` sin token → `401`.
- Aislamiento multitenant: tenant Norte ve **solo** su producto, tenant Sur ve
  **solo** el suyo. (Este test detectó y motivó el fix del `SET ROLE authenticated`
  descrito arriba.)

---

## Notas de seguridad

- **Contraseñas**: hoy se validan con SHA-256 (hex) por compatibilidad con el login
  PHP y el seed. Pendiente migrar a PBKDF2/BCrypt y rehashear en el próximo login.
- **Secretos**: nunca comitear `appsettings.Development.json`. En producción usar
  un gestor de secretos, no archivos. Si una contraseña de BD se expone (p. ej. en
  un chat o log), **rótala** en Supabase → Database → Reset database password y
  actualiza el `appsettings.Development.json` local.
- **Rol de conexión y RLS**: la API se conecta con `postgres` (que tiene `BYPASSRLS`)
  y cambia a `authenticated` por conexión con `SET ROLE`. Sin ese cambio, RLS NO se
  aplica. Para producción, preferir un rol de aplicación dedicado sin `BYPASSRLS`.
- **Token en sesión**: se guarda en `sessionStorage` (vulnerable a XSS). Mitigación
  futura: cookies `HttpOnly`. El token nunca viaja por la URL.
- **CORS**: los orígenes permitidos se configuran en `Cors:AllowedOrigins`
  (por defecto `localhost:5500` / `127.0.0.1:5500` para desarrollo del front).
