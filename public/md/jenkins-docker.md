---
title: "多图超详细 jenkins 容器安装并部署前端项目"
keywords: "jenkins, docker"
date: "2022-03-08"
---

- [本文 my-jenkins github 仓库](https://github.com/sRect/myJenkins)
- [本文前端 react 项目 github 仓库](https://github.com/sRect/myblog)

### 1.提前准备

1. 1 台 linux 云服务器或者本地虚拟机代替
2. 在服务器宿主机上装好 docker
3. 准备好 2 个 github 仓库(或者 gitee 仓库),1 个用于 jenkins，1 个用于前端项目(文章以 github 仓库为例)
4. 1 个 dockerhub 仓库，用于存储 jenkins 镜像

### 2.jenkins 容器安装

#### 1. 安装前的疑问

1. 为什么不直接在宿主机上安装 jenkins？

答：可以直接在宿主机上安装 jenkins，并不一定非得使用容器这种形式安装，只不过本文使用了容器安装这种方式。

2. 为什么不直接拉取 dockerhub 上的 jenkins 镜像？

答：可以直接拉取，但一定要拉取`jenkins/jenkins`这个镜像，`jenkins`这个镜像已经很久没维护了。
还有官方的 jenkins 镜像默认是没有 sudo 用户权限的，即执行`sudo wget http://xxxx`，是不识别 sudo 命令的，还有常见的`wget`、`vim`、`ping`等常用命令都是没有的，需要自己安装，所以这里选择自己构建 jenkins 镜像。

3. 如何在 jenkins 容器里执行 docker 命令？

答：[一番搜索，有两种方案](http://www.up4dev.com/2018/11/27/run-docker-by-jenkins-in-docker/)，本文使用了 `Docker-outside-of-Docker` 方案，另一种未实验成功。

- `Docker-outside-of-Docker`

  使用外部的 docker，即容器宿主机上的 docker。将宿主机的 docker 程序映射到 jenkins 容器里。这样没安装 docker 的 jenkins 容器可以执行 docker 命令。但需要注意的是，容器里本身是没有 docker 的，是把指令发送给宿主机来执行的。

- `Docker-in-Docker`

  顾名思义，在 docker 容器里安装 docker，然后使用 docker。容器里有 docker，和宿主机上的 docker 是隔离的。

#### 2. Dockerfile 编写

```Dockerfile
FROM jenkins/jenkins:latest

USER root
RUN apt-get update \
  # 安装sudo
  && apt-get install -y sudo \
  && rm -rf /var/lib/apt/lists/*
RUN echo "jenkins ALL=NOPASSWD: ALL" >> /etc/sudoers

USER jenkins

EXPOSE 8080
```

#### 3. github 的 workflow 配置文件

- 前提需要在 github 的 jenkins 仓库里设置好 secrets

- 在仓库的`Settings -> Secrets -> Actions`，点击`New repository secret`按钮创建你的 dockerhub 账号和密码，即添加`DOCKERHUB_USERNAME`和`DOCKERHUB_TOKEN`。如下图所示操作：

![add secrets](../images/jenkins-docker/add-secrets.jpg)

- /.github/workflows/deploy.yml

```yml
name: jenkins image build and push

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v2

      #制作docker镜像推送到dockerhub
      - name: build and push to dockerhub
        run: |
          docker login -u ${{ secrets.DOCKERHUB_USERNAME }} -p ${{ secrets.DOCKERHUB_TOKEN }}
          docker image build -t my-jenkins:latest .
          docker tag my-jenkins:latest ${{ secrets.DOCKERHUB_USERNAME }}/my-jenkins:latest
          docker push ${{ secrets.DOCKERHUB_USERNAME }}/my-jenkins:latest
          docker logout
```

- git 提交代码，自动打包推送镜像到 dockerhub

```bash
git add .
git commit -m "feat: init"
git push -u origin main
```

不出意外，`Actions`里可以看到，自动部署成功

![workflows](../images/jenkins-docker/workflows.jpg)

镜像也成功推送到 dockerhub 了

![myjebkins](../images/jenkins-docker/myjebkins.jpg)

#### 4. 在服务器宿主机上拉取刚才的镜像并安装

1. 拉取镜像

```shell
docker pull [你的dockerhub名字]/my-jenkins:latest
```

2. 启动容器

```shell
sudo docker container run -d \
-v /var/run/docker.sock:/var/run/docker.sock \
-v $(which docker):/usr/bin/docker \
-p 8000:8080 \
--name my-jenkins [你的dockerhub名字]/my-jenkins:latest
```

解释下参数的含义：

- `-d`: 后台运行容器
- `-v`: 指定挂载目录卷。

  - 第 1 行表示将宿主机上的`/var/run/docker.sock`目录映射到容器中，这样我们在容器中运行的 docker 命令，就会被发送到宿主机上去执行
  - 第 2 行表示将宿主机上的 docker 程序映射到容器中，这样容器就可以运行 docker 命令，容器本身没有安装 docker 服务。

- `-p`: 前面是宿主机上的端口(服务器安全组中要配置好，不然浏览器里无法访问)，后面是容器端口，jenkins 默认是 8080 端口
- `-name`: 给容器命名，是基于`[你的dockerhub名字]/my-jenkins:latest`这个镜像创建的容器，并命名为`my-jenkins`

不出意外，容器启动成功，我们可以用浏览器进行访问了。

### 3.jenkins 容器配置

> **注意**：如果在 jenkins 里不部署 docker 项目，这一章节可以略过，这里都是为了能在 jenkins 里部署 docker 项目准备的。

在浏览器访问前，我们还需要进入容器内部，安装常用命令工具，检验是否可以执行 docker 命令。

1. 先进入容器内部

> 如果你的宿主机上安装了如`portainer`、`rancher`等 docker 容器管理面板，可以直接通过可视化的方式来进入容器，就不用敲命令了。

```bash
docker container exec -it my-jenkins /bin/bash
```

2. 查看系统信息

```bash
cat /etc/issue
```

不出意外，打印出

```
Debian GNU/Linux 11 \n \l
```

说明容器内部是`Debian`发行版，不是`Ubuntu`，也不是`CentOS`。

3. 安装常用工具

> 因为容器内是`Debian`，那就使用 `apt-get`。安装这些工具的目的在于后面有可能需要进入容器操作，所以这里提前安装好。

```bash
# 先更新升级apt-get源
sudo apt-get update
sudo apt-get upgrade
# 安装systemctl
sudo apt-get install -y systemctl
# 安装vim
sudo apt-get install -y vim
# 安装wget
sudo apt-get install -y wget
```

4. 检验容器内部是否可以执行 docker 命令

- 测试 `docker -v` 命令

  ```bash
  docker -v
  ```

  不出意外，正常打印信息，比如：

  ```
  Docker version 17.12.1-ce, build 7390fc6
  ```

  如果出现报错：

  ```
  docker: error while loading shared libraries: libltdl.so.7: cannot open shared object file: No such file or directory
  ```

  那就再安装`libltdl7`

  ```bash
  sudo apt-get install -y libltdl7
  ```

- 测试运行 `hello-world`

  ```bash
  sudo docker run --rm hello-world
  ```

  如果正常打印下面信息，说明在容器里执行 docker 命令是没问题的。

  ```
  Hello from Docker!
  This message shows that your installation appears to be working correctly.
  ```

### 4.jenkins 初始化

1. 浏览器里访问`http://[你的服务器ip]:[上面启动容器暴露的端口，我这里是8000]`，开始初始化，如下图：

![](../images/jenkins-docker/jenkens-init.jpg)

2. 初始化结束后，需要解锁 Jenkins

![](../images/jenkins-docker/jenkins-unlock.jpg)

进入容器内部，执行下面命令，复制出那一串密码，粘贴到这里，然后点击确定

```bash
cat /var/jenkins_home/secrets/initialAdminPassword
```

3. 安装推荐的插件

![](../images/jenkins-docker/jenkins-plugin.jpg)

点击左侧*安装推荐的插件*，过一会，等插件安装好

![](../images/jenkins-docker/jenkins-plugins-install.jpg)

4. 注册管理员账号

按着提示一步步来操作

![](../images/jenkins-docker/jenkins-admin.jpg)

5. 最终进入 jenkins 首页，表示安装成功了

![](../images/jenkins-docker/jenkins-welcome.jpg)

### 5.jenkins 部署前端项目

> 这里以 react(create-react-app 创建) 项目为例，vue 的一样的，和框架无关

#### 5.1 Jenkins 安装 Nodejs 插件

> 因为是前端项目，离不开 nodejs，所以要安装

1. 点击左侧`Manage Jenkins(系统管理)`,在`System Configuration(系统配置)`下点击`Manage Plugins(插件管理)`，找到并安装 Nodejs 插件，点击`Download now and install after restart`,安装完成后，勾选重启，jenkins 会自动重启

![](../images/jenkins-docker/jenkins-plugin-nodejs.png)

2. 重启完成后，点击左侧`Manage Jenkins(系统管理)`,在`System Configuration(系统配置)`下点击`全局工具配置`，找到 Nodejs 选项，点击`新增Nodejs`按钮，输入别名，最后点击保存，就配置好 Nodejs 了

![](../images/jenkins-docker/jenkins-global-plugin.jpg)

#### 5.2 部署前的配置

1. 提前准备好前端项目，提交到 github 仓库

2. github 生成 Personal access tokens

   github 头像下拉框-> `Settings` -> 左侧菜单`Developer settings` -> `Personal access tokens` -> 点击`Generate new token`，**注意：请把生成的 token 复制下来，页面刷新后就没了**

![](../images/jenkins-docker/github-token.jpg)

3. jenkins 中添加 Github 服务器

- 系统管理 -> 系统配置 -> 添加 Github 服务器 -> 添加 Secret text 凭证 -> 连接测试

![](../images/jenkins-docker/jenkins-addpj.jpg)

- 第 2 步点击后，弹出下面弹框，类型里下拉选择`Secret text`,`Secret`里填入上面生成的 token，点击确定

![](../images/jenkins-docker/jenkins-pj.jpg)

- 第 5 步点击后，勾选`为Github指定另一个Hook URL`,会自动生成一个 url，保存下这个 url

![](../images/jenkins-docker/jenkins-auto-webhooks.jpg)

**最后，别忘记保存**

4. 配置 github 仓库的`Webhooks`

- 点击`Settings`->`Webhooks`->`Add Webhook`->输入`Payload URL`

- 这里的 Payload URL，就是上面生成的 Hook URL

![](../images/jenkins-docker/github-webhook.jpg)

#### 5.3 正式部署前端项目

1. jenkins 左侧菜单点击`新建任务`，输入任务名称，选择`构建一个自由风格的软件项目`，点击确定

![](../images/jenkins-docker/jenkins-firsttask.jpg)

2. 创建

![](../images/jenkins-docker/jenkins-task-1.jpg)

3. 源码管理

![](../images/jenkins-docker/jenkins-task-2.jpg)

4. 构建触发器

> 这样每次在提交代码后，jenkins 就可以自动为我们构建项目

勾选`GitHub hook trigger for GITScm polling`

![](../images/jenkins-docker/jenkins-task-3.jpg)

5. 构建环境

这里是选择项目需要的 nodejs 版本，nodejs 的版本就按着前面所说的添加

![](../images/jenkins-docker/jenkins-task-4.jpg)

6. 构建-执行 shell

![](../images/jenkins-docker/jenkins-task-5.jpg)

完整 shell 如下：

```shell
node -v
npm -v
docker -v
sudo su

echo "1.开始打包构建==>"
npm install -g yarn
yarn install
npm run build

{ # try
	echo "2.暂停旧的容器==>"
  sudo docker container stop react-app
} || { # catch
  echo "2.旧的容器不存在==>"
    # save log for exception
}

{ # try
	echo "3.删除旧的容器==>"
  sudo docker container rm react-app
} || { # catch
  echo "3.旧的容器不存在==>"
}

{ # try
	echo "4.删除旧的镜像==>"
  sudo docker image rm react-app:latest
} || { # catch
  echo "4.旧的镜像不存在==>"
}

echo "5.开始构建==>"
sudo docker image build -t react-app:latest .
sudo docker tag react-app:latest srect/react-app:latest

echo "6.开始启动docer容器==>"

sudo docker container run -d -p 8002:80 --name react-app react-app:latest
```

7. 点击保存，然后`立即构建`，可以进入任务，点击控制台输出，查看具体的构建日志

![](../images/jenkins-docker/jenkins-console.jpg)

8. 我们可以随便修改下前端代码，然后提交代码，测试是否会自动构建

![](../images/jenkins-docker/jenkins-github-hook-log.jpg)

### 6. 参考资料

1. [用安装在 Docker 中的 jenkins 运行 Docker 任务](http://www.up4dev.com/2018/11/27/run-docker-by-jenkins-in-docker/)
2. [Jenkins+Github 实现自动触发构建](https://blog.csdn.net/qq_35566908/article/details/103149181)
