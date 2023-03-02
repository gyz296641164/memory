---
title: 共享模型之无锁
category:
  - 并发编程
order: 4
date: 2023-03-01
---

<!-- more -->

## 问题提出

### 使用`synchronized`保证线程安全

有如下需求，保证`account.withdraw`取款方法的线程安全, 下面使用`synchronized`保证线程安全：

```java
package com.gyz.nonelock;

import java.util.ArrayList;
import java.util.List;

/**
 * @Description
 * @Author GongYuZhuo
 * @Date 2021/7/3 17:49
 * @Version 1.0.0
 */
public interface Account {

    //获取余额
    Integer getBalance();

    //转账
    void withdraw(Integer amount);

    /**
     * @param account :
     * @return void
     * @Description 启动1000个线程，初始金额10000，做1000次减操作，正常结果是0
     */
    static void demo(Account account) {

        List<Thread> list = new ArrayList<>();
        long start = System.nanoTime();

        for (int i = 0; i < 1000; i++) {
            list.add(new Thread(() -> {
                account.withdraw(10);
            }));
        }

        list.forEach(Thread::start);
        list.forEach(t -> {
            try {
                t.join();
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        });

        long end = System.nanoTime();
        System.out.println(account.getBalance() + " cost " + (end - start) / 1000_000 + "ms");
    }

}

```

```java
package com.gyz.nonelock;

public class AccountUnsafe implements Account {


    private Integer balance;

    public AccountUnsafe(Integer balance) {
        this.balance = balance;
    }

    @Override
    public Integer getBalance() {
        synchronized (this){
            return balance;

        }
    }

    @Override
    public  void withdraw(Integer amount) {
        synchronized (this){
            this.balance -= amount;

        }
    }

    public static void main(String[] args) {
        Account.demo(new AccountUnsafe(10000));
    }
}
```

**synchronized加锁操作太耗费资源 (因为底层使用了操作系统mutex指令, 造成内核态和用户态的切换)**



### 使用无锁来保证安全

```java
package com.gyz.nonelock;

import java.util.concurrent.atomic.AtomicInteger;

public class AccountCas implements Account {

    /** 使用原子整数，底层使用：CAS + 重试机制 */
    private AtomicInteger balance;


    public AccountCas(int balance) {
        this.balance = new AtomicInteger(balance);
    }

    @Override
    public Integer getBalance() {
        //获得原子整数的值
        return balance.get();
    }

    @Override
    public void withdraw(Integer amount) {
        while (true) {
            //获取取钱之前的值
            int pre = balance.get();
            //获取转账之后的余额
            int next = pre - amount;


            /**
             * @Description 此时的prev为共享变量的值, 如果prev被别的线程改了.也就是说: 自己读到的 共享变量的值 和 共享变量最新值 不匹配,
             * 				就继续where(true),如果匹配上了, 将next值设置给共享变量。
             *
             * 				AtomicInteger中value属性, 被volatile修饰, 就是为了确保线程之间共享变量的可见性.
             * @param amount :
             * @return void
             */
            if (balance.compareAndSet(pre, next)) {
                break;
            }
        }
    }

    public static void main(String[] args) {

        Account.demo(new AccountCas(10000));
    }
}
```



***

## CAS 与 volatile  

使用原子操作来保证线程访问共享资源的安全性, CAS+重试的机制来确保(乐观锁思想)，相对于悲观锁思想的`synchronized`，`reentrantLock`来说，CAS的方式效率会更好！

### CAS + 重试 原理

前面看到的`AtomicInteger`的解决方法，内部并`没有用锁`来保护`共享变量`的线程安全。那么它是如何实现的呢？

```java
 public void withdraw(Integer amount) {
        while (true) {
            //获取旧值
            int pre = balance.get();
            //获取转账之后的余额
            int next = pre - amount;
            
           /**
             * @Description
             *  compareAndSet 保证操作共享变量安全性的操作:
             *          ① 线程A首先获取balance.get(),拿到当前的balance值prev
             *          ② 根据这个prev值 - amount值 = 修改后的值next
             *          ③ 调用compareAndSet方法, 首先会判断当初拿到的prev值,是否和现在的
             *          	balance值相同;
             *          	    如果相同,表示其他线程没有修改balance的值, 此时就可以将next值设置给balance属性
             *          	    如果不相同,表示其他线程也修改了balance值, 此时就设置next值失败,
             *                 
             * 				然后一直重试, 重新获取balance.get()的值,计算出next值,
             * 				并判断本次的prev和balnce的值是否相同...重复上面操作
             * 
             * 
             */
             if (balance.compareAndSet(pre, next)) {
                break;
            }
        }
     
 }   
```

其中的关键是 `compareAndSwap（比较并设置值）`，它的简称就是 `CAS` （也有 Compare And Swap 的说法），它必须是`原子操作`。

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716075841.png" />

**流程 :**

当一个线程要去修改`Account对象`中的值时，`先获取值prev（调用get方法）`，然后再将其设置为新的值`next`（调用cas方法）。在调用cas方法时，会将`prev`与`Account中的余额`进行比较。

- 如果两者**相等**，就说明该值还未被其他线程修改，此时便可以进行修改操作。
- 如果两者**不相等**，就不设置值，重新获取值prev（调用get方法），然后再将其设置为新的值next（调用cas方法），直到修改成功为止。

**注意 :**

- 其实 `CAS` 的底层是 **lock cmpxchg** 指令（X86 架构），在单核 CPU 和多核 CPU 下都能够保证【比较-交换】的 **原子性**。
- 在多核状态下，某个核执行到带 lock 的指令时，**CPU 会让总线锁住，当这个核把此指令执行完毕，再开启总线。这个过程中不会被线程的调度机制所打断，保证了多个线程对内存操作的准确性，是原子的。**



### volatile的作用

- 在上面代码中的`AtomicInteger类`，**保存值的`value属性`使用了`volatile 修饰`**。获取共享变量时，为了`保证该变量的可见性`，需要使用 **volatile 修饰**。
- volatile可以用来修饰 **成员变量和静态成员变量**，他可以避免线程从自己的工作缓存中查找变量的值，必须到主存中获取它的值，线程操作 volatile 变量都是直接操作主存。**即一个线程对 volatile 变量的修改，对另一个线程可见。**
- **CAS 必须借助 volatile 才能读取到共享变量的最新值来实现【比较并交换】的效果**
- 注意:` volatile` 仅仅保证了共享变量的`可见性`，让其它线程能够看到最新值，但不能解决指令交错问题（**不能保证原子性**）

 

### 为什么无锁效率高  

- 使用CAS+重试---无锁情况下，即使`重试失败`，线程始终在高速运行，没有停歇，而 `synchronized`会让线程在没有获得锁的时候，`发生上下文切换，进入阻塞`。
  - 打个比喻：线程就好像高速跑道上的赛车，高速运行时，速度超快，一旦发生上下文切换，就好比赛车要减速、熄火，等被唤醒又得重新打火、启动、加速… 恢复到高速运行，代价比较大!
- 但无锁情况下，因为线程要保持运行，需要额外 CPU 的支持，CPU 在这里就好比高速跑道，没有额外的跑道，线程想高速运行也无从谈起，虽然不会进入阻塞，但由于没有分到时间片，仍然会进入可运行状态，还是会导致上下文切换。



### CAS 的特点 

结合 CAS 和 volatile 可以实现无锁并发，适用于线程数少、多核 CPU 的场景下。  

- CAS 是基于乐观锁的思想：最乐观的估计，不怕别的线程来修改共享变量，就算改了也没关系，不断再重试呗。

- synchronized 是基于悲观锁的思想：最悲观的估计，得防着其它线程来修改共享变量，我上了锁你们都别想改，我改完了解开锁，你们才有机会。  

- CAS 体现的是无锁并发、无阻塞并发，请仔细体会这两句话的意思  ：

  - 因为没有使用 synchronized，所以线程不会陷入阻塞，这是效率提升的因素之一  
  - 但如果竞争激烈，可以想到重试必然频繁发生，反而效率会受影响  




***

## CAS原理

### 什么是CAS？

- CAS：Compare and Swap，即比较再交换；
- jdk5增加了并发包`java.util.concurrent.*`，其下面的类使用CAS算法实现了区别于synchronouse同步锁的一种乐观锁。JDK 5之前Java语言是靠synchronized关键字保证同步的，这是一种独占锁，也是是悲观锁。

### CAS算法理解

- 对CAS的理解，CAS是一种无锁算法，CAS有3个操作数：`内存值V`，`旧的预期值A`，`要修改的新值B`。当且仅当预期值A和内存值V相同时，将内存值V修改为B，否则什么都不做。

- CAS比较与交换的伪代码可以表示为：

  ```java
  do{
  
  备份旧数据；
  
  基于旧数据构造新数据；
  
  }while(!CAS( 内存地址，备份的旧数据，新数据 ))
  ```

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220716075842.png" />

`注：t1，t2线程是同时更新同一变量56的值`

- 因为t1和t2线程都同时去访问同一变量56，所以他们会把主内存的值完全拷贝一份到自己的工作内存空间，所以t1和t2线程的预期值都为56。

- 假设t1在与t2线程竞争中线程t1能去更新变量的值，而其他线程都失败。（失败的线程并不会被挂起，而是被告知这次竞争中失败，并可以再次发起尝试）。t1线程去更新变量值改为57，然后写到内存中。此时对于t2来说，内存值变为了57，与预期值56不一致，就操作失败了（想改的值不再是原来的值）。

- 上图通俗的解释是：CPU去更新一个值，但如果想改的值不再是原来的值，操作就失败，因为很明显，有其它操作先改变了这个值。

- 就是指当两者进行比较时，如果相等，则证明共享数据没有被修改，替换成新值，然后继续往下运行；如果不相等，说明共享数据已经被修改，放弃已经所做的操作，然后重新执行刚才的操作。容易看出 CAS 操作是基于共享数据不会被修改的假设，采用了类似于数据库的commit-retry 的模式。当同步冲突出现的机会很少时，这种假设能带来较大的性能提升。

  

### CAS开销

前面说过了，`CAS（比较并交换）`是CPU指令级的操作，只有一步原子操作，所以非常快。而且CAS避免了请求操作系统来裁定锁的问题，不用麻烦操作系统，直接在CPU内部就搞定了。但CAS就没有开销了吗？不！有`cache miss`情况。这个问题比较复杂，首先需要了解CPU的硬件体系结构。自行查阅！

### CAS 的问题

- **CAS 容易造成 ABA 问题**

  一个线程将数值a改成了 b，接着又改成了 a，此时 CAS 认为是没有变化，其实是已经变化过了，而这个问题的解决方案可以使用版本号标识，每操作一次version 加 1。在 java5 中，已经提供了 `AtomicStampedReference` 来解决问题。 

- **不能保证代码块的原子性**

  CAS 机制所保证的只是一个变量的原子性操作，而不能保证整个代码块的原子性。比如需要保证 3 个变量共同进行原子性的更新，就不得不使用 synchronized 了。 

- **CAS 造成CPU 利用率增加**

  之前说过了 CAS 里面是一个循环判断的过程，如果线程一直没有获取到状态，cpu资源会一直被占用。

---

## 原子整数

J.U.C 并发包提供了：

- AtomicBoolean
- AtomicInteger
- AtomicLong

上面三个类提供的方法几乎相同，以 AtomicInteger 为例

```java
public class Test1 {
    public static void main(String[] args) {
        AtomicInteger i = new AtomicInteger(0);
        // 获取并自增（i = 0, 结果 i = 1, 返回 0），类似于 i++
        System.out.println(i.getAndIncrement());
        // 自增并获取（i = 1, 结果 i = 2, 返回 2），类似于 ++i
        System.out.println(i.incrementAndGet());
        // 自减并获取（i = 2, 结果 i = 1, 返回 1），类似于 --i
        System.out.println(i.decrementAndGet());
        // 获取并自减（i = 1, 结果 i = 0, 返回 1），类似于 i--
        System.out.println(i.getAndDecrement());
        // 获取并加值（i = 0, 结果 i = 5, 返回 0）
        System.out.println(i.getAndAdd(5));
        // 加值并获取（i = 5, 结果 i = 0, 返回 0）
        System.out.println(i.addAndGet(-5));
        // 获取并更新（i = 0, p 为 i 的当前值, 结果 i = -2, 返回 0）
        // 其中函数中的操作能保证原子，但函数需要无副作用
        System.out.println(i.getAndUpdate(p -> p - 2));
        // 更新并获取（i = -2, p 为 i 的当前值, 结果 i = 0, 返回 0）
        // 其中函数中的操作能保证原子，但函数需要无副作用
        System.out.println(i.updateAndGet(p -> p + 2));
        // 获取并计算（i = 0, p 为 i 的当前值, x 为参数1, 结果 i = 10, 返回 0）
        // 其中函数中的操作能保证原子，但函数需要无副作用
        // getAndUpdate 如果在 lambda 中引用了外部的局部变量，要保证该局部变量是 final 的
        // getAndAccumulate 可以通过 参数1 来引用外部的局部变量，但因为其不在 lambda 中因此不必是 final
        System.out.println(i.getAndAccumulate(10, (p, x) -> p + x));
        // 计算并获取（i = 10, p 为 i 的当前值, x 为参数1, 结果 i = 0, 返回 0）
        // 其中函数中的操作能保证原子，但函数需要无副作用
        System.out.println(i.accumulateAndGet(-10, (p, x) -> p + x));
    }
}
```

## 原子引用

为什么需要原子引用类型？保证引用类型的共享变量是线程安全的（确保这个原子引用没有引用过别人）。

基本类型原子类只能更新一个变量，如果需要原子更新多个变量，需要使用引用类型原子类。

- AtomicReference：引用类型原子类
- AtomicStampedReference：原子更新带有版本号的引用类型。该类将整数值与引用关联起来，可用于解决原子的更新数据和数据的版本号，可以解决使用 CAS 进行原子更新时可能出现的 ABA 问题。
- AtomicMarkableReference ：原子更新带有标记的引用类型。该类将 boolean 标记与引用关联起来。

有如下方法：

```java
public interface DecimalAccount {
    // 获取余额
    BigDecimal getBalance();

    // 取款
    void withdraw(BigDecimal amount);

    /**
     * 方法内会启动 1000 个线程，每个线程做 -10 元 的操作
     * 如果初始余额为 10000 那么正确的结果应当是 0
     */
    static void demo(DecimalAccount account) {
        List<Thread> ts = new ArrayList<>();
        for (int i = 0; i < 1000; i++) {
            ts.add(new Thread(() -> {
                account.withdraw(BigDecimal.TEN);
            }));
        }
        ts.forEach(Thread::start);
        ts.forEach(t -> {
            try {
                t.join();
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        });
        System.out.println(account.getBalance());
    }
}
```

试着提供不同的 DecimalAccount 实现，实现安全的取款操作。

### 不安全的实现

```java
class DecimalAccountUnsafe implements DecimalAccount {
    BigDecimal balance;
    public DecimalAccountUnsafe(BigDecimal balance) {
        this.balance = balance;
    }
    @Override
    public BigDecimal getBalance() {
        return balance;
    }
    @Override
    public void withdraw(BigDecimal amount) {
        BigDecimal balance = this.getBalance();
        this.balance = balance.subtract(amount);
    }
}
```

### 安全实现-使用 CAS

```java
class DecimalAccountCas implements DecimalAccount {
    private AtomicReference<BigDecimal> balance;

    public DecimalAccountCas(BigDecimal balance) {
//        this.balance = balance;
        this.balance = new AtomicReference<>(balance);
    }

    @Override
    public BigDecimal getBalance() {
        return balance.get();
    }

    @Override
    public void withdraw(BigDecimal amount) {
        while(true) {
            BigDecimal prev = balance.get();
            BigDecimal next = prev.subtract(amount);
            if (balance.compareAndSet(prev, next)) {
                break;
            }
        }
    }
}
```

### 测试代码

```java
DecimalAccount.demo(new DecimalAccountSafeCas(new BigDecimal("10000")));
```

### ABA 问题及解决

#### ABA 问题

```java
    static AtomicReference<String> ref = new AtomicReference<>("A");
    public static void main(String[] args) throws InterruptedException {
        log.debug("main start...");
        // 获取值 A
        // 这个共享变量被它线程修改
        String prev = ref.get();
        other();
        utils.sleep(1);
        // 尝试改为 C
        log.debug("change A->C {}", ref.compareAndSet(prev, "C"));
    }
    private static void other() {
        new Thread(() -> {
            log.debug("change A->B {}", ref.compareAndSet(ref.get(), "B"));
        }, "t1").start();
        utils.sleep(1);
        new Thread(() -> {
            // 注意：如果这里使用  log.debug("change B->A {}", ref.compareAndSet(ref.get(), new String("A")));
            // 那么此实验中的 log.debug("change A->C {}", ref.compareAndSet(prev, "C"));
            // 打印的就是false， 因为new String("A") 返回的对象的引用和"A"返回的对象的引用时不同的！
            log.debug("change B->A {}", ref.compareAndSet(ref.get(), "A"));
        }, "t2").start();
    }
```

输出

```
11:29:52.325 c.Test36 [main] - main start... 
11:29:52.379 c.Test36 [t1] - change A->B true 
11:29:52.879 c.Test36 [t2] - change B->A true 
11:29:53.880 c.Test36 [main] - change A->C true
```

主线程仅能判断出共享变量的值与最初值 A 是否相同，不能感知到这种从 A 改为 B 又 改回 A 的情况，如果主线程希望：

只要有其它线程【动过了】共享变量，那么自己的 cas 就算失败，这时，仅比较值是不够的，需要再加一个版本号。使用`AtomicStampedReference`来解决。

#### AtomicStampedReference

```java
    static AtomicStampedReference<String> ref = new AtomicStampedReference<>("A", 0);

    public static void main(String[] args) throws InterruptedException {
        log.debug("main start...");
        // 获取值 A
        String prev = ref.getReference();
        // 获取版本号
        int stamp = ref.getStamp();
        log.debug("版本 {}", stamp);
        // 如果中间有其它线程干扰，发生了 ABA 现象
        other();
        sleep(1);
        // 尝试改为 C
        log.debug("change A->C {}", ref.compareAndSet(prev, "C", stamp, stamp + 1));
    }

    private static void other() {
        new Thread(() -> {
            log.debug("change A->B {}", ref.compareAndSet(ref.getReference(), "B", ref.getStamp(), ref.getStamp() + 1));
            log.debug("更新版本为 {}", ref.getStamp());
        }, "t1").start();
        sleep(0.5);
        new Thread(() -> {
            log.debug("change B->A {}", ref.compareAndSet(ref.getReference(), "A", ref.getStamp(), ref.getStamp() + 1));
            log.debug("更新版本为 {}", ref.getStamp());
        }, "t2").start();
    }
```

输出为

```
15:41:34.891 c.Test36 [main] - main start... 
15:41:34.894 c.Test36 [main] - 版本 0 
15:41:34.956 c.Test36 [t1] - change A->B true 
15:41:34.956 c.Test36 [t1] - 更新版本为 1 
15:41:35.457 c.Test36 [t2] - change B->A true 
15:41:35.457 c.Test36 [t2] - 更新版本为 2 
15:41:36.457 c.Test36 [main] - change A->C false
```

`AtomicStampedReference` 可以给原子引用加上版本号，追踪原子引用整个的变化过程，如： A -> B -> A -> C ，通过`AtomicStampedReference`，我们可以知道，引用变量中途被更改了几次。但是有时候，并不关心引用变量更改了几次，只是单纯的关心是否更改过，所以就有了`AtomicMarkableReference`。

![image-20220811234825148](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent20220811234825.png)

#### AtomicMarkableReference

```java
public class Test38 {
    public static void main(String[] args) throws InterruptedException {
        GarbageBag bag = new GarbageBag("装满了垃圾");
        // 参数2 mark 可以看作一个标记，表示垃圾袋满了
        AtomicMarkableReference<GarbageBag> ref = new AtomicMarkableReference<>(bag, true);

        log.debug("start...");
        GarbageBag prev = ref.getReference();
        log.debug(prev.toString());

        new Thread(() -> {
            log.debug("start...");
            bag.setDesc("空垃圾袋");
            ref.compareAndSet(bag, bag, true, false);
            log.debug(bag.toString());
        },"保洁阿姨").start();

        sleep(1);
        log.debug("想换一只新垃圾袋？");
        boolean success = ref.compareAndSet(prev, new GarbageBag("空垃圾袋"), true, false);
        log.debug("换了么？" + success);
        log.debug(ref.getReference().toString());
    }
}

class GarbageBag {
    String desc;

    public GarbageBag(String desc) {
        this.desc = desc;
    }

    public void setDesc(String desc) {
        this.desc = desc;
    }

    @Override
    public String toString() {
        return super.toString() + " " + desc;
    }
}
```

输出：

```
23:58:19.345 c.Test38 [main] - start...
23:58:19.355 c.Test38 [main] - cn.itcast.test.GarbageBag@1c2c22f3 装满了垃圾
23:58:19.422 c.Test38 [保洁阿姨] - start...
23:58:19.422 c.Test38 [保洁阿姨] - cn.itcast.test.GarbageBag@1c2c22f3 空垃圾袋
23:58:20.443 c.Test38 [main] - 想换一只新垃圾袋？
23:58:20.443 c.Test38 [main] - 换了么？false
23:58:20.443 c.Test38 [main] - cn.itcast.test.GarbageBag@1c2c22f3 空垃圾袋
```

---

## 原子数组

使用原子的方式更新数组里的某个元素

- AtomicIntegerArray：整形数组原子类
- AtomicLongArray：长整形数组原子类
- AtomicReferenceArray ：引用类型数组原子类

有如下方法：

```java
    /**
     参数1，提供数组、可以是线程不安全数组或线程安全数组
     参数2，获取数组长度的方法
     参数3，自增方法，回传 array, index
     参数4，打印数组的方法
     */
    // supplier 提供者 无中生有  ()->结果
    // function 函数   一个参数一个结果   (参数)->结果  ,  BiFunction (参数1,参数2)->结果
    // consumer 消费者 一个参数没结果  (参数)->void,      BiConsumer (参数1,参数2)->
    private static <T> void demo(
            Supplier<T> arraySupplier,
            Function<T, Integer> lengthFun,
            BiConsumer<T, Integer> putConsumer,
            Consumer<T> printConsumer ) {
        List<Thread> ts = new ArrayList<>();
        T array = arraySupplier.get();
        int length = lengthFun.apply(array);
        for (int i = 0; i < length; i++) {
            // 每个线程对数组作 10000 次操作
            ts.add(new Thread(() -> {
                for (int j = 0; j < 10000; j++) {
                    putConsumer.accept(array, j%length);
                }
            }));
        }

        ts.forEach(t -> t.start()); // 启动所有线程
        ts.forEach(t -> {
            try {
                t.join();
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        });     // 等所有线程结束
        printConsumer.accept(array);
    }
```

### 不安全的数组

测试方法：

```java
        demo(
                ()->new int[10],
                (array)->array.length,
                (array, index) -> array[index]++,
                array-> System.out.println(Arrays.toString(array))
        );
```

输出结果：

```
[9870, 9862, 9774, 9697, 9683, 9678, 9679, 9668, 9680, 9698]
```

### 安全的数组

测试方法：

```java
        demo(
                ()-> new AtomicIntegerArray(10),
                (array) -> array.length(),
                (array, index) -> array.getAndIncrement(index),
                array -> System.out.println(array)
        );
```

输出结果：

```
[10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000]
```

---

## 字段更新器

AtomicReferenceFieldUpdater // 域 字段

AtomicIntegerFieldUpdater

AtomicLongFieldUpdater

利用字段更新器，可以针对对象的某个域（Field）进行原子操作，只能配合 volatile 修饰的字段使用，否则会出现异常

```
Exception in thread "main" java.lang.IllegalArgumentException: Must be volatile type
```

示例代码：

```java
@Slf4j(topic = "c.Test40")
public class Test40 {

    public static void main(String[] args) {
        Student stu = new Student();

        AtomicReferenceFieldUpdater updater =
                AtomicReferenceFieldUpdater.newUpdater(Student.class, String.class, "name");

        System.out.println(updater.compareAndSet(stu, null, "张三"));
        System.out.println(stu);
    }
}

class Student {
    volatile String name;

    @Override
    public String toString() {
        return "Student{" +
                "name='" + name + '\'' +
                '}';
    }
}
```

---

## 原子累加器

### 累加器性能比较

测试代码

```java
public class Test41 {
    public static void main(String[] args) {
        for (int i = 0; i < 5; i++) {
            demo(
                    () -> new AtomicLong(0),
                    (adder) -> adder.getAndIncrement()
            );
        }

        for (int i = 0; i < 5; i++) {
            demo(
                    () -> new LongAdder(),
                    adder -> adder.increment()
            );
        }
    }

    /*
    () -> 结果    提供累加器对象
    (参数) ->     执行累加操作
     */
    private static <T> void demo(Supplier<T> adderSupplier, Consumer<T> action) {
        T adder = adderSupplier.get();
        List<Thread> ts = new ArrayList<>();
        // 4 个线程，每人累加 50 万
        for (int i = 0; i < 4; i++) {
            ts.add(new Thread(() -> {
                for (int j = 0; j < 500000; j++) {
                    action.accept(adder);
                }
            }));
        }
        long start = System.nanoTime();
        ts.forEach(t -> t.start());
        ts.forEach(t -> {
            try {
                t.join();
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        });

        long end = System.nanoTime();
        System.out.println(adder + " cost:" + (end - start) / 1000_000);
    }
}
```

输出

```
1000000 cost:43 
1000000 cost:9 
1000000 cost:7 
1000000 cost:7 
1000000 cost:7 
1000000 cost:31 
1000000 cost:27 
1000000 cost:28 
1000000 cost:24 
1000000 cost:22
```

性能提升的原因很简单，就是在有竞争时，设置多个累加单元，Therad-0 累加 Cell[0]，而 Thread-1 累加Cell[1]... 最后将结果汇总。这样它们在累加时操作的不同的 Cell 变量，因此减少了 CAS 重试失败，从而提高性能。

### 源码之 LongAdder

LongAdder 是并发大师 @author Doug Lea （大哥李）的作品，设计的非常精巧

LongAdder 类有几个关键域：

```java
// 累加单元数组, 懒惰初始化
transient volatile Cell[] cells;
// 基础值, 如果没有竞争, 则用 cas 累加这个域
transient volatile long base;
// 在 cells 创建或扩容时, 置为 1, 表示加锁
transient volatile int cellsBusy;
```

#### cas 锁

测试代码：

```java
public class LockCas {
    // 0 没加锁
    // 1 加锁
    private AtomicInteger state = new AtomicInteger(0);

    public void lock() {
        while (true) {
            if (state.compareAndSet(0, 1)) {
                break;
            }
        }
    }

    public void unlock() {
        log.debug("unlock...");
        state.set(0);
    }

    public static void main(String[] args) {
        LockCas lock = new LockCas();
        new Thread(() -> {
            log.debug("begin...");
            lock.lock();
            try {
                log.debug("lock...");
                sleep(1);
            } finally {
                lock.unlock();
            }
        }).start();

        new Thread(() -> {
            log.debug("begin...");
            lock.lock();
            try {
                log.debug("lock...");
            } finally {
                lock.unlock();
            }
        }).start();
    }
}
```

输出：

```
22:20:01.963 c.Test42 [Thread-0] - begin...
22:20:01.963 c.Test42 [Thread-1] - begin...
22:20:01.966 c.Test42 [Thread-0] - lock...
22:20:02.967 c.Test42 [Thread-0] - unlock...
22:20:02.967 c.Test42 [Thread-1] - lock...
22:20:02.967 c.Test42 [Thread-1] - unlock...
```

#### * 原理之伪共享

其中 Cell 即为累加单元

```java
	// 防止缓存行伪共享
	@sun.misc.Contended 
    static final class Cell {
        volatile long value;
        Cell(long x) { value = x; }
        // 最重要的方法, 用来 cas 方式进行累加, prev 表示旧值, next 表示新值
        final boolean cas(long cmp, long val) {
            return UNSAFE.compareAndSwapLong(this, valueOffset, cmp, val);
        }

       // 省略不重要代码
    }
```

得从缓存说起，缓存与内存的速度比较。

![image-20220818222550288](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220818222550.png)

| **从** **cpu** **到** | **大约需要的时钟周期**           |
| --------------------- | -------------------------------- |
| 寄存器                | 1 cycle (4GHz 的 CPU 约为0.25ns) |
| L1                    | 3~4 cycle                        |
| L2                    | 10~20 cycle                      |
| L3                    | 40~45 cycle                      |
| 内存                  | 120~240 cycle                    |

- 因为 CPU 与 内存的速度差异很大，需要靠预读数据至缓存来提升效率
- 而缓存以**缓存行**为单位，每个缓存行对应着一块内存，一般是 **64 byte**（8 个 long）。64B
- 缓存的加入会造成数据副本的产生，即同一份数据会缓存在不同核心的缓存行中
- CPU 要保证数据的一致性，如果某个 CPU 核心更改了数据，其它 CPU 核心对应的整个缓存行必须失效

![image-20220818223356056](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220818223356.png)

因为 Cell 是数组形式，在内存中是连续存储的，一个 Cell 为 24 字节（16 字节的对象头和 8 字节的 value），因此缓存行可以存下 2 个的 Cell 对象。这样问题来了：

- Core-0 要修改 Cell[0]
- Core-1 要修改 Cell[1]

无论谁修改成功，都会导致对方 Core 的缓存行失效，比如 Core-0 中 Cell[0]=6000, Cell[1]=8000 要累加Cell[0]=6001, Cell[1]=8000 ，这时会让 Core-1 的缓存行失效。

`@sun.misc.Contended` 用来解决这个问题，它的原理是在使用此注解的对象或字段的前后各增加 128 字节大小的padding，从而让 CPU 将对象预读至缓存时占用不同的缓存行，这样，不会造成对方缓存行的失效。

![image-20220818223728405](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220818223728.png)

#### LongAdder源码-add

累加主要调用下面的方法:

```java
    public void add(long x) {
        // as 为累加单元数组
        // b 为基础值
        // x 为累加值
        Cell[] as;
        long b, v;
        int m;
        Cell a;
        // 进入 if 的两个条件
        // 1. as 有值, 表示已经发生过竞争, 进入 if
        // 2. cas 给 base 累加时失败了, 表示 base 发生了竞争, 进入 if
        if ((as = cells) != null || !casBase(b = base, b + x)) {
            // uncontended 表示 cell 没有竞争
            boolean uncontended = true;
            if (
                // as 还没有创建
                    as == null || (m = as.length - 1) < 0 ||
                            // 当前线程对应的 cell 还没有
                            (a = as[getProbe() & m]) == null ||
                            // cas 给当前线程的 cell 累加失败 uncontended=false ( a 为当前线程的 cell )
                            !(uncontended = a.cas(v = a.value, v + x))
            ) {
                // 进入 cell 数组创建、cell 创建的流程
                longAccumulate(x, null, uncontended);
            }
        }
    }
```

add 流程图

![image-20220818230221502](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220818230221.png)

#### LongAdder源码-longAccumulate

```java
    final void longAccumulate(long x, LongBinaryOperator fn,
                              boolean wasUncontended) {
        int h;
        // 当前线程还没有对应的 cell, 需要随机生成一个 h 值用来将当前线程绑定到 cell
        if ((h = getProbe()) == 0) {
            // 初始化 probe
            ThreadLocalRandom.current();
            // h 对应新的 probe 值, 用来对应 cell
            h = getProbe();
            wasUncontended = true;
        }
        // collide 为 true 表示需要扩容
        boolean collide = false;
        for (; ; ) {
            Cell[] as;
            Cell a;
            int n;
            long v;
            // 已经有了 cells
            if ((as = cells) != null && (n = as.length) > 0) {
                // 还没有 cell
                if ((a = as[(n - 1) & h]) == null) {
                    // 为 cellsBusy 加锁, 创建 cell, cell 的初始累加值为 x
                    // 成功则 break, 否则继续 continue 循环
                }
                // 有竞争, 改变线程对应的 cell 来重试 cas
                else if (!wasUncontended)
                    wasUncontended = true;
                    // cas 尝试累加, fn 配合 LongAccumulator 不为 null, 配合 LongAdder 为 null
                else if (a.cas(v = a.value, ((fn == null) ? v + x : fn.applyAsLong(v, x))))
                    break;
                    // 如果 cells 长度已经超过了最大长度, 或者已经扩容, 改变线程对应的 cell 来重试 cas
                else if (n >= NCPU || cells != as)
                    collide = false;
                    // 确保 collide 为 false 进入此分支, 就不会进入下面的 else if 进行扩容了
                else if (!collide)
                    collide = true;
                    // 加锁
                else if (cellsBusy == 0 && casCellsBusy()) {
                    // 加锁成功, 扩容
                    continue;
                }
                // 改变线程对应的 cell
                h = advanceProbe(h);
            }
            // 还没有 cells, 尝试给 cellsBusy 加锁
            else if (cellsBusy == 0 && cells == as && casCellsBusy()) {
                // 加锁成功, 初始化 cells, 最开始长度为 2, 并填充一个 cell
                // 成功则 break;
            }
            // 上两种情况失败, 尝试给 base 累加
            else if (casBase(v = base, ((fn == null) ? v + x : fn.applyAsLong(v, x))))
                break;
        }
    }
```

longAccumulate 流程图

![image-20220818230352527](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220818230352.png)

![image-20220818230403311](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220818230403.png)

每个线程刚进入 longAccumulate 时，会尝试对应一个 cell 对象（找到一个坑位）

![image-20220818230422641](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Concurrent/20220818230422.png)

#### LongAdder源码-sum

获取最终结果通过 sum 方法

```java
    public long sum() {
        Cell[] as = cells;
        Cell a;
        long sum = base;
        if (as != null) {
            for (int i = 0; i < as.length; ++i) {
                if ((a = as[i]) != null)
                    sum += a.value;
            }
        }
        return sum;
    }
```

---

## Unsafe

### Unsafe 对象-获取

Unsafe 对象提供了非常底层的，操作内存、线程的方法，Unsafe 对象不能直接调用，只能通过反射获得

```java
    public class UnsafeAccessor {
        static Unsafe unsafe;
        static {
            try {
                Field theUnsafe = Unsafe.class.getDeclaredField("theUnsafe");
                theUnsafe.setAccessible(true);
                unsafe = (Unsafe) theUnsafe.get(null);
            } catch (NoSuchFieldException | IllegalAccessException e) {
                throw new Error(e);
            }
        }
        static Unsafe getUnsafe() {
            return unsafe;
        }
    }
```

### Unsafe CAS 操作

```java
    @Data
    class Student {
        volatile int id;
        volatile String name;
    }

    Unsafe unsafe = UnsafeAccessor.getUnsafe();
    Field id = Student.class.getDeclaredField("id");
    Field name = Student.class.getDeclaredField("name");
    // 获得成员变量的偏移量
    long idOffset = UnsafeAccessor.unsafe.objectFieldOffset(id);
    long nameOffset = UnsafeAccessor.unsafe.objectFieldOffset(name);
    
    Student student = new Student();
	// 使用 cas 方法替换成员变量的值
	UnsafeAccessor.unsafe.compareAndSwapInt(student,idOffset,0,20); // 返回 true
	UnsafeAccessor.unsafe.compareAndSwapObject(student,nameOffset,null,"张三"); // 返回 true

	System.out.println(student);
```

输出

```
Student(id=20, name=张三)
```

### Unsafe 对象-模拟实现原子整数

使用自定义的 AtomicData 实现之前线程安全的原子整数 Account 实现

```java
    class AtomicData {
        private volatile int data;
        static final Unsafe unsafe;
        static final long DATA_OFFSET;

        static {
            unsafe = UnsafeAccessor.getUnsafe();
            try {
                // data 属性在 DataContainer 对象中的偏移量，用于 Unsafe 直接访问该属性
                DATA_OFFSET = unsafe.objectFieldOffset(AtomicData.class.getDeclaredField("data"));
            } catch (NoSuchFieldException e) {
                throw new Error(e);
            }
        }

        public AtomicData(int data) {
            this.data = data;
        }

        public void decrease(int amount) {
            int oldValue;
            while (true) {
                // 获取共享变量旧值，可以在这一行加入断点，修改 data 调试来加深理解
                oldValue = data;
                // cas 尝试修改 data 为 旧值 + amount，如果期间旧值被别的线程改了，返回 false
                if (unsafe.compareAndSwapInt(this, DATA_OFFSET, oldValue, oldValue - amount)) {
                    return;
                }
            }
        }

        public int getData() {
            return data;
        }
    }
```

Account 实现

```java
    Account.demo(new Account() {
        AtomicData atomicData = new AtomicData(10000);
        @Override
        public Integer getBalance () {
            return atomicData.getData();
        }
        @Override
        public void withdraw (Integer amount){
            atomicData.decrease(amount);
        }
    });
```

