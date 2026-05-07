/**
 * Custom API Connector for PUBLISH agent
 * Integrates with custom backend/React-based websites via REST API
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
  apiUrl: string;
  apiKey: string;
}

/**
 * Publish post to custom API
 * Uses Bearer token authentication
 */
export async function publishPost(params: PublishPostParams): Promise<PublishResult> {
  const { title, html, slug, apiUrl, apiKey } = params;

  if (!apiUrl || !apiKey) {
    return {
      success: false,
      error: "Custom API credentials not configured"
    };
  }

  // Prepare request body with flexible payload
  const requestBody = {
    title: title,
    content: html,
    html: html,
    slug: slug,
    status: "published"
  };

  try {
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
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
        error: `Custom API error: ${response.status} ${response.statusText} - ${errorText}`
      };
    }

    const data = await response.json();

    // Flexible URL extraction: check response.url or response.data.url
    const url = data?.url || data?.data?.url;

    if (url) {
      return {
        success: true,
        url: url
      };
    } else {
      return {
        success: false,
        error: "Custom API response missing URL (expected response.url or response.data.url)"
      };
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: "Custom API request timed out (10s)"
        };
      }
      return {
        success: false,
        error: `Custom API request failed: ${error.message}`
      };
    }
    return {
      success: false,
      error: "Unknown error occurred during custom API request"
    };
  }
}
