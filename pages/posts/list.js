import Head from "next/head";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import {
  List as AntdList,
  Skeleton,
  PullToRefresh,
  Tag,
  Space,
  Toast,
} from "antd-mobile";
import { sleep } from "antd-mobile/es/utils/sleep";
import styled from "styled-components";
// import useSWR from "swr";
import LayoutCom from "@/components/LayoutCom";
import { getAllPostIds } from "@/lib/posts";
import Result from "@/components/Result";

const PULL_REFRESH_STATUS = {
  pulling: "用力拉",
  canRelease: "松开吧",
  refreshing: "玩命加载中...",
  complete: "加载完成",
};

const tagColors = ["default", "primary", "success", "warning", "danger"];

const Wrapper = styled.div`
  width: 100%;
  height: calc(100vh - 45px);
  background-color: #fff;
  overflow-x: hidden;
  overflow-y: auto;
`;

export async function getStaticProps() {
  const allListData = await getAllPostIds();

  return {
    props: {
      allListData,
    },
  };
}

export default function List({ allListData }) {
  const router = useRouter();
  const [skeletonLoading, setSkeletonLoading] = useState(true);
  const [pageList, setPageList] = useState([]);

  const gotoDetail = (data) => {
    const { fileName: detailid } = data;

    Toast.show({
      icon: "loading",
      content: "加载中…",
      maskClickable: false,
      duration: 0,
    });

    // https://www.nextjs.cn/docs/api-reference/next/router#with-url-object
    router.push({
      pathname: "/posts/[detailid]",
      query: {
        detailid,
      },
    });
  };

  const handleRefresh = async () => {
    try {
      const data = await fetch("/api/article/list", { method: "POST" }).then(
        (res) => res.json()
      );

      setPageList(data?.data || []);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    setPageList(allListData);

    setTimeout(() => {
      setSkeletonLoading(false);
    }, 20);
  }, [allListData]);

  useEffect(() => {
    // https://www.nextjs.cn/docs/api-reference/next/router#usage-2
    router.prefetch("/posts/[detailid]");
  }, [router]);

  return (
    <LayoutCom>
      <Head>
        <title>文章列表</title>
      </Head>

      <Wrapper>
        {skeletonLoading ? (
          <Skeleton.Paragraph lineCount={20} animated />
        ) : (
          <PullToRefresh
            onRefresh={async () => {
              await sleep(200);
              await handleRefresh();
            }}
            renderText={(status) => {
              return <div>{PULL_REFRESH_STATUS[status]}</div>;
            }}
          >
            {pageList.length ? (
              <AntdList>
                {pageList.map((item) => {
                  return (
                    <AntdList.Item
                      key={item.id}
                      clickable
                      onClick={() => gotoDetail(item)}
                      description={
                        <>
                          <div style={{ margin: "6px 0" }}>
                            <Space>
                              {item.keywords.map((keywords, index) => (
                                <Tag
                                  color={
                                    tagColors[Math.floor(Math.random() * 6)]
                                  }
                                  key={index}
                                >
                                  {keywords}
                                </Tag>
                              ))}
                            </Space>
                          </div>
                          <span>{item.date}</span>
                        </>
                      }
                    >
                      {item.title}
                    </AntdList.Item>
                  );
                })}
              </AntdList>
            ) : (
              <Result title="暂无数据" description="" />
            )}
          </PullToRefresh>
        )}
      </Wrapper>
    </LayoutCom>
  );
}
