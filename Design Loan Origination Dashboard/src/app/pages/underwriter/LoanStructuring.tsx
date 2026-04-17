import { Calculator, TrendingUp } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { ApplicationSelector } from '../../components/ui/ApplicationSelector';
import { getLoanApplicationByArn } from '../../data/loanApplications';
import { useStore } from '../../store';
import { workflowApi, type WorkflowApplication } from '../../lib/workflowApi';

export function LoanStructuringPage() {
  const [loanAmount, setLoanAmount] = useState(850000);
  const [tenure, setTenure] = useState(36);
  const [interestRate, setInterestRate] = useState(12.5);
  const selectedApplicationArn = useStore((state) => state.selectedApplicationArn);
  const setSelectedApplicationArn = useStore((state) => state.setSelectedApplicationArn);
  const user = useStore((state) => state.user);
  const [apiApplications, setApiApplications] = useState<WorkflowApplication[]>([]);
  const fallbackApplication = getLoanApplicationByArn(selectedApplicationArn);
  const selectedApiApplication = apiApplications.find((item) => item.arn === selectedApplicationArn) ?? null;
  const selectedApplication = {
    ...fallbackApplication,
    arn: selectedApiApplication?.arn ?? fallbackApplication.arn,
    borrowerName: selectedApiApplication?.borrower_name ?? fallbackApplication.borrowerName,
    loanAmount: selectedApiApplication?.loan_amount ?? fallbackApplication.loanAmount,
    stage: (selectedApiApplication?.stage as typeof fallbackApplication.stage | undefined) ?? fallbackApplication.stage,
    riskGrade: (selectedApiApplication?.risk_grade as typeof fallbackApplication.riskGrade | undefined) ?? fallbackApplication.riskGrade,
    creditScore: selectedApiApplication?.credit_score ?? fallbackApplication.creditScore,
    employmentType: (selectedApiApplication?.employment_type as typeof fallbackApplication.employmentType | undefined) ?? fallbackApplication.employmentType,
    kycStatus: (selectedApiApplication?.kyc_status as typeof fallbackApplication.kycStatus | undefined) ?? fallbackApplication.kycStatus,
  };
  const requestedAmount = useMemo(() => {
    const raw = Number(selectedApplication.loanAmount);
    if (!Number.isFinite(raw) || raw <= 0) {
      return 100000;
    }
    return Math.round(raw);
  }, [selectedApplication.loanAmount]);
  const minOfferAmount = 0;
  const amountStep = useMemo(() => {
    const spread = Math.max(requestedAmount - minOfferAmount, 0);
    if (spread <= 0) return 1;
    return Math.max(1, Math.floor(spread / 200));
  }, [minOfferAmount, requestedAmount]);

  useEffect(() => {
    if (!user || user.role !== 'underwriter') {
      setApiApplications([]);
      return;
    }

    workflowApi
      .listApplications()
      .then((rows) => {
        const underwritingRows = rows.filter((row) => row.stage.trim().toUpperCase() === 'UNDERWRITING');
        setApiApplications(underwritingRows);
        if (!underwritingRows.some((row) => row.arn === selectedApplicationArn) && underwritingRows.length > 0) {
          setSelectedApplicationArn(underwritingRows[0].arn);
        }
      })
      .catch(() => setApiApplications([]));
  }, [selectedApplicationArn, setSelectedApplicationArn, user]);

  useEffect(() => {
    // Reset structuring amount to the borrower's requested amount whenever file changes.
    setLoanAmount(requestedAmount);
  }, [requestedAmount, selectedApplication.arn]);

  useEffect(() => {
    // Keep current slider value within valid bounds if borrower amount changes.
    setLoanAmount((current) => Math.min(Math.max(current, minOfferAmount), requestedAmount));
  }, [minOfferAmount, requestedAmount]);

  const calculateEMI = () => {
    const p = loanAmount;
    const r = interestRate / 12 / 100;
    const n = tenure;
    const emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return Math.round(emi);
  };

  const calculateTotalInterest = () => {
    const emi = calculateEMI();
    return emi * tenure - loanAmount;
  };

  const calculateDTI = () => {
    const emi = calculateEMI();
    const grossIncome = 75000;
    return ((emi / grossIncome) * 100).toFixed(2);
  };

  const handleGenerateOffer = async () => {
    if (!user || user.role !== 'underwriter') return;
    try {
      const offeredAmount = Math.min(loanAmount, requestedAmount);
      const offer = await workflowApi.generateLoanOffer(selectedApplication.arn, user.role, {
        loan_amount: offeredAmount,
        tenure_months: tenure,
        interest_rate: interestRate,
      });
      const emailStatus = offer.email_status ? ` Email status: ${offer.email_status}.` : '';
      const emailTo = offer.email_to ? ` Sent to: ${offer.email_to}.` : '';
      const emailError = offer.email_error ? ` Error: ${offer.email_error}.` : '';
      window.alert(`Offer generated. EMI ₹${offer.emi}.${emailStatus}${emailTo}${emailError}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate offer';
      window.alert(message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Loan Structuring Tools</h1>
        <p className="text-slate-600">
          ARN: {selectedApplication.arn} • {selectedApplication.borrowerName}
        </p>
      </div>

      <ApplicationSelector
        selectedArn={selectedApplication.arn}
        onSelect={setSelectedApplicationArn}
        subtitle="Choose a borrower file before adjusting loan amount, tenure, and pricing in the structuring tool."
        applications={apiApplications.map((application) => ({
          arn: application.arn,
          borrowerName: application.borrower_name,
          email: `${application.borrower_name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
          stage: application.stage,
          riskGrade: (application.risk_grade === 'A+' || application.risk_grade === 'A' || application.risk_grade === 'B' || application.risk_grade === 'C' || application.risk_grade === 'D') ? application.risk_grade : 'C',
          loanAmount: application.loan_amount,
        }))}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Adjust Loan Parameters</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Loan Amount: ₹{loanAmount.toLocaleString()}
                </label>
                <input
                  type="range"
                  min={String(minOfferAmount)}
                  max={String(requestedAmount)}
                  step={String(amountStep)}
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(Math.min(Number(e.target.value), requestedAmount))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>₹{minOfferAmount.toLocaleString('en-IN')}</span>
                  <span>₹{(requestedAmount / 100000).toFixed(2)}L (requested)</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tenure: {tenure} months
                </label>
                <input
                  type="range"
                  min="12"
                  max="60"
                  step="6"
                  value={tenure}
                  onChange={(e) => setTenure(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>12 months</span>
                  <span>60 months</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Interest Rate: {interestRate}% p.a.
                </label>
                <input
                  type="range"
                  min="9"
                  max="18"
                  step="0.5"
                  value={interestRate}
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>9%</span>
                  <span>18%</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Processing Fee
                </label>
                <input
                  type="number"
                  defaultValue={Math.round(selectedApplication.loanAmount * 0.01)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                />
                <p className="text-xs text-slate-500 mt-1">Policy range: 1% - 2% of loan amount</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mt-6">
            <h3 className="font-semibold text-slate-900 mb-4">Offer Variants Comparison</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold">Variant</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">Tenure</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">Rate</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">EMI</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">DTI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr className="bg-green-50">
                    <td className="px-4 py-3 font-medium">Current</td>
                    <td className="px-4 py-3">₹{loanAmount.toLocaleString()}</td>
                    <td className="px-4 py-3">{tenure}m</td>
                    <td className="px-4 py-3">{interestRate}%</td>
                    <td className="px-4 py-3 font-semibold">₹{calculateEMI().toLocaleString()}</td>
                    <td className="px-4 py-3 font-semibold">{calculateDTI()}%</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">Lower Amount</td>
                    <td className="px-4 py-3">₹{Math.round(selectedApplication.loanAmount * 0.82).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3">36m</td>
                    <td className="px-4 py-3">12.5%</td>
                    <td className="px-4 py-3">₹{Math.round(calculateEMI() * 0.82).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-green-600">{(parseFloat(calculateDTI()) * 0.82).toFixed(1)}%</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">Longer Tenure</td>
                    <td className="px-4 py-3">₹{selectedApplication.loanAmount.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3">48m</td>
                    <td className="px-4 py-3">12.5%</td>
                    <td className="px-4 py-3">₹{Math.round((selectedApplication.loanAmount * (interestRate / 12 / 100) * Math.pow(1 + interestRate / 12 / 100, 48)) / (Math.pow(1 + interestRate / 12 / 100, 48) - 1)).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-green-600">{(parseFloat(calculateDTI()) * 0.91).toFixed(1)}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-slate-900">Calculated Values</h3>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-600">Monthly EMI</p>
                <p className="text-2xl font-bold text-slate-900">₹{calculateEMI().toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Interest</p>
                <p className="text-lg font-semibold text-slate-900">
                  ₹{calculateTotalInterest().toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Amount Payable</p>
                <p className="text-lg font-semibold text-slate-900">
                  ₹{(calculateEMI() * tenure).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Updated DTI</p>
                <p className={`text-lg font-semibold ${
                  parseFloat(calculateDTI()) > 45 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {calculateDTI()}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <h4 className="font-semibold text-green-900">Policy Compliance</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-green-700">DTI Check:</span>
                <span className={`font-semibold ${
                  parseFloat(calculateDTI()) > 45 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {parseFloat(calculateDTI()) > 45 ? '✗ Exceeds' : '✓ Pass'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Rate Bounds:</span>
                <span className="font-semibold text-green-600">✓ Within</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Tenure Bounds:</span>
                <span className="font-semibold text-green-600">✓ Within</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Borrower File:</span>
                <span className="font-semibold text-green-600">{selectedApplication.borrowerName}</span>
              </div>
            </div>
          </div>

          <button onClick={handleGenerateOffer} className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
            Generate Loan Offer
          </button>
        </div>
      </div>
    </div>
  );
}
