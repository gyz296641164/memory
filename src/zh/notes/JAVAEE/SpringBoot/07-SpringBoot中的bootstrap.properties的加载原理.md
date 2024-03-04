---
title: 07_SpringBoot中bootstrap.properties文件加载原理
category:
  - SpringBoot
date: 2024-03-04
---

<!-- more -->

## 开篇 

对于SpringBoot中的属性文件相信大家在工作中用的是比较多的，对于application.properties和application.yml文件应该非常熟悉，但是对于bootstrap.properties文件和bootstrap.yml这个两个文件用的估计就比较少了，用过的应该清楚bootstrap.properties中定义的文件信息会先与application.properties中的信息加载。而且大家在使用的时候还经常碰到获取不到bootstrap.properties中定义的信息的困扰，本文就来给大家揭开这些谜团。

GitEE源码地址：https://gitee.com/dengpbs/spring-boot-2.2.5.snapshot.git

## 1.bootstrap的使用

首先在SpringBoot中默认是不支持bootstrap.properties属性文件的。我们需要映入SpringCloud的依赖才可以。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/8688c2ced20aca51.png)

相关的版本环境

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/810359a8e7670e50.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/c8401656481df0c1.png)

然后创建对应的bootstrap.properties文件，当然你也可以创建bootstrap.yml文件

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/c819ddae9c0704e2.png)

同步的我们也会创建application.properties文件，其中会覆盖一个属性

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/37148b025d632126.png)

然后我们在controller中获取测试

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/17c39888d2c0bf3c.png)

访问测试：http://localhost:8080/query

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/b9955f111bc3d3de.png)

通过访问看到bootstrap.properties中的信息获取到了，同时age也被application.properties中的属性覆盖掉了。加载顺序到底是什么？为什么会覆盖呢？我们接下来分析。

## 2.bootstrap加载原理分析

看本文之前最好看下我前面讲解的SpringBoot中的监听机制。

### 2.1 BootstrapApplicationListener

在使用bootstrap.properties文件时我们需要映入相关的依赖

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/ba31de0431cca4c9.png)

其实在这个依赖中会在对应的spring.factories文件中给我们提供新的监听器，也就是BootstrapApplicationListener监听器。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/b199a0dcc09f8693.png)

而BootstrapApplicationListener监听触发的事件是ApplicationEnvironmentPreparedEvent事件，这个事件其实和我们前面介绍监听application.properties的时候的监听器ConfigFileApplicationListener监听的是同一个事件。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/b183019f42140dfd.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/146516ae128e291f.png)

如果你看了前面的文章，那么此处你会觉得有点眉目了。也就是当启动的时候发布对应的事件，该监听器会触发相关的解析行为。

### 2.2 启动流程梳理

搞清楚了监听器的关系后，我们来看下启动的流程代码具体是怎么执行的。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/dfa8d5a79a3ec3ac.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/b7f0362dff4cf7cc.png)

直接进入

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/60309edf4907e4a2.png)

在SpringApplication的构造方法中我们要注意两点，1.监听器的加载 2.main方法的主类记录

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/a196ed030604fe9e.png)

然后回来进入run方法

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/a03681dabb0e9ede.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/f6ade52bcc8ca26f.png)

Debug到第一个端点。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/8593ae352b7d514a.png)

然后我们放过。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/37a3a85738d451e7.gif)

通过上面的动图可以看到又进入了一次这个run方法。先看处理的结果。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/90665ba7a11e0533.png)

然后我们再放过，继续

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/073d3ab69e5feae6.png)

分两次加载，有先右后哦。那么这里面的第一个加载的原理到底是什么呢？继续来分析。

### 2.3 bootstrap.properties的加载原理

接下来看看是如果出现的一个父context来优先加载我们的bootstrap.properteis文件的，还是从这个图开始

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/413f6d7106718934.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/2bd5f1f1effcb79f.png)

链路如上面一步步跟踪即可。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/0432b7704b192085.png)

跳过非关键的，直接进入到BootstrapApplicationListener中来看。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/60ee204cbfa28c77.png)

然后进入到 bootstrapServiceContext方法中。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/5ef0b3617d0cd4dd.png)

这儿我们看到有创建了一个SpringApplication对象。这个其实就是父Context对象了。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/c6c8fbb65919960d.png)

进入run方法你会发现，回到了前面

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/d2718d261ead1da7.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/e3bb7cc454656939.png)

到这应该就清楚了执行的核心流程了，至于是如何加载的属性文件的内容，参考上篇文章。


