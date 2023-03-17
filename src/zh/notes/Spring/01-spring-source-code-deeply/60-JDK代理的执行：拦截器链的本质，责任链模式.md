<h1 align="center">60_JDK代理的执行：拦截器链的本质，责任链模式</h1>

# 开篇

大家好，上节我们分析了拦截器ExposeInvocationInterceptor和AspectJAfterThrowingAdvice的核心逻辑，现在大家知道，其实拦截器的核心逻辑，就是不断的递归调用ReflectiveMethodInvocation，而通过每个拦截器中的递归调用，就可以将这些拦截器串成一根链条。

同时每个拦截器中还会实现自己的一些增强逻辑，比如ExposeInvocationInterceptor拦截器实现了同线程共用拦截器链的功能，而AspectJAfterThrowingAdvice拦截器在有异常的时候，会来调用执行AfterThrowing增强方法。

那我们也知道，aspectJ一共有5种增强，那其他的增强，是不是也会不断的递归调用ReflectiveMethodInvocation呢？其他的增强又是怎么实现它自己的增强逻辑的？

我们这节就接着来分析一下。

在分析剩余拦截器之前，我们先介绍下本节的主要内容，主要如下：

1. 首先我们会来分析`AfterReturningAdviceInterceptor`拦截器，也就是`AfterReturning`增强对应的拦截器
2. 然后会接着分析`AspectJAfterAdvice`拦截器，其实就是`After`增强对应的拦截器
3. 接着会分析`AspectJAroundAdvice`拦截器，这个就是`Around`增强对应的拦截器
4. 最后会来分析一下`MethodBeforeAdviceInterceptor`拦截器，它其实就是`Before`增强对应的拦截器

而每个拦截器中的核心逻辑，在具体分析对应的拦截器时，我们都会进行讲解的，好了，那现在开始吧。

---

# AfterReturning增强：未发生异常才会执行

上节我们分析到了拦截器AfterReturningAdviceInterceptor，那我们接着来看下吧，拦截器代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303081104696.png)

通过上边的代码，我们可以看到，其实这里还是通过mi.proceed()这行代码递归调用了ReflectiveMethodInvocation。

并且我们还可以看到，这里是没有try catch处理的，而是在方法mi.proceed()正常返回之后，会执行this.advice.afterReturning()方法。

那么如果执行mi.proceed()方法发生了异常，此时就不会执行afterReturning()方法了，而只有正常执行结束时，才会来执行AfterReturning增强逻辑。

所以现在我们从源码的角度，解释了AfterReturning增强只有在未发生异常时，才会执行的原因！

那AfterReturning增强具体是怎么执行的呢？

我们来进一步看下afterReturning()方法，代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303081104866.png)

通过上图，大家可以看到，执行AfterReturning增强其实是通过invokeAdviceMethod()方法完成的。

而invokeAdviceMethod()方法的代码，之前我们已经分析过了，具体的代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303081104690.png)

通过上图，我们可以看到，其实invokeAdviceMethod()方法主要是通过调用invokeAdviceMethodWithGivenArgs()方法完成功能的，而invokeAdviceMethodWithGivenArgs()方法中关键的其实就一行代码，那就是this.aspectJAdviceMethod.invoke()这行代码

说白了就是通过反射调用了增强方法，而这个aspectJAdviceMethod我们上节讲过了，aspectJAdviceMethod其实就是切面中定义的增强方法，在这里其实就是AfterReturning增强方法。

好了，接下来，我们来看下拦截器链中的拦截器，这样就可以知道，下个该执行的拦截器是谁了，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303081104024.png)

通过上图，我们可以看到，此时拦截器链下标currentInterceptorIndex经过++操作后已经变为3了，所以下边会来获取并执行下标为3的拦截器，也就是AspectJAfterAdvice拦截器

到目前为止的流程，我们用一张流程图来表示，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303081104886.png)

通过上图，可以看到，和之前的套路一样，都是先递归调用ReflectiveMethodInvocation，等递归调用完成后再执行AfterReturning增强，而这次递归调用的拦截器，其实就是AspectJAfterAdvice拦截器了。

---

# After增强：无论是否有异常都会执行

好，接下来就轮到执行AspectJAfterAdvice拦截器了，AspectJAfterAdvice代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303081111962.png)

大家可以看到，上边的这块代码非常非常简单，还是递归调用ReflectiveMethodInvocation，大家看到了吧，还是原来的配方，还是熟悉的味道。

需要注意的是，这里是一个try finally语句，而在finally语句块中，调用了invokeAdviceMethod()方法，而这个方法的代码，我们已经讲过很多遍了，说白了就是通过反射来调用对应的增强方法，在这里，其实就是调用在切面中定义的After增强方法

我们最后再来看一次invokeAdviceMethod()方法的代码，后边我们就不再赘述了，我们看下边这块代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303081111409.png)

通过上图，大家可以看到，这里没啥特别的，其实就是直接通过反射来执行了增强方法，非常简单

其实最重要的还是要将整个AOP链路串起来，结合上下文来理解，这个增强方法aspectJAdviceMethod就是之前获取拦截器时，在创建Advice的时候进行赋值的，就是切面中定义的增强方法，大家忘记的话，可以回头看下获取拦截器的流程。

好了，我们回到主线，来看下我们现在要分析的代码，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303081112940.png)

我们可以看到，增强方法的执行逻辑是放在finally语句块中的

所以这就从源码的角度，解释了无论是否有异常，After增强都会执行的原因，因为After增强的本质就是一个finally语句块！

好了，我们来看下一个要执行的拦截器是哪个，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303081112252.png)

通过上图，我们可以看到，此时拦截器链下标currentInterceptorIndex通过++操作后值变为4，因此接下来就会来获取并执行下标为4的拦截器，也就是AspectJAroundAdvice拦截器了，也就是说，下一个要执行的拦截器是AspectJAroundAdvice拦截器了

目前为止，我们分析的流程，可以用一张图来总结，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303081112467.png)

可以看到，目前为止，还是不停的在递归调用ReflectiveMethodInvocation，以此来达到不断的调用下一个拦截器的效果。

---

# Before增强：目标方法前执行

好，那接下来我们就来看下MethodBeforeAdviceInterceptor拦截器的代码吧，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303081121154.png)

通过上图，可以看到，这里首先会执行Before增强方法，然后接着会通过mi.proceed()递归调用ReflectiveMethodInvocation，代码其实是非常清晰的。

那Before增强方法是怎么执行的呢？我们再进一步看下before()方法的代码，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303081121159.png)

大家可以看到，其实上边这个before()方法，也是通过调用invokeAdviceMethod()方法完成的，而这个invokeAdviceMethod()方法我们知道，它就是通过反射，直接调用了切面中定义的增强方法，这里就不再赘述了。

before()方法执行完毕后，接着就会递归调用ReflectiveMethodInvocation了，此时就又回到这个proceed()方法了，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303081121074.png)

这个时候，就又开始一步一步执行上边这个proceed()方法了，此时就会来执行上图红框中的if判断了。

不知道大家有没有想过一个问题，那就是既然是递归调用，那总不能一直递归下去吧？总要有一个递归结束的条件吧？

其实是这样的，上图红框中的代码就是递归的结束条件！大家还记得这个currentInterceptorIndex下标现在已经变为多少了吗？

其实此时这个currentInterceptorIndex变量经过一次又一次的++操作后，现在已经变为5了，我们看下边这张图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303081121685.png)

通过上边的图，大家可以看到，此时currentInterceptorIndex变量已经累加到5了，而拦截器链中一共有6个拦截器，那么拦截器的size-1的结果就为5，那此时上图中的if条件就会成立！

说白了就是this.currentInterceptorIndex == this.interceptorsAndDynamicMethodMatchers.size() - 1这行代码会返回true，接下来就会执行return invokeJoinpoint()这行代码

而invokeJoinpoint()这个方法，我们在之前分析过，它其实就是用于调用目标方法的，代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303081121346.png)

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303081121394.png)

通过上边的图可以看到，其实就是通过反射来调用了目标方法。

到目前为止，拦截器链就全部执行一遍了，总结为一张图的话，就像下边这样：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303081121604.png)

我们来简单总结一下，到这里为止都执行了哪些增强

其实通过上边的图，我们可以看到，首先是在AspectJAroundAdvice拦截器中执行了Around前置增强，然后接着在MethodBeforeAdviceInterceptor拦截器中执行了Before增强。

非常关键的一点是，在MethodBeforeAdviceInterceptor拦截器递归调用ReflectiveMethodInvocation的proceed()方法时，发现这个时候，递归结束条件成立了，此时就会执行目标方法！

所以，目前为止的执行流程是这样的：Around前置增强 -> Before增强 -> 目标方法

但现在有个问题就是，除了Around前置增强和Before增强外，其余的增强还都是没有执行的状态！

那么什么时候会执行其他增强方法呢？

其实这个非常简单，因为之前是不断的递归调用ReflectiveMethodInvocation的proceed()方法，而此时满足了递归结束的条件，那么此时在递归的过程中，调用的方法就会层层返回，这样其他的增强就会得到执行了。

说白了就是下边这张图的效果，如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303081121576.png)

通过上图，大家可以看到，在满足递归结束的条件后，首先会执行目标方法，而执行完目标方法后，接着就会层层返回执行结果，接着其他的拦截器就会分别执行自己内部的增强方法了

通过上图，我们可以总结出aspectJ五种增强的执行顺序，如下：

1. Around前置增强（AspectJAroundAdvice负责处理）
2. Before增强（MethodBeforeAdviceInterceptor负责处理）
3. 目标方法
4. Around后置增强（AspectJAroundAdvice负责处理）
5. After增强（AspectJAfterAdvice负责处理，无论是否有异常，都会执行）
6. AfterReturning增强（AfterReturningAdviceInterceptor负责处理，没有异常时，才会执行）
7. AfterThrowing增强（AspectJAfterThrowingAdvice负责处理，有异常时，才会执行）

其中需要注意的是，AfterReturning增强和AfterThrowing增强不会同时执行，而是只会执行其中一个

可以看到，其实每一种拦截器都单独处理了一种增强，比如MethodBeforeAdviceInterceptor拦截器就是用来处理Before增强的，而AspectJAfterAdvice拦截器就是用来处理After增强的。

像这种每个组件都各自负责一部分功能，并且这些组件的调用关系组成了一根调用链条，大家有没有觉得这种玩儿法和一种设计模式非常相似？

没错，就是责任链模式，其实啊，AOP中拦截器链这一块的本质，就是使用了责任链模式，只不过这里是通过递归调用ReflectiveMethodInvocation的方式，将所有的拦截器组成了一根调用链条，但是本质它还是一个责任链模式的玩儿法。

---

# 总结

好了，今天的知识点，我们就讲到这里了，我们来总结一下吧。

一张图来梳理下AOP代理的执行流程

![20230308470627](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303081127697.png)

上图是目前为止，我们分析的AOP代理执行流程的源码图，其中彩图部分就是我们最近这两节分析的内容。

我们来一起总结一下，其实拦截器链中的每个拦截器，都有各自需要完成的功能，比如MethodBeforeAdviceInterceptor拦截器就是用来处理Before增强的，而AspectJAfterAdvice拦截器就是用来处理After增强的。

拦截器链的执行过程，其实就是通过不断递归调用ReflectiveMethodInvocation，将所有的拦截器串成了一根链条，在满足递归结束条件之前，就会执行Around前置增强和Before增强。

当满足递归结束条件后，就会执行目标方法，接着这根链条上的拦截器就会层层返回，这样就会按照一定的顺序，来执行这根链条上，拦截器里边的增强方法了。

说白了，拦截器链的核心，就是通过递归调用ReflectiveMethodInvocation，将所有的拦截器串成了一根调用链条，本质就是责任链模式。