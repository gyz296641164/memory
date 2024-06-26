---
title: WebSocket-Socket-TCP-HTTP区别
category:
  - 计算机网络
date: 2024-04-10
---

<!-- more -->

## WebSocket 和 HTTP 的区别

HTTP 是一个无状态的协议，使客户端向服务器请求资源，并从服务器接收响应。客户端使用 HTTP 请求/响应语法，即请求发送到服务器之后，服务器向客户端返回 HTML 文件、图像和其他媒体内容。

WebSocket 通信协议尝试在较大范围内改进 Web 实时通信和插件技术，并提供全双工、基于事件的通信而无需采用低效的轮询方式。开发人员可以从 Web 浏览器的 JS 端轻松地创建 WebSocket 连接并发送数据，进而实现应用程序的实时数据传输的实现。

由于 WebSocket 是面向消息的，因此它更加适用于实时通信，而 HTTP 更适用于请求和服务器-客户端通信的响应。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/NetWork/202403/9922ca0b1202bc4e.png)

**区别总结**

- **连接方式不同**： HTTP 是一种单向请求-响应协议，每次请求需要重新建立连接，而 WebSocket 是一种双向通信协议，使用长连接实现数据实时推送。
- **数据传输方式不同**： HTTP 协议中的数据传输是文本格式的，而 WebSocket 可以传输文本和二进制数据。
- **通信类型不同**： HTTP 主要用于客户端和服务器之间的请求和响应，如浏览器请求网页和服务器返回网页的 HTML 文件。WebSocket 可以实现双向通信，常常用于实时通信场景。
- **性能方面不同**： 由于 HTTP 的每次请求都需要建立连接和断开连接，而 WebSocket 可以在一次连接上进行多次通信，WebSocket 在性能上比 HTTP 有优势。

---

## WebSocket 和 TCP 的区别

WebSocket 和 HTTP 都是基于 TCP 协议的应用层协议。

- **层次结构**：WebSocket 是应用层协议，而 TCP 是传输层协议。
- **协议特点**：TCP 是一种面向连接的协议，使用三次握手建立连接，提供可靠的数据传输。而 WebSocket 是一种无状态的协议，使用 HTTP 协议建立连接，可以进行双向通信，WebSocket 的数据传输比 TCP 更加轻量级。
- **数据格式**：TCP 传输的数据需要自定义数据格式，而 WebSocket 可以支持多种数据格式，如 JSON、XML、二进制等。WebSocket 数据格式化可以更好的支持 Web 应用开发。
- **连接方式**：TCP 连接的是物理地址和端口号，而 WebSocket 连接的是 URL 地址和端口号。

---

## WebSocket 和 Socket 的区别

### 协议不同

Socket 是基于传输层 TCP 协议的，而 Websocket 是基于 HTTP 协议的。Socket 通信是通过 Socket 套接字来实现的，而 Websocket 通信是通过 HTTP 的握手过程实现的。

### 持久化连接

传统的 Socket 通信是基于短连接的，通信完成后即断开连接。而 Websocket 将 HTTP 协议升级后，实现了长连接，即建立连接后可以持续通信，避免了客户端与服务端频繁连接和断开连接的过程。

### 双向通信

传统的 Socket 通信只支持单向通信，即客户端向服务端发送请求，服务端进行响应。而 Websocket 可以实现双向通信，即客户端和服务端都可以发起消息，实时通信效果更佳。

### 效率

Socket 通信具有高效性和实时性，因为传输数据时没有 HTTP 协议的头信息，而 Websocket 除了HTTP协议头之外，还需要发送额外的数据，因此通信效率相对较低。

### 应用场景

Socket 适用于实时传输数据，例如在线游戏、聊天室等需要快速交换数据的场景。而 Websocket 适用于需要长时间保持连接的场景，例如在线音视频、远程控制等。