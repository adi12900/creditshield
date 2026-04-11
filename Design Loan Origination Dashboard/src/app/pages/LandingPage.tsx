import { ArrowRight, CheckCircle, Shield, Zap, TrendingUp, Users, Clock, BarChart3, FileCheck, Brain, Lock, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Header/Navigation */}
      <header className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-slate-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#00A86B' }}>
                <span className="text-white font-bold text-lg">L</span>
              </div>
              <span className="text-xl font-bold text-slate-900">LOS Platform</span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-slate-600 hover:text-slate-900 transition-colors">Features</a>
              <a href="#benefits" className="text-slate-600 hover:text-slate-900 transition-colors">Benefits</a>
              <a href="#how-it-works" className="text-slate-600 hover:text-slate-900 transition-colors">How It Works</a>
              <a href="#stats" className="text-slate-600 hover:text-slate-900 transition-colors">Stats</a>
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                style={{ backgroundColor: '#00A86B' }}
              >
                Sign In
              </button>
            </nav>
            <button
              onClick={() => navigate('/login')}
              className="md:hidden px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              style={{ backgroundColor: '#00A86B' }}
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8" style={{ background: 'linear-gradient(135deg, #00A86B 0%, #008557 100%)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
                Transform Your Lending Operations
              </h1>
              <p className="text-xl text-white/90 mb-8 leading-relaxed">
                End-to-end digital loan origination system for NBFCs and Banks. Automate workflows, reduce TAT by 70%, and make data-driven credit decisions with AI-powered risk assessment.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => navigate('/login')}
                  className="px-8 py-4 bg-white text-green-700 rounded-lg hover:bg-green-50 transition-colors font-semibold text-lg flex items-center justify-center gap-2"
                >
                  Get Started
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button className="px-8 py-4 border-2 border-white text-white rounded-lg hover:bg-white/10 transition-colors font-semibold text-lg">
                  Watch Demo
                </button>
              </div>
              <div className="mt-12 flex items-center gap-8">
                <div>
                  <p className="text-3xl font-bold text-white">98.5%</p>
                  <p className="text-white/80 text-sm">Compliance Rate</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-white">70%</p>
                  <p className="text-white/80 text-sm">Faster Processing</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-white">₹500Cr+</p>
                  <p className="text-white/80 text-sm">Loans Processed</p>
                </div>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                <img
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop"
                  alt="Dashboard Preview"
                  className="rounded-lg shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Powerful Features for Modern Lending</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Everything you need to originate, assess, and disburse loans faster and more accurately
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: 'AI-Powered Credit Assessment',
                description: 'Multi-tier AI scoring with explainable decisions. Combine bureau data, behavioral patterns, and alternative data for accurate risk assessment.',
                color: '#00A86B'
              },
              {
                icon: Zap,
                title: 'Automated Workflows',
                description: 'Configurable workflow engine with role-based routing. Reduce manual handoffs and process applications 5x faster.',
                color: '#00A86B'
              },
              {
                icon: Shield,
                title: 'Built-in Compliance',
                description: 'KYC/AML screening, regulatory reporting, and complete audit trails. Stay compliant with RBI guidelines automatically.',
                color: '#00A86B'
              },
              {
                icon: FileCheck,
                title: 'Smart Document Processing',
                description: 'OCR-powered document verification with tampering detection. Auto-extract data from uploaded documents.',
                color: '#00A86B'
              },
              {
                icon: BarChart3,
                title: 'Real-time Analytics',
                description: 'Portfolio insights, conversion tracking, and SLA monitoring. Make data-driven decisions with live dashboards.',
                color: '#00A86B'
              },
              {
                icon: Lock,
                title: 'Enterprise Security',
                description: 'End-to-end encryption, role-based access control, and SOC 2 compliant infrastructure. Your data is safe.',
                color: '#00A86B'
              },
            ].map((feature, idx) => (
              <div key={idx} className="bg-white rounded-xl p-8 shadow-sm border border-slate-200 hover:shadow-lg transition-shadow">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${feature.color}15` }}
                >
                  <feature.icon className="w-6 h-6" style={{ color: feature.color }} />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-slate-900 mb-6">Why Leading Lenders Choose Us</h2>
              <p className="text-lg text-slate-600 mb-8">
                Join 50+ NBFCs and banks who have transformed their loan origination process
              </p>
              <div className="space-y-6">
                {[
                  { text: 'Reduce turnaround time from days to hours', metric: '70% faster' },
                  { text: 'Improve approval rates with better risk assessment', metric: '25% increase' },
                  { text: 'Cut operational costs with automation', metric: '₹50L+ saved/year' },
                  { text: 'Ensure 100% regulatory compliance', metric: '0 violations' },
                  { text: 'Scale without adding headcount', metric: '3x volume' },
                ].map((benefit, idx) => (
                  <div key={idx} className="flex items-start gap-4">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-1">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-slate-900 font-medium">{benefit.text}</p>
                      <p className="text-green-600 font-semibold text-sm">{benefit.metric}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-slate-50 rounded-2xl p-8">
              <img
                src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop"
                alt="Benefits Illustration"
                className="rounded-lg shadow-lg mb-6"
              />
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-green-600">10M+</p>
                  <p className="text-sm text-slate-600">Applications Processed</p>
                </div>
                <div className="bg-white rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-green-600">99.9%</p>
                  <p className="text-sm text-slate-600">Uptime SLA</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">How It Works</h2>
            <p className="text-xl text-slate-600">Simple, streamlined loan processing in 4 steps</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: '01',
                title: 'Application Intake',
                description: 'Digital application form with instant validation. Auto-fetch data from Aadhaar, PAN, and bank statements.',
              },
              {
                step: '02',
                title: 'AI Credit Assessment',
                description: 'Automated bureau pulls, financial ratio analysis, and AI risk scoring with explainable results.',
              },
              {
                step: '03',
                title: 'Smart Underwriting',
                description: 'Policy engine checks, delegated authority rules, and workflow-based approvals with override tracking.',
              },
              {
                step: '04',
                title: 'Instant Disbursement',
                description: 'e-Sign integration, pre-disbursement checks, and direct bank transfer execution.',
              },
            ].map((step, idx) => (
              <div key={idx} className="relative">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 h-full">
                  <div
                    className="text-6xl font-bold mb-4 opacity-10"
                    style={{ color: '#00A86B' }}
                  >
                    {step.step}
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-3">{step.title}</h3>
                  <p className="text-slate-600">{step.description}</p>
                </div>
                {idx < 3 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="w-8 h-8 text-green-600" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-20 px-4 sm:px-6 lg:px-8 bg-green-600" style={{ backgroundColor: '#00A86B' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">Trusted by Industry Leaders</h2>
            <p className="text-xl text-white/90">Our platform processes millions in loans every month</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Users, label: '50+ Lenders', value: 'Active Clients' },
              { icon: TrendingUp, label: '₹500Cr+', value: 'Monthly Disbursal' },
              { icon: Clock, label: '4.2 Hours', value: 'Avg. TAT' },
              { icon: Globe, label: '15 States', value: 'Pan-India Coverage' },
            ].map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
                <p className="text-3xl font-bold text-white mb-2">{stat.label}</p>
                <p className="text-white/80">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-slate-900 mb-6">Ready to Transform Your Lending?</h2>
          <p className="text-xl text-slate-600 mb-8">
            Join leading NBFCs and banks who have modernized their loan origination process
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-lg"
              style={{ backgroundColor: '#00A86B' }}
            >
              Start Free Trial
            </button>
            <button className="px-8 py-4 border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors font-semibold text-lg">
              Schedule a Demo
            </button>
          </div>
          <p className="text-sm text-slate-500 mt-6">No credit card required • 14-day free trial • Cancel anytime</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#00A86B' }}>
                  <span className="text-white font-bold">L</span>
                </div>
                <span className="text-xl font-bold">LOS Platform</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                Enterprise-grade loan origination system for modern financial institutions.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">GDPR</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Compliance</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-slate-400">© 2026 LOS Platform. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
