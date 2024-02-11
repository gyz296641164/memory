---
title: 5_HttpServletResponse
category:
  - Servlet
order: 5
date: 2024-02-11
---

<!-- more -->

## 回顾http响应

http响应部分可以分为三部分：**响应行**，**响应头**，**响应体**  

---

## 1.响应行

响应协议    状态码 状态描述

HTTP/1.1   200     OK

响应状态码列表如下

![image-20240128142013519](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Servlet/202401/b6bc5c5c6744cda8.png)

---

## 2. 响应头

Content-Type:响应内容的类型(MIME) 

![image-20240128142046253](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Servlet/202401/531544c6ecc5e413.png)

---

## 3.响应实体

服务器响应回来的内容 

### 3.1 HttpServletResponse

HttpServletResponse对象代表服务器的响应。这个对象中封装了响应客户端浏览器的流对象，以及向客户端浏览器响应的响应头、响应数据、响应状态码等信息。

### 3.2 响应的设置

#### 3.2.1 ContentType响应头

`resp.setContentType("MIME")`：该方法可通过MIME-Type设置响应类型。

MIME的全称是Multipurpose Internet Mail Extensions，即多用途互联网邮件扩展类型。

这是HTTP协议中用来定义文档性质及格式的标准。对HTTP传输内容类型进行了全面定义。

**服务器通过MIME告知响应内容类型，而浏览器则通过MIME类型来确定如何处理文档**。

| Type                                 | Meaning                          |
| ------------------------------------ | -------------------------------- |
| application/msword                   | Microsoft Word document          |
| application/octet-stream             | Unrecognized or binary data      |
| application/pdf                      | application/pdf                  |
| application/postscript               | PostScript file                  |
| application/vnd.lotus-notes          | Lotus Notes file                 |
| application/vnd.ms-excel             | Excel spreadsheet                |
| application/vnd.ms-powerpoint        | PowerPoint presentation          |
| application/x-gzip                   | Gzip archive                     |
| application/x-java-archive           | JAR file                         |
| application/x-java-serialized-object | Serialized Java object           |
| application/x-java-vm                | Java bytecode (.class) file      |
| application/zip                      | Zip archive                      |
| application/json                     | JSON                             |
| audio/basic                          | Sound file in .au or .snd format |
| audio/midi                           | MIDI sound file                  |
| audio/x-aiff                         | AIFF sound file                  |
| audio/x-wav                          | Microsoft Windows sound file     |
| image/gif                            | GIF image                        |
| image/jpeg                           | JPEG image                       |
| ...                                  | ...                              |

#### 3.2.2 设置字符型响应

常见的字符型响应类型：

`resp.setContentType("text/html")`：设置响应类型为文本型，内容含有html字符串，是默认的响应类型

`resp.setContentType("text/plain")`：设置响应类型为文本型，内容是普通文本。

`resp.setContentType("application/json")`：设置响应类型为JSON格式的字符串。

#### 3.2.3 设置字节型响应

常见的字节型响应：

`resp.setContentType("image/jpeg")`:设置响应类型为图片类型，图片类型为jpeg或jpg格式。

`resp.setContentType("image/gif")`:设置响应类型为图片类型，图片类型为gif格式。

#### 3.2.4 设置响应编码

`response.setCharacterEncoding("utf-8");`

设置服务端为浏览器产生响应的响应编码，服务端会根据此编码将响应内容的字符转换为字节。

`response.setContentType("text/html;charset=utf-8");`

设置服务端为浏览器产生响应的响应编码，服务端会根据此编码将响应内容的字符转换为字节。同时客户端浏览器会根据此编码方式显示响应内容。

#### 3.2.5 在响应中添加附加信息（文件下载）

在实现文件下载时，我们需要修改响应头，添加附加信息。

```java
response.setHeader("Content-Disposition",   "attachment; filename="+文件名);
```

`Content-Disposition:attachment`：该附加信息表示作为对下载文件的一个标识字段。不会在浏览器中显示而是直接做下载处理。

filename=文件名,表示指定下载文件的文件名。

解决文件名中文乱码问题：

```java
resp.addHeader("Content-Disposition","attachment;filename="+new String (file.getName().getBytes("gbk"),"iso-8859-1"));
```

---

## 4.测试代码

MyServlet3.java

```java
package com.gyz.servlet;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * @author: gongyuzhuo
 * @since: 2024-01-28 14:32
 * @description:
 */
public class MyServlet3 extends HttpServlet {
    @Override
    protected void service(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        // 设置响应码
        //resp.setStatus(500);
        //resp.setStatus(405, "request method not supported");
        // 设置响应头
        //resp.setHeader("Date","2022-11-11");
        // 自定义头
//         resp.setHeader("aaa", "bbb");
        // 高速浏览器响应的数据是什么? 浏览器根据此头决定 数据如何应用
        // 设置MIME类型 json  xml 文件下载  ... ...
        // resp.setHeader("content-type", "text/css");
        // 专门用于设置Content-Type 响应头
        resp.setContentType("text/html");
        resp.getWriter().write("<h1>this is tag h1</h1>");
    }
}
```

web.xml

```
<?xml version="1.0" encoding="UTF-8"?>
<web-app xmlns="http://xmlns.jcp.org/xml/ns/javaee"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://xmlns.jcp.org/xml/ns/javaee http://xmlns.jcp.org/xml/ns/javaee/web-app_4_0.xsd"
         version="4.0">

    <servlet>
        <servlet-name>myServlet3</servlet-name>
        <servlet-class>com.gyz.servlet.MyServlet3</servlet-class>
    </servlet>

    <servlet-mapping>
        <servlet-name>myServlet3</servlet-name>
        <url-pattern>/myServlet3.do</url-pattern>
    </servlet-mapping>
</web-app>
```

请求：http://localhost:8099/servlet3Test_war_exploded/myServlet3.do

![image-20240128145303097](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Servlet/202401/ee67c563f4e90059.png)