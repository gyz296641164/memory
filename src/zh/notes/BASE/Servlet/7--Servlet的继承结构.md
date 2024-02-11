---
title: 7_Servlet的继承结构
category:
  - Servlet
order: 7
date: 2024-02-11
---

<!-- more -->

## Servlet的继承结构

![image-20240128172209848](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Servlet/202401/9052ffe3c0ee4d73.png)

---

## Servlet接口

1.init()，创建Servlet对象后立即调用该方法完成其他初始化工作。

2.service()，处理客户端请求，执行业务操作，利用响应对象响应客户端请求。

3.destroy()，在销毁Servlet对象之前调用该方法，释放资源。

4.getServletConfig()，ServletConfig是容器向servlet传递参数的载体。

5.getServletInfo()，获取servlet相关信息

---

## ServletConfig接口

Servlet运行期间，需要一些辅助信息，这些信息可以在web.xml文件中，使用一个或多个元素，进行配置。当Tomcat初始化一个Servlet时，会将该Servlet的配置信息，封装到一个ServletConfig对象中，通过调用init(ServletConfig config)方法，将ServletConfig对称传递给Servlet。

---

## GenericServlet抽象类

GenericServlet是实现了Servlet接口的抽象类。在GenericServlet中进一步的定义了Servlet接口的具体实现，其设计的目的是为了和应用层协议解耦，在GenericServlet中包含一个Service抽象方法。我们也可以通过继承GenericServlet并实现Service方法实现请求的处理，但是需要将ServletReuqest 和 ServletResponse 转为 HttpServletRequest 和 HttpServletResponse。

---

## HttpServlet

继承自GenericServlet. 针对于处理 HTTP 协议的请求所定制。在 HttpServlet的service() 方法中已经把 ServletReuqest 和 ServletResponse 转为 HttpServletRequest 和 HttpServletResponse。 直接使用 HttpServletRequest 和HttpServletResponse, 不再需要强转。实际开发中, 直接继承 HttpServlet, 并根据请求方式复写 doXxx() 方法即可。

![image-20240128172658839](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Servlet/202401/ede2722776287e4f.png)

在我们自定义的Servlet中,如果想区分请求方式,不同的请求方式使用不同的代码处理,那么我么重写 doGet  doPost 即可
如果我们没有必要区分请求方式的差异,那么我们直接重写service方法即可。

**要么重写doGet  doPost 要么重写 service,必须二选一,而且必须进行重写**。

![image-20240128172738828](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Servlet/202401/648f294113d3865a.png)