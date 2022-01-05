import { getAllPostIds } from "@/lib/posts";

export default async function getPageListApi(req, res) {
  const allListData = await getAllPostIds();

  res.status(200).json({ data: allListData });
}
