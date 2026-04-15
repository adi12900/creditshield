import { ArrowLeft, Download, Check, X, Eye, FileText, CheckCircle, Clock, Shield, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ApplicationSelector } from '../../components/ui/ApplicationSelector';
import { useStore } from '../../store';
import { workflowApi, type WorkflowDocumentItem } from '../../lib/workflowApi';
import { useLoanOfficerApplications } from '../../hooks/useLoanOfficerApplications';
import { getLoanPolicy, getRequiredDocumentsForLoanType } from '../../lib/rbiPolicy';

type OcrField = { value: string; confidence: number };

function normalizeDocName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function isDocumentTypeMatch(requiredDocType: string, uploadedDocType: string): boolean {
  const required = normalizeDocName(requiredDocType);
  const uploaded = normalizeDocName(uploadedDocType);

  return required === uploaded || required.includes(uploaded) || uploaded.includes(required);
}

function getPreviewKind(url?: string | null): 'none' | 'image' | 'pdf' | 'other' {
  if (!url) return 'none';

  try {
    const pathname = new URL(url).pathname.toLowerCase();
    if (pathname.endsWith('.pdf')) return 'pdf';
    if (
      pathname.endsWith('.png') ||
      pathname.endsWith('.jpg') ||
      pathname.endsWith('.jpeg') ||
      pathname.endsWith('.webp') ||
      pathname.endsWith('.gif')
    ) {
      return 'image';
    }
    return 'other';
  } catch {
    return 'other';
  }
}

export function DocumentReviewPage() {
  const navigate = useNavigate();
  const {
    selectedApplication,
    applications,
    setSelectedApplicationArn,
    isLoading,
    errorMessage,
  } = useLoanOfficerApplications();
  const [documents, setDocuments] = useState<WorkflowDocumentItem[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<WorkflowDocumentItem | null>(null);
  const [ocrData, setOcrData] = useState<Record<string, OcrField> | null>(null);
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [ocrErrorMessage, setOcrErrorMessage] = useState('');
  const [ocrExtractedAt, setOcrExtractedAt] = useState<string | null>(null);
  const user = useStore((state) => state.user);
  const selectedArn = selectedApplication?.arn ?? null;
  const isDocumentReviewRole = user?.role === 'loan_officer' || user?.role === 'system_admin';

  useEffect(() => {
    if (!selectedArn || !user || !isDocumentReviewRole) {
      setDocuments([]);
      setSelectedDoc(null);
      return;
    }

    workflowApi
      .getDocuments(selectedArn, user.role)
      .then((rows) => {
        setDocuments(rows);
        setSelectedDoc(rows[0] ?? null);
        setOcrData(null);
        setOcrErrorMessage('');
        setOcrExtractedAt(null);
      })
      .catch(() => {
        setDocuments([]);
        setSelectedDoc(null);
        setOcrData(null);
        setOcrErrorMessage('');
        setOcrExtractedAt(null);
      });
  }, [selectedArn, user, isDocumentReviewRole]);

  useEffect(() => {
    if (!selectedArn || !selectedDoc?.id || !user || !isDocumentReviewRole) {
      setOcrData(null);
      setOcrErrorMessage('');
      setOcrExtractedAt(null);
      setIsOcrLoading(false);
      return;
    }

    let mounted = true;
    setIsOcrLoading(true);
    setOcrErrorMessage('');
    setOcrExtractedAt(null);

    workflowApi
      .getDocumentOcr(selectedArn, selectedDoc.id, user.role)
      .then((response) => {
        if (!mounted) return;
        setOcrData(response.ocr_data || null);
        setOcrExtractedAt(response.extracted_at || null);
      })
      .catch((error) => {
        if (!mounted) return;
        setOcrData(null);
        const message = error instanceof Error ? error.message : '';
        if (message && !/not available|run extraction first/i.test(message)) {
          setOcrErrorMessage(message);
        }
      })
      .finally(() => {
        if (mounted) {
          setIsOcrLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [selectedArn, selectedDoc?.id, user, isDocumentReviewRole]);

  const handleExtractOcr = async () => {
    if (!selectedArn || !selectedDoc?.id || !user || !isDocumentReviewRole) return;

    try {
      setIsOcrLoading(true);
      setOcrErrorMessage('');
      const response = await workflowApi.extractDocumentOcr(selectedArn, selectedDoc.id, user.role);
      setOcrData(response.ocr_data || null);
      setOcrExtractedAt(response.extracted_at || null);

      const refreshed = await workflowApi.getDocuments(selectedArn, user.role);
      setDocuments(refreshed);
      setSelectedDoc(refreshed.find((doc) => doc.id === selectedDoc.id) ?? refreshed[0] ?? null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'OCR extraction failed';
      setOcrErrorMessage(message);
    } finally {
      setIsOcrLoading(false);
    }
  };

  if (!selectedApplication) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        No applications available for document review.
      </div>
    );
  }

  const handleReview = async (decision: 'approve' | 'reject') => {
    if (!user || !isDocumentReviewRole) return;

    try {
      if (!selectedDoc) {
        window.alert('No document selected.');
        return;
      }

      await workflowApi.reviewDocument(selectedApplication.arn, selectedDoc.id, decision, user.role);
      const refreshed = await workflowApi.getDocuments(selectedApplication.arn, user.role);
      setDocuments(refreshed);
      setSelectedDoc(refreshed.find((doc) => doc.id === selectedDoc.id) ?? refreshed[0] ?? null);
      window.alert(`Document ${decision === 'approve' ? 'approved' : 'rejected'} successfully.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to review document';
      window.alert(message);
    }
  };

  const handleOpenDocument = (mode: 'download' | 'view') => {
    if (!selectedDoc?.storage_url) {
      window.alert('No document URL available for this file.');
      return;
    }

    if (mode === 'view') {
      window.open(selectedDoc.storage_url, '_blank', 'noopener,noreferrer');
      return;
    }

    const link = document.createElement('a');
    link.href = selectedDoc.storage_url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.download = '';
    link.click();
  };

  const verifiedDocs = documents.filter(doc => doc.status === 'Verified').length;
  const totalDocs = documents.length;
  const avgConfidence = Math.round(
    documents.length > 0 ? documents.reduce((sum, doc) => sum + (doc.confidence || 0), 0) / documents.length : 0
  );
  const requiredDocuments = getRequiredDocumentsForLoanType(selectedApplication.loanType as never) ?? [];
  const matchedRequired = requiredDocuments.filter((requiredDocType) =>
    documents.some((doc) => doc.status === 'Verified' && isDocumentTypeMatch(requiredDocType, doc.type))
  ).length;
  const totalRequired = requiredDocuments.length;
  const policy = getLoanPolicy(selectedApplication.loanType);
  const selectedDocOcr = ocrData;
  const isCoverageComplete = totalRequired > 0 && matchedRequired === totalRequired;
  const coverageLabel = `${matchedRequired}/${totalRequired}`;
  const previewKind = getPreviewKind(selectedDoc?.storage_url);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">Document Review</h1>
          <p className="text-slate-600">ARN: {selectedApplication.arn} • {selectedApplication.borrowerName}</p>
        </div>
        <span
          className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 ${
            isCoverageComplete ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          {isCoverageComplete ? 'RBI Coverage Complete' : `RBI Coverage ${coverageLabel}`}
        </span>
      </div>

      <ApplicationSelector
        selectedArn={selectedApplication.arn}
        onSelect={setSelectedApplicationArn}
        subtitle="Search and filter borrowers to review their document set."
        applications={applications}
      />

      {isLoading ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Loading documents...
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <p className="text-xs text-slate-500 mb-1">Loan Product</p>
        <p className="font-semibold text-slate-900">
          {policy?.label ?? selectedApplication.loanType.replace(/_/g, ' ')}
        </p>
      </div>

      {/* Document Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <FileText className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-slate-600">Total Documents</p>
              <p className="text-xl font-bold text-slate-900">{totalDocs}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-slate-600">Verified</p>
              <p className="text-xl font-bold text-green-600">{verifiedDocs}/{totalDocs}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Shield className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-slate-600">Avg Confidence</p>
              <p className="text-xl font-bold text-slate-900">{avgConfidence}%</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <Clock className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-xs text-slate-600">RBI Mandatory Coverage</p>
              <p className="text-xl font-bold text-slate-900">{coverageLabel}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Document List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-4 border-b border-slate-200">
              <h3 className="font-semibold text-slate-900">Documents</h3>
            </div>
            <div className="p-2">
              {documents.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className={`w-full text-left p-3 rounded-lg transition-all mb-1 ${
                    selectedDoc?.id === doc.id
                      ? 'bg-green-50 border-2 border-green-600'
                      : 'hover:bg-slate-50 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-sm font-medium text-slate-900">{doc.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        doc.status === 'Verified'
                          ? 'bg-green-100 text-green-700'
                          : doc.status === 'Pending OCR'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-orange-100 text-orange-600'
                      }`}
                    >
                      {doc.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
            {documents.length === 0 && (
              <p className="px-3 pb-3 text-xs text-slate-500">No documents found for this ARN.</p>
            )}
          </div>
        </div>

        {/* Document Viewer */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">{selectedDoc?.type ?? 'No Document'}</h3>
              <div className="flex gap-2">
                <button
                  disabled={!selectedDoc?.storage_url}
                  onClick={() => handleOpenDocument('download')}
                  className="px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  disabled={!selectedDoc?.storage_url}
                  onClick={() => handleOpenDocument('view')}
                  className="px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View Full
                </button>
              </div>
            </div>

            <div className="bg-slate-100 rounded-lg aspect-[3/4] overflow-hidden flex items-center justify-center mb-4">
              {previewKind === 'image' && selectedDoc?.storage_url ? (
                <img
                  src={selectedDoc.storage_url}
                  alt={selectedDoc.type}
                  className="w-full h-full object-contain bg-slate-100"
                />
              ) : previewKind === 'pdf' && selectedDoc?.storage_url ? (
                <iframe
                  title={`${selectedDoc.type} preview`}
                  src={selectedDoc.storage_url}
                  className="w-full h-full border-0"
                />
              ) : selectedDoc?.storage_url ? (
                <div className="text-center px-6">
                  <FileText className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                  <p className="text-sm text-slate-700 mb-3">Preview not available for this file type.</p>
                  <button
                    onClick={() => handleOpenDocument('view')}
                    className="px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50"
                  >
                    Open in new tab
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-24 h-24 bg-slate-200 rounded-lg mx-auto mb-3 flex items-center justify-center">
                    <svg
                      className="w-12 h-12 text-slate-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-slate-600">Document Preview</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button disabled={!selectedDoc} onClick={() => handleReview('approve')} className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-400 font-medium flex items-center justify-center gap-2">
                <Check className="w-4 h-4" />
                Approve Document
              </button>
              <button disabled={!selectedDoc} onClick={() => handleReview('reject')} className="flex-1 px-4 py-2.5 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400 font-medium flex items-center justify-center gap-2">
                <X className="w-4 h-4" />
                Reject Document
              </button>
            </div>
          </div>
        </div>

        {/* OCR Extracted Data */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="font-semibold text-slate-900">OCR Extracted Data</h3>
              <button
                disabled={!selectedDoc || isOcrLoading}
                onClick={handleExtractOcr}
                className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 flex items-center gap-1.5"
              >
                {isOcrLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                Extract OCR
              </button>
            </div>
            {isOcrLoading ? (
              <div className="text-center py-8">
                <p className="text-sm text-slate-500">Extracting OCR fields...</p>
              </div>
            ) : ocrErrorMessage ? (
              <div className="text-center py-6">
                <p className="text-sm text-red-600">{ocrErrorMessage}</p>
              </div>
            ) : selectedDocOcr && Object.keys(selectedDocOcr).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(selectedDocOcr).map(([field, data]) => (
                  <div key={field} className="rounded-lg border border-slate-200 p-3">
                    <p className="text-xs text-slate-500">{field}</p>
                    <p className="text-sm font-medium text-slate-900">{data.value}</p>
                    <p className="text-xs text-slate-600">Confidence: {Math.round(data.confidence)}%</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-slate-500">Run OCR extraction for the selected document.</p>
              </div>
            )}
            {ocrExtractedAt ? (
              <p className="mt-3 text-[11px] text-slate-500">Extracted at: {new Date(ocrExtractedAt).toLocaleString()}</p>
            ) : null}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mt-6">
            <h3 className="font-semibold text-slate-900 mb-4">RBI Mandatory Documents</h3>
            <div className="space-y-2">
              {requiredDocuments.map((requiredDocType) => {
                const isAvailable = documents.some(
                  (doc) => doc.status === 'Verified' && isDocumentTypeMatch(requiredDocType, doc.type)
                );
                return (
                  <div key={requiredDocType} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">{requiredDocType}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {isAvailable ? 'Available' : 'Missing'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
