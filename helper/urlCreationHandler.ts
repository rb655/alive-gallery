const CDN_BASE = process.env.EXPO_PUBLIC_CDN_BASE;
const PROCESSED_MOBILE_PREFIX = "/processed/mobile/";
const PREVIEW_PREFIX = "/processed/preview/";

export const getProcessedImage = (src: string) =>
  `${CDN_BASE}${PROCESSED_MOBILE_PREFIX}${src}`;
export const getOriginalImage = (src: string) => `${CDN_BASE}/${src}`;
export const getPreviewImage = (src: string) =>
  `${CDN_BASE}${PREVIEW_PREFIX}${src}`;

export const getProcessedVideo = (src: string) =>
  `${CDN_BASE}${PROCESSED_MOBILE_PREFIX}${src}`;
export const getOriginalVideo = (src: string) => `${CDN_BASE}/${src}`;

export const getPreviewThumbnail = (src: string) =>
  `${CDN_BASE}${PREVIEW_PREFIX}${src}.webp`;
export const getProcessedThumbnail = (src: string) =>
  `${CDN_BASE}${PROCESSED_MOBILE_PREFIX}${src}.webp`;
export const getOriginalThumbnail = (src: string) => `${CDN_BASE}/${src}.webp`;
