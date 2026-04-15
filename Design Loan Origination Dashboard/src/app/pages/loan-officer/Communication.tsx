import { Send, Mail, MessageSquare, Phone, Clock, CheckCircle, ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApplicationSelector } from '../../components/ui/ApplicationSelector';
import { useStore } from '../../store';
import { workflowApi, type CommunicationTemplateItem, type WorkflowCommunicationItem } from '../../lib/workflowApi';
import { useLoanOfficerApplications } from '../../hooks/useLoanOfficerApplications';

export function CommunicationPage() {
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [templates, setTemplates] = useState<CommunicationTemplateItem[]>([]);
  const [history, setHistory] = useState<Array<{ id: string; type: 'email' | 'sms' | 'call'; subject: string; preview: string; date: string; status: string; duration?: string }>>([]);
  const user = useStore((state) => state.user);
  const {
    selectedApplication,
    applications,
    setSelectedApplicationArn,
    isLoading,
    errorMessage,
  } = useLoanOfficerApplications();

  const mapCommunicationHistory = (rows: WorkflowCommunicationItem[]) =>
    rows.map((row) => ({
      id: row.id,
      type: row.channel,
      subject: row.subject,
      preview: row.message,
      date: new Date(row.sent_at).toLocaleString(),
      status: 'Delivered',
    }));

  useEffect(() => {
    if (!selectedApplication || !user || user.role !== 'loan_officer') {
      setHistory([]);
      return;
    }

    workflowApi
      .getCommunications(selectedApplication.arn, user.role)
      .then((rows) => setHistory(mapCommunicationHistory(rows)))
      .catch(() => setHistory([]));
  }, [selectedApplication, user]);

  useEffect(() => {
    if (!selectedApplication || !user || user.role !== 'loan_officer') {
      setTemplates([]);
      return;
    }

    workflowApi
      .getCommunicationTemplates(user.role)
      .then((rows) => setTemplates(rows))
      .catch(() => setTemplates([]));
  }, [selectedApplication, user]);

  useEffect(() => {
    const template = templates.find((item) => item.id === selectedTemplate);
    if (!template || !selectedApplication) {
      return;
    }

    setSubject(template.subject.replace('{arn}', selectedApplication.arn));
    setMessage(
      template.body
        .replace('{borrower_name}', selectedApplication.borrowerName)
        .replace('{arn}', selectedApplication.arn)
        .replace('{stage}', selectedApplication.stage)
    );
  }, [selectedTemplate, templates, selectedApplication]);

  if (!selectedApplication) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        No applications available for communication.
      </div>
    );
  }

  const handleSendMessage = async () => {
    if (!user || user.role !== 'loan_officer') return;
    if (!subject.trim() || !message.trim()) {
      window.alert('Subject and message are required.');
      return;
    }

    try {
      await workflowApi.sendCommunication(selectedApplication.arn, user.role, 'email', subject, message);
      const rows = await workflowApi.getCommunications(selectedApplication.arn, user.role);
      setHistory(mapCommunicationHistory(rows));
      setMessage('');
      setSubject('');
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Failed to send message';
      window.alert(detail);
    }
  };

  const emailCount = history.filter(h => h.type === 'email').length;
  const smsCount = history.filter(h => h.type === 'sms').length;
  const callCount = history.filter(h => h.type === 'call').length;

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
          <h1 className="text-2xl font-bold text-slate-900">Communication Center</h1>
          <p className="text-slate-600">ARN: {selectedApplication.arn} • {selectedApplication.borrowerName}</p>
        </div>
        <button
          onClick={() => navigate('/dashboard/application-detail')}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Back to Application Detail
        </button>
      </div>

      <ApplicationSelector
        selectedArn={selectedApplication.arn}
        onSelect={setSelectedApplicationArn}
        subtitle="Search and filter borrowers to open the right communication timeline."
        applications={applications}
      />

      {isLoading ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Loading communication data...
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {/* Communication Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <MessageSquare className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-slate-600">Total Messages</p>
              <p className="text-xl font-bold text-slate-900">{history.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Mail className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-slate-600">Emails Sent</p>
              <p className="text-xl font-bold text-slate-900">{emailCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <MessageSquare className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-slate-600">SMS Sent</p>
              <p className="text-xl font-bold text-slate-900">{smsCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Phone className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-slate-600">Calls Made</p>
              <p className="text-xl font-bold text-slate-900">{callCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compose Message */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Compose Message</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Channel
                </label>
                <div className="flex gap-2">
                  <button className="flex-1 px-4 py-3 border-2 border-green-600 bg-green-50 text-green-700 rounded-lg font-medium flex items-center justify-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </button>
                  <button className="flex-1 px-4 py-3 border-2 border-slate-200 text-slate-700 rounded-lg hover:border-green-600 hover:bg-green-50 hover:text-green-700 font-medium flex items-center justify-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    SMS
                  </button>
                  <button className="flex-1 px-4 py-3 border-2 border-slate-200 text-slate-700 rounded-lg hover:border-green-600 hover:bg-green-50 hover:text-green-700 font-medium flex items-center justify-center gap-2">
                    <Phone className="w-4 h-4" />
                    Call Log
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Template (Optional)
                </label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                >
                  <option value="">Select a template...</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name} ({template.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Recipient
                </label>
                <input
                  type="email"
                  value={selectedApplication.email}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50"
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  placeholder="Enter subject..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Message
                </label>
                <textarea
                  rows={8}
                  placeholder="Type your message here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                ></textarea>
                <p className="text-xs text-slate-500 mt-1">
                  Variables: {'{borrower_name}'}, {'{arn}'}, {'{loan_amount}'}
                </p>
              </div>

              <button onClick={handleSendMessage} className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center justify-center gap-2">
                <Send className="w-4 h-4" />
                Send Message
              </button>
            </div>
          </div>
        </div>

        {/* Communication History */}
        <div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Communication Timeline</h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="p-3 border border-slate-200 rounded-lg hover:border-green-600 transition-colors cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      item.type === 'email' ? 'bg-green-100 text-green-600' :
                      item.type === 'sms' ? 'bg-blue-100 text-blue-600' :
                      'bg-purple-100 text-purple-600'
                    }`}>
                      {item.type === 'email' ? <Mail className="w-4 h-4" /> :
                       item.type === 'sms' ? <MessageSquare className="w-4 h-4" /> :
                       <Phone className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-slate-900">{item.subject}</p>
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                          {item.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mb-2">{item.preview}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {item.date}
                        </span>
                        {item.duration && (
                          <span className="text-purple-600 font-medium">
                            Duration: {item.duration}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mt-6">
            <h3 className="font-semibold text-slate-900 mb-4">Contact Details</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-slate-600 mb-1">Email</p>
                <p className="font-medium text-slate-900">{selectedApplication.email}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600 mb-1">Mobile</p>
                <p className="font-medium text-slate-900">{selectedApplication.phone}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600 mb-1">Preferred Channel</p>
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                  <Mail className="w-3 h-3" />
                  Email
                </span>
              </div>
              <div>
                <p className="text-xs text-slate-600 mb-1">Response Rate</p>
                <p className="font-medium text-green-600">98%</p>
              </div>
              <div>
                <p className="text-xs text-slate-600 mb-1">Avg Response Time</p>
                <p className="font-medium text-slate-900">2.5 hours</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mt-6">
            <h3 className="font-semibold text-slate-900 mb-4">Communication Breakdown</h3>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-700 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-green-600" />
                    Email
                  </span>
                  <span className="text-sm font-semibold text-slate-900">{emailCount}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${history.length > 0 ? (emailCount / history.length) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-700 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                    SMS
                  </span>
                  <span className="text-sm font-semibold text-slate-900">{smsCount}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${history.length > 0 ? (smsCount / history.length) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-700 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-purple-600" />
                    Calls
                  </span>
                  <span className="text-sm font-semibold text-slate-900">{callCount}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{ width: `${history.length > 0 ? (callCount / history.length) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
