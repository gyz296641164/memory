---
title: Redis分布式锁
category:
  - Redis
date: 2023-02-28
---

<!-- more -->

> **来源：[尚硅谷2021逆袭版Java面试题第三季](https://www.bilibili.com/video/BV1Hy4y1B78T)**

## 1、分布式锁的常见面试题

- Redis除了拿来做缓存，你还见过基于Redis的什么用法?
- Redis做分布式锁的时候有需要注意的问题?
- 如果是Redis是单点部署的，会带来什么问题? 那你准备怎么解决单点问题呢?
- 集群模式下，比如主从模式，有没有什么问题呢?
- 那你简单的介绍一下Redlock吧? 你简历上写redisson，你谈谈
- Redis分布式锁如何续期?看门狗知道吗?



***

## 2、搭建超卖工程Demo

### 2.1 前言

**测试目的**：多个服务间保证同一时刻同一时间段内同一用户只能有一个请求(防止关键业务出现并发攻击)

**两个 Module**：`boot_redis01` 和 `boot_redis02`

**搭建 SpringBoot 工程的步骤**

1. 新建 Module 或者 Maven 子工程
2. 编写 pom.xml 管理工程依赖
3. 编写 application.properties 配置文件
4. 编写主启动类
5. 编写配置类
6. 编写业务类
7. 代码测试

***

### 2.2 boot_redis01 工程

**POM**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.3.3.RELEASE</version>
        <relativePath/> <!-- lookup parent from repository -->
    </parent>
    <modelVersion>4.0.0</modelVersion>
    
    <groupId>com.gyz.redislock</groupId>
    <artifactId>boot_redis01</artifactId>

    <properties>
        <java.version>1.8</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <!-- https://mvnrepository.com/artifact/org.springframework.boot/spring-boot-starter-actuator -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>

        <!-- https://mvnrepository.com/artifact/org.springframework.boot/spring-boot-starter-data-redis -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-redis</artifactId>
        </dependency>

        <!-- https://mvnrepository.com/artifact/org.apache.commons/commons-pool2 -->
        <dependency>
            <groupId>org.apache.commons</groupId>
            <artifactId>commons-pool2</artifactId>
        </dependency>

        <!-- https://mvnrepository.com/artifact/redis.clients/jedis -->
        <dependency>
            <groupId>redis.clients</groupId>
            <artifactId>jedis</artifactId>
            <version>3.1.0</version>
        </dependency>

        <!-- https://mvnrepository.com/artifact/org.springframework.boot/spring-boot-starter-aop -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-aop</artifactId>
        </dependency>

        <!-- https://mvnrepository.com/artifact/org.redisson/redisson -->
        <dependency>
            <groupId>org.redisson</groupId>
            <artifactId>redisson</artifactId>
            <version>3.13.4</version>
        </dependency>

        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-devtools</artifactId>
            <scope>runtime</scope>
            <optional>true</optional>
        </dependency>

        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>

        <dependency>
            <groupId>junit</groupId>
            <artifactId>junit</artifactId>
            <version>4.12</version>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>

</project>
```

**application.properties**

```properties
server.port=1111

spring.redis.database=0
spring.redis.host=127.0.0.1
spring.redis.port=6379
#连接池最大连接数（使用负值表示没有限制）默认8
spring.redis.lettuce.pool.max-active=8
#连接池最大阻塞等待时间（使用负值表示没有限制）默认-1
spring.redis.lettuce.pool.max-wait=-1
#连接池中的最大空闲连接默认8
spring.redis.lettuce.pool.max-idle=8
#连接池中的最小空闲连接默认0
spring.redis.lettuce.pool.min-idle=0

```

**`BootRedis01Application` 主启动类**

```java
/**
 * @Description @SpringBootApplication(exclude = {DataSourceAutoConfiguration.class}):禁止 SpringBoot 自动注入数据源配置
 * @Author GongYuZhuo
 * @Date 2021/8/8 16:41
 * @Version 1.0.0
 */
@SpringBootApplication(exclude = {DataSourceAutoConfiguration.class})
public class BootRedis01Application {
    public static void main(String[] args) {
        SpringApplication.run(BootRedis01Application.class);
    }
}
```

**`RedisConfig` 配置类**

```java
@Configuration
public class RedisConfig {
    @Bean
    public RedisTemplate<String, Serializable> redisTemplate(LettuceConnectionFactory connectionFactory) {
        // 新建 RedisTemplate 对象，key 为 String 对象，value 为 Serializable（可序列化的）对象
        RedisTemplate<String, Serializable> redisTemplate = new RedisTemplate<>();
        // key 值使用字符串序列化器
        redisTemplate.setKeySerializer(new StringRedisSerializer());
        // value 值使用 json 序列化器
        redisTemplate.setValueSerializer(new GenericJackson2JsonRedisSerializer());
        // 传入连接工厂
        redisTemplate.setConnectionFactory(connectionFactory);
        // 返回 redisTemplate 对象
        return redisTemplate;
    }

}
```

**`GoodController` 业务类**

```java
package com.gyz.redislock.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class GoodController {
    @Autowired
    private StringRedisTemplate stringRedisTemplate;

    @Value("${server.port}")
    private String serverPort;

    @GetMapping("/buy_goods")
    public String buy_Goods() {
        // 从 redis 中获取商品的剩余数量
        String result = stringRedisTemplate.opsForValue().get("goods:001");
        int goodsNumber = result == null ? 0 : Integer.parseInt(result);
        String retStr = null;

        // 商品数量大于零才能出售
        if (goodsNumber > 0) {
            int realNumber = goodsNumber - 1;
            stringRedisTemplate.opsForValue().set("goods:001",  String.valueOf(realNumber));
            retStr = "你已经成功秒杀商品，此时还剩余：" + realNumber + "件" + "\t 服务器端口: " + serverPort;
        } else {
            retStr = "商品已经售完/活动结束/调用超时，欢迎下次光临" + "\t 服务器端口: " + serverPort;
        }
        System.out.println(retStr);
        return retStr;
    }

}
```



> **boot_redis02 工程**

直接复制`boot_redis01 工程`，修改下端口号！



> **测试**

先在redis客户端：`set goods:001 100`

然后访问：http://localhost:1111/buy_goods



***

## 3、问题改进

### 3.1 redis分布式锁01

> **单机版程序没加锁存在什么问题？**

**问题**：

单机版程序没有加锁，在并发测试下数字不对，会出现超卖现象！



> **解决**

加锁，那么问题又来了，加 `synchronized` 锁还是 `ReentrantLock` 锁呢？

- `synchronized`：不见不散，等不到锁就会死等
- `ReentrantLock`：过时不候，`lock.tryLock()` 提供一个过时时间的参数，时间一到自动放弃锁



> **如何选择**：

根据业务需求来选，如果非要抢到锁不可，就使用 `synchronized` 锁；如果可以暂时放弃锁，等会再来加，就使用 `ReentrantLock` 锁。



> **使用 `synchronized` 锁保证单机版程序在并发下的安全性（Ctrl + Alt +T快捷键）**

```java
@RestController
public class GoodController {
    @Autowired
    private StringRedisTemplate stringRedisTemplate;

    @Value("${server.port}")
    private String serverPort;

    @GetMapping("/buy_goods")
    public String buy_Goods() {

        synchronized (this) {
            // 从 redis 中获取商品的剩余数量
            String result = stringRedisTemplate.opsForValue().get("goods:001");
            int goodsNumber = result == null ? 0 : Integer.parseInt(result);
            String retStr = null;

            // 商品数量大于零才能出售
            if (goodsNumber > 0) {
                int realNumber = goodsNumber - 1;
                stringRedisTemplate.opsForValue().set("goods:001",  String.valueOf(realNumber));
                retStr = "你已经成功秒杀商品，此时还剩余：" + realNumber + "件" + "\t 服务器端口: " + serverPort;
            } else {
                retStr = "商品已经售完/活动结束/调用超时，欢迎下次光临" + "\t 服务器端口: " + serverPort;
            }
            System.out.println(retStr);
            return retStr;
        }
    }

}
```

**注意事项**

- 在单机环境下，可以使用 synchronized 锁或 Lock 锁来实现；
- 但是在分布式系统中，因为竞争的线程可能不在同一个节点上（同一个 jvm 中），所以需要一个让所有进程都能访问到的锁来实现，比如 redis 或者 zookeeper 来构建；
- 不同进程 jvm 层面的锁就不管用了，那么可以利用第三方的一个组件，来获取锁，未获取到锁，则阻塞当前想要运行的线程。



***

### 3.2 redis分布式锁02

> **问题**

- 分布式部署之后，单机版的锁失效，单机版的锁还是会导致超卖现象，这时就需要需要分布式锁

- 如下，在我们的两个微服务之上，挡了一个 nginx 服务器，用于实现负载均衡的功能

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/202211021746402.png" alt="image-20210808182210124" />



> **解决**

**编辑配置`nginx.conf`文件**

```properties
    #gzip  on;

    upstream mynginx{
        server 192.168.1.6:1111 weight=1;
        server 192.168.1.6:2222 weight=1;
    }

    server {
        listen       80;
        server_name  localhost;

        #charset koi8-r;

        #access_log  logs/host.access.log  main;

        location / {
            #root   html;
            proxy_pass http://mynginx;
            index index.html index.htm;
        }

        #error_page  404              /404.html;

        # redirect server error pages to the static page /50x.html
        #
        error_page   500 502 503 504  /50x.html;
        location = /50x.html {
            root   html;
        }
    
    	# ...

```

**Nginx启动命令**：

- Windows下

  ```
  C:\server\nginx-1.0.2>start nginx
  
  或
  
  C:\server\nginx-1.0.2>nginx.exe
  
  注：建议使用第一种，第二种会使你的cmd窗口一直处于执行中，不能进行其他命令操作。
  ```

- Linux下

  ```
  ./nginx                # 启动 nginx 服务器
  ./nginx -s stop        # 此方式相当于先查出nginx进程id再使用kill命令强制杀掉进程。
  ./nginx -s quit        # 此方式停止步骤是待nginx进程处理任务完毕进行停止。
  ./nginx -s reload      # 重启nginx服务
  ```

  先停止再启动（推荐）：

  ```
  ./nginx -s quit
  ./nginx
  ```

**访问 nginx**

- 输入地址：http://192.168.1.108:2222/buy_goods
- ![image-20210808185215840](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/202211021746404.png)



> **使用 jmeter 进行压测**

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/202211021746405.png" alt="image-20210808200050749" />

设置如下四个参数

1. Name：线程组的名称
2. Number of Threads(users)：打出去的线程数量
3. Ramp-up period(seconds)：在多长时间内需要将这些线程打出去
4. Loop Count：循环次数，选择 Infinite 表示无限重复执行

**压测结果**

- 可以看到，相同的商品被出售两次，出现超卖现象

<img src="https://img-blog.csdnimg.cn/img_convert/69a506bf7f3d584cf7b4bb7d352eedeb.png" alt="image-20210203163846600"  />

> **使用 redis 分布式锁**

[SET 命令](https://redis.io/commands/set)

Redis具有极高的性能，且其命令对分布式锁支持友好，借助 SET 命令即可实现加锁处理

The SET command supports a set of options that modify its behavior:

- EX seconds – Set the specified expire time, in seconds.
- PX milliseconds – Set the specified expire time, in milliseconds.
- EXAT timestamp-seconds – Set the specified Unix time at which the key will expire, in seconds.
- PXAT timestamp-milliseconds – Set the specified Unix time at which the key will expire, in milliseconds.
- NX – Only set the key if it does not already exist.
- XX – Only set the key if it already exist.
- KEEPTTL – Retain the time to live associated with the key.
- GET – Return the old value stored at key, or nil when key did not exist.

**在代码中使用分布式锁**

- 使用当前请求的 UUID + 线程名作为分布式锁的 value，执行 stringRedisTemplate.opsForValue().setIfAbsent(REDIS_LOCK_KEY, value) 方法尝试抢占锁，如果抢占失败，则返回值为 false；如果抢占成功，则返回值为 true。最后记得调用`stringRedisTemplate.delete(REDIS_LOCK_KEY) `方法释放分布式锁。

```java
package com.gyz.redislock.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
public class GoodController {

    private static final String REDIS_LOCK_KEY = "lockOneby";

    @Autowired
    private StringRedisTemplate stringRedisTemplate;

    @Value("${server.port}")
    private String serverPort;

    @GetMapping("/buy_goods")
    public String buy_Goods() {
        // 当前请求的 UUID + 线程名
        String value = UUID.randomUUID().toString() + Thread.currentThread().getName();
        // setIfAbsent() 就相当于 setnx，如果不存在就新建锁
        Boolean lockFlag = stringRedisTemplate.opsForValue().setIfAbsent(REDIS_LOCK_KEY, value);

        // 抢锁失败
        if (lockFlag == false) {
            return "抢锁失败 o(╥﹏╥)o";
        }

        // 从 redis 中获取商品的剩余数量
        String result = stringRedisTemplate.opsForValue().get("goods:001");
        int goodsNumber = result == null ? 0 : Integer.parseInt(result);
        String retStr = null;

        // 商品数量大于零才能出售
        if (goodsNumber > 0) {
            int realNumber = goodsNumber - 1;
            stringRedisTemplate.opsForValue().set("goods:001", realNumber + "");
            retStr = "你已经成功秒杀商品，此时还剩余：" + realNumber + "件" + "\t 服务器端口: " + serverPort;
        } else {
            retStr = "商品已经售罄/活动结束/调用超时，欢迎下次光临" + "\t 服务器端口: " + serverPort;
        }
        System.out.println(retStr);
        // 释放分布式锁
        stringRedisTemplate.delete(REDIS_LOCK_KEY);
        return retStr;
    }

}
```

**代码测试**

- 加上分布式锁之后，解决了超卖现象

<img src="https://img-blog.csdnimg.cn/img_convert/7ae1096a15daceb386af7c4ee327c89d.png" alt="image-20210203165907616"  />



***

### 3.3 redis分布式锁03

**如果代码在执行的过程中出现异常，那么就可能无法释放锁，因此必须要在代码层面加上 `finally` 代码块，保证锁的释放。**

```java
package com.gyz.redislock.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
public class GoodController {

    private static final String REDIS_LOCK_KEY = "lockOneby";

    @Autowired
    private StringRedisTemplate stringRedisTemplate;

    @Value("${server.port}")
    private String serverPort;

    @GetMapping("/buy_goods")
    public String buy_Goods() {
        // 当前请求的 UUID + 线程名
        String value = UUID.randomUUID().toString() + Thread.currentThread().getName();
        try {
            // setIfAbsent() 就相当于 setnx，如果不存在就新建锁
            Boolean lockFlag = stringRedisTemplate.opsForValue().setIfAbsent(REDIS_LOCK_KEY, value);

            // 抢锁失败
            if (lockFlag == false) {
                return "抢锁失败 o(╥﹏╥)o";
            }

            // 从 redis 中获取商品的剩余数量
            String result = stringRedisTemplate.opsForValue().get("goods:001");
            int goodsNumber = result == null ? 0 : Integer.parseInt(result);
            String retStr = null;

            // 商品数量大于零才能出售
            if (goodsNumber > 0) {
                int realNumber = goodsNumber - 1;
                stringRedisTemplate.opsForValue().set("goods:001", realNumber + "");
                retStr = "你已经成功秒杀商品，此时还剩余：" + realNumber + "件" + "\t 服务器端口: " + serverPort;
            } else {
                retStr = "商品已经售罄/活动结束/调用超时，欢迎下次光临" + "\t 服务器端口: " + serverPort;
            }
            System.out.println(retStr);
            return retStr;
        } finally {
            // 释放分布式锁
            stringRedisTemplate.delete(REDIS_LOCK_KEY);
        }
    }

}
```

**存在的问题**

- 假设部署了微服务 jar 包的服务器挂了，代码层面根本没有走到 finally 这块，也没办法保证解锁。这个 key 没有被删除，其他微服务就一直抢不到锁，因此我们需要加入一个过期时间限定的 key。

**设置带过期时间的 key**

- 执行 `stringRedisTemplate.expire(REDIS_LOCK_KEY, 10L, TimeUnit.SECONDS);` 方法为分布式锁设置过期时间，保证锁的释放。

```java
package com.gyz.redislock.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;
import java.util.concurrent.TimeUnit;

@RestController
public class GoodController {

    private static final String REDIS_LOCK_KEY = "lockOneby";

    @Autowired
    private StringRedisTemplate stringRedisTemplate;

    @Value("${server.port}")
    private String serverPort;

    @GetMapping("/buy_goods")
    public String buy_Goods() {
        // 当前请求的 UUID + 线程名
        String value = UUID.randomUUID().toString() + Thread.currentThread().getName();
        try {
            // setIfAbsent() 就相当于 setnx，如果不存在就新建锁
            Boolean lockFlag = stringRedisTemplate.opsForValue().setIfAbsent(REDIS_LOCK_KEY, value);
            // 设置过期时间为 10s
            stringRedisTemplate.expire(REDIS_LOCK_KEY, 10L, TimeUnit.SECONDS);

            // 抢锁失败
            if (lockFlag == false) {
                return "抢锁失败 o(╥﹏╥)o";
            }

            // 从 redis 中获取商品的剩余数量
            String result = stringRedisTemplate.opsForValue().get("goods:001");
            int goodsNumber = result == null ? 0 : Integer.parseInt(result);
            String retStr = null;

            // 商品数量大于零才能出售
            if (goodsNumber > 0) {
                int realNumber = goodsNumber - 1;
                stringRedisTemplate.opsForValue().set("goods:001", realNumber + "");
                retStr = "你已经成功秒杀商品，此时还剩余：" + realNumber + "件" + "\t 服务器端口: " + serverPort;
            } else {
                retStr = "商品已经售罄/活动结束/调用超时，欢迎下次光临" + "\t 服务器端口: " + serverPort;
            }
            System.out.println(retStr);
            return retStr;
        } finally {
            // 释放分布式锁
            stringRedisTemplate.delete(REDIS_LOCK_KEY);
        }
    }

}
```



***

### 3.4 redis分布式锁04

**新问题**

- 加锁与设置过期时间的操作分开了，假设服务器刚刚执行了加锁操作，然后宕机了，也没办法保证解锁。

**解决方法**

- **保证加锁和设置过期时间为原子操作**

- 使用 `stringRedisTemplate.opsForValue().setIfAbsent(REDIS_LOCK_KEY, value, 10L, TimeUnit.SECONDS)` 方法，在加锁的同时设置过期时间，保证这两个操作的原子性

  ```java
  package com.gyz.redislock.controller;
  
  import org.springframework.beans.factory.annotation.Autowired;
  import org.springframework.beans.factory.annotation.Value;
  import org.springframework.data.redis.core.StringRedisTemplate;
  import org.springframework.web.bind.annotation.GetMapping;
  import org.springframework.web.bind.annotation.RestController;
  
  import java.util.UUID;
  import java.util.concurrent.TimeUnit;
  
  @RestController
  public class GoodController {
  
      private static final String REDIS_LOCK_KEY = "lockOneby";
  
      @Autowired
      private StringRedisTemplate stringRedisTemplate;
  
      @Value("${server.port}")
      private String serverPort;
  
      @GetMapping("/buy_goods")
      public String buy_Goods() {
          // 当前请求的 UUID + 线程名
          String value = UUID.randomUUID().toString() + Thread.currentThread().getName();
          try {
              // setIfAbsent() 就相当于 setnx，如果不存在就新建锁，同时加上过期时间保证原子性
              Boolean lockFlag = stringRedisTemplate.opsForValue().setIfAbsent(REDIS_LOCK_KEY, value, 10L, TimeUnit.SECONDS);
  
              // 抢锁失败
              if (lockFlag == false) {
                  return "抢锁失败 o(╥﹏╥)o";
              }
  
              // 从 redis 中获取商品的剩余数量
              String result = stringRedisTemplate.opsForValue().get("goods:001");
              int goodsNumber = result == null ? 0 : Integer.parseInt(result);
              String retStr = null;
  
              // 商品数量大于零才能出售
              if (goodsNumber > 0) {
                  int realNumber = goodsNumber - 1;
                  stringRedisTemplate.opsForValue().set("goods:001", realNumber + "");
                  retStr = "你已经成功秒杀商品，此时还剩余：" + realNumber + "件" + "\t 服务器端口: " + serverPort;
              } else {
                  retStr = "商品已经售罄/活动结束/调用超时，欢迎下次光临" + "\t 服务器端口: " + serverPort;
              }
              System.out.println(retStr);
              return retStr;
          } finally {
              // 释放分布式锁
              stringRedisTemplate.delete(REDIS_LOCK_KEY);
          }
      }
  
  }
  ```

**存在的问题**

- 张冠李戴，删除了别人的锁：我们无法保证一个业务的执行时间，有可能是 10s，有可能是 20s，也有可能更长。因为执行业务的时候可能会调用其他服务，我们并不能保证其他服务的调用时间。如果设置的锁过期了，当前业务还正在执行，那么就有可能出现超卖问题，并且还有可能出现当前业务执行完成后，释放了其他业务的锁
- 如下图，假设进程 A 在 T2 时刻设置了一把过期时间为 30s 的锁，在 T5 时刻该锁过期被释放，在 T5 和 T6 期间，Test 这把锁已经失效了，并不能保证进程 A 业务的原子性了。于是进程 B 在 T6 时刻能够获取 Test 这把锁，但是进程 A 在 T7 时刻删除了进程 B 加的锁，进程 B 在 T8 时刻获取锁的时候发现没有了！！！
  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/202211021746406.png" alt="image-20210808201858921" />

**解决方法**：**只允许删除自己的锁，不允许删除别人的锁**

- 在释放锁之前，执行 `value.equalsIgnoreCase(stringRedisTemplate.opsForValue().get(REDIS_LOCK_KEY))` 方法判断是否为自己加的锁

- 

  ```java
  package com.gyz.redislock.controller;
  
  import org.springframework.beans.factory.annotation.Autowired;
  import org.springframework.beans.factory.annotation.Value;
  import org.springframework.data.redis.core.StringRedisTemplate;
  import org.springframework.web.bind.annotation.GetMapping;
  import org.springframework.web.bind.annotation.RestController;
  
  import java.util.UUID;
  import java.util.concurrent.TimeUnit;
  
  @RestController
  public class GoodController {
  
      private static final String REDIS_LOCK_KEY = "lockOneby";
  
      @Autowired
      private StringRedisTemplate stringRedisTemplate;
  
      @Value("${server.port}")
      private String serverPort;
  
      @GetMapping("/buy_goods")
      public String buy_Goods() {
          // 当前请求的 UUID + 线程名
          String value = UUID.randomUUID().toString() + Thread.currentThread().getName();
          try {
              // setIfAbsent() 就相当于 setnx，如果不存在就新建锁，同时加上过期时间保证原子性
              Boolean lockFlag = stringRedisTemplate.opsForValue().setIfAbsent(REDIS_LOCK_KEY, value, 10L, TimeUnit.SECONDS);
  
              // 抢锁失败
              if (lockFlag == false) {
                  return "抢锁失败 o(╥﹏╥)o";
              }
  
              // 从 redis 中获取商品的剩余数量
              String result = stringRedisTemplate.opsForValue().get("goods:001");
              int goodsNumber = result == null ? 0 : Integer.parseInt(result);
              String retStr = null;
  
              // 商品数量大于零才能出售
              if (goodsNumber > 0) {
                  int realNumber = goodsNumber - 1;
                  stringRedisTemplate.opsForValue().set("goods:001", realNumber + "");
                  retStr = "你已经成功秒杀商品，此时还剩余：" + realNumber + "件" + "\t 服务器端口: " + serverPort;
              } else {
                  retStr = "商品已经售罄/活动结束/调用超时，欢迎下次光临" + "\t 服务器端口: " + serverPort;
              }
              System.out.println(retStr);
              return retStr;
          } finally {
              // 判断是否是自己加的锁
              if (value.equalsIgnoreCase(stringRedisTemplate.opsForValue().get(REDIS_LOCK_KEY))) {
                  // 释放分布式锁
                  stringRedisTemplate.delete(REDIS_LOCK_KEY);
              }
          }
      }
  
  }
  ```



***

### 3.5 redis分布式锁05



> **存在的问题**

- 在 finally 代码块中的判断与删除并不是原子操作，假设执行 `if` 判断的时候，这把锁还是属于当前业务，但是有可能刚执行完 `if` 判断，这把锁就被其他业务给释放了，还是会出现误删锁的情况

- ```java
  try {
      // ...
  }
  finally {
      // 判断加锁与解锁是不是同一个客户端
      if (value.equalsIgnoreCase(stringRedisTemplate.opsForValue().get(REDIS_LOCK_KEY))){
          // 若在此时，这把锁突然不是这个客户端的，则会误解锁
          stringRedisTemplate.delete(REDIS_LOCK_KEY);//释放锁
      }
  }
  ```



> **使用 redis 自身事务保证原子性操作**

**1、事务介绍**

- Redis的事务是通过MULTl，EXEC，DISCARD和WATCH这四个命令来完成；
- Redis的单个命令都是原子性的，所以这里确保事务性的对象是命令集合；
- Redis将命令集合序列化并确保处于一事务的命令集合连续且不被打断的执行；
- Redis不支持回滚的操作。

**2、相关命令**

- MULTI
  - 用于标记事务块的开始。
  - Redis会将后续的命令逐个放入队列中，然后使用EXEC命令原子化地执行这个命令序列。
  - 语法：MULTI
- EXEC
  - 在一个事务中执行所有先前放入队列的命令，然后恢复正常的连接状态。
  - 语法：`EXEC`
- DISCARD
  - 清除所有先前在一个事务中放入队列的命令，然后恢复正常的连接状态。
  - 语法：`DISCARD`
- WATCH
  - 当某个事务需要按条件执行时，就要使用这个命令将给定的键设置为受监控的状态。
  - 语法：`WATCH key[key..…]`注：该命令可以实现redis的乐观锁
- UNWATCH
  - 清除所有先前为一个事务监控的键。
  - 语法：`UNWATCH`

**解决代码**

- 开启事务不断监视 `REDIS_LOCK_KEY` 这把锁有没有被别人动过，如果已经被别人动过了，那么继续重新执行删除操作，否则就解除监视

- ```java
  package com.gyz.redislock.controller;
  
  import org.springframework.beans.factory.annotation.Autowired;
  import org.springframework.beans.factory.annotation.Value;
  import org.springframework.data.redis.core.StringRedisTemplate;
  import org.springframework.web.bind.annotation.GetMapping;
  import org.springframework.web.bind.annotation.RestController;
  
  import java.util.List;
  import java.util.UUID;
  import java.util.concurrent.TimeUnit;
  
  @RestController
  public class GoodController {
  
      private static final String REDIS_LOCK_KEY = "lockOneby";
  
      @Autowired
      private StringRedisTemplate stringRedisTemplate;
  
      @Value("${server.port}")
      private String serverPort;
  
      @GetMapping("/buy_goods")
      public String buy_Goods() {
          // 当前请求的 UUID + 线程名
          String value = UUID.randomUUID().toString() + Thread.currentThread().getName();
          try {
              // setIfAbsent() 就相当于 setnx，如果不存在就新建锁，同时加上过期时间保证原子性
              Boolean lockFlag = stringRedisTemplate.opsForValue().setIfAbsent(REDIS_LOCK_KEY, value, 10L, TimeUnit.SECONDS);
  
              // 抢锁失败
              if (lockFlag == false) {
                  return "抢锁失败 o(╥﹏╥)o";
              }
  
              // 从 redis 中获取商品的剩余数量
              String result = stringRedisTemplate.opsForValue().get("goods:001");
              int goodsNumber = result == null ? 0 : Integer.parseInt(result);
              String retStr = null;
  
              // 商品数量大于零才能出售
              if (goodsNumber > 0) {
                  int realNumber = goodsNumber - 1;
                  stringRedisTemplate.opsForValue().set("goods:001", realNumber + "");
                  retStr = "你已经成功秒杀商品，此时还剩余：" + realNumber + "件" + "\t 服务器端口: " + serverPort;
              } else {
                  retStr = "商品已经售罄/活动结束/调用超时，欢迎下次光临" + "\t 服务器端口: " + serverPort;
              }
              System.out.println(retStr);
              return retStr;
          } finally {
              while (true) {
                  //加事务，乐观锁
                  stringRedisTemplate.watch(REDIS_LOCK_KEY);
                  // 判断是否是自己加的锁
                  if (value.equalsIgnoreCase(stringRedisTemplate.opsForValue().get(REDIS_LOCK_KEY))) {
                      // 开启事务
                      stringRedisTemplate.setEnableTransactionSupport(true);
                      stringRedisTemplate.multi();
                      stringRedisTemplate.delete(REDIS_LOCK_KEY);
                      // 判断事务是否执行成功，如果等于 null，就是没有删掉，删除失败，再回去 while 循环那再重新执行删除
                      List<Object> list = stringRedisTemplate.exec();
                      if (list == null) {
                          continue;
                      }
                  }
                  //如果删除成功，释放监控器，并且 break 跳出当前循环
                  stringRedisTemplate.unwatch();
                  break;
              }
          }
      }
  
  }
  ```



***

### 3.6 redis分布式锁06

> **使用 lua 脚本保证原子性操作**

- [lua 脚本](https://redis.io/commands/set)

- redis 可以通过 `eval` 命令保证代码执行的原子性

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/202211021746407.png" alt="image-20210808203051745" />

- **解决代码**

  - **`RedisUtils` 工具类**

    ```
    public class RedisUtils {
        private static JedisPool jedisPool;
    
        private static String hostAddr = "192.168.189.1";
    
        static {
            JedisPoolConfig jedisPoolConfig = new JedisPoolConfig();
            jedisPoolConfig.setMaxTotal(20);
            jedisPoolConfig.setMaxIdle(10);
            jedisPool = new JedisPool(jedisPoolConfig, hostAddr, 6379, 100000);
        }
    
        public static Jedis getJedis() throws Exception {
            if (null != jedisPool) {
                return jedisPool.getResource();
            }
            throw new Exception("Jedispool is not ok");
        }
    
    }
    ```

  - **使用 lua 脚本保证解锁操作的原子性**

    ```java
    package com.gyz.redislock.controller;
    
    import com.gyz.redislock.utils.RedisUtils;
    import org.springframework.beans.factory.annotation.Autowired;
    import org.springframework.beans.factory.annotation.Value;
    import org.springframework.data.redis.core.StringRedisTemplate;
    import org.springframework.web.bind.annotation.GetMapping;
    import org.springframework.web.bind.annotation.RestController;
    import redis.clients.jedis.Jedis;
    
    import java.util.Collections;
    import java.util.List;
    import java.util.UUID;
    import java.util.concurrent.TimeUnit;
    
    @RestController
    public class GoodController {
    
        private static final String REDIS_LOCK_KEY = "lockOneby";
    
        @Autowired
        private StringRedisTemplate stringRedisTemplate;
    
        @Value("${server.port}")
        private String serverPort;
    
        @GetMapping("/buy_goods")
        public String buy_Goods() throws Exception {
            // 当前请求的 UUID + 线程名
            String value = UUID.randomUUID().toString() + Thread.currentThread().getName();
            try {
                // setIfAbsent() 就相当于 setnx，如果不存在就新建锁，同时加上过期时间保证原子性
                Boolean lockFlag = stringRedisTemplate.opsForValue().setIfAbsent(REDIS_LOCK_KEY, value, 10L, TimeUnit.SECONDS);
    
                // 抢锁失败
                if (lockFlag == false) {
                    return "抢锁失败 o(╥﹏╥)o";
                }
    
                // 从 redis 中获取商品的剩余数量
                String result = stringRedisTemplate.opsForValue().get("goods:001");
                int goodsNumber = result == null ? 0 : Integer.parseInt(result);
                String retStr = null;
    
                // 商品数量大于零才能出售
                if (goodsNumber > 0) {
                    int realNumber = goodsNumber - 1;
                    stringRedisTemplate.opsForValue().set("goods:001", realNumber + "");
                    retStr = "你已经成功秒杀商品，此时还剩余：" + realNumber + "件" + "\t 服务器端口: " + serverPort;
                } else {
                    retStr = "商品已经售罄/活动结束/调用超时，欢迎下次光临" + "\t 服务器端口: " + serverPort;
                }
                System.out.println(retStr);
                return retStr;
            } finally {
                // 获取连接对象
                Jedis jedis = RedisUtils.getJedis();
                // lua 脚本，摘自官网
                String script = "if redis.call('get', KEYS[1]) == ARGV[1]" + "then "
                        + "return redis.call('del', KEYS[1])" + "else " + "  return 0 " + "end";
                try {
                    // 执行 lua 脚本
                    Object result = jedis.eval(script, Collections.singletonList(REDIS_LOCK_KEY), Collections.singletonList(value));
                    // 获取 lua 脚本的执行结果
                    if ("1".equals(result.toString())) {
                        System.out.println("------del REDIS_LOCK_KEY success");
                    } else {
                        System.out.println("------del REDIS_LOCK_KEY error");
                    }
                } finally {
                    // 关闭链接
                    if (null != jedis) {
                        jedis.close();
                    }
                }
            }
        }
    }
    ```

  - **代码测试**

    使用 lua 脚本可以防止别人动我们自己的锁。

    <img src="https://img-blog.csdnimg.cn/img_convert/c0605673aefcef02a014f8620bbde92d.png" alt="image-20210204180354202"  />



***

### 3.7 redis分布式锁07

> **自动续期版**

**上章存在的问题**

- 前面已经讲过了：我们无法保证一个业务的执行时间，有可能是 10s，有可能是 20s，也有可能更长。因为执行业务的时候可能会调用其他服务，我们并不能保证其他服务的调用时间。如果设置的锁过期了，当前业务还正在执行，那么之前设置的锁就失效了，就有可能出现超卖问题。
- 因此我们需要确保 **redisLock 过期时间大于业务执行时间的问题**，即面临如何对 Redis 分布式锁进行续期的问题

**redis 与 zookeeper 在 CAP 方面的对比**

- redis 异步复制造成的锁丢失， 比如：主节点没来的及把刚刚 set 进来这条数据给从节点，就挂了，那么主节点和从节点的数据就不一致。此时如果集群模式下，就得上 Redisson 来解决
- zookeeper 保持强一致性原则，对于集群中所有节点来说，要么同时更新成功，要么失败，因此使用 zookeeper 集群并不存在主从节点数据丢失的问题，但丢失了速度方面的性能

redis 集群环境下，我们自己写的也不OK，直接上 RedLock 之 Redisson 落地实现！

- [redis 分布式锁](https://redis.io/topics/distlock)
- [redisson-GitHub 地址](https://github.com/redisson/redisson)



> **代码实现**

**在 `RedisConfig` 配置类中注入 `Redisson` 对象**

```java
package com.gyz.redislock.config;

import org.redisson.Redisson;
import org.redisson.config.Config;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.io.Serializable;

@Configuration
public class RedisConfig {

    @Value("${spring.redis.host}")
    private String redisHost;

    @Bean
    public RedisTemplate<String, Serializable> redisTemplate(LettuceConnectionFactory connectionFactory) {
        // 新建 RedisTemplate 对象，key 为 String 对象，value 为 Serializable（可序列化的）对象
        RedisTemplate<String, Serializable> redisTemplate = new RedisTemplate<>();
        // key 值使用字符串序列化器
        redisTemplate.setKeySerializer(new StringRedisSerializer());
        // value 值使用 json 序列化器
        redisTemplate.setValueSerializer(new GenericJackson2JsonRedisSerializer());
        // 传入连接工厂
        redisTemplate.setConnectionFactory(connectionFactory);
        // 返回 redisTemplate 对象
        return redisTemplate;
    }


    @Bean
    public Redisson redisson() {
        Config config = new Config();
        config.useSingleServer().setAddress("redis://" + redisHost + ":6379").setDatabase(0);
        return (Redisson) Redisson.create(config);
    }

}
```

**Redisson模板**

```
private static final String REDIS_LOCK_KEY = "lockOneby";

@Autowired
private Redisson redisson;

@GetMapping("/doSomething")
public String doSomething(){

    RLock redissonLock = redisson.getLock(lockOneby);
    redissonLock.lock();
    try {
        //doSomething
    }finally {
        redissonLock.unlock();
    }
}
```

**业务逻辑**

```java
package com.gyz.redislock.controller;

import com.gyz.redislock.utils.RedisUtils;
import org.redisson.Redisson;
import org.redisson.api.RLock;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import redis.clients.jedis.Jedis;

import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@RestController
public class GoodController {

    private static final String REDIS_LOCK_KEY = "lockOneby";

    @Autowired
    private StringRedisTemplate stringRedisTemplate;

    @Value("${server.port}")
    private String serverPort;

    @Autowired
    private Redisson redisson;

    @GetMapping("/buy_goods")
    public String buy_Goods() throws Exception {
        // 当前请求的 UUID + 线程名
        String value = UUID.randomUUID().toString() + Thread.currentThread().getName();
        // 获取锁
        RLock redissonLock = redisson.getLock(REDIS_LOCK_KEY);
        // 上锁
        redissonLock.lock();

        try {
            // 从 redis 中获取商品的剩余数量
            String result = stringRedisTemplate.opsForValue().get("goods:001");
            int goodsNumber = result == null ? 0 : Integer.parseInt(result);
            String retStr = null;

            // 商品数量大于零才能出售
            if (goodsNumber > 0) {
                int realNumber = goodsNumber - 1;
                stringRedisTemplate.opsForValue().set("goods:001", realNumber + "");
                retStr = "你已经成功秒杀商品，此时还剩余：" + realNumber + "件" + "\t 服务器端口: " + serverPort;
            } else {
                retStr = "商品已经售罄/活动结束/调用超时，欢迎下次光临" + "\t 服务器端口: " + serverPort;
            }
            System.out.println(retStr);
            return retStr;
        } finally {
            // 解锁
            redissonLock.unlock();
        }
    }

}
```

**代码测试**

<img src="https://img-blog.csdnimg.cn/img_convert/91d6563435b38862de83762911cd9d4a.png" alt="image-20210204183252071"  />

**在超高并发的情况下，可能会抛出如下异常，原因是解锁 lock 的线程并不是当前线程**

```
IllegalMonitorStateException: attempt to unlock lock，not loked by current thread by node id:da6385f-81a5-4e6c-b8c0
```

**严谨代码改进**

```java
private static final String REDIS_LOCK_KEY = "lockOneby";

@Autowired
private Redisson redisson;

@GetMapping("/doSomething")
public String doSomething(){

    RLock redissonLock = redisson.getLock(lockOneby);
    redissonLock.lock();
    try {
        //doSomething
    }finally {
    	//添加后，更保险,防止上述异常
		if(redissonLock.isLocked() && redissonLock.isHeldByCurrentThread()) {
    		redissonLock.unlock();
    	}
    }
}

```



***

## 4、分布式锁总结

1. synchronized 锁：单机版 OK，上 nginx分布式微服务，单机锁就不 OK,
2. 分布式锁：取消单机锁，上 redis 分布式锁 SETNX
3. 如果出异常的话，可能无法释放锁， 必须要在 finally 代码块中释放锁
4. 如果宕机了，部署了微服务代码层面根本没有走到 finally 这块，也没办法保证解锁，因此需要有设置锁的过期时间
5. 除了增加过期时间之外，还必须要 SETNX 操作和设置过期时间的操作必须为原子性操作
6. 规定只能自己删除自己的锁，你不能把别人的锁删除了，防止张冠李戴，可使用 lua 脚本或者事务
7. 判断锁所属业务与删除锁的操作也需要是原子性操作
8. redis 集群环境下，我们自己写的也不 OK，直接上 RedLock 之 Redisson 落地实现
