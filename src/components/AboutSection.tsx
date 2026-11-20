import React from 'react';
import { User, Sparkles, Compass, Target, ShieldCheck, HeartHandshake, Film } from 'lucide-react';
import { Reveal } from './Reveal';

export const AboutSection: React.FC = () => {
  const pillars = [
    {
      title: 'Narrative Storytelling',
      desc: 'Editing is not just trimming footage—it is sculpting human emotion, suspense, and curiosity in every frame transition.',
      icon: <Film size={18} className="text-amber-600" />,
    },
    {
      title: 'Precision Rhythmic Sync',
      desc: 'Trained with engineering discipline, my cuts lock into beats, micro-tempo variations, and dramatic bass drops for visceral viewer engagement.',
      icon: <Target size={18} className="text-indigo-600" />,
    },
    {
      title: 'Color Science & Tone',
      desc: 'Preserving natural skin textures while delivering Hollywood-grade film emulations, mood palettes, and HDR dynamic range balance.',
      icon: <Sparkles size={18} className="text-emerald-600" />,
    },
    {
      title: 'AI Generative Agility',
      desc: 'Seamlessly weaving Runway Gen-3, Midjourney, and synthetic voice tools into standard post-production pipelines to accelerate delivery.',
      icon: <Compass size={18} className="text-purple-600" />,
    },
  ];

  return (
    <section id="about" className="py-14 sm:py-20 md:py-28 bg-slate-50 border-t border-slate-200/80 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Artistic Statement (6 cols) */}
          <div className="lg:col-span-6 space-y-4 sm:space-y-6">
            <Reveal direction="up">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-xs">
                <User size={13} className="text-indigo-600" />
                <span>Behind the Edits</span>
              </div>
            </Reveal>

            <Reveal direction="up" delay={100}>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 font-display">
                Where Engineering Rigor Meets Cinematic Artistry.
              </h2>
            </Reveal>

            <Reveal direction="up" delay={200}>
              <div className="space-y-3.5 text-slate-600 text-xs sm:text-base leading-relaxed">
                <p>
                  My journey began with a Diploma in Electrical &amp; Electronics Engineering and drafting technical textbooks. This unique foundation gave me an obsessive eye for geometry, spatial precision, and systemic workflow optimization.
                </p>
                <p>
                  Transitioning to Arena Animations, I directed that discipline into Autodesk MAYA, After Effects, and Premiere Pro. Over the last 6+ years, I&apos;ve contributed to some of the highest-grossing Bollywood feature films (<em>Brahmāstra</em>, <em>Kalki 2898 AD</em>, <em>Fighter</em>) and global children television series on Disney Junior and Netflix.
                </p>
                <p>
                  Today, I bridge that classical studio background with modern generative AI pipelines—enabling clients to produce theatrical-quality commercials, viral social formats, and complex 3D cinematics on record turnaround times.
                </p>
              </div>
            </Reveal>

            <Reveal direction="up" delay={300}>
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs">
                  <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                  <span>100% On-Time Studio Delivery</span>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs">
                  <HeartHandshake size={16} className="text-indigo-600 shrink-0" />
                  <span>Collaborative &amp; Director-Friendly</span>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Right Column: 4 Core Pillars (Standard Responsive Grid) */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pillars.map((pillar, idx) => (
              <Reveal key={pillar.title} direction="up" delay={idx * 100}>
                <div className="bezel-outer h-full">
                  <div className="bezel-inner p-5 bg-white space-y-3 h-full flex flex-col justify-between shadow-xs">
                    <div>
                      <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center mb-3 border border-slate-100">
                        {pillar.icon}
                      </div>
                      <h3 className="font-display font-bold text-base text-slate-900">
                        {pillar.title}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {pillar.desc}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
