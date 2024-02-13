---
title: 58_JDK代理的执行：来初步看下拦截器链的执行流程
category:
  - Spring源码
star: true
sticky: true
date: 2023-03-17
---

<!-- more -->


## 开篇

大家好，通过前边两节的讲解，我们将之前落下的getInterceptors()方法就分析完毕了，说白了就是将增强advisor转换为拦截器MethodInterceptor的流程。

这个时候就和之前分析的invoke()方法的流程串起来了，不知道大家还记不记得，那就是之前分析invoke()方法时，我们一共有两个地方的细节都给跳过去了，说白了就是留了两个坑，一个是获取拦截器链的过程，另外一个就是拦截器链的执行过程。

第一个坑我们通过两篇文章的分析，算是把坑给填了，那么还剩下一个坑，那就是拦截器链的执行过程到底是怎么样的？

既然是我们自己挖的坑，那么就由我们自己来填呗，所以从这节开始，我们就开始分析拦截器链的执行过程了。

首先来看下这节的主要内容，如下：

1. 首先我们会看下，当拦截器链为空时，直接执行目标方法的逻辑
2. 接着会看下，当拦截器链不为空时，来分析下目标方法的执行时机
3. 最后来看下，拦截器的invoke()方法是在哪里被触发的

涉及方法：

- `org.springframework.aop.framework.JdkDynamicAopProxy#invoke`
- `org.springframework.aop.support.AopUtils#invokeJoinpointUsingReflection`
- `org.springframework.aop.framework.ReflectiveMethodInvocation构造方法`
- `org.aopalliance.intercept.Joinpoint#proceed`
- `org.aopalliance.intercept.MethodInterceptor#invoke`

---

## 知识点回顾：拦截器链为空，直接执行目标方法

在开始分析拦截器链的执行过程前，我们先整体上来看下，目前源码分析到哪个阶段了，我们看下边这张图：

![20230302131643](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303021317189.png)

上图中红色背景的部分，就是我们最近两节分析的内容，**其实就是增强advisor转换为拦截器MethodInterceptor的过程**，可以看到，拦截器最终会被放入到拦截器链中，而拦截器链会先放入缓存，接着会作为结果返回，而对应的代码其实就是下边红框中的这行代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303021317969.png)

通过上图可以看到，这个chain就是返回的拦截器链

好，那么获取到这个拦截器链chain后，该怎么进行处理呢？

这个其实就是今天我们要分析的重点了，我们继续往下看，此时就会看到下边这块代码：![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303021318151.png)

其实上边这块代码，在我们刚开始分析invoke()方法的整体执行流程时，已经做过分析了，不过在执行拦截器链之前，我们不妨再回顾一下这块的执行流程。

通过上边的代码，我们可以看到，这里会来看一下拦截器链chain是否为空，如果拦截器链chain为空的话是一种处理，而不为空是另外一种处理。

那我们先来看下，拦截器链chain为空的情况吧，如果chain为空，那么此时就会执行这行代码，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303021318167.png)

上边这行代码需要注意的地方是，在调用invokeJoinpointUsingReflection()方法时，入参有目标对象target、目标方法method、参数args。

那么这些参数传递进去后，会做些什么呢？

此时我们点开invokeJoinpointUsingReflection()方法，会看到这边的代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303021318836.png)

通过上边的代码，可以看到，这里其实直接通过反射调用了目标方法！非常的简单，关键代码其实就一行，那就是method.invoke(target, args)。

那么这里到底是什么意思呢？

其实很简单，我们来简单分析下，如果拦截器链为空，那么说明没有匹配上任何增强方法，对吧？

那么这个时候就代表，在执行目标方法的时候，不需要执行任何增强逻辑，那么这个时候可不就是直接执行目标方法就完事儿了蛮，所以这里就直接通过反射来调用目标方法了，就是这个意思。

---

## 来分析下目标方法的执行时机

拦截器链chain为空的情况我们分析过了，可以看到非常简单，那么接下来我们来分析下拦截器链chain不为空的情况，此时就会执行下边这块代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303021319371.png)

通过上图，可以看到，这里其实就两行代码，我们分开来看

首先会执行第一行代码，也就是下边这行代码

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303021319974.png)

我们可以看到，上边这行代码其实就是构建了一个ReflectiveMethodInvocation对象，构造方法的入参有目标对象target、目标方法method、参数args以及拦截器链chain等，对应的构造方法代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303021319866.png)

我们可以看到，其实上边这个构造方法非常简单，没啥特殊的，主要就是初始化目标对象target、目标方法method、拦截器链interceptorsAndDynamicMethodMatchers等属性

所以拦截器链执行的关键，还是下一行代码，也就是下边这行代码

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303021319207.png)

可以看到，由于刚才构建的invocation是ReflectiveMethodInvocation类的实例，所以上边这行代码，其实就是调用了ReflectiveMethodInvocation类的proceed()方法。

这个时候还有啥好说的，我们接着往下看呗，此时ReflectiveMethodInvocation类的proceed()方法代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303021320172.png)

通过上图，我们可以看到，这里的代码量虽然不多，但是和之前的代码相比，稍微有点复杂，那我们还是一块代码一块代码来分析。

那我们就从入口处开始分析，刚进去这个proceed()方法时，会执行下边这块代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303021320250.png)

可以看到，这里有一个布尔表达式，而布尔表达式中的interceptorsAndDynamicMethodMatchers其实就是刚才的拦截器链chain，那么this.interceptorsAndDynamicMethodMatchers.size() - 1这行代码的结果其实就是拦截器链中最后一个拦截器的下标，比如拦截器链中一共有5个拦截器的话，那么这行代码的结果就是4

那么布尔表达式中的另外一个变量currentInterceptorIndex又是多少呢？我们来看下currentInterceptorIndex的定义，代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303021320064.png)

我们可以看到，currentInterceptorIndex默认为-1，那也就是说刚开始进来的时候，这个布尔表达式的结果为false，是不满足的。

那这个条件什么时候能满足呢？

其实就是当currentInterceptorIndex的值为拦截器链最后一个拦截器的下标时，才会满足，此时就会执行invokeJoinpoint()这行代码。

那么invokeJoinpoint()这行代码究竟是干嘛的呢？

此时不妨我们点进来看下，invokeJoinpoint()方法代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303021320301.png)

通过上图，我们可以看到，其实这里又直接调用了invokeJoinpointUsingReflection()来完成相应的功能，但是需要注意的是入参，我们可以看到这里分别将目标对象target、目标方法method、参数arguments也传递了进去。

那么这个invokeJoinpointUsingReflection()方法需要这些参数，是用来干嘛的？我们接着往下看，invokeJoinpointUsingReflection()方法代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303021320371.png)

通过上图，我们可以看到，其实这里核心只有一行代码，那就是method.invoke(target, args)，说白了就是通过反射来调用目标方法！

让我们简单来总结一下，我们看下边这块代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303021320473.png)

也就是说，这块代码在满足条件的情况下，会来执行invokeJoinpoint()方法，而这个invokeJoinpoint()方法其实就是用来执行目标方法的。

而需要满足的条件就是currentInterceptorIndex需要等于拦截器链的最后一个下标，并且这个currentInterceptorIndex默认为-1。

那这个currentInterceptorIndex后边会自动变化吗？

我们心中不禁浮现了这个疑问，既然代码这样写的，那么说明一定会有地方来修改currentInterceptorIndex的值，所以我们继续往下分析代码，此时我们会看到下边这行代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303021320188.png)

通过上边的代码，我们可以看到，这里就会对currentInterceptorIndex进行++操作，并且需要注意的是这个++是在currentInterceptorIndex变量前边的，所以会先对currentInterceptorIndex执行++操作，也就是currentInterceptorIndex会由-1变为0，然后再使用这个currentInterceptorIndex变量。

使用的时候也很简单，这里直接将currentInterceptorIndex作为拦截器链的下标，来从拦截器链interceptorsAndDynamicMethodMatchers中获取拦截器，此时拦截器下标currentInterceptorIndex为0，所以获取的是第一个拦截器。

由于这里是++操作，所以如果是第二次来执行上边这行代码，那么currentInterceptorIndex就会由0变为1，这个时候就会获取拦截器链中第二个拦截器了。

---

## 触发拦截器的invoke()方法

好了，那获取到拦截器之后，接下来又该干嘛了呢？

我们继续往下看，此时会看到这么一块代码，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303021321998.png)

通过上图，我们可以看到，这里根据拦截器的类型分开进行了处理，第一种是将刚才获取的拦截器强转为interceptorOrInterceptionAdvice类型，第二种是将拦截器强转为MethodInterceptor类型。

很明显就是两种不同的处理，那么这里会走哪种呢？

其实根据我们一路分析过来的经验来说，应该会走第二种，也就是会将拦截器强转为MethodInterceptor类型。

那有同学可能会问了，走第一种不行吗？为啥要走第二种？

其实很简单，因为通过前边几篇文章的分析，我们知道aspectJ的五种增强都是MethodInterceptor接口的实现类，所以强转为MethodInterceptor是最符合逻辑的，其实事实也确实走的是第二种。

有些比较严谨的同学，可能就是要看证据，那这个也很简单，这个时候我们可以来看下aspectJ五种增强对应拦截器的类继承关系，就会发现其实这些拦截器和InterceptorAndDynamicMethodMatcher没啥关系，比如After增强对应的拦截器实现类AspectJAfterAdvice的类继承图如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303021321006.png)

大家从类继承图中可以看到，AspectJAfterAdvice和InterceptorAndDynamicMethodMatcher没有任何关系！其他的拦截器大家可以按照这个方法去验证一下，这里就不再赘述了。

所以经过我们的分析，接下来就该走下边这行代码了，我们看这里：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303021321851.png)

而上边这行代码，很明显调用的是拦截器的invoke()方法，就是之前我们分析Advice实现类时，感觉很重要的那个方法！

我们知道aspectJ一共有五种增强，而这五种增强也都实现了MethodInterceptor接口的invoke()方法，当然其中有两种增强是后来包装为MethodInterceptor类型的，但是最后这五种增强确实都实现了invoke()方法。

那这个时候就会按照拦截器链上的顺序，来执行拦截器中的逻辑了。

那这五种增强对应的拦截器中都有哪些逻辑呢？执行拦截器链时又是怎么保证Before增强一定在After增强之前执行呢？

这个我们下节再来继续分析，下节课，我们会通过一个例子，来一步一步分析这五种增强拦截器的执行过程，到那时候，这些问题就都迎刃而解了。

---

## 总结

好了，今天的知识点，我们就讲到这里了，我们来总结一下吧。

一张图来梳理下AOP代理的执行流程

![20230302132207](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303021322232.png)

上图是目前为止，我们分析的AOP代理执行流程的源码图，其中红色背景的部分就是我们今天新分析的内容。

我们来总结一下，首先我们做了一个简单的知识回顾，那就是当拦截器链chain为空时，就会直接来执行目标方法，这个时候就代表在执行目标方法的时候，不需要执行任何增强逻辑，所以此时直接执行目标方法就完事儿了。

接着，我们初步分析了下拦截器链的执行过程，也就是上图中红色背景的部分，其实主要就是ReflectiveMethodInvocation类proceed()方法的执行逻辑。

通过上图，可以看到，假设我们现在一共有6个拦截器，那么连接器链的size()其实就是6，而index的初始值为-1，在刚进入这个proceed()方法时就会做一个判断，那就是会来看一下需不需要执行目标方法，如果判断成立的话，就会来执行目标方法；而如果判断不成立，那么就会从拦截器链中获取指定index的拦截器，接着就会执行这个拦截器中的逻辑，最后将处理结果进行返回。

这个就是，我们今天初步分析的拦截器链执行流程，我们可以发现，看到这个执行流程后，会觉得一脸懵逼，不知道它到底要做什么，这个是正常的，因为我们今天看到的，其实只是拦截器链执行流程中的冰山一角！而想要真正搞清楚拦截器链的执行流程，需要结合拦截器中的逻辑来分析才行。

下节我们就会来分析拦截器中的逻辑，等分析完拦截器中的逻辑后，我们就可以看到，拦截器链执行流程的全貌了！

那么在拦截器的逻辑中，到底蕴含了哪些玄机，我们下节接着来分析。