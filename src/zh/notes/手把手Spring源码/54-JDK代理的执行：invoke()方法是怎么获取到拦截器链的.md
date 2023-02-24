---
title: 54_JDK代理的执行：invoke()方法是怎么获取到拦截器链的？
category:
  - Spring源码
---

## 开篇

大家好，通过上篇文章的分析，我们目前知道了invoke()方法的核心处理流程，简单说就是先对特定方法进行针对性的处理，然后再获取目标方法的拦截器链，最后执行拦截器链并返回结果。

但是具体是怎么获取目标方法对应拦截器链的？又是怎么执行拦截器链的？这些我们目前都不清楚，不过没事儿，我们一个一个来解决，今天我们就先来分析下：目标方法对应拦截器链的获取过程。

在分析之前，我们先来思考几个问题：

1. 我们知道同一个方法是会多次执行的，那么每次调用同一个方法时，难道都要重复执行一遍拦截器链的获取流程吗？这里可以使用缓存进行优化吗？
2. 我们之前在ProxyFactory中添加的增强advisors，在invoke()阶段会使用到吗？
3. 在处理增强时，普通增强、引介增强需要分开处理吗？

可以看到，其实上边这几个问题都不难，都是在处理时的一些细节罢了，不提出来的话，大家可能想不到，但是一旦提出来，其实大家简单思考过后，都是知道答案的。

其实呢，在今天的文章中，也都是可以找到这些问题的答案的，那废话就不多说了，现在就开始今天的探索之旅吧。

---

## 优先从缓存中获取拦截器链

好，那现在我们也废话不多说了，我们今天主要就是来分析一下拦截器链的获取过程，分析入口就是下边这行代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302211402171.png)

通过上边的代码，大家可以看到，其实获取拦截器链的核心逻辑都封装在这个getInterceptorsAndDynamicInterceptionAdvice()方法中。

那我们直接点进来看下吧，此时就会看到下边这块代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302211402380.png)

通过上边的代码，大家可以看到，在这个方法中，首先将method作为入参，构建出来了一个缓存key对象MethodCacheKey，然后使用这个缓存key从缓存methodCache中获取拦截器链。

那这个methodCache是什么数据结构呢？目前为止看起来应该是一个Map，这个时候我们翻代码找了一下，发现methodCache确实是一个Map，定义如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302211402696.png)

大家可以看到，在上边的代码中，缓存methodCache的key是一个MethodCacheKey对象，而value则是一个List集合，其实就是专门放拦截器使用的，其实这个value就是我们要获取的拦截器链

既然现在已经确定缓存methodCache是一个Map了，那么再从Map中获取拦截器链时，一定会使用到key，那么这个key是怎么构造出来的呢？说白了就是MethodCacheKey对象是怎么构造出来的呢？

这个时候我们来看下MethodCacheKey的构造方法，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302211402913.png)

通过上边的代码，大家可以看到，MethodCacheKey的构造方法其实很简单，其实就是将入参method本身和method的hashCode值分别赋值给了自己内部的成员变量method和hashCode了。

好了，现在搞清楚了MethodCacheKey构造方法和methodCache的数据结构后，我们再回到主线上来，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302211402269.png)

通过上边的代码，可以看到，其实就是先通过传进来的method构建出来一个缓存key，然后使用这个缓存key从methodCache中获取拦截器链cached，methodCache本质就是一个Map。

如果缓存中存在拦截器链的话，即cached不为null，就直接将拦截器链cached作为结果返回。

而如果缓存中不存在拦截器链的话，即cached为null，那么此时就调用AdvisorChainFactory的getInterceptorsAndDynamicInterceptionAdvice()方法获取拦截器链，并且将最后获取的拦截器链put到缓存methodCache中，这样当下一次获取拦截器链时，就可以直接走缓存了。

说白了这里就是使用缓存做了优化罢了，获取拦截器链的核心逻辑，其实是在AdvisorChainFactory的`getInterceptorsAndDynamicInterceptionAdvice()`方法中的。

---

## 从ProxyFactory中获取目标类对应的增强advisors

这个时候我们就来看一下getInterceptorsAndDynamicInterceptionAdvice()方法呗，此时就会看到下边这块代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302211451157.png)

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302211451046.png)

通过上边的代码，可以看到，这个方法的代码还不少，那我们还是按照老办法，一块代码一块代码来分析。

在刚进入这个方法的时候，我们会看到这块代码，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302211451960.png)

通过上边的代码，我们可以看到，首先从config中获取到了增强advisors，前边我们也分析过了，这个config其实就是最开始时构造的ProxyFactory对象，当时在构造ProxyFactory对象时，就为ProxyFactory设置了增强advisors

如果大家忘记的话，没关系，我们再回头看一眼构造ProxyFactory的代码，我们看下边这块代码

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302211451297.png)

通过上边的代码，大家可以看到，给ProxyFactory设置属性的时候，其中有一行代码就是proxyFactory.addAdvisors(advisors)，说白了就是通过这行代码将增强advisors设置给了ProxyFactory。

所以再回头看下我们这里要分析的代码，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302211451384.png)

所以这行代码Advisor[] advisors = config.getAdvisors()，说白了就是从ProxyFactory中获取当时设置的增强advisors，就是这个意思，而且大家要知道的是这个增强advisors，是当时分别通过类级别和方法级别匹配出来的。

并且需要注意的是：这个增强advisors是目标类维度对应的增强，为什么这样说呢？

因为当时为目标类匹配增强的时候，Spring的处理逻辑是：只要目标类中任意一个方法匹配上增强的切点表达式，那么就会直接将这个增强放入到目标类对应的“合格增强”集合中。

而这一块的匹配逻辑就在之前分析的那个AopUtils.canApply()方法中，如果大家忘记的话，可以回头去再看一眼，匹配这块我们分析的还是比较详细的。

好，我们接着往下看，此时我们看到了interceptorList变量和actualClass变量的声明，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302211451825.png)

从名字上来看interceptorList就是一个拦截器集合，它的大小被设置为了增强advisors的大小，而actualClass代表的则是被调用方法的声明类，声明类是通过getDeclaringClass()方法获取的，在我们这个场景中，这个声明类其实就是ProductServiceImpl。

那么到这里为止，做的事儿无非就是声明了几个变量而已，分别是当前bean适用的增强advisors、拦截器集合interceptorList以及目标类actualClass这三个变量，而目标类actualClass其实就是ProductServiceImpl这个类。

---

## 处理不同类型的增强

那么这些变量都有什么作用呢？目前为止我们还不知道，所以我们需要继续往下看代码，这个时候我们会看到这样一块代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302211452497.png)

通过上边的代码，可以看到，这里主要是一个for循环，并且这个for循环是对增强advisors做的遍历处理，然后我们发现在处理的时候有一个if else if else语句，if条件分别是advisor instanceof PointcutAdvisor和advisor instanceof IntroductionAdvisor，也就是判断当前增强到底是不是PointcutAdvisor类型和IntroductionAdvisor类型。

看到PointcutAdvisor和IntroductionAdvisor大家有没有觉得眼熟呢？

觉得眼熟就对了，在前边的文章中我们可是分析过的，这个PointcutAdvisor代表的是普通增强，而IntroductionAdvisor代表的是引介增强，引介增强的控制粒度是类级别的，一般不常用，我们常用的还是控制粒度为方法级别的普通增强，所以接下来我们主要会分析一下普通增强的处理。

那接下来该做什么处理了呢？

我们来分析一下，现在我们已经获取到了目标类在类级别对应的增强advisors，其实就是当时设置在ProxyFactory中的增强advisors。

但是呢，我们在真正执行目标方法时，肯定不能将类级别的增强advisors全部执行一遍吧？

这样肯定是不合理的，因为有的增强是不适用于当前方法（也就是目标方法）的，所以接下来就要为目标方法匹配出适用的增强，那么具体怎么进行匹配呢？

这个我们下节继续进行分析。

---

## 总结

一张图来梳理下AOP代理的执行流程

![20230221145307](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302211453820.png)