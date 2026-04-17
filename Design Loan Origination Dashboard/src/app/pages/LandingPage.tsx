import {
  ArrowRight,
  CheckCircle2,
  Shield,
  Zap,
  TrendingUp,
  Users,
  Clock3,
  BarChart3,
  FileCheck,
  Brain,
  Lock,
  Globe,
  AlertTriangle,
  Search,
  Workflow,
  Gauge,
  Building2,
  Landmark,
  Fingerprint,
  BadgeCheck,
  Sparkles,
  CircleDollarSign,
  Activity,
  MessageSquareQuote,
  Building,
  Menu,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useState } from 'react';

export function LandingPage() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { id: 'problem', label: 'Problem' },
    { id: 'solution', label: 'Solution' },
    { id: 'how-it-works', label: 'How It Works' },
    { id: 'features', label: 'Features' },
    { id: 'security', label: 'Security' },
    { id: 'impact', label: 'Impact' },
  ];

  const problemCards = [
    {
      icon: AlertTriangle,
      title: 'Fraudulent Approval Risk',
      body: 'Rule evasion, identity mismatch, and manipulated statements silently increase portfolio stress.',
    },
    {
      icon: Search,
      title: 'Low Credit Visibility',
      body: 'Teams cannot quickly interpret transaction behavior, debt burden, and repayment intent in one view.',
    },
    {
      icon: Clock3,
      title: 'Manual Verification Delays',
      body: 'File-heavy underwriting and fragmented handoffs stretch turnaround time from hours to days.',
    },
  ];

  const solutionFlow = [
    'Unified borrower intake and consent capture',
    'AI pipeline for statement cleaning and enrichment',
    'Risk engine with policy + behavior intelligence',
    'Human-in-the-loop underwriting decision cockpit',
  ];

  const workflowSteps = [
    {
      title: 'Applicant Submits Data',
      text: 'Borrower profile, loan intent, KYC docs, and consent are captured through a guided LOS journey.',
      icon: FileCheck,
    },
    {
      title: 'Transaction Analysis Pipeline',
      text: 'Financial records are normalized and enriched into consistent monthly behavior indicators.',
      icon: Activity,
    },
    {
      title: 'AI Risk Scoring',
      text: 'Feature vectors and policy checks generate explainable risk categories and decision confidence.',
      icon: Brain,
    },
    {
      title: 'Field Officer Verification',
      text: 'On-ground checks and contextual signals are attached before final underwriting review.',
      icon: Users,
    },
    {
      title: 'Final Decision Output',
      text: 'Decision-ready case sheet with score rationale, red flags, and compliance-ready audit traces.',
      icon: BadgeCheck,
    },
  ];

  const features = [
    {
      title: 'AI Credit Scoring',
      icon: Gauge,
      text: 'Risk scoring tuned for lending workflows with transparent confidence and explanation layers.',
    },
    {
      title: 'Fraud Detection Engine',
      icon: Fingerprint,
      text: 'Flags anomalies across identities, transaction signatures, and document verification patterns.',
    },
    {
      title: 'Behavioral Transaction Intelligence',
      icon: BarChart3,
      text: 'Classifies inflow/outflow discipline, debt pressure, and lifestyle expenditure volatility.',
    },
    {
      title: 'Risk Categorization Framework',
      icon: Shield,
      text: 'Maps each applicant into clear underwriting zones: safe, monitor, conditional, and reject.',
    },
    {
      title: 'Field Verification Integration',
      icon: Workflow,
      text: 'Bridges branch operations and field officer insights directly into the core decision model.',
    },
    {
      title: 'Real-Time Decision Dashboard',
      icon: Zap,
      text: 'Live operational panels for credit teams to monitor SLA, alerts, and conversion funnel health.',
    },
  ];

  const useCases = [
    {
      title: 'Banks',
      icon: Landmark,
      text: 'Accelerate retail and MSME underwriting with compliant, auditable risk decisioning.',
    },
    {
      title: 'NBFCs',
      icon: Building2,
      text: 'Scale portfolios with tighter fraud controls and faster loan origination turnaround.',
    },
    {
      title: 'Microfinance Institutions',
      icon: Building,
      text: 'Make fair and explainable credit decisions for thin-file borrowers using alternative behavior signals.',
    },
  ];

  const testimonials = [
    {
      quote:
        'Credit Shield reduced our initial underwriting cycle by more than half while improving decision consistency.',
      name: 'Head of Risk, Regional NBFC',
    },
    {
      quote:
        'The explainable AI layer helped our credit committee trust model outputs and move faster on approvals.',
      name: 'Chief Credit Officer, Mid-size Bank',
    },
    {
      quote:
        'Strong LOS orchestration with high visibility into fraud and transaction behavior from day one.',
      name: 'Operations Lead, Lending Fintech',
    },
  ];

  const sectionBase = 'snap-start px-4 sm:px-6 lg:px-8 py-20 lg:py-24';

  return (
    <div
      className="min-h-screen bg-[#F4FBF7] text-slate-900 scroll-smooth snap-y snap-proximity"
      style={{ fontFamily: 'Inter, Poppins, ui-sans-serif, system-ui, sans-serif' }}
    >
      <header className="fixed top-0 z-50 w-full border-b border-[#1F7A6B]/10 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a href="#hero" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1F7A6B] text-white shadow-lg shadow-[#1F7A6B]/30">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1F7A6B]">IdeaBliss</p>
              <p className="text-lg font-semibold leading-none">CREDIT SHIELD</p>
            </div>
          </a>

          <nav className="hidden items-center gap-7 md:flex">
            {navItems.map((item) => (
              <a key={item.id} href={`#${item.id}`} className="text-sm font-medium text-slate-600 transition hover:text-[#1F7A6B]">
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <button
              onClick={() => navigate('/login')}
              className="rounded-xl border border-[#1F7A6B]/20 px-4 py-2 text-sm font-semibold text-[#1F7A6B] transition hover:bg-[#1F7A6B]/5"
            >
              Get Started
            </button>
            <button className="rounded-xl bg-[#1F7A6B] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#1F7A6B]/30 transition hover:-translate-y-0.5">
              Request Demo
            </button>
          </div>

          <button
            className="rounded-lg border border-[#1F7A6B]/20 p-2 md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="border-t border-[#1F7A6B]/10 bg-white px-4 py-4 md:hidden">
            <div className="flex flex-col gap-3">
              {navItems.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="rounded-lg px-2 py-2 text-sm font-medium text-slate-700 hover:bg-[#1F7A6B]/5"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <button
                onClick={() => navigate('/login')}
                className="mt-2 rounded-xl bg-[#1F7A6B] px-4 py-2 text-sm font-semibold text-white"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </header>

      <section id="hero" className={`${sectionBase} relative overflow-hidden pt-30`}>
        <div className="absolute inset-0 -z-10">
          <motion.div
            className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-[#1F7A6B]/20 blur-3xl"
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute right-10 top-24 h-72 w-72 rounded-full bg-emerald-300/30 blur-3xl"
            animate={{ y: [0, 14, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#1F7A6B]/20 bg-white/80 px-4 py-2 text-sm font-medium text-[#1F7A6B] shadow-sm">
              <Sparkles className="h-4 w-4" />
              AI Credit Intelligence For Banks and NBFCs
            </div>
            <h1 className="text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Detect Risk Earlier.
              <span className="block text-[#1F7A6B]">Approve Smarter With CREDIT SHIELD.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
              A complete LOS intelligence layer combining fraud detection, transaction analytics, explainable AI scoring,
              and decision-ready underwriting workflows in one secure platform.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => navigate('/login')}
                className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1F7A6B] px-7 py-4 font-semibold text-white shadow-xl shadow-[#1F7A6B]/30 transition hover:-translate-y-0.5"
              >
                Get Started
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </button>
              <a
                href="#final-cta"
                className="inline-flex items-center justify-center rounded-2xl border border-[#1F7A6B]/30 bg-white px-7 py-4 font-semibold text-[#1F7A6B] transition hover:bg-[#1F7A6B]/5"
              >
                Request Demo
              </a>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {['RBI-aligned controls', 'Audit-ready trails', 'AA-ready ingestion', 'Enterprise APIs'].map((badge) => (
                <div key={badge} className="rounded-xl border border-[#1F7A6B]/15 bg-white/80 px-3 py-2 text-center text-xs font-semibold text-slate-700 shadow-sm">
                  {badge}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.65 }} className="relative">
            <div className="rounded-3xl border border-white/70 bg-white/75 p-4 shadow-2xl shadow-[#1F7A6B]/20 backdrop-blur-xl sm:p-6">
              <div className="rounded-2xl border border-[#1F7A6B]/15 bg-gradient-to-br from-white to-emerald-50 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-600">Live Decision Console</p>
                  <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">Model Active</div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-[#1F7A6B]/15 bg-white p-4">
                    <p className="text-xs text-slate-500">Risk Score</p>
                    <p className="mt-2 text-4xl font-semibold text-[#1F7A6B]">82</p>
                    <div className="mt-3 h-2 rounded-full bg-slate-100">
                      <motion.div
                        className="h-2 rounded-full bg-[#1F7A6B]"
                        initial={{ width: '0%' }}
                        whileInView={{ width: '82%' }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.2 }}
                      />
                    </div>
                    <p className="mt-2 text-xs font-medium text-emerald-700">Low-to-Moderate Risk</p>
                  </div>
                  <div className="rounded-xl border border-[#1F7A6B]/15 bg-white p-4">
                    <p className="text-xs text-slate-500">Fraud Alert Signal</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">1 of 12</p>
                    <div className="mt-4 space-y-2">
                      <div className="h-2 animate-pulse rounded-full bg-emerald-100" />
                      <div className="h-2 w-5/6 animate-pulse rounded-full bg-emerald-100" />
                      <div className="h-2 w-3/5 animate-pulse rounded-full bg-emerald-100" />
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-[#1F7A6B]/15 bg-white p-4">
                  <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
                    <span>Transaction Stability (6 Months)</span>
                    <span>Confidence 91%</span>
                  </div>
                  <div className="flex items-end gap-2">
                    {[40, 52, 65, 58, 74, 82].map((h, idx) => (
                      <motion.div
                        key={idx}
                        className="w-full rounded-t-md bg-gradient-to-t from-[#1F7A6B] to-emerald-300"
                        initial={{ height: 0 }}
                        whileInView={{ height: `${h}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: idx * 0.08 }}
                        style={{ minHeight: '10px' }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="problem" className={`${sectionBase} bg-white/60`}>
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1F7A6B]">Problem</p>
            <h2 className="mt-4 text-3xl font-semibold text-slate-900 sm:text-4xl">Why lending teams lose speed, control, and trust</h2>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {problemCards.map((card, idx) => (
              <motion.article
                key={card.title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: idx * 0.07 }}
                className="rounded-2xl border border-[#1F7A6B]/10 bg-white p-6 shadow-md shadow-emerald-100/60"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#1F7A6B]/10 text-[#1F7A6B]">
                  <card.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900">{card.title}</h3>
                <p className="mt-3 leading-relaxed text-slate-600">{card.body}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section id="solution" className={`${sectionBase} bg-gradient-to-b from-[#F4FBF7] to-emerald-50/60`}>
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1F7A6B]">Solution</p>
            <h2 className="mt-4 text-3xl font-semibold text-slate-900 sm:text-4xl">CREDIT SHIELD unifies AI, policy, and workflow in one origination layer</h2>
            <p className="mt-5 text-lg leading-relaxed text-slate-600">
              Purpose-built for financial institutions that need faster approvals without compromising fraud controls,
              explainability, or regulatory readiness.
            </p>
            <div className="mt-8 space-y-4">
              {solutionFlow.map((item, idx) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: idx * 0.06 }}
                  className="flex items-center gap-3 rounded-xl border border-[#1F7A6B]/10 bg-white px-4 py-3"
                >
                  <CheckCircle2 className="h-5 w-5 text-[#1F7A6B]" />
                  <span className="font-medium text-slate-700">{item}</span>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-[#1F7A6B]/10 bg-white p-6 shadow-lg shadow-emerald-100/80">
            <p className="mb-5 text-sm font-semibold text-slate-500">Signal Fusion Map</p>
            <div className="space-y-4">
              {[
                { name: 'Bureau + KYC', pct: 78 },
                { name: 'Transaction Behavior', pct: 92 },
                { name: 'Fraud Patterns', pct: 66 },
                { name: 'Policy Compliance', pct: 88 },
              ].map((signal) => (
                <div key={signal.name}>
                  <div className="mb-1 flex justify-between text-sm text-slate-600">
                    <span>{signal.name}</span>
                    <span>{signal.pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <motion.div
                      className="h-2 rounded-full bg-gradient-to-r from-[#1F7A6B] to-emerald-300"
                      initial={{ width: '0%' }}
                      whileInView={{ width: `${signal.pct}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className={`${sectionBase} bg-white`}>
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1F7A6B]">How It Works</p>
            <h2 className="mt-4 text-3xl font-semibold text-slate-900 sm:text-4xl">End-to-end decision flow from application to sanction-ready output</h2>
          </div>

          <div className="grid gap-4 lg:grid-cols-5">
            {workflowSteps.map((step, idx) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                className="relative rounded-2xl border border-[#1F7A6B]/10 bg-[#F4FBF7] p-5"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="rounded-lg bg-white p-2 text-[#1F7A6B] shadow-sm">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold tracking-widest text-[#1F7A6B]">0{idx + 1}</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.text}</p>
                {idx < workflowSteps.length - 1 && (
                  <ArrowRight className="absolute -right-2 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-[#1F7A6B] lg:block" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className={`${sectionBase} bg-[#F4FBF7]`}>
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1F7A6B]">Core Features</p>
            <h2 className="mt-4 text-3xl font-semibold text-slate-900 sm:text-4xl">Modular capabilities built for modern lending operations</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, idx) => (
              <motion.article
                key={feature.title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: idx * 0.06 }}
                whileHover={{ y: -5 }}
                className="rounded-2xl border border-[#1F7A6B]/12 bg-white p-6 shadow-sm shadow-emerald-100/70"
              >
                <div className="mb-4 inline-flex rounded-xl bg-[#1F7A6B]/10 p-3 text-[#1F7A6B]">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-3 leading-relaxed text-slate-600">{feature.text}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className={`${sectionBase} bg-white`}>
        <div className="mx-auto max-w-7xl rounded-3xl border border-[#1F7A6B]/10 bg-gradient-to-br from-[#F4FBF7] to-white p-6 shadow-xl shadow-emerald-100/80 sm:p-10">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1F7A6B]">Live Dashboard Preview</p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-900">A decision cockpit built for risk teams</h2>
            </div>
            <div className="hidden rounded-xl border border-[#1F7A6B]/15 bg-white px-4 py-2 text-sm font-semibold text-[#1F7A6B] md:block">
              Real-Time Stream
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <div className="rounded-2xl border border-[#1F7A6B]/12 bg-white p-5">
              <p className="text-sm text-slate-500">Decision Mix</p>
              <div className="mt-4 h-38 animate-pulse rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50" />
            </div>
            <div className="rounded-2xl border border-[#1F7A6B]/12 bg-white p-5">
              <p className="text-sm text-slate-500">Risk Alerts</p>
              <div className="mt-3 space-y-3">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="h-10 animate-pulse rounded-lg bg-slate-100" />
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-[#1F7A6B]/12 bg-white p-5">
              <p className="text-sm text-slate-500">Portfolio Velocity</p>
              <div className="mt-4 flex h-38 items-end gap-2">
                {[48, 55, 71, 63, 80, 74, 88].map((height, idx) => (
                  <motion.div
                    key={idx}
                    className="w-full rounded-t-md bg-[#1F7A6B]/80"
                    initial={{ height: 0 }}
                    whileInView={{ height: `${height}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: idx * 0.05 }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="security" className={`${sectionBase} bg-[#0f2f2a] text-white`}>
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">Trust and Security</p>
            <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">Designed for regulated lending environments from day one</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                icon: Lock,
                title: 'Data Privacy Controls',
                text: 'Encryption in transit and at rest, strict role boundaries, and event-level access governance.',
              },
              {
                icon: Globe,
                title: 'Secure API Architecture',
                text: 'Service-level authentication, scoped permissions, and secure integration patterns for banking rails.',
              },
              {
                icon: BadgeCheck,
                title: 'Compliance-Ready Workflow',
                text: 'Audit trails, explainable decision logs, and policy evidence packs for internal and regulatory review.',
              },
            ].map((item) => (
              <article key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <item.icon className="h-7 w-7 text-emerald-300" />
                <h3 className="mt-4 text-xl font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-200">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={`${sectionBase} bg-white`}>
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1F7A6B]">Use Cases</p>
            <h2 className="mt-4 text-3xl font-semibold text-slate-900 sm:text-4xl">Built for each lending institution type</h2>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {useCases.map((caseItem) => (
              <article key={caseItem.title} className="rounded-2xl border border-[#1F7A6B]/12 bg-[#F4FBF7] p-6">
                <caseItem.icon className="h-6 w-6 text-[#1F7A6B]" />
                <h3 className="mt-3 text-xl font-semibold text-slate-900">{caseItem.title}</h3>
                <p className="mt-2 text-slate-600">{caseItem.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="impact" className={`${sectionBase} bg-[#F4FBF7]`}>
        <div className="mx-auto max-w-7xl rounded-3xl border border-[#1F7A6B]/12 bg-white p-8 shadow-lg shadow-emerald-100/70 sm:p-10">
          <div className="mb-8 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1F7A6B]">Impact</p>
            <h2 className="mt-4 text-3xl font-semibold text-slate-900 sm:text-4xl">Measurable outcomes across risk, speed, and portfolio quality</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Clock3, value: '68%', label: 'Faster loan decision TAT' },
              { icon: Shield, value: '42%', label: 'Fraud attempt reduction' },
              { icon: TrendingUp, value: '31%', label: 'Higher decision accuracy' },
              { icon: CircleDollarSign, value: '2.3x', label: 'Underwriter productivity gain' },
            ].map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: idx * 0.05 }}
                className="rounded-2xl border border-[#1F7A6B]/10 bg-[#F4FBF7] p-5"
              >
                <stat.icon className="h-5 w-5 text-[#1F7A6B]" />
                <p className="mt-3 text-3xl font-semibold text-slate-900">{stat.value}</p>
                <p className="mt-1 text-sm text-slate-600">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className={`${sectionBase} bg-white`}>
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1F7A6B]">Validation</p>
            <h2 className="mt-4 text-3xl font-semibold text-slate-900 sm:text-4xl">Built by innovators, validated by lending practitioners</h2>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {testimonials.map((item) => (
              <article key={item.name} className="rounded-2xl border border-[#1F7A6B]/12 bg-[#F4FBF7] p-6">
                <MessageSquareQuote className="h-6 w-6 text-[#1F7A6B]" />
                <p className="mt-4 text-slate-700">{item.quote}</p>
                <p className="mt-5 text-sm font-semibold text-slate-900">{item.name}</p>
              </article>
            ))}
          </div>
          <div className="mt-8 rounded-2xl border border-[#1F7A6B]/12 bg-white p-5 text-sm text-slate-600">
            Hackathon-ready build with investor-demo positioning. Production architecture supports LOS workflows for banks,
            NBFCs, and digital lending ecosystems.
          </div>
        </div>
      </section>

      <section id="final-cta" className={`${sectionBase} relative overflow-hidden bg-[#1F7A6B] text-white`}>
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-10 top-10 h-52 w-52 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-emerald-200/20 blur-3xl" />
        </div>
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-3xl font-semibold sm:text-5xl">Start using CREDIT SHIELD for underwriting precision today</h2>
          <p className="mx-auto mt-5 max-w-3xl text-lg text-emerald-50">
            Convert fragmented origination into a secure, AI-powered decision system trusted by credit teams and leadership.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-4 font-semibold text-[#1F7A6B] transition hover:-translate-y-0.5"
            >
              Start Using Credit Shield Today
              <ArrowRight className="h-4 w-4" />
            </button>
            <button className="rounded-2xl border border-white/60 px-7 py-4 font-semibold text-white transition hover:bg-white/10">
              Book a Demo
            </button>
          </div>
        </div>
      </section>

      <footer className="snap-start bg-[#0f2521] px-4 py-14 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1F7A6B]">
                  <Shield className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-emerald-200">IdeaBliss</p>
                  <p className="font-semibold">CREDIT SHIELD</p>
                </div>
              </div>
              <p className="mt-4 max-w-xs text-sm text-slate-300">One-stop AI lending intelligence platform. Prototype currently showcases LOS excellence.</p>
            </div>

            <div>
              <h4 className="font-semibold">Product</h4>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                <li><a href="#solution" className="transition hover:text-white">Platform Overview</a></li>
                <li><a href="#features" className="transition hover:text-white">Features</a></li>
                <li><a href="#security" className="transition hover:text-white">Security</a></li>
                <li><a href="#impact" className="transition hover:text-white">Impact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold">Contact</h4>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                <li>hello@ideabliss.ai</li>
                <li>+91 90000 00000</li>
                <li>Bengaluru, India</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold">Social</h4>
              <div className="mt-3 flex gap-3">
                {[
                  { label: 'LinkedIn', icon: Globe },
                  { label: 'GitHub', icon: Building },
                  { label: 'X', icon: Activity },
                ].map((social) => (
                  <a
                    key={social.label}
                    href="#"
                    aria-label={social.label}
                    className="rounded-lg border border-white/15 p-2 text-slate-300 transition hover:border-white/40 hover:text-white"
                  >
                    <social.icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-white/10 pt-6 text-sm text-slate-400">
            <div className="flex flex-col justify-between gap-2 sm:flex-row">
              <p>© 2026 IdeaBliss. CREDIT SHIELD. All rights reserved.</p>
              <p>Privacy | Terms | Compliance</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
