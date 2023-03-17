---
title: 57_JDK代理的执行：Advice和拦截器之间是什么关系？
category:
  - Spring源码
star: true
sticky: true
date: 2023-03-17
---

<!-- more -->

# 开篇

大家好，上节我们将getInterceptors()这个方法作为分析的入口，主要分析了Advice advice = advisor.getAdvice()这行代码，我们知道这行代码经过一通处理，最终会将不同类型的增强方法，给封装到不同的advice中，而这些advice中有的实现了MethodInterceptor接口，有的则实现的是其他的接口。

那么前边花了这么一番功夫构建的advice到底有什么用呢？我们这节就来接着分析下getInterceptors()方法剩下的代码。

学习完本节内容，可以解决下边这些问题：

1. 实现了MethodInterceptor接口的Advice，本身是不是一个拦截器？
2. 适配器集合adapters是怎么初始化的？
3. 没有实现MethodInterceptor接口的Advice，是怎么包装为拦截器的？

---

# MethodInterceptor类型的Advice就是拦截器?

我们先来回顾一下，上节我们将这行代码分析完毕了，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302281957112.png)

这里简单回顾下，上边这行代码都干了啥，首先advisor其实就是InstantiationModelAwarePointcutAdvisorImpl类的一个实例，当时构建这个InstantiationModelAwarePointcutAdvisorImpl实例时，将增强方法作为参数给传递了进去，所以这个advisor中包含了切面中定义的增强方法，比如afterReturning()增强方法。

而这行代码的作用，**就是按照增强方法上AspectJ注解的类型，将增强方法封装到不同的Advice中，比如增强方法afterReturning()会被封装到AspectJAfterReturningAdvice中，而增强方法before()会被封装到AspectJMethodBeforeAdvice中，最后将封装好的advice作为结果返回**。

好，上边这行代码执行完毕后，我们就拿到了一个advice，那么接下来，我们接着getInterceptors()方法继续往下分析，此时我们会看到下边这块代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302281957588.png)

通过上边的代码，我们可以看到，如果这个advice是MethodInterceptor接口实现类的话，那么就直接将advice强转为MethodInterceptor类型并放入到拦截器interceptors中。

为什么可以这么判断？

大家还记得吗？上节我们在分析advice的构建流程时，发现有一部分增强方法构建出来的Advice实例其实是MethodInterceptor接口的实现类，比如AspectJAfterAdvice，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302281957084.png)

通过上图，我们看到这个AspectJAfterAdvice就实现了MethodInterceptor接口，其中invoke()方法就是MethodInterceptor接口中定义的。

所以像AspectJAfterAdvice就会被直接放到拦截器interceptors中，代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302281958032.png)

说白了就是如果advice是MethodInterceptor的实现类，那么就将advice强转后直接放入到拦截器interceptors中

那么上节构建的advice中，都有哪些advice实现了MethodInterceptor接口，而又有哪些没有实现MethodInterceptor接口呢？

其实这个很简单，我们来看下MethodInterceptor接口的继承关系就知道了，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302281958429.png)

通过上图，我们可以看到，AspectJAfterAdvice、AspectJAroundAdvice、AspectJAfterThrowingAdvice都实现了MethodInterceptor接口，因此这三种Advice本身就是拦截器，而这三种Advice分别对应了@After、@Around和@AfterThrowing这三种增强。

所以这三种增强可以通过下边的代码，直接添加到拦截器集合interceptors中

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302281958373.png)

所以上边这块代码的作用，其实就是将实现了MethodInterceptor接口的增强添加到拦截器中，就是做这个事儿的。

需要注意的是，上边的这个MethodInterceptor接口的类继承图，我们只是列出了和我们相关的一部分而已，其实MethodInterceptor接口的实现类还是比较多的，这个大家知道就行了。

---

# 初始化适配器adapters

分析到这里，我们知道了`@After`、`@Around`和`@AfterThrowing`三种增强，会被添加到拦截器interceptors中。

但是我们知道AspectJ中一共是有五种增强的，那剩下没有实现MethodInterceptor接口的增强又该怎么处理呢？

这里我们先来猜测一波，我们知道getInterceptors()方法中最终要返回的是拦截器集合interceptors，而interceptors的定义则是MethodInterceptor类型的List集合。

那么此时我们就需要将AspectJ中的五种增强都放到interceptors中返回，但是其中有两种增强，因为没有实现MethodInterceptor接口，所以不能直接放入到interceptors中，那这个时候怎么办呢？

其实很简单啊，我们将没有实现MethodInterceptor接口的增强包装一下不就得了？说白了就是将它们包装为MethodInterceptor类型的实例。

目前为止呢，这个只是我们的猜测，那到底是不是这样处理的呢？我们继续往下分析就知道了。

其实呢，对于没有实现MethodInterceptor接口的增强，会有单独的逻辑进行处理，我们继续往下看，就会看到这样一块代码，如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302281958733.png)

通过上边的代码，可以看到，这里主要是对this.adapters进行了遍历处理。

那么这个this.adapters是什么呢？我们来找下它的定义，此时会发现这些代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302281959214.png)

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302281959703.png)

通过上边的代码，我们可以看到，这个adapters其实就是一个List集合，默认大小为3，是通过构造方法进行初始化的。

而构造方法通过调用registerAdvisorAdapter()方法，向adapters中添加了3个Adapter，分别是MethodBeforeAdviceAdapter、AfterReturningAdviceAdapter和ThrowsAdviceAdapter，看名字就是适配器的意思。

---

# 非MethodInterceptor类型的Advice是怎么包装为拦截器的？

好了，现在我们知道了adapters中，其实就是MethodBeforeAdviceAdapter、AfterReturningAdviceAdapter和ThrowsAdviceAdapter这三个Adapter，那么我们回到主线，继续往下分析，我们现在要分析的代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302281959057.png)

通过上边的代码，我们可以看到，这里会遍历adapters中的三个Adapter，然后会调用Adapter的supportsAdvice()方法，通过名字来猜测，这个supportsAdvice()方法应该是来判断是否支持增强的。

那现在我们已经知道了adapters中的三个Adapter都是谁了，那么我们就干脆来看下这三个Adapter中的supportsAdvice()方法都是怎么实现的吧，此时代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302282000804.png)

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302282000410.png)

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302282000389.png)

通过上边的代码，可以看到，这三个Adapter的supportsAdvice()方法，主要是来看一下这个advice是不是指定的类型，比如MethodBeforeAdviceAdapter会看一下advice是不是MethodBeforeAdvice类型，而AfterReturningAdviceAdapter则是看一下advice是不是AfterReturningAdvice类型。

那剩下的这两种增强，也就是@Before和@AfterReturning，到底是哪种类型呢？

这个其实也简单，我们来看下这两种增强的类继承关系就知道了，首先我们来看下@Before增强的类继承图，也就是AspectJMethodBeforeAdvice的类继承图，如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302282000982.png)

此时我们可以看到，AspectJMethodBeforeAdvice实现了MethodBeforeAdvice接口。

此时我们可以得到什么结论呢？

其实就是当advice为AspectJMethodBeforeAdvice时，由于AspectJMethodBeforeAdvice实现了MethodBeforeAdvice接口，所以此时适配器MethodBeforeAdviceAdapter的supportsAdvice()方法就会返回true！

好了，得到这个结论后，我们接着来看下@AfterReturning的类继承图，也就是AfterReturningAdvice的类继承图，如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302282000692.png)

此时我们可以看到AspectJAfterReturningAdvice实现了AfterReturningAdvice接口。

那这里我们又可以得到什么结论呢？

其实很简单，那就是当advice为AspectJAfterReturningAdvice时，由于AspectJAfterReturningAdvice实现了AfterReturningAdvice接口，所以适配器AfterReturningAdviceAdapter的supportsAdvice()方法会返回true！

一旦supportsAdvice()方法返回true，那么就会执行下边这行代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302282000536.png)

通过上边的代码，大家可以看到，这里其实就是会调用适配器Adapter的getInterceptor()方法。

那现在我们将supportsAdvice()方法和getInterceptor()方法结合起来，来看下这块for循环的代码到底是啥意思。

当advice为AspectJMethodBeforeAdvice时，遍历到适配器MethodBeforeAdviceAdapter时，supportsAdvice()方法会返回true，那么这个时候就调用适配器MethodBeforeAdviceAdapter的getInterceptor()方法开始处理AspectJMethodBeforeAdvice了，最后将处理结果放到拦截器interceptors中。

而当advice为AspectJAfterReturningAdvice时，此时遍历到适配器AfterReturningAdviceAdapter，然后发现supportsAdvice()方法的执行结果为true，那么就会调用适配器AfterReturningAdviceAdapter的getInterceptor()方法来处理AspectJAfterReturningAdvice，最后将处理结果放入拦截器interceptors中。

同学们，分析到这里，大家发现了吗？

其实这个for循环遍历适配器的代码，无非就是为了让合适的适配器来处理这个advice，比如适配器MethodBeforeAdviceAdapter就是专门来处理AspectJMethodBeforeAdvice的；而适配器AfterReturningAdviceAdapter就是专门来处理AspectJAfterReturningAdvice的。

那么具体是怎么处理的呢？

很简单啊，那不就是通过getInterceptor()方法来处理的蛮，我们先来看下适配器MethodBeforeAdviceAdapter的代码，我们看这里：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302282001276.png)

通过上边的代码，我们可以看到，这里其实就是将advice包装为了一个MethodBeforeAdviceInterceptor类的实例。而MethodBeforeAdviceInterceptor类的构造方法如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302282001718.png)

通过上边的代码，我们可以看到，这个构造方法非常简单，主要就是传递了这个advice，而且比较重要的是这个MethodBeforeAdviceInterceptor实现了MethodInterceptor接口，说白了，这里无非就是将一个advice包装为了一个拦截器MethodInterceptor。

好了，我们再来看一下适配器AfterReturningAdviceAdapter的处理，代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302282001830.png)

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302282001983.png)

通过上边的2张图，大家可以看到，这里是将advice封装到了AfterReturningAdviceInterceptor中，而这个AfterReturningAdviceInterceptor也实现了MethodInterceptor接口，所以这里其实也是将advice包装为一个拦截器MethodInterceptor。

所以现在就验证了我们刚才的猜想，那就是对于没有实现MethodInterceptor接口的advice，会有专门的处理逻辑，将这些advice包装为MethodInterceptor类型，说白了就是包装为了拦截器，而这块专门的处理逻辑，就是下边红框中的代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302282001892.png)

通过上边的代码，我们可以看到，将advice包装为拦截器后，接着就将拦截器放入了拦截器集合interceptors中，最后会将拦截器集合interceptors作为结果返回。

那这里我们思考一个问题：那就是Advice和拦截器到底有什么关系？

其实很简单，不过首先我们需要知道一个前提，那就是拦截器说白了就是MethodInterceptor接口的实现类

知道这个前提后，我们接着来分析下，**其实Advice可以分为有两大类，一类是实现了MethodInterceptor接口的，另外一类是没有实现MethodInterceptor接口的**。

**对于实现了MethodInterceptor接口的这些Advice来说，Advice本身就是一个拦截器，此时Advice和拦截器就是同一个东西**。

**而对于没有实现MethodInterceptor接口的Advice来说，Advice和拦截器MethodInterceptor没有直接关系，但是Spring会将Advice作为一个属性，给封装到MethodInterceptor的实现类中，所以此时Advice其实就是拦截器中的一个属性**。

---

# 总结

好了，今天的知识点，我们就讲到这里了，我们来总结一下吧。

一张图来梳理下AOP代理的执行流程

![20230228200312](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302282003049.png)