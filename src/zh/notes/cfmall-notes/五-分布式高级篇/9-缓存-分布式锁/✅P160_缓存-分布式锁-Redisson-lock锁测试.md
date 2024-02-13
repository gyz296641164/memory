---
title: ✅P160_缓存-分布式锁-Redisson-lock锁测试
category:
  - 谷粒商城
date: 2024-02-13
---

<!-- more -->

## Redisson锁测试

### 代码

`cfmall-product/src/main/java/com/gyz/cfmall/product/web/IndexController.java`

```java
@ResponseBody
@GetMapping("/hello")
public String hello() {
    //1、获取一把锁，只要锁的名字一样，就是同一把锁
    RLock lock = redissonClient.getLock("my-lock");
    //2、加锁
    lock.lock();//阻塞式等待。默认加的锁都是30s时间
    // 1）锁的自动续期，如果业务超长，运行期间自动给锁续上新的30s。不用担心业务时间长，锁自动过期被删掉
    // 2）加锁的业务只要运行完成，就不会给当前锁续期，即使不手动解锁，锁默认在30s以后自动删除
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

### 逻辑

同时开启8081、8082两个商品服务：

- 假设8081先抢到锁，它先执行业务，此时8082则是在外面等待，直到8081释放锁之后，8082才抢到了锁，等8082执行完，然后才释放锁
- 假设还是8081先抢到锁，它在执行业务期间宕机了，没有释放锁，我们发现8082会一直在外面等待，最终抢到锁，然后执行业务，再释放锁，并没有出现死锁的现象。

**测试**

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/f7dfb024e7cea92e1d438016f03fe319.png#id=bS06C&originHeight=112&originWidth=374&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/26211911e8aa3222eea810fd78260c24.png#id=uEdHh&originHeight=110&originWidth=355&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/4745c918f812bb9171ad4131dfe980e6.png#id=ctI51&originHeight=144&originWidth=696&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/0e72da3025d270fa398036eaca9bf82d.png#id=IjCnC&originHeight=239&originWidth=667&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

我们发现Redisson内部的lock()实现，里面有一个死循环，会一直去获取锁。

- lock()是阻塞式等待，默认加的锁都是30s时间
- 如果执行业务时间过长，运行期间Redisson会给锁**自动续期**，每次都会续上30s，不会因为业务时间过长，导致锁自动删掉
- 等业务执行完，就不会给当前锁续期，即使不手动释放锁，锁也会在30s以后**自动删除**
