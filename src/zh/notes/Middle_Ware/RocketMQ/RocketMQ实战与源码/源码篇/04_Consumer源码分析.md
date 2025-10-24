---
title: 04_Consumer源码分析
category:
  - RocketMQ
date: 2025-10-24
---


> Consumer源码分析

## 消息发送时数据在ConsumeQueue的落地

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/e50f51cf9165de61.png)

连续发送5条消息，消息是不定长，首先所有信息先放入 Commitlog中，每一条消息放入Commitlog的时候都需要上锁，确保顺序的写入。

当Commitlog写成功了之后。数据通过ReputMessageService类定时同步到ConsunmeQueue中，写入Consume Queue的内容是定长的，固定是20个Bytes（offset 8个、size 4个、Hashcode of Tag 8个）。

**这种设计非常的巧妙：**

查找消息的时候，可以直按根据队列的消息序号，计算出索引的全局位置（比如序号2，就知道偏移量是20），然后直接读取这条索引，再根据索引中记录的消息的全局位置，找到消息。这两次查找是差不多的：第一次在通过序号在consumer Queue中获取数据的时间复杂度是O(1)，第二次查找commitlog文件的时间复杂度也是O(1)，所以消费时查找数据的时间复杂度也是O(1)。

**ReputMessageService.doReput源码分析**

DefaultMessageStore. start()

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/6370df52c113270d.png)

maxPhysicalPosInLogicQueue 就是commitlog的文件名（这个文件记录的最小偏移量）

ReputMessageService.run()

ReputMessageService线程每执行一次任务推送休息1毫秒就继续尝试推送消息

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/93a64bd32b9a6bbb.png)

1）返回reputFromOffset偏移量开始的全部有效数据(commitlog文件)。然后循环读取每一条消息。

2）从result返回的ByteBuffer中循环读取消息，一次读取一条，创建DispatchRequest对象。如果消息长度大于0，则调用doDispatch方法。最终将分别调用CommitLogDispatcherBuildConsumeQueue(构建消息消费队列)CommitLogDispatcherBuildIndex(构建索引文件)。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/b9abe2f8ba064eca.png)

3）构建消息消费队列

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/0e38e55c4867d57c.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/5253d1a17181a050.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/1a14a0ac7f705f42.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/927b15de1ec00061.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/da16f2b9175ae222.png)

---

## 消费者启动流程

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/27df177b898ebc7b.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/48d422d0a19486ea.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/6bcef82029eace56.png)

DefaultMQPushConsumerImpl类是核心类

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/61e36df296882e2e.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/3fba1e3d4bfbe9a7.png)

---

## 消费者模式

### 集群消费

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/545d8f45475a9a07.png)

消费者的一种消费模式。一个ConsumerGroup中的各个Consumer实例分摊去消费消息，即一条消息只会投递到一个Consumer Group下面的一个实例。

实际上，每个Consumer是平均分摊MessageQueue的去做拉取消费。例如某个Topic有3条Q，其中一个Consumer Group 有 3 个实例（可能是 3 个进程，或者 3 台机器），那么每个实例只消费其中的1条Q。

而由Producer发送消息的时候是轮询所有的Q,所以消息会平均散落在不同的Q上，可以认为Q上的消息是平均的。那么实例也就平均地消费消息了。

这种模式下，**消费进度** **(Consumer Offset)**  **的存储会持久化到Broker** 。

**代码演示**

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/2bde332d8211b277.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/303a1bcafca75663.png)

### 广播消费

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/048c14cb72229fd7.png)

消费者的一种消费模式。消息将对一个ConsumerGroup下的各个Consumer实例都投递一遍。即即使这些 Consumer 属于同一个Consumer Group，消息也会被Consumer Group 中的每个Consumer都消费一次。

实际上，是一个消费组下的每个消费者实例都获取到了topic下面的每个Message Queue去拉取消费。所以消息会投递到每个消费者实例。

这种模式下，**消费进度** **(Consumer Offset)**  **会存储持久化到实例本地** 。

**代码演示**

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/6719b9dff9662acc.png)

---

## Consumer负载均衡

### 集群模式

在集群消费模式下，每条消息只需要投递到订阅这个topic的Consumer Group下的一个实例即可。RocketMQ采用主动拉取的方式拉取并消费消息，在拉取的时候需要明确指定拉取哪一条message queue。

而每当实例的数量有变更，都会触发一次所有实例的负载均衡，这时候会按照queue的数量和实例的数量平均分配queue给每个实例。

默认的分配算法是AllocateMessageQueueAveragely

还有另外一种平均的算法是AllocateMessageQueueAveragelyByCircle，也是平均分摊每一条queue，只是以环状轮流分queue的形式

如下图：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/18efd37fdb5e8312.png)

需要注意的是，集群模式下，queue都是只允许分配只一个实例，这是由于如果多个实例同时消费一个queue的消息，由于拉取哪些消息是consumer主动控制的，那样会导致同一个消息在不同的实例下被消费多次，所以算法上都是一个queue只分给一个consumer实例，一个consumer实例可以允许同时分到不同的queue。

通过增加consumer实例去分摊queue的消费，可以起到水平扩展的消费能力的作用。而有实例下线的时候，会重新触发负载均衡，这时候原来分配到的queue将分配到其他实例上继续消费。

但是如果consumer实例的数量比message queue的总数量还多的话，多出来的consumer实例将无法分到queue，也就无法消费到消息，也就无法起到分摊负载的作用了。所以需要控制让queue的总数量大于等于consumer的数量。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/1b44af953539b015.png)

### 广播模式

由于广播模式下要求一条消息需要投递到一个消费组下面所有的消费者实例，所以也就没有消息被分摊消费的说法。

在实现上，其中一个不同就是在consumer分配queue的时候，所有consumer都分到所有的queue。

---

## 并发消费流程

一般我们在消费时使用回调函数的方式，使用得最多的是并发消费，消费者客户端代码如下：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/67412545c180540c.png)

参考RocketMQ核心流程

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/9189d565b6bbe6df.png)

在RocketMQ的消费时，整体流程如下：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/99d35475172333d0.png)

### 获取topic配置信息

在消费者启动之后，第一步都要从NameServer中获取Topic相关信息。

这一步设计到组件之间的交互，RocketMQ使用功能号来设计的。GET_ROUTEINFO_BY_TOPIC在idea上使用ctrl+H 查找功能。很快就定位这段代码：

MQClientInstance类中

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/0f8d9ea5c97fde1f.png)

![image.png](https://fynotefile.oss-cn-zhangjiakou.aliyuncs.com/fynote/fyfile/5983/1650087469088/b975fa02e6004262bb80a06e438c3698.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/720a164fae8e49fc.png)

最终在MQClientAPIImpl类中完成调用

![image.png](https://fynotefile.oss-cn-zhangjiakou.aliyuncs.com/fynote/fyfile/5983/1648432544069/69f0de261f9a4ae0ab150dbeee4788f5.png)

具体这里是30S定时执行一次。

### 获取Group的ConsumerList

在消费消息前，需要获取当前分组已经消费的相关信息：ConsumerList

MQClientInstance类的start()

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/6f5a7b7e6d2e423a.png)

这里就是每间隔20S就执行一个doRebalance方法

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/67c7d60579af78b3.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/aeb2f1e3add70aaf.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/3929d29075461615.png)

进入RebalanceImpl类

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/139ffd9ded8893aa.png)

再进入具体的类,如果是广播消费模式，则不需要从服务器获取消费进度（广播消费模式把进度在本地&#x3c;消费端&#x3e;进行存储）

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/f968a21d1218edea.png)

而广播消费模式，则需要从服务器获取消费进度相关信息，具体如下：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/994c46c11cb98fb6.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/713e46eba2a94025.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/d623736bcc2464cd.png)

### 获取Queue的消费Offset

在分配完消费者对应的Queue之后，如果是集群模式的话，需要获取这个消费者对应Queue的消费Offset,便于后续拉取未消费完的消息。

RebalanceImpl类中rebalanceByTopic方法

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/37ca16eb3a25cae4.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/8acc3e28fc334d79.png)

进入RebalancePushImpl类

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/695c1bad614e62b9.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/ebb9e329f308ab37.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/ed448f66cff22962.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/f14deee5a8423246.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/0499059e7e2ddd26.png)

### 拉取Queue的消息

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/b34c6b6acabf9fee.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/6ec93b47e1f8e844.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/cf580797f13bef2e.png)

最终进入DefaultMQPushConsumerImpl类的pullMessage方法

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/3c06d2acc39b881b.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/3534b5804b4df979.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/6beeb7ab96e2d9d4.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/22d5b5403abb5430.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/4273ecf02220d3bc.png)

### 更新Queue的消费Offset

这里要注意，因为RocketMQ的推模式是基于拉模式实现的，因为拉消息是一批批拉，所以不能做到拉一批提交一次偏移量，所以这里使用定时任务进行偏移量的更新。

MQClientInstance类中的start方法

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/5bd145bdb1ab0fd9.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/ae5807b336fd1de5.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/18fd1050222f6447.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/3e42be38db3be7c2.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/21ee9174415afbbc.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/220d1b45d81695d8.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/179bfa90c640917c.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/1bca77c726aec60e.png)

### 注销Consumer

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/3fc66127d197a2aa.png)

---

## 顺序消费流程

顺序消费代码：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/bb4daa4c564c2274.png)

顺序消费的流程和并发消费流程整体差不多，唯一的多的就是使用锁机制来确保一个队列同时只能被一个消费者消费，从而确保消费的顺序性

ConsumeMessageOrderlyService类

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/d415b8c0f6fa3218.png)

这里有一个定时任务，是每个20秒运行一次（周期性的去续锁，锁的有效期是60S）

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/a32063096287ea18.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/75ffc4062e506827.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/4de094895f5a6fa7.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/a8bf99de1fab44ce.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/3ea7425617ba56d3.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/d51de1f44d9b4f5d.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/f66dff0a0cc3d2a8.png)

---

## 消费卡死

之前我讲到了消费的流程中，尤其是针对顺序消息，我们感觉上会有卡死的现象，由于顺序消息中需要到Broker中加锁，如果消费者某一个挂了，那么在Broker层是维护了60s的时间才能释放锁，所以在这段时间只能，消费者是消费不了的，在等待锁。

另外如果还有Broker层面也挂了，如果是主从机构，获取锁都是走的Master节点，如果Master节点挂了，走Slave消费，但是slave节点上没有锁，所以顺序消息如果发生了这样的情况，也是会有卡死的现象。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/a37f5ef119ec0894.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/af2879ddfbdd50b7.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/2246084a3848bb64.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/8de5a50b12d5b603.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/22232ff5af9fa651.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/5876e0e605a676e1.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/03de10ef076f525f.png)

---

## 启动之后较长时间才消费

在并发消费的时候，当我们启动了非常多的消费者，维护了非常多的topic的时候、或者queue比较多的时候，你可以看到消费的流程的交互是比较多的（5~6步），要启动多线程，也要做相当多的事情，所以你会感觉要启动较长的时间才能消费。

还有顺序消费的时候，如果是之前的消费者挂了，这个锁要60秒才会释放，也会导致下一个消费者启动的时候需要等60s才能消费。

---

## 消费端整体流程预览

这个流程比较复杂，建议有兴趣的同学可以根据这张图研究下

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/39b76c4ba014a188.png)
