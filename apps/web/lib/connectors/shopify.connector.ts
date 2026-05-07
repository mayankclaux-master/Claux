/**
 * Shopify Connector for PUBLISH agent
 * Integrates with Shopify REST Admin API for publishing
 */

export interface PublishResult {
  success: boolean;
  url?: string;
  error?: string;
}

export interface PublishPostParams {
  title: string;
  html: string;
  slug: string;
  storeUrl: string;
  accessToken: string;
  blogId: string;
}

/**
 * Publish post to Shopify
 * Uses Shopify REST Admin API with access token authentication
 */
export async function publishPost(params: PublishPostParams): Promise<PublishResult> {
  const { title, html, slug, storeUrl, accessToken, blogId } = params;

  if (!storeUrl || !accessToken || !blogId) {
    return {
      success: false,
      error: "Shopify credentials not configured"
    };
  }

  // Prepare API endpoint
  const apiUrl = `${storeUrl.replace(/\/$/, '')}/admin/api/2024-01/blogs/${blogId}/articles.json`;

  // Prepare request body
  const requestBody = {
    article: {
      title: title,
      body_html: html,
      handle: slug,
      published: true,
      tags: "seo, claux"
    }
  };

  try {
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorText = "";
      try {
        errorText = await response.text();
      } catch {
        errorText = "Unable to read error response body";
      }
      return {
        success: false,
        error: `Shopify API error: ${response.status} ${response.statusText} - ${errorText}`
      };
    }

    const data = await response.json();

    // Extract URL from response
    const article = data?.article;
    const url = article?.admin_graphql_api_id || article?.handle;

    if (url) {
      return {
        success: true,
        url: url
      };
    } else {
      return {
        success: false,
        error: "Shopify API response missing URL (expected article.admin_graphql_api_id or article.handle)"
      };
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: "Shopify API request timed out (10s)"
        };
      }
      return {
        success: false,
        error: `Shopify API request failed: ${error.message}`
      };
    }
    return {
      success: false,
      error: "Unknown error occurred during Shopify API request"
    };
  }
}
