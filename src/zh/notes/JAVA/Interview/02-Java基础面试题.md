---
title: 02-Java基础面试题
category:
  - JAVA
tag: 
  - JAVA基础面试题
date: 2024-02-15
---

<!-- more -->

# 一、IO和多线程专题

## 1.介绍下进程和线程的关系

**进程**：一个独立的正在执行的程序

**线程**：一个进程的最基本的执行单位，执行路径

![aaa](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202402/f38a99f5aa547bb5.png)

**多进程**：在操作系统中，同时运行多个程序

多进程的好处：可以充分利用CPU，提高CPU的使用率

**多线程：在同一个进程(应用程序)中同时执行多个线程**

多线程的好处：提高进程的执行使用率，提高了CPU的使用率

**注意：**

1. 在同一个时间点一个CPU中只可能有一个线程在执行
2. 多线程不能提高效率、反而会降低效率，但是可以提高CPU的使用率
3. 一个进程如果有多条执行路径，则称为多线程程序
4. Java虚拟机的启动至少开启了两条线程，主线程和垃圾回收线程
5. 一个线程可以理解为进程的子任务

## 2.说说Java中实现多线程的几种方法

Thread对象就是一个线程

创建线程的常用三种方式：

1. 继承Thread类
2. 实现Runnable接口
3. 实现Callable接口（JDK1.5>=）
4. 线程池方式创建

通过继承Thread类或者实现Runnable接口、Callable接口都可以实现多线程，不过实现Runnable接口与实现Callable接口的方式基本相同，**只是Callable接口里定义的方法返回值，可以声明抛出异常而已**。因此将实现Runnable接口和实现Callable接口归为一种方式。这种方式与继承Thread方式之间的主要差别如下。

**继承Thread类**

实现的步骤：

1. 创建Thread类的子类
2. 重写run方法
3. 创建线程对象
4. 启动线程

案例代码

```java
package com.bobo.thread;

public class ThreadDemo02 {

    /**
     * 线程的第一种实现方式
     *     通过创建Thread类的子类来实现
     * @param args
     */
    public static void main(String[] args) {
        System.out.println("main方法执行了1...");
        // Java中的线程 本质上就是一个Thread对象
        Thread t1 = new ThreadTest01();
        // 启动一个新的线程
        t1.start();
        for(int i = 0 ; i< 100 ; i++){
            System.out.println("main方法的循环..."+i);
        }
        System.out.println("main方法执行结束了3...");
    }
}

/**
 * 第一个自定义的线程类
 *    继承Thread父类
 *    重写run方法
 */
class ThreadTest01 extends Thread{
    @Override
    public void run() {
        System.out.println("我们的第一个线程执行了2....");
        for(int i = 0 ; i < 10 ; i ++){
            System.out.println("子线程："+i);
        }
    }
}
```

**注意点：**

1. **启动线程是使用start方法而不是run方法**
2. 线程不能启动多次，如果要创建多个线程，那么就需要创建多个Thread对象

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202402/1ff387b10e2d0776.png)

**实现Runnable接口**

在第一种实现方式中，我们是将线程的创建和线程执行的业务都封装在了Thread对象中，我们可以通过Runable接口来实现线程程序代码和数据有效的分离。

```java
Thread(Runnable target)
// 分配一个新的 Thread对象。
```

实现的步骤：

1. 创建Runable的实现类
2. 重写run方法
3. 创建Runable实例对象(通过实现类来实现)
4. 创建Thread对象，并把第三步的Runable实现作为Thread构造方法的参数
5. 启动线程

```java
package com.bobo.runable;

public class RunableDemo01 {

    /**
     * 线程的第二种方式
     *     本质是创建Thread对象的时候传递了一个Runable接口实现
     * @param args
     */
    public static void main(String[] args) {
        System.out.println("main执行了...");
        // 创建一个新的线程  Thread对象
        Runnable r1 = new RunableTest();
        Thread t1 = new Thread(r1);
        // 启动线程
        t1.start();
        System.out.println("main结束了...");
    }
}

/**
 *   线程的第二种创建方式
 *   创建一个Runable接口的实现类
 */
class RunableTest implements Runnable{

    @Override
    public void run() {
        System.out.println("子线程执行了...");
    }
}
```

实现Runable接口的好处：

1. 可以避免Java单继承带来的局限性
2. 适合多个相同的程序代码处理同一个资源的情况，把线程同程序的代码和数据有效的分离，较好的体现了面向对象的设计思想

**Callable的方式**

前面我们介绍的两种创建线程的方式都是重写run方法，而且run方法是没有返回结果的，也就是main方法是不知道开启的线程什么时候开始执行，什么时候结束执行，也获取不到对应的返回结果。而且run方法也不能把可能产生的异常抛出。在JDK1.5之后推出了通过实现Callable接口的方式来创建新的线程，这种方式可以获取对应的返回结果。

```java
package com.bobo.callable;

import java.util.concurrent.Callable;
import java.util.concurrent.FutureTask;

public class CallableDemo01 {

    /**
     * 创建线程的第三种实现方式：
     *    Callable方式
     */
    public static void main(String[] args) throws  Exception {
        // 创建一个Callable实例
        Callable<Integer> callable = new MyCallable();
        FutureTask<Integer> futureTask = new FutureTask<>(callable);
        // 获取一个线程 肯定是要先创建一个Thread对象  futureTask本质上是Runable接口的实现
        Thread t1 = new Thread(futureTask);
        System.out.println("main方法start....");
        t1.start(); // 本质还是执行的 Runable中的run方法，只是 run方法调用了call方法罢了
        // 获取返回的结果
        System.out.println(futureTask.get()); // 获取开启的线程执行完成后返回的结果
        System.out.println("main方法end ....");

    }
}

/**
 * 创建Callable的实现类
 *    我们需要指定Callable的泛型，这个泛型是返回结果的类型
 */
class MyCallable implements Callable<Integer>{

    /**
     * 线程自动后会执行的方法
     * @return
     * @throws Exception
     */
    @Override
    public Integer call() throws Exception {
        int sum = 0;
        for(int i = 1 ; i <= 100 ; i ++){
            sum += i;
        }
        return sum;
    }
}

```

实现Runnable接口和实现Callable接口的区别:

1. Runnable是自从java1.1就有了，而Callable是1.5之后才加上去的
2. Callable规定的方法是call()，Runnable规定的方法是run()
3. Callable的任务执行后可返回值，而Runnable的任务是不能返回值(是void)
4. call方法可以抛出异常，run方法不可以
5. 运行Callable任务可以拿到一个Future对象，表示异步计算的结果。它提供了检查计算是否完成的方法，以等待计算的完成，并检索计算的结果。通过Future对象可以了解任务执行情况，可取消任务的执行，还可获取执行结果。
6. 加入线程池运行，Runnable使用ExecutorService的execute方法，Callable使用submit方法。

其实Callable接口底层的实现就是对Runable接口实现的封装，线程启动执行的也是Runable接口实现中的run方法，只是在run方法中有调用call方法罢了

## 3.如何停止一个正在运行的线程

**设置标志位**：如果线程的run方法中执行的是一个重复执行的循环，可以提供一个标记来控制循环是否继续

```java
public class FunDemo02 {

    /**
     * 练习2：设计一个线程：运行10秒后被终止(掌握线程的终止方法)
     * @param args
     */
    public static void main(String[] args)  throws Exception{
        MyRunable02 runnable = new MyRunable02();
        new Thread(runnable).start();
        Thread.sleep(10000); // 主线程休眠10秒钟
        runnable.flag = false;
        System.out.println("main、  end ...");
    }
}

class MyRunable02 implements Runnable{

    boolean flag = true;

    @Override
    public void run() {
        while(flag){
            try {
                Thread.sleep(1000);
                System.out.println(new Date());
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
        System.out.println(Thread.currentThread().getName() + " 执行完成");
    }
}
```

**利用中断标志位**： 在线程中有个中断的标志位，默认是false，当我们显示的调用 interrupted方法或者isInterrupted方法是会修改标志位为true。我们可以利用此来中断运行的线程。

```java
package com.bobo.fundemo;

public class FunDemo07 extends Thread{

    public static void main(String[] args) throws InterruptedException {
        Thread t1 = new FunDemo07();
        t1.start();
        Thread.sleep(3000);
        t1.interrupt(); // 中断线程 将中断标志由false修改为了true
        // t1.stop(); // 直接就把线程给kill掉了
        System.out.println("main .... ");
    }

    @Override
    public void run() {
        System.out.println(this.getName() + " start...");
        int i = 0 ;
        // Thread.interrupted() 如果没有被中断 那么是false 如果显示的执行了interrupt 方法就会修改为 true
        while(!Thread.interrupted()){
            System.out.println(this.getName() + " " + i);
            i++;
        }

        System.out.println(this.getName()+ " end .... ");

    }
}

```

**利用InterruptedException：** 如果线程因为执行join()，sleep()或者wait()而进入阻塞状态，此时要想停止它，可以让他调用interrupt()，程序会抛出InterruptedException异常。我们利用这个异常可以来终止线程。

```java
package com.bobo;

public class FunDemo08 extends Thread{

    public static void main(String[] args) throws InterruptedException {
        Thread t1 = new FunDemo08();
        t1.start();
        Thread.sleep(3000);
        t1.interrupt(); // 中断线程 将中断标志由false修改为了true
        // t1.stop(); // 直接就把线程给kill掉了
        System.out.println("main .... ");
    }

    @Override
    public void run() {
        System.out.println(this.getName() + " start...");
        int i = 0 ;
        // Thread.interrupted() 如果没有被中断 那么是false 如果显示的执行了interrupt 方法就会修改为 true
         while(!Thread.interrupted()){
        //while(!Thread.currentThread().isInterrupted()){
             try {
                 Thread.sleep(10000);
             } catch (InterruptedException e) {
                 e.printStackTrace();
				 break;
             }
             System.out.println(this.getName() + " " + i);
            i++;
        }

        System.out.println(this.getName()+ " end .... ");

    }
}

```

## 4.介绍下线程中的常用方法

### 1.start方法

start方法是我们开启一个新的线程的方法，但是并不是直接开启，而是告诉CPU我已经准备好了，快点运行我，这是启动一个线程的唯一入口。

```java
void start()
// 导致此线程开始执行; Java虚拟机调用此线程的run方法。
```

### 2.run方法

线程的线程体，当一个线程开始运行后，执行的就是run方法里面的代码，我们不能直接通过线程对象来调用run方法。因为这并没有产生一个新的线程。仅仅只是一个普通对象的方法调用。

```java
void run()
// 如果这个线程使用单独的Runnable运行对象构造，则调用该Runnable对象的run方法; 否则，此方法不执行任何操作并返回。
```

### 3.getName方法

获取线程名称的方法

```java
String	getName()
//返回此线程的名称。
```

### 4.优先级

我们创建的多个线程的执行顺序是由CPU决定的。Java中提供了一个线程调度器来监控程序中启动后进入就绪状态的所有的线程，优先级高的线程会获取到比较多

**运行机会**

```java
    /**
     * 最小的优先级是 1
     */
    public final static int MIN_PRIORITY = 1;

   /**
     * 默认的优先级都是5
     */
    public final static int NORM_PRIORITY = 5;

    /**
     * 最大的优先级是10
     */
    public final static int MAX_PRIORITY = 10;
```

大家会发现，设置了优先级后输出的结果和我们预期的并不一样，这是为什么呢？优先级在CPU调动线程执行的时候会是一个参考因数，但不是决定因数，

### 5.sleep方法

将当前线程暂定指定的时间，

```java
static void	sleep(long millis)
// 使当前正在执行的线程以指定的毫秒数暂停（暂时停止执行），具体取决于系统定时器和调度程序的精度和准确性。
```

### 6.isAlive

获取线程的状态。

```java
package com.bobo.fundemo;

public class FunDemo04 {

    /**
     * isAlive方法
     * @param args
     */
    public static void main(String[] args) {

        System.out.println("main  start ...");
        Thread t1 = new Thread(new Runnable() {
            @Override
            public void run() {
                System.out.println(Thread.currentThread().getName() + " .... ");
                try {
                    Thread.sleep(100);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        });
        System.out.println("线程的状态："+t1.isAlive());
        t1.start();
        System.out.println("线程的状态："+t1.isAlive());
        System.out.println("main  end ...");
    }
}

```

输出结果

```txt
main  start ...
线程的状态：false
线程的状态：true
main  end ...
Thread-0 .... 
```

### 7.join

调用某线程的该方法，将当前线程和该线程合并，即等待该线程结束，在恢复当前线程的运行

```java
package com.bobo.fundemo;

public class FunDemo05 {

    /**
     * 线程的合并
     *     join方法
     * @param args
     */
    public static void main(String[] args) {
        System.out.println("main  start ...");
        Thread t1 = new Thread(new Runnable() {
            @Override
            public void run() {
                for(int i = 0 ; i < 10; i++){
                    System.out.println(Thread.currentThread().getName() + " 子线程执行了...");
                    try {
                        Thread.sleep(100);
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                }

            }
        });
        t1.start();
        try {
            t1.join(); // 线程的合并，和主线程合并  相当于我们直接调用了run方法
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        System.out.println("main end ...");
    }
}

```

输出结果：

```txt
main  start ...
Thread-0 子线程执行了...
Thread-0 子线程执行了...
Thread-0 子线程执行了...
Thread-0 子线程执行了...
Thread-0 子线程执行了...
Thread-0 子线程执行了...
Thread-0 子线程执行了...
Thread-0 子线程执行了...
Thread-0 子线程执行了...
Thread-0 子线程执行了...
main end ...

```

### 8.yield

让出CPU，当前线程进入就绪状态

```java
package com.bobo.fundemo;

public class FuneDemo06 extends Thread{

    public FuneDemo06(String threadName){
        super(threadName);
    }

    /**
     * yield方法  礼让
     *
     * @param args
     */
    public static void main(String[] args) {
        FuneDemo06 f1 = new FuneDemo06("A1");
        FuneDemo06 f2 = new FuneDemo06("A2");
        FuneDemo06 f3 = new FuneDemo06("A3");

        f1.start();
        f2.start();
        f3.start();
    }

    @Override
    public void run() {
        for(int i = 0 ; i < 100; i ++){
            try {
                Thread.sleep(10);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }

            if(i%10 == 0 && i != 0){
                System.out.println(Thread.currentThread().getName()+" 礼让：" + i);
                Thread.currentThread().yield(); // 让出CPU
            }else{
                System.out.println(this.getName() + ":" + i);
            }
        }
    }
}

```

### 9.wait和notify/notifyAll

阻塞和唤醒的方法，是Object中的方法，我们在数据同步的时候会介绍到

## 5.介绍下线程的生命周期

生命周期：对象从创建到销毁的全过程

线程的生命周期：线程对象(Thread)从开始到销毁的全过程

![image.png](https://fynotefile.oss-cn-zhangjiakou.aliyuncs.com/fynote/fyfile/1462/1675489410098/1980f488416e4f27873341478f928eda.png)

**线程的状态：**

1. 创建Thread对象
2. 就绪状态：执行start方法后线程进入可运行的状态
3. 运行状态：CPU运行
4. 阻塞状态：运行过程中被中断(等待阻塞，对象锁阻塞，其他阻塞)
5. 终止状态：线程执行完成

## 6.为什么wait, notify和notifyAll这些方法不在thread类里面？

明显的原因是JAVA提供的锁是对象级的而不是线程级的，每个对象都有锁，通过线程获得。如果线程需要等待某些锁那么调用对象中的wait()方法就有意义了。如果wait()方法定义在Thread类中，线程正在等待的是哪个锁就不明显了。简单的说，由于wait，notify和notifyAll都是锁级别的操作，所以把他们定义在Object类中因为锁属于对象。

## 7.为什么wait和notify方法要在同步块中调用？

1、只有在调用线程拥有某个对象的独占锁时，才能够调用该对象的wait()，notify()和notifyAll()方法。

2、如果你不这么做，你的代码会抛出IllegalMonitorStateException异常。

3、还有一个原因是为了避免wait和notify之间产生竞态条件。

wait()**方法强制当前线程释放对象锁。这意味着在调用某对象的wait()方法之前，当前线程必须已经获得该对象的锁。因此，线程必须在某个对象的同步方法或同步代码块中才能调用该对象的wait()方法。**

**在调用对象的**notify()和notifyAll()方法之前，调用线程必须已经得到该对象的锁。因此，必须在某个对象的同步方法或同步代码块中才能调用该对象的notify()或notifyAll()方法。

调用wait()方法的原因通常是，调用线程希望某个特殊的状态(或变量)被设置之后再继续执行。调用notify() 或notifyAll()方法的原因通常是，调用线程希望告诉其他等待中的线程："特殊状态已经被设置"。这个状态作为线程间通信的通道，它必须是一个可变的共享状态(或变量)。

## 8.synchronized和ReentrantLock的区别

**相似点**：

这两种同步方式有很多相似之处，它们都是加锁方式同步，而且都是阻塞式的同步，也就是说当如果一个线程获得了对象锁，进入了同步块，其他访问该同步块的线程都必须阻塞在同步块外面等待，而进行线程阻塞和唤醒的代价是比较高的。

**区别**：

这两种方式最大区别就是对于Synchronized来说，它是java语言的关键字，是原生语法层面的互斥，需要jvm实现。而ReentrantLock它是JDK 1.5之后提供的API层面的互斥锁，需要lock()和unlock()方法配合try/finally语句块来完成。

Synchronized进过编译，会在同步块的前后分别形成 **monitorenter** 和 **monitorexit** 这个两个字节码指令。在执行**monitorenter**指令时，首先要尝试获取对象锁。如果这个对象没被锁定，或者当前线程已经拥有了那个对象锁，把锁的计算器加1，相应的，在执行monitorexit指令时会将锁计算器就减1，当计算器为0时，锁就被释放了。如果获取对象锁失败，那当前线程就要阻塞，直到对象锁被另一个线程释放为止。

由于ReentrantLock是`java.util.concurrent`包下提供的一套互斥锁，相比Synchronized，ReentrantLock类提供了一些高级功能，主要有以下3项：

1. 等待可中断，持有锁的线程长期不释放的时候，正在等待的线程可以选择放弃等待，这相当于Synchronized来说可以避免出现死锁的情况。
2. 公平锁，多个线程等待同一个锁时，必须按照申请锁的时间顺序获得锁，Synchronized锁非公平锁，ReentrantLock默认的构造函数是创建的非公平锁，可以通过参数true设为公平锁，但公平锁表现的性能不是很好。
3. 锁绑定多个条件，一个ReentrantLock对象可以同时绑定对个对象。

## 9.什么是线程安全

线程安全就是说多线程访问同一段代码，不会产生不确定的结果。

如果你的代码在多线程下执行和在单线程下执行永远都能获得一样的结果，那么你的代码就是线程安全的。这个问题有值得一提的地方，就是线程安全也是有几个级别的：

1. 不可变
   像String、Integer、Long这些，都是final类型的类，任何一个线程都改变不了它们的值，要改变除非新创建一个，因此这些不可变对象不需要任何同步手段就可以直接在多线程环境下使用
2. 绝对线程安全
   不管运行时环境如何，调用者都不需要额外的同步措施。要做到这一点通常需要付出许多额外的代价，Java中标注自己是线程安全的类，实际上绝大多数都不是线程安全的，不过绝对线程安全的类，Java中也有，比方说CopyOnWriteArrayList、CopyOnWriteArraySet
3. 相对线程安全
   相对线程安全也就是我们通常意义上所说的线程安全，像Vector这种，add、remove方法都是原子操作，不会被打断，但也仅限于此，如果有个线程在遍历某个Vector、有个线程同时在add这个Vector，99%的情况下都会出现ConcurrentModificationException，也就是fail-fast机制。
4. 线程非安全
   这个就没什么好说的了，ArrayList、LinkedList、HashMap等都是线程非安全的类

## 10.Thread类中yield方法的作用

yield方法可以暂停当前正在执行的线程对象，让其它有相同优先级的线程执行。它是一个静态方法而且只保证当前线程放弃CPU占用而不能保证使其它线程一定能占用CPU，执行yield()的线程有可能在进入到暂停状态后马上又被执行。

## 11.常用的线程池有哪些

**new SingleThreadExecutor**：创建一个单线程的线程池，此线程池保证所有任务的执行顺序按照任务的提交顺序执行。

**new FixedThreadPool**：创建固定大小的线程池，每次提交一个任务就创建一个线程，直到线程达到线程池的最大大小。

**new CachedThreadPool**：创建一个可缓存的线程池，此线程池不会对线程池大小做限制，线程池大小完全依赖于操作系统（或者说JVM）能够创建的最大线程大小。

**new ScheduledThreadPool**：创建一个大小无限的线程池，此线程池支持定时以及周期性执行任务的求。

## 12. 简述一下你对线程池的理解

如果问到了这样的问题，可以展开的说一下线程池如何用、线程池的好处、线程池的启动策略。

合理利用线程池能够带来三个好处：

- 第一：降低资源消耗。通过重复利用已创建的线程降低线程创建和销毁造成的消耗。
- 第二：提高响应速度。当任务到达时，任务可以不需要等到线程创建就能立即执行。
- 第三：提高线程的可管理性。线程是稀缺资源，如果无限制的创建，不仅会消耗系统资源，还会降低系统的稳定性，使用线程池可以进行统一的分配，调优和监控。

```java
public ThreadPoolExecutor(int corePoolSize,
                               int maximumPoolSize,
                               long keepAliveTime,
                               TimeUnit unit,
                               BlockingQueue<Runnable> workQueue,
                               RejectedExecutionHandler handler) 
```

参数含义：

- `corePoolSize`：线程池核心线程数量
- `maximumPoolSize`：线程池最大线程数量
- `keepAliverTime`：当活跃线程数大于核心线程数时，空闲的多余线程最大存活时间
- `unit`：存活时间的单位
- `workQueue`：存放任务的队列
- `handler`：超出线程范围和队列容量的任务的处理程序

线程池工作原理：

提交一个任务到线程池中，线程池的处理流程如下：

1. 判断线程池里的核心线程是否都在执行任务，如果不是（核心线程空闲或者还有核心线程没有被创建）则创建一个新的工作线程来执行任务。如果核心线程都在执行任务，则进入下个流程。
2. 线程池判断工作队列是否已满，如果工作队列没有满，则将新提交的任务存储在这个工作队列里。如果工作队列满了，则进入下个流程。
3. 判断线程池里的线程是否都处于工作状态，如果没有，则创建一个新的工作线程来执行任务。如果已经满了，则交给饱和策略来处理这个任务。

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202402/f0ba50a3cc46ebe7.png)

## 13.线程池的拒绝策略有哪些?

主要有4种拒绝策略：

1. AbortPolicy：直接丢弃任务，抛出异常，这是默认策略
2. CallerRunsPolicy：只用调用者所在的线程来处理任务
3. DiscardOldestPolicy：丢弃等待队列中最旧的任务，并执行当前任务
4. DiscardPolicy：直接丢弃任务，也不抛出异常

## 14.线程安全需要保证几个基本特性?

**原子性**，简单说就是相关操作不会中途被其他线程干扰，一般通过同步机制实现。

**可见性**，是一个线程修改了某个共享变量，其状态能够立即被其他线程知晓，通常被解释为将线程本地状态反映到主内存上，volatile就是负责保证可见性的。

**有序性**，是保证线程内串行语义，避免指令重排等。

## 15.说下线程间是如何通信的?

线程之间的通信有两种方式：共享内存和消息传递。

**共享内存**

在共享内存的并发模型里，线程之间共享程序的公共状态，线程之间通过写-读内存中的公共状态来隐式进行通信。典型的共享内存通信方式，就是**通过共享对象进行通信**。

![image.png](https://fynotefile.oss-cn-zhangjiakou.aliyuncs.com/fynote/fyfile/1462/1675489410098/b106c218386d4caa9fd623a7bf3d4ef9.png)

例如线程A与线程B之间如果要通信的话，那么就必须经历下面两个步骤：

1. 线程A把本地内存A更新过得共享变量刷新到主内存中去。
2. 线程B到主内存中去读取线程A之前更新过的共享变量。

**消息传递**

在消息传递的并发模型里，线程之间没有公共状态，线程之间必须通过明确的发送消息来显式进行通信。在Java中典型的消息传递方式，就是wait()和notify()，或者BlockingQueue

## 16.说说ThreadLocal的原理

ThreadLocal可以理解为**线程本地变量**，他会在每个线程都创建一个副本，那么在线程之间访问内部副本变量就行了，做到了线程之间互相隔离，相比于synchronized的做法是用空间来换时间。

ThreadLocal有一个静态内部类ThreadLocalMap，ThreadLocalMap又包含了一个Entry数组，Entry本身是一个弱引用，他的key是指向ThreadLocal的弱引用，Entry具备了保存key value键值对的能力。

弱引用的目的是为了防止内存泄露，如果是强引用那么ThreadLocal对象除非线程结束否则始终无法被回收，弱引用则会在下一次GC的时候被回收。

但是这样还是会存在内存泄露的问题，假如key和ThreadLocal对象被回收之后，entry中就存在key为null，但是value有值的entry对象，但是永远没办法被访问到，同样除非线程结束运行。

但是只要ThreadLocal使用恰当，在使用完之后调用remove方法删除Entry对象，实际上是不会出现这个问题的。

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202402/3ea994148fad035a.png)

## 17.解释下：同步、异步、阻塞、非阻塞

同步和异步指的是：当前线程是否需要等待方法调用执行完毕。

阻塞和非阻塞指的是：当前接口数据还未准备就绪时，线程是否被阻塞挂起

同步&异步其实是处于框架这种高层次维度来看待的，而阻塞&非阻塞往往针对底层的系统调用方面来抉择，也就是说两者是从不同维度来考虑的。

这四个概念两两组合，会形成4个新的概念，如下：

**同步阻塞**：客户端发送请求给服务端，此时服务端处理任务时间很久，则客户端则被服务端堵塞了，所以客户端会一直等待服务端的响应，此时客户端不能做其他任何事，服务端也不会接受其他客户端的请求。这种通信机制比较简单粗暴，但是效率不高。

**同步非阻塞**：客户端发送请求给服务端，此时服务端处理任务时间很久，这个时候虽然客户端会一直等待响应，但是服务端可以处理其他的请求，过一会回来处理原先的。这种方式很高效，一个服务端可以处理很多请求，不会在因为任务没有处理完而堵着，所以这是非阻塞的。

**异步阻塞**：客户端发送请求给服务端，此时服务端处理任务时间很久，但是客户端不会等待服务器响应，它可以做其他的任务，等服务器处理完毕后再把结果响应给客户端，客户端得到回调后再处理服务端的响应。这种方式可以避免客户端一直处于等待的状态，优化了用户体验，其实就是类似于网页里发起的ajax异步请求。

**异步非阻塞**：客户端发送请求给服务端，此时服务端处理任务时间很久，这个时候的任务虽然处理时间会很久，但是客户端可以做其他的任务，因为他是异步的，可以在回调函数里处理响应；同时服务端是非阻塞的，所以服务端可以去处理其他的任务，如此，这个模式就显得非常的高效了。

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202402/d6587aad0e22d7be.png)

## 18.什么是BIO?

**BIO** ： **同步并阻塞** ，服务器实现一个连接一个线程，即客户端有连接请求时服务器端就需要启动一个线程进行处理，没处理完之前此线程不能做其他操作（如果是单线程的情况下，我传输的文件很大呢？），当然可以通过线程池机制改善。

BIO方式 **适用于连接数目比较小且固定的架构** ，这种方式对服务器资源要求比较高，并发局限于应用中JDK1.4以前的唯一选择，但程序直观简单易理解。

## 19.什么是NIO？

**NIO** ： **同步非阻塞** ，服务器实现一个连接一个线程，即客户端发送的连接请求都会注册到多路复用器上，多复用器轮询到连接有I/O请求时才启动一个线程进行处理。

NIO方式 **适用于连接数目多且连接比较短（轻操作）的架构** ，比如聊天服务器，并发局限于应用中，编程比较复杂，JDK1.4之后开始支持。

## 20.什么是AIO？

**AIO** ： **异步非阻塞** ，服务器实现模式为一个有效请求一个线程，客户端的I/O请求都是由操作系统先完成了再通知服务器应用去启动线程进行处理，AIO方式使用于连接数目多且连接比较长（重操作）的架构，比如相册服务器，充分调用操作系统参与并发操作，编程比较复杂，JDK1.7之后开始支持。

AIO属于NIO包中的类实现，其实 **IO主要分为BIO和NIO** ，AIO只是附加品，解决IO不能异步的实现在以前很少有Linux系统支持AIO，Windows的IOCP就是该AIO模型。但是现在的服务器一般都是支持AIO操作

## 21.介绍下IO流的分类

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202402/fa7266119c808a81.png)
