import Link from "next/link";
import { useRef, useEffect, useCallback } from "react";
import { TextOutline, UserOutline } from "antd-mobile-icons";
import LayoutCom from "@/components/LayoutCom";
import styles from "@/styles/Home.module.css";

// https://nextjs.org/docs/basic-features/image-optimization#local-images
const allBgList = require.context("../public/images", false, /\.png$/);

export default function Home() {
  const wrapperRef = useRef(null);
  const h1Ref = useRef(null);
  const bgNumRef = useRef(1);
  const bgTotalNum = allBgList.keys().length / 2;

  const handleChangeBgImg = useCallback(() => {
    bgNumRef.current += 1;

    if (bgNumRef.current > bgTotalNum) bgNumRef.current = 1;

    document.body.style.setProperty(
      "--home-background",
      `url(/images/test${bgNumRef.current}.png)`
    );
  }, [bgTotalNum]);

  useEffect(() => {
    h1Ref.current?.addEventListener("click", handleChangeBgImg, false);

    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      h1Ref.current?.removeEventListener("click", handleChangeBgImg);
    };
  }, [handleChangeBgImg]);

  return (
    <LayoutCom home>
      <div className={styles.wrapper} ref={wrapperRef}>
        <div className={styles.container}>
          <h1 className={styles.header} ref={h1Ref}>
            个人博客
          </h1>

          <div className={styles.content}>
            <Link href="/posts/list" passHref>
              <p>
                <TextOutline fontSize={20} /> 文章列表
              </p>
            </Link>

            <Link href="/posts/about" passHref>
              <p>
                <UserOutline fontSize={20} /> 关于我
              </p>
            </Link>
          </div>
        </div>
      </div>
    </LayoutCom>
  );
}
