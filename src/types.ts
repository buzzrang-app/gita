export interface GitaPage {
  id: string;
  chapter: number;
  chapterRoman: string;
  chapterTitle: string;
  part: number;
  totalParts: number;
  verseRef: string;
  editorialHeadline: string;
  storyHtml: string;
  sanskritVerse?: string;
  sanskritTransliteration?: string;
  imageSrc: string;
  imageAlt: string;
  summary: string;
}

export interface Bookmark {
  pageId: string;
  savedAt: number;
}
