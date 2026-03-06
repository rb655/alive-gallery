import { PageLayout } from "@/types/types";
import { Image } from "expo-image";
import {
  getPreviewImage,
  getPreviewThumbnail,
  getProcessedImage,
  getProcessedThumbnail,
} from "./urlCreationHandler";

/**
 * Maximum number of URLs to track in the prefetch cache set.
 * Once the limit is reached the oldest 20% of entries are evicted
 * so the Set doesn't grow unbounded over a long session.
 */
const MAX_CACHE_SIZE = 300;
const EVICTION_BATCH = Math.floor(MAX_CACHE_SIZE * 0.2); // 60 entries

const prefetchedUrls = new Set<string>();

const safePrefetch = (url: string): void => {
  if (prefetchedUrls.has(url)) return; // already prefetched — skip

  // Evict oldest entries when the set is at capacity
  if (prefetchedUrls.size >= MAX_CACHE_SIZE) {
    let evicted = 0;
    for (const key of prefetchedUrls) {
      prefetchedUrls.delete(key);
      if (++evicted >= EVICTION_BATCH) break;
    }
  }

  prefetchedUrls.add(url);
  Image.prefetch(url, "memory-disk");
};

const prefetchImage = (src: string) => {
  safePrefetch(getProcessedImage(src));
  safePrefetch(getPreviewImage(src));
};

const prefetchVideo = (src: string) => {
  safePrefetch(getPreviewThumbnail(src));
  safePrefetch(getProcessedThumbnail(src));
};

export const prefetchItem = (item: PageLayout): void => {
  Object.values(item).forEach((galleryItem) => {
    if (galleryItem.type === "video") {
      prefetchVideo(galleryItem.src);
    } else {
      prefetchImage(galleryItem.src);
    }
  });
};
