# 🚀 PayByLink - Pagos Instantáneos en Stellar

<div align="center">
  
![PayByLink](https://img.shields.io/badge/Stellar-Hackathon-7D00FF?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Stellar](https://img.shields.io/badge/Stellar-Network-7D00FF?style=for-the-badge&logo=stellar)

**Genera enlaces de pago en Stellar sin registro. Sin comisiones ocultas. Sin complicaciones.**

[Demo en Vivo](#) • [Documentación](#características) • [Video Pitch](#)

</div>

---

## 📋 Tabla de Contenidos

- [¿Qué es PayByLink?](#-qué-es-paybylink)
- [Características](#-características)
- [Demo](#-demo)
- [Tecnologías](#-tecnologías)
- [Instalación](#-instalación)
- [Uso](#-uso)
- [Arquitectura](#-arquitectura)
- [API Endpoints](#-api-endpoints)
- [Roadmap](#-roadmap)
- [Contribuir](#-contribuir)
- [Licencia](#-licencia)

---

## 🎯 ¿Qué es PayByLink?

**PayByLink** es una plataforma web que permite generar enlaces de pago en la blockchain de Stellar de forma instantánea, sin necesidad de crear cuenta ni proporcionar información personal.

### Problema que Resuelve

En LATAM, los métodos de pago tradicionales tienen múltiples fricciones:
- ❌ **Altas comisiones** (3-10% por transacción)
- ❌ **Procesos lentos** (demoras de 24-48 horas)
- ❌ **Requisitos complejos** (registro, verificación, cuentas bancarias)
- ❌ **Limitaciones internacionales** (restricciones para pagos cross-border)

### Nuestra Solución

PayByLink elimina estas barreras mediante:
- ✅ **Sin registro** - Crea enlaces en 10 segundos
- ✅ **Comisiones mínimas** - Solo fees de Stellar (~$0.00001 por TX)
- ✅ **Pagos instantáneos** - Confirmación en 3-5 segundos
- ✅ **Global por defecto** - Sin fronteras ni restricciones

---

## ✨ Características

### 🔥 Core Features

- **Generación Instantánea de Enlaces**
  - Crea enlaces de pago sin autenticación
  - URLs semánticas legibles (ej: `/pay/50usdc-consultoria`)
  - QR codes automáticos para compartir

- **Integración con Freighter Wallet**
  - Pagos con un click desde el navegador
  - Soporte para USDC y XLM
  - Confirmación en tiempo real

- **Sistema de Expiración**
  - Enlaces temporales (1h - 30 días)
  - Validación automática de vigencia
  - Prevención de uso duplicado

- **Preview en Tiempo Real**
  - Vista previa del enlace al crearlo
  - Simulación de experiencia de pago
  - Validación instantánea de datos

### 🎨 Experiencia de Usuario

- **Diseño Responsivo** - Funciona perfecto en mobile y desktop
- **Interfaz Intuitiva** - UX optimizada para no-cripto usuarios
- **Feedback Visual** - Estados claros en cada paso del proceso
- **Soporte Multiidioma** - Actualmente en Español (próximamente EN/PT)

### 🔒 Seguridad

- **Sin custodia** - No almacenamos claves privadas
- **Validación client-side** - Verificación de direcciones Stellar
- **Transacciones firmadas** - Usuario controla 100% sus fondos
- **Links efímeros** - Expiración automática configurable

---

## 🎬 Demo

### Flujo Completo

**1. Crear Link de Pago**
```
1. Ingresa monto: 50 USDC
2. Descripción: "Consultoría Desarrollo Web"
3. Tu dirección: GCXXX...XXXX
4. Expira en: 24 horas
→ Click "Generar Link"
```

**2. Compartir**
```
Link generado:
https://paybylink.app/pay/a8f3k2/50usdc-consultoria

Compartir por:
- WhatsApp
- Email
- Telegram
- QR Code
```

**3. Recibir Pago**
```
Cliente abre link
→ Conecta Freighter
→ Confirma pago
→ Recibes USDC instantáneamente
```

### Casos de Uso Reales

- 💼 **Freelancers** - Cobra por servicios profesionales
- 🛍️ **E-commerce** - Pagos para tiendas online
- 🎓 **Educación** - Venta de cursos/talleres
- 🤝 **P2P** - Pagos entre amigos/familia
- 📱 **Servicios** - Deliveries, transporte, propinas

---

## 🛠️ Tecnologías

### Frontend
- **Framework:** Next.js 15.1 (App Router)
- **Lenguaje:** TypeScript 5.3
- **Styling:** TailwindCSS 3.4 + Shadcn/ui
- **Animaciones:** Framer Motion 11
- **Forms:** React Hook Form + Zod

### Blockchain
- **Network:** Stellar (Testnet/Mainnet)
- **SDK:** @stellar/stellar-sdk v12.3
- **Wallet:** @stellar/freighter-api v2.0
- **API:** Horizon REST API

### Backend
- **Runtime:** Next.js API Routes (Edge)
- **Database:** Vercel KV (Redis)
- **Deployment:** Vercel Edge Network
- **Analytics:** Vercel Analytics

### DevOps
- **Version Control:** Git + GitHub
- **CI/CD:** GitHub Actions (automático)
- **Monitoring:** Sentry (error tracking)
- **Testing:** Vitest + Playwright

---

## 📦 Instalación

### Prerrequisitos

- Node.js 18+ 
- npm/yarn/pnpm
- Freighter Wallet (para testing)

### Setup Local

```bash
# 1. Clonar repositorio
git clone https://github.com/tuusuario/paybylink-stellar.git
cd paybylink-stellar

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local

# Editar .env.local con tus credenciales:
# - NEXT_PUBLIC_STELLAR_NETWORK=testnet
# - KV_* (opcional para desarrollo local)

# 4. Iniciar servidor de desarrollo
npm run dev

# Abrir http://localhost:3000
```

### Despliegue Rápido en Vercel

```bash
# 1) Preparar commits en español
git add .
git commit -m "feat: configuración inicial"
git commit --allow-empty -m "chore: preparación para despliegue en Vercel"

# 2) Publicar en GitHub
git branch -M main
git remote add origin https://github.com/tu-usuario/paybylink-stellar.git
git push -u origin main

# 3) Importar en Vercel (Dashboard)
# - Selecciona el repo
# - Framework: Next.js
# - Variables de entorno:
#   NEXT_PUBLIC_STELLAR_NETWORK=testnet
#   (opcional) KV_* si usas Vercel KV

# 4) Deploy de producción con CLI (opcional)
npm i -g vercel
vercel login
vercel --prod

# 5) Post-deploy (actualizar README con URL en vivo)
git commit -m "docs: agrega URL de demo en vivo"
git push
```

---

## 📖 Uso

### Para Receptores (Crear Link)

```typescript
// 1. Acceder a /create
// 2. Completar formulario:

interface PaymentLinkForm {
  amount: number;           // Ej: 50
  currency: 'USDC' | 'XLM'; // Seleccionar
  description: string;       // "Consultoría Web"
  recipientAddress: string;  // Tu wallet Stellar
  expiresIn: number;        // Minutos (default: 1440)
}

// 3. Click "Generar Link"
// 4. Copiar URL o descargar QR
```

### Para Pagadores (Usar Link)

```typescript
// 1. Abrir link recibido
// 2. Ver detalles del pago
// 3. Click "Conectar Freighter"
// 4. Autorizar acceso
// 5. Click "Pagar X USDC"
// 6. Confirmar en Freighter
// 7. ✅ Pago completado
```

### Integración API

```javascript
// Crear link programáticamente
const response = await fetch('/api/links/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    amount: 50,
    currency: 'USDC',
    description: 'Pago por servicio',
    recipientAddress: 'GCXXX...XXXX',
    expiresIn: 1440 // 24 horas
  })
});

const { data } = await response.json();
console.log(data.url); // https://paybylink.app/pay/...
```

---

## 🏗️ Arquitectura

### Diagrama de Flujo

```
┌─────────────┐
│   Cliente   │
│  (Browser)  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│        Next.js Frontend             │
│  - Generador de enlaces             │
│  - Página de pago                   │
│  - Integración Freighter            │
└──────┬────────────────────┬─────────┘
       │                    │
       ▼                    ▼
┌──────────────┐    ┌──────────────┐
│  API Routes  │    │ Vercel KV    │
│  /api/links  │◄───┤   (Redis)    │
└──────┬───────┘    └──────────────┘
       │
       ▼
┌────────────────────────────────────┐
│      Stellar Network               │
│  - Horizon API                     │
│  - Transaction Submission          │
│  - Confirmation Polling            │
└────────────────────────────────────┘
       ▲
       │
       ▼
┌──────────────┐
│   Freighter  │
│    Wallet    │
└──────────────┘
```

### Estructura de Proyecto

```
paybylink-stellar/
├── app/
│   ├── api/
│   │   └── links/
│   │       ├── create/route.ts       # Crear enlace
│   │       └── [id]/
│   │           ├── route.ts          # Obtener enlace
│   │           └── complete/route.ts # Marcar como pagado
│   ├── create/
│   │   └── page.tsx                  # Generador de enlaces
│   ├── pay/[id]/[slug]/
│   │   └── page.tsx                  # Página de pago
│   ├── layout.tsx                    # Layout principal
│   ├── page.tsx                      # Landing page
│   └── globals.css                   # Estilos globales
├── components/
│   ├── ui/                           # Componentes Shadcn
│   ├── wallet-connect.tsx            # Conectar Freighter
│   └── transaction-status.tsx        # Estados de TX
├── lib/
│   ├── stellar/
│   │   ├── config.ts                 # Configuración Stellar
│   │   └── transaction.ts            # Builder de TXs
│   ├── wallet/
│   │   └── freighter.ts              # API Freighter
│   ├── payment-links.ts              # Lógica de enlaces
│   └── utils.ts                      # Utilidades
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

---

## 🔌 API Endpoints

### POST /api/links/create

Crear nuevo enlace de pago.

**Request:**
```json
{
  "amount": 50,
  "currency": "USDC",
  "description": "Consultoría web",
  "recipientAddress": "GCXXX...XXXX",
  "expiresIn": 1440
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "a8f3k2m9",
    "url": "https://paybylink.app/pay/a8f3k2m9/50usdc-consultoria",
    "qrCode": "data:image/png;base64,...",
    "expiresAt": "2025-12-20T15:30:00Z"
  }
}
```

### GET /api/links/[id]

Obtener información de un enlace.

**Response:**
```json
{
  "success": true,
  "data": {
    "amount": 50,
    "currency": "USDC",
    "description": "Consultoría web",
    "recipient": "GCXXX...XXXX",
    "expired": false,
    "used": false,
    "expiresAt": "2025-12-20T15:30:00Z"
  }
}
```

### POST /api/links/[id]/complete

Marcar enlace como pagado.

**Request:**
```json
{
  "txHash": "abc123...xyz"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment registered successfully"
}
```

---

## 🗺️ Roadmap

### ✅ Fase 1 - MVP (Hackathon)
- [x] Generación de enlaces sin registro
- [x] Integración Freighter Wallet
- [x] Pagos en USDC y XLM
- [x] Sistema de expiración
- [x] QR codes automáticos
- [x] Landing page + docs

### 🚧 Fase 2 - Post-Hackathon
- [ ] Dashboard de usuario
- [ ] Historial de transacciones
- [ ] Webhooks para notificaciones
- [ ] Múltiples assets (más allá de USDC/XLM)
- [ ] API pública documentada
- [ ] Sistema de afiliados

### 🔮 Fase 3 - Futuro
- [ ] Smart contracts con Soroban
- [ ] Pagos recurrentes/suscripciones
- [ ] Splits automáticos (multiple recipients)
- [ ] Integración con otras wallets
- [ ] Mobile app (React Native)
- [ ] Fiat on/off ramps

---

## 🤝 Contribuir

¡Contribuciones son bienvenidas! Este proyecto es open source.

### Cómo Contribuir

1. Fork el repositorio
2. Crea tu branch (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Guidelines

- Escribe código limpio y bien documentado
- Sigue las convenciones de TypeScript/React
- Agrega tests para nuevas features
- Actualiza la documentación

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver archivo [LICENSE](LICENSE) para más detalles.

---

## 👥 Equipo

Desarrollado para la **Ideatón Stellar 2025** 🚀

- **Desarrollador:** [Tu Nombre]
- **Track:** Track 1 - Productos en Stellar
- **Contacto:** [email@example.com]

---

## 🙏 Agradecimientos

- [Stellar Development Foundation](https://stellar.org) - Por la increíble blockchain
- [Freighter Team](https://freighter.app) - Por la mejor wallet de Stellar
- [Vercel](https://vercel.com) - Por el hosting y KV storage
- [Shadcn/ui](https://ui.shadcn.com) - Por los componentes UI

---

## 📚 Recursos Adicionales

- [Stellar Docs](https://developers.stellar.org)
- [Freighter API Docs](https://docs.freighter.app)
- [Horizon API Reference](https://developers.stellar.org/api/horizon)
- [Soroban Smart Contracts](https://soroban.stellar.org)

---

<div align="center">

**Hecho con ❤️ para la comunidad Stellar**

[⭐ Star en GitHub](https://github.com/tuusuario/paybylink-stellar) • [🐛 Reportar Bug](https://github.com/tuusuario/paybylink-stellar/issues) • [💡 Sugerir Feature](https://github.com/tuusuario/paybylink-stellar/issues)

</div>
