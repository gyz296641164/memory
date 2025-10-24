---
title: ✅98、NameServer最终是如何启动Netty网络通信服务器的
category:
  - RocketMQ
date: 2025-10-24
---


**NameServer最终是如何启动Netty网络通信服务器的？**

---

# 1、NamesrvController初始化过程的一些遗留代码

上次我们其实整体源码是分析到NamesrvController的initialize()方法，他在进行初始化，然后讲到他初始化了NettyRemotingServer，其中包含了一个Netty API开发的ServerBootstrap，说白了，就是一个网络服务器

我们看下下面的图，已经讲解的很明白了。

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310121406480.jpeg)

接着我们简单看下NamesrvController.initialize()方法遗留下来的还没讲的一些源码，那些源码暂时其实对我们来说都不是太重要，我稍微给大家讲一下就行了。

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310121406283.png)

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310121406392.png)

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310121406190.png)

通过上面的源码分析，你会发现NamesrvController.initialize()方法，最核心的还是初始化Netty网络服务器，其他的就是启动了后台线程执行定时任务还重要一些，但是暂时我们还不用关注他，其他的代码你给忽略了也是可以的。

希望大家在跟着我逐步的分析RocketMQ核心源码的时候，也能够慢慢的掌握我分析源码的思路，你要明白，哪些是需要你重点关注的，哪些你可以暂时放着后续再来看，哪些是你可以干脆给忽略掉了。

---

# 2、回到start(controller)方法里看看

接着我们回到start(controller)方法里看看，大家看一下。

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310121453092.png)

上面的controller.initialize()初始化这块代码我们实际上已经看完了，知道他已经初始化了Netty服务器出来，然后接着我们往下看他通过Runtime类注册了一个JVM关闭时候的shutdown钩子，就是JVM关闭的时候会执行上述注册的回调函数。

那个回调函数里执行了NamesrvController.shutdown()方法，其实我们都不用看里面的代码，都会知道，这里无非都是一些关闭Netty服务器的释放网络资源和线程资源的一些代码，如果大家一定要看，那我们看一下下面的代码。

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310121453285.png)

感觉如何？是不是发现他就是在关闭NettyRemotingServer释放网络资源，然后关闭RemotingExecutor就是释放Netty服务器的工作线程池的资源，还有关闭ScheduledExecutorService就是释放执行定时任务的后台线程资源。

其实这里最关键的一行代码是：controller.start()。说白了，他已经初始化了Netty服务器了，但是现在还没启动，没启动的话，Netty服务器就不会监听9876这个默认的端口号，那么NameServer就什么也干不了。

所以此时，他必须要对NamesrvController组件做一个启动操作，这样的话，就可以把他内部的Netty服务器给启动了。

---

# 3、Netty服务器是如何启动的？

接着我们进入controller.start()方法内部看看，如下。

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310121453078.png)

其实这里就很清晰了，这个NamesrvContorller启动，核心就是在启动NettyRemotingServer，也就是Netty服务器。在remotingServer.start()方法里，有很多的代码，我给大家逐步的分析各个片段。

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310121453291.png)

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310121453590.png)

接着回看上面的一行代码：.localAddress(new InetSocketAddress(this.nettyServerConfig.getListenPort()))。这行代码，其实就是设置了Netty服务器要监听的端口号，默认就是9876

因此到此为止，你可以理解为Netty服务器启动了，开始监听端口号9876了，此时我们看下面的图，图里就展示出了Netty服务器监听端口号的这个示意。

​      ![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310121453261.jpeg)       

---

# 4、总结

到此为止，我们已经初步了解了NameServer是如何启动的了，了解到他最核心的就是基于Netty实现了一个网络服务器，然后监听默认的9876端口号，可以接收Broker和客户端的网络请求。

接着明天开始我们就要研究一下NameServer启动好之后，Broker是如何启动的，如何向NameServer进行注册，如何进行心跳，NameServer是如何管理Broker的。

---

# 5、今天作业

今天给大家留的小作业，就是仔细看看NettyRemotingServer的start()方法，仔细看一下里面是如何基于Netty API实现一个网络服务器的配置和启动的。请大家认真完成作业，有什么问题或者心得，欢迎在评论区留言