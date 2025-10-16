import { useEffect, useLayoutEffect, useReducer, useState } from "react";
import { Slider, TextField, Tooltip, Typography } from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import { useQueryState } from "nuqs";

import useDebounce from "../../hooks/useDebounce";
import styles from "../../styles/Home.module.css";

import { INITIAL_FIT_STATE, SHRINK_FACTOR } from "./constants";
import { fitStateParser } from "./parsers";
import { FitReducerAction, FitState } from "./types";
import {
  calculateGeometry,
  calculateReachDiff,
  calculateStackDiff,
  formatDiffMessage,
} from "./utils";

type TooltipContent = JSX.Element | string;

const fitTooltip: TooltipContent = (
  <Typography variant="body1">
    HY and HX are measured from the bottom bracket to the center of the
    handlebars.{" "}
    <a
      href="https://web.archive.org/web/20200809061637/https://www.slowtwitch.com/Bike_Fit/The_Secret_Weapon_of_Superstar_Fitters_HX_6335.html"
      target="_blank"
      rel="noreferrer"
    >
      <u>This article</u>
    </a>{" "}
    is a good explanation of the importance of these measurements.
  </Typography>
);

const spacerTooltip: TooltipContent = (
  <Typography variant="body1">
    Include everything between the headset and the handlebar clamp--like the
    headset top cap--in addition to the spacers. Note that bikes with carbon
    steerers are recommended not to exceed about 40mm in spacers.
  </Typography>
);

const stemAngleTooltip: TooltipContent = (
  <Typography variant="body1">
    Measured from the horizontal, not relative to the headtube angle
  </Typography>
);

const FIT_STATE_KEYS: Array<keyof FitState> = [
  "stemXOrigin",
  "stemYOrigin",
  "spacer",
  "stem",
  "angleHt",
  "angleStem",
  "stack",
  "reach",
  "handlebarStack",
  "handlebarReach",
  "name",
];

const areFitStatesEqual = (
  a: FitState | null | undefined,
  b: FitState | null | undefined
) => {
  if (!a || !b) {
    return false;
  }

  return FIT_STATE_KEYS.every((key) => a[key] === b[key]);
};

const reducer = (state: FitState, action: FitReducerAction): FitState => {
  switch (action.type) {
    case "update": {
      return {
        ...state,
        [action.field]: action.value,
      };
    }
    case "replace":
      return areFitStatesEqual(state, action.payload)
        ? state
        : { ...action.payload };
    default:
      return state;
  }
};

const useScrollRestoration = () => {
  useLayoutEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const scrollPosition = window.sessionStorage.getItem("scrollPosition");
    if (scrollPosition) {
      window.scrollTo(0, parseInt(scrollPosition, 10));
      window.sessionStorage.removeItem("scrollPosition");
    }
  }, []);
};

const useUrlState = () =>
  useQueryState<FitState | null>("urlstate", {
    ...fitStateParser,
    history: "replace",
  });

const useFitState = () => {
  const [inUrl, setInUrl] = useUrlState();
  const initialData = inUrl ?? INITIAL_FIT_STATE;
  const [state, dispatch] = useReducer(reducer, initialData);
  const debouncedState = useDebounce(state, 250);
  const [inputError, setInputError] = useState<string | null>(null);
  const lastInUrlRef = useRef<FitState | null | undefined>(inUrl);

  useEffect(() => {
    if (lastInUrlRef.current === inUrl) {
      return;
    }

    lastInUrlRef.current = inUrl;

    if (!inUrl) {
      return;
    }

    dispatch({
      type: "replace",
      payload: inUrl,
    });
  }, [inUrl, state]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (inUrl && areFitStatesEqual(debouncedState, inUrl)) {
      return;
    }

    window.sessionStorage.setItem("scrollPosition", window.scrollY.toString());
    void setInUrl(debouncedState);
  }, [debouncedState, inUrl, setInUrl]);

  return {
    state,
    dispatch,
    inputError,
    setInputError,
  } as const;
};

const useGeometry = (state: FitState) => {
  return calculateGeometry(state);
};

const isNumberMismatch = (value: string) =>
  value.length > 0 && !/^[0-9]*$/.test(value);

const validateNumericField = (
  field: keyof FitState,
  value: string,
  setInputError: (field: string | null) => void,
  dispatch: (action: FitReducerAction) => void
) => {
  if (isNumberMismatch(value)) {
    setInputError(field);
    return;
  }

  setInputError(null);
  dispatch({
    type: "update",
    field,
    value: value === "" ? "" : Number(value),
  });
};

const validateTextField = (
  field: keyof FitState,
  value: string,
  setInputError: (field: string | null) => void,
  dispatch: (action: FitReducerAction) => void
) => {
  if (value.length > 100) {
    setInputError(field);
    return;
  }

  setInputError(null);
  dispatch({
    type: "update",
    field,
    value,
  });
};

const SpacerLabel = ({ tooltip }: { tooltip: TooltipContent }) => (
  <Tooltip title={tooltip} leaveTouchDelay={10000} enterTouchDelay={5}>
    <Typography sx={{ fontSize: "0.875rem", fontWeight: "regular" }}>
      Spacer height <InfoIcon fontSize="small" sx={{ color: "orange" }} />
    </Typography>
  </Tooltip>
);

const StemAngleLabel = ({ tooltip }: { tooltip: TooltipContent }) => (
  <Tooltip title={tooltip} leaveTouchDelay={10000}>
    <Typography sx={{ fontSize: "0.875rem" }}>
      Stem angle <InfoIcon fontSize="small" sx={{ color: "orange" }} />
    </Typography>
  </Tooltip>
);

const NameField = ({
  value,
  onChange,
  hasError,
  isDisabled,
}: {
  value: string;
  onChange: (nextValue: string) => void;
  hasError: boolean;
  isDisabled: boolean;
}) => (
  <TextField
    disabled={isDisabled}
    error={hasError}
    name="name"
    value={value}
    onChange={(event) => onChange(event.target.value)}
    id="name"
    style={{ width: 421 }}
    helperText={hasError ? "That's too long" : ""}
  />
);

const NumericField = ({
  field,
  value,
  label,
  onChange,
  hasError,
  isDisabled,
}: {
  field: keyof FitState;
  value: number | "";
  label: string;
  onChange: (nextValue: string) => void;
  hasError: boolean;
  isDisabled: boolean;
}) => (
  <TextField
    id={field}
    name={field}
    style={{ width: 100 }}
    inputProps={{
      type: "text",
      inputMode: "numeric",
      pattern: "[0-9]*",
      "aria-label": field,
    }}
    value={value}
    disabled={isDisabled}
    error={hasError}
    helperText={hasError ? "Numbers only" : label}
    onChange={(event) => onChange(event.target.value)}
  />
);

const FitCalculator = () => {
  useScrollRestoration();
  const { state, dispatch, inputError, setInputError } = useFitState();

  const {
    topOfHTX,
    topOfHTY,
    stemEndX,
    stemEndY,
    spacerRise,
    spacerRun,
    stemRise,
    stemRun,
    totalRise,
    totalRun,
  } = useGeometry(state);

  const stackDiff = calculateStackDiff(state, spacerRise, stemRise);
  const reachDiff = calculateReachDiff(state, stemRun, spacerRun);
  const stackMessage = formatDiffMessage(
    stackDiff,
    "TOO TALL",
    "TOO SHORT",
    "Stack"
  );
  const reachMessage = formatDiffMessage(
    reachDiff,
    "TOO LONG",
    "TOO SHORT",
    "Reach"
  );

  const handleSliderChange = (field: keyof FitState, value: number) => {
    dispatch({
      type: "update",
      field,
      value,
    });
  };

  const hasError = (field: keyof FitState) => inputError === field;
  const isDisabled = (field: keyof FitState) =>
    Boolean(inputError && !hasError(field));

  return (
    <>
      <title>{`${state.name ?? ""} Bicycle Stem & Fit Calculator`}</title>
      <div className="name">
        <Typography style={{ width: 250 }} variant="h6">
          Name your configuration
        </Typography>
        <div id="name">
          <NameField
            value={state.name}
            hasError={hasError("name")}
            isDisabled={isDisabled("name")}
            onChange={(value) =>
              validateTextField("name", value, setInputError, dispatch)
            }
          />
        </div>
      </div>

      <div className={styles.frame}>
        <Typography variant="h6">Frame</Typography>
        <div id="frame">
          <NumericField
            field="stack"
            value={state.stack}
            label="Stack (mm)"
            hasError={hasError("stack")}
            isDisabled={isDisabled("stack")}
            onChange={(value) =>
              validateNumericField("stack", value, setInputError, dispatch)
            }
          />
          <NumericField
            field="reach"
            value={state.reach}
            label="Reach (mm)"
            hasError={hasError("reach")}
            isDisabled={isDisabled("reach")}
            onChange={(value) =>
              validateNumericField("reach", value, setInputError, dispatch)
            }
          />
        </div>
      </div>

      <div className={styles.fit}>
        <Typography variant="h6">
          Fit{" "}
          <Tooltip
            title={fitTooltip}
            leaveTouchDelay={10000}
            enterTouchDelay={5}
          >
            <InfoIcon fontSize="small" sx={{ color: "orange" }} />
          </Tooltip>
        </Typography>
        <div id="handlebar_x_y">
          <NumericField
            field="handlebarStack"
            value={state.handlebarStack}
            label="HY (mm)"
            hasError={hasError("handlebarStack")}
            isDisabled={isDisabled("handlebarStack")}
            onChange={(value) =>
              validateNumericField(
                "handlebarStack",
                value,
                setInputError,
                dispatch
              )
            }
          />
          <NumericField
            field="handlebarReach"
            value={state.handlebarReach}
            label="HX (mm)"
            hasError={hasError("handlebarReach")}
            isDisabled={isDisabled("handlebarReach")}
            onChange={(value) =>
              validateNumericField(
                "handlebarReach",
                value,
                setInputError,
                dispatch
              )
            }
          />
        </div>
      </div>

      <div className={styles.diff}>
        <Typography>{stackMessage}</Typography>
        <Typography>{reachMessage}</Typography>
        <hr />
      </div>

      <div className={styles.sliderContainer}>
        <Typography variant="h5">Result</Typography>
        <div className={styles.riserun}>
          <Typography>
            {totalRise < 0 ? "- Stack: " : "+ Stack: "}
            {Math.round(Math.abs(spacerRise + stemRise))}mm
          </Typography>
          <Typography>+ Reach: {`${Math.round(totalRun)}mm`}</Typography>
        </div>
        <div className={styles.slider}>
          <Slider
            name="spacer"
            disabled={isDisabled("spacer")}
            min={0}
            max={200}
            value={state.spacer}
            aria-label="spacer_slider"
            valueLabelDisplay="on"
            onChange={(_, value) =>
              handleSliderChange("spacer", value as number)
            }
            marks={[
              { value: 0, label: "0mm" },
              {
                value: 100,
                label: <SpacerLabel tooltip={spacerTooltip} />,
              },
              { value: 200, label: "200mm" },
            ]}
          />
        </div>

        <div className={styles.slider}>
          <Slider
            name="stem"
            disabled={isDisabled("stem")}
            min={70}
            max={140}
            step={10}
            value={state.stem}
            aria-label="stem_slider"
            valueLabelDisplay="on"
            onChange={(_, value) => handleSliderChange("stem", value as number)}
            marks={[
              { value: 70, label: "70mm" },
              { value: 105, label: "Stem Length" },
              { value: 140, label: "140mm" },
            ]}
          />
        </div>

        <div className={styles.slider}>
          <Slider
            name="angleHt"
            disabled={isDisabled("angleHt")}
            min={65}
            max={85}
            step={0.25}
            value={state.angleHt}
            aria-label="angleht_slider"
            valueLabelDisplay="on"
            onChange={(_, value) =>
              handleSliderChange("angleHt", value as number)
            }
            marks={[
              { value: 65, label: <>65&deg;</> },
              { value: 75, label: "Headtube Angle" },
              { value: 85, label: <>85&deg;</> },
            ]}
          />
        </div>

        <div className={styles.slider}>
          <Slider
            name="angleStem"
            disabled={isDisabled("angleStem")}
            min={-60}
            max={60}
            value={state.angleStem}
            aria-label="anglestem_slider"
            valueLabelDisplay="on"
            onChange={(_, value) =>
              handleSliderChange("angleStem", value as number)
            }
            marks={[
              { value: -60, label: <>-60&deg;</> },
              {
                value: 0,
                label: <StemAngleLabel tooltip={stemAngleTooltip} />,
              },
              { value: 60, label: <>60&deg;</> },
            ]}
          />
        </div>
      </div>

      <div className={styles.drawing}>
        <svg
          width="250"
          height="325"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
        >
          <line
            aria-label="spacer"
            x1={state.stemXOrigin / SHRINK_FACTOR}
            y1={state.stemYOrigin / SHRINK_FACTOR}
            x2={topOfHTX / SHRINK_FACTOR}
            y2={topOfHTY / SHRINK_FACTOR}
            stroke="orange"
            strokeWidth="5"
          />
          <line
            aria-label="stem"
            x1={topOfHTX / SHRINK_FACTOR}
            y1={topOfHTY / SHRINK_FACTOR}
            x2={stemEndX / SHRINK_FACTOR}
            y2={stemEndY / SHRINK_FACTOR}
            stroke="blue"
            strokeWidth="5"
          />
        </svg>
      </div>
    </>
  );
};

export default FitCalculator;
