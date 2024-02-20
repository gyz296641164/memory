## 概念

Fork/Join 是 JDK 1.7 加入的新的线程池实现，它体现的是一种**分治思想**，适用于能够进行任务拆分的 cpu 密集型
运算

所谓的任务拆分，是将一个大任务拆分为算法上相同的小任务，直至不能拆分可以直接求解。跟递归相关的一些计
算，如归并排序、斐波那契数列、都可以用分治思想进行求解

Fork/Join 在分治的基础上加入了多线程，可以把每个任务的分解和合并交给不同的线程来完成，进一步提升了运
算效率

Fork/Join 默认会创建与 cpu 核心数大小相同的线程池

---

## 使用

提交给 Fork/Join 线程池的任务需要继承 RecursiveTask（有返回值）或 RecursiveAction（没有返回值），例如下面定义了一个对 1~n 之间的整数求和的任务

```java
package com.gyz.interview.concurrent.forkandjoin;

import lombok.extern.slf4j.Slf4j;

import java.util.concurrent.ForkJoinPool;
import java.util.concurrent.RecursiveTask;

@Slf4j(topic = "c.AddTask1")
public class AddTask1 extends RecursiveTask<Integer> {

    int n;

    public AddTask1(int n) {
        this.n = n;
    }

    @Override
    public String toString() {
        return "{" + n + '}';
    }

    @Override
    protected Integer compute() {
        // 如果 n 已经为 1，可以求得结果了
        if (n == 1) {
            log.debug("join() {}", n);
            return n;
        }

        // 将任务进行拆分(fork)
        AddTask1 t1 = new AddTask1(n - 1);
        t1.fork();
        log.debug("fork() {} + {}", n, t1);

        // 合并(join)结果
        int result = n + t1.join();
        log.debug("join() {} + {} = {}", n, t1, result);
        return result;
    }

    public static void main(String[] args) {
        //线程池中初始化4个线程
        ForkJoinPool pool = new ForkJoinPool(4);
        System.out.println(pool.invoke(new AddTask1(5)));
    }
}
```

输出结果：

```
11:48:49.768 [ForkJoinPool-1-worker-2] DEBUG c.AddTask - fork() 4 + {3}
11:48:49.768 [ForkJoinPool-1-worker-0] DEBUG c.AddTask - fork() 2 + {1}
11:48:49.768 [ForkJoinPool-1-worker-3] DEBUG c.AddTask - fork() 3 + {2}
11:48:49.768 [ForkJoinPool-1-worker-1] DEBUG c.AddTask - fork() 5 + {4}
11:48:49.775 [ForkJoinPool-1-worker-0] DEBUG c.AddTask - join() 1
11:48:49.775 [ForkJoinPool-1-worker-0] DEBUG c.AddTask - join() 2 + {1} = 3
11:48:49.775 [ForkJoinPool-1-worker-3] DEBUG c.AddTask - join() 3 + {2} = 6
11:48:49.775 [ForkJoinPool-1-worker-2] DEBUG c.AddTask - join() 4 + {3} = 10
11:48:49.775 [ForkJoinPool-1-worker-1] DEBUG c.AddTask - join() 5 + {4} = 15
15
```

用图来表示

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202402/430f3c32ce15c63c.png)

改进：更巧妙的拆分

```java
package com.gyz.interview.concurrent.forkandjoin;

import lombok.extern.slf4j.Slf4j;

import java.util.concurrent.ForkJoinPool;
import java.util.concurrent.RecursiveTask;

@Slf4j(topic = "c.AddTask3")
public class AddTask3 extends RecursiveTask<Integer> {
    int begin;
    int end;

    public AddTask3(int begin, int end) {
        this.begin = begin;
        this.end = end;
    }

    @Override
    public String toString() {
        return "{" + begin + "," + end + '}';
    }

    @Override
    protected Integer compute() {
        // 5, 5
        if (begin == end) {
            log.debug("join() {}", begin);
            return begin;
        }
        // 4, 5
        if (end - begin == 1) {
            log.debug("join() {} + {} = {}", begin, end, end + begin);
            return end + begin;
        }

        // 1 5
        int mid = (end + begin) / 2; // 3
        AddTask3 t1 = new AddTask3(begin, mid); // 1,3
        t1.fork();
        AddTask3 t2 = new AddTask3(mid + 1, end); // 4,5
        t2.fork();
        log.debug("fork() {} + {} = ?", t1, t2);
        int result = t1.join() + t2.join();
        log.debug("join() {} + {} = {}", t1, t2, result);
        return result;
    }

    public static void main(String[] args) {
        ForkJoinPool pool = new ForkJoinPool(4);
        System.out.println(pool.invoke(new AddTask3(1, 5)));
    }
}
```

输出结果：

```
11:52:33.790 [ForkJoinPool-1-worker-3] DEBUG c.AddTask3 - join() 4 + 5 = 9
11:52:33.790 [ForkJoinPool-1-worker-2] DEBUG c.AddTask3 - fork() {1,2} + {3,3} = ?
11:52:33.790 [ForkJoinPool-1-worker-0] DEBUG c.AddTask3 - join() 1 + 2 = 3
11:52:33.795 [ForkJoinPool-1-worker-3] DEBUG c.AddTask3 - join() 3
11:52:33.790 [ForkJoinPool-1-worker-1] DEBUG c.AddTask3 - fork() {1,3} + {4,5} = ?
11:52:33.795 [ForkJoinPool-1-worker-2] DEBUG c.AddTask3 - join() {1,2} + {3,3} = 6
11:52:33.795 [ForkJoinPool-1-worker-1] DEBUG c.AddTask3 - join() {1,3} + {4,5} = 15
15
```

用图来表示

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202402/a77041549f1bae52.png)

