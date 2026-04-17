import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { CibilReport } from './CibilReport';
import { fetchCibilReportById, type CibilReportData } from './cibilUsers';
import { workflowApi } from '../../lib/workflowApi';

export function CibilReportViewerPage() {
  const { id } = useParams();
  const [report, setReport] = useState<CibilReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const reportId = useMemo(() => decodeURIComponent(id ?? ''), [id]);

  useEffect(() => {
    if (!reportId) {
      setError('Missing report id');
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    fetchCibilReportById(reportId)
      .then((data) => {
        if (!active) return;
        setReport(data);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Unable to load report');
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reportId]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <p className="text-sm font-medium text-slate-700">Loading CIBIL report...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          Failed to load report: {error}
        </div>
        <Link
          to="/dashboard/cibil-reports"
          className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Back to list
        </Link>
      </div>
    );
  }

  if (!report) {
    return <Navigate to="/dashboard/cibil-reports" replace />;
  }

  const handleVerify = async () => {
    if (!reportId || verifying || report.isCibilVerified) return;
    try {
      setVerifying(true);
      setVerifyError(null);
      await workflowApi.verifyCibilReport(reportId, 'loan_officer');
      setReport((prev) => (prev ? { ...prev, isCibilVerified: true } : prev));
    } catch (err: unknown) {
      setVerifyError(err instanceof Error ? err.message : 'Failed to verify CIBIL report');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-600">CIBIL Verification Status</p>
            <p className={`text-sm font-semibold ${report.isCibilVerified ? 'text-green-700' : 'text-amber-700'}`}>
              {report.isCibilVerified ? 'Verified' : 'Pending'}
            </p>
          </div>
          <button
            onClick={handleVerify}
            disabled={verifying || report.isCibilVerified}
            className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {report.isCibilVerified ? 'CIBIL Verified' : verifying ? 'Verifying...' : 'Verify CIBIL Report'}
          </button>
        </div>
        {verifyError && (
          <p className="mt-2 text-xs text-red-700">{verifyError}</p>
        )}
      </div>
      <CibilReport report={report} />
    </div>
  );
}
