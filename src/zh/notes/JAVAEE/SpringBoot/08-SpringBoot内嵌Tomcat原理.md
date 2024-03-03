---
title: 08_SpringBoot源码之Tomcat加载原理
category:
  - SpringBoot
date: 2024-03-04
---

<!-- more -->

## 一、Tomcat基础

我们想要搞清楚在SpringBoot启动中到的是如何集成的Tomcat容器，这个就需要我们先对Tomcat本身要有所了解，不然这个就没办法分析了，所以我们先来回顾下Tomcat的基础内容。Tomcat版本是8.5.73

### 1.目录结构

先简单的回顾下一个Tomcat文件的目录结构

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/994f03599dbe1a0a.png)

这个非常基础和简单就快速过掉。

### 2.启动流程

Tomcat的架构相关的内容在本文中就不再赘述，可以查阅Tomcat源码专题的内容，我们来看下当我们要启动一个Tomcat服务，我们其实是执行的bin目录下的脚本程序，`startup.bat`和 `startup.sh`.一个是windows的脚本，一个是Linux下的脚本，同样还可以看到两个停止的脚本 `shutdown.bat` 和 `shutdown.sh`.

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/a68723b93226bfcc.png)

为了比较直观的来查看脚本的内容，我们通过VCCode来查看吧。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/97540c2367227f0b.png)

查看 `startup.bat`

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/44a0f9d33d29c6ac.png)

可以看到在这个脚本中调用了 `catalina.bat`这个脚本文件，继续进入，配置信息很多，找核心的脚本

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/a9c7510049a5b523.png)

对应的我们进入到doStart方法中

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/e64d6cb09d8b9030.png)

最后会执行的程序是

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/ce71911d3b1512e1.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/d02f017a30bd9c27.png)

而这个MAINCLASS变量是前面定义的有的

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/18a16bd4480f9300.png)

其实前面看了这么一堆的脚本文件，都是在做一些环境的检测和运行时的参数，最终执行的是Bootstrap中的main方法。

### 3.Bootstrap类

#### 3.1 架构图

在分析具体的源码流程之前还是需要对Tomcat的架构图要有所了解的

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/c1de467a89e76a3f.png)

#### 3.2 流程分析

接下来我们需要查看下Bootstrap中的main方法了，这时我们需要下载对应的源码文件了。可以官网自行下载，也可以在课件资料中找到。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/6280e99f68dfd14b.png)

本文不详解介绍，只为SpringBoot中内容做铺垫。

```java
bootstrap.init(); // 初始化类加载器
bootstrap.load(); // 间接调用Catalina，创建对象树，然后调用生命周期的init方法初始化整个对象树
bootstrap.start(); // 间接调用Catalina的start方法，然后调用生命周期的start方法启动整个对象树
```

## 二、SpringBoot中详解

### 1.自动装配

首先我们来看下在spring.factories中注入了哪些和Web容器相关的配置类。

#### 1.1 EmbeddedWebServerFactoryCustomizerAutoConfiguration

第一个是EmbeddedWebServerFactoryCustomizerAutoConfiguration。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/af05a7f881b7a4fb.png)

查看代码，比较容易

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/0ef5706b6951168d.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/0426dfdc44bbe281.png)

在这个配置类里面就是根据我们的配置来内嵌对应的Web容器，比如Tomcat或者Jetty等。

#### 1.2 ServletWebServerFactoryAutoConfiguration

然后来看下ServletWebServerFactoryAutoConfiguration这个配置类。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/6ec4894d4a274f02.png)

首先来看下在类的头部引入和一些核心的信息

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/1b768003b35ee47c.png)

重点我们需要看下EmbeddedTomcat这个内部类。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/390de7c3c453051e.png)

看到的核心其实是创建了一个TomcatServletWebServerFactory对象并注入到了Spring容器中。这块的内容非常重要，是我们后面串联的时候的一个切入点。

### 2.启动流程

有了上面的自动配置类的支持我们就可以看看在SpringBoot的run方法中是在哪个位置帮我们内嵌了Tomcat容器呢？首先我们从SpringBoot的run方法的刷新上下文的方法进入。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/d9b6a99543ec7f3e.png)

这部分其实就是Spring的核心代码了，我们进入到refresh()方法。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/f64f27a4ee2c0857.png)

继续进入：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/a9ed5e7b1fbcc3dd.png)

然后我们进入ServletWebServerApplicationContext对象的onRefresh方法中。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/0945470c3d350ce8.png)

核心方法 createWebServer() 创建我们的Tomcat容器。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/325417571bad1005.png)

可以看到，从容器中获取的工厂对象其实就我们上面注入的对象，然后根据工厂对象获取到了一个TomcatWebServer实例，也就是Tomcat服务对象。关键点我们需要看下getWebServer方法的逻辑

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/a569baaabad083d3.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/fcc906d9055abf0d.png)

然后继续进入到 getTomcatWebServer方法中。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/51366616101f904b.png)

进入构造方法查看

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/2a9c7ac23b00d47c.png)

进入Tomcat初始化的方法initialize方法

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/a802c88a3d8d3940.png)

进入start方法

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/c7b92584d9ec708b.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/f2a47a803b694667.png)

到这儿后面的逻辑其实就是Tomcat自身启动的逻辑了。这就需要你的Tomcat基础了，到这SpringBoot启动是如何内嵌Tomcat容器的到这儿就结束了哦。
