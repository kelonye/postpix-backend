import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

import { logger } from './logger.js';

const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = process.env;

if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
  throw new Error('AWS credentials are not configured');
}

const s3Client = new S3Client({
  region: 'us-east-1',
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

export async function uploadToS3({
  key,
  body,
  contentType,
  assetsUrl,
}: {
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
  assetsUrl: string;
}): Promise<string> {
  const { S3_BUCKET } = process.env;

  if (!S3_BUCKET) {
    throw new Error('S3_BUCKET is not configured');
  }

  logger.info({
    message: 'Uploading file to S3',
    bucket: S3_BUCKET,
    key,
    contentType,
    size: body.length,
  });

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
  });

  try {
    await s3Client.send(command);

    // Note: The bucket must be configured for public read access for this URL to work
    // If the bucket is private, you'll need to generate signed URLs or use CloudFront
    const publicUrl = `${assetsUrl}/${key}`;

    logger.info({
      message: 'Successfully uploaded file to S3',
      url: publicUrl,
    });

    return publicUrl;
  } catch (error) {
    logger.error({
      message: 'Failed to upload file to S3',
      error,
      bucket: S3_BUCKET,
      key,
    });
    throw error;
  }
}
