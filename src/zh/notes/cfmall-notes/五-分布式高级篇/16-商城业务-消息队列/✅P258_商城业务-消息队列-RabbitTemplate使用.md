---
title: ✅P258_商城业务-消息队列-RabbitTemplate使用
category:
  - 谷粒商城
date: 2024-02-14
---

<!-- more -->

**商城业务-消息队列-RabbitTemplate使用**

---

## 1.使用RabbitTemplate工具类发送String类型消息

`cfmall-order/src/test/java/com/gyz/cfmall/order/CfmallOrderApplicationTests.java`

```java
@Test
public void sendMessage() {
    rabbitTemplate.convertAndSend("new-direct-change", "queuesChange", "hello,hello");
    log.info("消息发送成功");
}
```

---

## 2.使用RabbitTemplate工具类发送java对象

> 前提条件：**java对象实现了Serializable接口**


`cfmall-order/src/test/java/com/gyz/cfmall/order/CfmallOrderApplicationTests.java`

```java
/**
 * 发送java对象
 */
@Test
public void sendPojoMessage() {
    OrderReturnReasonEntity orderReturnReasonEntity = new OrderReturnReasonEntity();
    orderReturnReasonEntity.setId(1l);
    orderReturnReasonEntity.setName("hahaha");
    orderReturnReasonEntity.setSort(1);
    orderReturnReasonEntity.setStatus(0);
    orderReturnReasonEntity.setCreateTime(new Date());
    rabbitTemplate.convertAndSend("new-direct-change", "queuesChange", orderReturnReasonEntity);
    log.info("发送对象消息成功");
}
```

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202309/202309151501881.png#id=RJOe8&originHeight=906&originWidth=928&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

---

## 3.使用RabbitTemplate工具类发送json数据

> 前提条件：**给容器中注入json转化器**


`org.springframework.amqp.support.converter`

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202309/202309151503724.png#id=H4tYf&originHeight=581&originWidth=1549&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

`cfmall-order/src/main/java/com/gyz/cfmall/order/config/MyRabbitConfig.java`

```java
package com.gyz.cfmall.order.config;

import org.springframework.amqp.support.converter.AbstractMessageConverter;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;


/**
 * @author gong_yz
 * @Description
 * @Date 2023/9/15
 */
@Configuration
public class MyRabbitConfig {

    @Bean
    public AbstractMessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
```

再次发送个java对象消息，此时效果：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202309/202309151505069.png#id=BLv85&originHeight=698&originWidth=903&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)
