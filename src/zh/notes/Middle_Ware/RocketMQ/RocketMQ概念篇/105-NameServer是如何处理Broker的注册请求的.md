---
title: ✅105、NameServer是如何处理Broker的注册请求的
category:
  - RocketMQ
date: 2025-10-24
---


**NameServer是如何处理Broker的注册请求的？**

---

上一次我们分析完了Broker启动的时候是如何通过BrokerOuterAPI发送注册请求到NameServer去的

大家看下图红圈的部分，我们可以回忆一下这个Broker发送注册请求的过程。

![image-20231017150723762](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310171509474.png)

今天我们就来研究一下NameServer接收到这个注册请求之后，是如何进行处理的，这里要涉及到Netty网络通信相关的东西，可能很多人没接触过Netty，但是没关系，我尽量弱化掉Netty自身的东西，主要站在通用的网络通信的角度去讲解。

大家如果对Netty不了解的，对一些Netty自己的特殊API也不用过多的去关注，主要了解他的网络通信的流程就可以了。

现在我们回到NamesrvController这个类的初始化的方法里去，也就是NamesrvController.initialize()这个方法

我们看下面的一个源码片段就可以了，我省略了一些无关紧要的代码。

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310171509588.png)

我们继续看下面的registerProcessor()方法的源码。

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310171509486.png)

大家看完了上面的源码之后，我来给大家在图里感受一下，在下图中我们可以看到NettyServer是用于接收网络请求的，那么接收到的网络请求给谁处理呢？

其实就是给**DefaultRequestProcessor**这个请求处理组件来进行处理的。

![image-20231017151014631](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310171510678.png)

所以我们如果要知道Broker注册请求是如何处理的，直接就是看DefaultRequestProcessor中的代码就可以了，下面给大家看一下这个类的一些源码片段。

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310171510594.png)

接着我们进入这个类里的registerBroker()方法，去看看到底如何完成Broker注册的。

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310171510599.png)

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310171510741.png)

下面我们先在图里给大家体现一下RouteInfoManager这个路由数据管理组件，实际Broker注册就是通过他来做的。

![image-20231017151103291](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310171511329.png)

至于RouteInfoManager的注册Broker的方法，我们就不带着大家来看了。这里给大家留一个今天的源码分析小作业，大家可以自己到RouteInfoManager的注册Broker的方法里去看看，最终如何把一个Broker机器的数据放入RouteInfoManager中维护的路由数据表里去的。

其实我这里提示一下，核心思路非常简单，无非就是用一些Map类的数据结构，去存放你的Broker的路由数据就可以了，包括了Broker的clusterName、brokerId、brokerName这些核心数据。

而且在更新的时候，一定会基于Java并发包下的ReadWriteLock进行读写锁加锁，因为在这里更新那么多的内存Map数据结构，必须要加一个写锁，此时只能有一个线程来更新他们才行！

**End**