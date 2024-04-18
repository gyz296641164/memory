---
title: ✅P337_Sleuth-链路追踪-整合Zipkin效果
category:
  - 谷粒商城
date: 2024-04-17
---

<!-- more -->

## 整合 zipkin 可视化观察

通过 Sleuth 产生的调用链监控信息，可以得知微服务之间的调用链路，但监控信息只输出到控制台不方便查看。我们需要一个图形化的工具-zipkin。Zipkin 是 Twitter 开源的分布式跟踪系统，主要用来收集系统的时序数据，从而追踪系统的调用问题。zipkin 官网地址如下：
https://zipkin.io/

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/NetWork/202403/cc8bbb4645020903.png)

### 1、docker 安装 zipkin 服务器

```
docker run -d -p 9411:9411 openzipkin/zipkin
```

### 2、导入zipkin依赖

zipkin 依赖也同时包含了 sleuth，可以省略 sleuth 的引用。cfmall-common引入此依赖

```xml
<dependency>
	<groupId>org.springframework.cloud</groupId>
	<artifactId>spring-cloud-starter-zipkin</artifactId>
</dependency>
```

### 3、添加 zipkin 相关配置

需要链路追踪的服务都添加此配置

```yaml
spring:
  application:
    name: cfmall-product
  zipkin:
    base-url: http://192.168.56.10:9411/ # zipkin 服务器的地址
    discovery-client-enabled: false # 关闭服务发现，否则 Spring Cloud 会把 zipkin 的 url 当做服务名称
    sender:
      type: web  #设置使用 http 的方式传输数据
  sleuth:
    sampler:
      probability: 1 #设置抽样采集率为 100%，默认为 0.1，即 10%
```

4、发送远程请求，测试 zipkin。访问地址：http://192.168.56.10:9411/zipkin/

