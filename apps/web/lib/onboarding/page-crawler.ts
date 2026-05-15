/**
 * Page Crawler
 * Crawls individual pages for metadata extraction
 */

export interface PageMetadata {
  url: string;
  title?: string;
  description?: string;
  headings?: string[];
  internal_links?: string[];
  word_count?: number;
  last_crawled?: string;
}

export async function crawlPage(url: string): Promise<{ success: boolean; metadata?: PageMetadata; error?: string }> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return { success: false, error: `Status ${response.status}` };
    }

    const html = await response.text();
    const metadata: PageMetadata = { url };

    // Extract title
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    if (titleMatch) metadata.title = titleMatch[1];

    // Extract meta description
    const descMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i);
    if (descMatch) metadata.description = descMatch[1];

    // Extract headings
    const headingMatches = html.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi);
    if (headingMatches) {
      metadata.headings = headingMatches.map(h => h.replace(/<[^>]*>/g, '').trim());
    }

    // Extract internal links
    const linkMatches = html.match(/<a[^>]*href="([^"]*)"[^>]*>/gi);
    if (linkMatches) {
      const baseUrl = new URL(url);
      metadata.internal_links = linkMatches
        .map(link => {
          const hrefMatch = link.match(/href="([^"]*)"/);
          return hrefMatch ? hrefMatch[1] : null;
        })
        .filter(href => href && href.startsWith('/'))
        .map(href => {
          if (!href) return null;
          try {
            return new URL(href, baseUrl).toString();
          } catch {
            return null;
          }
        })
        .filter(url => url !== null) as string[];
    }

    // Estimate word count
    const textContent = html.replace(/<[^>]*>/g, ' ');
    metadata.word_count = textContent.trim().split(/\s+/).length;

    metadata.last_crawled = new Date().toISOString();

    return { success: true, metadata };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function crawlPages(urls: string[]): Promise<{ success: boolean; metadata?: PageMetadata[]; errors: string[] }> {
  const metadata: PageMetadata[] = [];
  const errors: string[] = [];

  for (const url of urls) {
    const result = await crawlPage(url);
    if (result.success && result.metadata) {
      metadata.push(result.metadata);
    } else {
      errors.push(`${url}: ${result.error}`);
    }
  }

  return { success: true, metadata, errors };
}
