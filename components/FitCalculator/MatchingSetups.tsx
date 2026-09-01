import styles from "../../styles/Home.module.css";

import { TARGET_TOLERANCE_MM } from "./constants";
import type { SetupMatch } from "./matching";
import { isLoadedMatch, isSameSetup } from "./matching";
import type { FitState, StemSetup } from "./types";

const formatAngle = (match: Pick<StemSetup, "stemAngle" | "orientation">) => {
  const angle = Number.isInteger(match.stemAngle)
    ? match.stemAngle
    : Number(match.stemAngle.toFixed(1));

  return angle === 0 ? "0°" : `${angle}° ${match.orientation}`;
};

const Difference = ({ value }: { value: string }) => (
  <span className={value === "Exact" ? styles.exact : undefined}>{value}</span>
);

const setupFromMatch = (match: SetupMatch): StemSetup => ({
  stem: match.stem,
  stemAngle: match.stemAngle,
  orientation: match.orientation,
  spacer: match.spacer,
});

const isWithinTolerance = (match: SetupMatch) =>
  Math.abs(match.roundedHeightDifference) <= TARGET_TOLERANCE_MM &&
  Math.abs(match.roundedReachDifference) <= TARGET_TOLERANCE_MM;

const missingMeasurementLabels = (state: FitState) =>
  ([
    ["stack", "frame stack"],
    ["reach", "frame reach"],
    ["handlebarStack", "HY"],
    ["handlebarReach", "HX"],
  ] as const)
    .filter(([field]) => state[field] === "" || state[field] === 0)
    .map(([, label]) => label);

const formatList = (items: string[]) => {
  if (items.length < 3) return items.join(" and ");
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
};

const MatchRow = ({
  match,
  loaded,
  rowLabel,
  onLoad,
}: {
  match: SetupMatch;
  loaded: boolean;
  rowLabel?: string;
  onLoad: (setup: StemSetup) => void;
}) => (
  <button
    type="button"
    className={`${styles.matchRow} ${rowLabel ? styles.currentSetupMatch : ""} ${loaded ? styles.loadedMatch : ""}`}
    aria-pressed={loaded}
    aria-label={`${rowLabel ? `${rowLabel}, ` : ""}Stem ${match.stem} mm, angle ${formatAngle(match)}, spacers ${match.spacer} mm, height ${match.heightLabel}, reach ${match.reachLabel}${loaded ? ", loaded" : ""}`}
    onClick={() => onLoad(setupFromMatch(match))}
  >
    <span className={styles.loadedMarker}>
      {rowLabel ? rowLabel : loaded ? "Loaded" : ""}
    </span>
    <span data-label="Stem length">{match.stem} mm</span>
    <span data-label="Stem angle">{formatAngle(match)}</span>
    <span data-label="Spacers">{match.spacer} mm</span>
    <span data-label="Height vs target">
      <Difference value={match.heightLabel} />
    </span>
    <span data-label="Reach vs target">
      <Difference value={match.reachLabel} />
    </span>
  </button>
);

const MatchingSetups = ({
  state,
  matches,
  currentMatch,
  adjustable,
  complete,
  onLoad,
}: {
  state: FitState;
  matches: SetupMatch[];
  currentMatch?: SetupMatch;
  adjustable?: SetupMatch;
  complete: boolean;
  onLoad: (setup: StemSetup) => void;
}) => {
  const suggestedMatches = currentMatch
    ? matches.filter((match) => !isSameSetup(currentMatch, match))
    : matches;
  const missingMeasurements = missingMeasurementLabels(state);

  return (
    <section className={styles.matchesCard} aria-labelledby="matches-title">
      <div className={styles.sectionHeading}>
      <div>
        <p className={styles.eyebrow}>Reverse solve</p>
        <h2 id="matches-title">Matching setups</h2>
      </div>
      {complete ? (
        <p className={styles.sectionNote}>
          Best standard fixed stems for your frame and target
        </p>
      ) : null}
      </div>

    {!complete ? (
      <p className={styles.matchesPrompt} role="status" aria-live="polite">
        Add {formatList(missingMeasurements)} to see matching setups.
      </p>
    ) : (
      <>
        <p className={styles.matchExplanation}>
          The first row restores the setup you started with. Each suggested row
          shows where the handlebar center lands; choose one to load it into the
          controls. The solver checks common 50–150 mm fixed stems and no more
          than 40 mm of spacers; the manual controls allow a wider range.
        </p>
        <div className={styles.matchHeader} aria-hidden="true">
          <span>Stem length</span>
          <span>Stem angle</span>
          <span>Spacers</span>
          <span>Height vs target</span>
          <span>Reach vs target</span>
        </div>
        <div className={styles.matchList}>
          {currentMatch ? (
            <MatchRow
              match={currentMatch}
              loaded={isLoadedMatch(state, currentMatch)}
              rowLabel="Original setup"
              onLoad={onLoad}
            />
          ) : null}
          {suggestedMatches.slice(0, 5).map((match) => (
            <MatchRow
              key={`${match.stem}-${match.stemAngle}-${match.orientation}-${match.spacer}`}
              match={match}
              loaded={isLoadedMatch(state, match)}
              onLoad={onLoad}
            />
          ))}
        </div>

        {adjustable && isWithinTolerance(adjustable) ? (
          <div className={styles.adjustableFallback}>
            <div>
              <p className={styles.fallbackLabel}>Adjustable stem fallback</p>
              <p>
                No fixed stem lands within {TARGET_TOLERANCE_MM} mm on both axes. An adjustable
                setup gets there with a {adjustable.stem} mm stem at{" "}
                {formatAngle(adjustable)} with {adjustable.spacer} mm of
                spacers.
              </p>
              <p className={styles.fallbackDifference}>
                Height: {adjustable.heightLabel} · Reach:{" "}
                {adjustable.reachLabel}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onLoad(setupFromMatch(adjustable))}
            >
              Load setup
            </button>
          </div>
        ) : adjustable ? (
          <div className={`${styles.adjustableFallback} ${styles.outOfRange}`}>
            <div>
              <p className={styles.fallbackLabel}>Target outside common range</p>
              <p>
                Neither the fixed stems above nor an adjustable stem up to 55°
                lands within {TARGET_TOLERANCE_MM} mm on both axes. The closest adjustable option
                would be {adjustable.stem} mm at {formatAngle(adjustable)} with{" "}
                {adjustable.spacer} mm of spacers.
              </p>
              <p className={styles.fallbackDifference}>
                Still off target — height: {adjustable.heightLabel} · reach:{" "}
                {adjustable.reachLabel}
              </p>
            </div>
          </div>
        ) : null}
      </>
    )}
    </section>
  );
};

export default MatchingSetups;
