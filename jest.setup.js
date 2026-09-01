import "@testing-library/jest-dom";

if (!window.scrollTo) {
  Object.defineProperty(window, "scrollTo", {
    value: () => {},
    writable: true,
  });
}
