"use client";

import { memo, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import {
  PIXEL_PALETTES,
  type ColorRole,
  type PixelPuzzleDescriptor,
  type VectorGlyphDescriptor,
  type VectorPrimitive,
} from "@/domain/pixel";

type PuzzleBoardProps = Readonly<{
  puzzle: PixelPuzzleDescriptor;
  interactive: boolean;
  wrongCellIndexes?: readonly number[];
  revealTarget?: boolean;
  onCell?: (index: number) => void;
}>;

function colorForRole(
  role: ColorRole,
  palette: (typeof PIXEL_PALETTES)[number],
): string {
  if (role === "none") return "none";
  return palette[role];
}

function PrimitiveShape({
  primitive,
  palette,
}: Readonly<{
  primitive: VectorPrimitive;
  palette: (typeof PIXEL_PALETTES)[number];
}>) {
  const shared = {
    fill: colorForRole(primitive.fill, palette),
    stroke: colorForRole(primitive.stroke, palette),
    strokeWidth: primitive.strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    vectorEffect: "non-scaling-stroke" as const,
    transform:
      primitive.rotationDeg === 0
        ? undefined
        : `rotate(${primitive.rotationDeg} 50 50)`,
  };

  if (primitive.kind === "circle") {
    const [cx, cy, radius] = primitive.geometry;
    return <circle {...shared} cx={cx} cy={cy} r={radius} />;
  }
  if (primitive.kind === "rect") {
    const [x, y, width, height, radius] = primitive.geometry;
    return <rect {...shared} x={x} y={y} width={width} height={height} rx={radius} />;
  }
  if (primitive.kind === "line") {
    const [x1, y1, x2, y2] = primitive.geometry;
    return <line {...shared} x1={x1} y1={y1} x2={x2} y2={y2} />;
  }
  const points: string[] = [];
  for (let index = 0; index < primitive.geometry.length; index += 2) {
    points.push(`${primitive.geometry[index]},${primitive.geometry[index + 1]}`);
  }
  return <polygon {...shared} points={points.join(" ")} />;
}

const Glyph = memo(function Glyph({
  glyph,
  palette,
}: Readonly<{
  glyph: VectorGlyphDescriptor;
  palette: (typeof PIXEL_PALETTES)[number];
}>) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 100 100">
      {glyph.primitives.map((primitive, index) => (
        <PrimitiveShape
          key={`${primitive.kind}-${index}`}
          palette={palette}
          primitive={primitive}
        />
      ))}
    </svg>
  );
});

export function PuzzleBoard({
  puzzle,
  interactive,
  wrongCellIndexes = [],
  revealTarget = false,
  onCell,
}: PuzzleBoardProps) {
  const [focusedCellIndex, setFocusedCellIndex] = useState(0);
  const cellRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const palette =
    PIXEL_PALETTES.find((item) => item.id === puzzle.paletteId) ??
    PIXEL_PALETTES[0];
  const wrongIndexSet = new Set(wrongCellIndexes);
  const safeFocusedCellIndex = Math.min(
    Math.max(0, focusedCellIndex),
    puzzle.cells.length - 1,
  );
  const boardStyle = {
    "--puzzle-columns": puzzle.gridSize,
  } as CSSProperties;

  const moveGridFocus = (
    event: KeyboardEvent<HTMLButtonElement>,
    cellIndex: number,
  ) => {
    if (!interactive) return;
    const row = Math.floor(cellIndex / puzzle.gridSize);
    const column = cellIndex % puzzle.gridSize;
    let nextIndex: number | null = null;

    switch (event.key) {
      case "ArrowLeft":
        nextIndex = row * puzzle.gridSize + Math.max(0, column - 1);
        break;
      case "ArrowRight":
        nextIndex =
          row * puzzle.gridSize + Math.min(puzzle.gridSize - 1, column + 1);
        break;
      case "ArrowUp":
        nextIndex = Math.max(0, row - 1) * puzzle.gridSize + column;
        break;
      case "ArrowDown":
        nextIndex =
          Math.min(puzzle.gridSize - 1, row + 1) * puzzle.gridSize + column;
        break;
      case "Home":
        nextIndex = row * puzzle.gridSize;
        break;
      case "End":
        nextIndex = row * puzzle.gridSize + puzzle.gridSize - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    setFocusedCellIndex(nextIndex);
    cellRefs.current[nextIndex]?.focus();
  };

  return (
    <div className="puzzle-frame">
      <div
        aria-label={`${puzzle.gridSize} by ${puzzle.gridSize} pattern grid${
          interactive
            ? ". Use arrow keys to move between tiles."
            : ". Resolved answer review."
        }`}
        className="puzzle-board"
        role="group"
        style={boardStyle}
      >
        {puzzle.cells.map((cell) => (
          <button
            aria-label={`Tile ${cell.row + 1}, ${cell.column + 1}${
              revealTarget && cell.index === puzzle.targetIndex
                ? ", target anomaly"
                : wrongIndexSet.has(cell.index)
                  ? ", wrong choice"
                  : ""
            }`}
            className="puzzle-cell"
            data-target={
              revealTarget && cell.index === puzzle.targetIndex
                ? true
                : undefined
            }
            data-wrong={wrongIndexSet.has(cell.index) ? true : undefined}
            disabled={!interactive}
            key={cell.index}
            onClick={() => onCell?.(cell.index)}
            onFocus={() => setFocusedCellIndex(cell.index)}
            onKeyDown={(event) => moveGridFocus(event, cell.index)}
            ref={(element) => {
              cellRefs.current[cell.index] = element;
            }}
            style={
              {
                "--cell-background": palette.background,
                "--cell-foreground": palette.primary,
              } as CSSProperties
            }
            tabIndex={interactive && cell.index !== safeFocusedCellIndex ? -1 : undefined}
            type="button"
          >
            <Glyph glyph={cell.glyph} palette={palette} />
          </button>
        ))}
      </div>
      <div className="puzzle-instruction">
        <span>
          {puzzle.familyId} / {puzzle.difficulty}
        </span>
        <span>{revealTarget ? "target revealed" : "select one tile"}</span>
      </div>
    </div>
  );
}
