---
title: Redis持久化
category:
  - Redis
date: 2023-02-28
---

<!-- more -->

## 开篇

[脑图](https://www.cnblogs.com/zjfjava/p/14255009.html)

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084528.png)

## 1、RDB

### 1.1 背景

因为Redis是内存数据库，它将自己的数据库状态储存在内存里面，所以如果不想办法将储存在内存中的数据库状态保存到磁盘里面，那么一旦服务器进程退出，服务器中的数据库状态也会消失不见。为了解决这个问题，Redis提供了RDB持久化功能，这个功能可以将Redis在内存中的数据库状态保存到磁盘里面，避免数据意外丢失。

***

### 1.2 RDB概念

RDB持久化是把当前线程数据生成快照保存到硬盘的过程，触发RDB持久化过程分为手动触发和自动触发。

#### 1.2.1 RDB（快照）原理

​	在服务线上请求的同时，Redis还需要进行内存快照，内存快照要求Redis必须进行文件IO操作，可文件IO操作是不能多路复用API。

​	这意味着单线程同时在服务线上的请求还要进行IO操作，文件IO操作会严重拖垮服务器请求的性能。还有个重要的问题是为了不阻塞线上的业务，就需要边持久化边响应客户端请求。**持久化的同时，内存数据结构还在改变，比如一个大型的 hash 字典正在持久化，结果一个请求过来把它给删掉了**，还没持久化完呢，这该怎么办？  

**Redis 使用操作系统的多进程 COW(Copy On Write) 机制来实现快照持久化** 

**COW(Copy On Write) 机制**

- 首先要知道两个函数：`fork()`和`exec()`。需要注意的是`exec()`并不是一个特定的函数, 它是**一组函数的统称**, 它包括了`execl()`、`execlp()`、`execv()`、`execle()`、`execve()`、`execvp()`。

- exec函数的作用就是：**装载一个新的程序**（可执行映像）覆盖**当前进程**内存空间中的映像，**从而执行不同的任务**。

  - exec系列函数在执行时会**直接替换掉当前进程的地址空间**

    <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084529.png" alt="image-20210721115534618" />

- `COW(Copy On Write) `机制属于操作系统处理多进程下的一种机制，Redis在持久化的时候会调用**glibc函数**fork一个子进程。**父子进程会共享内存里面的代码段和数据段**。

- 所以持久化的时候是完全交给子进程，而父进程继续处理客户端请求，所以在持久化的时候操作系统采用COW机制进程数据段页面的分离。`数据段`是由很多操作系统的页面组合而成，当父进程对其中一个页面进行数据修改的时候，先将被父子线程共享的这一个页面复制并分离出来，然后直接对复制的页面进程修改，而此时子进程对应的页面是没有修改的。

> Redis采用该机制的简单流程如下。Lunix在fork之后，操作系统会将 *父进程的所有内存权限设置为read-only*，然后子进程的地址空间指向父进程。当父进程只读时没有问题，当有写内存时，*CPU硬件检测到内存也是read-only，于是会触发页异常中断（page-fault）*，陷入到操作系统的一个中断例程。中断例程中，操作系统采用cow机制会触发异常的也复制一份，于是*父子进程各自持有独立的一份*，如果这个时候又大量写入操作，会产生大量的分页错误（页异常中断page-fault），从而触发cow机制。

之所以称之为快照也就是说在子进程创建的那一时刻开始。内存的数据就固定下来了，不会发生变化。

**Copy On Write技术好处**

- COW技术可**减少**分配和复制大量资源时带来的**瞬间延时**。
- COW技术可减少**不必要的资源分配**。比如fork进程时，并不是所有的页面都需要复制，父进程的**代码段和只读数据段都不被允许修改，所以无需复制**。

**Copy On Write技术缺点**

- 如果在fork()之后，父子进程都还需要继续进行写操作，**那么会产生大量的分页错误(页异常中断page-fault)**，这样就得不偿失。



***

### 1.3  RDB文件的创建与载入

有两个Redis命令可以用于生成RDB文件，一个是`SAVE`，另一个是`BGSAVE`。

- SAVE命令会阻塞Redis服务器进程，直到RDB文件创建完毕为止，在服务器进程阻塞期间，服务器不能处理任何命令请求：

  

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084530.png" alt="image-20210517001413526" />

  

- BGSAVE命令会派生出一个子进程，然后子进程负责创建RDB文件，服务器进程（父进程）继续处理命令请求：

  

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084531.png" alt="image-20210517001703923" />

- 创建RDB文件的实际工作由rdb.c/rdbSave函数完成，SAVE命令和BGSAVE命令会以不同的方式调用这个函数，通过以下伪代码可以明显地看出这两个命令之间的区别：

  

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084532.png" alt="image-20210517001747919" />

RDB文件的载入工作是在服务器启动时自动执行的，所以Redis并没有专门用于载入RDB文件的命令，只要Redis服务器在启动检测到RDB文件存在，他就会自动加载RDB文件。

- 以下是Redis服务器启动时打印的日志记录，其中第二条日志DB loaded fromdisk:...就是服务器在成功载入RDB文件之后打印的：

  

  ![image-20210517002315405](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084533.png)

- **注意**

  因为AOF文件的更新频率通常比RDB文件的更新频率高，所以：

  1. 如果服务器开启了AOF持久化功能，那么服务器会优先使用AOF文件来还原数据库状态！
  2. 只有在AOF持久化功能关闭的情况下，才会采用RDB文件来还原数据库状态

- **服务器判断该用哪个文件来还原数据库状态的流程图**

  

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084534.png" alt="image-20210517003007667" />

- 载入RDB文件的实际工作由`rdb.c/rdbLoad`函数完成，这个函数和rdbSave函数之间的关系如图所示：

  

  ![image-20210517003121935](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084535.png)



#### 1.3.1 SAVE命令执行时的服务器状态

当SAVE命令执行时，Redis服务器会被阻塞，所以当SAVE命令正在执行时，客户端发送的所有命令请求都会被拒绝。只有在服务器执行完SAVE命令、重新开始接受命令请求之后，客户端发送的命令才会被处理。

#### 1.3.2 BGSAVE命令执行时的服务器状态

Redis进程执行fork操作创建子进程， RDB持久化过程由子进程负责， 完成后自动结束。 `阻塞只发生在fork阶段`， 一般时间很短。 

#### 1.3.3 RDB文件载入时的服务器状态

服务器在载入RDB文件期间，会一直处于阻塞状态，直到载入工作完成为止!

***

### 1.4 自动触发RDB的持久化机制  

- Redis允许用户通过设置服务器配置的save选项，让服务器每隔一段时间自动执行一次BGSAVE命令。

- 用户可以通过save选项设置多个保存条件，但只要其中任意一个条件被满足，服务器就会执行BGSAVE命令。

  举个例子，如果我们向服务器提供以下配置:

  

  ![image-20210517004307602](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084536.png)

  

  那么只要满足以下三个条件中的任意一个，BGSAVE命令就会被执行：

  1. 服务器在900秒之内，对数据库进行了至少1次修改。

  2. 服务器在300秒之内，对数据库进行了至少10次修改。

  3. 服务器在60秒之内，对数据库进行了至少10000次修改。

     

  举个例子，以下是Redis服务器在60秒之内，对数据库进行了至少10000次修改之后，服务器自动执行BGSAVE命令时打印出来的日志：

  

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084537.png" alt="image-20210517004540138" />

***

###  1.5 RDB文件结构

一个完整RDB文件所包含的各个部分:

![image-20210517005017766](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084538.png)

**`注意`：为了方便区分变量、数据、常量，全大写单词标示常量，全小写单词标示变量和数据。**

- RDB文件的最开头是REDIS部分，这个部分的长度为5字节，保存着“REDIS”五个字符。通过这五个字符，程序可以在载入文件时，快速检查所载入的文件是否RDB文件。

  `注意`：因为RDB文件保存的是二进制数据，而不是C字符串，为了简便起见，我们用"REDIS"符号代表'R'、'E'、'D'、'I'、'S'五个字符，而不是带'\0'结尾符号的C字符串'R'、'E'、'D'、'I'、'S'、'\0'。本章介绍的所有内容，以及展示的所有RDB文件结构图都遵循这一规则。

- db_version长度为4字节，它的值是一个字符串表示的整数，这个整数记录了RDB文件的版本号，比如"0006"就代表RDB文件的版本为第六版。
- databases部分包含着零个或任意多个数据库，以及各个数据库中的键值对数据：
  - 如果服务器的数据库状态为空（所有数据库都是空的），那么这个部分也为空，长度为0字节。
  - 如果服务器的数据库状态为非空（有至少一个数据库非空），那么这个部分也为非空，根据数据库所保存键值对的数量、类型和内容不同，这个部分的长度也会有所不同。

- EOF常量的长度为1字节，这个常量标志着RDB文件正文内容的结束，当读入程序遇到这个值的时候，它知道所有数据库的所有键值对都已经载入完毕了。
- check_sum是一个8字节长的无符号整数，保存着一个校验和，这个校验和是程序通过对REDIS、db_version、databases、EOF四个部分的内容进行计算得出的。服务器在载入RDB文件时，会将载入数据所计算出的校验和与check_sum所记录的校验和进行对比，以此来检查RDB文件是否有出错或者损坏的情况出现。

**举例一个databases部分为空的RDB文件：**

文件开头的"REDIS"表示这是一个RDB文件，之后的"0006"表示这是第六版的RDB文件，因为databases为空，所以版本号之后直接跟着EOF常量，最后的6265312314761917404是文件的校验和。

![image-20210517222800041](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084539.png)

***

### 1.6 分析RDB文件

可以使用od命令来分析Redis服务器产生的RDB文件，该命令可以用给定的格式转存（dump）并打印输入文件。比如说，给定-c参数可以以ASCII编码的方式打印输入文件，给定-x参数可以以十六进制的方式打印输入文件，诸如此类，具体的信息可以参考od命令的文档。

#### 1.6.1 不包含任何键值对的RDB文件

执行以下命令，创建一个数据库状态为空的RDB文件：

![image-20210517224200886](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084540.png)

然后调用od命令，打印RDB文件：

![image-20210517224220197](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084541.png)

当一个RDB文件没有包含任何数据库数据时，这个RDB文件将由以下四个部分组成：

- 五个字节的"REDIS"字符串
- 四个字节的版本号"0006"
- 一个字节的EOF常量
- 八个字节的校验和（check_num）

从od命令可以看出，最开头的是"REDIS"字符串，接着的是版本号"0006"，EOF常量"377"，最后是263 C  360 Z 334 362 V 这八个字节代表RDB文件的校验和。

#### 1.6.2 包含字符串键的RDB文件

分析一个带有单个字符串键的数据库：

![image-20210517233327418](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084542.png)

再次执行od命令：

![image-20210517233345770](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084543.png)

当一个数据库被保存到RDB文件时，这个数据库将由以下三部分组成：

- 一个一字节长的特殊值SELECTDB
- 一个长度可能为一字节、两字节或五字节的数据库号码
- 一个或以上数量的键值对（key_value_pairs）

观察od命令打印的输出，RDB文件的最开始仍然是REDIS和版本号0006，之后出现的376代表SELECTDB常量，再之后的\0代表整数0，表示被保存的数据库为0号数据库。

在数据库号码之后，直到代表EOF常量的377为止，RDB文件包含有以下内容：

![image-20210517233909393](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084544.png)

在RDB文件中，没有过期时间的键值对由类型（TYPE）、键（key）、值（value）三部分组成：其中类型的长度为一字节，键和值都是字符串对象，并且字符串在未被压缩前，都是以字符串长度为前缀，后跟字符串内容本身的方式来储存的。根据这些特征，我们可以确定\0就是字符串类型的TYPE值REDIS_RDB_TYPE_STRING（这个常量的实际值为整数0），之后的003是键MSG的长度值，再之后的005则是值HELLO的长度。

####  1.6.3 包含带有过期时间的字符串键的RDB文件

创建一个带有过期时间的字符串键：

![image-20210517234057375](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084545.png)

打印RDB文件：

![image-20210517234112734](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084546.png)

一个带有过期时间的键值对将由以下部分组成：

- 一个一字节长的EXPIRETIME_MS特殊值

- 一个八字节长的过期时间（ms）

- 一个一字节长的类型（TYPE）

- 一个键（key）和一个值（value）

根据这些特征，可以得出RDB文件各个部分的意义：

- REDIS0006：RDB文件标志和版本号。

- 376\0：切换到0号数据库。

- 374：代表特殊值EXPIRETIME_MS。

- \2 365 336@001\0\0：代表八字节长的过期时间。

- \0 003 M S G：\0表示这是一个字符串键，003是键的长度，MSG是键。

- 005 H E L L O：005是值的长度，HELLO是值。

- 377：代表EOF常量。

- 212 231 x 247 252 } 021 306：代表八字节长的校验和。

#### 1.6.4 包含一个集合键的RDB文件

在RDB文件中包含集合键：

![image-20210517234418594](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084547.png)

打印输出如下：

![image-20210517234440216](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084548.png)

以下是RDB文件各个部分的意义：

- REDIS0006：RDB文件标志和版本号。

- 376\0：切换到0号数据库。

- 002 004 L A N G：002是常量REDIS_RDB_TYPE_SET（这个常量的实际值为整数2），表示这是一个哈希表编码的集合键，004表示键的长度，LANG是键的名字。

- 003：集合的大小，说明这个集合包含三个元素。

- 004 R U B Y：集合的第一个元素。

- 004 J A V A：集合的第二个元素。

- 001 C：集合的第三个元素。

- 377：代表常量EOF。

- 202 312 r 352 346 305*023：代表校验和。

#### 1.6.5 关于分析RDB文件的说明

Redis本身带有RDB文件检查工具redis-check-dump，网上也能找到很多处理RDB文件的工具，所以人工分析RDB文件的内容并不是学习Redis所必须掌握的技能。

最后要提醒的是，前面我们一直用od命令配合-c参数来打印RDB文件，因为使用ASCII编码打印RDB文件可以很容易地发现文件中的字符串内容。但是，对于RDB文件中的数字值，比如校验和来说，通过ASCII编码来打印它并不容易看出它的真实值，更好的办法是使用-cx参数调用od命令，同时以ASCII编码和十六进制格式打印RDB文件：

但是，对于RDB文件中的数字值，比如校验和来说，通过ASCII编码来打印它并不容易看出它的真实值，更好的办法是使用-cx参数调用od命令，同时以ASCII编码和十六进制格式打印RDB文件：

![image-20210517234729052](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084549.png)

现在可以从输出中看出，RDB文件的校验和为0x 56f2 dc5a f043 b3dc（校验和以小端方式保存），这比用ASCII编码打印出来的334 263 C360 Z 334 362 V要清晰得多，后者看起来就像乱码一样。

***

### 1.7 RDB的优缺点 

**优点**

- RDB是一个紧凑压缩的二进制文件，代表Redis在某个时间点上的数据快照。非常适用于备份，全量复制等场景。比如每6小时执行bgsave备份，并把RDB文件拷贝到远程机器或者文件系统中（如hdfs），用于灾难恢复。
- Redis加载RDB恢复数据远远快于AOF的方式。

**缺点**

- RDB方式数据没办法做到实时持久化、秒级持久化。因为bgsave每次运行都要执行fork操作创建子进程，属于重量级操作，频繁执行成本过高。
- RDB不适合实时持久化问题，Redis提供了AOF持久化方式来解决。
- RDB文件使用特定二进制格式保存，Redis版本演进过程中有多个格式的RDB版本，存在老版本Redis服务无法兼容新版RDB格式的问题。

***

### 1.8 重点回顾

- RDB文件用于保存和还原Redis服务器所有数据库中的所有键值对数据。

- SAVE命令由服务器进程直接执行保存操作，所以该命令会阻塞服务器。

- BGSAVE命令由子进程执行保存操作，所以该命令不会阻塞服务器。

- 服务器状态中会保存所有用save选项设置的保存条件，当任意一个保存条件被满足时，服务器会自动执行BGSAVE命令。

- RDB文件是一个经过压缩的二进制文件，由多个部分组成。

- 对于不同类型的键值对，RDB文件会使用不同的方式来保存它们。

***

## 2、AOF

### 2.1 AOF持久化

AOF（ append only file） 持久化： 以独立日志的方式记录每次写命令，重启时再重新执行AOF文件中的命令达到恢复数据的目的。 AOF的主要作用是解决了数据持久化的实时性。简单来说，AOF持久化会将被执行的写命令写到AOF文件的末尾，以此来记录数据发生的变化。因此，Redis只要从头到尾重新执行一次AOF文件的所有命令，就可以恢复AOF文件所记录的数据集。

***

### 2.2 使用AOF  

开启AOF功能需要设置配置： appendonly yes， 默认不开启。 AOF文件名通过appendfilename配置设置， 默认文件名appendonly.aof。   

AOF的工作流程： 

1. 命令写入（append）： 所有的写入命令会追加到aof_buf（ 缓冲区） 中。
2. 文件同步（sync）     ：AOF缓冲区根据对应的策略向硬盘做同步操作。
3. 文件重写（rewrite）  ：随着AOF文件越来越大， 需要定期对AOF文件进行重写， 达到压缩的目的。
4. 重启加载（load）      ：当Redis服务器重启时， 可以加载AOF文件进行数据恢复。  

如图2-1所示：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084550.png" alt="image-20210518002532684" />  



***

### 2.3 AOF工作流程详解

#### 2.3.1 命令写入  

AOF命令写入的内容直接是文本协议格式。 例如SET KEY VALUE这条命令， 在AOF缓冲区会追加如下文本：  

![image-20210518003406781](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084551.png)

**关于AOF的两个疑惑：**  

1. AOF为什么采用文本协议格式？可能的理由如下：

- 文本协议具有很好的兼容性
- 开启AOF后，所有写入命令都包含追加操作，直接指定协议避免二次处理开销
- 文本协议具有可读性，方便修改和处理

2. AOF为什么把命令追加到aof_buf中？  

- Redis使用单线程响应命令， 如果每次写AOF文件命令都直接追加到硬盘， 那么性能完全取决于当前硬盘负载。   
- 先写入缓冲区aof_buf中， 还有另一个好处， Redis可以提供多种缓冲区同步硬盘的策略， 在性能和安全性方面做出平衡。  

#### 2.3.2 文件同步

Redis提供了多种AOF缓冲区同步文件策略， 由参数**appendfsync**控制，在配置文件中可配制为：**appendfsync everysec**，不同值的含义如表2-2所示。  

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084552.png" alt="image-20210518004156756" />

系统调用write（根据条件，将缓冲区内容写入到 AOF 文件）和fsync说明：  

- write操作会触发延迟写（delayed write） 机制。 Linux在内核提供页缓冲区用来提高硬盘IO性能。 write操作在写入系统缓冲区后直接返回。 同步硬盘操作依赖于系统调度机制， 例如： 缓冲区页空间写满或达到特定时间周期。 同步文件之前， 如果此时系统故障宕机， 缓冲区内数据将丢失。  
- fsync针对单个文件操作（比如AOF文件） ， 做强制硬盘同步， fsync将阻塞直到写入硬盘完成后返回， 保证了数据持久化。  

- 配置为always时， 每次写入都要同步AOF文件， 在一般的SATA硬盘上， Redis只能支持大约几百TPS写入， 显然跟Redis高性能特性背道而驰，不建议配置。  
- 配置为no， 由于操作系统每次同步AOF文件的周期不可控， 而且会加大每次同步硬盘的数据量， 虽然提升了性能， 但数据安全性无法保证。  
- 配置为everysec，SAVE 原则上每隔一秒钟就会执行一次。 是建议的同步策略， 也是默认配置， 做到兼顾性能和数据安全性。 理论上只有在系统突然宕机的情况下丢失1秒的数据。 （严格来说最多丢失1秒数据是不准确的)。

#### 2.3.4 重写机制  

随着命令不断写入AOF， 文件会越来越大， 为了解决这个问题， Redis引入AOF重写机制压缩文件体积。 AOF文件重写是把Redis进程内的数据转化为写命令同步到新AOF文件的过程。

**重写后的AOF文件为什么可以变小？ 有如下原因：**  

1. 进程内已经超时的数据不再写入文件。
2. 旧的AOF文件含有无效命令， 如del key1、 hdel key2、 srem keys、 set a111、 set a222等。 重写使用进程内数据直接生成， 这样新的AOF文件只保留最终数据的写入命令。  
3. 多条写命令可以合并为一个， 如： lpush list a、 lpush list b、 lpush list c可以转化为： lpush list a b c。 为了防止单条命令过大造成客户端缓冲区溢出， 对于list、 set、 hash、 zset等类型操作， 以64个元素为界拆分为多条。  

AOF重写降低了文件占用空间， 除此之外， 另一个目的是： 更小的AOF文件可以更快地被Redis加载。  

**AOF重写过程可以手动触发和自动触发：**  

- 手动触发： 直接调用bgrewriteaof命令  

- 自动触发： 根据**auto-aof-rewrite-min-size**和**auto-aof-rewrite-percentage**参数确定自动触发时机  
  - auto-aof-rewrite-min-size： 表示运行AOF重写时文件最小体积， 默认为64MB。
  - auto-aof-rewrite-percentage： 代表当前AOF文件空间（ aof_current_size） 和上一次重写后AOF文件空间（ aof_base_size） 的比值。
  - 自动触发时机=aof_current_size>auto-aof-rewrite-min-size&&（ aof_current_size-aof_base_size） /aof_base_size>=auto-aof-rewrite-percentage，其中aof_current_size和aof_base_size可以在info Persistence统计信息中查看  

**AOF重写流程**

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084553.png" alt="image-20210518005500702" />

1. 执行AOF重写请求。

   如果当前进程正在执行AOF重写， 请求不执行并返回如下响应：  

![image-20210518005537455](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084554.png)

​		如果当前进程正在执行bgsave操作， 重写命令延迟到bgsave完成之后再执行， 返回如下响应：  

​		![image-20210518005612709](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084555.png)

2. 父进程执行fork创建子进程， 开销等同于bgsave过程。  

3. 主进程fork操作完成后， 继续响应其他命令。 所有修改命令依然写入AOF缓冲区并根据appendfsync策略同步到硬盘， 保证原有AOF机制正确性。
   3.1 由于fork操作运用写时复制技术， 子进程只能共享fork操作时的内存数据。 由于父进程依然响应命令， Redis使用“AOF重写缓冲区”保存这部分新数据， 防止新AOF文件生成期间丢失这部分数据。  

4. 子进程根据内存快照， 按照命令合并规则写入到新的AOF文件。 每次批量写入硬盘数据量由配置aof-rewrite-incremental-fsync控制， 默认为32MB， 防止单次刷盘数据过多造成硬盘阻塞。  

5. 新AOF文件写入完成后， 子进程发送信号给父进程， 父进程更新统计信息， 具体见info persistence下的aof_*相关统计。
   5.2） 父进程把AOF重写缓冲区的数据写入到新的AOF文件。
   5.3） 使用新AOF文件替换老文件， 完成AOF重写。  

#### 2.3.5 重启加载  

AOF和RDB文件都可以用于服务器重启时的数据恢复。 如图所示，表示Redis持久化文件加载流程  

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084556.png" alt="image-20210518005841671" />

流程说明：

1. AOF持久化开启且存在AOF文件时， 优先加载AOF文件， 打印如下日志：  

![image-20210518005936653](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084557.png)

2. AOF关闭或者AOF文件不存在时， 加载RDB文件， 打印如下日志：  

![image-20210518005956961](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084558.png)

3. 加载AOF/RDB文件成功后， Redis启动成功。
4. AOF/RDB文件存在错误时， Redis启动失败并打印错误信息  

#### 2.3.6 文件校验  

加载损坏的AOF文件时会拒绝启动， 并打印如下日志：  

![image-20210518010049823](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084559.png)

***

### 2.4 多实例部署

Redis单线程架构导致无法充分利用CPU多核特性， 通常的做法是在一台机器上部署多个Redis实例。 当多个实例开启AOF重写后， 彼此之间会产生对CPU和IO的竞争。下面主要介绍针对这种场景的分析和优化。  

对于单机多Redis部署， 如果同一时刻运行多个子进程， 对当前系统影响将非常明显， 因此需要采用一种措施， 把子进程工作进行隔离。 Redis在info Persistence中为我们提供了监控子进程运行状况的度量指标， 如表所示。  

![image-20210518230547242](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084600.png)

我们基于以上指标， 可以通过外部程序轮询控制AOF重写操作的执行，整个过程如图所示。  

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084601.png" alt="image-20210518230650362" />

流程说明：  

1. 外部程序定时轮询监控机器（machine）上所有Redis实例。
2. 对于开启AOF的实例，查看（aof_current_size-aof_base_size） /aof_base_size确认增长率）
3. 当增长率超过特定阈值（如100%） ， 执行bgrewriteaof命令手动触发当前实例的AOF重写。
4. 运行期间循环检查aof_rewrite_in_progress和aof_current_rewrite_time_sec指标， 直到AOF重写结束。    
5. 确认实例AOF重写完成后， 再检查其他实例并重复2 ~4步操作。从而保证机器内每个Redis实例AOF重写串行化执行。  

***

### 2.5 本章重点回顾  

- Redis提供了两种持久化方式： RDB和AOF。
- RDB使用一次性生成内存快照的方式， 产生的文件紧凑压缩比更高， 因此读取RDB恢复速度更快。 由于每次生成RDB开销较大， 无法做到实时持久化， 一般用于数据冷备和复制传输。
- save命令会阻塞主线程不建议使用， bgsave命令通过fork操作创建子进程生成RDB避免阻塞。
- AOF通过追加写命令到文件实现持久化， 通过appendfsync参数可以控制实时/秒级持久化。 因为需要不断追加写命令， 所以AOF文件体积逐渐变大， 需要定期执行重写操作来降低文件体积。
- AOF重写可以通过auto-aof-rewrite-min-size和auto-aof-rewrite-percentage参数控制自动触发，也可以使用bgrewriteaof命令手动触发。
- 子进程执行期间使用copy-on-write机制与父进程共享内存， 避免内存消耗翻倍。 AOF重写期间还需要维护重写缓冲区， 保存新的写入命令避免数据丢失。
- 持久化阻塞主线程场景有： fork阻塞和AOF追加阻塞。 fork阻塞时间跟内存量和系统有关， AOF追加阻塞说明硬盘资源紧张。
- 单机下部署多个实例时， 为了防止出现多个子进程执行重写操作，建议做隔离控制， 避免CPU和IO资源竞争。  

