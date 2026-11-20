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
    <section id="vfx" className="py-14 sm:py-20 md:py-28 bg-slate-50 border-t border-slate-200/80 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <Reveal direction="up">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-12 gap-5">
            <div className="space-y-2.5 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold">
                <Box size={13} className="text-indigo-600" />
                <span>Section 02: CGI, VFX &amp; 3D Animation</span>
              </div>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 font-display tracking-tight">
                Blockbuster VFX &amp; Global Television CGI.
              </h2>
              <p className="text-xs sm:text-base text-slate-600 leading-relaxed">
                From high-octane Bollywood feature visual effects to Disney Junior and Netflix 3D character animation. Crafted with mathematical precision in Autodesk MAYA and After Effects.
              </p>
            </div>

            {/* Filter Tabs with Horizontal Swipe on Mobile */}
            <div className="w-full md:w-auto overflow-x-auto scrollbar-none pb-1 md:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0">
              <div className="flex items-center gap-1.5 p-1.5 bg-white rounded-full border border-slate-200 shadow-xs w-max shrink-0">
                {(['All', 'Reels', 'Bollywood', 'Animation'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
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
          </div>
        </Reveal>

        {/* 1. Featured 3D Video Showreels Grid */}
        {(activeTab === 'All' || activeTab === 'Reels') && (
          <div className="mb-12 sm:mb-14">
            <Reveal direction="up" delay={50}>
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-indigo-600" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 font-display">
                    Featured 3D &amp; Gaming Video Showreels
                  </h3>
                </div>
                <span className="md:hidden text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                  Swipe ◀ ▶
                </span>
              </div>
            </Reveal>

            {/* Carousel on Mobile, Grid on Tablet/Desktop */}
            <div className="flex md:grid md:grid-cols-2 gap-4 sm:gap-8 overflow-x-auto md:overflow-x-visible snap-x snap-mandatory scrollbar-none -mx-4 px-4 md:mx-0 md:px-0 pb-4">
              {vfxReels.map((reel, idx) => {
                const thumbUrl = `https://img.youtube.com/vi/${reel.youtubeId}/hqdefault.jpg`;

                return (
                  <div
                    key={reel.id}
                    className="w-[85vw] sm:w-[380px] md:w-auto shrink-0 snap-center flex flex-col"
                  >
                    <Reveal direction="up" delay={idx * 100}>
                      <div
                        className="bezel-outer group hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-full cursor-pointer shadow-xs"
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

                            <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3">
                              <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] font-bold bg-white/95 backdrop-blur-md text-indigo-900 border border-slate-200 shadow-xs">
                                {reel.categoryLabel}
                              </span>
                            </div>

                            <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-950/70 backdrop-blur-md text-slate-200">
                                {reel.year}
                              </span>
                            </div>

                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                                <Play size={16} className="translate-x-0.5 fill-current" />
                              </div>
                            </div>

                            {reel.stats && (
                              <div className="absolute bottom-2 left-2.5 right-2.5 sm:left-3 sm:right-3">
                                <span className="text-[10px] sm:text-[11px] font-semibold text-white/95 bg-slate-950/80 backdrop-blur-md px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md inline-block">
                                  {reel.stats}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3.5">
                            <div>
                              <span className="text-[11px] text-slate-500 font-medium block mb-1">
                                {reel.role}
                              </span>
                              <h4 className="font-display font-bold text-base sm:text-lg text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 sm:line-clamp-none">
                                {reel.title}
                              </h4>
                              <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 sm:line-clamp-3 leading-relaxed">
                                {reel.description}
                              </p>
                            </div>

                            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                              <div className="flex flex-wrap gap-1">
                                {reel.tools.map((tool) => (
                                  <span
                                    key={tool}
                                    className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[9px] sm:text-[10px] font-semibold"
                                  >
                                    {tool}
                                  </span>
                                ))}
                              </div>

                              <div className="text-indigo-700 text-xs font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform shrink-0">
                                <span className="hidden sm:inline">Watch Reel</span>
                                <span className="sm:hidden">Play</span>
                                <ArrowUpRight size={13} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Reveal>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. Bollywood Theatrical VFX Productions (Swipeable Horizontal Carousel on Mobile) */}
        {(activeTab === 'All' || activeTab === 'Bollywood') && (
          <div className="mb-12 sm:mb-14">
            <Reveal direction="up" delay={50}>
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2">
                  <Film size={16} className="text-amber-600" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 font-display">
                    Bollywood Theatrical Feature Film VFX Credits
                  </h3>
                </div>
                <span className="lg:hidden text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  Swipe 5 Movies ◀ ▶
                </span>
              </div>
            </Reveal>

            {/* Mobile Horizontal Snap Carousel, Desktop 5-Col Grid */}
            <div className="flex lg:grid lg:grid-cols-5 gap-3.5 sm:gap-4 overflow-x-auto lg:overflow-x-visible snap-x snap-mandatory scrollbar-none -mx-4 px-4 lg:mx-0 lg:px-0 pb-3">
              {blockbusters.map((film, i) => (
                <div
                  key={film.title}
                  className="w-[74vw] sm:w-[260px] lg:w-auto shrink-0 snap-center flex flex-col"
                >
                  <Reveal direction="up" delay={i * 60}>
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
                        <span className="truncate mr-1">{film.studio}</span>
                        <span className="text-slate-700 font-semibold shrink-0">{film.tag}</span>
                      </div>
                    </div>
                  </Reveal>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Global Broadcast Cartoon CGI Animation (Swipeable Horizontal Carousel on Mobile) */}
        {(activeTab === 'All' || activeTab === 'Animation') && (
          <div>
            <Reveal direction="up" delay={50}>
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2">
                  <Clapperboard size={16} className="text-indigo-600" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 font-display">
                    International Children TV &amp; Netflix CGI Animation
                  </h3>
                </div>
                <span className="lg:hidden text-[10px] text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                  Swipe 4 Shows ◀ ▶
                </span>
              </div>
            </Reveal>

            {/* Mobile Horizontal Snap Carousel, Desktop 4-Col Grid */}
            <div className="flex lg:grid lg:grid-cols-4 gap-3.5 sm:gap-4 overflow-x-auto lg:overflow-x-visible snap-x snap-mandatory scrollbar-none -mx-4 px-4 lg:mx-0 lg:px-0 pb-3">
              {cartoonShows.map((show, i) => (
                <div
                  key={show.title}
                  className="w-[74vw] sm:w-[260px] lg:w-auto shrink-0 snap-center flex flex-col"
                >
                  <Reveal direction="up" delay={i * 60}>
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
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
