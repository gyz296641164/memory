---
title: 2_Servlet初识
category:
  - Servlet
order: 2
date: 2024-02-11
---

<!-- more -->

## Servlet开发流程

在后台随机生成一个整数

当浏览器请求一个Servlet时

如果生成的是奇数,返回"happy new year"

如果生成的是偶数,返回"happy birthday"

---

## 创建JAVAWEB项目

### 新建Project

![image-20240114224435391](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Servlet/202401/6d464f623fe4f26a.png)

点击Finish完成；

创建子Moudle：servlet1Test，目录如下：

![image-20240114224809476](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Servlet/202401/3a2260be82831bcf.png)

### 配置Tomcat

第一步：选择Edit Configurations...

![image-20240114224636502](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Servlet/202401/48b8451d4041f09a.png)

第二步：配置端口、URL等信息

![image-20240114225041431](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Servlet/202401/cfb4d4c7677c9c61.png)

编写完新代码进行编译部署操作

![image-20240114214402530](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Servlet/202401/64048d6c7f330840.png)

第三步：配置Deployment

![image-20240114225427482](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Servlet/202401/5cd64e9f37f4a597.png)

点击Ok后底部的Application context：/servlet1Test_war_exploded  名称为自动生成，改成/servlet1Test也可，没有关系；

第四步：创建index.html，随意编写内容，启动项目；

---

## 编写Servlet

> **1、在项目中开发一个自己的Servlet ,继承HttpServlet 类**

![image-20240114225738373](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Servlet/202401/72114356c48a3be5.png)

一定要查看External Libraries 中有 Tomcat中的两个JAR  jsp-api  servlet-api；

> **2、重写service方法**

![image-20240114225946822](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Servlet/202401/054c29d99aeaa453.png)

如果我们想获得请求中的信息,就要通过HttpServetRequest对象获得；

如果我们想给浏览器响应一些信息,就要通过HttpServletResponse对象响应；

在service方法中定义具体的功能代码：

```java
package com.gyz.servlet;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.Random;

/**
 * @author: gongyuzhuo
 * @description:
 */
public class MyServlet extends HttpServlet {

    @Override
    protected void service(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        int num = new Random().nextInt();
        String message = num % 2 == 0 ? "happy birthday" : "happy new year";
        String decoration = "<h1 style='color:\"red\"'>" + message + "</h1>";
        PrintWriter writer = response.getWriter();
        writer.write(decoration);
    }
}
```

> **3、在web.xml中配置Servlet的映射路径**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<web-app xmlns="http://xmlns.jcp.org/xml/ns/javaee"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://xmlns.jcp.org/xml/ns/javaee http://xmlns.jcp.org/xml/ns/javaee/web-app_4_0.xsd"
         version="4.0">

    <servlet>
        <!--        自定义servlet名称-->
        <servlet-name>myServlet</servlet-name>
        <!--        servlet实体类位置-->
        <servlet-class>com.gyz.servlet.MyServlet</servlet-class>
    </servlet>

    <servlet-mapping>
        <!--        指定上方自定义的servlet名称-->
        <servlet-name>myServlet</servlet-name>
        <!--        自定义的名称，访问url使用-->
        <url-pattern>/myservlet.do</url-pattern>
    </servlet-mapping>
</web-app>
```

> **4、打开浏览器请求Servlet资源**

![image-20240114230432415](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Servlet/202401/1b52866c79e60403.png)

