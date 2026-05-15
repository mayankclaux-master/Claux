/**
 * OpenAI Provider Adapter
 * 
 * @deprecated Phase Z5 Wave 3: Use IntegrationDispatcher → n8n → OpenAI instead.
 * This adapter is preserved as a fallback wrapper for compatibility.
 * Direct execution will be removed in Phase Z6 after successful validation.
 */

// Commented out import as hardened-openai module doesn't exist
// import { createOpenAIAdapter } from './hardened-openai';

// Emit deprecation warning
if (typeof console !== 'undefined' && console.warn) {
  console.warn('[DEPRECATION] OpenAI direct adapter is deprecated. Use IntegrationDispatcher → n8n instead.');
}

export interface ArticleContent {
  title: string;
  content: string;
}

export interface OpenAIConfig {
  apiKey: string;
  model?: string;
  baseUrl?: string;
  timeout?: number;
}

export interface GenerateArticleParams {
  keyword: string;
  businessCategory: string;
}

/**
 * OpenAI Adapter for content generation
 */
export class OpenAIAdapter {
  private config: OpenAIConfig;
  private baseUrl: string;

  constructor(config: OpenAIConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
  }

  /**
   * Generate article for a keyword
   */
  async generateArticle(params: GenerateArticleParams): Promise<ArticleContent> {
    // Deprecation warning
    console.warn('[DEPRECATED] OpenAIAdapter called directly. Use IntegrationDispatcher instead.');

    if (!this.config.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.model || 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `You are a professional content writer for ${params.businessCategory}. Generate high-quality, SEO-optimized articles.`,
            },
            {
              role: 'user',
              content: `Write a comprehensive article about "${params.keyword}" for a ${params.businessCategory} business. Include proper HTML formatting with headings, paragraphs, and bullet points where appropriate.`,
            },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
        signal: AbortSignal.timeout(this.config.timeout || 60000),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return this.transformResponse(data);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('OpenAI API request timed out');
      }
      throw new Error(`Failed to generate article: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Transform API response to ArticleContent format
   */
  private transformResponse(apiResponse: unknown): ArticleContent {
    // TODO: Implement actual transformation based on OpenAI API response structure
    // This will parse the chat.completions response
    
    const response = apiResponse as {
      choices?: Array<{
        message?: {
          content?: string;
        };
      }>;
    };

    const content = response.choices?.[0]?.message?.content || '';
    
    // Extract title from first heading or generate one
    const titleMatch = content.match(/<h1>(.*?)<\/h1>/);
    const title = titleMatch ? titleMatch[1] : 'Generated Article';

    return {
      title,
      content,
    };
  }

  /**
   * Estimate word count from HTML content
   */
  estimateWordCount(htmlContent: string): number {
    const textContent = htmlContent.replace(/<[^>]*>/g, ' ');
    const words = textContent.trim().split(/\s+/).filter(word => word.length > 0);
    return words.length;
  }
}

/**
 * Create OpenAI adapter instance
 */
export function createOpenAIAdapter(config: OpenAIConfig): OpenAIAdapter {
  return new OpenAIAdapter(config);
}
