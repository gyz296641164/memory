---
title: 计数器法&滑动时间窗口算法&漏桶算法&令牌桶算法
category:
  - 高可用
date: 2024-04-04
---

<!-- more -->


## 计数器法

计数器法是限流算法里最简单也是最容易实现的一种算法。比如我们规定，对于A接口来说，我们1秒钟的访问次数不能超过100次。那么我们可以这么做：在一开始的时候，我们可以设置一个计数器counter，每当一个请求过来的时候，counter就加1，如果counter的值大于100并且该请求与第一个请求的间隔时间还在1秒钟之内，那么说明请求数过多；如果该请求与第一个请求的间隔时间大于1秒钟，且counter的值还在限流范围内，那么就重置counter。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Interview/202403/202404050142197.png)

```java
public class CounterLimiter implements TrafficCounter {
    private long timeStamp = System.currentTimeMillis();
    private int reqCount; // 请求次数
    private int limitNum = 100; // 每秒限流的最大请求数
    private long interval = 1000L; // 时间窗口时长，单位ms

    /**
     * @return 返回true代表限流，false代表通过
     */
    public synchronized Boolean limit() {
        long now = System.currentTimeMillis();
        if (now < timeStamp + interval) { // 在当前时间窗口内
            // 判断当前时间窗口请求数加1是否超过每秒限流的最大请求数
            if (reqCount + 1 > limitNum) {
                return true;
            }
            reqCount++;
            return false;
        } else { //开启新的时间窗口
            timeStamp = now;
            // 重置计数器
            reqCount = 1;
            return false;
        }
    }
}
```

---

## 滑动时间窗口算法

滑动时间窗口，又称rolling window。为了解决计数器法统计精度太低的问题，引入了滑动窗口算法。下面这张图，很好地解释了滑动窗口算法：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Interview/202403/202404050145464.png)

在上图中，整个红色的矩形框表示一个时间窗口，在我们的例子中，一个时间窗口就是一秒钟。然后我们将时间窗口进行划分，比如图中，我们就将滑动窗口划成了10格，所以每格代表的是100毫秒。每过100毫秒，我们的时间窗口就会往右滑动一格。我们会根据请求发生的时间找到对应的时间窗格，然后在窗格里维护一个计数器counter，并让其加1，比如当一个请求在550毫秒的时候到达，那么500-600毫秒对应窗格里的counter就会加1。

计数器算法其实就是滑动窗口算法。只是它没有对时间窗口做进一步地划分，所以只有1个窗格。

由此可见，当滑动窗口的格子划分的越多，那么滑动窗口的滚动就越平滑，限流的统计就会越精确。

具体算法的伪代码：

```java
package com.gyz.test.testdemo.limit;

import java.util.LinkedList;

/**
 * @description: 滑动时间窗口限流实现
 * * 假设某个服务最多只能每秒钟处理100个请求，我们可以设置一个1秒钟的滑动时间窗口，
 * * 窗口中有10个格子，每个格子100毫秒，每100毫秒移动一次格子，每个格子记录当前100毫秒内的请求次数
 */
public class SlidingTimeWindowLimiter implements TrafficLimiter {
    //服务在最近1秒内的访问次数，可以放在Redis中，实现分布式系统的访问计数
    private int reqCount;
    //使用LinkedList来记录滑动窗口的10个格子。
    private LinkedList<Integer> slots = new LinkedList<>();
    private int limitNum = 100; // 每秒限流的最大请求数
    private long windowLength = 100L; // 滑动时间窗口里的每个格子的时间长度，单位ms
    private int windowNum = 10; // 滑动时间窗口里的格子数量

    /**
     * @return 返回true代表限流，false代表通过
     */
    public synchronized Boolean limit() {
        if (((reqCount + 1)) > limitNum) {
            return true;
        }
        slots.set(slots.size() ‐ 1, slots.peekLast() + 1);
        reqCount++;
        return false;
    }

    public SlidingTimeWindowLimiter() {
        slots.addLast(0);
        new Thread(() ‐ > {
        while (true) {
            try {
                Thread.sleep(windowLength);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            slots.addLast(0);
            if (slots.size() > windowNum) {
                reqCount = reqCount ‐slots.peekFirst();
                slots.removeFirst();
                System.out.println("滑动格子：" + reqCount);
            }
        }}).start();
    }
}
```

---

## 漏桶算法

漏桶算法，又称leaky bucket。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Interview/202403/202404050148259.png)

从图中我们可以看到，整个算法其实十分简单。首先，我们有一个固定容量的桶，有水流进来，也有水流出去。对于流进来的水来说，我们无法预计一共有多少水会流进来，也无法预计水流的速度。但是对于流出去的水来说，这个桶可以固定水流出的速率。而且，当桶满了之后，多余的水将会溢出。

我们将算法中的水换成实际应用中的请求，我们可以看到漏桶算法天生就限制了请求的速度。当使用了漏桶算法，我们可以保证接口会以一个常速速率来处理请求。所以漏桶算法天生不会出现临界问题。

具体的伪代码如下：

```java
public class LeakyBucketLimiter implements TrafficLimiter {
    private long timeStamp = System.currentTimeMillis();
    private long capacity = 100; // 桶的容量
    private long rate = 10; // 水漏出的速度(每秒系统能处理的请求数)
    private long water = 20; // 当前水量(当前累积请求数)

    /**
     * @return 返回true代表限流，false代表通过
     */
    public synchronized Boolean limit() {
        long now = System.currentTimeMillis();
        water = Math.max(0, water ‐ ((now ‐timeStamp) /1000) *rate); // 先执行漏水，计算剩余水量(计算剩余请求次数)
        timeStamp = now;
        if ((water + 1) <= capacity) {
            // 水还未满，加水
            water++;
            System.out.println("加水" + water);
            return false;
        } else {
            // 水满，拒绝加水
            return true;
        }
    }
}
```

---

## 令牌桶算法

令牌桶算法，又称token bucket。同样为了理解该算法，我们来看一下该算法的示意图：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Interview/202403/202404050150591.png)

从图中我们可以看到，令牌桶算法比漏桶算法稍显复杂。首先，我们有一个固定容量的桶，桶里存放着令牌（token）。桶一开始是空的，token以 一个固定的速率r往桶里填充，直到达到桶的容量，多余的令牌将会被丢弃。每当一个请求过来时，就会尝试从桶里移除一个令牌，如果没有令牌的话，请求无法通过。

具体的伪代码如下：

```java
public class TokenBucketLimiter implements TrafficLimiter {
    private long timeStamp = System.currentTimeMillis();
    private long capacity = 100; // 桶的容量
    private long rate = 10; // 令牌放入速度
    private long tokens = 20; // 当前令牌数量

    /**
     * @return 返回true代表限流，false代表通过
     */
    public synchronized Boolean limit() {
        long now = System.currentTimeMillis();
        // 先添加令牌
        tokens = Math.min(capacity, tokens + (now ‐ timeStamp) * rate);
        timeStamp = now;
        if (tokens < 1) {
            // 若不到1个令牌,则拒绝
            return true;
        } else {
            // 还有令牌，领取令牌
            tokens‐‐;
            return false;
        }
    }
}
```

---

## 限流算法小结

### 计数器 VS 滑动窗口

1. 计数器算法是最简单的算法，可以看成是滑动窗口的低精度实现。
2. 滑动窗口由于需要存储多份的计数器（每一个格子存一份），所以滑动窗口在实现上需要更多的存储空间。
3. 也就是说，如果滑动窗口的精度越高，需要的存储空间就越大。

### 漏桶算法 VS 令牌桶算法

1. 漏桶算法和令牌桶算法最明显的区别是令牌桶算法允许流量一定程度的突发。
2. 因为默认的令牌桶算法，取走token是不需要耗费时间的，也就是说，假设桶内有100个token时，那么可以瞬间允许100个请求通过。
3. 当然我们需要具体情况具体分析，只有最合适的算法，没有最优的算法。