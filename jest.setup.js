import "@testing-library/jest-dom/extend-expect";

if (!window.scrollTo) {
  Object.defineProperty(window, "scrollTo", {
    value: () => {},
    writable: true,
  });
}
