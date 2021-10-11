import { useReducer } from "react";
import { Link, Slider, Tooltip, TextField, Typography } from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import styles from "../styles/Home.module.css";

const initialState = {
    stemXOrigin: 100,
    stemYOrigin: 250,
    spacer: 40,
    stem: 100,
    angleHt: 73,
    angleStem: 0,
    stack: "",
    reach: "",
    handlebarStack: "",
    handlebarReach: "",
    saddleHeight: 750,
    saddleSetback: 60,
    handlebarDrop: 40,
    saddleReach: 550,
};

const getRadians = (angleDegrees) => {
    return (Math.PI / 180.0) * angleDegrees;
};

const reducer = (state, action) => {
    // console.log("state: ", state);
    // console.log("action: ", action);
    return { ...state, ...action, [action.input]: action.value };
};

export default function Home() {
    const [state, setState] = useReducer(reducer, initialState);
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
                is a good explanation of the importance of these measurements,
                which you should get from your fitter.
            </Typography>
        </>
    );
    const spacerTooltip = (
        <Typography variant="body1">
            Be sure to include everything between the headset and the handlebar
            clamp--like the headset top cap--in addition to the spacers. Also
            note that bikes with carbon steerers are recommended not to exceed
            about 40mm in spacers.
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
        <>
            {/* <header className={styles.header}> */}
            <Typography variant="h4" color="blue" mt={1} ml={1}>
                Bicycle Stem & Fit Calculator
            </Typography>
            {/* </header> */}
            <div className={styles.gridlayout}>
                <div className={styles.intro}>
                    <Typography variant="body" paragraph>
                        {`This is a road bike stem calculator that can also help
                        translate measurements between a frame and a fitting.`}
                    </Typography>
                    <Typography variant="body" paragraph>
                        {`If you have frame and fit
                        numbers, enter them below and adjust the sliders to find
                        a workable configuration. Or you can just use the
                        sliders as a simple stem calculator.`}
                    </Typography>
                </div>
                <div className={styles.frame}>
                    <Typography variant="h6">Frame</Typography>
                    <div id="frame">
                        <TextField
                            id="stack"
                            name="stack"
                            style={{ width: 100 }}
                            helperText="Stack"
                            inputProps={{
                                type: "text",
                                inputMode: "numeric",
                                pattern: "[0-9]*",
                            }}
                            value={state.stack}
                            onChange={(event) =>
                                setState({
                                    input: event.target.name,
                                    value: Number(event.target.value),
                                })
                            }
                        />
                        <TextField
                            id="reach"
                            name="reach"
                            style={{ width: 100 }}
                            helperText="Reach"
                            inputProps={{
                                type: "text",
                                inputMode: "numeric",
                                pattern: "[0-9]*",
                            }}
                            value={state.reach}
                            onChange={(event) =>
                                setState({
                                    input: event.target.name,
                                    value: Number(event.target.value),
                                })
                            }
                        />
                    </div>
                </div>
                <div className={styles.fit}>
                    <Tooltip title={fitTooltip} leaveTouchDelay={10000}>
                        <Typography variant="h6">
                            Fit{" "}
                            <InfoIcon
                                fontSize="small"
                                sx={{ color: "orange" }}
                            />
                        </Typography>
                    </Tooltip>
                    <div id="handlebar_x_y">
                        <TextField
                            id="handlebar_stack"
                            name="handlebarStack"
                            style={{ width: 100 }}
                            helperText="HY"
                            inputProps={{
                                type: "text",
                                inputMode: "numeric",
                                pattern: "[0-9]*",
                            }}
                            value={state.handlebarStack}
                            onChange={(event) =>
                                setState({
                                    input: event.target.name,
                                    value: Number(event.target.value),
                                })
                            }
                        />
                        <TextField
                            id="handlebar_reach"
                            name="handlebarReach"
                            style={{ width: 100 }}
                            helperText="HX"
                            inputProps={{
                                type: "text",
                                inputMode: "numeric",
                                pattern: "[0-9]*",
                            }}
                            value={state.handlebarReach}
                            onChange={(event) =>
                                setState({
                                    input: event.target.name,
                                    value: Number(event.target.value),
                                })
                            }
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
                            {totalRise < 0 ? "Drop: " : "Rise: "}
                            {Math.round(Math.abs(spacerRise + stemRise))}mm
                            {/* Rise: {`${Math.round(spacerRise + stemRise)}mm`} */}
                        </Typography>
                        <Typography>
                            Run: {`${Math.round(stemRun - spacerRun)}mm`}
                        </Typography>
                    </div>
                    <div className={styles.slider}>
                        <Slider
                            name="spacer"
                            min={0}
                            max={80}
                            defaultValue={state.spacer}
                            value={state.spacer}
                            aria-label="Default"
                            valueLabelDisplay="on"
                            onChange={(event, value) =>
                                setState({
                                    input: event.target.name,
                                    value: value,
                                })
                            }
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
                            aria-label="Default"
                            valueLabelDisplay="on"
                            onChange={(event, value) =>
                                setState({
                                    input: event.target.name,
                                    value: value,
                                })
                            }
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
                            aria-label="Default"
                            valueLabelDisplay="on"
                            onChange={(event, value) =>
                                setState({
                                    input: event.target.name,
                                    value: value,
                                })
                            }
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
                            aria-label="Default"
                            valueLabelDisplay="on"
                            onChange={(event, value) =>
                                setState({
                                    input: event.target.name,
                                    value: value,
                                })
                            }
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
                        width="400"
                        height="500"
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
        </>
    );
}
