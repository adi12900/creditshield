import { Folder, Upload, Search, Download, Lock } from 'lucide-react';
import { ApplicationSelector } from '../../components/ui/ApplicationSelector';
import { getLoanApplicationByArn } from '../../data/loanApplications';
import { useStore } from '../../store';

const documents = [
  {
    category: 'Identity Documents',
    files: [
      { name: 'PAN_Card_Vikram_Singh.pdf', size: '245 KB', uploadedOn: '2026-04-08', verified: true },
      { name: 'Aadhaar_Card_Vikram_Singh.pdf', size: '312 KB', uploadedOn: '2026-04-08', verified: true },
    ],
  },
  {
    category: 'Income Documents',
    files: [
      { name: 'Salary_Slips_Jan_Mar_2026.pdf', size: '1.2 MB', uploadedOn: '2026-04-08', verified: true },
      { name: 'Form_16_FY2024-25.pdf', size: '428 KB', uploadedOn: '2026-04-08', verified: true },
      { name: 'Bank_Statement_6M.pdf', size: '2.8 MB', uploadedOn: '2026-04-08', verified: false },
    ],
  },
  {
    category: 'Asset Documents',
    files: [
      { name: 'RC_Book_Vehicle.pdf', size: '189 KB', uploadedOn: '2026-04-09', verified: true },
      { name: 'Valuation_Report.pdf', size: '624 KB', uploadedOn: '2026-04-09', verified: false },
    ],
  },
];

export function DocumentVaultPage() {
  const selectedApplicationArn = useStore((state) => state.selectedApplicationArn);
  const setSelectedApplicationArn = useStore((state) => state.setSelectedApplicationArn);
  const selectedApplication = getLoanApplicationByArn(selectedApplicationArn);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Document Vault</h1>
        <p className="text-slate-600">
          ARN: {selectedApplication.arn} • {selectedApplication.borrowerName}
        </p>
      </div>

      <ApplicationSelector
        selectedArn={selectedApplication.arn}
        onSelect={setSelectedApplicationArn}
        subtitle="Select a borrower before reviewing vault contents, uploads, and verification status."
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600 mb-1">Total Documents</p>
          <p className="text-2xl font-bold text-slate-900">{selectedApplication.stage === 'Disbursed' ? 10 : 8}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600 mb-1">Verified</p>
          <p className="text-2xl font-bold text-green-600">{selectedApplication.kycStatus === 'Verified' ? 6 : 4}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600 mb-1">Pending Review</p>
          <p className="text-2xl font-bold text-orange-500">{selectedApplication.stage === 'Documents Pending' ? 2 : 1}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600 mb-1">Total Storage</p>
          <p className="text-2xl font-bold text-green-600">{selectedApplication.loanAmount > 1000000 ? '7.1 MB' : '5.8 MB'}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search documents..."
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>
          <button className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload Document
          </button>
        </div>

        <div className="space-y-6">
          {documents.map((category, catIdx) => (
            <div key={catIdx}>
              <div className="flex items-center gap-2 mb-3">
                <Folder className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-slate-900">{category.category}</h3>
                <span className="text-sm text-slate-500">({category.files.length} files)</span>
              </div>
              <div className="space-y-2">
                {category.files.map((file, fileIdx) => (
                  <div
                    key={fileIdx}
                    className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{file.name}</p>
                        <div className="flex gap-3 text-xs text-slate-500">
                          <span>{file.size}</span>
                          <span>Uploaded: {file.uploadedOn}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {file.verified ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                          ✓ Verified
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-orange-100 text-orange-600 text-xs rounded-full font-medium">
                          Pending
                        </span>
                      )}
                      <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
        <Lock className="w-5 h-5 text-green-600 mt-0.5" />
        <div>
          <p className="font-semibold text-green-900">Secure Document Storage</p>
          <p className="text-sm text-green-700 mt-1">
            All documents are encrypted at rest and in transit. Access is logged and monitored for compliance.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Document Activity Log</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border-l-4 border-green-500 bg-green-50 rounded">
            <div>
              <p className="text-sm font-medium text-slate-900">Document Verified</p>
              <p className="text-xs text-slate-600">Selected borrower documents reviewed by Ops Team</p>
            </div>
            <span className="text-xs text-slate-500">2 hours ago</span>
          </div>
          <div className="flex items-center justify-between p-3 border-l-4 border-green-500 bg-green-50 rounded">
            <div>
              <p className="text-sm font-medium text-slate-900">Document Uploaded</p>
              <p className="text-xs text-slate-600">Latest upload linked to {selectedApplication.borrowerName}</p>
            </div>
            <span className="text-xs text-slate-500">1 day ago</span>
          </div>
          <div className="flex items-center justify-between p-3 border-l-4 border-green-500 bg-green-50 rounded">
            <div>
              <p className="text-sm font-medium text-slate-900">OCR Completed</p>
              <p className="text-xs text-slate-600">OCR processed for {selectedApplication.arn}</p>
            </div>
            <span className="text-xs text-slate-500">2 days ago</span>
          </div>
        </div>
      </div>
    </div>
  );
}
