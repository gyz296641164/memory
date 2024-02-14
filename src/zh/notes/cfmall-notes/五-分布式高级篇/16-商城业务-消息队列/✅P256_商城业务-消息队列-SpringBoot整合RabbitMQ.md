---
title: ✅P256_商城业务-消息队列-SpringBoot整合RabbitMQ
category:
  - 谷粒商城
date: 2024-02-14
---

<!-- more -->

> 使用RabbitMQ的步骤：
>
> 1、在订单服务中导入amqp的启动器，自动配置了RabbitAutoConfiguration配置类，为容器添加了CachingConnectionFactory、RabbitTemplate、AmqpAdmin、RabbitMessagingTemplate等工具类。


## 1、依赖

```xml
<!--  RabbitMQ的依赖 -->
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-amqp</artifactId>
</dependency>
```

## 2、配置

**配置文件前缀如下图所示：**

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202309/202309131622312.png#id=sxmun&originHeight=857&originWidth=974&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

## 3、application.properties

```properties
# RabbitMQ配置
spring.rabbitmq.host=192.168.77.130
spring.rabbitmq.port=5672
# 虚拟主机配置
spring.rabbitmq.virtual-host=/
```

## 4、启动RabbitMQ

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202306/202306291935204.png#id=vnLiV&originHeight=238&originWidth=1081&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)
