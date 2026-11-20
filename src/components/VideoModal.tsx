import React, { useEffect } from 'react';
import { X, ExternalLink, Play } from 'lucide-react';

interface VideoModalProps {
  isOpen: boolean;
  youtubeId: string | null;
  title: string | null;
  onClose: () => void;
}

export const VideoModal: React.FC<VideoModalProps> = ({
  isOpen,
  youtubeId,
  title,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !youtubeId) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Play size={12} className="fill-indigo-700 translate-x-0.5" />
            </div>
            <h3 className="font-display font-bold text-sm sm:text-base text-slate-900 truncate max-w-xs sm:max-w-md">
              {title || 'Project Video Reel'}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`https://www.youtube.com/watch?v=${youtubeId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-200 transition-colors"
              title="Watch on official YouTube"
            >
              <ExternalLink size={13} />
              <span className="hidden sm:inline">Open in YouTube</span>
            </a>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
              aria-label="Close video player"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Video Player Frame */}
        <div className="relative aspect-video w-full bg-black">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`}
            title={title || 'YouTube video player'}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
          <span>Official Portfolio Project • Sujan Kumar M.V</span>
          <span className="text-slate-600 font-medium">Bangalore, India • Available for Commissions</span>
        </div>
      </div>
    </div>
  );
};
