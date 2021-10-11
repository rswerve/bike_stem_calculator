import { useReducer } from "react";
import { Slider, Typography, TextField } from "@mui/material";
import styles from "../styles/Home.module.css";

const initialState = {
    stemXOrigin: 200,
    stemYOrigin: 240,
    spacer: 40,
    stem: 110,
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

    return (
        <>
            <div className={styles.gridlayout}>
                <div className={styles.intro}>
                    <Typography variant="body" paragraph>
                        {`This is road bike stem calculator that can also help
                        translate measurements from a bike fitting to a given
                        frame's stack and reach.`}
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
                    <Typography variant="h6">Fit</Typography>
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
                    <Typography>
                        Stack diff:{" "}
                        {Math.round(
                            state.handlebarStack -
                                (state.stack + spacerRise + stemRise)
                        )}
                    </Typography>
                    <Typography>
                        Reach diff:{" "}
                        {Math.round(
                            state.handlebarReach -
                                (state.reach + stemRun - spacerRun)
                        )}
                    </Typography>
                </div>
                <div className={styles.sliderContainer}>
                    <Typography variant="h6">Stem</Typography>
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
                                    label: "Spacer Height",
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
                                    label: "Stem Angle",
                                },
                                {
                                    value: 60,
                                    label: <>60&deg;</>,
                                },
                            ]}
                        />
                    </div>
                </div>
                <div className={styles.riserun}>
                    <div>
                        <div>Rise: {Math.round(spacerRise + stemRise)}</div>
                        {/* note subtraction */}
                        <div>Run: {Math.round(stemRun - spacerRun)} </div>
                        <div>Spacer Rise: {Math.round(spacerRise)}</div>
                        <div>Spacer Run:{-Math.round(spacerRun)}</div>
                        <div>Stem Rise:{Math.round(stemRise)}</div>
                        <div>Stem Run:{Math.round(stemRun)}</div>
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
