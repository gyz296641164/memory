---
title: ✅P161_缓存-分布式锁-Redisson-lock看门狗原理-redisson如何解决死锁
category:
  - 谷粒商城
date: 2024-02-13
---

<!-- more -->

## 手动设置锁过期时间

**自动解锁时间一定要大于业务时间**

测试：设置lock锁10s后过期

`cfmall-product/src/main/java/com/gyz/cfmall/product/web/IndexController.java`

```java
@ResponseBody
@GetMapping("/hello")
public String hello() {
    //1、获取一把锁，只要锁的名字一样，就是同一把锁
    RLock lock = redissonClient.getLock("my-lock");
    //2、加锁，阻塞式等待。默认加的锁都是30s时间
    lock.lock(10, TimeUnit.SECONDS);
    // 2.1 锁的自动续期，如果业务超长，运行期间自动给锁续上新的30s。不用担心业务时间长，锁自动过期被删掉
    // 2.2 加锁的业务只要运行完成，就不会给当前锁续期，即使不手动解锁，锁默认在30s以后自动删除
    try {
        System.out.println("加锁成功，执行业务..." + Thread.currentThread().getId());
        Thread.sleep(30000);
    } catch (Exception e) {

    } finally {
        //3、解锁，假设解锁代码没有运行，redisson会不会出现死锁
        System.out.println("释放锁..." + Thread.currentThread().getId());
        lock.unlock();
    }
    return "hello";
}
```

报错：

> Caused by: java.lang.IllegalMonitorStateException: attempt to unlock lock, not locked by current thread by node id: 1ac5cc00-74a5-43e4-9756-d16d91c8cced thread-id: 126


![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/ffd5e35e05b368c4f05259f6f2e09951.png#id=wt8Yg&originHeight=230&originWidth=876&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/62ed7831d927e89bdd2e2b1e7a5df243.png#id=gafxg&originHeight=231&originWidth=864&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

**问题原因**：126线程10s之后锁过期了没有自动续期，线程127抢到锁，线程126将线程127获取的锁给释放了，线程127无锁可解

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/fa0a6f9a8330144af2dc150eaf621424.png#id=oV7Q5&originHeight=72&originWidth=575&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

**解决方案**：自动解锁时间一定要大于业务时间

**结论**：lock()方法将自动续期，`lock(10,TimeUnit.SECONDS)`方法将不会自动续期

---

## 看门狗自动续期原理

看门狗介绍：[https://github.com/redisson/redisson/wiki/8.-distributed-locks-and-synchronizers](https://github.com/redisson/redisson/wiki/8.-distributed-locks-and-synchronizers)

引自：[Redisson的“看门狗”机制，一个关于分布式锁的非比寻常的BUG](https://zhuanlan.zhihu.com/p/510890986)

### 看门狗是什么？

好的，如果你回答不上来这个问题。那当你遇到下面这个面试题的时候肯定懵逼。

面试官：请问你用 Redis 做分布式锁的时候，如果指定过期时间到了，把锁给释放了。但是任务还未执行完成，导致任务再次被执行，这种情况你会怎么处理呢？这个时候，99% 的面试官想得到的回答都是看门狗，或者一种类似于看门狗的机制。

如果你说：这个问题我遇到过，但是我就是把过期时间设置的长一点。时间到底设置多长，是你一个非常主观的判断，设置的长一点，能一定程度上解决这个问题，但是不能完全解决。

所以，请回去等通知吧。

或者你回答：这个问题我遇到过，我不设置过期时间，由程序调用 unlock 来保证。

好的，程序保证调用 unlock 方法没毛病，这是在程序层面可控、可保证的。但是如果你程序运行的服务器刚好还没来得及执行 unlock 就宕机了呢，这个你不能打包票吧？

这个锁是不是就死锁了？

所以......

**为了解决前面提到的过期时间不好设置**，以及一不小心死锁的问题，Redisson 内部基于时间轮，针对每一个锁都搞了一个定时任务，这个定时任务，就是**看门狗**。

在 Redisson 实例被关闭前，这个狗子可以通过定时任务不断的延长锁的有效期。

因为你根本就不需要设置过期时间，这样就从根本上解决了“过期时间不好设置”的问题。默认情况下，看门狗的检查锁的超时时间是 30 秒钟，也可以通过修改参数来另行指定。

如果很不幸，节点宕机了导致没有执行 unlock，那么在默认的配置下最长 30s 的时间后，这个锁就自动释放了。

那么问题来了，面试官紧接着来一个追问：怎么自动释放呢？

这个时候，你只需要来一个战术后仰：程序都没了，你觉得定时任务还在吗？定时任务都不在了，所以也不会存在死锁的问题。

### lock原理

Demo如下

```java
@Resource
RedissonClient redissonClient;

@ResponseBody
@GetMapping("/hello")
public String hello() {
    //1、获取一把锁，只要锁的名字一样，就是同一把锁
    RLock lock = redissonClient.getLock("whyLock");
    //2、加锁，阻塞式等待。默认加的锁都是30s时间
    lock.lock();
    // 2.1 锁的自动续期，如果业务超长，运行期间自动给锁续上新的30s。不用担心业务时间长，锁自动过期被删掉
    // 2.2 加锁的业务只要运行完成，就不会给当前锁续期，即使不手动解锁，锁默认在30s以后自动删除
    try {
        System.out.println("加锁成功，执行业务..." + Thread.currentThread().getId());
        Thread.sleep(30000);
    } catch (Exception e) {

    } finally {
        //3、解锁，假设解锁代码没有运行，redisson会不会出现死锁
        System.out.println("释放锁..." + Thread.currentThread().getId());
        lock.unlock();
    }
    return "hello";
}
```

把项目启动起来，触发接口之后，通过工具观察 Redis 里面 whyLock 这个 key 的情况，是这样的：

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/db9231c97b1d75fe44ec7a85160cb9ed.webp#id=HlZXq&originHeight=163&originWidth=945&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

你可以看到在我的截图里面，是有过期时间的，也就是我打箭头的地方。

然后我给你搞个动图，你仔细看过期时间（TTL）这个地方，有一个从 20s 变回 30s 的过程：

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/5c4112fed4ff46f3213dd960a830eed4.webp#id=ELwFe&originHeight=410&originWidth=720&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

首先，我们的代码里面并没有设置过期时间的动作，也没有去更新过期时间的这个动作。

那么这个东西是怎么回事呢？

很简单，Redisson 帮我们做了这些事情，开箱即用，当个黑盒就完事了。

接下来我就是带你把黑盒变成白盒，然后引出前面提到的两个 bug。

我的测试用例里面用的是 `3.16.0 版本`的 Redission，我们先找一下它关于设置过期动作的源码。

首先可以看到，我虽然调用的是无参的 lock 方法，但是它其实也只是一层皮而已，里面还是调用了带入参的 lock 方法，只不过给了几个默认值，其中 `leaseTime` 给的是 -1：

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/839e4857f13289921788e5b461c718eb.png#id=yq3BT&originHeight=197&originWidth=700&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

而有参的 lock 的源码是这样的，主要把注意力放到我框起来的这一行代码中：

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/781e5c3c2eaff81e4c2c7f0c5da6bbc8.png#id=WJN60&originHeight=465&originWidth=1028&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

tryAcquire 方法是它的核心逻辑，那么这个方法是在干啥事儿呢？点进去看看，这部分源码又是这样的：

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/461066f7420ca3be2cb4de93a433dccf.png#id=pXiY0&originHeight=642&originWidth=1460&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

其中 `tryLockInnerAsync` 方法就是执行 Redis 的 Lua 脚本来加锁。

既然是加锁了，过期时间肯定就是在这里设置的，也就是这里的 leaseTime：

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/956f7d9e2004c7c9243b23d8ba51123b.png#id=LaLtr&originHeight=90&originWidth=1401&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

而这里的 leaseTime 是在构造方法里面初始化的，在我的 Demo 里面，用的是配置中的默认值，也就是 30s ；

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/fc10c2c20a6d5565755b8bbe32582303.png#id=RC3l3&originHeight=589&originWidth=1369&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

所以，为什么我们的代码里面并没有设置过期时间的动作，但是对应的 key 却有过期时间呢？这里的源码回答了这个问题。

额外提一句，这个时间是从配置中获取的，所以肯定是可以自定义的，不一定非得是 30s。

另外需要注意的是，到这里，我们出现了两个不同的 leaseTime。

分别是这样的：

- `tryAcquireOnceAsync` 方法的入参 leaseTime，我们的示例中是 -1
- `tryLockInnerAsync` 方法的入参 leaseTime，我们的示例中是默认值 30000L

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/45aefe9008352740306ca95e8ed0a46b.png#id=RkWY4&originHeight=832&originWidth=1275&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

在前面加完锁之后，紧接着就轮到看门狗工作了：

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/695606c3eeabc95f0f4b9254a5d378b2.png#id=XimWn&originHeight=637&originWidth=1496&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

前面我说了，这里的 leaseTime 是 -1，所以触发的是 else 分支中的 scheduleExpirationRenewal 代码。而这个代码就是启动看门狗的代码。

换句话说，如果这里的 leaseTime 不是 -1，那么就不会启动看门狗。

那么怎么让 leaseTime 不是 -1 呢？自己指定加锁时间

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/3e4c019241b9ada5c2bde99dddcf6074.png#id=ak2tF&originHeight=612&originWidth=938&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/38994fec96384854f9553944f898eecf.png#id=wfldP&originHeight=269&originWidth=682&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

说人话就是如果加锁的时候指定了过期时间，那么 Redission 不会给你开启看门狗的机制。

这个点是无数人对看门狗机制不清楚的人都会记错的一个点，我曾经在一个群里面据理力争，后来被别人拿着源码一顿乱捶。

是的，我就是那个以为指定了过期时间之后，看门狗还会继续工作的人。打脸老疼了，希望你不要步后尘。

接着来看一下 `scheduleExpirationRenewal` 的代码：

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/7537a4590e77da692f1f51b1af9e375f.png#id=hhn35&originHeight=329&originWidth=1071&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

里面就是把当前线程封装成了一个对象，然后维护到一个 MAP 中。这个 MAP 很重要，我先把它放到这里，混个眼熟，一会再说它，

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/36b60fbd88e9ffc7c864d9b758786b68.png#id=egwnC&originHeight=112&originWidth=1342&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

你只要记住这个 MAP 的 key 是`当前线程`，value 是 `ExpirationEntry` 对象，这个对象维护的是当前线程的加锁次数。

然后，我们先看 scheduleExpirationRenewal 方法里面，调用 MAP 的 putIfAbsent 方法后，返回的 oldEntry 为空的情况。

这种情况说明是第一次加锁，会触发 renewExpiration 方法，这个方法里面就是看门狗的核心逻辑。

而在 scheduleExpirationRenewal 方法里面，不管前面提到的 oldEntry 是否为空，都会触发 addThreadId 方法：

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/7fc3353c00176a9f50cd1f3736bcf27c.png#id=w2YPQ&originHeight=298&originWidth=621&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

从源码中可以看出来，这里仅仅对当前线程的加锁次数进行一个维护。

这个维护很好理解，因为要支持锁的重入嘛，就得记录到底重入了几次。加锁一次，次数加一。解锁一次，次数减一。

接着看 renewExpiration 方法，这就是看门狗的真面目了：

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/bc0ee407ed7a85e007bc7c8cd80495f5.png#id=C8LJk&originHeight=760&originWidth=1728&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

首先这一坨逻辑主要就是一个基于时间轮的定时任务。标号为 `**4**` 的地方，就是这个定时任务触发的时间条件：`internalLockLeaseTime / 3`

前面我说了，`internalLockLeaseTime` 默认情况下是 30000，所以这里默认就是每 10 秒执行一次续命的任务，这个从我前面给到的动态里面也可以看出，`ttl` 的时间先从 30 变成了 20 ，然后一下又从 20 变成了 30

标号为 `**1**`、`**2**` 的地方干的是同一件事，就是检查当前线程是否还有效

怎么判断是否有效呢？

就是看前面提到的 MAP 中是否还有当前线程对应的 ExpirationEntry 对象。没有，就说明是被 remove 了。

那么问题就来了，你看源码的时候非常自然而然的就应该想到这个问题：什么时候调用这个 MAP 的 remove 方法呢？很快，在接下来讲释放锁的地方，你就可以看到对应的 remove。这里先提一下，后面就能呼应上了。

核心逻辑是标号为 `**3**` 的地方。我带你仔细看看，主要关注我加了下划线的地方。能走到 `**3**` 这里说明当前线程的业务逻辑还未执行完成，还需要继续持有锁。

首先看 renewExpirationAsync 方法，从方法命名上我们也可以看出来，这是在重置过期时间：

```java
    protected RFuture<Boolean> renewExpirationAsync(long threadId) {
        return this.evalWriteAsync(this.getRawName(), LongCodec.INSTANCE, RedisCommands.EVAL_BOOLEAN, 
        "if (redis.call('hexists', KEYS[1], ARGV[2]) == 1) then " +
        redis.call('pexpire', KEYS[1], ARGV[1]); " +
        return 1; " +
        end; " +
        return 0; ",
        Collections.singletonList(this.getRawName()), 
        this.internalLockLeaseTime, 
        this.getLockName(threadId));
    }
```

上面的源码主要是一个 lua 脚本，而这个脚本的逻辑非常简单。就是判断锁是否还存在，且持有锁的线程是否是当前线程。如果是当前线程，重置锁的过期时间，并返回 1，即返回 true

如果锁不存在，或者持有锁的不是当前线程，那么则返回 0，即返回 false

接着标号为 `3` 的地方，里面首先判断了执行 renewExpirationAsync 方法是否有异常。

那么问题就来了，会有什么异常呢？

这个地方的异常，主要是因为要到 Redis 执行命令嘛，所以如果 Redis 出问题了，比如卡住了，或者掉线了，或者连接池没有连接了等等各种情况，都可能会执行不了命令，导致异常。

如果出现异常了，则执行下面这行代码：

`EXPIRATION_RENEWAL_MAP.remove(getEntryName());`

然后就 return ，这个定时任务就结束了

**好，记住这个 remove 的操作，非常重要，先混个眼熟，一会会讲**

如果执行 renewExpirationAsync 方法的时候没有异常。这个时候的返回值就是 true 或者 false。

如果是 true，说明续命成功，则再次调用 renewExporation 方法，等待着时间轮触发下一次。

如果是 false，说明这把锁已经没有了，或者易主了。那么也就没有当前线程什么事情了，啥都不用做，默默的结束就行了。

上锁和看门狗的一些基本原理就是前面说到这么多。

接着简单看看 unlock 方法里面是怎么回事儿的。

### unlock原理

代码入口：

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/f09a1df26f3794c08fb56aa33ba22e9b.png#id=zPXBp&originHeight=310&originWidth=731&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/5c4222159f29dda2a6632ae16a623b42.png#id=jq2ht&originHeight=175&originWidth=641&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

首先是 unlockInnerAsync 方法，这里面就是 lua 脚本释放锁的逻辑：

```java
protected RFuture<Boolean> unlockInnerAsync(long threadId) {
    return this.evalWriteAsync(this.getRawName(), LongCodec.INSTANCE, RedisCommands.EVAL_BOOLEAN,
            "if (redis.call('hexists', KEYS[1], ARGV[3]) == 0) then " +
                    "return nil;" +
                    "end; " +
                    "local counter = redis.call('hincrby', KEYS[1], ARGV[3], -1); " +
                    "if (counter > 0) then redis.call('pexpire', KEYS[1], ARGV[2]); " +
                    "return 0; " +
                    "else redis.call('del', KEYS[1]); redis.call('publish', KEYS[2], ARGV[1]); " +
                    "return 1; " +
                    "end; return nil;",
            Arrays.asList(this.getRawName(), this.getChannelName()), 
                               new Object[]{LockPubSub.UNLOCK_MESSAGE, this.internalLockLeaseTime, this.getLockName(threadId)});
}
```

这个方法返回的是 Boolean，有三种情况：

- 返回为 null，说明锁不存在，或者锁存在，但是 value 不匹配，表示锁已经被其他线程占用；
- 返回为 true，说明锁存在，线程也是对的，重入次数已经减为零，锁可以被释放；
- 返回为 false，说明锁存在，线程也是对的，但是重入次数还不为零，锁还不能被释放；

但是你看 unlockInnerAsync 是怎么处理这个返回值的：

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/81157778a03fab9e633e8d900cbc0bf9.png#id=XTTEo&originHeight=460&originWidth=1005&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

返回值，也就是 opStatus，仅仅是判断了返回为 null 的情况，抛出异常表明这个锁不是被当前线程持有的，完事。

它并不关心返回为 true 或者为 false 的情况。

然后再看我框起来的 `cancelExpirationRenewal(threadId);` 方法：

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/db5a6445f6f6a83e44a72989baf1a214.png#id=HhWSS&originHeight=523&originWidth=1288&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

这里面就有 remove 方法。

而前面铺垫了这么多其实就是为了引出这个 cancelExpirationRenewal 方法。

纵观一下加锁和解锁，针对 MAP 的操作，看一下下面的这个图片：

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/316b8a382f62f3b0663eccbd5180c6f7.png#id=HRyjx&originHeight=318&originWidth=1476&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/7bb57fe26ef1b13c71aeaea156c78140.png#id=xdsml&originHeight=346&originWidth=1067&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

标号为 `1`的地方是加锁，调用 MAP 的 put 方法

标号为 `2`的地方是放锁，调用 MAP 的 remove 方法

至此原理部分分析结束。
