---
title: 并发编程面试题
category:
  - 并发编程
order: 8
date: 2024-02-16
---

<!-- more -->

# 并发编程面试题1

## 一、原子性高频问题

### 1.1  Java中如何实现线程安全?

多线程操作共享数据出现的问题。

锁：

* 悲观锁：synchronized，lock
* 乐观锁：CAS

可以根据业务情况，选择ThreadLocal，让每个线程玩自己的数据。

### 1.2 CAS底层实现

**最终回答：先从比较和交换的角度去聊清楚，在Java端聊到native方法，然后再聊到C++中的cmpxchg的指令，再聊到lock指令保证cmpxchg原子性**

Java的角度，CAS在Java层面最多你就能看到native方法。

你会知道比较和交换：

* 先比较一下值是否与预期值一致，如果一致，交换，返回true
* 先比较一下值是否与预期值一致，如果不一致，不交换，返回false

可以去看Unsafe类中提供的CAS操作

四个参数：哪个对象，哪个属性的内存偏移量，oldValue，newValue

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202402/e7cebba5181e927e.png)

native是直接调用本地依赖库C++中的方法。

https://hg.openjdk.java.net/jdk8u/jdk8u/hotspot/file/69087d08d473/src/share/vm/prims/unsafe.cpp

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202402/5fcf7d569af1b492.png)

https://hg.openjdk.java.net/jdk8u/jdk8u/hotspot/file/69087d08d473/src/os_cpu/linux_x86/vm/atomic_linux_x86.inline.hpp

在CAS底层，如果是多核的操作系统，需要追加一个lock指令

单核不需要加，因为cmpxchg是一行指令，不能再被拆分了

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202402/ff154f46001334ee.png)

看到cmpxchg ，是汇编的指令，CPU硬件底层就支持 **比较和交换** （cmpxchg），cmpxchg并不保证原子性的。（cmpxchg的操作是不能再拆分的指令）

所以才会出现判断CPU是否是多核，如果是多核就追加lock指令。

lock指令你可以理解为是CPU层面的锁，一般锁的粒度就是 **缓存行** 级别的锁，当然也有 **总线锁** ，但是成本太高，CPU会根据情况选择。

### 1.3 CAS的常见问题

**ABA：** ABA不一定是问题！因为一些只存在 ++，--的这种操作，即便出现ABA问题，也不影响结果！

线程A：期望将value从A1 - B2

线程B：期望将value从B2 - A3

线程C：期望将value从A1 - C4

按照原子性来说，无法保证线程安全。

解决方案很简单，Java端已经提供了。

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202402/fe88adaca6a7d756.png)

说人话就是，在修改value的同时，指定好版本号。

JUC下提供的AtomicStampedReference就可以实现。

**自旋次数过多：**

自旋次数过多，会额外的占用大量的CPU资源！浪费资源。

回答方式：可以从synchronized或者LongAdder层面去聊

* synchronized方向：从CAS几次失败后，就将线程挂起（WAITING），避免占用CPU过多的资源！
* LongAdder方向：这里是基于类似 **分段锁** 的形式去解决（要看业务，有限制的），传统的AtmoicLong是针对内存中唯一的一个值去++，LongAdder在内存中搞了好多个值，多个线程去加不同的值，当你需要结果时，我将所有值累加，返回给你。

**只针对一个属性保证原子性：** 处理方案，学了AQS就懂了。ReentrantLock基于AQS实现，AQS基于CAS实现核心功能。

### 1.4 四种引用类型 + ThreadLocal的问题？

**ThreadLocal的问题：Java基础面试题2 -- 第16题。**

四种引用类型：

* 强引用：User xx = new User();  xx就是强引用，只要引用还在，GC就不会回收！
* 软引用：用一个SofeReference引用的对象，就是软引用，如果内存空间不足，才会回收只有软引用指向对象。 **一般用于做缓存**。

  ```
  SoftwareReference xx = new SoftwareReference (new User);
  
  User user = xx.get();
  ```
* 弱引用：WeakReference引用的对象，一般就是弱引用，只要执行GC，就会回收只有弱引用指向的对象。**可以解决内存泄漏的问题** ，看ThreadLocal即可

  **ThreadLocal的问题：Java基础面试题2 -- 第16题。**
* 虚引用：PhantomReference引用的对象，就是虚引用，拿不到虚引用指向的对象，**一般监听GC回收阶段，或者是回收堆外内存时使用。**

## 二、可见性高频问题

### 2.1 Java的内存模型

回答方式。先全局描述。 在处理指令时，CPU会拉取数据，优先级是从L1到L2到L3，如果都没有，需要去主内存中拉取，JMM就是在CPU和主内存之间，来协调，保证可见、有序性等操作。

一定要聊JMM，别上来就聊JVM的内存结构，不是一个东西！！！！（Java Memory Model）

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202402/cc5506c57a07b715.png)、

CPU核心，就是CPU核心（寄存器）

缓存是CPU的缓存，CPU的缓存分为L1（线程独享），L2（内核独享），L3（多核共享）

JMM就是Java内存模型的核心，可见性，有序性都基于这实现。

主内存JVM，就是你堆内存。

### 2.2 保证可见性的方式

**啥是可见性：** 可见性是指线程间的，对变量的变化是否可见

Java层面中，保证可见性的方式有很多：

* **volatile**，用volatile基本数据类型，可以保证每次CPU去操作数据时，都直接去主内存进行读写。
* synchronized，synchronized的内存语义可以保证在获取锁之后，可以保证前面操作的数据是可见的。
* lock（CAS-volatile），也可以保证CAS或者操作volatile的变量之后，可以保证前面操作的数据是可见的。
* final，是常量没法动~~

### 2.3 volatile修饰引用数据类型

先说结果， **首先volatile修饰引用数据类型，只能保证引用数据类型的地址是可见的，不保证内部属性可见。**

But，这个结论只能在hotspot中实现，如果换一个版本的虚拟机，可能效果就不一样了。volatile修饰引用数据类型，JVM压根就没规范过这种操作，不同的虚拟机厂商，可以自己实现。

这个问题，只出现在面试中，干活你要这么干……………………干丫的~

### 2.4 有了MESI协议，为啥还有volatile？

MESI是CPU缓存一致性的协议，大多数的CPU厂商都根据MESI去实现了缓存一致性的效果。

CPU已经有MESI协议了，volatile是不是有点多余啊！？

首先，这哥俩不冲突，一个是从CPU硬件层面上的一致性，一个是Java中JMM层面的一致性。

MESI协议，他有一套固定的机制，无论你是否声明了volatile，他都会基于这个机制来保证缓存的一致性（可见性）。同时，也要清楚，如果没有MESI协议，volatile也会存在一些问题，不过也有其他的处理方案（总线锁，时间成本太高了，如果锁了总线，就一个CPU核心在干活）。

MESI是协议，是规划，是interface，他需要CPU厂商实现。

既然CPU有MESI了，为啥还要volatile，那自然是MESI协议有问题。MESI保证了多核CPU的独占cache之间的可见性，但是CPU不是说必须直接将寄存器中的数据写入到L1，因为在大多是×86架构的CPU中，寄存器和L1之间有一个store buffer，寄存器值可能落到了store buffer，没落到L1中，就会导致缓存不一致。而且除了×86架构的CPU，在arm和power的CPU中，还有load buffer，invalid queue都会或多或少影响缓存一致性！

**回答的方式：MESI协议和volatile不冲突，因为MESI是CPU层面的，而CPU厂商很多实现不一样，而且CPU的架构中的一些细节也会有影响，比如Store Buffer会影响寄存器写入L1缓存，导致缓存不一致。volatile的底层生成的是汇编的lock指令，这个指令会要求强行写入主内存，并且可以忽略Store Buffer这种缓存从而达到可见性的目的，而且会利用MESI协议，让其他缓存行失效。**

### 2.5 volatile的可见性底层实现

**volatile的底层生成的是汇编的lock指令，这个指令会要求强行写入主内存，并且可以忽略Store Buffer这种缓存从而达到可见性的目的，而且会利用MESI协议，让其他缓存行失效。**

## 三、有序性高频问题：

### 3.1 什么是有序性问题

单例模式中的懒汉机制中，就存在一个这样的问题。

懒汉为了保证线程安全，一般会采用DCL的方式。

但是单单用DCL，依然会有几率出现问题。

线程可能会拿到初始化一半的对象去操作，极有可能出现NullPointException。

（初始化对象三部，开辟空间，初始化内部属性，指针指向引用）

**在Java编译.java为.class时，会基于JIT做优化，将指令的顺序做调整，从而提升执行效率。**

**在CPU层面，也会对一些执行进行重新排序，从而提升执行效率。**

**这种指令的调整，在一些特殊的操作上，会导致出现问题。**

### 3.2 volatile的有序性底层实现

被volatile修饰的属性，在编译时，会在前后追加 **内存屏障** 。

SS：屏障前的读写操作，必须全部完成，再执行后续操作

SL：屏障前的写操作，必须全部完成，再执行后续读操作

LL：屏障前的读操作，必须全部完成，再执行后续读操作

LS：屏障前的读操作，必须全部完成，再执行后续写操作

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202402/4a950458d6a40c96.png)

这个内存屏障是JDK规定的，目的是保证volatile修饰的属性不会出现指令重排的问题。

volatile在JMM层面，保证JIT不重排可以理解，但是，CPU怎么实现的。

查看这个文档：https://gee.cs.oswego.edu/dl/jmm/cookbook.html

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202402/a50789dedb761800.png)

不同的CPU对内存屏障都有一定的支持，比如×86架构，内部自己已经实现了LS，LL，SS，只针对SL做了支持。

去openJDK再次查看，mfence是如何支持的。其实在底层还是mfence内部的lock指定，来解决指令重排问题。

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202402/02ff06b53f2343de.png)

## 四、synchronized高频问题

### 4.1 synchronized锁升级的过程?

**锁就是对象，随便哪一个都可以，Java中所有对象都是锁。**

无锁(匿名偏向)、偏向锁、轻量级锁、重量级锁

**无锁(匿名偏向)**： 一般情况下，new出来的一个对象，是无锁状态。因为偏向锁有延迟，在启动JVM的4s中，不存在偏向锁，但是如果关闭了偏向锁延迟的设置，new出来的对象，就是匿名偏向。

**偏向锁**： 当某一个线程来获取这个锁资源时，此时，就会变为偏向锁，偏向锁存储线程的ID

当偏向锁升级时，会触发偏向锁撤销，偏向锁撤销需要等到一个安全点，比如GC的时候，偏向锁撤销的成本太高，所以默认开始时，会做偏向锁延迟。

安全点：

* GC
* 方法返回之前
* 调用某个方法之后
* 甩异常的位置
* 循环的末尾

**轻量级锁：** 当在出现了多个线程的竞争，就要升级为轻量级锁（有可能直接从无锁变为轻量级锁，也有可能从偏向锁升级为轻量级锁），轻量级锁的效果就是基于CAS尝试获取锁资源，这里会用到自适应自旋锁，根据上次CAS成功与否，决定这次自旋多少次。

**重量级锁：** 如果到了重量级锁，那就没啥说的了，如果有线程持有锁，其他竞争的，就挂起。

### 4.2 synchronized锁粗化&锁消除？

锁粗化（锁膨胀）：（JIT优化）

```
while(){
   sync(){
      // 多次的获取和释放，成本太高，优化为下面这种
   }
}
//----
sync(){
   while(){
       //  优化成这样
   }
}
```

锁消除：在一个sync中，没有任何共享资源，也不存在锁竞争的情况，JIT编译时，就直接将锁的指令优化掉。

### 4.3 synchronized实现互斥性的原理？

偏向锁：查看对象头中的MarkWord里的线程ID，是否是当前线程，如果不是，就CAS尝试改，如果是，就拿到了锁资源。

轻量级锁：查看对象头中的MarkWord里的Lock Record指针指向的是否是当前线程的虚拟机栈，如果是，拿锁执行业务，如果不是CAS，尝试修改，修改他几次，不成，再升级到重量级锁。

重量级锁：查看对象头中的MarkWord里的指向的ObjectMonitor，查看owner是否是当前线程，如果不是，扔到ObjectMonitor里的EntryList中，排队，并挂起线程，等待被唤醒。

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202402/2da6a92cda36c0b7.png)

### 4.4 wait为什么是Object下的方法？

执行wait方法需要持有sync锁。

sync锁可以是任意对象。

同时执行wait方法是在持有sync锁的时候，释放锁资源。

其次wait方法需要去操作ObjectMonitor，而操作ObjectMonitor就必须要在持有锁资源的前提的才能操作，将当前线程扔到WaitSet等待池中。

同理，notify方法需要将WaitSet等待池中线程扔到EntryList，如果不拥有ObjectMonitor，怎么操作！

类锁就是基于类.class作为 类锁

对象锁，就是new 一个对象作为 对象锁

---

# 并发编程面试题2

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

---

# 并发编程面试题3

## 一、CountDownLatch，Semaphore的高频问题

### 1.1 CountDownLatch是啥？有啥用？底层咋实现的？（可以融入到你的项目业务中。）

CountDownLatch本质其实就是一个计数器。

在多线程并形处理业务时，需要等待其他线程处理完，再做后续的合并等操作，再响应用户时，可以使用CountDownLatch做计数，等到其他线程出现完之后，主线程就会被唤醒。

CountDownLatch本身就是基于AQS实现的。

new CountDownLatch时，直接指定好具体的数值。这个数值会复制给state属性。

当子线程处理完任务后，执行countDown方法，内部就是直接给state - 1而已。

当state减为0之后，执行await挂起的线程，就会被唤醒。

CountDownLatch不能重复使用，用完就凉凉。

### 1.2 Semaphore是啥？有啥用？底层咋实现的？

信号量，就是一个可以用于做限流功能的工具类。

比如Hystrix中涉及到了信号量隔离，要求并发的线程数有限制，就可以使用信号量实现。

比如要求当前服务最多10个线程同时干活，将信号量设置为10。没一个任务提交都需要获取一个信号量，就去干活，干完了，归还信号量。

信号量也是基于AQS实现的。

构建信号量时，指定信号量资源数，获取时，指定获取几个信号量，也是CAS保证原子性，归还也是类似的。

### 1.3 main线程结束，程序会停止嘛？

如果main线程结束，但是还有用户线程在执行，不会结束！

如果main线程结束，剩下的都是守护线程，结束！

## 二、CopyOnWriteArrayList的高频问题

### 2.1 CopyOnWriteArrayList是如何保证线程安全的？有什么缺点吗？

CopyOnWriteArrayList写数据时，是基于ReentrantLock保证原子性的。

其次，写数据时，会复制一个副本写入，写入成功后，才会写入到CopyOnWriteArrayList中的数组。

保证读数据时，不要出现数据不一致的问题。

如果数据量比较大时，每次写入数据，都需要复制一个副本，对空间的占用太大了。如果数据量比较大，不推荐使用CopyOnWriteArrayList。

**写操作要求保证原子性，读操作保证并发，并且数据量不大 ~**

## 三、ConcurrentHashMap（JDK1.8）的高频问题

### 3.1 HashMap为啥线程不安全？

问题1：JDK1.7里有环（扩容时）。

问题2：数据会覆盖，数据可能丢失。

问题3：其次计数器，也是传统的++，在记录元素个数和HashMap写的次数时，记录不准确。

问题4：数据迁移，扩容，也可能会丢失数据。

### 3.2 ConcurrentHashMap如何保证线程安全的？

回答1：尾插，其次扩容有CAS保证线程安全

回答2：写入数组时，基于CAS保证安全，挂入链表或插入红黑树时，基于synchronized保证安全。

回答3：这里ConcurrentHashMap是采用LongAdder实现的技术，底层还是CAS。（AtomicLong）

回答4：ConcurrentHashMap扩容时，一点基于CAS保证数据迁移不出现并发问题，	其次ConcurrentHashMap还提供了并发扩容的操作。举个例子，数组长度64扩容为128，两个线程同时扩容的话，

线程A领取64-48索引的数据迁移任务，线程B领取47-32的索引数据迁移任务。关键是领取任务时，是基于CAS保证线程安全的。

### 3.3 ConcurrentHashMap构建好，数组就创建出来了吗？如果不是，如何保证初始化数组的线程安全？

ConcurrentHashMap是懒加载的机制，而且大多数的框架组件都是懒加载的~

基于CAS来保证初始化线程安全的，这里不但涉及到了CAS去修改sizeCtl的变量去控制线程初始化数据的原子性，同时还使用了DCL，外层判断数组未初始化，中间基于CAS修改sizeCtl，内层再做数组未初始化判断。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202402/9a36553831e7b9c6.png)

### 3.4 为什么负载因子是0.75，为什么链表长度到8转为红黑树？

而且ConcurrentHashMap的负载因子不允许修改！

负载因子是0.75从两个方面去解释。

为啥不是0.5，为啥不是1？

0.5：如果负载因子是0.5，数据添加一半就开始扩容了

* 优点：hash碰撞少，查询效率高。
* 缺点：扩容太频繁，而且空间利用率低。

1：如果负载因子是1，数据添加到数组长度才开始扩容

* 优点：扩容不频繁，空间利用率可以的。
* 缺点：hash冲突会特别频繁，数据挂到链表上，影响查询效率，甚至链表过长生成红黑树，导致写入的效率也收到影响。

0.75就可以说是一个居中的选择，两个方面都兼顾了。

再聊就是泊松分布，在负载因子是0.75时，根据泊松分布得出，链表长度达到8的概率是非常低的，源码中的标识是0.00000006，生成红黑树的概率特别低。

虽然ConcurrentHashMap引入了红黑树，但是红黑树对于写入的维护成本更高，能不用就不用，HashMap源码的注释也描述了，要尽可能规避红黑树。

至于6退化为链表，是因为满树是7个值，7不退化是为了防止频繁的链表和红黑树转换，这里6退化留下了一个中间值，避免频繁的转换。

### put操作太频繁的场景，会造成扩容时期put的阻塞 ？

一般情况下不会造成阻塞。

因为如果在put操作时，发现当前索引位置并没有数据时，正常把数据落到老数组上。

如果put操作时，发现当前位置数据已经被迁移到了新数组，这时无法正常插入，去帮助扩容，快速结束扩容操作，并且重新选择索引位置查询

### 3.5 ConcurrentHashMap何时扩容，扩容的流程是什么？

* ConcurrentHashMap中的元素个数，达到了负载因子计算的阈值，那么直接扩容

* 当调用putAll方法，查询大量数据时，也可能会造成直接扩容的操作，大量数据是如果插入的数据大于下次扩容的阈值，直接扩容，然后再插入

* 数组长度小于64，并且链表长度大于等于8时，会触发扩容

  ![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202402/69534ab1553bb337.png)

扩容的流程：（sizeCtl是一个int类型变量，用于控制初始化和扩容）

* 每个扩容的线程都需要基于oldTable的长度计算一个扩容标识戳（避免出现两个扩容线程的数组长度不一致。其次保证扩容标识戳的16位是1，这样左移16位会得到一个负数）
* 第一个扩容的线程，会对sizeCtl + 2，代表当前有1个线程来扩容
* 除去第一个扩容的线程，其他线程会对sizeCtl + 1，代表现在又来了一个线程帮助扩容
* 第一个线程会初始化新数组。
* 每个线程会领取迁移数据的任务，将oldTable中的数据迁移到newTable。默认情况下，每个线程每次领取长度为16的迁移数据任务
* 当数据迁移完毕时，每个线程再去领取任务时，发现没任务可领了，退出扩容，对sizeCtl - 1。
* 最后一个退出扩容的线程，发现-1之后，还剩1，最后一个退出扩容的线程会从头到尾再检查一次，有没有遗留的数据没有迁移走（这种情况基本不发生），检查完之后，再-1，这样sizeCtl扣除完，扩容结束。

### 3.6 ConcurrentHashMap得计数器如何实现的？

这里是基于LongAdder的机制实现，但是并没有直接用LongAdder的引用，而是根据LongAdder的原理写了一个相似度在80%以上的代码，直接使用。

LongAdder使用CAS添加，保证原子性，其次基于分段锁，保证并发性。

### 3.7 ConcurrentHashMap的读操作会阻塞嘛？

无论查哪，都不阻塞。

查询数组？ ：第一块就是查看元素是否在数组，在就直接返回。

查询链表？：第二块，如果没特殊情况，就在链表next，next查询即可。

扩容时？：第三块，如果当前索引位置是-1，代表当前位置数据全部都迁移到了新数组，直接去新数组查询，不管有没有扩容完。

查询红黑树？：如果有一个线程正在写入红黑树，此时读线程还能去红黑树查询吗？因为红黑树为了保证平衡可能会旋转，旋转会换指针，可能会出现问题。所以在转换红黑树时，不但有一个红黑树，还会保留一个双向链表，此时会查询双向链表，不让读线程阻塞。至于如何判断是否有线程在写，和等待写或者是读红黑树，根据TreeBin的lockState来判断，如果是1，代表有线程正在写，如果为2，代表有写线程等待写，如果是4n，代表有多个线程在做读操作。
