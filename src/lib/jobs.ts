import { SHARE_ENV, Worker } from 'worker_threads';

import { supabase } from './supabase.js';
import { IS_PROD } from './constants.js';
import { Tables } from './db-types.js';
import { logger } from './logger.js';
import { generateText } from './ai/chat/completion.js';
import {
  suggestPostBannerAndSectionImages,
  updateMarkdownWithImagePlacements,
  PostMetadata,
  generatePostBannerImage,
  generatePostSectionImage,
} from './image-generation/image-generation.js';

const POLLING_INTERVAL = 10_000;

export class Jobs {
  private jobs: Map<string, Worker>;
  private maxWorkers: number;
  private cmdFile: string;

  constructor({
    maxWorkers,
    cmdFile,
  }: {
    maxWorkers: number;
    cmdFile: string;
  }) {
    this.jobs = new Map();
    this.maxWorkers = maxWorkers;
    this.cmdFile = cmdFile;
  }

  async run() {
    while (true) {
      await this._run();
      await new Promise((resolve) => setTimeout(resolve, POLLING_INTERVAL));
    }
  }

  private async _run() {
    console.log('Running jobs');

    console.log('Checking for available worker slots');
    const noOfAvailableWorkerSlots = this.maxWorkers - this.jobs.size;
    if (noOfAvailableWorkerSlots <= 0) {
      console.log('No available worker slots, skipping');
      return;
    }
    console.log(`Found ${noOfAvailableWorkerSlots} available workers`);

    console.log('Getting posts to process');

    const currentJobIds = Array.from(this.jobs.keys());
    let query = supabase
      .from('post')
      .select('*')
      .or('status.eq.init,status.eq.sub-processed');

    if (currentJobIds.length > 0) {
      query = query.not('id', 'in', `(${currentJobIds.join(',')})`);
    }

    query = query.limit(noOfAvailableWorkerSlots);

    const { data, error } = await query;
    if (error) {
      throw error;
    }

    if (data.length === 0) {
      console.log('No posts to process, skipping');
      return;
    }

    // Create workers sequentially to avoid pipe conflicts
    for (const post of data) {
      console.log(`Creating worker for post ${post.id}`);

      try {
        let worker: Worker;

        if (IS_PROD) {
          worker = new Worker(this.cmdFile, {
            env: SHARE_ENV,
            argv: [post.id],
            workerData: {
              postId: post.id,
            },
          });
        } else {
          const tsx = new URL(import.meta.resolve('tsx/cli'));
          worker = new Worker(tsx, {
            env: SHARE_ENV,
            argv: [this.cmdFile, post.id],
            workerData: {
              postId: post.id,
            },
          });
        }

        // Set up worker event handlers before adding to jobs map
        worker.on('message', (result) => {
          console.log(`Result from worker ${post.id}:`, result);
        });

        worker.on('error', (err) => {
          console.error(`Worker ${post.id} error:`, err);
          this.jobs.delete(post.id);
        });

        worker.on('exit', async (code) => {
          console.log(`Worker ${post.id} exited with code ${code}`);
          this.jobs.delete(post.id);
        });

        // Only add to jobs map after successful creation and setup
        this.jobs.set(post.id, worker);

        // Add a small delay between worker creation to prevent pipe conflicts
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (err) {
        console.error(`Failed to create worker for post ${post.id}:`, err);
        // Don't add to jobs map if creation failed
      }
    }
  }
}

export class Job {
  private post: Tables<'post'>;

  constructor({ post }: { post: Tables<'post'> }) {
    this.post = post;
  }

  static async fromId(postId: string) {
    const { data, error } = await supabase
      .from('post')
      .select('*')
      .eq('id', postId);
    if (error) {
      throw error;
    }
    const posts: Tables<'post'>[] = data;
    const post = posts[0];
    return new Job({
      post,
    });
  }

  async run() {
    logger.info('running job');

    switch (this.post.status) {
      case 'init': {
        await this.initialize();

        const job = await Job.fromId(this.post.id);
        await job.process();

        break;
      }

      case 'sub-processed':
        await this.process();
    }
  }

  async initialize() {
    logger.info('generating title and metadata');

    const metadata = await this.generateBannerAndSectionImages();

    logger.info('updating content');
    const updatedContent = await this.updateContent(metadata);

    logger.info('updating post');
    await supabase
      .from('post')
      .update({
        metadata,
        updated_content: updatedContent,
        updated_at: new Date().toISOString(),
        status: 'sub-processed',
      })
      .eq('id', this.post.id);
  }

  async process() {
    logger.info('processing');

    const metadata = this.post.metadata as PostMetadata;

    const banner = metadata.banner;
    const sectionImages = metadata.sectionImages || [];

    const images: {
      type: 'banner' | 'section';
      slug: string;
      prompt: string;
      url: string;
    }[] = [
      {
        type: 'banner',
        slug: banner.slug,
        prompt: banner.prompt,
        url: banner.url,
      },
      ...sectionImages.map((sectionImage) => ({
        type: 'section' as const,
        slug: sectionImage.slug,
        prompt: sectionImage.prompt,
        url: sectionImage.url,
      })),
    ];

    const postImages = await Promise.all(
      images.map(async (image) => {
        const { data: getPostData, error } = await supabase
          .from('post_image')
          .select('*')
          .eq('user_id', this.post.user_id)
          .eq('post_id', this.post.id)
          .eq('slug', image.slug);
        let postImage: Tables<'post_image'> = getPostData?.[0];
        if (!getPostData?.length) {
          const { data: postImageData, error: postImageError } = await supabase
            .from('post_image')
            .upsert({
              post_id: this.post.id,
              user_id: this.post.user_id,
              type: image.type,
              slug: image.slug,
              prompt: image.prompt,
              url: image.url,
            })
            .select('*');
          if (postImageError) {
            throw postImageError;
          }
          postImage = postImageData?.[0];
        }
        return postImage;
      }),
    );

    await Promise.all(
      postImages.map(async (image) => {
        if (image.type === 'banner') {
          await generatePostBannerImage({
            postId: this.post.id,
            prompt: image.prompt,
            slug: image.slug,
          });
        } else {
          await generatePostSectionImage({
            postId: this.post.id,
            prompt: image.prompt,
            slug: image.slug,
          });
        }

        const { error } = await supabase
          .from('post_image')
          .update({
            processed: true,
          })
          .eq('id', image.id);
        if (error) {
          throw error;
        }
      }),
    );

    await supabase
      .from('post')
      .update({
        updated_at: new Date().toISOString(),
        status: 'processed',
      })
      .eq('id', this.post.id);
  }

  async generateBannerAndSectionImages() {
    logger.info('generating banner and section images');
    const metadata = await suggestPostBannerAndSectionImages({
      idealNoOfSectionImages: this.post.ideal_no_of_section_images,
      postContent: this.post.content,
      postId: this.post.id,
    });
    logger.info('generated banner and section images');
    return metadata;
  }

  async updateContent(metadata: PostMetadata) {
    logger.info('updating content');
    const updatedContent = await updateMarkdownWithImagePlacements({
      markdown: this.post.content,
      metadata,
      idealNoOfSectionImages: this.post.ideal_no_of_section_images,
    });
    logger.info('updated content');
    return updatedContent;
  }
}
