import { Dimensions, PixelRatio } from "react-native";

/**
 * The height of the screen
 */
export const { height, width } = Dimensions.get("window");

/**
 * The base width of the screen
 */
const guidelineBaseWidth = 390;

/**
 * The base height of the screen
 */
const guidelineBaseHeight = 844;

/**
 * The base diagonal size of the screen
 */
const guidelineBaseDiagonal = Math.sqrt(
  guidelineBaseWidth ** 2 + guidelineBaseHeight ** 2,
);

/**
 * The current diagonal size of the screen
 */
const currentDiagonal = Math.sqrt(width ** 2 + height ** 2);

/**
 * Scales a size based on the screen size
 * @param size - The size to scale
 * @returns The scaled size
 */
export const scale = (size: number) => {
  return Math.ceil((currentDiagonal / guidelineBaseDiagonal) * size);
};

/**
 * Scales a font size based on the screen size
 * @param size - The font size to scale
 * @returns The scaled font size
 */
const scaleFont = Math.min(
  width / guidelineBaseWidth,
  height / guidelineBaseHeight,
);

/**
 * Normalizes a font size based on the screen size
 * @param size - The font size to normalize
 * @returns The normalized font size
 */
export function normalize(size: number) {
  const baseSize = size * scaleFont;
  return Math.round(PixelRatio.roundToNearestPixel(baseSize));
}
