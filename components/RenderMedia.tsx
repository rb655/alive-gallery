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

type ComponentProps = {
  src: string;
  currentIndex: number;
  index: number;
  style?: object;
};

const ImageComponent = ({
  src,
  style,
  currentIndex,
  index,
}: ComponentProps) => {
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

  const handleError = useCallback(() => {
    setImageSrc((current) => {
      if (current === urls.preview) return urls.processed;
      if (current === urls.processed) return urls.original;
      return current;
    });
  }, [urls]);

  const isVisible = index === currentIndex;

  return (
    <View style={[styles.container, style]}>
      <Image
        source={{ uri: imageSrc }}
        placeholder={require("../assets/gifs/loading.gif")}
        onError={handleError}
        contentFit="cover"
        style={styles.fillStyle}
        transition={300} // smooth fade from placeholder to image
        cachePolicy={"memory-disk"}
        priority={isVisible ? "high" : "low"}
      />
    </View>
  );
};

const VideoComponent = ({
  src,
  index,
  currentIndex,
  style,
}: ComponentProps) => {
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

  const player = useVideoPlayer({ uri: videoSrc }, (p) => {
    p.loop = true;
    p.muted = true;
  });

  const isVisible = index === currentIndex;

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
          setShowRetry(true);
          return current;
        });
      }
    });
    return () => subscription.remove();
  }, [player, urls]);

  const handlePosterError = useCallback(() => {
    setPoster((current) => {
      if (current === urls.previewThumb) return urls.processedThumb;
      if (current === urls.processedThumb) return urls.originalThumb;
      return current;
    });
  }, [urls]);

  const handleRetry = useCallback(() => {
    setShowRetry(false);
    setIsVideoReady(false);
    setVideoSrc(urls.processed);
  }, [urls.processed]);

  return (
    <View style={[styles.container, style]}>
      <VideoView player={player} style={styles.fillStyle} contentFit="cover" />

      {/* Thumbnail shown until video is ready */}
      {!isVideoReady && (
        <Image
          source={{ uri: poster }}
          onError={handlePosterError}
          style={styles.absoluteFill}
          contentFit="cover"
          cachePolicy="memory"
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
