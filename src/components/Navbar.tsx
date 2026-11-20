import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowUpRight, Download, Phone, Mail } from 'lucide-react';
import { PORTFOLIO_DATA } from '../data/portfolioData';

interface NavbarProps {
  onOpenContact: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenContact }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);

      const sections = ['hero', 'editing', 'vfx', 'skills', 'experience', 'about', 'contact'];
      const scrollPos = window.scrollY + 200;

      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Video Editing', href: '#editing' },
    { label: 'VFX & 3D', href: '#vfx' },
    { label: 'Skills & AI', href: '#skills' },
    { label: 'Experience', href: '#experience' },
    { label: 'About', href: '#about' },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 py-3 md:py-4 px-4 sm:px-6 lg:px-8 flex justify-center ${
          isScrolled ? 'pt-2 md:pt-3' : 'pt-4 md:pt-6'
        }`}
      >
        <div className="glass-nav rounded-full px-4 sm:px-6 py-2.5 max-w-5xl w-full flex items-center justify-between shadow-sm">
          {/* Logo & Status Badge */}
          <a
            href="#hero"
            className="flex items-center gap-3 group text-slate-900 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 via-indigo-600 to-indigo-700 p-0.5 flex items-center justify-center shadow-xs">
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center font-bold text-xs text-slate-900 font-display">
                SK
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight text-slate-900 font-display">
                  Sujan Kumar
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Available
                </span>
              </div>
              <span className="text-[11px] text-slate-500 hidden sm:inline">
                AI Animator & Video Editor
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const isActive = activeSection === link.href.replace('#', '');
              return (
                <a
                  key={link.label}
                  href={link.href}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  {link.label}
                </a>
              );
            })}
          </nav>

          {/* Actions: Resume & CTA */}
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href={PORTFOLIO_DATA.personal.resumeUrl}
              download
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 transition-all hover:scale-[1.02] active:scale-[0.98]"
              title="Download Sujan's Resume PDF"
            >
              <Download size={13} className="text-slate-500" />
              <span>Resume PDF</span>
            </a>

            <button
              onClick={onOpenContact}
              className="group inline-flex items-center gap-2 pl-3.5 pr-1.5 py-1.5 rounded-full bg-slate-900 hover:bg-indigo-600 text-white text-xs font-semibold tracking-wide transition-all duration-300 shadow-sm hover:shadow-indigo-500/20 active:scale-[0.98]"
            >
              <span>Get in Touch</span>
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center transition-transform group-hover:rotate-45">
                <ArrowUpRight size={13} />
              </div>
            </button>

            {/* Mobile Menu Trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-full text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-md md:hidden flex flex-col justify-end">
          <div className="bg-white rounded-t-3xl p-6 shadow-2xl border-t border-slate-200 animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base font-display text-slate-900">
                  Sujan Kumar M.V
                </span>
                <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Open to Work
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-full bg-slate-100 text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="py-4 space-y-2">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 rounded-xl text-base font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-col gap-2.5">
              <a
                href={PORTFOLIO_DATA.personal.resumeUrl}
                download
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm transition-all"
              >
                <Download size={16} />
                Download Complete Resume (PDF)
              </a>

              <a
                href={PORTFOLIO_DATA.personal.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-all shadow-sm"
              >
                <Phone size={16} />
                WhatsApp Sujan (+91 8147582669)
              </a>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenContact();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white font-semibold text-sm transition-all"
              >
                <Mail size={16} />
                Send Inquiry Form
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
