---
title: 5_共享模型之工具
category:
  - 并发编程
order: 5
date: 2023-03-01
---

<!-- more -->

## 线程池

### 自定义线程池

#### 使用线程池的好处

- 降低资源消耗。通过重复利用已创建的线程降低线程创建和销毁造成的消耗。
- 提高响应速度。当任务到达时，任务可以不需要的等到线程创建就能立即执行。
- 提高线程的可管理性。线程是稀缺资源，如果无限制的创建，不仅会消耗系统资源，还会降低系统的稳定性，使用线程池可以进行统一的分配，调优和监控。

![image-20220901224954301](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220901224954.png)

#### 步骤1：自定义拒绝策略接口

```java
@FunctionalInterface // 拒绝策略
interface RejectPolicy<T> {
  void reject(BlockingQueue<T> queue, T task);
}
```

#### 步骤2：自定义任务队列

```java
class BlockingQueue<T> {
    // 1. 任务队列
    private Deque<T> queue = new ArrayDeque<>();

    // 2. 锁
    private ReentrantLock lock = new ReentrantLock();

    // 3. 生产者条件变量
    private Condition fullWaitSet = lock.newCondition();

    // 4. 消费者条件变量
    private Condition emptyWaitSet = lock.newCondition();

    // 5. 容量
    private int capcity;

    public BlockingQueue(int capcity) {
        this.capcity = capcity;
    }

    // 带超时阻塞获取
    public T poll(long timeout, TimeUnit unit) {
        lock.lock();
        try {
            // 将 timeout 统一转换为 纳秒
            long nanos = unit.toNanos(timeout);
            while (queue.isEmpty()) {
                try {
                    // 返回值是剩余时间
                    if (nanos <= 0) {
                        return null;
                    }
                    nanos = emptyWaitSet.awaitNanos(nanos);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
            T t = queue.removeFirst();
            fullWaitSet.signal();
            return t;
        } finally {
            lock.unlock();
        }
    }

    // 阻塞获取
    public T take() {
        lock.lock();
        try {
            while (queue.isEmpty()) {
                try {
                    emptyWaitSet.await();
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
            T t = queue.removeFirst();
            fullWaitSet.signal();
            return t;
        } finally {
            lock.unlock();
        }
    }

    // 阻塞添加
    public void put(T task) {
        lock.lock();
        try {
            while (queue.size() == capcity) {
                try {
                    log.debug("等待加入任务队列 {} ...", task);
                    fullWaitSet.await();
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
            log.debug("加入任务队列 {}", task);
            queue.addLast(task);
            emptyWaitSet.signal();
        } finally {
            lock.unlock();
        }
    }

    // 带超时时间阻塞添加
    public boolean offer(T task, long timeout, TimeUnit timeUnit) {
        lock.lock();
        try {
            long nanos = timeUnit.toNanos(timeout);
            while (queue.size() == capcity) {
                try {
                    if(nanos <= 0) {
                        return false;
                    }
                    log.debug("等待加入任务队列 {} ...", task);
                    nanos = fullWaitSet.awaitNanos(nanos);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
            log.debug("加入任务队列 {}", task);
            queue.addLast(task);
            emptyWaitSet.signal();
            return true;
        } finally {
            lock.unlock();
        }
    }

    public int size() {
        lock.lock();
        try {
            return queue.size();
        } finally {
            lock.unlock();
        }
    }

    public void tryPut(RejectPolicy<T> rejectPolicy, T task) {
        lock.lock();
        try {
            // 判断队列是否满
            if(queue.size() == capcity) {
                rejectPolicy.reject(this, task);
            } else {  // 有空闲
                log.debug("加入任务队列 {}", task);
                queue.addLast(task);
                emptyWaitSet.signal();
            }
        } finally {
            lock.unlock();
        }
    }
}
```

#### 步骤3：自定义线程池

```java
class ThreadPool {
    // 任务队列
    private BlockingQueue<Runnable> taskQueue;

    // 线程集合
    private HashSet<Worker> workers = new HashSet<>();

    // 核心线程数
    private int coreSize;

    // 获取任务时的超时时间
    private long timeout;

    private TimeUnit timeUnit;

    private RejectPolicy<Runnable> rejectPolicy;

    // 执行任务
    public void execute(Runnable task) {
        // 当任务数没有超过 coreSize 时，直接交给 worker 对象执行
        // 如果任务数超过 coreSize 时，加入任务队列暂存
        synchronized (workers) {
            if(workers.size() < coreSize) {
                Worker worker = new Worker(task);
                log.debug("新增 worker{}, {}", worker, task);
                workers.add(worker);
                worker.start();
            } else {
//                taskQueue.put(task);
                // 1) 死等
                // 2) 带超时等待
                // 3) 让调用者放弃任务执行
                // 4) 让调用者抛出异常
                // 5) 让调用者自己执行任务
                taskQueue.tryPut(rejectPolicy, task);
            }
        }
    }

    public ThreadPool(int coreSize, long timeout, TimeUnit timeUnit, int queueCapcity, RejectPolicy<Runnable> rejectPolicy) {
        this.coreSize = coreSize;
        this.timeout = timeout;
        this.timeUnit = timeUnit;
        this.taskQueue = new BlockingQueue<>(queueCapcity);
        this.rejectPolicy = rejectPolicy;
    }

    class Worker extends Thread{
        private Runnable task;

        public Worker(Runnable task) {
            this.task = task;
        }

        @Override
        public void run() {
            // 执行任务
            // 1) 当 task 不为空，执行任务
            // 2) 当 task 执行完毕，再接着从任务队列获取任务并执行
//            while(task != null || (task = taskQueue.take()) != null) {
            while(task != null || (task = taskQueue.poll(timeout, timeUnit)) != null) {
                try {
                    log.debug("正在执行...{}", task);
                    task.run();
                } catch (Exception e) {
                    e.printStackTrace();
                } finally {
                    task = null;
                }
            }
            synchronized (workers) {
                log.debug("worker 被移除{}", this);
                workers.remove(this);
            }
        }
    }
}
```

#### 步骤4：测试

```java
    public static void main(String[] args) {
        ThreadPool threadPool = new ThreadPool(1,
                1000, TimeUnit.MILLISECONDS, 1, (queue, task)->{
            // 1. 死等
//            queue.put(task);
            // 2) 带超时等待
//            queue.offer(task, 1500, TimeUnit.MILLISECONDS);
            // 3) 让调用者放弃任务执行
//            log.debug("放弃{}", task);
            // 4) 让调用者抛出异常
//            throw new RuntimeException("任务执行失败 " + task);
            // 5) 让调用者自己执行任务
            task.run();
        });
        for (int i = 0; i < 4; i++) {
            int j = i;
            threadPool.execute(() -> {
                try {
                    Thread.sleep(1000L);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
                log.debug("{}", j);
            });
        }
    }
```

### ThreadPoolExecutor

![image-20220912230208044](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220912230208.png)

#### 线程池状态

ThreadPoolExecutor 使用 int 的高 3 位来表示线程池状态，低 29 位表示线程数量  

| 状态名     | 高 3 位 | 接收新任 务 | 处理阻塞队列任 务 | 说明                                       |
| ---------- | ------- | ----------- | ----------------- | ------------------------------------------ |
| RUNNING    | 111     | Y           | Y                 |                                            |
| SHUTDOWN   | 000     | N           | Y                 | 不会接收新任务，但会处理阻塞队列剩余 任务  |
| STOP       | 001     | N           | N                 | 会中断正在执行的任务，并抛弃阻塞队列 任务  |
| TIDYING    | 010     | -           | -                 | 任务全执行完毕，活动线程为 0 即将进入 终结 |
| TERMINATED | 011     | -           | -                 | 终结状态                                   |

从数字上比较，`TERMINATED` > `TIDYING` > `STOP` > `SHUTDOWN` > `RUNNING`  

这些信息存储在一个原子变量 ctl 中，目的是将线程池状态与线程个数合二为一，这样就可以用一次 cas 原子操作进行赋值 。

```
// c 为旧值， ctlOf 返回结果为新值
ctl.compareAndSet(c, ctlOf(targetState, workerCountOf(c))));
// rs 为高 3 位代表线程池状态， wc 为低 29 位代表线程个数，ctl 是合并它们
private static int ctlOf(int rs, int wc) { return rs | wc; }
```

####  构造方法

```java
    public ThreadPoolExecutor(int corePoolSize, 
    						int maximumPoolSize, 
    						long keepAliveTime, 
    						TimeUnit unit, 
    						BlockingQueue<Runnable> workQueue, 
    						ThreadFactory threadFactory,
            				 RejectedExecutionHandler handler)
```

- `corePoolSize` 核心线程数目 (最多保留的线程数)
- `maximumPoolSize` 最大线程数目
- `keepAliveTime` 生存时间 - 针对救急线程
- `unit` 时间单位 - 针对救急线程
- `workQueue` 阻塞队列
- `threadFactory` 线程工厂 - 可以为线程创建时起个好名字
- `handler` 拒绝策略  

工作方式：

![image-20220912230627826](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220912230627.png)

![image-20220912230638310](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220912230638.png)

- 线程池中刚开始没有线程，当一个任务提交给线程池后，线程池会创建一个新线程来执行任务。  
- 当线程数达到 corePoolSize 并没有线程空闲，这时再加入任务，新加的任务会被加入workQueue 队列排队，直到有空闲的线程。  
- 如果队列选择了有界队列，那么任务超过了队列大小时，会创建 maximumPoolSize - corePoolSize 数目的线程来救急。 
- 如果线程到达 maximumPoolSize 仍然有新任务这时会执行拒绝策略。拒绝策略 jdk 提供了 4 种实现，其它著名框架也提供了实现
  -  AbortPolicy 让调用者抛出 RejectedExecutionException 异常，这是默认策略  
  - CallerRunsPolicy 让调用者运行任务  
  - DiscardPolicy 放弃本次任务  
  - DiscardOldestPolicy 放弃队列中最早的任务，本任务取而代之  
  - Dubbo 的实现，在抛出 RejectedExecutionException 异常之前会记录日志，并 dump 线程栈信息，方便定位问题  
  - Netty 的实现，是创建一个新线程来执行任务  
  - ActiveMQ 的实现，带超时等待（60s）尝试放入队列，类似我们之前自定义的拒绝策略  
  - PinPoint 的实现，它使用了一个拒绝策略链，会逐一尝试策略链中每种拒绝策略  
- 当高峰过去后，超过`corePoolSize` 的救急线程如果一段时间没有任务做，需要结束节省资源，这个时间由`keepAliveTime` 和 `unit` 来控制。  

![image-20220912230923036](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220912230923.png)

根据这个构造方法，JDK Executors 类中提供了众多工厂方法来创建各种用途的线程池 。

#### newFixedThreadPool

```java
public static ExecutorService newFixedThreadPool(int nThreads) {
	return new ThreadPoolExecutor(nThreads, nThreads,
								0L, TimeUnit.MILLISECONDS,
								new LinkedBlockingQueue<Runnable>());
}
```

特点

- 核心线程数 == 最大线程数（没有救急线程被创建），因此也无需超时时间
- 阻塞队列是无界的，可以放任意数量的任务  

> [!Note]适用于任务量已知，相对耗时的任务  

#### newCachedThreadPool

```java
public static ExecutorService newCachedThreadPool() {
	return new ThreadPoolExecutor(0, Integer.MAX_VALUE,
							    60L, TimeUnit.SECONDS,
								new SynchronousQueue<Runnable>());
}
```

**特点**

- 核心线程数是 0， 最大线程数是 Integer.MAX_VALUE，救急线程的空闲生存时间是 60s，意味着

  - 全部都是救急线程（60s 后可以回收）  
  - 救急线程可以无限创建  

- 队列采用了 SynchronousQueue 实现特点是，它没有容量，没有线程来取是放不进去的（一手交钱、一手交货）  

  ```java
          SynchronousQueue<Integer> integers = new SynchronousQueue<>();
          new Thread(() -> {
              try {
                  log.debug("putting {} ", 1);
                  integers.put(1);
                  log.debug("{} putted...", 1);
  
                  log.debug("putting...{} ", 2);
                  integers.put(2);
                  log.debug("{} putted...", 2);
              } catch (InterruptedException e) {
                  e.printStackTrace();
              }
          },"t1").start();
  
          sleep(1);
  
          new Thread(() -> {
              try {
                  log.debug("taking {}", 1);
                  integers.take();
              } catch (InterruptedException e) {
                  e.printStackTrace();
              }
          },"t2").start();
  
          sleep(1);
  
          new Thread(() -> {
              try {
                  log.debug("taking {}", 2);
                  integers.take();
              } catch (InterruptedException e) {
                  e.printStackTrace();
              }
          },"t3").start();
  ```

  输出  

  ```
  11:48:15.500 c.TestSynchronousQueue [t1] - putting 1
  11:48:16.500 c.TestSynchronousQueue [t2] - taking 1
  11:48:16.500 c.TestSynchronousQueue [t1] - 1 putted...
  11:48:16.500 c.TestSynchronousQueue [t1] - putting...2
  11:48:17.502 c.TestSynchronousQueue [t3] - taking 2
  11:48:17.503 c.TestSynchronousQueue [t1] - 2 putted...
  ```

> [!Note]整个线程池表现为线程数会根据任务量不断增长，没有上限，当任务执行完毕，空闲 1分钟后释放线程。 适合任务数比较密集，但每个任务执行时间较短的情况  

#### newSingleThreadExecutor

```java
public static ExecutorService newSingleThreadExecutor() {
	return new FinalizableDelegatedExecutorService
		(new ThreadPoolExecutor(1, 1,
							  0L, TimeUnit.MILLISECONDS,
							  new LinkedBlockingQueue<Runnable>()));
}
```

**使用场景**：

希望多个任务排队执行。线程数固定为 1，任务数多于 1 时，会放入无界队列排队。任务执行完毕，这唯一的线程也不会被释放。  

**区别**：  

- 自己创建一个单线程串行执行任务，如果任务执行失败而终止那么没有任何补救措施，而线程池还会新建一个线程，保证池的正常工作  
- `Executors.newSingleThreadExecutor()` 线程个数始终为1，不能修改  
  - `FinalizableDelegatedExecutorService` 应用的是装饰器模式，只对外暴露了 `ExecutorService` 接口，因此不能调用`ThreadPoolExecutor` 中特有的方法  
  - `Executors.newFixedThreadPool(1)` 初始时为1，以后还可以修改
    - 对外暴露的是 `ThreadPoolExecutor` 对象，可以强转后调用 `setCorePoolSize` 等方法进行修改

#### 提交任务

```java
// 执行任务
void execute(Runnable command);

// 提交任务 task，用返回值 Future 获得任务执行结果
<T> Future<T> submit(Callable<T> task);

// 提交 tasks 中所有任务
<T> List<Future<T>> invokeAll(Collection<? extends Callable<T>> tasks)
					throws InterruptedException;

// 提交 tasks 中所有任务，带超时时间
<T> List<Future<T>> invokeAll(Collection<? extends Callable<T>> tasks,
							long timeout, TimeUnit unit)
					throws InterruptedException;

// 提交 tasks 中所有任务，哪个任务先成功执行完毕，返回此任务执行结果，其它任务取消
<T> T invokeAny(Collection<? extends Callable<T>> tasks)
					throws InterruptedException, ExecutionException;
	
// 提交 tasks 中所有任务，哪个任务先成功执行完毕，返回此任务执行结果，其它任务取消，带超时时间
<T> T invokeAny(Collection<? extends Callable<T>> tasks,
				long timeout, TimeUnit unit)
			throws InterruptedException, ExecutionException, TimeoutException;	
```

#### 关闭线程池

> **shutdown**

```java
/*
线程池状态变为 SHUTDOWN
- 不会接收新任务
- 但已提交任务会执行完
- 此方法不会阻塞调用线程的执行
*/
void shutdown();

       public void shutdown () {
            final ReentrantLock mainLock = this.mainLock;
            mainLock.lock();
            try {
                checkShutdownAccess();
                // 修改线程池状态
                advanceRunState(SHUTDOWN);
               // 仅会打断空闲线程
                interruptIdleWorkers();
                onShutdown(); // 扩展点 ScheduledThreadPoolExecutor
            } finally {
                mainLock.unlock();
            }
            // 尝试终结(没有运行的线程可以立刻终结，如果还有运行的线程也不会等)
            tryTerminate();
        }
```

> **shutdownNow**  

```java
/*
线程池状态变为 STOP
- 不会接收新任务
- 会将队列中的任务返回
- 并用 interrupt 的方式中断正在执行的任务
*/
List<Runnable> shutdownNow();

        public List<Runnable> shutdownNow () {
            List<Runnable> tasks;
            final ReentrantLock mainLock = this.mainLock;
            mainLock.lock();
            try {
                checkShutdownAccess();
                // 修改线程池状态
                advanceRunState(STOP);
                // 打断所有线程
                interruptWorkers();
                // 获取队列中剩余任务
                tasks = drainQueue();
            } finally {
                mainLock.unlock();
            }
            // 尝试终结
            tryTerminate();
            return tasks;
        }
```

> **其它方法**  

```
// 不在 RUNNING 状态的线程池，此方法就返回 true
boolean isShutdown();
// 线程池状态是否是 TERMINATED
boolean isTerminated();
// 调用 shutdown 后，由于调用线程并不会等待所有任务运行结束，因此如果它想在线程池 TERMINATED 后做些事
情，可以利用此方法等待
boolean awaitTermination(long timeout, TimeUnit unit) throws InterruptedException;
```

---

#### 异步模式之工作线程  

##### 1. 定义

让有限的工作线程（Worker Thread）来轮流异步处理无限多的任务。也可以将其归类为分工模式，它的典型实现就是线程池，也体现了经典设计模式中的**享元模式**。

例如，海底捞的服务员（线程），轮流处理每位客人的点餐（任务），如果为每位客人都配一名专属的服务员，那么成本就太高了（对比另一种多线程设计模式：Thread-Per-Message）。

例如，如果一个餐馆的工人既要招呼客人（任务类型A），又要到后厨做菜（任务类型B）显然效率不咋地，分成服务员（线程池A）与厨师（线程池B）更为合理，当然你能想到更细致的分工。

>  [!Note]注意，不同任务类型应该使用不同的线程池，这样能够避免饥饿，并能提升效率。

##### 2. 饥饿

> **固定大小线程池会有饥饿现象**

- 两个工人是同一个线程池中的两个线程
- 他们要做的事情是：为客人点餐和到后厨做菜，这是两个阶段的工作  
  - 客人点餐：必须先点完餐，等菜做好，上菜，在此期间处理点餐的工人必须等待  
  - 后厨做菜：没啥说的，做就是了  
- 比如工人A 处理了点餐任务，接下来它要等着 工人B 把菜做好，然后上菜，他俩也配合的蛮好  
- 但现在同时来了两个客人，这个时候工人A 和工人B 都去处理点餐了，这时没人做饭了，饥饿  

> **示例代码**

```java
package com.gyz.demo.n8;

import lombok.extern.slf4j.Slf4j;

import java.util.Arrays;
import java.util.List;
import java.util.Random;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

/**
 *
 * @Author gong_yuzhuo
 * @Version 1.0.0
 */
@Slf4j(topic = "c.TestDeadLock")
public class TestDeadLock {

    static final List<String> MENU = Arrays.asList("地三鲜", "宫保鸡丁", "辣子鸡丁", "烤鸡翅");
    static Random RANDOM = new Random();

    static String cooking() {
        return MENU.get(RANDOM.nextInt(MENU.size()));
    }

    public static void main(String[] args) {
        ExecutorService executorService = Executors.newFixedThreadPool(2);
        executorService.execute(() -> {
            log.debug("处理点餐...");
            Future<String> f = executorService.submit(() -> {
                log.debug("做菜");
                return cooking();
            });
            try {
                log.debug("上菜: {}", f.get());
            } catch (InterruptedException | ExecutionException e) {
                e.printStackTrace();
            }
        });
/*executorService.execute(() -> {
log.debug("处理点餐...");
Future<String> f = executorService.submit(() -> {
log.debug("做菜");
return cooking();
});
try {
log.debug("上菜: {}", f.get());
} catch (InterruptedException | ExecutionException e) {
e.printStackTrace();
}
});*/


    }
}
```

输出  

```
17:21:27.883 c.TestDeadLock [pool-1-thread-1] - 处理点餐...
17:21:27.891 c.TestDeadLock [pool-1-thread-2] - 做菜
17:21:27.891 c.TestDeadLock [pool-1-thread-1] - 上菜: 烤鸡翅
```

当注释取消后，可能的输出  

```
17:08:41.339 c.TestDeadLock [pool-1-thread-2] - 处理点餐...
17:08:41.339 c.TestDeadLock [pool-1-thread-1] - 处理点餐...
```

解决方法可以增加线程池的大小，不过不是根本解决方案，还是前面提到的，不同的任务类型，采用不同的线程池，例如：  

```java
package com.gyz.demo.n8;

import lombok.extern.slf4j.Slf4j;

import java.util.Arrays;
import java.util.List;
import java.util.Random;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

/**
 *
 * @Author gong_yuzhuo
 * @Version 1.0.0
 */
@Slf4j(topic = "c.TestDeadLock")
public class TestDeadLock {

    static final List<String> MENU = Arrays.asList("地三鲜", "宫保鸡丁", "辣子鸡丁", "烤鸡翅");
    static Random RANDOM = new Random();

    static String cooking() {
        return MENU.get(RANDOM.nextInt(MENU.size()));
    }

    public static void main(String[] args) {
        ExecutorService waiterPool = Executors.newFixedThreadPool(1);
        ExecutorService cookPool = Executors.newFixedThreadPool(1);
        waiterPool.execute(() -> {
            log.debug("处理点餐...");
            Future<String> f = cookPool.submit(() -> {
                log.debug("做菜");
                return cooking();
            });
            try {
                log.debug("上菜: {}", f.get());
            } catch (InterruptedException | ExecutionException e) {
                e.printStackTrace();
            }
        });
        waiterPool.execute(() -> {
            log.debug("处理点餐...");
            Future<String> f = cookPool.submit(() -> {
                log.debug("做菜");
                return cooking();
            });
            try {
                log.debug("上菜: {}", f.get());
            } catch (InterruptedException | ExecutionException e) {
                e.printStackTrace();
            }
        });
    }
}
```

输出  

```
17:25:14.626 c.TestDeadLock [pool-1-thread-1] - 处理点餐...
17:25:14.630 c.TestDeadLock [pool-2-thread-1] - 做菜
17:25:14.631 c.TestDeadLock [pool-1-thread-1] - 上菜: 地三鲜
17:25:14.632 c.TestDeadLock [pool-1-thread-1] - 处理点餐...
17:25:14.632 c.TestDeadLock [pool-2-thread-1] - 做菜
17:25:14.632 c.TestDeadLock [pool-1-thread-1] - 上菜: 辣子鸡丁
```

##### 3. 创建多少线程池合适

- 过小会导致程序不能充分地利用系统资源、容易导致饥饿
- 过大会导致更多的线程上下文切换，占用更多内存

> **CPU 密集型运算**  

通常采用 cpu 核数 + 1 能够实现最优的 CPU 利用率，+1 是保证当线程由于页缺失故障（操作系统）或其它原因导致暂停时，额外的这个线程就能顶上去，保证 CPU 时钟周期不被浪费。

> **I/O 密集型运算**   

CPU 不总是处于繁忙状态，例如，当你执行业务计算时，这时候会使用 CPU 资源，但当你执行 I/O 操作时、远程RPC 调用时，包括进行数据库操作时，这时候 CPU 就闲下来了，你可以利用多线程提高它的利用率。  

**经验公式如下**：

`线程数 = 核数 * 期望 CPU 利用率 * 总时间(CPU计算时间+等待时间) / CPU 计算时间  `

例如 4 核 CPU 计算时间是 50% ，其它等待时间是 50%，期望 cpu 被 100% 利用，套用公式  

`4 * 100% * 100% / 50% = 8`

例如 4 核 CPU 计算时间是 10% ，其它等待时间是 90%，期望 cpu 被 100% 利用，套用公式  

`4 * 100% * 100% / 10% = 40  `  

#### 任务调度线程池

在『任务调度线程池』功能加入之前，可以使用 java.util.Timer 来实现定时功能，Timer 的优点在于简单易用，但由于所有任务都是由同一个线程来调度，因此所有任务都是串行执行的，同一时间只能有一个任务在执行，前一个任务的延迟或异常都将会影响到之后的任务。  

```java
    public static void main(String[] args) {
        Timer timer = new Timer();
        TimerTask task1 = new TimerTask() {
            @Override
            public void run() {
                log.debug("task 1");
                sleep(2);
            }
        };
        TimerTask task2 = new TimerTask() {
            @Override
            public void run() {
                log.debug("task 2");
            }
        };
        // 使用 timer 添加两个任务，希望它们都在 1s 后执行
        // 但由于 timer 内只有一个线程来顺序执行队列中的任务，因此『任务1』的延时，影响了『任务2』的执行
        timer.schedule(task1, 1000);
        timer.schedule(task2, 1000);
    }
```

输出  

```
20:46:09.444 c.TestTimer [main] - start...
20:46:10.447 c.TestTimer [Timer-0] - task 1
20:46:12.448 c.TestTimer [Timer-0] - task 2
```

使用 ScheduledExecutorService 改写：  

```java
    public static void main(String[] args) {
        ScheduledExecutorService executor = Executors.newScheduledThreadPool(2);
        // 添加两个任务，希望它们都在 1s 后执行
        executor.schedule(() -> {
            System.out.println("任务1，执行时间：" + new Date());
            try {
                Thread.sleep(2000);
            } catch (InterruptedException e) {
            }
        }, 1000, TimeUnit.MILLISECONDS);
        executor.schedule(() -> {
            System.out.println("任务2，执行时间：" + new Date());
        }, 1000, TimeUnit.MILLISECONDS);
    }
```

输出  

```
任务1，执行时间：Thu Jan 03 12:45:17 CST 2019
任务2，执行时间：Thu Jan 03 12:45:17 CST 2019
```

scheduleAtFixedRate 例子：  

```java
    public static void main(String[] args) {
        ScheduledExecutorService pool = Executors.newScheduledThreadPool(1);
        log.debug("start...");
        pool.scheduleAtFixedRate(() -> {
            log.debug("running...");
        }, 1, 1, TimeUnit.SECONDS);
    }
```

输出  

```
21:45:43.167 c.TestTimer [main] - start...
21:45:44.215 c.TestTimer [pool-1-thread-1] - running...
21:45:45.215 c.TestTimer [pool-1-thread-1] - running...
21:45:46.215 c.TestTimer [pool-1-thread-1] - running...
21:45:47.215 c.TestTimer [pool-1-thread-1] - running...
```

scheduleAtFixedRate 例子（任务执行时间超过了间隔时间）：  

```java
        ScheduledExecutorService pool = Executors.newScheduledThreadPool(1);
        log.debug("start...");
        pool.scheduleAtFixedRate(() -> {
            log.debug("running...");
            sleep(2);
        }, 1, 1, TimeUnit.SECONDS);
```

输出分析：一开始，延时 1s，接下来，由于任务执行时间 > 间隔时间，间隔被『撑』到了 2s  

```
21:44:30.311 c.TestTimer [main] - start...
21:44:31.360 c.TestTimer [pool-1-thread-1] - running...
21:44:33.361 c.TestTimer [pool-1-thread-1] - running...
21:44:35.362 c.TestTimer [pool-1-thread-1] - running...
21:44:37.362 c.TestTimer [pool-1-thread-1] - running...
```

scheduleWithFixedDelay 例子：  

```java
        ScheduledExecutorService pool = Executors.newScheduledThreadPool(1);
        log.debug("start...");
        pool.scheduleWithFixedDelay(() -> {
            log.debug("running...");
            sleep(2);
        }, 1, 1, TimeUnit.SECONDS);
```

输出分析：一开始，延时 1s，scheduleWithFixedDelay 的间隔是 上一个任务结束 <-> 延时 <-> 下一个任务开始 所以间隔都是 3s  

```
21:40:55.078 c.TestTimer [main] - start...
21:40:56.140 c.TestTimer [pool-1-thread-1] - running...
21:40:59.143 c.TestTimer [pool-1-thread-1] - running...
21:41:02.145 c.TestTimer [pool-1-thread-1] - running...
21:41:05.147 c.TestTimer [pool-1-thread-1] - running...
```

> 评价: 整个线程池表现为：线程数固定，任务数多于线程数时，会放入无界队列排队。任务执行完毕，这些线
> 程也不会被释放。用来执行延迟或反复执行的任务 

#### 正确处理执行任务异常

方法1：主动捉异常   

```java
        ExecutorService pool = Executors.newFixedThreadPool(1);
        pool.submit(() -> {
            try {
                log.debug("task1");
                int i = 1 / 0;
            } catch (Exception e) {
                log.error("error:", e);
            }
        });
```

输出  

![image-20220921232919466](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220921232919.png)

方法2：使用 Future  

```java
        ExecutorService pool = Executors.newFixedThreadPool(1);
        Future<Boolean> f = pool.submit(() -> {
            log.debug("task1");
            int i = 1 / 0;
            return true;
        });
        log.debug("result:{}", f.get());
```

输出  

![image-20220921232905827](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220921232906.png)

#### * 应用之定时任务

```java
package cn.itcast.n8;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

public class TestSchedule {

    // 如何让每周四 18:00:00 定时执行任务？
    public static void main(String[] args) {
        //  获取当前时间
        LocalDateTime now = LocalDateTime.now();
        System.out.println(now);
        // 获取周四时间
        LocalDateTime time = now.withHour(18).withMinute(0).withSecond(0).withNano(0).with(DayOfWeek.THURSDAY);
        // 如果 当前时间 > 本周周四，必须找到下周周四
        if(now.compareTo(time) > 0) {
            time = time.plusWeeks(1);
        }
        System.out.println(time);
        // initailDelay 代表当前时间和周四的时间差
        // period 一周的间隔时间
        long initailDelay = Duration.between(now, time).toMillis();
        long period = 1000 * 60 * 60 * 24 * 7;
        ScheduledExecutorService pool = Executors.newScheduledThreadPool(1);
        pool.scheduleAtFixedRate(() -> {
            System.out.println("running...");
        }, initailDelay, period, TimeUnit.MILLISECONDS);
    }
}

```

---

## AQS原理

### **黑马版**

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

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716075918.png" />



### **尚硅谷版**

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

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716075919.png" />



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

<img src="https://img-blog.csdnimg.cn/img_convert/dc2b26211d2bec8e0182f859d9df08e5.png" />

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

***

## ReentrantLock 原理  

类图结构：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716080003.png" />

非公平锁实现原理  

#### 加锁解锁流程

先从构造器开始看，默认为非公平锁实现  :

```java
public ReentrantLock() {
	sync = new NonfairSync();
}
```

NonfairSync 继承自 AQS  ，没有竞争时  ：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716080004.png" />

第一个竞争出现时 ：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716080005.png" />

Thread-1 执行了  

1. CAS 尝试将 state 由 0 改为 1，结果失败
2. 进入 tryAcquire 逻辑，这时 state 已经是1，结果仍然失败
3. 接下来进入 addWaiter 逻辑，构造 Node 队列
   - 图中黄色三角表示该 Node 的 waitStatus 状态，其中 0 为默认正常状态
   - Node 的创建是懒惰的
   - 其中第一个 Node 称为 Dummy（哑元）或哨兵，用来占位，并不关联线程  

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716080006.png" />

当前线程进入 acquireQueued 逻辑  :

1. acquireQueued 会在一个死循环中不断尝试获得锁，失败后进入 park 阻塞

2. 如果自己是紧邻着 head（排第二位），那么再次 tryAcquire 尝试获取锁，当然这时 state 仍为 1，失败

3. 进入 shouldParkAfterFailedAcquire 逻辑，将前驱 node，即 head 的 waitStatus 改为 -1，这次返回 false  

   <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716080007.png" />

4. shouldParkAfterFailedAcquire 执行完毕回到 acquireQueued ，再次 tryAcquire 尝试获取锁，当然这时state 仍为 1，失败  

5. 当再次进入 shouldParkAfterFailedAcquire 时，这时因为其前驱 node 的 waitStatus 已经是 -1，这次返回true  

6. 进入 parkAndCheckInterrupt， Thread-1 park（灰色表示）  

   <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716080008.png" />

再次有多个线程经历上述过程竞争失败，变成这个样子  :

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716080009.png" />

Thread-0 释放锁，进入 tryRelease 流程，如果成功  :

- 设置 exclusiveOwnerThread 为 null  

- state = 0  

  ![image-20210704180856650](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716080010.png)

当前队列不为 null，并且 head 的 waitStatus = -1，进入 unparkSuccessor 流程；
找到队列中离 head 最近的一个 Node（没取消的），unpark 恢复其运行，本例中即为 Thread-1；
回到 Thread-1 的 acquireQueued 流程  ：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716080011.png" />

如果加锁成功（没有竞争），会设置  ：

- exclusiveOwnerThread 为 Thread-1，state = 1
- head 指向刚刚 Thread-1 所在的 Node，该 Node 清空 Thread
- 原本的 head 因为从链表断开，而可被垃圾回收  

如果这时候有其它线程来竞争（非公平的体现），例如这时有 Thread-4 来了  

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716080012.png" />

如果不巧又被 Thread-4 占了先  ：

- Thread-4 被设置为 exclusiveOwnerThread，state = 1
- Thread-1 再次进入 acquireQueued 流程，获取锁失败，重新进入 park 阻塞  



#### 加锁源码  

```java
// Sync 继承自 AQS
static final class NonfairSync extends Sync {
    private static final long serialVersionUID = 7316153563782823691L;

     // 加锁实现
    final void lock() {
        // 首先用 cas 尝试（仅尝试一次）将 state 从 0 改为 1, 如果成功表示获得了独占锁
        if (compareAndSetState(0, 1))
            setExclusiveOwnerThread(Thread.currentThread());
        else
            // 如果尝试失败，进入 ㈠
            acquire(1);
    }

    // ㈠ AQS 继承过来的方法, 方便阅读, 放在此处
    public final void acquire(int arg) {
        // ㈡ tryAcquire
        if (
                !tryAcquire(arg) &&
            	// 当 tryAcquire 返回为 false 时, 先调用 addWaiter ㈣, 接着 acquireQueued ㈤
                 acquireQueued(addWaiter(Node.EXCLUSIVE), arg)
        ) {
            selfInterrupt();
        }
    }

    // ㈡ 进入 ㈢
    protected final boolean tryAcquire(int acquires) {
        return nonfairTryAcquire(acquires);
    }

    // ㈢ Sync 继承过来的方法, 方便阅读, 放在此处
    final boolean nonfairTryAcquire(int acquires) {
        final Thread current = Thread.currentThread();
        int c = getState();
        // 如果还没有获得锁
        if (c == 0) {
            // 尝试用 cas 获得, 这里体现了非公平性: 不去检查 AQS 队列
            if (compareAndSetState(0, acquires)) {
                setExclusiveOwnerThread(current);
                return true;
            }
        }
        // 如果已经获得了锁, 线程还是当前线程, 表示发生了锁重入
        else if (current == getExclusiveOwnerThread()) {
            // state++
            int nextc = c + acquires;
            if (nextc < 0) // overflow
                throw new Error("Maximum lock count exceeded");
            setState(nextc);
            return true;
        }
        // 获取失败, 回到调用处
        return false;
    }

    // ㈣ AQS 继承过来的方法, 方便阅读, 放在此处
    private Node addWaiter(Node mode) {
// 将当前线程关联到一个 Node 对象上, 模式为独占模式，新建的Node的waitstatus默认为0，因为waitstatus是成员变量，默认被初始化为0
        Node node = new Node(Thread.currentThread(), mode);
        // 如果 tail 不为 null, cas 尝试将 Node 对象加入 AQS 队列尾部
        Node pred = tail;
        if (pred != null) {
            node.prev = pred;
            if (compareAndSetTail(pred, node)) {
                // 双向链表
                pred.next = node;
                return node;
            }
        }
        //如果tail为null，尝试将 Node 加入 AQS, 进入 ㈥
        enq(node);
        return node;
    }

    // ㈥ AQS 继承过来的方法, 方便阅读, 放在此处
    private Node enq(final Node node) {
        for (;;) {
            Node t = tail;
            if (t == null) {
                // 还没有, 设置 head 为哨兵节点（不对应线程，状态为 0）
                if (compareAndSetHead(new Node())) {
                    tail = head;
                }
            } else {
                // cas 尝试将 Node 对象加入 AQS 队列尾部
                node.prev = t;
                if (compareAndSetTail(t, node)) {
                    t.next = node;
                    return t;
                }
            }
        }
    }

    // ㈤ AQS 继承过来的方法, 方便阅读, 放在此处
    final boolean acquireQueued(final Node node, int arg) {
        boolean failed = true;
        try {
            boolean interrupted = false;
            for (;;) {
                final Node p = node.predecessor();
                // 上一个节点是 head, 表示轮到自己（当前线程对应的 node）了, 尝试获取
                if (p == head && tryAcquire(arg)) {
                    // 获取成功, 设置自己（当前线程对应的 node）为 head
                    setHead(node);
                    // 上一个节点 help GC
                    p.next = null;
                    failed = false;
                    // 返回中断标记 false
                    return interrupted;
                }
                if (
                    // 判断是否应当 park, 进入 ㈦
                    shouldParkAfterFailedAcquire(p, node) &&
                    // park 等待, 此时 Node 的状态被置为 Node.SIGNAL ㈧
                    parkAndCheckInterrupt()
                ) {
                    interrupted = true;
                }
            }
        } finally {
            if (failed)
                cancelAcquire(node);
        }
    }

    // ㈦ AQS 继承过来的方法, 方便阅读, 放在此处
    private static boolean shouldParkAfterFailedAcquire(Node pred, Node node) {
        // 获取上一个节点的状态
        int ws = pred.waitStatus;
        if (ws == Node.SIGNAL) {
            // 上一个节点都在阻塞, 那么自己也阻塞好了
            return true;
        }
        // > 0 表示取消状态
        if (ws > 0) {
            // 上一个节点取消, 那么重构删除前面所有取消的节点, 返回到外层循环重试
            do {
                node.prev = pred = pred.prev;
            } while (pred.waitStatus > 0);
            pred.next = node;
        } else {
            // 这次还没有阻塞
            // 但下次如果重试不成功, 则需要阻塞，这时需要设置上一个节点状态为 Node.SIGNAL
            compareAndSetWaitStatus(pred, ws, Node.SIGNAL);
        }
        return false;
    }

    // ㈧ 阻塞当前线程
    private final boolean parkAndCheckInterrupt() {
        LockSupport.park(this);
        return Thread.interrupted();
    }
}

```

**注意**:
是否需要 unpark 是由当前节点的前驱节点的 waitStatus == Node.SIGNAL 来决定，而不是本节点的waitStatus 决定  



#### 解锁源码

```java
// Sync 继承自 AQS
static final class NonfairSync extends Sync {
    // 解锁实现
    public void unlock() {
        sync.release(1);
    }

    // AQS 继承过来的方法, 方便阅读, 放在此处
    public final boolean release(int arg) {
        // 尝试释放锁, 进入 ㈠
        if (tryRelease(arg)) {
            // 队列头节点 unpark
            Node h = head;
            if (
                // 队列不为 null
                h != null &&
                // waitStatus == Node.SIGNAL 才需要 unpark
                h.waitStatus != 0
            ) {
                // unpark AQS 中等待的线程, 进入 ㈡
                unparkSuccessor(h);
            }
            return true;
        }
        return false;
    }

    // ㈠ Sync 继承过来的方法, 方便阅读, 放在此处
    protected final boolean tryRelease(int releases) {
        // state--
        int c = getState() - releases;
        if (Thread.currentThread() != getExclusiveOwnerThread())
            throw new IllegalMonitorStateException();
        boolean free = false;
        // 支持锁重入, 只有 state 减为 0, 才释放成功
        if (c == 0) {
            free = true;
            setExclusiveOwnerThread(null);
        }
        setState(c);
        return free;
    }

    // ㈡ AQS 继承过来的方法, 方便阅读, 放在此处
    private void unparkSuccessor(Node node) {
        // 如果状态为 Node.SIGNAL 尝试重置状态为 0, 如果线程获取到了锁那么后来头结点会被抛弃掉
        // 不成功也可以
        int ws = node.waitStatus;
        if (ws < 0) {
            compareAndSetWaitStatus(node, ws, 0);
        }
        // 找到需要 unpark 的节点, 但本节点从 AQS 队列中脱离, 是由唤醒节点完成的
        Node s = node.next;
        // 不考虑已取消的节点, 从 AQS 队列从后至前找到队列最前面需要 unpark 的节点
        if (s == null || s.waitStatus > 0) {
            s = null;
            for (Node t = tail; t != null && t != node; t = t.prev)
                if (t.waitStatus <= 0)
                    s = t;
        }
        if (s != null)
            LockSupport.unpark(s.thread);
    }
}

```



### 可重入原理  

```java
static final class NonfairSync extends Sync {
    // ...

    // Sync 继承过来的方法, 方便阅读, 放在此处
    final boolean nonfairTryAcquire(int acquires) {
        final Thread current = Thread.currentThread();
        int c = getState();
        if (c == 0) {
            if (compareAndSetState(0, acquires)) {
                setExclusiveOwnerThread(current);
                return true;
            }
        }
        // 如果已经获得了锁, 线程还是当前线程, 表示发生了锁重入
        else if (current == getExclusiveOwnerThread()) {
            // state++
            int nextc = c + acquires;
            if (nextc < 0) // overflow
                throw new Error("Maximum lock count exceeded");
            setState(nextc);
            return true;
        }
        return false;
    }

    // Sync 继承过来的方法, 方便阅读, 放在此处
    protected final boolean tryRelease(int releases) {
        // state--
        int c = getState() - releases;
        if (Thread.currentThread() != getExclusiveOwnerThread())
            throw new IllegalMonitorStateException();
        boolean free = false;
        // 支持锁重入, 只有 state 减为 0, 才释放成功
        if (c == 0) {
            free = true;
            setExclusiveOwnerThread(null);
        }
        setState(c);
        return free;
    }
}

```



### 可打断原理

#### 不可打断模式

在此模式下，即使它被打断，仍会驻留在 AQS 队列中，一直要等到获得锁后方能得知自己被打断了。

```java
// Sync 继承自 AQS
static final class NonfairSync extends Sync {
    // ...

    private final boolean parkAndCheckInterrupt() {
        // 如果打断标记已经是 true, 则 park 会失效
        LockSupport.park(this);
        // interrupted 会清除打断标记
        return Thread.interrupted();
    }

    final boolean acquireQueued(final Node node, int arg) {
        boolean failed = true;
        try {
            boolean interrupted = false;
            for (;;) {
                final Node p = node.predecessor();
                if (p == head && tryAcquire(arg)) {
                    setHead(node);
                    p.next = null;
                    failed = false;
                    // 还是需要获得锁后, 才能返回打断状态
                    return interrupted;
                }
                if (
                        shouldParkAfterFailedAcquire(p, node) &&
                                parkAndCheckInterrupt()
                ) {
                    // 如果是因为 interrupt 被唤醒, 返回打断状态为 true
                    interrupted = true;
                }
            }
        } finally {
            if (failed)
                cancelAcquire(node);
        }
    }

    public final void acquire(int arg) {
        if (
                !tryAcquire(arg) &&
                        acquireQueued(addWaiter(Node.EXCLUSIVE), arg)
        ) {
            // 如果打断状态为 true
            selfInterrupt();
        }
    }

    static void selfInterrupt() {
        // 重新产生一次中断，这时候线程是如果正常运行的状态，那么不是出于sleep等状态，interrupt方法就不会报错
        Thread.currentThread().interrupt();
    }
}
}

```



### 可打断模式

```java
static final class NonfairSync extends Sync {
    public final void acquireInterruptibly(int arg) throws InterruptedException {
        if (Thread.interrupted())
            throw new InterruptedException();
        // 如果没有获得到锁, 进入 ㈠
        if (!tryAcquire(arg))
            doAcquireInterruptibly(arg);
    }

    // ㈠ 可打断的获取锁流程
    private void doAcquireInterruptibly(int arg) throws InterruptedException {
        final Node node = addWaiter(Node.EXCLUSIVE);
        boolean failed = true;
        try {
            for (;;) {
                final Node p = node.predecessor();
                if (p == head && tryAcquire(arg)) {
                    setHead(node);
                    p.next = null; // help GC
                    failed = false;
                    return;
                }
                if (shouldParkAfterFailedAcquire(p, node) &&
                        parkAndCheckInterrupt()) {
                    // 在 park 过程中如果被 interrupt 会进入此
                    // 这时候抛出异常, 而不会再次进入 for (;;)
                    throw new InterruptedException();
                }
            }
        } finally {
            if (failed)
                cancelAcquire(node);
        }
    }
}

```



### 公平锁原理

```java
static final class FairSync extends Sync {
    private static final long serialVersionUID = -3000897897090466540L;
    final void lock() {
        acquire(1);
    }

    // AQS 继承过来的方法, 方便阅读, 放在此处
    public final void acquire(int arg) {
        if (
                !tryAcquire(arg) &&
                        acquireQueued(addWaiter(Node.EXCLUSIVE), arg)
        ) {
            selfInterrupt();
        }
    }
    // 与非公平锁主要区别在于 tryAcquire 方法的实现
    protected final boolean tryAcquire(int acquires) {
        final Thread current = Thread.currentThread();
        int c = getState();
        if (c == 0) {
            // 先检查 AQS 队列中是否有前驱节点, 没有才去竞争
            if (!hasQueuedPredecessors() &&
                    compareAndSetState(0, acquires)) {
                setExclusiveOwnerThread(current);
                return true;
            }
        }
        else if (current == getExclusiveOwnerThread()) {
            int nextc = c + acquires;
            if (nextc < 0)
                throw new Error("Maximum lock count exceeded");
            setState(nextc);
            return true;
        }
        return false;
    }

    // ㈠ AQS 继承过来的方法, 方便阅读, 放在此处
    public final boolean hasQueuedPredecessors() {
        Node t = tail;
        Node h = head;
        Node s;
        // h != t 时表示队列中有 Node
        return h != t &&
                (
                        // (s = h.next) == null 表示队列中还有没有老二
                        (s = h.next) == null || // 或者队列中老二线程不是此线程
                                s.thread != Thread.currentThread()
                );
    }
}

```



### 条件变量实现原理  

每个条件变量其实就对应着一个等待队列，其实现类是 ConditionObject  .

#### await 流程  

开始 Thread-0 持有锁，调用 await，进入 ConditionObject 的 addConditionWaiter 流程；
创建新的 Node 状态为 -2（Node.CONDITION），关联 Thread-0，加入等待队列尾部  

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716080013.png" />

接下来进入 AQS 的 fullyRelease 流程，释放同步器上的锁  

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716080014.png" />

unpark AQS 队列中的下一个节点，竞争锁，假设没有其他竞争线程，那么 Thread-1 竞争成功  

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716080015.png" />

park 阻塞 Thread-0  

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716080016.png" />



#### signal 流程  

假设 Thread-1 要来唤醒 Thread-0  

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716080017.png" />

进入 ConditionObject 的 doSignal 流程，取得等待队列中第一个 Node，即 Thread-0 所在 Node  

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716080018.png" />

执行 `transferForSignal` 流程，将该 Node 加入 AQS 队列尾部，将 Thread-0 的 `waitStatus` 改为 0，Thread-3 的
`waitStatus` 改为 -1  

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716080019.png" />

Thread-1 释放锁，进入 unlock 流程，略 !

#### 源码  

```java
public class ConditionObject implements Condition, java.io.Serializable {
    private static final long serialVersionUID = 1173984872572414699L;

    // 第一个等待节点
    private transient Node firstWaiter;

    // 最后一个等待节点
    private transient Node lastWaiter;
    public ConditionObject() { }
    // ㈠ 添加一个 Node 至等待队列
    private Node addConditionWaiter() {
        Node t = lastWaiter;
        // 所有已取消的 Node 从队列链表删除, 见 ㈡
        if (t != null && t.waitStatus != Node.CONDITION) {
            unlinkCancelledWaiters();
            t = lastWaiter;
        }
        // 创建一个关联当前线程的新 Node, 添加至队列尾部
        Node node = new Node(Thread.currentThread(), Node.CONDITION);
        if (t == null)
            firstWaiter = node;
        else
            t.nextWaiter = node;
        lastWaiter = node;
        return node;
    }
    // 唤醒 - 将没取消的第一个节点转移至 AQS 队列
    private void doSignal(Node first) {
        do {
            // 已经是尾节点了
            if ( (firstWaiter = first.nextWaiter) == null) {
                lastWaiter = null;
            }
            first.nextWaiter = null;
        } while (
            // 将等待队列中的 Node 转移至 AQS 队列, 不成功且还有节点则继续循环 ㈢
                !transferForSignal(first) &&
                        // 队列还有节点
                        (first = firstWaiter) != null
        );
    }

    // 外部类方法, 方便阅读, 放在此处
    // ㈢ 如果节点状态是取消, 返回 false 表示转移失败, 否则转移成功
    final boolean transferForSignal(Node node) {
        // 设置当前node状态为0（因为处在队列末尾），如果状态已经不是 Node.CONDITION, 说明被取消了
        if (!compareAndSetWaitStatus(node, Node.CONDITION, 0))
            return false;
        // 加入 AQS 队列尾部
        Node p = enq(node);
        int ws = p.waitStatus;
        if (
            // 插入节点的上一个节点被取消
                ws > 0 ||
                        // 插入节点的上一个节点不能设置状态为 Node.SIGNAL
                        !compareAndSetWaitStatus(p, ws, Node.SIGNAL)
        ) {
            // unpark 取消阻塞, 让线程重新同步状态
            LockSupport.unpark(node.thread);
        }
        return true;
    }
// 全部唤醒 - 等待队列的所有节点转移至 AQS 队列
private void doSignalAll(Node first) {
    lastWaiter = firstWaiter = null;
    do {
        Node next = first.nextWaiter;
        first.nextWaiter = null;
        transferForSignal(first);
        first = next;
    } while (first != null);
}

    // ㈡
    private void unlinkCancelledWaiters() {
        // ...
    }
    // 唤醒 - 必须持有锁才能唤醒, 因此 doSignal 内无需考虑加锁
    public final void signal() {
        // 如果没有持有锁，会抛出异常
        if (!isHeldExclusively())
            throw new IllegalMonitorStateException();
        Node first = firstWaiter;
        if (first != null)
            doSignal(first);
    }
    // 全部唤醒 - 必须持有锁才能唤醒, 因此 doSignalAll 内无需考虑加锁
    public final void signalAll() {
        if (!isHeldExclusively())
            throw new IllegalMonitorStateException();
        Node first = firstWaiter;
        if (first != null)
            doSignalAll(first);
    }
    // 不可打断等待 - 直到被唤醒
    public final void awaitUninterruptibly() {
        // 添加一个 Node 至等待队列, 见 ㈠
        Node node = addConditionWaiter();
        // 释放节点持有的锁, 见 ㈣
        int savedState = fullyRelease(node);
        boolean interrupted = false;
        // 如果该节点还没有转移至 AQS 队列, 阻塞
        while (!isOnSyncQueue(node)) {
            // park 阻塞
            LockSupport.park(this);
            // 如果被打断, 仅设置打断状态
            if (Thread.interrupted())
                interrupted = true;
        }
        // 唤醒后, 尝试竞争锁, 如果失败进入 AQS 队列
        if (acquireQueued(node, savedState) || interrupted)
            selfInterrupt();
    }
    // 外部类方法, 方便阅读, 放在此处
    // ㈣ 因为某线程可能重入，需要将 state 全部释放，获取state，然后把它全部减掉，以全部释放
    final int fullyRelease(Node node) {
        boolean failed = true;
        try {
            int savedState = getState();
            // 唤醒等待队列队列中的下一个节点
            if (release(savedState)) {
                failed = false;
                return savedState;
            } else {
                throw new IllegalMonitorStateException();
            }
        } finally {
            if (failed)
                node.waitStatus = Node.CANCELLED;
        }
    }
    // 打断模式 - 在退出等待时重新设置打断状态
    private static final int REINTERRUPT = 1;
    // 打断模式 - 在退出等待时抛出异常
    private static final int THROW_IE = -1;
    // 判断打断模式
    private int checkInterruptWhileWaiting(Node node) {
        return Thread.interrupted() ?
                (transferAfterCancelledWait(node) ? THROW_IE : REINTERRUPT) :
                0;
    }
    // ㈤ 应用打断模式
    private void reportInterruptAfterWait(int interruptMode)
            throws InterruptedException {
        if (interruptMode == THROW_IE)
            throw new InterruptedException();
        else if (interruptMode == REINTERRUPT)
            selfInterrupt();
    }
    // 等待 - 直到被唤醒或打断
    public final void await() throws InterruptedException {
        if (Thread.interrupted()) {
            throw new InterruptedException();
        }
        // 添加一个 Node 至等待队列, 见 ㈠
        Node node = addConditionWaiter();
        // 释放节点持有的锁
        int savedState = fullyRelease(node);
        int interruptMode = 0;
        // 如果该节点还没有转移至 AQS 队列, 阻塞
        while (!isOnSyncQueue(node)) {
            // park 阻塞              
            LockSupport.park(this);
            // 如果被打断, 退出等待队列
            if ((interruptMode = checkInterruptWhileWaiting(node)) != 0)
                break;
        }
        // 退出等待队列后, 还需要获得 AQS 队列的锁
        if (acquireQueued(node, savedState) && interruptMode != THROW_IE)
            interruptMode = REINTERRUPT;
        // 所有已取消的 Node 从队列链表删除, 见 ㈡
        if (node.nextWaiter != null)
            unlinkCancelledWaiters();
        // 应用打断模式, 见 ㈤
        if (interruptMode != 0)
            reportInterruptAfterWait(interruptMode);
    }
    // 等待 - 直到被唤醒或打断或超时
    public final long awaitNanos(long nanosTimeout) throws InterruptedException {
        if (Thread.interrupted()) {
            throw new InterruptedException();
        }
        // 添加一个 Node 至等待队列, 见 ㈠
        Node node = addConditionWaiter();
        // 释放节点持有的锁
        int savedState = fullyRelease(node);
        // 获得最后期限
        final long deadline = System.nanoTime() + nanosTimeout;
        int interruptMode = 0;
        // 如果该节点还没有转移至 AQS 队列, 阻塞
        while (!isOnSyncQueue(node)) {
            // 已超时, 退出等待队列
            if (nanosTimeout <= 0L) {
                transferAfterCancelledWait(node);
                break;
            }
            // park 阻塞一定时间, spinForTimeoutThreshold 为 1000 ns
            if (nanosTimeout >= spinForTimeoutThreshold)
                LockSupport.parkNanos(this, nanosTimeout);
            // 如果被打断, 退出等待队列
            if ((interruptMode = checkInterruptWhileWaiting(node)) != 0)
                break;
            nanosTimeout = deadline - System.nanoTime();
        }
        // 退出等待队列后, 还需要获得 AQS 队列的锁
        if (acquireQueued(node, savedState) && interruptMode != THROW_IE)
            interruptMode = REINTERRUPT;
        // 所有已取消的 Node 从队列链表删除, 见 ㈡
        if (node.nextWaiter != null)
            unlinkCancelledWaiters();
        // 应用打断模式, 见 ㈤
        if (interruptMode != 0)
            reportInterruptAfterWait(interruptMode);
        return deadline - System.nanoTime();
    }
    // 等待 - 直到被唤醒或打断或超时, 逻辑类似于 awaitNanos
    public final boolean awaitUntil(Date deadline) throws InterruptedException {
        // ...
    }
    // 等待 - 直到被唤醒或打断或超时, 逻辑类似于 awaitNanos
    public final boolean await(long time, TimeUnit unit) throws InterruptedException {
        // ...
    }
    // 工具方法 省略 ...
}

```

---

## todo

- [ ] Tomcat 线程池  
- [ ] Fork/Join  
