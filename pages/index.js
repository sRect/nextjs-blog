import Link from "next/link";
import Image from "next/image";
import { useRef, useEffect, useState, useCallback } from "react";
import { TextOutline, UserOutline } from "antd-mobile-icons";
import LayoutCom from "@/components/LayoutCom";
import styles from "@/styles/Home.module.css";

// https://nextjs.org/docs/basic-features/image-optimization#local-images
const allBgList = require.context("../public/images", false, /\.png$/);

// https://nextjs.org/docs/api-reference/next/image#blurdataurl
const keyStr =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

const triplet = (e1, e2, e3) =>
  keyStr.charAt(e1 >> 2) +
  keyStr.charAt(((e1 & 3) << 4) | (e2 >> 4)) +
  keyStr.charAt(((e2 & 15) << 2) | (e3 >> 6)) +
  keyStr.charAt(e3 & 63);

const rgbDataURL = (r, g, b) =>
  `data:image/gif;base64,R0lGODlhAQABAPAA${
    triplet(0, r, g) + triplet(b, 255, 255)
  }/yH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==`;

const Home = () => {
  const [bgImg, setBgImg] = useState(() => "/images/test1.png");
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
      <div className={styles.wrapper}>
        <Image
          id="bgImg"
          className={styles.homeBgImg}
          src={bgImg}
          layout="fill"
          objectFit="cover"
          objectPosition="center"
          quality={65}
          placeholder="blur"
          blurDataURL={rgbDataURL(2, 129, 210)}
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
