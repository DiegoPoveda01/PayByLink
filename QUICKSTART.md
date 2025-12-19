# ⚡ PayByLink - Quick Start

## 🚀 Iniciar en 3 Pasos

### 1. Instalar Dependencias
```bash
npm install
```

### 2. Iniciar Servidor
```bash
npm run dev
```

### 3. Abrir en Navegador
```
http://localhost:3000
```

---

## 📦 ¿Qué se Instaló?

- ✅ **Next.js 15** - Framework React
- ✅ **Stellar SDK** - Integración blockchain
- ✅ **Freighter API** - Wallet integration
- ✅ **TailwindCSS** - Estilos
- ✅ **TypeScript** - Type safety
- ✅ Y más...

**Total:** ~300MB en node_modules

---

## 🧪 Primer Test

### 1. Instalar Freighter Wallet

- Ve a: https://www.freighter.app/
- Instala extensión en tu navegador
- Crea una wallet
- **Cambia a Testnet** en configuración

### 2. Obtener Fondos de Testnet

- Abre Freighter → Copia tu dirección (G...)
- Ve a: https://laboratory.stellar.org/#account-creator?network=test
- Pega tu dirección → "Get test network lumens"
- Agrega USDC: Code `USDC`, Issuer `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5`

### 3. Probar el Flujo

**Crear Link:**
1. http://localhost:3000 → "Crear Link Gratis"
2. Monto: `10`, Moneda: `USDC`
3. Descripción: `"Prueba"`
4. Tu dirección: (de Freighter)
5. "Generar Link" → Copiar URL

**Pagar:**
1. Abrir link copiado en nueva pestaña
2. "Conectar Freighter Wallet"
3. Autorizar
4. "Pagar 10 USDC"
5. Confirmar en Freighter
6. ✅ ¡Pago completado!

---

## 📁 Estructura del Proyecto

```
paybylink-stellar/
│
├── app/                    # Páginas Next.js
│   ├── page.tsx           # 🏠 Landing page
│   ├── create/            # 📝 Crear enlaces
│   ├── pay/[id]/[slug]/   # 💳 Página de pago
│   └── api/               # 🔌 API endpoints
│
├── components/            # ⚛️ Componentes React
│   ├── ui/               # 🎨 UI components (Shadcn)
│   ├── wallet-connect    # 💼 Conectar Freighter
│   └── transaction-status # 📊 Estados de pago
│
├── lib/                   # 🛠️ Utilidades
│   ├── stellar/          # ⭐ Integración Stellar
│   ├── wallet/           # 💰 Freighter API
│   └── payment-links.ts  # 🔗 Lógica de enlaces
│
└── Documentación         # 📚
    ├── README.md         # Docs principal
    ├── SETUP.md          # Guía detallada
    ├── DEPLOYMENT.md     # Deploy en Vercel
    └── VIDEO-PITCH.md    # Script para video
```

---

## 🐛 Problemas Comunes

### No arranca el servidor
```bash
# Borrar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Error "Freighter not found"
- Instala Freighter Wallet: https://www.freighter.app/
- Refresca la página

### Error "Invalid address"
- Las direcciones Stellar empiezan con `G` y tienen 56 caracteres
- Ejemplo: `GCXXX...XXXX` (56 chars)

### Link no funciona
- Verifica que no haya expirado
- Asegúrate de estar en Testnet (Freighter y app)

---

## 📚 Más Información

- **Setup Completo:** Ver [SETUP.md](SETUP.md)
- **Deployment:** Ver [DEPLOYMENT.md](DEPLOYMENT.md)
- **Video Pitch:** Ver [VIDEO-PITCH.md](VIDEO-PITCH.md)
- **Documentación:** Ver [README.md](README.md)

---

## 🎯 Próximos Pasos

1. ✅ Probar el flujo completo localmente
2. 📹 Grabar video pitch (5 min)
3. 🚀 Deploy en Vercel
4. 📤 Enviar a DoraHacks

---

## 💬 ¿Necesitas Ayuda?

- 📖 Lee la documentación completa
- 🐛 Revisa la sección de troubleshooting
- 💡 Revisa el código (está muy comentado)

---

## ✨ Features Principales

- 🔗 **Genera links de pago** en 10 segundos
- 💰 **Sin registro** - Conecta wallet solo al recibir
- ⚡ **Pagos instantáneos** - 3-5 segundos en Stellar
- 🔒 **Seguro** - Sin custodia de fondos
- 📱 **Responsive** - Funciona en mobile y desktop
- 🎨 **UI Moderna** - Diseño profesional con TailwindCSS

---

## 🏆 Para la Hackathon

- ✅ **Funcional:** Todo el flujo implementado
- ✅ **Deployable:** Listo para Vercel
- ✅ **Documentado:** README + guías completas
- ✅ **Open Source:** Código limpio y comentado
- ✅ **Video Ready:** Script para pitch incluido

---

**¡Éxito en la hackathon! 🚀**
