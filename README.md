# Veridata App — v2.2.0

Plataforma de evaluación de cumplimiento de protección de datos personales (LOPDP Ecuador).

## Stack Tecnológico

- **Frontend:** Angular 19 (standalone components, signals)
- **Estilos:** CSS vanilla con design system personalizado
- **API:** REST con token Bearer (Laravel Sanctum)

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

## Changelog v2.2.0

### 🔧 Mejoras y Fixes
- Repositorio de entregables con sistema de versiones completo
- Dashboard accesible sin suscripción activa
- Fix de navegación del menú Herramientas PDP
- Eliminación de credenciales demo del login

## Changelog v2.1.0

### 💳 Sistema de Suscripciones y Pagos
- **Selección de planes:** Pantalla completa con tabs Standard / Firma / Corporativo
- **7 planes configurables:** Inicial, Crecimiento, Avanzado, Firma 10/20/Plus, Corporativo
- **3 períodos de facturación:** Mensual, Semestral, Anual (Corporativo: 1/2/3 años)
- **Métodos de pago:** Tarjeta de crédito (PayPhone) y transferencia bancaria
- **Suscripción actual:** Banner con estado, vencimiento y slots de empresas
- **Enlace en sidebar:** "💳 Mi Suscripción"

### 💰 Calculadora de Sanciones (reescrita)
- **Modelo VDN:** Basada en Volumen de Negocio Anual (no UT fijas), siguiendo modelo ECIJA GPA
- **Wizard de 4 pasos:** Dimensión empresa → Escenario → Factores de madurez → Resultado
- **17 escenarios:** 5 leves (0.1%-0.7% VDN) + 12 graves (0.7%-1% VDN) con descripciones
- **9 preguntas de madurez:** Sí/No con Índice de Madurez Referencial
- **Resultado completo:** Multa estimada, rango legal, desglose de factores, base legal

### 📊 Cálculo de Gran Escala (corregido)
- **Scoring revisado:** Titulares (max 25), Volumen (15), Frecuencia (15), Permanencia (10), Alcance (15), Datos especiales (20) = Total max 100 pts, umbral 50
- **Calificación directa:** Perfilamiento, vigilancia, sensibles masivos (Art. 14.3 LOPDP)
- **Alerta visual:** Indicador cuando aplica calificación directa

### 🚨 Registro de Incidentes (mejorado)
- **Multiselect datos afectados:** Checkboxes para 12 categorías de datos
- **Tipos de incidente alineados:** Conforme a matriz Excel proporcionada
- **Evaluación de riesgo:** 7 factores del Excel (impacto, credenciales, identificación, consecuencia, protección, cifrado, mitigación)
- **Preview en vivo:** Score de riesgo y decisiones de notificación en tiempo real
- **Guardado real:** Integración con API backend

### ⚖️ Ejercicio de Derechos (ampliado)
- **Nuevos derechos:** Eliminación y Revocatoria del consentimiento
- **Validación mejorada:** Campos opcionales correctamente configurados

### ⭐ Calificaciones (correcciones)
- **Resumen de calificaciones:** Conectado a datos reales de API
- **Encargados y transferencias:** Parámetros completos de matriz, multiselect de datos

### Changelog v2.0.0
- Descarga Excel, sistema de templates, generación IA, exportación PDF/Word profesional

### Funcionalidades core (desde v1.0.0)
1. **Wizard de proyecto:** Información → Evaluación → Resultados → Plan de Acción → Entregables
2. **Evaluación de controles:** Escala 1-5 (Inexistente a Optimizado)
3. **Informe GAP:** Agrupado por dominio, clasificación Baja/Media/Alta
4. **Plan de Acción:** Prioridad, responsable y fecha objetivo editables
5. **Informe ejecutivo IA:** Generado con IA o reglas base
6. **Gestor de Entregables:** Templates por dominio LOPDP Ecuador
7. **Roles:** Admin / Senior / Junior con permisos diferenciados

## URLs de producción

- App: https://phpstack-1212383-6257721.cloudwaysapps.com
- Admin: https://phpstack-1212383-6257728.cloudwaysapps.com
- API: https://phplaravel-1212383-6257708.cloudwaysapps.com
