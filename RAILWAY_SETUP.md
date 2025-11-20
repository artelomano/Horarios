# Railway Setup Guide - Crear Tablas

## Opción 1: Usar Railway CLI (Recomendado)

### 1. Instalar Railway CLI
```bash
npm i -g @railway/cli
railway login
```

### 2. Conectarse al proyecto
```bash
railway link
```

### 3. Crear las tablas
```bash
railway run npm run create-tables
```

## Opción 2: Ejecutar en Railway Dashboard

### 1. Ve a tu servicio en Railway
- Abre el servicio de tu aplicación (no el de PostgreSQL)

### 2. Usa el terminal web
- Ve a la pestaña "Deployments"
- Haz clic en el deployment activo
- Abre el terminal

### 3. Ejecuta el comando
```bash
npm run create-tables
```

## Opción 3: Setup Automático (Ya configurado)

El servidor ya tiene setup automático que crea las tablas al iniciar.

**Solo necesitas:**
1. Asegurarte de que `DATABASE_URL` está configurada en Railway
2. Desplegar la aplicación
3. Las tablas se crearán automáticamente al iniciar el servidor

## Verificar que las tablas se crearon

Después de ejecutar el script, deberías ver:

```
✅ Found 5 tables:
   1. employees
   2. schedules
   3. templates
   4. users
   5. vacations
```

## Variables de Entorno Necesarias

Railway normalmente inyecta automáticamente:
- `DATABASE_URL` - Connection string completa

O puedes usar variables individuales:
- `PGUSER` o `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `RAILWAY_PRIVATE_DOMAIN` o `PGHOST`
- `PGPORT`
- `PGDATABASE` o `POSTGRES_DB`

## Nota Importante

**No puedes ejecutar esto desde tu máquina local** porque `postgres.railway.internal` solo funciona dentro de la red de Railway.

Debes ejecutarlo:
- ✅ En Railway (usando CLI o terminal web)
- ✅ O dejar que el setup automático lo haga al iniciar el servidor

