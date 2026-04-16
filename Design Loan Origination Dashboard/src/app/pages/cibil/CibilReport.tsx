import { Download, Printer } from 'lucide-react';
import type { CibilAccount, CibilReportData, DpdYearRow, PaymentStatus } from './cibilUsers';
import { formatCurrency, getCibilStatus } from './cibilUsers';

interface CibilReportProps {
  report: CibilReportData;
}

const DPD_MONTHS: Array<keyof Omit<DpdYearRow, 'year'>> = [
  'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
];

function statusCellClass(value: PaymentStatus): string {
  if (value === '0') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (value === 'XXX') return 'bg-rose-100 text-rose-700 border-rose-200';
  return 'bg-slate-100 text-slate-500 border-slate-200';
}

function ReportPage({ children }: { children: React.ReactNode }) {
  return (
    <section className="cibil-page mx-auto max-w-[920px] bg-white border border-slate-300 rounded-xl shadow-md p-6 md:p-8 print:max-w-none print:border print:border-slate-300 print:rounded-none print:shadow-none print:break-after-page print:mb-0 min-h-[1180px]">
      {children}
    </section>
  );
}

function ReportHeader({ report }: { report: CibilReportData }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-[40px] leading-none font-black tracking-tight text-teal-700">CIBIL</p>
        <p className="text-xs text-slate-500 mt-1">TransUnion CIBIL Credit Information Report</p>
      </div>
      <div className="text-right">
        <p className="text-2xl font-bold text-slate-900">CIBIL REPORT</p>
        <p className="text-sm text-slate-600 mt-1">Control Number: <span className="font-semibold text-slate-900">{report.controlNumber}</span></p>
        <p className="text-sm text-slate-600">Date: <span className="font-semibold text-slate-900">{report.reportDate}</span></p>
      </div>
    </div>
  );
}

function CibilScoreGauge({ score }: { score: number }) {
  const clamped = Math.max(300, Math.min(900, score));
  const progress = ((clamped - 300) / 600) * 180;

  return (
    <div className="relative w-full max-w-[430px] mx-auto pt-4">
      <div
        className="h-52 rounded-t-full"
        style={{
          background: 'conic-gradient(from 180deg, #dc2626 0deg 90deg, #f59e0b 90deg 135deg, #059669 135deg 180deg, #e2e8f0 180deg 360deg)',
          clipPath: 'inset(0 0 50% 0)',
        }}
      />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[300px] h-[150px] bg-white rounded-t-full border border-slate-300" />
      <div
        className="absolute bottom-0 left-1/2 origin-bottom h-36 w-1.5 bg-slate-700 rounded-full"
        style={{ transform: `translateX(-50%) rotate(${-90 + progress}deg)` }}
      />
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center">
        <p className="text-xs font-semibold tracking-[0.2em] text-slate-500">CIBIL SCORE</p>
        <p className="text-5xl leading-none font-black text-slate-900 mt-1">{score}</p>
        <p className="text-sm font-semibold text-slate-600 mt-1">{getCibilStatus(score)}</p>
      </div>
      <div className="absolute bottom-2 left-3 text-sm font-semibold text-slate-500">300</div>
      <div className="absolute bottom-2 right-3 text-sm font-semibold text-slate-500">900</div>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <div className="bg-teal-700 text-white px-4 py-2 text-sm font-bold tracking-wide">{title}</div>;
}

function PersonalInfoSection({ report }: { report: CibilReportData }) {
  return (
    <div className="border border-slate-300 rounded-lg overflow-hidden">
      <SectionTitle title="PERSONAL INFORMATION" />
      <div className="grid grid-cols-1 md:grid-cols-3 text-sm">
        <div className="p-4 border-b md:border-b-0 md:border-r border-slate-300">
          <p className="text-xs text-slate-500">Name</p>
          <p className="mt-1 font-semibold text-slate-900">{report.name}</p>
        </div>
        <div className="p-4 border-b md:border-b-0 md:border-r border-slate-300">
          <p className="text-xs text-slate-500">Date of Birth</p>
          <p className="mt-1 font-semibold text-slate-900">{report.dob}</p>
        </div>
        <div className="p-4">
          <p className="text-xs text-slate-500">Gender</p>
          <p className="mt-1 font-semibold text-slate-900">{report.gender}</p>
        </div>
      </div>
      <div className="border-t border-slate-300 p-4 text-sm">
        <p className="text-xs text-slate-500">PAN Number</p>
        <p className="mt-1 font-semibold text-slate-900 tracking-[0.15em]">{report.pan}</p>
      </div>
    </div>
  );
}

function ContactInfoSection({ report }: { report: CibilReportData }) {
  return (
    <div className="border border-slate-300 rounded-lg overflow-hidden">
      <SectionTitle title="CONTACT INFORMATION" />
      <div className="p-4 text-sm space-y-4">
        <div>
          <p className="text-xs text-slate-500 mb-1">Address</p>
          <div className="border border-slate-300 rounded overflow-hidden">
            {report.addresses.map((address, idx) => (
              <div key={`${address}-${idx}`} className={`px-3 py-2 ${idx > 0 ? 'border-t border-slate-300' : ''}`}>
                {address}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="border border-slate-300 rounded p-3">
            <p className="text-xs text-slate-500">Phone</p>
            <p className="font-semibold text-slate-900 mt-1">{report.phone}</p>
          </div>
          <div className="border border-slate-300 rounded p-3">
            <p className="text-xs text-slate-500">Email</p>
            <p className="font-semibold text-slate-900 mt-1">{report.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmploymentInfoSection({ report }: { report: CibilReportData }) {
  return (
    <div className="border border-slate-300 rounded-lg overflow-hidden">
      <SectionTitle title="EMPLOYMENT INFORMATION" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 text-sm">
        <div className="border border-slate-300 rounded p-3">
          <p className="text-xs text-slate-500">Employment Type</p>
          <p className="font-semibold text-slate-900 mt-1">{report.employmentType || '--'}</p>
        </div>
        <div className="border border-slate-300 rounded p-3">
          <p className="text-xs text-slate-500">Employer Name</p>
          <p className="font-semibold text-slate-900 mt-1">{report.employerName || '--'}</p>
        </div>
      </div>
    </div>
  );
}

function AccountSummarySection({ accounts }: { accounts: CibilAccount[] }) {
  return (
    <div className="border border-slate-300 rounded-lg overflow-hidden">
      <SectionTitle title="ACCOUNT SUMMARY" />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 border-b border-slate-300">
            <tr>
              <th className="text-left px-3 py-2 font-semibold text-slate-700">Member Name</th>
              <th className="text-left px-3 py-2 font-semibold text-slate-700">Account Type</th>
              <th className="text-left px-3 py-2 font-semibold text-slate-700">Account Number</th>
              <th className="text-left px-3 py-2 font-semibold text-slate-700">Ownership</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account, idx) => (
              <tr key={`${account.accountNumber}-${idx}`} className="border-b border-slate-200 last:border-b-0">
                <td className="px-3 py-2">{account.bank}</td>
                <td className="px-3 py-2">{account.accountType}</td>
                <td className="px-3 py-2 font-mono">{account.accountNumber}</td>
                <td className="px-3 py-2">{account.ownership}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AccountDetailsCard({ account, index }: { account: CibilAccount; index: number }) {
  return (
    <div className="border border-slate-300 rounded-lg overflow-hidden">
      <div className="bg-amber-300 text-slate-900 px-4 py-2 text-sm font-bold">
        ACCOUNT DETAIL #{index + 1} - {account.bank}
      </div>

      <div className="p-4 space-y-4 text-sm">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <p className="text-xs text-slate-500">Credit Limit</p>
            <p className="font-semibold text-slate-900 mt-1">{formatCurrency(account.creditLimit)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Sanctioned Amount</p>
            <p className="font-semibold text-slate-900 mt-1">{formatCurrency(account.sanctionedAmount)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Current Balance</p>
            <p className="font-semibold text-slate-900 mt-1">{formatCurrency(account.currentBalance)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Cash Limit</p>
            <p className="font-semibold text-slate-900 mt-1">{formatCurrency(account.cashLimit)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Amount Overdue</p>
            <p className="font-semibold text-slate-900 mt-1">{formatCurrency(account.amountOverdue)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <p className="text-xs text-slate-500">Rate of Interest</p>
            <p className="font-semibold text-slate-900 mt-1">{account.rateOfInterest}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Repayment Tenure</p>
            <p className="font-semibold text-slate-900 mt-1">{account.repaymentTenure}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">EMI Amount</p>
            <p className="font-semibold text-slate-900 mt-1">{formatCurrency(account.emiAmount)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Payment Frequency</p>
            <p className="font-semibold text-slate-900 mt-1">{account.paymentFrequency}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Actual Payment Amount</p>
            <p className="font-semibold text-slate-900 mt-1">{formatCurrency(account.actualPaymentAmount)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="border border-slate-300 rounded p-3">
            <p className="text-xs text-slate-500">Date Opened</p>
            <p className="font-semibold text-slate-900 mt-1">{account.dateOpened}</p>
          </div>
          <div className="border border-slate-300 rounded p-3">
            <p className="text-xs text-slate-500">Last Payment Date</p>
            <p className="font-semibold text-slate-900 mt-1">{account.lastPaymentDate}</p>
          </div>
          <div className="border border-slate-300 rounded p-3">
            <p className="text-xs text-slate-500">Date Closed</p>
            <p className="font-semibold text-slate-900 mt-1">{account.dateClosed}</p>
          </div>
          <div className="border border-slate-300 rounded p-3">
            <p className="text-xs text-slate-500">Date Reported</p>
            <p className="font-semibold text-slate-900 mt-1">{account.dateReported}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentHistoryTable({ account }: { account: CibilAccount }) {
  return (
    <div className="border border-slate-300 rounded-lg overflow-hidden">
      <SectionTitle title={`PAYMENT HISTORY (36 MONTHS) - ${account.bank}`} />
      <div className="overflow-x-auto bg-slate-50">
        <table className="w-full min-w-[980px] text-xs">
          <thead>
            <tr className="bg-slate-200 border-b border-slate-300">
              {account.paymentHistory.map((item) => (
                <th key={item.month} className="px-2 py-2 text-slate-700 font-semibold border-r border-slate-300 last:border-r-0">
                  {item.month}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {account.paymentHistory.map((item) => (
                <td key={`${item.month}-status`} className="px-1.5 py-2 border-r border-slate-300 last:border-r-0 text-center">
                  <span className={`inline-flex border rounded px-2 py-0.5 font-bold ${statusCellClass(item.status)}`}>
                    {item.status}
                  </span>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DPDTable({ account }: { account: CibilAccount }) {
  return (
    <div className="border border-slate-300 rounded-lg overflow-hidden">
      <SectionTitle title={`DAYS PAST DUE (DPD) - ${account.bank}`} />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-xs">
          <thead className="bg-slate-200 border-b border-slate-300">
            <tr>
              <th className="px-2 py-2 text-left font-semibold text-slate-700 border-r border-slate-300">Year</th>
              {DPD_MONTHS.map((month) => (
                <th key={month} className="px-2 py-2 text-center font-semibold text-slate-700 border-r border-slate-300 last:border-r-0 uppercase">
                  {month}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {account.dpd.map((row, index) => (
              <tr key={row.year} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                <td className="px-2 py-2 border-r border-slate-300 font-semibold text-slate-800">{row.year}</td>
                {DPD_MONTHS.map((month) => {
                  const value = row[month];
                  return (
                    <td key={`${row.year}-${month}`} className="px-2 py-2 border-r border-slate-300 last:border-r-0 text-center">
                      <span className={`inline-flex border rounded px-2 py-0.5 font-bold ${statusCellClass(value)}`}>
                        {value}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CollateralDefaultSection({ account }: { account: CibilAccount }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="border border-slate-300 rounded-lg overflow-hidden">
        <SectionTitle title="COLLATERAL" />
        <div className="p-4 grid grid-cols-1 gap-3 text-sm">
          <div>
            <p className="text-xs text-slate-500">Value of Collateral</p>
            <p className="font-semibold text-slate-900 mt-1">{formatCurrency(account.collateralValue)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Type</p>
            <p className="font-semibold text-slate-900 mt-1">{account.collateralType}</p>
          </div>
        </div>
      </div>

      <div className="border border-slate-300 rounded-lg overflow-hidden">
        <SectionTitle title="DEFAULT STATUS" />
        <div className="p-4 grid grid-cols-1 gap-3 text-sm">
          <div className="flex items-center justify-between border border-slate-300 rounded px-3 py-2">
            <span className="text-slate-600">Suit Filed</span>
            <span className="font-semibold text-slate-900">{account.suitFiled}</span>
          </div>
          <div className="flex items-center justify-between border border-slate-300 rounded px-3 py-2">
            <span className="text-slate-600">Written Off</span>
            <span className="font-semibold text-slate-900">{account.writtenOff}</span>
          </div>
          <div className="flex items-center justify-between border border-slate-300 rounded px-3 py-2">
            <span className="text-slate-600">Settlement</span>
            <span className="font-semibold text-slate-900">{account.settlement}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Footer({ page }: { page: number }) {
  return (
    <div className="mt-8 pt-3 border-t border-slate-300 flex items-center justify-between text-[11px] text-slate-500">
      <p>Confidential Bureau Style Credit Report - Dynamic UI</p>
      <p>Page {page}</p>
    </div>
  );
}

function printReport() {
  window.print();
}

function downloadAsPdf() {
  window.print();
}

export function CibilReport({ report }: CibilReportProps) {
  return (
    <div className="bg-slate-100 rounded-2xl p-4 md:p-6 space-y-6 print:bg-white print:p-0" id="cibil-report-root">
      <style>{`
        @media print {
          @page { size: A4; margin: 8mm; }
          .cibil-page:last-child { break-after: auto !important; }
        }
      `}</style>

      <div className="mx-auto max-w-[920px] flex justify-end gap-2 no-print print:hidden">
          <button
            onClick={printReport}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button
            onClick={downloadAsPdf}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-800"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </div>


      <ReportPage>
        <ReportHeader report={report} />

        <div className="mt-6 border border-slate-300 rounded-lg overflow-hidden">
          <SectionTitle title="CIBIL SCORE" />
          <div className="p-4 md:p-6">
            <CibilScoreGauge score={report.cibilScore} />
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <PersonalInfoSection report={report} />
          <ContactInfoSection report={report} />
          <EmploymentInfoSection report={report} />
        </div>

        <Footer page={1} />
      </ReportPage>

      <ReportPage>
        <ReportHeader report={report} />
        <div className="mt-6 space-y-4">
          <AccountSummarySection accounts={report.accounts} />
          {report.accounts.map((account, index) => (
            <AccountDetailsCard key={`${account.accountNumber}-details`} account={account} index={index} />
          ))}
        </div>
        <Footer page={2} />
      </ReportPage>

      <ReportPage>
        <ReportHeader report={report} />
        <div className="mt-6 space-y-4">
          {report.accounts.map((account) => (
            <PaymentHistoryTable key={`${account.accountNumber}-payment`} account={account} />
          ))}
        </div>
        <Footer page={3} />
      </ReportPage>

      <ReportPage>
        <ReportHeader report={report} />
        <div className="mt-6 space-y-4">
          {report.accounts.map((account) => (
            <DPDTable key={`${account.accountNumber}-dpd`} account={account} />
          ))}
        </div>
        <Footer page={4} />
      </ReportPage>

      <ReportPage>
        <ReportHeader report={report} />
        <div className="mt-6 space-y-4">
          {report.accounts.map((account, index) => (
            <div key={`${account.accountNumber}-collateral-default`} className="space-y-2">
              <div className="bg-amber-300 text-slate-900 px-4 py-2 rounded text-sm font-bold">
                ACCOUNT LEGAL AND SECURITY DETAILS #{index + 1} - {account.bank}
              </div>
              <CollateralDefaultSection account={account} />
            </div>
          ))}

          <div className="border border-slate-300 rounded-lg p-4 bg-slate-50 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">Report Notes</p>
            <p className="mt-2">
              This report is a dynamic UI rendering of bureau-style credit information for underwriting workflows. Values may include synthetic fallbacks for unavailable profile fields.
            </p>
          </div>
        </div>
        <Footer page={5} />
      </ReportPage>
    </div>
  );
}
