---
title: 53_JDK代理的执行：来初步看下invoke()方法的处理流程
category:
  - Spring源码
date: 2023-02-26
---

<!-- more -->

## 开篇

大家好，通过上篇文章我们知道在生成代理类$Proxy时，会在每个方法中都生成了一行代码super.h.invoke()，当我们调用代理对象$Proxy的方法时，就会回调到父类h属性的invoke()方法，这个h属性其实就是JdkDynamicAopProxy。

那么接下来就要来执行JdkDynamicAopProxy类的**invoke()**方法了，而在这个invoke()方法中，就会来执行目标方法和切面中的增强逻辑了，那执行过程到底是怎么样的呢？我们今天就来分析下这个invoke()方法。

在开始今天的内容之前，大家先来思考几个问题：

1. 当调用代理对象的equals方法和hashCode方法，会正常执行增强逻辑吗？
2. invoke()中的增强逻辑，也就是拦截器到底是从哪里获取的？
3. 拦截器链到底是怎么执行的？

这几个问题稍微有点复杂，大家不用非得思考出答案，之所以在这里当成思考题抛出，是为了让大家了解我们今天要讲的主要内容，其实在今天的文章中，上边几个问题的答案都是可以找到的，好了，那现在就开始我们本节的内容吧。

---

## 调用equals方法和hashCode方法时会怎么处理？

首先我们先来整体看一眼invoke()方法的代码，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302201119930.png)

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302201119496.png)

这个时候呢，我们就看到了这么一长串的代码，乍一看，还真不知道这个invoke()方法在干嘛，此时我们是一脸懵逼的状态

不过没事儿，我们一块代码一块代码来看，一点一点来攻克这个invoke()方法

首先我们来看这块代码，如下图

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302201120320.png)

这块代码是刚进入invoke()方法时需要执行的代码，可以看到其实就是一堆的if else分支，那这块逻辑是干嘛的呢？

此时我们观察到前2个if分支的条件，分别调用了isEqualsMethod()和isHashCodeMethod()方法完成了判断，那还有啥说的，我们直接点进去看下这2个方法的代码呗，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302201120161.png)

通过上边的代码，我们可以看到，这2个方法上分别有一段注释，大概意思就是说，判断给定的这个方法是不是equals方法和hashCode方法。

也就是说如果当前调用的是equals方法的话，那么就执行equals(args[0])这行代码完成处理，而如果是hashCode方法的话，则执行hashCode()这行代码进行处理，而调用的equals(args[0])和hashCode()其实就是JdkDynamicAopProxy类中定义的2个方法而已，代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302201120357.png)

看到这里，可能有的同学更懵逼了，已经由之前的一脸懵逼变成了两脸懵逼了，根本不知道这块代码为啥要这样处理

不过同学你别急，咱们一起来分析分析你就明白了

首先我们都知道在调用代理对象的方法时，在invoke()方法中会为我们调用的目标方法添加增强，但是大家应该都忽略了一件非常重要的事儿，那就是调用的这个方法其实是我们接口中定义的方法，比如ProductService接口中定义的addProduct()方法和getProductById()方法，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302201120504.png)

也就是说当调用代理对象中的addProduct()方法和getProductById()方法时，invoke()方法就会执行我们的增强逻辑，这个是没问题的。

那大家想一下，如果调用的是代理对象的equals方法和hashCode方法，还有没有必要为这2个方法添加逻辑呢？这2个方法可是Object类中定义的方法！

好了，这里也不打哑谜了，是这样的，如果代理接口ProductService中声明了equals方法和hashCode方法，且目标类productServiceImpl中重写了这2个方法，此时就会为equals方法和hashCode方法执行增强逻辑，否则将直接调用JdkDynamicAopProxy类中定义的equals方法和hashCode方法来完成处理。

那么怎么判断代理接口中有没有声明equals方法和hashCode方法呢？其实通过这2个变量就可以，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302201120987.png)

其实这2个变量也是判断条件之一哦，我们在回头看下这个条件，我们看下边这块代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302201120551.png)

说白了就是当代理接口中没有定义equals方法和hashCode方法时，就直接使用JdkDynamicAopProxy类中的equals方法和hashCode方法完成判断，否则就正常为equals方法和hashCode方法添加增强逻辑，就这么简单

到这里，相信同学们已经恍然大悟了，其实这块代码就是专门用来处理equals方法和hashCode方法的

那么下边的这2个if分支又是干嘛的呢？如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302201120453.png)

其实啊，和刚才都是一样的套路，这块代码首先通过getDeclaringClass()方法获取到当前方法的声明类，然后再使用获取到的声明类判断这个类是不是指定类，说白了一个是对DecoratingProxy接口中定义方法的处理，一个是对Advised类型的接口中定义的方法的处理

其实我们刚才分析的这一大块代码，都只是在刚进入invoke()方法时，对特定方法和特定类的单独处理，接下来才是真正的处理，也就是执行切面中定义的增强逻辑，所以接下来才是主菜。

---

## 要执行的增强逻辑是从哪里获取的？

搞清楚了invoke()方法入口的代码后，那我们接着往下看，此时我们会看到下边这块代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302201139914.png)

通过上边的代码，我们可以看到其中使用了一个叫做targetSource的属性，那这个targetSource是什么呢？

其实这个targetSource在前边已经定义了，targetSource定义的代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302201139140.png)

我们可以看到，这里直接将this.advised.targetSource赋值给了targetSource，那么这个advised又是什么呢？

这个其实简单，我们来看下advised的定义就知道了，我们看这里

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302201139052.png)

通过上边的代码，我们可以看到，advised是JdkDynamicAopProxy类中的一个变量，并且是在构造方法中完成的初始化。

这个构造方法大家是不是有点似曾相识的感觉？

之所以大家感觉似曾相识，那是因为之前我们分析过这个构造方法，我们看下边这2块代码

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302201139013.png)

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302201139955.png)

通过上边的代码，大家可以看到，其实就是在创建jdk代理时，将入参config赋值给了advised变量，那么这个入参config到底是谁呢？

其实啊，这个config就是之前我们分析过的ProxyFactory，我们看下边的代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302201139712.png)

上边代码中的ProxyFactory，之前我们可详细分析过，其实这个ProxyFactory就是创建代理最重要的配置，可以看到，这里为ProxyFactory设置了很多关键的属性，比如将增强advisors和目标类targetSource设置到ProxyFactory中。

说白了JdkDynamicAopProxy中的advised属性其实就是之前我们分析过的ProxyFactory，这个ProxyFactory中包含了增强advisors和目标类targetSource等核心属性

此时大家都搞清楚了这个advised是什么了吧

在搞清楚这个advised之后，我们继续往下分析invoke()方法，我们看下边这块代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302201139022.png)

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302201139838.png)

通过上边的代码，大家可以看到，这里会先从advised中获取到targetSource，说白了就是从ProxyFactory中获取到当时设置的目标对象targetSource，然后再进一步获取到目标对象的class对象并赋值给targetClass，在我们这个场景中，其实这里的targetClass变量就是ProductServiceImpl这个类

接着就会调用advised（也就是ProxyFactory）中的getInterceptorsAndDynamicInterceptionAdvice()方法，并将目标类ProductServiceImpl和当前要执行的方法method作为入参传递进去，最后就可以获取到当前方法method要执行的拦截器链chain了，可以看到，这个chain就是一个List集合罢了。

那么这个getInterceptorsAndDynamicInterceptionAdvice()方法具体是怎么处理的呢？

这篇文章我们先不深入分析，我们大概想一下就知道了，在advised（也就是ProxyFactory）中是有所有增强advisors的，别问为什么，因为当时构建ProxyFactory时，通过addAdvisors()方法将增强advisors设置给了ProxyFactory，所以getInterceptorsAndDynamicInterceptionAdvice()方法必然是根据advisors经过一通处理获取到了最终的拦截器链。

所以我们大概猜测一下就行了，我们先把握住主线，先把invoke()方法看完再说，至于是不是我们猜测的那样，我们后边在深入去分析这个getInterceptorsAndDynamicInterceptionAdvice()方法的时候再来验证。

---

## 拦截器链是怎么执行的？

好了，现在拦截器链已经获取到了，我们继续往下看，接着我们会看到这样一块代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302201140017.png)

通过上边的代码，大家可以看到，其实这里就是会看一下拦截器链chain是不是为空？如果拦截器链chain为空的话，那么就直接执行目标方法，其中invokeJoinpointUsingReflection()方法的定义如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302201140359.png)

通过上边的代码，可以看到，核心代码就是method.invoke(target, args)这一样代码，说白了就是通过反射执行目标方法。

而如果拦截器链chain不为空的话，就会执行下边这块代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302201140254.png)

通过上边的代码，可以看到，这里会先将拦截器链统一封装为MethodInvocation，然后再执行retVal = invocation.proceed()这行代码，说白了就是真正去执行拦截器链。

那么具体拦截器链是怎么执行的呢？

这里我们也暂时先不深究，我们后边再单独来分析这块的代码，反正大家只要知道，一旦retVal = invocation.proceed()这行代码执行完毕，那么目标方法和增强逻辑都会执行完毕的，大家暂时知道这个程度就可以了。

好了，我们继续往下看，我们知道有的方法是有出参的，比如getProductById()方法最后就会返回一个商品Product，那么当拦截器链执行完毕后，该怎么返回出参呢？此时我们会看到这块代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302201140606.png)

大家可以看到，其实就是根据returnType对返回值retVal做了简单的处理。

这个返回类型returnType很简单，如果你这个方法不需要返回出参，此时returnType的值就是void类型，而如果你这个方法需要返回一个商品Product，此时returnType的值就是com.ruyuan.aop.model.Product类型，最后将返回值retVal直接return回去，非常简单。

---

## 总结

一张图来梳理下AOP代理的执行流程

 ![20230220114215](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302201142248.png)

上图是目前为止，我们分析的AOP代理执行流程的源码图，其中红色背景的部分就是我们今天新分析的内容。

我们来总结一下，今天我们主要讲了invoke()方法的核心处理流程，

- 简单说就是在刚进入invoke()方法时，先对equals方法和hashCode方法等做一些处理

- 然后通过调用`getInterceptorsAndDynamicInterceptionAdvice()`方法获取到拦截器链，接着如果获取的拦截器链不为空的话，则将拦截器链统一封装为**MethodInvocation**，最后执行拦截器链并将拦截器链的执行结果进行返回。

其实从invoke()方法的整个执行流程来看，还是比较简单的，不过这里有2个非常重要的点需要我们深入分析，

- 其一就是**拦截器链到底是怎么获取到的**
- 其二就是**拦截器链的执行过程是怎么样的**

不过大家不要着急，我们一个一个来解决，下篇文章我们就先来研究下拦截器链的获取过程。