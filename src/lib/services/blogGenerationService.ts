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
        metadata: z
          .object({
            level: z
              .number()
              .nullable()
              .describe('Heading level 2-4, only for HEADING blocks. null for other block types.'),
            ordered: z
              .boolean()
              .nullable()
              .describe('Whether the list is ordered, only for LIST blocks. null for other block types.'),
            alt: z
              .string()
              .nullable()
              .describe('Image alt text, only for IMAGE blocks. null for other block types.'),
          }),
        order: z.number().describe('Display order starting from 0'),
      })
    )
    .describe('Structured content blocks that compose the blog post body'),
});

type GeneratedBlogPost = z.infer<typeof BlogPostSchema>;

export interface BlogGenerationInput {
  topic: string;
  tone: 'professional' | 'casual' | 'educational';
  keywords: string[];
  categoryId?: number;
  authorId: number;
}

const SYSTEM_PROMPT = `You are a senior content writer for Boombox, a vehicle logistics and auto transport company. 
Boombox provides services including vehicle shipping, enclosed transport, open transport, storage solutions, and moving services.

You write high-quality, SEO-optimized blog posts that educate customers and drive organic traffic.

CONTENT GUIDELINES:
- Write authoritative, informative content relevant to auto transport, vehicle shipping, moving, and logistics
- Naturally incorporate the provided keywords without keyword stuffing
- Use clear, scannable structure with descriptive headings
- Include practical tips, data points, or industry insights when relevant
- End with a subtle call-to-action encouraging readers to explore Boombox's services

STRUCTURE RULES:
- Start with a HEADING (level 2) followed by an introductory PARAGRAPH
- Use HEADING blocks (level 2-3) to break content into 3-5 major sections
- Mix PARAGRAPH, LIST, and QUOTE blocks for visual variety
- Do NOT include IMAGE blocks — images are handled separately
- Each section should have 2-4 paragraphs
- Include at least one LIST block (tips, steps, or comparisons)
- Include at least one QUOTE block (industry insight or expert perspective)
- Total word count: 1000-1500 words
- Content blocks should be ordered sequentially starting from 0`;

export class BlogGenerationService {
  static async generateBlogPost(
    input: BlogGenerationInput
  ): Promise<GeneratedBlogPost> {
    const userPrompt = `Write a blog post about: "${input.topic}"

Tone: ${input.tone}
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

  static async generateFeaturedImage(
    title: string,
    excerpt: string
  ): Promise<{ url: string; alt: string }> {
    const imagePrompt = `Create a professional, modern blog header image for an article titled "${title}". 
The article is about: ${excerpt}. 
Style: Clean, corporate photography or modern illustration style. 
No text overlays. Wide aspect ratio suitable for a blog hero banner.
The image should feel premium and professional, fitting for a vehicle logistics company.`;

    const imageResponse = await openai.images.generate({
      model: 'dall-e-3',
      prompt: imagePrompt,
      n: 1,
      size: '1792x1024',
      quality: 'standard',
    });

    const dalleUrl = imageResponse.data[0]?.url;
    if (!dalleUrl) {
      throw new Error(
        'Failed to generate featured image: no image URL returned'
      );
    }

    const cloudinaryResult = await cloudinary.uploader.upload(dalleUrl, {
      folder: 'blog/featured-images',
      resource_type: 'image',
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    });

    return {
      url: cloudinaryResult.secure_url,
      alt: `Featured image for: ${title}`,
    };
  }

  /**
   * Full pipeline: generate text + image, save as DRAFT
   */
  static async generateAndSaveBlogPost(input: BlogGenerationInput) {
    const [generatedPost, featuredImage] = await Promise.all([
      this.generateBlogPost(input),
      this.generateFeaturedImage(input.topic, input.keywords.join(', ')),
    ]);

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

    const savedPost = await withRetry(() =>
      BlogService.createBlogPost({
        title: generatedPost.title,
        slug: generatedPost.slug,
        excerpt: generatedPost.excerpt,
        metaTitle: generatedPost.metaTitle,
        metaDescription: generatedPost.metaDescription,
        readTime: generatedPost.readTime,
        featuredImage: featuredImage.url,
        featuredImageAlt: featuredImage.alt,
        categoryId: input.categoryId,
        status: BlogStatus.DRAFT,
        authorId: input.authorId,
        generatedByAI: true,
        aiPrompt: `Topic: ${input.topic} | Tone: ${input.tone} | Keywords: ${input.keywords.join(', ')}`,
        contentBlocks,
      })
    );

    return savedPost;
  }
}
