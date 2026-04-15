import { create } from 'zustand';
import { clearAuthToken } from './lib/workflowApi';

export type UserRole =
  | 'loan_officer'
  | 'credit_analyst'
  | 'underwriter'
  | 'compliance_officer'
  | 'ops_team'
  | 'system_admin'
  | 'board_member'
  | 'chief_compliance_officer'
  | 'nodal_grievance_officer'
  | 'lsp_governance_officer'
  | 'data_protection_officer'
  | 'recovery_governance_officer'
  | 'internal_auditor';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AppState {
  user: User | null;
  selectedApplicationArn: string;
  setUser: (user: User | null) => void;
  setSelectedApplicationArn: (arn: string) => void;
  logout: () => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  selectedApplicationArn: '',
  setUser: (user) => set({ user }),
  setSelectedApplicationArn: (selectedApplicationArn) => set({ selectedApplicationArn }),
  logout: () => {
    clearAuthToken();
    set({ user: null });
  },
}));
