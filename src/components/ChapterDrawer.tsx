import React, { useState } from 'react';
import { GitaPage } from '../types';
import { X, Bookmark as BookmarkIcon, Layers, Volume2, VolumeX, Download, Share2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWA';

interface ChapterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  pages: GitaPage[];
  currentPageIndex: number;
  onSelectPage: (index: number) => void;
  bookmarks: string[];
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const ChapterDrawer: React.FC<ChapterDrawerProps> = ({
  isOpen,
  onClose,
  pages,
  currentPageIndex,
  onSelectPage,
  bookmarks,
  soundEnabled,
  onToggleSound,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'bookmarks'>('all');
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (!isOpen) return null;

  const displayedPages =
    activeTab === 'bookmarks'
      ? pages.filter((p) => bookmarks.includes(p.id))
      : pages;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Bhagavad Gita Flip',
          text: 'Read the timeless wisdom of the Bhagavad Gita as a physical flip-book.',
          url: window.location.href,
        });
      } catch {
        // Ignored
      }
    } else {
      navigator.clipboard?.writeText(window.location.href);
      alert('Link copied to clipboard');
    }
  };

  return (
    <div
      id="chapter-index-drawer"
      className="fixed inset-0 z-50 bg-[#121110]/85 backdrop-blur-md flex flex-col justify-end transition-opacity duration-300 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[430px] mx-auto h-[82dvh] bg-[#F5EFE4] text-[#191815] rounded-t-2xl shadow-2xl flex flex-col overflow-hidden border-t border-[#D97706]/40"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Handle & Header */}
        <div className="pt-3 pb-2 px-5 border-b border-[#E4D9C7] flex-shrink-0 bg-[#EFE9DF]">
          <div className="w-10 h-1 rounded-full bg-[#C8BEAE] mx-auto mb-3" />

          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono tracking-widest uppercase text-[#746E64] block">
                Table of Contents
              </span>
              <h3 className="font-cinzel text-lg font-bold text-[#191815]">
                Bhagavad Gita
              </h3>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onToggleSound}
                className="p-2 rounded-full text-[#746E64] hover:text-[#191815] hover:bg-black/5 transition"
                title={soundEnabled ? 'Mute page sounds' : 'Enable page sounds'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-[#D97706]" /> : <VolumeX className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="p-2 rounded-full text-[#746E64] hover:text-[#191815] hover:bg-black/5 transition"
                title="Share this App"
              >
                <Share2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full text-[#746E64] hover:text-[#191815] hover:bg-black/5 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs: All Parts vs Saved Bookmarks */}
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-1.5 px-3 rounded-md text-xs font-sans font-semibold tracking-wider uppercase transition flex items-center justify-center gap-1.5 ${
                activeTab === 'all'
                  ? 'bg-[#191815] text-[#F5EFE4]'
                  : 'bg-black/5 text-[#746E64] hover:bg-black/10'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              All Parts ({pages.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('bookmarks')}
              className={`flex-1 py-1.5 px-3 rounded-md text-xs font-sans font-semibold tracking-wider uppercase transition flex items-center justify-center gap-1.5 ${
                activeTab === 'bookmarks'
                  ? 'bg-[#D97706] text-white'
                  : 'bg-black/5 text-[#746E64] hover:bg-black/10'
              }`}
            >
              <BookmarkIcon className="w-3.5 h-3.5" />
              Saved ({bookmarks.length})
            </button>
          </div>
        </div>

        {/* List of Pages */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#EADFCF] p-2 bg-[#F5EFE4]">
          {displayedPages.length === 0 ? (
            <div className="py-16 text-center text-[#746E64] px-4">
              <BookmarkIcon className="w-8 h-8 mx-auto mb-2 text-[#C8BEAE]" />
              <p className="font-serif text-base text-[#191815]">No saved pages yet</p>
              <p className="text-xs mt-1">Tap the heart icon on any card to save your favorite verses.</p>
            </div>
          ) : (
            displayedPages.map((p) => {
              const originalIndex = pages.findIndex((item) => item.id === p.id);
              const isCurrent = originalIndex === currentPageIndex;

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    onSelectPage(originalIndex);
                    onClose();
                  }}
                  className={`w-full p-3 text-left flex items-center gap-3 rounded-lg transition ${
                    isCurrent
                      ? 'bg-[#EDE4D3] border-l-4 border-[#D97706]'
                      : 'hover:bg-black/5'
                  }`}
                >
                  <img
                    src={p.imageSrc}
                    alt=""
                    className="w-14 h-14 object-cover rounded-sm flex-shrink-0 shadow-xs border border-[#D97706]/20"
                    loading="lazy"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-[11px] text-[#746E64] font-mono">
                      <span>CH {p.chapter} · PT {String(p.part).padStart(2, '0')}</span>
                      <span>{p.verseRef.replace('Bhagavad Gita · ', '')}</span>
                    </div>

                    <p className="font-serif text-sm font-bold text-[#191815] truncate mt-0.5">
                      {p.editorialHeadline.replace('\n', ' ')}
                    </p>

                    <p className="text-xs text-[#5C554B] line-clamp-1 mt-0.5">
                      {p.summary}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* PWA In-App Install Prompt Banner at Drawer Bottom */}
        <div className="p-3 bg-[#EFE9DF] border-t border-[#E4D9C7] flex items-center justify-between">
          <div className="text-xs">
            <p className="font-semibold text-[#191815]">Bhagavad Gita Flip PWA</p>
            <p className="text-[11px] text-[#746E64]">Install to read full-screen offline</p>
          </div>

          {!isInstalled && isInstallable && (
            <button
              type="button"
              onClick={install}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#D97706] text-white text-xs font-semibold rounded-md shadow-sm active:scale-95 transition"
            >
              <Download className="w-3.5 h-3.5" />
              Install
            </button>
          )}

          {!isInstalled && isIOS && (
            <button
              type="button"
              onClick={() => setShowIOSGuide(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#191815] text-[#F5EFE4] text-xs font-semibold rounded-md shadow-sm active:scale-95 transition"
            >
              <Download className="w-3.5 h-3.5" />
              Install iOS
            </button>
          )}

          {isInstalled && (
            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-100 px-2 py-1 rounded">
              Installed
            </span>
          )}
        </div>
      </div>

      {/* iOS Installation Instructions Modal */}
      {showIOSGuide && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setShowIOSGuide(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-[#F5EFE4] p-6 shadow-2xl border border-[#D97706]/40 text-[#191815]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-cinzel text-lg font-bold text-[#191815]">Install on iPhone / iPad</h3>
            <p className="mt-3 text-sm text-[#4A453D] leading-relaxed">
              1. Tap the <strong className="text-[#191815]">Share</strong> icon in Safari toolbar at the bottom.<br />
              2. Scroll down and tap <strong className="text-[#191815]">Add to Home Screen</strong>.<br />
              3. Launch anytime with offline support and zero browser bars.
            </p>
            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full rounded-md bg-[#191815] py-2.5 text-xs font-semibold text-[#F5EFE4] uppercase tracking-wider hover:bg-black transition"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
