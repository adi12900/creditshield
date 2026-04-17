import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { useStore } from '../../store';
import { setRuntimeLoanApplications, type LoanApplication } from '../../data/loanApplications';
import { workflowApi } from '../../lib/workflowApi';

export function DashboardLayout() {
  const { user, selectedApplicationArn, setSelectedApplicationArn } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  useEffect(() => {
    if (!user) return;

    const role = user.role;
    const supportedRole = role === 'loan_officer' || role === 'credit_analyst' || role === 'underwriter' || role === 'compliance_officer';
    if (!supportedRole) return;

    workflowApi
      .listApplications()
      .then((rows) => {
        const mapped: LoanApplication[] = rows.map((item, index) => ({
          id: String(index + 1),
          arn: item.arn,
          borrowerName: item.borrower_name,
          email: `${item.borrower_name.toLowerCase().replace(/\s+/g, '.')}@email.com`,
          phone: '+91 90000 00000',
          loanAmount: item.loan_amount,
          loanType: 'digital_personal_loan',
          stage: item.stage as LoanApplication['stage'],
          riskGrade: item.risk_grade,
          daysInStage: 1,
          slaBreached: false,
          creditScore: item.credit_score,
          kycStatus: item.kyc_status,
          processingTime: '1.0 days',
          employmentType: item.employment_type,
          purpose: item.purpose,
          applicationDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-'),
          dob: '01-Jan-1990',
          panNumber: 'ABCDE1234F',
          tenureMonths: 36,
          interestRate: '12.5% p.a.',
          emi: '₹25,000',
        }));

        setRuntimeLoanApplications(mapped);

        if (mapped.length === 0) return;
        const exists = mapped.some((application) => application.arn === selectedApplicationArn);
        if (!exists) {
          setSelectedApplicationArn(mapped[0].arn);
        }
      })
      .catch(() => {
        // Keep fallback local data if API is unavailable.
      });
  }, [selectedApplicationArn, setSelectedApplicationArn, user]);

  if (!user) return null;

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#F5F7FA' }}>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 h-screen transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <Sidebar role={user.role} />
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute top-4 right-4 lg:hidden p-2 hover:bg-slate-100 rounded-lg"
        >
          <X className="w-5 h-5 text-slate-900" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
        {/* Mobile Menu Button */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-slate-100 rounded-lg"
          >
            <Menu className="w-6 h-6 text-slate-600" />
          </button>
          <h1 className="text-lg font-bold" style={{ color: '#00A86B' }}>LOS Platform</h1>
          <div className="w-10"></div>
        </div>

        <Navbar />
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
