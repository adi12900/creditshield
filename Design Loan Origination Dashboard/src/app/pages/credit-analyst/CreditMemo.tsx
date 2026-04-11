import { Save, Send, FileText } from 'lucide-react';
import { ApplicationSelector } from '../../components/ui/ApplicationSelector';
import { getLoanApplicationByArn } from '../../data/loanApplications';
import { useStore } from '../../store';

export function CreditMemoPage() {
  const selectedApplicationArn = useStore((state) => state.selectedApplicationArn);
  const setSelectedApplicationArn = useStore((state) => state.setSelectedApplicationArn);
  const selectedApplication = getLoanApplicationByArn(selectedApplicationArn);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Credit Memo Creation</h1>
        <p className="text-slate-600">
          ARN: {selectedApplication.arn} • {selectedApplication.borrowerName}
        </p>
      </div>

      <ApplicationSelector
        selectedArn={selectedApplication.arn}
        onSelect={setSelectedApplicationArn}
        subtitle="Select a borrower before drafting the credit memo so the analysis stays tied to the right file."
      />

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Pre-Populated Data</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-600">Bureau Score</p>
            <p className="text-lg font-bold text-slate-900">{selectedApplication.creditScore}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-600">DTI Ratio</p>
            <p className="text-lg font-bold text-slate-900">{selectedApplication.riskGrade === 'C' ? '54%' : selectedApplication.riskGrade === 'B' ? '48%' : '42%'}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-600">AI Risk Grade</p>
            <p className="text-lg font-bold text-green-600">{selectedApplication.riskGrade} ({selectedApplication.riskGrade === 'A+' ? 'Excellent' : selectedApplication.riskGrade === 'A' ? 'Good' : selectedApplication.riskGrade === 'B' ? 'Moderate' : 'High Risk'})</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Credit Analysis Summary
            </label>
            <textarea
              rows={6}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              placeholder="Enter detailed credit analysis..."
              defaultValue={`The applicant ${selectedApplication.borrowerName} demonstrates a ${selectedApplication.riskGrade} grade risk profile with a CIBIL score of ${selectedApplication.creditScore}. The current loan amount is ₹${selectedApplication.loanAmount.toLocaleString('en-IN')} and the selected file is in ${selectedApplication.stage} stage. Recommendation should be aligned to the live queue selection.`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Key Strengths
            </label>
            <textarea
              rows={3}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              placeholder="List key strengths..."
              defaultValue={`• Strong credit score (${selectedApplication.creditScore})&#10;• Current stage: ${selectedApplication.stage}&#10;• Risk grade: ${selectedApplication.riskGrade}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Risk Factors
            </label>
            <textarea
              rows={3}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              placeholder="List risk factors..."
              defaultValue={`• Recent inquiries: ${selectedApplication.slaBreached ? 'Above threshold' : 'Within threshold'}&#10;• Employment type: ${selectedApplication.employmentType}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Recommendation *
            </label>
            <select className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600">
              <option>Select recommendation...</option>
              <option selected>Approve</option>
              <option>Approve with Conditions</option>
              <option>Decline</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Conditions (if applicable)
            </label>
            <textarea
              rows={3}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              placeholder="Enter any conditions for approval..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium flex items-center justify-center gap-2">
              <Save className="w-4 h-4" />
              Save Draft
            </button>
            <button className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center justify-center gap-2">
              <Send className="w-4 h-4" />
              Submit to Underwriter
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Memo History</h3>
        <div className="space-y-3">
          <div className="p-4 border border-slate-200 rounded-lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-slate-900">Version 1.0 - Draft</p>
                <p className="text-sm text-slate-600 mt-1">Created by: Current Analyst</p>
                <p className="text-xs text-slate-500 mt-1">2026-04-10 10:30 AM</p>
              </div>
              <FileText className="w-5 h-5 text-slate-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
