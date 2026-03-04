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
            { path: '', redirectTo: 'projects', pathMatch: 'full' },
            { path: 'projects', loadComponent: () => import('./projects/project-list/project-list.component').then(m => m.ProjectListComponent) },
            { path: 'projects/new', loadComponent: () => import('./projects/project-wizard/project-wizard.component').then(m => m.ProjectWizardComponent) },
            { path: 'projects/:id', loadComponent: () => import('./projects/project-wizard/project-wizard.component').then(m => m.ProjectWizardComponent) },
        ],
    },
    { path: '**', redirectTo: '' },
];
