# Rey Leon App

## Desarrollo local

```bash
npm install
npm run dev
```

Abrir http://localhost:3000.

## Push notifications (eventos de calendario)

Esta app ahora envia push web cuando se crea un evento nuevo en calendario.

### 1) Variables de entorno

Crear un archivo `.env.local` con:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:tu-email@dominio.com
```

Para generar llaves VAPID:

```bash
npx web-push generate-vapid-keys
```

### 2) Tabla de suscripciones push

Ejecutar en Supabase SQL Editor:

```sql
-- scripts/create_push_subscriptions.sql
```

### 3) Consideraciones mobile

- Android: funciona en Chrome.
- iPhone: requiere app instalada en pantalla de inicio (PWA) y permiso de notificaciones.
- En local (`localhost`) funciona para pruebas; en produccion usar HTTPS.

