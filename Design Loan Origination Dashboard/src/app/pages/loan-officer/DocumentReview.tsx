import { ArrowLeft, Download, Check, X, AlertTriangle, Eye, FileText, CheckCircle, Clock, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { createDocumentReviewItems, getLoanApplicationByArn } from '../../data/loanApplications';
import { ApplicationSelector } from '../../components/ui/ApplicationSelector';
import { useStore } from '../../store';
import { getLoanPolicy, getRequiredDocumentsForLoanType } from '../../lib/rbiPolicy';
import { workflowApi } from '../../lib/workflowApi';

export function DocumentReviewPage() {
  const navigate = useNavigate();
  const selectedApplicationArn = useStore((state) => state.selectedApplicationArn);
  const setSelectedApplicationArn = useStore((state) => state.setSelectedApplicationArn);
  const selectedApplication = getLoanApplicationByArn(selectedApplicationArn);
  const mockDocuments = createDocumentReviewItems(selectedApplication);
  const selectedPolicy = getLoanPolicy(selectedApplication.loanType);
  const requiredDocuments = getRequiredDocumentsForLoanType(selectedApplication.loanType);
  const [selectedDoc, setSelectedDoc] = useState(mockDocuments[0]);
  const user = useStore((state) => state.user);

  useEffect(() => {
    setSelectedDoc(mockDocuments[0]);
  }, [selectedApplication.arn]);

  const handleReview = async (decision: 'approve' | 'reject') => {
    if (!user || user.role !== 'loan_officer') return;

    try {
      await workflowApi.reviewDocument(selectedApplication.arn, selectedDoc.id, decision, user.role);
      window.alert(`Document ${decision === 'approve' ? 'approved' : 'rejected'} successfully.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to review document';
      window.alert(message);
    }
  };

  const verifiedDocs = mockDocuments.filter(doc => doc.status === 'Verified').length;
  const totalDocs = mockDocuments.length;
  const avgConfidence = Math.round(
    mockDocuments.reduce((sum, doc) => sum + (doc.confidence || 0), 0) / mockDocuments.length
  );
  const matchedRequired = requiredDocuments.filter((requiredDoc) =>
    mockDocuments.some((doc) => doc.type.toLowerCase().includes(requiredDoc.toLowerCase()))
  ).length;

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
      />

      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <p className="text-xs text-slate-500 mb-1">Loan Product / RBI Chapter</p>
        <p className="font-semibold text-slate-900">
          {selectedPolicy?.label} - {selectedPolicy?.rbiChapter}
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
              <p className="text-xl font-bold text-slate-900">{matchedRequired}/{requiredDocuments.length}</p>
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
              {mockDocuments.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className={`w-full text-left p-3 rounded-lg transition-all mb-1 ${
                    selectedDoc.id === doc.id
                      ? 'bg-green-50 border-2 border-green-600'
                      : 'hover:bg-slate-50 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-sm font-medium text-slate-900">{doc.type}</span>
                    {doc.tampering && (
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                    )}
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
          </div>
        </div>

        {/* Document Viewer */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">{selectedDoc.type}</h3>
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

            {selectedDoc.tampering && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900 text-sm">Tampering Detected</p>
                  <p className="text-red-700 text-xs mt-1">
                    Metadata anomaly detected. Please verify document authenticity.
                  </p>
                </div>
              </div>
            )}

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
              <button onClick={() => handleReview('approve')} className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center justify-center gap-2">
                <Check className="w-4 h-4" />
                Approve Document
              </button>
              <button onClick={() => handleReview('reject')} className="flex-1 px-4 py-2.5 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 font-medium flex items-center justify-center gap-2">
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
            {selectedDoc.ocrData ? (
              <div className="space-y-4">
                {Object.entries(selectedDoc.ocrData).map(([key, data]) => (
                  <div key={key}>
                    <label className="text-xs font-medium text-slate-600">{key}</label>
                    <div className="mt-1">
                      <input
                        type="text"
                        value={data.value}
                        className={`w-full px-3 py-2 border rounded-lg text-sm ${
                          data.confidence < 80
                            ? 'border-amber-300 bg-amber-50'
                            : 'border-slate-300'
                        }`}
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Confidence: {data.confidence}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-slate-500">OCR processing pending</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mt-6">
            <h3 className="font-semibold text-slate-900 mb-4">RBI Mandatory Documents</h3>
            <div className="space-y-2">
              {requiredDocuments.map((requiredDoc) => {
                const isAvailable = mockDocuments.some((doc) =>
                  doc.type.toLowerCase().includes(requiredDoc.toLowerCase())
                );
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
