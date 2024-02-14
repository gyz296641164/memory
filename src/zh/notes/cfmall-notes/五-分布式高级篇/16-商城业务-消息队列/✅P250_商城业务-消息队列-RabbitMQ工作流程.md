### RabbitMQ简介

RabbitMQ是一个由erlang开发的AMQP(Advanved Message Queue Protocol)的开源实现。

### 核心概念

#### Message

消息，消息是不具名的，它由消息头和消息体组成。消息体是不透明的，而消息头则由一系列的可选属性组成，这些属性包括**routing-key**（路由键）、priority（相对于其他消息的优先权）、delivery-mode（指出该消息可能需要持久性存储）等。

#### Publisher

消息的生产者，也是一个向交换器发布消息的客户端应用程序。

#### Exchange

交换器，用来接收生产者发送的消息并将这些消息路由给服务器中的队列。Exchange有4种类型：`direct(默认)`，`fanout`, `topic` 和`headers`，不同类型的Exchange转发消息的策略有所区别

#### Queue

消息队列，用来保存消息直到发送给消费者。它是消息的容器，也是消息的终点。一个消息可投入一个或多个队列。消息一直在队列里面，等待消费者连接到这个队列将其取走。

#### Binding

绑定，用于消息队列和交换器之间的关联。一个绑定就是基于路由键将交换器和消息队列连接起来的路由规则，所以可以将交
换器理解成一个由绑定构成的路由表。

Exchange 和Queue的绑定可以是多对多的关系。

#### Connection

网络链接，比如一个TCP连接。

#### Channel

信道，多路复用连接中的一条独立的双向数据流通道。信道是建立在真实的TCP连接内的虚拟连接，AMQP 命令都是通过信道发出去的，不管是发布消息、订阅队列还是接收消息，这些动作都是通过信道完成。因为对于操作系统来说建立和销毁 TCP 都是非常昂贵的开销，所以引入了信道的概念，以复用一条 TCP 连接。

#### Consumer

消息的消费者，表示一个从消息队列中取得消息的客户端应用程序。

#### Virtual Host

虚拟主机，表示一批交换器、消息队列和相关对象。虚拟主机是共享相同的身份认证和加密环境的独立服务器域。每个 vhost 本质上就是一个 mini 版的 RabbitMQ 服务器，拥有自己的队列、交换器、绑定和权限机制。vhost 是 AMQP 概念的基础，必须在连接时指定，RabbitMQ 默认的 vhost 是 / 。

#### Broker

表示消息队列服务器实体

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202306/image-20230610170129562.png#id=hIVNh&originHeight=262&originWidth=917&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

### 工作流程

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202306/image-20230610170423221.png#id=yHeQk&originHeight=680&originWidth=1235&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

首先，生成者客户端会向消息中间件发送Message，Message由消息头和消息体组成，消息头中有一个route-key属性用于标识存储的队列位置，消息中间件接收到消息之后会由相应的交换机将消息存储到指定的消息队列中，交换机和队列具有绑定关系，无论生成者还是消费者客户端想用发送或者接收消息需要使用connnection去创建一个长连接，长连接类似于高速公路，信道类似于攻速公路中的每个车道。RabbitMQ还有一个虚拟主机即类似于Docker中的容器彼此互不干扰，不需要创建多个RabbitMQ只需要创建多个虚拟机即可实现向java后台、PHP后台发送消息。

长连接的好处是当客户端宕机之后，RabbitMQ将不会向消费者客户端发送消息而是将消息持久化保证消息不会丢失。
