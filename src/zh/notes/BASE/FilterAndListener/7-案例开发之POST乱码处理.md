---
title: 7-案例开发之POST乱码处理
category:
  - Filter
order: 7
date: 2024-02-11
---

<!-- more -->

# login.jsp

```jsp
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<!DOCTYPE html>
<html>
<head>
    <title>JSP - Hello World</title>
</head>
<body>
<form method="post" action="loginController.do">
    用户名：<input type="text" name="userNmae"><br/>
    密码：<input type="password" name="passWord"><br/>
    <input type="submit" value="提交">
</form>
</body>
</html>
```

---

# servlet

```java
package com.gyz.controller.login;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * @author: gongyuzhuo
 * @since: 2024-02-10 17:02
 * @description:
 */
@WebServlet(urlPatterns = "/loginController.do")
public class LoginController extends HttpServlet {
    @Override
    protected void service(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        // 获取用户名和密码
        String user = req.getParameter("userNmae");
        String pwd = req.getParameter("passWord");
        System.out.println(user);
        System.out.println(pwd);
    }
}
```

---

# 过滤器

```java
package com.gyz.controller.filter;

import javax.servlet.*;
import java.io.IOException;

/**
 * @author: gongyuzhuo
 * @since: 2024-02-10 17:03
 * @description:
 */
public class Filter0_EncodingFilter implements Filter {

    private String charset;

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        charset = filterConfig.getInitParameter("charset");
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        response.setCharacterEncoding(charset);
        chain.doFilter(request, response);
    }

    @Override
    public void destroy() {
    }
}
```

---

# 配置过滤器

```xml
<?xml version="1.0" encoding="UTF-8"?>
<web-app xmlns="http://xmlns.jcp.org/xml/ns/javaee"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://xmlns.jcp.org/xml/ns/javaee http://xmlns.jcp.org/xml/ns/javaee/web-app_4_0.xsd"
         version="4.0">

    <filter>
        <filter-name>loginFilter</filter-name>
        <filter-class>com.gyz.controller.filter.Filter0_EncodingFilter</filter-class>
        <init-param>
            <param-name>charset</param-name>
            <param-value>UTF-8</param-value>
        </init-param>
    </filter>

    <filter-mapping>
        <filter-name>loginFilter</filter-name>
        <url-pattern>*.do</url-pattern>
    </filter-mapping>
</web-app>
```

---

# 测试

访问：http://localhost:8088/filterDemo3_war_exploded/login.jsp

用户名、密码输入：hsg

控制台打印如下：

![image-20240210175352516](https://studyimages.oss-cn-beijing.aliyuncs.com/img/FilterAndListener/202402/4023ef8d92b4b34f.png)