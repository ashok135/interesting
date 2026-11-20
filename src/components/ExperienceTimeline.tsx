import React from 'react';
import { Briefcase, GraduationCap, Calendar, MapPin, CheckCircle2 } from 'lucide-react';
import { PORTFOLIO_DATA } from '../data/portfolioData';
import { Reveal } from './Reveal';

export const ExperienceTimeline: React.FC = () => {
  const { experiences, education } = PORTFOLIO_DATA;

  return (
    <section id="experience" className="py-20 md:py-28 bg-[#FDFCF9] relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <Reveal direction="up">
          <div className="max-w-2xl mb-14 space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
              <Briefcase size={13} className="text-indigo-600" />
              <span>Career Milestones &amp; Pedigree</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 font-display">
              A Track Record of Visual Excellence
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              From technical engineering precision to major Bollywood post-production houses and high-tempo commercial agencies.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Column: Work Experience (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            <Reveal direction="up" delay={50}>
              <div className="flex items-center gap-2 mb-2">
                <Briefcase size={18} className="text-indigo-600" />
                <h3 className="font-display font-bold text-lg text-slate-900 uppercase tracking-wider text-xs">
                  Work Experience Timeline
                </h3>
              </div>
            </Reveal>

            <div className="relative pl-6 sm:pl-8 border-l-2 border-indigo-200 space-y-10">
              {experiences.map((exp, idx) => (
                <Reveal key={exp.role} direction="up" delay={idx * 120}>
                  <div className="relative group">
                    {/* Timeline Node Dot */}
                    <div className="absolute -left-[31px] sm:-left-[39px] top-1 w-5 h-5 rounded-full bg-white border-4 border-indigo-600 shadow-xs group-hover:scale-125 transition-transform" />

                    {/* Experience Card */}
                    <div className="bezel-outer group-hover:border-indigo-300 transition-colors">
                      <div className="bezel-inner p-6 bg-white space-y-4">
                        {/* Top Bar: Period & Location */}
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="inline-flex items-center gap-1.5 font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                            <Calendar size={12} />
                            {exp.period}
                          </span>
                          <span className="inline-flex items-center gap-1 text-slate-500 font-medium">
                            <MapPin size={12} />
                            {exp.location}
                          </span>
                        </div>

                        {/* Role & Company */}
                        <div>
                          <h4 className="font-display font-bold text-xl text-slate-900">
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
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                          {exp.highlights.map((h, i) => (
                            <div key={i} className="flex items-start gap-2.5 text-xs text-slate-600">
                              <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                              <span>{h}</span>
                            </div>
                          ))}
                        </div>

                        {/* Tools Used */}
                        <div className="flex flex-wrap gap-1.5 pt-2">
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
                </Reveal>
              ))}
            </div>
          </div>

          {/* Right Column: Education & Academic Heritage (4 cols) */}
          <div className="lg:col-span-4 space-y-8">
            <Reveal direction="up" delay={100}>
              <div className="flex items-center gap-2 mb-2">
                <GraduationCap size={18} className="text-amber-600" />
                <h3 className="font-display font-bold text-lg text-slate-900 uppercase tracking-wider text-xs">
                  Education &amp; Accreditations
                </h3>
              </div>
            </Reveal>

            <div className="space-y-6">
              {education.map((edu, idx) => (
                <Reveal key={edu.degree} direction="up" delay={idx * 150}>
                  <div className="bezel-outer">
                    <div className="bezel-inner p-5 bg-white space-y-2.5">
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                        {edu.year}
                      </span>
                      <h4 className="font-display font-bold text-base text-slate-900 leading-snug">
                        {edu.degree}
                      </h4>
                      <p className="text-xs font-semibold text-slate-700">
                        {edu.institution} • {edu.location}
                      </p>
                      {edu.description && (
                        <p className="text-xs text-slate-500 leading-relaxed pt-1">
                          {edu.description}
                        </p>
                      )}
                    </div>
                  </div>
                </Reveal>
              ))}

              {/* Personal Dossier Box */}
              <Reveal direction="up" delay={300}>
                <div className="bezel-outer">
                  <div className="bezel-inner p-5 bg-white space-y-3">
                    <h4 className="font-display font-bold text-sm text-slate-900 uppercase tracking-wider">
                      Personal Dossier
                    </h4>
                    <div className="space-y-2 text-xs text-slate-600">
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
                        <span className="text-slate-400">Parents:</span>
                        <span className="font-semibold text-slate-800">M.S. Murthy &amp; M. Ratnamala</span>
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
