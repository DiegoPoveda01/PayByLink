# Configuración de Autenticación con Supabase

## Paso 1: Configurar Variables de Entorno

Crea o edita el archivo `.env.local` en la raíz del proyecto con:

```env
# Ya tienes estas (para operaciones del servidor)
SUPABASE_URL=tu_url_de_supabase
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# NUEVAS (para autenticación del cliente)
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
```

**Dónde encontrar estos valores:**
1. Ve a tu proyecto en [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Ve a Settings → API
3. `NEXT_PUBLIC_SUPABASE_URL` = Project URL
4. `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon/public key

## Paso 2: Habilitar Email Authentication en Supabase

1. En tu proyecto de Supabase, ve a **Authentication** → **Providers**
2. Asegúrate de que **Email** esté habilitado
3. (Opcional para desarrollo) Deshabilita "Confirm email" si quieres probar sin confirmación:
   - Ve a **Authentication** → **Settings** → **Email Auth**
   - Desactiva "Enable email confirmations"

## Paso 3: Reiniciar el Servidor de Desarrollo

Después de agregar las variables de entorno:

```bash
# Detén el servidor (Ctrl+C)
# Reinicia
npm run dev
```

## Cómo Funciona

### Registro de Usuario
1. En `/dashboard`, el usuario ve un formulario de registro/login
2. Puede alternar entre "Crear Cuenta" e "Iniciar Sesión"
3. Al registrarse, Supabase crea la cuenta y (opcionalmente) envía email de confirmación
4. Después del registro, debe iniciar sesión con las mismas credenciales

### Inicio de Sesión
1. Usuario ingresa email y contraseña
2. Supabase valida las credenciales
3. Si son correctas, crea una sesión que persiste en localStorage
4. La sesión se mantiene incluso si recargas la página

### Persistencia de Sesión
- Al abrir `/dashboard`, automáticamente verifica si hay una sesión activa
- Si existe, el usuario accede directamente sin login
- La sesión se renueva automáticamente

### Cierre de Sesión
- Botón "Cerrar Sesión" en navbar y en pantalla principal
- Elimina la sesión de Supabase y del navegador

## Seguridad de Datos (Próximo Paso)

Actualmente, cualquier usuario autenticado puede ver todos los enlaces de pago. Para mejorar esto:

### Row Level Security (RLS)

Deberías configurar políticas RLS en Supabase para que cada usuario solo vea sus propios datos:

```sql
-- Habilitar RLS en la tabla payment_links
ALTER TABLE payment_links ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver sus propios enlaces
CREATE POLICY "Users can view own links"
ON payment_links
FOR SELECT
USING (auth.uid()::text = owner_email);

-- Política: Los usuarios solo pueden crear sus propios enlaces
CREATE POLICY "Users can create own links"
ON payment_links
FOR INSERT
WITH CHECK (auth.uid()::text = owner_email);
```

**IMPORTANTE:** Esto requiere modificar el esquema para almacenar el `user_id` de Supabase en lugar del email como identificador.

## Solución de Problemas

### Error: "Missing Supabase client credentials"
- Verifica que agregaste `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Asegúrate de reiniciar el servidor después de agregar las variables

### Error: "Invalid login credentials"
- Usuario no existe o contraseña incorrecta
- Intenta registrarte primero

### Email de confirmación no llega
- Revisa la carpeta de spam
- O deshabilita confirmación por email en Supabase (solo para desarrollo)

### Sesión no persiste al recargar
- Verifica que estás usando HTTPS en producción (http solo funciona en localhost)
- Limpia el localStorage del navegador y vuelve a iniciar sesión

## Próximas Mejoras Sugeridas

1. **Password Reset**: Agregar flujo de "Olvidé mi contraseña"
2. **Email Verification**: Manejar verificación de email
3. **Social Auth**: Agregar login con Google, GitHub, etc.
4. **RLS**: Implementar Row Level Security para aislar datos por usuario
5. **Profile**: Página de perfil de usuario con actualización de contraseña
