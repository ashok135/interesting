import React from 'react';
import { Briefcase, GraduationCap, Calendar, MapPin, CheckCircle2 } from 'lucide-react';
import { PORTFOLIO_DATA } from '../data/portfolioData';
import { Reveal } from './Reveal';

export const ExperienceTimeline: React.FC = () => {
  const { experiences, education } = PORTFOLIO_DATA;

  return (
    <section id="experience" className="py-14 sm:py-20 md:py-28 bg-[#FDFCF9] relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <Reveal direction="up">
          <div className="max-w-2xl mb-10 sm:mb-14 space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
              <Briefcase size={13} className="text-indigo-600" />
              <span>Career Milestones &amp; Pedigree</span>
            </div>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 font-display">
              A Track Record of Visual Excellence
            </h2>
            <p className="text-xs sm:text-base text-slate-600">
              From technical engineering precision to major Bollywood post-production houses and high-tempo commercial agencies.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
          {/* Left Column: Work Experience (8 cols) */}
          <div className="lg:col-span-8 space-y-6 sm:space-y-8">
            <Reveal direction="up" delay={50}>
              <div className="flex items-center gap-2 mb-2">
                <Briefcase size={18} className="text-indigo-600" />
                <h3 className="font-display font-bold text-sm text-slate-900 uppercase tracking-wider">
                  Work Experience Timeline
                </h3>
              </div>
            </Reveal>

            {/* Timeline with Mathematically Centered Track Line & Dots */}
            <div className="relative">
              {/* Continuous Timeline Track Line */}
              <div
                className="absolute left-[15px] sm:left-[19px] top-6 bottom-8 w-0.5 bg-indigo-200 rounded-full pointer-events-none"
                aria-hidden="true"
              />

              <div className="space-y-6 sm:space-y-8">
                {experiences.map((exp, idx) => (
                  <Reveal key={exp.role} direction="up" delay={idx * 100}>
                    <div className="relative flex items-start gap-3 sm:gap-5 group">
                      {/* Timeline Node Container: Fixed width guarantees 100% concentric alignment on track line */}
                      <div className="w-8 sm:w-10 shrink-0 flex items-center justify-center pt-5">
                        <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-white border-[3.5px] border-indigo-600 shadow-xs group-hover:scale-125 group-hover:border-amber-500 transition-all z-10" />
                      </div>

                      {/* Experience Card */}
                      <div className="flex-1 min-w-0">
                        <div className="bezel-outer group-hover:border-indigo-300 transition-colors shadow-xs">
                          <div className="bezel-inner p-4 sm:p-6 bg-white space-y-3 sm:space-y-4">
                            {/* Top Bar: Period & Location */}
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                              <span className="inline-flex items-center gap-1.5 font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full border border-indigo-100 text-[11px] sm:text-xs">
                                <Calendar size={12} />
                                {exp.period}
                              </span>
                              <span className="inline-flex items-center gap-1 text-slate-500 font-medium text-[11px] sm:text-xs">
                                <MapPin size={12} />
                                {exp.location}
                              </span>
                            </div>

                            {/* Role & Company */}
                            <div>
                              <h4 className="font-display font-bold text-lg sm:text-xl text-slate-900">
                                {exp.role}
                              </h4>
                              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                                <span className="font-semibold text-slate-700">{exp.company}</span>
                                <span>•</span>
                                <span className="text-slate-500">{exp.type}</span>
                              </div>
                            </div>

                            {/* Description */}
                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                              {exp.description}
                            </p>

                            {/* Key Highlights */}
                            <div className="space-y-1.5 sm:space-y-2 pt-2 border-t border-slate-100">
                              {exp.highlights.map((h, i) => (
                                <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                                  <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                                  <span className="leading-snug">{h}</span>
                                </div>
                              ))}
                            </div>

                            {/* Tools Used */}
                            <div className="flex flex-wrap gap-1 pt-1.5">
                              {exp.tools.map((t) => (
                                <span
                                  key={t}
                                  className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Education & Academic Heritage (4 cols) */}
          <div className="lg:col-span-4 space-y-6 lg:space-y-8">
            <Reveal direction="up" delay={100}>
              <div className="flex items-center gap-2 mb-2">
                <GraduationCap size={18} className="text-amber-600" />
                <h3 className="font-display font-bold text-sm text-slate-900 uppercase tracking-wider">
                  Education &amp; Credentials
                </h3>
              </div>
            </Reveal>

            {/* Standard Clean Vertical Cards */}
            <div className="space-y-4 sm:space-y-5">
              {education.map((edu, idx) => (
                <Reveal key={edu.degree} direction="up" delay={idx * 150}>
                  <div className="bezel-outer h-full">
                    <div className="bezel-inner p-4 sm:p-5 bg-white space-y-2.5 h-full flex flex-col justify-between shadow-xs">
                      <div>
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 inline-block mb-1">
                          {edu.year}
                        </span>
                        <h4 className="font-display font-bold text-base text-slate-900 leading-snug">
                          {edu.degree}
                        </h4>
                        <p className="text-xs font-semibold text-slate-700 mt-1">
                          {edu.institution} • {edu.location}
                        </p>
                      </div>
                      {edu.description && (
                        <p className="text-xs text-slate-500 leading-relaxed pt-1 border-t border-slate-100">
                          {edu.description}
                        </p>
                      )}
                    </div>
                  </div>
                </Reveal>
              ))}

              {/* Personal Dossier Box */}
              <Reveal direction="up" delay={300}>
                <div className="bezel-outer h-full">
                  <div className="bezel-inner p-4 sm:p-5 bg-white space-y-3 h-full flex flex-col justify-between shadow-xs">
                    <h4 className="font-display font-bold text-xs text-slate-900 uppercase tracking-wider">
                      Personal Dossier
                    </h4>
                    <div className="space-y-1.5 text-xs text-slate-600">
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-400">Date of Birth:</span>
                        <span className="font-semibold text-slate-800">July 18, 1992</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-400">Nationality:</span>
                        <span className="font-semibold text-slate-800">Indian</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-400">Location Base:</span>
                        <span className="font-semibold text-slate-800">Bangalore, Karnataka</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-400">Marital Status:</span>
                        <span className="font-semibold text-slate-800">Married</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-400">Languages:</span>
                        <span className="font-semibold text-slate-800">5 Indian Languages</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
