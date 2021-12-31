import LayoutCom from "@/components/LayoutCom";
import styles from "@/styles/Home.module.css";

export default function Home() {
  return (
    <LayoutCom home>
      <div className={styles.container}>
        <h1 style={{ color: "red" }}>container</h1>
      </div>
    </LayoutCom>
  );
}
