---
title: 59_JDK代理的执行：拦截器的核心逻辑，递归调用ReflectiveMethodInvo
category:
  - Spring源码
star: true
sticky: true
date: 2023-03-17
---

<!-- more -->

## 开篇

大家好，上节我们主要分析了ReflectiveMethodInvocation中的逻辑，简单来说，就是会从拦截器链的下标0位置开始处理，说白了就是从拦截器链中的第一个拦截器开始处理。

那么处理的时候呢，其实就是调用了拦截器的invoke()方法，那么这节，我们就要来分析拦截器中的代码了。

在分析拦截器中的代码之前，这里先简单介绍下本节的主要内容：

1. 为了拦截器知识点的完整性，我们会对切面类代码进行改造，来支持aspectJ的五种增强
2. 然后会来分析第一个拦截器`ExposeInvocationInterceptor`，它的作用主要是利用ThreadLocal，实现同线程共享拦截器链的功能
3. 接着会分析第二个拦截器`AspectJAfterThrowingAdvice`，它的作用就是在有异常时，用来调用AfterThrowing增强方法

---

## 切面类代码改造

我们知道，aspectJ一共提供了五种增强，而我们这里就要开始分析拦截器的代码了，那么为了保证拦截器知识点的完整性，所以我们先对之前的切面类进行改造，说白了就是将其他的aspectJ增强都添加进来，这样方便我们来分析aspectJ的五种增强。

那么我们现在来改造下切面的代码吧，首先是日志切面类，代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303021434943.png)

通过上图，可以看到，我们给日志切面类新增了@After、@AfterThrowing、@Around三种增强，加上之前本来就存在的@Before和@AfterReturning增强，aspectJ的五种增强就已经集齐了。

接着是监控打点切面类，改造后的代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303021435172.png)

通过上图，可以看到，其实我们只是调整了切点表达式，这样就可以使监控打点类只适用于addProduct()方法。

从而对于getProductById()方法，监控打点类是不生效的，所以getProductById()方法在执行的时候，就只能匹配到日志切面类中的增强了，这样方便我们调试和观察。

还有其他的一些小改动，其实就是稍微调整了下打印的文本，不是重点，这里就直接忽略了。

最后，我们来看下测试类的代码，如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303021435038.png)

此时测试类打印结果如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303021435276.png)

这个时候我们可以看到，对于getProductById()方法来说，这里按照增强顺序，执行了日志切面类的五种增强。

好了，现在万事俱备只欠东风，那接下来，我们就来分析下getProductById()方法的五种增强的执行过程吧

其实说白了就是来分析下拦截器中的代码。

---

## 通过ThreadLocal使同线程共享拦截器链

上节的结尾，我们分析到了下边这行代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303021454325.png)

通过上边的代码，我们可以看到，这里直接调用了拦截器的invoke()方法，并且将this，说白了就是将ReflectiveMethodInvocation自己作为入参传递到了拦截器中，那么接下来就要来执行拦截器中的逻辑了。

那现在问题来了，我们知道aspectJ一共有五种拦截器，上边这行代码执行的是哪个拦截器呢？

并且我们都知道，对于AOP的增强来说，Before增强通常都是先开始执行的，那么上边即将执行的拦截器是不是Before增强对应的拦截器呢？

其实确认这个很简单，我们来看下拦截器链的结构信息就可以了，说白了就是使用debug大法，此时拦截器链的debug结果如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303021454171.png)

通过上图，我们可以看到，此时拦截器链中有6个拦截器，此时有同学就郁闷了，aspectJ的增强只有5种啊，这里为啥有6个呢？

是这样的，其实第一个拦截器ExposeInvocationInterceptor，它主要是用于暴露拦截器链到ThreadLocal中，这样同一个线程下就可以来共享拦截器链了，不过这个ExposeInvocationInterceptor拦截器不是我们这里的重点，大家有个印象就可以了，我们继续往下看。

此时我们发现，在拦截器链中，After拦截器AspectJAfterAdvice竟然在Before拦截器MethodBeforeAdviceInterceptor的前面！如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303021454885.png)

这就奇怪了，按照AOP的规则，Before增强肯定是在After增强前执行的呀，为啥拦截器链中的顺序，Before增强竟然排到After增强的后边了？真是奇了怪了

同学不要着急，是这样的，拦截器链的执行顺序，其实并不是简单的将拦截器链进行for循环遍历，而是人家有专门的一套玩儿法！

那这个拦截器链到底是怎么来玩儿的呢？

我们接着往下分析，大家慢慢就都明白了。

我们回到主线上来，还记得我们这节主要是干嘛的吗？

哈哈，其实就是要来分析拦截器内部的代码，所以我们接下来，就来看下拦截器中的代码呗。

其实呢，通过上节的分析，我们知道拦截器的下标currentInterceptorIndex默认值是-1，再执行过++currentInterceptorIndex操作后，值会由-1修改为0。

所以接下来的操作，就会来获取拦截器链中下标0对应的拦截器，也就是第一个拦截器ExposeInvocationInterceptor，而这个ExposeInvocationInterceptor拦截器的代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303021454287.png)

上边就是ExposeInvocationInterceptor拦截器的代码，我们知道这个invoke()方法的入参mi，其实就是ReflectiveMethodInvocation实例，而ReflectiveMethodInvocation中是包含了拦截器链的

看这块代码的话非常简单，就是将mi变量放入了ThreadLocal中，但它真正想要做的，其实是想将拦截器链放入到ThreadLocal中，这样同一个线程，就可以通过ThreadLocal来共享拦截器链了。

并且我们可以看到，将mi变量放入ThreadLocal之后，还调用了非常关键的一行代码，那就是mi.proceed()，我们知道这个mi变量其实就是ReflectiveMethodInvocation，那也就是说，现在需要调用ReflectiveMethodInvocation的proceed()方法了，也就是这块代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303021455152.png)

我们知道，其实调用拦截器的入口，就是上边的这块代码，说白了就是ReflectiveMethodInvocation的proceed()方法。

但在这个ExposeInvocationInterceptor拦截器中，竟然又调用了ReflectiveMethodInvocation的proceed()方法，相当于又回到了调用拦截器的入口，而这样其实就达到了递归调用的效果

那么这次递归调用proceed()方法，又有什么特殊之处呢？

其实是这样的，之前在执行这个proceed()方法时，拦截器链下标currentInterceptorIndex的值，已经由默认值-1累加为0了，而区别就在于执行下边这行代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303021455355.png)

通过上边的代码，我们可以知道，在这次递归调用时，currentInterceptorIndex的值已经变为0了，那么此时执行到++操作时，下标currentInterceptorIndex的值就会再次进行++操作，也就是会由0变为1。

那这个时候就简单了，由于此时拦截器链下标currentInterceptorIndex为1，所以此时，就会获取并执行拦截器链中下标为1的拦截器了

那拦截器链中下标为1的拦截器是哪个呢？我们看下边这张图

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303021455571.png)

通过上图，我们可以看到，拦截器链中下标为1的拦截器，其实就是AspectJAfterThrowingAdvice了，也就是说下一个要调用的拦截器，其实就是AspectJAfterThrowingAdvice

好了，到这里为止，我们来画张图总结下，我们看下边这张图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303021455524.png)

通过上图，我们可以看到，第一个调用的拦截器是ExposeInvocationInterceptor，这个ExposeInvocationInterceptor拦截器，会先将拦截器链暴露到ThreadLocal中。

然后会递归调用ReflectiveMethodInvocation的proceed()方法，那么此时下标index就会执行++操作，从而下标index会由0变为1，这个时候，就会获取并执行拦截器链中下标为1的拦截器了，也就是拦截器AspectJAfterThrowingAdvice。

---

## AfterThrowing增强：发生异常才会执行

我们知道，接下来就要来执行AspectJAfterThrowingAdvice拦截器了，那我们就直接来看下AspectJAfterThrowingAdvice的代码吧，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303021513083.png)

通过上图，我们可以看到，拦截器AspectJAfterThrowingAdvice中直接执行了mi.proceed()这行代码，而这个入参mi，我们知道其实就是ReflectiveMethodInvocation类的实例。

所以mi.proceed()这行代码，其实就是用来递归调用ReflectiveMethodInvocation的proceed()方法的，说白了就是用来执行拦截器链中的下一个拦截器的。

而除了mi.proceed()这行代码，我们可以看到，这个拦截器中还进行了try catch处理，并且在catch语句块中，还有一块逻辑。通过上图，我们可以看到，在catch语句块中，调用了shouldInvokeOnThrowing()方法进行判断。

那这个shouldInvokeOnThrowing()方法到底是用来判断什么呢？我们来看下shouldInvokeOnThrowing()方法的注释，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303021513408.png)

通过上图，可以看到，这个注释说的非常清楚，说白了就是在 AspectJ 语义中，只有在抛出的异常是给定抛出类型的子类型时，才会执行AfterThrowing增强方法

那么这个shouldInvokeOnThrowing()方法满足后，就会来执行invokeAdviceMethod()方法，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303021513786.png)

从这个invokeAdviceMethod()方法的名字上来看，是“执行增强方法”的意思，那它到底是通过什么方式，来执行增强方法的呢？

我们可以进一步来看下invokeAdviceMethod()方法的代码，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303021513076.png)

通过上图，我们可以看到，其实invokeAdviceMethod()方法主要是通过调用invokeAdviceMethodWithGivenArgs()方法来完成功能的。

而invokeAdviceMethodWithGivenArgs()方法中关键的其实就一行代码，那就是this.aspectJAdviceMethod.invoke()这行代码，说白了就是通过反射调用了增强方法，而这个aspectJAdviceMethod大家还记得吗？

其实就是当时构建各种Advice增强时，传入的入参candidateAdviceMethod，我们看下边的代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303021513291.png)

上图中传入的这个入参candidateAdviceMethod，其实就是切面中，定义增强方法对应的method对象

而上边的5种Advice，其实都是AbstractAspectJAdvice的子类，所以最终都会调用父类AbstractAspectJAdvice的构造方法完成属性赋值，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303021513450.png)

通过上图，可以看到，这个aspectJAdviceMethod属性，最终会被赋值为切面中定义的增强方法对应的method对象。

对aspectJAdviceMethod属性赋值的过程，其实在之前获取拦截器链的流程中，我们都讲过，如果大家忘记的话，可以回头再看一下获取拦截器链的代码。

好了，我们再回到主线，我们看下边这块代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303021513707.png)

到目前为止，我们知道，这个AspectJAfterThrowingAdvice拦截器，会通过递归调用，来执行拦截器链中的下一个拦截器。

而由于这里有try catch的处理，所以当执行拦截器链报错时，并且抛出的异常是指定抛出类型的子类型时，那么就会通过反射的方式，来执行切面中定义的AfterThrowing增强方法了。

所以这就从源码的角度，解释了AfterThrowing增强方法只有在有异常时才会执行的原因。

好了，那我们接着往下分析，此时就会继续递归调用，其实也就意味着，会接着往下执行拦截器链中的拦截器。

那么在递归调用时，接下来又会执行拦截器链中的哪一个拦截器呢？

其实我们看下边这张图就知道了

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303021513192.png)

通过上图，可以看到，此时拦截器链下标currentInterceptorIndex再次通过++操作后，会由1变为2，而拦截器链中下标为2的拦截器就是AfterReturningAdviceInterceptor了，也就是说下一个要执行的拦截器就是AfterReturningAdviceInterceptor了。

好了，目前为止的流程，可以用下边的一张图来表示，我们看这里：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303021513856.png)

通过上图，可以看到，首先调用ExposeInvocationInterceptor拦截器将拦截器链暴露到ThreadLocal中后，接着通过递归调用了AspectJAfterThrowingAdvice拦截器。

而在AspectJAfterThrowingAdvice拦截器中，直接进行递归操作，而这次递归操作呢，调用的其实就是AfterReturningAdviceInterceptor拦截器了。

所以现在看来，拦截器中最核心的操作，其实就是这个递归调用，通过这个递归调用，可以将这些拦截器串成一根链条。

---

## 总结

好了，今天的知识点，我们就讲到这里了，我们来总结一下吧。

一张图来梳理下AOP代理的执行流程

![20230302151509](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303021515089.png)

上图是目前为止，我们分析的AOP代理执行流程的源码图，其中彩图部分就是我们今天新分析的内容。

我们来总结一下，从上图可以看到，调用拦截器的入口是ReflectiveMethodInvocation，而第一个被调用的拦截器是ExposeInvocationInterceptor，它主要是用于将拦截器链暴露到ThreadLocal中的，这样同一个线程就可以通过ThreadLocal共享拦截器链了，接着拦截器ExposeInvocationInterceptor会递归调用ReflectiveMethodInvocation的proceed()方法。

此时ReflectiveMethodInvocation中的proceed()方法就会来调用拦截器链中的下一个拦截器，也就是AspectJAfterThrowingAdvice拦截器，这个拦截器很简单，它直接就递归调用了ReflectiveMethodInvocation，同时呢，它里边的AfterThrowing增强是在catch语句块中，所以这就是只有发生异常，才执行AfterThrowing增强的原因！

需要注意的是，此时AfterThrowing增强还没有执行，只有当递归调用结束时，层层返回的时候才会执行AfterThrowing增强。

我们发现，拦截器中的核心操作，其实就是这个递归调用，而通过这个递归调用，可以将这些拦截器串成一根链条。

那么问题来了，递归结束的条件是什么呢？

大家可以先自己思考一下，在下篇文章中，大家就可以找到答案。