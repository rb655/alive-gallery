export type GalleryItem = {
  _id: string;
  type: "image" | "video";
  src: string;
  alt?: string;
  aspectRatio?: number;
};

export type PageLayout = {
  left: GalleryItem;
  rightTop: GalleryItem;
  rightBottom: GalleryItem;
};
