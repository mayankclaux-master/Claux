/**
 * WordPress Connector for PUBLISH agent
 * Integrates with WordPress REST API for publishing
 */

export interface PublishResult {
  success: boolean;
  url?: string;
  error?: string;
}

export interface PublishPostParams {
  title: string;
  html: string;
  siteUrl: string;
  username: string;
  applicationPassword: string;
}

/**
 * Generate URL-friendly slug from title
 */
function generateSlug(title: string): string {
  let slug = title.toLowerCase();
  slug = slug.replace(/\s+/g, '-');
  slug = slug.replace(/[^a-z0-9-]/g, '');
  slug = slug.replace(/-+/g, '-');
  slug = slug.replace(/^-|-$/g, '');
  return slug;
}

/**
 * Publish post to WordPress
 * Uses WordPress REST API with Basic Authentication
 */
export async function publishPost(params: PublishPostParams): Promise<PublishResult> {
  const { title, html, siteUrl, username, applicationPassword } = params;

  if (!siteUrl || !username || !applicationPassword) {
    return {
      success: false,
      error: "WordPress credentials not configured"
    };
  }

  // Generate Basic Auth header
  const authString = `${username}:${applicationPassword}`;
  const encodedAuth = Buffer.from(authString).toString('base64');

  // Generate slug from title
  const slug = generateSlug(title);

  // Prepare API endpoint
  const apiUrl = `${siteUrl.replace(/\/$/, '')}/wp-json/wp/v2/posts`;

  // Prepare request body
  const requestBody = {
    title: title,
    content: html,
    status: "publish",
    slug: slug,
    categories: [1] // Default category
  };

  try {
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${encodedAuth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `WordPress API error: ${response.status} ${response.statusText} - ${errorText}`
      };
    }

    const data = await response.json();

    if (data && data.link) {
      return {
        success: true,
        url: data.link
      };
    } else {
      return {
        success: false,
        error: "WordPress API response missing URL"
      };
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: "WordPress API request timed out (10s)"
        };
      }
      return {
        success: false,
        error: `WordPress API request failed: ${error.message}`
      };
    }
    return {
      success: false,
      error: "Unknown error occurred during WordPress API request"
    };
  }
}
