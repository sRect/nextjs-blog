import { useRouter } from "next/router";
import { useEffect } from "react";
import "../styles/globals.css";

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  const routeChangeStart = (...args) => {
    console.log("routeChangeStart==>", args);
  };

  // const routeChangeComplete = (...args) => {
  //   console.log("routeChangeComplete==>", args);
  // };

  // const beforeHistoryChange = (...args) => {
  //   console.log("beforeHistoryChange==>", args);
  // };

  const routeChangeError = (err, url) => {
    if (err.cancelled) {
      console.log(`Route to ${url} was cancelled!`);
    }
  };

  useEffect(() => {
    router.events.on("routeChangeStart", routeChangeStart);
    // router.events.on("routeChangeComplete", routeChangeComplete);
    // router.events.on("beforeHistoryChange", beforeHistoryChange);
    router.events.on("routeChangeError", routeChangeError);

    return () => {
      router.events.off("routeChangeStart", routeChangeStart);
      // router.events.off("routeChangeComplete", routeChangeComplete);
      // router.events.off("beforeHistoryChange", beforeHistoryChange);
      router.events.off("routeChangeError", routeChangeError);
    };
  }, [router.events]);

  return <Component {...pageProps} />;
}

export default MyApp;
