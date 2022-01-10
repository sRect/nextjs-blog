import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { nanoid } from "nanoid";
import { remark } from "remark";
import html from "remark-html";
import {
  remarkExtendedTable,
  extendedTableHandlers,
} from "remark-extended-table";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";

const mdRoot = path.join(process.cwd(), "public/md");

const getTimeStamp = (date) => new Date(date).getTime();

// 获取文件列表信息
export async function getAllPostIds() {
  const fileNames = fs.readdirSync(mdRoot);

  const result = fileNames.map((fileName) => {
    const fullPath = path.join(mdRoot, fileName);
    const matterResult = matter.read(fullPath);

    const { data } = matterResult;

    return {
      id: nanoid(),
      ...data,
      keywords: data.keywords.split(","),
      fileName: fileName.replace(/\.md$/, ""),
    };
  });

  const sortArr = result.sort(function (a, b) {
    return getTimeStamp(a.date) - getTimeStamp(b.date);
  });

  return sortArr.reverse();
}

// 文件详情
export async function getPostData(id) {
  const fullPath = path.join(mdRoot, `${id}.md`);

  // const fileContents = fs.readFileSync(fullPath, "utf8");
  // const matterResult = matter(fileContents);

  const matterResult = matter.read(fullPath);

  // https://github.com/wataru-chocola/remark-extended-table
  const processedContent = await remark()
    .use(html)
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkExtendedTable)
    .use(remarkRehype, null, {
      handlers: Object.assign({}, extendedTableHandlers),
    })
    .use(rehypeStringify)
    .process(matterResult.content);

  const contentHtml = processedContent.toString();

  return {
    id,
    contentHtml,
    ...matterResult.data,
  };
}
