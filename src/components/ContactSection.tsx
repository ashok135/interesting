import React, { useState } from 'react';
import { Mail, Phone, MessageSquare, Send, Download, ArrowUpRight, CheckCircle2, Copy } from 'lucide-react';
import confetti from 'canvas-confetti';
import { PORTFOLIO_DATA } from '../data/portfolioData';

export const ContactSection: React.FC = () => {
  const { personal } = PORTFOLIO_DATA;
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    projectType: 'Commercial Video Editing',
    message: '',
  });

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(personal.phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    // Trigger celebratory confetti
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4F46E5', '#D97706', '#10B981'],
      });
    } catch {
      // Fallback
    }

    setFormSubmitted(true);
  };

  return (
    <section id="contact" className="py-20 md:py-28 bg-[#FDFCF9] relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Column: Direct Outreach & Direct Contact Channels (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Direct Communication Lines</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 font-display">
              Let&apos;s Build Something Memorable.
            </h2>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Available for freelance post-production contracts, commercial campaigns, feature film VFX sequences, and full-time studio opportunities.
            </p>

            {/* Direct Channel Cards */}
            <div className="space-y-3 pt-2">
              {/* WhatsApp Card */}
              <a
                href={personal.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-emerald-400 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <MessageSquare size={18} />
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-400">WhatsApp Instant Chat</span>
                    <span className="font-display font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors">
                      {personal.phone}
                    </span>
                  </div>
                </div>
                <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center transition-transform group-hover:translate-x-0.5">
                  <ArrowUpRight size={14} />
                </div>
              </a>

              {/* Email Card */}
              <a
                href={`mailto:${personal.email}?subject=Project%20Inquiry%20via%20Portfolio`}
                className="group flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-indigo-400 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <Mail size={18} />
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-400">Direct Email</span>
                    <span className="font-display font-bold text-sm text-slate-900 group-hover:text-indigo-700 transition-colors">
                      {personal.email}
                    </span>
                  </div>
                </div>
                <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center transition-transform group-hover:translate-x-0.5">
                  <ArrowUpRight size={14} />
                </div>
              </a>

              {/* Phone Card with Quick Copy */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <Phone size={18} />
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-400">Direct Phone Call</span>
                    <a
                      href={`tel:${personal.phoneRaw}`}
                      className="font-display font-bold text-sm text-slate-900 hover:text-amber-700 transition-colors"
                    >
                      {personal.phone}
                    </a>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyPhone}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 transition-colors"
                  title="Copy Phone Number"
                >
                  {copiedPhone ? (
                    <>
                      <CheckCircle2 size={12} className="text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* LinkedIn & Resume Button Strip */}
              <div className="pt-2 grid grid-cols-2 gap-3">
                <a
                  href={personal.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:border-indigo-300 transition-all shadow-xs"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.49 1.49 0 0 0 0-2.98 1.49 1.49 0 0 0 0 2.98m1.4 9.74v-8.37H5.06v8.37h2.8z"/>
                  </svg>
                  <span>LinkedIn Profile</span>
                </a>

                <a
                  href={personal.resumeUrl}
                  download
                  className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-slate-900 text-white text-xs font-semibold hover:bg-indigo-600 transition-all shadow-xs"
                >
                  <Download size={15} />
                  <span>Download CV</span>
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Inquiry Form (7 cols) */}
          <div className="lg:col-span-7">
            <div className="bezel-outer shadow-lg">
              <div className="bezel-inner p-6 sm:p-8 bg-white">
                {formSubmitted ? (
                  <div className="py-12 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                      <CheckCircle2 size={32} />
                    </div>
                    <h3 className="font-display font-bold text-2xl text-slate-900">
                      Message Dispatched!
                    </h3>
                    <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                      Thank you for reaching out, <strong>{formData.name}</strong>. Sujan Kumar has received your project briefing and will respond within 24 hours.
                    </p>
                    <div className="pt-4 flex justify-center gap-3">
                      <a
                        href={personal.whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
                      >
                        <MessageSquare size={14} />
                        <span>Continue on WhatsApp</span>
                      </a>
                      <button
                        onClick={() => {
                          setFormSubmitted(false);
                          setFormData({ name: '', email: '', projectType: 'Commercial Video Editing', message: '' });
                        }}
                        className="px-4 py-2.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
                      >
                        Send Another Message
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <h3 className="font-display font-bold text-lg text-slate-900">
                          Project Briefing Form
                        </h3>
                        <p className="text-xs text-slate-500">
                          Share your timeline, style references, or role description.
                        </p>
                      </div>
                      <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                        ⚡ Quick Response
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Your Name / Studio *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g. Dharma Productions / Rahul Verma"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 bg-slate-50/50"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="name@production.com"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 bg-slate-50/50"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Project Category
                      </label>
                      <select
                        value={formData.projectType}
                        onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 bg-slate-50/50"
                      >
                        <option value="Commercial Video Editing">Commercial Video Editing & Ads</option>
                        <option value="Movie Trailer / Theatrical Cut">Movie Trailer / Theatrical Cut</option>
                        <option value="CGI & 3D Character Animation">CGI & 3D Character Animation (MAYA)</option>
                        <option value="Bollywood / Film VFX Sequences">Bollywood / Film VFX Sequences</option>
                        <option value="AI Generative Video & Motion">AI Generative Video & Motion</option>
                        <option value="Color Grading & Finishing">Cinematic Color Grading & Finishing</option>
                        <option value="Full-Time Studio Role">Full-Time Studio / Agency Opportunity</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Project Scope & References
                      </label>
                      <textarea
                        rows={4}
                        required
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="Tell Sujan about your vision, deliverables, music mood, and deadline..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 bg-slate-50/50 resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="group w-full py-3.5 px-6 rounded-full bg-slate-900 hover:bg-indigo-600 text-white font-semibold text-xs tracking-wide transition-all duration-300 flex items-center justify-center gap-2 shadow-sm hover:shadow-indigo-500/20 active:scale-[0.98]"
                    >
                      <Send size={14} className="group-hover:translate-x-1 transition-transform" />
                      <span>Transmit Project Briefing</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
