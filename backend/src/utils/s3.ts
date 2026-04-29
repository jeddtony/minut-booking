import { randomUUID } from 'crypto';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AWS_REGION, AWS_S3_BUCKET } from '@config';

const s3Client = new S3Client({ region: AWS_REGION });

/** Upload a file to S3 and return the object key (stored in DB). */
export const uploadToS3 = async (file: Express.Multer.File): Promise<string> => {
  const ext = file.originalname.split('.').pop();
  const key = `rental-units/${randomUUID()}.${ext}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: AWS_S3_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }),
  );

  return key;
};

/** Generate a presigned GET URL for a stored object key (expires in 1 hour). */
export const getPresignedUrl = async (key: string): Promise<string> => {
  const command = new GetObjectCommand({ Bucket: AWS_S3_BUCKET, Key: key });
  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
};
