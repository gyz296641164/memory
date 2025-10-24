---
title: ✅106、Broker是如何发送定时心跳的，以及如何进行故障感知
category:
  - RocketMQ
date: 2025-10-24
---


**Broker是如何发送定时心跳的，以及如何进行故障感知？**

---

昨天我们已经讲解了NameServer处理Broker注册请求的源码流程，大家已经知道了，NameServer核心其实就是基于Netty服务器来接收Broker注册请求，然后交给DefaultRequestProcessor这个请求处理组件，来处理Broker注册请求。

而真正的Broker注册的逻辑是放在RouteInfoManager这个路由数据管理组件里来进行实现的，最终Broker路由数据都会存放在RouteInfoManager内部的一些Map数据结构组成的路由数据表中。

我们看下图，就是一个示意。

![image-20231017154146872](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310171544946.png)

今天我们就来讲讲，Broker是如何定时发送心跳到NameServer，让NameServer感知到Broker一直都存活着，然后如果Broker一段时间没有发送心跳到NameServer，那么NameServer是如何感知到Broker已经挂掉了。

首先我们看一下Broker中的发送注册请求给NameServer的一个源码入口，其实就是在BrokerController.start()方法中，在BrokerController启动的时候，他其实并**不是仅仅发送一次注册请求**，而是启动了一个定时任务，会**每隔一段时间就发送一次注册请求**。

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310171544477.png)

上面这块代码，其实是启动了一个定时调度的任务，他默认是**每隔30s就会执行一次Broker注册的过程**，上面的registerNameServerPeriod是一个配置，他默认的值就是30s一次。

所以其实大家看到这里就会明白，默认情况下，第一次发送注册请求就是在进行注册，就是我们上一讲讲的内容，他会把Broker路由数据放入到NameServer的RouteInfoManager的路由数据表里去。

但是后续每隔30s他都会发送一次注册请求，这些后续定时发送的注册请求，其实本质上就是Broker发送心跳给NameServer了，我们看下图示意。

![image-20231017154310079](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310171544953.png)

那么后续每隔30s，Broker就发送一次注册请求，作为心跳来发送给NameServer的时候，NameServer对后续重复发送过来的注册请求（也就是心跳），是如何进行处理的呢？

说到这里，我今天来带大家看一下RouteInfoManager的注册方法逻辑。

上一次是给大家留了作业，想必很多人可能都已经看出一点感悟来了，今天就我们一起来分析一下，下面是RouteInfoManager的注册Broker的源码。

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310171544396.png)

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310171544804.png)

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310171544527.png)

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310171544169.png)

所以我们看下图，有一个红色圈圈示意了，每隔30s你发送注册请求作为心跳的时候，RouteInfoManager里会进行心跳时间刷新的处理。

![image-20231017154357746](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310171544446.png)

接着我们来思考最后一个问题，那么假设Broker已经挂了，或者故障了，隔了很久都没有发送那个每隔30s一次的注册请求作为心跳，那么此时NameServer是如何感知到这个Broker已经挂掉的呢？

我们重新回到NamesrvController的`initialize()`方法里去，里面有一个代码是启动了RouteInfoManager中的一个定时扫描不活跃Broker的线程。

t![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310171544924.png)

上面这段代码，就是启动一个定时调度线程，每隔10s扫描一次目前不活跃的Broker，使用的是RouteInfoManager中的scanNotActiveBroke()方法，我们去看看那个方法的逻辑，就知道他如何感知到一个Broker挂掉了。

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310171544099.png)

今天给大家留一个源码分析的小作业，就是把Broker的注册、心跳以及故障发现的相关源码都看一遍，同时结合我们画的图，深刻的理解和记忆跟BrokerNameServer的交互流程，核心组件。