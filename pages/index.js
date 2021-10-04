import { useReducer } from "react";
import { Input, Slider } from "@mui/material";
import styles from "../styles/Home.module.css";

const initialState = {
    stemXOrigin: 200,
    stemYOrigin: 240,
    spacerHeight: 50,
    stemLength: 100,
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
    }
};

export default function Home() {
    const [state, setState] = useReducer(reducer, initialState);
    const topOfHTX =
        state.stemXOrigin + Math.cos(getRadians(73)) * state.spacerHeight;
    const topOfHTY =
        state.stemYOrigin - Math.sin(getRadians(73)) * state.spacerHeight;

    return (
        <div className={styles.container}>
            <div>
                Rise:{" "}
                {` ${Math.round(
                    state.spacerHeight * Math.sin(getRadians(73))
                )}`}
            </div>
            <div>
                Run:{" "}
                {` ${-Math.round(
                    state.spacerHeight * Math.sin(getRadians(17))
                )}`}
            </div>
            <div className={styles.slider}>
                <span>Spacer Height</span>
                <Slider
                    name="spacer"
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
                        Math.cos(getRadians(73)) * state.spacerHeight
                    }
                    y1={
                        state.stemYOrigin -
                        Math.sin(getRadians(73)) * state.spacerHeight
                    }
                    x2={topOfHTX - Math.cos(getRadians(0)) * state.stemLength}
                    y2={topOfHTY - Math.sin(getRadians(0)) * state.stemLength}
                    stroke="blue"
                    strokeWidth="5"
                />
            </svg>
        </div>
    );
}
