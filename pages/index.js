import { useEffect, useLayoutEffect, useReducer, useState } from "react";
import { useQueryState } from "next-usequerystate";
import { Link, Slider, Tooltip, TextField, Typography } from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import styles from "../styles/Home.module.css";
import useDebounce from "../hooks/useDebounce";

const initialState = {
    stemXOrigin: 100,
    stemYOrigin: 200,
    spacer: 40,
    stem: 100,
    angleHt: 73,
    angleStem: 0,
    stack: "",
    reach: "",
    handlebarStack: "",
    handlebarReach: "",
};

const getRadians = (angleDegrees) => {
    return (Math.PI / 180.0) * angleDegrees;
};

const reducer = (state, action) => {
    return { ...state, ...action, [action.input]: action.value };
};

export default function Home() {
    useLayoutEffect(() => {
        if (typeof window !== "undefined") {
            const scrollPosition =
                window.sessionStorage.getItem("scrollPosition");
            if (scrollPosition) {
                window.scrollTo(0, parseInt(scrollPosition));
                window.sessionStorage.removeItem("scrollPosition");
            }
        }
    });
    const [inurl, setinurl] = useQueryState("urlstate", {
        parse: JSON.parse,
    });
    const loadState = inurl || initialState;
    const [state, setState] = useReducer(reducer, loadState);
    const debouncedState = useDebounce(state, 250);
    const [inputError, setInputError] = useState(null);
    const validateNumbers = (event) => {
        if (event.target.validity.patternMismatch) {
            setInputError(event.target.name);
        } else {
            setInputError(null);
            setState({
                input: event.target.name,
                value: Number(event.target.value),
            });
        }
    };
    useEffect(() => {
        window.sessionStorage.setItem("scrollPosition", window.scrollY);
        setinurl(JSON.stringify(debouncedState));
    }, [debouncedState, setinurl]);
    
    const flippedHeadtubeAngle = 90 + (90 - state.angleHt);
    const stemAngle = 180 - state.angleStem;
    const topOfHTX =
        state.stemXOrigin +
        Math.cos(getRadians(flippedHeadtubeAngle)) * state.spacer;
    const topOfHTY =
        state.stemYOrigin -
        Math.sin(getRadians(flippedHeadtubeAngle)) * state.spacer;
    const spacerRise = state.spacer * Math.sin(getRadians(state.angleHt));
    const spacerRun = state.spacer * Math.sin(getRadians(90 - state.angleHt));
    const stemRise = state.stem * Math.sin(getRadians(state.angleStem));
    const stemRun = state.stem * Math.sin(getRadians(90 - state.angleStem));
    const totalRise = spacerRise + stemRise;
    const totalRun = stemRun - spacerRun;
    const stackDiff = () => {
        if (
            state.handlebarStack === "" ||
            state.handlebarStack === 0 ||
            state.stack === "" ||
            state.stack === 0 ||
            spacerRise === "" ||
            stemRise === ""
        ) {
            return;
        }
        return Math.round(
            state.handlebarStack - (state.stack + spacerRise + stemRise)
        );
    };
    const stackMessage = () => {
        if (stackDiff() == null) {
            return;
        }
        const diffNote =
            stackDiff() !== 0
                ? stackDiff() < 0
                    ? "TOO TALL"
                    : "TOO SHORT"
                : "JUST RIGHT";
        return diffNote === "JUST RIGHT"
            ? `Stack is ${diffNote}`
            : `Stack is ${diffNote} by ${Math.abs(stackDiff())}mm`;
    };
    const reachDiff = () => {
        if (
            state.handlebarReach === "" ||
            state.handlebarReach === 0 ||
            state.reach === "" ||
            state.reach === 0 ||
            spacerRun === "" ||
            stemRun === ""
        ) {
            return;
        }
        return Math.round(
            state.handlebarReach - (state.reach + stemRun - spacerRun)
        );
    };
    const reachMessage = () => {
        if (reachDiff() == null) {
            return;
        }
        const diffNote =
            reachDiff() !== 0
                ? reachDiff() < 0
                    ? "TOO LONG"
                    : "TOO SHORT"
                : "JUST RIGHT";
        return diffNote === "JUST RIGHT"
            ? `Reach is ${diffNote}`
            : `Reach is ${diffNote} by ${Math.abs(reachDiff())}mm`;
    };

    const fitTooltip = (
        <>
            <Typography variant="body1">
                HY and HX are measured from the bottom bracket to the center of
                the handlebars.{" "}
                {
                    <a
                        href="https://web.archive.org/web/20200809061637/https://www.slowtwitch.com/Bike_Fit/The_Secret_Weapon_of_Superstar_Fitters_HX_6335.html"
                        target="_blank"
                        rel="noreferrer"
                    >
                        <u>This article</u>
                    </a>
                }{" "}
                is a good explanation of the importance of these measurements.
            </Typography>
        </>
    );
    const spacerTooltip = (
        <Typography variant="body1">
            Include everything between the headset and the handlebar clamp--like
            the headset top cap--in addition to the spacers. Note that bikes
            with carbon steerers are recommended not to exceed about 40mm in
            spacers.
        </Typography>
    );
    const stemAngleTooltip = (
        <Typography variant="body1">
            Measured from the horizontal, not relative to the headtube angle
        </Typography>
    );
    const spacerLabel = (
        <Tooltip title={spacerTooltip} leaveTouchDelay={10000}>
            <Typography sx={{ fontSize: "0.875rem", fontWeight: "regular" }}>
                Spacer height{" "}
                <InfoIcon fontSize="small" sx={{ color: "orange" }} />
            </Typography>
        </Tooltip>
    );
    const stemAngleLabel = (
        <Tooltip title={stemAngleTooltip} leaveTouchDelay={10000}>
            <Typography sx={{ fontSize: "0.875rem" }}>
                Stem angle{" "}
                <InfoIcon fontSize="small" sx={{ color: "orange" }} />
            </Typography>
        </Tooltip>
    );

    return (
        inurl && (
            <>
                <title>Bicycle Stem & Fit Calculator</title>
                <Typography variant="h4" color="blue" mt={1} ml={1}>
                    Bicycle Stem & Fit Calculator
                </Typography>
                {/* </header> */}
                <div className={styles.gridlayout}>
                    <div className={styles.intro}>
                        <Typography variant="body1" paragraph>
                            This is a road bike stem calculator that can also
                            help translate measurements between a frame and a
                            fitting.
                        </Typography>
                        <Typography variant="body1" paragraph>
                            If you have frame and fit numbers, enter them below
                            and adjust the sliders to see if a workable
                            configuration is available. You want the sum of the
                            frame and the stem to be as close as possible to HX
                            and HY. Or you can just use the sliders as a simple
                            stem calculator.
                        </Typography>
                        <Typography variant="body1" paragraph>
                            To save your work, simply bookmark the page.
                        </Typography>
                    </div>
                    <div className={styles.frame}>
                        <Typography variant="h6">Frame</Typography>
                        <div id="frame">
                            <TextField
                                disabled={inputError && inputError !== "stack"}
                                error={inputError === "stack"}
                                id="stack"
                                name="stack"
                                style={{ width: 100 }}
                                helperText={
                                    inputError === "stack"
                                        ? "Numbers only"
                                        : "Stack (mm)"
                                }
                                inputProps={{
                                    type: "text",
                                    inputMode: "numeric",
                                    pattern: "[0-9]*",
                                    "aria-label": "stack",
                                }}
                                value={state.stack}
                                onChange={(event) => validateNumbers(event)}
                            />
                            <TextField
                                id="reach"
                                name="reach"
                                style={{ width: 100 }}
                                inputProps={{
                                    type: "text",
                                    inputMode: "numeric",
                                    pattern: "[0-9]*",
                                    "aria-label": "reach",
                                }}
                                value={state.reach}
                                disabled={inputError && inputError !== "reach"}
                                error={inputError === "reach"}
                                helperText={
                                    inputError === "reach"
                                        ? "Numbers only"
                                        : "Reach (mm)"
                                }
                                onChange={(event) => validateNumbers(event)}
                            />
                        </div>
                    </div>
                    <div className={styles.fit}>
                            <Typography variant="h6">
                                Fit{" "}
                        <Tooltip title={fitTooltip} leaveTouchDelay={10000}>
                                <InfoIcon
                                    fontSize="small"
                                    sx={{ color: "orange" }}
                                />
                        </Tooltip>
                            </Typography>
                        <div id="handlebar_x_y">
                            <TextField
                                id="handlebar_stack"
                                name="handlebarStack"
                                style={{ width: 100 }}
                                inputProps={{
                                    type: "text",
                                    inputMode: "numeric",
                                    pattern: "[0-9]*",
                                    "aria-label": "handlebar_stack",
                                }}
                                value={state.handlebarStack}
                                disabled={
                                    inputError &&
                                    inputError !== "handlebarStack"
                                }
                                error={inputError === "handlebarStack"}
                                helperText={
                                    inputError === "handlebarStack"
                                        ? "Numbers only"
                                        : "HY (mm)"
                                }
                                onChange={(event) => validateNumbers(event)}
                            />
                            <TextField
                                id="handlebar_reach"
                                name="handlebarReach"
                                style={{ width: 100 }}
                                inputProps={{
                                    type: "text",
                                    inputMode: "numeric",
                                    pattern: "[0-9]*",
                                    "aria-label": "handlebar_reach",
                                }}
                                value={state.handlebarReach}
                                disabled={
                                    inputError &&
                                    inputError !== "handlebarReach"
                                }
                                error={inputError === "handlebarReach"}
                                helperText={
                                    inputError === "handlebarReach"
                                        ? "Numbers only"
                                        : "HX (mm)"
                                }
                                onChange={(event) => validateNumbers(event)}
                            />
                        </div>
                    </div>
                    <div className={styles.diff}>
                        <Typography>{stackMessage() ?? ""}</Typography>
                        <Typography>{reachMessage() ?? ""}</Typography>
                        <hr />
                    </div>
                    <div className={styles.sliderContainer}>
                        <Typography variant="h5">Stem</Typography>
                        <div className={styles.riserun}>
                            <Typography>
                                {totalRise < 0 ? "- Stack: " : "+ Stack: "}
                                {Math.round(Math.abs(spacerRise + stemRise))}mm
                            </Typography>
                            <Typography>
                                + Reach: {`${Math.round(totalRun)}mm`}
                            </Typography>
                        </div>
                        <div className={styles.slider}>
                            <Slider
                                name="spacer"
                                min={0}
                                max={80}
                                defaultValue={state.spacer}
                                value={state.spacer}
                                aria-label="spacer_slider"
                                valueLabelDisplay="on"
                                onChange={(event, value) => {
                                    if (
                                        event.type !== "mousemove" &&
                                        event.type !== "touchmove"
                                    ) {
                                        return;
                                    }
                                    setState({
                                        input: event.target.name,
                                        value: value,
                                    });
                                }}
                                marks={[
                                    {
                                        value: 0,
                                        label: "0mm",
                                    },
                                    {
                                        value: 40,
                                        label: spacerLabel,
                                    },
                                    {
                                        value: 80,
                                        label: "80mm",
                                    },
                                ]}
                            />
                        </div>

                        <div className={styles.slider}>
                            <Slider
                                name="stem"
                                min={70}
                                max={140}
                                step={10}
                                defaultValue={state.stem}
                                value={state.stem}
                                aria-label="stem_slider"
                                valueLabelDisplay="on"
                                onChange={(event, value) => {
                                    if (
                                        event.type !== "mousemove" &&
                                        event.type !== "touchmove"
                                    ) {
                                        return;
                                    }
                                    setState({
                                        input: event.target.name,
                                        value: value,
                                    });
                                }}
                                marks={[
                                    {
                                        value: 70,
                                        label: "70mm",
                                    },
                                    {
                                        value: 105,
                                        label: "Stem Length",
                                    },
                                    {
                                        value: 140,
                                        label: "140mm",
                                    },
                                ]}
                            />
                        </div>

                        <div className={styles.slider}>
                            <Slider
                                name="angleHt"
                                min={65}
                                max={85}
                                step={0.25}
                                defaultValue={state.angleHt}
                                value={state.angleHt}
                                aria-label="angleht_slider"
                                valueLabelDisplay="on"
                                onChange={(event, value) => {
                                    if (
                                        event.type !== "mousemove" &&
                                        event.type !== "touchmove"
                                    ) {
                                        return;
                                    }
                                    setState({
                                        input: event.target.name,
                                        value: value,
                                    });
                                }}
                                marks={[
                                    {
                                        value: 65,
                                        label: <>65&deg;</>,
                                    },
                                    {
                                        value: 75,
                                        label: "Headtube Angle",
                                    },
                                    {
                                        value: 85,
                                        label: <>85&deg;</>,
                                    },
                                ]}
                            />
                        </div>

                        <div className={styles.slider}>
                            <Slider
                                name="angleStem"
                                min={-60}
                                max={60}
                                defaultValue={state.angleStem}
                                value={state.angleStem}
                                aria-label="anglestem_slider"
                                valueLabelDisplay="on"
                                onChange={(event, value) => {
                                    if (
                                        event.type !== "mousemove" &&
                                        event.type !== "touchmove"
                                    ) {
                                        return;
                                    }
                                    setState({
                                        input: event.target.name,
                                        value: value,
                                    });
                                }}
                                marks={[
                                    {
                                        value: -60,
                                        label: <>-60&deg;</>,
                                    },
                                    {
                                        value: 0,
                                        label: stemAngleLabel,
                                    },
                                    {
                                        value: 60,
                                        label: <>60&deg;</>,
                                    },
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
                                x1={state.stemXOrigin}
                                y1={state.stemYOrigin}
                                x2={topOfHTX}
                                y2={topOfHTY}
                                stroke="orange"
                                strokeWidth="5"
                            />
                            <line
                                aria-label="stem"
                                x1={
                                    state.stemXOrigin +
                                    Math.cos(getRadians(flippedHeadtubeAngle)) *
                                        state.spacer
                                }
                                y1={
                                    state.stemYOrigin -
                                    Math.sin(getRadians(flippedHeadtubeAngle)) *
                                        state.spacer
                                }
                                x2={
                                    topOfHTX -
                                    Math.cos(getRadians(stemAngle)) * state.stem
                                }
                                y2={
                                    topOfHTY -
                                    Math.sin(getRadians(stemAngle)) * state.stem
                                }
                                stroke="blue"
                                strokeWidth="5"
                            />
                        </svg>
                    </div>
                </div>
                <footer>
                    <Typography variant="body2" mt={5} mb={1} ml={1}>
                        For suggestions or bug reports, please send an email to
                        rswerve@gmail.com or{" "}
                        <Link href="https://github.com/rswerve/bike_stem_calculator/discussions/new">
                            start a discussion
                        </Link>{" "}
                        on Github.
                    </Typography>
                </footer>
            </>
        )
    );
}
