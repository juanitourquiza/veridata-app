import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    { path: 'login', loadComponent: () => import('./auth/login.component').then(m => m.LoginComponent) },
    { path: 'register', loadComponent: () => import('./auth/register.component').then(m => m.RegisterComponent) },
    {
        path: '',
        loadComponent: () => import('./layout/layout.component').then(m => m.LayoutComponent),
        canActivate: [authGuard],
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            { path: 'dashboard', loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent) },
            { path: 'projects', loadComponent: () => import('./projects/project-list/project-list.component').then(m => m.ProjectListComponent) },
            { path: 'projects/new', loadComponent: () => import('./projects/project-wizard/project-wizard.component').then(m => m.ProjectWizardComponent) },
            { path: 'projects/:id', loadComponent: () => import('./projects/project-wizard/project-wizard.component').then(m => m.ProjectWizardComponent) },

            // Suscripción
            { path: 'subscription', loadComponent: () => import('./subscription/subscription.component').then(m => m.SubscriptionComponent) },

            // Configuración del Tenant
            { path: 'config', loadComponent: () => import('./tenant-config/tenant-config.component').then(m => m.TenantConfigComponent) },

            // Herramientas y Registros PDP
            { path: 'tools', loadComponent: () => import('./tools/tools.component').then(m => m.ToolsComponent) },
            { path: 'tools/rat', loadComponent: () => import('./tools/rat/rat.component').then(m => m.RatComponent) },
            { path: 'tools/impact-assessment', loadComponent: () => import('./tools/impact-assessment/impact-assessment.component').then(m => m.ImpactAssessmentComponent) },
            { path: 'tools/officer-qualification', loadComponent: () => import('./tools/officer-qualification/officer-qualification.component').then(m => m.OfficerQualificationComponent) },
            { path: 'tools/transfer-qualification', loadComponent: () => import('./tools/transfer-qualification/transfer-qualification.component').then(m => m.TransferQualificationComponent) },
            { path: 'tools/qualifications-summary', loadComponent: () => import('./tools/qualifications-summary/qualifications-summary.component').then(m => m.QualificationsSummaryComponent) },
            { path: 'tools/rights-exercise', loadComponent: () => import('./tools/rights-exercise/rights-exercise.component').then(m => m.RightsExerciseComponent) },
            { path: 'tools/incidents', loadComponent: () => import('./tools/incidents/incidents.component').then(m => m.IncidentsComponent) },
            { path: 'tools/legitimacy-report', loadComponent: () => import('./tools/legitimacy-report/legitimacy-report.component').then(m => m.LegitimacyReportComponent) },
            { path: 'tools/sanctions-calculator', loadComponent: () => import('./tools/sanctions-calculator/sanctions-calculator.component').then(m => m.SanctionsCalculatorComponent) },
            { path: 'tools/large-scale-calculator', loadComponent: () => import('./tools/large-scale-calculator/large-scale-calculator.component').then(m => m.LargeScaleCalculatorComponent) },
        ],
    },
    { path: '**', redirectTo: '' },
];
