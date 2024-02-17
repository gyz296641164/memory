---
title: 03_ThreadPoolExecutor源码探究
category:
  - 并发编程
date: 2023-03-01
---

<!-- more -->

## 一、介绍

ExecutorService（ThreadPoolExecutor的顶层接口）使用线程池中的线程执行每个提交的任务，通常我们使用Executors的工厂方法来创建ExecutorService。

<a name="类图">类图</a>

![类图](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716080048.png)

​																	

**线程池主要解决两个问题：**

- 一是当执行大量异步任务时线程池能够提供较好的性能。在不使用线程池时，每当需要执行异步任务时直接new一个线程来运行，而线程的创建和销毁是需要开销的。线程池里面的线程是可复用的，不需要每次执行异步任务时都重新创建和销毁线程。
- 二是线程池提供了一种资源限制和管理的手段，比如可以限制线程的个数，动态新增线程等。每个ThreadPoolExecutor也保留了一些基本的统计数据，比如当前线程池完成的任务数目等。

**线程池状态含义如下：**

- `RUNNING`：接受新任务并且处理阻塞队列里的任务。
- `SHUTDOWN`：拒绝新任务但是处理阻塞队列里的任务。
- `STOP`：拒绝新任务并且抛弃阻塞队列里的任务，同时会中断正在处理的任务。
- `TIDYING`：所有任务都执行完（包含阻塞队列里面的任务）后当前线程池活动线程数为0，将要调用terminated方法。
- `TERMINATED`：终止状态。terminated方法调用完成以后的状态。

**线程池状态转换列举如下：**

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202402/8a882b275af0ed34.png)

- `RUNNING -> SHUTDOWN` ：显式调用shutdown()方法，或者隐式调用了finalize()方法里面的shutdown()方法。
- `RUNNING -> STOP` ：显式调用shutdownNow()方法时。
- `SHUTDOWN -> TIDYING` ：当线程池和任务队列都为空时。
- `STOP -> TIDYING` ：当线程池为空时。
- `TIDYING -> TERMINATED` ：当terminated() hook方法执行完成时。

**线程池参数如下：**

- corePoolSize：线程池核心线程个数。
- workQueue：用于保存等待执行的任务的阻塞队列，比如基于数组的有界ArrayBlockingQueue、基于链表的无界LinkedBlockingQueue、最多只有一个元素的同步队列SynchronousQueue及优先级队列PriorityBlockingQueue等。
- maximumPoolSize：线程池最大线程数量。
- ThreadFactory：创建线程的工厂。
- RejectedExecutionHandler：饱和策略，当队列满并且线程个数达到maximunPoolSize后采取的策略，比如AbortPolicy（抛出异常）、CallerRunsPolicy（使用调用者所在线程来运行任务）、DiscardOldestPolicy（调用poll丢弃一个任务，执行当前任务）及DiscardPolicy（默默丢弃，不抛出异常）
- keeyAliveTime：存活时间。如果当前线程池中的线程数量比核心线程数量多，并且是闲置状态，则这些闲置的线程能存活的最大时间。
-  TimeUnit：存活时间的时间单位。

线程池类型如下：

1. Excutors.newCachedThreadPool（无界线程池，自动线程回收）

   - 创建一个按需创建线程的线程池，初始线程个数为0，最多线程个数为Integer.MAX_VALUE，并且阻塞队列为同步队列。keeyAliveTime=60说明只要当前线程在60s内空闲则回收。这个类型的特殊之处在于，加入同步队列的任务会被马上执行，同步队列里面最多只有一个任务。

     

     ```java
     public static ExecutorService newCachedThreadPool () {
         return new ThreadPoolExecutor(0, Integer.MAXVALUE , 
     							   60L, TimeUnit.SECONDS,
     							   new SynchronousQueue<Runnable>());
     }
     
     //使用自定义的线程工厂
     public static ExecutorService newCachedThreadPool(ThreadFactory threadFactory) { 
     	return new ThreadPoolExecutor( 0, Integer.MAXVALUE , 
     							    60L, TimeUnit.SECONDS,
     								new SynchronousQueue<Runnable> (), 
     								threadFactory);
     }
     ```

     

2. Excutors.newFixedThreadPool（固定大小的线程池）

   - 创建一个核心线程个数和最大线程个数都为nThreads的线程池，并且阻塞队列长度为Integer.MAX_VALUE。keeyAliveTime=0说明只要线程个数比核心线程个数多并且当前空闲则回收。

     

     ```java
     public static ExecutorService newFixedThreadPool （Int nThreads) { 
     	return new ThreadPoolExecutor(nThreads, nThreads, 0L, TimeUnit . MILLISECONDS , 
     								new LinkedBlockingQueue<Runnable>()) ; 
       }								
     	
     //使用自定义线程创建工厂
     public static ExecutorService newFixedThreadPool(int nThreads, ThreadFactory threadFactory) ( 
     	return new ThreadPoolExecutor(nThreads, nThreads, 
     								OL , TimeUnit.MILLISECONDS , 
     								new LinkedBlockingQueue<Runnable>(),
     								threadFactory) ;
     ```

     

3. Excutors.newSingleThreadPool（单一后台线程）

   - 创建一个核心线程个数和最大线程个数都为1的线程池，并且阻塞队列长度为Integer.MAX_VALUE。keeyAliveTime=0说明只要线程个数比核心线程个数多并且当前空闲则回收。

     

     ```java
     public static ExecutorService newSingleThreadExecutor() { 
     	return new FinalizableDelegatedExecutorService(new ThreadPoolExecutor(l , 1 , 
     												   OL,TimeUnit.MILLISECONDS , 
     												  new LinkedBlockingQueue<Runnable>()));
       }
         
     //使用自己的线程工厂
     public static ExecutorService newSingleThreadExecutor(ThreadFactory threadFactory) { 
     	return new nalizableDelegatedExecutorService(new ThreadPoolExecutor(1, 1 , 
     												OL , TimeUnit.MILLISECONDS , 
     												new LinkedBlockingQueue<Runnable>() , 
     												threadFactory)) ;
       }	
     ```

     

***

## 二、在自定义线程池时，请参考以下指南

### 2.1 core and maximum pool sizes核心和最大线程池数量

| 参数            | 解释           |
| --------------- | -------------- |
| corePoolSize    | 核心线程池数量 |
| maximumPoolSize | 最大线程池数量 |

线程执行器将会根据 `corePoolSize` 和 `maximumPoolSize` 自动地调整线程池大小。

<a name="线程池对任务的处理流程">线程池对任务的处理流程</a>

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716080049.png)

<div align="center">线程任务处理流程</div>

- 当在execute(Runnable)方法中提交新任务并且少于corePoolSize线程正在运行时，即使其它工作线程处于空闲状态，也会创建一个新线程来处理该请求。
- 如果有多于 `corePoolSize` 但小于 `maximumPoolSize`线程正在运行，则仅当队列已满时才会创建新线程。
- **通过设置 `corePoolSize` 和 `maximumPoolSize`相同，您可以创建一个固定大小的线程池。**
- 通过将 `maximumPoolSize`设置成基本上无界的值，例如Integer.MAX_VALUE，您可以允许池容纳任意数量的并发任务。通常，核心和最大池大小仅在构建时设置，但也可以使用`setCorePoolSize`和`setMaximumPoolSize`进行动态更改。



### 2.2 prestartCoreThread 核心线程预启动

在默认情况下，只有当新任务到达时，才开始创建和启动核心线程，但是我们可以用 `prestartCoreThread()` 和 `prestartAllCoreThreads()`方法动态调整。如果使用非空队列构建池，则可能需要预先启动线程。

| 方法                     | 作用                                           |
| ------------------------ | ---------------------------------------------- |
| prestartCoreThread()     | 创一个空闲任务线程等待任务的到达               |
| prestartAllCoreThreads() | 创建核心线程池数量的空闲任务线程等待任务的到达 |

### 2.3 ThreadFactory线程工厂

- 新线程使用ThreadFactory创建。 如果未另行指定，则使用Executors.defaultThreadFactory默认工厂，使其全部位于同一个ThreadGroup中，并且具有相同的NORM_PRIORITY优先级和非守护进程状态。

- 通过提供不同的ThreadFactory，您可以更改线程的名称，线程组，优先级，守护进程状态等。如果ThreadCactory在通过从newThread返回null询问时未能创建线程，则执行程序将继续，但可能无法执行任何任务。

- 线程应该有modifyThread权限。 如果工作线程或使用该池的其他线程不具备此权限，则服务可能会降级：配置更改可能无法及时生效，并且关闭池可能会保持可终止但尚未完成的状态。


### 2.4 Keep-alive times 线程存活时间

- 如果线程池当前拥有超过corePoolSize的线程，那么多余的线程在空闲时间超过keepAliveTime时会被终止 ( 请参阅getKeepAliveTime(TimeUnit) )。这提供了一种在不积极使用线程池时减少资源消耗的方法。

- 如果池在以后变得更加活跃，则应构建新线程。 也可以使用方法`setKeepAliveTime(long，TimeUnit)`进行动态调整。

- 防止空闲线程在关闭之前终止，可以使用如下方法：

  ```
  setKeepAliveTime(Long.MAX_VALUE，TimeUnit.NANOSECONDS);
  ```

  默认情况下，keep-alive策略仅适用于存在超过corePoolSize线程的情况。 但是，只要keepAliveTime值不为零，方法`allowCoreThreadTimeOut(boolean)`也可用于将此超时策略应用于**核心线程**。


### 2.5 Queuing 队列

BlockingQueue用于存放提交的任务，队列的实际容量与线程池大小相关联。

- 如果当前线程池任务数量小于核心线程池数量，执行器总是优先创建一个任务线程，而不是从线程队列中取一个空闲线程。
- 如果当前线程池任务线程数量大于核心线程池数量，执行器总是优先从线程队列中取一个空闲线程，而不是创建一个任务线程。
- 如果当前线程池任务线程数量大于核心线程池数量，且队列中无空闲任务线程，将会创建一个任务线程，直到超出maximumPoolSize，如果超时maximumPoolSize，则任务将会被拒绝。

**主要有三种队列策略：**

1. **Direct handoffs 直接握手队列**

   Direct handfoffs的一个很好的默认选择是 `SynchronousQueue`，它将任务交给线程而不需要保留。如果没有线程立即来运行它，那么排队任务的尝试将失败，因此将构建新的线程。

   此策略在处理可能具有内部依赖关系的请求时避免锁定。Direct handoffs通常需要无限制的 `maximumPoolSizes`来避免拒绝新提交的任务。**注意：当任务持续以平均提交速度大于平均处理速度时，会导致线程数量会无限增长问题。**

2. **Unbounded queues 无界队列**

   当所有corePoolSize线程繁忙时，使用无界队列（例如，没有预定义容量的LinkedBlockingQueue）将**导致新任务在队列中等待，从而导致maximumPoolSize的值没有任何作用**。当每个任务互不影响，完全独立于其他任务时，这可能是合适的; 例如，在网页服务器中， 这种队列方式可以用于平滑瞬时大量请求。**但得注意，当任务持续以平均提交速度大余平均处理速度时，会导致队列无限增长问题。**

3. **Bounded queues 有界队列**

   一个有界的队列（例如，一个ArrayBlockingQueue）和有限的maximumPoolSizes配置有助于防止资源耗尽，但是难以控制。队列大小和maximumPoolSizes需要 **相互权衡**：

   - 使用大队列和较小的maximumPoolSizes可以最大限度地减少CPU使用率，操作系统资源和上下文切换开销，但会导致人为的低吞吐量。如果任务经常被阻塞（比如I/O限制），那么系统可以调度比我们允许的更多的线程。

   - 使用小队列通常需要较大的maximumPoolSizes，这会使CPU更繁忙，但可能会遇到不可接受的调度开销，这也会降低吞吐量。

     

     **这里主要为了说明有界队列大小和maximumPoolSizes的大小控制，如何降低资源消耗的同时，提高吞吐量!**

### 2.6 Rejected tasks 拒绝任务

拒绝任务有两种情况：

1. 线程池已经关闭
2. 任务队列已满且`maximumPoolSizes`已满；

无论哪种情况，都会调用RejectedExecutionHandler的rejectedExecution方法。预定义了四种处理策略：

1. **AbortPolicy**：默认测策略，抛出RejectedExecutionException运行时异常；
2. **CallerRunsPolicy**：这提供了一个简单的反馈控制机制，可以减慢提交新任务的速度；
3. **DiscardPolicy**：直接丢弃新提交的任务；
4. **DiscardOldestPolicy**：如果执行器没有关闭，队列头的任务将会被丢弃，然后执行器重新尝试执行任务（如果失败，则重复这一过程）；

### 2.7 Hook methods 钩子方法

ThreadPoolExecutor为提供了每个任务执行前后提供了钩子方法：

重写`beforeExecute(Thread，Runnable)`和`afterExecute(Runnable，Throwable)`方法来操纵执行环境； 例如，重新初始化ThreadLocals，收集统计信息或记录日志等。此外，`terminated()`在Executor完全终止后需要完成后会被调用，可以重写此方法，以执行任殊处理。

**注意：如果hook或回调方法抛出异常，内部的任务线程将会失败并结束。**

### 2.8 Queue maintenance 维护队列

`getQueue()`方法可以访问任务队列，一般用于监控和调试。**绝不建议将这个方法用于其他目的**。当在大量的队列任务被取消时，`remove()`和`purge()`方法可用于回收空间。

### 2.9 Finalization 关闭

- 如果程序中不在持有线程池的引用，并且线程池中没有线程时，线程池将会自动关闭。如果您希望确保即使用户忘记调用 `shutdown()`方法也可以回收未引用的线程池，使未使用线程最终死亡。那么必须通过设置适当的 keep-alive times 并设置allowCoreThreadTimeOut(boolean) 或者 使 corePoolSize下限为0 。

- **一般情况下，线程池启动后建议手动调用shutdown()关闭。**

***

## 三、源码分析

### 3.1 用户线程提交任务的execute方法 

execute 方法的作用是提交任务 command 到线程池进行执行。 用户线程提到线程池的模型图如下图所示。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716080050.png)

从该图可以看出，ThreadPoolExecutor的实现实际是一个生产消费模型，当用户添加任务到线程池时相当于生产者生产元素，workers线程工作集中的线程直接执行任务或者从任务队列里面获取任务时则相当于消费者消费元素。

用户线程提交任务的 `execute` 方法的代码如下：

```java
public void execute(Runnable command){
    // （1）如果任务为 null ，则抛出NPE异常
    if(command == null)
        throw new NullPointerException();
    
    //（2）获取当前线程池的状态 + 线程池个数变量的组合值
    int c = ctl.get();
    //（3）当前线程池中线程的个数是否小于corePoolSize，小于则开启新线程运行
    if(workerCountOf(c) < corePoolSize){
        if(addWorker(command,true))
            return;
        c = ctl.get();
    }
    
    //（4）如果线程池处于Running状态，则添加任务到阻塞队列
    if (isRunning(c) && workQueue.offer(command)) {
        //（4.1）二次检查
        int recheck = ctl.get();
        //（4.2）如果当前线程池不是Running状态，则从队列中删除任务，并执行拒绝策略
        if (! isRunning(recheck) && remove(command))
            reject(command);
        //（4.3）否则如果当前线程池为空，则添加一个线程
        else if (workerCountOf(recheck) == 0)
            addWorker(null,false);
    }
    //（5）如果队列满，曾新增线程，新增失败则执行拒绝策略
    else if (!addWorker(command , false))
        reject(command);
}
```

**上述代码流程详见：**<a href="#线程池对任务的处理流程">[线程池对任务的处理流程]</a>

**代码解析：**

- 代码（3）判断如果当前线程池中线程个数小于corePoolSize，会向workers里面新增一个核心线程（core线程）执行该任务。

- 如果当前线程池中线程个数大于等于corePoolSize则执行代码（4）。如果当前线程池处于RUNNING状态则添加当前任务到任务队列。这里需要判断线程池状态是因为有可能线程池已经处于非RUNNING状态，而**在非RUNNING状态下是要抛弃新任务的**。

- 如果向任务队列添加任务成功，则代码（4.2）对线程池状态进行二次校验，这是因为添加任务到任务队列后，执行代码（4.2）前有可能线程池的状态已经变化了。这里进行二次校验，如果当前线程池状态不是RUNNING了则把任务从任务队列移除，移除后执行拒绝策略；如果二次校验通过，则执行代码（4.3）重新判断当前线程池里面是否还有线程，如果没有则新增一个线程。

- 如果代码（4）添加任务失败，则说明任务队列已满，那么执行代码（5）尝试新开启线程（如类图中的thread3和thread4）来执行该任务，如果当前线程池中线程个数>maximumPoolSize则执行拒绝策略。

  - <a href="#类图">跳转至类图</a>

***

### 3.2 新增线程的addWorkder方法

**三种传参方式：**

```
addWorker(command, true) ：创建核心线程执行任务；
addWorker(command, false)：创建非核心线程执行任务；
addWorker(null, false)	 ：创建非核心线程，当前任务为空；
```

代码如下：

```java
private boolean addWorker(Runnable firstTask, boolean core) {
  // 第一部分双重循环的目的是通过CAS操作增加线程数；
    retry:
    for (;;) {
        int c = ctl.get();
        int rs = runStateOf(c);

        // （6）检查队列是否只在必要时为空
        if (rs >= SHUTDOWN &&
            ! (rs == SHUTDOWN &&
               firstTask == null &&
               ! workQueue.isEmpty()))
            return false;
		//（7）循环CAS增加线程个数
        for (;;) {
            int wc = workerCountOf(c);
            //（7.1）如果线程个数超限则返回false
            if (wc >= CAPACITY ||
                wc >= (core ? corePoolSize : maximumPoolSize))
                return false;
            //（7.2）CAS增加线程个数，同时只有一个线程成功    
            if (compareAndIncrementWorkerCount(c)) 
                break retry;
            //（7.3）CAS失败了，查看线程状态是否变化了，变化则跳到外层循环重新尝试获取线程池状态，否则继续内层循环重新CAS    
            c = ctl.get(); 
            if (runStateOf(c) != rs) 
                continue retry;
            // else CAS failed due to workerCount change; retry inner loop
        }
    }
    
    // （8）到这里CAS成功
    // 线程启动标志位
    boolean workerStarted = false;
    // 线程是否加入workers 标志位
    boolean workerAdded = false; 
    Worker w = null;
    try {
        w = new Worker(firstTask);
        final Thread t = w.thread;
        if (t != null) {
        	//（8.1）创建Worker
            final ReentrantLock mainLock = this.mainLock;
            //（8.2）加独占锁，为了实现workers同步，因为可能多个线程调用了 execute 方法
            mainLock.lock();
            try {
             	//（8.3）重新检查线程池状态，避免在获取锁前调用了 shutdown 接口
                int rs = runStateOf(ctl.get());

                if (rs < SHUTDOWN ||
                    (rs == SHUTDOWN && firstTask == null)) {
                    if (t.isAlive())
                        throw new IllegalThreadStateException();
                    //（8.4）添加任务    
                    workers.add(w);
                    int s = workers.size();
                    if (s > largestPoolSize)
                        largestPoolSize = s;
                    workerAdded = true;
                }
            } finally {
                mainLock.unlock();
            }
            //（8.5）添加成功后启动任务
            if (workerAdded) {
                t.start(); 
                workerStarted = true;
            }
        }
    } finally {
        if (! workerStarted)
            addWorkerFailed(w);
    }
    return workerStarted;
}
```

**代码解析如下：**

主要分两个部分：

> **第一部分：双重循环的目的是通过CAS操作增加线程数；**

1. 首先来分析第一部分的代码（6）

   ```
      if (rs >= SHUTDOWN &&
               ! (rs == SHUTDOWN &&
                  firstTask == null &&
                  ! workQueue.isEmpty()))
               return false;
   ```

   展开！运算后等价于：

   ```
      if (rs >= SHUTDOWN &&
                 (rs != SHUTDOWN ||		//（I）
                  firstTask != null ||		//（II）
                  workQueue.isEmpty()))	//（III）
   ```

   代码（6）在下面几种情况下会返回false：

   - （I）  当前线程池状态为STOP、TIDYING或TERMINATED。
   - （II） 当前线程池状态为SHUTDOWN并且已经有了第一个任务。
   - （III）当前线程池状态为SHUTDOWN并且任务队列为空。

2. 内层循环的作用是使用CAS操作增加线程数，代码（7.1）判断如果线程个数超限则返回false，否则执行代码（7.2）CAS操作设置线程个数，CAS成功则退出双循环，CAS失败则执行代码（7.3）看当前线程池的状态是否变化了，如果变了，则再次进入外层循环重新获取线程池状态，否则进入内层循环继续进行CAS尝试。

> **第二部分：主要是把并发安全的任务添加到workers里面，并且启动任务执行。**

1. 执行到第二部分的代码（8）时说明使用CAS成功地增加了线程个数，但是现在任务还没开始执行。这里使用全局的独占锁来控制把新增的Worker添加到工作集workers中。代码（8.1）创建了一个工作线程Worker。
2. 代码（8.2）获取了独占锁，代码（8.3）重新检查线程池状态，这是为了避免在获取锁前其他线程调用了shutdown关闭了线程池。如果线程池已经被关闭，则释放锁，新增线程失败，否则执行代码（8.4）添加工作线程到线程工作集，然后释放锁。代码（8.5）判断如果新增工作线程成功，则启动工作线程。

***

### 3.3 工作线程Worker的执行

1. **用户线程提交任务到线程池后，由Worker来执行。**

   ```
   private final class Worker extends AbstractQueuedSynchronizer implements Runnable{...}
   ```
   
2. **Worker的构造函数：**

   ```
Worker(Runnable firstTask) {
               setState(-1); // inhibit interrupts until runWorker
               this.firstTask = firstTask;
               this.thread = getThreadFactory().newThread(this);
           }
   ```
   
   在构造函数内首先设置Worker的状态为-1，这是为了避免当前Worker在调用runWorker方法前被中断（**当其他线程调用了线程池的shutdownNow时，如果Worker状态>=0则会中断该线程**）。这里设置了线程的状态为-1，所以该线程就不会被中断了。在如下runWorker代码中，运行代码（9）时会调用 `unlock` 方法，该方法把status设置为了0，所以这时候调用`shutdownNow` 会中断Worker线程。

   ```java
final void runWorker(Worker w) {
           Thread wt = Thread.currentThread();
           Runnable task = w.firstTask;
           w.firstTask = null;
           // （9）将state设置为0，允许中断
    	    w.unlock(); 
           boolean completedAbruptly = true;
           try {
           	//（10）
               while (task != null || (task = getTask()) != null) {
               	//（10.1）
                   w.lock();
                   //略略略。。。。
                    try {
                    	//（10.2）执行任务前干一些事情
                       beforeExecute(wt, task);
                       Throwable thrown = null;
                       try {
                       	//（10.3）执行任务
                           task.run();
                       } catch (RuntimeException x) {
                           thrown = x; throw x;
                       } catch (Error x) {
                           thrown = x; throw x;
                       } catch (Throwable x) {
                           thrown = x; throw new Error(x);
                       } finally {
                       	//（10.4）执行任务完毕后干一些事情
                           afterExecute(task, thrown);
                       }
                   } finally {
                       task = null;
                       //（10.5）统计当前Worker完成了多少任务
                       w.completedTasks++;
                       w.unlock();
                   }
               }
               completedAbruptly = false;
           } finally {
           	//（11）执行清理操作
               processWorkerExit(w, completedAbruptly);
           }
       }
   ```
   
   - 在如上代码（10）中，如果当前task==null或者调用getTask从任务队列获取的任务返回null，则跳转到代码（11）执行。如果task不为null则执行代码（10.1）获取工作线程内部持有的独占锁，然后执行扩展接口代码（10.2）在具体任务执行前做一些事情。代码（10.3）具体执行任务，代码（10.4）在任务执行完毕后做一些事情，代码（10.5）统计当前Worker完成了多少个任务，并释放锁。

   - 这里在执行具体任务期间加锁，是为了避免在任务运行期间，其他线程调用了shutdown后正在执行的任务被中断（shutdown只会中断当前被阻塞挂起的线程）

3. **processWorkerExit(w, completedAbruptly) 执行清理任务，其代码如下。**

   ```java
    private void processWorkerExit(Worker w, boolean completedAbruptly) {
           if (completedAbruptly) // If abrupt, then workerCount wasn't adjusted
               decrementWorkerCount();
   		//（11.1）统计整个线程池中完成得任务个数，并从工作集里删除当前Worker
           final ReentrantLock mainLock = this.mainLock;
           mainLock.lock();
           try {
               completedTaskCount += w.completedTasks;
               workers.remove(w);
           } finally {
               mainLock.unlock();
           }
   	    //（11.2）尝试设置当前线程池状态未TERMINATED,如果当前是SHUTDOWN状态并且工作队列为空，
   	    //		 或者当前是STOP状态，当前线程池里面没有活动线程
           tryTerminate();
   		//（11.3）如果当前线程个数小于核心个数，则增加
           int c = ctl.get();
           if (runStateLessThan(c, STOP)) {
               if (!completedAbruptly) {
                   int min = allowCoreThreadTimeOut ? 0 : corePoolSize;
                   if (min == 0 && ! workQueue.isEmpty())
                       min = 1;
                   if (workerCountOf(c) >= min)
                       return; // replacement not needed
               }
               addWorker(null, false);
           }
       }
   ```
   
   - 在如上代码中，代码（11.1）统计线程池完成任务个数，并且在统计前加了全局锁。把在当前工作线程中完成的任务累加到全局计数器，然后从工作集中删除当前Worker。
   - 代码（11.2）判断如果当前线程池状态是SHUTDOWN并且工作队列为空，或者当前线程池状态是STOP并且当前线程池里面没有活动线程，则设置线程池状态为TERMINATED。如果设置为了TERMINATED状态，则还需要调用条件变量termination的signalAll（）方法激活所有因为调用线程池的awaitTermination方法而被阻塞的线程。
   - 代码（11.3）则判断当前线程池里面线程个数是否小于核心线程个数，如果是则新增一个线程。

***

[参考文章：https://www.jianshu.com/p/c41e942bcd64]

[参考书籍：Java并发编程之美]









