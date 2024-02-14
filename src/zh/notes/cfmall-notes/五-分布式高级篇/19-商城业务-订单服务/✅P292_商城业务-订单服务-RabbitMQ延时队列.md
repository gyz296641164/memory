---
title: ✅P292_商城业务-订单服务-RabbitMQ延时队列
  - 谷粒商城
date: 2024-02-14
---

<!-- more -->

## RabbitMQ延时队列（实现定时任务）

### 场景

比如未付款订单，超过一定时间后，系统自动取消订单并释放占有物品。如下图所示。

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202402/f6ea612120d76c0a.png#id=BoBuk&originHeight=667&originWidth=1099&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

### 常用解决方案

#### spring的 schedule 定时任务轮询数据库

**缺点：**消耗系统内存、增加了数据库的压力、存在较大的时间误差。

**定时任务的时效性问题**

比如：10:00定时任务开始执行，10:01有用户下订单但未支付，10:30的时候定时任务再次执行，这个订单还差1分钟才能进行关单操作，因此，下一次扫描到它要等到11:00，存在着29分钟的误差时间。

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202402/d27569ef0fe8af80.png#id=m4EBq&originHeight=372&originWidth=866&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

#### rabbitmq的消息TTL和死信Exchange结合

具体演示在后续文章。

---

## 消息的TTL（Time To Live）

消息的TTL就是消息的存活时间。

RabbitMQ可以对队列和消息分别设置TTL。

- 对队列设置就是队列没有消费者连着的保留时间，**也可以对每一个单独的消息做单独的设置。超过了这个时间，我们认为这个消息就死了，称之为死信**。
- 如果队列设置了，消息也设置了，那么会**取小的**。所以一个消息如果被路由到不同的队列中，这个消息死亡的时间有可能不一样（不同的队列设置）。这里单讲单个消息的TTL，因为它才是实现延迟任务的关键。可以通过**设置消息的expiration字段或者x- message-ttl属性来设置时间**，两者是一样的效果。

---

## Dead Letter Exchanges（DLX）

一个消息在满足如下条件下，会进**死信路由**，记住这里是路由而不是队列，一个路由可以对应很多队列。（什么是死信）

- 一个消息被Consumer拒收了，并且reject方法的参数里requeue是false。也就是说不会被再次放在队列里，被其他消费者使用。（**basic.reject/ basic.nack**）requeue=false
- 上面的消息的TTL到了，消息过期了。
- 队列的长度限制满了。排在前面的消息会被丢弃或者扔到死信路由上。

Dead Letter Exchange其实就是一种普通的exchange，和创建其他exchange没有两样。只是在某一个设置Dead Letter Exchange的队列中有消息过期了，会自动触发消息的转发，发送到Dead Letter Exchange中去。

我们既可以控制消息在一段时间后变成死信，又可以控制变成死信的消息被路由到某一个指定的交换机，结合二者，其实就可以实现一个延时队列。

**RabbitMQ实现延时队列的原理**：通过设置队列的过期时间使消息都变成死信，此队列是不能被任何服务监听的，当消息过期时，通过死信路由将死信，路由给指定队列，指定队列只接收死信也就是延时消息，服务器专门监听指定队列从而达到定时任务的效果。

---

## 延时队列实现-1

设置队列过期时间实现延时队列(推荐)

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202402/30dbab1726afdb57.png#id=zJ7pR&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

---

## 延时队列实现-2

设置消息过期时间实现延时队列(不推荐)

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202402/7487b4934e7c64e7.png#id=MVLAT&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

RabbitMQ采用的是**懒检查**，假如第一个消息设置的是5分钟过期，第二个消息设置的是2分钟过期，第三个消息设置的是30s过期，RabbitMQ发现第一个消息5分钟后才过期，那么5分钟之后才会来将消息路由并不会关注后面消息的过期时间。
