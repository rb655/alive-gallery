import {
  getOriginalImage,
  getOriginalThumbnail,
  getOriginalVideo,
  getPreviewImage,
  getPreviewThumbnail,
  getProcessedImage,
  getProcessedThumbnail,
  getProcessedVideo,
} from "@/helper/urlCreationHandler";
import { GalleryItem } from "@/types/types";
import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const Loader = require("../assets/gifs/loading.gif");

type ComponentProps = {
  src: string;
  currentIndex: number;
  index: number;
  style?: object;
};

/**
 * Image component used inside RenderMedia.
 *
 * React.memo is NOT needed here because the parent (RenderMedia)
 * is already memoized and controls when children re-render.
 *
 * This keeps the render tree small and prevents unnecessary
 * component comparisons.
 */
const ImageComponent = ({
  src,
  style,
  currentIndex,
  index,
}: ComponentProps) => {
  /**
   * Memoizing URL generation prevents recalculating URLs
   * on every render. This avoids unnecessary string creation
   */
  const urls = useMemo(
    () => ({
      processed: getProcessedImage(src),
      original: getOriginalImage(src),
      preview: getPreviewImage(src),
    }),
    [src],
  );

  const [imageSrc, setImageSrc] = useState(urls.preview);

  // Sync when src changes (recycled list cell)
  useEffect(() => {
    setImageSrc(urls.preview);
  }, [urls]);

  /**
   * Memoized error handler to prevent new function
   * creation on every render.
   *
   * Reduces unnecessary updates in the Image component.
   */
  const handleError = useCallback(() => {
    setImageSrc((current) => {
      if (current === urls.preview) return urls.processed;
      if (current === urls.processed) return urls.original;
      return current;
    });
  }, [urls]);

  /**
   * Used to determine loading priority.
   *
   * Visible media receives higher priority
   * to ensure faster decoding and rendering.
   */
  const isVisible = index === currentIndex;

  return (
    <View style={[styles.container, style]}>
      <Image
        source={{ uri: imageSrc }}
        placeholder={Loader}
        onError={handleError}
        contentFit="cover"
        style={styles.fillStyle}
        transition={300} //Smooth transition avoids visual flicker when switching from placeholder to image.
        cachePolicy={"memory-disk"} //Enables memory + disk caching.
        priority={isVisible ? "high" : "low"} // Prioritizes visible media for decoding.
      />
    </View>
  );
};

/**
 * Video component used inside RenderMedia.
 *
 * Same as Image component React.memo is NOT needed here because the parent (RenderMedia)
 * is already memoized and controls when children re-render.
 *
 * This keeps the render tree small and prevents unnecessary
 * component comparisons.
 */
const VideoComponent = ({
  src,
  index,
  currentIndex,
  style,
}: ComponentProps) => {
  /**
   * Memoizing all media URLs prevents recalculation
   * during re-renders and keeps object references stable.
   */
  const urls = useMemo(
    () => ({
      processed: getProcessedVideo(src),
      original: getOriginalVideo(src),
      previewThumb: getPreviewThumbnail(src),
      processedThumb: getProcessedThumbnail(src),
      originalThumb: getOriginalThumbnail(src),
    }),
    [src],
  );

  const [videoSrc, setVideoSrc] = useState(urls.processed);
  const [poster, setPoster] = useState(urls.previewThumb);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [showRetry, setShowRetry] = useState(false);

  // Sync when src changes (recycled list cell)
  useEffect(() => {
    setVideoSrc(urls.processed);
    setPoster(urls.previewThumb);
    setIsVideoReady(false);
    setShowRetry(false);
  }, [urls]);

  /**
   * Video player instance.
   */
  const player = useVideoPlayer({ uri: videoSrc }, (p) => {
    p.loop = true;
  });

  const isVisible = index === currentIndex;

  /**
   * Pause videos when not visible.
   *
   * Prevents multiple videos running
   * which would heavily impact scroll performance.
   */
  useEffect(() => {
    if (!isVisible) {
      player.pause();
    }
  }, [isVisible, player]);

  // Status listener for readiness & errors
  useEffect(() => {
    const subscription = player.addListener("statusChange", (status) => {
      if (status.status === "readyToPlay") {
        setIsVideoReady(true);
      }

      if (status.error) {
        setVideoSrc((current) => {
          if (current === urls.processed) {
            return urls.original;
          }

          /**
           * If both sources fail, show retry UI
           * instead of continuously retrying.
           */
          setShowRetry(true);
          return current;
        });
      }
    });

    return () => subscription.remove();
  }, [player, urls]);

  /**
   * Memoized thumbnail fallback logic.
   *
   * Prevents unnecessary re-renders caused
   * by new callback instances.
   */
  const handlePosterError = useCallback(() => {
    setPoster((current) => {
      if (current === urls.previewThumb) return urls.processedThumb;
      if (current === urls.processedThumb) return urls.originalThumb;
      return current;
    });
  }, [urls]);

  /**
   * Retry handler resets video state
   * without remounting the component.
   */
  const handleRetry = useCallback(() => {
    setShowRetry(false);
    setIsVideoReady(false);
    setVideoSrc(urls.processed);
  }, [urls.processed]);

  return (
    <View style={[styles.container, style]}>
      <VideoView
        player={player}
        style={styles.fillStyle}
        contentFit="cover"
        nativeControls
        fullscreenOptions={{ enable: true }}
      />

      {/* Thumbnail shown until video is ready */}
      {!isVideoReady && (
        <Image
          source={{ uri: poster }}
          onError={handlePosterError}
          style={styles.absoluteFill}
          contentFit="cover"
          cachePolicy="memory" // Memory cache only because thumbnails ar short lived
          placeholder={Loader}
        />
      )}

      {/* Retry overlay */}
      {showRetry && (
        <TouchableOpacity
          onPress={handleRetry}
          style={styles.retryOverlay}
          activeOpacity={0.8}
        >
          <View style={styles.retryButton}>
            <Text style={styles.retryText}>Tap to retry</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

/**
 * Memoized RenderMedia component.
 *
 * Prevents unnecessary re-renders of media components
 * when FlatList updates unrelated items.
 *
 * Only pages transitioning between:
 * • visible → invisible
 * • invisible → visible
 *
 * are allowed to re-render.
 */
export const RenderMedia = React.memo(
  ({
    item,
    currentIndex,
    index,
  }: {
    item: GalleryItem;
    currentIndex: number;
    index: number;
  }) => {
    if (item.type === "video") {
      return (
        <VideoComponent
          src={item.src}
          index={index}
          currentIndex={currentIndex}
        />
      );
    }
    return (
      <ImageComponent
        src={item.src}
        index={index}
        currentIndex={currentIndex}
      />
    );
  },

  /**
   * Custom comparison prevents re-rendering
   * unless the visibility state of the page changes.
   *
   * This dramatically reduces render cost when
   * scrolling large paginated lists.
   */
  (prev, next) => {
    const wasVisible = prev.index === prev.currentIndex;
    const isVisible = next.index === next.currentIndex;
    return wasVisible === isVisible;
  },
);

RenderMedia.displayName = "RenderMedia";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111",
  },
  fillStyle: {
    flex: 1,
  },
  absoluteFill: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  retryOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.7)",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  retryText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});
