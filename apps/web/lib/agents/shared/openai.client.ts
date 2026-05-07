/**
 * OpenAI Client for content generation
 * Currently uses mock data - integrate with OpenAI API when credentials available
 */

export interface ArticleContent {
  title: string;
  content: string;
}

/**
 * Generate article for a keyword
 * Currently returns mock content - integrate with OpenAI API when ready
 */
export async function generateArticle(params: {
  keyword: string;
  businessCategory: string;
}): Promise<ArticleContent> {
  const { keyword, businessCategory } = params;

  // TODO: Replace with actual OpenAI API call
  // const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  // if (!OPENAI_API_KEY) {
  //   throw new Error("OpenAI API key not configured");
  // }

  // Mock content for testing
  const mockContent: ArticleContent = {
    title: `Best ${keyword} for ${businessCategory}`,
    content: `<h1>Best ${keyword} for ${businessCategory}</h1>
<p>When it comes to finding the best ${keyword} for your ${businessCategory} needs, there are several factors to consider. This comprehensive guide will help you make an informed decision.</p>
<h2>Understanding ${keyword}</h2>
<p>${keyword} plays a crucial role in the ${businessCategory} industry. Whether you're a beginner or an experienced professional, understanding the nuances of ${keyword} can significantly impact your results.</p>
<h2>Key Benefits</h2>
<ul>
<li>Improved efficiency in ${businessCategory} operations</li>
<li>Cost-effective solutions for ${keyword}</li>
<li>Expert-recommended approaches</li>
<li>Long-term sustainability</li>
</ul>
<h2>How to Choose the Right ${keyword}</h2>
<p>Selecting the appropriate ${keyword} requires careful consideration of your specific requirements, budget, and long-term goals. Here's what you need to know.</p>
<h2>Common Mistakes to Avoid</h2>
<p>Many businesses make avoidable mistakes when implementing ${keyword} solutions. Learn from these common pitfalls to ensure success.</p>
<h2>Conclusion</h2>
<p>Choosing the right ${keyword} for your ${businessCategory} needs is a critical decision that can impact your success. Take the time to research and select wisely.</p>`
  };

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  return mockContent;
}

/**
 * Estimate word count from HTML content
 */
export function estimateWordCount(htmlContent: string): number {
  // Remove HTML tags and count words
  const textContent = htmlContent.replace(/<[^>]*>/g, ' ');
  const words = textContent.trim().split(/\s+/).filter(word => word.length > 0);
  return words.length;
}
