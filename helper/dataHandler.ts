import { GalleryItem, PageLayout } from "@/types/types";

const PORTRAIT_VIDEO_RATIO = 0.5625;

const sortByPortraitFirst = (a: GalleryItem, b: GalleryItem): number => {
  if (!a.aspectRatio || !b.aspectRatio) return 0;
  const aspectDifferenceA = Math.abs(a.aspectRatio - PORTRAIT_VIDEO_RATIO);
  const aspectDifferenceB = Math.abs(b.aspectRatio - PORTRAIT_VIDEO_RATIO);
  return aspectDifferenceA - aspectDifferenceB;
};

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
