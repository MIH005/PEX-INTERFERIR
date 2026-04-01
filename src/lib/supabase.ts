import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://aswnahmjgxfwnlbegbhh.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_0vbQSFidPi2wbw0ogPB0oQ_APCl2IEr';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Role = 'store' | 'regional' | 'admin';

export interface User {
  id: string;
  name: string;
  email?: string;
  role: Role;
  external_unit_id?: string;
}

export interface Store {
  id: string;
  name: string;
  external_unit_id?: string;
  city: string;
  email: string;
  region_id?: string;
}

export type ActionPlanStatus = 'A iniciar' | 'Concluído' | 'Cancelado';

export function normalizeStatus(status: string): ActionPlanStatus {
  if (!status) return 'A iniciar';
  const s = status.toString().toLowerCase().trim();
  if (s === 'concluído' || s === 'concluido' || s === 'completed' || s === 'done' || s === 'fechado' || s === 'feito' || s === '3') return 'Concluído';
  if (s === 'cancelado' || s === 'cancelled' || s === 'canceled' || s === '4') return 'Cancelado';
  return 'A iniciar';
}

export interface ActionPlan {
  id: string;
  store_id: string;
  description_problem: string;
  action_plan: string;
  due_date: string;
  status: ActionPlanStatus;
  created_at: string;
  created_by?: string;
  responsible_user?: string;
  store?: Store;
  checklist_type?: string;
  external_evaluation_id?: string;
}

export interface ActionUpdate {
  id: string;
  action_plan_id: string;
  user_id: string;
  comment: string;
  status_changed_to?: ActionPlanStatus;
  created_at: string;
  user?: User;
}

export interface Evidence {
  id: string;
  action_plan_id: string;
  file_url: string;
  created_at: string;
}
