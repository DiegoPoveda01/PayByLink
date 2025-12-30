# PayByLink - Pagos Instantáneos en Stellar

Plataforma para generar enlaces de pago en Stellar sin registro, sin comisiones ocultas y sin complicaciones.

Demo en vivo: https://pay-by-link-kappa.vercel.app

---

## Qué es PayByLink

PayByLink permite crear enlaces de pago en la blockchain de Stellar de forma instantánea. Comparte un link, tu cliente paga, y recibes el dinero en segundos.

### Problema

Los métodos de pago tradicionales en LATAM tienen fricciones:
- Altas comisiones (3-10% por transacción)
- Procesos lentos (24-48 horas)
- Requisitos complejos (registro, verificación)
- Limitaciones internacionales

### Solución

PayByLink simplifica los pagos:
- Crea enlaces en 10 segundos sin registro
- Comisiones mínimas (fees de Stellar ~$0.00001)
- Confirmación en 3-5 segundos
- Sin fronteras ni restricciones geográficas

---

## Características

Generación instantánea de enlaces de pago
- URLs semánticas legibles
- QR codes automáticos

Integración con Freighter Wallet
- Pagos con un click desde el navegador
- Soporte para USDC y XLM

Sistema de expiración inteligente
- Enlaces temporales (configurable)
- Prevención de uso duplicado

Sin custodia
- No almacenamos claves privadas
- Usuario controla 100% sus fondos

---

## Casos de Uso

- Freelancers cobrando por servicios
- Creadores vendiendo contenido
- Pequeños negocios con pagos online
- Propinas y pagos P2P

---

## Stack Tecnológico

Frontend: Next.js 15, TypeScript, TailwindCSS, Shadcn/ui
Backend: Next.js API Routes
Blockchain: Stellar SDK, Freighter Wallet API
Database: Supabase
Deploy: Vercel

---

## Flujo de Pago

1. Ingresar monto, descripción y dirección Stellar
2. Generar link
3. Compartir link (WhatsApp, email, etc)
4. Cliente abre link y conecta Freighter
5. Cliente confirma el pago
6. Pago se completa instantáneamente

---

## Endpoints API

POST /api/links/create
Crear nuevo enlace de pago

GET /api/links/[id]
Obtener información de un enlace

POST /api/links/[id]/complete
Marcar enlace como pagado

---

## Roadmap

Fase 1 (MVP - Hackathon)
- Generación de enlaces sin registro
- Integración Freighter
- Pagos en USDC y XLM
- QR codes automáticos

Fase 2 (Post-Hackathon)
- Dashboard de usuario
- Historial de transacciones
- Webhooks
- Múltiples assets

Fase 3 (Futuro)
- Smart contracts con Soroban
- Pagos recurrentes
- Splits automáticos
- Mobile app

---

## Proyecto

Desarrollado para Ideatón Stellar 2025 - Track 1: Productos en Stellar

GitHub: https://github.com/DiegoPoveda01/PayByLink
