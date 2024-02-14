---
title: ✅P257_商城业务-消息队列-AmqpAdmin使用
  - 谷粒商城
date: 2024-02-14
---

<!-- more -->

## 使用AmqpAdmin创建交换机

**交换机的类型如下图所示**(选中Exchange，Ctrl+H)

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202306/202306291942608.png#id=GQjsZ&originHeight=184&originWidth=541&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

`cfmall-order/src/test/java/com/gyz/cfmall/order/CfmallOrderApplicationTests.java`

```java
@Slf4j
@RunWith(SpringRunner.class)
@SpringBootTest
public class CfmallOrderApplicationTests {

    @Autowired
    AmqpAdmin amqpAdmin;

    @Test
    void createExchange() {
        //name:交换机名称 durable:是否持久化 autoDelete:是否自动删除(没人用时是否自动删除)
        DirectExchange directExchange = new DirectExchange("direct-exchange", true, false);
        amqpAdmin.declareExchange(directExchange);
        log.info("direct-exchange创建成功");
    }
}
```

## 创建队列

```java
/**
 * String name,
 * boolean durable,
 * boolean exclusive ：如果我们正在声明独占队列，则为true。该队列仅由申报者的连接使用。
 *                     设置为true，其他连接连不了此队列，在实际开发中连接可以连所有队列。
 * boolean autoDelete
 * Map<String, Object> arguments
 */
@Test
void createQueue() {
    Queue queue = new Queue("hello-queue", true, false, false);
    amqpAdmin.declareQueue(queue);
    log.info("hello-queue创建成功");
}
```

## 绑定

```java
/**
 * String destination：目的地，绑定交换机名称或者队列的名称
 * Binding.DestinationType destinationType：目的地类型，队列或交换机
 * String exchange：交换机名称
 * String routingKey：路由键
 * Map<String, Object> arguments：自定义参数
 */
@Test
void createBinding() {
    Binding binding = new Binding("hello-queue",
            Binding.DestinationType.QUEUE,
            "direct-exchange",
            "helloQueue", null);
    amqpAdmin.declareBinding(binding);
    log.info("交换器direct-exchange和队列hello-queue绑定成功");
}
```
