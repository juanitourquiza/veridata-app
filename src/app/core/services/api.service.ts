import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environment';
import { Project, Evaluation, Gap, ActionItem, ExecutiveReport, ControlDomain, PaginatedResponse, Framework } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ApiService {
    private base = environment.apiUrl;
    constructor(private http: HttpClient) { }

    // Projects
    getProjects(): Observable<PaginatedResponse<Project>> { return this.http.get<PaginatedResponse<Project>>(`${this.base}/projects`); }
    getProject(id: number): Observable<Project> { return this.http.get<Project>(`${this.base}/projects/${id}`); }
    createProject(data: Partial<Project>): Observable<Project> { return this.http.post<Project>(`${this.base}/projects`, data); }
    updateProject(id: number, data: Partial<Project>): Observable<Project> { return this.http.put<Project>(`${this.base}/projects/${id}`, data); }
    deleteProject(id: number): Observable<void> { return this.http.delete<void>(`${this.base}/projects/${id}`); }

    // Evaluations
    getEvaluation(projectId: number): Observable<{ evaluations: Evaluation[]; maturity_by_domain: { domain_id: number; domain_name: string; domain_code: string; avg_maturity: number; evaluated_count: number }[]; global_maturity: number }> { return this.http.get<{ evaluations: Evaluation[]; maturity_by_domain: { domain_id: number; domain_name: string; domain_code: string; avg_maturity: number; evaluated_count: number }[]; global_maturity: number }>(`${this.base}/projects/${projectId}/evaluation`); }
    saveEvaluation(projectId: number, evaluations: Partial<Evaluation>[]): Observable<{ message: string }> { return this.http.post<{ message: string }>(`${this.base}/projects/${projectId}/evaluation`, { evaluations }); }

    // Gaps
    getGaps(projectId: number): Observable<{ gaps: Gap[] }> { return this.http.get<{ gaps: Gap[] }>(`${this.base}/projects/${projectId}/gaps`); }
    generateGaps(projectId: number): Observable<{ gaps: Gap[]; total: number }> { return this.http.post<{ gaps: Gap[]; total: number }>(`${this.base}/projects/${projectId}/gaps`, {}); }

    // Action Plan
    getActionPlan(projectId: number): Observable<{ action_items: ActionItem[] }> { return this.http.get<{ action_items: ActionItem[] }>(`${this.base}/projects/${projectId}/action-plan`); }
    generateActionPlan(projectId: number): Observable<{ action_items: ActionItem[]; total: number }> { return this.http.post<{ action_items: ActionItem[]; total: number }>(`${this.base}/projects/${projectId}/action-plan`, {}); }
    updateActionItem(projectId: number, itemId: number, data: Partial<ActionItem>): Observable<{ action_item: ActionItem }> { return this.http.put<{ action_item: ActionItem }>(`${this.base}/projects/${projectId}/action-plan/${itemId}`, data); }

    // Reports
    generateExecutiveReport(projectId: number): Observable<ExecutiveReport> { return this.http.post<ExecutiveReport>(`${this.base}/projects/${projectId}/reports/executive-ai`, {}); }

    // Shared
    createSharedLink(projectId: number, type: string, expiresDays = 7): Observable<{ url: string }> { return this.http.post<{ url: string }>(`${this.base}/projects/${projectId}/share`, { type, expires_days: expiresDays }); }

    // Frameworks
    getFrameworks(): Observable<Framework[]> { return this.http.get<Framework[]>(`${this.base}/admin/frameworks`); }
    getControls(frameworkId: number): Observable<ControlDomain[]> { return this.http.get<ControlDomain[]>(`${this.base}/admin/frameworks/${frameworkId}/controls`); }
}
