import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';
initOpenNextCloudflareForDev();

export default { images: { loader: 'custom', loaderFile: './lib/imageLoader.ts' } };
