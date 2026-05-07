/**
 * DataForSEO Client for keyword research
 * Currently uses mock data - replace with actual API when credentials available
 */

export interface KeywordData {
  keyword: string;
  volume: number;
  difficulty: number;
}

/**
 * Fetch keywords for a given domain
 * Currently returns mock data - integrate with DataForSEO API when ready
 */
export async function fetchKeywordsForSite(domain: string): Promise<KeywordData[]> {
  // TODO: Replace with actual DataForSEO API call
  // const API_KEY = process.env.DATAFORSEO_API_KEY;
  // if (!API_KEY) {
  //   throw new Error("DataForSEO API key not configured");
  // }

  // Mock data for testing
  const mockKeywords: KeywordData[] = [
    { keyword: "dentist in mumbai", volume: 5400, difficulty: 65 },
    { keyword: "best dental clinic", volume: 2900, difficulty: 58 },
    { keyword: "dental implants cost", volume: 1900, difficulty: 72 },
    { keyword: "teeth whitening near me", volume: 3600, difficulty: 45 },
    { keyword: "root canal treatment", volume: 2200, difficulty: 68 },
    { keyword: "orthodontist mumbai", volume: 810, difficulty: 55 },
    { keyword: "dental checkup", volume: 1400, difficulty: 32 },
    { keyword: "cosmetic dentistry", volume: 1100, difficulty: 61 },
    { keyword: "emergency dentist", volume: 950, difficulty: 48 },
    { keyword: "dental braces price", volume: 720, difficulty: 52 }
  ];

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  return mockKeywords;
}

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    // If URL is invalid, return as-is
    return url.replace(/^https?:\/\//, "").split("/")[0];
  }
}
