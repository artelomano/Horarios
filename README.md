# Gestor de Horarios

Una aplicación web simple para gestionar horarios de empleados y controlar horas de trabajo.

## Características

- **Vista de Calendario**: Calendario mensual para programación
- **Gestión de Empleados**: 
  - Añadir, editar y eliminar empleados
  - Seguimiento separado de empleados internos y externos
  - Control de horas solo para empleados internos
  - Monitoreo del estado de horas (alertas cuando están por debajo de -2 horas)
  - **Campo de Comentarios**: Para registrar excepciones, notas especiales y casos particulares de cada empleado

## Tipos de Empleados

### Empleados Internos (Horas Controladas)
- Patricia (Administradora)
- Desi (Recepcionista)
- Lanny (Higienista Dental)
- Maite (Higienista)

### Empleados Externos (Autónomos)
- Sergio (Cirujano)
- Reme (General y Endodoncias)
- Gloria (General) - Actualmente de baja
- Carmen (General)
- Elena (Ortodoncia)
- Bea (Prótesis y Periodoncia)
- Armando (Endodoncia)
- Natalia (General)

## Base de Datos

La aplicación utiliza localStorage del navegador para persistencia de datos. Todos los datos de empleados se almacenan localmente en el navegador.

## Uso

1. Abre `index.html` en un navegador web
2. Usa "Gestionar Empleados" para añadir, editar o eliminar empleados
3. Usa "Ver Calendario" para ver el calendario mensual
4. Los empleados internos pueden tener sus horas por semana y estado de horas controlados
5. Los empleados externos no tienen control de horas
6. Utiliza el campo de **Comentarios** para registrar excepciones y casos especiales de cada empleado

## Excepciones y Casos Especiales

### Desi (Recepcionista)
**IMPORTANTE**: Desi hace **SIEMPRE 36 horas a la semana** (no 40 como otros empleados internos).

**Sistema de crédito de horas:**
- Si debe hacer un turno de 4.5h, le quedan 0.5h de crédito
- Estas horas de crédito se recuperan en turnos posteriores
- **Es fundamental controlar el estado de horas** para llevar un registro preciso de estos créditos y recuperaciones

**Ejemplo práctico:**
- Semana 1: 36h contratadas, turno de 4.5h → Crédito: +0.5h
- Semana 2: 36h contratadas, turno de 4h → Crédito: -0.5h (recupera el crédito anterior)
- El estado de horas debe reflejar estos ajustes para mantener el balance correcto

### Gloria (General - Externa)
Actualmente de baja. Este estado se puede registrar en el campo de comentarios.

### Notas Generales sobre Excepciones

- **Siempre registrar en comentarios** cualquier excepción o caso especial de un empleado
- Los turnos que no coinciden exactamente con las horas contratadas deben documentarse
- El campo de comentarios es visible en la tarjeta de cada empleado para referencia rápida
- Actualizar los comentarios cuando cambien las condiciones o excepciones

## Detalles Técnicos

- **Lenguajes**: HTML, CSS, JavaScript
- **Almacenamiento**: localStorage del navegador (enfoque basado en archivos)
- **Fuente**: Montserrat
- **Diseño**: Basado en las directrices de estilo de menestystarinat.fi

## Esquema de Colores

- Blanco: #fff (fondo)
- Negro: #000 (texto)
- Primario: #005B52 (verde oscuro)
- Secundario: #1E1E1E (gris oscuro)
- Verde Claro: #04BF8A
- Amarillo Oscuro: #C1D711
- Amarillo Claro: #DBF226
- Gris Claro: #B3B3B3

## Compatibilidad del Navegador

Funciona en todos los navegadores modernos que soporten:
- JavaScript ES6
- API localStorage
- CSS Grid
