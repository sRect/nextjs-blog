import Head from "next/head";
import { useRouter } from "next/router";
import { NavBar } from "antd-mobile";
import { SafeArea } from "antd-mobile";

export default function LayoutCom({ children, home, inTitle }) {
  const router = useRouter();

  const handleBack = () => {
    router.route === "/404" ? router.replace("/") : router.back();
  };

  return (
    <div className="wrapper">
      <SafeArea position="top" />
      <Head>
        <meta charSet="UTF-8" />
        <meta
          name="viewport"
          content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0"
        />
        {/* <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0"
        /> */}
        <meta
          name="keywords"
          content="sRect blog | Next.js | React.js | Node.js | Antd-Mobile"
        />
        <meta name="description" content="srect blog" />
        <title>sRect blog</title>
      </Head>

      {!home && (
        <NavBar
          onBack={handleBack}
          back={router.route === "/404" ? "返回首页" : "返回"}
        >
          {inTitle}
        </NavBar>
      )}
      <main>{children}</main>
      <SafeArea position="bottom" />
      <style jsx>
        {`
          .wrapper {
            width: 100%;
            height: auto;
          }
        `}
      </style>
    </div>
  );
}
