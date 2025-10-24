---
title: ✅101、在初始化BrokerController的时候，都干了哪些事情
category:
  - RocketMQ
date: 2025-10-24
---


**在初始化BrokerController的时候，都干了哪些事情？**

---

# 1、BrokerController创建完之后是在哪里初始化的？

接着上一讲，我们继续说，现在大家已经了解到了Broker作为一个JVM进程启动之后，是BrokerStartup这个启动组件，负责初始化核心配置组件，然后启动了BrokerController这个管控组件。然后在BrokerController管控组件中，包含了一大堆的核心功能组件和后台线程池组件。

现在我们来看一下下面的图，已经表达了上面的意思。

![image-20231016112557147](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310161125201.png)

接着我们来看一下，那现在BrokerController都创建好了，里面的一大堆核心功能组件和后台线程池都创建好了，接下来他还要做一些初始化的工作，这个触发BrokerController初始化的代码在哪里呢？

其实还是在createBrokerController()方法里，在你创建完了BrokerController之后，就有一个初始化的代码，看下面的代码和注释。

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310161126092.png)

# 2、一步一步分析BrokerController初始化的过程

接着我们一步一步的分析BrokerController初始化的过程，大家看下面的源码和注释就可以了，其实很多东西你现在看一下我写的注释有个了解就行了，真的不用过于的深究，有时候刚开始你深究过多了，就会导致你发现大脑一片混乱，最后就直接放弃看源码了，所以这里大致有一个BrokerController初始化的过程就行了。

下面就是BrokerController.initialize()方法的完整的源码分析，大家重点看注释。

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310161126941.png)

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310161126162.png)

看完上面那一大坨代码，大家有什么感觉？

要我说，感觉就是没感觉，其实很多人平时自己看源码，看到这里就开始痛苦了，觉得真的看不懂，整个人陷入极大的挫败感和痛苦之中。其实完全没必要，上述代码你其实有一个印象就可以了，不用现在过于较真。

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310161126975.png)

讲到这里，我们先在下面的图里补充一下Netty服务器的概念，让大家看到，BrokerController里其实也会包含核心的Netty服务器，用来接收和处理Producer以及Consumer的请求。

![image-20231016112658194](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310161126229.png)

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310161127916.png)

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310161127010.png)

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310161127912.png)

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310161127014.png)

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310161127959.png)

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310161127054.png)

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310161127518.png)

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310161127612.png)

估计很多人看完了上面一大堆的处理请求的线程池的初始化和启动后台定时调度任务的代码，都一脸的懵逼，但是稍微找到点感觉了。

毕竟每个人都知道，后续Broker要处理一大堆的各种请求，那么不同的请求是不是要用不同的线程池里的线程来处理？

然后Broker要执行一大堆的后台定时调度执行的任务，这些后台定时任务是不是要通过线程池来调度定时任务？

所以其实你只要理解到这个程度就可以了，所以此时我们对下面的图又做了一些改动，在里面引入了两种线程池的概念，一种线程池是用来处理别人发送过来的请求的，一种线程池是执行后台定时调度任务的。

![image-20231016112829532](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310161128568.png)

我们接着往后看剩余的代码，很多代码可能大家未必立马就能理解，但是没关系，我们继续往下看。

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310161128935.png)

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310161128083.png)

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310161128393.png)

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310161128932.png)

# 3、今天的一点总结

其实如果一定要我说，今天大家看完这些源码，跟着我的注释来走，一方面是对BrokerController初始化的过程有一个大致的印象，另外一方面其实最核心的，你要知道，

- BrokerController一旦初始化完成过后，
- 他其实就准备好了Netty服务器，可以用于接收网络请求，
- 然后准备好了处理各种请求的线程池，准备好了各种执行后台定时调度任务的线程池。
- 这些都准备好之后，明天我们就要来讲解BrokerController的启动了，他的启动，必然会正式完成Netty服务器的启动，他于是可以接收请求了，
- 同时Broker必然会在完成启动的过程中去向NameServer进行注册以及保持心跳的。

只有这样，Producer才能从NameServer上找到你这个Broker，同时发送消息给你。

# 4、今日源码分析作业

今天就请大家自己去把BrokerController的`initialize()`方法看一下，把里面的源码流程和逻辑过一下，自己也去理解一下，抓住里面的重点。