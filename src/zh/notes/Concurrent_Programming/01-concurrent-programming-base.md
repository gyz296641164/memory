---
title: Java并发编程基础
category:
  - 并发编程
order: 1
date: 2023-03-01
---

<!-- more -->


# 1、进程与线程  

## 1.1 进程

- 程序由指令和数据组成，但这些指令要运行，数据要读写，就必须将指令加载至 CPU，数据加载至内存。在指令运行过程中还需要用到磁盘、网络等设备。进程就是用来加载指令、管理内存、管理 IO 的。
- 当一个程序被运行，从磁盘加载这个程序的代码至内存，这时就开启了一个进程。
- 进程就可以视为程序的一个实例。大部分程序可以同时运行多个实例进程（例如记事本、画图、浏览器等），也有的程序只能启动一个实例进程（例如网易云音乐、360 安全卫士等）。  

## 1.2 线程

- 一个进程之内可以分为一到多个线程。
- 一个线程就是一个指令流，将指令流中的一条条指令以一定的顺序交给 CPU 执行。
- Java 中，线程作为最小调度单位，进程作为资源分配的最小单位。 在 windows 中进程是不活动的，只是作为线程的容器 。 



## 1.3 线程的生命周期

要想实现多线程，必须在主线程中创建新的线程对象。Java语言使用Thread类及其子类的对象来表示线程，在它的一个完整的生命周期中通常要经历如下的五种状态：

- 新建：当一个Thread类或其子类的对象被声明并创建时，新生的线程对象处于新建状态。
- 就绪：处于新建状态的线程被start()后，将进入线程队列等待CPU时间片，此时它已具备了运行的条件，只是没分配到CPU资源。
- 运行：当就绪的线程被调度并获得CPU资源时,便进入运行状态，run()方法定义了线程的操作和功能。
- 阻塞：在某种特殊情况下，被人为挂起或执行输入输出操作时，让出CPU并临时中止自己的执行，进入阻塞状态。
- 死亡：线程完成了它的全部工作或线程被提前强制性地中止或出现异常导致结束。

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151750217.png" />



***

# 2、线程创建与运行

Java中有三种线程创建方式，分别为实现`Runnable接口的run方法`，`继承Thread类并重写run的方法`，使用`FutureTask`方式。

## 2.1 继承Thread类的方式实现

```java
public class ThreadTest {

    /***
     * @Description 继承Thread方式
     * @param
     * @return
     */
    public static class MyThread extends Thread {
        @Override
        public void run() {
            System.out.println("I am a child Thread");
        }
    }

    public static void main(String[] args) {
        //创建线程
        MyThread myThread = new MyThread();
        //启动线程
        myThread.start();
    }
}
```



需要注意的是，当创建完thread对象后该线程并没有被启动执行，直到调用了start方法后才真正启动了线程。其实调用**start方法**后线程并没有马上执行而是**处于就绪状态**，这个就绪状态是指该线程已经获取了除CPU资源外的其他资源，等待获取CPU资源后才会真正处于运行状态。一旦run方法执行完毕，该线程就处于终止状态。

使用继承方式的好处是:

1. 在run（）方法内获取当前线程直接使用this就可以了，无须使用Thread.currentThread（）方法；
2. 不好的地方是Java不支持多继承，如果继承了Thread类，那么就不能再继承其他类。另外任务与代码没有分离，当多个线程执行一样的任务时需要多份任务代码。



## 2.2 实现Runnable接口的run方法方式

```java
/**
     * @Description 实现Runnable接口方式
     * @param    
     * @return 
     */       
    public static class RunnableTask implements Runnable {
        @Override
        public void run() {
            System.out.println("I am a child Thread");
        }
    }

    public static void main(String[] args) {
        RunnableTask runnableTask = new RunnableTask();
        new Thread(runnableTask).start();
        new Thread(runnableTask).start();
    }
```

如上面代码所示，两个线程共用一个task代码逻辑，如果需要，可以给RunableTask添加参数进行任务区分。另外，RunableTask可以继承其他类。但是上面介绍的两种方式都有一个缺点，就是**任务没有返回值**。



## 2.3 使用FutureTask的方式

```java
 	/**
     * @param
     * @Description 创建任务类，类似Runnable
     * @return
     */
    public static class CallerTask implements Callable<String> {

        @Override
        public String call() throws Exception {
            return "hello";
        }
    }

    public static void main(String[] args) throws InterruptedException {
        //创建异步任务
        FutureTask<String> futureTask = new FutureTask<>(new CallerTask());
        //启动线程
        new Thread(futureTask).start();
        try {
            //等待任务线程执行完毕，返回结果
            String result = futureTask.get();
            System.out.println(result);
        } catch (ExecutionException e) {
            e.printStackTrace();
        }
    }
```

如上代码中的CallerTask类实现了Callable接口的call（）方法。在main函数内首先创建了一个FutrueTask对象（构造函数为CallerTask的实例），然后使用创建的FutrueTask对象作为任务创建了一个线程并且启动它，最后通futureTask.get（）等待任务执行完毕并返回结果。

**小结：**

使用继承方式的好处是方便传参，你可以在子类里面添加成员变量，通过set方法设置参数或者通过构造函数进行传递，而如果使用Runnable方式，则只能使用主线程里面被声明为final的变量。不好的地方是Java不支持多继承，如果继承了Thread类，那么子类不能再继承其他类，而Runable则没有这个限制。前两种方式都没办法拿到任务的返回结果，但是Futuretask方式可以。



***

# 3、查看进程线程的方法  

## 3.1 windows

- 任务管理器可以查看进程和线程数，也可以用来杀死进程
- tasklist 查看进程（信息列太多）
- taskkill 杀死进程（配合jps，taskkill /F /PID 28060）

## 3.2 linux 

- `ps -fe` 查看所有进程
- `ps -fT -p <PID>` 查看某个进程（PID）的所有线程（ps -fe | grep java ，查看有关java的进程）
- `kill` 杀死进程
- `top` 按大写 H 切换是否显示线程
- `top -H -p <PID>` 查看某个进程（PID）的所有线程   

## 3.3 Java

- `jps` 命令查看所有 Java 进程
- `jstack <PID>` 查看某个 Java 进程（PID）的所有线程状态
- `jconsole` 来查看某个 Java 进程中线程的运行情况（图形界面）  

**jconsole 远程监控配置**  

- 需要以如下方式运行你的 java 类  

  ```
  //将注释内容填写自己的信息
  java -Djava.rmi.server.hostname=`ip地址` -Dcom.sun.management.jmxremote -
  Dcom.sun.management.jmxremote.port=`连接端口` -Dcom.sun.management.jmxremote.ssl=是否安全连接 -
  Dcom.sun.management.jmxremote.authenticate=是否认证 java类
  ```

- 修改 /etc/hosts 文件将 127.0.0.1 映射至主机名  

如果要认证访问，还需要做如下步骤  

- 复制 jmxremote.password 文件。
- 修改 jmxremote.password 和 jmxremote.access 文件的权限为 600 即文件所有者可读写。
- 连接时填入 controlRole（用户名），R&D（密码）。



***

# 4、线程运行原理

## 4.1 栈与栈帧  

Java Virtual Machine Stacks （Java 虚拟机栈）  

**栈内存是给谁用的呢？**  

其实就是线程，每个线程启动后，虚拟机会为其分配一块栈内存。

- 每个栈由多个栈帧（Frame）组成，对应着每次方法调用时所占的内存。
- 每个线程只能有一个活动栈帧，对应着当前正在执行的那个方法

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151750219.png" />

## 4.2 线程上下文切换（Thread Context Switch）

因为以下一些原因导致CPU不再执行当前的线程，转而执行另一个线程的代码：

- 线程的cpu时间片用完。
- 垃圾回收。
- 有更高优先级的线程需要执行。
- 线程自己调用了*sleep*、*yield*、*wait*、*join*、*park*、*synchrnized*、*lock*等方法。

当Context Switch发生时，需要由操作系统保存当前线程的状态，并恢复另一个线程的状态，Java中对应的概念就是**程序计数器**（Program Counter Register），它的作用就是**记住下一条jvm指令的执行地址，是线程私有的。**

- 状态包括程序计数器、虚拟机栈中每个栈帧的信息，如*局部变量*、*操作数栈*、*返回地址等*。
- Context Switch频繁发生会影响性能。



***

# 5、常见方法

| 方法名           | static | 功能说明                                                     | 注意                                                         |
| ---------------- | ------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| start()          |        | 启动一个新线程，在新的线程运行run方法中的代码                | start方法只是让线程进入就绪状态，里面代码不一定立刻运行（CPU的时间片还没分给它）。每个线程对象的start方法只能调用一次，如果调用了多次会出现IllegalThreadStateException |
| run()            |        | 新线程启动后会 调用的方法                                    | 如果在构造 Thread 对象时传递了 Runnable 参数，则 线程启动后会调用 Runnable 中的 run 方法，否则默 认不执行任何操作。但可以创建 Thread 的子类对象， 来覆盖默认行为 |
| join()           |        | 等待线程运行结束                                             |                                                              |
| join(long n)     |        | 等待线程运行结 束,最多等待 n 毫秒                            |                                                              |
| getId()          |        | 获取线程长整型 的 id                                         | id 唯一                                                      |
| getName()        |        | 获取线程名                                                   |                                                              |
| setName(String)  |        | 修改线程名                                                   |                                                              |
| getPriority()    |        | 获取线程优先级                                               |                                                              |
| setPriority(int) |        | 修改线程优先级                                               | java中规定线程优先级是1~10 的整数，较大的优先级能提高该线程被 CPU 调度的机率（**线程的优先级只是在说线程获得CPU时间片的概率，不是线程的运行时间**），运行时轮到哪个线程运行，**完全由操作系统决定**！ |
| getState()       |        | 获取线程状态                                                 | Java 中线程状态是用 6 个 enum 表示，分别为： NEW, RUNNABLE, BLOCKED, WAITING, TIMED_WAITING, TERMINATED |
| isInterrupted()  |        | 判断是否被打 断                                              | 不会清除打断标记                                             |
| isAlive()        |        | 线程是否存活 （还没有运行完 毕）                             |                                                              |
| interrupt()      |        | 打断线程                                                     | 如果被打断线程正在 sleep，wait，join 会导致被打断 的线程抛出 InterruptedException，并清除 `打断标记`  ；如果打断的正在运行的线程，则会设置  `打断标记`；park 的线程被打断，也会设置 `打断标记` |
| interrupted()    | static | 判断当前线程是否被打断                                       | 会清除 `打断标记`                                            |
| currentThread()  | static | 获取当前正在执行的线程                                       |                                                              |
| sleep(long n)    | static | 让当前执行的线 程休眠n毫秒， 休眠时让出 cpu 的时间片给其它 线程 |                                                              |
| yield()          | static | 提示线程调度器 让出当前线程对 CPU的使用                      | 主要是为了测试和调试                                         |



## 5.1 start 与 run 

**调用 run**   

```java
public class RunMethodTest {
    public static void main(String[] args) {
        Thread t1 = new Thread("t1") {
            @Override
            public void run() {
                log.debug(Thread.currentThread().getName());
                FileReader.read(Constants.FILE_PATH);
            }
        };
        t1.run();
        log.debug("do other things...");
    }
}
```

输出  

```
19:39:14 [main] c.TestStart - main
19:39:14 [main] c.FileReader - read [1.mp4] start ...
19:39:18 [main] c.FileReader - read [1.mp4] end ... cost: 4227 ms
19:39:18 [main] c.TestStart - do other things ...
```

程序仍在 main 线程运行， FileReader.read() 方法调用还是同步的。



## 5.2 线程通知与等待

### 5.2.1 wait()函数

当一个线程调用一个共享变量的wait（）方法时，该调用线程会被阻塞挂起，直到发生下面几件事情之一才返回：

- 其他线程调用了该共享对象的`notify（）`或者`notifyAll（）`方法；
- 其他线程调用了该线程的`interrupt（）方法`，该线程抛出`InterruptedException`异常返回。

**注意**：如果调用wait（）方法的线程没有事先获取该对象的**监视器锁**，则调用wait（）方法时调用线程会抛出`IllegalMonitorStateException`异常。

> 那么一个线程如何才能获取一个共享变量的监视器锁呢？

1. 执行synchronized同步代码块时，使用该共享变量作为参数。

   ```
   synchronized(共享变量){
   	//dosomething
   }
   ```

2. 调用该共享变量的方法，并且该方法使用了synchronized修饰。

   ```
   synchronized void add(int a,int b){
   	//dosomething
   }
   ```

另外需要注意的是，一个线程可以从挂起状态变为可以运行状态（也就是被唤醒），即使该线程没有被其他线程调用notify（）、notifyAll（）方法进行通知，或者被中断，或者等待超时，这就是所谓的**虚假唤醒**。

虽然虚假唤醒在应用实践中很少发生，但要防患于未然，做法就是不停地去测试该线程被唤醒的条件是否满足，不满足则继续等待，也就是说在一个循环中调用wait（）方法进行防范。退出循环的条件是满足了唤醒该线程的条件。

```
synchronized(obj){
	while(条件不满足){
		obj.wait();
	}
}
```

如上代码是经典的调用共享变量wait（）方法的实例，首先通过同步块获取obj上面的监视器锁，然后在while循环内调用obj的wait（）方法。

> 下面从一个简单的生产者和消费者例子来演示调用共享变量wait（）方法的实例。

如下面代码所示：

- 其中queue为共享变量，生产者线程在调用queue的wait（）方法前，使用synchronized关键字拿到了该共享变量queue的监视器锁，所以调用wait（）方法才不会抛出`IllegalMonitorStateException`异常。
- 如果当前队列没有空闲容量则会调用queued的wait（）方法挂起当前线程，这里使用循环就是为了避免上面说的虚假唤醒问题。假如当前线程被虚假唤醒了，但是队列还是没有空余容量，那么当前线程还是会调用wait（）方法把自己挂起。

```java
        //生产线程
        synchronized (queue) {
            while (queue.size() == MAX_SIZE) {
                try {
                    //挂起当前线程，并释放通过同步块获取的queue上的锁，让消费者线程可以获取锁，然后获取里面的元素
                    queue.wait();
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
            //空闲则生成元素，并通知消费者线程
            queue.add(ele);
            queue.notifyAll();
        }
        //消费者线程
        synchronized (queue){
            while (queue.size()==0){
                try {
                //挂起当前线程，并释放通过同步块获取的queue上的锁，让生产者线程可以获取锁，将生产元素放入队列
                    queue.wait();
                } catch (InterruptedException ex) {
                    ex.printStackTrace();
                }
            }
            //消费元素，并通知生产者线程
            queue.take();
            queue.notifyAll();
        }
    }
```

在如上代码中：

- 假如生产者线程A首先通过synchronized获取到了queue上的锁，那么后续所有企图生产元素的线程和消费线程将会在获取该监视器锁的地方被阻塞挂起。
- 线程A获取锁后发现当前队列已满会调用queue.wait（）方法阻塞自己，然后释放获取的queue上的锁，这里考虑下**为何要释放该锁？**
  - 如果不释放，由于其他生产者线程和所有消费者线程都已经被阻塞挂起，而线程A也被挂起，这就处于了死锁状态。
  - 这里线程A挂起自己后释放共享变量上的锁，就是为了打破死锁必要条件之一的持有并等待原则。线程A释放锁后，其他生产者线程和所有消费者线程中会有一个线程获取queue上的锁进而进入同步块，这就打破了死锁状态。

> 另外需要注意的是，当前线程调用共享变量的**wait（）方法后只会释放当前共享变量上的锁**，如果当前线程还持有其他共享变量的锁，则这些锁是不会被释放的。下面来看一个例子。

```java
package com.gyz.concurrent;


/**
 * @ClassName WaitTest
 * @Description
 * @Author GongYuZhuo
 * @Date 2021/6/17 17:13
 **/
public class WaitTest {
    private static volatile Object resuorceA = new Object();
    private static volatile Object resuorceB = new Object();

    public static void main(String[] args) throws InterruptedException {
        //创建线程A
        Thread threadA = new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    //获取resuorceA共享资源的锁
                    synchronized (resuorceA) {
                        System.out.println("threadA get resuorceA lock");
                        //获取resuorceB共享资源的锁
                        synchronized (resuorceB) {
                            System.out.println("threadA get resuorceB lock");
                            //线程A阻塞，释放resuorceA共享资源的锁
                            System.out.println("threadA release resuorceA lock");
                            resuorceA.wait();
                        }
                    }
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        });

        //创建线程B
        Thread threadB = new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    Thread.sleep(1000);
                    //获取resuorceA共享资源的锁
                    synchronized (resuorceA) {
                        System.out.println("threadB  get resuorceA lock");
                        System.out.println("threadB try get resuorceB lock");
                        synchronized (resuorceB) {
                            System.out.println("threadB get resuorceB lock");
                            //线程B阻塞，释放A锁
                            System.out.println("threadB release resuorceA lock");
                            resuorceB.wait();
                        }
                    }
                }catch (InterruptedException ex){
                    ex.printStackTrace();
                }
            }
        });

        //启动两个线程
        threadA.start();
        threadB.start();
        //等待线程结束
        threadA.join();
        threadB.join();
        System.out.println("main over");
    }
}

```

运行结果：

```
threadA get resuorceA lock
threadA get resuorceB lock
threadA release resuorceA lock
threadB  get resuorceA lock
threadB try get resuorceB lock
```

- 如上代码中，在main函数里面启动了线程A和线程B，为了让线程A先获取到锁，这里让线程B先休眠了1s，线程A先后获取到共享变量resourceA和共享变量resourceB上的锁，然后调用了resourceA的wait（）方法阻塞自己，阻塞自己后线程A释放掉获取的resourceA上的锁。
- 线程B休眠结束后会首先尝试获取resourceA上的锁，如果当时线程A还没有调用wait（）方法释放该锁，那么线程B会被阻塞，当线程A释放了resourceA上的锁后，线程B就会获取到resourceA上的锁，然后尝试获取resourceB上的锁。由于线程A调用的是resourceA上的wait（）方法，所以线程A挂起自己后并没有释放获取到的resourceB上的锁，所以线程B尝试获取resourceB上的锁时会被阻塞。
- 这就证明了当线程调用共享对象的wait（）方法时，当前线程只会释放当前共享对象的锁，当前线程持有的其他共享对象的监视器锁并不会被释放。

> 当一个线程调用共享对象的wait（）方法被阻塞挂起后，如果其他线程中断了该线程，则该线程会抛出InterruptedException异常并返回。

```java
package com.gyz.concurrent;

/**
 * @ClassName WaitNotifyInterrupt
 * @Description 当一个线程调用共享对象的wait（）方法被阻塞挂起后，如果其他线程中断了该线程，
 *              则该线程会抛出InterruptedException异常并返回。
 * @Author GongYuZhuo
 * @Date 2021/6/17 17:59
 **/
public class WaitNotifyInterrupt {
    private static volatile Object obj = new Object();

    public static void main(String[] args) throws InterruptedException {
        //创建线程
        Thread thread = new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    System.out.println("------------begin-----------");
                    synchronized (obj) {
                        //阻塞线程
                        obj.wait();
                        System.out.println("-----------end-----------");
                    }
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        });
        thread.start();
        Thread.sleep(1000);
        System.out.println("----begin interrupt thread -----");
        thread.interrupt();
        System.out.println("----end interrupt thread-----");
    }
}

```

运行结果：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151750220.png" />

在如上代码中，threadA调用共享对象obj的wait（）方法后阻塞挂起了自己，然后主线程在休眠1s后中断了threadA线程，中断后threadA在obj.wait（）处抛出java.lang.InterruptedException异常而返回并终止。



### 5.2.2 wait(long timeout)函数

该方法相比wait（）方法多了一个超时参数，它的不同之处在于：

- 如果一个线程调用共享对象的该方法挂起后，没有在指定的`timeout ms`时间内被其他线程调用该共享变量的notify（）或者notifyAll（）方法唤醒，那么该函数还是会因为超时而返回。
- **如果将timeout设置为0则和wait方法效果一样**，因为在wait方法内部就是调用了wait（0）。需要注意的是，**如果在调用该函数时，传递了一个负的timeout则会抛出IllegalArgumentException异常**。



### 5.2.3 wait(long timeout, int nanos) 函数

在其内部调用的是wait（long timeout）函数，如下代码只有在nanos>0时才使参数timeout递增1。

```java
public final void wait(long timeout, int nanos) throws InterruptedException {
        if (timeout < 0) {
            throw new IllegalArgumentException("timeout value is negative");
        }

        if (nanos < 0 || nanos > 999999) {
            throw new IllegalArgumentException(
                                "nanosecond timeout value out of range");
        }

        if (nanos > 0) {
            timeout++;
        }

        wait(timeout);
    }
```



### 5.2.4 notify() 函数

**概述**

- 一个线程调用共享对象的notify（）方法后，会唤醒一个在该共享变量上调用wait系列方法后被挂起的线程。一个共享变量上可能会有多个线程在等待，**具体唤醒哪个等待的线程是随机的**。

- 此外，**被唤醒的线程不能马上从wait方法返回并继续执行**，它必须**在获取了共享对象的监视器锁后才可以返回**，也就是唤醒它的线程释放了共享变量上的监视器锁后，被唤醒的线程也不一定会获取到共享对象的监视器锁，这是因为该线程还需要和其他线程一起竞争该锁，只有该线程竞争到了共享变量的监视器锁后才可以继续执行。

- 类似wait系列方法，**只有当前线程获取到了共享变量的监视器锁后，才可以调用共享变量的notify（）方法**，否则会抛出IllegalMonitorStateException异常。



### 5.2.5 notifyAll() 函数

不同于在共享变量上调用notify（）函数会唤醒被阻塞到该共享变量上的一个线程，**notifyAll（）方法则会唤醒所有在该共享变量上由于调用wait系列方法而被挂起的线程**。

用如下代码来说明notify（）和notifyAll（）方法的具体含义及一些需要注意的地方：

```java
package com.gyz.concurrent;

/**
 * @ClassName NotifyAllTest
 * @Description 测试 notifyAll与notify 不同用法
 * @Author GongYuZhuo
 * @Date 2021/6/17 18:18
 **/
public class NotifyAllTest {
    /**创建资源*/
    private static volatile Object resourceA = new Object();

    public static void main(String[] args) throws InterruptedException {

        //创建线程A
        Thread threadA = new Thread(new Runnable() {
            @Override
            public void run() {
                synchronized (resourceA) {
                    System.out.println("threadA get resourceA lock");
                    try {
                        System.out.println("threadA start wait");
                        resourceA.wait();
                        System.out.println("threadA end wait");
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                }
            }
        });

        //创建线程B
        Thread threadB = new Thread(new Runnable() {
            @Override
            public void run() {
                synchronized (resourceA) {
                    System.out.println("threadB get resourceA lock");
                    try {
                        System.out.println("threadB start wait");
                        resourceA.wait();
                        System.out.println("threadB end wait");
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                }
            }
        });

        //创建线程C
        Thread threadC = new Thread(new Runnable() {
            @Override
            public void run() {
                synchronized (resourceA) {
                    System.out.println("threadC begin notify");
                    resourceA.notify();
                }
            }
        });

        //开始线程
        threadA.start();
        threadB.start();
        Thread.sleep(1000);
        threadC.start();

        //等待线程结束
        threadA.join();
        threadB.join();
        threadC.join();
        System.out.println("main over");
    }
}

```

运行结果：

```
threadA get resourceA lock
threadA start wait
threadB get resourceA lock
threadB start wait
threadC begin notify
threadA end wait
```

- 如上代码开启了三个线程，其中线程A和线程B分别调用了共享资源resourceA的wait（）方法，线程C则调用了nofity（）方法。这里启动线程C前首先调用sleep方法让主线程休眠1s，这样做的目的是让线程A和线程B全部执行到调用wait方法后再调用线程C的notify方法。这个例子试图在线程A和线程B都因调用共享资源resourceA的wait（）方法而被阻塞后，让线程C再调用resourceA的notify（）方法，从而唤醒线程A和线程B。但是从执行结果来看，只有一个线程A被唤醒，线程B没有被唤醒；

- 从输出结果可知线程调度器这次先调度了线程A占用CPU来运行，线程A首先获取resourceA上面的锁，然后调用resourceA的wait（）方法挂起当前线程并释放获取到的锁，然后线程B获取到resourceA上的锁并调用resourceA的wait（）方法，此时线程B也被阻塞挂起并释放了resourceA上的锁，到这里线程A和线程B都被放到了resourceA的阻塞集合里面。线程C休眠结束后在共享资源resourceA上调用了notify（）方法，这会激活resourceA的阻塞集合里面的一个线程，这里激活了线程A，所以线程A调用的wait（）方法返回了，线程A执行完毕。而线程B还处于阻塞状态。如果把线程C调用的notify（）方法改为调用notifyAll（）方法，则执行结果如下：

  - ```
    threadA get resourceA lock
    threadA start wait
    threadB get resourceA lock
    threadB start wait
    threadC begin notify
    threadB end wait
    threadA end wait
    main over
    ```

  - 从输入结果可知线程A和线程B被挂起后，线程C调用notifyAll（）方法会唤醒resourceA的等待集合里面的所有线程，这里线程A和线程B都会被唤醒，只是线程B先获取到resourceA上的锁，然后从wait（）方法返回。线程B执行完毕后，线程A又获取了resourceA上的锁，然后从wait（）方法返回。线程A执行完毕后，主线程返回，然后打印输出。

  - 一个需要注意的地方是，在共享变量上调用notifyAll（）方法**只会唤醒调用这个方法前调用了wait系列函数**而被放入共享变量等待集合里面的线程。如果**调用notifyAll（）方法后一个线程调用了该共享变量的wait（）方法而被放入阻塞集合，则该线程是不会被唤醒的**。尝试把主线程里面休眠1s的代码注释掉，再运行程序会有一定概率输出下面的结果。

    ```
    threadA get resourceA lock
    threadA start wait
    threadC begin notify
    threadB get resourceA lock
    threadB start wait
    threadA end wait
    ```

    也就是在线程B调用共享变量的wait（）方法前线程C调用了共享变量的notifyAll方法，这样，只有线程A被唤醒，而线程B并没有被唤醒，还是处于阻塞状态。



## 5.3 等待线程执行终止的join方法

### 5.3.1 概述

在项目实践中经常会遇到一个场景，就是**需要等待某几件事情完成后才能继续往下执行**，比如多个线程加载资源，需要等待多个线程全部加载完毕再汇总处理。Thread类中有一个join方法就可以做这个事情。join方法则是Thread类直接提供的。join是无参且返回值为void的方法。

```java
 public final void join() throws InterruptedException {
        join(0);
    }
```

### 5.3.2 join方法示例

```java
package com.gyz.concurrent;

/**
 * @ClassName JoinTest1
 * @Description join() ：等待线程执行完毕。用法如下：
 * @Author GongYuZhuo
 * @Date 2021/6/18 14:25
 **/
public class JoinTest1 {
    public static void main(String[] args) throws InterruptedException {

        Thread threadOne = new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
                System.out.println("threadOne over！");
            }
        });

        Thread threadTwo = new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException ex) {
                    ex.printStackTrace();
                }
                System.out.println("threadTwo over！");
            }
        });

        threadOne.start();
        threadTwo.start();
        System.out.println("wait all thread over");
        //等待所有线程执行完毕
        threadOne.join();
        threadTwo.join();
        System.out.println("all thread over");
    }
}

```

如上代码在主线程里面启动了两个子线程，然后分别调用了它们的join（）方法，那么主线程首先会在调用`threadOne.join（）`方法后被阻塞，等待threadOne执行完毕后返回。threadOne执行完毕后`threadOne.join（）`就会返回，然后主线程调用`threadTwo.join（）`方法后再次被阻塞，等待threadTwo执行完毕后返回。这里只是为了演示join方法的作用，在这种情况下使用后面会讲到的`CountDownLatch`是个不错的选择。

> 另外，线程A调用线程B的join方法后会被阻塞，当其他线程调用了线程A的interrupt（）方法中断了线程A时，线程A会抛出InterruptedException异常而返回。示例：

```java
package com.gyz.concurrent;

/**
 * @ClassName JoinTest2
 * @Description 线程A调用线程B的join方法后会被阻塞，当其他线程调用了线程A的interrupt（）方法中断了线程A时，
 *              线程A会抛出InterruptedException异常而返回！
 * @Author GongYuZhuo
 * @Date 2021/6/18 14:47
 **/
public class JoinTest2 {
    public static void main(String[] args) {
        Thread threadOne = new Thread(new Runnable() {
            @Override
            public void run() {
                System.out.println("threadOne start run!");
                //无限循环
                for (; ; ) {

                }
            }
        });

        //获取主线程
        final Thread mainThread = Thread.currentThread();

        Thread threadTwo = new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    //睡一秒再启动线程
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
                //中断主线程
                mainThread.interrupt();
            }
        });

        threadOne.start();
        threadTwo.start();
        try {
            //等待threadOne运行结束
            threadOne.join();
        } catch (InterruptedException ex) {
            ex.printStackTrace();
            System.out.println("main thread :" + ex);
        }
    }
}

```

运行结果：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151750221.png" />

如上代码在threadOne线程里面执行死循环，主线程调用threadOne的join方法阻塞自己等待线程threadOne执行完毕，待threadTwo休眠1s后会调用主线程的interrupt（）方法设置主线程的中断标志，从结果看在主线程中的threadOne.join（）处会抛出InterruptedException异常。这里需要注意的是，**在threadTwo里面调用的是主线程的interrupt（）方法，而不是线程threadOne的**。



## 5.4 让线程睡眠的sleep方法

### 5.4.1 概述

当一个执行中的线程调用了Thread的**sleep方法**后，**调用线程会暂时让出指定时间的执行权**，也就是在这期间不参与CPU的调度，但是该线所拥有的监视器资源，比如**锁还是持有不让出**的。指定的睡眠时间到了后该函数会正常返回，线程就处于就绪状态，然后参与CPU的调度，获取到CPU资源后就可以继续运行了。如果在睡眠期间其他线程调用了该线程的interrupt（）方法中断了该线程，则该线程会在调用sleep方法的地方抛出`InterruptedException异常`而返回。



### 5.4.2 线程在睡眠时拥有的监视器资源不会被释放

**示例代码：**

```java
package com.gyz.concurrent;

import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

/**
 * @ClassName SleepTest1
 * @Description 验证sleep方法睡眠时不释放锁
 * @Author GongYuZhuo
 * @Date 2021/6/18 15:21
 **/
public class SleepTest1 {

    /**创建一个独占锁 */
    private static final Lock lock = new ReentrantLock();

    public static void main(String[] args) throws InterruptedException {
        Thread threadA = new Thread(new Runnable() {
            @Override
            public void run() {
                //获取独占锁
                lock.lock();
                try {
                    System.out.println("child threadA is in sleep");
                    Thread.sleep(1000);
                    System.out.println("child threadA is in awaked");
                } catch (InterruptedException e) {
                    e.printStackTrace();
                } finally {
                    //释放锁
                    lock.unlock();
                }
            }
        });

        Thread threadB = new Thread(new Runnable() {
            @Override
            public void run() {
                lock.lock();
                try {
                    System.out.println("child threadB is in sleep");
                    Thread.sleep(1000);
                    System.out.println("child threadB is in awaked");
                } catch (InterruptedException ex) {
                    ex.printStackTrace();
                } finally {
                    //释放锁
                    lock.unlock();
                }
            }
        });

        //启动线程
        threadA.start();
        threadB.start();
    }

}

```

运行结果：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151750222.png" />

如上代码首先创建了一个独占锁，然后创建了两个线程，每个线程在内部先获取锁，然后睡眠，睡眠结束后会释放锁。首先，无论你执行多少遍上面的代码都是线程A先输出或者线程B先输出，不会出现线程A和线程B交叉输出的情况。从执行结果来看，线程A先获取了锁，那么线程A会先输出一行，然后调用sleep方法让自己睡眠10s，在线程A睡眠的这10s内那个独占锁lock还是线程A自己持有，线程B会一直阻塞直到线程A醒来后执行unlock释放锁。

> 下面再来看一下，当一个线程处于睡眠状态时，如果另外一个线程中断了它，会不会在调用sleep方法处抛出异常。

```java
package com.gyz.concurrent;

/**
 * @ClassName SleepTest2
 * @Description > 测试：当一个线程处于睡眠状态时，如果另外一个线程中断了它，会不会在调用sleep方法处抛出异常。
 *
 * @Author GongYuZhuo
 * @Date 2021/6/18 16:31
 **/
public class SleepTest2 {
    public static void main(String[] args) throws InterruptedException {
        Thread thread = new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    System.out.println("child thread is sleep");
                    Thread.sleep(10000);
                    System.out.println("child thread is awake");
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        });

        thread.start();
        //主线程睡眠2s
        Thread.sleep(2000);
        //主线程中断子线程
        thread.interrupt();
    }
}

```

运行结果如下：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151750223.png" />

子线程在睡眠期间，主线程中断了它，所以子线程在调用sleep方法处抛出了InterruptedException异常。另外需要注意的是，如果在调用Thread.sleep（long millis）时为millis参数**传递了一个负数**，则会抛出**IllegalArgumentException异常**。



## 5.5 让出CPU执行权的yield方法

### 5.5.1 概述

1. 当一个线程调用yield方法时，实际就是在**暗示线程调度器当前线程请求让出自己的CPU使用**，但是线程调度器可以无条件忽略这个暗示。

2. 我们知道操作系统是为每个线程分配一个时间片来占有CPU的，正常情况下当一个线程把分配给自己的时间片使用完后，线程调度器才会进行下一轮的线程调度，而当一个线程调用了Thread类的**静态方法yield**时，是在**告诉线程调度器自己占有的时间片中还没有使用完的部分自己不想使用**了，这暗示线程调度器现在就可以进行下一轮的线程调度。



### 5.5.2 yield方法示例

当一个线程调用yield方法时，当前线程会让出CPU使用权，然后处于就绪状态，线程调度器会从线程就绪队列里面获取一个线程优先级最高的线程，**当然也有可能会调度到刚刚让出CPU的那个线程来获取CPU执行权**。下面举一个例子来加深对yield方法的理解。

```java
package com.gyz.concurrent;

/**
 * @ClassName YieldTest
 * @Description yield方法示例
 * @Author GongYuZhuo
 * @Date 2021/6/18 16:55
 **/
public class YieldTest implements Runnable {

    YieldTest() {
        Thread thread = new Thread(this);
        thread.start();
    }

    @Override
    public void run() {
        for (int i = 0; i < 5; i++) {
            if (i % 5 == 0) {
                System.out.println(Thread.currentThread() + "yield cpu");
                //Thread.yield();
            }
        }
        System.out.println(Thread.currentThread() + "is over");
    }

    public static void main(String[] args) {
        new YieldTest();
        new YieldTest();
        new YieldTest();
    }
}

```

运行结果如下：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151750224.png" />

如上代码开启了三个线程，每个线程的功能都一样，都是在for循环中执行5次打印。运行多次后，上面的结果是出现次数最多的。

> 解开Thread.yield（）注释再执行，结果如下:

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151750225.png" />

从结果可知，Thread.yield（）方法生效了，三个线程分别在i=0时调用了Thread.yield（）方法，所以三个线程自己的两行输出没有在一起，因为输出了第一行后当前线程让出了CPU执行权。

一般很少使用这个方法，在调试或者测试时这个方法或许可以帮助复现由于并发竞争条件导致的问题，其在设计并发控制时或许会有用途，java.util.concurrent. locks包里面的锁会看到该方法的使用。



### 5.5.3 总结

**sleep与yield方法的区别在于：**

- 当线程调用**sleep方法**时调用线程**会被阻塞挂起**指定的时间，在这期间线程调度器不会去调度该线程。
- 而调用**yield方法**时，线程只是让出自己剩余的时间片，并**没有被阻塞挂起**，而是处于**就绪状态**，线程调度器下一次调度时就有可能调度到当前线程执行。



## 5.6 线程中断

Java中的线程中断是一种线程间的协作模式，通过**设置线程的中断标志并不能直接终止该线程的执行**，而是被中断的线程根据中断状态自行处理。

### 5.6.1 void interrupt（）方法 

中断线程，例如，当线程A运行时，线程B可以调用线程A的interrupt（）方法来设置线程A的中断标志为true并立即返回。设置标志仅仅是设置标志，线程A实际并没有被中断，它会继续往下执行。如果线程A因为调用了wait系列函数、join方法或者sleep方法而被阻塞挂起，这时候若线程B调用线程A的interrupt（）方法，线程A会在调用这些方法的地方抛出`InterruptedException`异常而返回。

### 5.6.2 boolean isInterrupted（）方法

检测当前线程是否被中断，如果是返回true，否则返回false。

```
    public boolean isInterrupted() {
        return isInterrupted(false);
    }
```



### 5.6.3 boolean interrupted（）方法

检测当前线程是否被中断，如果是返回true，否则返回false。与isInterrupted不同的是：

- 该方法如果发现当前线程被中断，则**会清除中断标志**，并且该方法是static方法，可以通过Thread类直接调用。
- 另外从下面的代码可以知道，在interrupted（）内部是**获取当前调用线程的中断标志**而不是调用interrupted（）方法的实例对象的中断标志。

```
   public static boolean interrupted() {
   		//清除中断标志
        return currentThread().isInterrupted(true);
    }
```

**Interrupted优雅退出的经典例子**，代码如下：

```java
public void run() {
        try {
            //线程退出条件
            while (!Thread.currentThread().isInterrupted() && more work todo){
                //do more work;
            }
        } catch (InterruptedException e) {
            //thread was interrupted during sleep or wait
        } finally {
            //cleanup ,if required
        }
    }
```



### 5.6.4 方法示例

> **下面看一个根据中断标志判断线程是否终止的例子**

代码如下：

```java
package com.gyz.concurrent;

/**
 * @ClassName InterruptTest
 * @Description 根据中断标志判断线程是否终止的例子
 * @Author GongYuZhuo
 * @Date 2021/6/18 17:38
 **/
public class InterruptTest {
    public static void main(String[] args) throws InterruptedException {
        Thread thread = new Thread(new Runnable() {
            @Override
            public void run() {
                if (!Thread.currentThread().isInterrupted()) {
                    System.out.println(Thread.currentThread() + "hello");
                }
            }
        });

        //启动子线程
        thread.start();
        //让主线程休眠2s，为了子线程输出
        Thread.sleep(2000);
        //打断子线程
        System.out.println("main thread interrupt thread");
        thread.interrupt();
        //等待子线程执行完毕
        thread.join();
        System.out.println("main is over");
    }
}

```

运行结果（不知为何《java并发编程之美》书上打印的不一样？）：

![image-20210618175542388](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151750226.png)

在如上代码中，子线程thread通过检查当前线程中断标志来控制是否退出循环，主线程在休眠1s后调用thread的interrupt（）方法设置了中断标志，所以线程thread退出了循环。



> **interrupt（）方法强制sleep方法抛出InterruptedException异常而返回**

当线程为了等待一些特定条件的到来时，一般会调用sleep函数、wait系列函数或者join（）函数来阻塞挂起当前线程。比如一个线程调用了Thread. sleep（3000），那么调用线程会被阻塞，直到3s后才会从阻塞状态变为激活状态。但是有可能在3s内条件已被满足，如果一直等到3s后再返回有点浪费时间，这时候可以调用该线程的interrupt（）方法，强制sleep方法抛出InterruptedException异常而返回，线程恢复到激活状态。下面看一个例子。

```java
package com.gyz.concurrent;

/**
 * @ClassName InterruptTest2
 * @Description interrupt（）方法强制sleep方法抛出InterruptedException异常而返回
 * @Author GongYuZhuo
 * @Date 2021/6/18 17:59
 **/
public class InterruptTest2 {
    public static void main(String[] args) throws InterruptedException {
        Thread threadOne = new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    System.out.println("threadOne begin sleep 2000000 seconds");
                    Thread.sleep(2000000);
                    System.out.println("threadOne is awaking");
                } catch (InterruptedException e) {
                    System.out.println("threadOne is interrupted while sleeping");
                    return;
                }
                System.out.println("threadOne-leaving normally");
            }
        });

        //启动线程
        threadOne.start();
        //确保子线程进入休眠状态
        Thread.sleep(1000);
        //打断子线程,让sleep函数返回
        threadOne.interrupt();
        //等待子线程执行完毕
        threadOne.join();
        System.out.println("main thread is over");
    }
}

```

输出结果：

![image-20210618180938024](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151750227.png)

在如上代码中，threadOne线程休眠了2000s，在正常情况下该线程需要等到2000s后才会被唤醒，但是本例通过调用`threadOne.interrupt（）`方法打断了该线程的休眠，该线程会在调用sleep方法处抛出`InterruptedException`异常后返回。



> **interrupted（）与 isInterrupted（）方法的不同之处**

代码如下：

```java
package com.gyz.concurrent;

/**
 * @ClassName InterruptTest3
 * @Description interrupted（）与 isInterrupted（）方法的不同之处
 * @Author GongYuZhuo
 * @Date 2021/6/18 18:11
 **/
public class InterruptTest3 {
    public static void main(String[] args) throws InterruptedException {
        Thread threadOne = new Thread(new Runnable() {
            @Override
            public void run() {
                for (; ; ) {
                    //无限循环
                }
            }
        });

        //启动线程
        threadOne.start();
        //设置中断标志
        threadOne.interrupt();
        //获取中断标记
        System.out.println("isInterrupted " + threadOne.isInterrupted());
        //获取并重置中断标记
        System.out.println("isInterrupted " + Thread.interrupted());
        //获取中断标记
        System.out.println("isInterrupted " + threadOne.isInterrupted());
        threadOne.join();
        System.out.println("main thread is over");
    }
}

```

输出结果如下:

![image-20210618182710821](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151750228.png)

`interrupted（）`方法内部是获取当前线程的中断状态，这里虽然调用了`threadOne的interrupted（）`方法，但是获取的是主线程的中断标志，因为主线程是当前线程。**threadOne.interrupted（）和Thread.interrupted（）方法的作用是一样的，目的都是获取当前线程的中断标志。**

修改上面的例子为如下：

```java
package com.gyz.concurrent;

/**
 * @ClassName InterruptTest4
 * @Description
 * @Author GongYuZhuo
 * @Date 2021/6/18 18:29
 **/
public class InterruptTest4 {
    public static void main(String[] args) throws InterruptedException {
        Thread threadOne = new Thread(new Runnable() {
            @Override
            public void run() {
                while (!Thread.currentThread().isInterrupted()) {
                    System.out.println("threadOne isInterrupted:" + Thread.currentThread().isInterrupted());
                }
            }
        });

        //开启子线程
        threadOne.start();
        //打断线程
        threadOne.interrupt();
        //等待子线程执行完毕
        threadOne.join();
        System.out.println("main thread is over");
    }
}

```

输出结果如下：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151750229.png" />

由输出结果可知，调用interrupted（）方法后**中断标志被清除**了。



***

# 6、线程死锁

## 6.1 什么是线程死锁

死锁是指两个或两个以上的线程在执行过程中，因争夺资源而造成的互相等待的现象，在无外力作用的情况下，这些线程会一直相互等待而无法继续运行下去，如图所示。

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151750230.png" />

线程A已经持有了资源2，它同时还想申请资源1，线程B已经持有了资源1，它同时还想申请资源2，所以线程1和线程2就因为相互等待对方已经持有的资源，而进入了死锁状态。

**死锁的产生必须具备以下四个条件**：

- **互斥条件**：指线程对已经获取到的资源进行排它性使用，即该资源同时只由一个线程占用。如果此时还有其他线程请求获取资源，则请求者只能等待，直至占有资源的线程释放该资源。
- **请求并持有条件**：指一个线程已经持有了至少一个资源，但又提出了新的请求 ，而新资源已被其他线程占有，所以当前线程会被阻塞，但**阻塞的同时并不释放自己已获取的资源**。
- **不可剥夺条件**：指线程获取到的资源在自己使用完之前不能被其他线程抢占，只有在自己使用完毕后才由自己释放该资源。
- **环路等待条件**：指在发生死锁时，必然存在一个线程—资源的环形链，即线程集合{T0, T1, T2,…, Tn}中的T0正在等待一个T1占用的资源，T1正在等待T2占用的资源，……Tn正在等待已被T0占用的资源。



## 6.2 举例说明死锁

> **死锁示例代码：**

```java
package com.gyz.concurrent1;


/**
 * @Description 演示死锁
 * @Author GongYuCho
 * @Date 2021/6/20 13:39
 * @Version 1.0.0
 */
public class DeadLockTest1 {

    /** 共享资源 */
    private static Object resourceA = new Object();
    private static Object resourceB = new Object();

    public static void main(String[] args) {

        Thread threadA = new Thread(new Runnable() {
            @Override
            public void run() {
                synchronized (resourceA) {
                    System.out.println(Thread.currentThread() + "get resourceA ");
                    try {
                        Thread.sleep(1000);
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                    System.out.println(Thread.currentThread() + "wait get resourceB ");
                    synchronized (resourceB) {
                        System.out.println(Thread.currentThread() + "get resourceB ");
                    }
                }
            }
        });

        //创建线程threadB
        Thread threadB = new Thread(new Runnable() {
            @Override
            public void run() {
                synchronized (resourceB) {
                    System.out.println(Thread.currentThread() + "get resourceB ");
                    try {
                        Thread.sleep(1000);
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                    System.out.println(Thread.currentThread() + "wait get resourceA ");
                    synchronized (resourceA) {
                        System.out.println(Thread.currentThread() + "get resourceA ");
                    }
                }
            }
        });

        //启动线程
        threadA.start();
        threadB.start();

    }

}
```

输出结果：

![image-20210620170751167](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151750231.png)

- Thread-0是线程A, Thread-1是线程B，代码首先创建了两个资源，并创建了两个线程。线程调度器先调度了线程A，也就是把CPU资源分配给了线程A，线程A使用`synchronized（resourceA）`方法获取到了resourceA的监视器锁，然后调用sleep函数休眠1s，**休眠1s是为了保证线程A在获取resourceB对应的锁前让线程B抢占到CPU**，获取到资源resourceB上的锁。
- 线程A调用sleep方法后线程B会执行`synchronized（resourceB）`方法，这代表线程B获取到了resourceB对象的监视器锁资源，然后调用sleep函数休眠1s。到了这里线程A获取到了resourceA资源，线程B获取到了resourceB资源。
- 线程A休眠结束后会企图获取resourceB资源，而resourceB资源被线程B所持有，所以线程A会被阻塞而等待。而同时线程B休眠结束后会企图获取resourceA资源，而resourceA资源已经被线程A持有，所以**线程A和线程B就陷入了相互等待的状态**，也就产生了死锁。

> **谈谈本例是如何满足死锁的四个条件的**

- **资源互斥条件**：首先，resourceA和resourceB都是互斥资源，当线程A调用synchronized（resourceA）方法获取到resourceA上的监视器锁并释放前，线程B再调用synchronized（resourceA）方法尝试获取该资源会被阻塞，只有线程A主动释放该锁，线程B才能获得，这满足了资源互斥条件。
- **请求并持有条件**：线程A首先通过synchronized（resourceA）方法获取到resourceA上的监视器锁资源，然后通过`synchronized（resourceB）`方法等待获取resourceB上的监视器锁资源，这就构成了请求并持有条件。
- **不可剥夺条件**：线程A在获取resourceA上的监视器锁资源后，该资源不会被线程B掠夺走，只有线程A自己主动释放resourceA资源时，它才会放弃对该资源的持有权，这构成了资源的不可剥夺条件。
- **环路等待条件**：线程A持有resourceA资源并等待获取resourceB资源，而线程B持有resourceB资源并等待resourceA资源，这构成了环路等待条件。所以线程A和线程B就进入了死锁状态。



## 6.3 如何避免线程死锁

1. 要想避免死锁，只需要破坏掉至少一个构造死锁的必要条件即可。**目前只有请求并持有和环路等待条件是可以被破坏的**。

2. 造成死锁的原因其实和申请资源的顺序有很大关系，使用**资源申请的有序性**原则就可以**避免死锁**。

3. 对上面线程B的代码进行如下修改：

   ```java
   package com.gyz.concurrent1;
   
   
   /**
    * @Description 演示死锁
    * @Author GongYuCho
    * @Date 2021/6/20 13:50
    * @Version 1.0.0
    */
   public class DeadLockTest2 {
   
       /** 共享资源resourceA */
       private static Object resourceA = new Object();
       private static Object resourceB = new Object();
   
       public static void main(String[] args) {
   
           Thread threadA = new Thread(new Runnable() {
               @Override
               public void run() {
                   synchronized (resourceA) {
                       System.out.println(Thread.currentThread() + "get resourceA ");
                       try {
                           // TimeUnit.SECONDS.sleep(1000); 可读性高
                           Thread.sleep(1000);
                       } catch (InterruptedException e) {
                           e.printStackTrace();
                       }
                       System.out.println(Thread.currentThread() + "wait get resourceB ");
                       synchronized (resourceB) {
                           System.out.println(Thread.currentThread() + "get resourceB ");
                       }
                   }
               }
           });
   
           //创建线程threadB
           Thread threadB = new Thread(new Runnable() {
               @Override
               public void run() {
                   synchronized (resourceA) {
                       System.out.println(Thread.currentThread() + "get resourceA ");
                       try {
                           // TimeUnit.SECONDS.sleep(1000); 可读性高
                           Thread.sleep(1000);
                       } catch (InterruptedException e) {
                           e.printStackTrace();
                       }
                       System.out.println(Thread.currentThread() + "wait get resourceB ");
                       synchronized (resourceB) {
                           System.out.println(Thread.currentThread() + "get resourceB ");
                       }
                   }
               }
           });
   
           //启动线程
           threadA.start();
           threadB.start();
   
       }
   
   }
   ```

   输出结果：

   ![image-20210620172155969](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151750233.png)

   - 如上代码让在线程B中获取资源的顺序和在线程A中获取资源的顺序保持一致。其实资源分配有序性就是指，假如线程A和线程B都需要资源1,2,3, ..., n时，对资源进行排序，**线程A和线程B只有在获取了资源n-1时才能去获取资源n**。

   - 为何资源的有序分配会避免死锁？

     比如上面的代码，假如线程A和线程B同时执行到了synchronized（resourceA），只有一个线程可以获取到resourceA上的监视器锁，假如线程A获取到了，那么线程B就会被阻塞而不会再去获取资源B，线程A获取到resourceA的监视器锁后会去申请resourceB的监视器锁资源，这时候线程A是可以获取到的，线程A获取到resourceB资源并使用后会放弃对资源resourceB的持有，然后再释放对resourceA的持有，释放resourceA后线程B才会被从阻塞状态变为激活状态。**所以资源的有序性破坏了资源的请求并持有条件和环路等待条件**，因此避免了死锁。



***

# 7、守护线程与用户线程

## 7.1 概述

Java中的线程分为两类，分别为**daemon线程（守护线程）**和**user线程（用户线程）**。在JVM启动时会调用main函数，main函数所在的线程就是一个用户线程，其实在JVM内部同时还启动了好多守护线程，比如垃圾回收线程。

**守护线程和用户线程有什么区别呢？**

- 只要其它非守护线程运行结束了，即使守护线程的代码没有执行完，也会强制结束 。 
- 只要有一个用户线程还没结束，正常情况下JVM就不会退出。



## 7.2 Java中如何创建一个守护线程？

代码如下：

```java
package com.gyz.concurrent1;

/**
 * @Description 创建守护线程
 * @Author GongYuCho
 * @Date 2021/6/20 18:08
 * @Version 1.0.0
 */
public class DaemonThread {

    public static void main(String[] args) {
        Thread daemonThread = new Thread(new Runnable() {
            @Override
            public void run() {

            }
        });

        //设置为守护线程
        daemonThread.setDaemon(true);
        daemonThread.start();
    }
}
```

只需要设置线程的daemon参数为true即可。



## 7.3 用户线程与守护线程的区别

> **示例代码：**

```java
package com.gyz.concurrent1;

/**
 * @Description 用户线程与守护线程的区别
 * @Author GongYuCho
 * @Date 2021/6/20 18:10
 * @Version 1.0.0
 */
public class DaemonThread {

    public static void main(String[] args) {
        Thread thread = new Thread(new Runnable() {
            @Override
            public void run() {
                for (;;){}
            }
        });

        thread.start();
        System.out.println("main thread isover");
    }
}
```

输出结果：

![image-20210620181715433](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151750234.png)

在main线程中创建了一个thread线程，在thread线程里面是一个无限循环。从运行代码的结果看，main线程已经运行结束了，但是JVM进程并没有退出。在IDE的输出结果左侧的红色方块仍处于运行状态。另外，在idea中执行`jps -l`会输出如下结果。

`注： jps -l 输出应用程序main class的完整package名或者应用程序的jar文件完整路径名`

![snipaste_20210620_182343](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151750235.png)

这个结果说明了当父线程结束后，子线程还是可以继续存在的，也就是子线程的生命周期并不受父线程的影响。这也说明了在用户线程还存在的情况下JVM进程并不会终止。

> 把上面的thread线程设置为守护线程后，再来运行看看会有什么结果：

```java
package com.gyz.concurrent1;

/**
 * @Description 用户线程与守护线程的区别
 * @Author GongYuCho
 * @Date 2021/6/20 18:12
 * @Version 1.0.0
 */
public class DaemonThread {

    public static void main(String[] args) {
        Thread thread = new Thread(new Runnable() {
            @Override
            public void run() {
                for (;;){}
            }
        });

        thread.setDaemon(true);
        thread.start();
        System.out.println("main thread isover");
    }
}
```

输出结果：

![image-20210620182846010](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151750236.png)

在启动线程前将线程设置为守护线程，执行后的输出结果显示，JVM进程已经终止了，执行`ps -eaf|grep java`也看不到JVM进程了。在这个例子中，main函数是唯一的用户线程，thread线程是守护线程，当main线程运行结束后，JVM发现当前已经没有用户线程了，就会终止JVM进程。由于这里的守护线程执行的任务是一个死循环，这也说明了如果当前进程中**不存在用户线程**，但是还存在正在执行任务的守护线程，则**JVM不等守护线程运行完毕就会结束JVM进程**。

> main线程运行结束后，JVM会自动启动一个叫作`DestroyJavaVM`的线程，该线程会**等待所有用户线程结束后终止JVM进程**。

> **注意**  

- 垃圾回收器线程就是一种守护线程 。
- Tomcat 中的 Acceptor 和 Poller 线程都是守护线程，所以 Tomcat 接收到 shutdown 命令后，不会等待它们处理完当前请求  。

> **总结**

- 如果你希望在主线程结束后JVM进程马上结束，那么在创建线程时可以将其设置为守护线程。
- 如果你希望在主线程结束后子线程继续工作，等子线程结束后再让JVM进程结束，那么就将子线程设置为用户线程。



***

# 8、ThreadLocal

多线程访问同一个共享变量时特别容易出现并发问题，特别是在多个线程需要对一个共享变量进行写入时。为了保证线程安全，一般使用者在访问共享变量时需要进行适当的同步，如图所示。

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151750237.png" />

当创建一个变量后，每个线程对其进行访问的时候访问的是自己线程的变量呢？其实ThreadLocal就可以做这件事情。

ThreadLocal是JDK包提供的，它提供了线程本地变量，也就是如果你创建了一个ThreadLocal变量，那么访问这个**变量**的每个线程都会有这个变量的一个**本地副本**。当多个线程操作这个变量时，实际操作的是**自己本地内存里面的变量**，从而避免了线程安全问题。创建一个ThreadLocal变量后，每个线程都会复制一个变量到自己的本地内存，如图所示。

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151750238.png" />



## 8.1 ThreadLocal使用示例

本例开启了两个线程，在每个线程内部都设置了本地变量的值，然后调用print函数打印当前本地变量的值。如果打印后调用了本地变量的remove方法，则会删除本地内存中的该变量，代码如下。

```java
package com.gyz.concurrent1;

/**
 * @Description ThreadLocal使用案例
 * @Author GongYuCho
 * @Date 2021/6/20 19:32
 * @Version 1.0.0
 */
public class ThreadLocalTest {


    /** （2）创建threadLocal本地变量 */
    static ThreadLocal<String> threadLocal = new ThreadLocal<>();

    static void print(String str) {
        //1.1 打印当前线程本地内存中的threadLocal变量的值
        System.out.println(str + ":" + threadLocal.get());
        //1.2 清除当前线程本地内存中的变量threadLocal
        //threadLocal.remove();
    }

    public static void main(String[] args) {


        /**
         * @Description（3）创建线程One
         * @param null :
         * @return
         */
        Thread threadOne = new Thread(new Runnable() {
            @Override
            public void run() {
                //3.1 设置threadOne线程中threadLocal变量的值
                threadLocal.set("threadOne local Variable");
                //3.2 打印函数
                print("threadOne");
                //3.3 获取移除操作之后的threadLocal变量的值
                System.out.println("threadOne remove after" + ":" + threadLocal.get());
            }
        });

        /**
         * @Description（4）创建线程Two
         * @param null :
         * @return
         */
        Thread threadTwo = new Thread(new Runnable() {
            @Override
            public void run() {
                //4.1 设置threadOne线程中threadLocal变量的值
                threadLocal.set("threadTwo local Variable");
                //4.2 打印函数
                print("threadTwo");
                //4.3 获取移除操作之后的threadLocal变量的值
                System.out.println("threadTwo remove after" + ":" + threadLocal.get());
            }
        });

        //（5）启动线程
        threadOne.start();
        threadTwo.start();
    }
}
```

输出结果：

![image-20210620195107674](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151750239.png)

线程One中的代码3.1通过set方法设置了localVariable的值，这其实设置的是线程One本地内存中的一个副本，这个副本线程Two是访问不了的。然后代码3.2调用了print函数，代码1.1通过get函数获取了当前线程（线程One）本地内存中localVariable的值。

打开代码1.2的注释后，再次运行，运行结果如下。

![image-20210620195614291](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151750240.png)



## 8.2 ThreadLocal的实现原理

> ThreadLocal相关类的类图结构如下图所示。

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151750241.png" />

由该图可知，Thread类中有一个`threadLocals`和一个`inheritableThreadLocals`，它们都是`ThreadLocalMap`类型的变量，而ThreadLocalMap是一个定制化的Hashmap。

- 在**默认情况下，每个线程中的这两个变量都为null**，只有当前线程第一次调用ThreadLocal的set或者get方法时才会创建它们。

- 其实每个线程的**本地变量**不是存放在ThreadLocal实例里面，而是**存放在调用线程的threadLocals变量里面**。也就是说，ThreadLocal类型的本地变量存放在具体的线程内存空间中。ThreadLocal就是一个工具壳，它通过set方法把value值放入调用线程的threadLocals里面并存放起来，当调用线程调用它的get方法时，再从当前线程的threadLocals变量里面将其拿出来使用。

  为了直观一些，源码如下：

  ```
  /**
  * set 方法
  */
  public void set(T value) {
          Thread t = Thread.currentThread();
          ThreadLocalMap map = getMap(t);
          if (map != null)
              map.set(this, value);
          else
              createMap(t, value);
      }
  
  /**
  * getMap 方法
  */
   ThreadLocalMap getMap(Thread t) {
          return t.threadLocals;
      }
  ```

- 如果调用线程一直不终止，那么这个本地变量会一直存放在调用线程的threadLocals变量里面，所以**当不需要使用本地变量时可以通过调用ThreadLocal变量的remove方法**，从当前线程的threadLocals里面删除该本地变量。

- 另外，Thread里面的threadLocals为何被设计为**map结构**？很明显是因为**每个线程可以关联多个ThreadLocal变量**。

> 下面简单分析ThreadLocal的set、get及remove方法的实现逻辑。

1. void set（T value）

   ```java
    public void set(T value) {
    		//（1）获取当前线程
           Thread t = Thread.currentThread();
           //（2）将线程作为key去寻找本地变量，找到则设置
           ThreadLocalMap map = getMap(t);
           if (map != null)
               map.set(this, value);
           else
           	//（3）第一次调用时就创建当前线程对应的HashMap
               createMap(t, value);
       }
   ```

   代码（1）首先获取调用线程，然后使用当前线程作为参数调用getMap（t）方法，getMap（Thread t）的代码如下。

   ```
      ThreadLocalMap getMap(Thread t) {
           return t.threadLocals;
       }
   ```

   可以看到，getMap（t）的作用是获取线程自己的变量threadLocals, threadlocal变量被绑定到了线程的成员变量上。

   - 如果getMap（t）的返回值不为空，则把value值设置到threadLocals中，也就是把当前变量值放入当前线程的内存变量threadLocals中。threadLocals是一个HashMap结构，其中key就是当前ThreadLocal的实例对象引用，value是通过set方法传递的值。

   - 如果`getMap（t）`返回空值则说明是第一次调用set方法，这时创建当前线程的threadLocals变量。下面来看`createMap（t, value）`做什么。

     ```
        void createMap(Thread t, T firstValue) {
             t.threadLocals = new ThreadLocalMap(this, firstValue);
         }
     ```

     它创建当前线程的threadLocals变量。

2. T get（)

   ```java
   public T get() {
       	//（4）获取当前线程
           Thread t = Thread.currentThread();
       	//（5）获取当前线程的threadLocals变量
           ThreadLocalMap map = getMap(t);
       	//如果threadLocals不为空，则返回本地变量的值
           if (map != null) {
               ThreadLocalMap.Entry e = map.getEntry(this);
               if (e != null) {
                   @SuppressWarnings("unchecked")
                   T result = (T)e.value;
                   return result;
               }
           }
       	//（7）threadLocals为空则初始化当前线程的threadLocals成员变量
           return setInitialValue();
       }
   ```

   代码（4）首先获取当前线程实例，如果当前线程的threadLocals变量不为null，则直接返回当前线程绑定的本地变量，否则执行代码（7）进行初始化。setInitialValue（）的代码如下。

   ```java
   private T setInitialValue() {
       	//（8）初始化为null
           T value = initialValue();
           Thread t = Thread.currentThread();
           ThreadLocalMap map = getMap(t);
       	//（9）如果当前线程的threadLocals变量不为空
           if (map != null)
               map.set(this, value);
           else
               //（10）如果当前线程的threadLocals变量为空
               createMap(t, value);
           return value;
       }
   
   ```

   如果当前线程的threadLocals变量不为空，则设置当前线程的本地变量值为null，否则调用createMap方法创建当前线程的createMap变量。

3. void remove（）

   ```java
     public void remove() {
            ThreadLocalMap m = getMap(Thread.currentThread());
            if (m != null)
                m.remove(this);
        }
   ```

   如以上代码所示，如果当前线程的threadLocals变量不为空，则删除当前线程中指定ThreadLocal实例的本地变量。



> **总结**

- 如下图所示，在每个线程内部都有一个名为threadLocals的成员变量，该变量的类型为HashMap，其中key为我们定义的ThreadLocal变量的this引用，value则为我们使用set方法设置的值。
- 每个线程的本地变量存放在线程自己的内存变量threadLocals中，如果当前线程一直不消亡，那么这些本地变量会一直存在，所以可能会造成内存溢出，因此使用完毕后要记得**调用ThreadLocal的remove方法删除对应线程的threadLocals中的本地变量**。

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151750242.png" />



## 8.3 ThreadLocal不支持继承性

<a name="代码实例">代码实例</a>

```java
package com.gyz.concurrent1;

/**
 * @Description ThreadLocal不支持继承性
 * @Author GongYuCho
 * @Date 2021/6/20 23:15
 * @Version 1.0.0
 */
public class ThreadLocalTest2 {

    /** （1）本地变量 */
    public static ThreadLocal<String> threadLocal = new ThreadLocal<>();

    public static void main(String[] args) {
        //（2）设置线程变量
        threadLocal.set("hello world");
        //（3）启动子线程
        Thread thread = new Thread(new Runnable() {
            @Override
            public void run() {
                //（4）子线程输出线程变量的值
                System.out.println("thread：" + threadLocal.get());
            }
        });

        //启动线程
        thread.start();
        //（5）主线程输出变量的值
        System.out.println("main：" + threadLocal.get());
    }

}
```

输出结果：

![image-20210620232314280](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151750243.png)

同一个ThreadLocal变量在父线程中被设置值后，在子线程中是获取不到的。因为在子线程thread里面调用get方法时当前线程为thread线程，而这里调用set方法设置线程变量的是main线程，两者是不同的线程，自然子线程访问时返回null。为了解决这个问题，`InheritableThreadLocal`类应运而生。



## 8.4 InheritableThreadLocal类

> InheritableThreadLocal继承自ThreadLocal，其提供了一个特性，就是让子线程可以访问在父线程中设置的本地变量

源码如下：

```java
public class InheritableThreadLocal<T> extends ThreadLocal<T> {
    
     //(1)
	 protected T childValue(T parentValue) {
        return parentValue;
    }
	
     //(2)
	ThreadLocalMap getMap(Thread t) {
       return t.inheritableThreadLocals;
    }
    
     //(3)
     void createMap(Thread t, T firstValue) {
        t.inheritableThreadLocals = new ThreadLocalMap(this, firstValue);
    }
}
```

InheritableThreadLocal继承了ThreadLocal，并重写了三个方法。

- 由代码（3）可知，InheritableThreadLocal重写了**createMap**方法，那么现在当第一次调用set方法时，创建的是当前线程的inheritableThreadLocals变量的实例而不再是threadLocals。
- 由代码（2）可知，当调用**get方法**获取当前线程内部的map变量时，获取的是inheritableThreadLocals而不再是threadLocals。
- 综上可知，在InheritableThreadLocal的世界里，变量inheritableThreadLocals替代了threadLocals。



> 重写的代码（1）何时执行？以及如何让子线程可以访问父线程的本地变量

这要从创建Thread的代码说起，打开Thread类的默认构造函数，代码如下。

```java
public Thread(Runnable target) {
        init(null, target, "Thread-" + nextThreadNum(), 0);
    }
    
private void init(ThreadGroup g, Runnable target, String name,
                      long stackSize, AccessControlContext acc,
                      boolean inheritThreadLocals) {
     	...
       
        //(4)获取当前线程
        Thread parent = currentThread();
        
    	...
      
         //（5）如果父线程的inheritThreadLocals变量不为空
         if (inheritThreadLocals && parent.inheritableThreadLocals != null)
         	//(6)设置子线程中的inheritThreadLocals变量
            this.inheritableThreadLocals =
                ThreadLocal.createInheritedMap(parent.inheritableThreadLocals);
        /* Stash the specified stack size in case the VM cares */
        this.stackSize = stackSize;

        /* Set thread ID */
        tid = nextThreadID();
   }
```

如上代码在创建线程时，在构造函数里面会调用init方法。代码（4）获取了当前线程（这里是指main函数所在的线程，也就是父线程），然后代码（5）判断main函数所在线程里面的inheritableThreadLocals属性是否为null，前面我们讲了InheritableThreadLocal类的get和set方法操作的是inheritableThreadLocals，所以这里的inheritableThreadLocal变量不为null，因此会执行代码（6）。

> 下面看一下createInheritedMap的代码

**createInheritedMap方法源码如下**：

```
  static ThreadLocalMap createInheritedMap(ThreadLocalMap parentMap) {
        return new ThreadLocalMap(parentMap);
    }
```

可以看到，在createInheritedMap内部**使用父线程的inheritableThreadLocals变量**作为构造函数创建了一个新的ThreadLocalMap变量，然后赋值给了子线程的inheritableThreadLocals变量。

**ThreadLocalMap的构造函数内部源码**：

```java
 private ThreadLocalMap(ThreadLocalMap parentMap) {
            Entry[] parentTable = parentMap.table;
            int len = parentTable.length;
            setThreshold(len);
            table = new Entry[len];

            for (int j = 0; j < len; j++) {
                Entry e = parentTable[j];
                if (e != null) {
                    @SuppressWarnings("unchecked")
                    ThreadLocal<Object> key = (ThreadLocal<Object>) e.get();
                    if (key != null) {
                        //调用重写的方法
                        Object value = key.childValue(e.value);
                        Entry c = new Entry(key, value);
                        int h = key.threadLocalHashCode & (len - 1);
                        while (table[h] != null)
                            h = nextIndex(h, len);
                        table[h] = c;
                        size++;
                    }
                }
            }
        }
```

在该构造函数内部把父线程的inheritableThreadLocals成员变量的值复制到新的ThreadLocalMap对象中，其中代码（7）调用了InheritableThreadLocal类重写的代码（1）。

> **总结**

- `InheritableThreadLocal`类通过重写代码（2）和（3）让本地变量保存到了具体线程的inheritableThreadLocals变量里面，那么线程在通过InheritableThreadLocal类实例的set或者get方法设置变量时，就会创建当前线程的inheritableThreadLocals变量。
- 当父线程创建子线程时，构造函数会把父线程中`inheritableThreadLocals`变量里面的本地变量复制一份保存到子线程的`inheritableThreadLocals`变量里面。

- 把[代码实例](#代码实例)中的代码（1）修改为：

  ```
   public static ThreadLocal<String> threadLocal = new ThreadLocal<>();
  ```

  输出结果为：

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151750244.png" />

  可见，现在可以从子线程正常获取到线程变量的值了。

- **那么在什么情况下需要子线程可以获取父线程的threadlocal变量呢？**

  - 子线程需要使用存放在threadlocal变量中的用户登录信息。
  - 一些中间件需要把统一的id追踪的整个调用链路记录下来。

- 其实子线程使用父线程中的threadlocal方法有多种方式：

  - 比如创建线程时传入父线程中的变量，并将其复制到子线程中。
  - 或者在父线程中构造一个map作为参数传递给子线程。
  - 但是这些都改变了我们的使用习惯，所以在这些情况下InheritableThreadLocal就显得比较有用。

  

  

  

  

  

  

  









