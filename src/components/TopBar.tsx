import React from 'react';
import { ChevronLeft, Heart } from 'lucide-react';

interface TopBarProps {
  chapterNumber: number;
  chapterTitle?: string;
  isBookmarked: boolean;
  canGoBack: boolean;
  onPrev: () => void;
  onToggleBookmark: () => void;
  onOpenIndex: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  chapterNumber,
  isBookmarked,
  canGoBack,
  onPrev,
  onToggleBookmark,
  onOpenIndex,
}) => {
  return (
    <header
      id="reader-top-bar"
      className="absolute top-0 left-0 w-full px-6 pt-[max(1.25rem,calc(env(safe-area-inset-top)+0.5rem))] pb-3 flex justify-between items-center z-50 pointer-events-auto"
      style={{
        background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.45) 0%, rgba(0, 0, 0, 0.15) 60%, transparent 100%)',
      }}
    >
      {/* Left button: Back arrow */}
      <button
        id="btn-nav-prev"
        type="button"
        onClick={canGoBack ? onPrev : onOpenIndex}
        className="w-8 h-8 flex items-center justify-center bg-black/15 hover:bg-black/30 backdrop-blur-md rounded-full text-white/95 active:scale-90 transition shadow-xs"
        aria-label={canGoBack ? 'Previous Page' : 'Chapter Table of Contents'}
      >
        <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
      </button>

      {/* Center title: Chapter 1 (clickable to open index) */}
      <button
        id="btn-chapter-title"
        type="button"
        onClick={onOpenIndex}
        className="px-2.5 py-1 rounded-full text-center active:scale-95 transition hover:bg-black/15 backdrop-blur-xs"
        aria-label="Select Chapter"
      >
        <span className="text-[10px] tracking-[0.25em] font-bold text-white/90 drop-shadow-md uppercase">
          Chapter {chapterNumber}
        </span>
      </button>

      {/* Right button: Heart Bookmark */}
      <button
        id="btn-toggle-bookmark"
        type="button"
        onClick={onToggleBookmark}
        className="w-8 h-8 flex items-center justify-center bg-black/15 hover:bg-black/30 backdrop-blur-md rounded-full text-white/95 active:scale-90 transition shadow-xs"
        aria-label={isBookmarked ? 'Remove Bookmark' : 'Bookmark Page'}
      >
        <Heart
          className={`w-4 h-4 transition-transform duration-200 ${
            isBookmarked
              ? 'fill-[#D97706] text-[#D97706] scale-110'
              : 'text-white/90 stroke-[2]'
          }`}
        />
      </button>
    </header>
  );
};
