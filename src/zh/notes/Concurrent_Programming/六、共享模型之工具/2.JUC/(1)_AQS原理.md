---
title: 01_AQS原理
category:
  - 并发编程
date: 2023-03-01
---

<!-- more -->

## 黑马版本

### 概述  

全称是`AbstractQueuedSynchronizer`，是阻塞式锁和相关的同步器工具的框架。

**特点**：

- 用state属性来表示资源的状态（分独占模式和共享模式），子类需要定义如何维护这个状态，控制如何获取锁和释放锁
  - getState - 获取 state状态
  - setState - 设置 state状态
  - compareAndSetState - cas 机制设置state状态
  - 独占模式是只有一个线程能够访问资源，而共享模式可以允许多个线程访问资源
- 提供了基于FIFO(先进先出)的等待队列，类似于Monitor的EntryList
- 条件变量来实现等待、唤醒机制，支持多个条件变量，类似于Monitor的WaitSet

子类主要实现这样一些方法（默认抛出 UnsupportedOperationException）

- tryAcquire
- tryRelease
- tryAcquireShared
- tryReleaseShared
- isHeldExclusively

获取锁的姿势：

```java
//如果获取锁失败
if (!tryAcquire(arg)){
	//入队，可以选择阻塞当前线程  park unpark
}
```

释放锁的姿势：

```java
//如果释放锁成功
if (tryRelease(arg)){
	//让阻塞线程恢复运行
}
```



### 实现不可重入锁

```java
package com.gyz.juc;

import lombok.extern.slf4j.Slf4j;

import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.AbstractQueuedSynchronizer;
import java.util.concurrent.locks.Condition;
import java.util.concurrent.locks.Lock;

/**
 * @Description 自定义不可重入锁
 * @Author GongYuZhuo
 * @Date 2021/7/4 15:20
 * @Version 1.0.0
 */
@Slf4j(topic = "c.UnRepeatLockTest")
public class UnRepeatLockTest {

    public static void main(String[] args) {
        MyLock myLock = new MyLock();
        new Thread(() -> {
            myLock.lock();
            log.debug("locking...");
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            } finally {
                myLock.unlock();
                log.debug("unlocking...");
            }
        }, "t1").start();

        new Thread(() -> {
            myLock.lock();
            try {
                log.debug("locinkg...");
            } finally {
                myLock.unlock();
                log.debug("unlocking...");
            }
        }, "t2").start();
    }

}


class MyLock implements Lock {

    class MySync extends AbstractQueuedSynchronizer {

        @Override
        protected boolean tryAcquire(int arg) {
            if (compareAndSetState(0, 1)) {
                //加上了锁，并设置 owner为当前线程
                setExclusiveOwnerThread(Thread.currentThread());
                return true;
            }
            return false;
        }

        @Override
        protected boolean tryRelease(int arg) {
            if (compareAndSetState(1, 0)) {
                setExclusiveOwnerThread(null);
                setState(0);
                return true;
            }
            return false;
        }

        //是否持有独占锁
        @Override
        protected boolean isHeldExclusively() {
            return getState() == 1;
        }

        public Condition newConditon() {
            return new ConditionObject();
        }
    }

    private MySync mySync = new MySync();

    //尝试，不成功进入阻塞队列
    @Override
    public void lock() {
        mySync.acquire(1);
    }

    //尝试，不成功进入等待队列，可打断
    @Override
    public void lockInterruptibly() throws InterruptedException {
        mySync.acquireInterruptibly(1);
    }

    //尝试，不成功，则进入等待队列，可打断
    @Override
    public boolean tryLock() {
        return mySync.tryAcquire(1);
    }

    //尝试一次，不成功，进入等待队列，有时限
    @Override
    public boolean tryLock(long time, TimeUnit unit) throws InterruptedException {
        return mySync.tryAcquireNanos(1, unit.toNanos(time));
    }

    //释放锁
    @Override
    public void unlock() {
        mySync.release(1);
    }

    //生成条件变量
    @Override
    public Condition newCondition() {
        return mySync.newConditon();
    }
}
```

不可重入测试。如果改为下面测试代码，会发现自己也会被挡住（只会打印一次 locking）  ：

```
lock.lock();
log.debug("locking...");
lock.lock();
log.debug("locking...");
```



### AQS 要实现的功能目标  

#### 目标

- 阻塞版本获取锁acquire和非阻塞的版本尝试获取锁tryAcquire
- 获取锁超时机制
- 通过打断取消机制
- 独占机制及共享机制
- 条件不满足时的等待机制

#### 设计

AQS 的基本思想其实很简单  。获取锁的逻辑：

```java
while (state 状态不允许获取){
	if(队列中还没有此线程){
		入队并阻塞
	}
}
当前线程出队
```

释放锁的逻辑：

```java
if (state 状态允许了){
	恢复阻塞的线程(s)
}
```

要点：

- 原子维护state状态
- 阻塞及恢复线程
- 维护队列

1）state 设计  

- state使用volatile配合cas保证其修改时的原子性
- state使用了32bit int来维护同步状态，因为当时使用long在很多平台下测试的结果并不理想

2）阻塞恢复设计

- 早期的控制线程暂停和恢复的 api 有 suspend 和 resume，但它们是不可用的，因为如果先调用的 resume那么 suspend 将感知不到  
- 解决方法是使用 park & unpark 来实现线程的暂停和恢复，先 unpark 再 park 也没问题  
- park & unpark 是针对线程的，而不是针对同步器的，因此控制粒度更为精细  
- park 线程还可以通过 interrupt 打断  

3) 队列设计  

- 使用了 FIFO 先入先出队列，并不支持优先级队列  
- 设计时借鉴了 CLH 队列，它是一种单向无锁队列  



### 主要用到 AQS 的并发工具类  

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716075918.png)

---

## 尚硅谷版本

### 前置知识

> **AbstractQueuedSynchronizer（AQS）：抽象的队列同步器**

1. 公平锁和非公平锁
2. 可重入锁
3. LockSupport
4. 自旋锁
5. 数据结构之链表
6. 设计模式之模板设计模式

一般我们说的 AQS 指的是 `java.util.concurrent.locks` 包下的 `AbstractQueuedSynchronizer`，但其实还有另外三种抽象队列同步器：`AbstractOwnableSynchronizer`、`AbstractQueuedLongSynchronizer `和 `AbstractQueuedSynchronizer`；

AQS 是用来构建锁或者其它同步器组件的重量级基础框架及**整个JUC体系的基石**， 通过内置的`FIFO队列`来完成资源获取线程的排队工作，并通过一个`int类变量（state）`表示持有锁的状态；

**CLH**：`Craig、Landin and Hagersten 队列`，是一个`双向链表`，AQS中的队列是CLH变体的虚拟双向队列FIFO：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716075919.png)



> **AQS 能干嘛**

- **加锁会导致阻塞**，有阻塞就需要排队，实现排队必然需要有某种形式的队列来进行管理。

- 如果共享资源被占用，就需要一定的阻塞等待唤醒机制来保证锁分配。这个机制主要用的是CLH队列的变体实现的,将暂时获取不到锁的线程加入到队列中，这个队列就是AQS的抽象表现。它将请求共享资源的线程封装成队列的结点(Node) ,通过CAS、自旋以及LockSuport.park()的方式,维护state变量的状态，使并发达到同步的效果。见`CLH图`



> **AQS 初步认识**

官方解释

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716075920.png" />

有阻塞就需要排队，实现排队必然需要队列

- AQS使用一个volatile的int类型的成员变量来表示同步状态，通过内置的 FIFO队列来完成资源获取的排队工作将每条要去抢占资源的线程封装成 一个Node节点来实现锁的分配，通过CAS完成对State值的修改。
- Node 节点是啥？答：你有见过 HashMap 的 Node 节点吗？JDK 用 `static class Node<K,V> implements Map.Entry<K,V> {} `来封装我们传入的 KV 键值对。这里也是一样的道理，JDK 使用 Node 来封装（管理）Thread
- 可以将 Node 和 Thread 类比于候客区的椅子和等待用餐的顾客



> **AQS 内部体系框架**

1. AQS的int变量

   AQS的同步状态State成员变量，类似于银行办理业务的受理窗口状态：零就是没人，自由状态可以办理；大于等于1，有人占用窗口，等着去

   ```
   /**
    * The synchronization state.
    */
   private volatile int state;
   
   ```

2. AQS的CLH队列

   CLH队列（三个人的名字组成），为一个双向队列，类似于银行侯客区的等待顾客

   <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716075921.png" />

3. 内部类Node（Node类在AQS类内部）

   Node的等待状态waitState成员变量，类似于等候区其它顾客(其它线程)的等待状态，队列中每个排队的个体就是一个Node

   ```
   /**
   * ...
   */
   volatile int waitStatus;
   ```

   Node类的内部结构

   ```java
   static final class Node{
       //共享
       static final Node SHARED = new Node();
       
       //独占
       static final Node EXCLUSIVE = null;
       
       //线程被取消了
       static final int CANCELLED = 1;
       
       //后继线程需要唤醒
       static final int SIGNAL = -1;
       
       //等待condition唤醒
       static final int CONDITION = -2;
       
       //共享式同步状态获取将会无条件地传播下去
       static final int PROPAGATE = -3;
       
       // 初始为e，状态是上面的几种
       volatile int waitStatus;
       
       // 前置节点
       volatile Node prev;
       
       // 后继节点
       volatile Node next;
   
       // ...
       
   ```

   <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716075922.png" />

4. AQS同步队列的基本结构

   <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716075923.png" />



### 和AQS有关的并发编程类

![image-20201227165833625](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716075924.png)

- ReentrantLock

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716075925.png" />

- CountDownLatch

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716075926.png" />

- ReentrantReadWriteLock

  ```java
  public class ReentrantReadWriteLock
          implements ReadWriteLock, java.io.Serializable {
      private static final long serialVersionUID = -6992448646407690164L;
      /** Inner class providing readlock */
      private final ReentrantReadWriteLock.ReadLock readerLock;
      /** Inner class providing writelock */
      private final ReentrantReadWriteLock.WriteLock writerLock;
      /** Performs all synchronization mechanics */
      final Sync sync;
  
      /**
       * Creates a new {@code ReentrantReadWriteLock} with
       * default (nonfair) ordering properties.
       */
      public ReentrantReadWriteLock() {
          this(false);
      }
  
      /**
       * Creates a new {@code ReentrantReadWriteLock} with
       * the given fairness policy.
       *
       * @param fair {@code true} if this lock should use a fair ordering policy
       */
      public ReentrantReadWriteLock(boolean fair) {
          sync = fair ? new FairSync() : new NonfairSync();
          readerLock = new ReadLock(this);
          writerLock = new WriteLock(this);
      }
  
      public ReentrantReadWriteLock.WriteLock writeLock() { return writerLock; }
      public ReentrantReadWriteLock.ReadLock  readLock()  { return readerLock; }
  
      /**
       * Synchronization implementation for ReentrantReadWriteLock.
       * Subclassed into fair and nonfair versions.
       */
      abstract static class Sync extends AbstractQueuedSynchronizer {
          private static final long serialVersionUID = 6317671515068378041L;
          ...   
      }    
      ...
      
  }    
  ```

- Semaphore

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716075927.png" />

- **进一步理解锁和同步器的关系**

  - `锁`，面向锁的使用者。定义了程序员和锁交互的使用层API，隐藏了实现细节，你调用即可，可以理解为用户层面的 API；
  - `同步器`，面向锁的实现者。比如Java并发大神Douglee，提出统一规范并简化了锁的实现，屏蔽了同步状态管理、阻塞线程排队和通知、唤醒机制等，Java 中有那么多的锁，就能简化锁的实现啦。



### 从ReentrantLock开始解读AQS

#### 前置知识

- 本次讲解我们走最常用的,lock/unlock作为案例突破口

- AQS里面有个变量叫state，3个状态：`没占用是0`,`用了是1`，`大于1是可重入锁`

- 如果AB两个线程进来了以后，请问这个总共有多少个Node节点？答案是3个，其中队列的第一个是傀儡节点(哨兵节点)，如下图。

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716075928.png" />





#### lock()方法开始

> **通过 `ReentrantLock` 的源码来讲解公平锁和非公平锁**

在 `ReentrantLock` 内定义了静态内部类，分别为 `NoFairSync`（非公平锁）和 `FairSync`（公平锁）

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716075929.png" />

`ReentrantLock` 的构造函数：不传参数表示创建非公平锁；参数为 true 表示创建公平锁；参数为 false 表示创建非公平锁

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716075930.png" />

> **`lock()` 方法的执行流程：以 `NonfairSync` 为例**

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202402/20f0493d48578dc5.png" />

在 `ReentrantLock` 中，`NoFairSync` 和 `FairSync` 中 `tryAcquire()` 方法的区别，可以明显看出公平锁与非公平锁的`lock()`方法唯一的区别就在于公平锁在获取同步状态时多了一个限制条件:`hasQueuedPredecessors()`

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716075931.png" />

`hasQueuedPredecessors()` 方法是公平锁加锁时判断等待队列中是否存在有效节点的方法：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716075932.png" />

**公平锁与非公平锁的总结**

对比公平锁和非公平锁的`tryAcqure()`方法的实现代码，其实差别就在于非公平锁获取锁时比公平锁中少了一个判断`!hasQueuedPredecessors()`，`hasQueuedPredecessors()`中判断了是否需要排队，导致公平锁和非公平锁的差异如下:

1. 公平锁：公平锁讲究先来先到，线程在获取锁时，如果这个锁的等待队列中已经有线程在等待，那么当前线程就会进入等待队列中；

2. 非公平锁：不管是否有等待队列，如果可以获取锁，则立刻占有锁对象。也就是说队列的第一 个排队线程在`unpark()`，之后还是需要竞争锁(存在线程竞争的情况下)

   <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716075933.png"/>

而 `acquire()` 方法最终都会调用 `tryAcquire()` 方法：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716075934.png" />

在 `NonfairSync` 和 `FairSync` 中均重写了其父类 `AbstractQueuedSynchronizer` 中的 `tryAcquire()` 方法

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716075935.png" />



> **以案例代码解析**

源码解读比较困难，我们这里举个例子，假设 A、B、C 三个人都要去银行窗口办理业务，但是银行窗口只有一个，我们使用 `lock.lock()` 模拟这种情况：

```java
public class AQSDemo {
    public static void main(String[] args) {
        ReentrantLock lock = new ReentrantLock();
        //带入一个银行办理业务的案例来模拟我们的AQS如何进行线程的管理和通知唤醒机制
        //3个线程模拟3个来银行网点,受理窗口办理业务的顾客
        //A顾客就是第一个顾客,此时受理窗口没有任何人,A可以直接去办理
        new Thread(() -> {
                lock.lock();
                try{
                    System.out.println("-----A thread come in");

                    try { TimeUnit.MINUTES.sleep(20); }catch (Exception e) {e.printStackTrace();}
                }finally {
                    lock.unlock();
                }
        },"A").start();

        //第二个顾客,第二个线程---》由于受理业务的窗口只有一个(只能一个线程持有锁),此时B只能等待,
        //进入候客区
        new Thread(() -> {
            lock.lock();
            try{
                System.out.println("-----B thread come in");
            }finally {
                lock.unlock();
            }
        },"B").start();

        //第三个顾客,第三个线程---》由于受理业务的窗口只有一个(只能一个线程持有锁),此时C只能等待,
        //进入候客区
        new Thread(() -> {
            lock.lock();
            try{
                System.out.println("-----C thread come in");
            }finally {
                lock.unlock();
            }
        },"C").start();
    }
}

```

**先来看看线程 A（客户 A）的执行流程**

- `new ReentrantLock()` 不传参默认是非公平锁，调用 `lock.lock()` 方法最终都会执行 `NonfairSync` 重写后的 `lock()` 方法；

- 第一次执行 lock() 方法

  由于第一次执行 `lock()` 方法，`state` 变量的值等于 0，表示 lock 锁没有被占用，此时执行 `compareAndSetState(0, 1)` CAS 判断，可得 `state == expected == 0`，因此 CAS 成功，将 `state` 的值修改为 1

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716075936.png" />

- 再来看看 `setExclusiveOwnerThread()` 方法做了啥：将拥有 lock 锁的线程修改为线程 A

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716075937.png" />

**再来看看线程 B（客户 B）的执行流程**

- 第二次执行 lock() 方法

- 由于第二次执行 lock() 方法，state 变量的值等于 1，表示 lock 锁被占用，此时执行 compareAndSetState(0, 1) CAS 判断，可得 `state != expected`，因此 CAS 失败，进入 acquire() 方法

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716075938.png" />

- `acquire()` 方法主要包含如下几个方法，下面我们一个一个来讲解

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716075939.png" />

- **`tryAcquire(arg)` 方法的执行流程**

  - 先来看看 `tryAcquire()` 方法，诶，怎么抛了个异常？别着急，仔细一看是 `AbstractQueuedSynchronizer` 抽象队列同步器中定义的方法，既然抛出了异常，就证明父类强制要求子类去实现（**模板设计模式的应用**）

    <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716075940.png" />

  - `Ctrl + Alt + B`查看子类的实现

    <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716075941.png" />

  - 这里以非公平锁 `NonfairSync` 为例，在 `tryAcquire()` 方法中调用了 `nonfairTryAcquire()` 方法，注意，这里传入的参数都是 1

    <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716075942.png" />

- **`nonfairTryAcquire(acquires)` 正常的执行流程：**

  - 在 nonfairTryAcquire() 方法中，大多数情况都是如下的执行流程：线程 B 执行 `int c = getState()` 时，获取到 state 变量的值为 1，表示 lock 锁正在被占用；于是执行 `if (c == 0)` { 发现条件不成立，接着执行下一个判断条件 `else if (current == getExclusiveOwnerThread()) {`，current 线程为线程 B，而`getExclusiveOwnerThread()` 方法返回正在占用 lock 锁的线程，为线程 A，因此 `tryAcquire() `方法最后会 `return false`，表示并没有抢占到 lock 锁

    <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716075943.png" />

  - **补充**：`getExclusiveOwnerThread()` 方法返回正在占用 lock 锁的线程（排他锁，exclusive）

- **`nonfairTryAcquire(acquires)` 比较特殊的执行流程：**

  - 第一种情况是，走到 int c = getState() 语句时，此时线程 A 恰好执行完成，让出了 lock 锁，那么 state 变量的值为 0，当然发生这种情况的概率很小，那么线程 B 执行 CAS 操作成功后，将占用 lock 锁的线程修改为自己，然后返回 true，表示抢占锁成功。其实这里还有一种情况，需要留到 unlock() 方法才能说清楚
  - 第二种情况为可重入锁的表现，假设 A 线程又再次抢占 lock 锁（当然示例代码里面并没有体现出来），这时 `current == getExclusiveOwnerThread() `条件成立，将 state 变量的值加上 acquire，这种情况下也应该 `return true`，表示线程 A 正在占用 lock 锁。因此，state 变量的值是可以大于 1 的

- **继续往下走，执行 `addWaiter(Node.EXCLUSIVE)` 方法**

  - <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716075944.png" />

  - 在 `tryAcquire()` 方法返回 `false` 之后，进行 `!` 操作后为 `true`，那么会继续执行 `addWaiter()` 方法

  - `Node` 节点用于封装用户线程，这里将当前正在执行的线程通过 `Node` 封装起来（当前线程正是抢占 lock 锁没有抢占到的线程）

  - 判断 tail 尾指针是否为空，双端队列此时还没有元素呢~肯定为空呀，那么执行 `enq(node)` 方法，将封装了线程 B 的 `Node` 节点入队

    ```java
     private Node addWaiter(Node mode) {
            Node node = new Node(Thread.currentThread(), mode);
            // Try the fast path of enq; backup to full enq on failure
            Node pred = tail;
            if (pred != null) {
                node.prev = pred;
                if (compareAndSetTail(pred, node)) {
                    pred.next = node;
                    return node;
                }
            }
            enq(node);
            return node;
        }
    ```

  - **enq(node) 方法：构建双端同步队列**

    - 在双端同步队列中，第一个节点为虚节点（也叫哨兵节点），其实并不存储任何信息，只是占位。 真正的第一个有数据的节点，是从第二个节点开始的

      ```java
       private Node enq(final Node node) {
              for (;;) {
                  Node t = tail;
                  if (t == null) { // Must initialize
                      if (compareAndSetHead(new Node()))
                          tail = head;
                  } else {
                      node.prev = t;
                      if (compareAndSetTail(t, node)) {
                          t.next = node;
                          return t;
                      }
                  }
              }
          }
      ```

    - 第一次执行 for 循环：当线程 B 进来时，双端同步队列为空，此时肯定要先构建一个哨兵节点。此时 `tail == null`，因此进入` if(t == null) `{ 的分支，头指针指向哨兵节点，此时队列中只有一个节点，尾节点即是头结点，因此尾指针也指向该`哨兵节点`

      <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716075945.png" />

    - 第二次执行 for 循环：现在该将装着线程 B 的节点放入双端同步队列中，此时 tail 指向了哨兵节点，并不等于 null，因此 `if (t == null) `不成立，进入 else 分支。以尾插法的方式，先将 node（装着线程 B 的节点）的 prev 指向之前的 tail，再将 node 设置为尾节点（`执行 compareAndSetTail(t, node)`），最后将 `t.next` 指向 node，最后执行 `return t`结束 for 循环
      <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716075946.png" />

    - **注意**：哨兵节点和 `nodeB` 节点的 `waitStatus` 均为 0，表示在等待队列中

  - **`acquireQueued()` 方法的执行**

    执行完 `addWaiter()` 方法之后，就该执行 `acquireQueued()` 方法了，这个方法有点东西，我们放到后面再去讲它

    <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716075947.png" />

**最后来看看线程 C（客户 C）的执行流程**

线程 C 和线程 B 的执行流程很类似，都是执行 `acquire()` 中的方法；

但是在 `addWaiter()` 方法中，执行流程有些区别。此时 `tail != null`，因此在 `addWaiter()` 方法中就已经将 `nodeC` 添加至队尾了

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716075948.png" />

执行完 `addWaiter()` 方法后，就已经将 nodeC 挂在了双端同步队列的队尾，不需要再执行 `enq(node)` 方法

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716075949.png" />

**再看`acquireQueued()` 方法的执行逻辑**

先来看看 `acquireQueued()` 方法的源代码，其实这样直接看代码有点懵逼，我们接下来举例来理解。注意看：两个 `if` 判断中的代码都放在 `for( ; ; )` 中执行，这样可以实现自旋的操作

```java
final boolean acquireQueued(final Node node, int arg) {
        boolean failed = true;
        try {
            boolean interrupted = false;
            for (;;) {
                final Node p = node.predecessor();
                if (p == head && tryAcquire(arg)) {
                    setHead(node);
                    p.next = null; // help GC
                    failed = false;
                    return interrupted;
                }
                if (shouldParkAfterFailedAcquire(p, node) &&
                    parkAndCheckInterrupt())
                    interrupted = true;
            }
        } finally {
            if (failed)
                cancelAcquire(node);
        }
    }
```

**继续看线程 B 的执行流程**

线程 B 执行 addWaiter() 方法之后，就进入了 acquireQueued() 方法中，此时传入的参数为封装了线程 B 的 nodeB 节点，nodeB 的前驱结点为哨兵节点，因此 `final Node p = node.predecessor()` 执行完后，p 将指向哨兵节点。哨兵节点满足 `p == head`，但是线程 B 执行 `tryAcquire(arg) `方法尝试抢占 lock 锁时还是会失败，因此会执行下面 if 判断中的 `shouldParkAfterFailedAcquire(p, node) `方法，该方法的代码如下：

```java
private static boolean shouldParkAfterFailedAcquire(Node pred, Node node) {
        int ws = pred.waitStatus;
        if (ws == Node.SIGNAL)
            /*
             * This node has already set status asking a release
             * to signal it, so it can safely park.
             */
            return true;
        if (ws > 0) {
            /*
             * Predecessor was cancelled. Skip over predecessors and
             * indicate retry.
             */
            do {
                node.prev = pred = pred.prev;
            } while (pred.waitStatus > 0);
            pred.next = node;
        } else {
            /*
             * waitStatus must be 0 or PROPAGATE.  Indicate that we
             * need a signal, but don't park yet.  Caller will need to
             * retry to make sure it cannot acquire before parking.
             */
            compareAndSetWaitStatus(pred, ws, Node.SIGNAL);
        }
        return false;
    }
```

哨兵节点的 `waitStatus == 0`，因此执行 CAS 操作将哨兵节点的 `waitStatus` 改为 `Node.SIGNAL(-1)`

```java
 compareAndSetWaitStatus(pred, ws, Node.SIGNAL);
```

注意：`compareAndSetWaitStatus(pred, ws, Node.SIGNAL) `调用 `unsafe.compareAndSwapInt(node, waitStatusOffset, expect, update); `实现，虽然 `compareAndSwapInt() `方法内无自旋，但是在 `acquireQueued() `方法中的 `for( ; ; ) `能保证此自选操作成功（另一种情况就是线程 B 抢占到 lock 锁）

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716075950.png" />

执行完上述操作，将哨兵节点的 `waitStatus` 设置为了 -1；

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716075951.png" />

执行完毕将退出 `if` 判断，又会重新进入 `for( ; ; )` 循环，此时执行 `shouldParkAfterFailedAcquire(p, node)` 方法时会返回 `true`，因此此时会接着执行 `parkAndCheckInterrupt()` 方法

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716075952.png" />

线程 B 调用 `park()` 方法后被挂起，程序不会然续向下执行，程序就在这儿排队等待

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716075953.png" />

**线程 C 的执行流程**

线程 C 最终也会执行到 `LockSupport.park(this);` 处，然后被挂起，进入等待区。

**总结**

- 如果前驱节点的 waitstatus 是 SIGNAL 状态（-1），即 shouldParkAfterFailedAcquire() 方法会返回 true，程序会继续向下执行 parkAndCheckInterrupt() 方法，用于将当前线程挂起
- 根据 park() 方法 API 描述，程序在下面三种情况会继续向下执行：
  - 被 unpark
  - 被中断（interrupt）
  - 其他不合逻辑的返回才会然续向下执行

- 因上述三种情况程序执行至此，返回当前线程的中断状态，并清空中断状态。如果程序由于被中断，该方法会返回 true



#### unlock() 开始

**线程 A 执行 `unlock()` 方法**

- `unlock()` 方法调用了 `sync.release(1)` 方

  ```java
    public void unlock() {
          sync.release(1);
    }
  ```

- **`release()` 方法的执行流程**

  - 其实主要就是看看 tryRelease(arg) 方法和 unparkSuccessor(h) 方法的执行流程，这里先大概说以下，能有个印象：线程 A 即将让出 lock 锁，因此 tryRelease() 执行后将返回 true，表示礼让成功，head 指针指向哨兵节点，并且 if 条件满足，可执行 unparkSuccessor(h) 方法
  - <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716075954.png" />

- **`tryRelease(arg)` 方法的执行逻辑**

  - 又是 `AbstractQueuedSynchronizer` 类中定义的方法，又是抛了个异常

    <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716075955.png" />

  - 线程 A 只加锁过一次，因此 `state` 的值为 1，参数 `release` 的值也为 1，因此 `c == 0`。将 `free` 设置为 `true`，表示当前 lock 锁已被释放，将排他锁占有的线程设置为 `null`，表示没有任何线程占用 lock 锁

    <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716075956.png" />

- **`unparkSuccessor(h)` 方法的执行逻辑**

  - 在 release() 方法中获取到的头结点 h 为哨兵节点，`h.waitStatus == -1`，因此执行 CAS操作将哨兵节点的 waitStatus 设置为 0，并将哨兵节点的下一个节点`s = node.next = nodeB`获取出来，并唤醒 nodeB 中封装的线程`if (s == null || s.waitStatus > 0)`不成立，只有 `if (s != null) `成立

    ```java
        private void unparkSuccessor(Node node) {
            /*
             * If status is negative (i.e., possibly needing signal) try
             * to clear in anticipation of signalling.  It is OK if this
             * fails or if status is changed by waiting thread.
             */
            int ws = node.waitStatus;
            if (ws < 0)
                compareAndSetWaitStatus(node, ws, 0);
    
            /*
             * Thread to unpark is held in successor, which is normally
             * just the next node.  But if cancelled or apparently null,
             * traverse backwards from tail to find the actual
             * non-cancelled successor.
             */
            Node s = node.next;
            if (s == null || s.waitStatus > 0) {
                s = null;
                for (Node t = tail; t != null && t != node; t = t.prev)
                    if (t.waitStatus <= 0)
                        s = t;
            }
            if (s != null)
                LockSupport.unpark(s.thread);
        }
    ```

  - 执行完上述操作后，当前占用 lock 锁的线程为 `null`，哨兵节点的 `waitStatus` 设置为 0，`state` 的值为 0（表示当前没有任何线程占用 lock 锁）

    <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716075957.png" />

**继续来看 B 线程被唤醒之后的执行逻辑**

再次回到 `lock()` 方法的执行流程中来，线程 B 被 `unpark()` 之后将不再阻塞，继续执行下面的程序，线程 B 正常被唤醒，因此 `Thread.interrupted()` 的值为 `false`，表示线程 B 未被中断。

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716075958.png" />

回到上一层方法中，此时 lock 锁未被占用，线程 B 执行 `tryAcquire(arg)` 方法能够抢到 lock 锁，并且将 `state` 变量的值设置为 1，表示该 lock 锁已经被占用

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716075959.png" />

接着来研究下 `setHead(node)` 方法：传入的节点为 `nodeB`，头指针指向 `nodeB` 节点；将 `nodeB` 中封装的线程置为 `null`（因为已经获得锁了）；`nodeB` 不再指向其前驱节点（哨兵节点）。这一切都是为了将 `nodeB` 作为新的哨兵节点

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716080000.png" />

执行完 `setHead(node)` 方法的状态如下图所示：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716080001.png" />

将 `p.next` 设置为 `null`，这是原来的哨兵节点就是完全孤立的一个节点，此时 `nodeB` 作为新的哨兵节点

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716080002.png" />

线程 C 也是类似的执行流程！！！

