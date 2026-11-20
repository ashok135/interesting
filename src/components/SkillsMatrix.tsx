import React, { useState } from 'react';
import { Cpu, Film, Sparkles, Box, Palette, Languages, Terminal, Layers } from 'lucide-react';
import { PORTFOLIO_DATA } from '../data/portfolioData';
import { Reveal } from './Reveal';

export const SkillsMatrix: React.FC = () => {
  const { skillCategories, personal } = PORTFOLIO_DATA;
  const [selectedCategory, setSelectedCategory] = useState<number>(0);

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Film':
        return <Film size={18} className="text-amber-600" />;
      case 'Sparkles':
        return <Sparkles size={18} className="text-indigo-600" />;
      case 'Box':
        return <Box size={18} className="text-emerald-600" />;
      case 'Cpu':
        return <Cpu size={18} className="text-purple-600" />;
      case 'Palette':
        return <Palette size={18} className="text-rose-600" />;
      default:
        return <Layers size={18} className="text-slate-600" />;
    }
  };

  return (
    <section id="skills" className="py-14 sm:py-20 md:py-28 bg-white border-t border-slate-200/80 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <Reveal direction="up">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12 space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 shadow-xs">
              <Cpu size={13} className="text-indigo-600" />
              <span>Technical &amp; Creative Arsenal</span>
            </div>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 font-display">
              Mastered Tools. <br />
              Hybrid AI &amp; VFX Pipelines.
            </h2>
            <p className="text-xs sm:text-base text-slate-600">
              Fusing traditional studio discipline (Premiere, Maya, After Effects) with next-generation generative AI to deliver faster, richer visual narratives.
            </p>
          </div>
        </Reveal>

        {/* 1. Category Switcher Tabs - Flex-wrap centered, no clipping */}
        <Reveal direction="up" delay={100}>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 mb-10 max-w-4xl mx-auto">
            {skillCategories.map((cat, idx) => (
              <button
                key={cat.title}
                onClick={() => setSelectedCategory(idx)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold transition-all shadow-2xs ${
                  selectedCategory === idx
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/80'
                }`}
              >
                {getCategoryIcon(cat.iconName)}
                <span>{cat.title}</span>
              </button>
            ))}
          </div>
        </Reveal>

        {/* 2. Active Category Skills Grid */}
        <Reveal direction="up" delay={150}>
          <div className="bezel-outer mb-10 sm:mb-12 shadow-md">
            <div className="bezel-inner p-5 sm:p-8 bg-slate-50/50">
              <div className="flex items-center justify-between pb-5 sm:pb-6 mb-5 sm:mb-6 border-b border-slate-200/70">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-xs border border-slate-200 shrink-0">
                    {getCategoryIcon(skillCategories[selectedCategory].iconName)}
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base sm:text-xl text-slate-900">
                      {skillCategories[selectedCategory].title}
                    </h3>
                    <span className="text-[11px] sm:text-xs text-slate-500">
                      Production-grade proficiency &amp; real project implementation
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {skillCategories[selectedCategory].skills.map((skill) => (
                  <div
                    key={skill.name}
                    className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 transition-all duration-200 shadow-xs"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-display font-bold text-sm sm:text-base text-slate-900">
                        {skill.name}
                      </span>
                      <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                        {skill.level}% Mastery
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden mb-3">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 via-indigo-600 to-indigo-700 transition-all duration-700 ease-out"
                        style={{ width: `${skill.level}%` }}
                      />
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5">
                      {skill.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] font-medium text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>

        {/* 3. Bottom Bento Cards: Languages & Special Accreditations (Standard Responsive Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {/* Card 1: 5 Indian Languages Fluent */}
          <Reveal direction="up" delay={200}>
            <div className="bezel-outer h-full">
              <div className="bezel-inner p-5 sm:p-6 bg-slate-50 flex flex-col justify-between h-full space-y-4 shadow-xs">
                <div>
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                    <Languages size={18} />
                  </div>
                  <h4 className="font-display font-bold text-base text-slate-900">
                    Multilingual Fluency
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Seamless collaboration with pan-India production crews and directors:
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-2">
                  {personal.languages.map((lang) => (
                    <span
                      key={lang}
                      className="px-2.5 py-1 rounded-full text-xs font-bold bg-white text-emerald-800 border border-emerald-200 shadow-xs"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>

          {/* Card 2: Software Suite Taxonomy */}
          <Reveal direction="up" delay={250}>
            <div className="bezel-outer h-full">
              <div className="bezel-inner p-5 sm:p-6 bg-slate-50 flex flex-col justify-between h-full space-y-4 shadow-xs">
                <div>
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-3">
                    <Terminal size={18} />
                  </div>
                  <h4 className="font-display font-bold text-base text-slate-900">
                    Core Software Suites
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Standard industry editing and compositing suites:
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-2">
                  {['Premiere Pro', 'After Effects', 'Photoshop', 'MAYA', 'Canva', 'Runway Gen-3', 'Midjourney', 'ElevenLabs'].map((soft) => (
                    <span
                      key={soft}
                      className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white text-slate-700 border border-slate-200 shadow-xs"
                    >
                      {soft}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>

          {/* Card 3: Engineering Discipline & Textbook Publication */}
          <Reveal direction="up" delay={300}>
            <div className="bezel-outer h-full">
              <div className="bezel-inner p-5 sm:p-6 bg-slate-50 flex flex-col justify-between h-full space-y-4 shadow-xs">
                <div>
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
                    <Layers size={18} />
                  </div>
                  <h4 className="font-display font-bold text-base text-slate-900">
                    Technical CAD &amp; Author
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Co-authored &amp; published a Karnataka state textbook on Electrical &amp; Electronics (E&amp;E) for 11th standard students.
                  </p>
                </div>

                <div className="pt-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-200 shadow-xs">
                    Published State Author (2013)
                  </span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};
