---
title: "3分钟使用Hexo搭建自己的博客"
keywords: "hexo, docker, github actions"
date: "2022-3-24"
---

- [本文 github 仓库](https://github.com/sRect/sRect.github.io)
- [本文 gitee 仓库](https://gitee.com/srect/hexo-blog)
- [博客预览](https://srect.github.io/)

## 1. Hexo 是什么？

Hexo 是一个快速、简洁且高效的博客框架。可以使用 Markdown 写文章，方便高效，无需后台服务，静态资源即可展示。搭配 github pages 或者个人云服务器都可以部署。

## 2. 安装

```bash
npm install -g hexo-cli
```

## 3. 初始化

```bash
hexo init <project-name>
cd <project-name>
npm install
```

## 4. 主要 api

1. 创建新文章

```bash
hexo new <title>
```

- 在`source/_posts/`下新建

例如创建 foo 页，在`source/_posts/`目录下就会多出一个`foo.md`文件，就在那里面写文章

```bash
hexo new foo
```

- 在`source`下新建其它的目录

例如在`source/about/`下创建`bar.md`文件

```bash
hexo new page --path about/bar "bar"
```

2. 生成静态文件

项目根目录会多出一个`public`文件夹，就是编译过后的`html`静态文件

```bash
hexo generate
```

3. 清除缓存

把上面生成的`public`文件夹删掉

```bash
hexo clean
```

4. 启动服务

默认情况下，`http://localhost:4000`访问

```bash
hexo server
```

## 5. 安装心仪的主题

1. [hexo themes](https://hexo.io/themes/)

这么多主题，总有一款适合你

2. 本文选择的主题[`hexo-theme-fluid`](https://github.com/fluid-dev/hexo-theme-fluid)

- 主题安装

```bash
npm install --save hexo-theme-fluid
```

然后在博客目录下创建 \_config.fluid.yml，将主题的 \_config.yml 内容复制进去

- 配置主题

修改 Hexo 博客目录中的 \_config.yml:

```
theme: fluid  # 指定主题

language: zh-CN  # 指定语言，会影响主题显示的语言，按需修改
```

## 6. 部署

### 6.1 github pages 部署

1. 在你的 github 上创建一个名为`<你的github用户名>.github.io`的仓库

2. 本地生成 ssh 密钥对

```bash
ssh-keygen -t rsa -C "用户名@example.com "
```

3. 在仓库`Settings > Deploy Keys`中添加公钥内容，并勾选访问权限，最后确定

4. 在仓库`Settings > Secrets`中添加私钥，key 为`DEPLOY_KEY`，内容为私钥内容

5. 项目`_config.yml`配置文件和主题配置文件配置`deploy`字段

```yml
deploy:
  type: git
  repo: <你的github仓库 SSH下载链接>
  branch: gh-pages
```

6. `.github/workflows/deploy.yml`

```yml
name: Hexo Github Pages Deploy

# https://github.com/marketplace/actions/hexo-action?version=v1.0.4

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    name: A job to deploy blog.
    steps:
      - name: Checkout
        uses: actions/checkout@v1
        with:
          submodules: true # Checkout private submodules(themes or something else).

      # Caching dependencies to speed up workflows. (GitHub will remove any cache entries that have not been accessed in over 7 days.)
      - name: Cache node modules
        uses: actions/cache@v1
        id: cache
        with:
          path: node_modules
          key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
          restore-keys: |
            ${{ runner.os }}-node-
      - name: Install Dependencies
        if: steps.cache.outputs.cache-hit != 'true'
        run: npm ci

      # Deploy hexo blog website.
      - name: Deploy
        id: deploy
        uses: sma11black/hexo-action@v1.0.3
        with:
          deploy_key: ${{ secrets.DEPLOY_KEY }}
          user_name: <你的github用户名> # (or delete this input setting to use bot account)
          user_email: <你的github邮箱> # (or delete this input setting to use bot account)
          commit_msg: ${{ github.event.head_commit.message }} # (or delete this input setting to use hexo default settings)
      # Use the output from the `deploy` step(use for test action)
      - name: Get the output
        run: |
          echo "${{ steps.deploy.outputs.notify }}"
```

7. 使用`git`提交代码，在仓库`Actions`里可以看到 yml 配置文件的自动执行日志，执行结束后，不出意外的话，浏览器里访问`https://<你的github用户名>.github.io`，可以看到你的博客了！

### 6.2 docker 容器部署在个人云服务器

1. 在 github 仓库`Settings > Secrets`中添加你的阿里云镜像容器服务账号，key 为`ALIYUN_DOCKER_USERNAME`，dockerhub 等也可以，这里以阿里云镜像容器服务为例

2. 在 github 仓库`Settings > Secrets`中添加你的阿里云镜像容器服务密码，key 为`ALIYUN_DOCKER_PASSWORD`

3. Dockerfile

```Dockerfile
# 1. 基础镜像安装
FROM alpine:3.15 AS base

ENV NODE_ENV=production \
  APP_PATH=/usr/share/nginx/hexo

WORKDIR $APP_PATH

# 使用国内镜像，加速下面 apk add安装
# 如果是在github上打包镜像，无需使用内内镜像，注释掉即可
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

RUN apk add --no-cache --update nodejs=16.14.0-r0 yarn=1.22.17-r0

# 2. 基于基础镜像安装项目依赖和打包
FROM base AS install

COPY . ./

RUN yarn install

RUN yarn run build

FROM base AS result

# 将public目录下的文件全部复制到/usr/share/nginx/hexo下面
COPY --from=install $APP_PATH/public .

# 3. 最终基于nginx进行构建
FROM nginx:alpine

WORKDIR /usr/share/nginx/hexo

# 添加自己的配置 default.conf 在下面
ADD nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=result /usr/share/nginx/hexo .

EXPOSE 80
```

4. `.github/workflows/deploy.yml`

```yml
name: deploy ci

on:
  push: # push 时触发ci
    branches: [main] # 作用于main分支
  # pull_request:
  #   branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    # strategy:
    #   matrix:
    #     node-version: [14.x]
    #     # See supported Node.js release schedule at https://nodejs.org/en/about/releases/

    steps:
      # 拉取main分支代码
      - name: Checkout
        uses: actions/checkout@v2

      # # 指定nodejs版本
      # - name: Use Node.js ${{ matrix.node-version }}
      #   uses: actions/setup-node@v2
      #   with:
      #     node-version: ${{ matrix.node-version }}
      #     cache: "yarn"

      # # 安装依赖
      # - name: install
      #   run: sudo yarn install

      # # 打包
      # - name: build
      #   run: sudo yarn run build

      # 制作docker镜像并推送到阿里云容器镜像服务
      - name: build and push docker image
        run: |
          echo ${{ secrets.ALIYUN_DOCKER_PASSWORD }} | docker login registry.cn-hangzhou.aliyuncs.com --username ${{ secrets.ALIYUN_DOCKER_USERNAME }} --password-stdin
          docker image build -t hexo-blog .
          docker tag hexo-blog registry.cn-hangzhou.aliyuncs.com/<命名空间>/<镜像仓库名>:latest
          docker push registry.cn-hangzhou.aliyuncs.com/<命名空间>/<镜像仓库名>:latest
          docker logout
```

5. 使用 docker 容器可视化管理，比如`portainer`等，拉取刚才制作的镜像，然后运行容器。或者登录云服务器，手动拉取镜像再运行容器

```bash
# 拉取镜像
docker pull registry.cn-hangzhou.aliyuncs.com/<命名空间>/<镜像仓库名>:latest

# 运行容器
docker container run -d -p <你的服务器宿主机向外暴露的端口>:80 --name hexo-blog registry.cn-hangzhou.aliyuncs.com/<命名空间>/<镜像仓库名>:latest
```

6. 不出意外，浏览器里访问`http:<你的ip或者配好的域名>:<端口>`，可以看到你的博客了！

## 7. 参考资料

1. [Hexo 官方文档](https://hexo.io/zh-cn/docs)
2. [Hexo Fluid 主题用户手册](https://hexo.fluid-dev.com/docs/guide)
3. [Hexo Github Action](https://github.com/marketplace/actions/hexo-action?version=v1.0.4)
