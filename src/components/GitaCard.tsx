import React, { useState } from 'react';
import { GitaPage } from '../types';
import { BookOpen, Sparkles, X } from 'lucide-react';

interface GitaCardProps {
  page: GitaPage;
  totalCards: number;
  cardNumber: number; // 1-based
  isActive?: boolean;
  half?: 'top' | 'bottom' | 'full';
  onOpenSanskrit?: () => void;
}

export const GitaCard: React.FC<GitaCardProps> = ({
  page,
  totalCards,
  cardNumber,
  half = 'full',
  onOpenSanskrit,
}) => {
  const [showSanskritModal, setShowSanskritModal] = useState(false);

  const handleSanskritClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpenSanskrit) {
      onOpenSanskrit();
    } else {
      setShowSanskritModal(true);
    }
  };

  // Format card numbers with leading zeroes: e.g. "04 / 32"
  const formattedIndex = String(cardNumber).padStart(2, '0');
  const formattedTotal = String(totalCards).padStart(2, '0');

  // Format chapter label: "CHAPTER 01 · PART 04"
  const chapterLabel = `CHAPTER ${String(page.chapter).padStart(2, '0')} · PART ${String(page.part).padStart(2, '0')}`;

  // =========================================================================
  // TOP HALF OF CARD (Represents top 50% of card)
  // Contains:
  // - 70% of top half (= 35% of total card): Image
  // - 30% of top half (= 15% of total card): Chapter tag & small title
  // =========================================================================
  const renderTopHalf = () => (
    <div className="relative w-full h-full flex flex-col bg-[#F5EFE4] text-[#191815] overflow-hidden select-none">
      {/* 35% of total card (70% of top half) */}
      <div className="relative w-full h-[70%] bg-[#121110] overflow-hidden">
        <img
          src={page.imageSrc}
          alt={page.imageAlt}
          className="w-full h-full object-cover object-center pointer-events-none select-none"
          draggable={false}
          loading="eager"
          referrerPolicy="no-referrer"
        />

        {/* Subtle cinematic overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-[#F5EFE4]/30 to-transparent pointer-events-none" />

        {/* Minimal Sanskrit quick badge in top-right */}
        {/* {page.sanskritVerse && (
          <button
            id={`btn-sanskrit-${page.id}-${half}`}
            type="button"
            onClick={handleSanskritClick}
            className="absolute bottom-3 right-3 z-20 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/45 backdrop-blur-md border border-amber-500/35 text-amber-200 text-[9.5px] font-sans font-medium tracking-wide shadow-md active:scale-95 transition"
            title="Read Original Sanskrit Shloka"
          >
            <Sparkles className="w-2.5 h-2.5 text-[#D97706]" />
            <span>Sanskrit Shloka</span>
          </button>
        )} */}
      </div>

      {/* 15% of total card (30% of top half): Chapter Tag & Small Refined Title */}
      <div className="relative w-full h-[30%] px-5 py-2.5 sm:px-6 sm:py-3 flex flex-col justify-center border-b border-[#191815]/5 bg-[#F5EFE4]">
        {/* Paper texture */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
          }}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-[1.5px] w-5 bg-[#D97706] flex-shrink-0" />
            <span className="text-[9.5px] sm:text-[10px] uppercase tracking-[0.2em] font-semibold text-[#746E64]">
              {chapterLabel}
            </span>
          </div>

          <h2 className="text-[15px] sm:text-[17px] md:text-[18px] leading-tight font-serif font-bold text-[#191815] tracking-normal line-clamp-2">
            {page.editorialHeadline}
          </h2>
        </div>
      </div>
    </div>
  );

  // =========================================================================
  // BOTTOM HALF OF CARD (Represents bottom 50% of card)
  // Contains:
  // - 100% of bottom half (= 50% of total card): Generous Reading Narrative & Meta
  // =========================================================================
  const renderBottomHalf = () => (
    <div className="relative w-full h-full flex flex-col justify-between px-5 pt-3 pb-3 sm:px-6 sm:pt-4 sm:pb-4 bg-[#F5EFE4] text-[#191815] overflow-hidden select-none">
      {/* Subtle Paper Texture */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Expanded Story Reading Content */}
      <div className="relative z-10 flex-1 min-h-0 overflow-y-auto overscroll-contain pr-1 flex flex-col justify-start">
        <div
          className="text-[12.5px] sm:text-[14px] leading-[1.62] text-[#24211D] font-normal font-serif tracking-normal"
          dangerouslySetInnerHTML={{
            __html: page.storyHtml
              .split('\n\n')
              .map((para) => `<p class="mb-2 sm:mb-2.5 last:mb-0">${para.replace(/\n/g, ' ')}</p>`)
              .join(''),
          }}
        />
      </div>

      {/* Footer Info */}
      <div className="flex justify-between items-center pt-2 sm:pt-2.5 border-t border-[#191815]/10 relative z-10 select-none flex-shrink-0 mt-1">
        <div className="text-[10.5px] sm:text-[11px] font-semibold text-[#746E64] uppercase tracking-wider flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-[#D97706]" />
          <span>{page.verseRef}</span>
        </div>
        <div className="text-[10px] sm:text-[11px] font-bold text-[#191815] bg-[#D97706]/15 px-2 py-0.5 rounded font-mono">
          {formattedIndex} / {formattedTotal}
        </div>
      </div>
    </div>
  );

  // If rendering ONLY top half:
  if (half === 'top') {
    return renderTopHalf();
  }

  // If rendering ONLY bottom half:
  if (half === 'bottom') {
    return renderBottomHalf();
  }

  // Otherwise full card with 50/50 split and center crease
  return (
    <div
      id={`gita-page-${page.id}`}
      className="w-full h-full flex flex-col bg-[#F5EFE4] text-[#191815] overflow-hidden select-none relative shadow-2xl rounded-[4px]"
      style={{
        boxShadow: '0 8px 30px rgba(25, 24, 21, 0.18), 0 2px 8px rgba(25, 24, 21, 0.12)',
      }}
    >
      {/* Top 50% */}
      <div className="w-full h-1/2 relative overflow-hidden">
        {renderTopHalf()}
      </div>

      {/* Subtle Middle Crease Hinge Line */}
      <div className="absolute top-1/2 inset-x-0 h-[1.5px] -translate-y-1/2 bg-[#191815]/15 z-20 pointer-events-none shadow-[0_1px_2px_rgba(0,0,0,0.08)]" />

      {/* Bottom 50% */}
      <div className="w-full h-1/2 relative overflow-hidden">
        {renderBottomHalf()}
      </div>

      {/* Sanskrit Shloka Modal Overlay */}
      {showSanskritModal && page.sanskritVerse && (
        <div
          className="absolute inset-0 z-50 bg-[#191815]/80 backdrop-blur-md flex items-center justify-center p-5 animate-in fade-in duration-200"
          onClick={() => setShowSanskritModal(false)}
        >
          <div
            className="w-full max-w-sm bg-[#F5EFE4] rounded-lg p-6 text-[#191815] shadow-2xl border border-[#D97706]/30 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowSanskritModal(false)}
              className="absolute top-4 right-4 p-1 rounded-full text-[#746E64] hover:text-[#191815] hover:bg-black/5 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-[#D97706]" />
              <p className="text-[11px] font-mono font-bold tracking-widest uppercase text-[#746E64]">
                {page.verseRef}
              </p>
            </div>

            <h3 className="font-serif text-lg font-bold mb-4 text-[#191815] leading-snug">
              Original Sanskrit Shloka
            </h3>

            <div className="p-4 bg-[#EDE4D3] rounded-md border border-[#D8CEBA] mb-4 text-center">
              <p className="font-serif text-base sm:text-lg text-[#191815] whitespace-pre-line leading-relaxed font-semibold">
                {page.sanskritVerse}
              </p>
            </div>

            {page.sanskritTransliteration && (
              <div className="mb-4">
                <p className="text-[11px] font-sans uppercase font-bold text-[#746E64] tracking-wider mb-1">
                  Transliteration
                </p>
                <p className="text-xs font-mono text-[#3F3A32] italic whitespace-pre-line leading-relaxed bg-[#FBF7F0] p-3 rounded border border-[#E8E0D1]">
                  {page.sanskritTransliteration}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowSanskritModal(false)}
              className="w-full py-2.5 rounded-md bg-[#191815] text-[#F5EFE4] font-sans text-xs font-semibold tracking-wider uppercase hover:bg-black transition active:scale-[0.99]"
            >
              Return to Reader
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
