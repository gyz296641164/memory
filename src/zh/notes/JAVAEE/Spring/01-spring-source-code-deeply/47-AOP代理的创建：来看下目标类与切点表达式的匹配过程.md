---
title: 47_AOP代理的创建：来看下目标类与切点表达式的匹配过程
category:
  - Spring源码
star: true
sticky: true
date: 2023-03-17
---

<!-- more -->

## 开篇

上篇文章我们主要分析了增强方法构建为Advisor的过程，接着所有切面类中的所有增强方法，都会按照这个过程构建出各自的增强Advisor出来，那么这篇文章，我们就来看下当前bean，也就是目标类，和增强中的切点表达式的匹配过程。

按照惯例，在开始分析之前，我们先提纲挈领的介绍下文章的主要内容，如下：

1. 分析源码时，我们会发现增强是有分类的，此时我们会介绍下**普通增强**和**引介增强**
2. 然后我们会跟踪目标类和切点之间的匹配过程，此时会发现匹配主要分为**类级别匹配**和**方法级别匹配**两部分

---

## 增强还有分类？普通增强、引介增强都是什么？

涉及方法：

- `org.springframework.aop.framework.autoproxy.AbstractAdvisorAutoProxyCreator#findAdvisorsThatCanApply`

先回顾一下上篇文章我们看到了哪个位置，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230213073830.png)

我们看到这里调用了findAdvisorsThatCanApply()方法，然后将candidateAdvisors和bean作为入参给传了进去。

从这个方法名字和出参eligibleAdvisors的名字来看，这个findAdvisorsThatCanApply()方法的作用，就是用来完成bean和candidateAdvisors之间的匹配的，最后会将bean匹配到的增强advisors作为出参进行返回，所以这个方法是我们重点要研究的方法。

那接下来，我们当然是点进去这个findAdvisorsThatCanApply()方法来看一下啦，代码如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230213073841.png)

我们可以看到，这里直接调用了AopUtils.findAdvisorsThatCanApply()方法进行的匹配，然后将candidateAdvisors和当前要匹配的beanClass作为入参给传了进去。

那接下来，我们当然是进到AopUtils.findAdvisorsThatCanApply()方法来看一眼啦，此时我们可以看到如下代码

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230213073845.png)

通过上边这张图，我们可以看到，这里有两块处理逻辑，也就是红框圈出来的2块代码，我们发现这2块逻辑都会往最终结果eligibleAdvisors中添加元素。

其中第一块逻辑，也就是第一个for循环中，是当 candidate instanceof IntroductionAdvisor 为true时，就会调用canApply(candidate, clazz)方法进行匹配

而第二块逻辑，也就是第二个for循环中，是当 candidate instanceof IntroductionAdvisor 为false时，会调用canApply(candidate, clazz, hasIntroductions)方法进行匹配。

那这个IntroductionAdvisor到底是何方神圣？此时我们可以点进来看下IntroductionAdvisor的定义，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230213073851.png)

此时我们发现这个IntroductionAdvisor其实就是一个接口，而且它还继承了Advisor接口

其实这个IntroductionAdvisor代表了一种增强，我们一般称为“引介增强”，这种引介增强控制的是类级别，控制粒度是比较粗的，所以一般我们不常用，其实candidate instanceof IntroductionAdvisor这行代码，说白了就是用来判断candidate是不是引介增强的。

那现在问题来了，这里的candidate，也就是candidateAdvisors数组中的Advisor到底是不是引介增强呢？说白了就是有没有实现IntroductionAdvisor接口？

其实如果前边的文章，大家都认真学习了的话，那么就知道这个Advisor其实是InstantiationModelAwarePointcutAdvisorImpl类的一个实例，因为构建这个Advisor的时候是直接通过InstantiationModelAwarePointcutAdvisorImpl类的构造方法来完成的。

那现在就好办了，我们直接来看下InstantiationModelAwarePointcutAdvisorImpl类的继承关系不就知道了吗？此时InstantiationModelAwarePointcutAdvisorImpl类的继承关系如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230213073858.png)

我们可以看到，PointcutAdvisor接口（普通增强）和IntroductionAdvisor接口（引介增强）都继承了Advisor接口，而InstantiationModelAwarePointcutAdvisorImpl类实现的是PointcutAdvisor接口，而不是IntroductionAdvisor接口，也就是说当前这个candidate并不是引介增强，而是一个普通增强。

所以此时candidate instanceof IntroductionAdvisor这行代码会返回false，接着就会执行普通增强的匹配逻辑，也就是会执行这行代码，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230213073901.png)

所以此时就会来执行这个canApply(candidate, clazz, hasIntroductions)方法了。

关于普通增强，这里再补充一点，那就是大家还记得吗？我们在定义切面的时候可是指定了切点表达式的哦，利用切点表达式我们可以匹配到方法级别，由于普通增强控制的粒度更细，所以我们一般会使用这种PointcutAdvisor类型的增强，也就是普通增强。

---

## 来跟踪下目标类与切点表达式的匹配过程

接下来，我们就来看下普通增强到底是怎么进行匹配的，此时我们点进去canApply(candidate, clazz, hasIntroductions)方法，就会看到如下代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230213080149.png)

通过上边这张图，我们可以看到，和刚才一样，这里有引介增强和普通增强的处理，那我们这里的advisor刚才也分析了，它其实就是InstantiationModelAwarePointcutAdvisorImpl类的一个实例，也就是PointcutAdvisor接口的实现类，因此这里就会执行canApply(pca.getPointcut(), targetClass, hasIntroductions)这行代码来进行方法级别的匹配。

此时我们点进去canApply(pca.getPointcut(), targetClass, hasIntroductions)方法，会看到下面的代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230213080152.png)

通过上边这张图，我们可以看到，这里分别在类级别和方法级别进行匹配，首先会调用pc.getClassFilter().matches(targetClass)进行类级别的匹配，说白了就是使用切点表达式和目标类进行匹配，如果在类级别都不满足切点表达式的话，那么就没必要进一步去匹配方法了。

只有当类级别满足切点表达式之后，才会进行方法级别的匹配，此时就会获取目标类中的方法，然后依次判断每个方法是否与切点表达式正常匹配，只要目标类中有一个方法可以和切点表达式匹配上，那么就直接返回true，说白了就是此时这个目标类需要设置为代理。

那么现在的重点，就是目标类方法和切点表达式是怎么进行匹配的？这一块我们还需要再深入探索一下，此时我们点进去introductionAwareMethodMatcher.matches(method, targetClass, hasIntroductions)方法来看一下，代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230213080156.png)

通过上边这张图，我们可以看到这里直接调用getTargetShadowMatch(method, targetClass)方法获取了匹配结果shadowMatch，而如果shadowMatch.alwaysMatches()方法的结果为true的话，那么就说明这个类是需要创建代理的。

因此核心匹配的逻辑在这个getTargetShadowMatch(method, targetClass)方法中，那还有啥好说的，我们继续跟进呗，此时我们会看到下面的代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230213080200.png)

可以看到，这里其实没啥，主要就是调用了另外一个方法getShadowMatch(targetMethod, method)。

那我们继续跟进getShadowMatch(targetMethod, method)方法

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230213080203.png)

此时我们可以看到，刚进来这个方法时，会看一下缓存中有没有shadowMatch，第一次进来的话肯定是没有的，所以就会进来这个if分支的代码，那么此时就会执行非常核心的一块代码，就是shadowMatch = obtainPointcutExpression().matchesMethodExecution(methodToMatch)这行代码。

首先我们来看下这个obtainPointcutExpression()方法是干嘛的，代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230213080207.png)

我们可以看到，原来在这个obtainPointcutExpression()方法中，进行了AspectJ切点表达式的解析，比如我们日志切面类中的切点表达式execution(public * com.ruyuan.aop.service.ProductServiceImpl.*(..))，最后解析完切点表达式之后，会将切点表达式构建为一个PointcutExpressionImpl类的实例，也就是说obtainPointcutExpression()方法返回的其实就是一个PointcutExpressionImpl类的实例。

刚才我们执行到了shadowMatch = obtainPointcutExpression().matchesMethodExecution(methodToMatch)这行代码，现在obtainPointcutExpression()方法返回了一个PointcutExpressionImpl类的实例，那么接下来就会调用PointcutExpressionImpl类的matchesMethodExecution(methodToMatch)来完成切点表达式和目标类的匹配。

正当我们进入PointcutExpressionImpl类一探究竟时，我们发现这个PointcutExpressionImpl类竟然是aspectj包下的类，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230213080212.png)

也就是说方法匹配这块是由aspectj包完成的，而不是Spring来完成的，Spring只是借助了人家aspectj现成的功能罢了。

那么aspectj是在哪里被引入了呢？

其实Spring是在spring-aspects中引入了aspectjweaver的依赖，我们看这里

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230213080216.png)

我们可以看到在spring-aspects的pom文件中，引入了aspectjweaver的依赖。

---

## 总结

一张图来梳理下AOP代理的创建流程

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230213080229.png)

上图是目前为止，我们分析的AOP代理创建流程的源码图，其中红色背景的部分就是我们今天新分析的内容。

我们来总结一下，在文章一开始，我们面临的问题是：怎么在所有的增强Advisors中，找到与目标类匹配的增强呢？

为了搞清楚这个问题，我们从findAdvisorsThatCanApply()方法开始进行分析，简单说就是，首先会遍历所有的增强Advisors，让每个增强Advisor都与目标类进行匹配。

而在匹配的时候，核心逻辑主要分为两块，一块是先在类级别进行匹配，如果在类级别增强和目标类都匹配不上，那么就代表匹配失败，此时说明当前增强不适用与目标类，那么这个时候就会开始匹配下一个增强。

而如果在类级别通过匹配的话，那么接下来就是在方法级别进行匹配了。这个方法级别的匹配也是最复杂的，这个我们就放到下篇文章再接着分析吧。