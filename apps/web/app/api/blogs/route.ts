import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, slug } = body;

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Generate mock URL based on slug or title
    const mockSlug = slug || title?.toLowerCase().replace(/\s+/g, '-') || 'sample-post';
    const mockUrl = `https://testsite.com/blog/${mockSlug}`;

    return NextResponse.json({
      url: mockUrl
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
