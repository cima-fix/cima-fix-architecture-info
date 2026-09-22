# Cima Fix — Prototipo Navegable

Prototipo mínimo de la Arquitectura de la Información: esqueleto de navegación del sitemap (Fase 1, Aidan), esquema de base de datos (`db/schema.sql`), y el task flow **"Reportar incidencia"** (Fase 2, Carlos) recorrible de inicio a fin.

## Cómo correrlo

No requiere `npm install` ni build — es HTML/CSS/JS plano. Solo necesitas servirlo con un servidor local (abrir los archivos directo con `file://` rompe las rutas relativas en algunos navegadores):

```bash
# con Python (ya viene instalado casi siempre)
python -m http.server 8080

# o con Node, sin instalar nada global
npx serve .
```

Luego abre `http://localhost:8080` en el navegador.

## Rutas (sitemap)

| Ruta               | Pantalla                                  | Estado                        |
| ------------------- | ------------------------------------------ | ------------------------------ |
| `/index.html`       | Inicio                                     | Navegación al resto            |
| `/reportar.html`    | Reportar → Nuevo reporte                   | **Funcional** (task flow completo) |
| `/atender.html`     | Atender → Reportes Nuevos                  | Funcional (lee lo que crea Reportar); "Mis asignados" placeholder |
| `/supervisar.html`  | Supervisar → Dashboard / etc.              | Placeholder                    |
| `/perfil.html`      | Mi perfil                                  | Placeholder                    |

## Esquema de base de datos

`db/schema.sql` — tablas `Usuario`, `Categoria`, `Salon`, `Reporte` (con PK, FK e índices). Incluye 3 campos que no estaban en la versión original del ERD de Aidan (`estado`, `urgencia`, `fecha_creacion`), agregados para poder implementar el task flow — ver el comentario al inicio del archivo.

Este prototipo no corre una base de datos real: usa `localStorage` como simulación (mismo criterio que el resto de la suite, sin backend), pero los datos que guarda respetan exactamente la forma de `schema.sql`.

## Task flow implementado: "Reportar incidencia"

Ruta feliz: elegir salón → elegir categoría → describir + marcar urgencia → confirmar → se crea el reporte (`estado = recibido`) y aparece en Atender.

Casos cubiertos (como pide el task flow original):

- **Side door**: entrar con `reportar.html?salon=1` simula llegar por QR — el salón viene preseleccionado y bloqueado.
- **QR inválido**: `reportar.html?salon=99` (salón que no existe) muestra un error explícito y no crea ningún ticket.
- **Abandono a mitad del formulario**: el borrador se guarda en `localStorage` en cada cambio; si recargas o vuelves después, se ofrece continuar donde quedaste.
- **Posible duplicado**: si ya reportaste la misma categoría en el mismo salón hace menos de 1 hora, se pregunta antes de crear un reporte nuevo.

## Pendiente / fuera de alcance de este prototipo

- Fases 3, 4 y 5 del documento de arquitectura (Pirámide Invertida, Matriz Diagnóstica, Experience Stack) — no son parte del prototipo navegable, viven en el documento PDF del equipo.
- Confirmar con Aidan si los 3 campos agregados a `Reporte` (`estado`, `urgencia`, `fecha_creacion`) se suben también a la versión oficial del ERD.
