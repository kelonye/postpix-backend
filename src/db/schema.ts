import { z } from 'zod';

export type BookStatus =
  | 'initiated'
  | 'outlined'
  | 'ready-for-generation'
  | 'scraped'
  | 'processed'
  | 'generated';

export type BookType = 'topic' | 'url' | 'repo';

export const BookSelectedOutline = z.record(z.string(), z.array(z.string()));

export type BookSelectedOutline = z.infer<typeof BookSelectedOutline>;

export const BookPage = z.object({
  page_title: z.string(),
  page_url: z.string().url().optional(),
  page_content: z.string().optional(),
});

export const BookChapter = z.object({
  chapter_title: z.string(),
  pages: z.array(BookPage),
});

export const BookOutline = z.object({
  title: z.string(),
  description: z.string(),
  chapters: z.array(BookChapter),
});

export type BookPage = z.infer<typeof BookPage>;

export type BookChapter = z.infer<typeof BookChapter>;

export type BookOutline = z.infer<typeof BookOutline>;
