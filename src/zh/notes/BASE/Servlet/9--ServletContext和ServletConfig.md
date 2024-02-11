---
title: 9--ServletContext和ServletConfig
category:
  - Servlet
order: 9
date: 2024-02-11
---

<!-- more -->

## ServletContext对象

### ServletContext对象介绍

ServletContext官方叫Servlet上下文。服务器会为每一个Web应用创建一个ServletContext对象。这个对象全局唯一，而且Web应用中的所有Servlet都共享这个对象。所以叫**全局应用程序共享对象**

![image-20240128185352488](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Servlet/202401/87bf4a8d0bfb01ad.png)

### ServletContext对象的作用

相对路径转绝对路径


获取容器的附加信息


读取配置信息


全局容器

### ServletContext对象的使用

获取项目的部署名

```
context.getContextPath()
```

相对路径转绝对路径(文件上传下载时需要注意)

```
context.getRealPath("path")
```

该方法可以将一个相对路径转换为绝对路径，在文件上传与下载时需要用到该方法做路径的转换。

获取容器的附加信息，返回Servlet容器的名称和版本号

```
servletContext.getServerInfo()
```

返回Servlet容器所支持Servlet的主版本号

```
servletContext.getMajorVersion()
```

返回Servlet容器所支持Servlet的主版本号

```
servletContext.getMinorVersion()
```

### 获取web.xml文件中的信息

```xml
<context-param>
    <param-name>key</param-name>
    <param-value>value</param-value>
  </context-param>
```

`servletContext.getInitParameter("key")`：该方法可以读取web.xml文件中`<context-param>`标签中的配置信息。

`servletContext.getInitParameterNames()`：该方法可以读取web.xml文件中所有`param-name`标签中的值。

### 全局容器

向全局容器中存放数据

```
servletContext.setAttribute("key",ObjectValue)
```

从全局容器中获取数据

```
servletContext.getAttribute("key")
```

根据key删除全局容器中的value

```
servletContext.removeAttribute("key")
```

### ServletContext对象生命周期

当容器启动时会创建ServletContext对象并一直缓存该对象，直到容器关闭后该对象生命周期结束。ServletContext对象的生命周期非常长，所以在使用全局容器时不建议存放业务数据。

---

## ServletConfig对象

ServletConfig对象对应web.xml文件中的`<servlet>`节点。当Tomcat初始化一个Servlet时，会将该Servlet的配置信息，封装到一个ServletConfig对象中。我们可以通过该对象读取`<servlet>`节点中的配置信息

```xml
<servlet>
    <servlet-name>servletName</servlet-name>
    <servlet-class>servletClass</servlet-class>
    <init-param>
        <param-name>key</param-name>
        <param-value>value</param-value>
    </init-param>
</servlet>
```

读取web.xml文件中`<servlet>`标签中`<init-param>`标签中的配置信息

```java
servletConfig.getInitParameter("key");
```

读取web.xml文件中当前`<servlet>`标签中所有`<init-param>`标签中的值

```java
servletConfig.getInitParameterNames();
```

---

## 测试代码

### Servlet1

```java
package com.gyz.servlet;

import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * @author: gongyuzhuo
 * @since: 2024-01-28 19:07
 * @description:
 */
public class Servlet1 extends HttpServlet {
    @Override
    protected void service(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        //获取Servlet对象的方式
        // 通过req对象
        ServletContext servletContext1 = req.getServletContext();
        // 通过继承的方法
        ServletContext servletContext2 = this.getServletContext();
        System.out.println(servletContext1 == servletContext2);
        // 获取当前项目的部署名
        String contextPath = servletContext1.getContextPath();
        System.out.println("contextPath"+contextPath);
        // 将一个相对路径转化为项目的绝对路径
        String fileUpload = servletContext1.getRealPath("fileUpload");
        System.out.println(fileUpload);
        String serverInfo = servletContext1.getServerInfo();
        System.out.println("servletInfo"+serverInfo);
        int majorVersion = servletContext1.getMajorVersion();
        int minorVersion = servletContext1.getMinorVersion();
        System.out.println(majorVersion+":"+minorVersion);
        // 获取web.xml中配置的全局的初始信息
        String username = servletContext1.getInitParameter("username");
        String password = servletContext1.getInitParameter("password");
        System.out.println(username+":"+password);
        //向ServletContext对象中增加数据 域对象
        List<String> data=new ArrayList<>();
        Collections.addAll(data,"张三","李四","王五");
        servletContext1.setAttribute("list",data);
        servletContext1.setAttribute("gender","boy");
    }
}
```

### Servlet2

```java
package com.gyz.servlet;
import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Enumeration;
import java.util.List;

/**
 * @author: gongyuzhuo
 * @since: 2024-01-28 19:07
 * @description:
 */
public class Servlet2 extends HttpServlet {
    @Override
    protected void service(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        ServletContext servletContext = this.getServletContext();
        // 获取web.xml中配置的全局的初始信息
        Enumeration<String> pnames = servletContext.getInitParameterNames();
        while(pnames.hasMoreElements()){
            String e = pnames.nextElement();
            System.out.println(e+":"+servletContext.getInitParameter(e));
        }
        List<String> list = (List<String>) servletContext.getAttribute("list");
        System.out.println(list);
        String gender = (String)servletContext.getAttribute("gender");
        System.out.println(gender);
    }
}
```

### Servlet3

```java
package com.gyz.servlet;
import javax.servlet.ServletConfig;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * @author: gongyuzhuo
 * @since: 2024-01-28 19:07
 * @description:
 */
public class Servlet3 extends HttpServlet {
    @Override
    protected void service(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        ServletConfig servletConfig = this.getServletConfig();
        System.out.println(servletConfig.getInitParameter("brand"));
        System.out.println(servletConfig.getInitParameter("screen"));
    }
}
```

### Servlet4

```java
package com.gyz.servlet;

import javax.servlet.ServletConfig;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * @author: gongyuzhuo
 * @since: 2024-01-28 19:07
 * @description:
 */
public class Servlet4 extends HttpServlet {
    @Override
    protected void service(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        ServletConfig servletConfig = this.getServletConfig();
        System.out.println(servletConfig.getInitParameter("pinpai"));
        System.out.println(servletConfig.getInitParameter("pingmu"));
    }
}
```

### web.xml配置

```xml
<?xml version="1.0" encoding="UTF-8"?>
<web-app xmlns="http://xmlns.jcp.org/xml/ns/javaee"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://xmlns.jcp.org/xml/ns/javaee http://xmlns.jcp.org/xml/ns/javaee/web-app_4_0.xsd"
         version="4.0">

    <context-param>
        <param-name>username</param-name>
        <param-value>mashibing</param-value>
    </context-param>
    <context-param>
        <param-name>password</param-name>
        <param-value>123456</param-value>
    </context-param>

    <servlet>
        <servlet-name>servlet1</servlet-name>
        <servlet-class>com.gyz.servlet.Servlet1</servlet-class>
    </servlet>
    <servlet>
        <servlet-name>servlet2</servlet-name>
        <servlet-class>com.gyz.servlet.Servlet2</servlet-class>
    </servlet>
    <servlet>
        <servlet-name>servlet3</servlet-name>
        <servlet-class>com.gyz.servlet.Servlet3</servlet-class>
        <init-param>
            <param-name>brand</param-name>
            <param-value>ASUS</param-value>
        </init-param>
        <init-param>
            <param-name>screen</param-name>
            <param-value>三星</param-value>
        </init-param>
    </servlet>
    <servlet>
        <servlet-name>servlet4</servlet-name>
        <servlet-class>com.gyz.servlet.Servlet4</servlet-class>
        <init-param>
            <param-name>pinpai</param-name>
            <param-value>联想</param-value>
        </init-param>
        <init-param>
            <param-name>pingmu</param-name>
            <param-value>京东方</param-value>
        </init-param>
    </servlet>
    <servlet-mapping>
        <servlet-name>servlet1</servlet-name>
        <url-pattern>/servlet1.do</url-pattern>
    </servlet-mapping>
    <servlet-mapping>
        <servlet-name>servlet2</servlet-name>
        <url-pattern>/servlet2.do</url-pattern>
    </servlet-mapping>
    <servlet-mapping>
        <servlet-name>servlet3</servlet-name>
        <url-pattern>/servlet3.do</url-pattern>
    </servlet-mapping>
    <servlet-mapping>
        <servlet-name>servlet4</servlet-name>
        <url-pattern>/servlet4.do</url-pattern>
    </servlet-mapping>
</web-app>
```



