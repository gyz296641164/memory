---
title: ✅P336_Sleuth-链路追踪-基本概念与整合
category:
  - 谷粒商城
date: 2024-04-17
---

<!-- more -->

# Sleuth+Zipkin 服务链路追踪

> 官方文档：https://cloud.spring.io/spring-cloud-static/spring-cloud-sleuth/2.1.3.RELEASE/single/spring-cloud-sleuth.html

## 1、为什么用

微服务架构是一个分布式架构，它按业务划分服务单元，一个分布式系统往往有很多个服务单元。由于服务单元数量众多，业务的复杂性，如果**出现了错误和异常，很难去定位**。主要体现在，**一个请求可能需要调用很多个服务**，而内部服务的调用复杂性，决定了问题难以定位。所以微服务架构中，必须实现分布式链路追踪，去跟进一个请求到底有哪些服务参与，参与的顺序又是怎样的，从而**达到每个请求的步骤清晰可见，出了问题，很快定位**。

链路追踪组件有 Google 的 Dapper，Twitter 的 Zipkin，以及阿里的 Eagleeye （鹰眼）等，它们都是非常优秀的链路追踪开源组件。

`Spring Cloud Sleuth`为Spring Cloud实现分布式跟踪解决方案。

微服务跟踪(sleuth)其实是一个工具，它在整个分布式系统中能跟踪一个用户请求的过程(包括数据采集，数据传输，数据存储，数据分析，数据可视化)，捕获这些跟踪数据，就能构建微服务的整个调用链的视图，这是调试和监控微服务的关键工具。

**SpringCloudSleuth有几个特点：**

| 特点               | 说明                                                         |
| ------------------ | ------------------------------------------------------------ |
| 提供链路追踪       | 通过sleuth可以很清楚的看出一个请求经过了哪些服务， 可以方便的理清服务间的调用关系 |
| 性能分析           | 通过sleuth可以很方便的看出每个采集请求的耗时，分析出哪些服务调用比较耗时，当服务调用的耗时，随着请求量的增大而增大时，也可以对服务的扩容提供一定的提醒作用 |
| 数据分析及优化链路 | 对于频繁地调用一个服务，或者并行地调用等， 可以针对业务做一些优化措施 |
| 可视化             | 对于程序未捕获的异常，可以在zipkpin界面上看到                |

---

## 2、基本术语

**Span（跨度）**：基本工作单元，发送一个远程调度任务 就会产生一个 Span，Span 是一个 64 位 ID 唯一标识的，Trace 是用另一个 64 位 ID 唯一标识的，Span 还有其他数据信息，比如摘要、时间戳事件、Span 的 ID、以及进度 ID。

**Trace（跟踪）**：一系列 Span 组成的一个树状结构。请求一个微服务系统的 API 接口，这个 API 接口，需要调用多个微服务，调用每个微服务都会产生一个新的 Span，所有由这个请求产生的 Span 组成了这个 Trace。

**Annotation（标注）**：用来及时记录一个事件的，一些核心注解用来定义一个请求的开始和结束 。这些注解包括以下：

- cs - Client Sent -客户端发送一个请求，这个注解描述了这个 Span 的开始
- sr - Server Received -服务端获得请求并准备开始处理它，如果将其 sr 减去 cs 时间戳便可得到网络传输的时间。
- ss - Server Sent （服务端发送响应）–该注解表明请求处理的完成(当请求返回客户端)，如果 ss 的时间戳减去 sr 时间戳，就可以得到服务器请求的时间。
- cr - Client Received （客户端接收响应）-此时 Span 的结束，如果 cr 的时间戳减去cs 时间戳便可以得到整个请求所消耗的时间。

如果服务调用顺序如下：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/NetWork/202403/6c9dd50d27b9a87f.png)

那么用以上概念完整的表示出来如下：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/NetWork/202403/2ec95c0d9b1435f6.png)

Span 之间的父子关系如下：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/NetWork/202403/e9fe21a5cdd94669.png)

---

## 3、Sleuth与Zipkin的关系

可视化Span和Trace将与Zipkin注释一起查看系统

- sleuth ：链路追踪器
- zipkin：链路分析器。可以理解为可视化界面，配合Sleuth可以清晰定位请求流程。zipkin是Twitter基于google的分布式监控系统Dapper（论文）的开发源实现

---

## 4、整合 Sleuth

`cfmall-common`服务引入依赖

```xml
<dependency>
	<groupId>org.springframework.cloud</groupId>
	<artifactId>spring-cloud-starter-sleuth</artifactId>
</dependency>
```

打开 debug 日志：`cfmall-product`、`cfmall-search`的application.yml文件

```yaml
logging:
  level:
    org.springframework.cloud.openfeign: debug
    org.springframework.cloud.sleuth: debug
```

发起一次远程调用，观察控制台。(在cfmall.com首页访问搜索页)

```
DEBUG [cfmall-product,040b4cd922f2daf6,ceb692e512a33f67,false]
```

- `user-service`：服务名
- `040b4cd922f2daf6`：是 TranceId，一条链路中，只有一个 TranceId
- `ceb692e512a33f67`：是 spanId，链路中的基本工作单元 id
- `false`：表示是否将数据输出到其他服务，true 则会把信息输出到其他可视化的服务上观察
