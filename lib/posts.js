import fs from "fs";
import path from "path";
import { nanoid } from "nanoid";

const mdRoot = path.join(process.cwd(), "public/md");

// 获取文件名
export async function getAllPostIds() {
  const fileNames = fs.readdirSync(mdRoot);

  return fileNames.map((fileName) => {
    return {
      name: fileName.replace(/\.md$/, ""),
      id: nanoid(),
    };
  });
}
