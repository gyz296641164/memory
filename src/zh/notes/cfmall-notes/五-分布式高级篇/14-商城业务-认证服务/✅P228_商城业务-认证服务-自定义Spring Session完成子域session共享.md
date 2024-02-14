---
title: ✅P228_商城业务-认证服务-自定义Spring Session完成子域session共享
category:
  - 谷粒商城
date: 2024-02-14
---

<!-- more -->

## 解决子域session共享问题

> `cfmall-product`服务和`cfmall-auth-server`服务各配置一份，内容相同


> session默认使用jdk进行序列化，不方便阅读，修改为json。配置类设置session使用json序列化，并放大作用域；
> 


> 解决使用json序列化方式来序列化对象数据到redis中：
> [spring-session/SessionConfig.java at 2.4.6 · spring-projects/spring-session · GitHub](https://github.com/spring-projects/spring-session/blob/2.4.6/spring-session-samples/spring-session-sample-boot-redis-json/src/main/java/sample/config/SessionConfig.java)



```java
package com.gyz.cfmall.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializer;
import org.springframework.session.web.http.CookieSerializer;
import org.springframework.session.web.http.DefaultCookieSerializer;

@Configuration
public class CfMalllSessionConfig {

    /**
     * 放大作用域，解决子域共享问题
     *
     * @return
     */
    @Bean
    public CookieSerializer cookieSerializer() {
        DefaultCookieSerializer serializer = new DefaultCookieSerializer();
        serializer.setCookieName("CFMALLSESSION");
        serializer.setDomainName("cfmall.com");
        return serializer;
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

## Index.html修改

前端页面修改，登录用户需要进行非空判断

```html
<li>
    <a href="http://auth.cfmall.com/login.html">你好，请登录：[[${session.loginUser==null?'':session.loginUser.nickname}}]]</a>
</li>
```

清空Redis和session后重新启动测试、执行登录操作；

## 测试效果
## ![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202312/7dd3a41c350e296fb6431b974a41fb71.png#id=Gpxwi&originHeight=170&originWidth=1081&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)
