## 使用 Next.js 快速上手一个属于你的私人博客

### 1. Next.js 简介

> [The React Framework for Production] Next.js gives you the best developer experience with all the features you need for production: hybrid static & server rendering, TypeScript support, smart bundling, route pre-fetching, and more. No config needed.

一顿牛皮吹下来，就是 Next.js 在生产和开发环境下都能带给你最佳体验，开箱体验，无需任何配置

### 2. 为什么选择 Next.js

> 老表，咋回事哦，vue 不能满足了吗，搞这玩意干嘛，[vuepress](https://www.vuepress.cn/) 写所谓的静态博客网站不香？香，还比这简单，但请容许我介绍完这个 Nextjs

![](../images/nextjs-blog/gs.jpg)

#### 2.1 那 Next.js 有哪些优点呢？

- 图片优化
- 支持国际化
- 零配置
- 支持 SSG + SSR
- 文件系统路由
- 优点太多...

![](../images/nextjs-blog/yd.jpg)

#### 2.2 那 Next.js 比这 vue 和 react 造出来的单页面有何不同？

1. vue 和 react 造出来的单页面应用 SEO 不友好，搜索引擎抓不到 html 的内容，内容都在 js 里
2. vue 和 react 造出来的单页面首屏白屏时间过长，在不对项目 webpack 专门优化的情况下，那个 bundle.js 很大，严重影响体验

**总结**：如果项目对 SEO 要求比较高，建议上 Next 或[Nuxt](https://www.nuxtjs.cn/)

#### 2.3 Next.js 和传统的 php、jsp 有何区别？

> 简单了解

1. 客户端渲染

前后端分离，通过 ajax 进行数据交互，vue 和 react 就是这种模式

2. 服务端模板渲染

php 和 jsp 是解析模板文件，将数据渲染到文件上，最后将模板文件变为 html，生成 html 返回给浏览器，前后端不用同一套代码

3. 前后端同构渲染

也是服务端生成 html 返回给浏览器，区别在于前后端会共用一部分组件代码逻辑，这部分代码既可以用于服务端，也可以用于客户端，而模板渲染是两套代码

### 3. Next.js 主要 api 快速上手

> Node.js 版本 12.22.0 起步

#### 3.1 使用`create-next-app`脚手架创建项目

```bash
npx create-next-app@latest
# or
yarn create next-app
```

#### 3.2 项目目录结构

```
│  .eslintrc.json
│  .gitignore
│  next.config.js     # next配置文件
│  package.json
│  README.md
│  yarn.lock
│
├─pages               # 页面路由
│  │  index.js
│  │  _app.js
│  │
│  └─api              # api服务
│          hello.js
│
├─public              # 静态资源
│      favicon.ico
│      vercel.svg
│
└─styles              # css样式
        globals.css   # 全局样式
        Home.module.css
```

#### 3.3 路由

1. 文件系统路由

`/pages/index.js` 路径为 `/`
`/pages/posts/about.js` 路径为 `/posts/about`
`/pages/posts/[id].js` 动态路径为 `/posts/foo` 或者`/posts/bar` 等等

2. Link 组件

> Link 组件会自动执行 prefetch 预加载

```javascript
import Link from "next/link";

export default function Home() {
  return (
    <Link href="/posts/about">
      <a>about page</a>
    </Link>
  );
}

// 或者不用a标签，传参示例
<Link
  href={{
    pathname: "/about",
    query: { name: "test" },
  }}
  passHref
>
  <p>about page</p>
</Link>;
```

3. useRouter

```javascript
import { useRouter } from "next/router";
import { useCallback, useEffect } from 'react';

export default List() {
  const router = useRouter();

  const gotoDetail = useCallback((data) => {
    const { fileName: detailid } = data;

    // https://www.nextjs.cn/docs/api-reference/next/router#with-url-object
    router.push({
      pathname: "/posts/[detailid]",
      query: {
        detailid,
      },
    });
  }, []);

  useEffect(() => {
    // Prefetch the dashboard page
    router.prefetch('/dashboard');
  }, []);

  return (
    <div>
      ...
    </div>
  )
}
```

4. 动态路由

就是`/pages/posts/[id].js`这样的路由

```javascript
import { getAllPostIds, getPostData } from "@/lib/posts";

export async function getStaticPaths() {
  const allListData = await getAllPostIds();
  const paths = allListData.map((item) => {
    return {
      params: { id: item.fileName },
    };
  });

  return {
    paths,
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const postData = await getPostData(params.id);

  return {
    props: {
      postData,
    },
  };
}

export default function List({ postData }) {
  // ...
}
```

#### 3.4 Head 组件

> 用于自定义 head 标签内容

```javascript
import Head from "next/head";

export default function Layout({ children }) {
  return (
    <div>
      <Head>
        <meta charSet="UTF-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0"
        />
        <meta name="keywords" content="Next.js" />
        <meta name="description" content="Next.js" />
        <title>Next.js</title>
      </Head>
      <main>{children}</main>
    </div>
  );
}
```

#### 3.5 Image 组件

> 使用适当的属性，可以大幅优化图像，提升页面渲染

```javascript
import Image from "next/image";

export default function MyImg() {
  return (
    <Image
      className={styles.homeBgImg}
      src={bgImg}
      layout="fill"
      objectFit="cover"
      objectPosition="center"
      quality={65}
      priority={true}
      placeholder="blur"
      blurDataURL={DEFAULT_BASE64}
      alt="img"
    />
  );
}
```

#### 3.6 Script 组件

```javascript
import Script from "next/script";

export default function Home() {
  return (
    <>
      <Script
        src="https://Jquery.js"
        onLoad={() => {
          $.ajax({
            // ...
          });
        }}
      />
    </>
  );
}
```

#### 3.7 CSS

1. CSS Modules（已内置）
2. Sass（已内置）
3. styled-jsx（已内置）
4. [styled-components](https://github.com/vercel/next.js/tree/canary/examples/with-styled-components)（需自行配置）
5. [Tailwind CSS](https://tailwindcss.com/docs/installation/using-postcss)（需自行配置）

#### 3.8 Next.js 的 3 种基本预渲染方式

1. Client-side Rendering

> 就是常见的前后端分离

```javascript
import useSWR from "swr";

const fetcher = (url) => fetch(url).then((res) => res.json());

function Profile() {
  const { data, error } = useSWR("/api/user", fetcher);

  if (error) return <div>failed to load</div>;
  if (!data) return <div>loading...</div>;
  return <div>hello {data.name}!</div>;
}
```

2. Static Generation (Recommended)

> 一般以展示一些静态固定数据为主，打包的时候就直接生成，比如博客页面、固定营销页面、帮助文档等

```javascript
import { getAllPostIds } from "@/lib/posts";

export async function getStaticProps() {
  const allListData = await getAllPostIds();

  return {
    props: {
      allListData,
    },
  };
}

export default function List({ allListData }) {
  // ...
}
```

3. Server-side Rendering
   > 以动态数据为主，每次请求的时候都在服务端执行，对服务器压力比较大

```javascript
export async function getServerSideProps(context) {
  return {
    props: {
      list: [...]
    }
  }
}

export default function List({ list }) {
  // ...
}
```

### 4. 部署

#### 4.1 使用 Vercel 快速部署

### 参考资料

1. [官方文档](https://nextjs.org/docs/getting-started)

2. [前后端同构和模板渲染的区别是什么呢？](https://www.zhihu.com/question/379598562)
