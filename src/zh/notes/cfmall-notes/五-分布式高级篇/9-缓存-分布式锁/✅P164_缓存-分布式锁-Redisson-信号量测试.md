---
title: ✅P164_缓存-分布式锁-Redisson-信号量测试
category:
  - 谷粒商城
date: 2024-02-13
---

<!-- more -->

## 开篇

> Redisson-信号量对应Semaphore


信号量为存储在redis中的一个数字，当这个数字大于0时，即可以调用`acquire()`方法增加数量，也可以调用`release()`方法减少数量，但是当调用`release()`之后小于0的话方法就会阻塞，直到数字大于0。

同时还提供了[异步（Async）](http://static.javadoc.io/org.redisson/redisson/3.10.0/org/redisson/api/RSemaphoreAsync.html)、[反射式（Reactive）](http://static.javadoc.io/org.redisson/redisson/3.10.0/org/redisson/api/RSemaphoreReactive.html)和[RxJava2标准](http://static.javadoc.io/org.redisson/redisson/3.10.0/org/redisson/api/RSemaphoreRx.html)的接口。

```java
RSemaphore semaphore = redisson.getSemaphore("semaphore");
semaphore.acquire();
//或
semaphore.acquireAsync();
semaphore.acquire(23);
//返回boolean，信号量小于等于0时返回false，不阻塞。
semaphore.tryAcquire();
//或
semaphore.tryAcquireAsync();
semaphore.tryAcquire(23, TimeUnit.SECONDS);
//或
semaphore.tryAcquireAsync(23, TimeUnit.SECONDS);
semaphore.release(10);
semaphore.release();
//或
semaphore.releaseAsync();
```

适用于场景：

1. 停车位停车
2. 分布式限流

---

## 用例-车位停车

### 用例一

示例代码

```java

//IndexController.java
	@Autowired
	RedissonClient redissonClient;

	@ResponseBody
    @GetMapping("/park")
    public String park() throws InterruptedException {
        RSemaphore park = redissonClient.getSemaphore("park");
        park.acquire();
        return "空闲车位-1";
    }

    @ResponseBody
    @GetMapping("/go")
    public String go() {
        RSemaphore park = redissonClient.getSemaphore("park");
        park.release();
        return "空闲车位+1";
    }
```

`acquire()`是一个阻塞方法，必须要获取成功，否则就一直阻塞；

测试：

1. 先发送3次go请求，添加3个空闲车位，在redis中，发现park的值为3，再发送park请求，每发送1次，redis的park就会-1，执行第4次的时候，界面不动了，一直在加载；

2. 此时执行1次go请求，发现go请求刚执行完，空闲车位加了1个，park请求也执行完了，使空闲车位减了1个，最终park的值为0；

---

### 用例二

示例代码

```java
//IndexController.java
	@Autowired
	RedissonClient redissonClient;
	@ResponseBody
    @GetMapping("/try-park")
    public String tryPark() {
        RSemaphore park = redissonClient.getSemaphore("park");
        boolean result = park.tryAcquire();
        if (result) {
            return "空闲车位-1";
        } else {
            return "空闲车位已满";
        }
    }
```

`tryAcquire()`尝试获取一下，不行就算了；

还是用例一的那种情况，当try-park请求，执行到4次的时候，直接提示了空闲车位已满；

---

## 结论

信号量也可以用作分布式限流，在做分布式限流的时候，可以判断信号量是否为true，为true则执行业务，否则直接返回错误，告诉它当前流量过大。
