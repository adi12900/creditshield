import { AlertTriangle, ArrowLeft, Camera, CheckCircle2, MapPin, Phone, PlayCircle, UploadCloud } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  workflowApi,
  type FieldOfficerCaseDetail,
  type FieldVisitReportPayload,
} from '../../lib/workflowApi';
import { useStore } from '../../store';
import {
  LOAN_TYPE_CONFIG,
  LOAN_TYPE_OPTIONS,
  normalizeLoanType,
  type LoanTypeCategory,
} from '../../config/loanTypeConfig';

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

function yesNo(value: boolean): 'yes' | 'no' {
  return value ? 'yes' : 'no';
}

export function FieldVisitCasePage() {
  const navigate = useNavigate();
  const { arn } = useParams();
  const user = useStore((state) => state.user);

  const [detail, setDetail] = useState<FieldOfficerCaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selectedLoanType, setSelectedLoanType] = useState<LoanTypeCategory>('Personal Loan');
  const [requiredDocFiles, setRequiredDocFiles] = useState<Record<string, File[]>>({});
  const [loanSpecificValues, setLoanSpecificValues] = useState<Record<string, unknown>>({});
  const [geoLocation, setGeoLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  const [form, setForm] = useState<FieldVisitReportPayload>({
    loan_type: 'Personal Loan',
    residence_verification: {
      house_type: 'Owned',
      address_verified: true,
      staying_since_years: 1,
      locality_type: 'Urban',
      house_condition: 'Good',
      landmark_notes: '',
      neighbor_feedback: '',
    },
    employment_business_verification: {
      employment_category: 'Salaried',
      business_verified: true,
      company_name: '',
      job_role: '',
      employment_type: 'Permanent',
      years_in_job: 1,
      office_verified: true,
      salary_estimated: 0,
      business_name: '',
      business_type: '',
      shop_office_exists: true,
      years_in_business: 1,
      daily_customer_flow: 'Medium',
      estimated_monthly_income: 0,
    },
    financial_assessment: {
      declared_income: 0,
      estimated_actual_income: 0,
      monthly_expenses: 0,
      existing_loans: false,
      repayment_capacity: 'Medium',
    },
    education_details: {
      highest_qualification: '',
      tenth_percentage: 0,
      twelfth_or_diploma_percentage: 0,
      graduation_details: '',
      professional_stability_indicator: 'Medium',
    },
    loan_specific_details: {},
    uploaded_documents: [],
    risk_remarks: {
      risk_level: 'Medium',
      fraud_suspicion: false,
      final_recommendation: 'Needs Further Review',
      detailed_remarks: '',
    },
  });

  const targetArn = decodeURIComponent(arn ?? '');

  const refreshCase = () => {
    if (!user || user.role !== 'field_officer' || !targetArn) return;
    setLoading(true);
    workflowApi
      .getFieldOfficerCaseDetail(targetArn, 'field_officer')
      .then((row) => {
        setDetail(row);
        const mappedType = normalizeLoanType(row.loan_type);
        setSelectedLoanType(mappedType);
        setForm((prev) => ({
          ...prev,
          loan_type: mappedType,
        }));
      })
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

  const previewUrls = useMemo(() => {
    return Object.fromEntries(
      Object.entries(requiredDocFiles).map(([doc, files]) => [
        doc,
        files.map((file) => ({ name: file.name, url: URL.createObjectURL(file) })),
      ]),
    );
  }, [requiredDocFiles]);

  useEffect(() => {
    return () => {
      Object.values(previewUrls).forEach((items) => {
        if (Array.isArray(items)) {
          items.forEach((item) => URL.revokeObjectURL(item.url));
        }
      });
    };
  }, [previewUrls]);

  const handlePhotoSelection = (
    event: React.ChangeEvent<HTMLInputElement>,
    evidenceType: string,
  ) => {
    const files = Array.from(event.target.files || []);
    setRequiredDocFiles((prev) => ({ ...prev, [evidenceType]: files }));
  };

  const captureLocation = async () => {
    if (!navigator.geolocation) {
      window.alert('Location capture is not supported on this browser.');
      return;
    }

    setGeoLoading(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });
      setGeoLocation({
        lat: Number(position.coords.latitude.toFixed(6)),
        lng: Number(position.coords.longitude.toFixed(6)),
      });
    } catch {
      window.alert('Unable to capture location. Please allow location access and try again.');
    } finally {
      setGeoLoading(false);
    }
  };

  const handleSubmitReport = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!detail) return;

    try {
      setSubmitting(true);
      const config = LOAN_TYPE_CONFIG[selectedLoanType];
      const allEvidenceItems = config.evidenceSections.flatMap((section) => section.items);
      const missingRequired = allEvidenceItems
        .filter((item) => item.mandatory)
        .filter((item) => !requiredDocFiles[item.evidenceType] || requiredDocFiles[item.evidenceType].length === 0);

      if (missingRequired.length > 0) {
        if (missingRequired.length === 1) {
          window.alert(`${missingRequired[0].label} is required for verification.`);
        } else {
          window.alert(`Please upload all mandatory field evidence: ${missingRequired.map((item) => item.label).join(', ')}`);
        }
        setSubmitting(false);
        return;
      }

      const uploadedDocuments: Array<{ doc_type: string; files: string[] }> = [];
      const evidenceRecords: Array<{
        file_url: string;
        evidence_type: string;
        loan_type: LoanTypeCategory;
        timestamp: string;
        location?: { lat: number; lng: number };
      }> = [];

      for (const item of allEvidenceItems) {
        const files = requiredDocFiles[item.evidenceType] || [];
        if (files.length === 0) continue;

        const encoded = await Promise.all(files.map((file) => toDataUrl(file)));
        uploadedDocuments.push({ doc_type: item.evidenceType, files: encoded });

        encoded.forEach((fileUrl) => {
          evidenceRecords.push({
            file_url: fileUrl,
            evidence_type: item.evidenceType,
            loan_type: selectedLoanType,
            timestamp: new Date().toISOString(),
            ...(geoLocation ? { location: geoLocation } : {}),
          });
        });
      }

      await workflowApi.submitFieldVisitReport(detail.arn, 'field_officer', {
        ...form,
        loan_type: selectedLoanType,
        loan_specific_details: {
          ...loanSpecificValues,
          evidence_records: evidenceRecords,
          field_location: geoLocation,
        },
        uploaded_documents: uploadedDocuments,
      });

      window.alert('Field report submitted successfully. Case marked Completed and moved to next stage.');
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

  const activeLoanConfig = LOAN_TYPE_CONFIG[selectedLoanType];

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
      <div className="flex flex-wrap items-center justify-between gap-3">
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

      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{detail.borrower_name}</h1>
          <p className="text-sm text-slate-500 mt-1">ARN: {detail.arn}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
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

        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Address</p>
          <p className="text-sm font-semibold text-slate-900 mt-1">{detail.borrower_address}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
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

      <form onSubmit={handleSubmitReport} className="space-y-4">
        <details open className="bg-white rounded-xl border border-slate-200 p-5">
          <summary className="font-semibold text-slate-900 cursor-pointer">1. Residence Verification</summary>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <label className="text-sm">
              <span className="text-slate-700">House Type *</span>
              <select value={form.residence_verification.house_type} onChange={(e) => setForm((p) => ({ ...p, residence_verification: { ...p.residence_verification, house_type: e.target.value as 'Owned' | 'Rented' } }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">
                <option>Owned</option>
                <option>Rented</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="text-slate-700">Address Verified *</span>
              <select value={yesNo(form.residence_verification.address_verified)} onChange={(e) => setForm((p) => ({ ...p, residence_verification: { ...p.residence_verification, address_verified: e.target.value === 'yes' } }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="text-slate-700">Staying Since (Years) *</span>
              <input type="number" min={0} value={form.residence_verification.staying_since_years} onChange={(e) => setForm((p) => ({ ...p, residence_verification: { ...p.residence_verification, staying_since_years: Number(e.target.value || 0) } }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" required />
            </label>
            <label className="text-sm">
              <span className="text-slate-700">Locality Type *</span>
              <select value={form.residence_verification.locality_type} onChange={(e) => setForm((p) => ({ ...p, residence_verification: { ...p.residence_verification, locality_type: e.target.value as 'Urban' | 'Rural' | 'Semi-Urban' } }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">
                <option>Urban</option>
                <option>Rural</option>
                <option>Semi-Urban</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="text-slate-700">House Condition *</span>
              <select value={form.residence_verification.house_condition} onChange={(e) => setForm((p) => ({ ...p, residence_verification: { ...p.residence_verification, house_condition: e.target.value as 'Good' | 'Average' | 'Poor' } }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">
                <option>Good</option>
                <option>Average</option>
                <option>Poor</option>
              </select>
            </label>
            <label className="text-sm md:col-span-2">
              <span className="text-slate-700">Landmark Notes *</span>
              <input value={form.residence_verification.landmark_notes} onChange={(e) => setForm((p) => ({ ...p, residence_verification: { ...p.residence_verification, landmark_notes: e.target.value } }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" required />
            </label>
            <label className="text-sm md:col-span-2">
              <span className="text-slate-700">Neighbor Feedback (Optional)</span>
              <textarea value={form.residence_verification.neighbor_feedback || ''} onChange={(e) => setForm((p) => ({ ...p, residence_verification: { ...p.residence_verification, neighbor_feedback: e.target.value } }))} rows={3} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
            </label>
          </div>
        </details>

        <details open className="bg-white rounded-xl border border-slate-200 p-5">
          <summary className="font-semibold text-slate-900 cursor-pointer">2. Employment / Business Verification</summary>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="text-sm">
              <span className="text-slate-700">Employment Category</span>
              <select value={form.employment_business_verification.employment_category} onChange={(e) => setForm((p) => ({ ...p, employment_business_verification: { ...p.employment_business_verification, employment_category: e.target.value as 'Salaried' | 'Self-Employed' } }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">
                <option>Salaried</option>
                <option>Self-Employed</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="text-slate-700">Business Verified</span>
              <select value={yesNo(form.employment_business_verification.business_verified)} onChange={(e) => setForm((p) => ({ ...p, employment_business_verification: { ...p.employment_business_verification, business_verified: e.target.value === 'yes' } }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </label>

            {form.employment_business_verification.employment_category === 'Salaried' ? (
              <>
                <label className="text-sm"><span className="text-slate-700">Company Name</span><input value={form.employment_business_verification.company_name || ''} onChange={(e) => setForm((p) => ({ ...p, employment_business_verification: { ...p.employment_business_verification, company_name: e.target.value } }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
                <label className="text-sm"><span className="text-slate-700">Job Role</span><input value={form.employment_business_verification.job_role || ''} onChange={(e) => setForm((p) => ({ ...p, employment_business_verification: { ...p.employment_business_verification, job_role: e.target.value } }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
                <label className="text-sm"><span className="text-slate-700">Employment Type</span><select value={form.employment_business_verification.employment_type || 'Permanent'} onChange={(e) => setForm((p) => ({ ...p, employment_business_verification: { ...p.employment_business_verification, employment_type: e.target.value as 'Permanent' | 'Contract' } }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"><option>Permanent</option><option>Contract</option></select></label>
                <label className="text-sm"><span className="text-slate-700">Years in Job</span><input type="number" min={0} value={form.employment_business_verification.years_in_job || 0} onChange={(e) => setForm((p) => ({ ...p, employment_business_verification: { ...p.employment_business_verification, years_in_job: Number(e.target.value || 0) } }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
                <label className="text-sm"><span className="text-slate-700">Office Verified</span><select value={yesNo(Boolean(form.employment_business_verification.office_verified))} onChange={(e) => setForm((p) => ({ ...p, employment_business_verification: { ...p.employment_business_verification, office_verified: e.target.value === 'yes' } }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"><option value="yes">Yes</option><option value="no">No</option></select></label>
                <label className="text-sm"><span className="text-slate-700">Salary (Estimated)</span><input type="number" min={0} value={form.employment_business_verification.salary_estimated || 0} onChange={(e) => setForm((p) => ({ ...p, employment_business_verification: { ...p.employment_business_verification, salary_estimated: Number(e.target.value || 0) } }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
              </>
            ) : (
              <>
                <label className="text-sm"><span className="text-slate-700">Business Name</span><input value={form.employment_business_verification.business_name || ''} onChange={(e) => setForm((p) => ({ ...p, employment_business_verification: { ...p.employment_business_verification, business_name: e.target.value } }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
                <label className="text-sm"><span className="text-slate-700">Business Type</span><input value={form.employment_business_verification.business_type || ''} onChange={(e) => setForm((p) => ({ ...p, employment_business_verification: { ...p.employment_business_verification, business_type: e.target.value } }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
                <label className="text-sm"><span className="text-slate-700">Shop/Office Exists</span><select value={yesNo(Boolean(form.employment_business_verification.shop_office_exists))} onChange={(e) => setForm((p) => ({ ...p, employment_business_verification: { ...p.employment_business_verification, shop_office_exists: e.target.value === 'yes' } }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"><option value="yes">Yes</option><option value="no">No</option></select></label>
                <label className="text-sm"><span className="text-slate-700">Years in Business</span><input type="number" min={0} value={form.employment_business_verification.years_in_business || 0} onChange={(e) => setForm((p) => ({ ...p, employment_business_verification: { ...p.employment_business_verification, years_in_business: Number(e.target.value || 0) } }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
                <label className="text-sm"><span className="text-slate-700">Daily Customer Flow</span><select value={form.employment_business_verification.daily_customer_flow || 'Medium'} onChange={(e) => setForm((p) => ({ ...p, employment_business_verification: { ...p.employment_business_verification, daily_customer_flow: e.target.value as 'Low' | 'Medium' | 'High' } }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"><option>Low</option><option>Medium</option><option>High</option></select></label>
                <label className="text-sm"><span className="text-slate-700">Estimated Monthly Income</span><input type="number" min={0} value={form.employment_business_verification.estimated_monthly_income || 0} onChange={(e) => setForm((p) => ({ ...p, employment_business_verification: { ...p.employment_business_verification, estimated_monthly_income: Number(e.target.value || 0) } }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
              </>
            )}
          </div>
        </details>

        <details open className="bg-white rounded-xl border border-slate-200 p-5">
          <summary className="font-semibold text-slate-900 cursor-pointer">3. Financial Assessment</summary>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <label className="text-sm"><span className="text-slate-700">Declared Income</span><input type="number" min={0} value={form.financial_assessment.declared_income} onChange={(e) => setForm((p) => ({ ...p, financial_assessment: { ...p.financial_assessment, declared_income: Number(e.target.value || 0) } }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
            <label className="text-sm"><span className="text-slate-700">Estimated Actual Income</span><input type="number" min={0} value={form.financial_assessment.estimated_actual_income} onChange={(e) => setForm((p) => ({ ...p, financial_assessment: { ...p.financial_assessment, estimated_actual_income: Number(e.target.value || 0) } }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
            <label className="text-sm"><span className="text-slate-700">Monthly Expenses (approx)</span><input type="number" min={0} value={form.financial_assessment.monthly_expenses} onChange={(e) => setForm((p) => ({ ...p, financial_assessment: { ...p.financial_assessment, monthly_expenses: Number(e.target.value || 0) } }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
            <label className="text-sm"><span className="text-slate-700">Existing Loans</span><select value={yesNo(form.financial_assessment.existing_loans)} onChange={(e) => setForm((p) => ({ ...p, financial_assessment: { ...p.financial_assessment, existing_loans: e.target.value === 'yes' } }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"><option value="yes">Yes</option><option value="no">No</option></select></label>
            <label className="text-sm md:col-span-2"><span className="text-slate-700">Repayment Capacity</span><select value={form.financial_assessment.repayment_capacity} onChange={(e) => setForm((p) => ({ ...p, financial_assessment: { ...p.financial_assessment, repayment_capacity: e.target.value as 'Low' | 'Medium' | 'High' } }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"><option>Low</option><option>Medium</option><option>High</option></select></label>
          </div>
        </details>

        <details open className="bg-white rounded-xl border border-slate-200 p-5">
          <summary className="font-semibold text-slate-900 cursor-pointer">4. Education Details</summary>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <label className="text-sm"><span className="text-slate-700">Highest Qualification</span><input value={form.education_details.highest_qualification} onChange={(e) => setForm((p) => ({ ...p, education_details: { ...p.education_details, highest_qualification: e.target.value } }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
            <label className="text-sm"><span className="text-slate-700">10th Percentage</span><input type="number" min={0} max={100} value={form.education_details.tenth_percentage || 0} onChange={(e) => setForm((p) => ({ ...p, education_details: { ...p.education_details, tenth_percentage: Number(e.target.value || 0) } }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
            <label className="text-sm"><span className="text-slate-700">12th / Diploma Percentage</span><input type="number" min={0} max={100} value={form.education_details.twelfth_or_diploma_percentage || 0} onChange={(e) => setForm((p) => ({ ...p, education_details: { ...p.education_details, twelfth_or_diploma_percentage: Number(e.target.value || 0) } }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
            <label className="text-sm"><span className="text-slate-700">Graduation (if any)</span><input value={form.education_details.graduation_details || ''} onChange={(e) => setForm((p) => ({ ...p, education_details: { ...p.education_details, graduation_details: e.target.value } }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>
            <label className="text-sm md:col-span-2"><span className="text-slate-700">Professional Stability Indicator</span><select value={form.education_details.professional_stability_indicator} onChange={(e) => setForm((p) => ({ ...p, education_details: { ...p.education_details, professional_stability_indicator: e.target.value as 'Low' | 'Medium' | 'High' } }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"><option>Low</option><option>Medium</option><option>High</option></select></label>
          </div>
        </details>

        <details open className="bg-white rounded-xl border border-slate-200 p-5">
          <summary className="font-semibold text-slate-900 cursor-pointer">5. Loan-Specific Details</summary>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <label className="text-sm md:col-span-2"><span className="text-slate-700">Loan Type *</span><select value={selectedLoanType} onChange={(e) => { const next = e.target.value as LoanTypeCategory; setSelectedLoanType(next); setForm((p) => ({ ...p, loan_type: next })); setLoanSpecificValues({}); setRequiredDocFiles({}); }} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">{LOAN_TYPE_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></label>
            <div className="md:col-span-2 rounded-lg bg-slate-50 border border-slate-200 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Verification Focus</p>
              <ul className="mt-2 text-sm text-slate-700 list-disc pl-5 space-y-1">
                {activeLoanConfig.verificationFocus.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            {activeLoanConfig.specificFields.map((field) => (
              <label key={field.key} className="text-sm">
                <span className="text-slate-700">{field.label}{field.required ? ' *' : ''}</span>
                {field.type === 'select' ? (
                  <select
                    value={String(loanSpecificValues[field.key] ?? (field.options?.[0] ?? ''))}
                    onChange={(e) => setLoanSpecificValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                  >
                    {(field.options || []).map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type === 'number' ? 'number' : 'text'}
                    min={field.type === 'number' ? 0 : undefined}
                    required={field.required}
                    value={String(loanSpecificValues[field.key] ?? '')}
                    onChange={(e) => setLoanSpecificValues((prev) => ({ ...prev, [field.key]: field.type === 'number' ? Number(e.target.value || 0) : e.target.value }))}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                  />
                )}
              </label>
            ))}
          </div>
        </details>

        <details open className="bg-white rounded-xl border border-slate-200 p-5">
          <summary className="font-semibold text-slate-900 cursor-pointer">6. Risk & Remarks</summary>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <label className="text-sm"><span className="text-slate-700">Risk Level *</span><select value={form.risk_remarks.risk_level} onChange={(e) => setForm((p) => ({ ...p, risk_remarks: { ...p.risk_remarks, risk_level: e.target.value as 'Low' | 'Medium' | 'High' } }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"><option>Low</option><option>Medium</option><option>High</option></select></label>
            <label className="text-sm"><span className="text-slate-700">Fraud Suspicion *</span><select value={yesNo(form.risk_remarks.fraud_suspicion)} onChange={(e) => setForm((p) => ({ ...p, risk_remarks: { ...p.risk_remarks, fraud_suspicion: e.target.value === 'yes' } }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"><option value="yes">Yes</option><option value="no">No</option></select></label>
            <label className="text-sm md:col-span-2"><span className="text-slate-700">Final Recommendation *</span><select value={form.risk_remarks.final_recommendation} onChange={(e) => setForm((p) => ({ ...p, risk_remarks: { ...p.risk_remarks, final_recommendation: e.target.value as 'Recommend Approval' | 'Recommend Rejection' | 'Needs Further Review' } }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"><option>Recommend Approval</option><option>Recommend Rejection</option><option>Needs Further Review</option></select></label>
            <label className="text-sm md:col-span-2"><span className="text-slate-700">Detailed Remarks *</span><textarea value={form.risk_remarks.detailed_remarks} onChange={(e) => setForm((p) => ({ ...p, risk_remarks: { ...p.risk_remarks, detailed_remarks: e.target.value } }))} rows={5} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" required /></label>
          </div>
        </details>

        <details open className="bg-white rounded-xl border border-slate-200 p-5">
          <summary className="font-semibold text-slate-900 cursor-pointer">7. Upload Field Evidence</summary>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void captureLocation()}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-700 hover:bg-slate-50"
            >
              <MapPin className="w-4 h-4" />
              {geoLoading ? 'Capturing Location...' : 'Capture Location (Optional)'}
            </button>
            {geoLocation ? (
              <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-1">
                Location Tagged: {geoLocation.lat}, {geoLocation.lng}
              </span>
            ) : (
              <span className="text-xs text-slate-500">Location not tagged</span>
            )}
          </div>

          <div className="space-y-5 mt-4">
            {activeLoanConfig.evidenceSections.map((section) => (
              <div key={section.title} className="rounded-xl border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-slate-900">{section.title}</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-3">
                  {section.items.map((item) => {
                    const files = requiredDocFiles[item.evidenceType] || [];
                    const previews = (previewUrls[item.evidenceType] as Array<{ name: string; url: string }> | undefined) || [];
                    const isMissingMandatory = item.mandatory && files.length === 0;
                    const accept = item.accept === 'image' ? 'image/*' : item.accept === 'document' ? '.pdf,.jpg,.jpeg,.png' : 'image/*,.pdf';

                    return (
                      <div key={item.evidenceType} className="rounded-lg border border-slate-200 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                            <UploadCloud className="w-4 h-4" /> Upload {item.label}{item.mandatory ? ' *' : ' (Optional)'}
                          </label>
                          {files.length > 0 ? (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full">
                              <CheckCircle2 className="w-3 h-3" /> Uploaded
                            </span>
                          ) : isMissingMandatory ? (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full">
                              <AlertTriangle className="w-3 h-3" /> Missing
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500">Not uploaded</span>
                          )}
                        </div>

                        <p className="text-xs text-slate-500 mt-1">Evidence Type: {item.evidenceType}</p>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <input
                            type="file"
                            accept={accept}
                            multiple={Boolean(item.multiple)}
                            capture={item.captureCamera ? 'environment' : undefined}
                            onChange={(e) => handlePhotoSelection(e, item.evidenceType)}
                            className="block w-full text-sm"
                          />
                          {item.captureCamera ? (
                            <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                              <Camera className="w-3 h-3" /> Camera capture supported
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {previews.map((preview) => {
                            const sourceFile = files.find((file) => file.name === preview.name);
                            const isImage = sourceFile ? sourceFile.type.startsWith('image/') : false;
                            return isImage ? (
                              <img key={preview.url} src={preview.url} alt={preview.name} className="w-full h-24 object-cover rounded-md border border-slate-200" />
                            ) : (
                              <div key={preview.url} className="rounded-md border border-slate-200 px-2 py-2 text-xs text-slate-700 bg-slate-50">
                                {preview.name}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </details>

        <button
          type="submit"
          disabled={submitting}
          className="w-full md:w-auto px-5 py-2.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-60"
        >
          {submitting ? 'Submitting...' : 'Submit Report'}
        </button>
      </form>
    </div>
  );
}
