const withImages = require("next-images");

const withTM = require("next-transpile-modules")(["antd-mobile"]);

module.exports = withTM(
  withImages({
    // 你项目中其他的 Next.js 配置
    reactStrictMode: true,
    // 自定义环境变量
    env: {
      customKey: "my-value",
    },
    // 部署在子路径下
    // 在构建时设置
    // 页面中使用next/link，next/router在basePath会自动应用
    // 例如， using/about将自动变为/docs/aboutwhenbasePath设置为/docs
    // 使用next/image组件时，需要basePath在src
    // basePath: "/mypath",
    // 重写
    async rewrites() {
      return [
        {
          source: "/giaogiao",
          destination: "/",
        },
      ];
    },
  })
);
