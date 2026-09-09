import Head from "next/head";
import {
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQueryState } from "nuqs";

import useDebounce from "../../hooks/useDebounce";
import styles from "../../styles/Home.module.css";

import CockpitDrawing from "./CockpitDrawing";
import { INITIAL_FIT_STATE } from "./constants";
import {
  createSetupMatch,
  findAdjustableFallback,
  findFixedMatches,
} from "./matching";
import MatchingSetups from "./MatchingSetups";
import { fitStateParser } from "./parsers";
import type {
  FitReducerAction,
  FitState,
  NumericInput,
  StemSetup,
} from "./types";
import {
  calculateGeometry,
  formatAxisDifference,
  getAxisDifferenceDisplay,
  getTargetOffset,
  getTargetProximity,
} from "./utils";

type MeasurementField =
  | "stack"
  | "reach"
  | "handlebarStack"
  | "handlebarReach";

type ControlField = "spacer" | "stem" | "stemAngle" | "angleHt";

type ControlBounds = {
  spacerMin: number;
  spacerMax: number;
  stemMin: number;
  stemMax: number;
  stemAngleMin: number;
  stemAngleMax: number;
  headTubeAngleMin: number;
  headTubeAngleMax: number;
};

const DEFAULT_CONTROL_BOUNDS: ControlBounds = {
  spacerMin: 0,
  spacerMax: 80,
  stemMin: 50,
  stemMax: 150,
  stemAngleMin: 0,
  stemAngleMax: 40,
  headTubeAngleMin: 65,
  headTubeAngleMax: 85,
};

const targetProximityClass = (difference: number) => {
  switch (getTargetProximity(difference)) {
    case "on-target":
      return styles.targetOn;
    case "close":
      return styles.targetClose;
    case "far":
      return styles.targetFar;
  }
};

const expandControlBounds = (
  bounds: ControlBounds,
  state: FitState
): ControlBounds => ({
  spacerMin: Math.min(bounds.spacerMin, state.spacer),
  spacerMax: Math.max(bounds.spacerMax, state.spacer),
  stemMin: Math.min(bounds.stemMin, state.stem),
  stemMax: Math.max(bounds.stemMax, state.stem),
  stemAngleMin: Math.min(bounds.stemAngleMin, state.stemAngle),
  stemAngleMax: Math.max(bounds.stemAngleMax, state.stemAngle),
  headTubeAngleMin: Math.min(bounds.headTubeAngleMin, state.angleHt),
  headTubeAngleMax: Math.max(bounds.headTubeAngleMax, state.angleHt),
});

const rememberFirstSetup = (
  current: StemSetup | null,
  setup: StemSetup
): StemSetup => current ?? setup;

const reducer = (state: FitState, action: FitReducerAction): FitState => {
  switch (action.type) {
    case "update":
      return { ...state, [action.field]: action.value };
    case "replace":
      return { ...action.payload };
    case "loadSetup":
      return { ...state, ...action.payload };
    default:
      return state;
  }
};

const useUrlState = () =>
  useQueryState<FitState | null>("urlstate", {
    ...fitStateParser,
    history: "replace",
  });

const useFitState = () => {
  const [, setInUrl] = useUrlState();
  const [state, dispatch] = useReducer(reducer, INITIAL_FIT_STATE);
  const [controlBounds, expandBounds] = useReducer(
    expandControlBounds,
    DEFAULT_CONTROL_BOUNDS
  );
  const debouncedState = useDebounce(state, 250);
  const initialUrlState = useRef<FitState | null | undefined>(undefined);
  const urlIsReadyForWrites = useRef(false);
  const lastUrlWrite = useRef<string | null>(null);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      initialUrlState.current !== undefined
    ) {
      return;
    }

    const rawState = new URLSearchParams(window.location.search).get(
      "urlstate"
    );
    const parsedState = rawState ? fitStateParser.parse(rawState) : null;

    initialUrlState.current = parsedState;
    if (parsedState) {
      expandBounds(parsedState);
      dispatch({ type: "replace", payload: parsedState });
    } else {
      urlIsReadyForWrites.current = true;
    }
  }, []);

  useEffect(() => {
    if (
      !urlIsReadyForWrites.current &&
      initialUrlState.current &&
      JSON.stringify(state) === JSON.stringify(initialUrlState.current)
    ) {
      urlIsReadyForWrites.current = true;
    }
  }, [state]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const serializedState = JSON.stringify(debouncedState);
    if (
      !urlIsReadyForWrites.current ||
      serializedState !== JSON.stringify(state)
    ) {
      return;
    }

    if (serializedState === lastUrlWrite.current) {
      return;
    }

    lastUrlWrite.current = serializedState;
    void setInUrl(debouncedState);
  }, [debouncedState, setInUrl, state]);

  return { state, dispatch, controlBounds, expandBounds } as const;
};

const InfoTip = ({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) => (
  <span className={styles.infoTip}>
    <button type="button" aria-label={label} aria-describedby={id}>
      i
    </button>
    <span id={id} role="tooltip">
      {children}
    </span>
  </span>
);

const formatControlValue = (value: number) => String(value);

const parseControlValue = (
  draft: string,
  hardMin: number,
  hardMax?: number
) => {
  if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(draft.trim())) return undefined;
  const value = Number(draft);
  return Number.isFinite(value) &&
    value >= hardMin &&
    (hardMax === undefined || value <= hardMax)
    ? value
    : undefined;
};

const isOnControlStep = (value: number, min: number, step: number) => {
  const stepsFromMinimum = (value - min) / step;
  return Math.abs(stepsFromMinimum - Math.round(stepsFromMinimum)) < 1e-8;
};

const RangeControl = ({
  label,
  value,
  min,
  max,
  step,
  hardMin,
  hardMax,
  unit,
  ariaLabel,
  onChange,
  onCommit,
  detail,
  tooltip,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  hardMin: number;
  hardMax?: number;
  unit: string;
  ariaLabel: string;
  onChange: (value: number) => void;
  onCommit: (value: number) => void;
  detail?: string;
  tooltip?: ReactNode;
}) => {
  const [draft, setDraft] = useState<string | null>(null);
  const displayedValue = draft ?? formatControlValue(value);
  const parsedDraft = parseControlValue(displayedValue, hardMin, hardMax);
  const rangeStep = isOnControlStep(value, min, step) ? step : "any";

  const commitDraft = () => {
    if (parsedDraft !== undefined) {
      onChange(parsedDraft);
      onCommit(parsedDraft);
    }
    setDraft(null);
  };

  return (
    <div className={styles.rangeControl}>
      <div className={styles.controlLabel}>
        <span className={styles.controlName}>
          {label}
          {tooltip ? (
            <InfoTip id={`${ariaLabel}-tip`} label={`About ${label}`}>
              {tooltip}
            </InfoTip>
          ) : null}
        </span>
        <span className={styles.controlValue}>
          <input
            type="text"
            inputMode="decimal"
            value={displayedValue}
            aria-label={`${ariaLabel} value`}
            onFocus={(event) => {
              setDraft(formatControlValue(value));
              event.currentTarget.select();
            }}
            onChange={(event) => {
              const nextDraft = event.target.value;
              setDraft(nextDraft);
              const nextValue = parseControlValue(
                nextDraft,
                hardMin,
                hardMax
              );
              if (nextValue !== undefined) {
                onChange(nextValue);
              }
            }}
            onBlur={commitDraft}
            onKeyDown={(event) => {
              if (event.key === "ArrowUp" || event.key === "ArrowDown") {
                event.preventDefault();
                const nextValue =
                  (parsedDraft ?? value) +
                  (event.key === "ArrowUp" ? step : -step);
                const validValue = parseControlValue(
                  formatControlValue(nextValue),
                  hardMin,
                  hardMax
                );
                if (validValue !== undefined) {
                  setDraft(formatControlValue(validValue));
                  onChange(validValue);
                }
              } else if (event.key === "Enter") {
                event.currentTarget.blur();
              }
              if (event.key === "Escape") {
                setDraft(null);
                event.currentTarget.blur();
              }
            }}
          />
          <span aria-hidden="true">{unit.trim()}</span>
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={rangeStep}
        value={value}
        aria-label={ariaLabel}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <div className={styles.rangeEnds} aria-hidden="true">
        <span>
          {min}
          {unit}
        </span>
        {detail ? <span>{detail}</span> : <span />}
        <span>
          {max}
          {unit}
        </span>
      </div>
    </div>
  );
};

const MeasurementInput = ({
  field,
  label,
  hint,
  value,
  error,
  onChange,
}: {
  field: MeasurementField;
  label: string;
  hint: string;
  value: NumericInput | string;
  error?: string;
  onChange: (value: string) => void;
}) => (
  <label className={styles.measurementField}>
    <span>{label}</span>
    <div>
      <input
        id={field}
        name={field}
        value={value}
        inputMode="decimal"
        aria-label={field}
        aria-invalid={Boolean(error)}
        onChange={(event) => onChange(event.target.value)}
      />
      <span>mm</span>
    </div>
    <small className={error ? styles.fieldError : undefined}>
      {error ?? hint}
    </small>
  </label>
);

const currentSetup = (state: FitState): StemSetup => ({
  spacer: state.spacer,
  stem: state.stem,
  stemAngle: state.stemAngle,
  orientation: state.orientation,
});

const setupDescription = (setup: StemSetup) =>
  `${setup.stem} mm · ${setup.stemAngle}° ${setup.orientation} · ${setup.spacer} mm spacers`;

const signedMillimetres = (value: number) => {
  const rounded = Math.round(value);
  if (rounded === 0) return "0";
  return `${rounded > 0 ? "+" : "−"}${Math.abs(rounded)}`;
};

const installedAngleDescription = (angle: number) => {
  const rounded = Number(Math.abs(angle).toFixed(1));
  if (rounded === 0) return "Level with the ground";
  return `${rounded}° ${angle > 0 ? "above" : "below"} horizontal`;
};

const FitCalculator = () => {
  const { state, dispatch, controlBounds, expandBounds } = useFitState();
  const [drafts, setDrafts] = useState<
    Partial<Record<MeasurementField, string>>
  >({});
  const [errors, setErrors] = useState<
    Partial<Record<MeasurementField, string>>
  >({});
  const [restorableSetup, rememberRestorableSetup] = useReducer(
    rememberFirstSetup,
    null
  );

  const geometry = calculateGeometry(state);
  const referenceGeometry = state.reference
    ? calculateGeometry({ ...state.reference, angleHt: state.angleHt })
    : undefined;
  const target = getTargetOffset(state);
  const targetHeightDifference = target
    ? geometry.totalRise - target.rise
    : 0;
  const targetReachDifference = target
    ? geometry.totalRun - target.run
    : 0;
  const targetHeightDisplay = getAxisDifferenceDisplay(
    targetHeightDifference,
    "low",
    "high"
  );
  const targetReachDisplay = getAxisDifferenceDisplay(
    targetReachDifference,
    "short",
    "long"
  );

  useEffect(() => {
    if (target && !restorableSetup) {
      rememberRestorableSetup({
        orientation: state.orientation,
        spacer: state.spacer,
        stem: state.stem,
        stemAngle: state.stemAngle,
      });
    }
  }, [
    restorableSetup,
    state.orientation,
    state.spacer,
    state.stem,
    state.stemAngle,
    target,
  ]);
  const solverState = useMemo<FitState>(
    () => ({
      ...INITIAL_FIT_STATE,
      angleHt: state.angleHt,
      stack: state.stack,
      reach: state.reach,
      handlebarStack: state.handlebarStack,
      handlebarReach: state.handlebarReach,
    }),
    [
      state.angleHt,
      state.handlebarReach,
      state.handlebarStack,
      state.reach,
      state.stack,
    ]
  );
  const fixedMatches = useMemo(
    () => findFixedMatches(solverState),
    [solverState]
  );
  const adjustable = useMemo(
    () => findAdjustableFallback(solverState, fixedMatches),
    [fixedMatches, solverState]
  );
  const currentMatch = useMemo(
    () =>
      restorableSetup
        ? createSetupMatch(solverState, restorableSetup, "current")
        : undefined,
    [restorableSetup, solverState]
  );

  const updateField = <Field extends keyof FitState>(
    field: Field,
    value: FitState[Field]
  ) => {
    dispatch({ type: "update", field, value });
  };

  const updateMeasurement = (field: MeasurementField, rawValue: string) => {
    setDrafts((current) => ({ ...current, [field]: rawValue }));

    if (rawValue === "") {
      setErrors((current) => ({ ...current, [field]: undefined }));
      updateField(field, "");
      return;
    }

    if (!/^\d+(?:\.\d*)?$/.test(rawValue)) {
      setErrors((current) => ({
        ...current,
        [field]: "Enter a positive number",
      }));
      updateField(field, "");
      return;
    }

    const numericValue = Number(rawValue);
    if (!Number.isFinite(numericValue)) {
      setErrors((current) => ({
        ...current,
        [field]: "Enter a smaller number",
      }));
      updateField(field, "");
      return;
    }

    setErrors((current) => ({ ...current, [field]: undefined }));
    if (!rawValue.endsWith(".")) {
      updateField(field, numericValue);
    }
  };

  const commitControlValue = (field: ControlField, value: number) => {
    expandBounds({ ...state, [field]: value });
  };

  const loadSetup = (setup: StemSetup) => {
    dispatch({ type: "loadSetup", payload: { ...setup } });
  };

  const resultRise = referenceGeometry
    ? geometry.totalRise - referenceGeometry.totalRise
    : geometry.totalRise;
  const resultRun = referenceGeometry
    ? geometry.totalRun - referenceGeometry.totalRun
    : geometry.totalRun;
  const installedAngle = geometry.installedStemAngle;

  return (
    <>
      <Head>
        <title>{`${state.name ? `${state.name} · ` : ""}Bike Stem Calculator | BikeStem.fit`}</title>
      </Head>

      <div className={styles.calculatorGrid}>
        <div className={styles.explorer}>
          <section
          className={`${styles.card} ${styles.setupCard}`}
          aria-labelledby="setup-title"
        >
          <label className={`${styles.nameField} ${styles.topNameField}`}>
            <span>Setup name <small>optional</small></span>
            <input
              name="name"
              maxLength={100}
              value={state.name}
              placeholder="My road bike"
              onChange={(event) => updateField("name", event.target.value)}
            />
          </label>
          <p className={styles.eyebrow}>Current setup</p>
          <h2 id="setup-title">Stem &amp; spacers</h2>

          <RangeControl
            label="Spacer stack"
            value={state.spacer}
            min={Math.min(controlBounds.spacerMin, state.spacer)}
            max={Math.max(controlBounds.spacerMax, state.spacer)}
            step={1}
            hardMin={0}
            unit=" mm"
            ariaLabel="Spacer stack"
            onChange={(value) => updateField("spacer", value)}
            onCommit={(value) => commitControlValue("spacer", value)}
            tooltip={
              <>
                Measure the complete stack along the steerer from the top of
                the head tube to the stem clamp: the headset top cover plus
                every spacer. You can add or remove spacers. Follow the frame
                and fork makers’ limits; carbon steerers are commonly limited
                to roughly 40 mm.
              </>
            }
          />
          <RangeControl
            label="Stem length"
            value={state.stem}
            min={Math.min(controlBounds.stemMin, state.stem)}
            max={Math.max(controlBounds.stemMax, state.stem)}
            step={10}
            hardMin={1}
            unit=" mm"
            ariaLabel="Stem length"
            onChange={(value) => updateField("stem", value)}
            onCommit={(value) => commitControlValue("stem", value)}
            detail="center to center"
          />
          <RangeControl
            label="Printed stem angle"
            value={state.stemAngle}
            min={Math.min(controlBounds.stemAngleMin, state.stemAngle)}
            max={Math.max(controlBounds.stemAngleMax, state.stemAngle)}
            step={0.5}
            hardMin={0}
            unit="°"
            ariaLabel="Printed stem angle"
            onChange={(value) => updateField("stemAngle", value)}
            onCommit={(value) => commitControlValue("stemAngle", value)}
            tooltip={
              <>
                Use the angle printed on the stem. The up or flipped control
                tells the calculator how the stem is installed; the diagram
                shows its resulting angle from horizontal.
              </>
            }
          />
          <RangeControl
            label="Head tube angle"
            value={state.angleHt}
            min={Math.min(controlBounds.headTubeAngleMin, state.angleHt)}
            max={Math.max(controlBounds.headTubeAngleMax, state.angleHt)}
            step={0.25}
            hardMin={1}
            hardMax={179}
            unit="°"
            ariaLabel="Head tube angle"
            onChange={(value) => updateField("angleHt", value)}
            onCommit={(value) => commitControlValue("angleHt", value)}
          />

          <div
            className={styles.orientationControl}
            role="group"
            aria-labelledby="orientation-label"
          >
            <span id="orientation-label" className={styles.orientationLabel}>
              Orientation
            </span>
            <button
              type="button"
              aria-pressed={state.orientation === "up"}
              onClick={() => updateField("orientation", "up")}
            >
              <span aria-hidden="true">↗</span> Up
            </button>
            <button
              type="button"
              aria-pressed={state.orientation === "flipped"}
              onClick={() => updateField("orientation", "flipped")}
            >
              <span aria-hidden="true">↘</span> Flipped
            </button>
          </div>
          <p className={styles.installedAngleReadout}>
            Installed angle: <strong>{installedAngleDescription(installedAngle)}</strong>
          </p>
          </section>

          <section
          className={`${styles.card} ${styles.resultCard}`}
          aria-labelledby="result-title"
        >
          <div className={styles.resultHeader}>
            <div>
              <p className={styles.eyebrow}>
                {state.reference ? "Compared with" : "Cockpit position"}
              </p>
              <h2 id="result-title">
                {state.reference
                  ? setupDescription(state.reference)
                  : "From the head tube top"}
              </h2>
            </div>
            {state.reference ? (
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => updateField("reference", null)}
              >
                Stop comparing
              </button>
            ) : (
              <button
                type="button"
                className={`${styles.secondaryButton} ${styles.compareButton}`}
                onClick={() => updateField("reference", currentSetup(state))}
              >
                Pin this setup and compare a new one
              </button>
            )}
          </div>

          <p
            className={styles.visuallyHidden}
            aria-live="polite"
            aria-atomic="true"
          >
            Cockpit position: height {signedMillimetres(resultRise)} mm; reach{" "}
            {signedMillimetres(resultRun)} mm.
            {target
              ? ` Compared with target: height ${formatAxisDifference(
                  targetHeightDifference,
                  "low",
                  "high"
                )}; reach ${formatAxisDifference(
                  targetReachDifference,
                  "short",
                  "long"
                )}.`
              : ""}
          </p>

          <div className={styles.bigResults}>
            <div>
              <strong>{signedMillimetres(resultRise)}</strong>
              <span>mm height</span>
            </div>
            <div>
              <strong>{signedMillimetres(resultRun)}</strong>
              <span>mm reach</span>
            </div>
          </div>

          {state.reference ? (
            <p className={styles.referenceSummary}>
              Change in handlebar height and reach from the setup named above.
            </p>
          ) : (
            <p className={styles.resultExplanation}>
              Height and reach are measured from the top of the head tube to
              the handlebar center.
            </p>
          )}

          {target ? (
            <div className={styles.targetStatus}>
              <span className={styles.targetHeading}>Compared with target</span>
              <div className={styles.targetResults}>
                <div
                  className={`${styles.targetMetric} ${targetProximityClass(targetHeightDifference)}`}
                  role="group"
                  data-axis="height"
                  data-proximity={getTargetProximity(targetHeightDifference)}
                  aria-label={`Height: ${formatAxisDifference(
                    targetHeightDifference,
                    "low",
                    "high"
                  )}`}
                >
                  <div aria-hidden="true">
                    <strong>{targetHeightDisplay.value}</strong>
                    {targetHeightDisplay.detail ? (
                      <span>{targetHeightDisplay.detail}</span>
                    ) : null}
                  </div>
                </div>
                <div
                  className={`${styles.targetMetric} ${targetProximityClass(targetReachDifference)}`}
                  role="group"
                  data-axis="reach"
                  data-proximity={getTargetProximity(targetReachDifference)}
                  aria-label={`Reach: ${formatAxisDifference(
                    targetReachDifference,
                    "short",
                    "long"
                  )}`}
                >
                  <div aria-hidden="true">
                    <strong>{targetReachDisplay.value}</strong>
                    {targetReachDisplay.detail ? (
                      <span>{targetReachDisplay.detail}</span>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <CockpitDrawing state={state} />
          <div className={styles.drawingLegend} aria-label="Diagram key">
            <span className={styles.legendHeadTube}>Head tube</span>
            {state.reference ? (
              <span className={styles.legendPinnedSetup}>Pinned setup</span>
            ) : null}
            <span
              className={
                state.reference
                  ? styles.legendCurrentSetup
                  : styles.legendPinnedSetup
              }
            >
              Current setup
            </span>
            {target ? (
              <span className={styles.legendTarget}>Fit target</span>
            ) : null}
          </div>
          </section>
        </div>

        <section
          className={`${styles.card} ${styles.fitCard}`}
          aria-labelledby="frame-title"
        >
          <div className={styles.inputGroup}>
            <p className={styles.eyebrow}>Your frame</p>
            <h2 id="frame-title">Frame geometry</h2>
            <div className={styles.measurementGrid}>
              <MeasurementInput
                field="stack"
                label="Frame stack"
                hint="Bottom bracket to head tube top"
                value={drafts.stack ?? state.stack}
                error={errors.stack}
                onChange={(value) => updateMeasurement("stack", value)}
              />
              <MeasurementInput
                field="reach"
                label="Frame reach"
                hint="Bottom bracket to head tube top"
                value={drafts.reach ?? state.reach}
                error={errors.reach}
                onChange={(value) => updateMeasurement("reach", value)}
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <div className={styles.fitTargetHeading}>
              <div>
                <p className={styles.eyebrow}>Your fit target</p>
                <h2>Handlebar center</h2>
              </div>
              <InfoTip id="fit-target-tip" label="About HY and HX">
                HY and HX are measured from the bottom bracket to the center of
                the handlebars. {" "}
                <a
                  href="https://web.archive.org/web/20200809061637/https://www.slowtwitch.com/Bike_Fit/The_Secret_Weapon_of_Superstar_Fitters_HX_6335.html"
                  target="_blank"
                  rel="noreferrer"
                >
                  This article
                </a>{" "}
                is a good explanation of why these measurements matter.
              </InfoTip>
            </div>
            <div className={styles.measurementGrid}>
              <MeasurementInput
                field="handlebarStack"
                label="HY · handlebar height"
                hint="Measured from the bottom bracket"
                value={drafts.handlebarStack ?? state.handlebarStack}
                error={errors.handlebarStack}
                onChange={(value) =>
                  updateMeasurement("handlebarStack", value)
                }
              />
              <MeasurementInput
                field="handlebarReach"
                label="HX · handlebar reach"
                hint="Measured from the bottom bracket"
                value={drafts.handlebarReach ?? state.handlebarReach}
                error={errors.handlebarReach}
                onChange={(value) =>
                  updateMeasurement("handlebarReach", value)
                }
              />
            </div>
          </div>

        </section>

        <MatchingSetups
          state={state}
          matches={fixedMatches}
          currentMatch={currentMatch}
          adjustable={adjustable}
          complete={Boolean(target)}
          onLoad={loadSetup}
        />
      </div>
    </>
  );
};

export default FitCalculator;
