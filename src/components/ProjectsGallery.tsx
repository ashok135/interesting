import React, { useState } from 'react';
import { Play, Sparkles } from 'lucide-react';
import { PORTFOLIO_DATA } from '../data/portfolioData';

interface ProjectsGalleryProps {
  onPlayVideo: (youtubeId: string, title: string) => void;
}

export const ProjectsGallery: React.FC<ProjectsGalleryProps> = ({ onPlayVideo }) => {
  const [activeFilter, setActiveFilter] = useState<string>('All');

  const filterTabs = [
    { label: 'All Projects', value: 'All' },
    { label: 'Featured Reels', value: 'Reels' },
    { label: 'CGI & Gaming', value: 'CGI & Gaming' },
    { label: 'Commercials & Ads', value: 'Commercials' },
  ];

  const filteredProjects =
    activeFilter === 'All'
      ? PORTFOLIO_DATA.projects
      : PORTFOLIO_DATA.projects.filter((p) => p.category === activeFilter);

  return (
    <section id="projects" className="py-20 md:py-28 bg-[#FDFCF9] relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold">
              <Sparkles size={13} className="text-indigo-600" />
              <span>Selected Portfolio Showcase</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 font-display tracking-tight">
              Crafted with Precision. <br />
              Edited for Impact.
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Explore showreels, high-energy trailers, 3D character cinematics, and commercial advertisements crafted in Adobe Premiere Pro, After Effects, and Autodesk MAYA.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 rounded-full border border-slate-200/80 self-start md:self-auto">
            {filterTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveFilter(tab.value)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                  activeFilter === tab.value
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredProjects.map((project) => {
            const thumbUrl = project.youtubeId
              ? `https://img.youtube.com/vi/${project.youtubeId}/hqdefault.jpg`
              : '/images/hero-fallback.jpg';

            return (
              <div
                key={project.id}
                className="bezel-outer group hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-full cursor-pointer"
                onClick={() => project.youtubeId && onPlayVideo(project.youtubeId, project.title)}
              >
                <div className="bezel-inner overflow-hidden flex flex-col h-full bg-white">
                  {/* Thumbnail Container */}
                  <div className="relative aspect-video w-full bg-slate-900 overflow-hidden group">
                    <img
                      src={thumbUrl}
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      loading="lazy"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-slate-950/30 group-hover:bg-slate-950/15 transition-colors" />

                    {/* Category Badge */}
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/90 backdrop-blur-md text-slate-800 border border-slate-200/60 shadow-xs">
                        {project.categoryLabel}
                      </span>
                    </div>

                    {/* Year Badge */}
                    <div className="absolute top-3 right-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-950/60 backdrop-blur-md text-slate-200">
                        {project.year}
                      </span>
                    </div>

                    {/* Center Play Button Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/95 text-slate-900 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                        <Play size={18} className="translate-x-0.5 fill-current" />
                      </div>
                    </div>

                    {/* Bottom Stats Banner */}
                    {project.stats && (
                      <div className="absolute bottom-2 left-3 right-3">
                        <span className="text-[11px] font-semibold text-white/90 bg-slate-950/70 backdrop-blur-md px-2.5 py-1 rounded-md inline-block">
                          {project.stats}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1 font-medium">
                        <span>{project.role}</span>
                      </div>
                      <h3 className="font-display font-bold text-lg text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {project.title}
                      </h3>
                      <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                        {project.description}
                      </p>
                    </div>

                    {/* Tools Used Pills & External Link */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex flex-wrap gap-1.5">
                        {project.tools.slice(0, 3).map((tool) => (
                          <span
                            key={tool}
                            className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold"
                          >
                            {tool}
                          </span>
                        ))}
                      </div>

                      <div className="text-indigo-600 text-xs font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        <span>Watch</span>
                        <Play size={10} className="fill-indigo-600" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
