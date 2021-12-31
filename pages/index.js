import { useRef, useEffect } from "react";
import LayoutCom from "@/components/LayoutCom";
import styles from "@/styles/Home.module.css";

export default function Home() {
  const wrapperRef = useRef(null);
  const h1Ref = useRef(null);

  const handleChangeBgImg = () => {
    console.log(wrapperRef);
  };

  useEffect(() => {
    h1Ref.current?.addEventListener("click", handleChangeBgImg);

    return () => {
      h1Ref.current?.removeEventListener("click", handleChangeBgImg);
    };
  }, []);

  return (
    <LayoutCom home>
      <div className={styles.wrapper} ref={wrapperRef}>
        <div className={styles.container}>
          <h1 className={styles.header} ref={h1Ref}>
            个人博客
          </h1>
        </div>
      </div>
    </LayoutCom>
  );
}
