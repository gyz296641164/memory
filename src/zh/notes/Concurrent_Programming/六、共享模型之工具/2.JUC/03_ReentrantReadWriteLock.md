---
title: 03_ReentrantReadWriteLock
category:
  - 并发编程
date: 2023-03-01
---

<!-- more -->

## 一、ReentrantReadWriteLock基本应用

当读操作远远高于写操作时，这时候使用 `读写锁` 让 `读-读` 可以并发，提高性能。 类似于数据库中的 `select ...`
`from ... lock in share mode`

### 1.1 读写锁阻塞测试

> 提供一个 `数据容器类` 内部分别使用读锁保护数据的 `read()` 方法，写锁保护数据的 `write()` 方法

```java
@Slf4j
class DataContainer {
    private Object data;
    private ReentrantReadWriteLock rw = new ReentrantReadWriteLock();
    private ReentrantReadWriteLock.ReadLock r = rw.readLock();
    private ReentrantReadWriteLock.WriteLock w = rw.writeLock();

    public Object read() {
        log.debug("获取读锁...");
        r.lock();
        try {
            log.debug("读取");
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            return data;
        } finally {
            log.debug("释放读锁...");
            r.unlock();
        }
    }

    public void write() {
        log.debug("获取写锁...");
        w.lock();
        try {
            log.debug("写入");
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        } finally {
            log.debug("释放写锁...");
            w.unlock();
        }
    }
}
```

> 测试 `读锁-读锁`可以并发

```java
public static void main(String[] args) {
    DataContainer dataContainer = new DataContainer();
    new Thread(() -> {
        dataContainer.read();
    }, "t1").start();
    new Thread(() -> {
        dataContainer.read();
    }, "t2").start();
}
```

输出结果，从这里可以看到 Thread-0 锁定期间，Thread-1 的读操作不受影响

```
13:24:42.865 [t1] DEBUG com.gyz.interview.concurrent.reentrantreadwritelock.DataContainer - 获取读锁...
13:24:42.865 [t2] DEBUG com.gyz.interview.concurrent.reentrantreadwritelock.DataContainer - 获取读锁...
13:24:42.868 [t1] DEBUG com.gyz.interview.concurrent.reentrantreadwritelock.DataContainer - 读取
13:24:42.868 [t2] DEBUG com.gyz.interview.concurrent.reentrantreadwritelock.DataContainer - 读取
13:24:43.874 [t1] DEBUG com.gyz.interview.concurrent.reentrantreadwritelock.DataContainer - 释放读锁...
13:24:43.874 [t2] DEBUG com.gyz.interview.concurrent.reentrantreadwritelock.DataContainer - 释放读锁...
```

> 测试**读锁-写锁**相互阻塞

```java
public static void main(String[] args) {
    DataContainer dataContainer = new DataContainer();
    new Thread(() -> {
        dataContainer.read();
    }, "t1").start();
    try {
        Thread.sleep(100);
    } catch (InterruptedException e) {
        e.printStackTrace();
    }
    new Thread(() -> {
        dataContainer.write();
    }, "t2").start();
}
```

输出结果

```
13:27:02.941 [t1] DEBUG com.gyz.interview.concurrent.reentrantreadwritelock.DataContainer - 获取读锁...
13:27:02.945 [t1] DEBUG com.gyz.interview.concurrent.reentrantreadwritelock.DataContainer - 读取
13:27:03.058 [t2] DEBUG com.gyz.interview.concurrent.reentrantreadwritelock.DataContainer - 获取写锁...
13:27:03.961 [t1] DEBUG com.gyz.interview.concurrent.reentrantreadwritelock.DataContainer - 释放读锁...
13:27:03.961 [t2] DEBUG com.gyz.interview.concurrent.reentrantreadwritelock.DataContainer - 写入
13:27:04.976 [t2] DEBUG com.gyz.interview.concurrent.reentrantreadwritelock.DataContainer - 释放写锁...
```

> **`写锁-写锁`** 也是相互阻塞的，这里就不测试了

### 1.2 注意事项

读锁不支持条件变量，只有写锁支持条件变量，读锁是不支持条件变量的，读锁调用newCondition()会抛出UnsupportedOperationException的异常

重入时升级不支持：即持有读锁的情况下去获取写锁，会导致获取写锁永久等待

```java
r.lock();
try {
    // ...
    w.lock();
    try {
        // ...
    } finally {
        w.unlock();
    }
} finally {
    r.unlock();
}
```

重入时降级支持：即持有写锁的情况下去获取读锁

```java
public class CachedData {
    Object data;
    // 是否有效，如果失效，需要重新计算 data
    volatile boolean cacheValid;
    final ReentrantReadWriteLock rwl = new ReentrantReadWriteLock();

    void processCachedData() {
        rwl.readLock().lock();
        if (!cacheValid) {
            // 获取写锁前必须释放读锁
            rwl.readLock().unlock();
            rwl.writeLock().lock();
            try {
                // 判断是否有其它线程已经获取了写锁、更新了缓存, 避免重复更新
                if (!cacheValid) {
                    data = ...
                    cacheValid = true;
                }
                // 降级为读锁, 释放写锁, 这样能够让其它线程读取缓存
                rwl.readLock().lock();
            } finally {

                rwl.writeLock().unlock();
            }
        }
        // 自己用完数据, 释放读锁
        try {
            use(data);
        } finally {
            rwl.readLock().unlock();
        }
    }
}
```

---

## 二、应用之缓存

### 2.1 缓存更新策略

更新时，是先清缓存还是先更新数据库？

> **先清缓存**

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202402/7e20df48ccc08d43.png)

> **先更新数据库**

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202402/1f44164397ee9cff.png)

补充一种情况，假设查询线程 A 查询数据时恰好缓存数据由于时间到期失效，或是第一次查询

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202402/64ad264063084022.png)

这种情况的出现几率非常小，见 facebook 论文。

### 2.2 读写锁实现一致性缓存

使用读写锁实现一个简单的按需加载缓存

```java
class GenericCachedDao<T> {
    // HashMap 作为缓存非线程安全, 需要保护
    HashMap<SqlPair, T> map = new HashMap<>();

    ReentrantReadWriteLock lock = new ReentrantReadWriteLock();
    GenericDao genericDao = new GenericDao();

    public int update(String sql, Object... params) {
        SqlPair key = new SqlPair(sql, params);
        // 加写锁, 防止其它线程对缓存读取和更改
        lock.writeLock().lock();
        try {
            int rows = genericDao.update(sql, params);
            map.clear();
            return rows;
        } finally {
            lock.writeLock().unlock();
        }
    }

    public T queryOne(Class<T> beanClass, String sql, Object... params) {
        SqlPair key = new SqlPair(sql, params);
        // 加读锁, 防止其它线程对缓存更改
        lock.readLock().lock();
        try {
            T value = map.get(key);
            if (value != null) {
                return value;
            }
        } finally {
            lock.readLock().unlock();
        }
        // 加写锁, 防止其它线程对缓存读取和更改
        lock.writeLock().lock();
        try {
            // get 方法上面部分是可能多个线程进来的, 可能已经向缓存填充了数据
            // 为防止重复查询数据库, 再次验证
            T value = map.get(key);
            if (value == null) {
                // 如果没有, 查询数据库
                value = genericDao.queryOne(beanClass, sql, params);
                map.put(key, value);
            }
            return value;
        } finally {
            lock.writeLock().unlock();
        }
    }

    // 作为 key 保证其是不可变的
    class SqlPair {
        private String sql;
        private Object[] params;

        public SqlPair(String sql, Object[] params) {
            this.sql = sql;
            this.params = params;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) {
                return true;
            }
            if (o == null || getClass() != o.getClass()) {
                return false;
            }
            SqlPair sqlPair = (SqlPair) o;
            return sql.equals(sqlPair.sql) &&
                    Arrays.equals(params, sqlPair.params);
        }

        @Override
        public int hashCode() {
            int result = Objects.hash(sql);
            result = 31 * result + Arrays.hashCode(params);
            return result;
        }
    }
}
```

```java
package com.gyz.interview.concurrent.reentrantreadwritelock;

import java.beans.BeanInfo;
import java.beans.IntrospectionException;
import java.beans.Introspector;
import java.beans.PropertyDescriptor;
import java.lang.reflect.InvocationTargetException;
import java.sql.*;
import java.util.*;

public class GenericDao {
    static String URL = "jdbc:mysql://localhost:3306/test";
    static String USERNAME = "root";
    static String PASSWORD = "root";

    public <T> List<T> queryList(Class<T> beanClass, String sql, Object... args) {
        System.out.println("sql: [" + sql + "] params:" + Arrays.toString(args));
        BeanRowMapper<T> mapper = new BeanRowMapper<>(beanClass);
        return queryList(sql, mapper, args);
    }

    public <T> T queryOne(Class<T> beanClass, String sql, Object... args) {
        System.out.println("sql: [" + sql + "] params:" + Arrays.toString(args));
        BeanRowMapper<T> mapper = new BeanRowMapper<>(beanClass);
        return queryOne(sql, mapper, args);
    }

    private <T> List<T> queryList(String sql, RowMapper<T> mapper, Object... args) {
        try (Connection conn = DriverManager.getConnection(URL, USERNAME, PASSWORD)) {
            try (PreparedStatement psmt = conn.prepareStatement(sql)) {
                if (args != null) {
                    for (int i = 0; i < args.length; i++) {
                        psmt.setObject(i + 1, args[i]);
                    }
                }
                List<T> list = new ArrayList<>();
                try (ResultSet rs = psmt.executeQuery()) {
                    while (rs.next()) {
                        T obj = mapper.map(rs);
                        list.add(obj);
                    }
                }
                return list;
            }
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }

    private <T> T queryOne(String sql, RowMapper<T> mapper, Object... args) {
        List<T> list = queryList(sql, mapper, args);
        return list.size() == 0 ? null : list.get(0);
    }

    public int update(String sql, Object... args) {
        System.out.println("sql: [" + sql + "] params:" + Arrays.toString(args));
        try (Connection conn = DriverManager.getConnection(URL, USERNAME, PASSWORD)) {
            try (PreparedStatement psmt = conn.prepareStatement(sql)) {
                if (args != null) {
                    for (int i = 0; i < args.length; i++) {
                        psmt.setObject(i + 1, args[i]);
                    }
                }
                return psmt.executeUpdate();
            }
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }

    interface RowMapper<T> {
        T map(ResultSet rs);
    }

    static class BeanRowMapper<T> implements RowMapper<T> {

        private Class<T> beanClass;
        private Map<String, PropertyDescriptor> propertyMap = new HashMap<>();

        public BeanRowMapper(Class<T> beanClass) {
            this.beanClass = beanClass;
            try {
                BeanInfo beanInfo = Introspector.getBeanInfo(beanClass);
                PropertyDescriptor[] propertyDescriptors = beanInfo.getPropertyDescriptors();
                for (PropertyDescriptor pd : propertyDescriptors) {
                    propertyMap.put(pd.getName().toLowerCase(), pd);
                }
            } catch (IntrospectionException e) {
                throw new RuntimeException(e);
            }
        }

        @Override
        public T map(ResultSet rs) {
            try {
                ResultSetMetaData metaData = rs.getMetaData();
                int columnCount = metaData.getColumnCount();
                T t = beanClass.newInstance();
                for (int i = 1; i <= columnCount; i++) {
                    String columnLabel = metaData.getColumnLabel(i);
                    PropertyDescriptor pd = propertyMap.get(columnLabel.toLowerCase());
                    if (pd != null) {
                        pd.getWriteMethod().invoke(t, rs.getObject(i));
                    }
                }
                return t;
            } catch (SQLException | InstantiationException | IllegalAccessException | InvocationTargetException e) {
                throw new RuntimeException(e);
            }
        }
    }
}
```

**注意**

以上实现体现的是读写锁的应用，保证缓存和数据库的一致性，但有下面的问题没有考虑：

- 适合读多写少，如果写操作比较频繁，以上实现性能低
- 没有考虑缓存容量
- 没有考虑缓存过期
- 只适合单机
- 并发性还是低，目前只会用一把锁
- 更新方法太过简单粗暴，清空了所有 key（考虑按类型分区或重新设计 key）

乐观锁实现：用 CAS 去更新

---

## 三、ReentrantReadWriteLock原理

### 3.1 图解流程

读写锁用的是同一个 Sycn 同步器，因此等待队列、state 等也是同一个

**t1** **w.lock**，**t2** **r.lock**（t1写锁，t2读锁）

（1）t1 成功上锁，流程与 ReentrantLock 加锁相比没有特殊之处，不同是写锁状态占了 state 的低 16 位，而读锁
使用的是 state 的高 16 位

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202402/ce10f34ebe3f9ab3.png)

（2）t2 执行 r.lock，这时进入读锁的 sync.acquireShared(1) 流程，首先会进入 tryAcquireShared 流程。如果有写
锁占据，那么 tryAcquireShared 返回 -1 表示失败

> tryAcquireShared 返回值表示：
>
> - -1 表示失败
> - 0 表示成功，但后继节点不会继续唤醒
> - 正数表示成功，而且数值是还有几个后继节点需要唤醒，读写锁返回 1

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202402/8f9a9600b7439d80.png)

（3）这时会进入 sync.doAcquireShared(1) 流程，首先也是调用 addWaiter 添加节点，不同之处在于节点被设置为
Node.SHARED 模式而非 Node.EXCLUSIVE 模式，注意此时 t2 仍处于活跃状态

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202402/37c58272a83e1170.png)

（4）t2 会看看自己的节点是不是老二，如果是，还会再次调用 tryAcquireShared(1) 来尝试获取锁

（5）如果没有成功，在 doAcquireShared 内 for (;;) 循环一次，把前驱节点的 waitStatus 改为 -1，再 for (;;) 循环一
次尝试 tryAcquireShared(1) 如果还不成功，那么在 parkAndCheckInterrupt() 处 park

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202402/c8ed4c7ad0d08061.png)

**t3 r.lock**，**t4 w.lock**（t3读锁，t4写锁）

这种状态下，假设又有 t3 加读锁和 t4 加写锁，这期间 t1 仍然持有锁，就变成了下面的样子

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202402/4d9c78ad3a87d86c.png)

**t1 w.unlock**

这时会走到写锁的 sync.release(1) 流程，调用 sync.tryRelease(1) 成功，变成下面的样子

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202402/b60d49a29c5a43bc.png)

接下来执行唤醒流程 sync.unparkSuccessor，即让老二恢复运行，这时 t2 在 doAcquireShared 内
parkAndCheckInterrupt() 处恢复运行

这回再来一次 for (;;) 执行 tryAcquireShared 成功则让读锁计数加一

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202402/6bde1c32f7d554a2.png)

这时 t2 已经恢复运行，接下来 t2 调用 setHeadAndPropagate(node, 1)，它原本所在节点被置为头节点

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202402/b7aa3ff2bba77af1.png)

事情还没完，在 setHeadAndPropagate 方法内还会检查下一个节点是否是 shared，如果是则调用
`doReleaseShared()` 将 head 的状态从 -1 改为 0 并唤醒老二，这时 t3 在 doAcquireShared 内
`parkAndCheckInterrupt()` 处恢复运行

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202402/729d86dda1f678ad.png)

这回再来一次 for (;;) 执行 tryAcquireShared 成功则让读锁计数加一

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202402/19c7553dcef1ea8c.png)

这时 t3 已经恢复运行，接下来 t3 调用 setHeadAndPropagate(node, 1)，它原本所在节点被置为头节点

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202402/be1eda7ac0b707fc.png)

下一个节点不是 shared 了，因此不会继续唤醒 t4 所在节点

**t2 r.unlock**，**t3 r.unlock**

t2 进入 sync.releaseShared(1) 中，调用 tryReleaseShared(1) 让计数减一，但由于计数还不为零

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202402/26576760f57b606b.png)

t3 进入 `sync.releaseShared(1)` 中，调用 `tryReleaseShared(1)` 让计数减一，这回计数为零了，进入
`doReleaseShared()` 将头节点从 -1 改为 0 并唤醒老二，即

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202402/d0f5282d8f7b4fea.png)

之后 t4 在 acquireQueued 中 parkAndCheckInterrupt 处恢复运行，再次 for (;;) 这次自己是老二，并且没有其他
竞争，tryAcquire(1) 成功，修改头结点，流程结束

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202402/733a953208e52ffe.png)

### 3.2 源码分析

#### 3.2.1 写锁上锁流程

```java
static final class NonfairSync extends Sync {
    // ... 省略无关代码

    // 外部类 WriteLock 方法, 方便阅读, 放在此处
    public void lock() {
        sync.acquire(1);
    }

    // AQS 继承过来的方法, 方便阅读, 放在此处
    public final void acquire(int arg) {
        if (
            // 尝试获得写锁失败
                !tryAcquire(arg) &&
                        // 将当前线程关联到一个 Node 对象上, 模式为独占模式
                        // 进入 AQS 队列阻塞
                        acquireQueued(addWaiter(Node.EXCLUSIVE), arg)
        ) {
            selfInterrupt();
        }
    }

    // Sync 继承过来的方法, 方便阅读, 放在此处
    protected final boolean tryAcquire(int acquires) {
        // 获得低 16 位, 代表写锁的 state 计数
        Thread current = Thread.currentThread();
        int c = getState();
        int w = exclusiveCount(c);

        if (c != 0) {
            if (
                // c != 0 and w == 0 表示有读锁, 或者
                    w == 0 ||
                            // 如果 exclusiveOwnerThread 不是自己
                            current != getExclusiveOwnerThread()
            ) {
                // 获得锁失败
                return false;
            }
            // 写锁计数超过低 16 位, 报异常
            if (w + exclusiveCount(acquires) > MAX_COUNT)
                throw new Error("Maximum lock count exceeded");
            // 写锁重入, 获得锁成功
            setState(c + acquires);
            return true;
        }
        if (
            // 判断写锁是否该阻塞, 或者
                writerShouldBlock() ||
                        // 尝试更改计数失败
                        !compareAndSetState(c, c + acquires)
        ) {
            // 获得锁失败
            return false;
        }
        // 获得锁成功
        setExclusiveOwnerThread(current);
        return true;
    }

    // 非公平锁 writerShouldBlock 总是返回 false, 无需阻塞
    final boolean writerShouldBlock() {
        return false;
    }
}
```

#### 3.2.2 写锁释放流程

```
static final class NonfairSync extends Sync {
    // ... 省略无关代码

    // WriteLock 方法, 方便阅读, 放在此处
    public void unlock() {
        sync.release(1);
    }

    // AQS 继承过来的方法, 方便阅读, 放在此处
    public final boolean release(int arg) {
        // 尝试释放写锁成功
        if (tryRelease(arg)) {
            // unpark AQS 中等待的线程
            Node h = head;
            if (h != null && h.waitStatus != 0)
                unparkSuccessor(h);
            return true;
        }
        return false;
    }

    // Sync 继承过来的方法, 方便阅读, 放在此处
    protected final boolean tryRelease(int releases) {
        if (!isHeldExclusively())
            throw new IllegalMonitorStateException();
        int nextc = getState() - releases;
        // 因为可重入的原因, 写锁计数为 0, 才算释放成功
        boolean free = exclusiveCount(nextc) == 0;
        if (free) {
            setExclusiveOwnerThread(null);
        }
        setState(nextc);
        return free;
    }
}
```

#### 3.2.3 读锁上锁流程

```java
static final class NonfairSync extends Sync {

    // ReadLock 方法, 方便阅读, 放在此处
    public void lock() {
        sync.acquireShared(1);
    }

    // AQS 继承过来的方法, 方便阅读, 放在此处
    public final void acquireShared(int arg) {
        // tryAcquireShared 返回负数, 表示获取读锁失败
        if (tryAcquireShared(arg) < 0) {
            doAcquireShared(arg);
        }
    }

    // Sync 继承过来的方法, 方便阅读, 放在此处
    protected final int tryAcquireShared(int unused) {
        Thread current = Thread.currentThread();
        int c = getState();
        // 如果是其它线程持有写锁, 获取读锁失败
        if (
                exclusiveCount(c) != 0 &&
                        getExclusiveOwnerThread() != current
        ) {
            return -1;
        }
        int r = sharedCount(c);
        if (
            // 读锁不该阻塞(如果老二是写锁，读锁该阻塞), 并且
                !readerShouldBlock() &&
                        // 小于读锁计数, 并且
                        r < MAX_COUNT &&
                        // 尝试增加计数成功
                        compareAndSetState(c, c + SHARED_UNIT)
        ) {
            // ... 省略不重要的代码
            return 1;
        }
        return fullTryAcquireShared(current);
    }

    // 非公平锁 readerShouldBlock 看 AQS 队列中第一个节点是否是写锁
    // true 则该阻塞, false 则不阻塞
    final boolean readerShouldBlock() {
        return apparentlyFirstQueuedIsExclusive();
    }

    // AQS 继承过来的方法, 方便阅读, 放在此处
    // 与 tryAcquireShared 功能类似, 但会不断尝试 for (;;) 获取读锁, 执行过程中无阻塞
    final int fullTryAcquireShared(Thread current) {
        HoldCounter rh = null;
        for (; ; ) {
            int c = getState();
            if (exclusiveCount(c) != 0) {
                if (getExclusiveOwnerThread() != current)
                    return -1;
            } else if (readerShouldBlock()) {
                // ... 省略不重要的代码
            }
            if (sharedCount(c) == MAX_COUNT)
                throw new Error("Maximum lock count exceeded");
            if (compareAndSetState(c, c + SHARED_UNIT)) {
                // ... 省略不重要的代码
                return 1;
            }
        }
    }

    // AQS 继承过来的方法, 方便阅读, 放在此处
    private void doAcquireShared(int arg) {
        // 将当前线程关联到一个 Node 对象上, 模式为共享模式
        final Node node = addWaiter(Node.SHARED);
        boolean failed = true;
        try {
            boolean interrupted = false;
            for (; ; ) {
                final Node p = node.predecessor();
                if (p == head) {
                    // 再一次尝试获取读锁
                    int r = tryAcquireShared(arg);
                    // 成功
                    if (r >= 0) {
                        // ㈠
                        // r 表示可用资源数, 在这里总是 1 允许传播
                        //（唤醒 AQS 中下一个 Share 节点）
                        setHeadAndPropagate(node, r);
                        p.next = null; // help GC
                        if (interrupted)
                            selfInterrupt();
                        failed = false;
                        return;
                    }
                }
                if (
                    // 是否在获取读锁失败时阻塞（前一个阶段 waitStatus == Node.SIGNAL）
                        shouldParkAfterFailedAcquire(p, node) &&
                                // park 当前线程
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

    // ㈠ AQS 继承过来的方法, 方便阅读, 放在此处
    private void setHeadAndPropagate(Node node, int propagate) {
        Node h = head; // Record old head for check below
        // 设置自己为 head
        setHead(node);

        // propagate 表示有共享资源（例如共享读锁或信号量）
        // 原 head waitStatus == Node.SIGNAL 或 Node.PROPAGATE
        // 现在 head waitStatus == Node.SIGNAL 或 Node.PROPAGATE
        if (propagate > 0 || h == null || h.waitStatus < 0 ||
                (h = head) == null || h.waitStatus < 0) {
            Node s = node.next;
            // 如果是最后一个节点或者是等待共享读锁的节点
            if (s == null || s.isShared()) {
                // 进入 ㈡
                doReleaseShared();
            }
        }
    }

    // ㈡ AQS 继承过来的方法, 方便阅读, 放在此处
    private void doReleaseShared() {
        // 如果 head.waitStatus == Node.SIGNAL ==> 0 成功, 下一个节点 unpark
        // 如果 head.waitStatus == 0 ==> Node.PROPAGATE, 为了解决 bug, 见后面分析
        for (; ; ) {
            Node h = head;
            // 队列还有节点
            if (h != null && h != tail) {
                int ws = h.waitStatus;
                if (ws == Node.SIGNAL) {
                    if (!compareAndSetWaitStatus(h, Node.SIGNAL, 0))
                        continue; // loop to recheck cases
                    // 下一个节点 unpark 如果成功获取读锁
                    // 并且下下个节点还是 shared, 继续 doReleaseShared
                    unparkSuccessor(h);
                } else if (ws == 0 &&
                        !compareAndSetWaitStatus(h, 0, Node.PROPAGATE))
                    continue; // loop on failed CAS
            }
            if (h == head) // loop if head changed
                break;
        }
    }
}
```

#### 3.2. 读锁释放流程

```java
static final class NonfairSync extends Sync {

    // ReadLock 方法, 方便阅读, 放在此处
    public void unlock() {
        sync.releaseShared(1);
    }

    // AQS 继承过来的方法, 方便阅读, 放在此处
    public final boolean releaseShared(int arg) {
        if (tryReleaseShared(arg)) {
            doReleaseShared();
            return true;
        }
        return false;
    }

    // Sync 继承过来的方法, 方便阅读, 放在此处
    protected final boolean tryReleaseShared(int unused) {
        // ... 省略不重要的代码
        for (; ; ) {
            int c = getState();
            int nextc = c - SHARED_UNIT;
            if (compareAndSetState(c, nextc)) {
                // 读锁的计数不会影响其它获取读锁线程, 但会影响其它获取写锁线程
                // 计数为 0 才是真正释放
                return nextc == 0;
            }
        }
    }

    // AQS 继承过来的方法, 方便阅读, 放在此处
    private void doReleaseShared() {
        // 如果 head.waitStatus == Node.SIGNAL ==> 0 成功, 下一个节点 unpark
        // 如果 head.waitStatus == 0 ==> Node.PROPAGATE 
        for (; ; ) {
            Node h = head;
            if (h != null && h != tail) {
                int ws = h.waitStatus;
                // 如果有其它线程也在释放读锁，那么需要将 waitStatus 先改为 0
                // 防止 unparkSuccessor 被多次执行
                if (ws == Node.SIGNAL) {
                    if (!compareAndSetWaitStatus(h, Node.SIGNAL, 0))
                        continue; // loop to recheck cases
                    unparkSuccessor(h);
                }
                // 如果已经是 0 了，改为 -3，用来解决传播性，见后文信号量 bug 分析
                else if (ws == 0 &&
                        !compareAndSetWaitStatus(h, 0, Node.PROPAGATE))
                    continue; // loop on failed CAS
            }
            if (h == head) // loop if head changed
                break;
        }
    }
}
```