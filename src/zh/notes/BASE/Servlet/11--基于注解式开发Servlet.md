---
title: 11_基于注解式开发Servlet
category:
  - Servlet
order: 11
date: 2024-02-11
---

<!-- more -->

## 基于注解式开发Servlet

在Servlet3.0以及之后的版本中支持注解式开发Servlet。对于Servlet的配置不在依赖于web.xml配置文件而是使用@WebServlet将一个继承于javax.servlet.http.HttpServlet的类定义为Servlet组件。

## @WebServlet注解中属性

| 属性名         | 类型           | 作用                            |
| -------------- | -------------- | ------------------------------- |
| initParams     | WebInitParam[] | Servlet的init参数               |
| name           | String         | Servlet的名称                   |
| urlPatterns    | String[]       | Servlet的访问URL，支持多个      |
| value          | String[]       | Servlet的访问URL，支持多个      |
| loadOnStartup  | int            | 自启动Servlet                   |
| description    | String         | Servlet的描述                   |
| displayName    | String         | Servlet的显示名称               |
| asyncSupported | boolean        | 声明Servlet是否支持异步操作模式 |
|                |                |                                 |

![image-20240129074744253](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Servlet/202401/ea59cc274fec0266.png)