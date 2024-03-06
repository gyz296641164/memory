---
title: 19_Spring高级容器初始化：BeanPostProcessor是如何注册的呢
category:
  - Spring源码
star: true
date: 2023-03-31
---

<!-- more -->

## 开篇

前面我们已经了解了BeanFactoryPostProcessor，它可以在Spring容器的层面对BeanDefinition进行修改，可以说BeanFactoryPostProcessor是在Spring容器层面的一个扩展。

------



但是，我们有没有粒度更小一点的扩展处理呢？比如我们能否在bean的层面进行精准的把控呢？答案当然是有的，这一节我们继续顺着refresh方法，来看下Spring中另外一个比较重要的扩展点，也就是bean的后处理器BeanPostProcessor，主要包括以下几个部分：



1.首先来认识下Spring中什么是BeanPostProcessor

2.再来看下BeanPostProcessor一般是如何使用的

3.最后我们来分析下ApplicationContext初始化时，BeanPostProcessor是如何注册的

------

## 初识BeanPostProcessor

前面，我们已经了解了方法invokeBeanFactoryPostProcessors是如何执行Spring容器中的各种工厂后处理器BeanFactoryPostProcessor。

接下来，我们再看到refresh方法中，下一个方法registerBeanPostProcessors：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070135431.png)

我们到方法registerBeanPostProcessors里面看下：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070135555.png)

可以看到，在方法registerBeanPostProcessors里面又委托了PostProcessorRegistrationDelegate来调用方法registerBeanPostProcessors，通过方法名称我们可以知道，接下来应该是要注册BeanPostProcessor。

在继续源码分析之前，我们有必要来了解一下BeanPostProcessor是什么，BeanPostProcessor像我们前面说的一样，它就是在bean的层面对bean实例化的一个扩展，也就是说通过BeanPostProcessor可以控制Spring容器中任意一个bean的实例化过程。

什么意思呢？我们结合着BeanPostProcessor的类图来辅助理解bean实例化的控制过程：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070135803.png)

可以看到，在接口BeanPostProcessor中有两个方法，分别是方法postProcessBeforeInitialization和方法postProcessAfterInitialization，通过方法的名称我们大概可以知道，这两个方法分别是在bean实例初始化前和初始化后执行的。

那bean的初始化和实例化又有什么关系呢？因为bean实例化和初始化这块源码的逻辑，目前我们还没有分析到那里，其实如果往细的来说，bean实例化完成之后还会经历初始化这个阶段，经历过初始化阶段的bean实例，才算完全创建好了，而接口BeanPostProcessor中的两个接口方法，则分别是在bean初始化前后执行的。

从整体上来看，BeanPostProcessor是影响bean实例化的一个非常重要的因素，比如后面我们讲到的AOP代理对象，如果我们要对一个bean通过动态代理方式创建，Spring底层其实就是以接口BeanPostProcessor的后处理方法来作为入口创建的，这块逻辑后面我们也会讲到。

这样的话，就算先前已经通过Spring默认的一套实例化逻辑，将bean实例化好了，但是，在bean初始化阶段执行到了接口BeanPostProcessor的后处理方法，也会重新按照AOP的那套代理逻辑来实例化对象。

所以，我们暂且可以理解为接口BeanPostProcessor是用于介入一个bean的实例化的，而bean实例化和初始化阶段相关的细节源码，后面我们也会看到的，到时候大家理解起来就清晰多了。

------

## BeanPostProcessor简单使用

我们通过一个案例来体验下BeanPostProcessor一般是如何使用的：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070135839.png)

可以看到，首先我们自定义了一个类StudentPostProcessor并实现接口BeanPostProcessor，同时实现了方法postProcessBeforeInitialization和postProcessAfterInitialization。

然后，我们分别在这两个方法中添加了一些逻辑，很明显StudentPostProcessor是用来影响Student实例化过程的，然后，我们再把StudentPostProcessor配置到xml中：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070135178.png)

StudentPostProcessor和Student一起通过bean标签配置好了，我们可以预料到的是，如果外界需要使用Student对象时，可以通过getBean方法获取Student对象。

这个时候就会触发bean的实例化，Spring容器就会取出名称为student的BeanDefinition，然后实例化一个Student对象出来，在实例化之前，根据我们刚才的分析就会先获取Spring容器中所有的BeanPostProcessor，包括我们刚配置在xml中的StudentPostProcessor。

然后在实例化Student之前，先执行StudentPostProcessor中的方法postProcessBeforeInitialization，与之对应的是，在Student实例化完成之后，最后会执行StudentPostProcessor的postProcessAfterInitialization方法，做一些善后的工作。

我们写段代码来验证一下：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070135710.png)

代码很简单，运行下看下效果：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070135494.png)

可以看到，果然按照我们预期的那样，getBean方法触发bean的实例化过程创建Student对象，在实例化的前后，分别执行方法postProcessBeforeInitialization和方法postProcessAfterInitialization，打印出我们预期的信息。

通过向Spring容器注册各种各样的BeanPostProcessor，我们可以对任意一个我们想要控制实例化的bean，添加我们想要的逻辑，从而人为介入并控制bean的实例化过程。

比如，我们创建也就是实例化一个bean，到底是直接通过关键字new出来呢？还是通过JDK动态代理或CGLIB动态代理呢？这些都是bean实例化的候选方式，我们可以在bean的后处理器BeanPostProcessor方法中，决定bean到底应该是用哪种方式来实例化bean的。

------

## BeanPostProcessor的注册

了解完BeanPostProcessor之后，我们接着刚才的流程继续来看下Spring是如何注册BeanPostProcessor的：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070135328.png)

我们到方法registerBeanPostProcessors中看下：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070135308.png)

可以看到，这里的代码量依然非常的壮观，但是，和上一讲的代码量相比已经大大减少了，而且，如果我们理解了上一讲的方法逻辑，接下来的代码理解将会变得非常简单，我们还是一步步来各个击破。

首先，我们先来看下第一个区域的代码：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070135060.png)

可以看到，首先从beanFactory中获取所有接口BeanPostProcessor的实现类的名称，然后率先往beanFactory中，添加了一个bean后处理器BeanPostProcessorChecker。

BeanPostProcessorChecker的功能，其实就是简单检查下哪些bean是没有资格让所有BeanPostProcessor处理它的，并记录一下日志信息而已，这块代码并不是很重要我们姑且先跳过。

接着，我们看到了熟悉的一幕：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070135675.png)

可以看到初始化了好几个集合，类比我们上节课的分析，我们可以很清晰的知道这些集合中，priorityOrderedPostProcessors是存放实现了接口PriorityOrdered的BeanPostProcessor，orderedPostProcessorNames存放实现了接口Ordered的BeanPostProcessor，而nonOrderedPostProcessorNames则存放无序的普通的BeanPostProcessor。

而集合internalPostProcessors比较特殊，是用于存放Spring容器内部，在解析各种注解时临时生成的BeanPostProcessor，比如解析@Autowired注解时就会生成，后续我们分析到注解相关的源码时就可以看到了，所以，这部分的BeanFactoryProcessor也是要注册的。

我们继续往后面看，基本上大家也能轻易看得懂了：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070135397.png)

首先，和我们预期的一样，将beanFactory中的各种类型的BeanPostProcessor进行归类放到不同的集合当中，和我们上一节看到的代码结构基本是一样的。

首先将实现了PriorityOrdered接口、Ordered接口、以及这两个接口都没实现的普通无序BeanPostProcessor接口实现类，将这三种类型的BeanPostProcessor都放到相应的集合中。

其中，如果发现BeanPostProcessor实现类实现了MergedBeanDefinitionPostProcessor，就放到集合internalPostProcessors中，被认定是Spring内部生成的BeanPostProcessor。

而且，我们接着看到率先对实现接口PriorityOrdered的实现类进行排序和注册，需要注意一点的是这里只是将BeanPostProcessor注册到Spring容器beanFactory中，而不是像BeanFactoryPostProcessor一样立马就执行方法了，BeanPostProcessor中的方法是在bean实例化的时候执行的。

我们再看一下最后一些代码：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070136390.png)

可以看到，接下来就是依次处理剩下几个集合中的BeanPostProcessor，当然，在这个过程当中我们看到还会筛选出Spring容器内部的BeanPostProcessor，并放到集合internalPostProcessors中。

最终，internalPostProcessors中的BeanPostProcessor会在最后被注册到容器beanFactory中，整体的代码结构和上一节的是非常类似的。

------

## 总结

今天知识点我们就讲到这里了，我们来总结一下吧。

一张图来梳理下当前的流程：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070136335.png)

到这里，我们已经分析bean的后处理器BeanPostProcessor的注册，注册的逻辑的代码结构和上一节BeanFactoryPostProcessor的极为的相似，但是更加的简洁。

首先，从容器beanFactory中，获取所有实现接口BeanPostProcessor的bean名称，然后再按照实现PriorityOrdered接口、实现Ordered接口以及普通无序的BeanPostProcessor这三种类型，依次从beanFactory中获取到相应的实现类，再注册到beanFactory中。

这处理以上这三种类型的BeanPostProcessor的同时，会判断一下这些BeanPostProcessor的实现类中，是否存在同时实现接口MergedBeanDefinitionPostProcessor的类，并及时记录到集合internalPostProcessors中。

最后，会一并注册到beanFactory的BeanPostProcessor调用链的末尾，很显然Spring内部的BeanPostProcessor的优先级是最低的。