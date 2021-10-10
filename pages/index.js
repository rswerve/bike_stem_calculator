import { useReducer } from "react";
import {
    FormControlLabel,
    Switch,
    Slider,
    Typography,
    TextField,
} from "@mui/material";
import styles from "../styles/Home.module.css";

const initialState = {
    stemXOrigin: 200,
    stemYOrigin: 240,
    spacer: 40,
    stem: 110,
    angleHt: 73,
    angleStem: 0,
    stack: 600,
    reach: 375,
    handlebarStack: 700,
    handlebarReach: 475,
    saddleHeight: 750,
    saddleSetback: 60,
    handlebarDrop: 40,
    saddleReach: 550,
    handlebarFit: true,
    complexFit: false,
};

const getRadians = (angleDegrees) => {
    return (Math.PI / 180.0) * angleDegrees;
};

const reducer = (state, action) => {
    console.log("state: ", state);
    console.log("action: ", action);
    return { ...state, ...action, [action.input]: action.value };
    // switch (action.input) {
    //     case "spacer":
    //         return { ...state, ...action, [action.input]: action.value };
    //     case "stem":
    //         return { ...state, ...action, stem: action.value };
    //     case "angleHt":
    //         return { ...state, ...action, angleHt: action.value };
    //     case "angleStem":
    //         return { ...state, ...action, angleStem: action.value };
    //     case "stack":
    //         return { ...state, ...action, stack: action.value };
    //     case "stack":
    //         return { ...state, ...action, reach: action.value };
    // }
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
                    <Typography>This is how you use it.</Typography>
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
                            min={-30}
                            max={30}
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
                                    value: -30,
                                    label: <>-30&deg;</>,
                                },
                                {
                                    value: 0,
                                    label: "Stem Angle",
                                },
                                {
                                    value: 30,
                                    label: <>30&deg;</>,
                                },
                            ]}
                        />
                    </div>
                    <Typography variant="h6">Frame</Typography>
                    <div id="frame">
                        <TextField
                            id="stack"
                            name="stack"
                            style={{ width: 100 }}
                            helperText="stack"
                            // type="text"
                            inputProps={{
                                type: "text",
                                inputMode: "numeric",
                                pattern: "[0-9]*",
                            }}
                            value={state.stack}
                            onChange={(event) =>
                                setState({
                                    input: event.target.name,
                                    value: event.target.value,
                                })
                            }
                        />
                        <TextField
                            id="reach"
                            name="reach"
                            style={{ width: 100 }}
                            helperText="reach"
                            // type="text"
                            inputProps={{
                                type: "text",
                                inputMode: "numeric",
                                pattern: "[0-9]*",
                            }}
                            value={state.reach}
                            onChange={(event) =>
                                setState({
                                    input: event.target.name,
                                    value: event.target.value,
                                })
                            }
                        />
                    </div>
                    <Typography variant="h6">Fit</Typography>
                    <FormControlLabel
                        control={<Switch defaultChecked />}
                        checked={state.handlebarFit}
                        label="Handlebar XY"
                    />
                    <div id="handlebar_x_y">
                        <TextField
                            id="handlebar_stack"
                            style={{ width: 100 }}
                            helperText="handlebar stack"
                            type="number"
                            value={5}
                        />
                        <TextField
                            id="handlebar_reach"
                            style={{ width: 100 }}
                            helperText="handlebar reach"
                            type="number"
                            value={6}
                        />
                    </div>
                    <FormControlLabel
                        control={<Switch defaultChecked />}
                        checked={state.complexFit}
                        label="Saddle Reach"
                    />
                    <div id="handlebar_x_y">
                        <TextField
                            id="handlebar_stack"
                            style={{ width: 100 }}
                            helperText="handlebar stack"
                            type="number"
                            value={5}
                        />
                        <TextField
                            id="handlebar_reach"
                            style={{ width: 100 }}
                            helperText="handlebar reach"
                            type="number"
                            value={6}
                        />
                    </div>
                </div>
                <div className={styles.riserun}>
                    <Typography>
                        <div>Rise: {Math.round(spacerRise + stemRise)}</div>
                        {/* note subtraction */}
                        <div>Run: {Math.round(stemRun - spacerRun)} </div>
                        <div>Spacer Rise: {Math.round(spacerRise)}</div>
                        <div>Spacer Run:{-Math.round(spacerRun)}</div>
                        <div>Stem Rise:{Math.round(stemRise)}</div>
                        <div>Stem Run:{Math.round(stemRun)}</div>
                    </Typography>
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
