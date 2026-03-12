# Veridata App — v2.0.0

Plataforma de evaluación de cumplimiento de protección de datos personales.

## Stack Tecnológico

- **Frontend:** Angular 19 (standalone components, signals)
- **Estilos:** CSS vanilla con design system personalizado
- **API:** REST con token Bearer (Laravel Sanctum)

## Credenciales de prueba

| Rol | Email | Contraseña | Permisos |
|-----|-------|------------|----------|
| Admin | admin@veridata.io | password123 | Acceso completo |
| Senior | senior@veridata.io | password123 | Crear proyectos, evaluar, generar reportes, aprobar |
| Junior | junior@veridata.io | password123 | Ver proyectos, evaluar, generar reportes (no crea proyectos) |

## Desarrollo local

```bash
npm install
ng serve --port 4200
```

## Build de producción

```bash
ng build --configuration=production
```

Los archivos se generan en `dist/veridata-app/browser/`.

## Changelog v2.0.0

### Nuevas Funcionalidades
- **Descarga Excel**: Botón para descargar plantillas `.xlsx` originales por dominio (matrices RAT, Riesgos, Calificación de Encargados)
- **Sistema de Templates**: Los entregables ahora se generan desde plantillas centralizadas en `storage/app/templates/`
- **Generación con IA mejorada**: Enriquecimiento de contenido legal vía LLM con contexto LOPDP Ecuador actualizado
- **Exportación profesional**: Documentos PDF y Word con portada, estilos y formato enterprise

### Funcionalidades (desde v1.0.0)
1. **Wizard de proyecto:** Información → Evaluación → Resultados → Plan de Acción → Entregables
2. **Evaluación de controles:** Escala 1-5 (Inexistente a Optimizado)
3. **Informe GAP:** Agrupado por dominio, clasificación Baja/Media/Alta
4. **Gran Escala:** Auto-determinado por titulares + categorías sensibles
5. **Plan de Acción:** Prioridad, responsable y fecha objetivo editables
6. **Informe ejecutivo IA:** Generado con IA o reglas base
7. **Gestor de Entregables:** Templates por dominio LOPDP Ecuador con botones PDF, Word, Excel y Regenerar
8. **Roles:** Admin / Senior / Junior con permisos diferenciados

## URLs de producción

- App: https://phpstack-1212383-6257721.cloudwaysapps.com
- Admin: https://phpstack-1212383-6257728.cloudwaysapps.com
- API: https://phplaravel-1212383-6257708.cloudwaysapps.com
