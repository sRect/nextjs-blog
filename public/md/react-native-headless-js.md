---
title: "React Native Android 端Headless JS后台 GPS 持续定位"
keywords: "react, react native, 持续定位"
date: "2023-07-12"
---

<img src="https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/3268bc9a48b046c692fdada80ea2350d~tplv-k3u1fbpfcp-watermark.image?" alt="WechatIMG248.jpeg" width="100%" />

- [本文github 仓库](https://github.com/sRect/reactNativeBlogApp/commit/f328f51c9686da68d04c24bdaa43ef0ffe73b332)
- [本文掘金链接](https://juejin.cn/post/7254811625055944762)

## 1. 写在前面

有J友在掘金私信我，react native android中，app在后台如何持续获取位置信息，还有headless js中setTimeout没有按预期执行两个问题。问我有什么解决方法，当时我就懵逼了，这不是触及到我装X盲区了吗，况且我只是js菜鸡，不会android，难受！

## 2. 本文主要 package version

| package                             | version |
| ----------------------------------- | :-----: |
| react                               |  18.2.0 |
| react-native                        |  0.71.2 |
| @react-native-community/geolocation | \^3.0.5 |

*   当前react native最新版本是v0.72

## 3. 前置基础

1.  React 基础
2.  [React Native Android 原生模块](https://www.reactnative.cn/docs/native-modules-android)，已经跟着文档，在js中调用android暴露的方法

## 4. 初步了解Headless JS

> [Headless JS文档](https://www.reactnative.cn/docs/headless-js-android)

1.  Headless JS 是一种使用 js 在后台执行任务的方法。它可以用来在后台同步数据、处理推送通知或是播放音乐等等。

2.  可以在任务中处理任何事情（网络请求、定时器等），但\*\*`不要涉及UI界面`\*\*

3.  `The function passed to setTimeout does not always behave as expected. Instead the function is called only when the application is launched again. If you just need to wait, use the retry functionality`，文档这里已经说明，headless js中`setTimeout`不会按预期执行，而是会在app再次启动的时候才执行(就是app切到后台时，不会执行，切回前台的时候才执行)，那用什么代替setTimout呢？下面会讲到。

4.  Headless JS中发起网络请求，经过实际测试，完全没问题的

5.  还有，**app进程被杀掉(人为主动杀掉和系统资源优化掉)，Headless JS后台任务也会停止**，这里不讨论进程被杀掉还能继续执行后台任务

## 5. 使用Headless JS的姿势

> 在[React Native 练习时长 2 月半，踩坑总结](https://juejin.cn/post/7234407587118530597#heading-25)文章中有涉及到使用Headless JS后台播放raw本地音频文件，那里是使用`AppRegistry.startHeadlessTask(taskId, taskKey, data)`api开始后台任务的，在官方文档中有提到在`service`中启动，但是步骤都不是非常详细

### 5.1 使用`AppRegistry.startHeadlessTask` api启动Headless js后台任务

具体步骤，详见[这篇文章-7.4章节app后台播放音频示例步骤](https://juejin.cn/post/7234407587118530597#heading-29)，每一步都很详细，对着步骤来。

### 5.2 通过`android WorkManager`中调用`services`，启动Headless js后台任务

> 怎么突然又冒出来`WorkManager`了？没办法啊，按着文档那种方式来，Headless JS中代码不执行，下面步骤1代码中会提到

`WokerManager`是什么？

[`WorkManager is the recommended way to perform background tasks in Android. WorkManager can schedule one-time or periodic tasks in a simple, reliable way.`](https://blog.logrocket.com/run-react-native-background-tasks-headless-js/)

意思就是说，WorkManager是android中推荐执行后台任务的方式，可以执行一次性任务和定时任务。

1.  `android/app/src/main/java/com/your-app-name/BackgroundPosition.java`

```java
package com.your-app-name;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import android.content.Context;
import android.app.ActivityManager;

import androidx.work.ExistingPeriodicWorkPolicy; 
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;

import java.util.Timer;
import java.util.TimerTask;
import java.util.List;
import javax.annotation.Nullable;
import java.util.concurrent.TimeUnit;

public class BackgroundPosition extends ReactContextBaseJavaModule {
  private static ReactApplicationContext reactContext;
  private Timer timer = null;//计时器
  private TimerTask task = null;
  // private LocationManager locationManager; 
  // private LocationListener locationListener; 
  private PeriodicWorkRequest workRequest;
  private static final String TAGERROR = "START_BACKGROUND_TASK_ERROR";

  public BackgroundPosition(ReactApplicationContext context) {
    super(context);
    reactContext = context;

    workRequest = new PeriodicWorkRequest.Builder(BackgroundPositionWorker.class, 15, TimeUnit.MINUTES).build();
  }

  @Override
  public String getName() {
    return "BackgroundPosition";
  }

  private void sendEvent(ReactContext reactContext, String eventName, @Nullable WritableMap params) {
    reactContext
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
        .emit(eventName, params);
  }

  @ReactMethod
  public void addListener(String eventName) {
    // Set up any upstream listeners or background tasks as necessary
  }
  @ReactMethod
  public void removeListeners(Integer count) {
    // Remove upstream listeners, stop unnecessary background tasks
  }

  private boolean isAppOnForeground(Context context) {
    /**
      我们需要先检查应用当前是否在前台运行，否则应用会崩溃。
      http://stackoverflow.com/questions/8489993/check-android-application-is-in-foreground-or-not
    **/
    ActivityManager activityManager = (ActivityManager) context.getSystemService(Context.ACTIVITY_SERVICE);
    List<ActivityManager.RunningAppProcessInfo> appProcesses =
    activityManager.getRunningAppProcesses();
    if (appProcesses == null) {
        return false;
    }
    final String packageName = context.getPackageName();
    for (ActivityManager.RunningAppProcessInfo appProcess : appProcesses) {
        if (appProcess.importance ==
        ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND &&
          appProcess.processName.equals(packageName)) {
            return true;
        }
    }
    return false;
  }

  @ReactMethod
  public void startBackgroudTask(Promise promise) {
    if(timer!=null) {
      timer.cancel();
      timer=null;
    }

    timer = new Timer();
    task = new TimerTask() {
      @Override
      public void run() {
        try {
          if(!isAppOnForeground(reactContext)) {
            WritableMap params = Arguments.createMap();
            params.putString("msg", "app已经在后台了，准备启动BackgroundPostionWorker");
            sendEvent(reactContext, "backgroundTask", params);

            // 上面讲到为什么要冒出来WorkManager，就是因为这里
            // 直接在js中调用startBackgroudTask，执行reactContext.startService(service)
            // 但是headless js中的任务不执行
            // 所以这里通过WorkManager开始一个work任务，然后在work中启动startService

            // Intent service = new Intent(reactContext, BackgroundPositionServices.class);
            // // service.putExtra("backgroundTask", "123");
            // // reactContext.startService(service);

            // Bundle bundle = new Bundle();
            // bundle.putString("foo", "bar");
            // service.putExtras(bundle);

            // // if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            // //   reactContext.startForegroundService(service);
            // // } else {
            // //   reactContext.startService(service);
            // // }

            // reactContext.startService(service);
            // // HeadlessJsTaskService.acquireWakeLockNow(reactContext);

            WorkManager.getInstance().enqueueUniquePeriodicWork("BackgroundPositionWorker", ExistingPeriodicWorkPolicy.KEEP, workRequest);

            WritableMap params2 = Arguments.createMap();
            params2.putString("msg", "BackgroundPostionWorker started");
            promise.resolve(params2);
          }
        } catch (Exception e) {
          e.printStackTrace();
          promise.reject(TAGERROR, e);
        }
      }
    };
    // 3s后执行1次
    timer.schedule(task, 3000);
  }

  @ReactMethod
  public void stopBackgroudTask(Promise promise) {
    if(timer!=null) {
      timer.cancel();
      timer=null;
    }

    // if(locationManager != null && locationListener != null) {
    //   locationManager.removeUpdates(locationListener);
    // }
    WritableMap params = Arguments.createMap();
    params.putString("msg", "BackgroundPostionWorker stop successed");

    WorkManager.getInstance().cancelUniqueWork("BackgroundPositionWorker");
    promise.resolve(params);
  }
}
```

2.  `android/app/src/main/java/com/your-app-name/BackgroundPositionPackage.java`

```java
package com.your-app-name;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class BackgroundPositionPackage implements ReactPackage {

  @Override
  public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
    return Collections.emptyList();
  }

  @Override
  public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
    List<NativeModule> modules = new ArrayList<>();

    modules.add(new BackgroundPosition(reactContext));

    return modules;
  }
}
```

3.  `android/app/src/main/java/com/your-app-name/MainApplication.java`

```diff
+ import com.your-app-name.BackgroundPositionPackage;

public class MainApplication extends Application implements ReactApplication {
    ...
    @Override
    protected List<ReactPackage> getPackages() {
      @SuppressWarnings("UnnecessaryLocalVariable")
      List<ReactPackage> packages = new PackageList(this).getPackages();

+     packages.add(new BackgroundPositionPackage());// <-- 添加这一行，类名替换成你的Package类的名字 name.
      return packages;
    }
    ...
}
```

4.  `android/app/src/main/java/com/your-app-name/BackgroundPositionServices.java`

```java
package com.your-app-name;

import android.content.Intent;
import android.os.Bundle;
import com.facebook.react.HeadlessJsTaskService;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.jstasks.HeadlessJsTaskConfig;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.jstasks.HeadlessJsTaskRetryPolicy;
import com.facebook.react.jstasks.LinearCountingRetryPolicy;

import javax.annotation.Nullable;

public class BackgroundPositionServices extends HeadlessJsTaskService {
  @Override
  protected @Nullable HeadlessJsTaskConfig getTaskConfig(Intent intent) {
    Bundle extras = intent.getExtras();
    WritableMap data = extras != null ? Arguments.fromBundle(extras) : Arguments.createMap();
    // https://github.com/eduardomota/smsgate/blob/803f775ae419db2aea63aeac5def15eb0ec28542/smsrelay2/android/app/src/main/java/com/smsrelay2/SmsEventService.java
    LinearCountingRetryPolicy retryPolicy = new LinearCountingRetryPolicy(
      3, // Max number of retry attempts
      1000 // Delay between each retry attempt
    );

    // if (extras != null) {
    //   return new HeadlessJsTaskConfig(
    //       "BackgroundTask",
    //       Arguments.fromBundle(extras),
    //       5000, // 任务的超时时间
    //       false // 可选参数：是否允许任务在前台运行，默认为false
    //     );
    // }

    return new HeadlessJsTaskConfig(
      "BackgroundPosition",
      data,
      10000, // 任务的超时时间
      false, // 可选参数：是否允许任务在前台运行，默认为false
      retryPolicy
    );
  }
}
```

5.  `android/app/src/main/java/com/your-app-name/BackgroundPositionWorker.java`

```java
package com.your-app-name;

import androidx.annotation.NonNull;
import androidx.work.Worker; 
import androidx.work.WorkerParameters;

import android.os.Bundle;
import android.content.Intent;
import android.content.Context;

public class BackgroundPositionWorker extends Worker {
    public BackgroundPositionWorker(
        @NonNull Context context, 
        @NonNull WorkerParameters workerParams) {
        super(context, workerParams);
    }

    @NonNull
    @Override
    public Result doWork() {
        Intent service = new Intent(getApplicationContext(), BackgroundPositionServices.class);
        Bundle bundle = new Bundle();
        bundle.putString("msg", "backgroundPosition start");
        service.putExtras(bundle);
        getApplicationContext().startService(service);
        return Result.success();
    }
}
```

6.  `android/app/src/main/AndroidManifest.xml`中添加权限

```xml
...
+ <!-- 精确定位 -->
+ <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
+ <!-- 模糊定位 -->
+ <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
+ <!-- 后台定位 -->
+ <uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
<application> 
    ... 
    + <service android:name="com.your-app-name.BackgroundPositionServices" /> 
</application>
```

7.  `index.js`中注册后台任务

```diff
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
+ import {backgroundPosition} from './src/utils';

AppRegistry.registerComponent(appName, () => App);
+ AppRegistry.registerHeadlessTask('BackgroundPosition', () => backgroundPosition);
```

8.  `src/utils/backgroundPosition.js`后台任务具体代码

*   这里使用`@react-native-async-storage/async-storage`的`Geolocation.watchPosition`来监测位置变化，您也可以在android中开启一个定时任务，然后发送位置给js端

*   刚开始没注意到有`watchPosition`这个api，定时执行`Geolocation.getCurrentPosition`这个api来获取，当app切换到后台时，没看到手机顶部位置有定位图标，而`watchPosition`这个api执行的时候，app在后台的时候，手机顶部有定位图标，就和使用百度地图时一样。

*   这里将gps位置通过[`@react-native-async-storage/async-storage`](https://react-native-async-storage.github.io/async-storage/docs/api/#clear)存储在本地

*   gps位置坐标google地图可以直接使用，而要在高德或者百度地图中使用要转换，怎么转换，可以使用[高德坐标转换](https://link.juejin.cn/?target=https%3A%2F%2Flbs.amap.com%2Fapi%2Fwebservice%2Fguide%2Fapi%2Fconvert)，或者[GPS坐标转高德地标（火星坐标/国测坐标）脚本转换](https://www.jianshu.com/p/dd0c017250e4)

*   或者这里干脆就使用其他模块，直接获取高德或者百度地图坐标，例如[`react-native-amap-geolocation`](https://www.npmjs.com/package/react-native-amap-geolocation)，但这个库我没测试使用过

```javascript
import {InteractionManager, AppState, NativeModules} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';

const BackgroundPosition = NativeModules.BackgroundPosition;

function handleListenerAppState(watchId = 0) {
  const subscription = AppState.addEventListener('change', nextAppState => {
    console.log('nextAppState', nextAppState);
    if (nextAppState === 'active') {
      flag = false;
      console.log('app回到前台，后台任务停止');
      console.log('watchId:', watchId);
      BackgroundPosition.stopBackgroudTask();
      Geolocation.clearWatch(watchId);
      subscription.remove();
    }
  });
}

export async function backgroundPosition(e) {
  await AsyncStorage.clear();

  const handle = InteractionManager.createInteractionHandle();
  InteractionManager.runAfterInteractions(() => {
    // ...需要长时间同步执行的任务...
    // getCurrentPosition();
    let watchPositionId = Geolocation.watchPosition(
      async info => {
        const {
          coords: {latitude, longitude},
        } = info;
        console.log('当前位置：', latitude, longitude);

        let locationListStr = await AsyncStorage.getItem('location');
        let locationObj =
          locationListStr === null ? {list: []} : JSON.parse(locationListStr);
        locationObj.list.push({
          latitude,
          longitude,
          date: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        });

        await AsyncStorage.setItem('location', JSON.stringify(locationObj));
      },
      err => {
        console.warn('获取定位失败==>', err);
      },
      {
        interval: 5000, // 每5s更新一次位置
        timeout: 10000, // 获取一个位置，10s钟超时
        maximumAge: 15000, // 可能缓存位置的最长时间(以毫秒为单位)
        enableHighAccuracy: true, // 使用GPS
        distanceFilter: 1, // 返回一个新位置之前，与前一个位置的最小距离。设置为0表示不过滤位置。默认为100m。
        // useSignificantChanges?: boolean; // 只有当设备检测到一个重要的距离已经被突破时，才会返回位置。默认为FALSE。
      },
    );
    console.log('watchPositionId:', watchPositionId);
    handleListenerAppState(watchPositionId);
  });

  InteractionManager.clearInteractionHandle(handle);
  // return await Promise.resolve();
}
```

9.  页面UI中点击某按钮执行后台任务

*   Android 10（API 级别 29）中，新增了ACCESS\_BACKGROUND\_LOCATION后台权限

*   在android 11级以上版本需要先申请ACCESS\_COARSE\_LOCATIO和ACCESS\_FINE\_LOCATION后, 再申请ACCESS\_BACKGROUND\_LOCATION权限，才能确保前台访问位置权限和后台访问位置权限正常

*   如果同时申请这三个权限时不会弹窗，系统会忽略权限请求，不会授予其中的任一权限。

```javascript
const BackgroundPosition = NativeModules.BackgroundPosition;
// 申请定位权限
const handleAndroidPositionPermission = async () => {
  try {
    // https://juejin.cn/post/7058265721540706311
    // android 11及以上版本申请权限时系统对话框不存在始终允许的选项，并且只能够在系统设置页面打开后台权限。

    const granted1 = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
    ]);

    const granted2 = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
    );

    if (
      granted1['android.permission.ACCESS_FINE_LOCATION'] ===
        PermissionsAndroid.RESULTS.GRANTED &&
      granted1['android.permission.ACCESS_COARSE_LOCATION'] ===
        PermissionsAndroid.RESULTS.GRANTED &&
      granted2 === PermissionsAndroid.RESULTS.GRANTED
    ) {
      console.log('可以定位了');
      return Promise.resolve();
    } else {
      console.log('拒绝获取定位权限');
      Toast.fail({
        content: "拒绝获取定位权限",
        duration: 2,
        stackable: true,
      });
      return Promise.reject({msg: '拒绝获取定位权限'});
    }
  } catch (error) {
    console.warn(error);
    return Promise.reject();
  }
};

const handleBackgroundTask = async type => {
  // 点击按钮后，将app切换到后台，即可执行后台任务，
  // 或者这里通过AppState监听，app在后台，自动执行后台任务
  try {
    if (type === 'start') {
      // 申请定位权限
      await handleAndroidPositionPermission();
      // 开始后台任务
      await BackgroundPosition.startBackgroudTask();
    } else {
      // 结束后台任务
      await BackgroundPosition.stopBackgroudTask();
    }
  } catch (error) {
    console.error('handleBackgroundTask error', error);
  }
};
```

## 6. 实际测试结果和存在的问题

> 测试机型小米10，android13

1.  开启后台任务后，手机锁屏，执行20分钟后，app被系统自己杀掉了，如果是在持续玩手机，app没被系统杀掉，可能和手机的省电策略有关；
2.  坐标保存不是很多，甚至出现中途有20分钟没保存坐标，不知道什么原因；
3.  保存的gps坐标，在google地图上和活动轨迹大概吻合，但是误差有点大；
4.  可能是`@react-native-async-storage/async-storage`的`watchPosition`有问题，需要自定义一个实时获取坐标的安卓原生模块对比测试下

## 7. 关于在Headless JS中如何执行`setTimeout`?

ISSUE里搜了下，也没什么关键信息，甚至显示有人已经提交过PR了

![setTimeout.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/3a8b43b86c4344aa8e042ecd8d81e076~tplv-k3u1fbpfcp-watermark.image?)

1.  那使用`requestAnimationFrame`呢？经过实际测试，有时候执行，有时候不执行

2.  `setInterval`和`setImmediate`也不行

3.  使用while循环，自己实现一个setTimeout，配合递归，就是一个setInterval了,经过实际测试，可行

```javascript
const sleep = function (startTime, delay) {
  return () => {
    let cur = new Date().getTime();
    while (cur < startTime + delay) {
      cur = new Date().getTime();
    }
  };
};

function fun() {
  // ...
  sleep(new Date().getTime(), 3000)(); // 3S后递归执行下面fun方法
  fun();
}
```

## 8. 参考资料

1.  [headless-js中文文档](https://www.reactnative.cn/docs/headless-js-android)
2.  [Run React Native background tasks with Headless JS](https://blog.logrocket.com/run-react-native-background-tasks-headless-js/)
3.  [使用android WorkManager的React Native HeadlessJs任务调用](https://www.qiniu.com/qfans/qnso-65547466)
4.  [How to Run a Background Task in React Native ?](https://medium.com/the-sixt-india-blog/how-to-run-a-background-task-in-react-native-cd4d36e40bf)
5.  [android位置权限的变更史](https://juejin.cn/post/7058265721540706311)