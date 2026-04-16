import { ArrowLeft, MapPin, Phone, PlayCircle, UploadCloud } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  workflowApi,
  type FieldOfficerCaseDetail,
  type FieldVisitReportPayload,
} from '../../lib/workflowApi';
import { useStore } from '../../store';

function formatMoney(value: number): string {
  return `Rs ${value.toLocaleString('en-IN')}`;
}

async function toDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function FieldVisitCasePage() {
  const navigate = useNavigate();
  const { arn } = useParams();
  const user = useStore((state) => state.user);
  const [detail, setDetail] = useState<FieldOfficerCaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);

  const [form, setForm] = useState<FieldVisitReportPayload>({
    address_verified: true,
    business_verified: true,
    income_estimate: 0,
    risk_level: 'Low',
    remarks: '',
    evidence_urls: [],
  });

  const targetArn = decodeURIComponent(arn ?? '');

  const refreshCase = () => {
    if (!user || user.role !== 'field_officer' || !targetArn) return;
    setLoading(true);
    workflowApi
      .getFieldOfficerCaseDetail(targetArn, 'field_officer')
      .then((row) => setDetail(row))
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refreshCase();
  }, [targetArn, user]);

  const handleStartVisit = async () => {
    if (!detail) return;
    await workflowApi.startFieldVisit(detail.arn, 'field_officer');
    refreshCase();
  };

  const handleEvidenceSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []).filter((file) => file.type.startsWith('image/'));
    setEvidenceFiles(files);
  };

  const handleSubmitReport = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!detail) return;

    try {
      setSubmitting(true);
      const evidenceUrls = await Promise.all(evidenceFiles.map((file) => toDataUrl(file)));
      await workflowApi.submitFieldVisitReport(detail.arn, 'field_officer', {
        ...form,
        evidence_urls: evidenceUrls,
      });
      window.alert('Field report submitted successfully. Case moved to next stage.');
      navigate('/dashboard/field-visits');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit report';
      window.alert(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-600">
        Loading case details...
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="min-h-screen space-y-4">
        <button
          onClick={() => navigate('/dashboard/field-visits')}
          className="inline-flex items-center gap-2 text-sm text-slate-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to assigned visits
        </button>
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-600">
          Case not found or not assigned to you.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6">
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => navigate('/dashboard/field-visits')}
          className="inline-flex items-center gap-2 text-sm text-slate-700 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to assigned visits
        </button>
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
          Status: {detail.status}
        </span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h1 className="text-2xl font-bold text-slate-900">{detail.borrower_name}</h1>
        <p className="text-sm text-slate-500 mt-1">ARN: {detail.arn}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Loan Amount</p>
            <p className="text-sm font-semibold text-slate-900 mt-1">{formatMoney(detail.loan_amount)}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Loan Type</p>
            <p className="text-sm font-semibold text-slate-900 mt-1">{detail.loan_type}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Phone</p>
            <p className="text-sm font-semibold text-slate-900 mt-1">{detail.borrower_phone || 'N/A'}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Current Stage</p>
            <p className="text-sm font-semibold text-slate-900 mt-1">{detail.stage}</p>
          </div>
        </div>

        <div className="rounded-lg bg-slate-50 p-3 mt-3">
          <p className="text-xs text-slate-500">Address</p>
          <p className="text-sm font-semibold text-slate-900 mt-1">{detail.borrower_address}</p>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={() => void handleStartVisit()}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700"
          >
            <PlayCircle className="w-4 h-4" />
            Start Visit
          </button>
          {detail.borrower_phone && (
            <a
              href={`tel:${detail.borrower_phone}`}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-700 hover:bg-slate-50"
            >
              <Phone className="w-4 h-4" />
              Contact Applicant
            </a>
          )}
          <a
            href={detail.map_link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-700 hover:bg-slate-50"
          >
            <MapPin className="w-4 h-4" />
            Open Location
          </a>
        </div>
      </div>

      <form onSubmit={handleSubmitReport} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Field Verification Report</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="rounded-lg border border-slate-200 p-3 text-sm">
            <span className="block text-slate-700 mb-2">Address Verified</span>
            <select
              value={form.address_verified ? 'yes' : 'no'}
              onChange={(event) => setForm((prev) => ({ ...prev, address_verified: event.target.value === 'yes' }))}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>

          <label className="rounded-lg border border-slate-200 p-3 text-sm">
            <span className="block text-slate-700 mb-2">Business Verified</span>
            <select
              value={form.business_verified ? 'yes' : 'no'}
              onChange={(event) => setForm((prev) => ({ ...prev, business_verified: event.target.value === 'yes' }))}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>

          <label className="rounded-lg border border-slate-200 p-3 text-sm">
            <span className="block text-slate-700 mb-2">Income Estimate</span>
            <input
              type="number"
              min={0}
              value={form.income_estimate}
              onChange={(event) => setForm((prev) => ({ ...prev, income_estimate: Number(event.target.value || 0) }))}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              required
            />
          </label>

          <label className="rounded-lg border border-slate-200 p-3 text-sm">
            <span className="block text-slate-700 mb-2">Risk Level</span>
            <select
              value={form.risk_level}
              onChange={(event) => setForm((prev) => ({ ...prev, risk_level: event.target.value as 'Low' | 'Medium' | 'High' }))}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </label>
        </div>

        <label className="block text-sm">
          <span className="text-slate-700">Remarks</span>
          <textarea
            value={form.remarks}
            onChange={(event) => setForm((prev) => ({ ...prev, remarks: event.target.value }))}
            rows={5}
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2"
            required
          />
        </label>

        <div className="rounded-lg border border-slate-200 p-3">
          <label className="inline-flex items-center gap-2 text-sm text-slate-700 mb-2">
            <UploadCloud className="w-4 h-4" />
            Upload Evidence Images (house/shop)
          </label>
          <input type="file" accept="image/*" multiple onChange={handleEvidenceSelection} className="block w-full text-sm" />

          {evidenceFiles.length > 0 && (
            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
              {evidenceFiles.map((file) => (
                <div key={file.name} className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                  <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-24 object-cover rounded-md" />
                  <p className="text-[11px] text-slate-600 mt-1 truncate">{file.name}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full md:w-auto px-5 py-2.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-60"
        >
          {submitting ? 'Submitting...' : 'Submit Field Report'}
        </button>
      </form>
    </div>
  );
}
