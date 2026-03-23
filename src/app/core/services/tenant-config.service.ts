import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environment';

export interface Organization {
  id: number;
  name: string;
  slug: string;
  billing_email: string | null;
  support_email: string | null;
  website: string | null;
  phone: string | null;
  address: string | null;
  tax_id: string | null;
  logo_path: string | null;
  is_active: boolean;
}

export interface TeamMember {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  role: string;
  is_verified: boolean;
  joined_at: string;
}

export interface TeamInvitation {
  id: number;
  email: string;
  name: string | null;
  role: string;
  invited_by: string | null;
  expires_at: string;
  is_expired: boolean;
}

export interface TeamData {
  members: TeamMember[];
  invitations: TeamInvitation[];
  total_members: number;
}

export interface Preferences {
  language: string;
  timezone: string;
  date_format: string;
  notifications: {
    compliance_updates: boolean;
    weekly_summary: boolean;
    security_alerts: boolean;
    subscription_reminders: boolean;
    project_deadlines: boolean;
  };
  privacy: {
    analytics_enabled: boolean;
    share_usage_data: boolean;
  };
}

export interface InviteRequest {
  email: string;
  name?: string;
  role: 'admin' | 'member' | 'viewer';
}

@Injectable({
  providedIn: 'root'
})
export class TenantConfigService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // ==================== ORGANIZACIÓN ====================

  getOrganization(): Observable<Organization> {
    return this.http.get<Organization>(`${this.apiUrl}/tenant-config/organization`);
  }

  updateOrganization(data: Partial<Organization>): Observable<{ message: string; organization: Organization }> {
    return this.http.put<{ message: string; organization: Organization }>(
      `${this.apiUrl}/tenant-config/organization`,
      data
    );
  }

  updateLogo(file: File): Observable<{ message: string; logo_path: string; logo_url: string }> {
    const formData = new FormData();
    formData.append('logo', file);
    return this.http.post<{ message: string; logo_path: string; logo_url: string }>(
      `${this.apiUrl}/tenant-config/organization/logo`,
      formData
    );
  }

  // ==================== EQUIPO ====================

  getTeam(): Observable<TeamData> {
    return this.http.get<TeamData>(`${this.apiUrl}/tenant-config/team`);
  }

  inviteMember(data: InviteRequest): Observable<{ message: string; invitation: TeamInvitation }> {
    return this.http.post<{ message: string; invitation: TeamInvitation }>(
      `${this.apiUrl}/tenant-config/team/invite`,
      data
    );
  }

  resendInvitation(id: number): Observable<{ message: string; invitation: TeamInvitation }> {
    return this.http.post<{ message: string; invitation: TeamInvitation }>(
      `${this.apiUrl}/tenant-config/team/invitations/${id}/resend`,
      {}
    );
  }

  cancelInvitation(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/tenant-config/team/invitations/${id}`);
  }

  removeMember(userId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/tenant-config/team/members/${userId}`);
  }

  updateMemberRole(userId: number, role: string): Observable<{ message: string; member: { id: number; name: string; role: string } }> {
    return this.http.put<{ message: string; member: { id: number; name: string; role: string } }>(
      `${this.apiUrl}/tenant-config/team/members/${userId}/role`,
      { role }
    );
  }

  // ==================== PREFERENCIAS ====================

  getPreferences(): Observable<Preferences> {
    return this.http.get<Preferences>(`${this.apiUrl}/tenant-config/preferences`);
  }

  updatePreferences(data: Partial<Preferences>): Observable<{ message: string; preferences: any }> {
    return this.http.put<{ message: string; preferences: any }>(
      `${this.apiUrl}/tenant-config/preferences`,
      data
    );
  }
}
