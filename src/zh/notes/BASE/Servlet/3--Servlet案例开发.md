---
title: 3_Servlet案例开发
category:
  - Servlet
order: 3
date: 2024-02-11
---

<!-- more -->

## web.xml配置欢迎页

Tomcat：`/conf/web.xml`这个配置文件中定义了所有的项目的一些默认配置信息

![image-20240115075056598](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Servlet/202401/cd4fbec65d145877.png)

其中有一项是关于欢迎页的配置

![image-20240115075128026](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Servlet/202401/37fcd515898d8d99.png)

当我们自己的项目没有指定欢迎页时，就默认遵循这个配置

当我们自己定义欢迎页，我们的项目就不在遵循`Tomcat/conf/web.xml`中欢迎的配置规则了

如下配置所示，当项目启动后，会默认访问a.html，如果a.html不存在，会访问index.html，如果index.html不存在，就会报错资源访问不到

![image-20240115075648051](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Servlet/202401/61955e9fee00c5d7.png)

---

## 案例开发需求

准备一个登录页,可以输入用户名和密码，输入完毕后向后台Servlet提交用户名和密码，Servlet接收到用户名和密码之后，校验是否正确如果正确响应Success，如果不正确响应Fail

项目结构：

![image-20240116080155401](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Servlet/202401/02f54156ef8ce7b6.png)

开发登录页：login.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Title</title>
</head>
<body>

<form method="get" action="loginServlet.do">
    <table style="margin: 0px auto" width="300px" cellpadding="0px" cellspacing="0px" border="1px">
        <tr>
            <td>用户名</td>
            <td>
                <input type="text" name="username">
            </td>
        </tr>
        <tr>
            <td>密码</td>
            <td>
                <input type="password" name="pwd">
            </td>
        </tr>
        <tr align="center">
            <td colspan="2">
                <input type="submit" value="登录">
            </td>
        </tr>
    </table>
</form>
</body>
</html>
```

开发后台Servlet，MyServlet.java

```java
package com.gyz.servlet;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * @author: gongyuzhuo
 * @since: 2024-01-16 07:31
 * @description:
 */
public class MyServlet extends HttpServlet {

    @Override
    protected void service(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        System.out.println("login servlet invoked!");

        String username = request.getParameter("username");
        String password = request.getParameter("pwd");
        String message = null;
        if (username.equals("admin") && password.equals("123456")) {
            message = "Success";
        } else {
            message = "Fail";
        }
        response.getWriter().write(message);
    }
}
```

配置Servlet：web.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<web-app xmlns="http://xmlns.jcp.org/xml/ns/javaee"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://xmlns.jcp.org/xml/ns/javaee http://xmlns.jcp.org/xml/ns/javaee/web-app_4_0.xsd"
         version="4.0">

    <servlet>
        <servlet-name>myServlet2</servlet-name>
        <servlet-class>com.gyz.servlet.MyServlet</servlet-class>
    </servlet>

    <servlet-mapping>
        <servlet-name>myServlet2</servlet-name>
        <url-pattern>/loginServlet.do</url-pattern>
    </servlet-mapping>

    <welcome-file-list>
        <welcome-file>login.html</welcome-file>
    </welcome-file-list>
</web-app>
```

测试

![image-20240116080445372](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Servlet/202401/d8a0335dbf7b3f3f.png)