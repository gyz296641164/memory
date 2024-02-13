---
title: ✅P159_缓存-分布式锁-Redisson简介&整合
category:
  - 谷粒商城
date: 2024-02-13
---

<!-- more -->

## 1、 简介
- Redisson 是架设在 Redis 基础上的一个 Java 驻内存数据网格（In-Memory Data Grid）。充分的利用了Redis键值数据库提供的一系列优势，基于 Java 实用工具包中常用接口，为使用者提供了一系列具有分布式特性的常用工具类。使得原本作为协调单机多线程并发程序的工 具包获得了协调分布式多机多线程并发系统的能力，大大降低了设计和研发大规模分布式系统的难度。同时结合各富特色的分布式服务，更进一步简化了分布式环境中程序相互之间 的协作。
- [官方文档](https://github.com/redisson/redisson/wiki/1.-%E6%A6%82%E8%BF%B0)

---

## 2、导入依赖
`cfmall-product/pom.xml`
```xml
<dependency>
  <groupId>org.redisson</groupId>
  <artifactId>redisson</artifactId>
  <version>3.12.0</version>
</dependency>
```

---

## 3、配置RedissonClient
[参考官方文档：单redis节点模式](https://github.com/redisson/redisson/wiki/2.-%E9%85%8D%E7%BD%AE%E6%96%B9%E6%B3%95#26-%E5%8D%95redis%E8%8A%82%E7%82%B9%E6%A8%A1%E5%BC%8F)
[参考官方文档：程序化配置方法](https://github.com/redisson/redisson/wiki/2.-%E9%85%8D%E7%BD%AE%E6%96%B9%E6%B3%95#21-%E7%A8%8B%E5%BA%8F%E5%8C%96%E9%85%8D%E7%BD%AE%E6%96%B9%E6%B3%95)

`cfmall-product/src/main/java/com/gyz/cfmall/product/config/MyRedissonConfig.java`

```java
package com.gyz.cfmall.product.config;

import org.redisson.Redisson;
import org.redisson.api.RedissonClient;
import org.redisson.config.Config;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;

@Configuration
public class MyRedissonConfig {

    /**
     *  所有对redisson的使用都是通过redissonClient对象
     * @return org.redisson.api.RedissonClient
     */
    @Bean(destroyMethod = "shutdown")
    RedissonClient redisson() throws IOException {
        Config config = new Config();
        //创建配置
        config.useSingleServer()
                .setAddress("redis://192.168.56.10:6379");
        //根据config创建出RedissonClient实例
        RedissonClient redissonClient = Redisson.create(config);
        return redissonClient;
    }
}

```

---

## 4、测试
`cfmall-product/src/test/java/com/gyz/cfmall/product/CfmallProductApplicationTests.java`
```java
    @Autowired
    RedissonClient redissonClient;

    @Test
    public void testRedisson() {
        System.out.println(redissonClient);
    }
```
