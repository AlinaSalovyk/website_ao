import type { Core } from '@strapi/strapi';

/**
 * Upload plugin configuration.
 *
 * Strategy Pattern — selects the upload provider based on environment:
 *  - Local dev  → local filesystem (default, no config needed)
 *  - Production → Cloudinary (CLOUDINARY_NAME is set)
 *
 * Cloudinary credentials must be set in environment variables on Railway:
 *   CLOUDINARY_NAME   — your cloud name
 *   CLOUDINARY_KEY    — API key
 *   CLOUDINARY_SECRET — API secret
 */
const config = ({ env }: Core.Config.Shared.ConfigParams) => {
  const cloudinaryName = env('CLOUDINARY_NAME', '');

  // Only activate Cloudinary when credentials are present in the environment.
  // Locally, Strapi falls back to the built-in local provider automatically.
  const uploadProvider = cloudinaryName
    ? {
        provider: 'cloudinary',
        providerOptions: {
          cloud_name: cloudinaryName,
          api_key: env('CLOUDINARY_KEY', ''),
          api_secret: env('CLOUDINARY_SECRET', ''),
        },
        actionOptions: {
          // Apply transformations on upload to normalise images
          upload: {
            folder: env('CLOUDINARY_FOLDER', 'website_ao'),
            quality: 'auto',
            fetch_format: 'auto',
          },
          uploadStream: { folder: env('CLOUDINARY_FOLDER', 'website_ao') },
          delete: {},
        },
      }
    : {
        // Local provider — serves files from /public/uploads/
        provider: 'local',
        providerOptions: {
          sizeLimit: 10 * 1024 * 1024, // 10 MB
        },
      };

  return {
    upload: {
      config: uploadProvider,
    },
  };
};

export default config;
