export interface User {
    id: number;
    name: string;
    email: string;
    phone?: string;
    status: 'active' | 'inactive' | 'suspended';
    tenant_id: number;
    tenant?: Tenant;
    roles: Role[];
    created_at: string;
}
export interface Tenant { id: number; name: string; slug: string; }
export interface Role { id: number; name: string; }
export interface AuthResponse { user: User; token: string; }

export interface Project {
    id: number;
    name: string;
    description: string;
    status: 'draft' | 'in_progress' | 'completed' | 'archived';
    framework: Framework;
    data_subjects_count: number;
    data_categories: string[];
    large_scale: boolean;
    dpo_required: boolean;
    global_maturity: number;
    user: { id: number; name: string };
    created_at: string;
    updated_at: string;
}

export interface Framework { id: number; name: string; country_code: string; domains?: ControlDomain[]; }
export interface ControlDomain { id: number; code: string; name: string; description?: string; order: number; controls: Control[]; }
export interface Control { id: number; code: string; name: string; statement: string; expected_evidence: string; criticality: 'critico' | 'alto' | 'medio' | 'bajo'; order: number; }

export interface Evaluation { id: number; project_id: number; control_id: number; maturity_level: number; findings: string | null; evidence_notes: string | null; control?: Control & { domain?: ControlDomain }; }
export interface Gap { id: number; project_id: number; domain: string; control_code: string; finding: string; impact: 'alta' | 'media' | 'baja'; recommendation: string; }

export interface ActionItem {
    id: number; project_id: number; gap_id: number;
    title: string; description: string;
    priority: 'critica' | 'alta' | 'media' | 'baja' | 'opcional';
    status: 'pendiente' | 'en_progreso' | 'completada' | 'cancelada';
    assigned_to: number | null; assignee?: User;
    due_date: string | null; gap?: Gap;
}

export interface ExecutiveReport {
    generated_by: 'ai' | 'rule_based'; provider: string | null;
    global_maturity: number; maturity_by_domain: DomainMaturity[];
    executive_summary: string; top_risks: string[];
    prioritized_plan: { action: string; priority: string; timeline: string }[];
    quick_wins: string[]; compliance_narrative: string;
}
export interface DomainMaturity { domain_id: number; domain_name: string; domain_code: string; avg_maturity: number; evaluated_count: number; }
export interface AiConfig { id: number; provider: string; model: string; is_default: boolean; has_key: boolean; }
export interface AuditLog { id: number; user: User; action: string; auditable_type?: string; auditable_id?: number; old_values?: unknown; new_values?: unknown; ip_address: string; created_at: string; }
export interface Deliverable { id: number; project_id: number; domain_code: string; domain_name: string; title: string; description: string; status: 'pending' | 'generated' | 'uploaded'; content: string | null; file_path: string | null; }
export interface PaginatedResponse<T> { data: T[]; current_page: number; last_page: number; per_page: number; total: number; }
