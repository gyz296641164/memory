---
title: ✅100、BrokerController是如何构建出来的，以及他包含了哪些组件
category:
  - RocketMQ
date: 2025-10-24
---


**BrokerController是如何构建出来的，以及他包含了哪些组件？**

---

上回我们讲到Broker在启动的时候，他首先会执行一个关键的方法，就是createBrokerController()

在这个里面，我们之前分析了他已经初始化以及解析了一些核心配置组件，我们看看下面的图，你会发现Broker里已经有一些核心配置组件了。

![image-20231013133749569](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310131337619.png)

上述的核心配置组件，上一次我们也分析过了，其实这类配置初始化的代码就是看着麻烦，并没什么难度的，他本质上就是用默认的配置参数值以及我们配置文件里的配置参数值，包括命令行传递的配置参数值，去填充到这些配置组件中去。

然后后续你Broker运行的过程中，各种行为自然都是根据这些配置组件里的配置参数值来走的，大概就是这个意思，所以大家千万别对源码感到恐慌。

我们接着看，那么在准备好了上述核心配置组件之后，接下来下一步是干什么呢？

其实就是要创建最核心的Broker组件了，这个Broker组件是如何创建的呢？

我们看下面的源码，下面的源码就是在createBrokerController()方法中的。

```java
final BrokerController controller = new BrokerController(
  brokerConfig,
  nettyServerConfig,
  nettyClientConfig,
  messageStoreConfig); 

controller.getConfiguration().registerConfig(properties);
```

上述代码的意思已经非常明显了，他就是创建了一个核心的BrokerController组件，这个BrokerController组件，你大致可以认为就是代表了Broker他自己好了。我们可以来梳理一下BrokerStartup和BrokerController两个代码组件的关系，以及为什么要这么设计。

---

# 2、为什么要叫做“BrokerController”呢？

首先我们来思考一下，Broker启动的时候，他的main class是谁？是不是BrokerStartup这个类？

那么这个类名，顾名思义，就是用来启动Broker的一个类，他里面包含的是把Broker给进行初始化和完成全部启动工作的逻辑。

所以，大家觉得BrokerStartup自己可以代表成是一个Broker吗？明显是不对的。

所以其实最核心的组件，就是BrokerController，这个BrokerController可能有的朋友会以为跟我们平时在Java Web开发中，用Spring MVC框架开发的一系列Controller是一个意思，负责接收和处理请求。

其实这么想，也有一定道理，但是也不完全是对的。

因为毕竟中间件系统的架构设计思想和普通的Java Web业务系统还是不一样的。虽然两种Contorller的含义是相近的，但还是有区别。

BrokerController，如果一定要用中文来表达出这个组件的含义的话，你应该把他叫做是“Broker管理控制组件”

什么意思呢？他这个组件其实被创建出来以及初始化完毕之后，就是用来控制当前在运行的这个Broker的！

所以他英文叫做BrokerController，中文叫做“Broker管理控制组件”。

也正是因为如此，你大致可以理解一下他们这里的关系，我们用mqbroker脚本启动的JVM进程，实际上你可以认为就是一个Broker，这里Broker实际上应该是代表了一个JVM进程的概念，而不是任何一个代码组件！

然后BrokerStartup作为一个main class，其实是属于一个代码组件，他的作用是准备好核心配置组件，然后就是创建、初始化以及启动BrokerController这个核心组件，也就是启动一个Broker管理控制组件，让BrokerController去控制和管理Broker这个JVM进程运行过程中的一切行为，包括接收网络请求、包括管理磁盘上的消息数据，以及一大堆的后台线程的运行。

所以讲到这里，我又完善了一下下面的图，大家在里面可以清晰的看到Broker、BrokerStartup、BrokerController之间的关系。

![image-20231013180405574](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310131804639.png)

上面那个图里，其实就把这几者之间的关系，说的很清晰了，Broker这个概念本身代表的不是一个代码组件，他就是你用mqbroker脚本启动的JVM进程。然后JVM进程的main class是BrokerStartup，他是一个启动组件，负责初始化核心配置组件，然后基于核心配置组件去启动BrokerControler这个管控组件。

然后在Broker这个JVM进程运行期间，都是由BrokerController这个管控组件去管理Broker的请求处理、后台线程以及磁盘数据。

---

# 3、初步看一下BrokerController的构造函数

接着我们初步的看一下BrokerController的构造函数，如下所示，我在里面简单给大家写了一些注释。

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310131814836.png)

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310131814899.png)

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310131814840.png)

简单来说，看完了上述的源码之后，其实大家没必要立马搞定每一个代码组件的含义，以及他们是做什么的，主要知道BrokerController内部是有一系列的功能性组件的，还有一大堆的后台线程池，知道这两点就可以了，如下图。

![image-20231013181514806](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202310/202310131815845.png)

大家在上图可以看到，我又在图里进行了完善，让你能感受到，BrokerController里包含了一大堆核心功能组件和后台线程池，至于这些功能组件和后台线程池都是干什么的，不是你现在就要去探究的，后续我们要基于一个一个的场景出发，去研发他里面的各种代码组件是如何工作的。

---

# 4、今日源码分析作业

今天给大家留一个源码分析的小作业，希望每个人都可以去看一下BrokerController的构造函数里的内容，自己感受一下，这个里面包含了很多功能组件以及后台线程池，感受一下他的源码是怎么来写的，另外去感受一下Broker这个JVM进程，BrokerStartup启动组件，BrokerController管控组件之间的关系。

