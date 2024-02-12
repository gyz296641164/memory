---
title: 14_Spring高级容器初始化：初探容器ApplicationContext初始化
category:
  - Spring源码
star: true
date: 2023-03-31
---

<!-- more -->

## 开篇

通过前面的学习，我们已经了解了Spring初级容器是如何初始化的了，有了这些知识储备之后，我们对Spring的认知就已经初步形成了一个“框架”了，接下来我们要做的事情就是在这个“框架”基础之上，去探索Spring的一些更高级的功能特性，这样的话我们对Spring的认知就会更加立体和完整了。

相比于陌生的XmlBeanFactory而言，ApplicationContext显然大家更加的熟悉，在Spring高级容器ApplicationContext中，一方面包含了初级容器XmlBeanFactory中的所有的东西。

ApplicationContext在初级容器的基础之上，扩展了非常多的高级特性，同时也给我们提供了非常多的功能拓展点，通过这些功能拓展点，我们可以将Spring这个框架的功能改造的更加满足于我们实际的业务场景。

比如，我们或多或少就听说过Spring前置处理器及后置处理器等功能，其实就是在ApplicationContext中扩展的一个高级功能。

从这一节开始呢，我们就一起来探索下Spring高级容器ApplicationContext是如何初始化的吧，这一节主要包括以下几个部分内容：

1. 简单来使用一下ApplicationContext，作为源码分析的入口
2. 接下来再来看下ApplicationContext对环境变量以及路径占位符解析的准备工作
3. 最后再来定位下ApplicationContext中，最核心的方法是在什么位置，为下一步的源码分析做准备

------

## ApplicationContext简单的使用

首先，我们先来看下ApplicationContext是如何使用的吧：

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202304/202304111942629.png)

可以看到，同样是解析xml文件，如果我们使用ApplicationContext来解析的话，也就是将之前的XmlBeanFactory替换成了ApplicationContext的实现类ClassPathXmlApplicationContext，运行一下和XmlBeanFactory一样，可以在控制台上打印出字符串“ruyuan ”。

当然，ApplicationContext接口的实现类是在是太多了，但是底层的一些代码逻辑都是通用的，我们这里就采用ClassPathXmlApplicationContext作为ApplicationContext初始化源码分析的入口。

------

## 初始化环境变量相关的信息

通过ClassPathXmlApplicationContext的名称，我们可以知道它是从classpath路径下加载和解析applicationContext.xml的。

但是，我们并没有看到它直接使用Resource资源来封装xml，可以预先做一个合理的猜想，也就是说ClassPathXmlApplicationContext在底层，会根据我们传进去的xml文件名加载资源Resource。

带着这个猜想，我们以ClassPathXmlApplicationContext的构造方法为入口开始分析：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202304/202304111942418.png)

可以看到，在ClassPathXmlApplicationContext的构造方法中，首先会把xml文件的名称封装成一个String类型的数组，然后带上参数refresh的值true和参数parent值null，继续调用ClassPathXmlApplicationContext另外的一个重载构造方法。

我们到ClassPathXmlApplicationContext的重载构造方法中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202304/202304111942263.png)

可以看到，首先调用super方法调用父类的构造器，我们层层跟到了父类AbstractApplicationContext时才发现一丝蛛丝马迹，我们发现这里有两个方法。

我们先到this()方法中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202304/202304111943334.png)

可以看到，这里应该是在初始化一个成员变量resourcePatternResolver，那getResourcePatternResolver方法能获取到什么呢？我们也进去看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202304/202304111943306.png)

可以看到，成员变量resourcePatternResolver被初始化了PathMatchingResourcePatternResolver类型，根据名称我们可以推测PathMatchingResourcePatternResolver应该是匹配路径的一个资源解析器，应该是获取我们xml文件资源的一个组件。

当然，知道这个暂时对我们好像没什么用，我们可以在这里留个心眼，很有可能后面在某个地方就用到它了。

继this()方法之后，我们再到第二个方法setParent中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202304/202304111943134.png)

可以看到往setParent方法中传入了参数parent，当然，最终也只是为成员变量parent赋值而已，当然，前面我们也看到了参数parent的值是为空的。

就算参数parent的值不为空，setParent方法中也只是初始化一些环境相关的信息，这样的代码对于我们主流程的分析，就显得不是那么重要了。

------

## XML文件路径占位符的解析

现在，我们再回到ClassPathXmlApplicationContext构造方法的位置：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202304/202304111943857.png)

接下来，我们可以看到以xml文件名封装的String数组作为参数，传入了setConfigLocations方法中。

我们到setConfigLocations方法中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202304/202304111943860.png)

可以看到，在setConfigLocations方法中，通过我们传入的参数locations，构建了一个新的String数组configLocations，用于存放解析后的xml文件路径。

那方法resolvePath会怎么解析呢？我们简单瞧一下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202304/202304111943391.png)

我们到方法resolveRequiredPlaceholders中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202304/202304111943459.png)

看到这里，我们大概就明白是怎么回事了。

也就是说，我们传入的xml路径参数path中，如果存在占位符“${}”，那方法resolveRequiredPlaceholders就可以解析占位符，毕竟，你要是拿着带有占位符“${}”的路径去获取xml资源肯定是找不到xml的。

而且，我们通过注释也看到了，如果xml的路径中有“${}”占位符，但是却没有对应匹配的默认属性值是会报错的。

很显然，我们看到这里还是一些边边角角的代码，依然还没有进入到ApplicationContext的核心代码，怎么说呢，看Spring源码差不多就是这样的一种感觉，第一遍云里雾里、抓耳挠腮甚至经常“迷路”。

但是，当你在第一遍分析源码的时候看过一些代码了，有些逻辑可能当下看不懂，但是，当你第二遍再回过头来看的时候，你会发现很多东西瞬间就豁然开朗了，特别是后面我们即将要分析的工厂后处理器以及bean后处理器相关的源码。

------

## ApplicationContext初始化的核心方法

现在我们已经看到了，Spring会为我们设置进去的xml路径进行一些准备处理，比如解析路径中的一些占位符，但是具体在什么时候加载和解析xml文件呢？这个问题依然值得我们继续探索，我们继续往下看。

现在，我们再看到ClassPathXmlApplicationContext构造方法：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202304/202304111943934.png)

前面我们已经看到，参数refresh的值为true，所以会调用refresh方法，那refresh方法到底是在干什么呢？

接下来，我们到refresh方法中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202304/202304111943969.png)

可以看到，容器ApplicationContext初始化的核心的逻辑都在方法refresh当中，并且，接下来我们分析ApplicationContext的初始化，核心就是围绕着refresh方法来展开。

------

## 总结

好了，今天的知识点我们就讲到这里了，我们来总结一下吧。

第一，我们从Spring初级容器BeanFactory到Spring的高级容器ApplicationContext做了一个过渡，并且，我们通过一个简单案例，开始入手了ApplicationContext的源码分析。

第二，经过初步的分析，我们发现暂时还只是解析我们设置进去的路径，防止路径中含有占位符“${}”，不管怎样，我们已经找到了ApplicationContext容器初始化的关键方法refresh，接下来，我们重点就要开始分析最核心的refresh方法 了。

虽然这一节的内容并不是很多，但是，好在我们也是找到了ApplicationContext初始化的核心方法了，接下来，我们会按照方法refresh中罗列的这些功能点，依次来分析下它们。

如果大家把关于refresh方法中的一系列源码章节的内容都掌握了，Spring IOC容器这块的内容就已经了然于胸了，后面我们再分析bean加载的环节，一切就会变得水到渠成。