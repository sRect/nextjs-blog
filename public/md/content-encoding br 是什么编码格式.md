---
title: "content-encoding: br 是什么编码格式？"
subTitle: "subTitle Brotli"
date: "2021-12-23"
---

### 1.背景

最近跟着 `Next.js`文档在学习新手入门，最终打包部署在 `Vercel`上，当 F12 打开浏览器控制台，点击 Network 选项时，看到`Content-Encoding`一列，显示着 `br`，这是什么鬼？不是 `gzip`吗，这都触及到了我的知识盲区了，一起来了解下。

![Dingtalk_20211222151606.jpg](https://s2.loli.net/2021/12/22/2tzXxUwinTs8AGe.jpg)

### 2.`Brotli`是什么？

br 的全称是 Brotli

> Brotli is a data format specification for data streams compressed with a specific combination of the general-purpose LZ77 lossless compression algorithm, Huffman coding and 2nd order context modelling. Brotli is a compression algorithm developed by Google and works best for text compression. Brotli is primarily used by web servers and content delivery networks to compress HTTP content, making internet websites load faster. A successor to gzip, it is supported by all major web browsers and is becoming increasingly popular, as it provides better compression than gzip.

- Brotli 是一种数据格式规范
- Brotli 是谷歌公司开发的，适合于文本压缩
- Brotli 主要用于 web 服务器和`content delivery networks`来压缩 http 内容
- Brotli 继承自 gzip，被主流浏览器支持，优于 gzip

**总结：** 一番 BB 过后，br 比 gzip 强。

### 3. 几种常见的 Content-Encoding 格式

> Huffman coding: https://en.wikipedia.org/wiki/Huffman_coding

| Content-Encoding | 基于的算法                                          | 备注               |
| :--------------- | :-------------------------------------------------- | :----------------- |
| gzip             | LZ77                                                | 使用广泛           |
| compress         | LZW                                                 | 被大部分浏览器弃用 |
| deflate          | zlib 结构 + deflate                                 | -                  |
| identity         | 指自身，未经过压缩和修改                            | -                  |
| br               | LZ77 + Huffman coding + 2nd order context modelling | 使用广泛           |

### 4. Brotli [兼容性](https://caniuse.com/?search=Brotli)

除了 ie 和 opera mini 之外，其它的都已支持
![Dingtalk_20211222150634.jpg](https://s2.loli.net/2021/12/22/re6R8injzNGy3WS.jpg)

### 5. Nginx 开启 gzip

```
# nginx.conf
server {
  gzip on; #开启gzip
  gzip_buffers 32 4k; #设置压缩所需要的缓冲区大小，以4k为单位，如果文件为32k则申请32*4k的缓冲区
  gzip_comp_level 6; #gzip 压缩级别，1-9，数字越大压缩的越好，也越占用CPU时间
  gzip_min_length 4000; #gizp压缩起点，文件大于4k才进行压缩
  gzip_vary on; # 是否在http header中添加Vary: Accept-Encoding，建议开启
  gzip_static on; #nginx对于静态文件的处理模块，开启后会寻找以.gz结尾的文件，直接返回，不会占用cpu进行压缩，如果找不到则不进行压缩
  gzip_types text/xml text/javascript application/javascript text/css text/plain application/json application/x-javascript; # 进行压缩的文件类型
}
```

### 6. Centos 下 Nginx 开启 br

> **注意：** Brotli 压缩在 https 下才能生效

1. 先安装 epel-release

```
sudo yum install epel-release -y
```

2. 再安装

```
# 实际测试，这一步在我的屌丝1核2G的CentOS 7.6 64位上未能安装
# Loaded plugins: fastestmirror
# Loading mirror speeds from cached hostfile
# No package nginx-plus-module-brotli available.
# Error: Nothing to do

# https://docs.nginx.com/nginx/admin-guide/installing-nginx/installing-nginx-docker/
# 在 Docker 上部署 NGINX 和 NGINX Plus

yum install nginx-plus-module-brotli
```

3. 在 nginx.conf 中启用和配置 Brotli 模块

```
# nginx.conf

load_module modules/ngx_http_brotli_filter_module.so; # for compressing responses on-the-fly
load_module modules/ngx_http_brotli_static_module.so; # for serving pre-compressed files

http {
    server {
        brotli on;
        #...
    }
}
```

### 7. 参考资料

1. [Brotli 维基百科](https://en.wikipedia.org/wiki/Brotli)
2. [Content-Encoding MDN](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Content-Encoding)
3. [google/ngx_brotli](https://github.com/google/ngx_brotli)
