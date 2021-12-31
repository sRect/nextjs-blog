import Head from "next/head";
import Link from "next/link";
import { SafeArea } from "antd-mobile";

export default function LayoutCom({ children, home }) {
  return (
    <div className="wrapper">
      <SafeArea position="top" />
      <Head>
        <meta charSet="UTF-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0"
        />
        <meta
          name="keywords"
          content="Next.js | React.js | Node.js | Antd-Mobile"
        />
        <meta name="description" content="srect blog" />
        <title>sRect blog</title>
      </Head>
      <main>{children}</main>
      {!home && (
        <Link href="/">
          <a>返回首页</a>
        </Link>
      )}
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
