---
title: 02_ThreadPoolExecutor基本使用
category:
  - 并发编程
date: 2023-03-01
---

<!-- more -->

## ThreadPoolExecutor提供了四个构造方法：

![image-20210518125854778](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716075955.png)

以最后一个构造方法（参数最多的那个），对其参数进行解释：

```java
public ThreadPoolExecutor(int corePoolSize,
                              int maximumPoolSize,
                              long keepAliveTime,
                              TimeUnit unit,
                              BlockingQueue<Runnable> workQueue,
                              ThreadFactory threadFactory,
                              RejectedExecutionHandler handler) {
        if (corePoolSize < 0 ||
            maximumPoolSize <= 0 ||
            maximumPoolSize < corePoolSize ||
            keepAliveTime < 0)
            throw new IllegalArgumentException();
        if (workQueue == null || threadFactory == null || handler == null)
            throw new NullPointerException();
        this.acc = System.getSecurityManager() == null ?
                null :
                AccessController.getContext();
        this.corePoolSize = corePoolSize;
        this.maximumPoolSize = maximumPoolSize;
        this.workQueue = workQueue;
        this.keepAliveTime = unit.toNanos(keepAliveTime);
        this.threadFactory = threadFactory;
        this.handler = handler;
    }
```

参数解释如表所示：

| 序号 | 名称            | 类型                     | 含义             |
| ---- | --------------- | ------------------------ | ---------------- |
| 1    | corePoolSize    | int                      | 核心线程池大小   |
| 2    | maximumPoolSize | int                      | 最大线程池大小   |
| 3    | keepAliveTime   | long                     | 线程最大空闲时间 |
| 4    | unit            | TimeUnit                 | 时间单位         |
| 5    | workQueue       | `BlockingQueue<Runnable>`  | 线程等待队列     |
| 6    | threadFactory   | ThreadFactory            | 线程创建工厂     |
| 7    | handler         | RejectedExecutionHandler | 拒绝策略         |

如果对这些参数作用有疑惑的请看 [ThreadPoolExecutor概述](https://www.jianshu.com/p/c41e942bcd64)。



## JDK预定义线程池

1. **FixedThreadPool**

   ```java
   /**
    * Class：Executors
    */
   public static ExecutorService newFixedThreadPool(int nThreads) {
           return new ThreadPoolExecutor(nThreads, nThreads,
                                         0L, TimeUnit.MILLISECONDS,
                                         new LinkedBlockingQueue<Runnable>());
       }
   ```

   - corePoolSize与maximumPoolSize相等，即其线程全为核心线程，是一个固定大小的线程池，是其优势；

   - keepAliveTime = 0 该参数默认对核心线程无效，而FixedThreadPool全部为核心线程；

   - workQueue 为LinkedBlockingQueue（无界阻塞队列），队列最大值为Integer.MAX_VALUE。如果任务提交速度持续大余任务处理速度，会造成队列大量阻塞。因为队列很大，很有可能在拒绝策略前，内存溢出。是其劣势；

   - FixedThreadPool的任务执行是`无序的`；

   

   适用场景：可用于Web服务瞬时削峰，但需注意长时间持续高峰情况造成的队列阻塞。

2. **CachedThreadPool**

   ```java
    public static ExecutorService newCachedThreadPool() {
           return new ThreadPoolExecutor(0, Integer.MAX_VALUE,
                                         60L, TimeUnit.SECONDS,
                                         new SynchronousQueue<Runnable>());
       }
   ```

   - corePoolSize = 0，maximumPoolSize = Integer.MAX_VALUE，即线程数量几乎无限制；

   - keepAliveTime = 60s，线程空闲60s后自动结束。

   - workQueue 为 SynchronousQueue 同步队列，这个队列类似于一个接力棒，入队出队必须同时传递，因为CachedThreadPool线程创建无限制，不会有队列等待，所以使用SynchronousQueue；

     

   适用场景：快速处理大量耗时较短的任务，如Netty的NIO接受请求时，可使用CachedThreadPool。

3. **SingleThreadExecutor**

   ```java
       public static ExecutorService newSingleThreadExecutor() {
           return new FinalizableDelegatedExecutorService
               (new ThreadPoolExecutor(1, 1,
                                       0L, TimeUnit.MILLISECONDS,
                                       new LinkedBlockingQueue<Runnable>()));
       }
   ```

   这里多了一层FinalizableDelegatedExecutorService包装，具体作用如下demo解释：

   ```java
       public static void main(String[] args) {
           ExecutorService fixedExecutorService = Executors.newFixedThreadPool(1);
           ThreadPoolExecutor threadPoolExecutor = (ThreadPoolExecutor) fixedExecutorService;
           System.out.println(threadPoolExecutor.getMaximumPoolSize());
           threadPoolExecutor.setCorePoolSize(8);
           
           ExecutorService singleExecutorService = Executors.newSingleThreadExecutor();
   //      运行时异常 java.lang.ClassCastException
   //      ThreadPoolExecutor threadPoolExecutor2 = (ThreadPoolExecutor) singleExecutorService;
       }
   ```

   对比可以看出，FixedThreadPool可以向下转型为ThreadPoolExecutor，并对其线程池进行配置，而SingleThreadExecutor被包装后，无法成功向下转型。**因此，SingleThreadExecutor被定以后，无法修改，做到了真正的Single。**

   

   4. **ScheduledThreadPool**

      ```java
          public static ScheduledExecutorService newScheduledThreadPool(int corePoolSize) {
              return new ScheduledThreadPoolExecutor(corePoolSize);
          }
      ```

      newScheduledThreadPool调用的是ScheduledThreadPoolExecutor的构造方法，而ScheduledThreadPoolExecutor继承了ThreadPoolExecutor，最终还是调用了其父类（ThreadPoolExecutor）的构造方法。

      ```java
          public ScheduledThreadPoolExecutor(int corePoolSize) {
              super(corePoolSize, Integer.MAX_VALUE, 0, NANOSECONDS,
                    new DelayedWorkQueue());
          }
      ```



## 自定义线程池

- 自定义线程池,没有使用线程工厂和拒绝策略构造方法！

```java
package com.gyz.test;

import java.util.concurrent.*;

/**
 * 自定义线程池
 * @date 2021-05-18
 */
public class ThreadTest {

    private static ThreadPoolExecutor executor = null;
    private static ScheduledExecutorService scheduledExecutorService = null;
    private final static int workqueueSize = 1000;

    /**
     * 创建线程池实例，所用的构造函数没有线程工厂和据决策略
     * @param corePoolSize      核心线程数量
     * @param maximumPoolSize   最大线程数量
     * @param keepAliveTime     线程最大空闲时间
     * @param unit              时间单位
     * @param workQueue         线程等待队列
     * @return
     */
    public static ThreadPoolExecutor createExecutor(int corePoolSize, int maximumPoolSize,
                                                    long keepAliveTime, TimeUnit unit,
                                                    LinkedBlockingQueue workQueue) {

        executor = new ThreadPoolExecutor(corePoolSize, maximumPoolSize, keepAliveTime, unit, workQueue);
        return executor;

    }

    /**
     * 获取线程池
     * @return
     */
    public static ThreadPoolExecutor getThreadPool() {
        if (executor == null) {
            createExecutor(50, 50, 10,
                    TimeUnit.SECONDS, new LinkedBlockingQueue(workqueueSize)
            );
            //采用的拒绝策略DiscardPolicy：如果线程池队列满了，会直接丢掉这个任务并且不会有任何异常。
            executor.setRejectedExecutionHandler(new ThreadPoolExecutor.DiscardPolicy());
        }
        return executor;
    }

    /**
     * 关闭线程池
     */
    public void closeThreadPool() {
        if (executor != null && !executor.isShutdown()) {
            executor.isShutdown();
            executor = null;
        }
    }

}
```



- 自定义线程池，使用了有界队列，自定义ThreadFactory和拒绝策略的demo：

```java
package com.gyz.test;

import java.io.IOException;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

public class ThreadTest2 {

    public static void main(String[] args) throws IOException {
        int corePoolSize = 2;
        int maximumPoolSize = 4;
        long keepAliveTime = 10;
        TimeUnit unit = TimeUnit.SECONDS;
        BlockingQueue<Runnable> workQueue = new ArrayBlockingQueue<>(2);
        ThreadFactory threadFactory = new NameTreadFactory();
        RejectedExecutionHandler handler = new MyIgnorePolicy();
        ThreadPoolExecutor executor = new ThreadPoolExecutor(corePoolSize, maximumPoolSize, keepAliveTime, unit,
                workQueue, threadFactory, handler);
        // 预启动所有核心线程
        executor.prestartAllCoreThreads(); 

        for (int i = 1; i <= 10; i++) {
            MyTask task = new MyTask(String.valueOf(i));
            executor.execute(task);
        }
        //阻塞主线程
        System.in.read(); 
    }

    static class NameTreadFactory implements ThreadFactory {

        private final AtomicInteger mThreadNum = new AtomicInteger(1);

        @Override
        public Thread newThread(Runnable r) {
            Thread t = new Thread(r, "my-thread-" + mThreadNum.getAndIncrement());
            System.out.println(t.getName() + " has been created");
            return t;
        }
    }

    public static class MyIgnorePolicy implements RejectedExecutionHandler {

        @Override
        public void rejectedExecution(Runnable r, ThreadPoolExecutor e) {
            doLog(r, e);
        }

        private void doLog(Runnable r, ThreadPoolExecutor e) {
            // 可做日志记录等
            System.err.println(r.toString() + " rejected");
//          System.out.println("completedTaskCount: " + e.getCompletedTaskCount());
        }
    }

    static class MyTask implements Runnable {
        private String name;

        public MyTask(String name) {
            this.name = name;
        }

        @Override
        public void run() {
            try {
                System.out.println(this.toString() + " is running!");
                //让任务执行慢点等3秒
                Thread.sleep(3000); 
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }

        public String getName() {
            return name;
        }

        @Override
        public String toString() {
            return "MyTask [name=" + name + "]";
        }
    }
}

```

**结论**：

1. 由于线程预启动，首先创建了1，2号线程，然后task1，task2被执行；
2. 但任务提交没有结束，此时任务task3，task6到达发现核心线程已经满了，进入等待队列；
3. 等待队列满后创建任务线程3，4执行任务task3，task6，同时task4，task5进入队列；
4. 此时创建线程数（4）等于最大线程数，且队列已满，所以7，8，9，10任务被拒绝；
5. 任务执行完毕后回头来执行task4，task5，队列清空。

