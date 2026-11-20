import React from 'react';
import { ArrowUp, Mail, Phone, Download } from 'lucide-react';
import { PORTFOLIO_DATA } from '../data/portfolioData';

export const Footer: React.FC = () => {
  const { personal } = PORTFOLIO_DATA;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-slate-900 text-white pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-slate-800">
          {/* Brand & Bio (5 cols) */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 via-indigo-500 to-indigo-600 p-0.5 flex items-center justify-center">
                <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center font-bold text-sm text-white font-display">
                  SK
                </div>
              </div>
              <div>
                <span className="font-display font-bold text-lg text-white block">
                  {personal.name}
                </span>
                <span className="text-xs text-slate-400">
                  AI Animator • Video Editor • VFX Artist
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Crafting cinematic post-production, Hollywood/Bollywood visual effects, 3D character animation, and high-impact commercial advertisements from Bangalore, India.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Available for Global Remote & In-Studio Work
              </span>
            </div>
          </div>

          {/* Quick Nav (3 cols) */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="font-display font-bold text-xs uppercase tracking-widest text-slate-300">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <a href="#hero" className="hover:text-white transition-colors">
                  Top / Overview
                </a>
              </li>
              <li>
                <a href="#credits" className="hover:text-white transition-colors">
                  Theatrical & TV Credits
                </a>
              </li>
              <li>
                <a href="#projects" className="hover:text-white transition-colors">
                  Featured Showreels
                </a>
              </li>
              <li>
                <a href="#skills" className="hover:text-white transition-colors">
                  Technical Skills & AI Matrix
                </a>
              </li>
              <li>
                <a href="#experience" className="hover:text-white transition-colors">
                  Career Experience
                </a>
              </li>
              <li>
                <a href="#about" className="hover:text-white transition-colors">
                  About Sujan
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Direct & Social (4 cols) */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="font-display font-bold text-xs uppercase tracking-widest text-slate-300">
              Direct Contact
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <Phone size={13} className="text-amber-400 shrink-0" />
                <a href={`tel:${personal.phoneRaw}`} className="hover:text-white transition-colors">
                  {personal.phone}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={13} className="text-indigo-400 shrink-0" />
                <a href={`mailto:${personal.email}`} className="hover:text-white transition-colors truncate">
                  {personal.email}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 fill-blue-400 shrink-0" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.49 1.49 0 0 0 0-2.98 1.49 1.49 0 0 0 0 2.98m1.4 9.74v-8.37H5.06v8.37h2.8z"/>
                </svg>
                <a
                  href={personal.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  LinkedIn Profile
                </a>
              </li>
              <li className="pt-2">
                <a
                  href={personal.resumeUrl}
                  download
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-colors"
                >
                  <Download size={13} />
                  <span>Download Full Resume (PDF)</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Sujan Kumar M.V. All rights reserved. Portfolio design.</p>

          <button
            onClick={scrollToTop}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-full hover:bg-slate-800"
          >
            <span>Back to top</span>
            <ArrowUp size={13} />
          </button>
        </div>
      </div>
    </footer>
  );
};
