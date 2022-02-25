import isWechat from "@/lib/isWechat";

export default function getIsWechat(req, res) {
  const userAgent = req.headers["user-agent"];
  const result = isWechat(userAgent);

  res.status(200).json({ isWechat: result });
}
