import mimeTypes from 'mime-types';
import { experimental_generateImage as generateImage } from 'ai';
import { openai } from '@ai-sdk/openai';
import { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

import { generateObject, generateText } from '../ai/chat/completion.js';
import { logger } from '../logger.js';
import { uploadToS3 } from '../s3.js';

const postBannerSchema = z.object({
  slug: z.string(),
  alt: z.string(),
  prompt: z.string(),
  url: z.string(),
});

const postSectionImageSchema = z.object({
  slug: z.string(),
  alt: z.string(),
  prompt: z.string(),
  placement: z.string(),
  url: z.string(),
});

const postMetadataSchema = z.object({
  banner: postBannerSchema,
  sectionImages: z.array(postSectionImageSchema),
});

type PostBanner = z.infer<typeof postBannerSchema>;
type PostSectionImage = z.infer<typeof postSectionImageSchema>;
export type PostMetadata = z.infer<typeof postMetadataSchema>;

type GeneratePostImageParams = {
  postId: string;
  prompt: string;
  slug: string;
  examples: Map<string, string>;
};

export async function suggestPostBannerAndSectionImages({
  idealNoOfSectionImages,
  postContent,
  postId,
}: {
  idealNoOfSectionImages: number;
  postContent: string;
  postId: string;
}): Promise<PostMetadata> {
  const metadata = await generateObject<PostMetadata>({
    systemPrompt: getSuggestPostBannerAndSectionImagesSystemPrompt(
      idealNoOfSectionImages,
    ),
    examples: new Map(),
    userPrompt: getSuggestPostBannerAndSectionImagesUserPrompt({
      postContent,
      postId,
    }),
    schema: postMetadataSchema,
  });

  return metadata;
}

export async function updateMarkdownWithImagePlacements({
  markdown,
  metadata,
  idealNoOfSectionImages,
}: {
  markdown: string;
  metadata: PostMetadata;
  idealNoOfSectionImages: number;
}) {
  const updatedMarkdown = await generateText({
    systemPrompt: getUpdateMarkdownSystemPrompt(idealNoOfSectionImages),
    examples: new Map(),
    userPrompt: getUpdateMarkdownUserPrompt({
      markdown,
      metadata,
    }),
  });

  logger.info({
    message: 'Updated markdown',
    updatedMarkdown,
  });

  return updatedMarkdown;
}

export async function generatePostBannerImage(
  props: Omit<GeneratePostImageParams, 'examples'>,
): Promise<string> {
  return await generatePostImage({
    ...props,
    examples: bannerExamples,
    prompt: `Create a stunning Studio Ghibli–inspired blog post banner image with the following specifications:

${props.prompt}

**Technical Requirements:**

* **Resolution:** Landscape
* **Style:** Studio Ghibli aesthetic with soft, dreamy lighting, warm pastel tones, and natural or everyday-life elements
* **Composition:**

  * Left side: Clear space or panel for text overlay
  * Right side: Illustrated scene relevant to the blog topic (family, people, nature, or everyday life moments)
  * Balanced, storybook-style layout with a clear focal point
* **Text Overlay:**

  * **Main Title:** Bold, ALL CAPS, large size, for contrast
  * **Subtitle:** Smaller, sentence case, accent color
  * **Optional Callouts/Labels:** Placed inside props (e.g., a signboard, card, or banner in the illustration), in clean sans-serif text
* **Color Palette:** Warm, inviting tones that complement the emotional theme
* **Typography Integration:** Text should be prominent and readable but feel naturally embedded into the illustration (not pasted on top)
* **Quality:** High-resolution, professional look, optimized for web and social media

**Creative Goal:**
Ensure the banner captures both the emotional essence and main theme of the blog post, while combining a Studio Ghibli–inspired illustration with professional text design placed in a light-colored rounded card background.`,
  });
}

export async function generatePostSectionImage(
  props: Omit<GeneratePostImageParams, 'examples'>,
): Promise<string> {
  return await generatePostImage({
    ...props,
    examples: sectionsImagesExamples,
    prompt: `Create a beautiful Studio Ghibli-inspired section image with the following specifications:
    
${props.prompt}

Technical Requirements:
- Resolution: Landscape
- Style: Studio Ghibli aesthetic with gentle, atmospheric lighting
- Composition: Engaging visual storytelling that supports the content
- Color Palette: Harmonious colors that enhance readability and emotional impact
- Quality: High-resolution, professional appearance

The image should illustrate the specific section content while maintaining visual consistency with the overall blog post theme.`,
  });
}

async function generatePostImage({
  postId,
  prompt,
  slug,
  examples,
}: GeneratePostImageParams): Promise<string> {
  logger.info({
    message: 'Generating post image',
    prompt,
    slug,
  });

  const image = await generateImage({
    model: openai.image('gpt-image-1'),
    prompt,
    size: '1536x1024',
  });

  const extension = mimeTypes.extension(image.image.mediaType);
  const s3Key = `posts/${postId}/${slug}.${extension}`;

  logger.info({
    message: 'Uploading post image to S3',
    s3Key,
    contentType: image.image.mediaType,
  });

  const imageBuffer = Buffer.from(image.image.base64, 'base64');

  const publicUrl = await uploadToS3({
    key: s3Key,
    body: imageBuffer,
    contentType: image.image.mediaType,
    assetsUrl: 'https://assets.postpix.ai',
  });

  return publicUrl;
}

function getSuggestPostBannerAndSectionImagesSystemPrompt(
  idealNoOfSectionImages: number,
) {
  return `You are an expert content strategist and visual designer specializing in creating compelling blog post imagery. Your task is to generate a banner image and ${idealNoOfSectionImages} section images that perfectly complement the provided blog post content.

## Banner Image Requirements:
- Must include the blog post title as prominent text overlay
- Should capture the main theme and emotional appeal of the content
- Use vibrant, eye-catching colors that align with the topic
- Ensure high visual impact for social media sharing
- Maintain professional yet engaging aesthetic
- Ghibli-inspired artistic style with soft, dreamy aesthetics

## Section Images Requirements:
- Each image should illustrate a specific section or key point from the content
- Vary the visual style while maintaining consistency with the overall theme
- Focus on practical, relatable scenarios that readers can identify with
- Ensure images support the text content rather than distract from it

## Technical Specifications:
For each image, provide:
- "alt": SEO-optimized alt text (60-125 characters) that describes the image content and includes relevant keywords
- "slug": SEO-friendly filename in kebab-case format (e.g., "family-health-insurance-comparison-kenya")
- "url": Asset URL in format: "https://assets.postpix.ai/posts/{postId}/{slug}.png"
- "placement": Precise placement instruction (e.g., "After the 'Understanding NHIF Benefits' section" or "Before the 'Cost Comparison Table'")
- "prompt": Detailed text-to-image prompt specifying:
  * Ghibli-inspired artistic style with soft, dreamy aesthetics
  * Specific color palette and mood
  * Key visual elements and composition
  * Text overlay requirements (for banner)
  * Cultural context and relevance. Inclusive representation appropriate for the target audience e.g. if post is about the tech community in Uganda, the people should be of Ugandan descent.

## Style Guidelines:
- Embrace Studio Ghibli's signature style: soft lighting, natural elements, emotional storytelling
- Use warm, inviting color palettes for family/health topics
- Incorporate cultural elements relevant to the target audience
- Ensure accessibility and inclusivity in visual representation

Return the response in valid JSON format.`;
}

function getUpdateMarkdownSystemPrompt(idealNoOfSectionImages: number) {
  return `You are a professional content editor and markdown specialist. Your task is to seamlessly integrate ${idealNoOfSectionImages} section images and 1 banner image into a blog post's markdown content.

## Integration Guidelines:

### Banner Image Placement:
- Insert at the very top of the post, before any headings
- Use proper markdown image syntax: ![alt text](url)
- Ensure it serves as a compelling visual introduction

### Section Images Placement:
- Follow the exact "placement" instructions from the metadata
- Place images strategically to break up text and enhance readability
- Maintain logical flow and visual hierarchy
- Use proper markdown image syntax with descriptive alt text

## Technical Requirements:
- Preserve all existing markdown formatting and structure
- Only add or update image tags as specified
- Maintain proper spacing around images (blank lines before and after)
- Ensure all image URLs are correctly formatted
- Preserve any existing images unless they conflict with new placements

## Content Flow Considerations:
- Images should enhance, not interrupt, the reading experience
- Maintain consistent spacing and formatting throughout
- Ensure images support the surrounding text content
- Consider mobile readability and responsive design

## Output Format:
Return ONLY the updated markdown content without any additional formatting, code blocks, or explanatory text. The response should be ready for immediate use in the blog post.`;
}

function getSuggestPostBannerAndSectionImagesUserPrompt({
  postContent,
  postId,
}: {
  postContent: string;
  postId: string;
}) {
  return `Post ID: ${postId}
  
Post Content:
\`\`\`markdown
${postContent}
\`\`\`
`;
}

function getUpdateMarkdownUserPrompt({
  markdown,
  metadata,
}: {
  markdown: string;
  metadata: PostMetadata;
}) {
  return `Markdown: 
\`\`\`markdown
${markdown}
\`\`\`
  
Metadata:
\`\`\`json
${JSON.stringify(metadata)}
\`\`\`
`;
}

const bannerExamples: Map<string, string> = new Map([
  [
    `Banner for "
Best Family Medical Cover in Kenya (2025): Compare Top Health Plans for Real-Life Needs" blog post featuring a happy family comparing health plans, highlighting NHIF acceptance in Kenya.`,
    'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  ],
  [
    'Banner for "How to start a youtube channel for kids" blog post.',
    'how-to-start-a-youtube-channel-for-kids.webp',
  ],
  [
    'Banner for "Family conversation on the porch" blog post. The banner features an illustration of a man and woman sitting together on a porch, discussing family dignity and the importance of conversations about care, love, independence, and peace of mind.',
    'family-conversation-porch-illustration.jpg',
  ],
]);

const sectionsImagesExamples: Map<string, string> = new Map([
  [
    `Banner for "
Best Family Medical Cover in Kenya (2025): Compare Top Health Plans for Real-Life Needs" blog post featuring a happy family comparing health plans, highlighting NHIF acceptance in Kenya.`,
    'concerned-mother-phone-sick-child.jpg',
  ],
  ['', 'registration-payment-infographic.png'],
  ['', 'healthcare-costs-comparison-nhif-sha.png'],
]);
