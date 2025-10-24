---
title: 61_CGLIB代理的创建：通过Enhancer来创建代理
category:
  - Spring源码
star: true
sticky: true
date: 2023-03-17
---

<!-- more -->

## 开篇

大家好，到目前为止，我们详细分析了jdk动态代理创建的整个流程，以及jdk动态代理执行的整个流程，希望大家可以跟着文章，自己走读一遍源码，相信大家肯定会收获满满的。

我们知道，AOP代理其实分为jdk代理和cglib代理，而我们目前为止呢，将jdk代理的创建和执行流程分析的已经很透彻了，那么对于另外一种AOP代理，也就是cglib代理，我们自然也是不能放过的。

那么这节，我们就来看下cglib代理的创建过程吧。

那么在开始分析之前，这里先介绍下本节的主要内容，主要如下：

1. 首先我们会来回顾下，Spring选择jdk代理和cglib代理的过程
2. 然后我们会通过控制proxyTargetClass属性，让Spring帮我们创建cglib代理
3. 接着开始分析cglib代理的创建过程，首先分析的就是字节码增强器Enhancer的构建过程
4. 当字节码增强器Enhancer构建完成后，进一步来看下代理类和代理类实例的构建过程

---

## 知识点回顾：Spring是如何选择jdk代理和cglib代理的？

既然我们现在要开始分析cglib代理的创建流程了，那么第一件事儿，当然要先找到cglib代理创建的入口啦。

而这个创建入口呢，其实之前我们也讲过，我们简单来回顾一下吧，我们看下边这张图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303091104976.png)

通过上图，我们看到了熟悉的代码，之前我们讲过，这里最重要的其实就是config.isOptimize() || config.isProxyTargetClass() || hasNoUserSuppliedProxyInterfaces(config)这行代码了

那这三个条件分别代表什么意思呢？

让我来帮大家回忆一下吧

首先config.isOptimize()表示是否开启了优化策略，这个默认为false，一般不常用

接着是config.isProxyTargetClass()，如果这个属性为true的话，就代表是需要基于类进行代理的，说白了就是使用cglib代理的意思，而如果为false的话，那么就代表基于接口代理，也就是使用jdk代理。

而最后一个条件hasNoUserSuppliedProxyInterfaces(config)，简单来说，要不就是目标类没有实现接口 ，要不就是目标类实现了接口且接口类型是SpringProxy，这两种情况只要满足一种就会返回true。

当这三个条件都为false时，也就是既没有开启优化策略，也没有设置基于类的代理，最后目标类实现了接口但不是SpringProxy类型的，此时就会使用jdk动态代理，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303091104160.png)

那么一旦三个条件中有一个为true，就会走到if分支里边去，但是代码执行到这里的时候，也不是说百分之百就使用cglib代理，因为这里还有一个if判断，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303091104758.png)

通过上图，大家可以看到，这里会再次判断下，目标类是不是本身就是一个接口或者代理类，那如果目标类本身就是一个接口或者代理类的话，这里还是会使用jdk代理的，其他情况则都会使用cglib代理了。

这里简单总结一下，常见的几种情况，一般会怎么来选择代理，如下：

1. 如果设置了proxyTargetClass为true，也就是设置了基于类进行代理，并且此时目标类本身既不是接口类型也不是代理类时，这个时候就会使用cglib代理
2. 如果没有设置proxyTargetClass，即proxyTargetClass为false，但是此时目标类没有实现接口，此时也会使用cglib代理
3. 如果目标类实现了接口，并且此时没有强制设置使用cglib代理，比如proxyTargetClass为false，这个时候就会使用jdk代理

由于我们目前既没有开启优化策略，也没有设置基于类的代理，并且目标类实现了接口但不是SpringProxy类型的，也就是说这三个条件全部为false，因此我们这里会使用jdk代理，也就是会执行这行代码，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303091104059.png)

到这里为止，我们简单回顾了Spring选择jdk代理和cglib代理的机制，而我们经过前边一系列文章的分析，已经把jdk代理的创建流程和执行流程都搞定了。

那么接下来，当然就是要来看下cglib代理啦，首先我们就从cglib代理的创建开始。

---

## 学以致用，使用proxyTargetClass控制生成cglib代理

通过刚才的分析，我们知道，按照目前配置的话，就会来创建jdk代理了，但是我们现在想来创建cglib代理，那么有没有什么办法呢？

那当然是有的，而且这个办法我们刚才其实也讲过了，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303091409741.png)

选择jdk代理还是cglib代理，既然是由上边的条件控制的，那么我们当然可以通过它们来控制创建代理的方式啦。

那具体怎么做呢？

其实很简单，我们来看下边这个配置，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303091409250.png)

通过上图，我们可以看到，在开启AOP功能的时候，我们可以在标签中设置proxy-target-class属性，这个属性如果不设置的话，那么就默认为false。

那设置这个proxy-target-class属性有啥用呢？

其实啊，标签中的proxy-target-class属性的值，最终会被读取到config.isProxyTargetClass()属性中，就是之前我们分析源码的一个属性，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303091410955.png)

通过上边的代码，可以看到，一旦proxyTargetClass属性设置为true，那么就会执行下边这块代码，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303091410909.png)

由于此时我们的目标类targetClass既不是接口，也不是代理类，所以就会执行return new ObjenesisCglibAopProxy(config)这行代码来创建cglib代理了！

我们来进一步看下ObjenesisCglibAopProxy类的构造方法，代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303091410005.png)

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303091410234.png)

通过上图，我们可以看到，其实ObjenesisCglibAopProxy依赖父类CglibAopProxy的构造方法完成初始化，这里最关键的，其实就是将创建代理的核心配置config赋值给了成员变量advised，这样就成功构造出来了一个ObjenesisCglibAopProxy类的实例了。

---

## 构建并完善字节码增强器Enhancer

而之前我们也讲过，其实这个config就是一个ProxyFactory，并且这个ProxyFactory中封装了很多创建代理相关的核心属性，比如和目标类相匹配的增强，代理类需要实现的接口等等。

目前为止呢，我们只是构建了一个ObjenesisCglibAopProxy对象，而不是一个真正的cglib代理，那么真正的cglib代理该怎么生成呢？

其实简单，我们之前可是讲过的，我们看下边这块代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303091408140.png)

在创建完ObjenesisCglibAopProxy对象后，接下来就要调用getProxy(classLoader)方法来真正创建cglib对象了。

其实就是调用ObjenesisCglibAopProxy类中的getProxy(classLoader)方法了，但是我们发现在ObjenesisCglibAopProxy类中，其实并没有getProxy(classLoader)方法的实现。

其实啊，ObjenesisCglibAopProxy类中的getProxy(classLoader)方法，是从父类CglibAopProxy继承过来的，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303091409039.png)

也就是说创建cglib代理的核心逻辑，其实是在CglibAopProxy中的，那还有啥好说的，我们来看下CglibAopProxy中到底是怎么创建cglib代理的吧。

此时CglibAopProxy类的getProxy(classLoader)方法代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303091409039.png)

大家可以看到，上边就是创建cglib代理的代码，那么接下来我们就一块一块来进行分析吧。

进来getProxy(classLoader)方法方法后，首先就是执行下边这块代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303091409754.png)

我们可以看到，上边的代码，其实就是获取了目标类的class对象，说白了就是ProductServiceImpl类的class对象

那么获取这个对象干嘛呢？

之前我们讲过，其实cglib是采用继承目标类，重写父类方法的形式实现的动态代理，所以当然需要指定代理类的父类了

好，获取到要继承的目标类后，我们接着往下看，此时会看到下边的代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303091409346.png)

通过上边的代码，我们可以看到，其实这里就是构造了一个Enhancer，然后为Enhancer设置了各种属性，比如通过enhancer.setSuperclass(proxySuperClass)这行代码，就设置了代理类要实现的父类

那么大家还记得这个Enhancer吗？

其实我们在AOP章节的开头，就分别讲了静态代理、jdk动态代理、cglib动态代理各自的玩儿法，当时我们在创建cglib动态代理时，就使用了上边这个Enhancer的api！当时创建cglib动态代理的代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303091409778.png)

如果大家忘记的话，可以回头看看这篇文章，这里就不再赘述了。

好了，我们继续来分析下边这块代码，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303091409139.png)

我们知道，对于Enhancer来说，除了设置要继承的父类外，还需要设置回调，其实就是callbacks，此时我们看到上边的代码中，有一行获取回调数组的方法，就是Callback[] callbacks = getCallbacks(rootClass)，我们就来看看这里是怎么来获取回调数组的吧，此时getCallbacks()代码如下：

```java
private Callback[] getCallbacks(Class<?> rootClass) throws Exception {
		// 省略部分代码

		// Choose an "aop" interceptor (used for AOP calls).
		// AOP回调需要用到的拦截器
		Callback aopInterceptor = new DynamicAdvisedInterceptor(this.advised);

		// 省略部分代码

		// 创建拦截器数组
		Callback[] mainCallbacks = new Callback[] {
				aopInterceptor,  // for normal advice
				targetInterceptor,  // invoke target without considering advice, if optimized
				new SerializableNoOp(),  // no override for methods mapped to this
				targetDispatcher, this.advisedDispatcher,
				new EqualsInterceptor(this.advised),
				new HashCodeInterceptor(this.advised)
		};

		Callback[] callbacks;

		// If the target is a static one and the advice chain is frozen,
		// then we can make some optimizations by sending the AOP calls
		// direct to the target using the fixed chain for that method.
		if (isStatic && isFrozen) {
			省略部分代码
		}
		else {
			// 设置回调拦截器数组给callbacks
			callbacks = mainCallbacks;
		}
		return callbacks;
	}
```

为了有重点的看代码，所以这里省略了部分代码，通过上边的代码，我们可以看到，这里的代码非常简单，其实就是先创建了一个DynamicAdvisedInterceptor拦截器的实例aopInterceptor

接着手动构建了一个回调数组mainCallbacks，将一堆拦截器放入这个回调数组中，其中就包括刚才创建的aopInterceptor拦截器，最后会将回调数组mainCallbacks赋值给callbacks并返回。

而这个callbacks中的拦截器，就是cglib代理对象中的方法被调用时需要回调的拦截器，这些拦截器中，有一个极为重要的拦截器，那就是DynamicAdvisedInterceptor拦截器了，大家这里先有个印象，随着后边分析越来越深入，自然就知道这个拦截器为什么如此重要了。

---

## 创建cglib代理类和代理类实例

获取到回调数组之后，创建cglib代理的准备工作就完成了，此时就会执行下边这行代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303091418869.png)

正当我们想继续查看createProxyClassAndInstance()方法的代码时，我们发现这个方法有2处实现，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303091418213.png)

那我们应该看哪个实现呢？

其实很简单，因为我们在文章开头，创建的其实是ObjenesisCglibAopProxy对象啊，所以当然要来看ObjenesisCglibAopProxy中的实现啦。

ObjenesisCglibAopProxy中的实现代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303091418782.png)

通过上图，我们可以看到，这里首先调用Enhancer的createClass()方法生成了代理类proxyClass，接着使用生成的代理类proxyClass，通过newInstance()方法进一步生成了代理类的实例proxyInstance，最后将回调数组callbacks设置到代理类proxyInstance中。

到这里，cglib代理才算是真正创建成功了，此时我们知道，**在回调数组callbacks中，有一个极为重要的拦截器，那就是DynamicAdvisedInterceptor**，当cglib代理类实例中的方法被调用时，那么就会回调到这个拦截器DynamicAdvisedInterceptor，此时这个拦截器就会开始执行增强方法和目标方法。

---

## 总结

好了，今天的知识点，我们就讲到这里了，我们来总结一下吧。

一张图来梳理下AOP代理的创建流程

![20230309143003](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303091430336.png)

上图是目前为止，我们分析的AOP代理创建流程的源码图，其中红色背景的部分就是我们今天新分析的内容。

我们来总结一下，在创建cglib代理时，首先会构造出字节码增强器Enhancer并完善其属性，接着调用Enhancer的createClass()方法生成代理类，然后使用刚生成的代理类，通过newInstance()方法进一步生成代理类的实例，也就是cglib动态代理对象。

可以看到，整个创建cglib代理的过程是非常简单的，说白了就是使用Enhancer的api来实现的，而Enhancer的api之前我们也使用过，这里就不再赘述了。

好了，到这里为止，cglib代理就创建完成了，那么当调用cglib代理中的方法时，cglib又是怎么来执行增强方法和目标方法的呢？

这个我们下节继续分析。