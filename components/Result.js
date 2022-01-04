import { ErrorBlock } from "antd-mobile";

export default function Result({ status = "default", title, description }) {
  return <ErrorBlock status={status} title={title} description={description} />;
}
