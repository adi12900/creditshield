import { ArrowLeft, Download, Check, X, Eye, FileText, CheckCircle, Clock, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ApplicationSelector } from '../../components/ui/ApplicationSelector';
import { useStore } from '../../store';
import { workflowApi, type WorkflowDocumentItem } from '../../lib/workflowApi';
import { useLoanOfficerApplications } from '../../hooks/useLoanOfficerApplications';

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
  const user = useStore((state) => state.user);
  const selectedArn = selectedApplication?.arn ?? null;

  useEffect(() => {
    if (!selectedArn || !user || user.role !== 'loan_officer') {
      setDocuments([]);
      setSelectedDoc(null);
      return;
    }

    workflowApi
      .getDocuments(selectedArn, user.role)
      .then((rows) => {
        setDocuments(rows);
        setSelectedDoc(rows[0] ?? null);
      })
      .catch(() => {
        setDocuments([]);
        setSelectedDoc(null);
      });
  }, [selectedArn, user]);

  if (!selectedApplication) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        No applications available for document review.
      </div>
    );
  }

  const handleReview = async (decision: 'approve' | 'reject') => {
    if (!user || user.role !== 'loan_officer') return;

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

  const verifiedDocs = documents.filter(doc => doc.status === 'Verified').length;
  const totalDocs = documents.length;
  const avgConfidence = Math.round(
    documents.length > 0 ? documents.reduce((sum, doc) => sum + (doc.confidence || 0), 0) / documents.length : 0
  );
  const matchedRequired = documents.filter((doc) => doc.status === 'Verified').length;

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
        <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          All Documents Verified
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
          {selectedApplication.loanType.replace(/_/g, ' ')}
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
              <p className="text-xl font-bold text-slate-900">{matchedRequired}/{totalDocs}</p>
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
                          ? 'bg-green-100 text-green-700'
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
                <button className="px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button className="px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  View Full
                </button>
              </div>
            </div>

            <div className="bg-slate-100 rounded-lg aspect-[3/4] flex items-center justify-center mb-4">
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
            <h3 className="font-semibold text-slate-900 mb-4">OCR Extracted Data</h3>
            <div className="text-center py-8">
              <p className="text-sm text-slate-500">OCR data is not exposed by this API yet.</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mt-6">
            <h3 className="font-semibold text-slate-900 mb-4">RBI Mandatory Documents</h3>
            <div className="space-y-2">
              {documents.map((doc) => {
                const isAvailable = doc.status === 'Verified';
                return (
                  <div key={doc.id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">{doc.type}</span>
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
