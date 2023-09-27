---
title: "一次页面请求loading转圈圈没停止bug的追踪"
keywords: "uniapp, 微信小程序, javascript"
date: "2023-08-01"
---

- [本文掘金链接](https://juejin.cn/post/7262201057957429304)

> 终极省流：项目中封装的请求方法存在问题，刷新token成功后，没把旧的请求结果返回到业务代码中，Promise一直处在pending状态，所以关闭loading方法一直没执行，导致一直在转圈圈

## 1. 项目背景

+ uniapp 微信小程序项目
+ 项目中采用JWT登录，登录成功后返回`access_token`和`refresh_token`，其中access_token用于每次请求的时候在header中带上令牌，`Authorization: Bearer {{access_token}}`，refresh_token用于access_token过期失效后刷新新的access_token
+ 网络请求采用的是基于`uni.request`自行封装的方法

## 2. 发现bug及分析

### 2.1 误会了mescroll-uni

+ 发生bug的页面，是一个列表页，请求需要携带token的，列表里采用了[mescroll-uni](http://www.mescroll.com/uni.html#options)库（是专门用在uni-app的下拉刷新和上拉加载的组件, 支持一套代码编译到iOS、Android、H5、小程序等多个平台）

> mescroll-uni简单使用示例

```html
<template>
  <mescroll-uni ref="mescrollRef" bottom="0" :safearea="true" :down="downOption" :up="upOption" @init="mescrollInit" @down="downCallback" @up="upCallback">
    <view v-for="item in list" :key="item.id">
      <!-- ... -->
    </view>
  </mescroll-uni>
</template>

<script>
import MescrollMixin from "mescroll-uni/mescroll-mixins.js";
import MescrollUni from "mescroll-uni/mescroll-uni.vue";

export default {
  mixins: [MescrollMixin],
  components: {
    "mescroll-uni": MescrollUni
  },
  data() {
    return {
      list: [],
      upOption: {
        use: true, // 是否启用上拉加载; 默认true
        auto: true, // 是否在初始化完毕之后自动执行上拉加载的回调; 默认true
        page: {
          num: 0, // 当前页码,默认0,回调之前会加1,即callback(page)会从1开始
          size: 10 // 每页数据的数量,默认10
        },
        noMoreSize: 1, // 配置列表的总数量要大于等于5条才显示'-- END --'的提示
        empty: {
          tip: '暂无数据',
          icon: emptyPNG
        },
        textNoMore: '---没有更多了---'
      },
    }
  },
  methods: {
    async upCallback(page) {
      try {
        const res = await http('/api/xxx/getList', "POST");

        if (res.code === 200) {
            // 接口返回的当前页数据列表
            let curPageData = res.data.list;
            // 接口返回的总长度
            let totalSize = res.data.total;
            // 接口返回的当前页数据长度
            let curPageLen = res.data.list.length;

            this.list = page.num === 1 ? curPageData : [...this.list, ...curPageData];
            this.mescroll.endBySize(curPageLen, totalSize);
          }
      } catch(e) {
        console.error(e);
        this.mescroll.endErr();
      }
    },
  }
}
</script>
```

+ 当access_token失效后，而这时候刚好点击进入到了这个列表页，而mescroll-uni在upOption中配置了`auto: true`(即初始化完毕之后自动执行上拉加载的回调)，此时会走刷新token操作，token刷新成功后，会重新把刚才的请求走一遍，然后把结果返回给页面。问题就出现在这，由于封装的请求方法中的刷新token模块有问题，没有把重新请求的结果返回给页面，导致mescroll-uni一直在loading。

+ 而在微信开发者工具network中看到没任何问题，请求A返回code为4011，token失效，发起refresh_token请求，然后再次发送请求A，步骤没错。console控制台也没有任何报错。

+ 当重新下拉刷新后，列表就重新渲染了(因为此时发起的请求，带的token已经是刷新过后的新token)，这样造成我一度认为mescroll-uni库有bug，无语！

### 2.2 token刷新方法存在问题

> 一次偶然在请求前加了`uni.showLoading`，发现token刷新成功后，转圈圈居然还在，`uni.hideLoading`未执行，让我恍然大悟，项目中自行封装的`http`方法有问题

```javascript
export default {
	methods: {
		async fetchData() {
			uni.showLoading();
			try {
				const res = await http("/api/xxx/xxx", "POST");
				uni.hideLoading();
			} catch (e) {
				uni.hideLoading();
				console.error(e);
			}
		}
	},
	async onLoad() {
		await this.fetchData();
	}
}
```

**存在问题**的`http`请求方法代码片段：

```javascript
import config from "./config";

const http = (path,method,params,header) => {
	return new Promise((resolve, reject) => {
		uni.request({
			method: method,
			url,
			header: {
				...header,
				Authorization: uni.getStorageSync("access_token")
					? "Bearer " + uni.getStorageSync("access_token")
					: "",
			},,
			data: params,
			success: async (res) => {
				const {
					data: { code, msg }} = res;
				if (code >= 200 && code < 300) {
					resolve(res.data);
				} else if (code === 4011) {
					// ==>问题就出现在这
					refreshToken({ path, method, params, isRsa });
				} else if (code === 4013) {
					gotoLoginPage();
				} else {
					reject(res.data);
				}
			},
			fail: (err) => {
				console.error("请求失败", err);
				reject(err);
			},
		});
	});
};

function refreshToken(failParams) {
	uni.request({
		method: "POST",
		url: config.baseUrl + "/api/xxx/token/reset",
		data: {
			refresh_token: uni.getStorageSync("refresh_token"),
		},
		success: (res) => {
			const { code, data } = res.data;

			if (code === 200) {
				uni.setStorageSync("access_token", data.access_token);
				uni.setStorageSync("refresh_token", data.refresh_token);

				const { path, method, params, isRsa } = failParams;
				// 这里虽然把那次请求重新发送出去，但是结果没返回给页面
				http(path, method, params, isRsa);
			} else if (code === 4012) {
				// refresh_token也失效了，重新登录
				gotoLoginPage();
			}
		},
		fail: (err) => {
			console.error("请求失败", err);
		},
	});
}

export default http;
```

**分析**：上面代码中可以看到，当返回4011 token失效后，refreshToken方法中，刷新token后，重新执行http方法发起请求，这时候的结果，没有resolve或者reject回去，导致页面那一次请求一直处在pending状态，而[uni.request](https://uniapp.dcloud.net.cn/api/request/request.html#request)方法默认超时时间为60000ms(即1分钟)，没等到1分钟，就手动离开这个页面了，导致超时的错误也没看到。refreshToken方法里虽然把那一次请求重新发出了，但这里就如同你用postman，请求成功与否和页面代码已无关

## 3. 无感刷新的修改

> 项目是中途接手，那就基于这个继续修改，就不替换了

**两个注意点：**

1. 当access_token失效后，此时刷新token，要防止重复刷新，用一个变量控制
2. 当access_token失效后，此时正在刷新token，如果页面中此时还有其它请求正在发出，需要存起来(Promise在pending状态)，等token刷新成功后，再把刚才存起来的请求按顺序一个个拿出来，按顺序重新发起请求，并把结果返回给页面(把Promise状态改为fulfilled或者rejected状态)

改造后的完整代码片段：

```javascript
// 标记token是否正在刷新
let isRefreshing = false;
// 需要重新发起请求的队列
const oldRequestQueue = [];

const http = (path,method,params,header) => {
	return new Promise((resolve, reject) => {
		uni.request({
			method: method,
			url,
			header: {
				...header,
				Authorization: uni.getStorageSync("access_token")
					? "Bearer " + uni.getStorageSync("access_token")
					: "",
			},
			data: params,
			success: async (res) => {
				const {
					data: { code, msg },} = res;
				if (code >= 200 && code < 300) {
					resolve(res.data);
				} else if (code === 4011) {
					// 改造重点在这==>
					if(!isRefreshing) {
            isRefreshing = true;
						// 将当前这次请求存入requests中
						oldRequestQueue.push(() => Promise.resolve({ resolve, reject, path, method, params, isRsa }));

						console.log("准备开始刷新token");
						let refreshTokenIsOk = "";
						try {
							refreshTokenIsOk = await refreshToken();
						} catch (error) {
							console.error("刷新token错误:", error);
							oldRequestQueue.length = 0;
							gotoLoginPage();
						} finally {
							isRefreshing = false;
						}

						if (refreshTokenIsOk === "refresh_token_ok") {
							console.log("刷新token成功， oldRequestQueue.length:", oldRequestQueue.length);

							if (oldRequestQueue.length > 0) {
								// token 刷新后将oldRequestQueue村的请求重新执行
								for await (let fn of oldRequestQueue) {
									const {
										resolve: oldResolve,
										reject: oldReject,
										path: oldPath,
										method: oldMethod,
										params: oldParams,
										isRsa: oldIsRsa,
									} = await fn();

									try {
										const res = await http(oldPath, oldMethod, oldParams, oldIsRsa);
										oldResolve(res);
									} catch (error) {
										oldReject(error);
									}
								}

								// 重新请求完清空requests
								oldRequestQueue.length = 0;
							}
						}
					} else {
						// 此时正在刷新token，有请求过来，将请求也存入oldRequestQueue中
						console.log("正在刷新token,存入oldRequestQueue:", path);
						oldRequestQueue.push(() => Promise.resolve({ resolve, reject, path, method, params, isRsa }));
					}
				} else if (code === 4013) {
					gotoLoginPage();
				} else {
					reject(res.data);
				}
			},
			fail: (err) => {
				console.error("请求失败", err);
				reject(err);
			},
		});
	});
};

async function refreshToken() {
	uni.request({
		method: "POST",
		url: config.baseUrl + "/api/xxx/token/reset",
		data: {
			refresh_token: uni.getStorageSync("refresh_token"),
		},
		success: (res) => {
			const { code, data } = res.data;

			if (code === 200) {
				uni.setStorageSync("access_token", data.access_token);
				uni.setStorageSync("refresh_token", data.refresh_token);

				return Promise.resolve("refresh_token_ok");
			} else if (code === 4012) {
				// refresh_token也失效了，重新登录
				oldRequestQueue.length = 0;
				gotoLoginPage();
			}
		},
		fail: (err) => {
			console.error("请求失败", err);
			return Promise.reject(err);
		},
	});
}

export default http;
```

## 4. 参考资料

1. [封装 axios 拦截器实现用户无感刷新 access_token](https://juejin.cn/post/6854573219119104014)

