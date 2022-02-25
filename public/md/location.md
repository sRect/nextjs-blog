---
title: "微信小程序持续获取定位测试"
keywords: "微信小程序, Tarojs"
date: "2021-11-03"
---

- [github 源码仓库](https://github.com/sRect/taro_wx)

### 1. 客户端详情

> 文章内使用 Tarojs 开发微信小程序

- 手机型号：小米 10
- 操作系统及版本：Android 10
- 客户端平台：android
- SDKVersion：2.20.2

### 2. 注意点

1. taro 项目配置文件`src/app.config.js`中要添加以下配置

```javascript
export default {
  requiredBackgroundModes: ["location"],
  permission: {
    "scope.userLocation": {
      desc: "如实填写实际用途", // 高速公路行驶持续后台定位
    },
  },
};
```

2. 检查手机是否打开位置信息开关

```javascript
Taro.getSystemInfoAsync({
  success(data) {
    console.log(data.locationEnabled);
  },
});
```

3. 检查是否给微信开了定位权限

```javascript
Taro.getSystemInfoAsync({
  success(data) {
    console.log(data.locationAuthorized);
  },
});
```

4. 检查当前小程序是否开了后台定位权限

```javascript
Taro.getSetting({
  success(res) {
    const authSetting = res.authSetting;
    if (
      !authSetting["scope.userLocation"] ||
      !authSetting["scope.userLocationBackground"]
    ) {
      // 让用户在弹出的选项中务必勾选“使用小程序期间和离开小程序之后”选项
      Taro.openSetting();
    }
  },
});
```

### 3. 完整代码

```jsx
import React, { useState } from "react";
import Taro, { useReady, useDidShow, useDidHide } from "@tarojs/taro";
import { View, Map } from "@tarojs/components";

const hasOwnProperty = (obj, key) => {
  return Object.prototype.hasOwnProperty.call(obj, key);
};

const HandleLocation = () => {
  const [systemSetting, setSystemSetting] = useState({});
  const [location, setLocation] = useState({ longitude: "", latitude: "" });
  const [locationList, setLocationList] = useState([]);

  const handleGetLocation = () => {
    if (Taro.canIUse("startLocationUpdateBackground")) {
      // https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/authorize.html
      // 小程序全局配置
      // https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/app.html#permission
      // wx.authorize({scope: "scope.userInfo"})，不会弹出授权窗口，请使用 <button open-type="getUserInfo"/>
      // 需要授权 scope.userLocation、scope.userLocationBackground 时必须配置地理位置用途说明

      Taro.startLocationUpdateBackground({
        success() {
          Taro.onLocationChange((data) => {
            setLocationList((pre) => [...pre, data]);

            setLocation({ longitude: data.longitude, latitude: data.latitude });

            // ajax发送数据到后台
            // ...
          });
        },
        fail(err) {
          console.log(err);
          Taro.showToast({
            icon: "error",
            title: "定位失败",
          });

          Taro.openSetting();
        },
      });
    } else {
      Taro.showToast({
        icon: "error",
        title: "您的设备暂不支持定位",
      });
    }
  };

  // 检查手机是否打开位置信息开关
  // 检查是否给微信开了定位权限
  const checkMobileLocationAuth = () => {
    return new Promise((resolve, reject) => {
      Taro.getSystemInfoAsync({
        success(data) {
          setSystemSetting(data);

          if (
            data &&
            hasOwnProperty(data, "locationEnabled") &&
            !data.locationEnabled
          ) {
            Taro.showModal({
              title: "提示",
              content: "请打开手机设置-位置信息(GPS)开关",
              confirmText: "确定",
              showCancel: false,
            });

            reject();
          }

          if (
            data &&
            hasOwnProperty(data, "locationAuthorized") &&
            !data.locationAuthorized
          ) {
            Taro.showModal({
              title: "提示",
              content:
                "请打开手机设置-应用设置-应用管理-微信-权限管理-定位权限开关",
              confirmText: "确定",
              showCancel: false,
              success() {
                // Taro.openSetting();
              },
            });

            reject();
          }

          resolve();
        },
        fail() {
          reject();
        },
      });
    });
  };

  // 检查当前小程序是否开了定位权限
  const checkMiniAppLocationAuth = () => {
    return new Promise((resolve, reject) => {
      if (!Taro.canIUse("getSetting")) return reject();

      Taro.getSetting({
        success: function (res) {
          const authSetting = res.authSetting;

          if (
            authSetting &&
            hasOwnProperty(authSetting, "scope.userLocation") &&
            hasOwnProperty(authSetting, "scope.userLocationBackground") &&
            authSetting["scope.userLocation"] &&
            authSetting["scope.userLocationBackground"]
          ) {
            resolve();
          } else {
            if (Taro.canIUse("openSetting")) {
              Taro.showModal({
                title: "提示",
                content:
                  "请在点击确定后，在弹出的选项中务必勾选“使用小程序期间和离开小程序之后”选项",
                confirmText: "确定",
                showCancel: false,
                success() {
                  Taro.openSetting();
                },
              });
            } else {
              Taro.showModal({
                title: "提示",
                content:
                  "请点击右上角“...”更多-设置-位置信息，在弹出的选项中务必勾选“使用小程序期间和离开小程序之后”选项",
                confirmText: "确定",
                showCancel: false,
              });
            }

            reject();
          }
        },
      });
    });
  };

  useReady(() => {
    console.log("useReady==>");
  });

  useDidShow(() => {
    console.log("useDidShow==>");
    if (Taro.canIUse("stopLocationUpdate")) {
      Taro.stopLocationUpdate({
        complete() {
          checkMobileLocationAuth()
            .then(checkMiniAppLocationAuth)
            .then(() => {
              // 全部ok，可以进行持续定位
              handleGetLocation();
            })
            .catch(() => {
              console.log("err==>");
            });
        },
      });
    }
  });

  useDidHide(() => {
    console.log("useDidHide==>");
  });

  return (
    <View>
      <Map
        style="width: 100%; height: 200px;"
        scale={16}
        longitude={location.longitude}
        latitude={location.latitude}
      />
    </View>
  );
};
```

### 4. 总结

- 经过本地开发实际测试，把小程序切到后台后，切换到其他 app
- 或者手机直接锁屏

以上两种情况，1 分钟后，`startLocationUpdateBackground`api 即失效，只有重新解锁手机，重新回到微信，api 的实时位置监控才被唤醒，尚未找到解决方法

### 5. 其他

钉钉小程序`dd.getLocation`只有当前钉钉小程序当前在激活状态下可以获取到，切换到后台和手机锁屏后，即失效

### 6. 参考资料

1. [微信小程序授权](https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/authorize.html)
2. [微信小程序全局配置](https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/app.html#permission)
