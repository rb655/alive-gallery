import { RenderMedia } from "@/components/RenderMedia";
import { useHomePage } from "@/hooks/useHomePage";
import { PageLayout } from "@/types/types";
import { scale } from "@/utils/scale";
import React, { useCallback } from "react";
import {
  FlatList,
  ListRenderItem,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import Animated from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const EmptyList = () => (
  <View style={styles.emptyContainer}>
    <Text style={styles.emptyText}>No media available</Text>
  </View>
);

/**
 * Memoized page renderer.
 *
 * Each page contains multiple heavy components (images/videos).
 * React.memo prevents unnecessary re-renders while scrolling.
 *
 * Custom comparison ensures the page only re-renders when its
 * visibility state changes (visible ↔ not visible).
 *
 * This is important for:
 * • preventing video re-renders
 * • avoiding expensive media layout recalculation
 * • keeping scroll FPS smooth
 */
const RenderItem = React.memo(
  ({
    item,
    currentIndex,
    index,
  }: {
    item: PageLayout;
    currentIndex: number;
    index: number;
  }) => {
    const { height, width } = useWindowDimensions();

    return (
      <View style={[styles.pageContainer, { height, width }]}>
        <View style={styles.leftContainer}>
          <RenderMedia
            item={item.left}
            currentIndex={currentIndex}
            index={index}
          />
        </View>
        <View style={styles.rightContainer}>
          <View style={styles.rightItem}>
            <RenderMedia
              item={item.rightTop}
              currentIndex={currentIndex}
              index={index}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.rightItem}>
            <RenderMedia
              item={item.rightBottom}
              currentIndex={currentIndex}
              index={index}
            />
          </View>
        </View>
      </View>
    );
  },

  /**
   * Custom memo comparison
   *
   * Only trigger re-render when page visibility changes.
   *
   * Example:
   * Page 3 visible → becomes invisible → re-render
   * Page 3 invisible → becomes visible → re-render
   *
   * If both states remain same, skip render.
   *
   * This dramatically reduces renders during fast scrolling.
   */
  (prev, next) => {
    const wasVisible = prev.index === prev.currentIndex;
    const isVisible = next.index === next.currentIndex;
    return wasVisible === isVisible;
  },
);

RenderItem.displayName = "RenderItem";

export default function HomeScreen() {
  const {
    pageData,
    isLoading,
    currentIndex,
    onViewableItemsChanged,
    viewabilityConfig,
    getItemLayout,
    flatListRef,
    hintAnimatedStyle,
    handleNudgePress,
  } = useHomePage();

  /**
   * Memoized renderItem callback
   *
   * Prevents FlatList from receiving a new function reference
   * on every render which would otherwise trigger list updates.
   *
   * Dependency: currentIndex
   * Needed because visible page state affects media playback.
   */
  const renderItem: ListRenderItem<PageLayout> = useCallback(
    ({ item, index }) => (
      <RenderItem item={item} index={index} currentIndex={currentIndex} />
    ),
    [currentIndex],
  );

  /**
   * Stable key extractor
   *
   * Prevents unnecessary re-mounting of pages during updates.
   * Stable keys allow React to reuse existing views.
   */
  const keyExtractor = useCallback(
    (_: PageLayout, index: number) => `page-${index}`,
    [],
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={pageData}
        renderItem={renderItem}
        ListEmptyComponent={EmptyList}
        ref={flatListRef}
        // Horizontal paginated gallery layout
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        disableIntervalMomentum // Disable extra momentum to keep page snapping predictable
        decelerationRate={"fast"} // Faster deceleration improves snap behavior in paginated lists
        // Performance optimizations props
        keyExtractor={keyExtractor}
        windowSize={11} // Controls how many pages are kept mounted.
        maxToRenderPerBatch={3} // Limits render per batch
        initialNumToRender={1} // Only render the first page initially. Reduces initial load time for media-heavy screens
        removeClippedSubviews={true} // Unmount views outside the viewport, to reduce memory usage.
        updateCellsBatchingPeriod={16} // Controls render batching interval (in ms).
        getItemLayout={getItemLayout} // Skip runtime layout measurements, very helpful when item has fixed height/width
        onViewableItemsChanged={onViewableItemsChanged} // Tracks visible page index, used for prefetching and video autoplay.
        viewabilityConfig={viewabilityConfig}
        contentContainerStyle={styles.flatListContainer}
      />

      {/* Scroll hint shown only on first page */}
      {pageData.length > 1 && (
        <Animated.View
          style={[styles.scrollHint, hintAnimatedStyle]}
          pointerEvents={currentIndex === 0 ? "auto" : "none"}
        >
          <TouchableOpacity
            onPress={handleNudgePress}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <View style={styles.scrollHintPill}>
              <Text style={styles.scrollHintArrow}>›</Text>
              <Text style={styles.scrollHintLabel}>more</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  flatListContainer: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  loadingText: {
    fontSize: 18,
    color: "#fff",
  },
  pageContainer: {
    flexDirection: "row",
    padding: scale(8),
    gap: scale(5),
    backgroundColor: "#000",
  },
  leftContainer: {
    flex: 0.55,
    borderRadius: scale(12),
    overflow: "hidden",
    backgroundColor: "#111",
  },
  rightContainer: {
    flex: 0.45,
  },
  rightItem: {
    borderRadius: scale(12),
    overflow: "hidden",
    backgroundColor: "#111",
    flex: 1,
  },
  divider: {
    height: scale(5),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: scale(16),
    color: "#fff",
  },
  scrollHint: {
    position: "absolute",
    right: scale(12),
    top: "5%",
    zIndex: 10,
  },
  scrollHintPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    paddingHorizontal: scale(14),
    paddingVertical: scale(8),
    borderRadius: scale(20),
    backgroundColor: "rgba(0,0,0,0.5)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  scrollHintArrow: {
    color: "#fff",
    fontSize: scale(18),
    lineHeight: scale(20),
    fontWeight: "300",
  },
  scrollHintLabel: {
    color: "rgba(255,255,255,0.85)",
    fontSize: scale(13),
    fontWeight: "500",
    letterSpacing: 0.5,
  },
});
