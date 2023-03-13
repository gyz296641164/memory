---
title: 46_AOP代理的创建：增强方法是怎么一步一步构建为Advisor的？
category:
  - Spring源码
star: true
sticky: true
date: 2023-03-10
---

<!-- more -->

## 开篇

上篇文章我们已经获取了切面类中用户声明的方法了，那么我们这篇文章接着来看下，这些方法是怎么一步一步构建为Advisor的。

在开始分析之前，大家先来思考几个问题：

1. 方法上最重要的就是被标注的AspectJ注解了，那怎么获取到增强方法上的AspectJ注解信息呢？
2. 增强方法，也就是被AspectJ注解标注的方法，被构建成Advisor的过程是什么样的？
3. 如果每次方法调用都要来临时构建一遍Advisor，那执行效率会不会大打折扣？

好了，这些问题就是本篇文章要解决的，我们带着这些问题继续往下探索，相信大家都可以在文章中找到答案！

---

## 怎么获取增强方法上的AspectJ注解信息？

> 涉及方法：
>
> - `org.springframework.aop.aspectj.annotation.ReflectiveAspectJAdvisorFactory#getAdvisor`
> - `org.springframework.aop.aspectj.annotation.ReflectiveAspectJAdvisorFactory#getPointcut`

我们接着上篇文章，首先大家还记得这个getAdvisorMethods()方法是在哪里调用的吗？

如果大家忘记了也没关系，我们回头看下就可以了，其实是在这里调用的getAdvisorMethods()方法，我们看下边这块代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211151320.png)

此时getAdvisorMethods()就会返回before()、afterReturning()、getOrder()这三个方法

接着走了一个遍历，依次来处理这三个方法before()、afterReturning()、getOrder()，也就是这行代码，大家来看下

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211151324.png)

大家可以看到，这行代码就是调用了getAdvisor()方法，将从切面类中获取的method传递了进去

那我们就点进去这个getAdvisor()方法来看下呗，此时我们看到如下代码

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211151327.png)

其实这个getAdvisor()方法呢，首先就是调用getPointcut()方法来获取method上的切点信息，然后用获取到的切点信息构建一个InstantiationModelAwarePointcutAdvisorImpl类的实例，最后将这个实例返回。

那我们就先来看下getPointcut()方法是怎么获取切点信息的吧，我们看这里

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211151330.png)

我们发现这里直接调用了一个findAspectJAnnotationOnMethod()方法来获取AspectJ注解，然后用获取到的AspectJ注解构建了一个切点对象ajexp，这个切点ajexp其实一个AspectJExpressionPointcut类的实例。

那现在的重点，就是来看下findAspectJAnnotationOnMethod()方法是怎么来获取AspectJ注解，此时我们点开findAspectJAnnotationOnMethod()方法，会看到如下代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211151333.png)

此时我们发现，这里遍历了一个注解数组ASPECTJ_ANNOTATION_CLASSES，然后调用findAnnotation()方法依次在指定的method上查找ASPECTJ_ANNOTATION_CLASSES数组中的注解

那ASPECTJ_ANNOTATION_CLASSES数组到底有哪些注解呢？其实ASPECTJ_ANNOTATION_CLASSES数组的定义如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211151336.png)

说白了这里会依次在指定method上查找AspectJ的六种注解，分别是@Pointcut、@Around、@Before、@After、@AfterReturning、@AfterThrowing，具体查找的话就是这行代码`AspectJAnnotation<?> foundAnnotation = findAnnotation(method, (Class<Annotation>) clazz)`，说白了就是调用工具方法findAnnotation()来完成AspectJ注解的扫描，最后返回扫描到的AspectJ注解。

那么刚才getAdvisorMethods()返回的before()、afterReturning()、getOrder()这三个方法，在处理getOrder()这个method时，findAspectJAnnotationOnMethod()方法就会返回null，因为getOrder()方法上没有加AspectJ的六种注解之一。

---

## 为增强方法构建Advisor

好了，我们接着往下看，然后在getPointcut()方法中，接收到findAspectJAnnotationOnMethod()方法扫描到的注解aspectJAnnotation后，紧接着会构建一个切点对象ajexp，也就是AspectJExpressionPointcut类的一个实例，并且将aspectJAnnotation的切点表达式设置到切点对象ajexp中，最后将切点对象ajexp返回，代码如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211152118.png)

然后当getPointcut()方法将切点对象expressionPointcut返回后，在getAdvisor()方法中，直接通过构造方法的方式创建了一个InstantiationModelAwarePointcutAdvisorImpl类的实例，代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211152122.png)

通过上边这张图，我们可以看到，这里直接通过构造方法的方式，将增强方法 candidateAdviceMethod 和 切点 expressionPointcut 等关键信息注入到了InstantiationModelAwarePointcutAdvisorImpl类的实例中。

其中InstantiationModelAwarePointcutAdvisorImpl类的构造方法的代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211152127.png)

通过上边这张图，我们可以知道最后构造出来的这个Advisor，说白了就是InstantiationModelAwarePointcutAdvisorImpl类的一个实例，这个Advisor中包含了增强方法 candidateAdviceMethod 和 切点 expressionPointcut 等关键信息。

大家还记得吗？刚才getAdvisorMethods()会返回before()、afterReturning()、getOrder()这三个方法，接着开始调用getAdvisor()为这些方法创建对应的Advisor。

而在创建Advisor的过程中，其实这个getOrder()方法是会被过滤掉，因为getOrder()上没有添加AspectJ注解，所以最终能正常创建advisor的只有before()和afterReturning()这两个增强方法，最后，这两个增强方法会被放入到集合advisors中作为结果返回，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211152137.png)

到这里为止，`List<Advisor> classAdvisors = this.advisorFactory.getAdvisors(factory)`这行代码就执行完毕了，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211152151.png)

此时我们以切面类LoggingAspect为例，经过`List<Advisor> classAdvisors = this.advisorFactory.getAdvisors(factory)`这行代码处理之后，返回结果classAdvisors中就只剩下before()和afterReturning()这两个增强方法对应的Advisor了。

---

## 将构建的Advisors放入缓存

一般项目启动后，切面类就不会发生变化了，那么我们下次来获取Advisors时，难道要将上边的逻辑全部都执行一遍吗？

显然是不合理的，更好的做法是，我们可以将构建好的Advisors放入缓存，那么下一次就可以不用走上边繁琐的流程，而是直接从缓存中获取Advisors，其实Spring也是这样做的。

这个时候Spring会将构建好的classAdvisors放入到缓存中，而缓存对应的key就是beanName，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211153635.png)

我们可以看到，其实放入缓存的时候做了不同的处理，简单说就是，如果是单例bean的话，那么就直接将构建好的增强classAdvisors放入缓存中，这样下一次就可以直接从缓存中获取了

而如果不是单例bean的话，那么就直接将factory放入缓存中，这样方便下一次直接使用factory快速构建Advisors。

最后一旦将增强classAdvisors或factory放入缓存后，那么下次调用这个buildAspectJAdvisors()方法时，就直接可以从缓存中快速获取了，如下图

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211153641.png)

通过上边这张图，我们可以看到，在为bean构建Advisors的过程中，会通过步骤1 aspectNames.add(beanName)）记录处理过的切面类，而最后处理完后，会通过步骤3 this.aspectBeanNames = aspectNames将处理过的切面类赋值给this.aspectBeanNames

这样当下一次再调用buildAspectJAdvisors()方法时，这个this.aspectBeanNames就不会为null，此时会执行步骤4 `List<String> aspectNames = this.aspectBeanNames`这行代码，那么此时aspectNames的值就是之前处理过的切面类的beanName，所以aspectNames是不为null的，也就是说步骤5 aspectNames == null 的结果为false，此时就会直接从缓存中获取了，也就是步骤6

接着buildAspectJAdvisors()方法构建的advisor就会放入到advisors集合中，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211153646.png)

经过这个findCandidateAdvisors()方法的处理，那么IOC容器中所有的增强都会被放入到advisors集合中，最后作为结果返回

也就是说，到目前为止这行代码`List<Advisor> candidateAdvisors = findCandidateAdvisors()`已经执行完毕了，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211153649.png)

此时返回的这个candidateAdvisors中就包含了IOC容器中所有切面类中的所有增强Advisor，那此时我们总不能无脑让这些增强都适用于当前bean吧？这个肯定是不对的，有可能我们这个bean完全都不满足某一个切面类的切点表达式，对吧？

那接下来该怎么做呢？

其实很简单，那就是从所有切面类的所有增强Advisor中，找到与当前bean相匹配的增强Advisors，也就是执行`List<Advisor> eligibleAdvisors = findAdvisorsThatCanApply(candidateAdvisors, beanClass, beanName)`这行代码了。

这个findAdvisorsThatCanApply()方法会使用增强Advisor中的切点表达式与当前bean中的方法做匹配，从而找到与当前bean匹配的增强Advisor，这个我们下篇文章接着分析。

---

## 总结

一张图来梳理下AOP代理的创建流程

![img](http://wechatapppro-1252524126.file.myqcloud.com/apppuKyPtrl1086/image/ueditor/8603200_1647060120.png)

上图是目前为止，我们分析的AOP代理创建流程的源码图，其中红色背景的部分就是我们今天新分析的内容。

我们来总结一下，在通过doWithMethods()方法获取到用户声明的方法后，会遍历处理每个方法，在处理方法的时候会看下这个方法是否被AspectJ的六种注解之一标注，这六种注解分别是`@Pointcut`、`@Around`、`@Before`、`@After`、`@AfterReturning`、`@AfterThrowing`

需要注意的是虽然这里是六种注解，但是@Pointcut注解的方法已经提前在doWithMethods()方法中给排除掉了，所以其实这里主要针对的是后五种注解方法的处理，如果没有被这些注解标注的话，那么就跳过这个方法，开始处理下一个方法。

而如果这个方法被AspectJ的六种注解之一（主要是后五种注解）标注的话，那么说明这个方法就是增强方法，此时就会将这个增强方法构建为Advisor，其实这个**增强Advisor就是一个`InstantiationModelAwarePointcutAdvisorImpl`类的一个实例罢了**。

接着会将构建的增强Advisor放入到增强集合advisors中，最后会将增强集合advisors放入缓存，以便下一次直接从缓存中获取advisors，这样可以提升执行效率。

最后的最后就是将所有的增强advisors作为结果返回，其实就是作为下一个方法的入参，继续往下进行处理，说白了就是从所有的增强Advisor中，匹配出当前bean适用的增强了，这个我们下篇文章接着分析。