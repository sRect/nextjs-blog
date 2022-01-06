import Link from "next/link";
import Image from "next/image";
import { useRef, useEffect, useState, useCallback } from "react";
import { TextOutline, UserOutline } from "antd-mobile-icons";
import LayoutCom from "@/components/LayoutCom";
import styles from "@/styles/Home.module.css";

// https://nextjs.org/docs/basic-features/image-optimization#local-images
const allBgList = require.context("../public/images", false, /\.png$/);

const Home = () => {
  const [bgImg, setBgImg] = useState(() => "/images/test1.png");
  const wrapperRef = useRef(null);
  const h1Ref = useRef(null);
  const bgNumRef = useRef(1);
  const bgTotalNum = allBgList.keys().length / 2;

  const handleChangeBgImg = useCallback(() => {
    bgNumRef.current += 1;

    if (bgNumRef.current > bgTotalNum) bgNumRef.current = 1;

    setBgImg(`/images/test${bgNumRef.current}.png`);

    // const bgImg = document.querySelector("#bgImg");

    // if (bgImg) {
    //   const imgSrc = bgImg.src;
    //   console.log(imgSrc);

    //   // `url(/images/test${bgNumRef.current}.png)`
    //   document.body.style.setProperty("--home-background", `url(${imgSrc})`);
    // }
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
        <Image
          id="bgImg"
          className={styles.homeBgImg}
          src={bgImg}
          layout="fill"
          objectFit="cover"
          objectPosition="center"
          alt="img"
        />
        <div className={styles.container}>
          <h1 className={styles.header} ref={h1Ref}>
            个人博客
          </h1>

          <div className={styles.content}>
            <Link
              href={{
                pathname: "/posts/list",
              }}
              passHref
            >
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
};

export default Home;
