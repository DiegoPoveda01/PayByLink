# 🚀 Guía Rápida de Inicio - PayByLink

## ⚡ Setup en 5 Minutos

### 1️⃣ Instalar Dependencias

```bash
# En la carpeta del proyecto
npm install
```

Esto instalará todas las dependencias necesarias:
- Next.js 15 + React 19
- Stellar SDK + Freighter API
- TailwindCSS + Shadcn/ui
- Y más...

### 2️⃣ Configurar Variables de Entorno

El archivo `.env.local` ya está creado con configuración básica:

```env
NEXT_PUBLIC_STELLAR_NETWORK=testnet
```

**Para desarrollo local:** No necesitas configurar Vercel KV. El proyecto usa un fallback en memoria.

**Para producción:** Necesitarás configurar Vercel KV:
1. Crea un KV Database en Vercel Dashboard
2. Agrega las credenciales en `.env.local`:
   ```env
   KV_URL=your_url
   KV_REST_API_URL=your_api_url
   KV_REST_API_TOKEN=your_token
   KV_REST_API_READ_ONLY_TOKEN=your_read_token
   ```

### 3️⃣ Ejecutar el Proyecto

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### 4️⃣ Instalar Freighter Wallet (Requerido)

Para probar los pagos necesitas Freighter Wallet:

1. Ve a [https://www.freighter.app/](https://www.freighter.app/)
2. Descarga la extensión para tu navegador (Chrome/Firefox/Edge)
3. Instala y crea una wallet
4. **IMPORTANTE:** Cambia a Testnet en Freighter:
   - Abre Freighter
   - Settings → Network → Testnet

### 5️⃣ Obtener USDC de Testnet

Para hacer pruebas necesitas USDC en Testnet:

1. Abre Freighter y copia tu dirección (G...)
2. Ve a [Stellar Laboratory](https://laboratory.stellar.org/#account-creator?network=test)
3. Pega tu dirección y click "Get test network lumens"
4. Agrega USDC Testnet a tu wallet:
   - Abre Freighter
   - Manage Assets → Add Asset
   - Code: `USDC`
   - Issuer: `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5`
5. Ve a [Stellar Quest](https://quest.stellar.org/learn) para obtener USDC de prueba

---

## 🧪 Probar el Flujo Completo

### Paso 1: Crear un Link de Pago

1. Abre http://localhost:3000
2. Click en "Crear Link Gratis"
3. Completa el formulario:
   - **Monto:** 10
   - **Moneda:** USDC
   - **Descripción:** "Prueba PayByLink"
   - **Tu Dirección:** Tu dirección de Freighter (G...)
   - **Expira en:** 24 horas
4. Click "Generar Link"
5. Copia el link generado

### Paso 2: Pagar (Simular Cliente)

1. Abre el link copiado en una nueva pestaña (o modo incógnito)
2. Click "Conectar Freighter Wallet"
3. Autoriza el acceso en Freighter
4. Click "Pagar 10 USDC"
5. Confirma la transacción en Freighter
6. ¡Espera la confirmación! (3-5 segundos)

### Paso 3: Verificar Pago

1. Abre Freighter en la cuenta receptora
2. Deberías ver el USDC recibido
3. O verifica en [Stellar Expert](https://stellar.expert/explorer/testnet)

---

## 📝 Comandos Disponibles

```bash
# Desarrollo
npm run dev          # Inicia servidor en localhost:3000

# Build
npm run build        # Compila para producción
npm start            # Ejecuta versión compilada

# Linting
npm run lint         # Ejecuta ESLint

# Type Checking
npm run type-check   # Verifica tipos de TypeScript
```

---

## 🐛 Troubleshooting

### Error: "Freighter not installed"
**Solución:** Instala Freighter Wallet desde [freighter.app](https://www.freighter.app/)

### Error: "Invalid Stellar address"
**Solución:** Las direcciones Stellar empiezan con "G" y tienen 56 caracteres. Ejemplo:
```
GCXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### Error: "Insufficient balance"
**Solución:** Necesitas fondos en tu wallet de Testnet. Ve a [Stellar Laboratory](https://laboratory.stellar.org/#account-creator?network=test)

### El link no funciona
**Solución:** Verifica que:
1. El link no haya expirado
2. Estés en Testnet (si generaste el link en Testnet)
3. Freighter esté conectado a la misma red

### Error: "Transaction failed"
**Solución:** 
1. Verifica que tengas suficiente XLM para fees (~0.001 XLM)
2. Asegúrate de tener el asset agregado en tu wallet
3. Revisa que la cuenta destino exista

---

## 🚀 Deploy en Vercel

### Opción 1: Desde GitHub

```bash
# 1. Sube tu código a GitHub
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/tuusuario/paybylink.git
git push -u origin main

# 2. Conecta con Vercel
# - Ve a vercel.com
# - Import Git Repository
# - Selecciona tu repo
# - Deploy automáticamente
```

### Opción 2: Desde CLI

```bash
# 1. Instala Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel

# 4. Para producción
vercel --prod
```

### Configurar Variables en Vercel

1. Ve a tu proyecto en Vercel Dashboard
2. Settings → Environment Variables
3. Agrega:
   ```
   NEXT_PUBLIC_STELLAR_NETWORK=testnet (o mainnet)
   NEXT_PUBLIC_BASE_URL=https://tu-dominio.vercel.app
   ```
4. Si usas Vercel KV, agrega las credenciales KV_*

---

## 📚 Recursos Útiles

### Documentación
- [Next.js Docs](https://nextjs.org/docs)
- [Stellar Docs](https://developers.stellar.org)
- [Freighter Docs](https://docs.freighter.app)

### Herramientas
- [Stellar Laboratory](https://laboratory.stellar.org) - Testear operaciones
- [Stellar Expert](https://stellar.expert) - Explorador de blockchain
- [StellarQuest](https://quest.stellar.org) - Aprender Stellar

### Comunidad
- [Stellar Discord](https://discord.gg/stellar)
- [Stellar Stack Exchange](https://stellar.stackexchange.com)

---

## ✅ Checklist Pre-Demo

Antes de grabar tu video pitch, verifica:

- [ ] Proyecto corre sin errores en `npm run dev`
- [ ] Puedes crear un link de pago
- [ ] Puedes completar un pago con Freighter
- [ ] El pago se refleja en la wallet destino
- [ ] El README está actualizado
- [ ] El código está en GitHub (público)
- [ ] Deploy en Vercel funciona
- [ ] Tienes cuenta de prueba en Testnet con USDC

---

## 🎥 Tips para el Video Pitch

1. **Introducción (30s)**
   - Presenta el problema
   - "Cobrar en LATAM es caro y lento..."

2. **Demo en Vivo (3min)**
   - Muestra tu cara (suma puntos!)
   - Crea un link en tiempo real
   - Paga desde otra ventana
   - Muestra la confirmación

3. **Tecnología (1min)**
   - Explica uso de Stellar
   - Menciona Freighter Wallet
   - Destaca fees mínimos y velocidad

4. **Cierre (30s)**
   - Impacto potencial
   - Próximos pasos
   - Call to action

---

## 💡 Consejos Finales

✨ **Para impresionar a los jueces:**
- Muestra el flujo completo funcionando
- Explica claramente el problema que resuelves
- Menciona casos de uso reales en LATAM
- Destaca la experiencia sin fricciones (no registro)

🎯 **Diferenciadores clave:**
- URLs semánticas (más bonitas que códigos random)
- Sin registro previo (verdadera descentralización)
- Preview en tiempo real al crear
- Expiración automática de enlaces

---

¡Mucha suerte en la hackathon! 🚀🌟
