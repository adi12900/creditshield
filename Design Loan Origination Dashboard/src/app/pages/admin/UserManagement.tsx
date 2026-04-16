import { UserPlus, Shield, Search, Edit, Users, Activity, BadgeCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { workflowApi, type AdminUserRole } from '../../lib/workflowApi';

const users = [
  {
    id: 1,
    name: 'Vikram Singh',
    email: 'vikram.singh@lendco.com',
    role: 'Loan Officer',
    status: 'Active',
    lastLogin: '2026-04-10 14:32',
    loansProcessed: 47,
  },
  {
    id: 2,
    name: 'Priya Sharma',
    email: 'priya.sharma@lendco.com',
    role: 'Credit Analyst',
    status: 'Active',
    lastLogin: '2026-04-10 13:15',
    loansProcessed: 63,
  },
  {
    id: 3,
    name: 'Rajesh Kumar',
    email: 'rajesh.kumar@lendco.com',
    role: 'Underwriter',
    status: 'Active',
    lastLogin: '2026-04-10 11:45',
    loansProcessed: 89,
  },
  {
    id: 4,
    name: 'Meera Patel',
    email: 'meera.patel@lendco.com',
    role: 'Compliance Officer',
    status: 'Active',
    lastLogin: '2026-04-09 16:20',
    loansProcessed: 34,
  },
  {
    id: 5,
    name: 'Amit Desai',
    email: 'amit.desai@lendco.com',
    role: 'Operations Team',
    status: 'Inactive',
    lastLogin: '2026-04-01 09:15',
    loansProcessed: 28,
  },
  {
    id: 6,
    name: 'Neha Gupta',
    email: 'neha.gupta@lendco.com',
    role: 'Loan Officer',
    status: 'Active',
    lastLogin: '2026-04-11 09:08',
    loansProcessed: 52,
  },
  {
    id: 7,
    name: 'Arjun Reddy',
    email: 'arjun.reddy@lendco.com',
    role: 'Credit Analyst',
    status: 'Active',
    lastLogin: '2026-04-10 18:42',
    loansProcessed: 61,
  },
  {
    id: 8,
    name: 'Sanjay Mehta',
    email: 'sanjay.mehta@lendco.com',
    role: 'Underwriter',
    status: 'Active',
    lastLogin: '2026-04-11 10:20',
    loansProcessed: 74,
  },
  {
    id: 9,
    name: 'Kavita Iyer',
    email: 'kavita.iyer@lendco.com',
    role: 'Compliance Officer',
    status: 'Active',
    lastLogin: '2026-04-10 15:12',
    loansProcessed: 29,
  },
  {
    id: 10,
    name: 'Rahul Verma',
    email: 'rahul.verma@lendco.com',
    role: 'Operations Team',
    status: 'Active',
    lastLogin: '2026-04-11 08:55',
    loansProcessed: 46,
  },
  {
    id: 11,
    name: 'Pooja Desai',
    email: 'pooja.desai@lendco.com',
    role: 'System Admin',
    status: 'Active',
    lastLogin: '2026-04-11 07:40',
    loansProcessed: 81,
  },
  {
    id: 12,
    name: 'Anil Kumar',
    email: 'anil.kumar@lendco.com',
    role: 'Loan Officer',
    status: 'Active',
    lastLogin: '2026-04-10 13:05',
    loansProcessed: 38,
  },
  {
    id: 13,
    name: 'Lakshmi Nair',
    email: 'lakshmi.nair@lendco.com',
    role: 'Credit Analyst',
    status: 'Inactive',
    lastLogin: '2026-04-02 17:20',
    loansProcessed: 55,
  },
  {
    id: 14,
    name: 'Karthik Menon',
    email: 'karthik.menon@lendco.com',
    role: 'Underwriter',
    status: 'Active',
    lastLogin: '2026-04-11 11:12',
    loansProcessed: 68,
  },
  {
    id: 15,
    name: 'Sneha Joshi',
    email: 'sneha.joshi@lendco.com',
    role: 'System Admin',
    status: 'Active',
    lastLogin: '2026-04-11 10:02',
    loansProcessed: 93,
  },
];

const roleData = [
  { role: 'Loan Officer', count: users.filter((user) => user.role === 'Loan Officer').length },
  { role: 'Credit Analyst', count: users.filter((user) => user.role === 'Credit Analyst').length },
  { role: 'Underwriter', count: users.filter((user) => user.role === 'Underwriter').length },
  { role: 'Compliance', count: users.filter((user) => user.role === 'Compliance Officer').length },
  { role: 'Operations', count: users.filter((user) => user.role === 'Operations Team').length },
  { role: 'Admin', count: users.filter((user) => user.role === 'System Admin').length },
];

const chartColors = ['#00A86B', '#1A4A7A', '#0F766E', '#FD7E14', '#64748B', '#0A2540'];

type UiUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  lastLogin: string;
  loansProcessed: number;
};

const apiRoleToLabel: Record<AdminUserRole, string> = {
  loan_officer: 'Loan Officer',
  credit_analyst: 'Credit Analyst',
  underwriter: 'Underwriter',
  compliance_officer: 'Compliance Officer',
};

export function UserManagementPage() {
  const [managedUsers, setManagedUsers] = useState<UiUser[]>(users);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AdminUserRole>('loan_officer');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const activeUsers = managedUsers.filter((user) => user.status === 'Active').length;
  const inactiveUsers = managedUsers.length - activeUsers;
  const averageLoans = Math.round(managedUsers.reduce((sum, user) => sum + user.loansProcessed, 0) / managedUsers.length);

  const roleData = useMemo(
    () => [
      { role: 'Loan Officer', count: managedUsers.filter((user) => user.role === 'Loan Officer').length },
      { role: 'Credit Analyst', count: managedUsers.filter((user) => user.role === 'Credit Analyst').length },
      { role: 'Underwriter', count: managedUsers.filter((user) => user.role === 'Underwriter').length },
      { role: 'Compliance', count: managedUsers.filter((user) => user.role === 'Compliance Officer').length },
      { role: 'Operations', count: managedUsers.filter((user) => user.role === 'Operations Team').length },
      { role: 'Admin', count: managedUsers.filter((user) => user.role === 'System Admin').length },
    ],
    [managedUsers]
  );

  const handleCreateUser = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      setErrorMessage('Please fill all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await workflowApi.createUser({
        full_name: fullName,
        email: email.trim(),
        role,
        password,
        is_active: true,
      });

      setManagedUsers((prev) => [
        {
          id: created.id,
          name: created.full_name,
          email: created.email,
          role: apiRoleToLabel[created.role],
          status: created.is_active ? 'Active' : 'Inactive',
          lastLogin: 'Never',
          loansProcessed: 0,
        },
        ...prev,
      ]);

      setFirstName('');
      setLastName('');
      setEmail('');
      setRole('loan_officer');
      setPassword('');
      setSuccessMessage('User created successfully.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-600">Manage system users and role assignments</p>
        </div>
        <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          Add New User
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600 mb-1">Total Users</p>
          <p className="text-2xl font-bold text-slate-900">{users.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600 mb-1">Active Users</p>
          <p className="text-2xl font-bold text-green-600">{activeUsers}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600 mb-1">Inactive Users</p>
          <p className="text-2xl font-bold text-slate-600">{inactiveUsers}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600 mb-1">Avg. Loans/User</p>
          <p className="text-2xl font-bold text-green-600">{averageLoans}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900">Role Distribution</h3>
              <p className="text-sm text-slate-600">All {managedUsers.length} internal users are represented below</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Activity className="w-4 h-4 text-green-600" />
              Live staffing snapshot
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roleData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="role" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {roleData.map((entry, index) => (
                    <Cell key={entry.role} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <BadgeCheck className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-slate-900">Staff Coverage</h3>
          </div>
          <div className="space-y-4">
            {roleData.map((role) => (
              <div key={role.role} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span className="text-sm text-slate-700">{role.role}</span>
                <span className="text-sm font-semibold text-slate-900">{role.count}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            <Users className="inline-block w-4 h-4 mr-2" />
            {managedUsers.length} users shown in the frontend with complete role coverage.
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>
          <select className="px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600">
            <option>All Roles</option>
            <option>Loan Officer</option>
            <option>Credit Analyst</option>
            <option>Underwriter</option>
            <option>Compliance Officer</option>
            <option>Operations Team</option>
            <option>System Admin</option>
          </select>
          <select className="px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600">
            <option>All Status</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Last Login</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">
                  Loans Processed
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {managedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-slate-900">{user.name}</p>
                      <p className="text-xs text-slate-600">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        user.status === 'Active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 font-mono text-xs">{user.lastLogin}</td>
                  <td className="px-4 py-3 text-slate-900 font-semibold">{user.loansProcessed}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button className="p-1 text-green-600 hover:bg-green-50 rounded">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-slate-600 hover:bg-slate-100 rounded">
                        <Shield className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Add New User</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">First Name *</label>
                <input
                  type="text"
                  placeholder="Enter first name..."
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Last Name *</label>
                <input
                  type="text"
                  placeholder="Enter last name..."
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email Address *</label>
              <input
                type="email"
                placeholder="user@lendco.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Role *</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as AdminUserRole)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              >
                <option value="loan_officer">Loan Officer</option>
                <option value="credit_analyst">Credit Analyst</option>
                <option value="underwriter">Underwriter</option>
                <option value="compliance_officer">Compliance Officer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Password *</label>
              <input
                type="password"
                minLength={8}
                pattern="^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$"
                title="Minimum 8 characters, including at least one uppercase letter, one number, and one symbol"
                placeholder="Enter strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                required
              />
              <p className="mt-1 text-xs text-slate-500">
                Must contain at least 8 characters, 1 uppercase letter, 1 number, and 1 symbol.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Delegated Authority (₹)</label>
              <input
                type="number"
                placeholder="e.g., 2500000"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>
            <div className="flex gap-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="w-4 h-4 text-green-600" />
                <span className="text-sm text-slate-700">Send welcome email with credentials</span>
              </label>
            </div>
            {errorMessage ? (
              <p className="text-sm text-red-600">{errorMessage}</p>
            ) : null}
            {successMessage ? (
              <p className="text-sm text-green-700">{successMessage}</p>
            ) : null}
            <button
              onClick={handleCreateUser}
              disabled={isSubmitting}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-60"
            >
              {isSubmitting ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-slate-900">Role Permissions</h3>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="font-semibold text-slate-900 mb-2">Loan Officer</p>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Create and edit loan applications</li>
                <li>• Upload and verify documents</li>
                <li>• Communicate with applicants</li>
                <li>• View application status</li>
              </ul>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="font-semibold text-slate-900 mb-2">Credit Analyst</p>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• View bureau reports</li>
                <li>• Analyze financial ratios</li>
                <li>• Create credit memos</li>
                <li>• Review AI credit scores</li>
              </ul>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="font-semibold text-slate-900 mb-2">Underwriter</p>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Approve/reject applications</li>
                <li>• Override policy rules (with justification)</li>
                <li>• Structure loan offers</li>
                <li>• Final credit decision authority</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
