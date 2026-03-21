import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const token = auth.getToken();

    if (token) {
        req = req.clone({ setHeaders: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
    }

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401) {
                auth.logout();
            }

            // Handle subscription required — redirect to subscription page
            if (error.status === 403 && error.error?.subscription_required) {
                auth.refreshSubscription();
                router.navigate(['/subscription']);
            }

            return throwError(() => error);
        })
    );
};
