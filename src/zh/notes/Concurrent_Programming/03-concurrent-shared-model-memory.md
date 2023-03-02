---
title: 共享模型之内存
category:
  - 并发编程
order: 3
date: 2023-03-01
---

<!-- more -->

## 1、Java内存模型

[好文推荐](https://zhuanlan.zhihu.com/p/29881777)

JMM 即 Java Memory Model，  它定义了主存、工作内存抽象概念，底层对应着CPU寄存器、缓存、硬件内存、CPU指令优化等。

JMM体现在以下几个方面：

- 原子性 - 保证指令不会受到上下文切换的影响
- 可见性 - 保证指令不会受cpu缓存的影响
- 有序性 - 保证指令不会受 cpu指令并行优化的影响

Java内存模型规定所有的变量都是存在主存当中（类似于前面说的物理内存），每个线程都有自己的工作内存（类似于前面的高速缓存）。线程对变量的所有操作都必须在工作内存中进行，而不能直接对主存进行操作。并且每个线程不能访问其他线程的工作内存。

举个简单的例子：在java中，执行下面这个语句：

```
i = 10;
```

 执行线程必须先在自己的工作线程中对变量i所在的缓存行进行赋值操作，然后再写入主存当中。而不是直接将数值10写入主存当中。



***

## 2、可见性

### 2.1 退不出的循环

先来看一个现象，main 线程对 run 变量的修改对于 t 线程不可见，导致了 t 线程无法停止：  

```java
package com.gyz.demo;

import lombok.extern.slf4j.Slf4j;

import static com.gyz.demo.util.Sleeper.sleep;

/**
 * @Description main 线程对 run 变量的修改对于 t 线程不可见，导致了 t 线程无法停止
 * @Author GongYuZhuo
 * @Date 2021/7/1 23:15
 * @Version 1.0.0
 */
@Slf4j(topic = "c.Test1")
public class Test1 {

    static boolean run = true;

    public static void main(String[] args) {
        Thread t = new Thread(() -> {
            while (run) {
                //...
            }
        });
        
        t.start();
        log.debug("等 1 s");
        sleep(1);
        //线程thread不会按预想的停下来
        run = false;
    }
}
```

输出结果：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716075643.png" />

**为什么呢？分析一下：**  

- 初始状态， t 线程刚开始从主内存读取了 run 的值到工作内存。  

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716075644.png" />

- 因为 t 线程要频繁从主内存中读取 run 的值，JIT 编译器会将 run 的值缓存至自己工作内存中的高速缓存中，减少对主存中 run 的访问，提高效率  

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716075645.png" />

- 1 秒之后，main 线程修改了 run 的值，并同步至主存，而 t 是从自己工作内存中的高速缓存中读取这个变量的值，结果永远是旧值  

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716075646.png" />



### 2.1 解决方法

- 使用`volatile`（易变关键字），它可以用来修饰`成员变量`和`静态成员变量`，它可以避免线程从自己的工作缓存中查找变量的值，必须到主存中获取它的值，**线程操作 volatile 变量都是直接操作主存**。

  ```java
  package com.gyz.demo;
  
  import lombok.extern.slf4j.Slf4j;
  
  import static com.gyz.demo.util.Sleeper.sleep;
  
  /**
   * @Description main 线程对 run 变量的修改对于 t 线程不可见，导致了 t 线程无法停止
   * @Author GongYuZhuo
   * @Date 2021/7/1 23:17
   * @Version 1.0.0
   */
  @Slf4j(topic = "c.Test1")
  public class Test1 {
  
      volatile static boolean run = true;
  
      public static void main(String[] args) {
          Thread thread = new Thread(() -> {
              while (run) {
                  //...
              }
          });
  
          thread.start();
          log.debug("等 1 s");
          sleep(1);
          run = false;
      }
  }
  ```

  

- 使用`synchronized`关键字也有相同的效果,，在`Java内存模型`中，synchronized规定，线程在加锁时， `先清空工作内存 → 在主内存中拷贝最新变量的副本到工作内存 → 执行完代码 → 将更改后的共享变量的值刷新到主内存中 → 释放互斥锁。`

  ```java
  package com.gyz.demo;
  
  import lombok.extern.slf4j.Slf4j;
  
  import static com.gyz.demo.util.Sleeper.sleep;
  
  /**
   * @Description
   * @Author GongYuZhuo
   * @Date 2021/7/1 23:18
   * @Version 1.0.0
   */
  @Slf4j(topic = "c.Test1")
  public class Test1 {
  
      static final Object obj = new Object();
      static boolean run = true;
  
      public static void main(String[] args) {
  
          Thread thread = new Thread(() -> {
              while (true) {
                  synchronized (obj) {
                      if (run) {
                          break;
                      }
                  }
              }
          });
  
          thread.start();
          sleep(1);
          log.debug("停止thread");
          synchronized (obj) {
              run = false;
          }
  
      }
  }
  ```

  

- volatile 可以认为是一个轻量级的锁，被 volatile 修饰的变量，汇编指令会存在于一个"lock"的前缀。在CPU层面与主内存层面，通过缓存一致性协议，**加锁后能够保证写的值同步到主内存，使其他线程能够获得最新的值。**



### 2.3 可见性 vs 原子性  

前面例子体现的实际就是可见性，它保证的是在多个线程之间，一个线程对 volatile 变量的修改对另一个线程可见， 不能保证原子性，**仅用在一个写线程，多个读线程的情况**： 上例从字节码理解是这样的：  

```
getstatic run // 线程 t 获取 run true
getstatic run // 线程 t 获取 run true
getstatic run // 线程 t 获取 run true
getstatic run // 线程 t 获取 run true
putstatic run // 线程 main 修改 run 为 false， 仅此一次
getstatic run // 线程 t 获取 run false
```

比较一下之前我们将线程安全时举的例子：两个线程一个 i++ 一个 i-- ，只能保证看到最新值（可见性），不能解决指令交错  （原子性）

```
// 假设i的初始值为0
getstatic i // 线程2-获取静态变量i的值 线程内i=0
getstatic i // 线程1-获取静态变量i的值 线程内i=0
iconst_1 // 线程1-准备常量1
iadd // 线程1-自增 线程内i=1
putstatic i // 线程1-将修改后的值存入静态变量i 静态变量i=1
iconst_1 // 线程2-准备常量1
isub // 线程2-自减 线程内i=-1
putstatic i // 线程2-将修改后的值存入静态变量i 静态变量i=-1
```

**注意**

- synchronized 语句块既可以保证代码块的原子性，也同时保证代码块内变量的可见性。  但缺点是synchronized 是属于重量级操作，性能相对更低  。

- 如果在前面示例的死循环中加入 System.out.println() 会发现即使不加 volatile 修饰符，线程 t 也能正确看到 对 run 变量的修改了，想一想为什么？

  因为println方法里面有`synchronized`修饰。



### 2.4 终止模式之两阶段终止模式  

#### 2.4.1 概念

顾名思义，就是将终止过程分成两个阶段，其中第一个阶段主要是线程 T1 向线程 T2发送终止指令，而第二阶段则是线程 T2响应终止指令。

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716075647.png" />

1. **错误思路**

   - 使用线程对象的 stop() 方法停止线程

     - stop 方法会真正杀死线程，如果这时线程锁住了共享资源，那么当它被杀死后就再也没有机会释放锁，
       其它线程将永远无法获取锁

   - 使用 System.exit(int) 方法停止线程

     - 目的仅是停止一个线程，但这种做法会让整个程序都停止  

     

2. **两阶段终止模式**  

   <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716075648.png" />

#### 2.4.2 实现

**利用 isInterrupted  实现两阶段终止模式**：

```java
package com.gyz.demo;

import sun.rmi.runtime.Log;

/**
 * @ClassName Test4
 * @Description 利用isInterrupted标记来实现两阶段终止模式
 * @Author GongYuZhuo
 * @Date 2021/7/14 14:24
 */
@Slf4j(topic = "c.Test4")
public class Test4 {
    public static void main(String[] args) throws InterruptedException {
        TPTInterrupt tptInterrupt = new TPTInterrupt();
        tptInterrupt.start();
        Thread.sleep(3500);
        log.info("stop");
        tptInterrupt.stop();
    }
}

@Slf4j(topic = "c.TPTInterrupt")
class TPTInterrupt {
    private Thread thread;

    public void start() {
        thread = new Thread(() -> {
            while (true) {
                Thread current = Thread.currentThread();
                if (current.isInterrupted()) {
                    log.info("料理后事");
                    break;
                }
                try {
                    Thread.sleep(1000);
                    log.info("将结果保存");
                } catch (InterruptedException e) {
                    current.interrupt();
                }
            }

        }, "监控线程");
        thread.start();
    }

    public void stop() {
        thread.interrupt();
    }
}
```

输出结果：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716075649.png" />

**使用volatile关键字来实现两阶段终止模式**：

```java
package com.gyz.demo;

import lombok.extern.slf4j.Slf4j;
import sun.rmi.runtime.Log;

/**
 * @Description 使用 volatile 关键字来实现两阶段终止模式。
 * @Author GongYuZhuo
 * @Date 2021/7/1 23:56
 * @Version 1.0.0
 */
@Slf4j(topic = "c.Test2")
public class Test2 {

    public static void main(String[] args) throws InterruptedException {

        Monitor monitor = new Monitor();
        monitor.start();
        Thread.sleep(3500);
        log.info("stop");
        monitor.stop();

    }
}

@Slf4j(topic = "c.Monitor")
class Monitor {

    Thread monitor;
    /**设置标记，用于判断是否被终止了 */
    private volatile boolean stop = false;

    /**
     * 启动监控器线程
     */
    public void start() {
        // 设置线控器线程，用于监控线程状态
        monitor = new Thread(() -> {
            // 开始不停的监控
            while (true) {
                if (stop) {
                    log.info("料理后事");
                    break;
                }
                try {
                    // 线程休眠
                    Thread.sleep(1000);
                    log.info("将结果保存！");
                } catch (InterruptedException e) {
                }
            }
        }, "监控线程");
        monitor.start();
    }

    /**
     * 用于停止监控器线程
     */
    public void stop() {
        // 修改标记
        stop = true;
        // 打断线程
        monitor.interrupt();
    }
}

```

输出结果：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716075650.png" />

#### 2.5 模式之 Balking（犹豫）

Balking （犹豫）模式用在一个线程发现另一个线程或本线程已经做了某一件相同的事，那么本线程就无需再做 了，直接结束返回，有点类似单例。

- 用一个标记来判断该任务是否已经被执行过了
- 需要避免线程安全问题
- 加锁的代码块要尽量的小，以保证性能

```java
package com.gyz.demo;

import com.gyz.demo.util.Sleeper;
import lombok.extern.slf4j.Slf4j;

/**
 * @Description 模式之 Balking（犹豫）
 * @Author GongYuZhuo
 * @Date 2021/7/2 0:03
 * @Version 1.0.0
 */
@Slf4j(topic = "c.Test2")
public class Test3 {

    public static void main(String[] args) throws InterruptedException {
        Monitor2 monitor = new Monitor2();
        monitor.start();
        monitor.start();
        monitor.start();
        Sleeper.sleep(3.5);
        monitor.stop();
    }
}

@Slf4j(topic = "guizy.Monitor")
class Monitor2 {

    Thread monitor;
    //设置标记，用于判断是否被终止了
    private volatile boolean stop = false;
    //设置标记，用于判断是否已经启动过了
    private boolean starting = false;

    /**
     * 启动监控器线程
     */
    public void start() {
        //上锁，避免多线程运行时出现线程安全问题
        synchronized (this) {
            if (starting) {
                //已被启动，直接返回
                return;
            }
            //启动监视器，改变标记
            starting = true;
        }
        //设置线控器线程，用于监控线程状态
        monitor = new Thread(() -> {
            //开始不停的监控
            while (true) {
                if (stop) {
                    log.debug("处理后续儿事");
                    break;
                }
                log.debug("监控器运行中...");
                try {
                    //线程休眠
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    log.debug("被打断了...");
                }
            }
        });
        monitor.start();
    }

    /**
     * 用于停止监控器线程
     */
    public void stop() {
        //打断线程
        stop = true;
        monitor.interrupt();
    }
}

```



***

## 3、有序性

### 3.1 指令重排

JVM 会在不影响正确性的前提下，可以调整语句的执行顺序，思考下面一段代码  ：

```java
static int i;
static int j;
// 在某个线程内执行如下赋值操作
i = ...;
j = ...;
```

可以看到，至于是先执行 i 还是 先执行 j ，对最终的结果不会产生影响。所以，上面代码真正执行时，既可以是  

```
i = ...;
j = ...;
```

也可以是：

```
j = ...;
i = ...;
```

这种特性称之为『指令重排』，多线程下『指令重排』会影响正确性。



### 3.2 多线程下指令重排问题

> **示例代码**

```java
int num = 0;

// volatile 修饰的变量，可以禁用指令重排。 volatile boolean ready = false; 可以防止变量之前的代码被重排序
boolean ready = false; 
// 线程1 执行此方法
public void actor1(I_Result r) {
	if(ready) {
 		r.r1 = num + num;
    } else {
 		r.r1 = 1;
	}
}

// 线程2 执行此方法
public void actor2(I_Result r) {
	num = 2;
	ready = true;
}

```

输出结果可能有以下几种情况：

1. 线程1先执行，此时ready为false，所以进入else，结果为1；
2. 线程2先执行num=2，但是没来得及执行ready = true；就切换到了线程1，还是进入else，结果为1；
3. 线程2先执行num=2，并且执行了ready = true；此时进入线程1，结果为4；
4. 线程2先执行，但是发生了**指令重排**，`num = 2` 与 `ready = true` 这两行代码语序发生转换，那么执行完线程2的`ready = true`就接着执行线程1，相加结果是0。

**指令重排**，是 JIT 编译器在运行时的一些优化，这个现象需要通过大量测试才能复现：借助 java 并发压测工具  [jcstress](https://wiki.openjdk.java.net/display/CodeTools/jcstress)  查找。



> **测试**

```java
@JCStressTest
@Outcome(id = {"1", "4"}, expect = Expect.ACCEPTABLE, desc = "ok")
@Outcome(id = "0", expect = Expect.ACCEPTABLE_INTERESTING, desc = "!!!!")
@State
public class ConcurrencyTest {
	int num = 0;
	boolean ready = false;
	
	@Actor
	public void actor1(I_Result r) {
		if(ready) {
		r.r1 = num + num;
		} else {
			r.r1 = 1;
		}
	}
	
	@Actor
	public void actor2(I_Result r) {
		num = 2;
		ready = true;
	}
}
```

执行：

```
mvn clean install
java -jar target/jcstress.jar
```

摘录其中一次结果 ：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716075651.png" />

出现为0的次数虽然很少，但是毕竟出现了。



> **解决方法**

volatile 修饰的变量，可以禁用指令重排  。

```java
@JCStressTest
@Outcome(id = {"1", "4"}, expect = Expect.ACCEPTABLE, desc = "ok")
@Outcome(id = "0", expect = Expect.ACCEPTABLE_INTERESTING, desc = "!!!!")
@State
public class ConcurrencyTest {
	int num = 0;
	volatile boolean ready = false;
	
	@Actor
	public void actor1(I_Result r) {
		if(ready) {
		r.r1 = num + num;
		} else {
			r.r1 = 1;
		}
	}
	
	@Actor
	public void actor2(I_Result r) {
		num = 2;
		ready = true;
	}
}
```

结果为：  

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716075652.png" />



***

## 3、volatile

### 3.1 原理

volatile 的底层实现原理是：`内存屏障`，`Memory Barrier（Memory Fence）`和`缓存一致性协议（硬件层面）`

**内存屏障**

- 对volatile变量的`写指令后`会加入`写屏障`（保证写屏障之前的写操作，都能同步到主存中）
- 对volatile变量的`读指令前`会加入`读屏障`（保证读屏障之后的读操作，都能读到主存的数据）

**缓存一致性协议**

最出名的就是Intel 的`MESI协议`，`MESI协议`保证了每个缓存中使用的共享变量的副本是一致的。它核心的思想是：当CPU写数据时，如果发现操作的变量是共享变量，即在其他CPU中也存在该变量的副本，会发出信号通知其他CPU将该变量的缓存行置为无效状态，因此当其他CPU需要读取这个变量时，发现自己缓存中缓存该变量的缓存行是无效的，那么它就会从内存重新读取。

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716075653.png" />

### 3.2 volatile是如何保证可见性

- 写屏障（sfence）保证在该屏障之前对共享变量的改动，都同步到主存当中

  ```java
  public void actor2(I_Result r) {
       num = 2;
       ready = true; // ready是被volatile修饰的 ，赋值带写屏障
       // 写屏障.(在ready=true写指令之后加的, 
       //在该屏障之前对共享变量的改动, 都同步到主存中. 包括num)
  }
  
  ```

- 读屏障（lfence）保证在该屏障之后，对共享变量的读取，加载的是主存中最新数据

  ```java
  public void actor1(I_Result r) {
  	 // 读屏障
  	 //  ready是被volatile修饰的 ，读取值带读屏障
  	 if(ready) {	// ready, 读取的就是主存中的新值
  	 	r.r1 = num + num; // num, 读取的也是主存中的新值
  	 } else {
  	 	r.r1 = 1;
  	 }
  }
  
  ```

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716075654.png" />



### 3.3 volatile是如何保证有序性

- `写屏障`会确保**指令重排序**时，不会将写屏障之前的代码排在写屏障之后（即写屏障之前代码的共享变量的改变都同步到主存）

  ```java
  public void actor2(I_Result r) {
   num = 2;
   ready = true; //  ready是被volatile修饰的 ， 赋值带写屏障
   // 写屏障
  }
  
  ```

- 读屏障会确保指令重排序时，**不会将读屏障之后的代码排在读屏障之前**

  ```java
  public void actor1(I_Result r) {
  	 // 读屏障
  	 //  ready是被volatile修饰的 ，读取值带读屏障
  	 if(ready) {
  	 	r.r1 = num + num;
  	 } else {
  	 	r.r1 = 1;
  	 }
  }
  
  ```

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716075655.png" />



### 3.4 volatile不能解决原子性

- **写屏障仅仅是保证之后的读能够读到最新的结果**，但不能保证其它线程的读, 跑到它前面去

- 有序性的保证也只是保证了本线程内相关代码不被重排序

  下图t2线程, 就先读取了i=0, 此时还是会出现指令交错的现象, 可以使用`synchronized`来解决原子性

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716075656.png" />



### 3.5 double-checked locking (双重检查锁) 问题

- 首先synchronized可以保证它的临界区的资源是 `原子性`、`可见性`、`有序性`的，有序性的前提是，**在synchronized代码块中的共享变量, 不会在代码块外使用到, 否则`有序性`不能被保证**，只能使用`volatile`来保证有序性。

- 下面代码的第二个`双重检查`单例, 就出现了这个问题(在synchronized外使用到了INSTANCE), 此时synchronized就不能防止`指令重排`, 确保不了指令的`有序性`。

- 以著名的`double-checked locking(双重检查锁)` 单例模式为例，这是volatile最常使用的地方

  ```java
  // 最开始的单例模式是这样的
  public final class Singleton {
     
      private Singleton() { }
      private static Singleton INSTANCE = null;
      
       public static Singleton getInstance() {
  	    /*
  	      多线程同时调用getInstance(), 如果不加synchronized锁, 此时两个线程同时
  	      判断INSTANCE为空, 此时都会new Singleton(), 此时就破坏单例了.所以要加锁,
  	      防止多线程操作共享资源,造成的安全问题
  	     */
  	    synchronized(Singleton.class) {
  	    	if (INSTANCE == null) { // t1
  	    		INSTANCE = new Singleton();
  	        }
  	    }
          return INSTANCE;
      }
  }
  
  
  /**
   *	首先上面代码的效率是有问题的, 因为当我们创建了一个单例对象后, 又来一个线程获取到锁了,还是会加锁, 
   *	严重影响性能,再次判断INSTANCE==null吗, 此时肯定不为null, 然后就返回刚才创建的INSTANCE;
   *	这样导致了很多不必要的判断; 
   *
   *	所以要双重检查, 在第一次线程调用getInstance(), 直接在synchronized外,判断instance对象是否存在了,
   *	如果不存在, 才会去获取锁,然后创建单例对象,并返回; 第二个线程调用getInstance(), 会进行
   *	if(instance==null)的判断, 如果已经有单例对象, 此时就不会再去同步块中获取锁了. 提高效率
  */
  public final class Singleton {
      private Singleton() { }
      private static Singleton INSTANCE = null;
      public static Singleton getInstance() {
          if(INSTANCE == null) { // t2
              // 首次访问会同步，而之后的使用没有 synchronized
              synchronized(Singleton.class) { 
                  if (INSTANCE == null) { // t1
                      INSTANCE = new Singleton();
                  }
              }
          }
          return INSTANCE;
      }
  }
  //但是上面的if(INSTANCE == null)判断代码没有在同步代码块synchronized中，
  // 不能享有synchronized保证的原子性、可见性、以及有序性。所以可能会导致"指令重排"
  
  ```

  以上的实现特点是：

  - 懒汉式单例
  - 首次使用getInstance()才使用synchronized加锁，后续使用时无需加锁
  - **注意**：第一个if使用了`INSTANCE`变量，是在同步块之外，这样会导致`synchronized`无法保证指令的`有序性`，此时可能会导致`指令重排`问题

  但在多线程环境下，上面的代码是有问题的，getInstance 方法对应的字节码为：

  ```shell
  0: getstatic #2 // Field INSTANCE:Lcn/itcast/n5/Singleton;
  3: ifnonnull 37 // 判断是否为空
  // ldc是获得类对象
  6: ldc #3 // class cn/itcast/n5/Singleton
  // 复制操作数栈栈顶的值放入栈顶, 将类对象的引用地址复制了一份
  8: dup
  // 操作数栈栈顶的值弹出，即将对象的引用地址存到局部变量表中
  // 将类对象的引用地址存储了一份，是为了将来解锁用
  9: astore_0
  10: monitorenter
  11: getstatic #2 // Field INSTANCE:Lcn/itcast/n5/Singleton;
  14: ifnonnull 27
  // 新建一个实例
  17: new #3 // class cn/itcast/n5/Singleton
  // 复制了一个实例的引用
  20: dup
  // 通过这个复制的引用调用它的构造方法
  21: invokespecial #4 // Method "<init>":()V
  // 最开始的这个引用用来进行赋值操作
  24: putstatic #2 // Field INSTANCE:Lcn/itcast/n5/Singleton;
  27: aload_0
  28: monitorexit
  29: goto 37
  32: astore_1
  33: aload_0
  34: monitorexit
  35: aload_1
  36: athrow
  37: getstatic #2 // Field INSTANCE:Lcn/itcast/n5/Singleton;
  40: areturn
  
  ```

  **其中**

  - 17 表示创建对象，将对象引用入栈 // new Singleton
  - 20 表示复制一份对象引用 // 复制了引用地址, 解锁使用
  - 21 表示利用一个对象引用，调用构造方法 // 根据复制的引用地址调用构造方法
  - 24 表示利用一个对象引用，赋值给 static INSTANCE

- 通过上面的字节码发现, 这一步`INSTANCE = new Singleton();`操作不是一个`原子操作`, 它分为`21, 24两个指令`, 此时可能就会发生`指令重排`的问题

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716075657.png" />

- 关键在于 `0: getstatic` 这行代码在 monitor 控制之外，它就像之前举例中不守规则的人，可以越过 monitor 读取 INSTANCE 变量的值

- 这时 `t1 还未完全将构造方法`执行完毕，如果在构造方法中要执行很多初始化操作，那么 t2 拿到的是将是一个未初始化完毕的单例 **对 INSTANCE 使用 volatile 修饰**即可，可以`禁用指令重排`

- 注意在 JDK 5 以上的版本的 volatile 才会真正有效



### 3.6 double-checked locking 解决指令重排问题

加volatile：

```java
public final class Singleton {
    
    private Singleton() { }
    private static volatile Singleton INSTANCE = null;
    
    public static Singleton getInstance() {
        // 实例没创建，才会进入内部的 synchronized代码块
        if (INSTANCE == null) {
            synchronized (Singleton.class) { // t2
                // 也许有其它线程已经创建实例，所以再判断一次
                if (INSTANCE == null) { // t1
                    INSTANCE = new Singleton();
                }
            }
        }
        return INSTANCE;
    }
}

```

字节码上看不出来 volatile 指令的效果。

```shell
// -------------------------------------> 加入对 INSTANCE 变量的读屏障
0: getstatic #2 // Field INSTANCE:Lcn/itcast/n5/Singleton;
3: ifnonnull 37
6: ldc #3 // class cn/itcast/n5/Singleton
8: dup
9: astore_0
10: monitorenter -----------------------> 保证原子性、可见性
11: getstatic #2 // Field INSTANCE:Lcn/itcast/n5/Singleton;
14: ifnonnull 27
17: new #3 // class cn/itcast/n5/Singleton
20: dup
21: invokespecial #4 // Method "<init>":()V
24: putstatic #2 // Field INSTANCE:Lcn/itcast/n5/Singleton;
// -------------------------------------> 加入对 INSTANCE 变量的写屏障
27: aload_0
28: monitorexit ------------------------> 保证原子性、可见性
29: goto 37
32: astore_1
33: aload_0
34: monitorexit
35: aload_1
36: athrow
37: getstatic #2 // Field INSTANCE:Lcn/itcast/n5/Singleton;
40: areturn

```

如上面的注释内容所示，`读写 volatile 变量操作`（即getstatic操作和putstatic操作）时会加入`内存屏障（Memory Barrier（Memory Fence））`，保证了`可见性`和`有序性`。

加上`volatile`之后, 保证了`指令的有序性`, 不会发生指令重排, 21就不会跑到24之后执行了:

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716075658.png" />



### 3.7 happens-before

`happens-before` 规定了对共享变量的写操作,对其它线程的读操作可见，它是可见性与有序性的一套规则总结。抛开 `happens-before `规则，JMM 并不能保证一个线程对共享变量的写，对于其它线程对该共享变量的读可见。

下面说的变量都是指 `成员变量或静态成员变量`。

1. 线程解锁 m 之前对变量的写，对于接下来对 m 加锁的其它线程对该变量的读可见

   ```java
   	 static int x;
   	 static Object m = new Object();
   	 new Thread(()->{
   	     synchronized(m) {
   	         x = 10;
   	     }
   	 },"t1").start();
   	 new Thread(()->{
   	     synchronized(m) {
   	         System.out.println(x);
   	     }
   	 },"t2").start();
            
   
   ```

2. 线程对 volatile 变量的写，对接下来其它线程对该变量的读可见

   ```java
   volatile static int x;
   
   new Thread(()->{
    	x = 10;
   },"t1").start();
   
   new Thread(()->{
   	System.out.println(x);
   },"t2").start();
   
   ```

3. 线程 start 前对变量的写，对该线程开始后对该变量的读可见

   ```java
   static int x;
   x = 10;
   new Thread(()->{
    System.out.println(x);
   },"t2").start();
   
   ```

4. 线程结束前对变量的写，对其它线程得知它结束后的读可见（比如其它线程调用 t1.isAlive() 或 t1.join()等待它结束）

   ```java
   	static int x;
   
   	Thread t1 = new Thread(()->{
   		x = 10;
   	},"t1");
   
   	t1.start();
   	t1.join();
   	System.out.println(x);
   
   ```

5. 线程 t1 打断 t2（interrupt）前对变量的写，对于其他线程得知 t2 被打断后对变量的读可见（通过 t2.interrupted 或 t2.isInterrupted）

   ```java
   	static int x;
       public static void main(String[] args) {
           Thread t2 = new Thread(()->{
               while(true) {
                   if(Thread.currentThread().isInterrupted()) {
                       System.out.println(x);
                       break;
                   }
               }
           },"t2");
           t2.start();
           new Thread(()->{
               sleep(1);
               x = 10;
               t2.interrupt();
           },"t1").start();
           while(!t2.isInterrupted()) {
               Thread.yield();
           }
           System.out.println(x);
       }
   
   ```

6. 对变量默认值（0，false，null）的写，对其它线程对该变量的读可见

7. 具有传递性，如果 x hb-> y 并且 y hb-> z 那么有 x hb-> z ，配合 volatile 的防指令重排，有下面的例子

   ```java
   	volatile static int x; 
   	static int y; 
   	new Thread(() -> { 
   		y = 10; 
   		x = 20; 
   	},"t1").start(); 
   		new Thread(() -> { 
   		// x=20 对 t2 可见, 同时 y=10 也对 t2 可见 
   		System.out.println(x); 
   	},"t2").start(); 
   
   ```



### 3.8 练习题

#### 3.8.1 balking 模式习题

希望 doInit() 方法仅被调用一次，下面的实现是否有问题，为什么？

```java
public class TestVolatile {
    volatile boolean initialized = false;
    void init() {
        if (initialized) {
            return;
        }
        doInit();
        initialized = true;
    }
    private void doInit() {
    }
} 

```

volatile 可以保存线程的可见性，有序性，但是不能保证原子性，doInit 方法没加锁，可能会被调用多次。



#### 3.8.2 线程安全单例习题

单例模式有很多实现方法，饿汉、懒汉、静态内部类、枚举类，试着分析每种实现下获取单例对象（即调用 getInstance）时的线程安全，并思考注释中的问题：

- 饿汉式：类加载就会导致该单实例对象被创建
- 懒汉式：类加载不会导致该单实例对象被创建，而是首次使用该对象时才会创建  

**实现1： 饿汉式**

```java
// 问题1：为什么加 final，防止子类继承后更改
// 问题2：如果实现了序列化接口, 还要做什么来防止反序列化破坏单例，如果进行反序列化的时候会生成新的对象，这样跟单例模式生成的对象是不同的。要解决直接加上readResolve()方法就行了，如下所示
public final class Singleton implements Serializable {
    // 问题3：为什么设置为私有? 放弃其它类中使用new生成新的实例，是否能防止反射创建新的实例?不能。
    private Singleton() {}
    // 问题4：这样初始化是否能保证单例对象创建时的线程安全?没有，这是类变量，是jvm在类加载阶段就进行了初始化，jvm保证了此操作的线程安全性
    private static final Singleton INSTANCE = new Singleton();
    // 问题5：为什么提供静态方法而不是直接将 INSTANCE 设置为 public, 说出你知道的理由。
    //1.提供更好的封装性；2.提供范型的支持
    public static Singleton getInstance() {
        return INSTANCE;
    }
    public Object readResolve() {
        return INSTANCE;
    }
}

```

- 问题1 : 加final为了防止有子类, 因为子类可以重写父类的方法
- 问题2 : 首先通过反序列化操作, 也是可以创建一个对象的, 破坏了单例, 可以使用readResolve方法并返回instance对象, 当反序列化的时候就会调用自己写的readResolve方法
- 问题3 : 私有化构造器, 防止外部通过构造器来创建对象; 但不能防止反射来创建对象
- 问题4 : 因为单例对象是static的, 静态成员变量的初始化操作是在类加载阶段完成, 由JVM保证其线程安全 (这其实是利用了ClassLoader的线程安全机制。ClassLoader的loadClass方法在加载类的时候使用了synchronized关键字。)
- 问题5 : 通过向外提供公共方法, 体现了更好的封装性, 可以在方法内实现懒加载的单例; 可以提供泛型等
- 补充 : 任何一个readObject方法，不管是显式的还是默认的，它都会返回一个新建的实例，这个新建的实例不同于该类初始化时创建的实例。

**实现2： 饿汉式**

```java
// 问题1：枚举单例是如何限制实例个数的：创建枚举类的时候就已经定义好了，每个枚举常量其实就是枚举类的一个静态成员变量
// 问题2：枚举单例在创建时是否有并发问题：没有，这是静态成员变量
// 问题3：枚举单例能否被反射破坏单例：不能
// 问题4：枚举单例能否被反序列化破坏单例：枚举类默认实现了序列化接口，枚举类已经考虑到此问题，无需担心破坏单例
// 问题5：枚举单例属于懒汉式还是饿汉式：饿汉式
// 问题6：枚举单例如果希望加入一些单例创建时的初始化逻辑该如何做：加构造方法就行了
enum Singleton {
 INSTANCE;
}

```

- 问题1 : 枚举类中, 只有一个INSTANCE, 就确保了它是单例的
- 问题2 : 没有并发问题, 是线程安全的, 因为枚举单例底层是一个静态成员变量, 它是通过类加载器的加载而创建的, 确保了线程安全
- 问题3 : 反射无法破坏枚举单例, 主要通过反射, newInstance的时候, 会在该方法中作判断, 如果检查是枚举类型, 就会抛出异常。
  - if ((this.clazz.getModifiers() & 16384) != 0)
    throw new IllegalArgumentException(“Cannot reflectively create enum objects”);
- 问题4 : 反序列化不能破坏, 枚举类默认也实习了序列号接口. 但枚举类考虑到了这个问题, 不会破坏单例. 通过反序列化得到的并不是同一个单例对象; 除此之外, 还可以写上readResolve方法,
- 问题 5 : 属于饿汉式, 静态成员变量, 通过类加载器的时候就加载了。
- 问题 6 : 加构造方法



**实现3：懒汉式**

```java
public final class Singleton {
    private Singleton() { }
    private static Singleton INSTANCE = null;
    // 分析这里的线程安全, 并说明有什么缺点：synchronized加载静态方法上，可以保证线程安全。缺点就是锁的范围过大，每次访问都会加锁，性能比较低。
    public static synchronized Singleton getInstance() {
        if( INSTANCE != null ){
            return INSTANCE;
        }
        INSTANCE = new Singleton();
        return INSTANCE;
    }
}

```



**实现4：DCL 懒汉式**

```java
public final class Singleton {
    private Singleton() { }
    // 问题1：解释为什么要加 volatile ?为了防止重排序问题
    private static volatile Singleton INSTANCE = null;

    // 问题2：对比实现3, 说出这样做的意义：提高了效率
    public static Singleton getInstance() {
        if (INSTANCE != null) {
            return INSTANCE;
        }
        synchronized (Singleton.class) {
            // 问题3：为什么还要在这里加为空判断, 之前不是判断过了吗？这是为了第一次判断时的并发问题。
            if (INSTANCE != null) { // t2
                return INSTANCE;
            }
            INSTANCE = new Singleton();
            return INSTANCE;
        }
    }
}

```

- 问题1 : 因为在synchronized外部使用到了共享变量INSTANCE, 所以synchronized无法保证instance的有序性, 又因为instance = new Singleton()不是一个原子操作, 可分为多个指令. 此时通过指令重排, 可能会造成INSTANCE还未初始化, 就赋值的现象, 所以要给共享变量INSTANCE加上volatile,禁止指令重排
- 问题2 : 增加了双重判断, 如果存在了单例对象, 别的线程再进来就无需加锁判断, 大大提高性能
- 问题3 : 防止多线程并发导致不安全的问题:防止单例对象被重复创建. 当t1,t2线程都调用getInstance()方法, 它们都判断单例对象为空, 还没有创建;
  - 此时t1先获取到锁对象, 进入到synchronized中, 此时创建对象, 返回单例对象, 释放锁;
  - 这时候t2获得了锁对象, 如果在代码块中没有if判断, 则线程2认为没有单例对象, 因为在代码块外判断的时候就没有, 所以t2就还是会创建单例对象. 此时就重复创建了

**实现5：静态内部类懒汉式**

```java
public final class Singleton {
    private Singleton() { }
    // 问题1：属于懒汉式还是饿汉式：懒汉式，这是一个静态内部类。类加载本身就是懒惰的，在没有调用getInstance方法时是没有执行LazyHolder内部类的类加载操作的。
    private static class LazyHolder {
        static final Singleton INSTANCE = new Singleton();
    }
    // 问题2：在创建时是否有并发问题，这是线程安全的，类加载时，jvm保证类加载操作的线程安全
    public static Singleton getInstance() {
        return LazyHolder.INSTANCE;
    }
}

```

