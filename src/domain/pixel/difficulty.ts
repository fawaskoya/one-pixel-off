import type { DifficultyTier, GridSize, MutationKind } from "./types";

export type PixelDifficultyConfiguration = Readonly<{
  gridSizes: readonly GridSize[];
  magnitudes: Readonly<Record<MutationKind, readonly number[]>>;
}>;

function difficultyConfiguration(
  gridSizes: readonly GridSize[],
  geometryMagnitudes: readonly number[],
  strokeMagnitudes: readonly number[],
  rotationMagnitudes: readonly number[],
): PixelDifficultyConfiguration {
  return {
    gridSizes,
    magnitudes: {
      offset: geometryMagnitudes,
      size: geometryMagnitudes,
      spacing: geometryMagnitudes,
      stroke: strokeMagnitudes,
      rotation: rotationMagnitudes,
    },
  };
}

/**
 * Perceptual difficulty policy for generation version 2.
 *
 * Geometry uses view-box units, stroke uses non-scaling CSS-pixel-like units,
 * and rotation uses degrees. Keeping separate bands prevents a numerically
 * nonzero mutation from becoming effectively invisible on a dense phone grid.
 */
export const PIXEL_DIFFICULTY_CONFIG: Readonly<
  Record<DifficultyTier, PixelDifficultyConfiguration>
> = {
  beginner: difficultyConfiguration([4], [8, 10, 12], [3, 4], [10, 12]),
  steady: difficultyConfiguration([4, 5], [6, 7, 8], [2, 3], [8, 9]),
  tricky: difficultyConfiguration([5], [5, 6], [2, 3], [7, 8]),
  expert: difficultyConfiguration([6], [5, 6], [2], [7, 8]),
};

export function isPixelMutationMagnitudeAllowed(
  difficulty: unknown,
  kind: unknown,
  delta: unknown,
): boolean {
  if (
    typeof difficulty !== "string" ||
    typeof kind !== "string" ||
    typeof delta !== "number" ||
    !Number.isInteger(delta)
  ) {
    return false;
  }

  const configuration = (
    PIXEL_DIFFICULTY_CONFIG as Readonly<
      Partial<Record<string, PixelDifficultyConfiguration>>
    >
  )[difficulty];
  const magnitudes = configuration?.magnitudes[
    kind as MutationKind
  ] as readonly number[] | undefined;

  return magnitudes?.includes(Math.abs(delta)) ?? false;
}
