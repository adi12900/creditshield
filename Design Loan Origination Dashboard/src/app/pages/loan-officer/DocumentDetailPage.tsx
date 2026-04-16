import { ArrowLeft, Download, Check, X, AlertTriangle, Eye, FileText, CheckCircle, Clock, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getLoanApplicationByArn } from '../../data/loanApplications';
import { useStore } from '../../store';
import { getLoanPolicy, getRequiredDocumentsForLoanType } from '../../lib/rbiPolicy';
import { workflowApi, type WorkflowDocumentItem, type WorkflowRole } from '../../lib/workflowApi';

function getPathFromUrl(url: string): string {
  try {
    return new URL(url).pathname.toLowerCase();
  } catch {
    return url.toLowerCase().split('?')[0].split('#')[0];
  }
}

function isImageDocument(url: string, docType?: string): boolean {
  const path = getPathFromUrl(url);
  const imageByExt = /\.(jpg|jpeg|png|webp|gif)$/i.test(path);
  const type = (docType || '').toLowerCase();
  const looksLikeImageDoc = type.includes('photo') || type.includes('selfie') || type.includes('image');
  return imageByExt || looksLikeImageDoc;
}

function isPdfDocument(url: string): boolean {
  const path = getPathFromUrl(url);
  return /\.pdf$/i.test(path);
}

export function DocumentDetailPage() {
  const navigate = useNavigate();
  const { arn } = useParams();
  const targetArn = decodeURIComponent(arn ?? '');
  const user = useStore((state) => state.user);
  const setSelectedApplicationArn = useStore((state) => state.setSelectedApplicationArn);

  const selectedApplication = getLoanApplicationByArn(targetArn);
  const selectedPolicy = getLoanPolicy(selectedApplication.loanType);
  const requiredDocuments = getRequiredDocumentsForLoanType(selectedApplication.loanType);

  const [documents, setDocuments] = useState<WorkflowDocumentItem[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<WorkflowDocumentItem | null>(null);
  const workflowRole: WorkflowRole | null = user ? (user.role === 'system_admin' ? 'loan_officer' : user.role) : null;

  useEffect(() => {
    if (targetArn) {
      setSelectedApplicationArn(targetArn);
    }
  }, [setSelectedApplicationArn, targetArn]);

  useEffect(() => {
    if (!targetArn || !workflowRole) {
      setDocuments([]);
      setSelectedDoc(null);
      return;
    }

    workflowApi
      .getDocuments(targetArn, workflowRole)
      .then((rows) => {
        setDocuments(rows);
        setSelectedDoc(rows[0] ?? null);
      })
      .catch(() => {
        setDocuments([]);
        setSelectedDoc(null);
      });
  }, [targetArn, workflowRole]);

  const handleReview = async (decision: 'approve' | 'reject') => {
    if (!workflowRole) return;

    try {
      if (!selectedDoc) {
        window.alert('No document selected.');
        return;
      }

      await workflowApi.reviewDocument(targetArn, selectedDoc.id, decision, workflowRole);
      const refreshed = await workflowApi.getDocuments(targetArn, workflowRole);
      setDocuments(refreshed);
      setSelectedDoc(refreshed.find((doc) => doc.id === selectedDoc.id) ?? refreshed[0] ?? null);
      window.alert(`Document ${decision === 'approve' ? 'approved' : 'rejected'} successfully.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to review document';
      window.alert(message);
    }
  };

  const resolveFreshDocumentUrl = async () => {
    if (!selectedDoc) return null;

    if (!workflowRole) {
      return selectedDoc.storage_url || null;
    }

    try {
      const refreshed = await workflowApi.getDocuments(targetArn, workflowRole);
      setDocuments(refreshed);
      const latest = refreshed.find((doc) => doc.id === selectedDoc.id) ?? selectedDoc;
      setSelectedDoc(latest);
      return latest.storage_url || null;
    } catch {
      return selectedDoc.storage_url || null;
    }
  };

  const handleOpenDocument = async (download: boolean) => {
    const url = await resolveFreshDocumentUrl();
    if (!url) {
      window.alert('Document URL is unavailable.');
      return;
    }

    if (download) {
      const link = document.createElement('a');
      link.href = url;
      link.download = '';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.click();
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const verifiedDocs = documents.filter((doc) => doc.status === 'Verified').length;
  const totalDocs = documents.length;
  const avgConfidence = Math.round(
    documents.length > 0 ? documents.reduce((sum, doc) => sum + (doc.confidence || 0), 0) / documents.length : 0
  );
  const matchedRequired = requiredDocuments.filter((requiredDoc) =>
    documents.some((doc) => doc.type.toLowerCase().includes(requiredDoc.toLowerCase()))
  ).length;

  return (
    <div className="min-h-screen space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/dashboard/document-review')}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">Document Detail</h1>
          <p className="text-slate-600">ARN: {targetArn || selectedApplication.arn} • {selectedApplication.borrowerName}</p>
        </div>
        <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          All Documents Verified
        </span>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <p className="text-xs text-slate-500 mb-1">Loan Product / RBI Chapter</p>
        <p className="font-semibold text-slate-900">
          {selectedPolicy?.label} - {selectedPolicy?.rbiChapter}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
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
              <p className="text-xl font-bold text-slate-900">{matchedRequired}/{requiredDocuments.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
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
                          : doc.status === 'Flagged'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
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

        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">{selectedDoc?.type ?? 'No Document'}</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => void handleOpenDocument(true)}
                  className={`px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2 ${!selectedDoc?.storage_url ? 'pointer-events-none opacity-40' : ''}`}
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={() => void handleOpenDocument(false)}
                  className={`px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2 ${!selectedDoc?.storage_url ? 'pointer-events-none opacity-40' : ''}`}
                >
                  <Eye className="w-4 h-4" />
                  View Full
                </button>
              </div>
            </div>

            <div className="bg-slate-100 rounded-lg aspect-[3/4] flex items-center justify-center mb-4 overflow-hidden">
              {selectedDoc?.storage_url ? (
                isPdfDocument(selectedDoc.storage_url) ? (
                  <iframe
                    src={`${selectedDoc.storage_url}#toolbar=0&navpanes=0`}
                    title={selectedDoc.type}
                    className="w-full h-full border-0"
                  />
                ) : isImageDocument(selectedDoc.storage_url, selectedDoc.type) ? (
                  <img
                    src={selectedDoc.storage_url}
                    alt={selectedDoc.type}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="text-center p-6">
                    <FileText className="w-16 h-16 text-slate-400 mx-auto mb-3" />
                    <p className="text-sm text-slate-600 font-medium">{selectedDoc.type}</p>
                    <p className="mt-2 text-xs text-slate-500">Inline preview is not available for this file type.</p>
                  </div>
                )
              ) : (
                <div className="text-center">
                  <div className="w-24 h-24 bg-slate-200 rounded-lg mx-auto mb-3 flex items-center justify-center">
                    <svg className="w-12 h-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-sm text-slate-600">Document Preview</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                disabled={!selectedDoc}
                onClick={() => void handleReview('approve')}
                className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-400 font-medium flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Approve Document
              </button>
              <button
                disabled={!selectedDoc}
                onClick={() => void handleReview('reject')}
                className="flex-1 px-4 py-2.5 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400 font-medium flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Reject Document
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-600" />
              AI Verification Result
            </h3>
            {selectedDoc?.agent_verdict ? (
              <div className="space-y-3">
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                    selectedDoc.status === 'Verified'
                      ? 'bg-green-100 text-green-700'
                      : selectedDoc.status === 'Flagged'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {selectedDoc.status === 'Verified' ? <Check className="w-3.5 h-3.5" /> : selectedDoc.status === 'Flagged' ? <X className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                  {selectedDoc.status}
                </div>

                {selectedDoc.confidence > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Confidence</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${selectedDoc.confidence >= 70 ? 'bg-green-500' : selectedDoc.confidence >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${selectedDoc.confidence}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-700">{selectedDoc.confidence}%</span>
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-xs text-slate-500 mb-1">Agent Findings</p>
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50 rounded-lg p-3">
                    {selectedDoc.agent_verdict}
                  </p>
                </div>

                {selectedDoc.uploaded_at && (
                  <p className="text-xs text-slate-400">Uploaded: {new Date(selectedDoc.uploaded_at).toLocaleString()}</p>
                )}
              </div>
            ) : selectedDoc && selectedDoc.status === 'Pending OCR' ? (
              <div className="text-center py-6">
                <Clock className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-700">Verification in progress</p>
                <p className="text-xs text-slate-500 mt-1">AI agent is analysing this document</p>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-slate-500">No document selected</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mt-6">
            <h3 className="font-semibold text-slate-900 mb-4">RBI Mandatory Documents</h3>
            <div className="space-y-2">
              {requiredDocuments.map((requiredDoc) => {
                const isAvailable = documents.some((doc) => doc.type.toLowerCase().includes(requiredDoc.toLowerCase()));
                return (
                  <div key={requiredDoc} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">{requiredDoc}</span>
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
