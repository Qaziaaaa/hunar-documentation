import { v2 as cloudinary } from "cloudinary";
import type { StorageConfig } from '../../../config/s3.config';
import type { StorageClient } from './storage.interface';
export class CloudinaryStorage implements StorageClient {
    readonly driver = 'cloudinary' as const;

    constructor(config: StorageConfig) {
        cloudinary.config({
            cloud_name: config.cloudName,
            api_key: config.apiKey,
            api_secret: config.apiSecret,
        });
    }

    async put(
        key: string,
        data: Buffer,
        contentType: string,
    ): Promise<void> {
        const resourceType = this.getResourceType(contentType);

        await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    public_id: key.replace(/\.[^/.]+$/, ''),
                    resource_type: resourceType,
                },
                (error) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(undefined);
                    }
                },
            );

            uploadStream.end(data);
        });
    }

    async delete(key: string): Promise<void> {
        const publicId = key.replace(/\.[^/.]+$/, '');
        const resourceType = this.getResourceTypeFromKey(key);

        await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType,
        });
    }

    private getResourceType(
        contentType: string,
    ): 'image' | 'video' | 'raw' {
        if (contentType.startsWith('image/')) return 'image';
        if (contentType.startsWith('audio/')) return 'video';
        if (contentType.startsWith('video/')) return 'video';

        return 'raw';
    }

    getPublicUrl(key: string): string {
        const publicId = key.replace(/\.[^/.]+$/, '');

        return cloudinary.url(publicId, {
            secure: true,
            resource_type: this.getResourceTypeFromKey(key),
        });
    }

    private getResourceTypeFromKey(
        key: string,
    ): 'image' | 'video' | 'raw' {
        const extension = key.split('.').pop()?.toLowerCase();

        if (
            ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extension ?? '')
        ) {
            return 'image';
        }

        if (
            ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'mp4', 'mov', 'webm'].includes(
                extension ?? '',
            )
        ) {
            return 'video';
        }

        return 'raw';
    }
}