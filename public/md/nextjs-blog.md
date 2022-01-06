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

**总结**：如果项目对 SEO 要求比较高，建议上 Next 或[Nuxt](https://www.nuxtjs.cn/)，博客这种需要 SEO 好的了

#### 2.3 Next.js 和传统的 php、jsp 有何区别？

### 3. Next.js 主要 api 快速上手
