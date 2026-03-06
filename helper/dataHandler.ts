import { GalleryItem, PageLayout } from "@/types/types";

/**
 * Ideal video ratio (9:16).
 */
const PORTRAIT_VIDEO_RATIO = 0.5625;

/**
 * Sorting function to prioritize ideal videos first.
 *
 * Approach:
 * We measure how close each video's aspectRatio is to
 * the ideal ideal ratio (9:16 ≈ 0.5625).
 *
 * Smaller difference → better match → comes first.
 *
 * Important rule:
 * If aspect ratio is missing, we DO NOT reorder the items
 * to preserve the API order
 */
const sortByPortraitFirst = (a: GalleryItem, b: GalleryItem): number => {
  if (!a.aspectRatio || !b.aspectRatio) return 0;

  const aspectDifferenceA = Math.abs(a.aspectRatio - PORTRAIT_VIDEO_RATIO);
  const aspectDifferenceB = Math.abs(b.aspectRatio - PORTRAIT_VIDEO_RATIO);

  return aspectDifferenceA - aspectDifferenceB;
};

/**
 * Layout creation algorithm.
 *
 * Each page consumes exactly **3 media items**:
 * - 1 left item (prefer video)
 * - 2 right items (prefer images)
 *
 * Steps of the algorithm:
 *
 * 1. Separate images and videos
 *    - Preserves original API order
 *
 * 2. Sort videos so portrait-friendly videos come first
 *
 * 3. Use two pointers (imageIndex, videoIndex)
 *
 * 4. Build pages sequentially
 *
 * 5. Use fallbacks when one media type is exhausted
 *
 * Time Complexity:
 * - Filtering: O(N)
 * - Sorting videos: O(V log V)
 * - Page building: O(N)
 *
 * Total: O(N + V log V)
 *
 * Space Complexity:
 * O(N) for pages array.
 *
 * @param data All gallery items from API
 * @returns Array of page layouts used by UI
 */
export const createPageLayout = (data: GalleryItem[]): PageLayout[] => {
  const images = data.filter((item) => item.type === "image");
  const videos = data
    .filter((item) => item.type === "video")
    .sort(sortByPortraitFirst);

  const totalImages = images.length;
  const totalVideos = videos.length;

  let imageIndex = 0;
  let videoIndex = 0;

  const pages: PageLayout[] = [];

  /** Pull the next video, or fall back to an image if videos are exhausted. */
  const nextVideo = (): GalleryItem =>
    videoIndex < totalVideos ? videos[videoIndex++] : images[imageIndex++];

  /** Pull the next image, or fall back to a video if images are exhausted. */
  const nextImage = (): GalleryItem =>
    imageIndex < totalImages ? images[imageIndex++] : videos[videoIndex++];

  const totalPages = Math.floor(data.length / 3);

  for (let i = 0; i < totalPages; i++) {
    pages.push({
      left: nextVideo(),
      rightTop: nextImage(),
      rightBottom: nextImage(),
    });
  }

  return pages;
};
