import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GitaPage } from '../types';
import { GitaCard } from './GitaCard';
import { playPageFlipSound } from '../utils/audio';
import { ChevronUp, X, Sparkles } from 'lucide-react';

interface PhysicalFlipStageProps {
  pages: GitaPage[];
  currentIndex: number;
  onPageChange: (newIndex: number) => void;
  soundEnabled: boolean;
}

export const PhysicalFlipStage: React.FC<PhysicalFlipStageProps> = ({
  pages,
  currentIndex,
  onPageChange,
  soundEnabled,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Drag tracking state
  const [dragOffset, setDragOffset] = useState(0); // Y displacement in px
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animTarget, setAnimTarget] = useState<'next' | 'prev' | 'rest' | null>(null);

  // Modal state for full-screen original Sanskrit Shloka
  const [modalVersePage, setModalVersePage] = useState<GitaPage | null>(null);

  // Velocity tracking
  const dragStartYRef = useRef(0);
  const dragStartTimeRef = useRef(0);
  const lastYRef = useRef(0);
  const lastTimeRef = useRef(0);
  const velocityRef = useRef(0);
  const isPointerDownRef = useRef(false);

  // First time hint
  const [hasFlippedOnce, setHasFlippedOnce] = useState(() => {
    return localStorage.getItem('gita_flipped_once') === 'true';
  });

  const totalPages = pages.length;
  const currentPage = pages[currentIndex];
  const nextPage = currentIndex + 1 < totalPages ? pages[currentIndex + 1] : null;
  const prevPage = currentIndex > 0 ? pages[currentIndex - 1] : null;

  // Trigger page flip programmatically with middle-break flip animation
  const flipTo = useCallback(
    (targetIndex: number) => {
      if (isAnimating || targetIndex === currentIndex || targetIndex < 0 || targetIndex >= totalPages) {
        return;
      }

      setIsAnimating(true);
      const isNext = targetIndex > currentIndex;
      setAnimTarget(isNext ? 'next' : 'prev');

      playPageFlipSound(soundEnabled);
      if (navigator.vibrate) navigator.vibrate(14);

      if (!hasFlippedOnce) {
        setHasFlippedOnce(true);
        localStorage.setItem('gita_flipped_once', 'true');
      }

      // Animate flip then update index
      setTimeout(() => {
        onPageChange(targetIndex);
        setDragOffset(0);
        setIsAnimating(false);
        setAnimTarget(null);
      }, 350);
    },
    [isAnimating, currentIndex, totalPages, soundEnabled, hasFlippedOnce, onPageChange]
  );

  // Pointer gesture handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    if (isAnimating || modalVersePage) return;

    // Don't drag if clicking buttons or interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('input')) {
      return;
    }

    isPointerDownRef.current = true;
    dragStartYRef.current = e.clientY;
    lastYRef.current = e.clientY;
    dragStartTimeRef.current = performance.now();
    lastTimeRef.current = dragStartTimeRef.current;
    velocityRef.current = 0;

    setIsDragging(true);
    setDragOffset(0);

    if (containerRef.current) {
      try {
        containerRef.current.setPointerCapture(e.pointerId);
      } catch {
        // Fallback
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPointerDownRef.current) return;

    const currentY = e.clientY;
    const deltaY = currentY - dragStartYRef.current;
    const now = performance.now();
    const dt = now - lastTimeRef.current;

    if (dt > 10) {
      velocityRef.current = (currentY - lastYRef.current) / dt; // px/ms
      lastYRef.current = currentY;
      lastTimeRef.current = now;
    }

    // Rubber banding if trying to swipe down on first card, or up on last card
    let effectiveOffset = deltaY;
    if (currentIndex === 0 && deltaY > 0) {
      effectiveOffset = deltaY * 0.25;
    } else if (currentIndex === totalPages - 1 && deltaY < 0) {
      effectiveOffset = deltaY * 0.25;
    }

    setDragOffset(effectiveOffset);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;
    setIsDragging(false);

    try {
      if (containerRef.current?.hasPointerCapture(e.pointerId)) {
        containerRef.current.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignored
    }

    const containerHeight = containerRef.current?.clientHeight || 650;
    const threshold = containerHeight * 0.16;
    const v = velocityRef.current;

    // SWIPE UP = NEXT PAGE (Middle break, bottom half flips up)
    if (dragOffset < -threshold || v < -0.28) {
      if (currentIndex < totalPages - 1) {
        setIsAnimating(true);
        setAnimTarget('next');
        playPageFlipSound(soundEnabled);
        if (navigator.vibrate) navigator.vibrate(15);

        if (!hasFlippedOnce) {
          setHasFlippedOnce(true);
          localStorage.setItem('gita_flipped_once', 'true');
        }

        setTimeout(() => {
          onPageChange(currentIndex + 1);
          setDragOffset(0);
          setIsAnimating(false);
          setAnimTarget(null);
        }, 340);
        return;
      }
    }

    // SWIPE DOWN = PREVIOUS PAGE (Middle break, top half flips down)
    if (dragOffset > threshold || v > 0.28) {
      if (currentIndex > 0) {
        setIsAnimating(true);
        setAnimTarget('prev');
        playPageFlipSound(soundEnabled);
        if (navigator.vibrate) navigator.vibrate(15);

        setTimeout(() => {
          onPageChange(currentIndex - 1);
          setDragOffset(0);
          setIsAnimating(false);
          setAnimTarget(null);
        }, 340);
        return;
      }
    }

    // Snap back to rest
    setIsAnimating(true);
    setAnimTarget('rest');
    setTimeout(() => {
      setDragOffset(0);
      setIsAnimating(false);
      setAnimTarget(null);
    }, 240);
  };

  const handlePointerCancel = (e: React.PointerEvent) => {
    handlePointerUp(e);
  };

  // Wheel listener (debounced for physical paper flip feel on desktop)
  const wheelTimeoutRef = useRef<number | null>(null);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (wheelTimeoutRef.current || isAnimating) return;

      if (e.deltaY > 25 && currentIndex < totalPages - 1) {
        flipTo(currentIndex + 1);
        wheelTimeoutRef.current = window.setTimeout(() => {
          wheelTimeoutRef.current = null;
        }, 450);
      } else if (e.deltaY < -25 && currentIndex > 0) {
        flipTo(currentIndex - 1);
        wheelTimeoutRef.current = window.setTimeout(() => {
          wheelTimeoutRef.current = null;
        }, 450);
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, [currentIndex, totalPages, isAnimating, flipTo]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        if (currentIndex < totalPages - 1) flipTo(currentIndex + 1);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        if (currentIndex > 0) flipTo(currentIndex - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, totalPages, flipTo]);

  // Height and Progress Calculations
  const stageHeight = containerRef.current?.clientHeight || 700;
  const flipFactor = stageHeight * 0.46;

  // Active Swipe Up (Next) calculations: 0 to 1
  let flipProgress = 0;
  if (animTarget === 'next') {
    flipProgress = 1;
  } else if (animTarget === 'rest') {
    flipProgress = 0;
  } else if (dragOffset < 0) {
    flipProgress = Math.min(Math.max(-dragOffset / flipFactor, 0), 1);
  }

  // Active Swipe Down (Prev) calculations: 0 to 1
  let downProgress = 0;
  if (animTarget === 'prev') {
    downProgress = 1;
  } else if (animTarget === 'rest') {
    downProgress = 0;
  } else if (dragOffset > 0 && currentIndex > 0) {
    downProgress = Math.min(Math.max(dragOffset / flipFactor, 0), 1);
  }

  // Angle in degrees (0 to 180)
  const nextAngle = flipProgress * 180;
  const prevAngle = downProgress * 180;

  const isFlippingNext = (dragOffset < 0 || animTarget === 'next') && nextPage !== null;
  const isFlippingPrev = (dragOffset > 0 || animTarget === 'prev') && prevPage !== null;

  return (
    <div
      ref={containerRef}
      id="flip-stage-container"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      className="relative w-full h-full select-none touch-none perspective-stage cursor-grab active:cursor-grabbing overflow-hidden"
      style={{
        perspective: '1400px',
        perspectiveOrigin: '50% 50%',
        WebkitPerspective: '1400px',
        WebkitPerspectiveOrigin: '50% 50%',
      }}
    >
      {/* ===================================================================== */}
      {/* LAYER 3 (DEEPEST STACK): Page currentIndex + 2                       */}
      {/* ===================================================================== */}
      {currentIndex + 2 < totalPages && (
        <div
          className="absolute inset-0 w-full h-full pointer-events-none rounded-t-xl border-t border-black/5 shadow-md -z-10"
          style={{
            transform: 'translateY(12px) scale(0.95)',
            opacity: 0.35 + 0.2 * flipProgress,
            filter: 'brightness(0.9)',
            transformOrigin: 'top center',
          }}
        >
          <GitaCard
            page={pages[currentIndex + 2]}
            totalCards={totalPages}
            cardNumber={currentIndex + 3}
          />
        </div>
      )}

      {/* ===================================================================== */}
      {/* LAYER 2 (STACK UNDERNEATH): Page currentIndex + 1                     */}
      {/* ===================================================================== */}
      {currentIndex + 1 < totalPages && !isFlippingNext && !isFlippingPrev && (
        <div
          className="absolute inset-0 w-full h-full pointer-events-none rounded-t-xl border-t border-black/10 shadow-lg z-0"
          style={{
            transform: 'translateY(6px) scale(0.975)',
            opacity: 0.7,
            filter: 'brightness(0.94)',
            transformOrigin: 'top center',
          }}
        >
          <GitaCard
            page={pages[currentIndex + 1]}
            totalCards={totalPages}
            cardNumber={currentIndex + 2}
          />
        </div>
      )}

      {/* ===================================================================== */}
      {/* FORWARD FLIP: BREAK AT MIDDLE AND FLIP UP TO NEXT PAGE               */}
      {/* ===================================================================== */}
      {isFlippingNext && nextPage && (
        <div className="absolute inset-0 w-full h-full z-20 pointer-events-none">
          {/* Static Top Half: Current Page Top */}
          <div className="absolute top-0 inset-x-0 h-1/2 overflow-hidden z-10">
            <GitaCard
              page={currentPage}
              totalCards={totalPages}
              cardNumber={currentIndex + 1}
              half="top"
              onOpenSanskrit={() => setModalVersePage(currentPage)}
            />
            {/* Dynamic shadow cast on top half as bottom flap approaches 180° */}
            <div
              className="absolute inset-0 bg-black pointer-events-none"
              style={{ opacity: flipProgress > 0.5 ? (flipProgress - 0.5) * 0.7 : 0 }}
            />
          </div>

          {/* Static Bottom Half Underneath: Next Page Bottom */}
          <div className="absolute top-1/2 inset-x-0 h-1/2 overflow-hidden z-10">
            <GitaCard
              page={nextPage}
              totalCards={totalPages}
              cardNumber={currentIndex + 2}
              half="bottom"
            />
            {/* Ambient shadow that lightens as flap lifts away */}
            <div
              className="absolute inset-0 bg-black pointer-events-none"
              style={{ opacity: Math.max(0, (1 - flipProgress * 1.5)) * 0.4 }}
            />
          </div>

          {/* THE FLIPPING FLAP: Hinged at the horizontal middle (top: 50%) */}
          <div
            className="absolute top-1/2 inset-x-0 h-1/2 z-30"
            style={{
              transformOrigin: 'top center',
              transformStyle: 'preserve-3d',
              WebkitTransformStyle: 'preserve-3d',
              transform: `rotateX(${nextAngle}deg)`,
              transition: isDragging
                ? 'none'
                : 'transform 0.35s cubic-bezier(0.2, 0.9, 0.3, 1), box-shadow 0.35s ease-out',
              boxShadow:
                nextAngle < 90
                  ? `0 ${10 + (nextAngle / 90) * 35}px ${20 + (nextAngle / 90) * 35}px rgba(0,0,0, ${0.15 + (nextAngle / 90) * 0.35})`
                  : `0 -${10 + ((180 - nextAngle) / 90) * 35}px ${20 + ((180 - nextAngle) / 90) * 35}px rgba(0,0,0, ${0.15 + ((180 - nextAngle) / 90) * 0.35})`,
            }}
          >
            {/* Front Face: Current Page Bottom Half */}
            <div
              className="absolute inset-0 w-full h-full overflow-hidden"
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
              }}
            >
              <GitaCard
                page={currentPage}
                totalCards={totalPages}
                cardNumber={currentIndex + 1}
                half="bottom"
              />
              {/* Dynamic shading as flap tilts away */}
              <div
                className="absolute inset-0 bg-black pointer-events-none"
                style={{ opacity: (nextAngle / 90) * 0.45 }}
              />
            </div>

            {/* Back Face: Next Page Top Half (Rotated 180deg to face upright on top) */}
            <div
              className="absolute inset-0 w-full h-full overflow-hidden"
              style={{
                transform: 'rotateX(180deg)',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
              }}
            >
              <GitaCard
                page={nextPage}
                totalCards={totalPages}
                cardNumber={currentIndex + 2}
                half="top"
              />
              {/* Dynamic shading as flap lands flat */}
              <div
                className="absolute inset-0 bg-black pointer-events-none"
                style={{ opacity: ((180 - nextAngle) / 90) * 0.45 }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* REVERSE FLIP: BREAK AT MIDDLE AND FLIP DOWN TO PREVIOUS PAGE         */}
      {/* ===================================================================== */}
      {isFlippingPrev && prevPage && (
        <div className="absolute inset-0 w-full h-full z-20 pointer-events-none">
          {/* Static Top Half Underneath: Previous Page Top */}
          <div className="absolute top-0 inset-x-0 h-1/2 overflow-hidden z-10">
            <GitaCard
              page={prevPage}
              totalCards={totalPages}
              cardNumber={currentIndex}
              half="top"
              onOpenSanskrit={() => setModalVersePage(prevPage)}
            />
            {/* Ambient shadow that lightens as flap folds down */}
            <div
              className="absolute inset-0 bg-black pointer-events-none"
              style={{ opacity: Math.max(0, (1 - downProgress * 1.5)) * 0.4 }}
            />
          </div>

          {/* Static Bottom Half: Current Page Bottom */}
          <div className="absolute top-1/2 inset-x-0 h-1/2 overflow-hidden z-10">
            <GitaCard
              page={currentPage}
              totalCards={totalPages}
              cardNumber={currentIndex + 1}
              half="bottom"
            />
            {/* Shadow cast as top flap folds down onto bottom */}
            <div
              className="absolute inset-0 bg-black pointer-events-none"
              style={{ opacity: downProgress > 0.5 ? (downProgress - 0.5) * 0.7 : 0 }}
            />
          </div>

          {/* THE FLIPPING FLAP: Hinged at the horizontal middle (bottom of top half) */}
          <div
            className="absolute top-0 inset-x-0 h-1/2 z-30"
            style={{
              transformOrigin: 'bottom center',
              transformStyle: 'preserve-3d',
              WebkitTransformStyle: 'preserve-3d',
              transform: `rotateX(-${prevAngle}deg)`,
              transition: isDragging
                ? 'none'
                : 'transform 0.35s cubic-bezier(0.2, 0.9, 0.3, 1), box-shadow 0.35s ease-out',
              boxShadow:
                prevAngle < 90
                  ? `0 -${10 + (prevAngle / 90) * 35}px ${20 + (prevAngle / 90) * 35}px rgba(0,0,0, ${0.15 + (prevAngle / 90) * 0.35})`
                  : `0 ${10 + ((180 - prevAngle) / 90) * 35}px ${20 + ((180 - prevAngle) / 90) * 35}px rgba(0,0,0, ${0.15 + ((180 - prevAngle) / 90) * 0.35})`,
            }}
          >
            {/* Front Face: Current Page Top Half */}
            <div
              className="absolute inset-0 w-full h-full overflow-hidden"
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
              }}
            >
              <GitaCard
                page={currentPage}
                totalCards={totalPages}
                cardNumber={currentIndex + 1}
                half="top"
              />
              {/* Dynamic shading */}
              <div
                className="absolute inset-0 bg-black pointer-events-none"
                style={{ opacity: (prevAngle / 90) * 0.45 }}
              />
            </div>

            {/* Back Face: Previous Page Bottom Half (Rotated 180deg to face upright on bottom) */}
            <div
              className="absolute inset-0 w-full h-full overflow-hidden"
              style={{
                transform: 'rotateX(180deg)',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
              }}
            >
              <GitaCard
                page={prevPage}
                totalCards={totalPages}
                cardNumber={currentIndex}
                half="bottom"
              />
              {/* Dynamic shading as it arrives flat */}
              <div
                className="absolute inset-0 bg-black pointer-events-none"
                style={{ opacity: ((180 - prevAngle) / 90) * 0.45 }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* AT REST: PAGE SPLIT AT EXACT MIDDLE (50% Artwork / 50% Story)         */}
      {/* ===================================================================== */}
      {!isFlippingNext && !isFlippingPrev && (
        <div className="absolute inset-0 w-full h-full flex flex-col z-20 shadow-2xl">
          {/* Top Half */}
          <div className="w-full h-1/2 relative overflow-hidden">
            <GitaCard
              page={currentPage}
              totalCards={totalPages}
              cardNumber={currentIndex + 1}
              half="top"
              onOpenSanskrit={() => setModalVersePage(currentPage)}
            />
          </div>

          {/* Subtle Middle Crease Hinge Line */}
          <div className="absolute top-1/2 inset-x-0 h-[1.5px] -translate-y-1/2 bg-[#191815]/15 z-30 pointer-events-none shadow-[0_1px_2px_rgba(0,0,0,0.08)]" />

          {/* Bottom Half */}
          <div className="w-full h-1/2 relative overflow-hidden">
            <GitaCard
              page={currentPage}
              totalCards={totalPages}
              cardNumber={currentIndex + 1}
              half="bottom"
            />
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* INTERACTION HINT (ARTISTIC FLAIR BOTTOM OVERLAY)                     */}
      {/* ===================================================================== */}
      {!isDragging && (
        <div
          className={`absolute bottom-3 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-0.5 pointer-events-none transition-opacity duration-300 ${
            !hasFlippedOnce ? 'opacity-80' : 'opacity-40'
          }`}
        >
          <ChevronUp className="w-4 h-4 text-[#746E64] animate-bounce stroke-[2.2]" />
          <div className="text-[8px] uppercase tracking-widest font-bold text-[#746E64]">
            Swipe Up to Flip
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* FULL SCREEN SANSKRIT SHLOKA MODAL                                    */}
      {/* ===================================================================== */}
      {modalVersePage && (
        <div
          className="absolute inset-0 z-50 bg-[#191815]/80 backdrop-blur-md flex items-center justify-center p-5 animate-in fade-in duration-200"
          onClick={() => setModalVersePage(null)}
        >
          <div
            className="w-full max-w-sm bg-[#F5EFE4] rounded-lg p-6 text-[#191815] shadow-2xl border border-[#D97706]/30 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setModalVersePage(null)}
              className="absolute top-4 right-4 p-1 rounded-full text-[#746E64] hover:text-[#191815] hover:bg-black/5 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-[#D97706]" />
              <p className="text-[11px] font-mono font-bold tracking-widest uppercase text-[#746E64]">
                {modalVersePage.verseRef}
              </p>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-[#D97706]" />
              <h3 className="font-serif text-lg font-bold text-[#191815] leading-snug">
                Original Sanskrit Shloka
              </h3>
            </div>

            <div className="p-4 bg-[#EDE4D3] rounded-md border border-[#D8CEBA] mb-4 text-center">
              <p className="font-serif text-base sm:text-lg text-[#191815] whitespace-pre-line leading-relaxed font-semibold">
                {modalVersePage.sanskritVerse}
              </p>
            </div>

            {modalVersePage.sanskritTransliteration && (
              <div className="mb-4">
                <p className="text-[11px] font-sans uppercase font-bold text-[#746E64] tracking-wider mb-1">
                  Transliteration
                </p>
                <p className="text-xs font-mono text-[#3F3A32] italic whitespace-pre-line leading-relaxed bg-[#FBF7F0] p-3 rounded border border-[#E8E0D1]">
                  {modalVersePage.sanskritTransliteration}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setModalVersePage(null)}
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
