import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { VideoEditingSection } from './components/VideoEditingSection';
import { VfxAnimationSection } from './components/VfxAnimationSection';
import { SkillsMatrix } from './components/SkillsMatrix';
import { ExperienceTimeline } from './components/ExperienceTimeline';
import { AboutSection } from './components/AboutSection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { VideoModal } from './components/VideoModal';

export function App() {
  const [videoModal, setVideoModal] = useState<{
    isOpen: boolean;
    youtubeId: string | null;
    title: string | null;
  }>({
    isOpen: false,
    youtubeId: null,
    title: null,
  });

  const handlePlayVideo = (youtubeId: string, title: string) => {
    setVideoModal({
      isOpen: true,
      youtubeId,
      title,
    });
  };

  const handleCloseModal = () => {
    setVideoModal({
      isOpen: false,
      youtubeId: null,
      title: null,
    });
  };

  const handleOpenContact = () => {
    const contactEl = document.getElementById('contact');
    if (contactEl) {
      contactEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCF9] text-slate-800 flex flex-col selection:bg-amber-100 selection:text-amber-900 overflow-x-hidden">
      {/* 1. Floating Glass Navigation */}
      <Navbar onOpenContact={handleOpenContact} />

      <main className="flex-1">
        {/* 2. Hero Section */}
        <Hero
          onPlayReel={handlePlayVideo}
          onOpenContact={handleOpenContact}
        />

        {/* 3. Section 01: Video Editing & Post-Production (with Before/After Lab) */}
        <VideoEditingSection onPlayVideo={handlePlayVideo} />

        {/* 4. Section 02: CGI, VFX & 3D Animation (with Bollywood & Disney/Netflix) */}
        <VfxAnimationSection onPlayVideo={handlePlayVideo} />

        {/* 5. Technical Skills & AI Matrix */}
        <SkillsMatrix />

        {/* 6. Career Milestones & Timeline */}
        <ExperienceTimeline />

        {/* 7. Artistic Statement & Pillars */}
        <AboutSection />

        {/* 8. Direct Contact & Project Briefing */}
        <ContactSection />
      </main>

      {/* 9. Editorial Footer */}
      <Footer />

      {/* 10. Embedded YouTube Video Modal */}
      <VideoModal
        isOpen={videoModal.isOpen}
        youtubeId={videoModal.youtubeId}
        title={videoModal.title}
        onClose={handleCloseModal}
      />
    </div>
  );
}

export default App;
