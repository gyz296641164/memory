---
title: ✅P229-2_Spring Session原理简析
category:
  - 谷粒商城
date: 2024-02-14
---

<!-- more -->

## 开篇

参考：[Spring-Session 原理简析](https://zhuanlan.zhihu.com/p/246344640)

在集群系统中，经常需要将 Session 进行共享。不然会出现这样一个问题：用户在系统A上登陆以后，假如后续的一些操作被负载均衡到系统B上面，系统B发现本机上没有这个用户的 Session ，会强制让用户重新登陆。此时用户会很疑惑，自己明明登陆过了，为什么还要自己重新登陆？

---

## 什么是 Session

这边再普及下 Session 的概念：Session 是服务器端的一个 Key-Value 的数据结构，经常和 Cookie 配合，保持用户的登陆会话。客户端在第一次访问服务端的时候，服务端会响应一个 SessionId 并且将它存入到本地 Cookie 中，在之后的访问中浏览器会将 Cookie 中的 sessionId 放入到请求头中去访问服务器，如果通过这个 SessionId 没有找到对应的数据那么服务器会创建一个新的SessionId并且响应给客户端。

---

## 分布式 Session 的解决方案

最后一种方案是本文要介绍的重点。

- 使用 Cookie 来完成（很明显这种不安全的操作并不可靠，用户信息全都暴露在浏览器端）；
- 使用 Nginx 中的 IP 绑定策略（Ip_Hash），同一个 IP 只能在指定的同一个机器访问（单台机器的负载可能很高，水平添加机器后，请求可能会被重新定位到一台机器上还是会导致 Session 不能顺利共享）；
- 利用数据库同步 Session（本质上和本文推荐的存在 Redis 中是一样的，但是效率没有存放在 Redis 中高）；
- 使用 Tomcat 内置的 Session 同步（同步可能会产生延迟）；
- 使用 Token 代替 Session（也是比较推荐的方案，但不是本文的重点）；
- **本文推荐使用 Spring-Session 集成好的解决方案，将Session存放在Redis中进行共享**。

---

## Spring Session使用方式

添加依赖

```xml
<dependency>
    <groupId>org.springframework.session</groupId>
    <artifactId>spring-session-data-redis</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.session</groupId>
    <artifactId>spring-session</artifactId>
</dependency>
```

添加注解@EnableRedisHttpSession

```java
@Configuration
@EnableRedisHttpSession(maxInactiveIntervalInSeconds = 86400*30)
public class RedisSessionConfig {
}
```

`maxInactiveIntervalInSeconds`: 设置 Session 失效时间，使用 Redis Session 之后，原 Spring Boot 的 server.session.timeout 属性不再生效。

经过上面的配置后，Session 调用就会自动去Redis存取。另外，想要达到 Session 共享的目的，只需要在其他的系统上做同样的配置即可。

---

## Spring Session Redis原理简析

看了上面的配置，我们知道开启 Redis Session 的“秘密”在 @EnableRedisHttpSession 这个注解上。打开 @EnableRedisHttpSession 的源码：

```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
@Documented
@Import(RedisHttpSessionConfiguration.class)
@Configuration
public @interface EnableRedisHttpSession {
    //Session默认过期时间,秒为单位，默认30分钟
    int maxInactiveIntervalInSeconds() default MapSession.DEFAULT_MAX_INACTIVE_INTERVAL_SECONDS;
    //配置key的namespace，默认的是spring:session，如果不同的应用共用一个redis，应该为应用配置不同的namespace，这样才能区分这个Session是来自哪个应用的
    String redisNamespace() default RedisOperationsSessionRepository.DEFAULT_NAMESPACE;
    //配置刷新Redis中Session的方式，默认是ON_SAVE模式，只有当Response提交后才会将Session提交到Redis
    //这个模式也可以配置成IMMEDIATE模式，这样的话所有对Session的更改会立即更新到Redis
    RedisFlushMode redisFlushMode() default RedisFlushMode.ON_SAVE;
    //清理过期Session的定时任务默认一分钟一次。
   String cleanupCron() default RedisHttpSessionConfiguration.DEFAULT_CLEANUP_CRON;
}
```

这个注解的主要作用是注册一个 SessionRepositoryFilter，这个 Filter 会拦截所有的请求，对 Session 进行操作，具体的操作细节会在后面讲解，这边主要了解这个注解的作用是注册 SessionRepositoryFilter 就行了。注入 SessionRepositoryFilter 的代码在 RedisHttpSessionConfiguration 这个类中。

```java
@Configuration
@EnableScheduling
public class RedisHttpSessionConfiguration extends SpringHttpSessionConfiguration
        implements BeanClassLoaderAware, EmbeddedValueResolverAware, ImportAware,
        SchedulingConfigurer {
            ...
}
```

RedisHttpSessionConfiguration 继承了 SpringHttpSessionConfiguration，SpringHttpSessionConfiguration 中注册了 SessionRepositoryFilter。见下面代码。

```java
@Configuration
public class SpringHttpSessionConfiguration implements ApplicationContextAware {
    ...
    @Bean
    public <S extends Session> SessionRepositoryFilter<? extends Session> springSessionRepositoryFilter(
            SessionRepository<S> sessionRepository) {
        SessionRepositoryFilter<S> sessionRepositoryFilter = new SessionRepositoryFilter<>(sessionRepository);
        sessionRepositoryFilter.setServletContext(this.servletContext);
        sessionRepositoryFilter.setHttpSessionIdResolver(this.httpSessionIdResolver);
        return sessionRepositoryFilter;
    }
     ...
}
```

我们发现注册 SessionRepositoryFilter 时需要一个 SessionRepository 参数，这个参数是在 RedisHttpSessionConfiguration 中被注入进入的。

```java
@Configuration
@EnableScheduling
public class RedisHttpSessionConfiguration extends SpringHttpSessionConfiguration
        implements BeanClassLoaderAware, EmbeddedValueResolverAware, ImportAware,SchedulingConfigurer {

  @Bean
    public RedisOperationsSessionRepository sessionRepository() {
        RedisTemplate<Object, Object> redisTemplate = createRedisTemplate();
        RedisOperationsSessionRepository sessionRepository = new RedisOperationsSessionRepository(redisTemplate);
        sessionRepository.setApplicationEventPublisher(this.applicationEventPublisher);
        if (this.defaultRedisSerializer != null) {
            sessionRepository.setDefaultSerializer(this.defaultRedisSerializer);
        }
        sessionRepository.setDefaultMaxInactiveInterval(this.maxInactiveIntervalInSeconds);
        if (StringUtils.hasText(this.redisNamespace)) {
            sessionRepository.setRedisKeyNamespace(this.redisNamespace);
        }
        sessionRepository.setRedisFlushMode(this.redisFlushMode);
        int database = resolveDatabase();
        sessionRepository.setDatabase(database);
        return sessionRepository;
    }    
}
```

上面主要讲的就是 Spring-Session 会自动注册一个 SessionRepositoryFilter ，这个过滤器会拦截所有的请求。下面就具体看下这个过滤器对拦截下来的请求做了哪些操作。

SessionRepositoryFilter 拦截到请求后，会先将 request 和 response 对象转换成 Spring 内部的包装类 SessionRepositoryRequestWrapper 和 SessionRepositoryResponseWrapper 对象。SessionRepositoryRequestWrapper 类重写了原生的`getSession`方法。代码如下：

```java
@Override
public HttpSessionWrapper getSession(boolean create) {
  //通过request的getAttribue方法查找CURRENT_SESSION属性，有直接返回
  HttpSessionWrapper currentSession = getCurrentSession();
  if (currentSession != null) {
    return currentSession;
  }
  //查找客户端中一个叫SESSION的cookie，通过sessionRepository对象根据SESSIONID去Redis中查找Session
  S requestedSession = getRequestedSession();
  if (requestedSession != null) {
    if (getAttribute(INVALID_SESSION_ID_ATTR) == null) {
      requestedSession.setLastAccessedTime(Instant.now());
      this.requestedSessionIdValid = true;
      currentSession = new HttpSessionWrapper(requestedSession, getServletContext());
      currentSession.setNew(false);
      //将Session设置到request属性中
      setCurrentSession(currentSession);
      //返回Session
      return currentSession;
    }
  }
  else {
    // This is an invalid session id. No need to ask again if
    // request.getSession is invoked for the duration of this request
    if (SESSION_LOGGER.isDebugEnabled()) {
      SESSION_LOGGER.debug(
        "No session found by id: Caching result for getSession(false) for this HttpServletRequest.");
    }
    setAttribute(INVALID_SESSION_ID_ATTR, "true");
  }
  //不创建Session就直接返回null
  if (!create) {
    return null;
  }
  if (SESSION_LOGGER.isDebugEnabled()) {
    SESSION_LOGGER.debug(
      "A new session was created. To help you troubleshoot where the session was created we provided a StackTrace (this is not an error). You can prevent this from appearing by disabling DEBUG logging for "
      + SESSION_LOGGER_NAME,
      new RuntimeException(
        "For debugging purposes only (not an error)"));
  }
  //通过sessionRepository创建RedisSession这个对象，可以看下这个类的源代码，如果
  //@EnableRedisHttpSession这个注解中的redisFlushMode模式配置为IMMEDIATE模式，会立即
  //将创建的RedisSession同步到Redis中去。默认是不会立即同步的。
  S session = SessionRepositoryFilter.this.sessionRepository.createSession();
  session.setLastAccessedTime(Instant.now());
  currentSession = new HttpSessionWrapper(session, getServletContext());
  setCurrentSession(currentSession);
  return currentSession;
}
```

当调用 SessionRepositoryRequestWrapper 对象的`getSession`方法拿 Session 的时候，会先从当前请求的属性中查找`CURRENT_SESSION`属性，如果能拿到直接返回，这样操作能减少Redis操作，提升性能。

到现在为止我们发现如果`redisFlushMode`配置为 ON_SAVE 模式的话，Session 信息还没被保存到 Redis 中,那么这个同步操作到底是在哪里执行的呢？

仔细看代码，我们发现 SessionRepositoryFilter 的`doFilterInternal`方法最后有一个 finally 代码块，这个代码块的功能就是将 Session同步到 Redis。

```java
@Override
protected void doFilterInternal(HttpServletRequest request,HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
  request.setAttribute(SESSION_REPOSITORY_ATTR, this.sessionRepository);
  SessionRepositoryRequestWrapper wrappedRequest = new SessionRepositoryRequestWrapper(
    request, response, this.servletContext);
  SessionRepositoryResponseWrapper wrappedResponse = new SessionRepositoryResponseWrapper(
    wrappedRequest, response);
  try {
    filterChain.doFilter(wrappedRequest, wrappedResponse);
  }
  finally {
    //将Session同步到Redis，同时这个方法还会将当前的SESSIONID写到cookie中去，同时还会发布一
    //SESSION创建事件到队列里面去
    wrappedRequest.commitSession();
  }
}
```

---

## 简单总结

主要的核心类有：

- @EnableRedisHttpSession：开启 Session 共享功能；
- RedisHttpSessionConfiguration：配置类，一般不需要我们自己配置，主要功能是配置 SessionRepositoryFilter 和 RedisOperationsSessionRepository 这两个Bean；
- SessionRepositoryFilter：拦截器，Spring-Session 框架的核心；
- RedisOperationsSessionRepository：可以认为是一个 Redis 操作的客户端，有在 Redis 中进行增删改查 Session 的功能；
- SessionRepositoryRequestWrapper：Request 的包装类，主要是重写了`getSession`方法
- SessionRepositoryResponseWrapper：Response的包装类。

原理简要总结：

当请求进来的时候，SessionRepositoryFilter 会先拦截到请求，将 request 和 response 对象转换成 SessionRepositoryRequestWrapper 和 SessionRepositoryResponseWrapper 。后续当第一次调用 request 的getSession方法时，会调用到 SessionRepositoryRequestWrapper 的`getSession`方法。这个方法是被从写过的，逻辑是先从 request 的属性中查找，如果找不到；再查找一个key值是"SESSION"的 Cookie，通过这个 Cookie 拿到 SessionId 去 Redis 中查找，如果查不到，就直接创建一个RedisSession 对象，同步到 Redis 中。

说的简单点就是：拦截请求，将之前在服务器内存中进行 Session 创建销毁的动作，改成在 Redis 中创建。
