---
title: "redux toolkit 的使用"
keywords: "react, redux, @reduxjs/toolkit"
date: "2020-10-09"
---

> 1. [Redux Toolkit 官网](https://redux-toolkit.js.org/)
> 2. [Redux_toolkit 使用](https://www.51hint.com/posts/redux_toolkit/)

### 为什么要使用 redux toolkit

```
// 优化前
index.js
state.js
actionTypes.js
actions.js
reducer.js

// 优化后
index.js
slice.js
```

之前使用*redux*,需要安装*redux-thunk,immer*等其它依赖库，使用 store 的同事需要重复写许多样板代码，现在把 action 和 reducer 都写在了一起，简化了许多样板代码，代码变得更加精简。

### 项目结构

```
├── LICENSE
├── package.json
├── public
|  ├── favicon.ico
|  ├── index.html
├── README.md
├── src
|  ├── App.js
|  ├── components
|  |  ├── ComA
|  |  |  ├── index.js
|  |  |  └── store
|  |  |     ├── comASlice.js
|  |  |     └── state.js
|  |  ├── ComB
|  |  |  ├── index.js
|  |  |  └── store
|  |  |     ├── comBSlice.js
|  |  |     └── state.js
|  |  └── Header
|  |     └── index.js
|  ├── index.js
|  └── store
|     ├── index.js
|     └── reducer.js
└── yarn.lock
```

### 安装

```shell
yarn add react-redux @reduxjs/toolkit
```

### 核心代码

1. index.js

```javascript
import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import store from "./store";
import App from "./App";

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
  document.getElementById("root")
);
```

2. src/store/reducer.js

```javascript
import { combineReducers } from "@reduxjs/toolkit";
import comASlice from "../components/ComA/store/comASlice";
import comBSlice from "../components/ComB/store/comBSlice";

const rootReducer = combineReducers({
  comAReducer: comASlice.reducer,
  comBReducer: comBSlice.reducer,
});

export default rootReducer;
```

3. src/store/index.js

```javascript
import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "./reducer";

// 这里使用configureStore代替之前的createStore
const store = configureStore({
  reducer: rootReducer,
});

export default store;
```

4. src/components/ComB/index.js

**hooks 下使用 useSelector 和 useDispatch 代替之前 connect 的 mapStateToProps 和 mapDispatchToPrpops**，之前通过 props 获取 state 和 dispatch，现在直接通过 hooks 的方式获取，代码变得更加的简洁

> [redux 中使用 useSelector、useDispatch 替代 connect](https://blog.csdn.net/vitaviva/article/details/104508139)

```javascript
import React, { memo } from "react";
// import { connect } from 'react-redux';
import { useSelector, useDispatch } from "react-redux";
import comBSlice from "./store/comBSlice";

const {
  actions: { increment, decrement },
} = comBSlice;

const ComA = (props) => {
  // const { num } = props;
  // const { handleIncrement, handleDecrement } = props;

  const dispatch = useDispatch();
  const num = useSelector((state) => state.comBReducer);
  const handleIncrement = (num) => dispatch(increment(num));
  const handleDecrement = (num) => dispatch(decrement(num));

  return (
    <div>
      <p>ComA</p>
      <p>
        num: <b>{num}</b>
      </p>

      <button onClick={() => handleIncrement(1)}>increase +1</button>
      <button onClick={() => handleDecrement(1)}>decrease -1</button>
    </div>
  );
};

// const mapStateToProps = state => ({
//   num: state.comBReducer
// });

// const mapDispatchToProps = dispatch => ({
//   handleIncrement(num) {
//     dispatch(increment(num));
//   },
//   handleDecrement(num) {
//     dispatch(decrement(num));
//   }
// })

// export default connect(mapStateToProps, mapDispatchToProps)(memo(ComA));
export default memo(ComA);
```

5. src/components/ComB/store/comBSlice.js

> 通过 createSlice 将 action 和 reducer 建立在一起，代码更加简洁

```javascript
import { createSlice } from "@reduxjs/toolkit";
import { num } from "./state";

const comBSlice = createSlice({
  name: "comB",
  initialState: num,
  reducers: {
    increment: (state, action) => state + action.payload,
    decrement: (state, action) => state - action.payload,
  },
});

export default comBSlice;
```
