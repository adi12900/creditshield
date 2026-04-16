import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  FileInput,
  MessageSquare,
  Bell,
  TrendingUp,
  Calculator,
  FileCheck,
  Shield,
  AlertTriangle,
  FileSearch,
  BarChart3,
  Package,
  FolderOpen,
  GitMerge,
  AlertCircle,
  Settings,
  Signature,
  Workflow,
  Users,
  Activity,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { UserRole } from '../../store';
import { useState } from 'react';

interface NavItem {
  label: string;
  icon: any;
  href: string;
  children?: NavItem[];
}

const navigationMap: Record<UserRole, NavItem[]> = {
  loan_officer: [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      href: '/dashboard',
    },
    {
      label: 'Lead Workbench',
      icon: Users,
      href: '/dashboard/lead-workbench',
    },
    {
      label: 'Application Intake',
      icon: FileInput,
      href: '/dashboard/application-intake',
    },
    {
      label: 'Application Detail',
      icon: FileText,
      href: '/dashboard/application-detail',
    },
    {
      label: 'Document Review',
      icon: FolderOpen,
      href: '/dashboard/document-review',
    },
    {
      label: 'Communication',
      icon: MessageSquare,
      href: '/dashboard/communication',
    },
    {
      label: 'E-Sign Agreement',
      icon: Signature,
      href: '/dashboard/e-sign-agreement',
    },
    {
      label: 'CIBIL Reports',
      icon: FileText,
      href: '/dashboard/cibil-reports',
    },
  ],
  credit_analyst: [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      href: '/dashboard',
    },
    {
      label: 'Financial Ratios',
      icon: Calculator,
      href: '/dashboard/financial-ratios',
    },
    {
      label: 'AI Score Breakdown',
      icon: Activity,
      href: '/dashboard/ai-score',
    },
    {
      label: 'Credit Memo',
      icon: FileCheck,
      href: '/dashboard/credit-memo',
    },
    {
      label: 'CIBIL Reports',
      icon: FileText,
      href: '/dashboard/cibil-reports',
    },
  ],
  underwriter: [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      href: '/dashboard',
    },
    {
      label: 'Decision Engine',
      icon: GitMerge,
      href: '/dashboard/decision-engine',
    },
    {
      label: 'AI Score Breakdown',
      icon: Activity,
      href: '/dashboard/ai-score',
    },
    {
      label: 'Policy Override',
      icon: AlertTriangle,
      href: '/dashboard/policy-override',
    },
    {
      label: 'Loan Structuring',
      icon: Calculator,
      href: '/dashboard/loan-structuring',
    },
    {
      label: 'CIBIL Reports',
      icon: FileText,
      href: '/dashboard/cibil-reports',
    },
  ],
  compliance_officer: [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      href: '/dashboard',
    },
    {
      label: 'KYC / AML',
      icon: Shield,
      href: '/dashboard/kyc-aml',
    },
    {
      label: 'Fraud Signals',
      icon: AlertTriangle,
      href: '/dashboard/fraud-signals',
    },
    {
      label: 'Audit Log',
      icon: FileSearch,
      href: '/dashboard/audit-log',
    },
    {
      label: 'Regulatory Reports',
      icon: BarChart3,
      href: '/dashboard/regulatory-reports',
    },
    {
      label: 'RBI Compliance Center',
      icon: Shield,
      href: '/dashboard/rbi-compliance',
    },
    {
      label: 'RBI Audit Export',
      icon: FileText,
      href: '/dashboard/rbi-audit-export',
    },
  ],
  ops_team: [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      href: '/dashboard',
    },
    {
      label: 'Disbursement Queue',
      icon: Package,
      href: '/dashboard/disbursement-approval',
    },
    {
      label: 'Document Vault',
      icon: FolderOpen,
      href: '/dashboard/document-vault',
    },
    {
      label: 'Exception Queue',
      icon: AlertCircle,
      href: '/dashboard/exception-queue',
    },
  ],
  system_admin: [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      href: '/dashboard',
    },
    {
      label: 'Workflow Designer',
      icon: Workflow,
      href: '/dashboard/workflow-designer',
    },
    {
      label: 'Rule Engine',
      icon: GitMerge,
      href: '/dashboard/rule-engine',
    },
    {
      label: 'User Management',
      icon: Users,
      href: '/dashboard/user-management',
    },
    {
      label: 'RBI Governance Matrix',
      icon: Shield,
      href: '/dashboard/rbi-governance-matrix',
    },
    {
      label: 'Loan Product Policy',
      icon: FileCheck,
      href: '/dashboard/loan-product-policy',
    },
    {
      label: 'Document Policy',
      icon: FolderOpen,
      href: '/dashboard/document-policy',
    },
  ],
  board_member: [
    {
      label: 'RBI Governance Matrix',
      icon: Shield,
      href: '/dashboard/rbi-governance-matrix',
    },
    {
      label: 'Loan Product Policy',
      icon: FileCheck,
      href: '/dashboard/loan-product-policy',
    },
    {
      label: 'Document Policy',
      icon: FolderOpen,
      href: '/dashboard/document-policy',
    },
    {
      label: 'Regulatory Reports',
      icon: BarChart3,
      href: '/dashboard/regulatory-reports',
    },
  ],
  chief_compliance_officer: [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      href: '/dashboard',
    },
    {
      label: 'RBI Governance Matrix',
      icon: Shield,
      href: '/dashboard/rbi-governance-matrix',
    },
    {
      label: 'RBI Compliance Center',
      icon: Shield,
      href: '/dashboard/rbi-compliance',
    },
    {
      label: 'Regulatory Reports',
      icon: BarChart3,
      href: '/dashboard/regulatory-reports',
    },
    {
      label: 'RBI Audit Export',
      icon: FileText,
      href: '/dashboard/rbi-audit-export',
    },
  ],
  nodal_grievance_officer: [
    {
      label: 'RBI Governance Matrix',
      icon: Shield,
      href: '/dashboard/rbi-governance-matrix',
    },
    {
      label: 'RBI Compliance Center',
      icon: Shield,
      href: '/dashboard/rbi-compliance',
    },
    {
      label: 'Regulatory Reports',
      icon: BarChart3,
      href: '/dashboard/regulatory-reports',
    },
    {
      label: 'Audit Log',
      icon: FileSearch,
      href: '/dashboard/audit-log',
    },
  ],
  lsp_governance_officer: [
    {
      label: 'RBI Governance Matrix',
      icon: Shield,
      href: '/dashboard/rbi-governance-matrix',
    },
    {
      label: 'Loan Product Policy',
      icon: FileCheck,
      href: '/dashboard/loan-product-policy',
    },
    {
      label: 'Regulatory Reports',
      icon: BarChart3,
      href: '/dashboard/regulatory-reports',
    },
  ],
  data_protection_officer: [
    {
      label: 'RBI Governance Matrix',
      icon: Shield,
      href: '/dashboard/rbi-governance-matrix',
    },
    {
      label: 'Document Policy',
      icon: FolderOpen,
      href: '/dashboard/document-policy',
    },
    {
      label: 'Audit Log',
      icon: FileSearch,
      href: '/dashboard/audit-log',
    },
    {
      label: 'RBI Audit Export',
      icon: FileText,
      href: '/dashboard/rbi-audit-export',
    },
  ],
  recovery_governance_officer: [
    {
      label: 'RBI Governance Matrix',
      icon: Shield,
      href: '/dashboard/rbi-governance-matrix',
    },
    {
      label: 'Exception Queue',
      icon: AlertCircle,
      href: '/dashboard/exception-queue',
    },
    {
      label: 'Audit Log',
      icon: FileSearch,
      href: '/dashboard/audit-log',
    },
  ],
  internal_auditor: [
    {
      label: 'RBI Governance Matrix',
      icon: Shield,
      href: '/dashboard/rbi-governance-matrix',
    },
    {
      label: 'Loan Product Policy',
      icon: FileCheck,
      href: '/dashboard/loan-product-policy',
    },
    {
      label: 'Document Policy',
      icon: FolderOpen,
      href: '/dashboard/document-policy',
    },
    {
      label: 'Audit Log',
      icon: FileSearch,
      href: '/dashboard/audit-log',
    },
    {
      label: 'RBI Audit Export',
      icon: FileText,
      href: '/dashboard/rbi-audit-export',
    },
  ],
};

interface SidebarProps {
  role: UserRole;
}

export function Sidebar({ role }: SidebarProps) {
  const location = useLocation();
  const navItems = navigationMap[role] || [];

  return (
    <div className="w-64 h-full bg-white border-r border-slate-200 flex flex-col">
      <div className="p-6 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900">LOS Platform</h1>
        <p className="text-xs text-slate-500 mt-1">Loan Origination System</p>
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isCibilPath = item.href === '/dashboard/cibil-reports' && location.pathname.startsWith('/dashboard/cibil-report/');
            const isDocumentReviewPath = item.href === '/dashboard/document-review' && location.pathname.startsWith('/dashboard/document-review/');
            const isActive = location.pathname === item.href || isCibilPath || isDocumentReviewPath;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  isActive
                    ? 'bg-green-600 text-white shadow-md'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
                style={isActive ? { backgroundColor: '#00A86B' } : {}}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="p-4 border-t border-slate-200">
        <div className="text-xs text-slate-600 capitalize">
          {role.replace('_', ' ')}
        </div>
      </div>
    </div>
  );
}
