# 🚀 Guía de Deployment - PayByLink

## Preparación para Producción

### 1. Verificar que Todo Funciona Localmente

```bash
# Compilar proyecto
npm run build

# Ejecutar versión de producción
npm start

# Verificar en http://localhost:3000
# - Crear link funciona
# - Pagar funciona
# - No hay errores en consola
```

---

## Opción 1: Deploy Automático con Vercel (Recomendado)

### Paso 1: Preparar Git Repository

```bash
# Inicializar Git (si no lo has hecho)
git init

# Agregar archivos
git add .

# Commit inicial
git commit -m "feat: PayByLink - Sistema de pagos Stellar"

# Crear repo en GitHub
# Ve a github.com → New Repository
# Nombre: paybylink-stellar
# Público (requerido para hackathon)
# No agregar README (ya tienes)

# Conectar con GitHub
git branch -M main
git remote add origin https://github.com/TU-USUARIO/paybylink-stellar.git
git push -u origin main
```

### Paso 2: Conectar con Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Sign Up / Login con GitHub
3. Click "Add New Project"
4. Import tu repositorio `paybylink-stellar`
5. Configuración:
   ```
   Framework Preset: Next.js
   Root Directory: ./
   Build Command: npm run build (auto-detectado)
   Output Directory: .next (auto-detectado)
   ```

### Paso 3: Configurar Variables de Entorno

En Vercel Dashboard → Settings → Environment Variables:

```bash
# Red Stellar
NEXT_PUBLIC_STELLAR_NETWORK=testnet
# Cambiar a "mainnet" cuando estés listo para producción

# Supabase (persistencia de links)
SUPABASE_URL=tu_url_supabase
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# URL Base (Vercel lo asigna automáticamente)
NEXT_PUBLIC_BASE_URL=https://tu-proyecto.vercel.app
# Actualizar después del primer deploy
```

### Paso 4: Deploy

Click "Deploy" → Espera 2-3 minutos → ¡Listo!

Tu URL será algo como: `https://paybylink-stellar.vercel.app`

### Paso 5: Configurar Dominio Custom (Opcional)

1. Vercel Dashboard → Settings → Domains
2. Add Domain: `paybylink.app` (o el que compres)
3. Seguir instrucciones DNS

---

## Opción 2: Deploy con Vercel CLI

```bash
# 1. Instalar Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy a Preview
vercel

# Seguir prompts:
# - Link to existing project? No
# - Project name: paybylink-stellar
# - Directory: ./
# - Want to modify settings? No

# 4. Deploy a Production
vercel --prod

# 5. Agregar environment variables
vercel env add NEXT_PUBLIC_STELLAR_NETWORK
# Ingresar: testnet

vercel env add NEXT_PUBLIC_BASE_URL
# Ingresar: https://tu-proyecto.vercel.app
```

---

## Configurar Vercel KV (Storage Opcional)

### Sin Vercel KV
El proyecto funciona con fallback en memoria para desarrollo. 
**Limitación:** Los links no persisten entre reinicios del servidor.

### Con Supabase (Recomendado para Producción)

#### Paso 1: Crear Base Supabase

1. Ve a https://supabase.com/ → crea proyecto
2. Copia `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`
3. En Supabase SQL corre:
   ```sql
   create table if not exists payment_links (
     id text primary key,
     amount numeric not null,
     currency text not null,
     description text not null,
     recipient text not null,
     created_at bigint not null,
     expires_at bigint not null,
     used boolean not null default false,
     tx_hash text,
     metadata jsonb
   );
   ```

#### Paso 2: Añadir env vars en Vercel

En Vercel Dashboard → Project → Settings → Environment Variables
```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

#### Paso 3: Re-deploy

```bash
# Opción A: Desde Dashboard
Vercel Dashboard → Deployments → Redeploy

# Opción B: Desde CLI
vercel --prod
```

#### Verificar Funcionamiento

```bash
# Ver logs en tiempo real
vercel logs --follow

# Crear un link de prueba
# Verificar que se almacena en KV Dashboard → Browse Data
```

---

## Testing en Producción

### Checklist de Testing

1. **Homepage**
   - [ ] Carga correctamente
   - [ ] Links funcionan
   - [ ] Responsive en mobile

2. **Crear Link**
   - [ ] Formulario valida correctamente
   - [ ] Link se genera exitosamente
   - [ ] QR code se muestra
   - [ ] URL es accesible

3. **Página de Pago**
   - [ ] Link abre correctamente
   - [ ] Información se muestra bien
   - [ ] Freighter conecta
   - [ ] Pago se procesa
   - [ ] Confirmación se muestra

4. **Integración Stellar**
   - [ ] Transacciones se confirman
   - [ ] Hash es válido
   - [ ] Link en Stellar Expert funciona

### Probar con Testnet

1. Genera link en tu app deployed
2. Paga con wallet de testnet
3. Verifica transacción en [Stellar Expert Testnet](https://stellar.expert/explorer/testnet)

---

## Cambiar a Mainnet (Producción Real)

### ⚠️ IMPORTANTE: Solo cuando estés 100% seguro

```bash
# 1. Actualizar variable de entorno en Vercel
NEXT_PUBLIC_STELLAR_NETWORK=mainnet

# 2. Re-deploy
vercel --prod

# 3. Probar con montos pequeños primero
# 4. Avisar a usuarios que estás en mainnet
```

### Diferencias Testnet vs Mainnet

| Característica | Testnet | Mainnet |
|----------------|---------|---------|
| USDC Real | No | Sí |
| Fees | Gratis | ~$0.00001 |
| URL Stellar Expert | stellar.expert/explorer/testnet | stellar.expert/explorer/public |
| Horizon URL | horizon-testnet.stellar.org | horizon.stellar.org |

---

## Monitoreo y Analytics

### Vercel Analytics (Incluido Gratis)

1. Vercel Dashboard → Analytics
2. Ve:
   - Visitors
   - Page views
   - Top pages
   - Performance

### Custom Analytics (Opcional)

Agregar Google Analytics:

```tsx
// app/layout.tsx
export const metadata = {
  // ...existing
  verification: {
    google: 'tu-codigo-verification'
  }
}

// Agregar en <head> si necesitas GA4
```

### Error Tracking con Sentry (Opcional)

```bash
# Instalar
npm install @sentry/nextjs

# Configurar
npx @sentry/wizard@latest -i nextjs

# Agregar DSN en Vercel env vars
NEXT_PUBLIC_SENTRY_DSN=tu-dsn
```

---

## Optimizaciones de Performance

### Activar Compresión

Vercel lo hace automáticamente:
- Gzip
- Brotli
- Image Optimization

### Cache Headers

Vercel configura automáticamente:
- Static assets: Cache por 1 año
- API Routes: No cache (dinámico)

### Lighthouse Score Target

Apuntar a:
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 95
- SEO: > 90

---

## Troubleshooting Deployment

### Error: "Module not found"

```bash
# Limpiar caché y reinstalar
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

### Error: "Environment variable not found"

```bash
# Verificar variables en Vercel
vercel env ls

# Agregar faltantes
vercel env add NOMBRE_VARIABLE
```

### Error: Build timeout

```bash
# En vercel.json agregar:
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next",
      "config": {
        "maxLambdaSize": "50mb"
      }
    }
  ]
}
```

### Links no persisten después de deploy

- Necesitas configurar Vercel KV
- O los links se pierden en cada deploy (expected con fallback)

---

## Rollback en caso de Problemas

```bash
# Opción 1: Desde Dashboard
Vercel Dashboard → Deployments → Previous Deploy → Promote to Production

# Opción 2: Desde CLI
vercel rollback
```

---

## Checklist Final Pre-Submission

- [ ] Proyecto deployed y accesible públicamente
- [ ] README.md actualizado con URL del proyecto
- [ ] Video pitch grabado y subido
- [ ] Repositorio GitHub público
- [ ] Probado end-to-end en producción
- [ ] Sin errores en consola
- [ ] Performance aceptable (Lighthouse > 80)
- [ ] Funciona en mobile y desktop
- [ ] Freighter conecta correctamente
- [ ] Transacciones se confirman en Stellar

---

## URLs para Submission

Prepara estos links para enviar a DoraHacks:

```
🌐 Demo en Vivo:
https://tu-proyecto.vercel.app

💻 Código GitHub:
https://github.com/tu-usuario/paybylink-stellar

🎥 Video Pitch:
https://youtube.com/watch?v=... o https://vimeo.com/...

📝 Documentación:
https://github.com/tu-usuario/paybylink-stellar#readme
```

---

## Post-Deployment

### Promover el Proyecto

1. **Twitter/X**
   ```
   🚀 Acabo de lanzar PayByLink!
   
   Genera enlaces de pago en #Stellar en 10 segundos.
   Sin registro. Sin comisiones. Sin complicaciones.
   
   Demo: https://tu-url.vercel.app
   
   Hecho para @stellar_chile @telluscoop
   #StellarHackathon #Blockchain #Fintech
   ```

2. **LinkedIn**
   Comparte el proyecto con un post profesional

3. **Reddit**
   r/Stellar - Compartir con la comunidad

### Obtener Feedback

- Comparte con amigos/colegas
- Pide que prueben el flujo completo
- Recopila sugerencias de mejora

---

## 🎉 ¡Listo para Competir!

Tu proyecto está deployed, funcional y listo para impresionar a los jueces.

**Última verificación:** Abre el link en modo incógnito y completa un pago de prueba.

**¡Mucha suerte en la hackathon! 🚀🌟**
