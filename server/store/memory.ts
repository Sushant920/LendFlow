/**
 * In-memory fallback store when Supabase/Postgres is unreachable (e.g. ETIMEDOUT).
 * Allows local dev/demo without database connectivity.
 */

import { randomUUID } from 'crypto';

export interface ApplicationRow {
  id: string;
  user_id: string;
  loan_type: string;
  requested_amount: number | null;
  business_name: string | null;
  business_age_months: number | null;
  monthly_revenue: number | null;
  industry: string | null;
  status: string;
  founder_cibil_score: number | null;
  created_at: string;
  updated_at: string;
}

const applications = new Map<string, ApplicationRow>();

export const memoryStore = {
  insertApplication(data: {
    user_id: string;
    loan_type: string;
    requested_amount?: number | null;
    business_name?: string | null;
    business_age_months?: number | null;
    monthly_revenue?: number | null;
    industry?: string | null;
    status?: string;
    founder_cibil_score?: number | null;
  }): { id: string } {
    const id = randomUUID();
    const now = new Date().toISOString();
    const row: ApplicationRow = {
      id,
      user_id: data.user_id,
      loan_type: data.loan_type,
      requested_amount: data.requested_amount ?? null,
      business_name: data.business_name ?? null,
      business_age_months: data.business_age_months ?? null,
      monthly_revenue: data.monthly_revenue ?? null,
      industry: data.industry ?? null,
      status: data.status ?? 'draft',
      founder_cibil_score: data.founder_cibil_score ?? null,
      created_at: now,
      updated_at: now,
    };
    applications.set(id, row);
    return { id };
  },

  getByUserId(userId: string): ApplicationRow[] {
    return Array.from(applications.values())
      .filter((a) => a.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  getById(id: string): ApplicationRow | null {
    return applications.get(id) ?? null;
  },

  update(id: string, updates: Partial<ApplicationRow>): void {
    const row = applications.get(id);
    if (row) {
      const updated = { ...row, ...updates, updated_at: new Date().toISOString() };
      applications.set(id, updated);
    }
  },
};
