---
title: ✅P263_商城业务-订单服务-整合SpringSession
category:
  - 谷粒商城
date: 2024-02-14
---

<!-- more -->

## 导入依赖

Redis默认使用lettuce作为客户端可能导致内存泄漏，因此需要排除lettuce依赖，使用jedis作为客户端或者使用高版本的Redis依赖即可解决内存泄漏问题

`cfmall-product/pom.xml`

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
    <exclusions>
        <exclusion>
            <groupId>io.lettuce</groupId>
            <artifactId>lettuce-core</artifactId>
        </exclusion>
    </exclusions>
</dependency>
<dependency>
    <groupId>redis.clients</groupId>
    <artifactId>jedis</artifactId>
</dependency>
```

---

## application.yml配置

### 配置Redis

`cfmall-order/src/main/resources/application.yml`

```java
spring:
  //省略其它代码...
  redis:
    host: 192.168.17.130
    port: 6379
```

### 配置Session的存储类型

`cfmall-order/src/main/resources/application.properties`

```
# 会话存储类型
spring.session.store-type=redis
```

---

## Session配置类

`cfmall-order/src/main/java/com/gyz/cfmall/order/config/CfMallSessionConfig.java`

```java
package com.gyz.cfmall.order.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializer;
import org.springframework.session.web.http.CookieSerializer;
import org.springframework.session.web.http.DefaultCookieSerializer;

/**
 * @author gong_yz
 * @Description
 */
@Configuration
public class CfMallSessionConfig {

    /**
     * 方法作用域，解决子域共享问题
     *
     * @return
     */
    @Bean
    public CookieSerializer cookieSerializer() {
        DefaultCookieSerializer cookieSerializer = new DefaultCookieSerializer();
        cookieSerializer.setCookieName("CFMALLSESSION");
        cookieSerializer.setDomainName("cfmall.com");
        return cookieSerializer;
    }

    /**
     * 使用json序列化将对象序列化存储到redis中
     *
     * @return
     */
    @Bean
    public RedisSerializer<Object> springSessionDefaultRedisSerializer() {
        return new GenericJackson2JsonRedisSerializer();
    }
}
```

---

## 线程池配置

`cfmall-order/src/main/java/com/gyz/cfmall/order/config/MyThreadPoolConfig.java`

```java
package com.gyz.cfmall.order.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.Executors;
import java.util.concurrent.LinkedBlockingDeque;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

/**
 * @author gong_yz
 * @Description
 */
@Configuration
public class MyThreadPoolConfig {
    @Bean
    public ThreadPoolExecutor threadPoolExecutor(ThreadPoolConfigProperties properties) {
        return new ThreadPoolExecutor(
                //核心线程数
                properties.getCorePoolSize(),
                //最大线程数
                properties.getMaxPoolSize(),
                //线程最大空闲时间
                properties.getKeepAliveTime(),
                //时间单位
                TimeUnit.SECONDS,
                //阻塞队列
                new LinkedBlockingDeque<>(100000),
                //线程创建工厂
                Executors.defaultThreadFactory(),
                //拒绝策略
                new ThreadPoolExecutor.AbortPolicy()
        );
    }
}
```

`cfmall-order/src/main/java/com/gyz/cfmall/order/config/ThreadPoolConfigProperties.java`

```java
package com.gyz.cfmall.order.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * @author gong_yz
 * @Description
 */
@ConfigurationProperties(prefix = "cfmall.thread")
@Data
@Component
public class ThreadPoolConfigProperties {
    /**
     * 核心线程数
     */
    private Integer corePoolSize;
    /**
     * 最大线程数
     */
    private Integer maxPoolSize;
    /**
     * 线程最大空闲时间
     */
    private Integer keepAliveTime;
}
```

`cfmall-order/src/main/resources/application.properties`

```properties
cfmall.thread.corePoolSize=20
cfmall.thread.maxPoolSize=200
cfmall.thread.keepAliveTime=10
```

---

## @EnableRedisHttpSession

启动类加上@EnableRedisHttpSession注解使得Session生效

```java
@SpringBootApplication
@MapperScan("com.gyz.cfmall.order.dao")
@EnableRabbit
@EnableDiscoveryClient
@EnableRedisHttpSession
public class CfmallOrderApplication {

    public static void main(String[] args) {
        SpringApplication.run(CfmallOrderApplication.class, args);
    }

}
```

---

## 登录回显

商城首页**我的订单**路径跳转修改，

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202401/f16a7a1562a5bdb05b8deb6af53a7261.png#id=Cmjq4&originHeight=91&originWidth=598&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)
