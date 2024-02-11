---
title: 4_HttpServletRequest
category:
  - Servlet
order: 4
date: 2024-02-11
---

<!-- more -->

## 回顾http请求

一个http请求可以分为三个部分：分别是**请求行**，**请求头**，**请求体**

### 请求行

请求方式  请求的URL  协议及版本


GET  http://192.168.56.220:8080/logOnDemo/logon.html   HTTP/1.1

### 请求头

![image-20240125080556653](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Servlet/202401/4ce5b3fe1c8d874c.png)

### 请求体

get方式提交的请求数据通过地址栏提交 ,没有请求体

post方式提交请求数据单独放到请求体中,

请求时所携带的数据 (post方式)

http支持的请求方式：

![image-20240125080629239](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Servlet/202401/60650e9d8de18d5b.png)

post和get方式提交请求的差别(面试,重要)

- GET在浏览器回退时是无害的，而POST会再次提交请求。
- GET产生的URL地址可以被Bookmark，而POST不可以。
- GET请求会被浏览器主动cache，而POST不会，除非手动设置。
- GET请求只能进行url编码，而POST支持多种编码方式。
- GET请求参数会被完整保留在浏览器历史记录里，而POST中的参数不会被保留。
- GET请求在URL中传送的参数是有长度限制的，而POST则没有。对参数的数据类型GET只接受ASCII字符，而POST即可是字符也可是字节。
- GET比POST更不安全，因为参数直接暴露在URL上，所以不能用来传递敏感信息。
- GET参数通过URL传递，POST放在Request body中。

---

## HttpServletRequest

HttpServletRequest对象代表客户端浏览器的请求，当客户端浏览器通过HTTP协议访问服务器时，HTTP请求中的所有信息都会被Tomcat所解析并封装在这个对象中，通过这个对象提供的方法，可以获得客户端请求的所有信息。

### 1.获取请求行信息

```
req.getRequestURL()://返回客户端浏览器发出请求时的完整URL。

req.getRequestURI()://返回请求行中指定资源部分。

req.getRemoteAddr()://返回发出请求的客户机的IP地址。

req.getLocalAddr()://返回WEB服务器的IP地址。

req.getLocalPort()://返回WEB服务器处理Http协议的连接器所监听的端口。
```

### 2.获取请求头信息

req.getHeader("headerKey")://根据请求头中的key获取对应的value。

```
String headerValue = req.getHeader("headerKey");
```

req.getHeaderNames()://获取请求头中所有的key，该方法返回枚举类型。

```
Enumeration<String> headerNames = req.getHeaderNames();
```

测试代码

```java
public class Servlet3 extends HttpServlet {
    @Override
    protected void service(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        System.out.println(req.getRequestURL());//返回客户端浏览器发出请求时的完整URL。
        System.out.println(req.getRequestURI());//返回请求行中指定资源部分。
        System.out.println(req.getRemoteAddr());//返回发出请求的客户机的IP地址。
        System.out.println(req.getLocalAddr());//返回WEB服务器的IP地址。
        System.out.println(req.getLocalPort());//返回WEB服务器处理Http协议的连接器所监听的端口。
        System.out.println("主机名: " + req.getLocalName());
        System.out.println("客户端PORT: " + req.getRemotePort());
        System.out.println("当前项目部署名: " + req.getContextPath());
        System.out.println("协议名:"+req.getScheme());
        System.out.println("请求方式:"+req.getMethod());

        // 根据请求头名或者请求头对应的值
        System.out.println(req.getHeader("Accept"));
        // 获得全部的请求头名
        Enumeration<String> headerNames = req.getHeaderNames();
        while (headerNames.hasMoreElements()){
            String headername = headerNames.nextElement();
            System.out.println(headername+":"+req.getHeader(headername));
        }
    }
}
```

### 3.获取请求数据

在Servlet获取请求数据的方式

`req.getParameter("key"):`//根据key获取指定value。

`String str = req.getParameter("key");`

获取复选框(checkbox组件)中的值

```
//获取复选框(checkbox组件)中的值，返回一个String[]。
eq.getParameterValues("checkboxkey")

String[] userlikes = req.getParameterValues("checkboxkey");
```

获取所有提交数据的key

req.getParameterNames()://获取请求中所有数据的key，该方法返回一个枚举类型。

```
Enumeration<String> parameterNames = req.getParameterNames()
```

使用Map结构获取提交数据

req.getParameterMap()://获取请求中所有的数据并存放到一个Map结构中，该方法返回一个Map，其中key为String类型value为String[]类型。

```
Map<String, String[]> parameterMap = req.getParameterMap();
```

设置请求编码

`req.setCharacterEncoding("utf-8")`

请求的数据包基于字节在网络上传输，Tomcat接收到请求的数据包后会将数据包中的字节转换为字符。在Tomcat中使用的是ISO-8859-1的单字节编码完成字节与字符的转换，所以数据中含有中文就会出现乱码，可以通过req.setCharacterEncoding("utf-8")方法来对提交的数据根据指定的编码方式重新做编码处理。

### 4.测试代码

前端：people.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Title</title>
</head>
<body>
<!--
开发form表单注意事项
1form 不是from
2form表单内部不是所有的标签信息都会提交 一些输入信息  input select textarea ... ...
3要提交的标签必须具备name属性  name属性的作用是让后台区分数据  id便于在前端区分数据
4要提交的标签一般都要具备value属性  value属性确定我们要提交的具体的数据
5 get post
  get方式数据是通过URL携带
  提交的数据只能是文本
  提交的数据量不大
  get方式提交的数据相对不安全
  post 将数据单独打包放到请求体中
  提交的数据可以是文本可以是各种文件
  提交的数据量理论上没有上限
  post方式提交数据相对安全
  当一个表单标签
  readonly只读 也是会提交数据的
  hidden  隐藏 也是会提交数据
  disabled 不可用 显示但是不提交
-->
<form method="get" action="myServlet">
    <table style="margin: 0px auto" width="300px" cellpadding="0px" cellspacing="0px" border="1px">
        <tr>
            <td>用户名</td>
            <td>
                <input type="text" name="username" id="in1" value="12345" disabled >
            </td>
        </tr>
        <tr>
            <td>密码</td>
            <td>
                <input type="password" name="pwd">
            </td>
        </tr>
        <tr>
            <td>性别</td>
            <td>
                <input type="radio" name="gender" value="1" checked>男
                <input type="radio" name="gender" value="0">女
            </td>
        </tr>
        <tr>
            <td>爱好</td>
            <td>
                <input type="checkbox" name="hobby" value="1">蓝球
                <input type="checkbox" name="hobby" value="2">足球
                <input type="checkbox" name="hobby" value="3">羽毛球
                <input type="checkbox" name="hobby" value="4">乒乓球
            </td>
        </tr>
        <tr>
            <td>个人简介</td>
            <td>
                <!--文本域 双标签 页面上显示的文字是双标签中的文本 不是value属性
                    文本域提交的数据不是value属性值,是双标签中的文本
                -->
                <textarea name="introduce" >b</textarea>
            </td>
        </tr>
        <tr>
            <td>籍贯</td>
            <td>
                <!--
                select
                option没有定义value属性 那么就提交option中间的文字(不推荐)
                -->
                <select name="provience">
                    <option value="1">a京</option>
                    <option value="2">b津</option>
                    <option value="3">c冀</option>
                </select>
            </td>
        </tr>
        <tr align="center">
            <td colspan="2">
                <input type="submit" value="提交数据">
            </td>
        </tr>
    </table>
</form>
</body>
</html>
```

Servlet:

```java
package com.mashibing.servlet;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Arrays;
import java.util.Enumeration;
import java.util.Map;
import java.util.Set;
/**
 * @Author: Ma HaiYang
 * @Description: MircoMessage:Mark_7001
 */
public class MyServlet extends HttpServlet {
    @Override
    protected void service(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        // req获取参数
        // 如果 前端发过来的数据由数据名但是没有值, getParameter返回的是一个空字符串  ""
        // 获取的参数在提交的数据中名都没有,getParameter返回的是null
        String username = req.getParameter("username");
        System.out.println("username:"+username);
        System.out.println("password:"+req.getParameter("pwd"));
        System.out.println("gender:"+req.getParameter("gender"));
        // hobby=1&hobby=2&hobby=3 想要获得多个同名的参数 getParameterValues 返回的是一个Sting数组
        String[] hobbies = req.getParameterValues("hobby");
        System.out.println("hobbies:"+ Arrays.toString(hobbies));
        // textarea
        System.out.println("introduce:"+req.getParameter("introduce"));
        // select
        System.out.println("provience:"+req.getParameter("provience"));
        System.out.println("___________________________");
        // 如果不知道参数的名字?
        // 获取所有的参数名
        Enumeration<String> pNames = req.getParameterNames();
        while(pNames.hasMoreElements()){
            String pname = pNames.nextElement();
            String[] pValues = req.getParameterValues(pname);
            System.out.println(pname+":"+Arrays.toString(pValues));
        }
        System.out.println("________________________________");
        Map<String, String[]> pmap = req.getParameterMap();
        Set<Map.Entry<String, String[]>> entries = pmap.entrySet();
        for (Map.Entry<String, String[]> entry : entries) {
            System.out.println(entry.getKey()+":"+Arrays.toString(entry.getValue()));
        }
    }
}
```

web.xml

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

    <servlet>
        <servlet-name>testHttpRequest</servlet-name>
        <servlet-class>com.gyz.servlet.HttpServletRequestTest</servlet-class>
    </servlet>
    <servlet-mapping>
        <servlet-name>testHttpRequest</servlet-name>
        <url-pattern>/testHttpRequest.do</url-pattern>
    </servlet-mapping>
    <welcome-file-list>
        <welcome-file>people.html</welcome-file>
    </welcome-file-list>
</web-app>
```



