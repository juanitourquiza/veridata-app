import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environment';
import { Project, Evaluation, Gap, ActionItem, ExecutiveReport, ControlDomain, PaginatedResponse, Framework, Deliverable, User, Control } from '../models/models';

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
    downloadExecutiveReportPdf(projectId: number): Observable<Blob> { return this.http.get(`${this.base}/projects/${projectId}/reports/executive-ai/pdf`, { responseType: 'blob' }); }
    downloadExecutiveReportWord(projectId: number): Observable<Blob> { return this.http.get(`${this.base}/projects/${projectId}/reports/executive-ai/word`, { responseType: 'blob' }); }

    // Deliverables
    getDeliverables(projectId: number): Observable<{ deliverables: Deliverable[] }> { return this.http.get<{ deliverables: Deliverable[] }>(`${this.base}/projects/${projectId}/deliverables`); }
    generateDeliverables(projectId: number): Observable<{ deliverables: Deliverable[]; total: number }> { return this.http.post<{ deliverables: Deliverable[]; total: number }>(`${this.base}/projects/${projectId}/deliverables`, {}); }
    updateDeliverable(projectId: number, delivId: number, data: Partial<Deliverable>): Observable<{ deliverable: Deliverable }> { return this.http.put<{ deliverable: Deliverable }>(`${this.base}/projects/${projectId}/deliverables/${delivId}`, data); }
    generateDeliverableContent(projectId: number, delivId: number): Observable<{ deliverable: Deliverable; generated_by: string; provider?: string }> { return this.http.post<{ deliverable: Deliverable; generated_by: string; provider?: string }>(`${this.base}/projects/${projectId}/deliverables/${delivId}/generate-content`, {}); }
    downloadDeliverablePdf(projectId: number, delivId: number): Observable<Blob> { return this.http.get(`${this.base}/projects/${projectId}/deliverables/${delivId}/download-pdf`, { responseType: 'blob' }); }
    downloadDeliverableWord(projectId: number, delivId: number): Observable<Blob> { return this.http.get(`${this.base}/projects/${projectId}/deliverables/${delivId}/download-word`, { responseType: 'blob' }); }

    // Shared
    createSharedLink(projectId: number, type: string, expiresDays = 7): Observable<{ url: string }> { return this.http.post<{ url: string }>(`${this.base}/projects/${projectId}/share`, { type, expires_days: expiresDays }); }

    // Frameworks
    getFrameworks(): Observable<Framework[]> { return this.http.get<Framework[]>(`${this.base}/admin/frameworks`); }
    getControls(frameworkId: number): Observable<ControlDomain[]> { return this.http.get<ControlDomain[]>(`${this.base}/admin/frameworks/${frameworkId}/controls`); }

    // Controls CRUD (for inline editing in evaluation)
    createControl(data: { domain_id: number; code: string; name: string; statement?: string; expected_evidence?: string; criticality?: string; order?: number }): Observable<Control> { return this.http.post<Control>(`${this.base}/admin/controls`, data); }
    updateControl(controlId: number, data: Partial<Control>): Observable<Control> { return this.http.put<Control>(`${this.base}/admin/controls/${controlId}`, data); }
    deleteControl(controlId: number): Observable<void> { return this.http.delete<void>(`${this.base}/admin/controls/${controlId}`); }

    // Users (for assignment dropdowns)
    getUsers(): Observable<{ data: User[] }> { return this.http.get<{ data: User[] }>(`${this.base}/users`); }
}
