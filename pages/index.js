import { useReducer } from "react";
import { Input, Slider } from "@mui/material";
import styles from "../styles/Home.module.css";

const initialState = {
    stemXOrigin: 200,
    stemYOrigin: 240,
    spacerHeight: 25,
    stemLength: 100,
    angleHt: 73,
    angleStem: 0,
};

const getRadians = (angleDegrees) => {
    return (Math.PI / 180.0) * angleDegrees;
};

const reducer = (state, action) => {
    // console.log("state: ", state);
    // console.log("action: ", action.value);
    switch (action.slider) {
        case "spacer":
            return { ...state, ...action, spacerHeight: action.value };
        case "stem":
            return { ...state, ...action, stemLength: action.value };
        case "angleHt":
            return { ...state, ...action, angleHt: action.value };
        case "angleStem":
            return { ...state, ...action, angleStem: action.value };
    }
};

export default function Home() {
    const [state, setState] = useReducer(reducer, initialState);
    const flippedHeadtubeAngle = 90 + (90 - state.angleHt);
    const stemAngle = 180 - state.angleStem;
    const topOfHTX =
        state.stemXOrigin +
        Math.cos(getRadians(flippedHeadtubeAngle)) * state.spacerHeight;
    const topOfHTY =
        state.stemYOrigin -
        Math.sin(getRadians(flippedHeadtubeAngle)) * state.spacerHeight;
    const spacerRise = state.spacerHeight * Math.sin(getRadians(state.angleHt));
    const spacerRun =
        state.spacerHeight * Math.sin(getRadians(90 - state.angleHt));
    const stemRise = state.stemLength * Math.sin(getRadians(state.angleStem));
    const stemRun =
        state.stemLength * Math.sin(getRadians(90 - state.angleStem));

    return (
        <div className={styles.container}>
            <div>Rise: {Math.round(spacerRise + stemRise)}</div>
            {/* note subtraction */}
            <div>Run: {Math.round(stemRun - spacerRun)} </div>
            <div>Spacer Rise: {Math.round(spacerRise)}</div>
            <div>Spacer Run:{Math.round(spacerRun)}</div>
            <div>Stem Rise:{Math.round(stemRise)}</div>
            <div>Stem Run:{Math.round(stemRun)}</div>
            <div className={styles.slider}>
                <span>Spacer Height</span>
                <Slider
                    name="spacer"
                    min={0}
                    max={50}
                    defaultValue={state.spacerHeight}
                    value={state.spacerHeight}
                    aria-label="Default"
                    valueLabelDisplay="auto"
                    onChange={(event, value) =>
                        setState({ slider: event.target.name, value: value })
                    }
                />
                <span>Stem Length</span>
                <Slider
                    name="stem"
                    min={70}
                    max={140}
                    defaultValue={state.stemLength}
                    value={state.stemLength}
                    aria-label="Default"
                    valueLabelDisplay="auto"
                    onChange={(event, value) =>
                        setState({ slider: event.target.name, value: value })
                    }
                />
                <span>Headtube Angle</span>
                <Slider
                    name="angleHt"
                    min={65}
                    max={85}
                    step={0.25}
                    defaultValue={state.angleHt}
                    value={state.angleHt}
                    aria-label="Default"
                    valueLabelDisplay="auto"
                    onChange={(event, value) =>
                        setState({ slider: event.target.name, value: value })
                    }
                />
                <span>Stem Angle</span>
                <Slider
                    name="angleStem"
                    min={-30}
                    max={30}
                    defaultValue={state.angleStem}
                    value={state.angleStem}
                    aria-label="Default"
                    valueLabelDisplay="auto"
                    onChange={(event, value) =>
                        setState({ slider: event.target.name, value: value })
                    }
                />
            </div>
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
                            state.spacerHeight
                    }
                    y1={
                        state.stemYOrigin -
                        Math.sin(getRadians(flippedHeadtubeAngle)) *
                            state.spacerHeight
                    }
                    x2={
                        topOfHTX -
                        Math.cos(getRadians(stemAngle)) * state.stemLength
                    }
                    y2={
                        topOfHTY -
                        Math.sin(getRadians(stemAngle)) * state.stemLength
                    }
                    stroke="blue"
                    strokeWidth="5"
                />
            </svg>
        </div>
    );
}
