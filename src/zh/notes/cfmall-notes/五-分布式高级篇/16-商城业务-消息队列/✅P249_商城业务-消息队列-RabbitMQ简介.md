## 一、概述

1. 大多应用中，可通过消息服务中间件来提升系统异步通信、扩展解耦能力
2. 消息服务中两个重要概念：

- 消息代理（message broker）和目的地（destination）
- 当消息发送者发送消息以后，将由消息代理接管，消息代理保证消息传递到指定目的地。

3. 消息队列主要有两种形式的目的地 
   - 队列（queue）：点对点消息通信（point-to-point）	
   - 主题（topic）：发布（publish）/订阅（subscribe）消息通信
4. 点对点式： 
   - 消息发送者发送消息，消息代理将其放入一个队列中，消息接收者从队列中获取消息内容，消息读取后被移出队列
   - 消息只有唯一的发送者和接受者，但并不是说只能有一个接收者
5. 发布订阅式：

- 发送者（发布者）发送消息到主题，多个接收者（订阅者）监听（订阅）这个主题，那么就会在消息到达时同时收到消息

6. JMS（Java Message Service）JAVA消息服务：

- 基于JVM消息代理的规范。ActiveMQ、HornetMQ是JMS实现

7. AMQP（Advanced Message Queuing Protocol）

- 高级消息队列协议，也是一个消息代理的规范，兼容JMS
- RabbitMQ是AMQP的实现

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202306/image-20230610165549598.png#id=f2iyx&originHeight=773&originWidth=1368&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

8. Spring支持 
   - spring-jms提供了对JMS的支持
   - spring-rabbit提供了对AMQP的支持
   - 需要ConnectionFactory的实现来连接消息代理
   - 提供JmsTemplate、RabbitTemplate来发送消息
   - @JmsListener（JMS）、@RabbitListener（AMQP）注解在方法上监听消息
代理发布的消息
   - @EnableJms、@EnableRabbit开启支持
9. Spring Boot自动配置 
   - JmsAutoConfiguration
   - RabbitAutoConfiguration
10. 市面的MQ产品 
   - ActiveMQ、RabbitMQ、RocketMQ、Kafka

---

## 二、RabbitMQ概念

### 2.1 RabbitMQ简介

RabbitMQ是一个由erlang开发的AMQP(Advanved Message Queue Protocol)的开源实现。

### 2.2 核心概念

#### Message

消息，消息是不具名的，它由消息头和消息体组成。消息体是不透明的，而消息头则由一系列的可选属性组成，这些属性包括**routing-key**（路由键）、priority（相对于其他消息的优先权）、delivery-mode（指出该消息可能需要持久性存储）等。

#### Publisher

消息的生产者，也是一个向交换器发布消息的客户端应用程序。

#### Exchange 

交换器，用来接收生产者发送的消息并将这些消息路由给服务器中的队列。Exchange有4种类型：`direct(默认)`，`fanout`, `topic` 和`headers`，不同类型的Exchange转发消息的策略有所区别

#### Queue

消息队列，用来保存消息直到发送给消费者。它是消息的容器，也是消息的终点。一个消息可投入一个或多个队列。消息一直在队列里面，等待消费者连接到这个队列将其取走。

#### Binding

绑定，用于消息队列和交换器之间的关联。一个绑定就是基于路由键将交换器和消息队列连接起来的路由规则，所以可以将交换器理解成一个由绑定构成的路由表。

Exchange 和Queue的绑定可以是多对多的关系。

#### Connection

网络连接，比如一个TCP连接。

#### Channel

信道，多路复用连接中的一条独立的双向数据流通道。信道是建立在真实的TCP连接内的虚拟连接，AMQP 命令都是通过信道发出去的，不管是发布消息、订阅队列还是接收消息，这些动作都是通过信道完成。因为对于操作系统来说建立和销毁 TCP 都是非常昂贵的开销，所以引入了信道的概念，以复用一条 TCP 连接。

#### Consumer

消息的消费者，表示一个从消息队列中取得消息的客户端应用程序。

#### Virtual Host

虚拟主机，表示一批交换器、消息队列和相关对象。虚拟主机是共享相同的身份认证和加密环境的独立服务器域。每个 vhost 本质上就是一个 mini 版的 RabbitMQ 服务器，拥有自己的队列、交换器、绑定和权限机制。vhost 是 AMQP 概念的基础，必须在连接时指定，RabbitMQ 默认的 vhost 是 / 。

#### Broker

表示消息队列服务器实体

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202306/image-20230610170129562.png#id=wl9Vc&originHeight=262&originWidth=917&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

### 2.3 工作流程

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202306/image-20230610170423221.png#id=OTFCf&originHeight=680&originWidth=1235&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

首先，生成者客户端会向消息中间件发送Message，Message由消息头和消息体组成，消息头中有一个route-key属性用于标识存储的队列位置，消息中间件接收到消息之后会由相应的交换机将消息存储到指定的消息队列中，交换机和队列具有绑定关系，无论生成者还是消费者客户端想用发送或者接收消息需要使用connnection去创建一个长连接，长连接类似于高速公路，信道类似于攻速公路中的每个车道。RabbitMQ还有一个虚拟主机即类似于Docker中的容器彼此互不干扰，不需要创建多个RabbitMQ只需要创建多个虚拟机即可实现向java后台、PHP后台发送消息。

长连接的好处是当客户端宕机之后，RabbitMQ将不会向消费者客户端发送消息而是将消息持久化保证消息不会丢失。

---

## 三、Docker安装RabbitMQ

docker安装RabbitMQ命令：

```
docker run -d --name rabbitmq -p 5671:5671 -p 5672:5672 -p 4369:4369 -p
25672:25672 -p 15671:15671 -p 15672:15672 rabbitmq:management
```

开机自启动

```
docker update rabbitmq --restart=always
```

官网介绍：[https://www.rabbitmq.com/networking.html](https://www.rabbitmq.com/networking.html)

```
4369, 25672 (Erlang发现&集群端口)
5672, 5671 (AMQP端口)
15672 (web管理后台端口)
61613, 61614 (STOMP协议端口)
1883, 8883 (MQTT协议端口)
```

登录地址： [http://192.168.56.10:15672/](http://192.168.56.10:15672/)

首次登录的账号密码都是：**guest**

---

## 四、页面介绍

**OverView介绍：**

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202306/829f579b6c194465b204a3fc19b87204.png#id=SGtVK&originHeight=936&originWidth=2028&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=) **查看对应的协议和端口号**

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202306/5edfc6fb0f544bd0b6e3ba056e52a835.png#id=p9RZo&originHeight=866&originWidth=1509&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

**RabbitMQ配置文件的迁移，从老版本的RabbitMQ中下载配置文件**

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202306/3235ec6671bb43c2ae8cbfc1b205c5b5.png#id=LBgv9&originHeight=792&originWidth=1859&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

**上传至新版本的RabbitMQ配置文件**

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202306/c4eb9d29d9d748f98b97c1ba6a133735.png#id=xCPQN&originHeight=881&originWidth=1550&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

**Connections介绍：**

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202306/3a9aff828d2e480b91f609fab250871c.png#id=nhuzr&originHeight=502&originWidth=1998&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

**Channels介绍：**

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202306/bacd5e07af304cd683378b11ca050004.png#id=pmwHF&originHeight=503&originWidth=2015&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

**Exchanges介绍：**

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202306/2cc8d6b040974029958911f658e142a2.png#id=qyzpe&originHeight=848&originWidth=1688&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

**添加新的交换机**

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202306/9d13618e94e7440db076c82e69f9f86c.png#id=Qs0oT&originHeight=931&originWidth=1664&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)![](https://img-blog.csdnimg.cn/27e11d573f6e4648a0b051dbd0267310.png#id=s9tQz&originHeight=725&originWidth=1909&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

**队列介绍：**

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202306/6e455a5ddb504fc9ac88e35b97ac63c7.png#id=VcUHL&originHeight=936&originWidth=1633&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

**Admin介绍：**

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202306/8d72dcb181cb4e9c83ce66451499c229.png#id=YheBX&originHeight=848&originWidth=2044&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

**虚拟主机介绍：**

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202306/21254a2c4d044a9d82a7d8b9652d0781.png#id=FIf2J&originHeight=797&originWidth=2034&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

**查看自己创建的虚拟主机：**

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202306/df49af5c206e47a2b78b0dc99018fb19.png#id=Nmfxl&originHeight=781&originWidth=1687&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

**进入后可配置权限**

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202306/d4a0c78954164171818fa474c7793412.png#id=lmAab&originHeight=942&originWidth=1548&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)**删除虚拟主机**

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202306/f9c104ffa4ba499bb37d242aa21fc569.png#id=J2Cse&originHeight=922&originWidth=1517&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

**设置最大连接数**

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202306/e99595c9450841e08ebcc565f6eb6e9f.png#id=YYmK0&originHeight=666&originWidth=2012&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

**显示集群消息**

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202306/7aa5b1e9d4c34051bfda7f06b72669b0.png#id=zbmtq&originHeight=771&originWidth=2037&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)
