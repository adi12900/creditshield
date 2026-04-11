import { Calculator, TrendingUp, AlertCircle } from 'lucide-react';
import { ApplicationSelector } from '../../components/ui/ApplicationSelector';
import { getLoanApplicationByArn } from '../../data/loanApplications';
import { useStore } from '../../store';

export function FinancialRatiosPage() {
  const selectedApplicationArn = useStore((state) => state.selectedApplicationArn);
  const setSelectedApplicationArn = useStore((state) => state.setSelectedApplicationArn);
  const selectedApplication = getLoanApplicationByArn(selectedApplicationArn);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Financial Ratio Calculator</h1>
        <p className="text-slate-600">
          ARN: {selectedApplication.arn} • {selectedApplication.borrowerName}
        </p>
      </div>

      <ApplicationSelector
        selectedArn={selectedApplication.arn}
        onSelect={setSelectedApplicationArn}
        subtitle="Choose a borrower to recalculate DTI, FOIR, and LTV for that specific case file."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">DTI (Debt-to-Income)</h3>
            <Calculator className="w-5 h-5 text-green-600" />
          </div>
          <div className="mb-4">
            <p className="text-4xl font-bold text-slate-900">{selectedApplication.riskGrade === 'C' ? '54%' : selectedApplication.riskGrade === 'B' ? '48%' : '42%'}</p>
            <p className="text-sm text-green-600 mt-1">Within policy limit (45%)</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4 text-sm">
            <p className="text-slate-600 mb-2">Formula:</p>
            <p className="font-mono text-xs text-slate-900">
              (Total Obligations / Gross Income) × 100
            </p>
            <div className="mt-3 space-y-1 text-xs">
              <p className="text-slate-600">Monthly Obligations: ₹{Math.round(selectedApplication.loanAmount / 25).toLocaleString('en-IN')}</p>
              <p className="text-slate-600">Gross Income: ₹{Math.round(selectedApplication.loanAmount / 12).toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">FOIR</h3>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <div className="mb-4">
            <p className="text-4xl font-bold text-slate-900">{selectedApplication.riskGrade === 'C' ? '46%' : selectedApplication.riskGrade === 'B' ? '41%' : '38%'}</p>
            <p className="text-sm text-green-600 mt-1">Within policy limit (40%)</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4 text-sm">
            <p className="text-slate-600 mb-2">Formula:</p>
            <p className="font-mono text-xs text-slate-900">
              (Fixed Obligations / Net Income) × 100
            </p>
            <div className="mt-3 space-y-1 text-xs">
              <p className="text-slate-600">Fixed Obligations: ₹{Math.round(selectedApplication.loanAmount / 30).toLocaleString('en-IN')}</p>
              <p className="text-slate-600">Net Income: ₹{Math.round(selectedApplication.loanAmount / 12).toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">LTV (Loan-to-Value)</h3>
            <AlertCircle className="w-5 h-5 text-green-600" />
          </div>
          <div className="mb-4">
            <p className="text-4xl font-bold text-slate-900">{selectedApplication.riskGrade === 'C' ? '72%' : selectedApplication.riskGrade === 'B' ? '68%' : '65%'}</p>
            <p className="text-sm text-green-600 mt-1">Within policy limit (80%)</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4 text-sm">
            <p className="text-slate-600 mb-2">Formula:</p>
            <p className="font-mono text-xs text-slate-900">
              (Loan Amount / Asset Value) × 100
            </p>
            <div className="mt-3 space-y-1 text-xs">
              <p className="text-slate-600">Loan Amount: ₹{selectedApplication.loanAmount.toLocaleString('en-IN')}</p>
              <p className="text-slate-600">Asset Value: ₹{Math.round(selectedApplication.loanAmount / 0.65).toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Ratio Adjustment Calculator</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Monthly Gross Income
              </label>
              <input
                type="number"
                defaultValue={Math.round(selectedApplication.loanAmount / 12)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Existing EMI Obligations
              </label>
              <input
                type="number"
                defaultValue={Math.round(selectedApplication.loanAmount / 25)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Proposed EMI
              </label>
              <input
                type="number"
                defaultValue={Math.round(selectedApplication.loanAmount / 30)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-6">
            <h4 className="font-semibold text-green-900 mb-4">Recalculated Ratios</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-green-700">New DTI:</span>
                <span className="font-bold text-green-900">42%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">New FOIR:</span>
                <span className="font-bold text-green-900">38%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Policy Compliance:</span>
                <span className="font-bold text-green-600">✓ Pass</span>
              </div>
            </div>
            <button className="w-full mt-4 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
              Save Adjustments
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
