import styles from "../../styles/Home.module.css";

import { TARGET_TOLERANCE_MM } from "./constants";
import type { FitState } from "./types";
import {
  calculateGeometry,
  getComparisonDrawOrder,
  getRadians,
  getTargetOffset,
  type SetupLayer,
} from "./utils";

const VIEW_BOX = {
  x: -45,
  y: -220,
  width: 225,
  height: 340,
};

const PLOT_BOUNDS = {
  xMin: VIEW_BOX.x + 10,
  xMax: VIEW_BOX.x + VIEW_BOX.width - 10,
  yMin: VIEW_BOX.y + 10,
  yMax: VIEW_BOX.y + VIEW_BOX.height - 10,
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const labelPlacement = (point: { x: number; y: number }) => ({
  x: point.x > PLOT_BOUNDS.xMax - 45 ? point.x - 9 : point.x + 9,
  y: point.y < PLOT_BOUNDS.yMin + 18 ? point.y + 16 : point.y - 8,
  textAnchor:
    point.x > PLOT_BOUNDS.xMax - 45 ? ("end" as const) : ("start" as const),
});

const angleArc = (
  x: number,
  y: number,
  installedAngle: number,
  radius: number
) => {
  const radians = getRadians(installedAngle);
  const endX = x + Math.cos(radians) * radius;
  const endY = y - Math.sin(radians) * radius;
  const sweep = installedAngle >= 0 ? 0 : 1;

  return `M ${x + radius} ${y} A ${radius} ${radius} 0 0 ${sweep} ${endX} ${endY}`;
};

const CockpitDrawing = ({ state }: { state: FitState }) => {
  const geometry = calculateGeometry(state);
  const pinnedGeometry = state.reference
    ? calculateGeometry({ ...state.reference, angleHt: state.angleHt })
    : undefined;
  const comparisonOrder = state.reference
    ? getComparisonDrawOrder(state, state.reference)
    : undefined;
  const spacerLayers: SetupLayer[] = comparisonOrder
    ? comparisonOrder.spacer
    : ["current"];
  const stemLayers: SetupLayer[] = comparisonOrder
    ? comparisonOrder.stem
    : ["current"];
  const target = getTargetOffset(state);
  const targetPoint = target
    ? {
        rawX: target.run,
        rawY: -target.rise,
        x: clamp(target.run, PLOT_BOUNDS.xMin, PLOT_BOUNDS.xMax),
        y: clamp(-target.rise, PLOT_BOUNDS.yMin, PLOT_BOUNDS.yMax),
      }
    : undefined;
  const targetIsClamped =
    targetPoint &&
    (targetPoint.x !== targetPoint.rawX || targetPoint.y !== targetPoint.rawY);
  const handlebarPoint = {
    x: clamp(geometry.stemEndX, PLOT_BOUNDS.xMin, PLOT_BOUNDS.xMax),
    y: clamp(geometry.stemEndY, PLOT_BOUNDS.yMin, PLOT_BOUNDS.yMax),
  };
  const handlebarIsClamped =
    handlebarPoint.x !== geometry.stemEndX ||
    handlebarPoint.y !== geometry.stemEndY;
  const handlebarLabel = labelPlacement(handlebarPoint);
  const pinnedHandlebarPoint = pinnedGeometry
    ? {
        x: clamp(pinnedGeometry.stemEndX, PLOT_BOUNDS.xMin, PLOT_BOUNDS.xMax),
        y: clamp(pinnedGeometry.stemEndY, PLOT_BOUNDS.yMin, PLOT_BOUNDS.yMax),
      }
    : undefined;
  const pinnedHandlebarIsClamped =
    pinnedGeometry &&
    pinnedHandlebarPoint &&
    (pinnedHandlebarPoint.x !== pinnedGeometry.stemEndX ||
      pinnedHandlebarPoint.y !== pinnedGeometry.stemEndY);
  const targetLabel = targetPoint ? labelPlacement(targetPoint) : undefined;
  const headTubeLength = 82;
  const headTubeX = Math.cos(getRadians(state.angleHt)) * headTubeLength;
  const headTubeY = Math.sin(getRadians(state.angleHt)) * headTubeLength;
  const angleLabelRadians = getRadians(geometry.installedStemAngle / 2);
  const angleLabelOffset =
    Math.abs(geometry.installedStemAngle) < 5
      ? geometry.installedStemAngle >= 0
        ? 18
        : -10
      : geometry.installedStemAngle >= 0
        ? 4
        : -4;
  const geometryFor = (layer: SetupLayer) =>
    layer === "current" ? geometry : pinnedGeometry!;
  const setupLineClass = (layer: SetupLayer) =>
    `${styles.setupLine} ${
      layer === "current" && state.reference
        ? styles.currentSetupLine
        : styles.blueSetupLine
    }`;
  const stemEndpointFor = (layer: SetupLayer) => {
    if (layer === "current") {
      return handlebarIsClamped
        ? handlebarPoint
        : { x: geometry.stemEndX, y: geometry.stemEndY };
    }

    return pinnedHandlebarIsClamped
      ? pinnedHandlebarPoint!
      : { x: pinnedGeometry!.stemEndX, y: pinnedGeometry!.stemEndY };
  };

  return (
    <svg
      className={styles.cockpitDrawing}
      viewBox={`${VIEW_BOX.x} ${VIEW_BOX.y} ${VIEW_BOX.width} ${VIEW_BOX.height}`}
      role="img"
      aria-labelledby="drawing-title drawing-description"
    >
      <title id="drawing-title">Stem and spacer geometry</title>
      <desc id="drawing-description">
        A fixed-scale side view from the top of the head tube to the handlebar
        center. One SVG unit equals one millimetre.
        {state.reference
          ? " The pinned setup is blue and the current setup is red. On a shared path, the shorter segment appears on top; equal segments show blue."
          : " The current setup is blue."}
      </desc>
      <defs>
        <pattern
          id="millimetre-grid"
          width="20"
          height="20"
          patternUnits="userSpaceOnUse"
        >
          <path d="M 20 0 L 0 0 0 20" className={styles.gridLine} />
        </pattern>
      </defs>

      <rect
        x={VIEW_BOX.x}
        y={VIEW_BOX.y}
        width={VIEW_BOX.width}
        height={VIEW_BOX.height}
        fill="url(#millimetre-grid)"
        rx="12"
      />

      <g className={styles.axes} aria-hidden="true">
        <line x1="0" y1="0" x2="166" y2="0" />
        <path d="M 166 0 l -7 -4 v 8 z" />
        <text x="164" y="12" textAnchor="end">
          forward
        </text>
        <line x1="0" y1="0" x2="0" y2="-198" />
        <path d="M 0 -198 l -4 7 h 8 z" />
        <text x="-7" y="-193" textAnchor="end">
          up
        </text>
      </g>

      <line
        className={styles.headTube}
        x1="0"
        y1="0"
        x2={headTubeX}
        y2={headTubeY}
        aria-label="head tube"
      />
      <circle className={styles.headTubeTop} cx="0" cy="0" r="4" />
      <text className={styles.svgLabel} x="32" y="30">
        head tube top
      </text>

      {!handlebarIsClamped ? (
        <g className={styles.measurementGuides} aria-hidden="true">
          <line
            x1={geometry.stemEndX}
            y1={geometry.stemEndY}
            x2={geometry.stemEndX}
            y2="0"
          />
          <line
            x1="0"
            y1={geometry.stemEndY}
            x2={geometry.stemEndX}
            y2={geometry.stemEndY}
          />
          <text x={geometry.stemEndX - 5} y="13" textAnchor="end">
            {Math.round(geometry.totalRun)} mm
          </text>
          <text x="7" y={geometry.stemEndY - 7}>
            {Math.round(geometry.totalRise)} mm
          </text>
        </g>
      ) : null}

      {spacerLayers.map((layer) => {
        const setupGeometry = geometryFor(layer);
        return (
          <line
            key={`spacer-${layer}`}
            className={setupLineClass(layer)}
            aria-label={
              layer === "current" ? "spacer stack" : "Pinned spacer stack"
            }
            data-segment="spacer"
            data-setup={layer}
            x1="0"
            y1="0"
            x2={setupGeometry.topOfHTX}
            y2={setupGeometry.topOfHTY}
          />
        );
      })}

      {stemLayers.map((layer) => {
        const setupGeometry = geometryFor(layer);
        const endpoint = stemEndpointFor(layer);
        return (
          <line
            key={`stem-${layer}`}
            className={setupLineClass(layer)}
            aria-label={layer === "current" ? "stem" : "Pinned stem"}
            data-segment="stem"
            data-setup={layer}
            x1={setupGeometry.topOfHTX}
            y1={setupGeometry.topOfHTY}
            x2={endpoint.x}
            y2={endpoint.y}
          />
        );
      })}

      <g
        className={`${styles.angleGuide} ${
          state.reference ? styles.currentAngleGuide : ""
        }`}
        aria-label="Installed stem angle"
      >
        <line
          x1={geometry.topOfHTX}
          y1={geometry.topOfHTY}
          x2={geometry.topOfHTX + 30}
          y2={geometry.topOfHTY}
        />
        <path
          d={angleArc(
            geometry.topOfHTX,
            geometry.topOfHTY,
            geometry.installedStemAngle,
            22
          )}
        />
        <text
          x={geometry.topOfHTX + Math.cos(angleLabelRadians) * 44}
          y={
            geometry.topOfHTY -
            Math.sin(angleLabelRadians) * 44 +
            angleLabelOffset
          }
          textAnchor="middle"
        >
          {Math.round(geometry.installedStemAngle)}°
        </text>
      </g>

      {pinnedGeometry && pinnedHandlebarPoint ? (
        <circle
          className={styles.pinnedEndpoint}
          cx={pinnedHandlebarPoint.x}
          cy={pinnedHandlebarPoint.y}
          r="3.5"
          aria-label={
            pinnedHandlebarIsClamped
              ? "Pinned handlebar center off scale"
              : "Pinned handlebar center"
          }
        />
      ) : null}

      {!state.reference && handlebarIsClamped ? (
        <g className={styles.offScalePoint} aria-label="Handlebar center off scale">
          <circle cx={handlebarPoint.x} cy={handlebarPoint.y} r="3.5" />
          <text
            x={handlebarLabel.x}
            y={handlebarLabel.y}
            textAnchor={handlebarLabel.textAnchor}
          >
            Current setup (off scale)
          </text>
        </g>
      ) : !state.reference ? (
        <circle
          className={styles.handlebarPoint}
          cx={geometry.stemEndX}
          cy={geometry.stemEndY}
          r="3.5"
          aria-label="handlebar center"
        />
      ) : null}

      {targetPoint ? (
        <g className={styles.targetPoint} aria-label="Fit target">
          <circle
            cx={targetPoint.x}
            cy={targetPoint.y}
            r={TARGET_TOLERANCE_MM}
          />
          <circle cx={targetPoint.x} cy={targetPoint.y} r="2" />
          <text
            x={targetLabel?.x}
            y={(targetLabel?.y ?? 0) - 4}
            textAnchor={targetLabel?.textAnchor}
          >
            Target{targetIsClamped ? " (off scale)" : ""}
          </text>
        </g>
      ) : null}

      {state.reference ? (
        <g
          className={styles.currentEndpoint}
          aria-label={
            handlebarIsClamped
              ? "Current handlebar center off scale"
              : "Current handlebar center"
          }
        >
          <line
            x1={handlebarPoint.x - 8}
            y1={handlebarPoint.y - 8}
            x2={handlebarPoint.x + 8}
            y2={handlebarPoint.y + 8}
          />
          <line
            x1={handlebarPoint.x - 8}
            y1={handlebarPoint.y + 8}
            x2={handlebarPoint.x + 8}
            y2={handlebarPoint.y - 8}
          />
          {handlebarIsClamped ? (
            <text
              x={handlebarLabel.x}
              y={handlebarLabel.y}
              textAnchor={handlebarLabel.textAnchor}
            >
              Current setup (off scale)
            </text>
          ) : null}
        </g>
      ) : null}
    </svg>
  );
};

export default CockpitDrawing;
