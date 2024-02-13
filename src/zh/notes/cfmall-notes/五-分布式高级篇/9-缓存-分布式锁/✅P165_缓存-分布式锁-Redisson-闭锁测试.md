---
title: ✅P165_缓存-分布式锁-Redisson-闭锁测试
category:
  - 谷粒商城
date: 2024-02-13
---

<!-- more -->

> **对照Java对象CountDownLatch**


模拟场景：放假学校锁门，只有当5个班的人都走光了，门卫才能锁门 
`cfmall-product/src/main/java/com/gyz/cfmall/product/web/IndexController.java`
```java
@Autowired
RedissonClient redissonClient; 
	
@ResponseBody
@GetMapping("/go-home/{id}")
public String goHome(@PathVariable Integer id) {
    RCountDownLatch home = redissonClient.getCountDownLatch("home");
    home.countDown();
    return id + "班已走";
}

@ResponseBody
@GetMapping("/lock-door")
public String lockDoor() throws InterruptedException {
    RCountDownLatch home = redissonClient.getCountDownLatch("home");
    home.trySetCount(5);
    home.await();
    return "锁门";
}
```

先为redis的home设置个3，先发送lock-door请求锁门，发现界面一直是加载中，此时发送3次go-home请求，让3个班回家，执行完第3次的时候，发现lock-door的界面刷新了，提示锁门。
