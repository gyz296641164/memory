---
title: ✅P170_缓存-SpringCache-自定义缓存设置
category:
  - 谷粒商城
date: 2024-02-13
---

<!-- more -->

## 缓存-SpringCache-自定义缓存设置

### 背景

我们希望将数据保存为json格式，需要修改SpringCache的自定义配置。

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202312/1c12f22918c812b101d2f6bf4f8891c2.png#id=EuOQ1&originHeight=178&originWidth=1093&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

---

### 原理

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202312/a8b8b313680e2b6d6a760562ffb552b4.png#id=kXnbl&originHeight=198&originWidth=887&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

---

### 配置类

**注意：将**`**@EnableCaching**`**注解从**`**CfmallProductApplication**`**中移除**

`cfmall-product/src/main/java/com/gyz/cfmall/product/config/SpringCacheConfig.java`

```java
package com.gyz.cfmall.product.config;

import org.springframework.boot.autoconfigure.cache.CacheProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

/**
 * @author gong_yz
 * @EnableConfigurationProperties(CacheProperties.class) : 开启属性配置的绑定功能，否则会导致配置文件失效
 */
@Configuration
@EnableCaching
@EnableConfigurationProperties(CacheProperties.class)
public class SpringCacheConfig {
    @Bean
    RedisCacheConfiguration redisCacheConfiguration(CacheProperties cacheProperties) {
        RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig();
        // 序列化key
        config = config.serializeKeysWith(RedisSerializationContext.SerializationPair
                .fromSerializer(new StringRedisSerializer()));

        // 序列化value
        config = config.serializeValuesWith(RedisSerializationContext.SerializationPair
                .fromSerializer(new GenericJackson2JsonRedisSerializer()));

        // 其它的则还是使用默认配置
        CacheProperties.Redis redisProperties = cacheProperties.getRedis();
        if (redisProperties.getTimeToLive() != null) {
            config = config.entryTtl(redisProperties.getTimeToLive());
        }
        if (redisProperties.getKeyPrefix() != null) {
            config = config.prefixKeysWith(redisProperties.getKeyPrefix());
        }
        if (!redisProperties.isCacheNullValues()) {
            config = config.disableCachingNullValues();
        }
        if (!redisProperties.isUseKeyPrefix()) {
            config = config.disableKeyPrefix();
        }
        return config;
    }
}
```

### 自定义配置

在配置文件中新增如下配置

`cfmall-product/src/main/resources/application.properties`

```yaml
# 是否使用前缀
spring.cache.redis.use-key-prefix=true
# 指定key的前缀，不指定则使用缓存的名字作为前缀
spring.cache.redis.key-prefix=CACHE_
# 是否缓存空值，可以防止缓存穿透
spring.cache.redis.cache-null-values=true
```

### 测试

将Redis中的缓存删除，访问：http://localhost:8200/，查看Redis缓存

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202312/9b67dc9a2b8b77e981cbdbd57524a495.png#id=jXIkD&originHeight=625&originWidth=974&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

数据格式为JSON格式，过期时间3600s，key值前缀设置为CACHE_
