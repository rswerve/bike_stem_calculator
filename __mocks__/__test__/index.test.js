import React from "react";
import Index from "../../pages/index";
import { render, fireEvent, waitFor, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

test("Calculations based on inputs are correct", () => {
    render(<Index />);
    fireEvent.change(screen.getByLabelText("stack"), {
        target: { value: 500 },
    });
    fireEvent.change(screen.getByLabelText("reach"), {
        target: { value: 400 },
    });
    fireEvent.change(screen.getByLabelText("handlebar_stack"), {
        target: { value: 600 },
    });
    fireEvent.change(screen.getByLabelText("handlebar_reach"), {
        target: { value: 500 },
    });
    expect(screen.getByText("Stack is TOO SHORT by 62mm")).toBeInTheDocument();
    expect(screen.getByText("Reach is TOO SHORT by 12mm")).toBeInTheDocument();
});

test("Calculations are correct after sliders change", () => {
    render(<Index />);
    fireEvent.change(screen.getByLabelText("stack"), {
        target: { value: 500 },
    });
    fireEvent.change(screen.getByLabelText("reach"), {
        target: { value: 400 },
    });
    fireEvent.change(screen.getByLabelText("handlebar_stack"), {
        target: { value: 600 },
    });
    fireEvent.change(screen.getByLabelText("handlebar_reach"), {
        target: { value: 500 },
    });
    fireEvent.change(screen.getByLabelText("spacer_slider"), {
        target: { value: 80 },
    });
    fireEvent.change(screen.getByLabelText("stem_slider"), {
        target: { value: 70 },
    });
    fireEvent.change(screen.getByLabelText("angleht_slider"), {
        target: { value: 85 },
    });
    fireEvent.change(screen.getByLabelText("anglestem_slider"), {
        target: { value: -60 },
    });
    expect(screen.getByText("Stack is TOO SHORT by 81mm")).toBeInTheDocument();
    expect(screen.getByText("Reach is TOO SHORT by 72mm")).toBeInTheDocument();
});
