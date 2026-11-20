import React from 'react';
import { Play, ArrowUpRight, Film, Clapperboard, PhoneCall } from 'lucide-react';
import { PORTFOLIO_DATA } from '../data/portfolioData';

interface HeroProps {
  onPlayReel: (youtubeId: string, title: string) => void;
  onOpenContact: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onPlayReel, onOpenContact }) => {
  const { personal } = PORTFOLIO_DATA;

  return (
    <section id="hero" className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden bg-dot-pattern">
      {/* Ambient background light gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-amber-200/40 via-indigo-100/40 to-emerald-100/30 blur-3xl -z-10 pointer-events-none rounded-full" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Left Column: Headline, Bio & CTAs (7 cols) */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Eyebrow Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200/80 shadow-xs text-xs font-semibold text-slate-700">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span>Visual Storyteller • VFX Artist • AI Creator</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 font-medium">{personal.location}</span>
            </div>

            {/* Main Fluid Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.08] font-display">
              Bringing Cinema, <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-indigo-600 to-indigo-800">
                Bollywood VFX
              </span>{' '}
              & AI Motion to Life.
            </h1>

            {/* Sub-headline / Pitch */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-normal">
              I&apos;m <strong className="text-slate-900 font-semibold">{personal.name}</strong>, a Mid-Level Video Editor & CGI Animator with credits on Bollywood theatrical blockbusters (<em>Brahmāstra</em>, <em>Kalki 2898 AD</em>, <em>Fighter</em>), Disney Junior animation, and high-impact commercial advertising.
            </p>

            {/* Hero CTAs */}
            <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4">
              {/* Play Master Reel Button */}
              <button
                onClick={() => onPlayReel('MnftYQO8yHA', 'Gaming 3D Demo Reel 2025')}
                className="group inline-flex items-center gap-3 px-6 py-3.5 rounded-full bg-slate-900 hover:bg-indigo-600 text-white font-semibold text-sm transition-all duration-300 shadow-md hover:shadow-indigo-500/25 hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center transition-transform group-hover:scale-110">
                  <Play size={14} className="fill-white translate-x-0.5" />
                </div>
                <span>Watch 2025 Showreel</span>
              </button>

              {/* Contact Button */}
              <button
                onClick={onOpenContact}
                className="group inline-flex items-center gap-2.5 px-5 py-3.5 rounded-full bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm border border-slate-300/80 transition-all duration-200 shadow-xs hover:border-slate-400 active:scale-[0.98]"
              >
                <span>Hire / Collaborate</span>
                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                  <ArrowUpRight size={13} />
                </div>
              </button>

              {/* Direct WhatsApp Pill */}
              <a
                href={personal.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-3.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs border border-emerald-200/80 transition-all"
                title="Direct WhatsApp Message"
              >
                <PhoneCall size={14} className="text-emerald-600" />
                <span>+91 8147582669</span>
              </a>
            </div>

            {/* Credibility Metric Chips */}
            <div className="pt-6 border-t border-slate-200/70 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
              <div className="bg-white/80 p-3 rounded-2xl border border-slate-200/60 shadow-xs">
                <span className="block text-2xl font-bold font-display text-slate-900">
                  {personal.yearsExperience}
                </span>
                <span className="text-xs text-slate-500 font-medium">Years in Production</span>
              </div>

              <div className="bg-white/80 p-3 rounded-2xl border border-slate-200/60 shadow-xs">
                <span className="block text-2xl font-bold font-display text-amber-600">
                  {personal.bollywoodCount}
                </span>
                <span className="text-xs text-slate-500 font-medium">Bollywood Movies</span>
              </div>

              <div className="bg-white/80 p-3 rounded-2xl border border-slate-200/60 shadow-xs">
                <span className="block text-2xl font-bold font-display text-indigo-600">
                  {personal.globalShowsCount}
                </span>
                <span className="text-xs text-slate-500 font-medium">Disney / Netflix CG</span>
              </div>

              <div className="bg-white/80 p-3 rounded-2xl border border-slate-200/60 shadow-xs">
                <span className="block text-2xl font-bold font-display text-emerald-600">
                  5
                </span>
                <span className="text-xs text-slate-500 font-medium">Languages Fluent</span>
              </div>
            </div>
          </div>

          {/* Right Column: Double-Bezel Hardware Frame with Sujan's Real Photo (5 cols) */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-sm sm:max-w-md">
              {/* Outer Decorative Glow */}
              <div className="absolute -inset-2 bg-gradient-to-tr from-amber-400/20 via-indigo-500/20 to-emerald-400/20 rounded-[2.5rem] blur-xl opacity-75 -z-10" />

              {/* Hardware Double-Bezel Card */}
              <div className="bezel-outer shadow-xl">
                <div className="bezel-inner overflow-hidden relative bg-slate-900">
                  {/* Photo Container */}
                  <div className="relative aspect-[4/5] w-full overflow-hidden">
                    <img
                      src={personal.avatarUrl}
                      alt="Sujan Kumar M.V — AI Animator & Video Editor"
                      className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-700 ease-out"
                    />

                    {/* Gradient overlay for light vignette */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

                    {/* Bottom Label Overlay */}
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-display font-bold text-lg text-white">
                          Sujan Kumar M.V
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-semibold tracking-wide uppercase">
                          Bangalore
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">
                        Premiere Pro • After Effects • MAYA • Generative AI
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Floating Badge 1 (Top Left): Bollywood VFX */}
              <div className="absolute -top-3 -left-3 sm:-left-6 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-200/80 shadow-lg flex items-center gap-2.5 animate-bounce [animation-duration:5s]">
                <div className="w-7 h-7 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                  <Film size={16} />
                </div>
                <div>
                  <span className="block text-[11px] font-bold text-slate-900 leading-tight">
                    Brahmāstra & Kalki
                  </span>
                  <span className="text-[10px] text-slate-500">Official VFX Credits</span>
                </div>
              </div>

              {/* Floating Badge 2 (Bottom Right): Global Animation */}
              <div className="absolute -bottom-3 -right-3 sm:-right-4 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-200/80 shadow-lg flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                  <Clapperboard size={16} />
                </div>
                <div>
                  <span className="block text-[11px] font-bold text-slate-900 leading-tight">
                    Disney & Netflix
                  </span>
                  <span className="text-[10px] text-slate-500">3D Character Animator</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
