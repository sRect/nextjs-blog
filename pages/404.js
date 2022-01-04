import { ErrorBlock, AutoCenter } from "antd-mobile";
import LayoutCom from "@/components/LayoutCom";

export default function Custom404() {
  return (
    <LayoutCom>
      <div className="content">
        <AutoCenter>
          <ErrorBlock status="empty" />
        </AutoCenter>
      </div>

      <style jsx>{`
        .content {
          width: 100%;
          height: 90vh;
          overflow: hidden;
          position: absolute;
          top: 30%;
          left: auto;
        }
      `}</style>
    </LayoutCom>
  );
}
