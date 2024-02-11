---
title: 1_Servlet简介
category:
  - Servlet
order: 1
date: 2024-02-11
---

<!-- more -->


## Servlet介绍

Servlet是Server Applet的简称，称为服务端小程序，是JavaEE平台下的技术标准，基于Java语言编写的服务端程序。Web容器或应用服务器实现了Servlet标准所以Servlet需运行在Web容器或应用服务器中。Servlet主要功能在于能在服务器中执行并生成数据。

---

## Servlet技术特点

Servlet使用单进程多线程方式运行。

![image-20240114230812920](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Servlet/202401/41fcb71c7410ec5b.png)

---

## Servlet在应用程序中的位置

![image-20240114230834123](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Servlet/202401/3effdc5b086bc852.png)

---

## 静态资源和动态资源区分

静态资源: 每次访问都不需要运算,直接就可以返回的资源, 如HTML  CSS  JS  多媒体文件等等,每次访问获得的资源都是一样的；

动态资源：每次访问都需要运算代码生成的资源,如Servlet JSP ,每次访问获得的结果可能都是不一样的；

Servlet作为一种动态资源技术,是我们后续学习框架的基础；

---

## Servlet在程序中到底处于一个什么地位

Servlet是可以接受Http请求并作出相应的一种技术,是JAVA语言编写的一种动态资源；

Servlet是前后端衔接的一种技术,不是所有的JAVA类都可以接收请求和作出相应,Servlet可以在MVC模式中,Servlet作为Controller层(控制层)主要技术,用于和浏览器完成数据交互,控制交互逻辑；