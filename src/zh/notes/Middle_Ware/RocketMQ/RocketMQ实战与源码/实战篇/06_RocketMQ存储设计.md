---
title: 06_RocketMQ存储设计
category:
  - RocketMQ
date: 2025-10-24
---


## Domain Model

领域模型（Domain Model）是对领域内的概念类或现实世界中对象的可视化表示。又称概念模型、领域对象模型、分析对象模型。它专注于分析问题领域本身，发掘重要的业务领域概念，并建立业务领域概念之间的关系。

![image-20240616164245614](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/202406161642703.png)

### Message

Message是RocketMQ消息引擎中的主体。messageId是全局唯一的。MessageKey是业务系统（生产者）生成的，所以如果要结合业务，可以使用MessageKey作为业务系统的唯一索引。

![image-20240616164402933](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/202406161644019.png)

![image-20240616164427961](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/202406161644010.png)

另外Message中的equals方法和hashCode主要是为了完成消息只处理一次（Exactly-Once）。

Exactly-Once是指发送到消息系统的消息只能被消费端处理且仅处理一次，即使生产端重试消息发送导致某消息重复投递，该消息在消费端也只被消费一次。

### Topic

Tags是在同一Topic中对消息进行分类

`subTopics==Message Queue`，其实在内存逻辑中，subTopics是对Topics的一个拓展，尤其是在MQTT这种协议下，在Topic底下会有很多subTopics。

### Queue

Queue是消息物理管理单位，比如在RocketMQ的控制台中，就可以看到每一个queue中的情况（比如消息的堆积情况、消息的TPS、QPS）

### Offset

对于每一个Queue来说都有Offset,这个是消费位点。

### Group

业务场景中，如果有一堆发送者，一堆消费者，所以这里使用Group的概念进行管理。

### 对应关系

- Message与 Topic是多对一的关系，一个Topic可以有多个Message.
- Topic到Queue是一对多的关系，这个也是方便横向拓展，也就是消费的时候，这里可以有很多很多的Queue.
- 一个Queue只有一个消费位点(Offset)，所以Topic和Offset也是一对多的关系
- Topic和Group也是多对多的关系。

### 消费并发度

从上面模型可以看出，要解决消费并发，就是要利用Queue，一个Topic可以分出更多的queue，每一个queue可以存放在不同的硬件上来提高并发。

### 热点问题(顺序、重复)

前面讲过要确保消息的顺序，生产者、队列、消费者最好都是一对一的关系。但是这样设计，并发度就会成为消息系统的瓶颈（并发度不够）

RocketMQ不解决这个矛盾的问题。理由如下：

1. 乱序的应用实际大量存在
2. 队列无序并不意味着消息无序

另外还有消息重复，造成消息重复的根本原因是：网络不可达（网络波动）。所以如果消费者收到两条一样的消息，应该是怎么处理？

RocketMQ不保证消息不重复，如果你的业务要严格确保消息不重复，需要在自己的业务端进行去重。

1. 消费端处理消息的业务逻辑保持幂等性
2. 确保每一条消息都有唯一的编号且保证消息处理成功与去重表的日志同时出现

---

## 消息存储结构

RocketMQ因为有高可靠性的要求(宕机不丢失数据)，所以数据要进行持久化存储。所以RocketMQ 采用文件进行存储。

### 存储文件

![image-20240616170910888](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/202406161709945.png)

- **commitLog**：消息存储目录
- **config**：运行期间一些配置信息
- **consumerqueue**：消息消费队列存储目录
- **index**：消息索引文件存储目录
- **abort**：如果存在改文件则Broker非正常关闭
- **checkpoint**：文件检查点，存储CommitLog文件最后一次刷盘时间戳、consumerqueue最后一次刷盘时间，index索引文件最后一次刷盘时间戳。

### 消息存储结构

![image-20240616171524887](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/202406161715976.png)

RocketMQ消息的存储是由ConsumeQueue和CommitLog配合完成 的，消息真正的物理存储文件是CommitLog，ConsumeQueue是消息的逻辑队列，类似数据库的索引文件，存储的是指向物理存储的地址。每 个Topic下的每个Message Queue都有一个对应ConsumeQueue文件。

- **CommitLog**：存储消息的元数据
- **ConsumerQueue**：存储消息在CommitLog的索引
- **IndexFile**：为了消息查询提供了一种通过key或时间区间来查询消息的方法，这种通过IndexFile来查找消息的方法不影响发送与消费消息的主流程

![image-20240616171612845](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/202406161716904.png)

#### CommitLog

CommitLog 以物理文件的方式存放，每台 Broker 上的 CommitLog 被本机器所有 ConsumeQueue 共享，文件地址(默认)：`$ {user.home} \store\$ { commitlog} \ $ { fileName}`。在CommitLog 中，一个消息的存储长度是不固定的， RocketMQ采取一些机制，尽量向CommitLog 中顺序写 ，但是随机读。commitlog 文件默认大小为lG ，可通过在 broker 置文件中设置 `mappedFileSizeCommitLog`属性来改变默认大小。

![image-20240616172427199](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/202406161724700.png)

Commitlog文件存储的逻辑视图如下，每条消息的前面4个字节存储该条消息的总长度。但是一个消息的存储长度是不固定的。

![image-20240616172526729](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/202406161725852.png)

每个 CommitLog 文件的大小为 1G，一般情况下第一个 CommitLog 的起始偏移量为 0，第二个 CommitLog 的起始偏移量为 1073741824 （1G = 1073741824byte）。

![image-20240616172543257](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/202406161725415.png)

每台Rocket只会往一个commitlog文件中写，写完一个接着写下一个。

indexFile 和 ComsumerQueue 中都有消息对应的物理偏移量，通过物理偏移量就可以计算出该消息位于哪个 CommitLog 文件上。

#### ConsumeQueue

ConsumeQueue 是消息的逻辑队列，类似数据库的索引文件，存储的是指向物理存储的地址。每个Topic下的每个 Message Queue 都有一个对应的 ConsumeQueue 文件， 文件地址(默认)在`$ {$storeRoot} \consumequeue\$ {topicName} \$ { queueld} \$ {fileName}`。

![image-20240616172722042](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/202406161727160.png)

![image-20240616172736335](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/202406161727467.png)

ConsumeQueue中存储的是消息条目，为了加速 ConsumeQueue 消息条目的检索速度与节省磁盘空间，每一个 Consumequeue条目不会存储消息的全量信息，消息条目如下：

![image-20240616172755287](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/202406161727378.png)

ConsumeQueue 即为Commitlog 文件的索引文件， 其构建机制是 当消息到达 Commitlog 文件后 由专门的线程产生消息转发任务，从而构建消息消费队列文件（ConsumeQueue ）与下文提到的索引文件。

存储机制这样设计有以下几个好处：

1. CommitLog 顺序写 ，可以大大提高写入效率。

   （实际上，磁盘有时候会比你想象的快很多，有时候也比你想象的慢很多，关键在如何使用，使用得当，磁盘的速度完全可以匹配上网络的数据传输速度。目前的高性能磁盘，顺序写速度可以达到600MB/s ，超过了一般网卡的传输速度，这是磁盘比想象的快的地方 但是磁盘随机写的速度只有大概lOOKB/s,和顺序写的性能相差 6000 倍！）

2. 虽然是随机读，但是利用操作系统的 pagecache 机制，可以批量地从磁盘读取，作为 cache 存到内存中，加速后续的读取速度。

3. 为了保证完全的顺序写，需要 ConsumeQueue 这个中间结构 ，因为ConsumeQueue 里只存偏移量信息，所以尺寸是有限的，在实际情况中，大部分的 ConsumeQueue 能够被全部读入内存，所以这个中间结构的操作速度很快，可以认为是内存读取的速度。此外**为了保证 CommitLog和ConsumeQueue 的一致性， CommitLog 里存储了 Consume Queues 、Message Key、 Tag 等所有信息**，即使 ConsumeQueue 丢失，也可以通过 commitLog 完全恢复出来。

#### IndexFile

RocketMQ还支持通过MessageID或者MessageKey来查询消息；使用ID查询时，因为ID就是用broker+offset生成的（这里msgId指的是服务端的），所以很容易就找到对应的commitLog文件来读取消息。但是对于用MessageKey来查询消息，RocketMQ则通过构建一个index来提高读取速度。

index 存的是索引文件，这个文件用来加快消息查询的速度。消息消费队列 RocketMQ 专门为消息订阅构建的索引文件 ，提高根据主题与消息检索消息的速度 ，使用Hash索引机制，具体是Hash槽与Hash冲突的链表结构。（这里不做过多解释）

![image-20240616173307066](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/202406161733201.png)

#### Config

config 文件夹中 存储着Topic和Consumer等相关信息。主题和消费者群组相关的信息就存在在此。

- **topics.json**：topic 配置属性
- **subscriptionGroup.json**：消息消费组配置信息。
- **delayOffset.json**：延时消息队列拉取进度。
- **consumerOffset.json**：集群消费模式消息消进度。
- **consumerFilter.json**：主题消息过滤信息。

![image-20240616173415215](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/202406161734318.png)

#### 其他

**abort** ：如果存在 abort 文件说明 Broker 非正常闭，该文件默认启动时创建，正常退出之前删除

**checkpoint** ：文件检测点，存储 commitlog 文件最后一次刷盘时间戳、 consumequeue最后一次刷盘时间、 index 索引文件最后一次刷盘时间戳。

---

## 过期文件删除

### 概述

由于 RocketMQ 操作 CommitLog，ConsumeQueue文件是基于内存映射机制并在启动的时候会加载 commitlog，ConsumeQueue 目录下的所有文件，为了避免内存与磁盘的浪费，不可能将消息永久存储在消息服务器上，所以需要引入一种机制来删除己过期的文件。

删除过程分别执行清理消息存储文件（ Commitlog ）与消息消费 队列文件（ ConsumeQueue 文件）， 消息消费队列文件与消息存储文件（ Commitlog ）共用一套过期文件机制。

RocketMQ 清除过期文件的方法是 ：如果非当前写文件在一定时间间隔内没有再次被更新，则认为是过期文件，可以被删除， RocketMQ 不会关注这个文件上的消息是否全部被消费。默认每个文件的过期时间为 42小时（不同版本的默认值不同，这里以4.4.0为例） ，通过在 Broker 配置文件中设置 **fileReservedTime** 来改变过期时间，单位为**小时**。

触发文件清除操作的是一个定时任务，而且只有定时任务，文件过期删除定时任务的周期由该删除决定，默认每10s执行一次。

### 过期判断

文件删除主要是由这个配置属性：

- **fileReservedTime**：文件保留时间。也就是从最后一次更新时间到现在，如果超过了该时间，则认为是过期文件， 可以删除。

另外还有其他两个配置参数：

- **deletePhysicFilesInterval**

  删除物理文件的时间间隔（默认是100MS），在一次定时任务触发时，可能会有多个物理文件超过过期时间可被删除，因此删除一个文件后需要间隔deletePhysicFilesInterval这个时间再删除另外一个文件，由于删除文件是一个非常耗费IO的操作，会引起消息插入消费的延迟（相比于正常情况下），**所以不建议直接删除所有过期文件**。

- **destroyMapedFileIntervalForcibly**

  在删除文件时，如果该文件还被线程引用，此时会阻止此次删除操作，同时将该文件标记不可用并且纪录当前时间戳`destroyMapedFileIntervalForcibly`这个表示文件在第一次删除拒绝后，文件保存的最大时间，在此时间内一直会被拒绝删除，当超过这个时间时，会将引用每次减少1000，直到引用 小于等于 0为止，即可删除该文件.

### 删除条件

（1）指定删除文件的时间点， RocketMQ 通过 deleteWhen 设置一天的固定时间执行一次。删除过期文件操作， 默认为凌晨4点。

（2）磁盘空间是否充足，如果磁盘空间不充足(DiskSpaceCleanForciblyRatio。磁盘空间强制删除文件水位。默认是85)，会触发过期文件删除操作。

另外还有RocketMQ的磁盘配置参数：

1. 物理使用率大于diskSpaceWarningLevelRatio（默认90%可通过参数设置）,则会阻止新消息的插入。
2. 物理磁盘使用率小于diskMaxUsedSpaceRatio(默认75%) 表示磁盘使用正常。

---

## 零拷贝与MMAP

### 什么是零拷贝?

零拷贝（Zero-copy）是一种在操作系统层面上优化数据传输的方法，它减少了数据在内存和存储设备之间复制的次数。在传统的数据传输过程中，数据通常需要在多个缓冲区之间进行多次复制，这包括从磁盘读取到内核缓冲区，然后从内核缓冲区复制到用户空间的应用程序缓冲区，最后可能还要从用户空间复制到网络接口卡的缓冲区。

零拷贝技术通过避免这些不必要的数据复制步骤来提高效率。以下是一些常见的零拷贝技术：

1. **直接 I/O (Direct I/O)**: 允许应用程序直接访问存储设备上的数据，而不需要将数据首先复制到内核缓冲区。
2. **内存映射文件 (Memory-mapped files)**: 通过将文件映射到内存地址空间，应用程序可以直接在内存中访问文件数据，而不需要传统的读取和写入操作。
3. **sendfile() 系统调用**: 在 Linux 系统中，`sendfile()` 系统调用允许数据直接从内核空间传送到网络接口卡，避免了数据在内核和用户空间之间的复制。
4. **splice() 系统调用**: 类似于 `sendfile()`，`splice()` 可以在不同的文件描述符之间传输数据，而不需要数据实际被复制到用户空间。
5. **mmap() 与 write() 的组合使用**: 通过将文件映射到内存，然后使用 `write()` 将数据写入到另一个文件描述符，可以实现数据的零拷贝传输。

可以看出没有说不需要拷贝，只是说减少冗余[不必要]的拷贝。

下面这些组件、框架中均使用了零拷贝技术：Kafka、Netty、Rocketmq、Nginx、Apache。

### 传统数据传送机制

比如：读取文件，再用socket发送出去，实际经过四次copy。

伪码实现如下：

```java
buffer = File.read() 
Socket.send(buffer)
```

1、第一次：将磁盘文件，读取到操作系统内核缓冲区；

2、第二次：将内核缓冲区的数据，copy到应用程序的buffer；

3、第三步：将application应用程序buffer中的数据，copy到socket网络发送缓冲区(属于操作系统内核的缓冲区)；

4、第四次：将socket buffer的数据，copy到网卡，由网卡进行网络传输。

![image-20240616182053743](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/202406161820876.png)

分析上述的过程，虽然引入DMA来接管CPU的中断请求，但四次copy是存在“不必要的拷贝”的。实际上并不需要第二个和第三个数据副本。应用程序除了缓存数据并将其传输回套接字缓冲区之外什么都不做。相反，数据可以直接从读缓冲区传输到套接字缓冲区。

显然，第二次和第三次数据copy 其实在这种场景下没有什么帮助反而带来开销(DMA拷贝速度一般比CPU拷贝速度快一个数量级)，这也正是零拷贝出现的背景和意义。

> 打个比喻：200M的数据，读取文件，再用socket发送出去，实际经过四次copy（2次cpu拷贝每次100ms ，2次DMS拷贝每次10ms）
>
> 传统网络传输的话：合计耗时将有220ms

同时，read和send都属于系统调用，每次调用都牵涉到两次上下文切换：

![image-20240616191618602](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/545689caeb381f5b.png)

总结下，传统的数据传送所消耗的成本：4次拷贝，4次上下文切换。

4次拷贝，其中两次是DMA copy，两次是CPU copy。

### mmap内存映射

硬盘上文件的位置和应用程序缓冲区(application buffers)进行映射（建立一种一一对应关系），由于mmap()将文件直接映射到用户空间，所以实际文件读取时根据这个映射关系，直接将文件从硬盘拷贝到用户空间，只进行了一次数据拷贝，不再有文件内容从硬盘拷贝到内核空间的一个缓冲区。

mmap内存映射将会经历：3次拷贝: 1次cpu copy，2次DMA copy；

> 打个比喻：200M的数据，读取文件，再用socket发送出去，如果是使用MMAP实际经过三次copy（1次cpu拷贝每次100ms ，2次DMS拷贝每次10ms）合计只需要120ms
>
> 从数据拷贝的角度上来看，就比传统的网络传输，性能提升了近一倍。

以及4次上下文切换

![image-20240616191849095](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/edeccb03252d665a.png)

mmap()是在 `<sys/mman.h>` 中定义的一个函数，此函数的作用是创建一个新的 虚拟内存 区域，并将指定的对象映射到此区域。 mmap 其实就是通过 内存映射 的机制来进行文件操作。

Windows操作系统上也有虚拟机内存，如下图：

![image-20240616191918581](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/e6b8f4f5d3f6e512.png)

### 代码

```java
/**
 * @author: gongyuzhuo
 * @since: 2024-06-17 22:54
 * @description:
 */
public class MmapCopy {

    public static void main(String[] args) throws IOException {
        String path = "F:\\RocketMQ\\mmap";
        File file = new File(path, "1");
        if (!file.exists()) {
            // 如果文件不存在，创建文件
            file.createNewFile();
        }
        try (FileChannel fileChannel = new RandomAccessFile(file, "rw").getChannel()) {
            MappedByteBuffer mmap = fileChannel.map(FileChannel.MapMode.READ_WRITE, 0, 1024);
            // 写入数据
            mmap.put("king".getBytes());
            // 刷新写入磁盘
            mmap.flip();

            // 读取数据
            byte[] bb = new byte[4];
            // 这里不需要指定位置和长度，因为我们知道写入的是4个字节
            mmap.get(bb,0,4);
            System.out.println(new String(bb));
        }
        // 无需手动解除映射，Java 7 以后的版本会自动处理
    }
}
```

![image-20240617230740054](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/9684bfcd848fa28f.png)

![image-20240617230751974](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/0ec8c8afe7d0a4d5.png)

---

## RocketMQ中MMAP运用

如果按照传统的方式进行数据传送，那肯定性能上不去，作为MQ也是这样，尤其是RocketMQ，要满足一个高并发的消息中间件，一定要进行优化。所以RocketMQ使用的是MMAP。

RocketMQ一个映射文件大概是，commitlog 文件默认大小为lG。

这里需要注意的是，采用MappedByteBuffer这种内存映射的方式有几个限制，其中之一是一次只能映射1.5~2G 的文件至用户态的虚拟内存，这也是为何RocketMQ默认设置单个CommitLog日志数据文件为1G的原因了。

### MMAP文件对应

![image-20240617232634969](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/dde8e5e3a2b6f1e4.png)

![image-20240617232736218](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/70589e653df6b6e0.png)

![image-20240617232951841](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/c0c9f7827c466078.png)

![image-20240617232856100](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/73767920c9340bbf.png)

### RocketMQ源码中的MMAP运用

RocketMQ源码中，使用MappedFile这个类类进行MMAP的映射

![image-20240617233315217](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/ae60c9ff8f7902e0.png)

![image-20240617233345821](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/2bec9483146462d9.png)

![image-20240617233432962](https://studyimages.oss-cn-beijing.aliyuncs.com/img/RocketMQ/202406/49a21f6793b22aa3.png)

---

## RocketMQ存储整体设计总结

### 消息生产与消息消费相互分离

Producer端发送消息最终写入的是CommitLog（消息存储的日志数据文件），Consumer端先从ConsumeQueue（消息逻辑队列）读取持久化消息的起始物理位置偏移量offset、大小size和消息Tag的HashCode值，随后再从CommitLog中进行读取待拉取消费消息的真正实体内容部分；

### RocketMQ的CommitLog文件采用混合型存储

所有的Topic下的[消息队列](https://cloud.tencent.com/product/cmq?from=10680)共用同一个CommitLog的日志数据文件，并通过建立类似索引文件—ConsumeQueue的方式来区分不同Topic下面的不同MessageQueue的消息，同时为消费消息起到一定的缓冲作用（异步服务线生成了ConsumeQueue队列的信息后，Consumer端才能进行消费）。这样，只要消息写入并刷盘至CommitLog文件后，消息就不会丢失，即使ConsumeQueue中的数据丢失，也可以通过CommitLog来恢复。

### RocketMQ每次读写文件的时候真的是完全顺序读写吗？

发送消息时，生产者端的消息确实是**顺序写入CommitLog**；订阅消息时，消费者端也是**顺序读取ConsumeQueue**，然而根据其中的起始物理位置偏移量offset读取消息真实内容却是**随机读取CommitLog**。 所以在RocketMQ集群整体的吞吐量、并发量非常高的情况下，随机读取文件带来的性能开销影响还是比较大的，RocketMQ怎么优化的，源码解读部分进行讲解。