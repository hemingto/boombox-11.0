import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';
import { BlogContentBlockType, BlogStatus } from '@prisma/client';
import openai from '@/lib/integrations/openaiClient';
import cloudinary from '@/lib/integrations/cloudinaryClient';
import { BlogService } from '@/lib/services/blogService';
import { withRetry } from '@/lib/database/prismaClient';

const BlogPostSchema = z.object({
  title: z.string().describe('SEO-optimized blog post title, 50-70 characters'),
  slug: z
    .string()
    .describe('URL slug derived from the title, lowercase with hyphens'),
  excerpt: z
    .string()
    .describe('2-3 sentence summary for previews and meta description'),
  metaTitle: z.string().describe('SEO meta title, under 60 characters'),
  metaDescription: z
    .string()
    .describe('SEO meta description, under 160 characters'),
  readTime: z.number().describe('Estimated read time in minutes'),
  contentBlocks: z
    .array(
      z.object({
        type: z.enum([
          'PARAGRAPH',
          'HEADING',
          'IMAGE',
          'QUOTE',
          'LIST',
          'CODE',
        ]),
        content: z
          .string()
          .describe(
            'Block content. For LIST blocks, separate items with newlines.'
          ),
        metadata: z.object({
          level: z
            .number()
            .nullable()
            .describe(
              'Heading level 2-4, only for HEADING blocks. null for other block types.'
            ),
          ordered: z
            .boolean()
            .nullable()
            .describe(
              'Whether the list is ordered, only for LIST blocks. null for other block types.'
            ),
          alt: z
            .string()
            .nullable()
            .describe(
              'Image alt text, only for IMAGE blocks. null for other block types.'
            ),
        }),
        order: z.number().describe('Display order starting from 0'),
      })
    )
    .describe('Structured content blocks that compose the blog post body'),
  suggestedTags: z
    .array(z.string())
    .describe(
      '3-6 additional SEO tags relevant to the post content, lowercase hyphenated slugs (e.g. "portable-storage", "sf-moving-tips")'
    ),
});

type GeneratedBlogPost = z.infer<typeof BlogPostSchema>;

export interface BlogGenerationInput {
  topic: string;
  keywords: string[];
  categoryId?: number;
  authorId: number;
  authorName?: string;
  authorImage?: string;
  featuredImageUrl: string;
  featuredImageAlt: string;
}

const SYSTEM_PROMPT = `You are a senior content writer for Boombox Storage, a mobile storage company \
serving the San Francisco Bay Area. Boombox delivers portable storage containers directly to customers' \
doors, picks them up when packed, stores them securely, and redelivers on demand — eliminating the \
hassle of traditional self-storage.

COMPANY FACTS (use accurately, never fabricate specifics):
- Container size: 5'W x 8'L x 8'H, 257 cubic feet, 1,000 lb weight limit
- Service area: San Francisco Bay Area
- Pricing: $45 flat-rate delivery fee, first 60 minutes of loading free, $55/hr after
- Monthly billing with 2-month minimum term
- Optional add-ons: moving labor (local pros), insurance coverage, moving blankets (5 included)
- Facilities are 24/7 monitored, closed to public; customers access units via scheduled redelivery
- Contact: help@boomboxstorage.com

VOICE & TONE:
- Friendly, confident, and practical — like advice from a knowledgeable neighbor
- Avoid corporate jargon; write conversationally but informatively
- Empathize with the stress of moving and storage; position Boombox as the relief
- Never make claims that can't be verified (e.g., "the cheapest in SF") — instead say \
  "competitively priced" or "often below traditional self-storage rates"

SEO GUIDELINES:
- Naturally incorporate the provided target keywords 2-4 times each; never force them
- Use long-tail variations of keywords throughout (e.g., "portable storage San Francisco" \
  alongside "mobile storage Bay Area")
- Write descriptive H2/H3 headings that include keywords where natural
- First paragraph should establish the topic and include the primary keyword
- Meta-friendly: write as if the first 150 characters of the intro could serve as a meta description

CONTENT GUIDELINES:
- Lead with the reader's problem or situation, not with Boombox features
- Include practical, actionable tips (packing advice, sizing guidance, move prep checklists)
- Reference real scenarios Bay Area residents face: apartment moves, seasonal storage, \
  downsizing, renovation displacement, college move-outs
- When citing data or statistics, only include information you're confident is accurate; \
  otherwise frame as general industry context
- End with a soft CTA that feels helpful, not salesy (e.g., "Get a free quote" or \
  "See if Boombox serves your neighborhood")

STRUCTURE RULES:
- Open with an H2 heading + introductory paragraph that hooks the reader with a relatable scenario
- 3–5 major sections using H2 headings; subsections may use H3
- Mix paragraph, bulleted list, and blockquote blocks for visual variety
- At least one LIST block (packing tips, a checklist, a comparison, or step-by-step)
- At least one QUOTE block — frame as an expert insight, customer perspective, or \
  industry observation (do not fabricate attributions; use "storage experts note that..." \
  or similar framing)
- Do NOT include IMAGE blocks — images are handled separately
- Each section: 2–4 paragraphs or equivalent content
- Total word count: 1,000–1,500 words
- Content blocks numbered sequentially starting from 0
- Close with a brief, helpful CTA section (H2: "Ready to Simplify Your Move?" or similar)`;

export { DEFAULT_IMAGE_STYLE } from '@/lib/constants/blogDefaults';

export class BlogGenerationService {
  static async generateBlogPost(
    input: BlogGenerationInput
  ): Promise<GeneratedBlogPost> {
    const userPrompt = `Write a blog post about: "${input.topic}"

Target keywords: ${input.keywords.join(', ')}

Generate a complete, structured blog post following the content and structure guidelines.`;

    const completion = await openai.chat.completions.parse({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      response_format: zodResponseFormat(BlogPostSchema, 'blog_post'),
      temperature: 0.7,
    });

    const parsed = completion.choices[0]?.message?.parsed;
    if (!parsed) {
      throw new Error(
        'Failed to generate blog post: no structured output returned'
      );
    }

    return parsed;
  }

  /**
   * Generate an image from a prompt. Used by the generate-image API route.
   * Accepts a full custom prompt, or builds one from topic context + default style.
   */
  static async generateFeaturedImage(
    prompt: string
  ): Promise<{ url: string; alt: string }> {
    const imageResponse = await openai.images.generate({
      model: 'gpt-image-1',
      prompt,
      n: 1,
      size: '1536x1024',
      quality: 'medium',
    });

    const b64 = imageResponse.data?.[0]?.b64_json;
    if (!b64) {
      throw new Error(
        'Failed to generate featured image: no image data returned'
      );
    }

    const dataUri = `data:image/png;base64,${b64}`;
    const cloudinaryResult = await cloudinary.uploader.upload(dataUri, {
      folder: 'blog/featured-images',
      resource_type: 'image',
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    });

    return {
      url: cloudinaryResult.secure_url,
      alt: 'Blog image',
    };
  }

  /**
   * Generate text content and save as DRAFT.
   * Image is pre-approved and passed in via input.featuredImageUrl.
   */
  static async generateAndSaveBlogPost(input: BlogGenerationInput) {
    const generatedPost = await this.generateBlogPost(input);

    const contentBlocks = generatedPost.contentBlocks.map(block => {
      const raw = block.metadata;
      const cleaned: Record<string, any> = {};
      if (raw?.level != null) cleaned.level = raw.level;
      if (raw?.ordered != null) cleaned.ordered = raw.ordered;
      if (raw?.alt != null) cleaned.alt = raw.alt;
      return {
        type: BlogContentBlockType[
          block.type as keyof typeof BlogContentBlockType
        ],
        content: block.content,
        metadata: Object.keys(cleaned).length > 0 ? cleaned : undefined,
        order: block.order,
      };
    });

    const toSlug = (s: string) =>
      s
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    const tagSlugs = [
      ...new Set([
        ...input.keywords.map(toSlug),
        ...(generatedPost.suggestedTags ?? []).map(toSlug),
      ]),
    ].filter(Boolean);

    const savedPost = await withRetry(() =>
      BlogService.createBlogPost({
        title: generatedPost.title,
        slug: generatedPost.slug,
        excerpt: generatedPost.excerpt,
        metaTitle: generatedPost.metaTitle,
        metaDescription: generatedPost.metaDescription,
        readTime: generatedPost.readTime,
        featuredImage: input.featuredImageUrl,
        featuredImageAlt: input.featuredImageAlt,
        categoryId: input.categoryId,
        status: BlogStatus.DRAFT,
        authorId: input.authorId,
        authorName: input.authorName,
        authorImage: input.authorImage,
        generatedByAI: true,
        aiPrompt: `Topic: ${input.topic} | Keywords: ${input.keywords.join(', ')}`,
        contentBlocks,
        tagSlugs,
      })
    );

    return savedPost;
  }
}
