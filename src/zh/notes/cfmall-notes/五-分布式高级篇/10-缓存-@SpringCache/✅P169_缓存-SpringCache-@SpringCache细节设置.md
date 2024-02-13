---
title: ✅P169_缓存-SpringCache-@SpringCache细节设置
category:
  - 谷粒商城
date: 2024-02-13
---

<!-- more -->

## 缓存-SpringCache-@SpringCache细节设置

### 表达式语法

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/114cb586536bb94511790c719d10ab0f.png#id=VHq2x&originHeight=388&originWidth=895&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

---

## 自定义

### 指定缓存数据的存活时间

`cfmall-product/src/main/resources/application.properties`配置

```properties
# 单位：毫秒
spring.cache.redis.time-to-live=3600000 
```

### 指定生成的缓存使用的key

key 属性，接收一个SpEL表达式

```java
@Cacheable(value = {"category"},key = "#root.method.name")

@Cacheable(value = {"category"},key = "'level1Categories'")
```

示例代码
`cfmall-product/src/main/java/com/gyz/cfmall/product/service/impl/CategoryServiceImpl.java`
```java
/**
 * @Cacheable(value = {"category"}, key = "#root.method.name")
 * 代表当前方法的结果需要缓存。如果缓存中有，方法不用调用。如果缓存中没有，会调用方法，最后将方法的结果放入缓存。
 * @return
 */
@Cacheable(value = {"category"},key = "#root.method.name")
@Override
public List<CategoryEntity> listCategory() {
    System.out.println("listCategory......从数据库查询一级类目");
    List<CategoryEntity> categoryEntityList = this.baseMapper.selectList(new QueryWrapper<CategoryEntity>().eq("parent_cid", 0));
    return categoryEntityList;
}
```

访问：[http://localhost:8200/](http://localhost:8200/)，查看缓存key![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202312/45dbf0ac52b2ce6dabcb45e7dca7b4dc.png#id=Z4mTV&originHeight=305&originWidth=1079&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

```java
    @Cacheable(value = {"category"},key = "'level1Categories'")
    @Override
    public List<CategoryEntity> listCategory() {
        System.out.println("listCategory......从数据库查询一级类目");
        List<CategoryEntity> categoryEntityList = this.baseMapper.selectList(new QueryWrapper<CategoryEntity>().eq("parent_cid", 0));
        return categoryEntityList;
    }
```
![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202312/a10d4d9e9847d9ae533058731fc7ea9d.png#id=w87Y9&originHeight=316&originWidth=1095&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)
