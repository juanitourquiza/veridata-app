# Veridata App

**Client-facing frontend for the Veridata SaaS platform** — built with Angular 20+ as a standalone project.

> **[Leer en Español](#aplicación-veridata)**

---

## Overview

Veridata App is the primary frontend where organizations evaluate their personal data protection compliance. It provides a 4-step guided wizard to assess maturity across regulatory controls, generate gap reports, action plans, and AI-powered executive summaries.

## Tech Stack

| Component | Tech |
|-----------|------|
| Framework | Angular 20+ (standalone) |
| Styling | TailwindCSS v4 + custom design system |
| Auth | Sanctum tokens (via HTTP interceptor) |
| State | Angular Signals |
| Routing | Lazy-loaded routes with auth guard |
| Typography | Inter (Google Fonts) |

## Features

- 🔐 **Login / Register** — Sanctum token auth with role-based access
- 📋 **Project Wizard (4 steps)**
  1. **Project Info** — Name, framework, data categories, subjects count
  2. **Evaluation** — Rate maturity (0-5) per control across 11 domains
  3. **Results** — Global maturity score, domain breakdown, gap report, AI executive summary
  4. **Action Plan** — Generated remediation tasks with priorities and status tracking
- 📊 **Project List** — Overview of all projects with status badges
- 🔗 **Shared Links** — Public read-only access for stakeholders

## Project Structure

```
src/app/
├── core/
│   ├── environment.ts          API URL config
│   ├── guards/                 auth.guard.ts
│   ├── interceptors/           auth.interceptor.ts (Sanctum token)
│   ├── models/                 models.ts (TypeScript interfaces)
│   └── services/
│       ├── api.service.ts      All HTTP calls
│       └── auth.service.ts     Login, register, token management
├── auth/
│   ├── login.component.ts      Split-screen login page
│   └── register.component.ts   Registration form
├── layout/
│   └── layout.component.ts     Sidebar shell with navigation
└── projects/
    ├── project-list/           Project list with cards
    └── project-wizard/         4-step wizard (evaluation flow)
```

## Prerequisites

- Node.js 18+
- npm 9+
- Angular CLI (`npx @angular/cli`)

## Installation

```bash
git clone <repo-url> veridata-app
cd veridata-app
npm install
```

## Development

```bash
# Start dev server (port 4200)
npx ng serve

# Build for production
npx ng build --configuration=production
```

The app connects to the API at `http://localhost:8000/api` by default. Change this in `src/app/core/environment.ts`.

## API Connection

This app consumes the **veridata-api** REST backend. Make sure it's running:
```bash
cd ../veridata-api && php artisan serve
```

## Design System

The `.vd-*` CSS classes provide a consistent design language:

| Class | Purpose |
|-------|---------|
| `.vd-card` | Content container with shadow |
| `.vd-btn` `.vd-btn-primary` | Primary action button |
| `.vd-btn-secondary` | Outlined button |
| `.vd-input` | Text input |
| `.vd-select` | Dropdown select |
| `.vd-label` | Form label |
| `.vd-badge` | Status/priority badge |
| `.vd-table` | Data table |
| `.vd-progress-bar` | Progress indicator |
| `.vd-stepper` | Multi-step wizard |

---

# Aplicación Veridata

**Frontend para clientes de la plataforma SaaS Veridata** — construido con Angular 20+ como proyecto standalone.

## Descripción

Veridata App es el frontend principal donde las organizaciones evalúan su cumplimiento de protección de datos personales. Provee un asistente guiado de 4 pasos para evaluar la madurez en controles regulatorios, generar informes de brechas, planes de acción y resúmenes ejecutivos con IA.

## Funcionalidades

- 🔐 **Login / Registro** — Autenticación Sanctum con roles
- 📋 **Asistente de Proyecto (4 pasos)**
  1. **Info del Proyecto** — Nombre, marco normativo, categorías de datos
  2. **Evaluación** — Calificar madurez (0-5) por control en 11 dominios
  3. **Resultados** — Madurez global, desglose por dominio, informe GAP, resumen ejecutivo IA
  4. **Plan de Acción** — Tareas de remediación con prioridades y seguimiento
- 📊 **Lista de Proyectos** — Vista general con badges de estado
- 🔗 **Enlaces compartidos** — Acceso público de solo lectura

## Requisitos

- Node.js 18+
- npm 9+

## Instalación

```bash
git clone <repo-url> veridata-app
cd veridata-app
npm install
```

## Desarrollo

```bash
# Iniciar servidor de desarrollo (puerto 4200)
npx ng serve

# Compilar para producción
npx ng build --configuration=production
```

La app se conecta a la API en `http://localhost:8000/api`. Cambia esto en `src/app/core/environment.ts`.

## Conexión con API

Esta app consume el backend **veridata-api**. Asegúrate de que esté corriendo:
```bash
cd ../veridata-api && php artisan serve
```

## Licencia

Propietario / Proprietary
