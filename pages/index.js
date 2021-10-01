import { useReducer } from "react";
import { Slider } from "@mui/material";
import styles from "../styles/Home.module.css";

const initialState = {
    stemXOrigin: 0,
    stemYOrigin: 150,
    stemLength: 50,
    spacerHeight: 50,
};

const reducer = (state, action) => {
    console.log("state: ", state);
    console.log("action: ", action);
    switch (action.slider) {
        case "stem":
            return { ...state, ...action, stemLength: action.value };
    }
};

export default function Home() {
    const [state, setState] = useReducer(reducer, initialState);
    return (
        <div className={styles.container}>
            <Slider
                name="stem"
                defaultValue={state.stemLength}
                value={state.stemLength}
                aria-label="Default"
                valueLabelDisplay="auto"
                onChange={(event, value) =>
                    // console.log(event, value) ||
                    setState({ slider: event.target.name, value: value })
                }
            />
            <svg
                width="200"
                height="250"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
            >
                <line
                    x1={state.stemXOrigin}
                    y1={state.stemYOrigin}
                    x2="200"
                    y2={state.stemYOrigin + state.stemLength}
                    stroke="orange"
                    strokeWidth="5"
                />
            </svg>
        </div>
    );
}
