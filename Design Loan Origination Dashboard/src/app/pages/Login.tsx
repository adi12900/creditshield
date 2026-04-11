import { useState } from 'react';
import { LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore, UserRole } from '../store';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('loan_officer');
  const setUser = useStore((state) => state.setUser);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setUser({
      id: '1',
      name: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
      email,
      role,
    });
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div
        className="hidden lg:flex lg:w-1/2 p-12 flex-col justify-between"
        style={{ background: 'linear-gradient(135deg, #00A86B 0%, #008557 100%)' }}
      >
        <div>
          <h1 className="text-4xl font-bold text-white mb-4">LOS Platform</h1>
          <p className="text-white/90 text-lg">
            Loan Origination System for NBFCs and Banks
          </p>
        </div>
        <div className="space-y-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h3 className="text-white font-semibold mb-2">AI-Powered Credit Assessment</h3>
            <p className="text-white/90 text-sm">
              Automated risk scoring with explainable AI and fraud detection
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h3 className="text-white font-semibold mb-2">Complete Lifecycle Management</h3>
            <p className="text-white/90 text-sm">
              From lead to disbursement with compliance and audit trails
            </p>
          </div>
        </div>
        <div className="text-white/80 text-sm">
          © 2026 LOS Platform. Enterprise-grade lending infrastructure.
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <LogIn className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome Back</h2>
            <p className="text-slate-600">Sign in to access the LOS platform</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@company.com"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
              >
                <option value="loan_officer">Loan Officer</option>
                <option value="credit_analyst">Credit Analyst</option>
                <option value="underwriter">Underwriter</option>
                <option value="compliance_officer">Compliance Officer</option>
                <option value="ops_team">Operations Team</option>
                <option value="system_admin">System Admin</option>
                <option value="board_member">Board / Credit Committee</option>
                <option value="chief_compliance_officer">Chief Compliance Officer</option>
                <option value="nodal_grievance_officer">Nodal Grievance Officer</option>
                <option value="lsp_governance_officer">LSP Governance Officer</option>
                <option value="data_protection_officer">Data Protection Officer</option>
                <option value="recovery_governance_officer">Recovery Governance Officer</option>
                <option value="internal_auditor">Internal Auditor</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="w-4 h-4 text-green-600 border-slate-300 rounded focus:ring-green-600" />
                <span className="ml-2 text-sm text-slate-600">Remember me</span>
              </label>
              <a href="#" className="text-sm text-green-600 hover:text-green-700 font-medium">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2"
            >
              Sign In
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-600">
            Need help? Contact your system administrator
          </div>
        </div>
      </div>
    </div>
  );
}
