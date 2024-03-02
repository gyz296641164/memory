---
title: 02_初探SpringMVC源码
category:
  - SpringMVC
date: 2024-03-02
---

<!-- more -->

上篇文章我们通过手写分析了SpringMVC中的Controller的两种实现方式。接下来我们来看看在SpringMVC中具体是如何使用的。

## 一、基于Controller接口

### 1. 案例代码

引入相关的依赖

```xml
<!-- https://mvnrepository.com/artifact/org.springframework/spring-webmvc -->
    <dependency>
      <groupId>org.springframework</groupId>
      <artifactId>spring-webmvc</artifactId>
      <version>5.3.18</version>
    </dependency>
    <!-- https://mvnrepository.com/artifact/javax.servlet/javax.servlet-api -->
    <dependency>
      <groupId>javax.servlet</groupId>
      <artifactId>javax.servlet-api</artifactId>
      <version>3.0.1</version>
      <scope>provided</scope>
    </dependency>
```

然后创建自定义的Controller

```java
/**
 * 自定义控制器
 * 必须实现Controller接口
 * @author dpb【波波烤鸭】
 *
 */
public class UserController implements Controller{

    @Override
    public ModelAndView handleRequest(HttpServletRequest request, HttpServletResponse response) throws Exception {
        System.out.println("本方法被调用了...");
        ModelAndView view = new ModelAndView();
        view.setViewName("/index.jsp");
        return view;
    }
}
```

然后添加SpringMVC的配置文件

```xml
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
 http://www.springframework.org/schema/beans/spring-beans.xsd">

    <!-- 处理器映射器 将bean的name作为url进行查找 ，
                  需要在配置Handler时指定beanname（就是url） 所有的映射器都实现
         HandlerMapping接口。
     -->
    <bean class="org.springframework.web.servlet.handler.BeanNameUrlHandlerMapping" />

    <!-- 配置 Controller适配器 -->
    <bean class="org.springframework.web.servlet.mvc.SimpleControllerHandlerAdapter"></bean>

    <bean name="/hello.action" class="com.boge.controller.UserController" />
</beans>
```

我们需要在配置文件中配置对应的 `HandlerMapping`和 `HandlerAdapter`

最后在web.xml中配置下前端控制器就可以了

```xml
<?xml version="1.0" encoding="UTF-8"?>
<web-app xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://java.sun.com/xml/ns/javaee" xsi:schemaLocation="http://java.sun.com/xml/ns/javaee http://java.sun.com/xml/ns/javaee/web-app_3_0.xsd" id="WebApp_ID" version="3.0">
  <display-name>test</display-name>
  <welcome-file-list>
    <welcome-file>index.html</welcome-file>
    <welcome-file>index.htm</welcome-file>
    <welcome-file>index.jsp</welcome-file>
    <welcome-file>default.html</welcome-file>
    <welcome-file>default.htm</welcome-file>
    <welcome-file>default.jsp</welcome-file>
  </welcome-file-list>

  <!-- 配置前端控制器 -->
  <!-- contextConfigLocation配置springmvc加载的配置文件（配置处理器映射器、适配器等等）
  	如果不配置contextConfigLocation，
  	默认加载的是/WEB-INF/servlet名称-serlvet.xml（springmvc-servlet.xml）
  	 -->
  <servlet>
    <servlet-name>springmvc</servlet-name>
    <servlet-class>org.springframework.web.servlet.DispatcherServlet</servlet-class>
    <init-param>
      <param-name>contextConfigLocation</param-name>
      <param-value>classpath:spring-mvc.xml</param-value>
    </init-param>
  </servlet>

  <servlet-mapping>
    <servlet-name>springmvc</servlet-name>
    <url-pattern>/</url-pattern>
  </servlet-mapping>
</web-app>


```

然后就可以启动服务来访问了

### 2. 源码分析

通过上面的案例分析，我们可以看的出来在 `web.xml`中配置了一个 `Servlet`当用户请求到来的时候都会拦截处理。所以我们通过DispatcherServlet来作为入口分析。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Mybatis/202402/fb74188caa8e2e2a.png)

既然是一个Servlet。我们就需要分析对应的生命周期的方法

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Mybatis/202402/770099e106eedabb.png)

#### 2.1 init方法

init方法中会完成相关的初始化操作。我们来看看完成了哪些初始化的操作。我们可以直接进入到FrameworkServlet的 `initServletBean()`方法中查看 `initWebApplicationContext()`方法中。

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Mybatis/202402/5e4faf7151b66829.png)

进入后：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Mybatis/202402/bff602a848b4854b.png)

上面的IoC容器的初始化过程前面介绍Spring的时候重点讲解过，先不关注。直接看 `onRefresh`方法

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Mybatis/202402/9327921213572f5b.png)

我们看下 `initHandlerMapping`方法。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Mybatis/202402/fec5711034657cb7.png)

上面的代码我们可以看到逻辑很简单，会先读取xml文件中配置的HandlerMapping类型的信息，如果没有就读取默认的。案例中我们配置的有

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Mybatis/202402/5933fa075fb4f990.png)

如果没有配置的逻辑为就会读取 DispatcherServlet.properties 文件中内容

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Mybatis/202402/2e1be12c3fbdb673.png)

DispatcherServlet.properties中的信息为：

```properties
# Default implementation classes for DispatcherServlet's strategy interfaces.
# Used as fallback when no matching beans are found in the DispatcherServlet context.
# Not meant to be customized by application developers.

org.springframework.web.servlet.LocaleResolver=org.springframework.web.servlet.i18n.AcceptHeaderLocaleResolver

org.springframework.web.servlet.ThemeResolver=org.springframework.web.servlet.theme.FixedThemeResolver

org.springframework.web.servlet.HandlerMapping=org.springframework.web.servlet.handler.BeanNameUrlHandlerMapping,\
	org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping,\
	org.springframework.web.servlet.function.support.RouterFunctionMapping

org.springframework.web.servlet.HandlerAdapter=org.springframework.web.servlet.mvc.HttpRequestHandlerAdapter,\
	org.springframework.web.servlet.mvc.SimpleControllerHandlerAdapter,\
	org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerAdapter,\
	org.springframework.web.servlet.function.support.HandlerFunctionAdapter


org.springframework.web.servlet.HandlerExceptionResolver=org.springframework.web.servlet.mvc.method.annotation.ExceptionHandlerExceptionResolver,\
	org.springframework.web.servlet.mvc.annotation.ResponseStatusExceptionResolver,\
	org.springframework.web.servlet.mvc.support.DefaultHandlerExceptionResolver

org.springframework.web.servlet.RequestToViewNameTranslator=org.springframework.web.servlet.view.DefaultRequestToViewNameTranslator

org.springframework.web.servlet.ViewResolver=org.springframework.web.servlet.view.InternalResourceViewResolver

org.springframework.web.servlet.FlashMapManager=org.springframework.web.servlet.support.SessionFlashMapManager
```

到这我们就清楚了init方法做了两件事情

1. 完成了IoC的初始化
2. 完成了SpringMVC核心组件的初始化

#### 2.2 service方法

service方法是在用户请求到来的时候触发的。也就是具体处理请求的方法。我们来看下，直接进入到doDispatch方法中

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Mybatis/202402/830987ffe9409039.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Mybatis/202402/e08eedf399a1b902.png)

获取对应的适配器

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Mybatis/202402/f1fa3077243cac96.png)

调用ha.handle方法

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Mybatis/202402/9a0d048a7438d165.png)

然后就进入到了自定义的控制器中了。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Mybatis/202402/4ef7206b2b4b452d.png)

#### 2.3 destory方法

在destory方法中的处理就很简单。完成IoC容器的关闭操作

```java
    public void destroy() {
        this.getServletContext().log("Destroying Spring FrameworkServlet '" + this.getServletName() + "'");
        if (this.webApplicationContext instanceof ConfigurableApplicationContext && !this.webApplicationContextInjected) {
            ((ConfigurableApplicationContext)this.webApplicationContext).close();
        }

    }
```

---

## 二、基于注解的方式

### 1.案例讲解

注解方式的使用我们需要在配置文件中添加相关的标签来开启

```java
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:context="http://www.springframework.org/schema/context"
       xmlns:mvc="http://www.springframework.org/schema/mvc"
       xsi:schemaLocation="http://www.springframework.org/schema/mvc http://www.springframework.org/schema/mvc/spring-mvc-4.3.xsd
		http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd
		http://www.springframework.org/schema/context http://www.springframework.org/schema/context/spring-context-4.3.xsd">

    <!-- 开启注解 -->
    <mvc:annotation-driven></mvc:annotation-driven>
    <!-- 开启扫描 -->
    <context:component-scan base-package="com.boge.controller"></context:component-scan>
</beans>
```

然后我们就可以在自定义控制器中通过@Controller注解和@RequestMapping注解来做方法级别的映射

```java
@Controller
@RequestMapping("/user")
public class UserController {

    @RequestMapping("/do1")
    @ResponseBody
    public String doSome1(){
        return "do1";
    }

    @RequestMapping("/do2")
    @ResponseBody
    public String doSome2(){
        return "do2";
    }
}
```

### 2.源码分析

我们可以看到添加了一个标签后就开启了注解的使用方式，那么他的内部是怎么执行的呢？因为是自定义标签，所以在SpringMVC中会提供相关的解析器。这块我们可以看下源码中的内容

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Mybatis/202402/1cb78ff250819577.png)

看到提供了一个处理器MvcNamespaceHandler。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Mybatis/202402/b5677500aa2a7d0f.png)

可以看到，对应的标签都映射了对应的解析器，也就是解析到这个标签的时候，会找到对应的解析器来解析操作。然后我们进入到 `AnnotationDrivenBeanDefinitionParser`中可以看看具体的解析逻辑。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Mybatis/202402/f2552c9c2fc00d04.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Mybatis/202402/4398c1c8c052cda7.png)

可以看到。在这块完成了核心的 `HandlerMapping`和 `HandlerAdapter`注入到了容器中。那么在DispatcherServlet中处理请求的时候就会通过对应的Handler来处理了。

这块的串联是在IoC的加载解析xml文件的逻辑中处理的。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Mybatis/202402/72b5780eafc77d11.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Mybatis/202402/19c05b7ca38326f1.png)

---

## 三、SpringBoot项目

然后我们来看下载SpringBoot项目中是怎么自动装配SpringMVC框架的，首先我们找到对应的配置类

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Mybatis/202402/23705f74f1df7dbb.png)

同时我们也需要关注下这个配置类

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Mybatis/202402/5cd5377bb3bfb787.png)

在这个配置类中注入的HandlerMapping和HandlerAdapter的具体实现类

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Mybatis/202402/fa14548666e5d112.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Mybatis/202402/6eeaf7f230aa8f87.png)

同时也注入了DispatcherServlet

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Mybatis/202402/c463aa9c636cbb51.png)
