---
title: 共享模型之不可变
category:
  - 并发编程
date: 2023-03-01
---

<!-- more -->

# 共享模型之不可变

## 日期转换的问题

### 问题提出

下面的代码在运行时，由于 SimpleDateFormat 不是线程安全的：

```java
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
        for (int i = 0; i < 10; i++) {
            new Thread(() -> {
                try {
                    log.debug("{}", sdf.parse("1951-04-21"));
                } catch (Exception e) {
                    log.error("{}", e);
                }
            }).start();
        }
```

有很大几率出现 java.lang.NumberFormatException 或者出现不正确的日期解析结果，例如：

```
19:10:40.859 [Thread-2] c.TestDateParse - {} 
java.lang.NumberFormatException: For input string: "" 
 at java.lang.NumberFormatException.forInputString(NumberFormatException.java:65) 
 at java.lang.Long.parseLong(Long.java:601) 
 at java.lang.Long.parseLong(Long.java:631) 
 at java.text.DigitList.getLong(DigitList.java:195) 
 at java.text.DecimalFormat.parse(DecimalFormat.java:2084) 
 at java.text.SimpleDateFormat.subParse(SimpleDateFormat.java:2162) 
 at java.text.SimpleDateFormat.parse(SimpleDateFormat.java:1514) 
 at java.text.DateFormat.parse(DateFormat.java:364) 
 at cn.itcast.n7.TestDateParse.lambda$test1$0(TestDateParse.java:18) 
 at java.lang.Thread.run(Thread.java:748) 
19:10:40.859 [Thread-1] c.TestDateParse - {} 
java.lang.NumberFormatException: empty String 
 at sun.misc.FloatingDecimal.readJavaFormatString(FloatingDecimal.java:1842) 
 at sun.misc.FloatingDecimal.parseDouble(FloatingDecimal.java:110) 
 at java.lang.Double.parseDouble(Double.java:538) 
 at java.text.DigitList.getDouble(DigitList.java:169) 
 at java.text.DecimalFormat.parse(DecimalFormat.java:2089) 
 at java.text.SimpleDateFormat.subParse(SimpleDateFormat.java:2162) 
 at java.text.SimpleDateFormat.parse(SimpleDateFormat.java:1514) 
 at java.text.DateFormat.parse(DateFormat.java:364) 
 at cn.itcast.n7.TestDateParse.lambda$test1$0(TestDateParse.java:18) 
 at java.lang.Thread.run(Thread.java:748) 
19:10:40.857 [Thread-8] c.TestDateParse - Sat Apr 21 00:00:00 CST 1951 
19:10:40.857 [Thread-9] c.TestDateParse - Sat Apr 21 00:00:00 CST 1951 
19:10:40.857 [Thread-6] c.TestDateParse - Sat Apr 21 00:00:00 CST 1951 
19:10:40.857 [Thread-4] c.TestDateParse - Sat Apr 21 00:00:00 CST 1951 
19:10:40.857 [Thread-5] c.TestDateParse - Mon Apr 21 00:00:00 CST 178960645 
19:10:40.857 [Thread-0] c.TestDateParse - Sat Apr 21 00:00:00 CST 1951 
19:10:40.857 [Thread-7] c.TestDateParse - Sat Apr 21 00:00:00 CST 1951 
19:10:40.857 [Thread-3] c.TestDateParse - Sat Apr 21 00:00:00 CST 1951
```

### 思路 - 同步锁

这样虽能解决问题，但带来的是性能上的损失，并不算很好：

```java
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
        for (int i = 0; i < 10; i++) {
            new Thread(() -> {
                synchronized (sdf) {
                    try {
                        log.debug("{}", sdf.parse("1951-04-21"));
                    } catch (Exception e) {
                        log.error("{}", e);
                    }
                }
            }).start();
        }
```

### 思路 - 不可变

如果一个对象在不能够修改其内部状态（属性），那么它就是线程安全的，因为不存在并发修改啊！这样的对象在Java 中有很多，例如在 Java 8 后，提供了一个新的日期格式化类：

```java
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        for (int i = 0; i < 10; i++) {
            new Thread(() -> {
                LocalDate date = dtf.parse("2018-10-01", LocalDate::from);
                log.debug("{}", date);
            }).start();
        }
```

可以看 DateTimeFormatter 的文档：

```
@implSpec
This class is immutable and thread-safe.
```

不可变对象，实际是另一种避免竞争的方式。

---

## 不可变设计

> 1. 更多不可变类的知识，可参考这[这里](https://gitee.com/link?target=https%3A%2F%2Fwww.cnblogs.com%2Fdolphin0520%2Fp%2F10693891.html)
> 2. final类的知识，参考[这里](https://gitee.com/link?target=https%3A%2F%2Fwww.cnblogs.com%2Fxiaoxi%2Fp%2F6392154.html)

另一个大家更为熟悉的 String 类也是不可变的，以它为例，说明一下不可变设计的要素

```java
public final class String
    implements java.io.Serializable, Comparable<String>, CharSequence {
    /** The value is used for character storage. */
    private final char value[];
    /** Cache the hash code for the string */
    private int hash; // Default to 0
    // ...
}
```

### final 的使用

发现该类、类中所有属性都是 final 的

- 属性用 fifinal 修饰保证了该属性是只读的，不能修改
- 类用 fifinal 修饰保证了该类中的方法不能被覆盖，防止子类无意间破坏不可变性

### 保护性拷贝

但有同学会说，使用字符串时，也有一些跟修改相关的方法啊，比如 substring 等，那么下面就看一看这些方法是如何实现的，就以 substring 为例：

```java
    public String substring(int beginIndex) {
        if (beginIndex < 0) {
            throw new StringIndexOutOfBoundsException(beginIndex);
        }
        int subLen = value.length - beginIndex;
        if (subLen < 0) {
            throw new StringIndexOutOfBoundsException(subLen);
        }
        return (beginIndex == 0) ? this : new String(value, beginIndex, subLen);
    }
```

发现其内部是调用 String 的构造方法创建了一个新字符串，再进入这个构造看看，是否对 fifinal char[] value 做出了修改：

```java
    public String(char value[], int offset, int count) {
        if (offset < 0) {
            throw new StringIndexOutOfBoundsException(offset);
        }
        if (count <= 0) {
            if (count < 0) {
                throw new StringIndexOutOfBoundsException(count);
            }
            if (offset <= value.length) {
                this.value = "".value;
                return;
            }
        }
        // Note: offset or count might be near -1>>>1.
        if (offset > value.length - count) {
            throw new StringIndexOutOfBoundsException(offset + count);
        }
        this.value = Arrays.copyOfRange(value, offset, offset+count);
    }
```

结果发现也没有，构造新字符串对象时，会生成新的 char[] value，对内容进行复制 。这种通过创建副本对象来避	免共享的手段称之为【保护性拷贝（defensive copy）】

### 模式之享元

#### 简介

**定义** 英文名称：Flyweight pattern. 当需要重用数量有限的同一类对象时。

> wikipedia： A flflyweight is an object that minimizes memory usage by sharing as much data as
>
> possible with other similar objects

#### 体现

> 包装类

在JDK中 Boolean，Byte，Short，Integer，Long，Character 等包装类提供了 valueOf 方法，例如 Long 的valueOf 会缓存 -128~127 之间的 Long 对象，在这个范围之间会重用对象，大于这个范围，才会新建 Long 对象：

```java
public static Long valueOf(long l) {
 final int offset = 128;
 if (l >= -128 && l <= 127) { // will cache
	 return LongCache.cache[(int)l + offset];
 }
 	 return new Long(l);
}
```

注意：

- Byte, Short, Long 缓存的范围都是 -128~127
- Character 缓存的范围是 0~127
- Integer的默认范围是 -128~127
  - 最小值不能变
  - 但最大值可以通过调整虚拟机参数 `-Djava.lang.Integer.IntegerCache.high` 来改变
- Boolean 缓存了 TRUE 和 FALSE

>  **String 串池**
>
>  **BigDecimal BigInteger**

> **DIY**

例如：一个线上商城应用，QPS 达到数千，如果每次都重新创建和关闭数据库连接，性能会受到极大影响。 这时预先创建好一批连接，放入连接池。一次请求到达后，从连接池获取连接，使用完毕后再还回连接池，这样既节约了连接的创建和关闭时间，也实现了连接的重用，不至于让庞大的连接数压垮数据库。

```java
class Pool {
    // 1. 连接池大小
    private final int poolSize;

    // 2. 连接对象数组
    private Connection[] connections;

    // 3. 连接状态数组 0 表示空闲， 1 表示繁忙
    private AtomicIntegerArray states;

    // 4. 构造方法初始化
    public Pool(int poolSize) {
        this.poolSize = poolSize;
        this.connections = new Connection[poolSize];
        this.states = new AtomicIntegerArray(new int[poolSize]);
        for (int i = 0; i < poolSize; i++) {
            connections[i] = new MockConnection("连接" + (i+1));
        }
    }

    // 5. 借连接
    public Connection borrow() {
        while(true) {
            for (int i = 0; i < poolSize; i++) {
                // 获取空闲连接
                if(states.get(i) == 0) {
                    if (states.compareAndSet(i, 0, 1)) {
                        log.debug("borrow {}", connections[i]);
                        return connections[i];
                    }
                }
            }
            // 如果没有空闲连接，当前线程进入等待
            synchronized (this) {
                try {
                    log.debug("wait...");
                    this.wait();
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        }
    }

    // 6. 归还连接
    public void free(Connection conn) {
        for (int i = 0; i < poolSize; i++) {
            if (connections[i] == conn) {
                states.set(i, 0);
                synchronized (this) {
                    log.debug("free {}", conn);
                    this.notifyAll();
                }
                break;
            }
        }
    }
}

class MockConnection implements Connection {
	//实现方法即可。此处略
}
```

使用连接池：

```java
    public static void main(String[] args) {
        Pool pool = new Pool(2);
        for (int i = 0; i < 5; i++) {
            new Thread(() -> {
                Connection conn = pool.borrow();
                try {
                    Thread.sleep(new Random().nextInt(1000));
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
                pool.free(conn);
            }).start();
        }
    }
```

以上实现没有考虑：

- 连接的动态增长与收缩
- 连接保活（可用性检测）
- 等待超时处理
- 分布式 hash

对于关系型数据库，有比较成熟的连接池实现，例如c3p0, druid等 对于更通用的对象池，可以考虑使用apache commons pool，例如redis连接池可以参考jedis中关于连接池的实现。

### final的原理

**设置 final 变量的原理**

理解了 volatile 原理，再对比 final 的实现就比较简单了

```java
public class TestFinal {final int a=20;}
```

字节码

```
0: aload_0
1: invokespecial #1 // Method java/lang/Object."<init>":()V
4: aload_0
5: bipush 20
7: putfield #2 // Field a:I
 <-- 写屏障
10: return
```

final变量的赋值操作都必须在定义时或者构造器中进行初始化赋值，并发现 final 变量的赋值也会通过 putfield 指令来完成，同样在这条指令之后也会加入**写屏障**，保证在其它线程读到它的值时不会出现为 0 的情况。

**获取 final 变量的原理**

原理见：[文章](https://article.itxueyuan.com/ajJPX)
