import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../core/environment';

@Injectable({
  providedIn: 'root'
})
export class PdpToolsService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ========== Dashboard Summary ==========
  getToolsSummary(): Observable<any> {
    return this.http.get(`${this.apiUrl}/tools/summary`);
  }

  // ========== RAT ==========
  getRatRecords(params?: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/tools/rat`, { params });
  }

  getRatRecord(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/tools/rat/${id}`);
  }

  createRatRecord(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/tools/rat`, data);
  }

  updateRatRecord(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/tools/rat/${id}`, data);
  }

  deleteRatRecord(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/tools/rat/${id}`);
  }

  processRatWithAi(file: File, type: 'pdf' | 'transcript'): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    return this.http.post(`${this.apiUrl}/tools/rat/ai-process`, formData);
  }

  // ========== Impact Assessment ==========
  getImpactAssessments(params?: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/tools/impact-assessments`, { params });
  }

  getImpactAssessment(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/tools/impact-assessments/${id}`);
  }

  createImpactAssessment(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/tools/impact-assessments`, data);
  }

  updateImpactAssessment(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/tools/impact-assessments/${id}`, data);
  }

  // ========== Officer Qualifications ==========
  getOfficerQualifications(params?: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/tools/officer-qualifications`, { params });
  }

  getOfficerQualification(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/tools/officer-qualifications/${id}`);
  }

  createOfficerQualification(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/tools/officer-qualifications`, data);
  }

  updateOfficerQualification(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/tools/officer-qualifications/${id}`, data);
  }

  generateQualificationReport(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/tools/officer-qualifications/${id}/report`, {
      responseType: 'blob'
    });
  }

  // ========== Transfer Qualifications ==========
  getTransferQualifications(params?: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/tools/transfer-qualifications`, { params });
  }

  getTransferQualification(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/tools/transfer-qualifications/${id}`);
  }

  createTransferQualification(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/tools/transfer-qualifications`, data);
  }

  updateTransferQualification(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/tools/transfer-qualifications/${id}`, data);
  }

  generateTransferReport(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/tools/transfer-qualifications/${id}/report`, {
      responseType: 'blob'
    });
  }

  // ========== Rights Requests ==========
  getRightsRequests(params?: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/tools/rights-requests`, { params });
  }

  createRightsRequest(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/tools/rights-requests`, data);
  }

  updateRightsRequest(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/tools/rights-requests/${id}`, data);
  }

  exportRightsRequests(params?: any): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/tools/rights-requests/export`, {
      params,
      responseType: 'blob'
    });
  }

  // ========== Incidents ==========
  getIncidents(params?: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/tools/incidents`, { params });
  }

  createIncident(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/tools/incidents`, data);
  }

  exportIncidents(params?: any): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/tools/incidents/export`, {
      params,
      responseType: 'blob'
    });
  }

  // ========== Legitimacy Reports ==========
  listLegitimacyReports(params?: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/tools/legitimacy-reports`, { params });
  }

  createLegitimacyReport(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/tools/legitimacy-reports`, data);
  }

  updateLegitimacyReport(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/tools/legitimacy-reports/${id}`, data);
  }

  downloadLegitimacyReport(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/tools/legitimacy-reports/${id}/download`, {
      responseType: 'blob'
    });
  }

  exportLegitimacyReports(params?: any): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/tools/legitimacy-reports/export`, {
      params,
      responseType: 'blob'
    });
  }
}
