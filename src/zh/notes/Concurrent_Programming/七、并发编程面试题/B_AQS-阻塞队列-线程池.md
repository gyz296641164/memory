---
title: B_AQS-阻塞队列-线程池
category:
  - 并发编程
order: 8
date: 2024-02-16
---

<!-- more -->

## 一、AQS高频问题

### 1.1 AQS是什么？

AQS就是一个抽象队列同步器，abstract queued sychronizer，本质就是一个抽象类。

AQS中有一个核心属性state，其次还有一个双向链表以及一个单项链表。

首先state是基于volatile修饰，再基于CAS修改，同时可以保证三大特性。（原子，可见，有序）

其次还提供了一个双向链表。有Node对象组成的双向链表。

最后在Condition内部类中，还提供了一个由Node对象组成的单向链表。

AQS是JUC下大量工具的基础类，很多工具都基于AQS实现的，比如lock锁，CountDownLatch，Semaphore，线程池等等都用到了AQS。

---

state是啥：state就是一个int类型的数值，同步状态，至于到底是什么状态，看子类实现。

condition和单向链表是啥：都知道sync内部提供了wait方法和notify方法的使用，lock锁也需要实现这种机制，lock锁就基于AQS内部的Condition实现了await和signal方法。（对标sync的wait和notify）

---

sync在线程持有锁时，执行wait方法，会将线程扔到WaitSet等待池中排队，等待唤醒

lcok在线程持有锁时，执行await方法，会将线程封装为Node对象，扔到Condition单向链表中，等待唤醒

---

Condition在做了什么：将持有锁的线程封装为Node扔到Condition单向链表，同时挂起线程。如果线程唤醒了，就将Condition中的Node扔到AQS的双向链表等待获取锁。

### 1.2 唤醒线程时，AQS为什么从后往前遍历？

如果线程没有获取到资源，就需要将线程封装为Node对象，安排到AQS的双向链表中排队，并且可能会挂起线程

如果在唤醒线程时，head节点的next是第一个要被唤醒的，如果head的next节点取消了，AQS的逻辑是从tail节点往前遍历，找到离head最近的有效节点？

想解释清楚这个问题，需要先了解，一个Node对象，是如何添加到双向链表中的。

基于addWaiter方法中，是先将当前Node的prev指向tail的节点，再将tail指向我自己，再让prev节点指向我

如下图，如果只执行到了2步骤，此时，Node加入到了AQS队列中，但是从prev节点往后，会找不到当前节点。

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202402/ae178fa5e6677aba.png)

### 1.3 AQS为什么用双向链表，（为啥不用单向链表）？

因为AQS中，存在取消节点的操作，节点被取消后，需要从AQS的双向链表中断开连接。

还需要保证双向链表的完整性，

* 需要将prev节点的next指针，指向next节点。
* 需要将next节点的prev指针，指向prev节点。

如果正常的双向链表，直接操作就可以了。

但是如果是单向链表，需要遍历整个单向链表才能完成的上述的操作。比较浪费资源。

### 1.4 AQS为什么要有一个虚拟的head节点

有一个哨兵节，点更方便操作。

另一个是因为AQS内部，每个Node都会有一些状态，这个状态不单单针对自己，还针对后续节点

* 1：当前节点取消了。
* 0：默认状态，啥事没有。
* -1：当前节点的后继节点，挂起了。
* -2：代表当前节点在Condition队列中（await将线程挂起了）
* -3：代表当前是共享锁，唤醒时，后续节点依然需要被唤醒。

Node节点的ws，表示很多信息，除了当前节点的状态，还会维护后继节点状态。

如果取消虚拟的head节点，一个节点无法同时保存当前阶段状态和后继节点状态。

同时，在释放锁资源时，就要基于head节点的状态是否是-1。来决定是否唤醒后继节点。

如果为-1，正常唤醒

如果不为-1，不需要唤醒吗，减少了一次可能发生的遍历操作，提升性能。

### 1.5 ReentrantLock的底层实现原理

ReentrantLock是基于AQS实现的。

在线程基于ReentrantLock加锁时，需要基于CAS去修改state属性，如果能从0改为1，代表获取锁资源成功

如果CAS失败了，添加到AQS的双向链表中排队（可能会挂起线程），等待获取锁。

持有锁的线程，如果执行了condition的await方法，线程会封装为Node添加到Condition的单向链表中，等待被唤醒并且重新竞争锁资源

Java中除了一会讲到的线程池中Worker的锁之外，都是可重入锁。

**在基础面试题2中，波波老师说到了：Synchronizer和ReentrantLock的区别？**

### 1.6 ReentrantLock的公平锁和非公平锁的区别

注意，想回答的准确些，就别举生活中的列子，用源码的角度去说。

如果用生活中的例子，你就就要用有些人没素质，但是又有素质。

源码：

* 公平锁和非公平中的lock方法和tryAcquire方法的实现有一内内不同，其他都一样
  * 非公平锁lock：直接尝试将state从 0  ~ 1，如果成功，拿锁直接走，如果失败了，执行tryAcquire
  * 公平锁lock：直接执行tryAcquire
  * 非公平锁tryAcquire：如果当前没有线程持有锁资源，直接再次尝试将state从 0  ~ 1如果成功，拿锁直接走
  * 公平锁tryAcquire：如果当前没有线程持有锁资源，先看一下，有排队的么。
    * 如果没有排队的，直接尝试将state从 0  ~ 1
    * 如果有排队的，第一名不是我，不抢，继续等待。
    * 如果有排队的，我是第一名，直接尝试将state从 0  ~ 1
  * 如果都没拿到锁，公平锁和非公平锁的后续逻辑是一样的，排队后，就不存在所谓的插队。

生活的例子：非公平锁会有机会尝试强行获取锁资源两次，成功开开心心走人，失败，消消停停去排队。

* 有个人前来做核酸
  * 公平锁：先看眼，有排队的么，有就去排队
  * 非公平锁：不管什么情况，先尝试做凳子上。如果坐上了，直接被扣，扣完走人，如果没做到凳子上
    * 有人正在扣嗓子眼么？
      * 没人正在被扣，上去尝试做凳子上！成功了，扣完走人。
      * 如果有人正在扣，消停去排队。

### 1.7 ReentrantReadWriteLock如何实现的读写锁

如果一个操作写少读多，还用互斥锁的话，性能太低，因为读读不存在并发问题。

怎么解决啊，有读写锁的出现。

ReentrantReadWriteLock也是基于AQS实现的一个读写锁，但是锁资源用state标识。

如何基于一个int来标识两个锁信息，有写锁，有读锁，怎么做的？

一个int，占了32个bit位。

在写锁获取锁时，基于CAS修改state的低16位的值。

在读锁获取锁时，基于CAS修改state的高16位的值。

写锁的重入，基于state低16直接标识，因为写锁是互斥的。

读锁的重入，无法基于state的高16位去标识，因为读锁是共享的，可以多个线程同时持有。所以读锁的重入用的是ThreadLocal来表示，同时也会对state的高16为进行追加。

---

## 二、阻塞队列高频问题：

### 2.1 说下你熟悉的阻塞队列？

ArrayBlockingQueue，LinkedBlockingQueue，PriorityBlockingQueue

ArrayBlockingQueue：底层基于数组实现，记得new的时候设置好边界。

LinkedBlockingQueue：底层基于链表实现的，可以认为是无界队列，但是可以设置长度。

PriorityBlockingQueue：底层是基于数组实现的二叉堆，可以认为是无界队列，因为数组会扩容。

ArrayBlockingQueue，LinkedBlockingQueue是ThreadPoolExecutor线程池最常用的两个阻塞队列。

PriorityBlockingQueue：是ScheduleThreadPoolExecutor定时任务线程池用的阻塞队列跟PriorityBlockingQueue的底层实现是一样的。（其实本质用的是DelayWorkQueue）

### 2.2 虚假唤醒是什么？

虚假唤醒在阻塞队列的源码中就有体现。

比如消费者1在消费数据时，会先判断队列是否有元素，如果元素个数为0，消费者1会挂起。

此处判断元素为0的位置，如果用if循环会导致出现一个问题。

如果生产者添加了一个数据，会唤醒消费者1。

但是如果消费者1没拿到锁资源，消费者2拿到了锁资源并带走了数据的话。

消费者1再次拿到锁资源时，无法从队列获取到任何元素。导致出现逻辑问题。

解决方案，将判断元素个数的位置，设置为while判断。

---

## 三、线程池高频问题：（最重要的点）

### 3.1 线程池的7个参数

核心线程数，最大线程数，最大空闲时间，时间单位，阻塞队列，线程工厂，拒绝策略

### 3.2 线程池的状态有什么，如何记录的？

线程池不是什么时候都接活的！

线程池有5个状态。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202402/8a882b275af0ed34.png)

线程池的状态是在ctl属性中记录的。本质就是int类型

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202402/2ba5cedcbb4bff6b.png)

ctl的高三位记录线程池状态

低29位，记录工作线程个数。即便你指定的线程最大数量是Integer.MAX_VALUE他也到不了

### 3.3 线程池常见的拒绝策略

AbortPolicy：抛异常（默认）

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202402/76119795c5df0ff9.png)

CallerRunsPolicy，谁提交的任务，谁执行。异步变同步

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202402/13b034787755556b.png)

DiscardPolicy：任务直接不要

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202402/b3169c4439012101.png)

DiscardOldestPolicy：把最早放过来的任务丢失，再次尝试将当前任务交给线程池处理

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202402/15c176c3d48a3db8.png)

一般情况下，线程池自带的无法满足业务时，自定义一个线程池的拒绝策略。

实现下面的接口即可。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202402/31510363b36bfefa.png)

### 3.4 线程池执行流程

核心线程不是new完就构建的，是懒加载的机制，添加任务才会构建核心线程

2个核心线程 5个最大线程  阻塞队列长度为2

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202402/9f976ca8a61c8bdc.png)

### 3.5 线程池为什么添加空任务的非核心线程

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202402/b1bdf8bb09f8fe48.png)

**避免线程池出现工作队列有任务，但是没有工作线程处理。**

线程池可以设置核心线程数是0个。这样，任务扔到阻塞队列，但是没有工作线程，这不凉凉了么~~

线程池中的核心线程不是一定不会被回收，线程池中有一个属性，如果设置为true，核心线程也会被干掉

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202402/d62e9b12a49f239f.png)

### 3.6 在没任务时，线程池中的工作线程在干嘛？

线程会挂起，默认核心线程是WAITING状态，非核心是TIMED_WAITING

如果是核心线程，默认情况下，会在阻塞队列的位置执行take方法，直到拿到任务为止。

如果是非核心线程，默认情况下，会在阻塞队列的位置执行poll方法，等待最大空闲时间，如果没任务，直接拉走咔嚓掉，如果有活，那就正常干。

### 3.7 工作线程出现异常会导致什么问题？

**是否抛出异常、影响其他线程吗、工作线程会嘎嘛？**

如果任务是execute方法执行的，工作线程会将异常抛出。

如果任务是submit方法执行的futureTask，工作线程会将异常捕获并保存到FutureTask里，可以基于futureTask的get得到异常信息

出现异常的工作线程不会影响到其他的工作线程。

runWorker中的异常会被抛到run方法中，run方法会异常结束，run方法结束，线程就嘎了！

如果是submit，异常没抛出来，那就不嘎~

### 3.8 工作线程继承AQS的目的是什么？

**工作线程的本质，就是Worker对象**

继承AQS跟shutdown和shutdownNow有关系。

如果是shutdown，会中断空闲的工作线程，基于Worker实现的AQS中的state的值来判断能否中断工作线程。

如果工作线程的state是0，代表空闲，可以中断，如果是1，代表正在干活。

如果是shutdownNow，直接强制中断所有工作线程

### 3.9 核心参数怎么设置？

**如果面试问到，你项目中的线程池参数设置的是多少，你先给个准确的数字和配置。别上来就说怎么设置！！**

线程池的目的是为了充分发挥CPU的资源。提升整个系统的性能。

系统内部不同业务的线程池参考的方式也不一样。

如果是CPU密集(做判断、循环、算法等操作，没有查询数据库)的任务，一般也就是：`CPU内核数 + 1`的核心线程数。这样足以充分发挥CPU性能。

如果是IO密集(比如一个业务要查询三个服务)的任务，因为IO的程度不一样的啊，有的是1s，有的是1ms，有的是1分钟，所以IO密集的任务在用线程池处理时，一定要通过压测的方式，观察CPU资源的占用情况，来决定核心线程数。一般发挥CPU性能到70%~80%足矣。所以线程池的参数设置需要通过压测以及多次调整才能得出具体的。