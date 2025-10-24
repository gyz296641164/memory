---
title: ✅94、如何基于本地运行的RocketMQ进行消息的生产与消费
category:
  - RocketMQ
date: 2025-10-24
---


**如何基于本地运行的RocketMQ进行消息的生产与消费？**

---

# 1、使用RocketMQ自带的例子程序测试消息的发送和消费

接着我们可以使用RocketMQ自带的例子程序来测试消息的发送和消费，就在example模块下面就有，我们看下面的图。

在图中我们可以在quickstart包下找到Producer和Consumer两个例子类，而且大家可以看到，在这里包括事务消息、顺序消息，等等，很多高阶功能的例子在这里都有。

​      ![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202309/202310091723795.png)       

---

# 2、创建一个测试用的Topic出来

首先我们需要启动rocketmq-console工程，之前在29讲里教过大家启动这个rocketmq控制台的步骤，大家把这个工程启动即可，在启动之后，我们就可以看到集群里有一台broker机器，如下图。

  ![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202309/202310091723973.png)       

接着我们就进入Topic菜单，新建一个名称为TopicTest的Topic即可，新建完之后在Topic列表就可以看到下面的内容了。

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202309/202310091723089.png)       

---

# 3、修改和运行RocketMQ自带的Producer示例程序

接着我们来修改一下RocketMQ自带的Producer示例程序，如下所示：

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202309/202310091723829.png)

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202309/202310091723559.png)

接着我们执行运行上面的程序就可以了，他会发送1条消息到Broker里去，我们观察一下控制台的日志打印，可以看到下面的内容，就说明我们已经成功的把消息发送到Broker里去了。

> SendResult [sendStatus=SEND_OK, msgId=240E03A24CD1B7A0B066027402ACC71F000018B4AAC217E3F1580000, offsetMsgId=C0A8030900002A9F0000000000000000, messageQueue=MessageQueue [topic=TopicTest, brokerName=broker-a, queueId=2], queueOffset=0]

---

# 4、修改和运行RocketMQ自带的Consume示例程序

接着修改RocketMQ自带的Consumer示例程序：

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202309/202310091723825.png)

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202309/202310091723733.png)

接着运行上述程序，可以看到消费到了1条消息，如下所示：

> ConsumeMessageThread_1 Receive New Messages: [MessageExt [queueId=2, storeSize=225, queueOffset=0, sysFlag=0, bornTimestamp=1580887214424, bornHost=/192.168.3.9:56600, storeTimestamp=1580887214434, storeHost=/192.168.3.9:10911, msgId=C0A8030900002A9F0000000000000000, commitLogOffset=0, bodyCRC=613185359, reconsumeTimes=0, preparedTransactionOffset=0, toString()=Message{topic='TopicTest', flag=0, properties={MIN_OFFSET=0, MAX_OFFSET=1, CONSUME_START_TIME=1580887519080, UNIQ_KEY=240E03A24CD1B7A0B066027402ACC71F000018B4AAC217E3F1580000, CLUSTER=DefaultCluster, WAIT=true, TAGS=TagA}, body=[72, 101, 108, 108, 111, 32, 82, 111, 99, 107, 101, 116, 77, 81, 32, 48], transactionId='null'}]]

到此为止，我们的RocketMQ的源码环境彻底搭建完毕了，而且可以在本地启动以及收发消息，其实到这里为止，我们就可以去调试和分析RocketMQ的源码了。