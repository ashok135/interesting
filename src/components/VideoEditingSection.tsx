import React, { useState } from 'react';
import { Play, Scissors, ArrowUpRight } from 'lucide-react';
import { BeforeAfterSlider } from './BeforeAfterSlider';
import { Reveal } from './Reveal';

interface VideoEditingSectionProps {
  onPlayVideo: (youtubeId: string, title: string) => void;
}

export const VideoEditingSection: React.FC<VideoEditingSectionProps> = ({ onPlayVideo }) => {
  const [activeFilter, setActiveFilter] = useState<'All' | 'Trailers' | 'Commercials' | 'Color'>('All');

  // Filter video editing specific projects
  const editingProjects = [
    {
      id: 'movie-trailer-cut',
      title: 'Theatrical Action Movie Trailer Cut',
      category: 'Trailers' as const,
      categoryLabel: 'Theatrical Cut',
      youtubeId: 'HVY9huLHs9I',
      year: '2024',
      description:
        'Fast-paced theatrical trailer cut focused on rhythm, micro-tempo variations, sound design sync, and suspenseful cliffhangers.',
      tools: ['Premiere Pro', 'After Effects', 'Sound Design', 'Color Grading'],
      role: 'Editor & Sound Designer',
      featured: true,
      stats: 'Theatrical Pacing & Bass Drops',
    },
    {
      id: 'commercial-video-editing-reel',
      title: 'Commercial Video Editing Master Reel',
      category: 'Commercials' as const,
      categoryLabel: 'Master Showreel',
      youtubeId: 'WwTgk8z5F5Y',
      year: '2024',
      description:
        'Dynamic compilation of advertising cuts, lifestyle stories, cooking channel shows, fitness promos, and kinetic motion graphics.',
      tools: ['Premiere Pro', 'After Effects', 'Photoshop', 'Audio Finishing'],
      role: 'Senior Video Editor',
      featured: true,
      stats: 'Multi-Format Advertising',
    },
    {
      id: 'color-grading-showcase',
      title: 'Cinematic Color Grading & Film Stock Emulation',
      category: 'Color' as const,
      categoryLabel: 'Color Science',
      youtubeId: 'GfAGpq4RkXk',
      year: '2024',
      description:
        'Transforming flat camera profiles into rich Hollywood film stocks with custom teal/amber curves, skin tone protection, and film grain.',
      tools: ['Lumetri Color', 'Premiere Pro', 'After Effects', 'LUT Engineering'],
      role: 'Colorist & Finishing Artist',
      featured: true,
      stats: 'Before & After Grading Study',
    },
    {
      id: 'housing-ad-commercial',
      title: 'Luxury Real Estate Housing Commercial',
      category: 'Commercials' as const,
      categoryLabel: 'Commercial Ad',
      youtubeId: '6yaMnkZ7_GI',
      year: '2024',
      description:
        'High-end real estate advertisement with smooth architectural parallax, elegant kinetic typography, and persuasive lifestyle narrative.',
      tools: ['Premiere Pro', 'After Effects', 'Kinetic Typography'],
      role: 'Director of Post-Production',
      featured: false,
      stats: 'Lifestyle & Architecture',
    },
  ];

  const filtered =
    activeFilter === 'All'
      ? editingProjects
      : editingProjects.filter((p) => p.category === activeFilter);

  return (
    <section id="editing" className="py-20 md:py-28 bg-[#FDFCF9] relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header with Scroll Reveal */}
        <Reveal direction="up">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-semibold">
                <Scissors size={13} className="text-amber-600" />
                <span>Section 01: Video Editing &amp; Post-Production</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 font-display tracking-tight">
                Sculpting Emotion, Tempo &amp; Cinematic Flow.
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Specializing in Adobe Premiere Pro, After Effects, and rhythmic audio design. From pulse-pounding trailer cuts to conversion-focused brand commercials.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-1.5 p-1.5 bg-slate-100 rounded-full border border-slate-200/80 self-start md:self-auto shrink-0">
              {(['All', 'Trailers', 'Commercials', 'Color'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveFilter(tab)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    activeFilter === tab
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab === 'All' ? 'All Edits' : tab}
                </button>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Interactive Before & After Grading Lab */}
        <Reveal direction="up" delay={150}>
          <BeforeAfterSlider />
        </Reveal>

        {/* Video Editing Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mt-10">
          {filtered.map((project, index) => {
            const thumbUrl = `https://img.youtube.com/vi/${project.youtubeId}/hqdefault.jpg`;

            return (
              <Reveal key={project.id} direction="up" delay={index * 100}>
                <div
                  className="bezel-outer group hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-full cursor-pointer"
                  onClick={() => onPlayVideo(project.youtubeId, project.title)}
                >
                  <div className="bezel-inner overflow-hidden flex flex-col h-full bg-white">
                    {/* Thumbnail Container */}
                    <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
                      <img
                        src={thumbUrl}
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                        loading="lazy"
                      />

                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-slate-950/30 group-hover:bg-slate-950/15 transition-colors" />

                      {/* Badges */}
                      <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/90 backdrop-blur-md text-slate-900 border border-slate-200 shadow-xs">
                          {project.categoryLabel}
                        </span>
                      </div>

                      <div className="absolute top-3 right-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-950/60 backdrop-blur-md text-slate-200">
                          {project.year}
                        </span>
                      </div>

                      {/* Center Play Button Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-amber-600 group-hover:text-white transition-all duration-300">
                          <Play size={18} className="translate-x-0.5 fill-current" />
                        </div>
                      </div>

                      {/* Bottom Banner */}
                      {project.stats && (
                        <div className="absolute bottom-2 left-3 right-3">
                          <span className="text-[11px] font-semibold text-white/95 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-md inline-block">
                            {project.stats}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content Details */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-1 font-medium">
                          <span>{project.role}</span>
                        </div>
                        <h3 className="font-display font-bold text-lg text-slate-900 group-hover:text-amber-600 transition-colors">
                          {project.title}
                        </h3>
                        <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                          {project.description}
                        </p>
                      </div>

                      {/* Tools & Watch Action */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div className="flex flex-wrap gap-1.5">
                          {project.tools.map((t) => (
                            <span
                              key={t}
                              className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold"
                            >
                              {t}
                            </span>
                          ))}
                        </div>

                        <div className="text-amber-700 text-xs font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform shrink-0">
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
    </section>
  );
};
