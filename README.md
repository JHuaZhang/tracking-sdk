# Tracking SDK

前端监控数据采集 SDK，零依赖、轻量级，支持 UMD 和 ESM 两种格式。自动采集页面性能、JS 异常、API 请求、资源加载异常等监控数据，并上报至监控平台。

## 特性

- 🚀 **零依赖**：不依赖任何第三方库，体积极小
- 📦 **双格式输出**：同时支持 UMD（CDN 引入）和 ESM（模块化引入）
- 🔌 **插件化架构**：性能、异常、API、资源监控均为独立插件，按需启用
- 📊 **自动采集**：初始化后自动采集数据，无需手动埋点
- 🎯 **采样率控制**：支持配置采样率，降低数据量
- 📡 **智能上报**：批量上报 + 定时刷新 + 页面离开前兜底上报
- 🛡️ **异常去重**：5 秒内相同异常自动去重，避免重复上报
- 🔒 **自身请求过滤**：自动过滤 SDK 自身的上报请求，避免死循环

## 快速开始

### 方式一：NPM 安装

```bash
npm install tracking-sdk
# 或
pnpm add tracking-sdk
```

```typescript
import TrackingSDK from 'tracking-sdk';

TrackingSDK.init({
  appKey: '你的应用AppKey',
  reportUrl: 'https://your-domain.com/api/tracking/report',
});
```

### 方式二：CDN 引入

```html
<script src="tracking-sdk.umd.js"></script>
<script>
  TrackingSDK.init({
    appKey: '你的应用AppKey',
    reportUrl: 'https://your-domain.com/api/tracking/report',
  });
</script>
```

### 方式三：Monorepo 本地引用

在 pnpm workspace 中，可以直接引用本地源码：

```typescript
import TrackingSDK from 'tracking-sdk';

TrackingSDK.init({
  appKey: '你的应用AppKey',
  reportUrl: '/api/tracking/report',
});
```

## 配置项

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `appKey` | `string` | **必填** | 应用唯一标识，在监控平台「应用管理」中创建获取 |
| `reportUrl` | `string` | **必填** | 数据上报地址 |
| `sampleRate` | `number` | `1` | 采样率，取值 0~1，例如 `0.5` 表示 50% 的用户会被采集 |
| `maxBatchSize` | `number` | `10` | 批量上报的最大条数，缓冲区满时自动发送 |
| `flushInterval` | `number` | `5000` | 定时上报间隔（毫秒） |
| `enablePerformance` | `boolean` | `true` | 是否启用页面性能监控 |
| `enableError` | `boolean` | `true` | 是否启用 JS 异常监控 |
| `enableApi` | `boolean` | `true` | 是否启用 API 请求监控 |
| `enableResource` | `boolean` | `true` | 是否启用资源加载异常监控 |
| `enableAutoClick` | `boolean` | `false` | 是否启用自动点击埋点（采集带 `data-track` 属性的元素点击） |
| `customFlushInterval` | `number` | `0` | 自定义事件聚合窗口时间（毫秒）。设置后窗口期内的所有埋点事件会汇总成一条请求发送，`0` 表示立即上报 |
| `userId` | `string` | `''` | 用户标识，用于关联用户维度的监控数据 |

### 完整配置示例

```typescript
TrackingSDK.init({
  appKey: '0c15734916d2413980be12f13bfc625a',
  reportUrl: '/api/tracking/report',
  sampleRate: 1,            // 全量采集
  maxBatchSize: 10,         // 缓冲区满 10 条时上报
  flushInterval: 5000,      // 每 5 秒定时上报
  enablePerformance: true,  // 开启性能监控
  enableError: true,        // 开启异常监控
  enableApi: true,          // 开启 API 监控
  enableResource: true,     // 开启资源监控
  enableAutoClick: true,    // 开启自动点击埋点
  customFlushInterval: 2000, // 2秒聚合窗口，窗口内的埋点汇总发送
  userId: 'user_12345',    // 设置用户标识
});
```

## API 方法

### `TrackingSDK.init(config)`

初始化 SDK。只能调用一次，重复调用会在控制台输出警告。

```typescript
TrackingSDK.init({
  appKey: 'your-app-key',
  reportUrl: '/api/tracking/report',
});
```

### `TrackingSDK.setUserId(userId)`

动态设置用户标识。适用于用户登录后设置。

```typescript
// 用户登录后
TrackingSDK.setUserId('user_12345');
```

### `TrackingSDK.trackEvent(eventName, extra?)`

手动上报自定义事件。

```typescript
// 上报按钮点击事件
TrackingSDK.trackEvent('button_click', {
  buttonId: 'submit',
  page: 'login',
});

// 上报表单提交事件
TrackingSDK.trackEvent('form_submit', {
  formId: 'register-form',
  success: true,
});
```

### `TrackingSDK.trackPageView(pagePath?, extra?)`

手动上报页面浏览事件。不传 `pagePath` 时自动取当前页面路径。

```typescript
// 自动获取当前路径
TrackingSDK.trackPageView();

// 指定页面路径
TrackingSDK.trackPageView('/dashboard', {
  referrer: document.referrer,
  title: document.title,
});
```

### `TrackingSDK.destroy()`

销毁 SDK 实例，卸载所有插件，停止数据采集和上报。

```typescript
// 页面卸载或不再需要监控时
TrackingSDK.destroy();
```

## 监控能力详解

### 📈 页面性能监控

自动采集以下性能指标（基于 Navigation Timing API 和 PerformanceObserver）：

| 指标 | 说明 |
|------|------|
| `dns` | DNS 解析耗时 |
| `tcp` | TCP 连接耗时 |
| `ttfb` | 首字节时间（Time To First Byte） |
| `domParse` | DOM 解析耗时 |
| `loadTime` | 页面完整加载时间 |
| `fcp` | 首次内容绘制（First Contentful Paint） |
| `lcp` | 最大内容绘制（Largest Contentful Paint） |

**采集时机**：
- 导航性能数据在页面 `load` 事件后采集
- FCP 和 LCP 通过 `PerformanceObserver` 实时观测

### ❌ JS 异常监控

自动捕获以下类型的异常：

- **运行时错误**：通过 `window.onerror` 捕获
- **未处理的 Promise 拒绝**：通过 `unhandledrejection` 事件捕获

上报数据包含：

| 字段 | 说明 |
|------|------|
| `errorMessage` | 错误信息 |
| `errorType` | 错误类型（如 TypeError、ReferenceError） |
| `errorStack` | 错误堆栈信息 |

**去重机制**：5 秒内相同的错误信息 + 堆栈不会重复上报。

### 🌐 API 请求监控

自动拦截 `XMLHttpRequest` 和 `fetch` 请求，采集以下数据：

| 字段 | 说明 |
|------|------|
| `url` | 请求地址 |
| `method` | 请求方法（GET、POST 等） |
| `statusCode` | HTTP 状态码 |
| `duration` | 请求耗时（毫秒） |
| `success` | 是否成功（状态码 200-399） |

**注意**：SDK 自身的上报请求会被自动过滤，不会被采集。

### 📦 资源加载异常监控

通过捕获阶段的 `error` 事件监听资源加载失败，支持以下资源类型：

| 标签 | 资源类型 |
|------|----------|
| `<script>` | script |
| `<link>` | stylesheet |
| `<img>` | image |
| `<video>` | video |
| `<audio>` | audio |
| `<source>` | media-source |

上报数据包含：

| 字段 | 说明 |
|------|------|
| `resourceUrl` | 资源地址 |
| `resourceType` | 资源类型 |
| `errorMessage` | 错误描述 |

### 🎯 自定义事件埋点

支持**手动埋点**和**自动点击埋点**两种方式。

#### 手动埋点

通过 `trackEvent` 和 `trackPageView` 方法手动上报事件：

```typescript
// 自定义业务事件
TrackingSDK.trackEvent('purchase', { productId: '123', amount: 99.9 });

// 页面浏览
TrackingSDK.trackPageView('/product/detail');
```

#### 自动点击埋点

开启 `enableAutoClick: true` 后，SDK 会自动采集带 `data-track` 属性的元素的点击事件：

```html
<!-- 基础用法 -->
<button data-track="submit_order">提交订单</button>

<!-- 携带附加数据 -->
<button data-track="add_to_cart" data-track-extra='{"productId":"123","price":99.9}'>
  加入购物车
</button>

<!-- 支持任意元素 -->
<div data-track="banner_click" data-track-extra='{"bannerId":"home-top"}'>
  <img src="banner.jpg" />
</div>
```

**自动点击埋点特性**：
- 自动向上查找最近的 `data-track` 元素（最多 5 层），支持点击子元素触发
- `data-track` 的值作为事件名称
- `data-track-extra` 的值（JSON 字符串）作为附加数据
- 自动采集元素标签名和文本内容

#### 事件聚合窗口

当页面短时间内触发大量埋点时（如列表页批量点击），可以通过 `customFlushInterval` 设置聚合窗口，避免频繁请求：

```typescript
TrackingSDK.init({
  appKey: 'your-app-key',
  reportUrl: '/api/tracking/report',
  customFlushInterval: 2000, // 2 秒聚合窗口
});

// 以下 3 个事件会在 2 秒后汇总成 1 条请求发送
TrackingSDK.trackEvent('item_click', { itemId: '1' });
TrackingSDK.trackEvent('item_click', { itemId: '2' });
TrackingSDK.trackEvent('item_click', { itemId: '3' });
```

**聚合机制**：
- 第一个事件进入时启动计时器，窗口期内的后续事件都会被缓冲
- 窗口结束后，所有事件汇总成一条批量请求发送
- 页面关闭（`beforeunload`）或切到后台（`visibilitychange`）时立即刷新缓冲区，确保数据不丢失
- 设置为 `0`（默认值）则不聚合，每个事件立即上报

上报数据包含：

| 字段 | 说明 |
|------|------|
| `eventName` | 事件名称 |
| `eventType` | 事件类型（`custom` / `click` / `pageview`） |
| `tagName` | 元素标签名（自动点击时） |
| `elementText` | 元素文本内容（自动点击时，截取前 200 字符） |
| 自定义字段 | `extra` 中的附加数据 |

## 数据上报机制

SDK 采用**智能批量上报**策略，确保数据可靠送达：

1. **缓冲区机制**：采集到的数据先存入缓冲区
2. **批量发送**：缓冲区满 `maxBatchSize` 条时自动发送
3. **定时刷新**：每隔 `flushInterval` 毫秒自动发送缓冲区数据
4. **离开兜底**：页面关闭（`beforeunload`）或切到后台（`visibilitychange`）时立即发送
5. **优先 sendBeacon**：优先使用 `navigator.sendBeacon` 发送，失败时降级为 `XMLHttpRequest`

### 上报数据格式

每条上报数据包含以下公共字段：

```json
{
  "appKey": "应用标识",
  "type": "performance | error | api | resource",
  "data": { /* 具体监控数据 */ },
  "timestamp": 1713600000000,
  "pageUrl": "https://example.com/page",
  "userAgent": "Mozilla/5.0 ...",
  "userId": "user_12345"
}
```

## 使用场景示例

### 基础接入

只需两行代码即可完成接入：

```typescript
import TrackingSDK from 'tracking-sdk';

TrackingSDK.init({
  appKey: 'your-app-key',
  reportUrl: '/api/tracking/report',
});
```

### 按需开启监控

只监控异常和 API，不监控性能和资源：

```typescript
TrackingSDK.init({
  appKey: 'your-app-key',
  reportUrl: '/api/tracking/report',
  enablePerformance: false,
  enableError: true,
  enableApi: true,
  enableResource: false,
});
```

### 生产环境采样

生产环境只采集 10% 的用户数据：

```typescript
TrackingSDK.init({
  appKey: 'your-app-key',
  reportUrl: '/api/tracking/report',
  sampleRate: 0.1,
});
```

### 配合用户登录

```typescript
// 页面加载时初始化
TrackingSDK.init({
  appKey: 'your-app-key',
  reportUrl: '/api/tracking/report',
});

// 用户登录成功后设置 userId
async function onLogin(username, password) {
  const user = await login(username, password);
  TrackingSDK.setUserId(user.id);
}
```

### SPA 应用接入

在 Vue/React 等 SPA 应用的入口文件中初始化即可，SDK 会自动跟踪页面 URL 变化：

```typescript
// main.ts (Vue 3)
import { createApp } from 'vue';
import App from './App.vue';
import TrackingSDK from 'tracking-sdk';

TrackingSDK.init({
  appKey: 'your-app-key',
  reportUrl: '/api/tracking/report',
});

createApp(App).mount('#app');
```

## 构建

```bash
# 开发模式（监听文件变化自动构建）
pnpm dev

# 生产构建
pnpm build
```

构建产物：

```
dist/
├── tracking-sdk.esm.js      # ESM 格式（import 引入）
├── tracking-sdk.umd.js      # UMD 格式（CDN / require 引入）
└── tracking-sdk.esm.js.map  # Source Map
```

## 浏览器兼容性

| 特性 | 最低版本 |
|------|----------|
| `PerformanceObserver` | Chrome 52+, Firefox 57+, Safari 11+ |
| `navigator.sendBeacon` | Chrome 39+, Firefox 31+, Safari 11.1+ |
| `fetch` 拦截 | Chrome 42+, Firefox 39+, Safari 10.1+ |
| `PerformanceNavigationTiming` | Chrome 57+, Firefox 58+, Safari 15+ |

对于不支持的浏览器，相关功能会自动降级（不采集对应数据），不会影响页面正常运行。

## License

MIT
