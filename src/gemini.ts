/**
 * Gemini AI utilities for Lumina Command.
 * Provides three AI capabilities:
 *  1. fetchPageMeta   — auto-fill title/description from a URL
 *  2. suggestCategory — recommend a category ID from the URL + title
 *  3. searchBookmarks — natural-language semantic search over bookmarks
 */

import { GoogleGenAI } from '@google/genai';
import type { BookmarkRecord, CategoryRecord, Lang } from './appData';

// ─── Client ────────────────────────────────────────────────────────────────

function getClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  return new GoogleGenAI({ apiKey: key });
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PageMeta {
  title: string;
  description: string;
}

// ─── 1. Fetch page metadata ─────────────────────────────────────────────────

/**
 * Given a URL, use Gemini (with URL context) to extract the page title
 * and a short description. Falls back gracefully when AI is unavailable.
 */
export async function fetchPageMeta(url: string): Promise<PageMeta | null> {
  const ai = getClient();
  if (!ai) return null;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `Visit this URL and extract its page title and a one-sentence description in the same language as the page content. URL: ${url}`,
      config: {
        tools: [{ urlContext: {} }],
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'The page title, concise and accurate' },
            description: { type: 'string', description: 'A one-sentence description of what this page is about' },
          },
          required: ['title', 'description'],
        },
        temperature: 0.1,
        maxOutputTokens: 512,
      },
    });

    const text = response.text;
    const data = JSON.parse(text) as PageMeta;
    if (!data.title || !data.description) return null;
    return data;
  } catch {
    return null;
  }
}

// ─── 2. Suggest category ────────────────────────────────────────────────────

/**
 * Given a URL, title, and the user's available categories, ask Gemini
 * which category ID best fits. Returns null if AI is unavailable or
 * unsure.
 */
export async function suggestCategory(
  url: string,
  title: string,
  categories: Omit<CategoryRecord, 'bookmarks'>[],
  lang: Lang,
): Promise<string | null> {
  const ai = getClient();
  if (!ai) return null;
  if (categories.length === 0) return null;

  const categoryList = categories
    .map((c) => `- id="${c.id}" label="${c.title ?? c.id}"`)
    .join('\n');

  const prompt =
    lang === 'zh'
      ? `你是一个书签整理助手。根据以下网址和标题，从给定的分类列表中选出最合适的一个分类 ID（只返回 id 字符串，不要其他内容）。\n\n网址: ${url}\n标题: ${title}\n\n分类列表:\n${categoryList}`
      : `You are a bookmark organizer. Given the URL and title below, pick the single most fitting category ID from the list. Return only the id string.\n\nURL: ${url}\nTitle: ${title}\n\nCategories:\n${categoryList}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        temperature: 0,
        maxOutputTokens: 64,
      },
    });

    const suggested = response.text.trim().replace(/^["']|["']$/g, '');
    const valid = categories.find((c) => c.id === suggested);
    return valid ? valid.id : null;
  } catch {
    return null;
  }
}

// ─── 3. Natural-language bookmark search ────────────────────────────────────

/**
 * Given a natural-language query and the user's bookmarks, use Gemini
 * to return the IDs of the most relevant bookmarks (up to maxResults).
 * Falls back to an empty array if AI is unavailable.
 */
export async function searchBookmarks(
  query: string,
  bookmarks: BookmarkRecord[],
  lang: Lang,
  maxResults = 6,
): Promise<BookmarkRecord[]> {
  const ai = getClient();
  if (!ai || bookmarks.length === 0) return [];

  const bookmarkList = bookmarks
    .map((b) => `id="${b.id}" title="${b.title}" url="${b.url}" desc="${b.description}" tag="${b.tag}"`)
    .join('\n');

  const prompt =
    lang === 'zh'
      ? `你是一个书签搜索引擎。根据用户的自然语言查询，从书签列表中找出最相关的最多 ${maxResults} 个书签，返回它们的 id 列表（JSON 数组格式）。\n\n查询: ${query}\n\n书签列表:\n${bookmarkList}`
      : `You are a semantic bookmark search engine. Given a natural-language query, return the IDs of the most relevant bookmarks (up to ${maxResults}) as a JSON array of id strings.\n\nQuery: ${query}\n\nBookmarks:\n${bookmarkList}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            ids: {
              type: 'array',
              items: { type: 'string' },
              description: 'Ordered list of matching bookmark IDs, most relevant first',
            },
          },
          required: ['ids'],
        },
        temperature: 0,
        maxOutputTokens: 256,
      },
    });

    const data = JSON.parse(response.text) as { ids: string[] };
    const idSet = new Set(data.ids.slice(0, maxResults));
    // Preserve relevance order returned by Gemini
    return data.ids
      .slice(0, maxResults)
      .map((id) => bookmarks.find((b) => b.id === id))
      .filter((b): b is BookmarkRecord => b !== undefined && idSet.has(b.id));
  } catch {
    return [];
  }
}
