---
title: "微前端qiankun上手体验"
keywords: "微前端, single-spa, qiankun"
date: "2021-02-25"
---

> 1. [qiankun 官方文档](https://qiankun.umijs.org/zh)
> 2. [single-spa](https://zh-hans.single-spa.js.org/docs/getting-started-overview/)
> 3. [微前端-最容易看懂的微前端知识](https://juejin.cn/post/6844904162509979662#heading-0)

微前端的类型：

1. 受路由控制渲染的子应用
2. 不受路由控制的组件
3. 非渲染组件，应用间通信逻辑

### 1.子应用-vue

#### 1. vue-cli 创建子应用

```shell
vue create qiankun_vue
```

#### 2. 修改入口`main.js`文件

```javascript
// https://qiankun.umijs.org/zh/guide/tutorial#vue-微应用
import Vue from "vue";
import App from "./App.vue";
import router from "./router";

// Vue.config.productionTip = false

let vueInstance = null;
function render(props = {}) {
  const { container } = props;

  vueInstance = new Vue({
    router,
    render: (h) => h(App),
    // 这里是挂载到自己的html上，基座会拿到这个挂载后的html，将其插入到相应的容器里

    // Application died in status NOT_MOUNTED: Target container with #container not existed after xxx mounted!
    // 微应用的根 id 与其他 DOM 冲突。解决办法是：修改根 id 的查找范围。
  }).$mount(container ? container.querySelector("#app") : "#app");
}

// 使用 webpack 运行时 publicPath 配置
// 动态设置publicPath
if (window.__POWERED_BY_QIANKUN__) {
  __webpack_public_path__ = window.__INJECTED_PUBLIC_PATH_BY_QIANKUN__;
}

// https://qiankun.umijs.org/zh/faq#如何独立运行微应用？
if (!window.__POWERED_BY_QIANKUN__) {
  render();
}

// 暴露3个异步方法 bootstrap mount unmount
export async function bootstrap(props) {}
export async function mount(props) {
  console.log("props=====>", props);
  render(props);
}
export async function unmount(props) {
  vueInstance && vueInstance.$destroy();
}
```

#### 3. 修改路由`router/index.js`文件

```diff
  const router = new VueRouter({
    mode: 'history',
-    base: process.env.BASE_URL,
+    base: window.__POWERED_BY_QIANKUN__ ? '/vue' : process.env.BASE_URL,
    routes
  })

```

#### 4. 根目录新建`vue.config.js`，修改打包配置

```javascript
module.exports = {
  devServer: {
    port: 8000,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  },
  // https://webpack.docschina.org/configuration/output/#outputlibrary
  configureWebpack: {
    output: {
      library: "vueApp", // 打包成一个类库
      libraryTarget: "umd", // umd最终会把bootstrap/mount/unmount挂载到window上
    },
  },
};
```

### 2.子应用-react

#### 1. create-react-app 创建子应用

```
create-react-app qiankun_react
```

#### 2. 修改入口`index.js`文件

```javascript
import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter, Link, Route } from "react-router-dom";
import "./index.css";
import App from "./App";
// import reportWebVitals from './reportWebVitals';

function render(props) {
  const { container } = props;
  // https://reactrouter.com/web/api/BrowserRouter
  ReactDOM.render(
    <React.StrictMode>
      <BrowserRouter basename="/react">
        <Link to="/">react-home</Link> |<Link to="/about">react-about</Link>
        {/* exact 严格模式 */}
        <Route path="/" exact render={() => <App />}></Route>
        <Route
          path="/about"
          exact
          render={() => <div>react about page</div>}
        ></Route>
      </BrowserRouter>
    </React.StrictMode>,
    container
      ? container.querySelector("#root")
      : document.querySelector("#root")
  );
}

// 独立运行
if (!window.__POWERED_BY_QIANKUN__) {
  render();
}

export async function bootstrap(props) {}
export async function mount(props) {
  render(props);
}
export async function unmount(props) {
  const { container } = props;
  ReactDOM.unmountComponentAtNode(
    container
      ? container.querySelector("#root")
      : document.querySelector("#root")
  );
}
```

#### 3. 修改打包配置文件

##### 1. 安装`react-app-rewired`

```shell
yarn add react-app-rewired -D
```

##### 2. 子应用根目录新建`config-overrides.js`文件

```javascript
// https://github.com/timarney/react-app-rewired/blob/HEAD/README_zh.md#扩展配置选项
module.exports = {
  webpack: (config) => {
    config.output.library = "reactApp";
    config.output.libraryTarget = "umd";
    config.output.publicPath = "http://localhost:9000/";
    return config;
  },
  devServer: (configFunc) => {
    return (proxy, allowedHost) => {
      const config = configFunc(proxy, allowedHost);
      // 设置开发服务允许跨域
      config.headers = {
        "Access-Control-Allow-Origin": "*",
      };

      return config;
    };
  },
};
```

##### 3. 设置环境变量

1. 子应用根目录新建`.env`文件

```
PORT=4000
WDS_SOCKET_PORT=4000
```

或者在`package.json`启动脚本中修改端口

```diff
 "scripts": {
-     "start": "react-app-rewired start",
+     "start": "set PORT=4000 && react-app-rewired start",
   },
```

2. 修改`package.json`文件

```diff
 "scripts": {
-     "start": "react-scripts start",
-     "build": "react-scripts build",
-     "test": "react-scripts test",
-     "eject": "react-scripts eject"
+     "start": "react-app-rewired start",
+     "build": "react-app-rewired build",
+     "test": "react-app-rewired test",
+     "eject": "react-app-rewired eject"
   },
```

### 3.子应用(非 webpack 构建)-jquery+bootstrap

#### 1. 新建`index.html`文件

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Bootstrap 101 Template</title>
    <link href="//localhost:5000/lib/bootstrap.min.css" rel="stylesheet" />
  </head>
  <body>
    <div class="container" id="app">
      <h1>你好，世界！</h1>
      <div class="row">
        <div class="input-group">
          <span class="input-group-addon" id="basic-addon1">@</span>
          <input
            type="text"
            class="form-control"
            placeholder="Username"
            aria-describedby="basic-addon1"
          />
        </div>
      </div>
    </div>
    <script src="//localhost:5000/lib/jquery.min.js"></script>
    <script src="//localhost:5000/lib/bootstrap.min.js"></script>
    <!--  entry js为入口文件 -->
    <script src="//localhost:5000/entry.js"></script>
  </body>
</html>
```

#### 2. 新建`entry.js`入口文件

```javascript
const render = ($) => {
  $("#purehtml-container").html("Hello, render with jQuery");
  return Promise.resolve();
};
((global) => {
  global["purehtml"] = {
    bootstrap: () => {
      console.log("purehtml bootstrap");
      return Promise.resolve();
    },
    mount: () => {
      console.log("purehtml mount");
      return render($);
    },
    unmount: () => {
      console.log("purehtml unmount");
      return Promise.resolve();
    },
  };
})(window);
```

### 4.基座应用-vue

#### 1.修改入口`main.js`文件

```diff
import Vue from 'vue'
import App from './App.vue'
import router from './router'
+ import { registerMicroApps, start } from 'qiankun';
+ import ElementUI from 'element-ui';
+ import 'element-ui/lib/theme-chalk/index.css';

Vue.config.productionTip = false

+ Vue.use(ElementUI);

+ const apps = [
+   {
+     name: "vueApp",
+     // 默认通过fetch加载这个html，解析里面的js，动态的执行
+     // 注意：子应用必须支持跨域
+     entry: "http://localhost:8000",
+     container: "#vueDOM", // 容器名
+     activeRule: "/vue", // 激活路径
+     props: { a: 1, b: 2 }, // 传给子应用的参数
+   },
+   {
+     name: "reactApp",
+     entry: "//localhost:9000",
+     container: "#react",
+     activeRule: "/react",
+   },
+   {
+     name: "jqueryApp",
+     entry: "//localhost:5000",
+     container: "#jquery",
+     activeRule: "/jquery",
+     props: { a: 100, b: 200 },
+   },
+ ];
+
+ registerMicroApps(apps); // 注册应用
+ // 启动应用
+ start({
+   // https://qiankun.umijs.org/zh/api#startopts
+   prefetch: false, // 取消预加载
+ });

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
```

#### 2. 修改`App.vue`组件

```html
<template>
  <div id="app">
    <el-menu :router="true" mode="horizontal">
      <!-- 基座自己的路由 -->
      <el-menu-item index="/">base-home</el-menu-item>
      <el-menu-item index="/about">base-about</el-menu-item>
      <!-- 引用其他子应用 -->
      <el-menu-item index="/vue">vue 应用</el-menu-item>
      <el-menu-item index="/react">react 应用</el-menu-item>
      <el-menu-item index="/jquery">jquery + bootstrap 应用</el-menu-item>
    </el-menu>

    <router-view />

    <div id="vueDOM"></div>
    <div id="react"></div>
    <div id="jquery"></div>
  </div>
</template>
```
