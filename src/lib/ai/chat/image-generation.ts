import { generateText } from './completion.js';

export async function getImageSEOFilenameAndAltText(base64Image: string) {
  const alt = await generateText({
    systemPrompt:
      'You are a helpful assistant that generates SEO-friendly filenames from files. Output only the filename, no other text.',
    examples: new Map(),
    // userPrompt: [
    //   {
    //     type: 'text',
    //     text: 'Provide a concise seo "alt" text for this image.',
    //   },
    //   {
    //     type: 'image_url',
    //     image_url: {
    //       url: base64Image,
    //     },
    //   },
    // ],
    userPrompt: [
      {
        type: 'text',
        text: 'Provide a concise seo "alt" text for this image.',
      },
      {
        type: 'image',
        image: base64Image,
        // // OpenAI specific options - image detail:
        // providerOptions: {
        //   openai: { imageDetail: 'auto' },
        // },
      },
    ],
  });

  const filename = await generateText({
    systemPrompt:
      'You are a helpful assistant that generates SEO-friendly filenames from file descriptions. Generate a concise SEO-friendly filename (use hyphens, lowercase, max 5 words, include extension (.png, .jpg etc)). Output only the filename, no other text.',
    examples: new Map(),
    userPrompt: alt,
  });

  return {
    filename,
    alt,
  };
}

export async function imageToBase64(buffer: Buffer, extension: string) {
  return `data:image/${extension.slice(1)};base64,${Buffer.from(
    buffer,
  ).toString('base64')}`;
}
