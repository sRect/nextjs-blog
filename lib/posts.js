import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { nanoid } from "nanoid";

const mdRoot = path.join(process.cwd(), "public/md");

// 获取文件列表信息
export async function getAllPostIds() {
  const fileNames = fs.readdirSync(mdRoot);

  return fileNames.map((fileName) => {
    const fullPath = path.join(mdRoot, fileName);
    const matterResult = matter.read(fullPath);
    const { data, content } = matterResult;

    return {
      id: nanoid(),
      ...data,
      keywords: data.keywords.split(","),
      fileName: fileName.replace(/\.md$/, ""),
      content,
    };
  });
}
