import { Link, Typography } from "@mui/material";
import FitCalculator from "../components/FitCalculator";
import styles from "../styles/Home.module.css";

const Home = () => {
  return (
    <>
      <Typography variant="h4" color="blue" mt={1} ml={1}>
        Bicycle Stem & Fit Calculator
      </Typography>
      <div className={styles.gridlayout}>
        <div className={styles.intro}>
          <Typography variant="body1" paragraph>
            This is a road bike stem calculator that can also help translate
            measurements between a frame and a fitting.
          </Typography>
          <Typography variant="body1" paragraph>
            If you have frame and fit numbers, enter them below and adjust the
            sliders to see if a workable configuration is available. You want
            the sum of the frame and the stem to be as close as possible to HX
            and HY.
          </Typography>
          <Typography variant="body1" paragraph>
            Or you can just use the sliders as a simple stem calculator.
          </Typography>
          <Typography variant="body1" paragraph>
            To save your work, simply bookmark the page.
          </Typography>
        </div>
        <FitCalculator />
      </div>
      <footer className={styles.footer}>
        <Typography variant="body2" mt={5} mb={1} ml={1}>
          For suggestions or bug reports, please send an email to
          rswerve@gmail.com or{" "}
          <Link href="https://github.com/rswerve/bike_stem_calculator/issues">
            open an issue
          </Link>{" "}
          on Github.
        </Typography>
      </footer>
    </>
  );
};

export default Home;
