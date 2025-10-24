---
title: ✅103、第三个场景驱动：Broker是如何把自己注册到NameServer去的
category:
  - RocketMQ
date: 2025-10-24
---


**第三个场景驱动：Broker是如何把自己注册到NameServer去的？**

---

# 1、Broker将自己注册到NameServer的入口

上回我们讲到了BrokerController启动的过程，其实他本质就是启动了Netty服务器去接收网络请求，然后启动了一堆核心功能组件，启动了一些处理请求的线程池，启动了一些执行定时调度任务的后台线程，如下图所示，我们回顾一下。

![image-20231016144330225](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310161443270.png)

当然，最为关键的一点，就是他执行了将自己注册到NameServer的一个过程，我们看一下这个注册自己到NameServer的源码入口，下面这行代码就是在BrokerController.start()方法中

**`BrokerController.this.registerBrokerAll(true, false, brokerConfig.isForceRegister());`**

因此如果我们要继续研究RocketMQ源码的话，当然应该场景驱动来研究，之前已经研究完了NameServer和Broker两个核心系统的启动场景，现在来研究第三个场景，就是Broker往NameServer进行注册的场景。

因为只有完成了注册，NameServer才能知道集群里有哪些Broker，然后Producer和Consumer才能找NameServer去拉取路由数据，他们才知道集群里有哪些Broker，才能去跟Broker进行通信！

---

# 2、进入registerBrokerAll()方法去初步看一看

接着我们就进入到registerBrokerAll()方法中初步的去看一看，大家看下面的源码片段，就是registerBrokerAll()方法的源码，我都写了详细的注释了，大家仔细看一下。

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310161557001.png)

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310161557009.png)

---

# 3、继续探索真正的进行Broker注册的方法

接着我们继续探索真正进行Broker注册的方法，也就是下面的doRegisterBrokerAll()方法，我们进去可以先初步看一下方法的整体情况，我都写了详细的注释，大家也仔细看一看就行。

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310161557381.png)

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310161557316.png)

其实大家看完上面的代码，再看一下下面的图中，我用红圈圈出来的部分，你就会发现，在这里实际上就是通过BrokerOuterAPI去发送网络请求给所有的NameServer，把这个Broker注册了上去。

![image-20231016155814574](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310161558607.png)

---

# 4、深入到网络请求级别的Broker注册逻辑

接着我们继续去看BrokerOuterAPI中的registerBrokerAll()方法，就是深入到了网络请求级别的Broker注册了，我给代码写了详细的注释，大家也是仔细看一看。

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310161610394.png)

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310161610487.png)

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310161610591.png)

上面这段代码里，大家最主要的，是要提取出来RequestHeader和RequestBody两个概念，就是通过请求头和请求体构成了一个请求，然后会通过底层的NettyClient把这个请求发送到NameServer去进行注册

我们看下图，我加入了这个概念。

![image-20231016161042171](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310161610205.png)

---

# 5、今日源码作业

今天给大家布置一个源码小作业，就是希望大家能够自己在Intellij IDEA里，把今天给大家分析的Broker注册的初步的一些流程都自己看一下，尝试跟我一样，去从乱七八糟的源码里提取出来最重要和关键的一些概念。

比如你应该注意到的是Broker注册的时候，最为关键的BrokerOuterAPI这个组件，然后注意到他里面是对每个NameServer都执行了注册，包括他还构造了RequestHeader和RequestBody组成的请求去进行注册。