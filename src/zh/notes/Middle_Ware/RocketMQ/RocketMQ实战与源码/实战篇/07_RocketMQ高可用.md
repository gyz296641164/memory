---
title: 07_RocketMQ高可用
category:
  - RocketMQ
date: 2025-10-24
---


## RocketMQ中高可用机制

![image-20240618070551600](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/6dbcc2cdd11b9337.png)

RocketMQ分布式集群是通过Master和Slave的配合达到高可用性的。

Master和Slave的区别：在Broker的配置文件中，参数 `brokerId`的值为`0`表明这个Broker是Master，大于0表明这个Broker是 Slave，同时brokerRole参数也会说明这个Broker是Master还是Slave。

Master角色的Broker支持读和写，Slave角色的Broker仅支持读，也就是 Producer只能和Master角色的Broker连接写入消息；Consumer可以连接 Master角色的Broker，也可以连接Slave角色的Broker来读取消息。

### 集群部署模式

#### 单 master 模式

也就是只有一个 master 节点，称不上是集群，一旦这个 master 节点宕机，那么整个服务就不可用。

#### 多 master 模式

多个 master 节点组成集群，单个 master 节点宕机或者重启对应用没有影响。

优点：所有模式中性能最高（一个Topic的可以分布在不同的master，进行横向拓展）

在多主多从的架构体系下，无论使用客户端还是管理界面创建主题，一个主题都会创建多份队列在多主中（默认是4个的话，双主就会有8个队列，每台主4个队列，所以双主可以提高性能，一个Topic的分布在不同的master，方便进行横向拓展。

缺点：单个 master 节点宕机期间，未被消费的消息在节点恢复之前不可用，消息的实时性就受到影响。

#### 多master 多 slave 异步复制模式

而从节点(Slave)就是复制主节点的数据，对于生产者完全感知不到，对于消费者正常情况下也感知不到。（只有当Master不可用或者繁忙的时候，Consumer会被自动切换到从Slave 读。）

在多 master 模式的基础上，每个 master 节点都有至少一个对应的 slave。master节点可读可写，但是 slave只能读不能写，类似于 mysql 的主备模式。

优点： 一般情况下都是master消费，在 master 宕机或超过负载时，消费者可以从 slave 读取消息，消息的实时性不会受影响，性能几乎和多 master 一样。

缺点：使用异步复制的同步方式有可能会有消息丢失的问题。（Master宕机后，生产者发送的消息没有消费完，同时到Slave节点的数据也没有同步完）

#### 多master多 slave主从同步复制+异步刷盘（最优推荐）

**优点**：主从同步复制模式能保证数据不丢失。

**缺点**：发送单个消息响应时间会略长，性能相比异步复制低10%左右。对数据要求较高的场景，主从同步复制方式，保存数据热备份，通过异步刷盘方式，保证RocketMQ高吞吐量。

#### Dlegder（不推荐）

在RocketMQ4.5版本之后推出了Dlegder模式，但是这种模式一直存在严重的BUG，同时性能有可能有问题，包括升级到了4.8的版本后也一样，所以目前不讲这种模式。（类似于Zookeeper的集群选举模式）

### 刷盘与主从同步

生产时首先将消息写入到 MappedFile，内存映射文件，然后根据刷盘策略刷写到磁盘。

大致的步骤可以理解成使用MMAP中的MappedByteBuffer的flip()方法

![image-20240618073328606](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/381322b35a07cdff.png)

RocketMQ的刷盘是把消息存储到磁盘上的，这样既能保证断电后恢复， 又可以让存储的消息量超出内存的限制。RocketMQ为了提高性能，会尽可能地保证磁盘的顺序写。消息在通过Producer写入RocketMQ的时候，有两种写磁盘方式，同步刷盘和异步刷盘。

#### 同步刷盘

SYNC_FLUSH（同步刷盘）：生产者发送的每一条消息都在保存到磁盘成功后才返回告诉生产者成功。这种方式不会存在消息丢失的问题，但是有很大的磁盘IO开销，性能有一定影响。

#### 异步刷盘

ASYNC_FLUSH（异步刷盘）：生产者发送的每一条消息并不是立即保存到磁盘，而是暂时缓存起来，然后就返回生产者成功。随后再异步的将缓存数据保存到磁盘，有两种情况：

- 1是定期将缓存中更新的数据进行刷盘，
- 2是当缓存中更新的数据条数达到某一设定值后进行刷盘。这种异步的方式会存在消息丢失（在还未来得及同步到磁盘的时候宕机），但是性能很好。**默认是这种模式**。

![image-20240619070233880](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/21b4b69281c81a87.png)

4.8.0版本中默认值下是异步刷盘，如下图：

![image-20240619070350371](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/13cfba0459d8c54b.png)

#### 主从同步复制

集群环境下需要部署多个Broker，Broker分为两种角色：一种是master，即可以写也可以读，其brokerId=0，只能有一个；另外一种是slave，只允许读，其brokerId为非0。一个master与多个slave通过指定相同的brokerClusterName被归为一个broker set（broker集）。通常生产环境中，我们至少需要2个broker set。Slave是复制master的数据。一个Broker组有Master和Slave，消息需要从Master复制到Slave 上，有同步和异步两种复制方式。

主从同步复制方式（**Sync Broker**）：生产者发送的每一条消息都至少同步复制到一个slave后才返回告诉生产者成功，即“同步双写”

在同步复制方式下，如果Master出故障， Slave上有全部的备份数据，容易恢复，但是同步复制会增大数据写入延迟，降低系统吞吐量。

#### 主从异步复制

主从异步复制方式（**Async Broker**）：生产者发送的每一条消息只要写入master就返回告诉生产者成功。然后再“异步复制”到slave。

在异步复制方式下，系统拥有较低的延迟和较高的吞吐量，但是如果Master出了故障，有些数据因为没有被写 入Slave，有可能会丢失；

同步复制和异步复制是通过Broker配置文件里的brokerRole参数进行设置的，这个参数可以被设置成`ASYNC_MASTER`、 `SYNC_MASTER`、`SLAVE`三个值中的一个。

### 配置参数及意义

```
brokerId=0代表主
brokerId=1代表从（大于0都代表从）
brokerRole=SYNC_MASTER  同步复制（主从）
brokerRole=ASYNC_MASTER异步复制（主从）
flushDiskType=SYNC_FLUSH   同步刷盘
flushDiskType=ASYNC_FLUSH  异步刷盘
```

### 搭建双主双从同步复制+异步刷盘

- [ ] TODO

---

## 消息生产的高可用机制

![image-20240619071630333](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/240b42b4210b80d0.png)

在创建Topic的时候，把Topic的多个Message Queue创建在多个Broker组上（相同Broker名称，不同 brokerId的机器组成一个Broker组），这样当一个Broker组的Master不可用后，其他组的Master仍然可用，Producer仍然可以发送消息。 

RocketMQ目前不支持把Slave自动转成Master，如果机器资源不足， 需要把Slave转成Master，则要手动停止Slave角色的Broker，更改配置文件，用新的配置文件启动Broker。

> **高可用消息生产流程**

![image-20240619071806521](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/0446e0044eb67cd1.png)

1、TopicA创建在双主中，BrokerA和BrokerB中，每一个Broker中有4个队列

2、选择队列时，默认是使用轮训的方式，比如发送一条消息A时，选择BrokerA中的Q4

3、如果发送成功，消息A发结束。

4、如果消息发送失败，默认会采用重试机制

```
retryTimesWhenSendFailed	同步模式下内部尝试发送消息的最大次数  默认值是2
retryTimesWhenSendAsyncFailed	异步模式下内部尝试发送消息的最大次数 默认值是2
```

![image-20240619073508931](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/34164eb9305fe9b6.png)

![image-20240619073526353](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/995de7fabb9a4de2.png)

5、如果发生了消息发送失败，这里有一个规避策略（默认配置）：

5.1

- **默认不启用Broker故障延迟机制（规避策略）**：如果是BrokerA宕机，上一次路由选择的是BrokerA中的Q4，那么再次重发的队列选择是BrokerA中的Q1。但是这里的问题就是消息发送很大可能再次失败，引发再次重复失败，带来不必要的性能损耗。
- **注意，这里的规避仅仅只针对消息重试，例如在一次消息发送过程中如果遇到消息发送失败，规避 broekr-a，但是在下一次消息发送时，即再次调用 DefaultMQProducer 的 send 方法发送消息时，还是会选择 broker-a 的消息进行发送，只有继续发送失败后，重试时再次规避 broker-a**。
- 为什么会默认这么设计？
  - 某一时间段，从NameServer中读到的路由中包含了不可用的主机
  - 不正常的路由信息也是只是一个短暂的时间而已。
- 生产者每隔30s更新一次路由信息，而NameServer认为broker不可用需要经过120s。

![image-20240619073736257](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/a157cb6c019cb766.png)

所以生产者要发送时认为broker不正常（从NameServer拿到）和实际Broker不正常有延迟。

5.2

启用Broker故障延迟机制：代码如下

![image-20240619073903749](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/8e7105bc83672ffa.png)

开启延迟规避机制，一旦消息发送失败（**不是重试的**）会将 broker-a “悲观”地认为在接下来的一段时间内该 Broker 不可用，在为未来某一段时间内所有的客户端不会向该 Broker 发送消息。这个延迟时间就是通过 notAvailableDuration、latencyMax 共同计算的，就首先先计算本次消息发送失败所耗的时延，然后对应 latencyMax 中哪个区间，即计算在 latencyMax 的下标，然后返回 notAvailableDuration 同一个下标对应的延迟值。

这个里面涉及到一个算法，源码部分进行详细讲解。

比如***\*：\****在发送失败后，在接下来的固定时间（比如5分钟）内，发生错误的BrokeA中的队列将不再参加队列负载，发送时只选择BrokerB服务器上的队列。

如果所有的 Broker 都触发了故障规避，并且 Broker 只是那一瞬间压力大，那岂不是明明存在可用的 Broker，但经过你这样规避，反倒是没有 Broker 可用了，那岂不是更糟糕了。所以RocketMQ**默认不启用Broker故障延迟机制**。

---

## 消息消费的高可用机制

### 主从的高可用原理

在Consumer的配置文件中，并不需要设置是从Master读还是从Slave 读，当Master不可用或者繁忙的时候，Consumer会被自动切换到从Slave 读。有了自动切换Consumer这种机制，当一个Master角色的机器出现故障后，Consumer仍然可以从Slave读取消息，不影响Consumer程序。这就达到了消费端的高可用性。

> Master不可用这个很容易理解，那什么是Master繁忙呢？

**这个繁忙其实是RocketMQ服务器的内存不够导致的。**

源码分析：`org.apache.rocketmq.store. DefaultMessageStore#getMessage`方法

![image-20240620072826277](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/f73c862b6abd554f.png)

当前需要拉取的消息已经超过常驻内存的大小，表示主服务器繁忙，此时才建议从从服务器拉取。

### 消息消费的重试

消费端如果发生消息失败，没有提交成功，消息默认情况下会进入重试队列中。

![image-20240620073215128](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/3c2e1df7c10ff297.png)

**注意重试队列的名字其实是跟消费群组有关，不是主题，因为一个主题可以有多个群组消费，所以要注意**

![image-20240620073241293](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/faafcb2c66bae93a.png)

#### 顺序消息的重试

对于顺序消息，当消费者消费消息失败后，消息队列 RocketMQ 会自动不断进行消息重试（每次间隔时间为 1 秒），这时，应用会出现消息消费被阻塞的情况。因此，在使用顺序消息时，务必保证应用能够及时监控并处理消费失败的情况，避免阻塞现象的发生。

 所以玩顺序消息时。consume消费消息失败时，不能返回`reconsume——later`，这样会导致乱序，应该返回`suspend_current_queue_a_moment`，意思是先等一会，一会儿再处理这批消息，而不是放到重试队列里。

#### 无序消息的重试

对于无序消息（普通、定时、延时、事务消息），当消费者消费消息失败时，您可以通过设置返回状态达到消息重试的结果。无序消息的重试只针对集群消费方式生效；**广播方式不提供失败重试特性，即消费失败后，失败消息不再重试，继续消费新的消息。**

#### 重试次数

| 第几次重试 | 与上次重试的间隔时间 | 第几次重试 | 与上次重试的间隔时间 |
| ---------- | -------------------- | ---------- | -------------------- |
| 1          | 10 秒                | 9          | 7 分钟               |
| 2          | 30 秒                | 10         | 8 分钟               |
| 3          | 1 分钟               | 11         | 9 分钟               |
| 4          | 2 分钟               | 12         | 10 分钟              |
| 5          | 3 分钟               | 13         | 20 分钟              |
| 6          | 4 分钟               | 14         | 30 分钟              |
| 7          | 5 分钟               | 15         | 1 小时               |
| 8          | 6 分钟               | 16         | 2 小时               |

如果消息重试 16 次后仍然失败，消息将不再投递。如果严格按照上述重试时间间隔计算，某条消息在一直消费失败的前提下，将会在接下来的 4 小时 46 分钟之内进行 16 次重试，超过这个时间范围消息将不再重试投递。

**注意： 一条消息无论重试多少次，这些重试消息的 Message ID 不会改变。**

#### 重试配置

集群消费方式下，消息消费失败后期望消息重试，需要在消息监听器接口的实现中明确进行配置（三种方式任选一种）：

- 返回 RECONSUME_LATER （推荐）
- 返回 Null
- 抛出异常

![image-20240620073915003](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/20db9f8d9862c2db.png)

![image-20240620073931182](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/cec7c43a2f893313.png)

![image-20240620073944405](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/6bf4fd373a591943.png)

集群消费方式下，消息失败后期望消息不重试，需要捕获消费逻辑中可能抛出的异常，最终返回CONSUME_SUCCESS，此后这条消息将不会再重试。

#### 自定义消息最大重试次数

消息队列 RocketMQ 允许 Consumer 启动的时候设置最大重试次数，重试时间间隔将按照如下策略：

- 最大重试次数小于等于 16 次，则重试时间间隔同上表描述。
- 最大重试次数大于 16 次，超过 16 次的重试时间间隔均为每次 2 小时。

![image-20240620074037059](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/812da7b004872328.png)

消息最大重试次数的设置对相同 Group ID 下的所有 Consumer 实例有效。

如果只对相同 Group ID 下两个 Consumer 实例中的其中一个设置了 MaxReconsumeTimes，那么该配置对两个 Consumer 实例均生效。

配置采用覆盖的方式生效，即最后启动的 Consumer 实例会覆盖之前的启动实例的配置

### 死信队列

当一条消息初次消费失败，消息队列 RocketMQ 会自动进行消息重试；达到最大重试次数后，若消费依然失败，则表明消费者在正常情况下无法正确地消费该消息，此时，消息队列 RocketMQ 不会立刻将消息丢弃，而是将其发送到该消费者对应的特殊队列中。

在消息队列 RocketMQ 中，这种正常情况下无法被消费的消息称为死信消息（Dead-Letter Message），存储死信消息的特殊队列称为死信队列（Dead-Letter Queue）。

#### 死信特性

死信消息具有以下特性：

- 不会再被消费者正常消费。
- 有效期与正常消息相同，均为 3 天，3 天后会被自动删除。因此，请在死信消息产生后的 3 天内及时处理。

死信队列具有以下特性：

- 不会再被消费者正常消费。
- 一个死信队列对应一个 Group ID， 而不是对应单个消费者实例。
- 如果一个 Group ID 未产生死信消息，消息队列 RocketMQ 不会为其创建相应的死信队列。
- 一个死信队列包含了对应 Group ID 产生的所有死信消息，不论该消息属于哪个 Topic。

#### 查看死信消息

在控制台查询出现死信队列的主题信息

![image-20240620074223737](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/86d87e49b79d20dd.png)

在消息界面根据主题查询死信消息

选择重新发送消息

一条消息进入死信队列，意味着某些因素导致消费者无法正常消费该消息，因此，通常需要您对其进行特殊处理。排查可疑因素并解决问题后，可以在消息队列 RocketMQ 控制台重新发送该消息，让消费者重新消费一次。

---

## 负载均衡

### Producer负载均衡

Producer端，每个实例在发消息的时候，默认会轮询所有的message queue发送，以达到让消息平均落在不同的queue上。而由于queue可以散落在不同的broker，所以消息就发送到不同的broker下，如下图：

![image-20240621070709844](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/889c6e02d920de36.png)

发布方会把第一条消息发送至 Queue 1，然后第二条消息发送至 Queue 2，以此类推。

### Consumer负载均衡

#### 集群模式

在集群消费模式下，每条消息只需要投递到订阅这个topic的Consumer Group下的一个实例即可。RocketMQ采用主动拉取的方式拉取并消费消息，在拉取的时候需要明确指定拉取哪一条message queue。

而每当实例的数量有变更，都会触发一次所有实例的负载均衡，这时候会按照queue的数量和实例的数量平均分配queue给每个实例。

默认的分配算法是**AllocateMessageQueueAveragely** 

还有另外一种平均的算法是**AllocateMessageQueueAveragelyByCircle**，也是平均分摊每一条queue，只是以环状轮流分queue的形式

如下图：

![image-20240621071345699](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/c157a82631e62218.png)

> 需要注意的是，**集群模式下**，**queue都是只允许分配只一个实例**，这是由于如果多个实例同时消费一个queue的消息，由于拉取哪些消息是consumer主动控制的，那样会导致同一个消息在不同的实例下被消费多次，所以算法上都是一个queue只分给一个consumer实例，一个consumer实例可以允许同时分到不同的queue。
>
> 通过增加consumer实例去分摊queue的消费，可以起到水平扩展的消费能力的作用。而**有实例下线的时候，会重新触发负载均衡**，这时候原来分配到的queue将分配到其他实例上继续消费。
>
> 但是如果consumer实例的数量比message queue的总数量还多的话，多出来的consumer实例将无法分到queue，也就无法消费到消息，也就无法起到分摊负载的作用了。所以需要控制让queue的总数量大于等于consumer的数量。

#### 广播模式

由于广播模式下要求一条消息需要投递到一个消费组下面所有的消费者实例，所以也就没有消息被分摊消费的说法。

在实现上，其中一个不同就是在consumer分配queue的时候，所有consumer都分到所有的queue。