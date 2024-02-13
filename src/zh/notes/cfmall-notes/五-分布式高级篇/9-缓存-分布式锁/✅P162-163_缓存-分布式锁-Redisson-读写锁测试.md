---
title: ✅P162-163_缓存-分布式锁-Redisson-读写锁测试
category:
  - 谷粒商城
date: 2024-02-13
---

<!-- more -->

## 开篇

参考文章：[https://blog.csdn.net/Alvin199765/article/details/118163087](https://blog.csdn.net/Alvin199765/article/details/118163087)

- 读写锁通常都是成对出现的
- 写锁控制了读锁
- 只要写锁存在，读锁就得等待
- 并发写，肯定得一个一个执行
- 如果写锁不存在，读锁一直在那加锁，那跟没加是一样的

---

## 不加锁用例

示例代码

```java
	//IndexController.java

	@Autowired
	StringRedisTemplate stringRedisTemplate;

	/**
     * 什么锁也不加，单纯的往redis中写入一个值
     *
     * @return
     */
    @ResponseBody
    @GetMapping("/write-unlock")
    public String writeUnlock() {
        String uuid = "";
        try {
            uuid = UUID.randomUUID().toString();
            TimeUnit.SECONDS.sleep(30);
            stringRedisTemplate.opsForValue().set("writeValue", uuid);
        } catch (Exception e) {
            e.printStackTrace();
        }
        return uuid;
    }

    /**
     * 什么锁也不加，单纯的从redis中读取一个值
     *
     * @return
     */
    @ResponseBody
    @GetMapping("/read-unlock")
    public String readUnlock() {
        String name = "";
        name = stringRedisTemplate.opsForValue().get("writeValue");
        return name;
    }
```

---

## 加锁用例一

示例代码

```java
//IndexController.java

	@Autowired
	RedissonClient redissonClient;
	@Autowired
	StringRedisTemplate stringRedisTemplate;

	@ResponseBody
    @GetMapping("/write")
    public String write(){
        RReadWriteLock lock = redissonClient.getReadWriteLock("rwAnyLock");
        String uuid = "";
        RLock rLock = lock.writeLock();
        try{
            rLock.lock();
            uuid = UUID.randomUUID().toString();
            TimeUnit.SECONDS.sleep(30);
            stringRedisTemplate.opsForValue().set("writeValue",uuid);
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            rLock.unlock();
        }
        return uuid;
    }

    @ResponseBody
    @GetMapping("/read")
    public String read(){
        RReadWriteLock lock = redissonClient.getReadWriteLock("rwAnyLock");
        String uuid =  "";
        RLock rLock = lock.readLock();
        try{
            rLock.lock();
            uuid = stringRedisTemplate.opsForValue().get("writeValue");
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            rLock.unlock();
        }
        return uuid;
    }
```

### 测试一

- 先给redis中，手动添加一个writeValue的值，查看是否能读取到
- 结果：可以

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/73469563335f6b73f6aeab88262c6705.png#id=VxXWQ&originHeight=106&originWidth=361&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

### 测试二

- 先调用写的方法，再调用读的方法
- 结果：读请求会一直加载，等写请求执行完业务之后，读请求瞬间加载到数据

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/384788d6556523ff41eafd58d5ae900f.png#id=iyUs2&originHeight=117&originWidth=406&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/cb0bf76a7428c87bfec6d0d336e0df6e.png#id=Faqdy&originHeight=118&originWidth=374&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

加读写锁的作用就是，保证一定能读到最新数据。修改期间，写锁是一个互斥锁，读锁则是一个共享锁

---

## 加锁用例二

示例代码

```java
//IndexController.java

	@Autowired
	RedissonClient redissonClient;
	@Autowired
	StringRedisTemplate stringRedisTemplate;

	@ResponseBody
    @GetMapping("/write")
    public String write() {
        RReadWriteLock lock = redissonClient.getReadWriteLock("rwAnyLock");
        String uuid = "";
        RLock rLock = lock.writeLock();
        try {
            rLock.lock();
            // 打印log
            System.out.println("写锁加锁成功" + Thread.currentThread().getId());
            uuid = UUID.randomUUID().toString();
            TimeUnit.SECONDS.sleep(30);
            stringRedisTemplate.opsForValue().set("writeValue", uuid);
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            rLock.unlock();
            // 打印log
            System.out.println("写锁释放" + Thread.currentThread().getId());
        }
        return uuid;
    }

    @ResponseBody
    @GetMapping("/read")
    public String read() {
        RReadWriteLock lock = redissonClient.getReadWriteLock("rwAnyLock");
        String uuid = "";
        RLock rLock = lock.readLock();
        try {
            rLock.lock();
            // 打印log
            System.out.println("读锁加锁成功" + Thread.currentThread().getId());
            uuid = stringRedisTemplate.opsForValue().get("writeValue");
            // 让读锁也等待30秒
            TimeUnit.SECONDS.sleep(30);
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            rLock.unlock();
            // 打印log
            System.out.println("读锁释放" + Thread.currentThread().getId());
        }
        return uuid;
    }
```

### 测试三

- 先发送一个读请求，再发送一个写请求
- 结果：读加上锁了，读释放锁之后，写才加上锁

### 测试四

- 发送一个写请求，再发送四个读请求
- 结果：写请求释放的瞬间，四个读请求都加上锁了

---

## 结论

读 + 读：相当于无锁，并发读，只会在redis中记录好当前的读锁，它们都会同时加锁成功；

写 + 读：读必须等待写锁释放；

写 + 写：阻塞方式；

读 + 写：有读锁，写也需要等待；

**只要有一个写存在，其它的读/写就必须等待**。
