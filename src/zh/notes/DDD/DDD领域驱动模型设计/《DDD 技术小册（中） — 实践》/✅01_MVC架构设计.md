---
title: ✅01 | MVC架构设计
category:
  - DDD
tag: 
  - DDD
date: 2025-10-22
---

<!-- more -->

> 注：本文引自 [小傅哥 bugstack 虫洞栈](https://bugstack.cn/md/road-map/mvc.html)

## 一、编程三步

如果说你是一个特别小的`玩具项目`，你甚至可以把编程的3步写到一个类里。但因为你做的是正经项目，你的各种类；对象类、库表类、方法类，就会成群结队的来。如果你想把这些成群结队的类的内容，都写到一个类里去，那么就是几万行的代码了。—— 当然你也可以吹牛逼，你一个人做过一个项目，这项目大到啥程度呢。就是有一个类里有上万行代码。

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/DDD/road-map-230623-01.png)

所以，为了不至于让一个类撑到爆，需要把黄色的对象、绿色的方法、红色的接口，都分配到不同的包结构下。这就是你编码人生中所接触到的第一个解耦操作。

## 二、分层框架

MVC 是一种非常常见且常用的分层架构，主要包括；M - mode 对象层，封装到 domain 里。V - view 展示层，但因为目前都是前后端分离的项目，几乎不会在后端项目里写 JSP 文件了。C - Controller 控制层，对外提供接口实现类。DAO 算是单独拿出来用户处理数据库操作的层。

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/DDD/road-map-230623-02.png)

- 如图，在 MVC 的分层架构下。我们编程3步的所需各类对象、方法、接口，都分配到 MVC 的各个层次中去。
- 因为这样分层以后，就可以很清晰明了的知道各个层都在做什么内容，也更加方便后续的维护和迭代。
- 对于一个真正的项目来说，是没有一锤子买卖的，最开始的开发远不是成本所在。最大的开发成本是后期的维护和迭代。而架构设计的意义更多的就是在解决系统的反复的维护和迭代时，如何降低成本，这也是架构分层的意义所在。

## 三、调用流程

接下来我们再看下一套 MVC 架构中各个模块在调用时的串联关系；

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/DDD/road-map-230623-03.png)

- 以用户发起 HTTP 请求开始，Controller 在接收到请求后，调用由 Spring 注入到类里的 Service 方法，进入 Service 方法后有些逻辑会走数据库，有些逻辑是直接内部自己处理后就直接返回给 Controller 了。最后由 Controller 封装结果返回给 HTTP 响应。
- 同时我们也可以看到各个对象在这些请求间的一个作用，如；请求对象、库表对象、返回对象。

## 四、架构源码

### 1. 环境

- JDK 1.8
- Maven 3.8.6 - 下载安装maven后，本地记得配置阿里云镜像，方便快速拉取jar包。源码中 `docs/maven/settings.xml` 有阿里云镜像地址。
- SpringBoot 2.7.2
- MySQL 5.7 - 如果你使用 8.0 记得更改 pom.xml 中的 mysql 引用

### 2. 架构

- **源码**：[`https://gitcode.net/KnowledgePlanet/road-map/xfg-frame-mvc`](https://gitcode.net/KnowledgePlanet/road-map/xfg-frame-mvc)
- **树形**：`安装 brew install tree` `IntelliJ IDEA Terminal 使用 tree`

```
.
├── docs
│   └── mvc.drawio - 架构文档
├── pom.xml
├── src
│   ├── main
│   │   ├── java
│   │   │   └── cn
│   │   │       └── bugstack
│   │   │           └── xfg
│   │   │               └── frame
│   │   │                   ├── Application.java
│   │   │                   ├── common
│   │   │                   │   ├── Constants.java
│   │   │                   │   └── Result.java
│   │   │                   ├── controller
│   │   │                   │   └── UserController.java
│   │   │                   ├── dao
│   │   │                   │   └── IUserDao.java
│   │   │                   ├── domain
│   │   │                   │   ├── po
│   │   │                   │   │   └── User.java
│   │   │                   │   ├── req
│   │   │                   │   │   └── UserReq.java
│   │   │                   │   ├── res
│   │   │                   │   │   └── UserRes.java
│   │   │                   │   └── vo
│   │   │                   │       └── UserInfo.java
│   │   │                   └── service
│   │   │                       ├── IUserService.java
│   │   │                       └── impl
│   │   │                           └── UserServiceImpl.java
│   │   └── resources
│   │       ├── application.yml
│   │       └── mybatis
│   │           ├── config
│   │           │   └── mybatis-config.xml
│   │           └── mapper
│   │               └── User_Mapper.xml
│   └── test
│       └── java
│           └── cn
│               └── bugstack
│                   └── xfg
│                       └── frame
│                           └── test
│                               └── ApiTest.java
└── road-map.sql
```

以上是整个工程架构的 tree 树形图。整个工程由 SpringBoot 驱动。

- Application.java 是启动程序的 SpringBoot 应用
- common 是额外添加的一个层，用于定义通用的类
- controller 控制层，提供接口实现。
- dao 数据库操作层
- domain 对象定义层
- service 服务实现层

## 五、测试验证

- 首先；整个工程由 SpringBoot 驱动，提供了 road-map.sql 测试 SQL 库表语句。你可以在自己的本地mysql上进行执行。它会创建库表。
- 之后；在 application.yml 配置数据库链接信息。
- 之后就可以打开 ApiTest 进行测试了。你可以点击 Application 类的绿色箭头启动工程，使用 UserController 类提供接口的方式调用程序；http://localhost:8089/queryUserInfo

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/DDD/road-map-230623-04.png)

如果你正常获取了这样的结果信息，那么说明你已经启动成功。接下来就可以对照着MVC的结构进行学习，以及使用这样的工程结构开发自己的项目。