---
title: 05_SpringBoot源码之自定义监听器
category:
  - SpringBoot
date: 2024-03-03
---

<!-- more -->

## 开篇 

前面我们系统的给大家介绍了SpringBoot中的监听器机制，清楚的知道了SpringBoot中默认给我们提供了多个监听器，提供了一个默认的事件发布器，还有很多默认的事件，本文我们就在前面的基础上来，来看下如果我们要自定义监听器如何来实现。

## 1. SpringBoot中默认的监听器

首先来回顾下SpringBoot中给我们提供的默认的监听器，这些都定义在spring.factories文件中。

| 监听器                                     | 监听事件                                                                                                                                                        | 说明                                                                                                                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ClearCachesApplicationListener             | ContextRefreshedEvent                                                                                                                                           | 当触发ContextRefreshedEvent事件会清空应用的缓存                                                                                                                                              |
| ParentContextCloserApplicationListener     | ParentContextAvailableEvent                                                                                                                                     | 触发ParentContextAvailableEvent事件会完成父容器关闭的监听器                                                                                                                                  |
| CloudFoundryVcapEnvironmentPostProcessor   | ApplicationPreparedEvent                                                                                                                                        | 判断环境中是否存在VCAP_APPLICATION或者VCAP_SERVICES。如果有就添加Cloud Foundry的配置；没有就不执行任何操作。                                                                                 |
| FileEncodingApplicationListener            | ApplicationEnvironmentPreparedEvent                                                                                                                             | 文件编码的监听器                                                                                                                                                                             |
| AnsiOutputApplicationListener              | ApplicationEnvironmentPreparedEvent                                                                                                                             | 根据 `spring.output.ansi.enabled`参数配置 `AnsiOutput`                                                                                                                                   |
| ConfigFileApplicationListener              | ApplicationEnvironmentPreparedEvent `<br>`ApplicationPreparedEvent                                                                                            | 完成相关属性文件的加载，application.properties<br />application.yml<br />前面源码内容详细讲解过                                                                                              |
| DelegatingApplicationListener              | ApplicationEnvironmentPreparedEvent                                                                                                                             | 监听到事件后转发给环境变量 `context.listener.classes`指定的那些事件监听器                                                                                                                  |
| ClasspathLoggingApplicationListener        | ApplicationEnvironmentPreparedEvent `<br>`ApplicationFailedEvent                                                                                              | 一个SmartApplicationListener,对环境就绪事件ApplicationEnvironmentPreparedEvent/应用失败事件ApplicationFailedEvent做出响应，往日志DEBUG级别输出TCCL(thread context class loader)的classpath。 |
| LoggingApplicationListener                 | ApplicationStartingEvent `<br>`ApplicationEnvironmentPreparedEvent `<br>`ApplicationPreparedEvent `<br>`ContextClosedEvent `<br>`ApplicationFailedEvent | 配置 `LoggingSystem`。使用 `logging.config`环境变量指定的配置或者缺省配置                                                                                                                |
| LiquibaseServiceLocatorApplicationListener | ApplicationStartingEvent                                                                                                                                        | 使用一个可以和Spring Boot可执行jar包配合工作的版本替换liquibase ServiceLocator                                                                                                               |
| BackgroundPreinitializer                   | ApplicationStartingEvent `<br>`ApplicationReadyEvent `<br>`ApplicationFailedEvent                                                                           | 尽早触发一些耗时的初始化任务，使用一个后台线程                                                                                                                                               |

---

## 2. SpringBoot中的事件类型

然后我们来看下对应的事件类型，SpringBoot中的所有的事件都是继承于 `ApplicationEvent`这个抽象类，在SpringBoot启动的时候会发布如下的相关事件，而这些事件其实都实现了 `SpringApplicationContext`接口。

| 事件                                | 说明                       |
| ----------------------------------- | -------------------------- |
| ApplicationStartingEvent            | 容器启动的事件             |
| ApplicationEnvironmentPreparedEvent | 应用处理环境变量相关的事件 |
| ApplicationContextInitializedEvent  | 容器初始化的事件           |
| ApplicationPreparedEvent            | 应用准备的事件             |
| ApplicationFailedEvent              | 应用启动出错的事件         |
| ApplicationStartedEvent             | 应用Started状态事件        |
| ApplicationReadyEvent               | 应用准备就绪的事件         |

也就是这些事件都是属于SpringBoot启动过程中涉及到的相关的事件

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/dfa29ff560b4db80.png)

当然在启动过程中还会发布其他的相关事件，大家可以自行查阅相关源码哦

## 3.自定义事件

接下来我们通过几个自定义事件来加深下对事件监听机制的理解

### 3.1 监听所有事件

我们先创建一个自定义监听器，来监听所有的事件。创建一个Java类，实现ApplicationListener接口在泛型中指定要监听的事件类型即可，如果要监听所有的事件，那么泛型就写ApplicationEvent。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/36a03792c57edc15.png)

之后为了在容器启动中能够发下我们的监听器并且添加到SimpleApplicationEventMulticaster中，我们需要在spring.factories中注册自定义的监听器

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/dc1617a3d74a9d5a.png)

这样当我们启动服务的时候就可以看到相关事件发布的时候，我们的监听器被触发了。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/90f835318a9c9a5d.png)

### 3.1 监听特定事件

那如果是监听特定的事件呢，我们只需要在泛型出制定即可。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/0889afb5f7ad952e.png)

启动服务查看

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/e0d4becd210cf8d4.png)

### 3.2 自定义事件

那如果我们想要通过自定义的监听器来监听自定义的事件呢？首先创建自定义的事件类，非常简单，只需要继承ApplicationEvent即可

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/b02bb93d0b3f543c.png)

然后在自定义的监听器中监听自定义的事件。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/11748a7c46760759.png)

同样的别忘了在spring.factories中注册哦

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/8e3384a3b4b47d60.png)

之后我们就可以在我们特定的业务场景中类发布对应的事件了

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/7ad93fa05e1f8fa9.png)

然后当我们提交请求后

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/0ca4bd5102cb3f60.png)

可以看到对应的监听器触发了

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/e491ff2ec458b044.png)

这样一来不光搞清楚了SpringBoot中的监听机制，而且也可以扩展应用到我们业务开发中了。好了本文就给大家介绍到这里，希望对你有所帮助。
