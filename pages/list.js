import Head from "next/head";
import { useState, useEffect } from "react";
import { List as AntdList, Skeleton, PullToRefresh } from "antd-mobile";
import { sleep } from "antd-mobile/es/utils/sleep";
import styled from "styled-components";
import LayoutCom from "@/components/LayoutCom";
import { getAllPostIds } from "@/lib/posts";
import Result from "@/components/Result";

const PULL_REFRESH_STATUS = {
  pulling: "用力拉",
  canRelease: "松开吧",
  refreshing: "玩命加载中...",
  complete: "加载完成",
};

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
  const [skeletonLoading, setSkeletonLoading] = useState(true);
  const [pageList, setPageList] = useState([]);

  useEffect(() => {
    setPageList(allListData);

    setTimeout(() => {
      setSkeletonLoading(false);
    }, 1000);
  }, [allListData]);

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
              await sleep(1000);
            }}
            renderText={(status) => {
              return <div>{PULL_REFRESH_STATUS[status]}</div>;
            }}
          >
            {pageList.length ? (
              <AntdList>
                {pageList.map((item) => {
                  return (
                    <AntdList.Item key={item.id} clickable>
                      {item.name}
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
