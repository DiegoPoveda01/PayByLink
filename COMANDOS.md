# 🎯 COMANDOS RÁPIDOS - PayByLink

## 📦 Instalación

```bash
npm install
```

## 🚀 Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run dev

# Abrir en: http://localhost:3000
```

## 🏗️ Build

```bash
# Compilar para producción
npm run build

# Iniciar versión compilada
npm start
```

## 🧪 Testing

```bash
# Verificar tipos TypeScript
npm run type-check

# Ejecutar linter
npm run lint

# Fix linting automático
npm run lint -- --fix
```

## 🚀 Deployment

```bash
# Opción 1: Vercel CLI
npm i -g vercel
vercel login
vercel --prod

# Opción 2: Git Push (si conectaste con GitHub)
git add .
git commit -m "feat: listo para producción"
git push origin main
# Auto-deploy en Vercel
```

## 📚 Ver Documentación

```bash
# Inicio rápido
cat QUICKSTART.md

# Setup completo
cat SETUP.md

# Deploy
cat DEPLOYMENT.md

# Video pitch
cat VIDEO-PITCH.md

# Resumen ejecutivo
cat RESUMEN.md
```

## 🔧 Troubleshooting

```bash
# Limpiar caché y reinstalar
rm -rf node_modules .next package-lock.json
npm install

# Verificar versión Node
node --version  # Debe ser 18+

# Ver logs detallados
npm run dev -- --debug
```

## 🧹 Limpiar

```bash
# Borrar archivos generados
rm -rf .next out node_modules

# Reinstalar desde cero
npm install
```

## 📊 Análisis

```bash
# Analizar bundle size
npm run build
# Vercel Analytics se activa automáticamente al deployar
```

## 🐛 Debug

```bash
# Modo debug
NODE_OPTIONS='--inspect' npm run dev

# Ver variables de entorno
cat .env.local
```

## ✅ Checklist Pre-Demo

```bash
# 1. Verificar que compila
npm run build

# 2. Verificar tipos
npm run type-check

# 3. Verificar linting
npm run lint

# 4. Iniciar en dev
npm run dev

# 5. Probar en navegador
# - Crear link
# - Pagar con Freighter
# - Verificar confirmación
```

## 🎥 Para Grabar Video

```bash
# 1. Limpiar navegador
# - Cerrar tabs innecesarias
# - Limpiar historial
# - Cerrar notificaciones

# 2. Preparar Freighter
# - Cambiar a Testnet
# - Tener fondos USDC
# - Practicar flujo

# 3. Iniciar proyecto
npm run dev

# 4. Grabar con OBS/Loom
```

## 📤 Envío Final

```bash
# 1. Verificar repo GitHub es público
# 2. Deploy en Vercel funcionando
# 3. README actualizado
# 4. Video subido (YouTube/Vimeo)
# 5. Enviar a DoraHacks
```

## 🔗 Links Útiles

- Freighter Wallet: https://www.freighter.app/
- Stellar Lab (Testnet funds): https://laboratory.stellar.org/#account-creator?network=test
- Stellar Expert: https://stellar.expert/explorer/testnet
- Vercel Dashboard: https://vercel.com/dashboard
- DoraHacks: [URL cuando esté disponible]

## 💡 Tips Rápidos

```bash
# Cambiar puerto (si 3000 está ocupado)
PORT=3001 npm run dev

# Ver en red local (desde teléfono)
npm run dev -- --host
# Acceder desde: http://tu-ip:3000

# Modo producción local
npm run build && npm start
```

## 🎯 Workflow Recomendado

```bash
# Día 1: Setup y pruebas
npm install
npm run dev
# Probar todo el flujo

# Día 2: Grabar video
npm run build
npm run dev
# Grabar demo completo

# Día 3: Deploy y envío
vercel --prod
# Verificar en producción
# Enviar a DoraHacks
```

## 🚨 En Caso de Emergencia

```bash
# Si algo no funciona:
# 1. Limpiar todo
rm -rf node_modules .next package-lock.json

# 2. Reinstalar
npm install

# 3. Verificar variables de entorno
cat .env.local
# Debe tener: NEXT_PUBLIC_STELLAR_NETWORK=testnet

# 4. Reintentar
npm run dev

# Si persiste el problema:
# - Verifica Node version (18+)
# - Revisa console del navegador
# - Verifica que Freighter esté instalado
```

---

**Creado para la Ideatón Stellar 2025 🚀**
