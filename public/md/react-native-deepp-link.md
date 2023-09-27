---
title: "React Native Android端 Deep Link"
keywords: "react native, deep link, app link, android"
date: "2023-09-07"
---

![](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/d533f586e46248138cab9cd34cc7d386~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=240&h=240&s=20130&e=jpg&b=ecebeb)

[本文 github 仓库链接](https://github.com/sRect/reactNativeBlogApp)

本文测试主要版本信息
| package                  | version  |
| ------------------------ | :------: |
| react                    |  18.2.0  |
| react-native             |  0.71.2  |
| android             |  13  |
| 手机             |  小米10  |

## 1. `Deep Link`的日常使用场景

1. 从并夕夕app分享到微信，邀请好友砍一刀，其中有的链接打开后是h5页面，h5页面打开后，弹出提示，“立即打开xx应用”，或者打开后，要求右上角在本机浏览器中打开，然后浏览器里弹出提示，“当前网站请求打开xx应用”。

2. 从app中，或者短信中打开微信小程序，链接如`weixin://dl/business/?t= *TICKET*`。

## 2. 什么是`Deep Link`?

[文档](https://www.reactnative.cn/docs/security#authentication-and-deep-linking)中提到：

> Mobile apps have a unique vulnerability that is non-existent in the web: deep linking. Deep linking is a way of sending data directly to a native application from an outside source. A deep link looks like app:// where app is your app scheme and anything following the // could be used internally to handle the request.

> Deep links are not secure and you should never send any sensitive information in them.

总结：
1. `Deep Link`是手机端app中独有的；

2. `Deep Link`是一种通过外面链接把数据发送到app里的方法；

3. `Deep Link`长得像`app://`，其中“*app*”是你自定义的scheme，“*//*”后面跟的内容，用来给app处理的；

4. `Deep Link`是不安全的，不要通过这种方式发送敏感数据。

## 3. 开启Deep Link

> 下面xml中有注释掉的配置，是因为准备配置app link，验证app link，通过后才允许拉起app，配置好后，但验证失败了，下面会讲

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<manifest>
  <queries>
    <!-- <intent>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="https" 
          android:host="my.applink.com"
          android:pathPrefix="/detail" />
    </intent> -->

    <intent>
        <action android:name="android.intent.action.VIEW" />
        <data android:scheme="yourScheme" />
    </intent>
  </queries>
</manifest>
```

或者

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<manifest>
  <activity android:name=".MainActivity" android:launchMode="singleTask">
    <intent-filter>
      <action android:name="android.intent.action.VIEW" />
      <data android:scheme="yourScheme" />
    </intent-filter>

     <!-- 注意：“/”在pathPrefix中是必须的 -->
    <!-- <intent-filter android:autoVerify="true">
      <action android:name="android.intent.action.VIEW" />
      <category android:name="android.intent.category.DEFAULT" />
      <category android:name="android.intent.category.BROWSABLE" />
      <data android:scheme="https" 
        android:host="my.applink.com"
        android:pathPrefix="/detail" />
    </intent-filter> -->
  </activity>  
</manifest>
```

## 4. 处理Deep Link

### 4.1 监听其它app通过deep Link拉起本app

```javascript
import React, {Fragment, useEffect, memo} from 'react';
import {Linking} from 'react-native';
import {useNavigate} from 'react-router-native';

const DeepLinksListener = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const cb = data => {
      console.log('Linking data==>', data);

      const url = data.url;
      const schemas = [
        'yourScheme://',
        'https://my.applink.com/',
      ];

      if (schemas.some(s => url.startsWith(s))) {
        let newUrl = url
          .replace(schemas[0], '')
          .replace(schemas[2], '');
        navigate && navigate(`/${newUrl}`);
      }
    };
    Linking.addEventListener('url', cb);

    // return () => {
    //   Linking.removeEventListener('url', cb);
    // };
  }, [navigate]);

  return <Fragment />;
};

export default memo(DeepLinksListener);
```

### 4.2 通过Deep link打开其它app

```javascript
import {Linking} from 'react-native';

const handleOpenUrl = async linkUrl => {
  try {
    const supported = await Linking.canOpenURL(linkUrl);
    console.log('supported', supported);
    if (supported) {
      // Opening the link with some app, if the URL scheme is "http" the web link should be opened
      // by some browser in the mobile
      await Linking.openURL(linkUrl);
    } else {
      Alert.alert('提示', `无法打开${linkUrl}`, [{text: '确定'}]);
    }
  } catch (error) {
    console.error(error);
    Alert.alert('提示', `无法打开${linkUrl},${error.message}`, [
      {text: '确定'},
    ]);
  }
};
```

1. 测试打开微信App

```javascript
handleOpenUrl("weixin://"); // 可以正常拉起打开微信
```

2. 测试打开另一个RN App

> 前提是另一个app中AndroidManifest.xml中已经配置好deep link

```javascript
handleOpenUrl("mydeeplink://");
```

+ `await Linking.canOpenURL("mydeeplink://")`直接返回false
+ 直接通过`await Linking.openURL("mydeeplink://")`可以拉起另一个RN App
+ 感觉 `Linking.canOpenURL`有问题，知道原因的告诉我一声，测试机型是小米13，android13版本

3. 测试scheme为https和http的链接

```javascript
handleOpenUrl("https://cn.bing.com"); // 正常拉起手机浏览器，并打打开网站
```

4. 测试打开app设置页

```javascript
await Linking.openSettings(); // 正常打开app设置页
```

5. 通过adb指令测试

```sh
adb shell am start -W -a android.intent.action.VIEW -d "yourScheme://detail/xxx" com.your-app-name # 成功拉起目标app
```

### 4.3 被其他App拉起后获取Deep Link

```javascript
const initialUrl = await Linking.getInitialURL();

console.log('initialUrl:', initialUrl);
```

1. 在开发debugger模式下，Linking.getInitialURL始终返回null
2. 如果app是被其它app拉起的，会获取到deep link值，反之始终为null

## 5. App Link

## 5.1 App Link 与 Deep Link比较

> [文档](https://developer.android.google.cn/training/app-links/verify-android-applinks?hl=zh-cn)

|  | Deep Link | App Link |
| :---: | :---: | :---: |
| intent 网址架构 | http、https 或自定义架构 | 需要 http 或 https |
| intent 操作 | intent 操作	任何操作 | 需要 android.intent.action.VIEW |
| intent 类别 | 任何类别 | 需要 android.intent.category.BROWSABLE 和 android.intent.category.DEFAULT |
| 链接验证 | 无 | 需要通过 HTTPS 协议在您的网站上发布 Digital Asset Links 文件 |
| 用户体验 | 可能会显示一个消除歧义对话框，以供用户选择用于打开链接的应用 | 无对话框；您的应用会打开以处理您的网站链接 |
| 兼容性 | 所有 Android 版本 | Android 6.0 及更高版本 |

## 5.2 App Link配置步骤

### 5.2.1 AndroidManifest.xml配置

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<manifest>
  <meta-data android:name="asset_statements" android:resource="@string/asset_statements" />
  <activity ...>

    <intent-filter android:autoVerify="true">
      <action android:name="android.intent.action.VIEW" />
      <category android:name="android.intent.category.DEFAULT" />
      <category android:name="android.intent.category.BROWSABLE" />
      <data android:scheme="https" 
        android:host="my.applink.com"
        android:pathPrefix="/detail" />
    </intent-filter>

  </activity>
</manifest>
```

```xml
<!-- android/app/src/main/res/values/strings.xml -->
<resources>
  <string name="asset_statements">
    [{
      \"relation\": [\"delegate_permission/common.share_location\"],
      \"target\": {
        \"namespace\": \"web\",
        \"site\": \"https://my.applink.com\"
      }
    }]
  </string>
</resources>
```

### 5.2.2 本地部署一个https服务

> 可以使用nginx或者[live-server](https://www.npmjs.com/package/live-server)等，我这里使用了live-server

1. 使用openssl创建https证书

+ 生成服务器私钥

```sh
openssl genrsa -out server.key 1024
```

+ 根据私钥和输入的信息生成证书请求文件

```sh
openssl req -new -key server.key -out server.csr
```

+ 第一步的私钥和第二步的请求文件生成证书(下面失效时间为365天)

```sh
openssl x509 -req -in server.csr -out server.crt -signkey server.key -days 3650
```

2. [live-server开启https](https://github.com/tapio/live-server#https)

> 如果有现成的https部署的网站，就不用本地这么麻烦了，直接部署在线上

把上一步生成的`server.crt`和`server.key`都复制到live-server项目根目录里

```javascript
var fs = require("fs");
var path = require("path");
var liveServer = require("live-server");

var params = {
  port: 443, // Set the server port. Defaults to 8080.
  host: "0.0.0.0", // Set the address to bind to. Defaults to 0.0.0.0 or process.env.IP.
  root: "./", // Set root directory that's being served. Defaults to cwd.
  open: false, // When false, it won't load your browser by default.
  ignore: "scss,my/templates", // comma-separated string for paths to ignore
  file: "index.html", // When set, serve this file (server root relative) for every 404 (useful for single-page applications)
  wait: 1000, // Waits for all changes, before reloading. Defaults to 0 sec.
  mount: [["/components", "./node_modules"]], // Mount a directory to a route.
  logLevel: 2, // 0 = errors only, 1 = some, 2 = lots
  middleware: [
    function (req, res, next) {
      if (req.url === "/.well-known/assetlinks.json") {
        const data = fs.readFileSync(
          path.join(__dirname, "./.well-known/assetlinks.json")
        );

        res.writeHead(200, {
          "Content-Disposition": "attachment; filename=assetlinks.json",
          "Content-Type": "application/json",
        });

        res.end(data);
      }

      next();
    },
  ], // Takes an array of Connect-compatible middleware that are injected into the server middleware stack
  https: {
    cert: fs.readFileSync(path.join(__dirname, "./server.crt")),
    key: fs.readFileSync(path.join(__dirname, "./server.key")),
    passphrase: "12345",
  },
  // "https-module": "httpsModule",
};
liveServer.start(params);
```

3. 获取App debug.keystore的SHA256签名

> 这是在react native项目的根目录执行，debug.keystore的密钥库口令是 `android`

```sh
keytool -list -v -keystore android/app/debug.keystore
```

4. live-server项目根目录创建`.well-known/assetlinks.json`文件

> 这里可以使用[线上的语句列表生成器和测试器](https://developers.google.cn/digital-asset-links/tools/generator?hl=zh-cn)

把上面生成的SHA256签名填入下面的`sha256_cert_fingerprints`中

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.example",
    "sha256_cert_fingerprints":
    ["14:6D:E9:83:C5:73:06:50:D8:EE:B9:95:2F:34:FC:64:16:A0:83:42:E6:1D:BE:A8:8A:04:96:B2:3F:CF:44:E5"]
  }
}]
```
5. 修改本地hosts

```
192.168.1.5 my.applink.com
```


6. 验证访问`assetlinks.json`文件

+ 启动live-server项目

```sh
npx live-server
```

+ 浏览器输入`https://my.applink.com/.well-known/assetlinks.json`可以正常打开下载，说明部署正常

7. 手机端验证访问`assetlinks.json`文件

手机要和电脑处在同一局域网下(wifi下)，修改手机的wifi代理配置，填入主机名(电脑ip)和端口号，这样手机就可以访问下载`assetlinks.json`文件了，代理我这里用的是[anyproxy](https://www.npmjs.com/package/anyproxy)。

### 5.2.3 测试App Link

1. 测试网址 intent

```sh
adb shell am start -a android.intent.action.VIEW \
    -c android.intent.category.BROWSABLE \
    -d "http://my.applink.com/detail/xxx" \
    com.your-app-name
```
**测试结果**：经过实际测试可以正常拉起app，并跳转到app指定页面

2. 在另一个RN项目中拉起测试

```javascript
await Linking.openURL("https://my.applink.com/detail/xxx")
```

**测试结果**： 经过实际测试，只拉起了手机本地浏览器，没有拉起app。有可能是上面生成的https证书，手机不认可（浏览器弹出了警告，点击继续才打开网页）

3. 调用android原生方法传入app link拉起测试

```java
package com.your-app-name;
import android.content.Intent;
import android.net.Uri;

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;

public class OpenAppLinkModule extends ReactContextBaseJavaModule {
  private static ReactApplicationContext reactContext;

  private static final String OPENLINK_OK = "OPENLINK_OK";
  private static final String OPENLINK_ERR = "OPENLINK_ERR";

  @Override
  public String getName() {
    return "OpenAppLink";
  }

  public OpenAppLinkModule(ReactApplicationContext context) {
    super(context);
    reactContext = context;
  }

  @ReactMethod
  public void handleOpenAppLink(String appLinkUrl, String appPackageName, Promise promise) {
    try {
      Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(appLinkUrl));
      intent.setPackage(appPackageName);
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
      reactContext.startActivity(intent);

      promise.resolve(OPENLINK_OK);
    } catch (Exception e) {
      promise.reject(OPENLINK_ERR, e);
    }
  }
}
```

js端调用android原生方法

```javascript
import {NativeModules} from 'react-native';

try {
  const res = await NativeModules.OpenAppLink.handleOpenAppLink(
    'https://my.applink.com/detail/xxx',
    'com.your-app-name',
  );
  console.log('openAppLink res:', res);
} catch (error) {
  console.error(error);
}
```

**测试结果**： 经过实际测试，可以正常拉起app，并跳转到指定页面

4. 顺便测试下h5页面拉起app

+ 在live-server的根目录`index.html`中，添加a链接拉起app

```html
<a id="deepLinkId" href="yourAppScheme://detail/xxx" target="_blank">打开 app 测试</a>
```

+ 如果想在打开h5页面时，免去用户的点击操作，可以添加js，主动派发点击事件

```javascript
window.addEventListener("DOMContentLoaded", () => {
  var btn = document.querySelector("#deepLinkId");
  var event = document.createEvent("MouseEvent");
  event.initMouseEvent("click", true, true, document.defaultView, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
  btn.dispatchEvent(event);  //在这一步会设置event.target,以及触发事件类型
});
```

**测试结果**：经过实际测试，点击a链接，浏览器弹出提示，`当前网站请求打开xx app`，点击`允许`，成功拉起app，并跳转到指定页

## 5.3 存在的问题和后续挣扎

1. 通过`Linking.openURL`这个api，传入app link只能拉起本地浏览器，没拉起app

2. `Linking.canOpenURL`这个api，传入deep link链接，返回false，但通过`Linking.openURL`又能打开，有问题

3. 上面费那么大劲，本地部署一个https，把本地服务暂停掉，通过android原生app link拉起目标app，发现其实也是能拉起的，这等于是压根就没有进行校验，好家伙，浪费我感情

4. 经过搜索，chatGPT提示，有说是因为我本地https证书的问题，两边RN App项目都要处理

+ `android/app/src/main/res/raw`

把本地生成的https证书`server.crt`复制到这里

+ `android/app/src/main/res/xml/network_security_config.xml`

```xml
<network-security-config>
    <base-config>
      <!-- 这里为了测试applink，导入了本地https证书 -->
      <!-- 本地https证书会导致搞得地图无法加载显示 -->
      <!-- 测试完成后，可以注释掉或者删除掉，或者使用正规认证的https证书 -->
      <trust-anchors>
        <certificates src="@raw/server"/> 
      </trust-anchors>
    </base-config>
</network-security-config>
```

+ `android/app/src/main/java/com/mydeeplink/TrustServerCrtModule.java`

创建原生方法，让app读取并信任证书

```java
package com.your-app-name;

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;

import java.io.InputStream;
import java.security.KeyStore;
import java.security.SecureRandom;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;

import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLContext;  
import javax.net.ssl.TrustManagerFactory;

public class TrustServerCrtModule extends ReactContextBaseJavaModule {
  private static ReactApplicationContext reactContext;

  private static final String SERVER_READ_OK = "server.crt已设置为信任";
  private static final String SERVER_READ_ERROR = "SERVER_READ_ERROR";

  @Override
  public String getName() {
    return "TrustServerCrt";
  }

  public TrustServerCrtModule(ReactApplicationContext context) {
    super(context);
    reactContext = context;
  }

  @ReactMethod
  public void readServerCrt(Promise promise) {
    try {
      // 读取证书文件
      InputStream certStream = reactContext.getResources().openRawResource(R.raw.server);
      CertificateFactory cf = CertificateFactory.getInstance("X.509");
      X509Certificate cert = (X509Certificate) cf.generateCertificate(certStream);

      // 创建一个证书集合,将自签名证书放入
      KeyStore keyStore = KeyStore.getInstance(KeyStore.getDefaultType());
      keyStore.load(null, null);
      keyStore.setCertificateEntry("ca", cert);

      // 使用含有新证书的 TrustManager
      SSLContext sslContext = SSLContext.getInstance("TLS");
      TrustManagerFactory trustManagerFactory = TrustManagerFactory
          .getInstance(TrustManagerFactory.getDefaultAlgorithm());
      trustManagerFactory.init(keyStore);
      sslContext.init(null, trustManagerFactory.getTrustManagers(), new SecureRandom());

      // 设置全局的 SSLSocketFactory
      HttpsURLConnection.setDefaultSSLSocketFactory(sslContext.getSocketFactory());

      promise.resolve(SERVER_READ_OK);
    } catch (Exception e) {
      promise.reject(SERVER_READ_ERROR, e);
    }
  }
}
```

+ js端调用

```javascript
await NativeModules.TrustServerCrt.readServerCrt();
``` 

**结果**：一顿猛虎操作，毛用都没，再次浪费我感情

5. `assetlinks.json`部署在公网上，并且能够通过https正常访问`/.well-known/assetlinks.json`，然后再使用`Linking.openURL`调用

**结果**：只是拉起本地浏览器，未拉起app

6. 准备用android studio来配置，当我把项目导入后，点击`Tools -- App Links Assistant`弹出面板后，在第一步`Open URL Mapping Editor`中填了`Host、Path和pathPrefix`后，死活选择不了`Activity`，无语。。。

7. 一番搜索，说是国内网络原因，app link使用有问题，知道的说一声；


## 6.参考资料
1. [React Native Linking](https://www.reactnative.cn/docs/linking)
2. [Android 应用链接](https://developer.android.google.cn/training/app-links?hl=zh-cn)
3. [添加 Android App Links](https://developer.android.google.cn/studio/write/app-link-indexing?hl=zh-cn)