import Head from "next/head";
import Image from "next/image";
import { AutoCenter } from "antd-mobile";
import LayoutCom from "@/components/LayoutCom";

export default function List() {
  return (
    <LayoutCom>
      <Head>
        <title>生而为人 我很抱歉</title>
      </Head>

      <div className="content">
        <AutoCenter>
          <Image
            src="/images/test5.png"
            width="240"
            height="240"
            alt="生而为人 我很抱歉"
          />
        </AutoCenter>
      </div>

      <style jsx>{`
        .content {
          width: 100%;
          height: 90vh;
          overflow: hidden;
        }
      `}</style>
    </LayoutCom>
  );
}
