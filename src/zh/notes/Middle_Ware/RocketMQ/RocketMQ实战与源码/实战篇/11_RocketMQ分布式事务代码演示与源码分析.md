---
title: 11_RocketMQ分布式事务代码演示与源码分析
category:
  - RocketMQ
date: 2025-10-24
---


## 生产者

```java
package org.apache.rocketmq.example.transaction;

import org.apache.rocketmq.client.exception.MQClientException;
import org.apache.rocketmq.client.producer.SendResult;
import org.apache.rocketmq.client.producer.TransactionListener;
import org.apache.rocketmq.client.producer.TransactionMQProducer;
import org.apache.rocketmq.common.message.Message;
import org.apache.rocketmq.remoting.common.RemotingHelper;

import java.io.UnsupportedEncodingException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.concurrent.*;
/**
 * A系统
 */
public class TransactionProducer {
    public static void main(String[] args) throws MQClientException, InterruptedException {
        //创建事务监听器
        TransactionListener transactionListener = new TransactionListenerImpl();
        TransactionMQProducer producer = new TransactionMQProducer("TransactionProducer");
        producer.setNamesrvAddr("127.0.0.1:9876");
        //创建线程池
        ExecutorService executorService = new ThreadPoolExecutor(2, 5, 100, TimeUnit.SECONDS, new ArrayBlockingQueue<Runnable>(2000), new ThreadFactory() {
            @Override
            public Thread newThread(Runnable r) {
                Thread thread = new Thread(r);
                thread.setName("client-transaction-msg-check-thread");
                return thread;
            }
        });
        //设置生产者回查线程池
        producer.setExecutorService(executorService);
        //生产者设置监听器
        producer.setTransactionListener(transactionListener);
        //启动消息生产者
        producer.start();
        //1、半事务的发送
        try {
            Message msg =
                new Message("TransactionTopic", null, ("A向B系统转100块钱 ").getBytes(RemotingHelper.DEFAULT_CHARSET));

            SendResult sendResult = producer.sendMessageInTransaction(msg, null);
            SimpleDateFormat df = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");//设置日期格式
            System.out.println(sendResult.getSendStatus()+"-"+df.format(new Date()));//半事务消息是否成功
        } catch (MQClientException | UnsupportedEncodingException e) {
            //todo 回滚rollback
            e.printStackTrace();
        }
        //2、半事务的发送成功
        //一些长时间等待的业务（比如输入密码，确认等操作）：需要通过事务回查来处理
        for (int i = 0; i < 1000; i++) {
            Thread.sleep(1000);
        }
        producer.shutdown();
    }
}
```

---

## 消费者

```java
package org.apache.rocketmq.example.transaction;

import org.apache.rocketmq.client.consumer.DefaultMQPushConsumer;
import org.apache.rocketmq.client.consumer.listener.ConsumeConcurrentlyContext;
import org.apache.rocketmq.client.consumer.listener.ConsumeConcurrentlyStatus;
import org.apache.rocketmq.client.consumer.listener.MessageListenerConcurrently;
import org.apache.rocketmq.common.message.MessageExt;
import org.apache.rocketmq.common.protocol.heartbeat.MessageModel;

import java.util.List;

/**
 * 事务消息-消费者 B
 */
public class TranscationComuser {
    public static void main(String[] args) throws Exception {
        DefaultMQPushConsumer consumer = new DefaultMQPushConsumer("TranscationComsuer");
        consumer.setNamesrvAddr("127.0.0.1:9876");
        consumer.subscribe("TransactionTopic", "*");
        consumer.setMessageModel(MessageModel.CLUSTERING);
        consumer.registerMessageListener(new MessageListenerConcurrently() {
            @Override
            public ConsumeConcurrentlyStatus consumeMessage(List<MessageExt> msgs,
                                                            ConsumeConcurrentlyContext context) {
                try {
                    //todo  开启事务
                    for(MessageExt msg : msgs) {
                        //todo 执行本地事务 update B...（幂等性）
                        System.out.println("update B ... where transactionId:"+msg.getTransactionId());
                        //todo 本地事务成功
                        System.out.println("commit:"+msg.getTransactionId());
                        System.out.println("执行本地事务成功，确认消息");
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                    System.out.println("执行本地事务失败，重试消费，尽量确保B处理成功");
                    return ConsumeConcurrentlyStatus.RECONSUME_LATER;
                }
                return ConsumeConcurrentlyStatus.CONSUME_SUCCESS;
            }
        });
        //启动消息者
        consumer.start();
        System.out.printf("Consumer Started.%n");
    }
}
```

---

## 监听器

```java
package org.apache.rocketmq.example.transaction;

import org.apache.rocketmq.client.producer.LocalTransactionState;
import org.apache.rocketmq.client.producer.TransactionListener;
import org.apache.rocketmq.common.message.Message;
import org.apache.rocketmq.common.message.MessageExt;

import java.text.SimpleDateFormat;
import java.util.Date;

public class TransactionListenerImpl implements TransactionListener {
    //执行本地事务
    @Override
    public LocalTransactionState executeLocalTransaction(Message msg, Object arg) {
        SimpleDateFormat df = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");//设置日期格式
        //todo 执行本地事务 update A...
        System.out.println("update A ... where transactionId:"+msg.getTransactionId() +":"+df.format(new Date()));
        //System.out.println("commit");
        //todo 情况1：本地事务成功
        //return LocalTransactionState.COMMIT_MESSAGE;
        //todo 情况2：本地事务失败
        //System.out.println("rollback");
        //return LocalTransactionState.ROLLBACK_MESSAGE;
        //todo 情况3：业务复杂，还处于中间过程或者依赖其他操作的返回结果，就是unknow
        System.out.println("业务比较长，还没有处理完，不知道是成功还是失败！");
        return LocalTransactionState.UNKNOW;
    }
    //事务回查  默认是60s，一分钟检查一次
    @Override
    public LocalTransactionState checkLocalTransaction(MessageExt msg) {
        //打印每次回查的时间
        SimpleDateFormat df = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");//设置日期格式
        System.out.println("checkLocalTransaction:"+df.format(new Date()));// new Date()为获取当前系统时间
        //todo 情况3.1：业务回查成功！
        System.out.println("业务回查：执行本地事务成功，确认消息");
        return LocalTransactionState.COMMIT_MESSAGE;
        //todo 情况3.2：业务回查回滚！
       // System.out.println("业务回查：执行本地事务失败，删除消息");
       // return LocalTransactionState.ROLLBACK_MESSAGE;
        //todo 情况3.3：业务回查还是UNKNOW！
         //System.out.println("业务比较长，还没有处理完，不知道是成功还是失败！");
         //return LocalTransactionState.UNKNOW;
    }
}
```

---

## 测试

先启动消费者、再启动生产者进行观察

---

## 分布式事务源码分析

从分布式事务的流程上，我们分析源码，可以从消息发送，确认/回滚 ，回查三个方面。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/3ec0422daf66c19a.png)

### 消息发送源码分析

#### Producer

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/08b54be7025f0076.png)

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/7bcbb93a8c3b8c48.png)

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/83f47a0c790aa9dd.png)

#### Broker

RocketMQ使用Netty处理网络，broker收到消息写入的请求就会进入SendMessageProcessor类中processRequest方法。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/c6e6daf3299fa6c7.png)

最终进入DefaultMessageStore类中asyncPutMessage方法进行消息的存储

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/e7669dbedd7d650a.png)

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/9af90df1074fdffc.png)

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/a2d6b44c59cb2695.png)

结合图同时结合代码，我们可以看到，在事务消息发送时，消息实际存储的主题是一个系统主题：RMQ_SYS_TRANS_HALF_TOPIC

同时消息中保存着消息的原有主题相关的信息与队列

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/3f05c1d2856f4d77.png)

### 确认/回滚源码分析

**Producer**

DefaultMQProducerImpl类sendMessageInTransaction方法

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/48e149b0ce788ab5.png)

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/6658c81fd1a6102a.png)

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/bc84de5ea31f71dd.png)

**Broker**

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/eb507f07d08055a3.png)

EndTransactionProcessor类

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/0f55f47c25286a43.png)

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/050977ab6f555fb9.png)

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/8882648aa750f953.png)

### 回查源码分析

**Producer**

事务回查中，Producer是服务端，所以需要注册服务处理

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/2e50601d8b706675.png)

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/bfbc920d45167a74.png)

DefaultMQProducerImpl类checkTransactionState方法

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/9f084fa10306b151.png)

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/445a4e5bf6c1b298.png)

DefaultMQProducerImpl类processTransactionState方法

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/7b06dc6fa22f1588.png)

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/8c4df620acbe1629.png)

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/c89af847936511c1.png)

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/dfa52cd9ee42e111.png)

**Broker**

在Broker启动的时候，是要作为客户端，定期的访问客户端做事务回查。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/721494129607b87e.png)

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/e70cc2aab9eedec0.png)

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/913ca6de112a9826.png)

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/4084c477dde98663.png)

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/221401bed63acb30.png)

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/afa6ec992a67ccca.png)

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/c098e1cb616d7907.png)

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/31f6a94a6130cb45.png)

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/d2884eb0e93acb53.png)

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/978195f2c0fc5536.png)

事务回查是Broker发起的一次定时的网络调用（每隔60s），所以事务回查在客户端启动的时候第一次不一定是60s的间隔，一般会小于60s（因为事务回查是broker发起的，并不是client端定时发起)