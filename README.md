# YouArePilates

SaaS B2B2C para estudios de Pilates: landing comercial, panel de administración
multi-tenant y PWA de alumnos, sobre Next.js + Firebase.

## Decisiones de arquitectura

- **Un solo Next.js (App Router) para las 3 superficies**, en vez de 3 apps separadas:
  - `/` — landing comercial + `/onboarding` (alta de tenant autónoma)
  - `/admin/**` — panel ERP (dueño/staff/instructor), protegido por rol
  - `/s/[tenantSlug]/**` — PWA instalable del alumno, una por estudio
- **Multi-tenant por slug en el path** (`/s/pilates-flow-roma`), no por subdominio — cero
  configuración de DNS/SSL extra y funciona en Firebase Hosting desde el día 1. Migrar a
  subdominio después solo implica cambiar `resolveTenant.ts`.
- **Mercado Pago** para cobros a alumnos (créditos/paquetes) — mejor cobertura de medios de
  pago locales. **Stripe** queda reservado para la facturación SaaS B2B a los dueños de
  estudio (Fase 5, no implementado todavía).
- **Firebase Hosting clásico con la integración de Next.js ("web frameworks")** para
  servir el SSR — se despliega con `firebase deploy --only hosting` y queda en el dominio
  por defecto del proyecto (`https://youarepilates-e202c.web.app`). Configurado en el
  bloque `hosting` de `firebase.json` (`frameworksBackend`); no usa Cloud Function manual
  ni App Hosting. Las credenciales del Admin SDK del lado servidor no hacen falta en
  producción: `src/lib/firebase/admin.ts` cae automáticamente a Application Default
  Credentials, que la Cloud Function desplegada ya trae del propio proyecto.

### Dos correcciones importantes al spec original

1. **Las reglas de Firestore del spec exigían `request.auth != null` para leer el tenant,
   sus sedes, horarios, etc.** Eso rompe el caso de uso obvio de "un alumno potencial
   explora el horario antes de crear una cuenta". `firestore.rules` abre lectura pública
   al *catálogo* (tenant, sedes, salas, instructores, tipos de clase, paquetes, horarios —
   nada de esto es sensible) y mantiene cerradas `bookings`, `studentPasses`, `waitlist` y
   `users` (PII/financiero).
2. **Las estrategias de caché del spec (SWR, network-first, cache-first) no aplican tal
   cual a Firestore.** Un listener `onSnapshot` no es un `fetch` cacheable por un service
   worker — es un canal WebChannel/long-polling. Lo que realmente da "modo offline
   gracioso" es la **persistencia IndexedDB nativa de Firestore**
   (`src/lib/firebase/client.ts`, `persistentLocalCache`), no el service worker. El SW
   (`public/sw.js`) se quedó para lo que sí es cacheable con esas estrategias: shell
   estático, fuentes, íconos, chunks de Next con hash.

## Qué quedó implementado (Fase 1 + piezas clave de 2-4)

- Multi-tenant core: custom claims (`tenantId`, `role`, `branchIds`), `AuthProvider`,
  `TenantProvider`, resolución de tenant por slug server-side.
- Landing + onboarding autónomo de estudio (`onboardTenant`).
- Panel admin: shell con guard de rol, dashboard con conteos en vivo, CRUD mínimo de
  sedes y paquetes, vista de horarios en vivo.
- PWA de alumno: manifest dinámico por tenant, explorador de clases con reserva en vivo,
  perfil con créditos/historial, "mi ticket" de check-in (funciona con la cache offline
  de Firestore), login/registro de alumno.
- **El motor transaccional completo** (lo más riesgoso del sistema):
  `functions/src/bookings/bookClassSession.ts` y `cancelBookingSession.ts` — cero
  sobreventa garantizada por transacción de Firestore, gating de nivel avanzado, lista de
  espera FIFO con promoción automática al cancelar (`waitlist/promoteWaitlist.ts`).
- Reglas de Firestore/Storage e índices compuestos para todas las queries usadas.

## Qué queda pendiente (siguientes fases)

- **Fase 2**: generador de plantillas de horario recurrente, CRUD completo de
  instructores/tipos de clase/mapa de camas de reformer, bloqueo de máquina por
  mantenimiento, ficha de salud/restricciones físicas.
- **Fase 4**: checkout real de Mercado Pago (el webhook en
  `functions/src/payments/mercadopago.ts` es un scaffold: falta crear la Preference con
  `external_reference`, el doc `purchaseIntents` pendiente, y validar la firma del
  webhook), push notifications con FCM (hay un `TODO` exacto en `promoteWaitlist.ts`).
  check-in por QR real en recepción (el código actual solo muestra el ID corto).
- **Fase 5**: facturación SaaS a dueños de estudio (Stripe), invitación de staff/
  instructores desde el panel (hoy solo existe alta de owner y de alumno).

## Estructura

```
src/app/                      # Next.js App Router: landing, /admin, /s/[tenantSlug], /login
src/lib/firebase/             # client.ts (SDK web) y admin.ts (Admin SDK, server-only)
src/lib/auth/AuthProvider.tsx # contexto de sesión + custom claims
src/lib/tenant/               # resolución de tenant por slug + contexto
src/lib/types/firestore.ts    # tipos del modelo de datos
functions/src/bookings/       # bookClassSession, cancelBookingSession (transaccional)
functions/src/waitlist/       # promoción de lista de espera
functions/src/tenants/        # onboardTenant, registerStudent
functions/src/payments/       # webhook de Mercado Pago (scaffold)
firestore.rules / .indexes.json / storage.rules
firebase.json                 # Hosting (Next.js) + Firestore/Storage/Functions + emuladores
.env.production                # config pública del SDK web para el build de producción
```

## Cómo correrlo

1. Crea un proyecto de Firebase y copia `.firebaserc.example` → `.firebaserc` con su ID.
2. Copia `.env.local.example` → `.env.local` y llena las claves del SDK web (Firebase
   Console → Project settings → Your apps).
3. `npm install` (raíz) y `npm install` dentro de `functions/`.
4. Emuladores (recomendado para desarrollar sin tocar producción):
   ```
   cd functions && npm run build && cd ..
   firebase emulators:start
   ```
5. App Next.js: `npm run dev` → http://localhost:3000
   - Landing: `/`
   - Crear estudio: `/onboarding`
   - Panel: `/admin`
   - PWA de alumno: `/s/<slug-del-estudio>`

`npm run build` (raíz) y `npm run build` (en `functions/`) ya se verificaron sin errores
de tipos ni de build en este scaffold.

## Cómo desplegar (producción)

El proyecto real es `youarepilates-e202c` y ya tiene Firebase Hosting habilitado en su
dominio por defecto (`youarepilates-e202c.web.app`). Para desplegar:

1. `.firebaserc` debe apuntar a ese proyecto (`{"projects": {"default": "youarepilates-e202c"}}` —
   no se versiona, cada quien lo genera con `firebase use youarepilates-e202c --add`).
2. Si es la primera vez que este CLI despliega Next.js a Hosting, habilita la integración:
   `firebase experiments:enable webframeworks` (en CLIs recientes ya viene activada por
   default y el comando no hace falta).
3. `firebase deploy --only hosting` — construye el Next.js (usa `.env.production`, que sí
   se versiona porque son claves públicas del SDK web) y lo publica en
   `https://youarepilates-e202c.web.app`.
4. Cuando cambien reglas/índices o Cloud Functions, despliega esas partes aparte:
   `firebase deploy --only firestore:rules,firestore:indexes` y
   `firebase deploy --only functions`.

No hace falta configurar credenciales del Admin SDK para este deploy: la Cloud Function
que sirve el SSR corre con las Application Default Credentials del propio proyecto.
