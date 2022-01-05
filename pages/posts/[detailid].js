import Head from "next/head";
import { useEffect } from "react";
import hljs from "highlight.js";
import LayoutCom from "@/components/LayoutCom";
import { getPostData, getAllPostIds } from "@/lib/posts";
import "github-markdown-css/github-markdown.css";
import "highlight.js/styles/github.css";

export async function getStaticPaths() {
  const allListData = await getAllPostIds();
  const paths = allListData.map((item) => {
    return {
      params: { detailid: item.fileName },
    };
  });

  return {
    paths,
    fallback: false,
  };
}

export async function getStaticProps(args) {
  const { params } = args;
  const postData = await getPostData(params.detailid);
  return {
    props: {
      postData,
    },
  };
}

export default function Post({ postData }) {
  useEffect(() => {
    const codeElList = document.querySelectorAll("pre code");
    [...codeElList].forEach((el) => {
      hljs.highlightElement(el);
    });
  }, []);

  return (
    <LayoutCom inTitle={postData.title}>
      <Head>
        <title>文章详情</title>
      </Head>
      <article>
        <div
          className="markdown-body"
          dangerouslySetInnerHTML={{ __html: postData.contentHtml }}
        />
      </article>
      <style jsx>{`
        .markdown-body {
          height: calc(100vh - 50px);
          padding: 0 10px;
          overflow-x: hidden;
          overflow-y: auto;
        }
      `}</style>
    </LayoutCom>
  );
}
