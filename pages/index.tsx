import FitCalculator from "../components/FitCalculator";
import styles from "../styles/Home.module.css";

const Home = () => {
  return (
    <main className={styles.page}>
      <header className={styles.siteHeader}>
        <div className={styles.brandRow}>
          <h1 className={styles.brand}>
            BIKESTEM<span>.FIT</span>
          </h1>
          <div className={styles.tagline}>
            <p>
              This is a road bike stem calculator that can also help translate
              measurements between a frame and a fitting.
            </p>
            <p>
              If you have frame and fit numbers, enter them below and adjust
              the sliders to see if a workable configuration is available. You
              want the sum of the frame and the stem to be as close as possible
              to HX and HY. Or you can just use the sliders as a simple stem
              calculator.
            </p>
            <p>To save your work, simply bookmark the page.</p>
          </div>
        </div>
        <div className={styles.headerRule} />
      </header>

      <FitCalculator />

      <footer className={styles.footer}>
        Your setup is saved in the page address, so bookmarking or sharing the
        page preserves it. Questions or bugs? Email rswerve@gmail.com or{" "}
        <a href="https://github.com/rswerve/bike_stem_calculator/issues">
          open an issue on GitHub
        </a>
        .
      </footer>
    </main>
  );
};

export default Home;
