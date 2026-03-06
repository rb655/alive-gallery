import { createPageLayout } from "@/helper/dataHandler";
import { prefetchItem } from "@/helper/preFetchHandler";
import { PageLayout } from "@/types/types";
import { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, useWindowDimensions, ViewToken } from "react-native";
import {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

export const useHomePage = () => {
  const [pageData, setPageData] = useState<PageLayout[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const { width } = useWindowDimensions();
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetchRes = await fetch(
          process.env.EXPO_PUBLIC_GALLERY_API_ENDPOINT!,
        );
        const galleryData = await fetchRes.json();
        if (!galleryData || !galleryData.data) {
          return;
        }
        const pageData = createPageLayout(galleryData.data.gallery);
        setPageData(pageData);
        // Prefetch the very first page immediately so there's no cold-start flicker
        if (pageData[0]) prefetchItem(pageData[0]);
        if (pageData[1]) prefetchItem(pageData[1]);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const hintOpacity = useSharedValue(1);
  const hintTranslateX = useSharedValue(0);
  const hasInteracted = useRef(false);

  const hideHint = useCallback(() => {
    cancelAnimation(hintTranslateX);
    hintOpacity.value = withTiming(0, { duration: 250 });
  }, [hintOpacity, hintTranslateX]);

  useEffect(() => {
    if (currentIndex === 0 && !hasInteracted.current) {
      hintOpacity.value = withTiming(1, { duration: 300 });
      hintTranslateX.value = withRepeat(
        withSequence(
          withTiming(8, { duration: 500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 500, easing: Easing.inOut(Easing.ease) }),
          withDelay(1400, withTiming(0, { duration: 0 })),
        ),
        -1,
      );
    } else {
      hideHint();
    }
  }, [currentIndex, hideHint, hintOpacity, hintTranslateX]);

  const handleNudgePress = useCallback(() => {
    hasInteracted.current = true;
    hideHint();
    flatListRef.current?.scrollToIndex({ index: 1, animated: true });
  }, [hideHint]);

  const hintAnimatedStyle = useAnimatedStyle(() => ({
    opacity: hintOpacity.value,
    transform: [{ translateX: hintTranslateX.value }],
  }));

  const onViewableItemsChanged = useCallback(
    ({
      viewableItems,
    }: {
      viewableItems: ViewToken<PageLayout>[];
      changed: ViewToken<PageLayout>[];
    }) => {
      if (viewableItems.length === 0) return;

      const index = viewableItems[0].index ?? 0;
      setCurrentIndex(index);

      // Prefetch 2 pages ahead for smooth forward scrolling
      if (pageData[index + 1]) prefetchItem(pageData[index + 1]);
      if (pageData[index + 2]) prefetchItem(pageData[index + 2]);

      // Prefetch 1 page behind for back-scroll
      if (pageData[index - 1]) prefetchItem(pageData[index - 1]);
    },
    [pageData], // re-memoize only if items array reference changes
  );

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
    waitForInteraction: false,
  }).current;

  const getItemLayout = useCallback(
    (data: ArrayLike<PageLayout> | null | undefined, index: number) => {
      return {
        length: width,
        offset: width * index,
        index,
      };
    },
    [width],
  );

  return {
    pageData,
    isLoading,
    currentIndex,
    onViewableItemsChanged,
    viewabilityConfig,
    getItemLayout,
    flatListRef,
    hintAnimatedStyle,
    handleNudgePress,
  };
};
