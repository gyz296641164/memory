---
title: ✅P252_商城业务-消息队列-Exchange类型
category:
  - 谷粒商城
date: 2024-02-14
---

<!-- more -->

## RabbitMQ运行机制

**AMQP 中的消息路由**

AMQP 中消息的路由过程和 Java 开发者熟悉的 JMS 存在一些差别，AMQP 中增加了 **Exchange** 和**Binding** 的角色。生产者把消息发布到 Exchange 上，消息最终到达队列并被消费者接收，而 Binding 决定交换器的消息应该发送到那个队列。

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202306/202306291041053.png#id=o9PyP&originHeight=377&originWidth=485&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

---

## Exchange 类型

Exchange分发消息时根据类型的不同分发策略有区别，目前共四种类型：**direct**、**fanout**、**topic**、**headers** 。headers 匹配 AMQP 消息的 header 而不是路由键，headers 交换器和 direct 交换器完全一致，但性能差很多，目前几乎用不到了，所以直接看另外三种类型：

### Direct Exchange

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202306/202306291045063.png#id=QgInl&originHeight=226&originWidth=410&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

消息中的路由键（routing key）如果和Binding 中的 binding key 一致， 交换器就将消息发到对应的队列中。路由键与队列名完全匹配，如果一个队列绑定到交换机要求路由键为“dog”，则只转发 routing key 标记为“dog”的消息，不会转发“dog.puppy”，也不会转发“dog.guard” 等等。它是**完全匹配、单播的模式**。

### Fanout Exchange

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202306/202306291046895.png#id=PBuPO&originHeight=292&originWidth=457&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

每个发到 fanout 类型交换器的消息都会分到所有绑定的队列上去。fanout 交换器不处理路由键，只是简单的将队列绑定到交换器上，每个发送到交换器的消息都会被转发到与该交换器绑定的所有队列上。很像子网广播，每台子网内的主机都获得了一份复制的消息。**fanout 类型转发消息是最快的**。

### Topic Exchange

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202306/202306291047447.png#id=eEjbN&originHeight=262&originWidth=505&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

topic 交换器通过模式匹配分配消息的路由键属性，将路由键和某个模式进行匹配，此时队列需要绑定到一个模式上。它将路由键和绑定键的字符串切分成单词，这些**单词之间用点隔开**。它同样也会识别两个通配符：符号`#`和符号`*`。`#`匹配0个或多个单词，`*`匹配一个单词。

---

## 实操

**创建一个交换机**

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202306/202306291442089.png#id=rRxbp&originHeight=336&originWidth=1259&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)**创建一个队列**

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202306/202306291442298.png#id=q8c5E&originHeight=373&originWidth=1318&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

**将交换机与队列进行绑定**

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202306/202306291442355.png#id=RDmhU&originHeight=296&originWidth=1148&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202306/202306291442459.png#id=BvnYb&originHeight=378&originWidth=1349&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

**Unbind:可以解除绑定**

### ![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202306/202306291442418.png#id=TKzwN&originHeight=512&originWidth=1059&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)
