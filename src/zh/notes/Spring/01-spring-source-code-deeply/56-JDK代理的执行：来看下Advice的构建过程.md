---
title: 56_JDK代理的执行：来看下Advice的构建过程
category:
  - Spring源码
star: true
sticky: true
date: 2023-03-17
---

<!-- more -->

## 开篇

大家好，上一节我们主要讲了目标方法和增强的匹配过程，简单说就是首先在类级别进行匹配，接着在方法级别进行匹配，如果匹配成功的话，就通过registry.getInterceptors(advisor)这行代码获取advisor对应的拦截器，然后将这些拦截器放到一个集合中，这个集合其实就是拦截器链，最后将拦截器链作为结果进行返回。

整个过程还是比较简单的，但是其中有一个细节我们跳了过去，那就是获取advisor对应的拦截器这个过程我们还不清楚，所以这节我们就专门来分析一下这个过程，说白了就是来分析下registry.getInterceptors(advisor)这行代码。

这里先介绍下今天的主要内容，如下：

1. 首先我们会回忆一下，advisor到底是哪个类的实例，这个是非常重要的一个点
2. 接着我们分析源码时，发现Spring会根据不同的aspectJ注解构建不同的Advice实例
3. 最后就是来看下Advice的构建过程，重点就是会将切面中定义的增强方法给封装进来

---

## 还记得advisor是哪个类的实例吗

好了，现在我们就开始本节的内容吧，首先我们上节在分析获取拦截器链的时候，跳过了下边这行代码的分析，代码如下：

![img](http://wechatapppro-1252524126.file.myqcloud.com/apppuKyPtrl1086/image/ueditor/831100_1647062031.png)

通过上图，我们可以看到，针对匹配成功的增强advisor，会通过getInterceptors()方法来获取对应的拦截器

由于上节篇幅的原因，这里我们没有深入去分析，不过这节我们就来弥补这个遗憾，首先我们点进来getInterceptors()方法先瞅一眼代码再说，代码如下：

![img](http://wechatapppro-1252524126.file.myqcloud.com/apppuKyPtrl1086/image/ueditor/17466500_1647062032.png)

大家可以看到，上图就是getInterceptors()方法的代码，那么接下来我们就一点一点来进行分析。

首先呢，进入到这个getInterceptors()方法后，会执行下边这行代码：

![img](http://wechatapppro-1252524126.file.myqcloud.com/apppuKyPtrl1086/image/ueditor/56172900_1647062032.png)

通过上边的代码，大家可以看到，这里就是通过getAdvice()方法获取了advice属性罢了，看起来像是一个“普通”的get()方法。

嗯？真的是这样吗？这个getAdvice()方法真的只是一个“普通”的get()方法吗？

关于分析源码，我们不要猜测，还是眼见为实靠谱，此时我们需要点开这个getAdvice()方法来验证一下，然后当我们点击getAdvice()方法的时候，会发现有非常多的实现，如下图：

![img](http://wechatapppro-1252524126.file.myqcloud.com/apppuKyPtrl1086/image/ueditor/95816800_1647062033.png)

看到上边这张图后，感觉一脸懵逼啊，我擦，我就想看下getAdvice()方法，老天为啥要这么为难我？

不过这个时当你看到列表中的InstantiationModelAwarePointcutAdvisorImpl后，总感觉在哪里见过，但是却想不起来了...

同学不要慌，我来帮你一把，Advisor其实只是一个接口，你还记得当时在构建增强Advisor时，具体使用的是哪个类的实例吗？

哈哈，没错，当时构建Advisor时，使用的就是这个InstantiationModelAwarePointcutAdvisorImpl类的实例，我们来看一块之前分析过的代码回顾一下，代码如下：

![img](http://wechatapppro-1252524126.file.myqcloud.com/apppuKyPtrl1086/image/ueditor/23482700_1647062035.png)

![img](http://wechatapppro-1252524126.file.myqcloud.com/apppuKyPtrl1086/image/ueditor/19058400_1647062036.png)

![img](http://wechatapppro-1252524126.file.myqcloud.com/apppuKyPtrl1086/image/ueditor/33063000_1647062037.png)

通过上边的代码，我们可以看到，在构建Advisor时，本质就是构建了一个InstantiationModelAwarePointcutAdvisorImpl类的实例，并且在构建的时候，构造方法的入参中传递了一些非常重要的参数，其中就包括切面中声明的增强方法aspectJAdviceMethod

好了，那我们回头再看下目前要分析的代码，如下图：

![img](http://wechatapppro-1252524126.file.myqcloud.com/apppuKyPtrl1086/image/ueditor/61357800_1647062037.png)

经过刚才的分析，我们知道了其实这个advisor就是一个InstantiationModelAwarePointcutAdvisorImpl类的实例，所以接下来要调用的其实就是InstantiationModelAwarePointcutAdvisorImpl类的getAdvice()方法！

所以分析源码时，我们经常需要结合上下文来判断该走哪个实现，尴尬的是有时候可能这个上下文“有点长”，不过分析源码多了，就有经验了。

---

## 根据aspectJ注解类型构建不同的Advice

ok，既然现在知道走哪个实现了，那还有啥好说的，干就完了，这个InstantiationModelAwarePointcutAdvisorImpl类的getAdvice()方法的代码如下：

![img](http://wechatapppro-1252524126.file.myqcloud.com/apppuKyPtrl1086/image/ueditor/10864900_1647062038.png)

通过上图，我们可以看到这个getAdvice()方法明显不是“普通”的get()方法啊，它里边是有一些逻辑的！所以平时分析源码时，我们还是眼见为实，有时候看到的不一定就是真实的哦。

此时我们发现上边的代码，其实是在初始化一个Advice实例，可以看到，在进入这个getAdvice()方法的时候，首先会看一下instantiatedAdvice是否为null，如果为null的话，那么表示是第一次调用这个getAdvice()方法，此时就会通过instantiateAdvice()方法创建一个Advice实例出来，接着将这个Advice实例返回。

逻辑很简单，没啥好说的，那此时就假如我们是第一次进来吧，此时就会调用instantiateAdvice()方法来创建Advice实例了，这个instantiateAdvice()方法代码如下：

![img](http://wechatapppro-1252524126.file.myqcloud.com/apppuKyPtrl1086/image/ueditor/69957100_1647062038.png)

通过上图，我们发现，这里通过调用一个叫getAdvice()方法来获取Advice的，同时将自己内部的aspectJAdviceMethod属性作为入参传递了进去，通过前边的分析，我们知道这个aspectJAdviceMethod其实就是切面中声明的增强方法。

好了，看情况接下来我们要继续往下深入了，其实就是来看下上边的getAdvice()方法了，此时我们点进去后，可以发现getAdvice()方法的代码如下：

![img](http://wechatapppro-1252524126.file.myqcloud.com/apppuKyPtrl1086/image/ueditor/60089500_1647062039.png)

![img](http://wechatapppro-1252524126.file.myqcloud.com/apppuKyPtrl1086/image/ueditor/1907500_1647062041.png)

通过上图，我们可以看到，核心逻辑就在这个getAdvice()方法中，那这个时候我们就一点一点来分析吧。

在进去这个getAdvice()方法后，首先就是执行下边这块代码了：

![img](http://wechatapppro-1252524126.file.myqcloud.com/apppuKyPtrl1086/image/ueditor/54393300_1647062041.png)

通过上图，我们可以看到这里主要就是调用了findAspectJAnnotationOnMethod()方法，而这个方法我们也是比较熟悉的，它其实就是在指定的方法中寻找AspectJ的注解

忘记的同学，可以看下这个findAspectJAnnotationOnMethod()方法的代码简单回忆一下，代码如下：

![img](http://wechatapppro-1252524126.file.myqcloud.com/apppuKyPtrl1086/image/ueditor/2955100_1647062042.png)

可以看到，这个findAspectJAnnotationOnMethod()方法还是比较简单的，前边的文章我们也分析过了，忘记的同学，可以翻下前边的文章。

好了，继续看我们现在要分析的代码，如下图：

![img](http://wechatapppro-1252524126.file.myqcloud.com/apppuKyPtrl1086/image/ueditor/36161600_1647062042.png)

到这里为止，上边的这块代码说白了，根本不是核心逻辑，这里要做的事儿，其实就是看下增强方法上是否存在AspectJ的注解，如果不存在就直接返回null，说白了就是一个简单的校验罢了。

好，那我们接着往下看，此时就会看到下边这块代码：

![img](http://wechatapppro-1252524126.file.myqcloud.com/apppuKyPtrl1086/image/ueditor/94269200_1647062042.png)

上边的这块代码就比较核心了，可以看到，这里根据前边扫描出来的AspectJ注解类型，会创建不同实现的Advice实例。

那这个AspectJ注解类型是什么呢？其实很简单，我们点进去看一眼就知道了，此时我们会发现这个annotationType其实就是一个枚举罢了，而枚举的定义如下：

![img](http://wechatapppro-1252524126.file.myqcloud.com/apppuKyPtrl1086/image/ueditor/38267600_1647062043.png)

上图这个枚举其实比较简单，它就对应着我们切面中增强方法上添加的六种注解，比如@Before注解的annotationType属性的值就是AtBefore，就是这个意思，非常的简单。

---

## 将切面中的增强方法封装到Advice中

好了，接着我们继续往下分析，假如此时扫描到的注解是@Before注解，那么annotationType的值就是AtBefore，那么接着就会执行下边这个case分支：

![img](http://wechatapppro-1252524126.file.myqcloud.com/apppuKyPtrl1086/image/ueditor/81713000_1647062043.png)

通过上边的代码，可以看到，这里会new出来一个AspectJMethodBeforeAdvice类的对象出来，通过这个类名，我们可以猜测出，这个AspectJMethodBeforeAdvice类是专门给@Before注解使用的，说白了就是专门给前置处理使用的。

同时我们可以看到，这里还将切面中定义的增强方法candidateAdviceMethod作为入参传递了进去，那么我们来看下这个构造方法都有哪些逻辑把，此时AspectJMethodBeforeAdvice的构造方法如下：

![img](http://wechatapppro-1252524126.file.myqcloud.com/apppuKyPtrl1086/image/ueditor/23331000_1647062044.png)

![img](http://wechatapppro-1252524126.file.myqcloud.com/apppuKyPtrl1086/image/ueditor/13807400_1647062045.png)

通过上边的代码，我们可以看到，其实AspectJMethodBeforeAdvice类的构造方法没啥逻辑，主要就是将这些核心属性又传递给了父类AbstractAspectJAdvice的构造方法，而父类拿到这些核心属性后，就将这些核心属性赋值给了自己的成员变量，而这里边最最重要的属性，其实就是这个增强方法aspectJAdviceMethod了

那这个增强方法aspectJAdviceMethod到底有什么用呢？

目前我们还不知道，但是我们可以先大胆猜测一波，在执行目标方法时，这些增强方法肯定也会执行，那么具体怎么执行呢？

我们会发现这个增强方法aspectJAdviceMethod其实是Method类型，而这个Method是反射包下的一个类，所以执行增强方法时，会不会是通过反射调用的？

说白了就是通过aspectJAdviceMethod.invoke()这样的形式来调用增强方法，但是这个呢，目前只是我们的一个猜测，至于最后是不是这样玩儿的，我们带着这个疑问分析下去就会知道了！

好了，那现在我们回到主线，我们目前分析的是这块代码：

![img](http://wechatapppro-1252524126.file.myqcloud.com/apppuKyPtrl1086/image/ueditor/41759000_1647062045.png)

可以看到，刚才我们分析的是@Before注解的情况，那假如现在是其他的注解呢？比如@AfterReturning呢？

其实简单，假如此时是@AfterReturning注解，那么就会执行下边下边的代码：

![img](http://wechatapppro-1252524126.file.myqcloud.com/apppuKyPtrl1086/image/ueditor/79995000_1647062045.png)

![img](http://wechatapppro-1252524126.file.myqcloud.com/apppuKyPtrl1086/image/ueditor/39963500_1647062046.png)

通过上边的代码，我们可以看到，在AtAfterReturning的处理中，会构建出来一个AspectJAfterReturningAdvice类的实例，说白了就是@AfterReturning注解专门对应的增强类

可以看到这个AtAfterReturning和AtBefore的处理是一模一样的，只是最后new出来的类实例不同罢了。

最后让我们再看一个@After注解，看下它的处理是不是也是一样的，此时AtAfter的代码如下：

![img](http://wechatapppro-1252524126.file.myqcloud.com/apppuKyPtrl1086/image/ueditor/87680100_1647062046.png)

![img](http://wechatapppro-1252524126.file.myqcloud.com/apppuKyPtrl1086/image/ueditor/29301400_1647062047.png)

通过上边的代码，我们可以看到，AtAfter的处理也是一样的套路，就是将增强方法aspectJBeforeAdviceMethod等关键属性传递给父类，然后父类进行初始化。

但是我们也发现了不一样的地方，那就是这个AspectJAfterAdvice类中多出来一个invoke()方法，虽然目前我们不知道这个invoke()方法是干嘛的，但给我们的感觉是这个invoke()方法是非常重要的。

此时我们还发现invoke()方法上有一个@Override的注解，然后方法最左边还有一个接口的小图标![img](http://wechatapppro-1252524126.file.myqcloud.com/apppuKyPtrl1086/image/ueditor/65966400_1647062047.png)，那么很明显这个invoke()方法是从某一个接口继承过来的，那么到底是哪个接口呢？

此时我们追踪了下，发现这个invoke()方法其实实现了下边这个接口，如下图：

![img](http://wechatapppro-1252524126.file.myqcloud.com/apppuKyPtrl1086/image/ueditor/16709000_1647062048.png)

通过上图，可以看到，其实实现的是MethodInterceptor接口的invoke()方法，从MethodInterceptor接口的名字上看，是方法拦截器的意思，那它和我们这几天分析的拦截器链有没有什么关系的？

是这样的，其实拦截器就是MethodInterceptor接口类型的一个实例罢了，MethodInterceptor其实就是拦截器，而拦截器链就是一个一个的MethodInterceptor，就是这个意思，非常简单。

好了，到现在为止，下边这块代码我们就分析完毕了，如下图：

![img](http://wechatapppro-1252524126.file.myqcloud.com/apppuKyPtrl1086/image/ueditor/50579100_1647062048.png)

上边这块代码，其实简单说，就是根据切面中增强方法上的注解不同，创建不同的Advice实例出来，并将创建出来的Advice实例赋值给springAdvice变量。

好了，那我们来看下最后剩下的这块代码，如下图：

![img](http://wechatapppro-1252524126.file.myqcloud.com/apppuKyPtrl1086/image/ueditor/8138000_1647062049.png)

可以看到上边这块代码，主要就是为springAdvice设置一些属性，比如切面名称aspectName等，非常简单，没啥好说的，这里设置完属性后就将springAdvice作为结果返回了，其实就是将Advice实例给返回了。

到目前为止，下边这行代码就分析完毕了，如下图：

![img](http://wechatapppro-1252524126.file.myqcloud.com/apppuKyPtrl1086/image/ueditor/86582200_1647062049.png)

接下来就是处理刚刚创建的advice了，由于篇幅原因，我们这节就分析到这里，我们下节再接着往下进行分析。

---

# 总结

好了，今天的知识点，我们就讲到这里了，我们来总结一下吧。

一张图来梳理下AOP代理的执行流程

![20230228102239](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202302281022215.png)

上图是目前为止，我们分析的AOP代理执行流程的源码图，其中红色背景的部分就是我们今天新分析的内容。

我们来总结一下，今天我们主要分析了Advice advice = advisor.getAdvice()这行代码，而这行代码在处理的时候，首先就会来扫描增强方法上的aspectJ注解，接着拿到aspectJ注解后，会根据aspectJ注解类型创建出不同的Advice，比如aspectJ注解类型为AtBefore时，会创建AspectJMethodBeforeAdvice实例出来，再比如aspectJ注解类型为AtAfterReturning时，则创建AspectJAfterReturningAdvice实例出来。

那么在创建好Advice之后，接下来又该怎么处理，我们放到下节再来分析。