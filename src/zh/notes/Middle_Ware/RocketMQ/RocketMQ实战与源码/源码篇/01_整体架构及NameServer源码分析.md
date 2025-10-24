---
title: 01_整体架构及NameServer源码分析
category:
  - RocketMQ
date: 2025-10-24
---


## RocketMQ的核心三流程

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/988dca143fbf2fac.png)

**整体模块如下：**

1. **rocketmq-namesrv**：命名服务，更新和路由发现 broker服务。NameServer 要作用是为消息生产者、消息消费者提供关于主题 Topic 的路由信息，NameServer除了要存储路由的基础信息，还要能够管理 Broker节点，包括路由注册、路由删除等功能**
2. **rocketmq-broker**：mq的核心。它能接收producer和consumer的请求，并调用store层服务对消息进行处理。HA服务的基本单元，支持同步双写，异步双写等模式。
3. **rocketmq-store**：存储层实现，同时包括了索引服务，高可用HA服务实现。
4. **rocketmq-remoting**：基于netty的底层通信实现，所有服务间的交互都基于此模块。
5. **rocketmq-common**：一些模块间通用的功能类，比如一些配置文件、常量。
6. **rocketmq-client**：java版本的mq客户端实现
7. **rocketmq-filter**：消息过滤服务，相当于在broker和consumer中间加入了一个filter代理。
8. **rocketmq-srvutil**：解析命令行的工具类ServerUtil。
9. **rocketmq-tools**：mq集群管理工具，提供了消息查询等功能

RocketMQ的源码是非常的多，我们没有必要把RocketMQ所有的源码都读完，所以我们把核心、重点的源码进行解读，RocketMQ核心流程如下：

* 启动流程
  RocketMQ服务端由两部分组成NameServer和Broker，NameServer是服务的注册中心，Broker会把自己的地址注册到NameServer，生产者和消费者启动的时候会先从NameServer获取Broker的地址，再去从Broker发送和接受消息。
* 消息生产流程
  Producer将消息写入到RocketMQ集群中Broker中具体的Queue。
* 消息消费流程
  Comsumer从RocketMQ集群中拉取对应的消息并进行消费确认。

---

## NameServer源码分析

### NameServer整体流程

NameServer是整个RocketMQ的“大脑”，它是RocketMQ的服务注册中心,所以RocketMQ需要先启动NameServer再启动Rocket中的Broker。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/c6c4ce58745962ed.png)

* NameServer启动
  启动监听，等待Broker、Producer、Comsumer连接。Broker在启动时向所有NameServer注册，生产者在发送消息之前先从NameServer获取Broker服务器地址列表，然后根据负载均衡算法从列表中选择一台服务器进行消息发送。消费者在订阅某个主题的消息之前从NamerServer获取Broker服务器地址列表（有可能是集群），但是消费者选择从Broker中订阅消息，订阅规则由 Broker 配置决定。
* 路由注册
  Broker启动后向所有NameServer发送路由及心跳信息。
* 路由剔除
  移除心跳超时的Broker相关路由信息。NameServer与每台Broker服务保持长连接，并间隔10S检查Broker是否存活，如果检测到Broker宕机，则从路由注册表中将其移除。这样就可以实现RocketMQ的高可用。

### NameServer启动流程

从源码的启动可知，NameServer单独启动。

入口类：NamesrvController

核心方法：NamesrvController 类中`main()->main0-> createNamesrvController()->start() -> initialize()`

流程图如下：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/5a75e9d2e9c724a9.png)

#### 加载KV配置

核心解读NamesrvController类中`createNamesrvController()`

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/211e72f0835efac8.png)

在源码中发现还有一个p的参数，直接在启动个参数中送入 -p 就可以打印这个NameServer的所有的参数信息（不过NameServer会自动终止），说明这个-p是一个测试参数。

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/a001d0a1b27d0271.png)

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/0ef49c75f0b28f66.png)

正常启动时，也可以在启动日志中一定可以找到所有的参数：

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/d0d9940f5fc81eee.png)

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/b00f899989743e8f.png)

#### 构建NRS通讯接收路由、心跳信息

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/0773e193581c671d.png)

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/69b25b46df58528f.png)

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/3799adf66c1473d6.png)

#### 定时任务剔除超时Broker

核心控制器会启动定时任务： 每隔10s扫描一次Broker，移除不活跃的Broker。

Broker每隔30s向NameServer发送一个心跳包，心跳包包含BrokerId，Broker地址，Broker名称，Broker所属集群名称、Broker关联的FilterServer列表。但是如果Broker宕机，NameServer无法收到心跳包，此时NameServer如何来剔除这些失效的Broker呢？NameServer会每隔10s扫描brokerLiveTable状态表，如果BrokerLive的**lastUpdateTimestamp**的时间戳距当前时间超过120s，则认为Broker失效，移除该Broker，关闭与Broker连接，同时更新topicQueueTable、brokerAddrTable、brokerLiveTable、filterServerTable。

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/3e4a9bd13dfee51e.png)

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/4fc56a154eac5617.png)

路由剔除机制中，Borker每隔30S向NameServer发送一次心跳，而NameServer是每隔10S扫描确定有没有不可用的主机（120S没心跳），那么问题就来了！这种设计是存在问题的，就是NameServer中认为可用的Broker，实际上已经宕机了，那么，某一时间段，从NameServer中读到的路由中包含了不可用的主机，会导致消息的生产/消费异常，不过不用担心，在生产和消费端有故障规避策略及重试机制可以解决以上问题（原理后续源码解读）。这个设计符合RocketMQ的设计理念：整体设计追求简单与性能，同时这样设计NameServer是可以做到无状态化的，可以随意的部署多台，其代码也非常简单，非常轻量。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/6a433dfe80eebd3b.png)

**RocketMQ有两个触发点来删除路由信息：**

* NameServer定期扫描brokerLiveTable检测上次心跳包与当前系统的时间差，如果时间超过120s，则需要移除broker。
* Broker在正常关闭的情况下，会执行unregisterBroker指令这两种方式路由删除的方法都是一样的，都是从相关路由表中删除与该broker相关的信息。

  在消费者启动之后，第一步都要从NameServer中获取Topic相关信息

### NameServer设计亮点

#### 读写锁

RouteInfoManager类中有一个读写锁的设计

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/66d0bf56e7f0cadc.png)

消息发送时客户端会从NameServer获取路由信息，同时Broker会定时更新NameServer的路由信息，所以路由表会有非常频繁的以下操作：

1、 生产者发送消息时需要频繁的获取。对表进行读。

RouteInfoManager类

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/3b210fb7fb42368f.png)

2、 Broker定时(30s)会更新一个路由表。对表进行写。

RouteInfoManager类

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/61da3e2f78e78a56.png)

因为Broker每隔30s向NameServer发送一个心跳包，这个操作每次都会更新Broker的状态，但同时生产者发送消息时也需要Broker的状态，要进行频繁的读取操作。所以这个地方就有一个矛盾，Broker的状态会被经常性的更新，同时也会被更加频繁的读取。这里如何提高并发，尤其是生产者进行消息发送时的并发，所以这里使用了读写锁机制（针对读多写少的场景）。

synchronized和ReentrantLock基本都是排他锁，排他锁在同一时刻只允许一个线程进行访问，而读写锁在同一时刻可以允许多个读线程访问，但是在写线程访问时，所有的读线程和其他写线程均被阻塞。读写锁维护了一对锁，一个读锁和一个写锁，通过分离读锁和写锁，使得并发性相比一般的排他锁有了很大提升。

#### 存储基于内存

NameServer存储以下信息：

- **topicQueueTable**：Topic消息队列路由信息，消息发送时根据路由表进行负载均衡
- **brokerAddrTable**：Broker基础信息，包括brokerName、所属集群名称、主备Broker地址
- **clusterAddrTable**：Broker集群信息，存储集群中所有Broker名称
- **brokerLiveTable**：Broker状态信息，NameServer每次收到心跳包是会替换该信息
- **filterServerTable**：Broker上的FilterServer列表，用于类模式消息过滤。

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/eda0adca8828f883.png)

NameServer的实现基于内存，NameServer并不会持久化路由信息，持久化的重任是交给Broker来完成。这样设计可以提高NameServer的处理能力。

#### NameServer无状态化

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/46025f3490ce0b01.png)

* NameServer集群中它们相互之间是不通讯
* 主从架构中，Broker都会向所有NameServer注册路由、心跳信息
* 生产者/消费者同一时间，与NameServer集群中其中一台建立长连接

**项目实战部署分析：**

假设一个RocketMQ集群部署在两个机房，每个机房都有一些NameServer、Broker和客户端节点，当两个机房的链路中断时，所有的NameServer都可以提供服务，客户端只能在本机房的NameServer中找到本机房的Broker。

RocetMQ集群中，NameSever之间是不需要互相通信的，所以网络分区对NameSever本身的可用性是没有影响的，如果NameSever检测到与Broker的连接中断了，NameServer会认为这个Broker不再能提供服务，NameServer会立即把这个Broker从路由信息中移除掉，避免客户端连接到一个不可用的Broker上去。

网络分区后，NameSever 收不到对端机房那些Broker的心跳，这时候，每个Namesever上都只有本机房的Broker信息。
