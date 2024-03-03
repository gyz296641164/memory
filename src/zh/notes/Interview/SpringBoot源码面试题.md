# SpringBoot源码面试题

## 1.谈谈你对SpringBoot的理解

1. 为什么会出现SpringBoot：

SSM：添加相关的依赖『依赖很大。版本兼容性问题』添加各自的配置文件，还有添加相关的整合文件。web.xml中配置每个项目都得干这些事情。---》有很多重复性的工作 --》约定由于配置--》SpringBoot【脚手架】

2. SpringBoot的发展

- 2014 1.x  
- 2018  2.x  
- 2022 3.x

3. 从技术发展演变过程介绍SpringBoot ：Spring注解编程的发展

4. Spring和SpringBoot的关系

---

## 2. 介绍下SpringBoot的工作原理

SpringBoot：IoC，需要清楚Spring的加载过程

1. run方法干了什么事情 --》 IoC
2. SpringBootApplication注解做了什么事情  --》 通过EnableAutoConfiguration注解实现加载 `META-INF/spring.factories` 文件中的配置类
3. 1和2是怎么关联的

BeanFactoryPostProcessor完成对@Configuration注解的加载解析

---

## 3. 介绍下@Import注解的作用

1. @Import注解的由来： xml  import标签--> 配置类转变 3.0 @Configuration @Import替换import标签的作用  3.1 扫描注解
2. @Import注解的作用：SpringBoot的自动装配
   - 导入第三方的其他配置类 
   - 可以直接将某个Class的对象注入到容器中 @Import(User.class) 
   - 动态注入，注入的类型如果实现了下面的接口。就不会把该类型的对象注入进去
     - ImportSelector接口：把selectImports方法返回的字符串数组的类型注入到容器中
     - ImportBeanDefinitionRegistrar接口：在抽象方法中直接提供了注册器。我们在方法体中完成注入
     - ImportSelector 和 ImportBeanDefinitionRegistrar的区别

---

## 4. SpringBoot中为什么用的DeferredImportSelector?

为什么? 为什么要延迟加载？  本身逻辑代码是在BeanFactory的后置处理器中完成的

BeanFactory的后置处理器本身的作用就是要完善BeanDefinition的定义。所以我们需要在所有对应都完成了定义信息的加载后再去注入实例到容器中

---

## 5. SpringBoot和SpringMVC的关系

SpringBoot是一个基于Spring的脚手架工具。我们要创建一个Web项目。那么我们需要引入spring-boot-starter-web 这个依赖。在这个依赖中会完成相关的SpringMVC和Spring的关联配置

---

## 6. SpringBoot和Tomcat的关系

通过SpringBoot构建一个Web项目。默认依赖的Web容器就是Tomcat

---

## 7. SpringMVC的工作原理

https://cloud.fynote.com/share/s/IXvrMNIN

---

## 8. SpringSecurity中是如何实现自定义认证的

1. 回答具体的应用过程
2. SpringSecurity的工作原理：过滤器

---

## 9. SpringBoot和Spring的区别是什么

Spring是一个非常强大的企业级Java开发框架，提供了一系列模块来支持不同的应用需求，如依赖注入、面向切面编程、事务管理、Web应用程序开发等。而SpringBoot的出现，主要是起到了简化Spring应用程序的开发和部署，特别是用于构建微服务和快速开发的应用程序。

相比于Spring，SpringBoot主要在这几个方面来提升了我们使用Spring的效率，降低开发成本:

1. 自动配置：Spring Boot通过Auto-Configuration来减少开发人员的配置工作。我们可以通过依赖个starter就把一坨东西全部都依赖进来，使开发人员可以更专注于业务逻辑而不是配置。
2. 内嵌Web服务器：Spring Boot内置了常见的Web服务器(如Tomcat、Jetty)，这意味着您可以轻松创建可运行的独立应用程序，而无需外部Web服务器。
3. 约定大于配置：SpringBoot中有很多约定大于配置的思想的体现，通过一种约定的方式，来降低开发人员的配置工作。如他默认读取spring.factories来加载Starter、读取application.properties或application.yml文件来进行属性配置等。

---

## 10. SpringBoot如何做优雅停机

在Web应用开发中，确保应用可以平稳可靠的关闭是至关重要的。在我们常用的SpringBoot中其实提供了内置功能来优雅地处理应用程序的关闭的能力。

先说一下啥是优雅停机，其实他指的是以受控方式终止应用程序的过程，允许它完成任何正在进行的任务，释放资源，并确保数据的完整性。与突然终止应用程序不同，优雅停机确保所有进程都得到优雅停止，以防止潜在的数据损坏或丢失。

从Spring Boot 2.3开始，SpringBoot内置了优雅停机的功能。想要启用优雅停机也非常简单，你只需在你的application.properties文件中添加一行代码:

```
server.shutdown=graceful
```

通过这个设置，当你停止服务器时，它将不再接受新的请求。并且服务器也不会立即关闭，而是等待正在进行的请求处理完。

这个等待的时间我们是可以自定义的:

```
spring.lifecycle.timeout-per-shutdown-phase=2m
```

默认的等待时长是30秒，我们通过以上配置可以将这个等待时长延长直2分钟。

> **Spring Boot Actuator shutdown Endpoint**

想要在Spring Boot Actuator中启用优雅停机，需要做如下配置。

首先增加Maven依赖:

```
<dependency>
	<groupId>org.springframework.boot</groupId>
	<artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

然后增加配置项,

```
management.endpoints.web.exposure.include=*
management.endpoint.shutdown.enabled=true
```

要优雅停机应用，可以使用HTTP POST请求来调用关闭端点。例如，可以使用curl命令或工具来发送POST请求:

```
curl -X PosT http://localhost:8080/actuator/shutdown
```

当你发送POST请求到/actuator/shutdown时，应用将接收到关闭命令并开始进行优雅停机。应用会等待一段时间以完成正在进行的请求处理，然后关闭。
