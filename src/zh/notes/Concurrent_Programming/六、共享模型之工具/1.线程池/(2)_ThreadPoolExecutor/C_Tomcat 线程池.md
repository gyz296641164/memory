---
title: 04_Tomcat线程池
category:
  - 并发编程
order: 8
date: 2024-02-16
---

<!-- more -->

## Tomcat线程池

### 概述

Tomcat的构成分为俩大组件：连接器Conector(NIO EndPoint)、容器Container

> **Tomcat 在哪里用到了线程池呢?**

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202402/0bad2c25fdb824b4.png)

- LimitLatch：用来限流，可以控制最大连接个数，类似 J.U.C 中的 Semaphore 后面再讲
- Acceptor：只负责【接收新的 socket 连接】
- Poller：只负责监听 socket channel 是否有【可读的 I/O 事件】
- 一旦可读，封装一个任务对象（socketProcessor），提交给 Executor 线程池处理
- Executor 线程池中的工作线程最终负责【处理请求】

Tomcat 线程池扩展了 ThreadPoolExecutor，行为稍有不同。

如果总线程数达到 maximumPoolSize：

- 这时不会立刻抛 RejectedExecutionException 异常
- 而是再次尝试将任务放入队列，如果还失败，才抛出 RejectedExecutionException 异常

**源码 tomcat-7.0.42**

```java
public void execute(Runnable command, long timeout, TimeUnit unit) {
    submittedCount.incrementAndGet();
    try {
        super.execute(command);
    } catch (RejectedExecutionException rx) {
        if (super.getQueue() instanceof TaskQueue) {
            final TaskQueue queue = (TaskQueue)super.getQueue();
            try {
                if (!queue.force(command, timeout, unit)) {
                    submittedCount.decrementAndGet();
                    throw new RejectedExecutionException("Queue capacity is full.");
                }
            } catch (InterruptedException x) {
                submittedCount.decrementAndGet();
                Thread.interrupted();
                throw new RejectedExecutionException(x);
            }
        } else {
            submittedCount.decrementAndGet();
            throw rx;
        }
    }
}
```

**TaskQueue.java**

```java
public boolean force(Runnable o, long timeout, TimeUnit unit) throws InterruptedException {
    if (parent.isShutdown())
        throw new RejectedExecutionException(
                "Executor not running, can't force a command into the queue"
        );
    return super.offer(o, timeout, unit); //forces the item onto the queue, to be used if the task 
    is rejected
}
```

---

### 配置

#### Connector 配置

| 配置项              | 默认值 | 说明                                   |
| ------------------- | ------ | -------------------------------------- |
| acceptorThreadCount | 1      | acceptor 线程数量                      |
| pollerThreadCount   | 1      | poller 线程数量                        |
| minSpareThreads     | 10     | 核心线程数，即 corePoolSize            |
| maxThreads          | 200    | 最大线程数，即 maximumPoolSize         |
| executor            | -      | Executor 名称，用来引用下面的 Executor |

#### Executor线程配置

| 配置项                  | 默认值            | 说明                                      |
| ----------------------- | ----------------- | ----------------------------------------- |
| threadPriority          | 5                 | 线程优先级                                |
| daemon                  | true              | 是否守护线程                              |
| minSpareThreads         | 25                | 核心线程数，即 corePoolSize               |
| maxThreads              | 200               | 最大线程数，即 maximumPoolSize            |
| maxIdleTime             | 60000             | 线程生存时间，单位是毫秒，默认值即 1 分钟 |
| maxQueueSize            | Integer.MAX_VALUE | 队列长度                                  |
| prestartminSpareThreads | false             | 核心线程是否在服务器启动时启动            |

Tomcat线程池相比较普通线程池，对任务的处理方式不同之处在于：

- 普通线程池：当提交任务>最大线程时，执行拒绝策略；
- Tomcat线程池：当提交任务>最大线程时，加入队列等待；

下图为Tomcat线程池对任务的处理。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202402/aa235cbc1762eb15.png)