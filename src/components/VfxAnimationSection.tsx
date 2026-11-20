import React, { useState } from 'react';
import { Play, Sparkles, Box, Film, Clapperboard, Award, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { PORTFOLIO_DATA } from '../data/portfolioData';
import { Reveal } from './Reveal';

interface VfxAnimationSectionProps {
  onPlayVideo: (youtubeId: string, title: string) => void;
}

export const VfxAnimationSection: React.FC<VfxAnimationSectionProps> = ({ onPlayVideo }) => {
  const [activeTab, setActiveTab] = useState<'All' | 'Reels' | 'Bollywood' | 'Animation'>('All');
  const { blockbusters, cartoonShows } = PORTFOLIO_DATA;

  const vfxReels = [
    {
      id: 'gaming-demo-reel-2025',
      title: 'Gaming 3D Demo Reel 2025 (MAYA & Engines)',
      category: 'Reels' as const,
      categoryLabel: '3D Gaming Reel',
      youtubeId: 'MnftYQO8yHA',
      year: '2025',
      description:
        'Advanced 3D game animation, character rigging, dynamic combat motion mechanics, and cinematic camera choreography rendered in Autodesk MAYA.',
      tools: ['Autodesk MAYA', 'After Effects', 'Premiere Pro', 'Rigging & Staging'],
      role: 'Lead 3D Animator & Compositor',
      stats: 'Combat Staging & Dynamic Rigs',
    },
    {
      id: '3d-character-action-reel',
      title: 'Character Animation & Body Mechanics Study',
      category: 'Reels' as const,
      categoryLabel: 'Character Animation',
      youtubeId: '1n2YnsHoKy8',
      year: '2024',
      description:
        'Deep study in weight, anticipation, follow-through, and stylized expression across animated broadcast television and action games.',
      tools: ['Autodesk MAYA', 'Character Staging', 'Camera Passes'],
      role: 'Character Animator',
      stats: 'Kinematics & Weight Physics',
    },
  ];

  return (
    <section id="vfx" className="py-20 md:py-28 bg-slate-50 border-t border-slate-200/80 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <Reveal direction="up">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold">
                <Box size={13} className="text-indigo-600" />
                <span>Section 02: CGI, VFX &amp; 3D Animation</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 font-display tracking-tight">
                Blockbuster VFX &amp; Global Television CGI.
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                From high-octane Bollywood feature visual effects to Disney Junior and Netflix 3D character animation. Crafted with mathematical precision in Autodesk MAYA and After Effects.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-1.5 p-1.5 bg-white rounded-full border border-slate-200 shadow-xs self-start md:self-auto shrink-0">
              {(['All', 'Reels', 'Bollywood', 'Animation'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    activeTab === tab
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab === 'All'
                    ? 'All VFX & 3D'
                    : tab === 'Reels'
                    ? '3D Showreels'
                    : tab === 'Bollywood'
                    ? 'Bollywood Movies'
                    : 'Disney/Netflix Shows'}
                </button>
              ))}
            </div>
          </div>
        </Reveal>

        {/* 1. Featured 3D Video Showreels Grid */}
        {(activeTab === 'All' || activeTab === 'Reels') && (
          <div className="mb-14">
            <Reveal direction="up" delay={100}>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={16} className="text-indigo-600" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 font-display">
                  Featured 3D &amp; Gaming Video Showreels
                </h3>
              </div>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              {vfxReels.map((reel, idx) => {
                const thumbUrl = `https://img.youtube.com/vi/${reel.youtubeId}/hqdefault.jpg`;

                return (
                  <Reveal key={reel.id} direction="up" delay={idx * 150}>
                    <div
                      className="bezel-outer group hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-full cursor-pointer"
                      onClick={() => onPlayVideo(reel.youtubeId, reel.title)}
                    >
                      <div className="bezel-inner overflow-hidden flex flex-col h-full bg-white">
                        <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
                          <img
                            src={thumbUrl}
                            alt={reel.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-slate-950/35 group-hover:bg-slate-950/20 transition-colors" />

                          <div className="absolute top-3 left-3">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/95 backdrop-blur-md text-indigo-900 border border-slate-200 shadow-xs">
                              {reel.categoryLabel}
                            </span>
                          </div>

                          <div className="absolute top-3 right-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-950/70 backdrop-blur-md text-slate-200">
                              {reel.year}
                            </span>
                          </div>

                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                              <Play size={18} className="translate-x-0.5 fill-current" />
                            </div>
                          </div>

                          {reel.stats && (
                            <div className="absolute bottom-2 left-3 right-3">
                              <span className="text-[11px] font-semibold text-white/95 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-md inline-block">
                                {reel.stats}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                          <div>
                            <span className="text-xs text-slate-500 font-medium block mb-1">
                              {reel.role}
                            </span>
                            <h4 className="font-display font-bold text-lg text-slate-900 group-hover:text-indigo-600 transition-colors">
                              {reel.title}
                            </h4>
                            <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                              {reel.description}
                            </p>
                          </div>

                          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                            <div className="flex flex-wrap gap-1.5">
                              {reel.tools.map((tool) => (
                                <span
                                  key={tool}
                                  className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-semibold"
                                >
                                  {tool}
                                </span>
                              ))}
                            </div>

                            <div className="text-indigo-700 text-xs font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform shrink-0">
                              <span>Watch Reel</span>
                              <ArrowUpRight size={13} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. Bollywood Theatrical VFX Productions */}
        {(activeTab === 'All' || activeTab === 'Bollywood') && (
          <div className="mb-14">
            <Reveal direction="up" delay={100}>
              <div className="flex items-center gap-2 mb-4">
                <Film size={16} className="text-amber-600" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 font-display">
                  Bollywood Theatrical Feature Film VFX Credits
                </h3>
              </div>
            </Reveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {blockbusters.map((film, i) => (
                <Reveal key={film.title} direction="up" delay={i * 80}>
                  <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs hover:border-amber-400 hover:shadow-md transition-all duration-300 group h-full flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          {film.badge}
                        </span>
                        <Award size={13} className="text-amber-500" />
                      </div>
                      <h4 className="font-display font-bold text-base text-slate-900 group-hover:text-amber-600 transition-colors">
                        {film.title}
                      </h4>
                      <p className="text-xs text-slate-600 mt-1 font-medium">{film.role}</p>
                    </div>

                    <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span>{film.studio}</span>
                      <span className="text-slate-700 font-semibold">{film.tag}</span>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        )}

        {/* 3. Global Broadcast Cartoon CGI Animation */}
        {(activeTab === 'All' || activeTab === 'Animation') && (
          <div>
            <Reveal direction="up" delay={100}>
              <div className="flex items-center gap-2 mb-4">
                <Clapperboard size={16} className="text-indigo-600" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 font-display">
                  International Children TV &amp; Netflix CGI Animation
                </h3>
              </div>
            </Reveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {cartoonShows.map((show, i) => (
                <Reveal key={show.title} direction="up" delay={i * 80}>
                  <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs hover:border-indigo-400 hover:shadow-md transition-all duration-300 group h-full flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                          {show.network}
                        </span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                      </div>
                      <h4 className="font-display font-bold text-base text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {show.title}
                      </h4>
                      <p className="text-xs text-slate-600 mt-1">{show.role}</p>
                    </div>

                    <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Broadcast CGI</span>
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 size={11} className="text-emerald-600" />
                        Telecasted
                      </span>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
