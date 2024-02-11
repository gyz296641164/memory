---
title: 10-Request域监听器
category:
  - Listener
order: 10
date: 2024-02-11
---

<!-- more -->

## 认识Requet域监听器

Requet域共有两个监听器接口，分别是：

- ServletRequestListener 
- ServleRequestAttributeListener

接下来我们就认识一些每个接口和接口中每个方法的用处。

---

## 定义监听器类

```java
package com.gyz.listener.listener;

import javax.servlet.*;

/**
 * @author: gongyuzhuo
 * @since: 2024-02-10 23:05
 * @description:
 */
public class MyRequestListener implements ServletRequestListener, ServletRequestAttributeListener {
    @Override
    public void requestInitialized(ServletRequestEvent sre) {
        ServletRequest servletRequest = sre.getServletRequest();
        System.out.println("request:" + servletRequest.hashCode() + "对象初始化");
    }

    @Override
    public void attributeAdded(ServletRequestAttributeEvent srae) {
        ServletRequest servletRequest = srae.getServletRequest();
        String name = srae.getName();
        Object value = srae.getValue();
        System.out.println("request" + servletRequest.hashCode() + "对象增加了数据:" + name + "=" + value);
    }

    @Override
    public void requestDestroyed(ServletRequestEvent sre) {

    }

    @Override
    public void attributeRemoved(ServletRequestAttributeEvent srae) {
        // 任何一个Request对象中调用 removeAttribute方法移除了数据都会触发该方法
        ServletRequest servletRequest = srae.getServletRequest();
        String name = srae.getName();
        Object value = srae.getValue();
        System.out.println("request" + servletRequest.hashCode() + "对象删除了数据:" + name + "=" + value);
    }

    @Override
    public void attributeReplaced(ServletRequestAttributeEvent srae) {
        // 任何一个Request对象中调用 setAttribute方法修改了数据都会触发该方法
        ServletRequest servletRequest = srae.getServletRequest();
        String name = srae.getName();
        Object value = srae.getValue();
        Object newValue = servletRequest.getAttribute(name);
        System.out.println("request" + servletRequest.hashCode() + "对象增修改了数据:" + name + "=" + value + "设置为:" + newValue);
    }
}
```

---

## 配置监听器

使用web.xml 或者通过@WebListener注解都可以

```xml
<?xml version="1.0" encoding="UTF-8"?>
<web-app xmlns="http://xmlns.jcp.org/xml/ns/javaee"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://xmlns.jcp.org/xml/ns/javaee http://xmlns.jcp.org/xml/ns/javaee/web-app_4_0.xsd"
         version="4.0">
    <listener>
        <listener-class>com.gyz.listener.listener.MyRequestListener</listener-class>
    </listener>
</web-app>
```

---

## 准备Servlet

```java
package com.gyz.listener.servlet;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * @author: gongyuzhuo
 * @since: 2024-02-10 23:22
 * @description:
 */
@WebServlet(urlPatterns = "/myServlet3.do")
public class MyServlet3 extends HttpServlet {
    @Override
    protected void service(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        req.setAttribute("name","zhangsan");
        req.setAttribute("name","lisi");
        req.removeAttribute("name");
    }
}
```

---

## 请求测试

访问接口：http://localhost:8089/listenerDemo1_war_exploded/myServlet3.do

控制台打印如下：

![image-20240211121100988](https://studyimages.oss-cn-beijing.aliyuncs.com/img/FilterAndListener/202402/94f5eac8f5ff2097.png)