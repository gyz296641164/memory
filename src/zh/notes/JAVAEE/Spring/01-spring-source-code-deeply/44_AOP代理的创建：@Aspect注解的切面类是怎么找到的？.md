---
title: 44_AOP代理的创建：@Aspect注解的切面类是怎么找到的？
category:
  - Spring源码
star: true
sticky: true
date: 2023-03-10
---

<!-- more -->

## 开篇

大家好，上篇文章我们分析到这个`wrapIfNecessary()`方法了，我们看到在这个`wrapIfNecessary()`方法中，有两块非常重要的逻辑，首先是调用`getAdvicesAndAdvisorsForBean()`方法获取bean对应的增强，接着调用`createProxy()`方法创建出代理对象。

按照惯例，先介绍一下文章的讲解思路，主要包含以下内容：

1. 首先我们会先来思考一个问题，那就是当一个bean同时匹配到多个切面时，该怎么控制切面执行的顺序？
2. 然后就开始分析源码，主要就是来分析下@Aspect注解标注的切面类是怎么被找到的？

---

## 多个切面类的顺序怎么控制？

目前为止我们只有1个切面类，代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211130856.png)

这个切面很简单，就是在执行ProductServiceImpl类中所有方法的前后织入记录日志的逻辑，这个我们之前都测试过，相信大家还有印象。

不过在实际的项目中，可能会同时存在多个切面，比如我们有专门负责监控打点的切面类和缓存操作的切面类，代码分别如下：

监控打点切面类，用于在ProductServiceImpl类的方法执行前后进行监控打点

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211130901.png)

缓存操作切面类，用于在WithoutAopV2ProductServiceImpl类的方法执行前后进行缓存操作

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211130907.png)

现在我们在来执行一下下边的测试类代码，来看下打印结果

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211130915.png)

打印结果如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211130918.png)

大家可以看到，在执行productServiceImpl类的方法时，同时匹配了2个切面，在执行方法前先记录了日志，接着就进行了监控打点。

通过这个打印结果，我们可以知道一个方法是可以同时匹配多个切面的，并且切面的逻辑都是可以生效的。那现在问题来了，既然一个方法可以同时匹配多个切面，那么切面之间的执行顺序可以控制吗？

比如上边这个打印结果，在执行方法前，首先记录了日志，然后进行了监控打点，那如果我想要的结果是执行方法前先进行监控打点，然后再记录日志，这个时候该怎么来玩儿呢？

其实呢，这个很简单，每一个切面类都可以通过实现Ordered接口来控制切面之间的执行顺序，比如MonitorAspect切面类修改后的代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211130923.png)

LoggingAspect切面类修改后的代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211130935.png)

这个getOrder()方法中返回的数字越小，则说明优先级越高，比如现在MonitorAspect切面类的优先级就比LoggingAspect切面类的优先级要高

此时我们在执行一下测试类，来看下打印结果

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211130939.png)

大家可以看到，此时在执行方法前，会先进行监控打点，再记录日志，说白了就是先执行了优先级更高的MonitorAspect切面类的逻辑，然后才执行LoggingAspect切面类的逻辑。

好了，到这里为止，这个多个切面的执行顺序小知识点我们就讲完了，大家在实际项目中，如果遇到这种场景的话，按照这种方式处理就可以了，非常的简单。

---

## @Aspect注解的切面类是怎么找到的？

在处理bean的时候，有两步非常重要的操作，第一步就是通过advisorFactory.isAspect()找到加了@Aspect注解的类；而第二步就是通过this.advisorFactory.getAdvisors(factory)进一步找到切面类中的增强方法，并将增强方法构建为Advisor。

> 涉及方法
>
> - `org.springframework.aop.framework.autoproxy.AbstractAutoProxyCreator#getAdvicesAndAdvisorsForBean`
> - `org.springframework.aop.framework.autoproxy.AbstractAdvisorAutoProxyCreator#findEligibleAdvisors`
> - `org.springframework.aop.aspectj.annotation.AnnotationAwareAspectJAutoProxyCreator#findCandidateAdvisors`
> - `org.springframework.aop.aspectj.annotation.BeanFactoryAspectJAdvisorsBuilder#buildAspectJAdvisors`
> - `org.springframework.aop.aspectj.annotation.AspectJAdvisorFactory#isAspect`：找到加了@Aspect注解的类
> - `org.springframework.aop.aspectj.annotation.AspectJAdvisorFactory#getAdvisors`：找到切面类中的增强方法，并将增强方法构建为Advisor

普及完了多切面排序的小知识点后，接下来我们就开始继续分析源码吧，上篇文章我们分析到了这个位置：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211134337.png)

大家可以看到在这个wrapIfNecessary()方法刚进来的时候，会有一堆的判断，比如这个bean已经被处理过的话，那就直接返回，如果这个bean不需要被增强，就直接返回，如果这个bean被指定为不需要进行代理，也直接返回，就是一些常规校验罢了，而我们这篇文章的重点就是会来详细分析下getAdvicesAndAdvisorsForBean()方法，这个方法主要是用来获取和当前bean相匹配的增强的。

那我们废话不多说，直接点进去看下getAdvicesAndAdvisorsForBean()方法的代码吧，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211134343.png)

可以看到这个方法其实很简单，主要就是调用了findEligibleAdvisors()方法来获取合适的增强。

那我们直接点进去这个findEligibleAdvisors()方法看下吧

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211134346.png)

大家可以看到，在这里主要分为两步，第一步是调用findCandidateAdvisors()方法获取所有的增强，第二步是调用findAdvisorsThatCanApply()方法，找到与当前bean相匹配的增强。

那我们先来看下findCandidateAdvisors()方法是怎么获取所有增强的吧，代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211134349.png)

我们发现，在这个findCandidateAdvisors()方法中，首先调用了super.findCandidateAdvisors()方法来获取xml中配置的增强，也就是说虽然你要支持@Aspect注解方式配置的AOP，但是也要兼容我xml方式配置的AOP蛮，就是这个意思

接着又调用了一个buildAspectJAdvisors()方法，为@Aspect注解标注的切面类构建增强，因为我们目前使用的是@Aspect注解的方式，所以super.findCandidateAdvisors()这行代码肯定会返回一个空集合，因为我们压根儿就没有在xml中配置切面，而是使用@Aspect注解方式声明的切面。

也就是说，我们现在的重点就是要来看下buildAspectJAdvisors()方法是怎么玩儿的，我们一起来看下

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211134353.png)

我们可以看到，首先第一次调用这个buildAspectJAdvisors()方法时，这个aspectNames一定是个null，接着就会进入到这个if分支的处理中，首先从IOC容器中获取所有的bean，然后遍历依次处理每个bean。

在处理bean的时候，有两步非常重要的操作，第一步就是通过advisorFactory.isAspect()找到加了@Aspect注解的类；而第二步就是通过this.advisorFactory.getAdvisors(factory)进一步找到切面类中的增强方法，并将增强方法构建为Advisor。

那我们就先来看下isAspect()方法是如何来找切面类的，isAspect()代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211134359.png)

大家可以看到，在isAspect()方法中调用了hasAspectAnnotation()方法，而hasAspectAnnotation()方法又调用了工具方法AnnotationUtils.findAnnotation()

在上边的代码图中，AnnotationUtils.findAnnotation()方法的入参非常有意思，大家看第二个入参是Aspect.class，我们直接点进去这个Aspect.class来看一眼，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211134403.png)

我们发现这个Aspect.class就是我们在切面类上加的那个@Aspect注解

接着我们点进去这个AnnotationUtils.findAnnotation()方法看一眼，代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211134406.png)

我们发现其实这个这个AnnotationUtils.findAnnotation()方法，就是专门用来在指定类上找特定注解的。

到这里为止，我们就找到@Aspect注解的切面类了，那下一步就要去找切面类中的增强方法了，找到增强方法后后续还有一系列复杂的操作，这些我们下篇文章接着分析。

---

## 总结

一张图来梳理下AOP代理的创建流程

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211134424.png)

上图是目前为止，我们分析的AOP代理创建流程的源码图，其中红色背景的部分就是我们今天新分析的内容。

我们来总结一下，我们将getAdvicesAndAdvisorsForBean()方法作为入口开始分析源码，在获取增强时，我们可以看到首先会先获取xml中配置的增强。

然后再来获取@Aspect注解切面类中的增强，这里会先从IOC容器中获取到所有的bean，接着遍历每个bean，看下这个bean是否加了@Aspect注解，如果没有加@Aspect注解，那么就跳过，开始处理下一个bean

而一旦这个bean加了@Aspect注解，那么说明这个bean就是一个切面类，那接下来就要对这个切面类做进一步的处理了，这个我们下篇文章再接着来分析。