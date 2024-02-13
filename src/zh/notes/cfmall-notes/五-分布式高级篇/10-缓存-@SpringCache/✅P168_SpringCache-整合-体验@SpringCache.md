---
title: ✅P168_SpringCache-整合-体验@SpringCache
category:
  - 谷粒商城
date: 2024-02-13
---

<!-- more -->

## SpringCache-整合&体验

### 引入依赖

```xml
        <dependency>
          <groupId>org.springframework.boot</groupId>
          <artifactId>spring-boot-starter-cache</artifactId>
        </dependency>
        
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-redis</artifactId>
        </dependency>
```

### 写配置

自动配置：

- CacheAutoConfiguration 会导入 RedisCacheConfiguration；

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/a5fee39ed836de8a2662f29ec09d4467.png#id=c8fkX&originHeight=188&originWidth=1598&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

- 会自动装配缓存管理器 RedisCacheManager；

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/cc346585340327d3be9da2273d81c257.png#id=FokbE&originHeight=545&originWidth=825&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

手动配置：

`cfmall-product/src/main/resources/application.yml`

```yaml
spring
  cache:
    type: redis	# 使用redis作为缓存
```

---

## 测试使用缓存

### 开启缓存功能

启动类`CfmallProductApplication`上添加`@EnableCaching`注解

### 方法添加`@Cacheable`注解

为需要使用缓存功能的方法添加`@Cacheable({"category"})`注解，并指定分区（最好按照业务进行分区）

代表当前方法的结果需要缓存。如果缓存中有，方法不用调用。如果缓存中没有，会调用方法，最后将方法的结果放入缓存。

```java
@Cacheable(value = {"category"})
@Override
public List<CategoryEntity> listCategory() {
    System.out.println("listCategory......从数据库查询一级类目");
    List<CategoryEntity> categoryEntityList = this.baseMapper.selectList(new QueryWrapper<CategoryEntity>().eq("parent_cid", 0));
    return categoryEntityList;
}
```

**测试结果**

多次访问：[http://localhost:8200/](http://localhost:8200/)

发现只打印了一次"listCategory......从数据库查询一级类目"，有了缓存之后都能缓存中获取数据了

默认的key为：`category::SimpleKey []`；过期时间为-1，永久有效

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202312/64ad9c83e8b27515c8266c9cfde83758.png#id=vId3o&originHeight=273&originWidth=1054&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

---

## 总结

1. 每一个需要缓存的数据我们都来指定要放到那个名字的缓存。【缓存的分区(按照业务类型分)】
2. `@Cacheable({"category"})`：代表当前方法的结果需要缓存，如果缓存中有，方法都不用调用，如果缓存中没有，会调用方法。最后将方法的结果放入缓存
3. 默认行为
- 如果缓存中有，方法不再调用
- key是默认生成的缓存的名字：`category::SimpleKey []`
- 缓存的value值，默认使用jdk序列化机制，将序列化的数据存到redis中
- 默认过期时间-1，永不过期
