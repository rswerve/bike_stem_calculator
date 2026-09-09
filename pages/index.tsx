import Head from "next/head";
import FitCalculator from "../components/FitCalculator";
import styles from "../styles/Home.module.css";

const canonicalUrl = "https://www.bikestem.fit/";
const description =
  "Calculate how stem length, angle, and spacer stack move your handlebar. Enter frame stack and reach plus your HX and HY fit target to find matching stems.";
const socialImageUrl = `${canonicalUrl}og.png`;

const Home = () => {
  return (
    <>
      <Head>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonicalUrl} />

        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="BikeStem.fit" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content="Bike Stem Calculator" />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={socialImageUrl} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta
          property="og:image:alt"
          content="Bike stem calculator with a to-scale stem and spacer diagram"
        />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Bike Stem Calculator" />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={socialImageUrl} />
        <meta
          name="twitter:image:alt"
          content="Bike stem calculator with a to-scale stem and spacer diagram"
        />
      </Head>

      <main className={styles.page}>
        <header className={styles.siteHeader}>
          <div className={styles.brandRow}>
            <h1 className={styles.brand}>
              BIKESTEM<span>.FIT</span>
              <span className={styles.visuallyHidden}>
                {" "}— bike stem calculator for stem length, angle, and spacer
                stack
              </span>
            </h1>
            <div className={styles.tagline}>
              <p>
                This is a road bike stem calculator that can also help translate
                measurements between a frame and a fitting.
              </p>
              <p>
                If you have frame and fit numbers, enter them below and adjust
                the sliders to see if a workable configuration is available.
                You want the sum of the frame and the stem to be as close as
                possible to HX and HY. Or you can just use the sliders as a
                simple stem calculator.
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
    </>
  );
};

export default Home;
