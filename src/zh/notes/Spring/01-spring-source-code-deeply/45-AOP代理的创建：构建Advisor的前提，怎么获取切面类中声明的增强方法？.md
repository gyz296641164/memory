---
title: 45_AOP代理的创建：构建Advisor的前提，怎么获取切面类中声明的增强方法？
category:
  - Spring源码
star: true
sticky: true
date: 2023-03-10
---

<!-- more -->

## 开篇

上篇文章我们通过工具方法AnnotationUtils.findAnnotation()，已经找到了@Aspect注解的切面类，那么下一步该做什么了呢？

我们不妨大胆猜测一下，平常我们在玩儿AOP时，增强逻辑都会放在切面中一个一个的方法中，那么在为目标方法添加增强逻辑时，当然要拿到切面类中声明的这些方法啦，这样才能去执行对应的增强逻辑。

所以这里不光要找到切面类，还要获取到切面类中方法，目前为止我们已经找到了切面类，那么下一步当然就是要获取到切面类中的方法啦，所以这篇文章，我们就接着往下分析，来看下Spring是怎么获取到切面类中方法的。

在开始分析之前，我们先来思考一个问题：

那就是在java中，类可以继承其他类，也可以实现某一个接口，这样就会继承过来很多的方法，并且在运行的过程中，编译器根据需要也会为类自动创建一些方法，那么Spring在获取切面类方法时，难道是来者不拒吗？说白了就是切面类中所有的方法Spring都会统一获取过来吗？还是说Spring获取方法时，会有自己的一个过滤条件，只过滤出来自己需要的方法就可以了？

都说到这个份上了，那么聪明的你肯定猜到了，那必然是Spring会过滤出来自己需要的方法，而不是“笨笨的”获取所有的方法，那么问题来了，这个过滤条件是什么呢？

大家可以带着这个疑问开始本篇文章的学习，相信大家一定可以找到答案的。

---

## 过滤出切面类中非桥接非合成的方法

> 涉及方法：
>
> - `org.springframework.aop.aspectj.annotation.AspectJAdvisorFactory#getAdvisors`
> - `org.springframework.aop.aspectj.annotation.ReflectiveAspectJAdvisorFactory#getAdvisorMethods`：获取切面类中声明的方法
> - `org.springframework.aop.aspectj.annotation.ReflectiveAspectJAdvisorFactory#getAdvisor`：依次为每一个方法生成对应的增强Advisor
>
> 非桥接非合成的方法：
>
> - 简单来说，桥接方法和合成方法是编译器由于内部需要，编译器自己创建出来的方法，而不是我们程序员创建的方法

接着上篇文章，匹配到切面类之后，接下来就该执行这行代码了，我们看这里

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211143035.png)

接下来的重点就是这个方法this.advisorFactory.getAdvisors(factory)，我们点进去看下，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211143042.png)

我们可以看到，这里首先通过getAdvisorMethods(aspectClass)方法获取切面类中声明的方法，然后调用Advisor advisor = getAdvisor(method, lazySingletonAspectInstanceFactory, advisors.size(), aspectName)依次为每一个方法生成对应的增强Advisor。

首先我们要看的，当然是获取切面类中方法的逻辑了，这个时候我们可以点进去getAdvisorMethods(aspectClass)方法来看下，此时代码如下

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211143046.png)

我们可以看到，这里主要调用了ReflectionUtils.doWithMethods()来获取切面类中的方法。

并且我们可以看到调用doWithMethods()方法时需要传入一些参数，那这些参数代表什么意思呢？我们不妨来看下这个doWithMethods()方法的定义，我们看这里

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211143049.png)

此时我们看到这个doWithMethods()方法定义了三个参数，分别是Class<?> clazz、MethodCallback mc和MethodFilter mf，第一个参数就是一个class对象，没啥好说的，而第二个和第三个参数通过参数名我们可以判断出，第二个参数MethodCallback是一个回调方法，而第三个参数是一个过滤条件。

我们分别来看一下MethodCallback和MethodFilter分别是怎么定义的吧，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211143053.png)

我们看到MethodCallback和MethodFilter的定义之后，发现它们都加了@FunctionalInterface注解，说白了MethodCallback和MethodFilter都是函数式接口，就是方便使用Lambda表达式来玩儿

现在我们明白了doWithMethods()方法的第二个参数和第三个参数都是函数式接口，那我们调用doWithMethods()方法时，这三个参数都是怎么指定的呢？我们再回头来看下调用doWithMethods()方法的地方吧，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211143056.png)

首先第一个参数aspectClass，就是指定切面类，没啥好说的，第二个参数回调方法的本质，其实就是实现了MethodCallback接口的doWith()方法罢了，而第三个参数过滤条件的本质，则是实现了MethodFilter接口的matches()方法

看到这三个参数，我们就大致明白了doWithMethods()方法要做的事儿，说白了就是过滤出指定类aspectClass中的方法，过滤条件就是这个ReflectionUtils.USER_DECLARED_METHODS，最后通过回调方法将满足条件的method放到一个List集合中

好，明白了doWithMethods()方法要做的事儿之后，那现在就来看下它是怎么实现的吧，我们看这里

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211143101.png)

可以看到这里的逻辑很简单，就是先调用getDeclaredMethods()方法获取切面类中声明的方法methods，接着遍历处理这些method。

处理的时候，先调用mf.matches(method)过滤出要处理的方法，最后将过滤出来的方法，通过回调逻辑统一放到一个List集合中，回调逻辑非常简单，这里就不多说了，我们这里主要来看一下方法过滤是怎么做的。

此时我们点进去mf.matches(method)来看下，这个mf大家还记得吗？

它其实就是一个函数式接口的实现类，而我们传进来的是ReflectionUtils.USER_DECLARED_METHODS，所以我们现在来看下这个ReflectionUtils.USER_DECLARED_METHODS到底是个啥，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211143107.png)

可以看到，这里直接调用了Method对象的isBridge()方法和isSynthetic()方法来做的过滤，而这个isBridge()方法是用来判断当前方法是否为桥接方法，而isSynthetic()方法是用来判断当前方法是否为合成方法。

关于桥接方法和合成方法算是Java中的一个冷门知识了，**简单来说，桥接方法和合成方法是编译器由于内部需要，编译器自己创建出来的方法，而不是我们程序员创建的方法**。

!method.isBridge() && !method.isSynthetic() 这行代码在当前方法为非桥接方法且非合成方法时会返回true，说白了就是过滤出我们程序员创建的方法，排除掉那些编译器内部创建的乱七八糟的方法。

好了，现在我们过滤逻辑也搞清楚了，那么当mf.matches(method)这行代码执行完毕，究竟能从切面类中过滤出来哪些方法呢？

我们这里以日志切面类为例，来看下哪些方法是非桥接且非合成方法吧，首先我们先回顾一下日志切面类LoggingAspect，代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211143113.png)

其实呢，切面类LoggingAspect中的pointcut()、before()、afterReturning()、getOrder()这四个方法既不是桥接方法，也不是合成方法，它们都是我们程序员自己创建的方法，所以这四个方法执行到mf.matches()方法时，mf.matches()方法返回的都是true。

---

## 排除切面类中被@Pointcut注解的方法

> 涉及方法：
>
> - `org.springframework.util.ReflectionUtils#doWithMethods(java.lang.Class<?>, org.springframework.util.ReflectionUtils.MethodCallback, org.springframework.util.ReflectionUtils.MethodFilter)`：过滤出来切面类中非桥接非合成的方法，说白了就是用户声明的方法
> - `org.springframework.core.annotation.AnnotationUtils#getAnnotation(java.lang.reflect.Method, java.lang.Class<A>)`：用来在指定的方法method上获取特定注解

mf.matches()方法执行之后，就开始执行回调方法了，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211144355.png)

我们看到这里其实直接调用了入参传进来mc的doWith()方法，这个mc实现类是我们自己传递进来的，此时就会回调到下面的逻辑，我们看这里

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211144358.png)

其实就是将过滤出来的方法放到一个List集合中，但是我们发现在此之前，还有一个if条件，就是AnnotationUtils.getAnnotation(method, Pointcut.class) == null这行代码，只有当这个条件成立时，才会将方法放入到List集合中。

并且我们还发现在调用getAnnotation()方法时，除了将method传进去之外，还传进去了一个Pointcut.class，这个Pointcut.class又是个啥玩意儿？

这个简单，我们点进去看下Pointcut.class的定义不就知道了蛮，代码如下

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211144402.png)

此时我们发现，这个不就是我们在切面类中定义切点使用的@Pointcut注解吗？

如果有同学想不起来的话，我们这里再回头看一眼，在切面类中@Pointcut注解是怎么使用的，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211144407.png)

看到了吧，在切面类LoggingAspect的pointcut() 方法上加了一个@Pointcut注解，用来定义切点表达式使用的

那这个时候我们来思考一下，这个AnnotationUtils.getAnnotation(method, Pointcut.class) 方法到底是干嘛的？

此时我们可以先点进去看下AnnotationUtils.getAnnotation()方法的定义，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211144410.png)

我们可以看到这个方法有两个入参，第一个参数是方法对象本身，第二个参数是注解类型，然后结合着这个方法的注释“Get a single {@link Annotation} of {@code annotationType} from the supplied {@link Method}”，我们可以判断出这个getAnnotation()方法，其实就是用来在指定的方法method上获取特定注解的。

那也就是说AnnotationUtils.getAnnotation(method, Pointcut.class) 方法是用来获取方法上的@Pointcut

注解的，那么AnnotationUtils.getAnnotation(method, Pointcut.class) == null又是什么意思呢？

其实很简单，首先这个AnnotationUtils.getAnnotation(method, Pointcut.class) 方法什么时候会返回空？

那当然是这个方法上没有加@Pointcut注解的时候才会返回null，因为此时在这个方法上找不到@Pointcut注解，那当然要返回null，那么此时AnnotationUtils.getAnnotation(method, Pointcut.class) == null的结果为true，那么此时就会将这个方法添加到到List集合中，其实就是执行下边这行代码

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211144416.png)

那如果此时当前方法加了@Pointcut注解呢？比如切面类LoggingAspect的pointcut() 方法上就加了一个@Pointcut注解。

那此时AnnotationUtils.getAnnotation(method, Pointcut.class) == null的结果就为false，此时就不会将这个pointcut() 方法添加到List结合中。其实说白了这个条件就是用来排除掉@Pointcut注解的pointcut() 方法的。

以切面类LoggingAspect为例，在执行完mf.matches()时，由于pointcut()、before()、afterReturning()、getOrder()这四个方法既不是桥接方法，也不是合成方法，所以这四个方法都可以正常通过。

而执行到AnnotationUtils.getAnnotation(method, Pointcut.class) == null这个条件时，会将pointcut()方法给排除掉，因为pointcut()方法上加了@Pointcut注解，所以此时就只剩下before()、afterReturning()、getOrder()这三个方法了，最后就会将这三个方法放入到一个List集合中，然后作为getAdvisorMethods()方法的结果返回。

---

## 总结

一张图来梳理下AOP代理的创建流程

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211144432.png)

上图是目前为止，我们分析的AOP代理创建流程的源码图，其中红色背景的部分就是我们今天新分析的内容。

我们来总结一下，今天主要讲了怎么从切面类中获取用户声明的方法，说白了就是**通过`doWithMethods()`方法来过滤出来切面类中非桥接非合成的方法，说白了就是用户声明的方法，同时还排除了被@Pointcut注解的方法**。

获取到切面类中用户声明的方法后，那么下一步就是为方法构建增强Advisor了，我们下篇文章再接着分析。