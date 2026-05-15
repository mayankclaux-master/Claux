/**
 * Website Scanner
 * 
 * Scans websites for sitemap discovery and validation
 */

export interface SitemapEntry {
  url: string;
  last_modified?: string | undefined;
  change_frequency?: string | undefined;
  priority?: number | undefined;
}

export interface SitemapResult {
  success: boolean;
  sitemap_url?: string;
  entries?: SitemapEntry[];
  total_entries?: number;
  error?: string;
}

/**
 * Discover sitemap from robots.txt
 */
export async function discoverSitemapFromRobots(websiteUrl: string): Promise<SitemapResult> {
  try {
    const robotsUrl = new URL('/robots.txt', websiteUrl).toString();
    
    const response = await fetch(robotsUrl, {
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `robots.txt returned status ${response.status}`,
      };
    }

    const robotsTxt = await response.text();
    
    // Look for Sitemap directive
    const sitemapMatch = robotsTxt.match(/Sitemap:\s*(https?:\/\/[^\s]+)/i);
    
    if (sitemapMatch) {
      return {
        success: true,
        sitemap_url: sitemapMatch[1],
      };
    }

    // Try standard sitemap locations
    const standardSitemap = new URL('/sitemap.xml', websiteUrl).toString();
    const sitemapResponse = await fetch(standardSitemap, {
      method: 'HEAD',
      signal: AbortSignal.timeout(10000),
    });

    if (sitemapResponse.ok) {
      return {
        success: true,
        sitemap_url: standardSitemap,
      };
    }

    return {
      success: false,
      error: 'No sitemap found in robots.txt or standard location',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Parse sitemap XML
 */
export async function parseSitemap(sitemapUrl: string): Promise<SitemapResult> {
  try {
    const response = await fetch(sitemapUrl, {
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Sitemap returned status ${response.status}`,
      };
    }

    const sitemapXml = await response.text();
    
    // Parse XML (simple regex-based parsing for now)
    const urlMatches = sitemapXml.matchAll(/<url>[\s\S]*?<\/url>/g);
    const entries: SitemapEntry[] = [];

    for (const match of urlMatches) {
      const urlBlock = match[0];
      
      const locMatch = urlBlock.match(/<loc>(.*?)<\/loc>/);
      const lastModMatch = urlBlock.match(/<lastmod>(.*?)<\/lastmod>/);
      const changeFreqMatch = urlBlock.match(/<changefreq>(.*?)<\/changefreq>/);
      const priorityMatch = urlBlock.match(/<priority>(.*?)<\/priority>/);

      if (locMatch) {
        entries.push({
          url: locMatch[1],
          last_modified: lastModMatch?.[1],
          change_frequency: changeFreqMatch?.[1],
          priority: priorityMatch?.[1] ? parseFloat(priorityMatch[1]) : undefined,
        });
      }
    }

    return {
      success: true,
      sitemap_url: sitemapUrl,
      entries,
      total_entries: entries.length,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Scan website for sitemap
 */
export async function scanWebsiteForSitemap(websiteUrl: string): Promise<SitemapResult> {
  // First try to discover from robots.txt
  const discoveryResult = await discoverSitemapFromRobots(websiteUrl);
  
  if (discoveryResult.success && discoveryResult.sitemap_url) {
    // Parse the discovered sitemap
    return await parseSitemap(discoveryResult.sitemap_url);
  }

  // Try standard sitemap.xml directly
  const standardSitemap = new URL('/sitemap.xml', websiteUrl).toString();
  const parseResult = await parseSitemap(standardSitemap);
  
  if (parseResult.success) {
    return parseResult;
  }

  return {
    success: false,
    error: 'No sitemap found',
  };
}

/**
 * Validate sitemap entries
 */
export function validateSitemapEntries(entries: SitemapEntry[]): {
  valid: number;
  invalid: number;
  errors: string[];
} {
  const errors: string[] = [];
  let valid = 0;
  let invalid = 0;

  for (const entry of entries) {
    try {
      new URL(entry.url);
      valid++;
    } catch {
      errors.push(`Invalid URL: ${entry.url}`);
      invalid++;
    }
  }

  return { valid, invalid, errors };
}
