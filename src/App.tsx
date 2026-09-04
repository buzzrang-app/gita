import { useState, useEffect } from 'react';
import { GITA_PAGES } from './data/gitaPages';
import { TopBar } from './components/TopBar';
import { PhysicalFlipStage } from './components/PhysicalFlipStage';
import { ChapterDrawer } from './components/ChapterDrawer';
import { OfflineIndicator } from './components/OfflineIndicator';

export default function App() {
  // Restore last read page from localStorage
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('gita_last_page');
      if (saved !== null) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 0 && parsed < GITA_PAGES.length) {
          return parsed;
        }
      }
    } catch {
      // Ignored
    }
    return 0;
  });

  // Bookmarks state persisted in localStorage
  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('gita_bookmarks');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Ignored
    }
    return [];
  });

  // Sound enabled
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('gita_sound') !== 'false';
    } catch {
      return true;
    }
  });

  // Chapter & Table of contents drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Save current page to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('gita_last_page', String(currentPageIndex));
    } catch {
      // Ignored
    }
  }, [currentPageIndex]);

  // Save bookmarks
  const toggleBookmark = () => {
    const currentPage = GITA_PAGES[currentPageIndex];
    if (!currentPage) return;

    setBookmarks((prev) => {
      let updated: string[];
      if (prev.includes(currentPage.id)) {
        updated = prev.filter((id) => id !== currentPage.id);
      } else {
        updated = [...prev, currentPage.id];
      }
      try {
        localStorage.setItem('gita_bookmarks', JSON.stringify(updated));
      } catch {
        // Ignored
      }
      return updated;
    });

    if (navigator.vibrate) navigator.vibrate(10);
  };

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('gita_sound', String(next));
      } catch {
        // Ignored
      }
      return next;
    });
  };

  const currentPage = GITA_PAGES[currentPageIndex] || GITA_PAGES[0];
  const isBookmarked = bookmarks.includes(currentPage.id);

  return (
    <main
      id="gita-app-viewport"
      className="w-full h-[100dvh] bg-[#E5E1D8] flex items-center justify-center overflow-hidden m-0 p-0 text-[#191815] select-none font-sans"
      style={{ backgroundColor: '#E5E1D8' }}
    >
      {/* Centered Mobile Frame: width 100% on phones (360-430px), max-w-[430px] centered on desktop */}
      <div
        id="mobile-phone-container"
        className="relative w-full h-full max-w-[430px] flex flex-col bg-[#F5EFE4] overflow-hidden shadow-2xl sm:rounded-none"
        style={{
          height: '100dvh',
        }}
      >
        {/* Minimal Floating Top Bar */}
        <TopBar
          chapterNumber={currentPage.chapter}
          chapterTitle={currentPage.chapterTitle}
          isBookmarked={isBookmarked}
          canGoBack={currentPageIndex > 0}
          onPrev={() => {
            if (currentPageIndex > 0) {
              setCurrentPageIndex((i) => i - 1);
            }
          }}
          onToggleBookmark={toggleBookmark}
          onOpenIndex={() => setIsDrawerOpen(true)}
        />

        {/* 3D Physical Paper Flip Stage */}
        <PhysicalFlipStage
          pages={GITA_PAGES}
          currentIndex={currentPageIndex}
          onPageChange={setCurrentPageIndex}
          soundEnabled={soundEnabled}
        />

        {/* Chapter Index & Bookmarks Drawer */}
        <ChapterDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          pages={GITA_PAGES}
          currentPageIndex={currentPageIndex}
          onSelectPage={(newIndex) => setCurrentPageIndex(newIndex)}
          bookmarks={bookmarks}
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
        />

        {/* PWA Offline indicator */}
        <OfflineIndicator />
      </div>
    </main>
  );
}
