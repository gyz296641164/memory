---
title: 50_AOP代理的创建：Spring是如何选择jdk代理和cglib代理的？
category:
  - Spring源码
date: 2023-02-26
---

<!-- more -->

## 开篇

大家好，上篇文章我们详细分析了下代理工厂ProxyFactory，我们知道在ProxyFactory创建好之后，Spring会为ProxyFactory设置很多核心的属性，其中就包括非常核心的拦截器，这个拦截器包含我们切面中的增强拦截器和普通的拦截器。

到这里为止，创建代理的准备工作就准备好了，那么本篇文章就接着往下分析，来看下Spring到底是怎么创建代理的。

在开始今天的内容之前，先介绍下本篇文章的主要内容，主要包含：

1. 首先我们会简单介绍一下创建代理的核心组件DefaultAopProxyFactory
2. 然后会详细分析下DefaultAopProxyFactory在什么情况下会使用jdk代理
3. 同样也会分析下DefaultAopProxyFactory在什么情况下会使用cglib代理

---

## AOP代理工厂DefaultAopProxyFactory

现在创建代理的准备工作都完成了，那么接下来就会来执行这行代码proxyFactory.getProxy(getProxyClassLoader())，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302151804588.png)

这里没啥好说的，我们直接点进去上图中的getProxy()方法，然后会看到下边的代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302151804947.png)

通过上边这张图，可以看到，这里呢先是调用createAopProxy()获取一个对象，然后又调用了这个对象的getProxy()方法

那我们就需要先来看一下这个createAopProxy()返回到到底是哪个对象，我们看下边这行代码

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302151805792.png)

通过上边这张图，可以看到，然后我们发现这里又调用了这行代码getAopProxyFactory().createAopProxy(this)，也就是先调用getAopProxyFactory()获得了一个代理工厂，然后又调用了代理工厂的createAopProxy()方法。

那getAopProxyFactory()方法获得的到底是哪个代理工厂呢？

没办法我们只能继续来看下getAopProxyFactory()方法到底获取的是个啥，我们看下边这行代码

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302151805495.png)

此时我们发现它返回的就是一个变量，那这个变量是在哪里初始化的呢？

然后我们找到了这个构造方法，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302151805850.png)

通过上边这张图，可以看到，也就是默认这个aopProxyFactory变量其实是DefaultAopProxyFactory类的一个实例。

那我们就知道了原来我们要找的代理工厂其实是DefaultAopProxyFactory，那接下来就要来调用DefaultAopProxyFactory类的createAopProxy()方法了

---

## jdk代理和cglib代理怎么选？

接下来还有啥好说的，我们直接到DefaultAopProxyFactory类中看下这个createAopProxy()方法呗，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302161038610.png)

此时我们可以看到在这个createAopProxy()方法中有一个极为重要的判断条件，那就是config.isOptimize() || config.isProxyTargetClass() || hasNoUserSuppliedProxyInterfaces(config)，这里边有2个变量大家有没有感觉很眼熟？

没错，就是当时通过copyFrom()方法为ProxyFactory设置的属性，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302161038131.png)

接着在copyFrom()方法中设置了proxyTargetClass属性和optimize属性，我们看下边这块代码

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302161038206.png)

当时我们还不知道proxyTargetClass属性和optimize属性有啥用，现在大家知道这俩属性的用处了吧，说白了就是在创建代理时，这俩属性会参与选择jdk代理还是cglib代理的判断。

那具体又是怎么判断的呢？

是这样的，config.isOptimize() || config.isProxyTargetClass() || hasNoUserSuppliedProxyInterfaces(config)这行代码的三个条件如果都是false，那么就使用jdk代理，如果其中一个为true，那么就会做进一步的判断

不过在看进一步判断之前，我们有必要先来看下这三个条件分别代表什么意思

首先config.isOptimize()表示是否开启了优化策略，这个默认为false，一般不常用，所以我们可以暂时忽略它

接着是config.isProxyTargetClass()，这个我们就比较熟悉了，因为在上篇文章，有专门的逻辑来处理这个属性，简单说要不就是用户自己将proxyTargetClass设置为true，要不就是间接指定了BeanDefinition中的preserveTargetClass为true，这两种情况proxyTargetClass都会为true（这块逻辑如果大家忘记的话，那么可以再回顾下上一篇文章），此时代表是需要基于类进行代理的，而其他情况就是false，代表基于接口代理。

最后一个条件是hasNoUserSuppliedProxyInterfaces(config)，它就稍微有点复杂了，它的代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302161038902.png)

其实简单说，要不就是目标类没有实现接口 ，要不就是目标类实现了接口且接口类型是SpringProxy，这两种情况只要满足一种就会返回true。

现在这行代码config.isOptimize() || config.isProxyTargetClass() || hasNoUserSuppliedProxyInterfaces(config)的三个条件，我们都分别知道是什么意思了，那我们回头再看下选择代理的这块代码，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302161038770.png)

通过上边这张图，可以看到，当这三个条件都为false时，也就是既没有开启优化策略，也没有设置基于类的代理，最后目标类实现了接口但不是SpringProxy类型的，此时就会使用jdk动态代理

而只要三个条件有一个为true，那么就会走到if分支里边去，但是代码执行到这里的时候，也不是说百分之百就使用cglib代理，因为这里还有一个if判断，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302161038524.png)

大家可以看到，这里会再次判断下，目标类是不是本身就是一个接口或者代理类，那如果目标类本身就是一个接口或者代理类的话，这里还是会使用jdk代理的，其他情况则都会使用cglib代理了。

到这里为止，相信大家都搞明白了，在Spring生成代理时，什么时候应该使用jdk代理，什么时候又应该使用cglib代理。

这里我们还是简单总结一下吧，其实按照最常用的配置来说

1. 如果设置了proxyTargetClass为true，也就是设置了基于类进行代理，并且此时目标类本身既不是接口类型也不是代理类时，这个时候就会使用cglib代理
2. 如果没有设置proxyTargetClass，即proxyTargetClass为false，但是此时目标类没有实现接口，此时也会使用cglib代理
3. 如果目标类实现了接口，并且此时没有强制设置使用cglib代理，比如proxyTargetClass为false，这个时候就会使用jdk代理

那话说回来了，我们这里使用的是jdk代理还是cglib代理呢？

其实我们现在就是既没有开启优化策略，也没有设置基于类的代理，并且目标类实现了接口但不是SpringProxy类型的，也就是说这三个条件全部为false，因此我们这里会使用jdk代理，也就是会执行这行代码，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302161039268.png)

那jdk动态代理是怎么一步一步创建出来的呢？这个我们下篇文章继续来分析。

---

## 总结

一张图来梳理下AOP代理的创建流程

![20230216105540](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302161056592.png)
