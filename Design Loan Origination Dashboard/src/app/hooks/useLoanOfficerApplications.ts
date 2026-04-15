import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../store';
import { workflowApi, type WorkflowApplication } from '../lib/workflowApi';

export interface LoanOfficerApplicationView {
  id: string;
  arn: string;
  borrowerName: string;
  email: string;
  phone: string;
  loanAmount: number;
  loanType: string;
  stage: string;
  riskGrade: 'A+' | 'A' | 'B' | 'C';
  creditScore: number;
  kycStatus: 'Verified' | 'Pending';
  employmentType: string;
  purpose: string;
  createdAt?: string;
  updatedAt?: string;
  daysInStage: number;
  slaBreached: boolean;
  processingTime: string;
}

function toDaysSince(dateValue?: string): number {
  if (!dateValue) return 0;
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return 0;
  return Math.max(0, Math.floor((Date.now() - parsed.getTime()) / (1000 * 60 * 60 * 24)));
}

function mapApplication(row: WorkflowApplication): LoanOfficerApplicationView {
  const daysInStage = toDaysSince(row.updated_at || row.created_at);
  return {
    id: row.arn,
    arn: row.arn,
    borrowerName: row.borrower_name,
    email: row.borrower_email || '-',
    phone: row.borrower_phone || '-',
    loanAmount: row.loan_amount,
    loanType: row.loan_type || 'digital_personal_loan',
    stage: row.stage,
    riskGrade: row.risk_grade,
    creditScore: row.credit_score,
    kycStatus: row.kyc_status,
    employmentType: row.employment_type,
    purpose: row.purpose,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    daysInStage,
    slaBreached: daysInStage > 3,
    processingTime: `${daysInStage.toFixed(1)} days`,
  };
}

export function useLoanOfficerApplications() {
  const user = useStore((state) => state.user);
  const selectedApplicationArn = useStore((state) => state.selectedApplicationArn);
  const setSelectedApplicationArn = useStore((state) => state.setSelectedApplicationArn);

  const [applications, setApplications] = useState<LoanOfficerApplicationView[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!user || (user.role !== 'loan_officer' && user.role !== 'system_admin')) {
      setApplications([]);
      return;
    }

    let mounted = true;
    setIsLoading(true);
    setErrorMessage('');

    workflowApi
      .listApplications()
      .then((rows) => {
        if (!mounted) return;
        const mapped = rows.map(mapApplication);
        setApplications(mapped);

        if (!selectedApplicationArn || !mapped.some((item) => item.arn === selectedApplicationArn)) {
          setSelectedApplicationArn(mapped[0]?.arn || '');
        }
      })
      .catch((error) => {
        if (!mounted) return;
        setApplications([]);
        setErrorMessage(error instanceof Error ? error.message : 'Failed to load applications');
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [user, selectedApplicationArn, setSelectedApplicationArn]);

  const selectedApplication = useMemo(
    () => applications.find((item) => item.arn === selectedApplicationArn) || applications[0] || null,
    [applications, selectedApplicationArn]
  );

  return {
    applications,
    selectedApplication,
    selectedApplicationArn,
    setSelectedApplicationArn,
    isLoading,
    errorMessage,
    role: user?.role,
  };
}
