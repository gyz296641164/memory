## 开篇

### 用户身份鉴别方式

- 当用户登录之后点击购物车，则进行用户登录
- 用户未登录的时候点击购物车，会为临时用户生成一个name为user-key的cookie临时标识，过期时间为一个月，以后每次浏览器进行访问购物车的时候都会携带user-key。user-key 是用来标识和存储临时购物车数据的

### ThreadLocal 用户身份鉴别

> **ThreadLocal-同一个线程共享数据**


- 核心原理是：`Map<Thread,Object> threadLocal`
- 在每个线程中都创建了一个 ThreadLocalMap 对象，**每个线程**可以**访问自己**内部 **ThreadLocalMap 对象**内的 value。**线程之间互不干扰**

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202304/202304201941155.png#id=nG4xS&originHeight=534&originWidth=961&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

> **user-key**在cookie里，标识用户身份，第一次使用购物车，都会给一个临时用户信息，浏览器保存cookie后，每次访问都会从cookie中取到user-key。


- 在调用购物车的接口前，先通过**session信息判断是否登录**，并分别进行用户身份信息的封装
- session有用户信息则进行用户登录
- session中没有用户信息 
   - cookie中携带 `user-key`，则表示有临时用户，把`user-key`进行用户身份信息的封装；
   - cookie中未携带 `user-key`，则表示没有临时用户，进行分配

将信息封装好放进ThreadLocal。

在调用购物车的接口后，若cookie中未携带 `user-key`，则分配临时用户，让浏览器保存。

---

## 业务实现

### pom依赖

`cfmall-cart/pom.xml`

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
<!--  SpringSession依赖  -->
<dependency>
    <groupId>org.springframework.session</groupId>
    <artifactId>spring-session-data-redis</artifactId>
</dependency>
```

### 配置Session

`cfmall-cart/src/main/java/com/gyz/cfmall/config/CfMalllSessionConfig.java`

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
     * 方法作用域，解决子域共享问题
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

### 编写传输对象与常量

`cfmall-cart/src/main/java/com/gyz/cfmall/to/UserInfoTo.java`

```java
package com.gyz.cfmall.to;

import lombok.Data;

@Data
public class UserInfoTo {
    private Long userId;
    private String userKey;
    /**
     * 是否为临时用户
     */
    private Boolean tempUser = false;
}
```

`cfmall-common/src/main/java/com/gyz/common/constant/CartConstant.java`

```java
public class CartConstant {

    public final static String TEMP_USER_COOKIE_NAME = "user-key";
    public final static int TEMP_USER_COOKIE_TIMEOUT = 60*60*24*30;
}
```

### 编写拦截器

**拦截器逻辑**

- 业务执行之前，判断是否登录，若登录则封装用户信息，将`是否为临时用户`标识位设置为true，postHandler就不再设置作用域和有效时间，否则为其创建一个user-key

**注意细节**

- 整合SpringSession之后，Session获取数据都是从Redis中获取的

使用ThreadLocal，解决线程共享数据问题，方便同一线程共享传输对象UserInfoTo

**实现逻辑**

```java
package com.gyz.cfmall.interceptor;

import com.gyz.cfmall.to.UserInfoTo;
import com.gyz.common.constant.AuthServerConstant;
import com.gyz.common.constant.CartConstant;
import com.gyz.common.vo.MemberResponseVo;
import org.apache.commons.lang.StringUtils;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.ModelAndView;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.util.UUID;

public class CartInterceptor implements HandlerInterceptor {

    public static ThreadLocal<UserInfoTo> threadLocal = new ThreadLocal<>();

    /**
     * 目标方法执行之前
     *
     * @param request
     * @param response
     * @param handler
     * @return
     */
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {

        UserInfoTo userInfoTo = new UserInfoTo();

        HttpSession session = request.getSession();
        //获得当前登录用户的信息
        MemberResponseVo memberResponseVo = (MemberResponseVo) session.getAttribute(AuthServerConstant.LOGIN_USER);

        if (memberResponseVo != null) {
            //用户登录了
            userInfoTo.setUserId(memberResponseVo.getId());
        }

        Cookie[] cookies = request.getCookies();
        if (cookies != null && cookies.length > 0) {
            for (Cookie cookie : cookies) {
                //user-key
                String name = cookie.getName();
                if (name.equals(CartConstant.TEMP_USER_COOKIE_NAME)) {
                    userInfoTo.setUserKey(cookie.getValue());
                    //标记为已是临时用户
                    userInfoTo.setTempUser(true);
                }
            }
        }

        //如果没有临时用户一定分配一个临时用户
        if (StringUtils.isEmpty(userInfoTo.getUserKey())) {
            String uuid = UUID.randomUUID().toString();
            userInfoTo.setUserKey(uuid);
        }

        //目标方法执行之前
        threadLocal.set(userInfoTo);
        return true;
    }


    /**
     * 业务执行之后，分配临时用户来浏览器保存
     *
     * @param request
     * @param response
     * @param handler
     * @param modelAndView
     */
    @Override
    public void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler, ModelAndView modelAndView) {

        //获取当前用户的值
        UserInfoTo userInfoTo = threadLocal.get();

        //如果没有临时用户一定保存一个临时用户
        if (!userInfoTo.getTempUser()) {
            //创建一个cookie
            Cookie cookie = new Cookie(CartConstant.TEMP_USER_COOKIE_NAME, userInfoTo.getUserKey());
            //扩大作用域
            cookie.setDomain("cfmall.com");
            //设置过期时间
            cookie.setMaxAge(CartConstant.TEMP_USER_COOKIE_TIMEOUT);
            response.addCookie(cookie);
        }

    }

}
```

### 配置拦截器

配置拦截器，否则拦截器不生效。

`cfmall-cart/src/main/java/com/gyz/cfmall/config/CfmallWebConfig.java`

```java
package com.gyz.cfmall.config;

import com.gyz.cfmall.interceptor.CartInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CfmallWebConfig implements WebMvcConfigurer {

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        //注册拦截器
        registry.addInterceptor(new CartInterceptor()).addPathPatterns("/**");
    }
}
```

### 编写Controller

`cfmall-cart/src/main/java/com/gyz/cfmall/controller/CartController.java`

```java
@Controller
public class CartController {
    @GetMapping("/cartList.html")
    public String listPage() {
        UserInfoTo userInfoTo = CartInterceptor.threadLocal.get();
        System.out.println(userInfoTo);
        return "cartList";
    }
}
```

---

## 测试

请求GET：[http://localhost:9100/cartList.html](http://localhost:9100/cartList.html) 接口，

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202401/8c6e8f8eedcb6f6bd65a972ff1749282.png#id=ZMZjr&originHeight=226&originWidth=706&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

通过断点的方式查看UserInfoTo结果，输出如下：

`UserInfoTo(userId=null, userKey=bc917f86-f899-42cb-8f02-e4c43bdaf75b, tempUser=false)`
