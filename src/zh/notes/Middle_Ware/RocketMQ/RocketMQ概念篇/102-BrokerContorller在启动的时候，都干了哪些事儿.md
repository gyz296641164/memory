---
title: ✅102、BrokerContorller在启动的时候，都干了哪些事儿
category:
  - RocketMQ
date: 2025-10-24
---


**BrokerContorller在启动的时候，都干了哪些事儿？**

---

今天我们来给大家继续讲BrokerController的启动这块的源码。

现在BrokerController已经完成了初始化，他的用于实现各种功能的核心组件都已经初始化完毕了，然后负责接收请求的Netty服务器也初始化完毕了，同时负责处理请求的线程池以及执行定时调度任务的线程池，也都初始化完毕了，可以说是，万事俱备只欠东风了

我们看下图

![image-20231016135827528](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310161358579.png)

这个时候，就是最终要对BrokerContorller执行一下启动的逻辑，让他里面的一些功能组件完成启动时候需要执行的一些工作，同时最核心的，其实就是完成Netty服务器的启动，让他去监听一个端口号，可以接收别人的请求。

我们先回到BrokerStartup启动组件的main()方法中去，可以看看里面的内容：

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310161358221.png)

大家会发现上面的main()方法中，已经完成了BrokerContorller的初始化，接着就是执行了start()方法，于是我们进入start()方法可以去看看。

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310161358277.png)

大家自己看看上面的start()方法，其实别的业务逻辑倒没什么，最主要就是执行了BrokerContorller的start()方法，也就是去自动了他

我们继续看，下面就是BrokerContorller.start()方法的源码了，大家仔细看里面我写的注释，都解释了每一个步骤是干什么的。

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310161358492.png)

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310161358489.png)

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310161358155.png)

看完上述源码，大家其实从中只要提取一些核心的东西，知道说Netty服务器启动了，可以接收网络请求了，然后还有一个BrokerOuterAPI组件是基于Netty客户端发送请求给别人的，同时还启动一个线程去向NameServer注册，知道这几点就可以了。

在这里，我在下面的图里，就给大家展示出来了，BrokerOuterAPI和向NameServer注册这两个东西。

![image-20231016135909310](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310161359347.png)

大家其实只要看完本篇文章，能理解到上图中的架构，就足够了，因为其实阅读和理解其他人写出来的复杂的源码，是一件很困难的事情，很多时候自己写的代码过两年都看不懂了，何况是看别人写了几年的代码呢！

所以其实看源码的时候，很重要的一个技巧，就是一定要有耐心，而且要抓住这个开源系统运行的主要流程和逻辑，从源码里重点抓住主要的一些组件和主要的流程，而不是在看源码的时候陷入各种组件的细节里去。

源码又不是你写的，你说你假设这个时候去看BrokerOuterAPI、RemotingServer、FileWatchService、MessageStore这些核心组件的源码细节，你觉得你这个时候看得懂吗？

只能说在看到现在这个程度的时候，你大致脑子里有个印象，你知道Broker里有这么一些核心组件，都进行了初始化以及完成了启动，但是你应该最主要关注的事情是这么几个：

1. Broker启动了，必然要去注册自己到NameServer去，所以BrokerOuterAPI这个组件必须要画到自己的图里去，这是一个核心组件
2. Broker启动之后，必然要有一个网络服务器去接收别人的请求，此时NettyServer这个组件是必须要知道的
3. 当你的NettyServer接收到网络请求之后，需要有线程池来处理，你需要知道这里应该有一个处理各种请求的线程池
4. 你处理请求的线程池在处理每个请求的时候，是不是需要各种核心功能组件的协调？比如写入消息到commitlog，然后写入索引到indexfile和consumer queue文件里去，此时你是不是需要对应的一些MessageStore之类的组件来配合你？
5. 除此之外，你是不是需要一些后台定时调度运行的线程来工作？比如定时发送心跳到NameServer去，类似这种事情。

所以当你从一个很高的角度去思考了Broker的运行之后，再切入到他的源码里，你会发现，其实你可以很轻松的从源码运行流程里提取出来一些核心组件，画到你的图里去，然后你的脑子里会轻易记住一个图。

迄今为止，上面那幅图，就是你对Broker源码的一个了解。

接着再往后走，一定要从各种场景驱动，去理解RocketMQ的源码，包括Broker的注册和心跳，客户端Producer的启动和初始化，Producer从NameServer拉取路由信息，Producer根据负载均衡算法选择一个Broker机器，Producer跟Broker建立网络连接，Producer发送消息到Broker，Broker把消息存储到磁盘。

上面我说的那些东西，每一个都是RocketMQ这个中间件运行的时候一个场景，一定要从这些场景出发，一点点去理解在每一个场景下，RocketMQ的各个源码中的组件是如何配合运行的。

千万不要在看源码的时候，就傻乎乎的一个类一个类的看，那样绝对是会放弃阅读一个源码的！