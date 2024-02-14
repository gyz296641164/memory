---
title: ✅P259_商城业务-消息队列-RabbitListener-RabbitHandler接收消息
  - 谷粒商城
date: 2024-02-14
---

<!-- more -->

**商城业务-消息队列-RabbitListener&RabbitHandler接收消息**

---

## @RabbitListener

@RabbitListener使用前提：必须有@EnableRabbit并且标注方法的类必须在组件中(启动类加上@EnableRabbit注解)

@RabbitListener标注类上监听多个队列

@RabbitHandler标注在方法上用于接受不同类型的消息对象

> **示例**


`cfmall-order/src/main/java/com/gyz/cfmall/order/service/impl/OrderServiceImpl.java`

```java
@Service("orderService")
public class OrderServiceImpl extends ServiceImpl<OrderDao, OrderEntity> implements OrderService {
	@RabbitListener(queues = {"new-queus"})
    public void receiveMessage(Object message) {
        System.out.println("接收到消息...内容：" + message + "===>类型：" + message.getClass());
    }
}
```

启动订单服务，打印如下：

```json
接收到消息...内容：(Body:'{"id":1,"name":"hahaha","sort":1,"status":0,"createTime":1694764377331}' MessageProperties [headers={__TypeId__=com.gyz.cfmall.order.entity.OrderReturnReasonEntity}, contentType=application/json, contentEncoding=UTF-8, contentLength=0, receivedDeliveryMode=PERSISTENT, priority=0, redelivered=false, receivedExchange=new-direct-change, receivedRoutingKey=queuesChange, deliveryTag=1, consumerTag=amq.ctag-7wgm24_4RakC5ay-BPvFtA, consumerQueue=new-queus])===>类型：class org.springframework.amqp.core.Message
```

**message组成：①消息体+消息头 ②class org.springframework.amqp.core.Message类型的对象**

> **方法的参数类型**


**1.class org.springframework.amqp.core.Message类型的对象**

```java
    @RabbitListener(queues = {"new-queus"})
    public void receiveMessage(Message msg) {
        //获取消息体
        byte[] body = msg.getBody();
        //获取消息头
        MessageProperties messageProperties = msg.getMessageProperties();
        System.out.println("接收到消息...内容：" + msg + "===>类型：" + msg.getClass());
    }
```

**2.T<发送消息的类型> ：假如发送消息的类型为 OrderReturnReasonEntity 则接受的消息类型也可以为 OrderReturnReasonEntity**

```java
    @RabbitListener(queues = {"new-queus"})
    public void receiveMessage(Message message, OrderReturnReasonEntity entity) {
        byte[] body = message.getBody();
        MessageProperties messageProperties = message.getMessageProperties();
        System.out.println("接收到消息...内容：" + entity);
    }
```

输出：

```json
接收到消息...内容：OrderReturnReasonEntity(id=1, name=hahaha, sort=1, status=0, createTime=Fri Sep 15 15:45:14 GMT+08:00 2023)
```

**3.Channel channel：当前传输数据的通道**

```java
    @RabbitListener(queues = {"new-queus"})
    public void receiveMessage(Message message, OrderReturnReasonEntity entity, Channel channel) {
        byte[] body = message.getBody();
        MessageProperties messageProperties = message.getMessageProperties();
        System.out.println("接收到消息...内容：" + entity);
    }
```

---

## 模拟多个客户端接收消息

**多个客户端监听Queue。只要收到消息，队列就删除消息，而且只能有一个客户端收到此消息的场景**

> **1.订单服务启动多个，同一个消息，只能有一个客户端收到**


新创建一个订单服务，操作如下：

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202309/202309201052744.png#id=Yy4Fz&originHeight=304&originWidth=560&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202309/202309201054814.png#id=qL4Wl&originHeight=668&originWidth=981&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

新建完成启动订单服务`CfmallOrderApplication--8901`。

**接收消息代码如下**：

`com.gyz.cfmall.order.service.impl.OrderServiceImpl#receiveMessage`

```java
    @RabbitListener(queues = {"new-queus"})
    public void receiveMessage(Message message, OrderReturnReasonEntity entity, Channel channel) {
        byte[] body = message.getBody();
        MessageProperties messageProperties = message.getMessageProperties();
        System.out.println("接收到消息...内容：" + entity);
        System.out.println("消息处理完成" + entity.getName());
    }
```

**发送消息代码如下**：

`com.gyz.cfmall.order.controller.RabbitController#sendMessage`

```java
package com.gyz.cfmall.order.controller;

import com.gyz.cfmall.order.entity.OrderReturnReasonEntity;
import com.gyz.common.utils.R;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Date;

/**
 * @author gong_yz
 * @Description
 * @Date 2023/9/15
 */
@RestController
@RequestMapping("/rabbit")
public class RabbitController {

    @Autowired
    RabbitTemplate rabbitTemplate;

    @GetMapping("/sendMessage")
    public R sendMessage(@RequestParam(value = "num", defaultValue = "10") Integer num) {
        for (int i = 0; i < num; i++) {
            OrderReturnReasonEntity orderReturnReasonEntity = new OrderReturnReasonEntity();
            orderReturnReasonEntity.setId(1L);
            orderReturnReasonEntity.setName("哈哈" + i);
            orderReturnReasonEntity.setSort(1);
            orderReturnReasonEntity.setStatus(0);
            orderReturnReasonEntity.setCreateTime(new Date());

            rabbitTemplate.convertAndSend("new-direct-change", "queuesChange", orderReturnReasonEntity);
            System.out.println("消息发送成功");
        }
        return R.ok();
    }
}
```

**测试结果：同一个消息，只能有一个客户端收到**

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202309/202309201102820.png#id=VNRU7&originHeight=449&originWidth=1856&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202309/202309201102426.png#id=U1Jo7&originHeight=278&originWidth=1761&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

> **2.** **只有当一个消息完全处理完，方法运行结束，客户端才可以接收下一个消息**


接收消息代码：

`com.gyz.cfmall.order.service.impl.OrderServiceImpl#receiveMessage`

```java
	@RabbitListener(queues = {"new-queus"})
    public void receiveMessage(Message message, OrderReturnReasonEntity entity) throws InterruptedException {
        byte[] body = message.getBody();
        MessageProperties messageProperties = message.getMessageProperties();
        System.out.println("接收到消息...内容：" + entity);
        Thread.sleep(3000);
        System.out.println("消息处理完成==>" + entity.getName());
    }
```

测试结果：

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202309/202309201117866.png#id=t5plj&originHeight=808&originWidth=1555&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

---

## @RabbitHandler

**@RabbitListener标注类上监听多个队列**

**@RabbitHandler标注在方法上用于接受不同类型的消息对象**

> **模拟向队列发送不同消息对象**


发送消息代码：`cfmall-order/src/main/java/com/gyz/cfmall/order/controller/RabbitController.java`

```java
package com.gyz.cfmall.order.controller;

import com.gyz.cfmall.order.entity.OrderEntity;
import com.gyz.cfmall.order.entity.OrderReturnReasonEntity;
import com.gyz.common.utils.R;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Date;
import java.util.UUID;

/**
 * @author gong_yz
 * @Description
 * @Date 2023/9/15
 */
@RestController
@RequestMapping("/rabbit")
public class RabbitController {

    @Autowired
    RabbitTemplate rabbitTemplate;

    @GetMapping("/sendMessage")
    public R sendMessage(@RequestParam(value = "num", defaultValue = "10") Integer num) {
        for (int i = 0; i < num; i++) {
            if (i % 2 == 0) {
                OrderReturnReasonEntity orderReturnReasonEntity = new OrderReturnReasonEntity();
                orderReturnReasonEntity.setId(1L);
                orderReturnReasonEntity.setName("哈哈" + i);
                orderReturnReasonEntity.setSort(1);
                orderReturnReasonEntity.setStatus(0);
                orderReturnReasonEntity.setCreateTime(new Date());

                rabbitTemplate.convertAndSend("new-direct-change", "queuesChange", orderReturnReasonEntity);
                System.out.println("OrderReturnReasonEntity消息发送成功");
            } else {
                OrderEntity orderEntity = new OrderEntity();
                orderEntity.setOrderSn(UUID.randomUUID().toString());
                rabbitTemplate.convertAndSend("new-direct-change", "queuesChange", orderEntity);
                System.out.println("OrderEntity消息发送成功");
            }
        }
        return R.ok();
    }
}
```

接收消息代码：

```java
	/**
	* @RabbitHandler标注在方法上，重载区分不同的消息
	*/
	@RabbitHandler
    public void receiveMessage(Message message, OrderReturnReasonEntity entity) {
        byte[] body = message.getBody();
        MessageProperties messageProperties = message.getMessageProperties();
        System.out.println("接收到消息...内容：" + entity);
    }

    @RabbitHandler
    public void receiveMessage(OrderEntity orderEntity) {
        System.out.println("接收到消息...内容：" + orderEntity.getOrderSn());
    }
```

测试结果如下

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202309/202309201127717.png#id=pFz7O&originHeight=531&originWidth=1586&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)
