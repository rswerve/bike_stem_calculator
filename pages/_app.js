import "../styles/globals.css";
import { Analytics } from "@vercel/analytics/react";
import { NuqsAdapter } from "nuqs/adapters/next/pages";

function MyApp({ Component, pageProps }) {
  return (
    <NuqsAdapter>
      <Component {...pageProps} />
      <Analytics />
    </NuqsAdapter>
  );
}

export default MyApp;
