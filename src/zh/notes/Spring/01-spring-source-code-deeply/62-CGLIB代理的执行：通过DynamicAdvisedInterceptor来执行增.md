---
title: 62_CGLIB代理的执行：通过DynamicAdvisedInterceptor来执行增
category:
  - Spring源码
star: true
sticky: true
date: 2023-03-17
---

<!-- more -->



## 开篇

大家好，上节我们分析了cglib代理创建的整个流程，简单来说，就是通过**字节码增强器Enhancer**的api来完成的，这个字节码增强器Enhancer之前我们也玩儿过，其实非常简单。

我们知道，cglib代理创建成功后，当代理中的方法被调用时，那么就会回调指定的拦截器，而在拦截器中，就会来执行增强方法和目标方法了。

我们知道，**jdk代理的执行过程，主要分为获取拦截器链和执行拦截器链两大块**，那么cglib代理的执行过程，是不是也有类似的处理呢？

其实啊，这里简单剧透一下，**其实cglib代理在执行时，也会先获取拦截器链，接着执行获取到的拦截器链**，那么cglib处理拦截器链时，和jdk代理的处理又有什么差别呢？我们这节课就来分析下。

在开始分析之前，先介绍下本节的主要内容，通过本节的学习呢，可以为大家解决下边的问题：

1. cglib代理核心逻辑的入口在哪里？

   `org.springframework.aop.framework.CglibAopProxy.DynamicAdvisedInterceptor#intercept`

2. 在cglib代理中，是如何获取拦截器链的？

3. 在cglib代理中，是如何执行拦截器链的？

---

## intercept()方法：cglib代理核心逻辑入口

通过前边的学习，我们知道，当调用jdk代理中的方法时，会回调到JdkDynamicAopProxy的invoke()方法，那么cglib代理中的方法被调用时，会回调到哪个类的哪个方法呢？

我们上节讲过，在为cglib代理创建拦截器回调数组时，其实里边有一个极为重要的拦截器，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303091450643.png)

通过上图，大家可以看到，这个极为重要的拦截器其实就是DynamicAdvisedInterceptor，这个就是AOP回调需要用到的拦截器，说白了就是，当cglib代理中的方法被调用时，其实就会回调到这个DynamicAdvisedInterceptor。

现在呢，我们知道会回调到DynamicAdvisedInterceptor类了，那么具体是回调这个类的哪个方法呢？

这个简单，我们来看一下，当时我们玩儿Enhancer的示例代码就知道了，代码如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303091450222.png)

通过上图，可以看到，当时我们的核心逻辑，都放在了intercept()方法中

所以根据之前我们玩儿字节码增强器Enhancer的经验，可以知道，当cglib代理的方法被调用时，其实是会回调到DynamicAdvisedInterceptor类的intercept()方法的！

那还有啥好说的，我们来看下DynamicAdvisedInterceptor类的intercept()方法呗。

其实啊，这个DynamicAdvisedInterceptor其实是CglibAopProxy中的一个内部类，而DynamicAdvisedInterceptor的intercept()方法，代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303091450262.png)

上图就是拦截器DynamicAdvisedInterceptor中intercept()方法的代码了，我们接下来一块一块分析吧。

---

## cglib代理是如何获取拦截器链的？

那么首先就会来执行下边这块代码，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303091457709.png)

通过上图，可以看到，这块代码其实很简单，就是用来获取目标类的，其实最终获取的这个目标类targetClass的值就是ProductServiceImpl，在分析jdk代理的invoke()方法时，也有类似的代码，非常简单。

好，获取到目标类后，我们继续往下看，此时就会看到下边这行代码，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303091457041.png)

看到上边这行代码，大家有没有觉得很熟悉？咋感觉这里获取拦截器链的代码，在分析jdk代理时见过呢？

带着这个疑问，我们点进去这个getInterceptorsAndDynamicInterceptionAdvice()方法来看下，此时就会看到下边这块代码，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303091457199.png)

看到上边的代码后，简直惊呆了，这个不就是我们分析jdk代理时，获取拦截器链的代码吗？

难道cglib代理在获取拦截器链时，和jdk代理调用的是同一个方法？

哈哈，同学，你猜对了，确实是这样的，cglib代理和jdk代理在获取拦截器链时，调用的确实是同一个方法，说白了就是获取拦截器链的流程是完全一模一样的！惊不惊喜意不意外？哈哈哈

那现在就好办了，之前我们分析jdk代理时，重点分析过这个获取拦截器链的流程，这里呢，我们就当做一个回顾，通过之前的流程图，简单再来看下获取拦截器链的整个流程，我们看下边这张图：

![20230309145828](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303091458668.png)

通过上图，我们可以看到，在获取拦截器链时，首先会将目标方法作为缓存key，到缓存中看下对应的拦截器链存不存在，如果存在的话，那么就将拦截器链作为结果返回。

而如果缓存中不存在拦截器链的话，那么就会从ProxyFactory中获取目标类级别对应的增强，接着去遍历这些增强，遍历的时候，会先来看下目标方法所在的类和增强是否匹配，如果类级别匹配的话，那么会接着看下目标方法与切点表达式在方法参数、方法名称、方法抛出异常、方法返回值维度是否都可以精确匹配，最后将匹配上的增强收集起来。

接着就开始处理这些匹配成功的增强，简单来说，就是将这些匹配成功增强中的增强方法统一封装为拦截器，然后这些拦截器会统一放到一个拦截器集合中，而这个拦截器集合其实就是拦截器链，然后就会将这个拦截器链放到缓存中，最后会将这个拦截器链作为结果返回。

这个就是获取拦截器链的整个过程，我们简单回顾了一遍，至于里边的一些细节，我们之前都详细讲过，这里就不再赘述了。

---

## cglib代理是如何执行拦截器链的？

那么获取到拦截器链之后，下一步该做什么了呢？

我们继续往下看，获取拦截器之后，就要执行下边这块代码了，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303091501134.png)

通过上图，大家可以看到，其实这里的逻辑和jdk代理的逻辑差不多，都是一样的套路。

说白了，就是先看下拦截器链chain是不是为空，如果为空的话，说明此时没有增强需要执行，那此时直接执行目标方法就完事儿了。

而如果拦截器链chain不为空，那此时就需要来执行拦截器链中的增强方法了，此时就会执行下边这行代码了，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303091501711.png)

通过上图，可以看到，这里先通过构造方法创建了一个CglibMethodInvocation类的实例，接着调用了这个实例的proceed()方法。

我们先来看下这个构造方法都做了什么，代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303091501041.png)

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303091501079.png)

通过上边2张图，我们可以看到，其实CglibMethodInvocation主要依赖于父类ReflectiveMethodInvocation的构造方法完成的初始化，其中比较重要的，就是将拦截器链chain最终赋值给了成员变量interceptorsAndDynamicMethodMatchers

ok，在CglibMethodInvocation的实例构建完成后，下一步就要调用CglibMethodInvocation的proceed()方法了，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303091501333.png)

也就是说，接下来要调用CglibMethodInvocation类的proceed()方法了，那这时候，我们来看下proceed()方法的代码呗，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303091501806.png)

通过上图，大家可以看到，其实proceed()方法关键就一行代码，那就是super.proceed()，说白了就是依赖于父类的proceed()方法完成了功能。

那么父类是谁呢？

其实我们刚刚分析过，这个父类其实就是ReflectiveMethodInvocation，那还有啥好说的，我们来看下ReflectiveMethodInvocation类中的proceed()方法呗，此时我们会看到下边的代码，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303091501404.png)

看到上边的代码，大家有没有觉得很眼熟呢？

觉得眼熟就对了，其实这个proceed()方法，就是之前我们分析jdk代理执行拦截器链时，不断递归调用的那个proceed()方法！

只不过当时jdk代理的玩儿法是直接调用ReflectiveMethodInvocation类的proceed()方法，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303091501298.png)

通过上图，可以看到，在JdkDynamicAopProxy中的处理，是直接new了一个ReflectiveMethodInvocation实例，接着调用了这个实例proceed()方法。

而在这里cglib的处理，其实就是先构造了一个CglibMethodInvocation的实例，而这个CglibMethodInvocation其实是ReflectiveMethodInvocation的子类，接着会调用子类CglibMethodInvocation的proceed()方法，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303091501517.png)

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303091501144.png)

通过上图，可以看到，其实在子类CglibMethodInvocation的proceed()方法中，其实还是依赖于父类ReflectiveMethodInvocation的proceed()方法完成的功能，所以cglib在执行拦截器链时，本质还是调用了ReflectiveMethodInvocation的proceed()方法，其实和jdk代理执行拦截器链是一样的套路！

后续的流程，其实就是不断的递归调用ReflectiveMethodInvocation的proceed()方法，从而将所有的拦截器串成一根链条，这样拦截器之间就会按照一定的顺序，执行各自的增强方法了，就像下图：

![image-20230309150357477](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303091503605.png)

通过上图，大家可以看到，在满足递归结束的条件后，首先会执行目标方法，而执行完目标方法后，接着就会层层返回执行结果，接着其他的拦截器就会分别执行自己内部的增强方法了，执行拦截器链的整个过程，之前我们详细分析过，所以这里就不再赘述了。

最后当拦截器链执行完成后，对拦截器链的返回值，做简单处理后，直接作为结果进行返回，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303091504671.png)

到这里为止，cglib代理的执行流程就结束了，可以看到，其实cglib代理在执行时，核心的两大流程，即获取拦截器链和执行拦截器链，其实和之前分析jdk代理的流程是一模一样的！

所以如果之前分析jdk代理时，大家认真学习了的话，那么这里看cglib代理的执行流程时，是非常非常轻松的。

---

## 总结

好了，今天的知识点，我们就讲到这里了，我们来总结一下吧。

一张图来梳理下AOP代理的执行流程

![557725001647063044](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303091506308.png)

上图是目前为止，我们分析的AOP代理执行流程的源码图，我们来总结下本节的内容。

当cglib代理中的方法被调用时，这个时候就会回调到DynamicAdvisedInterceptor中的intercept()方法，而这个intercept()方法其实和jdk代理中的invoke()方法的作用是一样的，首先都会获取目标方法对应的拦截器链，成功获取到拦截器链后，就是执行拦截器链了，最后将拦截器链的返回值作为结果进行返回。

而对于获取拦截器链和执行拦截器链的处理流程，cglib代理和jdk代理完全是一个套路，之前分析jdk代理时，我们都详细分析过了，所以处理细节这里就不再赘述了。