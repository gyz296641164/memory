---
title: 55_JDK代理的执行：怎么为目标方法匹配适用的增强？
category:
  - Spring源码
star: true
sticky: true
date: 2023-03-17
---

<!-- more -->


# 开篇

大家好，今天我们接着来分析拦截器链的获取过程，到现在为止，我们知道了，在获取拦截器链时，首先会去缓存中看下，如果缓存中没有拦截器链的话，那么就会执行拦截器链的获取逻辑。

同时，我们知道了，在获取目标方法对应拦截器的时候，首先会获取目标类级别对应的增强advisors，而下一步就是从目标类级别的增强advisors中，为目标方法匹配出适用的增强。那么我们今天呢，就会专门来分析下目标方法和增强的匹配过程。

通过今天的文章，我们可以解决以下几个问题：

1. 目标方法和增强的匹配过程是怎么样的？比如先在类级别匹配，再在方法级别进行匹配？
2. 方法级别匹配时，都会进行哪些维度的匹配？比如方法参数、方法名称、方法返回值等维度的匹配？
3. 对匹配成功的增强会做什么处理？比如会从增强中获取相应的拦截器？

---

# 目标方法匹配增强的过程是怎么样的？

而这个preFiltered标识通过名字猜测，大概表示的意思是“是否为预过滤”，如果是预过滤，那么就正常往下执行。这个preFiltered属性通常会被设置为true。

好了，那现在就开始今天的内容，我们上节分析到了这个地方，大家看下这块代码：

![img](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202302/20230223080200.png)

通过上边的代码，大家可以看到这里使用for循环在处理目标类级别的增强，而在处理时，对普通增强、引介增强以及其他类型的增强分别进行了处理，由于引介增强的控制粒度是类级别的，一般不常用，所以我们主要分析的还是普通增强。

那接下来我们就进入普通增强的if分支来看下吧，首先我们就会看到这个if条件，我们看这里

![img](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202302/20230223080209.png)

通过上边的代码，可以看到，只有满足这个if条件，才会正常往下进行处理，我们可以看到这个if条件有2个条件，只要满足其中一个条件，就可以正常往下进行处理了，其中一个条件就是config.isPreFiltered()，说白了就是看下ProxyFactory中的preFiltered标识是否为true，而这个**preFiltered**标识通过名字猜测，大概表示的意思**是否为预过滤**，如果是预过滤，那么就正常往下执行。

其实这个preFiltered标识，当时我们在ProxyFactory构造那节就讲过，**这个preFiltered属性通常会被设置为true**，所以这个if条件通常是满足的。

那万一这个preFiltered属性为false呢？这个时候该怎么办？

如果preFiltered为false，那么这个时候就要来判断第二个条件了，也就是pointcutAdvisor.getPointcut().getClassFilter().matches(actualClass)这个条件，那这行代码是什么意思呢？

我们简单来分析下，首先这个pointcutAdvisor代表的是增强，然后从这个增强pointcutAdvisor中获取到了一个切点Pointcut，接着从切点Pointcut中获取到了一个ClassFilter，而这个ClassFilter看名字是类过滤器的意思，最后通过ClassFilter的matches()方法完成了判断

而且在调用ClassFilter的matches()方法时，我们注意到将目标类actualClass作为入参传递到了matches()方法中，其实到这里，我们大概可以判断出这行代码的作用了，其实就是在类级别判断目标类actualClass是否匹配当前增强pointcutAdvisor

说白了就是看一下目标类actualClass，也就是ProductServiceImpl，是否满足增强中配置的切点表达式，如果满足的话，再进行进一步的处理，就是这个意思。

至于这个matches()方法到底是怎么完成匹配的，大家可以暂时先忽略，我们先把握主线，这个时候我们继续往下分析，如果当前增强匹配上了目标类，那么就继续往下处理，此时我们就会看到这行代码：

![img](http://wechatapppro-1252524126.file.myqcloud.com/apppuKyPtrl1086/image/ueditor/64732400_1647061888.png)

通过上边的代码，我们可以看到这行代码MethodMatcher mm = pointcutAdvisor.getPointcut().getMethodMatcher()，其实和刚才获取类过滤器ClassFilter一样，通过这行代码获取到了当前增强的方法匹配器MethodMatcher，并且将方法匹配器MethodMatcher赋值给了mm变量。

那么这个方法匹配器MethodMatcher有啥用呢？

其实我们大胆猜测一下，这个方法匹配器MethodMatcher，应该是用来判断当前增强是否匹配目标方法的。

带着这个疑问继续往下看，此时我们就会看到下边这块代码：

![img](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202302/20230223080235.png)

通过上边的代码，可以看到，这里会根据方法匹配器mm的类型不同，做不同的处理，但是核心都是一样的，最后都会调用方法匹配器mm的matches()方法完成判断，而这个matches()方法的其中一个入参就是目标方法method。

说白了就是在方法级别，来判断一下目标方法和增强中的切点表达式是否匹配。

也就是说这里匹配的时候，会先在类级别判断是否匹配，如果类级别匹配成功，那么就在方法级别进一步判断是否匹配，这样的套路，大家是不是感觉在哪里见到过？但又一下子想不起来？

其实啊，大家有这种感觉是正常的，因为我们之前真的分析过“类似”的源码哦，那就是我们之前在分析为目标类匹配切面的时候。

好，现在还想不起来？没事儿，我们再回头看一眼匹配切面的核心方法，保证大家可以瞬间想起来，其实就是这个canApply()方法，代码如下图：

![img](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202302/20230223080241.png)

通过上边的代码，我们可以看到，上边红框的代码，就是类级别和方法级别匹配切面的核心代码

我们对比getInterceptorsAndDynamicInterceptionAdvice()方法和canApply()方法后发现，其实在类级别进行匹配时，本质都是调用了Pointcut中的getClassFilter()方法获取了一个ClassFilter，最后通过ClassFilter中的matches()方法完成了判断。

而在方法级别判断时，则是从Pointcut中获取一个MethodMatcher，如果MethodMatcher是IntroductionAwareMethodMatcher类型的话，就强转一下，最后调用IntroductionAwareMethodMatcher的matches()方法完成了方法级别的判断。

其实方法级别匹配时，最后都是通过aspectj包下的matchesExactlyMethod()方法完成了方法级别的精确匹配，说白了就是分别对方法参数、方法名称、方法返回值几个维度进行匹配，这个我们之前都分析过相应的源码，大家忘记的话，可以回头在复习一下。

好了，我们再来看下现在要分析的代码，注意下边红框的地方，如下：

![img](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202302/20230223080248.png)

所以到这里就已经实锤了，这里其实就是在进行类级别和方法级别的匹配，说白了就是通过类级别和方法级别的匹配，来看下这个增强advisor是否可以适用于当前要调用的目标方法，如果适用，说白了就是匹配上的话，那么就会将match变量赋值为true。

---

# 该怎么处理匹配成功的增强？

将match变量赋值为true之后，接下来做什么呢？

别急，我们继续往下看，此时会看到这块代码：

![img](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202302/20230223080306.png)

通过上边的代码，我们可以看到，当match为true的时候，首先会执行registry.getInterceptors(advisor)这行代码来获取增强advisor中的拦截器，并将获取到的拦截器赋值给interceptors数组，最终将interceptors数组添加到拦截器集合interceptorList中。

说白了就是先找到适用于当前方法对应的增强advisor，然后再获取到增强advisor对应的拦截器interceptors，最终将拦截器interceptors收集起来，也就是最后给放到了拦截器集合interceptorList中。

至于registry.getInterceptors(advisor)这行代码获取增强advisor对应的拦截器，过程还是比较复杂的，我们这篇文章就不做分析了，下篇文章我们会详细进行分析。

好了，到这里为止，普通增强就处理完了，我们来看下剩下的代码：

![img](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202302/20230223080309.png)

通过上边的代码，大家可以看到，其实处理都是大同小异的。

刚才我们分析的是普通增强的处理，而这里则是引介增强和其他类型增强的处理，过程都差不太多，比如引介增强这里在目标类级别进行了判断，如果匹配成功的话，就将增强对应的拦截器放入到拦截器集合interceptorList中。

最后当for循环执行完毕时，也就是目标类级别对应的所有增强advisor都处理完毕了，那么就会将拦截器集合interceptorList作为结果进行返回。

需要注意的是，最后返回的这个拦截器集合interceptorList是目标方法级别对应要执行的增强，也就是在执行目标方法时，这个拦截器集合interceptorList中的拦截器都是需要执行的！

接着就会将返回的拦截器集合，也就是拦截器链放入到缓存中，这样可以便于下一次直接从缓存中获取拦截器链，最后将拦截器链返回，如下图：

![img](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202302/20230223080313.png)

最后在JdkDynamicAopProxy的invoke()方法中，就可以获取到拦截器链chain了，如下图：![img](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/202302/20230223080318.png)

到这里为止，就成功获取到目标方法适用的拦截器链了，当目标方法执行的时候，拦截器链chain中的拦截器都需要被执行！

---

# 思考题

那么最后大家来思考一个问题，那就是之前为目标类匹配增强时，曾经在类级别和方法级别做过匹配，但是这里在为目标方法匹配增强时，又在类级别和方法级别进行了匹配，是不是感觉有点重复处理了？

其实是这样的，主要是处理维度不同，当时为目标类匹配增强是类维度的匹配，主要是为目标类匹配可以适用的增强，即目标类中有任何一个方法与增强匹配成功，那么就说明这个增强适用于目标类，此时会把目标类维度适用的增强收集起来，此时的对应关系就是目标类对应了一堆增强，这些增强会被设置到ProxyFactory中，在真正执行目标方法时会使用。

而在执行目标方法时，虽然此时可以获取到这个目标类对应的一堆增强，但无法知道某一个方法对应的增强都有哪些，因为总不能你调用一个方法时，就把这个类对应的所有增强都执行一遍吧？这样显然是不合理的，所以此时需要遍历这些增强，进一步匹配出目标方法适用的增强！所以此时的匹配是目标方法维度的匹配。

---

# 总结

好了，今天的知识点，我们就讲到这里了，我们来总结一下吧。

一张图来梳理下AOP代理的执行流程

![20230228102036](https://studyimages.oss-cn-beijing.aliyuncs.com/img/others/202302281021141.png)

上图是目前为止，我们分析的AOP代理执行流程的源码图，其中红色背景的部分就是我们今天新分析的内容。

我们来总结一下，今天我们主要讲解了目标方法和增强advisor的匹配过程，首先就是增强advisor与目标方法所在的类进行匹配，只有当类级别匹配成功后，才会进行下一步的方法级别的匹配。

而在进行方法级别的匹配时，会分别从目标方法的方法参数、方法名称、方法返回值等维度与增强中配置的切点表达式进行匹配，如果匹配失败的话，就说明当前增强advisor不适用与目标方法，此时就会忽略当前增强，并开始下一个增强与目标方法的匹配。

而如果在类级别和方法级别都匹配成功的话，那么就说明当前增强advisor适用于目标方法，此时就会进一步获取到增强对应的拦截器，然后这些拦截器会被放到一个List集合中，而这个List集合其实就是拦截器链，最后这个拦截器链会被放入到缓存中，接着作为结果返回给invoke()方法。