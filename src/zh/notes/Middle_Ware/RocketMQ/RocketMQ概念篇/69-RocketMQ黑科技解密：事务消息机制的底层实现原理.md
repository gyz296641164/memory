---
title: ✅69、RocketMQ黑科技解密：事务消息机制的底层实现原理
category:
  - RocketMQ
date: 2025-10-24
---


**RocketMQ黑科技解密：事务消息机制的底层实现原理**

---

# 1、half 消息是如何对消费者不可见的？

我们之前已经说过了RocketMQ事务消息的全流程，在这个流程中，第一步就是要由订单系统去发送一个half消息给MQ

大家看下面的图，应该还记得这个东西。

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202309/202309141059891.png)     

然后当时我们给大家说过，对于这个half消息，红包系统这个时候是看不到他的，没法消费这条消息去处理，那这个half消息是如何做到不给人家红包系统看到的呢？

其实RocketMQ底层采取了一个巧妙的设计。

咱们先举个例子，订单系统发送了一个half状态的订单支付消息到“OrderPaySuccessTopic”里去，这是一个Topic

然后呢，红包系统也是订阅了这个“OrderPaySuccessTopic”从里面获取消息的，我们看下图示意。

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202309/202309141100827.png)       

当然我们从之前的底层原理剖析的环节都知道，其实你写入一个Topic，最终是定位到这个Topic的某个MessageQueue，然后定位到一台Broker机器上去，然后写入的是Broker上的CommitLog文件，同时将消费索引写入MessageQueue对应的ConsumeQueue文件

这个如果大家遗忘了，回头去看一下，我们看下图示意。

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202309/202309141100476.png)       

所以通过上面的图我们知道，如果你写入一条half消息到OrderPaySuccessTopic里去，会定位到这个Topic的一个MessageQueue，然后定位到上图RocketMQ的一台机器上去，接着按理说，消息会写入CommitLog。

同时消息的offset会写入MessageQueue对应的ConsumeQueue，这个ConsumeQueue是属于OrderPaySuccuessTopic的，然后红包系统按理说会从这个ConsumeQueue里获取到你写入的这个half消息。

但是实际上红包系统却没法看到这条消息，其本质原因就是RocketMQ一旦发现你发送的是一个half消息，他不会把这个half消息的offset写入OrderPaySuccessTopic的ConsumeQueue里去。

他会把这条half消息写入到自己内部的**RMQ_SYS_TRANS_HALF_TOPIC**这个Topic对应的一个ConsumeQueue里去

我们看下图。

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202309/202309141100686.png)       

真相大白了，所以对于事务消息机制之下的half消息，RocketMQ是写入内部Topic的ConsumeQueue的，不是写入你指定的OrderPaySuccessTopic的ConsumeQueue的

所以你的红包系统自然无法从OrderPaySuccessTopic的ConsumeQueue中看到这条half消息了

---

# 2、在什么情况下订单系统会收到half消息成功的响应？

下一个问题来了，那么在什么情况下订单系统会收到half消息成功的响应呢？

简单来说，结合上面的内容，大家就可以清晰判断出，必须要half消息进入到RocketMQ内部的RMQ_SYS_TRANS_HALF_TOPIC的ConsumeQueue文件了，此时就会认为half消息写入成功了，然后就会返回响应给订单系统。

所以这个时候，一旦你的订单系统收到这个half消息写入成功的响应，必然就知道这个half消息已经在RocketMQ内部了。

---

# 3、假如因为各种问题，没有执行rollback或者commit会怎么样？

下一个问题，假如因为网络故障，订单系统没收到half消息的响应，或者说自己发送的rollback/commit请求失败了，那么RocketMQ会干什么？

其实这个时候他会在后台有定时任务，定时任务会去扫描RMQ_SYS_TRANS_HALF_TOPIC中的half消息，如果你超过一定时间还是half消息，他会回调订单系统的接口，让你判断这个half消息是要rollback还是commit

如下图 ![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202309/202309141101258.png)

---

# 4、如果执行rollback操作的话，如何标记消息回滚？

假设我们的订单系统执行了rollback请求，那么此时就需要对消息进行回滚。

之前我们说，RocketMQ会把这个half消息给删除，但是大家觉得删除消息是真的会在磁盘文件里删除吗？

显示不是的

因为RocketMQ都是顺序把消息写入磁盘文件的，所以在这里如果你执行rollback，他的本质就是用一个OP操作来标记half消息的状态

RocketMQ内部有一个OP_TOPIC，此时可以写一条rollback OP记录到这个Topic里，标记某个half消息是rollback了，如下图。

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202309/202309141101023.png)       

另外给大家说一下，假设你一直没有执行commit/rollback，RocketMQ会回调订单系统的接口去判断half消息的状态，但是他最多就是回调15次，如果15次之后你都没法告知他half消息的状态，就自动把消息标记为rollback。

---

# 5、如果执行commit操作，如何让消息对红包系统可见？

最后一个问题，如果订单系统执行了commit操作，如何让消息对红包系统可见呢？

其实也很简单，你执行commit操作之后，RocketMQ就会在OP_TOPIC里写入一条记录，标记half消息已经是commit状态了。

接着需要把放在RMQ_SYS_TRANS_HALF_TOPIC中的half消息给写入到OrderPaySuccessTopic的ConsumeQueue里去，然后我们的红包系统可以就可以看到这条消息进行消费了，如下图。

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202309/202309141101465.png)

---

# 6、之前研究RocketMQ底层原理的意义

看到这里，大家应该对事务消息机制的底层原理比较了解了，其实他的本质都是基于CommitLog、ConsumeQueue这套存储机制来做的，只不过中间有一些Topic的变换，half消息可能就是写入内部Topic的。

所以通过这里的学习，大家也会逐渐明白，在研究一些中间件技术的高阶功能之前，最好是先对他的底层原理有一个学习，这样才能更好的理解
