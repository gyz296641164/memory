---
title: ✅P167_缓存-SpringCache-简介
category:
  - 谷粒商城
date: 2024-02-13
---

<!-- more -->

## SpringCache-简介

[SpringCache官方文档](https://docs.spring.io/spring-framework/docs/current/reference/html/integration.html#cache)

Spring 从 3.1 开始定义了 `org.springframework.cache.Cache`和 `org.springframework.cache.CacheManager` 接口来统一不同的缓存技术；并支持使用 JCache（JSR-107）注解简化我们开发；

Cache 接口为缓存的组件规范定义，包含缓存的各种操作集合；Cache 接 口 下 Spring 提 供 了 各 种 xxxCache 的 实 现 ； 如 RedisCache ， EhCacheCache , ConcurrentMapCache 等；

每次调用需要缓存功能的方法时，Spring 会检查检查指定参数的指定的目标方法是否已经被调用过；如果有就直接从缓存中获取方法调用后的结果，如果没有就调用方法并缓存结果后返回给用户。下次调用直接从缓存中获取。

使用 Spring 缓存抽象时我们需要关注以下两点；

- 确定方法需要被缓存以及他们的缓存策略
- 从缓存中读取之前缓存存储的数据

---

## 基础概念

缓存管理器CacheManager定义规则， 真正实现缓存CRUD的是缓存组件，如ConcurrentHashMap、Redis。

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/61e0c57468e32842ec9eed7f1d3861f9.png#id=nkdj2&originHeight=561&originWidth=951&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

---

## 常用注解
![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/2023-01/20230203000959.png#id=kiIaB&originHeight=390&originWidth=876&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=#id=k87PY&originHeight=390&originWidth=876&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

| [@Caching ](/Caching) | 组合@Cachable、@CacheEvice、[@CachePut ](/CachePut) |
| --- | --- |
| [@CacheConfig ](/CacheConfig) | 在类级别共享缓存的相同配置 |


![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/48c60e8b4524fbb6380d88e54556ecdc.png#id=trSDO&originHeight=530&originWidth=1055&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)
