---
title: 01_共享模型之管程
category:
  - 并发编程
date: 2023-03-01
---

<!-- more -->

## 一、共享带来的问题

### 1.1 小故事  

- 老王（操作系统）有一个功能强大的算盘（CPU），现在想把它租出去，赚一点外快 ；

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151753811.png" /> 

- 小南、小女（线程）来使用这个算盘来进行一些计算，并按照时间给老王支付费用；

- 但小南不能一天24小时使用算盘，他经常要小憩一会（sleep），又或是去吃饭上厕所（阻塞 io 操作），有时还需要一根烟，没烟时思路全无（wait）这些情况统称为（阻塞） ；

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151753417.png" />

- 在这些时候，算盘没利用起来（不能收钱了），老王觉得有点不划算  ；

- 另外，小女也想用用算盘，如果总是小南占着算盘，让小女觉得不公平  ；

- 于是，老王灵机一动，想了个办法 [ 让他们每人用一会，轮流使用算盘 ]  ；

- 这样，当小南阻塞的时候，算盘可以分给小女使用，不会浪费，反之亦然  ；

- 最近执行的计算比较复杂，需要存储一些中间结果，而学生们的脑容量（工作内存）不够，所以老王申请了一个笔记本（主存），把一些中间结果先记在本上  ；

- 计算流程是这样的  ：

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151753350.png" />

- 但是由于分时系统，有一天还是发生了事故  ：

  - 小南刚读取了初始值 0 做了个 +1 运算，还没来得及写回结果  ；

  - 老王说 [ **小南**，你的时间到了，该别人了，记住结果走吧 ]，于是小南念叨着 [ 结果是1，结果是1...] 不甘心地到一边待着去了（上下文切换） ；

  - 老王说 [ **小女**，该你了 ]，小女看到了笔记本上还写着 0 做了一个 -1 运算，将结果 -1 写入笔记本  ；

  - 这时小女的时间也用完了，老王又叫醒了小南：[小南，把你上次的题目算完吧]，小南将他脑海中的结果 1 写入了笔记本   。

    <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151753648.png" />

  - 小南和小女都觉得自己没做错，但笔记本里的结果是 1 而不是 0  。



### 1.2 Java 的体现  

> 两个线程对初始值为 0 的静态变量一个做自增，一个做自减，各做 5000 次，结果是 0 吗？  

代码示例：

```java
package com.gyz.demo.test;

import lombok.extern.slf4j.Slf4j;

/**
 * @Description 两个线程对初始值为 0 的静态变量一个做自增，一个做自减，各做 5000 次，结果是 0 吗？
 *                结果可能为负数，0，或者正数
 *
 * @Author GongYuZhuo
 * @Date 2021/6/21 23:51
 * @Version 1.0.0
 */
@Slf4j
public class Test17 {

    /** 定义变量count做加减操作 */
     static int counter = 0;

    public static void main(String[] args) throws InterruptedException {

        Thread t1 = new Thread(() -> {
            for (int i = 0; i < 5000; i++) {
                counter++;
            }
        }, "t1");

        Thread t2 = new Thread(() -> {
            for (int h = 0; h < 5000; h++) {
                counter--;
            }
        }, "t2");

        t1.start();
        t2.start();
        t1.join();
        t2.join();
        log.debug("{}", counter);
    }
}
```

输出结果：

![image-20210622003146310](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151753023.png)

![image-20210622003224392](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151753266.png)

以上的结果可能是正数、负数、零。为什么呢？  

- 因为 Java 中对静态变量的**自增，自减并不是原子操作**，要彻底理解，必须从**字节码**来进行**分析**  。

- 例如对于 i++ 而言（i 为静态变量），实际会产生如下的 JVM 字节码指令：  

  ```
  getstatic i // 获取静态变量i的值
  iconst_1 // 准备常量1
  iadd // 自增
  putstatic i // 将修改后的值存入静态变量i
  ```

- 而对应 i-- 也是类似：  

  ```
  getstatic i // 获取静态变量i的值
  iconst_1 // 准备常量1
  isub // 自减
  putstatic i // 将修改后的值存入静态变量i
  
  ```

- 而 Java 的内存模型如下，完成静态变量的自增，自减需要在主存和工作内存中进行数据交换：  

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151753151.png" />

  如果是单线程以上 8 行代码是顺序执行（不会交错）没有问题：  

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151753134.png" />

  但多线程下这 8 行代码可能交错运行，出现负数的情况：  

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151754841.png" />

  出现正数的情况：  

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151754840.png" />



### 1.3 临界区 Critical Section  

- 一个程序运行多个线程本身是没有问题的。

- 问题出在多个线程访问**共享资源**：

  - 多个线程读**共享资源**其实也没有问题；
  - 在多个线程对**共享资源**读写操作时发生指令交错，就会出现问题  。

- 一段代码块内如果存在对**共享资源**的多线程读写操作，称这段代码块为<a name="临界区">临界区</a>  。

  - 例如，下面代码中的临界区  ：

    ```java
    static int counter = 0;
    
    static void increment()
    // 临界区
    {
    	counter++;
    }
    
    static void decrement()
    // 临界区
    {
    	counter--;
    }
    ```

    

### 1.4 竞态条件 Race Condition  

多个线程在临界区内执行，由于代码的**执行序列不同**而导致结果无法预测，称之为发生了**竞态条件**  。



***

## 二、synchronized 解决方案  

### 2.1 *应用之互斥  

> 为了避免临界区的竞态条件发生，有多种手段可以达到目的：

- 阻塞式的解决方案：synchronized，Lock  ；
- 非阻塞式的解决方案：原子变量  。

本次使用阻塞式的解决方案：synchronized，来解决上述问题，即俗称的【**对象锁**】，它采用互斥的方式让**同一时刻至多只有一个线程能持有【对象锁】**，其它线程再想获取这个【对象锁】时就会阻塞住。这样就能保证拥有锁的线程可以安全的执行临界区内的代码，不用担心线程上下文切换  。

> **注意**

虽然 java 中互斥和同步都可以采用 synchronized 关键字来完成，但它们还是有区别的：  

- **互斥**是保证临界区的竞态条件发生，同一时刻只能有一个线程执行临界区代码  ；
- **同步**是由于线程执行的先后、顺序不同、需要一个线程等待其它线程运行到某个点  。



### 2.2 synchronized 语法

语法 ：

```
synchronized(对象){ //线程1，线程2（blocked）
	临界区
}
```

解决故事中的问题：

```java
package com.gyz.demo.test;

import lombok.extern.slf4j.Slf4j;

/**
 * @Description 1、两个线程对初始值为 0 的静态变量一个做自增，一个做自减，各做 5000 次，结果是 0 吗？
 *                结果可能为负数，0，或者正数.
 *
 *               2、解决方案：synchronized
 *
 *
 * @Author GongYuZhuo
 * @Date 2021/6/21 23:51
 * @Version 1.0.0
 */
@Slf4j
public class Test17 {

    /** 定义变量count做加减操作 */
     static int counter = 0;

    /**共享资源 */
    static final Object room = new Object();

    public static void main(String[] args) throws InterruptedException {

        Thread t1 = new Thread(() -> {
            for (int i = 0; i < 5000; i++) {
                synchronized (room){
                    counter ++;
                }
            }
        }, "t1");

        Thread t2 = new Thread(() -> {
            for (int h = 0; h < 5000; h++) {
                synchronized (room){
                    counter --;
                }
            }
        }, "t2");

        t1.start();
        t2.start();
        t1.join();
        t2.join();
        log.debug("{}", counter);
    }
}
```

输出结果：

![image-20210622003109501](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151754079.png)

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151754719.png" alt="image-20210622003249789" style="zoom:67%;" />

你可以做这样的类比：  

- `synchronized(对象)` 中的对象，可以想象为一个房间（room），有唯一入口（门）房间只能一次进入一人进行计算，线程 t1，t2 想象成两个人  ;
- 当线程 t1 执行到 `synchronized(room)` 时就好比 t1 进入了这个房间，并锁住了门拿走了钥匙，在门内执行`count++` 代码  ;
- 这时候如果 t2 也运行到了 synchronized(room) 时，它发现门被锁住了，只能在门外等待，发生了上下文切换，阻塞住了  ；
- 这中间即使 t1 的 cpu 时间片不幸用完，被踢出了门外（不要错误理解为锁住了对象就能一直执行下去哦），这时门还是锁住的，t1 仍拿着钥匙，t2 线程还在阻塞状态进不来，只有下次轮到 t1 自己再次获得时间片时才能开门进入 ；
- 当 t1 执行完 `synchronized{}` 块内的代码，这时候才会从 obj 房间出来并解开门上的锁，唤醒 t2 线程把钥匙给他。t2 线程这时才可以进入 obj 房间，锁住了门拿上钥匙，执行它的 `count--` 代码   。

用图来表示  ：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151754799.png" />

### 2.3 思考  

synchronized 实际是用**对象锁**保证了**临界区内代码的原子性**，临界区内的代码对外是不可分割的，不会被线程切换所打断。  

为了加深理解，请思考下面的问题  ：

- 如果把 `synchronized(obj)` 放在 for 循环的外面，如何理解？-- 原子性
- 如果t1 `synchronized(obj1) `而 t2 `synchronized(obj2)` 会怎样运作？-- 锁对象
- 如果 t1 `synchronized(obj)` 而 t2 没有加会怎么样？如何理解？-- 锁对象  



### 2.4 面向对象改进  

把需要保护的共享变量放入一个类  :

```java
package com.gyz.demo.test;

import lombok.extern.slf4j.Slf4j;

/**
 * @Description 面向对象改进：把需要保护的共享变量放入一个类
 * @Author GongYuZhuo
 * @Date 2021/6/22 1:01
 * @Version 1.0.0
 */
@Slf4j
public class Test1 {

    public static void main(String[] args) throws InterruptedException {
        Zoom zoom = new Zoom();

        //创建线程t1
        Thread t1 = new Thread(() -> {
            for (int i = 0; i < 5000; i++) {
                zoom.increment();
            }
        }, "t1");

        //创建线程t2
        Thread t2 = new Thread(() -> {
            for (int i = 0; i < 5000; i++) {
                zoom.decrement();
            }
        }, "t2");

        t1.start();
        t2.start();
        //等待线程执行完毕
        t1.join();
        t2.join();
        log.debug("value:{}", zoom.getValue());
    }

}

class Zoom {

   private int value = 0;

    public void increment() {
        synchronized (this) {
            value++;
        }
    }

    public void decrement() {
        synchronized (this) {
            value--;
        }
    }

    public int getValue() {
        synchronized (this) {
            return value;
        }
    }
}
```

输出结果：

![image-20210622010205158](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151754903.png)



***

## 三、方法上的 synchronized  

### 3.1 语法：

```java
class Test{
	public synchronized void test() {
	
	}
}

等价于
class Test{
	public void test() {
		//锁住的是this对象
		synchronized(this) {
		
		}
	}
}
```

```java
class Test{
	public synchronized static void test() {
	
	}
}

等价于
class Test{
	public static void test() {
		//锁住的是类对象
		synchronized(Test.class) {
		
		}
	}
}
```



### 3.2 不加 synchronized 的方法

不加 synchronzied 的方法（无法保证原子性）就好比不遵守规则的人，不去老实排队（好比翻窗户进去的）。 



### 3.3 所谓的“线程八锁”  

**其实就是考察 synchronized 锁住的是哪个对象**  。

- **情况一**：先1后2 （几率大）或 先2后1  

  ```java
  package com.gyz.demo.synchronizedtest;
  
  import lombok.extern.slf4j.Slf4j;
  
  /**
   * @Description 测试synchronized 锁住的是哪个对象
   * @Author GongYuZhuo
   * @Date 2021/6/22 23:39
   * @Version 1.0.0
   */
  @Slf4j(topic = "c.TestLocks")
  public class TestLocks {
  
      public static void main(String[] args) {
          Number number = new Number();
  
          new Thread(() -> {
              log.debug("begin");
              number.a();
          }).start();
  
          new Thread(() -> {
              log.debug("begin");
              number.b();
          }).start();
      }
  }
  
  @Slf4j(topic = "c.Number")
  class Number {
  
      /**
       * @return void
       * @Description 锁住this对象
       */
      public synchronized void a() {
          log.debug("1");
      }
  
      public synchronized void b() {
          log.debug("2");
      }
  }
  ```

  输出结果：

  ![image-20210622235344019](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151754145.png)



- **情况2**：1s后12，或 2 1s后 1  

  ```java
  package com.gyz.demo;
  
  import lombok.extern.slf4j.Slf4j;
  
  import static java.lang.Thread.sleep;
  
  /**
   * @Description 情况2：1s后12，或 2 1s后 1
   * @Author GongYuZhuo
   * @Date 2021/6/22 23:54
   * @Version 1.0.0
   */
  @Slf4j(topic = "c.TestLocks2")
  public class TestLocks2 {
  
      public static void main(String[] args) {
          NumberTwo n1 = new NumberTwo();
          new Thread(() -> {
              log.debug("begin");
              n1.a();
          }).start();
  
          new Thread(() -> {
              log.debug("begin");
              n1.b();
          }).start();
      }
  }
  
  @Slf4j(topic = "c.Number")
  class NumberTwo {
      public synchronized void a()  {
          try {
              sleep(1000);
          } catch (InterruptedException e) {
              e.printStackTrace();
          }
          log.debug("1");
      }
  
      public synchronized void b() {
          log.debug("2");
      }
  }
  ```

  输出结果：

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151754151.png" />

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151754191.png" />

- **情况三**：3 1s 12 或 23 1s 1 或 32 1s 1  

  ```java
  package com.gyz.demo;
  
  import lombok.extern.slf4j.Slf4j;
  
  import static java.lang.Thread.sleep;
  
  /**
   * @Description 情况3：3 1s 12 或 23 1s 1 或 32 1s 1
   * @Author GongYuZhuo
   * @Date 2021/6/23 
   * @Version 1.0.0
   */
  @Slf4j(topic = "c.TestLocks2")
  public class TestLocks2 {
  
      public static void main(String[] args) {
          NumberTwo n1 = new NumberTwo();
          new Thread(() -> {
              log.debug("begin");
              n1.a();
          }).start();
  
          new Thread(() -> {
              log.debug("begin");
              n1.b();
          }).start();
  
          new Thread(() -> {
              log.debug("begin");
              n1.c();
          }).start();
      }
  }
  
  @Slf4j(topic = "c.NumberTwo")
  class NumberTwo {
      public synchronized void a() {
          try {
              sleep(1000);
          } catch (InterruptedException e) {
              e.printStackTrace();
          }
          log.debug("1");
      }
  
      public synchronized void b() {
          log.debug("2");
      }
  
      public void c() {
          log.debug("3");
      }
  }
  ```

  输出结果：

  - <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151754599.png" />
  - <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151754000.png" />

  - <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151754455.png" />



- **情况4**：2 1s 后 1  

  ```java
  package com.gyz.demo;
  
  import lombok.extern.slf4j.Slf4j;
  
  import static java.lang.Thread.sleep;
  
  /**  
   * @Description 情况4：2 1s 后 1
   * @Author GongYuZhuo
   * @Date 2021/6/23 
   * @Version 1.0.0
   */
  @Slf4j(topic = "c.TestLocks2")
  public class TestLocks2 {
  
      public static void main(String[] args) {
          NumberTwo n1 = new NumberTwo();
          NumberTwo n2 = new NumberTwo();
          new Thread(() -> {
              log.debug("begin");
              n1.a();
          }).start();
  
          new Thread(() -> {
              log.debug("begin");
              n2.b();
          }).start();
  
      }
  }
  @Slf4j(topic = "c.NumberTwo")
  class NumberTwo {
      public synchronized void a() {
          try {
              sleep(1000);
          } catch (InterruptedException e) {
              e.printStackTrace();
          }
          log.debug("1");
      }
  
      public synchronized void b() {
          log.debug("2");
      }
  
  }
  ```

  输出结果：

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151754303.png" />



- **情况5**：2 1s 后 1  （锁得是类对象和this对象n1，不存在互斥）

  ```java
  package com.gyz.demo;
  
  import lombok.extern.slf4j.Slf4j;
  
  import static java.lang.Thread.sleep;
  
  /**
   * @Description 情况5：2 1s 后 1
   * @Author GongYuZhuo
   * @Date 2021/6/23 
   * @Version 1.0.0
   */
  @Slf4j(topic = "c.TestLocks2")
  public class TestLocks2 {
  
      public static void main(String[] args) {
          NumberTwo n1 = new NumberTwo();
          new Thread(() -> {
              log.debug("begin");
              NumberTwo.a();
          }).start();
  
          new Thread(() -> {
              log.debug("begin");
              n1.b();
          }).start();
  
      }
  }
  @Slf4j(topic = "c.NumberTwo")
  class NumberTwo {
      /**
       * 锁住得是类对象
       */
      public static synchronized void a() {
          try {
              sleep(1000);
          } catch (InterruptedException e) {
              e.printStackTrace();
          }
          log.debug("1");
      }
  
      /**
       * 锁得this对象：n1
       */
      public synchronized void b() {
          log.debug("2");
      }
  
  }
  ```

  输出结果：

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151754950.png" />



- **情况6**：**锁的是NumberTwo.class类对象**，输出：1s 后12， 或 2 1s后 1  

  ```java
  package com.gyz.demo;
  
  import lombok.extern.slf4j.Slf4j;
  
  import static java.lang.Thread.sleep;
  
  /**
   * @Description 情况6：1s 后12， 或 2 1s后 1
   * @Author GongYuZhuo
   * @Date 2021/6/23 
   * @Version 1.0.0
   */
  @Slf4j(topic = "c.TestLocks2")
  public class TestLocks2 {
  
      public static void main(String[] args) {
          new Thread(() -> {
              log.debug("begin");
              NumberTwo.a();
          }).start();
  
          new Thread(() -> {
              log.debug("begin");
              NumberTwo.b();
          }).start();
  
      }
  }
  @Slf4j(topic = "c.NumberTwo")
  class NumberTwo {
     
      public static synchronized void a() {
          try {
              sleep(1000);
          } catch (InterruptedException e) {
              e.printStackTrace();
          }
          log.debug("1");
      }
  
      
      public static synchronized void b() {
          log.debug("2");
      }
  
  }
  ```
  
  输出结果：
  
  - <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151754135.png" />
- <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151754519.png" />



- **情况7**：a方法锁的是类对象，b方法锁的是n1对象，不存在互斥。输出：2 1s 后 1（和情况5一样）
  
  ```java
  package com.gyz.demo;
  
  import lombok.extern.slf4j.Slf4j;
  
  import static java.lang.Thread.sleep;
  
  /**
   * @Description 情况7：a方法锁的是类对象，b方法锁的是n1对象，不存在互斥。输出：2 1s 后 1
   * @Author GongYuZhuo
   * @Date 2021/6/23 
   * @Version 1.0.0
   */
  @Slf4j(topic = "c.TestLocks2")
  public class TestLocks2 {
  
      public static void main(String[] args) {
          NumberTwo n1 = new NumberTwo();
          new Thread(() -> {
              log.debug("begin");
              NumberTwo.a();
          }).start();
  
          new Thread(() -> {
              log.debug("begin");
              n1.b();
          }).start();
  
      }
  }
  @Slf4j(topic = "c.NumberTwo")
  class NumberTwo {
      /**
       * 锁住得是类对象
       */
      public static synchronized void a() {
          try {
              sleep(1000);
          } catch (InterruptedException e) {
              e.printStackTrace();
          }
          log.debug("1");
      }
  
      /**
       * 锁得this对象：n1
       */
      public  synchronized void b() {
          log.debug("2");
      }
  
  }
  ```
  
  输出结果：
  
  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151754942.png" />
  
  
  
  - **情况8**：锁住得是同一类对象，存在互斥。输出1s 后12， 或 2 1s后 1
  
    ```java
    package com.gyz.demo;
    
    import lombok.extern.slf4j.Slf4j;
    
    import static java.lang.Thread.sleep;
    
    /**
     * @Description 情况8：锁住得是同一类对象，存在互斥。输出1s 后12， 或 2 1s后 1
     * @Author GongYuZhuo
     * @Date 2021/6/23 
     * @Version 1.0.0
     */
    @Slf4j(topic = "c.TestLocks2")
    public class TestLocks2 {
    
        public static void main(String[] args) {
            new Thread(() -> {
                log.debug("begin");
                NumberTwo.a();
            }).start();
    
            new Thread(() -> {
                log.debug("begin");
                NumberTwo.b();
            }).start();
    
        }
    }
    
    @Slf4j(topic = "c.NumberTwo")
    class NumberTwo {
        /**
         * 锁住得是类对象
         */
        public static synchronized void a() {
            try {
                sleep(1000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            log.debug("1");
        }
    
        /**
         * 锁得this对象：n1
         */
        public static synchronized void b() {
            log.debug("2");
        }
    
    }
    ```
  
    输出结果：
  
    - <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151755887.png" />
    - <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151755735.png" />



***

## 四、变量的线程安全分析  

### 4.1 成员变量和静态变量是否线程安全？  

- 如果它们没有共享，则线程安全。
- 如果它们被共享了，根据它们的状态是否能够改变，又分两种情况：
  - 如果只有`读操作`，则`线程安全`。
  - 如果有`读写操作`，则这段代码是[临界区](#临界区)，需要考`虑线程安全 ` 。



### 4.2 局部变量是否线程安全？  

- 局部变量是线程安全的。
- 但局部变量引用的对象则未必：
  - 如果该对象`没有逃离方法`的作用访问，它是线程安全的 。
  - 如果该对象`逃离方法`的作用范围，需要考虑线程安全  。

**示例代码**:

```java
/**
 * 局部变量的线程安全问题
 */
public class Demo1_17 {
    public static void main(String[] args) {
        StringBuilder sb = new StringBuilder();
        sb.append(4);
        sb.append(5);
        sb.append(6);
        new Thread(()->{
            m2(sb);
        }).start();
    }

    public static void m1() {
        StringBuilder sb = new StringBuilder();
        sb.append(1);
        sb.append(2);
        sb.append(3);
        System.out.println(sb.toString());
    }

    public static void m2(StringBuilder sb) {
        sb.append(1);
        sb.append(2);
        sb.append(3);
        System.out.println(sb.toString());
    }

    public static StringBuilder m3() {
        StringBuilder sb = new StringBuilder();
        sb.append(1);
        sb.append(2);
        sb.append(3);
        return sb;
    }
}
```

1. m1()方法中sb为局部变量，线程私有，所以安全！
2. m2()方法的sb作为参数，有可能被其他线程访问，不安全。返回类型改为StringBuffer安全！
3. m3()方法作为return返回值，逃离了当前方法，被别的线程访问到了！不安全！



### 4.3 局部变量线程安全分析  

> **栈是线程私有得，栈帧是栈得基本存储结构，而局部变量表又存在于栈帧中**

```java
public static void test1() {
	int i = 10;
	i++;
}
```

每个线程调用 test1() 方法时局部变量 i，会在每个线程的栈帧内存中被创建多份，因此不存在共享  。

```
public static void test1();
 descriptor: ()V
 flags: ACC_PUBLIC, ACC_STATIC
 Code:
	 stack=1, locals=1, args_size=0
	 0: bipush 10
	 2: istore_0
	 3: iinc 0, 1
	 6: return
	 LineNumberTable:
	 line 10: 0
	 line 11: 3
	 line 12: 6
	 LocalVariableTable:
	 Start Length Slot Name Signature
	 3 4 0 i I

```

如图  ：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151755224.png" />

局部变量的引用稍有不同  。

> **成员变量的例子**  

示例代码：

```java
package com.gyz.demo.threadsafe;

import java.util.ArrayList;

/**
 * @ClassName ThreadUnsafe
 * @Description 成员变量得线程安全例子
 * @Author GongYuZhuo
 * @Date 2021/6/23 17:22
 **/
public class ThreadUnsafe {

    static final int THREAD_NUMBER = 2;
    static final int LOOP_NUMBER = 200;

    ArrayList<String> list = new ArrayList<>();

    public void method1(int loopNumber) {
        //临界区，会产生竟态条件
        for (int i = 0; i < loopNumber; i++) {
            method2();
            method3();
        }
    }

    public void method2() {
        list.add("1");
    }

    public void method3() {
        list.remove(0);
    }

    public static void main(String[] args) {
        ThreadUnsafe test = new ThreadUnsafe();
        for (int i = 0; i < THREAD_NUMBER; i++) {
            new Thread(() -> {
                test.method1(LOOP_NUMBER);
            }, "Thread" + i).start();
        }
    }
}

```

输出结果：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151755352.png"/>

从结果可知：如果线程2 还未 add，线程1 remove 就会报错。

**分析**：  

- 无论哪个线程中的 method2 引用的都是同一个对象中的 list 成员变量  。

- method3 与 method2 分析相同  。

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151755974.png" />

> **将 list 修改为局部变量**  

示例代码：

```java
package com.gyz.demo.threadsafe;

import lombok.extern.slf4j.Slf4j;
import sun.rmi.runtime.Log;

import java.util.ArrayList;

/**
 * @ClassName ThreadUnsafe
 * @Description 局部变量得线程安全例子
 * @Author GongYuZhuo
 * @Date 2021/6/23 17:25
 **/
@Slf4j(topic = "c.ThreadUnsafe")
public class ThreadUnsafe {

    static final int THREAD_NUMBER = 2;
    static final int LOOP_NUMBER = 200;


    public final void method1(int loopNumber) {
        ArrayList<String> list = new ArrayList<>();
        //临界区，会产生竟态条件
        for (int i = 0; i < loopNumber; i++) {
            method2(list);
            method3(list);
        }
    }

    private void method2(ArrayList<String> list) {
        list.add("1");
    }

    private void method3(ArrayList<String> list) {
        list.remove(0);
    }

    public static void main(String[] args) {
        ThreadUnsafe test = new ThreadUnsafe();
        for (int i = 0; i < THREAD_NUMBER; i++) {
            new Thread(() -> {
                test.method1(LOOP_NUMBER);
            }, "Thread" + i).start();
        }
    }
}

```

输出结果：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151755015.png" />

**分析**：  

- list 是局部变量，每个线程调用时会创建其不同实例，`没有共享  `。
- 而 method2 的参数是从 method1 中传递过来的，与 method1 中引用同一个对象  。
- method3 的参数分析与 method2 相同  。

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151755729.png" />



> **方法访问修饰符带来的思考，如果把 method2 和 method3 的方法修改为 public 会不会代理线程安全问题？**  

- 情况1：有其它线程调用 method2 和 method3。

  - 只修改为`public`修饰,此时`不会出现线程安全`的问题， 即使线程2调用method2/3方法传过来的`list对象`也是线程2调用method1方法时得list对象，即一个线程内传的都是同一list对象， 不可能是线程1调用method1方法传的对象。

- 情况2：在 情况1 的基础上，为 ThreadSafe 类添加子类，子类覆盖 method2 或 method3 方法，即 ：

  ```java
  package com.gyz.demo.threadsafe;
  
  import java.util.ArrayList;
  
  /**
   * @ClassName ThreadSafe
   * @Description 线程安全
   * @Author GongYuZhuo
   * @Date 2021/6/23 18:00
   */
  public class ThreadSafe {
      static final int THREAD_NUMBER = 2;
      static final int LOOP_NUMBER = 200;
  
  
      public final void method1(int loopNumber) {
          ArrayList<String> list = new ArrayList<>();
          //临界区，会产生竟态条件
          for (int i = 0; i < loopNumber; i++) {
              method2(list);
              method3(list);
          }
      }
  
      private void method2(ArrayList<String> list) {
          list.add("1");
      }
  
      public void method3(ArrayList<String> list) {
          list.remove(0);
      }
  
      public static void main(String[] args) {
          ThreadUnsafe test = new ThreadUnsafe();
          for (int i = 0; i < THREAD_NUMBER; i++) {
              new Thread(() -> {
                  test.method1(LOOP_NUMBER);
              }, "Thread" + i).start();
          }
      }
  }
  
  class ThreadSafeSubClass extends ThreadSafe {
      @Override
      public void method3(ArrayList<String> list) {
          new Thread(() -> {
              list.remove(0);
          }).start();
      }
  }
  ```

  从这个例子可以看出 private 或 final 提供【安全】的意义所在，请体会开闭原则中的【闭】  。



### 4.4 常见线程安全类  

#### 4.4.1  线程安全类  

- String
- Integer
- StringBuffer
- Random
- Vector
- Hashtable
- java.util.concurrent 包下的类  

这里说它们是线程安全的是指，多个线程调用它们同一个实例的某个方法时，是线程安全的。也可以理解为  ：

```
Hashtable table = new Hashtable();

	new Thread(()->{
		table.put("key", "value1");
	}).start();
	
	new Thread(()->{
		table.put("key", "value2");
	}).start();
```

- 它们的每个方法是原子的。
- **注意它们多个方法的组合不是原子的**，所以可能**会出现线程安全问题**。



#### 4.4.2 线程安全类方法的组合  

分析下面代码是否线程安全？  

```java
Hashtable table = new Hashtable();
	// 线程1，线程2
	if( table.get("key") == null) {
		table.put("key", value);
	}
```

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151755816.png" />

这里只能是get方法内部是线程安全的, put方法内部是线程安全的. 组合起来使用还是会受到`上下文切换`的影响。当线程 1 执行完 get(“key”) ，这是一个原子操作没出问题，但是在 get(“key”) == null 比较时，如果线程1的时间片用完了，线程 2 获取时间片执行了 get(“key”) == null 操作，然后进行 put(“key”, “v2”) 操作，结束后，线程 1 被分配 cpu 时间片继续执行，执行 put 操作就会出现线程安全问题。


#### 4.4.3 不可变类线程安全性  

String、Integer 等都是不可变类，因为其内部的状态不可以改变，因此它们的方法都是线程安全的。但是String 有 `replace`，`substring` 等方法【可以】改变值啊，那么这些方法又是如何保证线程安全的呢？    

- **其实调用这些方法返回的已经是一个新创建的对象了！** 在字符串常量池中当修改了String的值,它不会再原有的基础上修改, 而是会重新开辟一个空间来存储。

- substring方法举例：

  ```java
   public String substring(int beginIndex, int endIndex) {
          if (beginIndex < 0) {
              throw new StringIndexOutOfBoundsException(beginIndex);
          }
          if (endIndex > value.length) {
              throw new StringIndexOutOfBoundsException(endIndex);
          }
          int subLen = endIndex - beginIndex;
          if (subLen < 0) {
              throw new StringIndexOutOfBoundsException(subLen);
          }
          return ((beginIndex == 0) && (endIndex == value.length)) ? this
                  : new String(value, beginIndex, subLen); // 新建一个对象，然后返回，没有修改等操作，是线程安全的。
      }
  ```

  

### 4.5 实例分析  

**示例一**：

Servlet运行在Tomcat环境下并只有一个实例，因此会被Tomcat得多个线程共享使用，因此存在成员变量得共享问题。

```java
public class MyServlet extends HttpServlet {
	 // 是否安全？  否：HashMap不是线程安全的，HashTable是
	 Map<String,Object> map = new HashMap<>();
	 // 是否安全？  是:String 为不可变类，线程安全
	 String S1 = "...";
	 // 是否安全？ 是
	 final String S2 = "...";
	 // 是否安全？ 否：不是常见的线程安全类
	 Date D1 = new Date();
	 // 是否安全？  否：引用值D2不可变，但是日期里面的其它属性比如年月日可变。与字符串的最大区别是Date里面的属性可变。
	 final Date D2 = new Date();
 
	 public void doGet(HttpServletRequest request,HttpServletResponse response) {
	  // 使用上述变量
	 }
}

```



**示例二**：

Servlet运行在Tomcat环境下并只有一个实例，userService作为成员变量会被Tomcat得多个线程共享使用，不是线程安全的。

```java
public class MyServlet extends HttpServlet {
	// 是否安全？否 
	private UserService userService = new UserServiceImpl();
	
	public void doGet(HttpServletRequest request, HttpServletResponse response) {
		userService.update(...);
	}
}

public class UserServiceImpl implements UserService {
	// 记录调用次数
	private int count = 0;
	public void update() {
		// ...
		count++;
	}
}
```



**示例三**：

分析线程是否安全，先对类得`成员变量`、`类变量`、`局部变量`进行考虑，如果变量会在各个线程之间共享，那么就得考虑线程安全问题了，如果变量A引用得是线程安全类的实例，并且只调用该线程安全类的一个方法，那么该变量A是线程安全的。如下所示的类不是线程安全的，MyAspect切面类只有一个实例，成员变量start会被多个线程同时进行读写操作。

```java
@Aspect
@Component
public class MyAspect {
        // 是否安全？
        private long start = 0L;

        @Before("execution(* *(..))")
        public void before() {
            start = System.nanoTime();
        }

        @After("execution(* *(..))")
        public void after() {
            long end = System.nanoTime();
            System.out.println("cost time:" + (end-start));
        }
    }

```



**示例四**：

MyServlet 、UserServiceImpl、 UserDaoImpl类都只有一个实例，UserDaoImpl类中没有成员变量，update方法里的变量引用的对象不是线程共享的，所以是线程安全的；UserServiceImpl类中只有一个线程安全的UserDaoImpl类的实例，那么UserServiceImpl类也是线程安全的，同理 MyServlet也是线程安全的。

```java
public class MyServlet extends HttpServlet {
	// 是否安全
	private UserService userService = new UserServiceImpl();
	
	public void doGet(HttpServletRequest request, HttpServletResponse response) {
		userService.update(...);
	}
}


public class UserServiceImpl implements UserService {
	// 是否安全
	private UserDao userDao = new UserDaoImpl();
	
	public void update() {
		userDao.update();
	}
}

public class UserDaoImpl implements UserDao {
	public void update() {
		String sql = "update user set password = ? where username = ?";
		// 是否安全
		try (Connection conn = DriverManager.getConnection("","","")){
			// ...
		} catch (Exception e) {
			// ...
	}
  }
}
```



**示例五**：

UserDaoImpl类中有成员变量，那么多个线程可以对成员变量**conn** 同时进行操作，故是不安全的。（`userDao是成员变量`）

```java
public class MyServlet extends HttpServlet {
	// 是否安全
	private UserService userService = new UserServiceImpl();
	
    public void doGet(HttpServletRequest request, HttpServletResponse response) {
		userService.update(...);
	}
}

public class UserServiceImpl implements UserService {
	// 是否安全
	private UserDao userDao = new UserDaoImpl();
    
	public void update() {
		userDao.update();
	}
}

public class UserDaoImpl implements UserDao {
	// 是否安全
	private Connection conn = null;
	
    public void update() throws SQLException {
		String sql = "update user set password = ? where username = ?";
		conn = DriverManager.getConnection("","","");
		// ...
		conn.close();
	}
}
```



**示例六**：

跟示例三大体相似，UserServiceImpl类的update方法中 userDao是作为局部变量存在的，所以每个线程访问的时候都会新建有一个UserDao对象，新建的对象是线程独有的，所以是线程安全的。（`注意：userDao在update方法内`）

```java
public class MyServlet extends HttpServlet {
	// 是否安全
	private UserService userService = new UserServiceImpl();
	
    public void doGet(HttpServletRequest request, HttpServletResponse response) {
		userService.update(...);
	}
}

public class UserServiceImpl implements UserService {
	public void update() {
		UserDao userDao = new UserDaoImpl();
		userDao.update();
	}
}

public class UserDaoImpl implements UserDao {
	// 是否安全
	private Connection = null;
	public void update() throws SQLException {
		String sql = "update user set password = ? where username = ?";
		conn = DriverManager.getConnection("","","");
		// ...
		conn.close();
	}
}
```



**示例七**：

因为 foo 方法可以被重写，导致线程不安全。在 String 类中就考虑到了这一点，String 类是 `final` 关键字声明的，`子类不能重写它的方法`。

```java
public abstract class Test {
	public void bar() {
		// 是否安全
		SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
		foo(sdf);
    }

    public abstract foo(SimpleDateFormat sdf);
	
    public static void main(String[] args) {
		new Test().bar();
	}
}
```

其中 foo 的行为是不确定的，可能导致不安全的发生，被称之为**外星方法**  。

```java
public void foo(SimpleDateFormat sdf) {
	String dateStr = "1999-10-11 00:00:00";
	
	for (int i = 0; i < 20; i++) {
		new Thread(() -> {
			try {
				sdf.parse(dateStr);
			} catch (ParseException e) {
				e.printStackTrace();
			}
		}).start();
	}
}
```



***

## 五、习题  

### 5.1 卖票练习  

> **存在线程安全问题举例**

示例代码：

```java
package com.gyz.demo.threadsafe;

import jdk.internal.dynalink.beans.StaticClass;
import lombok.extern.slf4j.Slf4j;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.Vector;

/**
 * @ClassName ExerciseSell
 * @Description 卖票问题测试线程安全
 * @Author GongYuZhuo
 * @Date 2021/6/24 12:40
 */
@Slf4j(topic = "c.ExerciseSell")
public class ExerciseSell {

    public static void main(String[] args) throws InterruptedException {
        TicketWindow ticketWindow = new TicketWindow(1000);

        List<Thread> threadList = new ArrayList<>();
        //用来存储卖的票
        List<Integer> sellList = new Vector<>();

        for (int i = 0; i < 2000; i++) {
            Thread t1 = new Thread(() -> {
                //临界区，对共享变量count有独写操作。
                int sellCount = ticketWindow.sell(randomCount(5));
                //同样存在线程安全问题，但是共享变量sellList和共享变量ticketWindow不存在安全问题：两个共享变量
                sellList.add(sellCount);
            });
            threadList.add(t1);
            t1.start();
        }

        //等待线程结束
        for (Thread thread : threadList) {
            thread.join();
        }

        //卖出去的票求和
        log.debug("卖出票数:{}", sellList.stream().mapToInt(c -> c).sum());
        // 剩余票数
        log.debug("剩余票数:{}", ticketWindow.getCount());
    }

    static Random random = new Random();

    public static int randomCount(int amount) {
        //生成一个范围在0~5（不包含5）内的任意正整数
        return random.nextInt(amount) + 1;
    }
}

class TicketWindow {
    private int count;

    public TicketWindow(int count) {
        this.count = count;
    }

    public int getCount() {
        return count;
    }

    /**
     * 卖票方法
     * @param amount： 卖出的票数
     * @return
     */
    public  int sell(int amount) {
        if (this.count >= amount) {
            this.count -= amount;
            return amount;
        } else {
            return 0;
        }
    }
}
```

测试方法：windos用如下脚本  （/L：根据范围进行循环，%：表示循环变量）

```shell
for /L %n in (1,1,10) do java -cp ".;C:\Users\Administrator\.m2\repository\ch\qos\logback\logback-classic\1.2.3\logback-classic-1.2.3.jar;C:\Users\Administrator\.m2\repository\ch\qos\logback\logback-core\1.2.3\logback-core-1.2.3.jar;C:\Users\Administrator\.m2\repository\org\slf4j\slf4j-api\1.7.26\slf4j-api-1.7.26.jar" com.gyz.demo.threadsafe.ExerciseSell
```

输出结果：

![image-20210624152406119](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151755216.png)

`sellList`和`ticketWindow`都为全局变量，存在线程安全问题。但是`sellList`和`ticketWindow`之间不存在线程安全问题，因为是两个共享变量。

> 解决方法：sell方法用`synchronized`关键字修饰

代码：

```java
package com.gyz.demo.threadsafe;

import jdk.internal.dynalink.beans.StaticClass;
import lombok.extern.slf4j.Slf4j;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.Vector;

/**
 * @ClassName ExerciseSell
 * @Description 卖票问题测试线程安全
 * @Author GongYuZhuo
 * @Date 2021/6/24 12:40
 */
@Slf4j(topic = "c.ExerciseSell")
public class ExerciseSell {

    public static void main(String[] args) throws InterruptedException {
        TicketWindow ticketWindow = new TicketWindow(1000);

        List<Thread> threadList = new ArrayList<>();
        //用来存储卖的票
        List<Integer> sellList = new Vector<>();

        for (int i = 0; i < 2000; i++) {
            Thread t1 = new Thread(() -> {
                //临界区，对共享变量count有独写操作。
                int sellCount = ticketWindow.sell(randomCount(5));
                //同样存在线程安全问题，但是共享变量sellList和共享变量ticketWindow不存在安全问题：两个共享变量
                sellList.add(sellCount);
            });
            threadList.add(t1);
            t1.start();
        }

        //等待线程结束
        for (Thread thread : threadList) {
            thread.join();
        }

        //卖出去的票求和
        log.debug("卖出票数:{}", sellList.stream().mapToInt(c -> c).sum());
        // 剩余票数
        log.debug("剩余票数:{}", ticketWindow.getCount());
    }

    static Random random = new Random();

    public static int randomCount(int amount) {
        //生成一个范围在0~5（不包含5）内的任意正整数
        return random.nextInt(amount) + 1;
    }
}

class TicketWindow {
    private int count;

    public TicketWindow(int count) {
        this.count = count;
    }

    public int getCount() {
        return count;
    }

    /**
     * 卖票方法
     * @param amount： 卖出的票数
     * @return
     */
    public synchronized int sell(int amount) {
        if (this.count >= amount) {
            this.count -= amount;
            return amount;
        } else {
            return 0;
        }
    }
}
```

输出结果：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151755991.png" />

保证了线程安全性。



### 5.2 转账练习  

> 举例分析

```java
package com.gyz.demo.threadsafe;

import com.sun.media.jfxmedia.logging.Logger;
import lombok.extern.slf4j.Slf4j;

import java.util.Random;

/**
 * @ClassName ExerciseTransfer
 * @Description 测试线程安全：转账问题
 * @Author GongYuZhuo
 * @Date 2021/6/24 15:31
 */
@Slf4j(topic = "c.ExerciseTransfer")
public class ExerciseTransfer {

    public static void main(String[] args) throws InterruptedException {
        Account a = new Account(1000);
        Account b = new Account(1000);

        //向b账户转账
        Thread threadA = new Thread(() -> {
            for (int i = 0; i < 2000; i++) {
                a.transferTo(b, random());
            }
        });

        //向a账户转账
        Thread threadB = new Thread(() -> {
            for (int i = 0; i < 2000; i++) {
                b.transferTo(a, random());
            }
        });

        threadA.start();
        threadB.start();
        threadA.join();
        threadB.join();

        log.debug("查看转账2000次之后的总金额:{}", a.getMoney() + b.getMoney());
    }

    public static int random() {
        //Random线程安全类
        return new Random().nextInt(100) + 1;
    }
}

/**
 * 账户
 */
class Account {
    /** 金额 */
    private int money;

    public Account(int money) {
        this.money = money;
    }

    public void setMoney(int money) {
        this.money = money;
    }

    public int getMoney() {
        return money;
    }

    /**
     * 转账方法
     * @param target：对方余额
     * @param amount：转账金额
     */
    public void transferTo(Account target, int amount) {

            this.setMoney(this.getMoney() - amount);
            target.setMoney(target.getMoney() + amount);

    }
}
```

输出结果：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151755664.png" />

> 解决：**锁类对象Account.class**

```java
package com.gyz.demo.threadsafe;

import com.sun.media.jfxmedia.logging.Logger;
import lombok.extern.slf4j.Slf4j;

import java.util.Random;

/**
 * @ClassName ExerciseTransfer
 * @Description 测试线程安全：转账问题
 * @Author GongYuZhuo
 * @Date 2021/6/24 15:31
 */
@Slf4j(topic = "c.ExerciseTransfer")
public class ExerciseTransfer {

    public static void main(String[] args) throws InterruptedException {
        Account a = new Account(1000);
        Account b = new Account(1000);

        //向b账户转账
        Thread threadA = new Thread(() -> {
            for (int i = 0; i < 2000; i++) {
                a.transferTo(b, random());
            }
        });

        //向a账户转账
        Thread threadB = new Thread(() -> {
            for (int i = 0; i < 2000; i++) {
                b.transferTo(a, random());
            }
        });

        threadA.start();
        threadB.start();
        threadA.join();
        threadB.join();

        log.debug("查看转账2000次之后的总金额:{}", a.getMoney() + b.getMoney());
    }

    public static int random() {
        //Random线程安全类
        return new Random().nextInt(100) + 1;
    }
}

/**
 * 账户
 */
class Account {
    /** 金额 */
    private int money;

    public Account(int money) {
        this.money = money;
    }

    public void setMoney(int money) {
        this.money = money;
    }

    public int getMoney() {
        return money;
    }

    /**
     * 转账方法
     * @param target：对方余额
     * @param amount：转账金额
     */
    public void transferTo(Account target, int amount) {
        synchronized (Account.class) {
            this.setMoney(this.getMoney() - amount);
            target.setMoney(target.getMoney() + amount);
        }
    }
}
```

输出结果：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151755143.png" />



***

## 六、Monitor （管程/监视器）

[概念引用](https://zhuanlan.zhihu.com/p/85812140)

管程（Monitor）是一种和信号量（Sophomore）等价的同步机制。它在Java并发编程中也非常重要，虽然没有直接接触管程，但它确实是`synchronized`和`wait()/notify()`等线程同步和线程间协作工具的基石：当我们在使用这些工具时，其实是它在背后提供了支持。简单来说：

- 管程使用锁（lock）确保了在任何情况下管程中只有一个活跃的线程，即确保线程互斥访问临界区。
- 管程使用条件变量（Condition Variable）提供的等待队列（Waiting Set）实现线程间协作，当线程暂时不能获得所需资源时，进入队列等待，当线程可以获得所需资源时，从等待队列中唤醒。

### 6.1 * Java 对象头  

> **对象头包含两部分**：`运行时元数据（Mark Word）`和`类型指针（Klass Word）`。

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151755248.png" />

**如果对象是数组，还需要记录数组的长度**

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151756208.png" />

<a name="运行时元数据（Mark Word）">运行时元数据（Mark Word）</a>

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151756719.png" />

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151756399.png" />

1. **hashcode**：31位的对象标识hashCode，采用延迟加载技术。调用方法System.identityHashCode()计算，并会将结果写到该对象头中。它是一个地址，用于栈对堆空间中对象的引用指向，不然栈是无法找到堆中对象的；
2. **GC分代年龄**：记录幸存者区对象被GC之后的年龄age，一般age为15（`阈值为15`的原因是因为age只有4位最大就可以将阈值设置15）之后下一次GC就会直接进入老年代，要是还没有等到年龄为15，`幸存者区就满了`怎么办？那就下一次GC就将大对象或者年龄大者直接进入老年代。
3. **epoch**：偏向锁时间戳
4. **ptr_to_lock_record:62**：轻量级锁状态下，指向栈中所记录的指针
5. **ptr_to_heavyweight_monitor:62**：重量级锁状态下，指向对象监视器的Monitor指针
6. **State**：记录一些加锁的信息(我们都是使用加锁的话，在底层是锁的对象，而不是锁的代码，锁对象的话，那会改变什么信息来表示这个对象被改变了呢？也就是怎么才算加锁了呢？

   - **答案**：就是改变这个对象的对象头的锁信息来标识已经加锁，下一个线程来获取是获取不到的，底层是通过比对当前的线程的那个值与它所期望的值是否相同，这时候一直自旋直到与期望值相同，相同就获取到锁，反之则进入到阻塞队列等待，这个机制叫做**CAS**，比较并交换–这是偏向锁的原理)。

   - 另外：锁的状态有两位数的`空间标识`，这样就可以实现用较少的空间去存储更多的信息，**0 表示不可偏向，1 表示可偏向**。

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151756375.png" />





- **类型指针（Klass Word）：是对方法区中类元信息的引用**。



> 
>
> 对象的结构如下：

一个**对象的内存结构包括：`运行时元数据、类型指针、数据类型、对齐填充`**。

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151756834.png" />



### 6.2 * 原理之 Monitor(锁)  

> 
>
> **多线程同时访问临界区: 使用重量级锁**

JDK6对Synchronized的优先状态：`偏向锁–>轻量级锁–>重量级锁`

每个Java对象都可以关联一个**操作系统的Monitor**，如果使用`synchronized`给**对象上锁（重量级）**，该对象头的Mark Word中就被设置为**指向Monitor对象的指针**。

> 
>
> **原理解释**

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151756447.png" />

- 刚开始时 Monitor 中的 Owner 为 null
- 当 Thread-2 执行` synchronized(obj){} `代码时就会将 Monitor 的所有者Owner 设置为 Thread-2，上锁成功，Monitor 中同一时刻只能有一个 Owner
- 当 Thread-2 占据锁时，如果线程 Thread-3 ，Thread-4 也来执行synchronized(obj){} 代码，就会进入 **EntryList（阻塞队列）** 中变成**BLOCKED（阻塞）** 状态
- Thread-2 执行完同步代码块的内容，然后唤醒 EntryList 中等待的线程来竞争锁，竞争时是非公平的
- 图中 WaitSet 中的 Thread-0，Thread-1 是之前获得过锁，但条件不满足进入 WAITING 状态的线程

**注意**：

- synchronized 必须是进入同一个对象的 monitor 才有上述的效果，也就要使用同一把锁。
- 不加 synchronized 的对象不会关联监视器，不遵从以上规则。

**More**：[更详细参考:监视器（Monitor）](https://www.cnblogs.com/aspirant/p/11470858.html)

### 6.3 * 原理之synchronized（字节码角度）

示例代码：

```java
static final Object lock = new Object();
static int counter = 0;

public static void main(String[] args) {
    synchronized (lock) {
        counter++;
    }
}

```

反编译后的部分字节码(javac xxx.java ; javap -c xxx.class):

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151756487.png" />

​	**注意**：方法级别的 synchronized 不会在字节码指令中有所体现。



***

## 七、synchronized原理进阶（重点）

下文将会探索synchronized的基本使用、实现机制、Java是如何对它进行了优化、锁优化机制、锁的存储结构等升级过程。[参考文章](https://www.cnblogs.com/aspirant/p/11470858.html)

### 7.1 基本使用

> Synchronized是Java中解决并发问题的一种最常用的方法，也是最简单的一种方法。Synchronized的作用主要有三个：

1. 原子性：确保线程互斥的访问同步代码；
2. 可见性：保证共享变量的修改能够及时可见。其实就是通过Java内存模型中的 “对一个变量unlock之前，必须要同步到主内存中；如果对一个变量进行lock操作，则将会清空工作内存中此变量的值，在执行引擎使用此变量前，需要重新从主存中load操作或assign操作初始化变量值”来保证的；
3. 有序性：保证指令不会受 cpu指令并行优化的影响。

> 从语法上讲，Synchronized可以把任何一个非null对象作为 "锁" ，在HotSpot JVM实现中，**锁有个专门的名字：对象监视器（Object Monitor）**。

> Synchronized总共有三种用法：

1. 当synchronized作用在实例方法时，监视器锁（monitor）便是对象实例（this）；
2. 当synchronized作用在静态方法时，监视器锁（monitor）便是对象的Class实例，因为Class数据存在于永久代，因此静态方法锁相当于该类的一个全局锁；
3. 当synchronized作用在某一个对象实例时，监视器锁（monitor）便是括号括起来的对象实例；

> **注意**

synchronized 内置锁 是一种 对象锁（锁的是对象而非引用变量），**作用粒度是对象 ，可以用来实现对临界资源的同步互斥访问 ，是可重入的。其可重入最大的作用是避免死锁**，如：**子类同步方法调用了父类同步方法，如没有可重入的特性，则会发生死锁；**



### 7.2 同步原理

> **数据同步需要依赖锁，那锁的同步又依赖谁？**

**synchronized给出的答案是在软件层面依赖JVM，而 j.u.c.Lock 给出的答案是在硬件层面依赖特殊的CPU指令**。

当一个线程访问同步代码块时，首先是需要得到锁才能执行同步代码，当退出或者抛出异常时必须要释放锁，那么它是如何来实现这个机制的呢？我们先看一段简单的代码：

```java
package com.gyz.demo;

/**
 * @ClassName SynchronizedDemo
 * @Description 当一个线程访问同步代码块时，首先是需要得到锁才能执行同步代码，当退出或者抛出异常时必须要释放锁，
 *              那么它是如何来实现这个机制的呢？
 * @Author GongYuZhuo
 * @Date 2021/6/25 12:05
 */
public class SynchronizedDemo {
    public void method() {
        synchronized (this) {
            System.out.println("Method 1 start");
        }
    }
}

```

反编译后的字节码（命令：target/classes目录下，javap -c  com.gyz.demo.SynchronizedDemo）：

```shell
Compiled from "SynchronizedDemo.java"
public class com.gyz.demo.SynchronizedDemo {
  public com.gyz.demo.SynchronizedDemo();
    Code:
       0: aload_0
       1: invokespecial #1                  // Method java/lang/Object."<init>":()V
       4: return

  public void method();
    Code:
       0: aload_0
       1: dup
       2: astore_1
       3: monitorenter
       4: getstatic     #2                  // Field java/lang/System.out:Ljava/io/PrintStream;
       7: ldc           #3                  // String Method 1 start
       9: invokevirtual #4                  // Method java/io/PrintStream.println:(Ljava/lang/String;)V
      12: aload_1
      13: monitorexit
      14: goto          22
      17: astore_2
      18: aload_1
      19: monitorexit
      20: aload_2
      21: athrow
      22: return
    Exception table:
       from    to  target type
           4    14    17   any
          17    20    17   any
}

```

反编译结果：

- **monitorenter**：**每个对象都是一个监视器锁（monitor）**。当monitor被占用时就会处于锁定状态，线程执行monitorenter指令时尝试获取monitor的所有权，过程如下：
  1. 如果monitor的进入数为0，则该线程进入monitor，然后将进入数设置为1，该线程即为monitor的所有者；
  2. 如果线程已经占有该monitor，只是重新进入，则进入monitor的进入数加1；
  3. 如果其他线程已经占用了monitor，则该线程进入**阻塞状态**，直到monitor的进入数为0，再重新尝试获取monitor的所有权；
- **monitorexit**：执行monitorexit的线程必须是objectref（锁对象引用reference）所对应的monitor的所有者。指令执行时，monitor的进入数减1，如果减1后进入数为0，那线程退出monitor，不再是这个monitor的所有者。其他被这个monitor阻塞的线程可以尝试去获取这个 monitor 的所有权。

monitorexit指令出现了两次：

- 第1次为同步正常退出释放锁；
- 第2次为发生异步退出释放锁；

> **Synchronized的实现原理**

**Synchronized的语义底层是通过一个monitor的对象来完成，其实wait/notify等方法也依赖于monitor对象，这就是为什么只有在同步的块或者方法中才能调用wait/notify等方法，否则会抛出java.lang.IllegalMonitorStateException的异常的原因。**

> **再来看一下同步方法**

```java
package com.gyz.demo;

/**
 * @ClassName SynchronizedMethod
 * @Description synchronized修饰方法时实现原理
 * @Author GongYuZhuo
 * @Date 2021/6/25 14:41
 */
public class SynchronizedMethod {
    public synchronized void method() {
        System.out.println("Hello World");
    }
}

```

反编译后结果（javap -verbose com.gyz.demo.SynchronizedMethod）：

```shell
...
public synchronized void method();
    descriptor: ()V
    flags: ACC_PUBLIC, ACC_SYNCHRONIZED
    Code:
      stack=2, locals=1, args_size=1
         0: getstatic     #2                  // Field java/lang/System.out:Ljava/io/PrintStream;
         3: ldc           #3                  // String Hello World
         5: invokevirtual #4                  // Method java/io/PrintStream.println:(Ljava/lang/String;)V
         8: return
      LineNumberTable:
        line 11: 0
        line 12: 8
      LocalVariableTable:
        Start  Length  Slot  Name   Signature
            0       9     0  this   Lcom/gyz/demo/SynchronizedMethod;
}

```

从编译的结果来看，方法的同步并没有通过指令 `monitorenter` 和 `monitorexit` 来完成（理论上其实也可以通过这两条指令来实现），不过相对于普通方法，其常量池中多了 `ACC_SYNCHRONIZED` 标示符。JVM就是根据该标示符来实现方法的同步的；

当方法调用时，调用指令将会检查方法的 `ACC_SYNCHRONIZED` 访问标志是否被设置，如果设置了，执行线程将先获取monitor，获取成功之后才能执行方法体，方法执行完后再释放monitor。<span style="color:red;">在方法执行期间，其他任何线程都无法再获得同一个monitor对象。</span>

> **总结**

两种同步方式本质上没有区别，只是`方法的同步`是一种隐式的方式来实现，`无需通过字节码`来完成。两个指令的执行是JVM通过调用操作系统的`互斥原语mutex`来实现，被阻塞的线程会被挂起、等待重新调度，会导致“用户态和内核态”两个态之间来回切换，对性能有较大影响。



### 7.3 同步概念

#### 7.3.1 Java对象头（详细）

在JVM中，**对象**在内存中的布局分为三块区域：`对象头`、`实例数据`和`对齐填充`。如下图所示：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151756895.png" />

1. **实例数据**：存放类的属性数据信息，包括父类的属性信息；
2. **对齐填充**：由于虚拟机要求 对象起始地址必须是8字节的整数倍。填充数据不是必须存在的，仅仅是为了字节对齐；
3. **对象头**：Java对象头一般占有2个机器码（在32位虚拟机中，1个机器码等于4字节，也就是32bit，在64位虚拟机中，1个机器码是8个字节，也就是64bit），但是 如果对象是数组类型，则需要3个机器码，因为JVM虚拟机可以通过Java对象的元数据信息确定Java对象的大小，但是无法从数组的元数据来确认数组的大小，所以用一块来记录数组长度。



> 
>
> **Synchronized用的锁就是存在Java对象头里的**，那么什么是Java对象头呢？

- Hotspot虚拟机的对象头主要包括两部分数据：**Mark Word（标记字段）**、Class Pointer（类型指针）。
- 其中 Class Pointer是对象**指向它的类元数据的指针**，虚拟机通过这个指针来**确定这个对象是哪个类的实例**，Mark Word用于存储对象自身的运行时数据，它是实现轻量级锁和偏向锁的关键。



> 
>
> **Java对象头具体结构描述如下：**

| 长度     | 内容                   | 说明                               |
| -------- | ---------------------- | ---------------------------------- |
| 32/64bit | Mark Word              | 存储对象的hashcode或锁状态相关信息 |
| 32/64bit | Class Metadata Address | 存储到对象类型数据的指针           |
| 32/64bit | Array Length           | 数组的长度（如果当前对象是数组）   |



> 
>
> **Java对象头结构组成**

**运行时元数据（Mark Word）**

Mark Word用于存储对象自身的运行时数据，如：哈希码（HashCode）、GC分代年龄、锁状态标志、线程持有的锁、偏向线程 ID、偏向时间戳等。比如锁膨胀就是借助Mark Word的偏向的线程ID。参考：[JAVA锁的膨胀过程和优化](https://www.cnblogs.com/aspirant/p/11705068.html)

Java对象头**无锁状态**下Mark Word部分的存储结构（32位虚拟机）：

![image-20210625155342703](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151756055.png)



> 
>
> **Mark Word存储结构** 

**对象头信息是与对象自身定义的数据无关的额外存储成本**，但是考虑到虚拟机的空间效率，Mark Word被设计成一个非固定的数据结构以便在极小的空间内存存储尽量多的数据，它会根据对象的状态复用自己的存储空间，也就是说，Mark Word会随着程序的运行发生变化，可能变化为存储以下4种数据：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151756754.png" />

在64位虚拟机下，Mark Word是64bit大小的，其存储结构如下：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151756535.png" />

对象头的最后两位存储了锁的标志位，01是初始状态，未加锁，其对象头里存储的是对象本身的哈希码，**随着锁级别的不同，对象头里会存储不同的内容**。

- 偏向锁存储的是当前占用此对象的线程ID；
- 而轻量级则存储指向线程栈中锁记录的指针。

从这里我们可以看到，“锁”这个东西，可能是个锁记录+对象头里的引用指针（判断线程是否拥有锁时将线程的锁记录地址和对象头里的指针地址比较)，也可能是对象头里的线程ID（判断线程是否拥有锁时将线程的ID和对象头里存储的线程ID比较）。 

![image-20210625160143550](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151756912.png)



#### 7.3.2 对象头中Mark Word与线程中Lock Record

在线程进入同步代码块的时候，如果此同步对象没有被锁定，即它的锁标志位是01，则虚拟机首先在当前线程的栈中创建我们称之为“锁记录（**Lock Record**）”的空间，用于存储锁对象的Mark Word的拷贝，官方把这个拷贝称为`Displaced Mark Word`。整个Mark Word及其拷贝至关重要。

**Lock Record是线程私有的数据结构**，每一个线程都有一个可用Lock Record列表，同时还有一个全局的可用列表。每一个被锁住的对象Mark Word都会和一个Lock Record关联（对象头的MarkWord中的Lock Word指向Lock Record的起始地址），同时Lock Record中有一个Owner字段存放拥有该锁的线程的唯一标识（或者`object mark word`），表示该锁被这个线程占用。如下图所示为Lock Record的内部结构：

| Lock Record | 描述                                                         |
| ----------- | ------------------------------------------------------------ |
| Owner       | 初始时为NULL表示当前没有任何线程拥有该monitor record，当线程成功拥有该锁后保存线程唯一标识，当锁被释放时又设置为NULL |
| EntryQ      | 关联一个系统互斥锁（semaphore），阻塞所有试图锁住monitor record失败的线程 |
| RcThis      | 表示blocked或waiting在该monitor record上的所有线程的个数     |
| Nest        | 用来实现 重入锁的计数                                        |
| HashCode    | 保存从对象头拷贝过来的HashCode值（可能还包含GC age）         |
| Candidate   | 用来避免不必要的阻塞或等待线程唤醒，因为每一次只有一个线程能够成功拥有锁，如果每次前一个释放锁的线程唤醒所有正在阻塞或等待的线程，会引起不必要的上下文切换（从阻塞到就绪然后因为竞争锁失败又被阻塞）从而导致性能严重下降。Candidate只有两种可能的值0表示没有需要唤醒的线程1表示要唤醒一个继任线程来竞争锁。 |



***

## 八、锁的优化

- 从JDK6开始，就对synchronized的实现机制进行了较大调整，包括使用JDK5引进的CAS自旋之外，还增加了`自适应的CAS自旋`、`锁消除`、`锁粗化`、`偏向锁`、`轻量级锁`这些优化策略。由于此关键字的优化使得性能极大提高，同时语义清晰，操作简单，无需手动关闭，所以推荐在允许的情况下尽量使用此关键字，同时在性能上此关键字还有优化的空间。
- 锁主要存在四种状态，依次是：**无锁状态**、**偏向锁状态**、**轻量级锁状态**、**重量级锁状态**，锁可以从偏向锁升级到轻量级锁，再升级到重量级锁。但是锁的升级是单向的，也就是说只能从低级到高级，不会出现锁的降级。
- 在JDK1.6中默认是开启偏向锁和轻量级锁的，可以通过`-XX:-UseBiasedLocking`来禁用偏向锁。



### 8.1 * 自旋锁 

#### 8.1.1 引入自旋锁前提

线程的阻塞和唤醒需要CPU从用户态转为核心态，频繁的阻塞和唤醒对CPU来说是一件负担很重的工作，势必会给系统的并发性能带来很大的压力。同时我们发现在许多应用上面，对象锁的锁状态只会持续很短一段时间，为了这一段很短的时间频繁地阻塞和唤醒线程是非常不值得的，所以引入`自旋锁`。

#### 8.1.2 何谓自旋锁？

所谓自旋锁，就是指当一个线程尝试获取某个锁时，如果该锁已被其他线程占用，就一直循环检测是否被释放，而不是进入线程挂起或睡眠状态。

#### 8.1.3 自旋锁等待时间/次数有限度

- 自旋锁适用于锁保护的临界区很小的情况，临界区很小的话，所占用的时间就很短。自旋等待不能替代阻塞，虽然它可以避免线程切换带来的开销，但是它占用了CPU处理器的时间。如果持有锁的线程很快就释放了锁，那么自旋的效率就非常好，反之，自旋的线程就会白白消耗处理的资源，他不会做任何有意义的工作，典型的占着茅坑不拉屎，这样反而会带来性能上的浪费。所以说，自选等待的时间（自旋的次数）必须有一个限度，如果自旋超过了定义的时间仍然没有获取到锁，则应该被挂起。
- 自旋锁在JDK1.4.2中引入，默认关闭，但是可以使用`-XX:+UseSpinning`开启，在JDK1.6中默认开启，JDK1.7中，去掉此参数，改为内置实现，换言之，JDK1.7 以后无法通过参数指定。**同时自旋的默认次数为10次**，可以通过参数`-XX:PreBlockSpin`来调整。
- 如果通过参数-XX:PreBlockSpin来调整自旋锁的自旋次数，会带来诸多不便。假如将参数调整为10，但是系统很多线程都是等你刚刚退出的时候就释放了锁（假如多自旋一两次就可以获取锁），是不是很尴尬。于是JDK1.6**引入自适应的自旋锁**，让虚拟机会变得越来越聪明。

#### 8.1.4 自旋重试成功/失败情况

自旋重试成功的情况

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202402/71c8c6295a3747b4.png)

自旋重试失败的情况

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202402/e33338d0778dc0ee.png)

### 8.2 适应性自旋锁

JDK 1.6引入了更加聪明的自旋锁，即自适应自旋锁。所谓自适应就意味着自旋的次数不再是固定的，它是**由前一次在同一个锁上的自旋时间及锁的拥有者的状态来决定**。那它如何进行适应性自旋呢？ 

- **线程如果自旋成功了，那么下次自旋的次数会更加多，因为虚拟机认为既然上次成功了，那么此次自旋也很有可能会再次成功，那么它就会允许自旋等待持续的次数更多。**
- **反之，如果对于某个锁，很少有自旋能够成功，那么在以后要或者这个锁的时候自旋的次数会减少甚至省略掉自旋过程，以免浪费处理器资源。**
- 自旋会占用CPU时间，单核CPU自旋就是浪费，多核CPU自旋才能发挥优势。

### 8.3 锁消除

为了保证数据的完整性，在进行操作时需要对这部分操作进行同步控制，但是在有些情况下，JVM检测到**不可能存在共享数据竞争**，这时JVM会对这些同步锁进行**锁消除**。

> **锁消除的依据是逃逸分析（是否逃离出作用域）的数据支持**。

逃逸分析：下的代码，sBuf是否可能逃出它的作用域？

```java
public class Demo {
    public static void main(String[] args) {
        long start = System.currentTimeMillis();
        int size = 10000;
        for (int i = 0; i < size; i++) {
            createStringBuffer("Hyes", "为分享技术而生");
        }
        long timeCost = System.currentTimeMillis() - start;
        System.out.println("createStringBuffer:" + timeCost + " ms");
    }
    public static String createStringBuffer(String str1, String str2) {
        StringBuffer sBuf = new StringBuffer();
        sBuf.append(str1);// append方法是同步操作
        sBuf.append(str2);
        return sBuf.toString();
    }
}

```

如果将sBuf作为方法的返回值进行返回，那么它在方法外部可能被当作一个全局对象使用，就有可能发生线程安全问题，这时就可以说sBuf这个对象发生逃逸了，因而不应将append操作的锁消除。

> **如果不存在竞争，为什么还需要加锁呢？**
>
> 

变量是否逃逸，对于虚拟机来说需要使用数据流分析来确定，但是对于程序员来说这还不清楚嘛，怎么会在明明知道不存在数据竞争的代码块前加上同步？但是有时候程序并不是我们所想的那样。**虽然没有显示使用锁**，但是在使用一些JDK的内置API时，如`StringBuffer`、`Vector`、`HashTable`等，这个时候会存在**隐形的加锁操作**。比如**StringBuffer的append()方法**，Vector的add()方法：

```java
public void vectorTest(){
    Vector<String> vector = new Vector<>();
    for(int i = 0 ; i < 10 ; i++){
        vector.add(i + "");
    }

    System.out.println(vector);
}
```

在运行这段代码时，JVM可以明显检测到变量vector没有逃逸出方法vectorTest()之外，所以JVM可以大胆地将vector内部的加锁操作消除。



### 8.4 锁粗化

- 在使用同步锁的时候，需要让同步块的作用范围尽可能小—仅在共享数据的实际作用域中才进行同步，这样做的目的是 为了使需要同步的操作数量尽可能缩小，如果存在锁竞争，那么等待锁的线程也能尽快拿到锁。

- 如果一系列的连续操作都对同一个对象反复加锁和解锁，甚至**加锁操作是出现在循环体中的**，那即使没有线程竞争，频繁地进行互斥同步操作也会导致不必要的性能损耗。

- **锁粗化概念**：就是将多个连续的加锁、解锁操作连接在一起，扩展成一个范围更大的锁。

  - 如上面实例：

    **vector每次add的时候都需要加锁操作，JVM检测到对同一个对象（vector）连续加锁、解锁操作，会合并一个更大范围的加锁、解锁操作，即加锁解锁操作会移到for循环之外。**

    

### 8.5 * 偏向锁 

#### 8.5.1 概述

偏向锁是JDK6中的重要引进，因为HotSpot作者经过研究实践发现，在大多数情况下，锁不仅不存在多线程竞争，而且**总是由同一线程多次获得**，为了让线程获得锁的代价更低，引进了**偏向锁**。

例如：

```java
static final Object obj = new Object();

public static void m1() {
    synchronized (obj) {
        // 同步块 A
        m2();
    }
}

public static void m2() {
    synchronized (obj) {
        // 同步块 B
        m3();
    }
}

public static void m3() {
    synchronized (obj) {
        // 同步块 C
    }
}
```

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202402/14c7588e4a716d08.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202402/25d7877d0a157c73.png)

**偏向锁是在单线程执行代码块时使用的机制，如果在多线程并发的环境下（即线程A尚未执行完同步代码块，线程B发起了申请锁的请求），则一定会转化为轻量级锁和重量级锁**。

在JDK5中偏向锁默认是关闭的，而到了JDK6中偏向锁已经默认开启。如果并发数较大同时同步代码块执行时间较长，则被多个线程同时访问的概率就很大，就可以使用参数`-XX:-UseBiasedLocking`来禁止偏向锁（但这是个JVM参数，不能针对某个对象锁来单独设置）。

> **引入偏向锁主要目的是：**

为了在没有多线程竞争的情况下尽量减少不必要的轻量级锁执行路径。因为轻量级锁的加锁解锁操作是需要依赖多次CAS原子指令的，而偏向锁只需要在置换ThreadID的时候依赖一次CAS原子指令（由于一旦出现多线程竞争的情况就必须撤销偏向锁，所以偏向锁的撤销操作的性能损耗也必须小于节省下来的CAS原子指令的性能消耗）。

> **轻量级锁是为了在线程交替执行同步块时提高性能，而偏向锁则是在只有一个线程执行同步块时进一步提高性能**。

> 那么偏向锁是如何来减少不必要的CAS操作呢？首先我们看下无竞争下锁存在什么问题：

现在几乎所有的锁都是可重入的，即已经获得锁的线程可以多次锁住/解锁监视对象，按照之前的HotSpot设计，每次加锁/解锁都会涉及到一些CAS操作（比如对等待队列的CAS操作），CAS操作会延迟本地调用，因此偏向锁的想法是 一旦线程第一次获得了监视对象，之后让监视对象“偏向”这个线程，之后的多次调用则可以避免CAS操作，**说白了就是置个变量，如果发现为true则无需再走各种加锁/解锁流程**。

> **CAS为什么会引入本地延迟？**

这要从SMP（对称多处理器）架构说起，下图大概表明了SMP的结构：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151756673.png" />

**SMP（对称多处理器）架构**：

- 其意思是所有的CPU会共享一条系统总线（BUS），靠此总线连接主存。每个核都有自己的一级缓存，各核相对于BUS对称分布，因此这种结构称为“对称多处理器”。

**CAS**的全称为Compare-And-Swap，是一条CPU的原子指令，其作用是**让CPU比较后原子地更新某个位置的值**，经过调查发现，其实现方式是基于硬件平台的汇编指令，就是说CAS是靠硬件实现的，JVM只是封装了汇编调用，那些AtomicInteger类便是使用了这些封装后的接口。

**例如：**

- Core1和Core2可能会同时把主存中某个位置的值Load到自己的L1 Cache中，当Core1在自己的L1 Cache中修改这个位置的值时，会通过总线，使Core2中L1 Cache对应的值“失效”，而Core2一旦发现自己L1 Cache中的值失效（称为Cache命中缺失）则会通过总线从内存中加载该地址最新的值，大家通过总线的来回通信称为“**Cache一致性流量**”。
- 因为总线被设计为固定的“通信能力”，如果Cache一致性流量过大，总线将成为瓶颈。而当Core1和Core2中的值再次一致时，称为“**Cache一致性**”，从这个层面来说，**锁设计的终极目标便是减少Cache一致性流量**。
- 而CAS恰好会导致Cache一致性流量，如果有很多线程都共享同一个对象，当某个Core CAS成功时必然会引起总线风暴，这就是所谓的本地延迟，**本质上偏向锁就是为了消除CAS，降低Cache一致性流量**。

#### 8.5.2 偏向锁获取

所以，当一个线程访问同步块并**获取锁**时，会在对象头和栈帧中的锁记录里存储`锁偏向的线程ID`，以后该线程进入和退出同步块时不需要花费CAS操作来争夺锁资源，只需要检查是否为偏向锁、`锁标识`为以及`ThreadID`即可，处理流程如下：

1. 检测Mark Word是否为可偏向状态，即是否为偏向锁1，锁标识位为01；

2. 若为可偏向状态，则测试线程ID是否为当前线程ID，如果是，则执行步骤（5），否则执行步骤（3）；

3. 如果测试线程ID不为当前线程ID，则通过CAS操作竞争锁，竞争成功，则将Mark Word的线程ID替换为当前线程ID，否则执行线程（4）；

4. 通过CAS竞争锁失败，证明当前存在多线程竞争情况，当到达全局安全点，获得偏向锁的线程被挂起，偏向锁升级为轻量级锁，然后被阻塞在安全点的线程继续往下执行同步代码块；

   `安全点`

   `多线程环境下可能会存在不安全的GC回收，JVM为了能安全的回收内存，会在Safe Point点时进行回收，所谓Safe Point就是Java线程执行到某个位置这时候JVM能够安全、可控的回收对象，这样就不会导致上GC回收正在使用的对象 安全区域：当线程无法到达安全点时，这个时候就需要安全区域，安全区域是指一段代码片中，引用关系不会发生变化，在这个区域任何地方GC都是安全的。线程执行到安全区域的代码时，首先标识自己进入了安全区域，这样GC时就不用管进入安全区域的线程了，线程要离开安全区域时就检查JVM是否完成了GC Roots枚举，如果完成就继续执行，如果没有完成就等待直到收到可以安全离开的信号。`

5. 执行同步代码块；

#### 8.5.3 偏向锁释放

偏向锁的释放采用了 一种只有竞争才会**释放锁**的机制，线程是不会主动去释放偏向锁，需要等待其他线程来竞争。偏向锁的撤销需要等待全局安全点（这个时间点是上没有正在执行的代码）。其步骤如下：

1. 暂停拥有偏向锁的线程；
2. 判断锁对象是否还处于被锁定状态，
   - 否，则恢复到无锁状态（01），以允许其余线程竞争。
   - 是，则挂起持有锁的当前线程，并将指向当前线程的锁记录地址的指针放入对象头Mark Word，升级为轻量级锁状态（00），然后恢复持有锁的当前线程，进入轻量级锁的竞争模式；
3. **注意**：此处将当前线程挂起再恢复的过程中并没有发生锁的转移，仍然在当前线程手中，只是穿插了个 “ **将对象头中的线程ID变更为指向锁记录地址的指针** ” 这么个事。

> **偏向锁的获取和释放流程图**

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151756288.png" />

#### 8.5.4 偏向锁状态

对象头格式如下，具体指的是`Mark Word(运行时元数据)`:

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151756263.png" />

- **Normal**：一般状态，没有加任何锁，前面62位保存的是对象的信息，最后2位为状态（01），倒数第三位表示是否使用偏向锁（未使用：0）；
- **Biased**：偏向状态，使用偏向锁，前面54位保存的当前线程的ID，最后2位为状态（01），倒数第三位表示是否使用偏向锁（使用：1）；
- **Lightweight**：使用轻量级锁，前62位保存的是锁记录的指针，最后2位为状态（00）；
- **Heavyweight**：使用重量级锁，前62位保存的是Monitor的地址指针，最后2位为状态(10)。

##### 8.5.4.1 测试偏向锁延迟特性

```
class Dog {}
```

利用 jol 第三方工具来查看对象头信息（注意这里我扩展了 jol 让它输出更为简洁）

```java
// 添加虚拟机参数 -XX:BiasedLockingStartupDelay=0 
public static void main(String[] args) throws IOException {
    Dog d = new Dog();
    ClassLayout classLayout = ClassLayout.parseInstance(d);
    new Thread(() -> {
        log.debug("synchronized 前");
        System.out.println(classLayout.toPrintableSimple(true));
        synchronized (d) {
            log.debug("synchronized 中");
            System.out.println(classLayout.toPrintableSimple(true));
        }
        log.debug("synchronized 后");
        System.out.println(classLayout.toPrintableSimple(true));
    }, "t1").start();
}
```

输出：

```
11:08:58.117 c.TestBiased [t1] - synchronized 前
00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000101 
11:08:58.121 c.TestBiased [t1] - synchronized 中
00000000 00000000 00000000 00000000 00011111 11101011 11010000 00000101 
11:08:58.121 c.TestBiased [t1] - synchronized 后
00000000 00000000 00000000 00000000 00011111 11101011 11010000 00000101
```

> **注意**：处于偏向锁的对象解锁后，线程 id 仍存储于对象头中

##### 8.5.4.2 测试禁用

在上面测试代码运行时在添加 VM 参数 `-XX:-UseBiasedLocking` 禁用偏向锁

输出：

```
11:13:10.018 c.TestBiased [t1] - synchronized 前
00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000001 
11:13:10.021 c.TestBiased [t1] - synchronized 中
00000000 00000000 00000000 00000000 00100000 00010100 11110011 10001000 
11:13:10.021 c.TestBiased [t1] - synchronized 后
00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000001
```

##### 8.5.4.3 测试 hashCode

正常状态对象一开始是没有 hashCode 的，第一次调用才生成。

#### 8.5.5 批量重偏向

如果对象被多个线程访问，但是没有竞争 ( 一个线程执行完, 另一个线程再来执行, 没有竞争)，这时偏向Thread1的对象仍有机会重新偏向Thread2，重偏向会重置Thread ID；

当撤销偏向锁 101 升级为 轻量级锁00超过20次后（超过阈值），JVM会觉得是不是偏向错了，这时会在给对象加锁时，重新偏向至加锁线程 (Thread2)。

```java
private static void test3() throws InterruptedException {
    Vector<Dog> list = new Vector<>();
    Thread t1 = new Thread(() -> {
        for (int i = 0; i < 30; i++) {
            Dog d = new Dog();
            list.add(d);
            synchronized (d) {
                log.debug(i + "\t" + ClassLayout.parseInstance(d).toPrintableSimple(true));
            }
        }
        synchronized (list) {
            list.notify();
        }
    }, "t1");
    t1.start();

    Thread t2 = new Thread(() -> {
        synchronized (list) {
            try {
                list.wait();
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
        log.debug("===============> ");
        for (int i = 0; i < 30; i++) {
            Dog d = list.get(i);
            log.debug(i + "\t" + ClassLayout.parseInstance(d).toPrintableSimple(true));
            synchronized (d) {
                log.debug(i + "\t" + ClassLayout.parseInstance(d).toPrintableSimple(true));
            }
            log.debug(i + "\t" + ClassLayout.parseInstance(d).toPrintableSimple(true));
        }
    }, "t2");
    t2.start();
}
```

输出：

```
[t1] - 0 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 1 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 2 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 3 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 4 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 5 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 6 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 7 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 8 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 9 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 10 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 11 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 12 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 13 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 14 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 15 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 16 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 17 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 18 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 19 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 20 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 21 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 22 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 23 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 24 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 25 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 26 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 27 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 28 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t1] - 29 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - ===============> 
[t2] - 0 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 0 00000000 00000000 00000000 00000000 00100000 01011000 11110111 00000000 
[t2] - 0 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000001 
[t2] - 1 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 1 00000000 00000000 00000000 00000000 00100000 01011000 11110111 00000000 
[t2] - 1 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000001 
[t2] - 2 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 2 00000000 00000000 00000000 00000000 00100000 01011000 11110111 00000000 
[t2] - 2 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000001 
[t2] - 3 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 3 00000000 00000000 00000000 00000000 00100000 01011000 11110111 00000000 
[t2] - 3 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000001 
[t2] - 4 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 4 00000000 00000000 00000000 00000000 00100000 01011000 11110111 00000000 
[t2] - 4 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000001 
[t2] - 5 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 5 00000000 00000000 00000000 00000000 00100000 01011000 11110111 00000000 
[t2] - 5 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000001 
[t2] - 6 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 6 00000000 00000000 00000000 00000000 00100000 01011000 11110111 00000000 
[t2] - 6 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000001 
[t2] - 7 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101
[t2] - 7 00000000 00000000 00000000 00000000 00100000 01011000 11110111 00000000 
[t2] - 7 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000001 
[t2] - 8 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 8 00000000 00000000 00000000 00000000 00100000 01011000 11110111 00000000 
[t2] - 8 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000001 
[t2] - 9 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 9 00000000 00000000 00000000 00000000 00100000 01011000 11110111 00000000 
[t2] - 9 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000001 
[t2] - 10 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 10 00000000 00000000 00000000 00000000 00100000 01011000 11110111 00000000 
[t2] - 10 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000001 
[t2] - 11 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 11 00000000 00000000 00000000 00000000 00100000 01011000 11110111 00000000 
[t2] - 11 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000001 
[t2] - 12 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 12 00000000 00000000 00000000 00000000 00100000 01011000 11110111 00000000 
[t2] - 12 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000001 
[t2] - 13 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 13 00000000 00000000 00000000 00000000 00100000 01011000 11110111 00000000 
[t2] - 13 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000001 
[t2] - 14 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 14 00000000 00000000 00000000 00000000 00100000 01011000 11110111 00000000 
[t2] - 14 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000001 
[t2] - 15 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 15 00000000 00000000 00000000 00000000 00100000 01011000 11110111 00000000 
[t2] - 15 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000001 
[t2] - 16 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 16 00000000 00000000 00000000 00000000 00100000 01011000 11110111 00000000 
[t2] - 16 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000001 
[t2] - 17 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 17 00000000 00000000 00000000 00000000 00100000 01011000 11110111 00000000 
[t2] - 17 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000001 
[t2] - 18 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 18 00000000 00000000 00000000 00000000 00100000 01011000 11110111 00000000 
[t2] - 18 00000000 00000000 00000000 00000000 00000000 00000000 00000000 00000001 
[t2] - 19 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 19 00000000 00000000 00000000 00000000 00011111 11110011 11110001 00000101 
[t2] - 19 00000000 00000000 00000000 00000000 00011111 11110011 11110001 00000101 
[t2] - 20 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 20 00000000 00000000 00000000 00000000 00011111 11110011 11110001 00000101 
[t2] - 20 00000000 00000000 00000000 00000000 00011111 11110011 11110001 00000101 
[t2] - 21 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 21 00000000 00000000 00000000 00000000 00011111 11110011 11110001 00000101 
[t2] - 21 00000000 00000000 00000000 00000000 00011111 11110011 11110001 00000101 
[t2] - 22 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 22 00000000 00000000 00000000 00000000 00011111 11110011 11110001 00000101 
[t2] - 22 00000000 00000000 00000000 00000000 00011111 11110011 11110001 00000101 
[t2] - 23 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 23 00000000 00000000 00000000 00000000 00011111 11110011 11110001 00000101 
[t2] - 23 00000000 00000000 00000000 00000000 00011111 11110011 11110001 00000101 
[t2] - 24 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 24 00000000 00000000 00000000 00000000 00011111 11110011 11110001 00000101 
[t2] - 24 00000000 00000000 00000000 00000000 00011111 11110011 11110001 00000101
[t2] - 25 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 25 00000000 00000000 00000000 00000000 00011111 11110011 11110001 00000101 
[t2] - 25 00000000 00000000 00000000 00000000 00011111 11110011 11110001 00000101 
[t2] - 26 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 26 00000000 00000000 00000000 00000000 00011111 11110011 11110001 00000101 
[t2] - 26 00000000 00000000 00000000 00000000 00011111 11110011 11110001 00000101 
[t2] - 27 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 27 00000000 00000000 00000000 00000000 00011111 11110011 11110001 00000101 
[t2] - 27 00000000 00000000 00000000 00000000 00011111 11110011 11110001 00000101 
[t2] - 28 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 28 00000000 00000000 00000000 00000000 00011111 11110011 11110001 00000101 
[t2] - 28 00000000 00000000 00000000 00000000 00011111 11110011 11110001 00000101 
[t2] - 29 00000000 00000000 00000000 00000000 00011111 11110011 11100000 00000101 
[t2] - 29 00000000 00000000 00000000 00000000 00011111 11110011 11110001 00000101 
[t2] - 29 00000000 00000000 00000000 00000000 00011111 11110011 11110001 00000101
```

#### 8.5.6 批量撤销

```java
package com.gyz.interview.concurrent;

import org.openjdk.jol.info.ClassLayout;

import java.util.Vector;
import java.util.concurrent.locks.LockSupport;

public class LockCanelTest {
    static Thread t1, t2, t3;

    private static void test4() throws InterruptedException {
        Vector<Dog> list = new Vector<>();
        int loopNumber = 39;
        t1 = new Thread(() -> {
            for (int i = 0; i < loopNumber; i++) {
                Dog d = new Dog();
                list.add(d);
                synchronized (d) {
                    log.debug(i + "\t" + ClassLayout.parseInstance(d).toPrintableSimple(true));
                }
            }
            LockSupport.unpark(t2);
        }, "t1");
        t1.start();
        t2 = new Thread(() -> {
            LockSupport.park();
            log.debug("===============> ");
            for (int i = 0; i < loopNumber; i++) {
                Dog d = list.get(i);
                log.debug(i + "\t" + ClassLayout.parseInstance(d).toPrintableSimple(true));
                synchronized (d) {
                    log.debug(i + "\t" + ClassLayout.parseInstance(d).toPrintableSimple(true));
                }
                log.debug(i + "\t" + ClassLayout.parseInstance(d).toPrintableSimple(true));
            }
            LockSupport.unpark(t3);
        }, "t2");
        t2.start();
        t3 = new Thread(() -> {
            LockSupport.park();
            log.debug("===============> ");
            for (int i = 0; i < loopNumber; i++) {
                Dog d = list.get(i);
                log.debug(i + "\t" + ClassLayout.parseInstance(d).toPrintableSimple(true));
                synchronized (d) {
                    log.debug(i + "\t" + ClassLayout.parseInstance(d).toPrintableSimple(true));
                }
                log.debug(i + "\t" + ClassLayout.parseInstance(d).toPrintableSimple(true));
            }
        }, "t3");
        t3.start();

        t3.join();
        log.debug(ClassLayout.parseInstance(new Dog()).toPrintableSimple(true));
    }
}
```

> **参考资料**：
>
> https://github.com/farmerjohngit/myblog/issues/12
>
> https://www.cnblogs.com/LemonFive/p/11246086.html
>
> https://www.cnblogs.com/LemonFive/p/11248248.html
>
> [偏向锁论文](https://www.oracle.com/technetwork/java/biasedlocking-oopsla2006-wp-149958.pdf)

### 8.6 轻量级锁

> **引入轻量级锁的主要目的**

**在没有多线程竞争的前提下**，**减少**传统的**重量级锁使用操作系统互斥量产生的性能消耗**。当关闭偏向锁功能或者多个线程竞争偏向锁导致偏向锁升级为轻量级锁，则会尝试获取轻量级锁。



> **轻量级锁获取过程**

- 在线程进入同步块时，如果同步对象锁状态为无锁状态（锁标志位为“01”状态，是否为偏向锁为“0”），都会在`栈帧中`创建`锁记录（Lock Record）空间`，用于存储锁对象目前的Mark Word的**拷贝**，官方称之为 Displaced Mark Word，**每个线程都会包括一个锁记录的结构**，锁记录内部可以储存`对象的Mark Word`和`锁对象引用reference`。  

- **具体过程**

  - 创建锁记录（Lock Record）对象，每个线程都的栈帧都会包含一个锁记录的结构，内部可以存储锁定对象的`Mark Word`

    <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151756111.png" />

    

  - 让锁记录（Lock Record）中的`Object reference`指向锁对象 ，将锁对象头中的 Mark Word 信息复制到锁记录中（Displaced Mard Word），并且尝试用CAS(Compare And Sweep)将栈帧中的锁记录的`lock record 地址` 和` state: 00`替换Object对象的`Mark Word`

    <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151756080.png" />

  - 如果`cas替换成功`, 获得了轻量级锁，那么对象的`对象头储存的就是锁记录的地址和状态00`

    - 锁对象的**对象头**中存储了锁记录的地址和状态, 标志哪个线程获得了锁
    - 此时栈帧中存储了`对象的对象头`中替换之前的`锁状态标志01`，`年龄计数器`，`哈希值`等；对象的对象头中就存储了`栈帧中锁记录的地址和状态00`, 这样的话对象就知道了是`哪个线程锁住自己`。

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151756880.png" />

- 如果`cas替换失败`，有两种情况 : **① 锁膨胀 ② 重入锁失败**

  1. 如果是其它线程已经持有了`该Object的轻量级锁`，那么表示有竞争，将进入 **锁膨胀阶段**。此时`对象Object`对象头中已经存储了别的线程的`锁记录地址 和 state:00`，指向了其他线程；

  2. 如果是自己的线程已经执行了synchronized进行加锁，那么`再添加一条 Lock Record 作为重入锁的计数`---**线程多次加锁, 锁重入**。

     在下面代码中，临界区中又调用了method2，method2中又进行了一次synchronized加锁操作, 此时就会在虚拟机栈中再开辟一个method2方法对应的栈帧，该栈帧中又会存在一个独立的Lock Record, 此时它发现对象的对象头中指向的就是自己线程中栈帧的锁记录；加锁也就失败了。这种现象就叫做**锁重入**；线程中有多少个锁记录, 就能表明该线程对这个对象加了几次锁 (**锁重入计数**)。

     ```java
     static final Object obj = new Object();
     public static void method1() {
          synchronized( obj ) {
              // 同步块 A
              method2();
          }
     }
     public static void method2() {
          synchronized( obj ) {
              // 同步块 B
          }
     }
     
     ```

  3. 图示

     <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151756191.png" />



> **轻量级锁解锁流程**

- 当退出 synchronized 代码块（解锁时）如果有取值为 null 的锁记录，表示有重入，这时重置锁记录，表示重入计数减一  
- 当线程退出synchronized代码块的时候，如果获取的锁记录`取值不为 null`，这时使用 cas 将 Mark Word 的值恢复给对象头  
  - 如果替换成功则轻量级锁解锁成功，恢复到无锁状态（01）；
  - 如果替换失败，说明有其他线程尝试过获取该锁，则`轻量级锁进行了锁膨胀`或`已经升级为重量级锁`，进入重量级锁解锁流程 (Monitor流程)



> **轻量级锁获取和释放流程图示**

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151756064.png" />

**为什么升级为轻量锁时要把对象头里的Mark Word复制到线程栈的锁记录中呢？**

- 因为在申请对象锁时 需要以该值作为CAS的比较条件，同时在升级到重量级锁的时候，能通过这个比较判定是否在持有锁的过程中此锁被其他线程申请过，如果被其他线程申请了，则在释放锁的时候要唤醒被挂起的线程。

**为什么会尝试CAS不成功以及什么情况下会不成功？**

- CAS本身是不带锁机制的，其是通过比较而来。假设如下场景：线程A和线程B都在对象头里的锁标识为无锁状态进入，那么如线程A先更新对象头为其锁记录指针成功之后，线程B再用CAS去更新，就会发现此时的对象头已经不是其操作前的对象HashCode了，所以CAS会失败。也就是说，只有两个线程并发申请锁的时候会发生CAS失败。 

- 然后线程B进行CAS自旋，等待对象头的锁标识重新变回无锁状态或对象头内容等于对象HashCode（因为这是线程B做CAS操作前的值），这也就意味着线程A执行结束（参见后面轻量级锁的撤销，只有线程A执行完毕撤销锁了才会重置对象头），此时线程B的CAS操作终于成功了，于是线程B获得了锁以及执行同步代码的权限。如果线程A的执行时间较长，线程B经过若干次CAS时钟没有成功，则锁膨胀为重量级锁，即线程B被挂起阻塞、等待重新调度。 



> **轻量级锁所适应的场景**

线程交替执行同步块的情况，如果存在同一时间访问同一锁的情况，必然就会导致轻量级锁膨胀为重量级锁。



### 8.7 锁膨胀

- 如果在尝试`加轻量级锁`的过程中，cas替换操作无法成功，这是有一种情况就是其它线程已经为这个对象加上了轻量级锁，这是就要进行`锁膨胀(有竞争)`，将`轻量级锁变成重量级锁`。

- 当 Thread-1 进行轻量级加锁时，Thread-0 已经对该对象加了轻量级锁, 此时发生`锁膨胀`

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151757175.png" />

- 这时Thread-1加轻量级锁失败，**进入锁膨胀流程**

  - 因为`Thread-1`线程加轻量级锁失败, 轻量级锁没有阻塞队列的概念, 所以此时就要`为对象申请Monitor锁(重量级锁)`，让`Object指向重量级锁地址 10`，然后`自己进入Monitor 的EntryList 变成BLOCKED状态`

    <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151757976.png" />

- 当Thread-0 线程执行完synchronized同步块时，使用cas将Mark Word的值恢复给对象头, 肯定恢复失败,因为对象的对象头中存储的是重量级锁的地址,状态变为10了之前的是00，肯定恢复失败。那么会进入重量级锁的解锁过程，即按照Monitor的地址找到Monitor对象，将Owner设置为null，唤醒EntryList中的Thread-1线程。
  
  

### 8.8 重量级锁

Synchronized是通过对象内部的一个叫做 `监视器锁（Monitor）`来实现的。但是监视器锁本质又是依赖于底层的操作系统的 `Mutex Lock` 来实现的。而操作系统实现线程之间的切换这就需要从用户态转换到核心态，这个成本非常高，状态之间的转换需要相对比较长的时间，这就是为什么Synchronized效率低的原因。因此，**这种依赖于操作系统Mutex Lock所实现的锁我们称之为 “重量级锁”**。



### 8.9 偏向锁、轻量级锁和重量级锁转换

图示一：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151757560.png" />



图示二：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151757519.png" />



### 8.10 锁的优劣

各种锁并不是相互代替的，而是在不同场景下的不同选择，绝对不是说重量级锁就是不合适的。每种锁是只能升级，不能降级，即由偏向锁->轻量级锁->重量级锁，而这个过程就是开销逐渐加大的过程。

- 如果是单线程使用，那偏向锁毫无疑问代价最小，并且它就能解决问题，连CAS都不用做，仅仅在内存中比较下对象头就可以了；
- 如果出现了其他线程竞争，则偏向锁就会升级为轻量级锁；
- 如果其他线程通过一定次数的CAS尝试没有成功，则进入重量级锁；

在第重量级锁情况下进入同步代码块就 要做偏向锁建立、偏向锁撤销、轻量级锁建立、升级到重量级锁，最终还是得靠重量级锁来解决问题，那这样的代价就比直接用重量级锁要大不少了。所以使用哪种技术，一定要看其所处的环境及场景，在绝大多数的情况下，偏向锁是有效的，这是基于HotSpot作者发现的“**大多数锁只会由同一线程并发申请”的经验规律**。

| 锁       | 优点                                                         | 缺点                                           | 适用场景                               |
| -------- | ------------------------------------------------------------ | ---------------------------------------------- | -------------------------------------- |
| 偏向锁   | 加锁和解锁不需要额外的消耗，和执行非同步方法比仅存在纳秒级的差距 | 如果线程间存在锁竞争，会带来额外的锁撤销的消耗 | 适用于只有一个线程访问同步代码块的场景 |
| 轻量级锁 | 竞争的线程不会阻塞，提高了程序的响应速度                     | 始终得不到锁竞争的线程使用自旋会消耗CPU        | 追求响应时间，同步执行速度非常快       |
| 重量级锁 | 线程竞争不使用自旋，不会消耗CPU                              | 线程阻塞，响应时间缓慢                         | 追求吞吐量，同步块执行速度较长         |



### 8.11 总结

> 对于 synchronized 锁来说，**锁的升级主要是通过 Mark Word 中的锁标记位与是否是偏向锁标记为来达成的**；synchronized 关键字所对象的锁都是先**从偏向锁开始**，随着锁竞争的不断升级，逐步演化至轻量级锁，最后变成了重量级锁。

- 偏向锁：针对一个线程来说的，主要作用是优化同一个线程多次获取一个锁的情况， 当一个线程执行了一个 synchronized 方法的时候，肯定能得到对象的 monitor ，这个方法所在的对象就会在 Mark Work 处设为偏向锁标记，还会有一个字段指向拥有锁的这个线程的线程 ID 。
- 当这个线程再次访问同一个 synchronized 方法的时候，如果按照通常的方法，这个线程还是要尝试获取这个对象的 monitor ，再执行这个 synchronized 方法。但是由于 Mark Word 的存在，当第二个线程再次来访问的时候，就会检查这个对象的 Mark Word 的偏向锁标记，再判断一下这个字段记录的线程 ID 是不是跟第二个线程的 ID 是否相同的。如果相同，就无需再获取 monitor 了，直接进入方法体中。

> **如果是另一个线程访问这个 synchronized 方法，那么实际情况会如何呢？偏向锁会被取消掉。**

- 轻量级锁：若第一个线程已经获取到了当前对象的锁，这是第二个线程又开始尝试争抢该对象的锁，由于该对象的锁已经被第一个线程获取到，因此它是偏向锁，而第二个线程再争抢时，会发现该对象头中的 Mark Word 已经是偏向锁，但里面储存的线程 ID 并不是自己（是第一个线程），那么她会进行 CAS(Compare and Swap)，从而获取到锁，这里面存在两种情况：
  - 获取到锁成功（一共只有两个线程）：那么它会将 Mark Word 中的线程 ID 由第一个线程变成自己(偏向锁标记位保持不表)，这样该对象依然会保持偏向锁的状态；
  - 获取锁失败（一共不止两个线程）：则表示这时可能会有多个线程同时再尝试争抢该对象的锁，那么这是偏向锁就会进行升级，升级为轻量级锁；
- 旋锁，若自旋失败，那么锁就会转化为重量级锁，在这种情况下，无法获取到锁的线程都会进入到 moniter(即内核态)，自旋最大的特点是避免了线程从用户态进入到内核态。

> **其他：**

- 偏向锁默认是延迟的，不会在程序启动的时候立刻生效，如果想避免延迟，可以添加虚拟机参数来禁用延迟：`-XX:BiasedLockingStartupDelay=0` 来禁用延迟；
  
- 处于偏向锁的对象解锁后，线程 id 仍存储于对象头中；

- 以下几种情况会使对象的**偏向锁失效**：

  - 调用对象的 hashCode 方法
  - 多个线程使用该对象
  - 调用了 wait/notify 方法（调用wait方法会导致锁膨胀而使用重量级锁）

- 当撤销偏向锁的阈值超过 40 以后，就会将**整个类的对象都改为不可偏向的**；




***

## 九、Park & Unpark  

### 9.1 基本使用

它们是 LockSupport 类中的方法  ：

```java
//暂停当前线程
LockSupport.park();
//恢复某个线程的运行
LockSupport.unpark(暂停线程对象);
```

示例代码，先park后unpark：

```java
package com.gyz.demo;

import lombok.extern.slf4j.Slf4j;

import java.util.concurrent.locks.LockSupport;

import static com.gyz.demo.util.Sleeper.sleep;

/**
 * @Description Park & Unpark基本使用：先park后unpark
 * @Author GongYuZhuo
 * @Date 2021/6/27 18:12
 * @Version 1.0.0
 */
@Slf4j(topic = "c.TestMultiLock")
public class TestMultiLock {
    public static void main(String[] args) {
        Thread t1 = new Thread(() -> {
            log.debug("begin");
            sleep(1);
            log.debug("park");
            LockSupport.park();
            log.debug("resume");
        }, "t1");

        t1.start();
        sleep(2);
        log.debug("unpark");
        LockSupport.unpark(t1);
    }
}
```

输出结果：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151757072.png" />

先unpark 后park：

```java
package com.gyz.demo;

import lombok.extern.slf4j.Slf4j;

import java.util.concurrent.locks.LockSupport;

import static com.gyz.demo.util.Sleeper.sleep;

/**
 * @Description Park & Unpark基本使用:先 unpark 再 park
 * @Author GongYuZhuo
 * @Date 2021/6/27 18:25
 * @Version 1.0.0
 */
@Slf4j(topic = "c.TestMultiLock2")
public class TestMultiLock2 {

    public static void main(String[] args) {
        Thread t2 = new Thread(() -> {
            log.debug("begin");
            sleep(2);
            log.debug("park");
            LockSupport.park();
            log.debug("resume");
        }, "t2");

        t2.start();
        sleep(1);
        LockSupport.unpark(t2);
        log.debug("unpark");
    }
}
```

输出结果：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151757711.png" />

**特点**  ：

与 Object 的 wait & notify 相比  ：

- wait，notify和notifyAll必须配合Object Monitor一起使用，而park，unpark不必
- park & unpark 是以线程为单位来【阻塞】和【唤醒】线程，而notify 只能随机唤醒一个等待线程，notifyAll是唤醒所有等待线程，就不那么【精确】
- park & unpark 可以先unpark，而wait & notify 不能先notify



### 9.2 park、unpark 原理

> 每个线程都有自己的一个 `Parker 对象`，由三部分组成： **_counter**， **_cond** 和  **_mutex** 。

打个比喻：

- 线程就像一个旅人，Parker 就像他随身携带的背包，条件变量 _ cond就好比背包中的帐篷。_counter 就好比背包中的备用干粮（0 为耗尽，1 为充足）
- **调用 park 就是要看需不需要停下来歇息**
  - 如果备用干粮耗尽，那么钻进帐篷歇息
  - 如果备用干粮充足，那么不需停留，继续前进
- **调用 unpark，就好比令干粮充足**
  - 如果这时线程还在帐篷，就唤醒让他继续前进
  - 如果这时线程还在运行，那么下次他调用 park 时，仅是消耗掉备用干粮，不需停留继续前进
  - 因为背包空间有限，**多次调用 unpark 仅会补充一份备用干粮**



> **先调用park再调用upark的过程**

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151757376.png" />

**调用park**：

- 当前线程调用 **Unsafe.park()** 方法
- **检查 _counter, 本情况为0,** 这时, 获得`_mutex 互斥锁` **(mutex对象有个等待队列 _cond)**
- 线程进入 _cond 条件变量`阻塞`
- 设置`_counter = 0` (没干粮了)

**调用unpark**：

- 调用`Unsafe.unpark(Thread_0)`方法，设置`_counter 为 1`
- 唤醒 _cond 条件变量中的 Thread_0
- Thread_0 恢复运行
- **设置 _counter 为 0**



> **先调用upark再调用park的过程**

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151757031.png" />

- 调用 `Unsafe.unpark(Thread_0)`方法，设置 `_counter 为 1`
- 当前线程调用 `Unsafe.park()` 方法
- 检查 `_counter`，本情况为 `1`，这时线程 **无需阻塞，继续运行**
- 设置 _counter 为 0



***

## 十、深入线程状态转换 

### 10.1 转换过程图示

`Thread.java`的内部类`State`包含以下几种状态：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151757791.png" />

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151757847.png" />



### 10.2 状态转换过程说明

**假设有线程 Thread t：**

#### 10.2.1 NEW <–> RUNNABLE

- 当调用`t.start()`方法时, `NEW --> RUNNABLE`

#### 10.2.2 RUNNABLE <–> WAITING

**t 线程**用`synchronized(obj)`获取了`对象锁`后：

- 调用 `obj.wait()`方法时，t 线程进入waitSet中, 从`RUNNABLE --> WAITING`
- 调用 `obj.notify()`，`obj.notifyAll()`，`t.interrupt()`时, 唤醒的线程都到`entrySet`阻塞队列成为`BLOCKED`状态, 在阻塞队列和其他线程再进行 **竞争锁**
  - **竞争锁成功**，t 线程从 `WAITING --> RUNNABLE`
  - **竞争锁失败**，t 线程从 `WAITING --> BLOCKED`

#### 10.2.3 RUNNABLE <–> WAITING

- 当前线程调用 `t.join()` 方法时，当前线程从 `RUNNABLE --> WAITING` ，注意是**当前线程**在 **t线程对象**的监视器上等待
- **t 线程**运行结束，或调用了当前线程的 interrupt() 时，当前线程从 `WAITING --> RUNNABLE`

#### 10.2.4 RUNNABLE <–> WAITING

- 当前线程调用 `LockSupport.park()` 方法会让当前线程从`RUNNABLE --> WAITING`
- 调用 `LockSupport.unpark(目标线程)` 或调用了线程 的 **interrupt()** ，会让目标线程从 `WAITING --> RUNNABLE`

#### 10.2.5 RUNNABLE <–> TIMED_WAITING

t 线程用`synchronized(obj)` 获取了`对象锁`后

- 调用 obj.wait(long n) 方法时，t 线程从 RUNNABLE --> TIMED_WAITING
- t 线程等待时间超过了 n 毫秒，或调用 obj.notify() ， obj.notifyAll() ， t.interrupt() 时; 唤醒的线程都到entrySet阻塞队列成为BLOCKED状态, 在阻塞队列,和其他线程再进行 竞争锁
  - 竞争锁成功，t 线程从 TIMED_WAITING --> RUNNABLE
  - 竞争锁失败，t 线程从 TIMED_WAITING --> BLOCKED

#### 10.2.6 RUNNABLE <–> TIMED_WAITING

- 当前线程调用 t.join(long n) 方法时，当前线程从 RUNNABLE --> TIMED_WAITING 注意是**当前线程在 t 线程**对象的监视器上等待
- 当前线程等待时间超过了 n 毫秒，或**t 线程**运行结束，或调用了当前线程的 interrupt() 时，**当前线程**从 `TIMED_WAITING --> RUNNABLE`

#### 10.2.7 RUNNABLE <–> TIMED_WAITING

- 当前线程调用 `Thread.sleep(long n)` ，当前线程从 `RUNNABLE --> TIMED_WAITING`
- 当前线程等待时间超过了 n 毫秒或调用了线程的 **interrupt()** ，当前线程从 `TIMED_WAITING --> RUNNABLE`

#### 10.2.8 RUNNABLE <–> TIMED_WAITING

- 当前线程调用 `LockSupport.parkNanos(long nanos)` 或` LockSupport.parkUntil(long millis)` 时，当前线程从 `RUNNABLE --> TIMED_WAITING`
- 调用`LockSupport.unpark(目标线程) `或调用了线程 的 interrupt() ，或是等待超时，会让目标线程从` TIMED_WAITING--> RUNNABLE`

#### 10.2.9 RUNNABLE <–> BLOCKED

- t 线程用 synchronized(obj) 获取了对象锁时如果竞争失败，从 RUNNABLE –> BLOCKED, 持 obj 锁线程的同步代码块执行完毕，会唤醒该对象上所有 BLOCKED 的线程重新竞争，
- 如果其中 t 线程竞争 成功，从 BLOCKED –> RUNNABLE ，其它失败的线程仍然 BLOCKED。

####  10.2.10 RUNNABLE <–> TERMINATED

- 当前线程所有代码运行完毕，进入 TERMINATED



***

## 十一、多把锁

**多把不相干的锁**  。

小故事：

- 一间大屋子有两个功能：睡觉、学习，互不相干。  
- 现在小南要学习，小女要睡觉，但如果只用一间屋子（一个对象锁）的话，那么并发度很低  。
- 解决方法是准备多个房间（多个对象锁）  

并发度低的情况（相当于串行执行, 因为锁对象是整个屋子, 所以并发性很低）：

```java
package com.gyz.demo;

import com.gyz.demo.util.Sleeper;
import lombok.extern.slf4j.Slf4j;

/**
 * @ClassName BigRoomTest
 * @Description 多把锁演示
 * @Author GongYuZhuo
 * @Date 2021/6/28 10:16
 */
@Slf4j(topic = "c.BigRoomTest")
public class BigRoomTest {

    public static void main(String[] args) {
        BigRoom bigRoom = new BigRoom();

        new Thread(() -> {
            bigRoom.sleep();
        }, "小女").start();

        new Thread(() -> {
            bigRoom.study();
        }).start();
    }
}

@Slf4j(topic = "c.BigRoom")
class BigRoom {
    public void sleep() {
        synchronized (this) {
            log.debug("sleep two hours");
            Sleeper.sleep(2);
        }
    }

    public void study() {
        synchronized (this) {
            log.debug("study one hours ");
            Sleeper.sleep(1);
        }
    }
}
```

输出结果：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151757336.png" />

改进让`小南, 小女`获取不同的锁即可：

```java
package com.gyz.demo;

import com.gyz.demo.util.Sleeper;
import lombok.extern.slf4j.Slf4j;

/**
 * @ClassName BigRoomTest
 * @Description 多把锁演示:改进让小南, 小女获取不同的锁
 * @Author GongYuZhuo
 * @Date 2021/6/28 10:16
 */
@Slf4j(topic = "c.BigRoomTest")
public class BigRoomTest {
    private static final BigRoom sleppRoom = new BigRoom();
    private static final BigRoom studyRoom = new BigRoom();

    public static void main(String[] args) {

        new Thread(() -> {
            sleppRoom.sleep();
        }, "小女").start();

        new Thread(() -> {
            studyRoom.study();
        }).start();
    }
}

@Slf4j(topic = "c.BigRoom")
class BigRoom {
    public void sleep() {
        synchronized (this) {
            log.debug("sleep two hours");
            Sleeper.sleep(2);
        }
    }

    public void study() {
        synchronized (this) {
            log.debug("study one hours ");
            Sleeper.sleep(1);
        }
    }
}
```

输出结果：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151757064.png" />

**将锁的粒度细分**  :

- 好处：是可以增强并发度
- 坏处：如果一个线程需要同时获得多把锁，就容易发生死锁  

***

## 十二、活跃性  

### 12.1 死锁

> 有这样的情况：一个线程需要同时获取多把锁，这时就容易发生死锁  

如：线程1获取A对象锁, 线程2获取B对象锁; 此时线程1又想获取B对象锁, 线程2又想获取A对象锁; 它们都等着对象释放锁, 此时就称为死锁。

```java
package com.gyz.demo.concurrent1;


/**
 * @Description 演示死锁
 * @Author GongYuCho
 * @Date 2021/6/20 13:39
 * @Version 1.0.0
 */
public class DeadLockTest1 {

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



### 12.2 定位死锁  

- 检测死锁可以使用 **jconsole**工具，或者使用 **jps** 定位进程 id，再用 **jstack id** 定位死锁  (保证代码在运行)

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151757143.png" />

          - waiting to lock <0x00000000d5f5e318> (a java.lang.Object)
          - locked <0x00000000d5f5e308> (a java.lang.Object)
          at java.lang.Thread.run(Thread.java:748)

-  **jconsole检测死锁**

  windows下：输入jconsole

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151757391.png" />



### 12.3 哲学家就餐问题  

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151757231.png" />

有五位哲学家，围坐在圆桌旁。

- 他们只做两件事，思考和吃饭，思考一会吃口饭，吃完饭后接着思考。
- 吃饭时要用两根筷子吃，桌上共有 5 根筷子，每位哲学家左右手边各有一根筷子。
- 如果筷子被身边的人拿着，自己就得等待 。

示例代码：

```java
package com.gyz.demo;

import com.gyz.demo.util.Sleeper;
import lombok.extern.slf4j.Slf4j;

/**
 * @ClassName PhilosopherEat
 * @Description 线程死锁之哲学家就餐问题
 * @Author GongYuZhuo
 * @Date 2021/6/28 12:05
 */
public class PhilosopherEat {
    public static void main(String[] args) {
        Chopstick c1 = new Chopstick("1");
        Chopstick c2 = new Chopstick("2");
        Chopstick c3 = new Chopstick("3");
        Chopstick c4 = new Chopstick("4");
        Chopstick c5 = new Chopstick("5");

        new Philosopher("苏格拉底",c1,c2).start();
        new Philosopher("毕加索",c2,c3).start();
        new Philosopher("牛顿",c3,c4).start();
        new Philosopher("伽利略",c4,c5).start();
        new Philosopher("詹姆斯登",c5,c1).start();
    }
}

@Slf4j(topic = "c.Philosopher")
class Philosopher extends Thread {
    final Chopstick left;
    final Chopstick right;

    public Philosopher(String name, Chopstick left, Chopstick right) {
        super(name);
        this.left = left;
        this.right = right;
    }

    @Override
    public void run() {
        while (true) {
            // 尝试获取左手筷子
            synchronized (left) {
                // 尝试获取右手筷子
                synchronized (right) {
                    eat();
                }
            }
        }
    }

    private void eat() {
        log.debug("eating......");
        Sleeper.sleep(0.5);
    }
}

/**
 * 筷子类
 */
class Chopstick {
    /**筷子名 */
    String name;

    public Chopstick(String name) {
        this.name = name;
    }

    @Override
    public String toString() {
        return "筷子{" + name + '}';
    }
}
```

执行不多会，就执行不下去了  ，发生死锁。这种线程没有按预期结束，执行不下去的情况，归类为【活跃性】问题，除了死锁以外，还有活锁和饥饿这两种情况。



### 12.4 活锁

活锁出现在两个线程互相改变对方的结束条件，最后谁也无法结束，例如：

```java
public class TestLiveLock {

	static volatile int count = 10;
	static final Object lock = new Object();

    public static void main(String[] args) {
		new Thread(() -> {
			// 期望减到 0 退出循环
			while (count > 0) {
				sleep(0.2);
				count--;
				log.debug("count: {}", count);
			}
		}, "t1").start();

        new Thread(() -> {
			// 期望超过 20 退出循环
			while (count < 20) {
			sleep(0.2);
			count++;
			log.debug("count: {}", count);
			}
		}, "t2").start();
	}
}
```

  

避免活锁的方法：

- 在线程执行时，中途给予 **不同的间隔时间**, 让某个线程先结束即可。

死锁与活锁的区别：

- 死锁是因为线程互相持有对象想要的锁，并且都不释放，最后到时**线程阻塞**，**停止运行**的现象。
- 活锁是因为线程间修改了对方的结束条件，而导致代码**一直在运行**，却一直**运行不完**的现象。



### 12.5 饥饿  

线程饥饿的例子，先来看看使用顺序加锁的方式解决之前的死锁问题  ：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151757215.png" />

顺序加锁的解决方案 ：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151757351.png" /> 



***

## 十三、ReentrantLock

[引用](https://www.jianshu.com/p/4358b1466ec9)

java5之后，并发包中新增了Lock接口（以及相关实现类）用来实现锁的功能，它提供了与synchronized关键字类似的同步功能。既然有了synchronized这种内置的锁功能，为何要新增Lock接口？先来想象一个场景：手把手的进行锁获取和释放，先获得锁A，然后再获取锁B，当获取锁B后释放锁A同时获取锁C，当锁C获取后，再释放锁B同时获取锁D，以此类推，这种场景下，synchronized关键字就不那么容易实现了，而使用Lock却显得容易许多。


**相对于 synchronized 它具备如下特点**  ：

- 可中断
- 可以设置超时时间
- 可以设置为公平锁
- 支持多个条件变量

**与`synchronized`一样，都支持可重入，基本语法**：

```java
//获取锁
reentrantLock.lock();
try{
	//临界区
}finally{
	//释放锁
	reentrantLock.unlock();
}
```

**ReentrantLock 与 Synchronized对比**：

| 对比项     | ReentrantLock                  | Synchronized     |
| ---------- | ------------------------------ | ---------------- |
| 锁实现机制 | 依赖AQS                        | 监视器模式       |
| 灵活性     | 支持响应中断、超时、尝试获取锁 | 不灵活           |
| 释放形式   | 必须显式调用unlock()释放锁     | 自动释放监视器   |
| 锁类型     | 公平锁 & 非公平锁              | 非公平锁         |
| 条件队列   | 可关联多个条件队列             | 关联一个条件队列 |
| 可重入性   | 可重入                         | 可重入           |



### 13.1 可重入

可重入是指同一个线程如果首次获得了这把锁，那么因为它是这把锁的拥有者，因此有权利再次获取这把锁。如果不是可重入锁，那么第二次获得锁时，自己也会被锁挡住。

```java
package com.gyz.reentlock;

import lombok.extern.slf4j.Slf4j;

import java.util.concurrent.locks.ReentrantLock;

/**
 * @Description 可重入代码演示
 * @Author GongYuZhuo
 * @Date 2021/6/29 23:44
 * @Version 1.0.0
 */
@Slf4j(topic = "c.ReentRantLockTest")
public class ReentRantLockTest {

    /** 独占锁 */
    private static ReentrantLock reentrantLock = new ReentrantLock();

    public static void main(String[] args) {
        method1();
    }

    public static void method1() {
        reentrantLock.lock();
        try {
            log.debug("execute method1 method");
            method2();
        } finally {
            reentrantLock.unlock();
        }
    }

    public static void method2() {
        reentrantLock.lock();
        try {
            log.debug("execute method2 method");
            method3();
        } finally {
            reentrantLock.unlock();
        }
    }

    public static void method3(){
        reentrantLock.lock();
        try {
            log.debug("execute method3 method");
        }finally {
            reentrantLock.unlock();
        }
    }
}
```

输出结果：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151758129.png" />



### 13.2 可中断

针对于`lockInterruptibly()`方法获得的中断锁， 直接退出阻塞队列, 获取锁失败。

- **synchronized** 和 **reentrantlock.lock()** 的锁, 是不可被打断的；也就是说别的线程已经获得了锁, 当前线程就需要一直等待下去，不能中断。

- 可被中断的锁：通过`lock.lockInterruptibly()`获取的锁对象, 可以通过调用阻塞线程的`interrupt()方法`。
- 如果`某个线程处于阻塞状态`，可以调用其`interrupt方法`让其`停止阻塞`，**获得锁失败**。直接停止运行。
- 可中断的锁, 在一定程度上可以`被动`的减少`死锁`的概率, 之所以被动,，是因为我们需要手动调用`阻塞线程的interrupt`方法；

测试使用`lock.lockInterruptibly()`可以从阻塞队列中打断：

```java

/**
 * @Description ReentrantLock, 演示RenntrantLock中的可打断锁方法 lock.lockInterruptibly();
 * @Author GongYuZhuo
 * @Date 2021/6/30 16:44
 * @Version 1.0.0
 */
@Slf4j(topic = "c.ReentrantTest")
public class ReentrantTest {

    private static final ReentrantLock lock = new ReentrantLock();

    public static void main(String[] args) {

        Thread t1 = new Thread(() -> {
            log.debug("t1线程启动...");
            try {
                // lockInterruptibly()是一个可打断的锁, 如果有锁竞争在进入阻塞队列后,可以通过interrupt进行打断
                lock.lockInterruptibly();
            } catch (InterruptedException e) {
                e.printStackTrace();
                log.debug("等锁的过程中被打断"); //没有获得锁就被打断跑出的异常
                return;
            }
            try {
                log.debug("t1线程获得了锁");
            } finally {
                lock.unlock();
            }
        }, "t1");

        // 主线程获得锁(此锁不可打断)
        lock.lock();
        log.debug("main线程获得了锁");
        // 启动t1线程
        t1.start();
        try {
            Sleeper.sleep(1);
            t1.interrupt();            //打断t1线程
            log.debug("执行打断");
        } finally {
            lock.unlock();
        }
    }
}

```

输出结果：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151758272.png" />

测试使用`lock.lock()`不可以从阻塞队列中打断, 一直等待别的线程释放锁：

```java
package com.gyz.reentlock;

import com.gyz.demo.util.Sleeper;
import lombok.extern.slf4j.Slf4j;

import java.util.concurrent.locks.ReentrantLock;

/**
 * @Description 测试使用lock.lock()不可以从阻塞队列中打断, 一直等待别的线程释放锁
 * @Author GongYuZhuo
 * @Date 2021/6/30 21:52
 * @Version 1.0.0
 */
@Slf4j(topic = "c.ReentrantTest2")
public class ReentrantTest2 {
    private static final ReentrantLock lock = new ReentrantLock();

    public static void main(String[] args) {

        Thread t1 = new Thread(() -> {
            log.debug("t1线程启动...");
            lock.lock();
            try {
                log.debug("t1线程获得了锁");
            } finally {
                lock.unlock();
            }
        }, "t1");

        // 主线程获得锁(此锁不可打断)
        lock.lock();
        log.debug("main线程获得了锁");
        // 启动t1线程
        t1.start();
        try {
            Sleeper.sleep(4);
            //打断t1线程
            t1.interrupt();
            log.debug("main线程执行打断");
        } finally {
            lock.unlock();
        }
    }

}
```

输出结果：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151758240.png" />

**lock()锁不能被打断**, 在主线程中调用`t1.interrupt()`，不能打断， 当主线程释放锁之后，t1获得了锁。



### 13.3 锁超时  

> **lock.tryLock() 直接退出阻塞队列, 获取锁失败，不会一直阻塞着**。**防止无限制等待, 减少死锁**。

- 使用 `lock.tryLock()` 方法会`返回获取锁是否成功`。如果成功则返回true，反之则返回false。
- 并且`tryLock方法`可以设置**指定等待时间**，参数为：`tryLock(long timeout, TimeUnit unit)` , 其中timeout为最长等待时间，TimeUnit为时间单位。



> **不设置等待时间, 立即失败**

```java
package com.gyz.reentlock;

import com.gyz.demo.util.Sleeper;
import lombok.extern.slf4j.Slf4j;

import java.util.concurrent.locks.ReentrantLock;

/**
 * @Description 演示RenntrantLock中的tryLock(), 获取锁立即失败
 * @Author GongYuZhuo
 * @Date 2021/6/30 22:04
 * @Version 1.0.0
 */
@Slf4j(topic = "c.ReentrantTest")
public class ReentrantTestTimeOut {
    private static ReentrantLock reentrantLock = new ReentrantLock();

    public static void main(String[] args) throws InterruptedException {
        Thread t1 = new Thread(() -> {
            log.info("t1线程尝试获取锁");
            if (!reentrantLock.tryLock()) {
                log.info("t1线程获取锁失败,立刻返回");
                return;
            }
            try {
                log.info("t1线程获取到锁");
            } finally {
                reentrantLock.unlock();
                log.info("t1线程释放锁");
            }
        }, "t1");

        reentrantLock.lock();
        log.info("main线程获取到锁");
        t1.start();
        try {
            Thread.sleep(2000);
        } finally {
            reentrantLock.unlock();
            log.info("main线程释放锁");
        }
    }
}
```

输出结果：

```
17:21:31.080 [main] INFO com.gyz.interview.concurrent.reentrantlock.ReentrantTestTimeOut - main线程获取到锁
17:21:31.084 [t1] INFO com.gyz.interview.concurrent.reentrantlock.ReentrantTestTimeOut - t1线程尝试获取锁
17:21:31.084 [t1] INFO com.gyz.interview.concurrent.reentrantlock.ReentrantTestTimeOut - t1线程获取锁失败,立刻返回
17:21:33.099 [main] INFO com.gyz.interview.concurrent.reentrantlock.ReentrantTestTimeOut - main线程释放锁
```

> **设置等待时间, 超过等待时间还没有获得锁, 失败, 从阻塞队列移除该线程**

```java
package com.gyz.reentlock;

import com.gyz.demo.util.Sleeper;
import lombok.extern.slf4j.Slf4j;

import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.ReentrantLock;

/**
 * @Description 演示RenntrantLock中的tryLock(long mills), 超过锁设置的等待时间,就从阻塞队列移除
 * @Author GongYuZhuo
 * @Date 2021/6/30 22:26
 * @Version 1.0.0
 */
@Slf4j(topic = "c.ReentrantTestSetTimeOut")
@Slf4j
public class ReentrantTestTimeOut {
    private static ReentrantLock reentrantLock = new ReentrantLock();

    public static void main(String[] args) throws InterruptedException {
        Thread t1 = new Thread(() -> {
            log.info("t1线程尝试获取锁");
            try {
                if (!reentrantLock.tryLock(5, TimeUnit.SECONDS)) {
                    log.info("获取锁超时，返回");
                    return;
                }
            } catch (InterruptedException e) {
                e.printStackTrace();
            }

            try {
                log.info("t1线程获取到锁");
            } finally {
                reentrantLock.unlock();
                log.info("t1线程释放锁");
            }
        }, "t1");

        reentrantLock.lock();
        log.info("main线程获取到锁");
        t1.start();
        //      t1.interrupt();
        try {
            Thread.sleep(7000);
        } finally {
            reentrantLock.unlock();
            log.info("main线程释放锁");
        }
    }
}
```

输出结果：

```
17:27:48.324 [main] INFO com.gyz.interview.concurrent.reentrantlock.ReentrantTestTimeOut - main线程获取到锁
17:27:48.329 [t1] INFO com.gyz.interview.concurrent.reentrantlock.ReentrantTestTimeOut - t1线程尝试获取锁
17:27:53.343 [t1] INFO com.gyz.interview.concurrent.reentrantlock.ReentrantTestTimeOut - 获取锁超时，返回
17:27:55.339 [main] INFO com.gyz.interview.concurrent.reentrantlock.ReentrantTestTimeOut - main线程释放锁
```

> **通过`lock.tryLock()`来解决 `哲学家就餐`问题**

`lock.tryLock(时间)` ：尝试获取锁对象, 如果超过了设置的时间, 还没有获取到锁, 此时就退出阻塞队列, 并释放掉自己拥有的锁。

```java
package com.gyz.reentlock;

import com.gyz.demo.util.Sleeper;
import lombok.extern.slf4j.Slf4j;

import java.util.concurrent.locks.ReentrantLock;

/**
 * @Description 使用了ReentrantLock锁, 该类中有一个tryLock()方法, 在指定时间内获取不到锁对象, 就从阻塞队列移除,不用一直等待。
 * 当获取了左手边的筷子之后, 尝试获取右手边的筷子, 如果该筷子被其他哲学家占用, 获取失败, 此时就先把自己左手边的筷子,
 * 给释放掉. 这样就避免了死锁问题。
 * @Author GongYuZhuo
 * @Date 2021/6/30 22:32
 * @Version 1.0.0
 */
@Slf4j(topic = "c.PhilosopherEat")
public class PhilosopherEat {
    public static void main(String[] args) {
        Chopstick c1 = new Chopstick("1");
        Chopstick c2 = new Chopstick("2");
        Chopstick c3 = new Chopstick("3");
        Chopstick c4 = new Chopstick("4");
        Chopstick c5 = new Chopstick("5");
        new Philosopher("苏格拉底", c1, c2).start();
        new Philosopher("柏拉图", c2, c3).start();
        new Philosopher("亚里士多德", c3, c4).start();
        new Philosopher("赫拉克利特", c4, c5).start();
        new Philosopher("阿基米德", c5, c1).start();
    }

}

@Slf4j(topic = "c.Philosopher")
class Philosopher extends Thread {

    final Chopstick left;
    final Chopstick right;

    public Philosopher(String name, Chopstick left, Chopstick right) {
        super(name);
        this.left = left;
        this.right = right;
    }

    @Override
    public void run() {
        while (true) {
            // 获得了左手边筷子 (针对五个哲学家, 它们刚开始肯定都可获得左筷子)
            if (left.tryLock()) {
                try {
                    // 此时发现它的right筷子被占用了, 使用tryLock(),
                    // 尝试获取失败, 此时它就会将自己左筷子也释放掉
                    // 临界区代码
                    if (right.tryLock()) { //尝试获取右手边筷子, 如果获取失败, 则会释放左边的筷子
                        try {
                            eat();
                        } finally {
                            right.unlock();
                        }
                    }
                } finally {
                    left.unlock();
                }
            }
        }
    }

    private void eat() {
        log.debug("eating...");
        Sleeper.sleep(0.5);
    }
}


/**
 * @Description 继承ReentrantLock, 让筷子类称为锁
 */
class Chopstick extends ReentrantLock {

    String name;

    public Chopstick(String name) {
        this.name = name;
    }

    @Override
    public String toString() {
        return "筷子{" + name + '}';
    }

}
```

输出：控制台一直输出，各个科学家轮番吃，不会存在饥饿的现象。

### 13.4 条件变量

 **`lock.newCondition()`创建条件变量对象; 通过条件变量对象调用`await/signal`方法, 等待/唤醒**。

- **synchronized** 中也有`条件变量`，就是`Monitor监视器`中的 `waitSet等待集合`，当条件不满足时进入`waitSet 等待`
- **ReentrantLock** 的条件变量比 synchronized 强大之处在于,它是 **支持多个条件变量。**
- 这就好比synchronized 是那些不满足条件的线程都在`一间休息室`等通知；**(此时会造成虚假唤醒)**，而 ReentrantLock 支持`多间休息室`，有专门等烟的休息室、专门等早餐的休息室、唤醒时也是按休息室来唤醒; **(可以避免虚假唤醒)**

**使用要点：**

- await 前需要 **获得锁**
- await 执行后，会释放锁，进入 conditionObject 等待  
- await 的线程被唤醒（或打断、或超时）取重新竞争 lock 锁  
- 竞争 lock 锁成功后，从 await 后继续执行  
- signal 方法用来唤醒条件变量(等待室)汇总的某一个等待的线程
- signalAll方法, 唤醒条件变量(休息室)中的所有线程

**使用案例：**

```java
package com.gyz.reentlock;

import com.gyz.demo.util.Sleeper;
import lombok.extern.slf4j.Slf4j;

import java.util.concurrent.locks.Condition;
import java.util.concurrent.locks.ReentrantLock;

/**
 * @Description ReentrantLock可以设置多个条件变量(多个休息室), 相对于synchronized底层monitor锁中waitSet
 * @Author GongYuZhuo
 * @Date 2021/6/30 23:11
 * @Version 1.0.0
 */
@Slf4j(topic = "c.ConditionVariable")
public class ConditionVariable {
    
    private static boolean hasCigarette = false;
    private static boolean hasTakeout = false;
    private static final ReentrantLock lock = new ReentrantLock();
    // 等待烟的休息室
    static Condition waitCigaretteSet = lock.newCondition();
    // 等外卖的休息室
    static Condition waitTakeoutSet = lock.newCondition();

    public static void main(String[] args) {

        new Thread(() -> {
            lock.lock();
            try {
                log.debug("有烟没？[{}]", hasCigarette);
                while (!hasCigarette) {
                    log.debug("没烟，先歇会！");
                    try {
                        // 此时小南进入到 等烟的休息室
                        waitCigaretteSet.await();
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                }
                log.debug("烟来咯, 可以开始干活了");
            } finally {
                lock.unlock();
            }
        }, "小南").start();

        new Thread(() -> {
            lock.lock();
            try {
                log.debug("外卖送到没？[{}]", hasTakeout);
                while (!hasTakeout) {
                    log.debug("没外卖，先歇会！");
                    try {
                        // 此时小女进入到 等外卖的休息室
                        waitTakeoutSet.await();
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                }
                log.debug("外卖来咯, 可以开始干活了");
            } finally {
                lock.unlock();
            }
        }, "小女").start();

        Sleeper.sleep(1);
        new Thread(() -> {
            lock.lock();
            try {
                log.debug("送外卖的来咯~");
                hasTakeout = true;
                // 唤醒等外卖的小女线程
                waitTakeoutSet.signal();
            } finally {
                lock.unlock();
            }
        }, "送外卖的").start();

        Sleeper.sleep(1);
        new Thread(() -> {
            lock.lock();
            try {
                log.debug("送烟的来咯~");
                hasCigarette = true;
                // 唤醒等烟的小南线程
                waitCigaretteSet.signal();
            } finally {
                lock.unlock();
            }
        }, "送烟的").start();
    }

}
```



### 13.5 源码分析

[参考文章](https://blog.csdn.net/zhengzhaoyang122/article/details/110847701)

#### 13.5.1 ReentrantLock类关系

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151758040.png)

- **ReentrantLock** 实现了 **Lock**接口，**Lock**接口中定义了 **lock**与 **unlock**相关操作。 

- **ReentrantLock** 总共有三个内部类，并且三个内部类是紧密相关的：

  **NonfairSync**与 **FairSync**类继承自 **Sync**类，**Sync**类继承自 **AbstractQueuedSynchronizer**抽象类（AQS）。



#### 13.5.2 AbstractQueuedSynchronizer 抽象类分析

| 方法名                                      | 描述                                                         |
| :------------------------------------------ | ------------------------------------------------------------ |
| protected boolean isHeldExclusively()       | 该线程是否正在独占资源。只有用到Condition才需要去实现它。    |
| protected boolean tryAcquire(int arg)       | 独占方式。arg为获取锁的次数，尝试获取资源，成功则返回True，失败则返回False。 |
| protected boolean tryRelease(int arg)       | 独占方式。arg为释放锁的次数，尝试释放资源，成功则返回True，失败则返回False。 |
| protected int tryAcquireShared(int arg)     | 共享方式。arg为获取锁的次数，尝试获取资源。负数表示失败；0表示成功，但没有剩余可用资源；正数表示成功，且有剩余资源。 |
| protected boolean tryReleaseShared(int arg) | 共享方式。arg为释放锁的次数，尝试释放资源，如果释放后允许唤醒后续等待结点返回True，否则返回False。 |

一般来说，**自定义同步器要么是独占方式，要么是共享方式**，它们也只需实现`tryAcquire`、`tryRelease`、`tryAcquireShared`、`tryReleaseShared`中的一种即可。**AQS也支持自定义同步器同时实现独占和共享两种方式**，如`ReentrantReadWriteLock`。ReentrantLock是独占锁，所以实现了tryAcquire、tryRelease。以非公平锁为例，这里主要阐述一下**非公平锁与AQS**之间方法的关联之处，

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151758736.jpg)

#### 13.5.3 Sync 类的源码如下

```java
  abstract static class Sync extends AbstractQueuedSynchronizer {
      // 序列号
      private static final long serialVersionUID = -5179523762034025860L;
      
      // 获取锁
      abstract void lock();
      
     // 非公平方式获取
      final boolean nonfairTryAcquire(int acquires) {
         // 当前线程
         final Thread current = Thread.currentThread();
         // 获取状态
         int c = getState();
         if (c == 0) { // 表示没有线程正在竞争该锁
             if (compareAndSetState(0, acquires)) { // 比较并设置状态成功，状态0表示锁没有被占用
                 // 设置当前线程独占
                 setExclusiveOwnerThread(current); 
                 return true; // 成功
             }
         }
         else if (current == getExclusiveOwnerThread()) { // 当前线程拥有该锁
             int nextc = c + acquires; // 增加重入次数
             if (nextc < 0) // overflow
                 throw new Error("Maximum lock count exceeded");
             // 设置状态
             setState(nextc); 
             // 成功
             return true; 
         }
         // 失败
         return false;
     }
     
     // 试图在共享模式下获取对象状态，此方法应该查询是否允许它在共享模式下获取对象状态，如果允许，则获取它
     protected final boolean tryRelease(int releases) {
         int c = getState() - releases;
         if (Thread.currentThread() != getExclusiveOwnerThread()) // 当前线程不为独占线程
             throw new IllegalMonitorStateException(); // 抛出异常
         // 释放标识
         boolean free = false; 
         if (c == 0) {
             free = true;
             // 已经释放，清空独占
             setExclusiveOwnerThread(null); 
         }
         // 设置标识
         setState(c); 
         return free; 
     }
     
     // 判断资源是否被当前线程占有
     protected final boolean isHeldExclusively() {
         return getExclusiveOwnerThread() == Thread.currentThread();
     }
 
     // 新生一个条件
     final ConditionObject newCondition() {
         return new ConditionObject();
     }
 
     // 返回资源的占用线程
     final Thread getOwner() {        
         return getState() == 0 ? null : getExclusiveOwnerThread();
     }
     // 返回状态
     final int getHoldCount() {            
         return isHeldExclusively() ? getState() : 0;
     }
 
     // 资源是否被占用
     final boolean isLocked() {        
         return getState() != 0;
     }
 
     // 自定义反序列化逻辑
     private void readObject(java.io.ObjectInputStream s)
         throws java.io.IOException, ClassNotFoundException {
         s.defaultReadObject();
         setState(0); // reset to unlocked state
     }
 }

```



#### 13.5.4 NonfairSync 类

`NonfairSync` 类继承了 `Sync`类，表示采用**非公平策略获取锁**，其实现了 Sync类中抽象的 lock方法，源码如下：从 lock方法的源码可知，每一次都尝试获取锁，而并不会按照公平等待的原则进行等待，让等待时间最久的线程获得锁。`acquire()`方法是 `FairSync`和 `UnfairSync`的`父类 AQS`中的核心方法。

```java
// 非公平锁 
static final class NonfairSync extends Sync {
        private static final long serialVersionUID = 7316153563782823691L;

        /**
         * 获得锁
         */
        final void lock() {
            /**
             * 若通过CAS设置变量State（同步状态）成功，也就是获取锁成功，则将当前线程设置为独占线程。
             * 若通过CAS设置变量State（同步状态）失败，也就是获取锁失败，则进入Acquire方法进行后续处理。
             */
            if (compareAndSetState(0, 1))
                // 把当前线程设置独占了锁
                setExclusiveOwnerThread(Thread.currentThread());
            else // 锁已经被占用，或者set失败
                // 以独占模式获取对象，忽略中断
                acquire(1);  //acquire()方法是FairSync和UnfairSync的父类AQS中的核心方法。
        }

        protected final boolean tryAcquire(int acquires) {
            return nonfairTryAcquire(acquires);
        }
    }
```



#### 13.5.5 FairSync类*

`FairSync` 类也继承了` Sync`类，表示采用**公平策略获取锁**，其实现了 `Sync`类中的抽象 `lock`方法，源码如下：

```java
  // 公平锁
  static final class FairSync extends Sync {
      // 版本序列化
      private static final long serialVersionUID = -3000897897090466540L;
  
      final void lock() {
          // 以独占模式获取对象，忽略中断
          acquire(1);
      }
 
     // 尝试公平获取锁
     protected final boolean tryAcquire(int acquires) {
         // 获取当前线程
         final Thread current = Thread.currentThread();
         // 获取状态
         int c = getState();
         if (c == 0) { // 状态为0
             if (!hasQueuedPredecessors() &&
                 compareAndSetState(0, acquires)) { // 不存在已经等待更久的线程并且比较并且设置状态成功
                 // 设置当前线程独占
                 setExclusiveOwnerThread(current);
                 return true;
             }
         }
         else if (current == getExclusiveOwnerThread()) { // 状态不为0，即资源已经被线程占据
             // 下一个状态
             int nextc = c + acquires;
             if (nextc < 0) // 超过了int的表示范围
                 throw new Error("Maximum lock count exceeded");
             // 设置状态
             setState(nextc);
             return true;
         }
         return false;
     }
 }

```

跟踪 lock方法的源码可知，当资源空闲时，它总是会先判断 sync队列(AbstractQueuedSynchronizer中的数据结构)是否有等待时间更长的线程，如果存在，则将该线程加入到等待队列的尾部，实现了公平获取原则。其中，FairSync 类的 lock的方法调用如下，只给出了主要的方法。

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151758928.png" />

可以看出只要资源被其他线程占用，该线程就会添加到 **sync queue**中的尾部，而不会先尝试获取资源。这也是和 Nonfair最大的区别，Nonfair每一次都会尝试去获取资源，如果此时该资源恰好被释放，则会被当前线程获取，这就造成了不公平的现象，当获取不成功，再加入队列尾部。



####  13.5.6 ReentrantLock和 AQS之间方法的交互过程。

以非公平锁为例，加锁和解锁的交互流程：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151758954.png)

**加锁：**

- 通过ReentrantLock的加锁方法Lock进行加锁操作。
- 会调用到内部类Sync的Lock方法，由于Sync#lock是抽象方法，根据ReentrantLock初始化选择的公平锁和非公平锁，执行相关内部类的Lock方法，本质上都会执行AQS的Acquire方法。
- AQS的Acquire方法会执行tryAcquire方法，但是由于tryAcquire需要自定义同步器实现，因此执行了ReentrantLock中的tryAcquire方法，由于ReentrantLock是通过公平锁和非公平锁内部类实现的tryAcquire方法，因此会根据锁类型不同，执行不同的tryAcquire。
- tryAcquire是获取锁逻辑，获取失败后，会执行框架 AQS的后续逻辑，跟ReentrantLock自定义同步器无关。

**解锁：**

- 通过 ReentrantLock的解锁方法 Unlock进行解锁。
- Unlock会调用内部类 Sync的 Release方法，该方法继承于AQS。
- Release中会调用 tryRelease方法，tryRelease需要自定义同步器实现，tryRelease只在ReentrantLock中的Sync实现，因此可以看出，释放锁的过程，并不区分是否为公平锁。
- 释放成功后，所有处理由AQS框架完成，与自定义同步器无关。

通过上面的描述，大概可以总结出 ReentrantLock加锁解锁时 API层核心方法的映射关系：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/202207151758367.png)



#### 13.5.7 ReentrantLock类

> **ReentrantLock类属性**

**ReentrantLock** 类的 **sync**非常重要，对**ReentrantLock** 类的操作大部分都直接转化为对 **sync**和 **AQS**类的操作。

```java
 public class ReentrantLock implements Lock, java.io.Serializable {
     // 序列号
     private static final long serialVersionUID = 7373984872572414699L;    
     // 同步队列
     private final Sync sync;
 }
```



> **构造函数**

**ReentrantLock 构造函数：\**默认是采用的\**非公平**策略获取锁

```java
 public ReentrantLock() {
     // 默认非公平策略
     sync = new NonfairSync();
 }
```

**ReentrantLock(boolean)** 构造函数：可以传递参数确定采用公平策略或者是非公平策略，参数为 true表示公平策略，否则，采用非公平策略。

```java
 public ReentrantLock(boolean fair) {
     sync = fair ? new FairSync() : new NonfairSync();
 }
```

---

## 十四、wait/notify 原理

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202402/340c12e813570b96.png)

Owner 线程发现条件不满足，调用 wait 方法，即可进入 WaitSet 变为 WAITING 状态

BLOCKED 和 WAITING 的线程都处于阻塞状态，不占用 CPU 时间片

BLOCKED 线程会在 Owner 线程释放锁时唤醒

WAITING 线程会在 Owner 线程调用 notify 或 notifyAll 时唤醒，但唤醒后并不意味者立刻获得锁，仍需进入

EntryList 重新竞争

---

## 十五、join 原理

是调用者轮询检查线程 alive 状态

`t1.join();`

等价于下面的代码

```java
synchronized (t1) {
 	// 调用者线程进入 t1 的 waitSet 等待, 直到 t1 运行结束
 	while (t1.isAlive()) {
 		t1.wait(0);
 	}
}
```

> **注意*：join 体现的是【保护性暂停】模式

​     

---

## 十六、本章小结

本章我们需要重点掌握的是：

- 分析多线程访问共享资源时，哪些代码片段属于临界区
- 使用 synchronized 互斥解决临界区的线程安全问题
  - 掌握 synchronized 锁对象语法
  - 掌握 synchronzied 加载成员方法和静态方法语法
  - 掌握 wait/notify 同步方法
- 使用 lock 互斥解决临界区的线程安全问题
  - 掌握 lock 的使用细节：可打断、锁超时、公平锁、条件变量
- 学会分析变量的线程安全性、掌握常见线程安全类的使用
- 了解线程活跃性问题：死锁、活锁、饥饿
- **应用方面**
  - 互斥：使用 synchronized 或 Lock 达到共享资源互斥效果
  - 同步：使用 wait/notify 或 Lock 的条件变量来达到线程间通信效果
- **原理方面**
  - monitor、synchronized 、wait/notify 原理
  - synchronized 进阶原理
  - park & unpark 原理
- **模式方面**
  - 同步模式之保护性暂停
  - 异步模式之生产者消费者
  - 同步模式之顺序控制





