import { RiskBadge } from './RiskBadge';

interface Application {
  id: string;
  arn: string;
  borrowerName: string;
  loanAmount: number;
  riskGrade: 'A+' | 'A' | 'B' | 'C' | 'D';
  daysInStage: number;
  slaBreached: boolean;
}

interface KanbanColumnProps {
  title: string;
  count: number;
  applications: Application[];
  onCardClick: (app: Application) => void;
}

function KanbanColumn({ title, count, applications, onCardClick }: KanbanColumnProps) {
  return (
    <div className="flex-1 min-w-[280px]">
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <span className="bg-white border border-slate-200 rounded-full px-2.5 py-0.5 text-xs font-medium">
            {count}
          </span>
        </div>
        <div className="space-y-3">
          {applications.map((app) => (
            <button
              key={app.id}
              onClick={() => onCardClick(app)}
              className="w-full bg-white border border-slate-200 rounded-lg p-4 hover:border-green-600 hover:shadow-sm transition-all text-left"
            >
              {app.slaBreached && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-2 py-1 rounded mb-2 inline-block">
                  SLA Breached
                </div>
              )}
              <div className="font-medium text-slate-900 mb-1">{app.borrowerName}</div>
              <div className="text-xs text-slate-500 mb-2">ARN: {app.arn}</div>
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-900">
                  ₹{(app.loanAmount / 100000).toFixed(2)}L
                </div>
                <RiskBadge grade={app.riskGrade} size="sm" />
              </div>
              <div className="text-xs text-slate-500 mt-2">
                {app.daysInStage} days in stage
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

interface KanbanBoardProps {
  stages: {
    title: string;
    applications: Application[];
  }[];
  onCardClick: (app: Application) => void;
}

export function KanbanBoard({ stages, onCardClick }: KanbanBoardProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {stages.map((stage) => (
        <KanbanColumn
          key={stage.title}
          title={stage.title}
          count={stage.applications.length}
          applications={stage.applications}
          onCardClick={onCardClick}
        />
      ))}
    </div>
  );
}
