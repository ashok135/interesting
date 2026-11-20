import React from 'react';
import { Film, Tv, Award, Clapperboard } from 'lucide-react';
import { PORTFOLIO_DATA } from '../data/portfolioData';

export const BlockbusterRibbon: React.FC = () => {
  const { blockbusters, cartoonShows } = PORTFOLIO_DATA;

  return (
    <section id="credits" className="py-16 md:py-20 bg-slate-50 border-y border-slate-200/80 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/70 border border-amber-200 text-amber-800 text-xs font-semibold uppercase tracking-wider">
            <Award size={12} className="text-amber-600" />
            <span>Theatrical & Broadcast Credits</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 font-display">
            High-Impact Productions & Global Networks
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            Proven track record delivering VFX, 3D character animation, and post-production for India&apos;s biggest cinematic releases and international streaming platforms.
          </p>
        </div>

        {/* 1. Bollywood Blockbusters Grid */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Film size={18} className="text-amber-600" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 font-display">
              Bollywood Theatrical Feature Films
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
            {blockbusters.map((film, index) => (
              <div
                key={film.title}
                className="group relative bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:shadow-md hover:border-amber-400/80 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    {film.badge}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">0{index + 1}</span>
                </div>
                <h4 className="font-display font-bold text-base text-slate-900 group-hover:text-amber-600 transition-colors">
                  {film.title}
                </h4>
                <p className="text-xs text-slate-500 mt-1 font-medium">{film.role}</p>
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{film.studio}</span>
                  <span className="text-slate-600 font-semibold">{film.tag}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Global TV & Streaming CGI Animation */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Tv size={18} className="text-indigo-600" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 font-display">
              Global Television & Streaming Animation (CGI)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            {cartoonShows.map((show) => (
              <div
                key={show.title}
                className="group relative bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:shadow-md hover:border-indigo-400/80 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                    {show.network}
                  </span>
                  <Clapperboard size={13} className="text-slate-400" />
                </div>
                <h4 className="font-display font-bold text-base text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {show.title}
                </h4>
                <p className="text-xs text-slate-500 mt-1">{show.role}</p>
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Broadcast CGI</span>
                  <span className="text-emerald-600 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    Telecasted
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
