---
title: 8_Servlet的生命周期
category:
  - Servlet
order: 8
date: 2024-02-11
---

<!-- more -->

## Servlet的生命周期概念

Servlet的生命周期是由容器管理的，分别经历四各阶段：

| 阶段     | 次数 | 时机       |
| -------- | ---- | ---------- |
| 创建     | 1次  | 第一次请求 |
| 初始化   | 1次  | 实例化之后 |
| 执行服务 | 多次 | 每次请求   |
| 销毁     | 1次  | 停止服务   |

```java
new   :实例化

init():初始化

service()：执行服务

destroy()：回收销毁
```

- 当客户端浏览器第一次请求Servlet时，容器会实例化这个Servlet，
- 然后调用一次init方法，并在新的线程中执行service方法处理请求。
- service方法执行完毕后容器不会销毁这个Servlet而是做缓存处理，
- 当客户端浏览器再次请求这个Servlet时，容器会从缓存中直接找到这个Servlet对象，并再一次在新的线程中执行Service方法。
- 当容器在销毁Servlet之前对调用一次destory方法。

在Servlet中我们一般不要轻易使用成员变量!!!! 可能会造成线程安全问题，

- 如果要使用的话，应该尽量避免对成员变量产生修改
- 如果要产生修改我们应该注意线程安全问题
- 如果我们自己添加线程安全编码处理，会严重影响效率
- 综上所述：原则，能不用成员变量就不用!!!

如下图所示，成员变量i=10所有线程共享。线程A执行i++，线程B也执行i++，起始变量是i=10；线程A自增后是11，然后线程B自增得到i=12，当线程A再次自增时发现i=12，而不是11，此时产生了线程安全问题。

![image-20240128174750556](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Servlet/202401/0820218fa1c9df41.png)

---

## Servlet生命周期演示

MyServlet4.java

```java
package com.gyz.servlet;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * @author: gongyuzhuo
 * @since: 2024-01-28 18:01
 * @description:
 */
public class MyServlet4 extends HttpServlet {

    public MyServlet4() {
        System.out.println("MyServlet4 Constructor invoked");
    }

    @Override
    public void init() throws ServletException {
        System.out.println("MyServlet4 init invoked");
    }

    @Override
    protected void service(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        System.out.println("MyServlet4 service invoked");
    }

    @Override
    public void destroy() {
        System.out.println("MyServlet4 destroy invoked");
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

	//...
    
    <servlet>
        <servlet-name>myServlet4</servlet-name>
        <servlet-class>com.gyz.servlet.MyServlet4</servlet-class>
    </servlet>
    <servlet-mapping>
        <servlet-name>myServlet4</servlet-name>
        <url-pattern>/myServlet4.do</url-pattern>
    </servlet-mapping>
</web-app>
```

运行项目，第一次请求接口：http://localhost:8099/servlet3Test_war_exploded/myServlet4.do

![image-20240128180756592](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Servlet/202401/6cf00e049494bbae.png)

- Servlet创建执行一次，
- 初始化执行一次，
- 执行服务一次

多次请求接口打印如下图所示：

![image-20240128180911060](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Servlet/202401/d7aaa59d39455b44.png)

- Servlet创建和初始化操作只会执行一次；
- 而执行服务多次

---

## Servlet实例化与初始化时机

值得注意的是，如果需要Servlet在服务启动时就实例化并初始化，我们可以在servlet的配置中添加**`load-on-startup`**配置启动顺序，配置的数字为启动顺序，应避免冲突且应>6，多次请求servlet并查看控制台输出即可印证上述结论

![image-20240128181141292](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Servlet/202401/866eb17bc8a7de84.png)

> 请求接口时Servlet实例化初始化

Servlet代码：让Servlet创建和初始化各自睡眠5s

```java
package com.gyz.servlet;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * @author: gongyuzhuo
 * @since: 2024-01-28 18:01
 * @description:
 */
public class MyServlet4 extends HttpServlet {

    public MyServlet4() {
        System.out.println("MyServlet4 Constructor invoked");
        try {
            Thread.sleep(5000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }

    @Override
    public void init() throws ServletException {
        System.out.println("MyServlet4 init invoked");
        try {
            Thread.sleep(5000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }

    @Override
    protected void service(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        System.out.println("MyServlet4 service invoked");
    }

    @Override
    public void destroy() {
        System.out.println("MyServlet4 destroy invoked");
    }
}
```

控制台打印：创建Servlet后5s，执行初始化，再5s后执行服务，然后不断请求http://localhost:8099/servlet3Test_war_exploded/myServlet4.do 接口，都是在执行服务

![image-20240128181750115](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Servlet/202401/933db5f8e6656485.png)

> 配置Servlet，项目启动时Servlet创建和初始化

```xml
    <servlet>
        <servlet-name>myServlet4</servlet-name>
        <servlet-class>com.mashibing.servlet.MyServlet4</servlet-class>
        <load-on-startup>6</load-on-startup>
    </servlet>
    <servlet-mapping>
        <servlet-name>myServlet4</servlet-name>
        <url-pattern>/myServlet4.do</url-pattern>
    </servlet-mapping>
```

重新启动项目发现，Servlet在服务启动时就实例化并初始化

![image-20240128181957298](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Servlet/202401/2bb9bef9496d9d31.png)

---

## Servlet处理请求的过程

当浏览器基于get方式请求我们创建Servlet时，我们自定义的Servlet中的doGet方法会被执行。

doGet方法能够被执行并处理get请求的原因是，容器在启动时会解析web工程中WEB-INF目录中的web.xml文件，在该文件中我们配置了Servlet与URI的绑定，容器通过对请求的解析可以获取请求资源的URI，然后找到与该URI绑定的Servlet并做实例化处理(注意：只实例化一次，如果在缓存中能够找到这个Servlet就不会再做次实例化处理)。

在实例化时会使用Servlet接口类型作为引用类型的定义，并调用一次init方法，由于HttpServlet中重写了该方法所以最终执行的是HttpServlet中init方法(HttpServlet中的Init方法是一个空的方法体)，

然后在新的线程中调用service方法。由于在HttpServlet中重写了Service方法所以最终执行的是HttpServlet中的service方法。在service方法中通过request.getMethod()获取到请求方式进行判断如果是Get方式请求就执行doGet方法，

- 如果是POST请求就执行doPost方法。
- 如果是基于GET方式提交的，并且在我们自定义的Servlet中又重写了HttpServlet中的doGet方法，那么最终会根据Java的多态特性转而执行我们自定义的Servlet中的doGet方法。