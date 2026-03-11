# Migración de Firebase a Supabase

## Pasos completados

1. ✅ Instaladas dependencias de Supabase (`@supabase/supabase-js`, `@supabase/ssr`)
2. ✅ Eliminadas dependencias de Firebase
3. ✅ Creados clientes de Supabase (browser y server)
4. ✅ Actualizado AuthContext para usar Supabase Auth
5. ✅ Migradas las acciones de autenticación
6. ✅ Creado schema SQL para Supabase

## Configuración necesaria

### 1. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea un nuevo proyecto
2. Copia la URL del proyecto y la clave anónima (anon key)

### 2. Configurar variables de entorno

Crea un archivo `.env.local` basado en `.env.local.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima
```

### 3. Ejecutar el schema SQL

1. Ve al SQL Editor en tu dashboard de Supabase
2. Copia y pega el contenido de `supabase-schema.sql`
3. Ejecuta el script para crear todas las tablas y políticas

### 4. Configurar Storage (opcional)

Si necesitas almacenar imágenes:

1. Ve a Storage en Supabase
2. Crea un bucket llamado `avatars` para fotos de perfil
3. Crea un bucket llamado `posts` para imágenes de publicaciones
4. Crea un bucket llamado `businesses` para imágenes de negocios
5. Configura las políticas de acceso según necesites

## Diferencias principales

### Estructura de datos

- **Firebase**: Usa colecciones y documentos (NoSQL)
- **Supabase**: Usa tablas relacionales (PostgreSQL)

### Nombres de campos

Firebase usaba camelCase, Supabase usa snake_case:
- `fullName` → `full_name`
- `stageName` → `stage_name`
- `photoUrl` → `photo_url`
- `createdAt` → `created_at`
- etc.

### Autenticación

- Firebase: `onAuthStateChanged`
- Supabase: `onAuthStateChange` + `getSession`

### Realtime

- Firebase: `onSnapshot`
- Supabase: `channel().on('postgres_changes')`

## Próximos pasos

1. Actualizar componentes que usen datos de usuarios
2. Implementar funciones para posts, polls y businesses
3. Configurar Storage para imágenes
4. Actualizar tipos TypeScript si es necesario (snake_case vs camelCase)
