# Test App

Esta es una aplicación de prueba para verificar que los subdirectorios funcionan correctamente en el dominio `patricia.nosolowebs.es`.

## Acceso

- URL: `http://patricia.nosolowebs.es/test-app/`
- Archivo: `test-app/index.html`

## Propósito

Probar la estructura de subdirectorios para poder tener múltiples aplicaciones web en el mismo dominio:

- `/` - Aplicación principal (Horarios)
- `/test-app/` - Aplicación de prueba
- `/otra-app/` - Futuras aplicaciones

## Configuración en Railway

Para que funcione correctamente, asegúrate de que:

1. El servidor está configurado para servir archivos estáticos desde subdirectorios
2. Railway está configurado para servir desde el directorio raíz
3. Las rutas están correctamente configuradas en `server.js`

