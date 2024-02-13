---
title: ✅P152_缓存-缓存使用-整合redis测试
category:
  - 谷粒商城
date: 2024-02-13
---

<!-- more -->

## 1、引入 redis-starter

`cfmall-product/pom.xml`

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
```

---

## 2、配置 redis

`cfmall-product/src/main/resources/application.yml`

```java
spring:
    redis:
        host: 192.168.17.130
        port: 6379
```

---

## 3、使用 RedisTemplate 操作 redis

`cfmall-product/src/test/java/com/gyz/cfmall/product/CfmallProductApplicationTests.java`

```java
@Autowired
StringRedisTemplate stringRedisTemplate;

@Test
public void testStringRedisTemplate() {
    ValueOperations<String, String> ops = stringRedisTemplate.opsForValue();
    ops.set("hello", "world_" + UUID.randomUUID().toString());
    String hello = ops.get("hello");
    System.out.println(hello);
}
```
