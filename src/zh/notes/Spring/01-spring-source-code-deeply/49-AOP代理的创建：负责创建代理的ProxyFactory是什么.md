---
title: 49_AOP代理的创建：负责创建代理的ProxyFactory是什么？
category:
  - Spring源码
star: true
sticky: true
date: 2023-02-26
---

<!-- more -->

## 开篇

到目前为止，我们已经获取到了当前bean对应的拦截器（增强），接下来就是拿着这些拦截器来生成动态代理了，那么从这篇文章开始，我们就会一步一步来分析AOP创建代理的流程，分析入口当然是这个createProxy()方法方法啦。

不过按照惯例，在开始今天的文章之前，这里先介绍下本篇文章的讲解思路，如下：

1. 首先我们会简单介绍一下ProxyFactory，它其实就是专门用来创建动态代理的配置工厂
2. 接着我们会来分析下拦截器和目标类等核心属性，是怎么设置到ProxyFactory中的
3. 最后还会介绍一下ProxyFactory的扩展点，通过这个扩展点我们可以自定义ProxyFactory

说白了这篇文章就是专门来分析ProxyFactory的，因为**ProxyFactory在整个AOP中是非常重要的**，所以我们需要单独拉一篇文章来介绍这个ProxyFactory。

---

## 通过构造方法创建ProxyFactory代理工厂

上篇文章呢，我们分析到了这个地方，大家来回顾下，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302141027814.png)

那接下来，我们就直接到createProxy()方法中看下吧

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302141027065.png)

我们先从整体上看下这个createProxy()方法都做了什么，此时我们发现它就是创建了一个proxyFactory对象，接着给这个proxyFactory设置了一堆属性，最后通过proxyFactory对象的getProxy()方法就获取到了一个动态代理对象。

那这个ProxyFactory是个啥呢？

其实我们通过名字来看的话，猜测ProxyFactory就是一个代理工厂，也就是专门用来创建动态代理的工厂，现在看来这个ProxyFactory是非常非常重要的的，那现在就非常有必要来研究一下ProxyFactory了。

首先我们从ProxyFactory的无参构造方法看起，如下图

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302141028065.png)

通过上边这张图，可以看到ProxyFactory的无参构造方法没啥特殊的。

好，那现在ProxyFactory已经构建好了，我们接着看下都给这个代理工厂设置了哪些属性吧，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302141028530.png)

我们可以看到，这里设置了一堆的属性，那我们一个一个来看上篇文章呢，我们分析到了这个地方，大家来回顾下，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302141028214.png)

那接下来，我们就直接到createProxy()方法中看下吧

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302141028536.png)

我们先从整体上看下这个createProxy()方法都做了什么，此时我们发现它就是创建了一个proxyFactory对象，接着给这个proxyFactory设置了一堆属性，最后通过proxyFactory对象的getProxy()方法就获取到了一个动态代理对象。

那这个ProxyFactory是个啥呢？

其实我们通过名字来看的话，猜测ProxyFactory就是一个代理工厂，也就是专门用来创建动态代理的工厂，现在看来这个ProxyFactory是非常非常重要的的，那现在就非常有必要来研究一下ProxyFactory了。

首先我们从ProxyFactory的无参构造方法看起，如下图

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302141028531.png)

通过上边这张图，可以看到ProxyFactory的无参构造方法没啥特殊的。

好，那现在ProxyFactory已经构建好了，我们接着看下都给这个代理工厂设置了哪些属性吧，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302141028464.png)

我们可以看到，这里设置了一堆的属性，那我们一个一个来看

---

## 为父类ProxyConfig设置相关属性

首先我们来看下这个`proxyFactory.copyFrom(this)`是干嘛的，那么就要先看下这个入参this到底是哪个类的实例。

此时我们发现proxyFactory.copyFrom(this)是在AbstractAutoProxyCreator中进行调用的，那这个this是不是AbstractAutoProxyCreator类的实例呢？

其实是这样的，虽然这行代码是在AbstractAutoProxyCreator类中调用的，但是我们也知道抽象类是不能直接使用new来实例化的，所以这个this一定是AbstractAutoProxyCreator类的某个子类，那么到底是哪个子类呢？

不知道大家还记不记得，之前在讲AOP自动代理时机时，当时我们就讲过AnnotationAwareAspectJAutoProxyCreator这个类，其实**这个this就是AnnotationAwareAspectJAutoProxyCreator类的一个实例**，只不过一些核心逻辑都是在其父类AbstractAutoProxyCreator中，所以我们很容易忽略掉它的子类。

此时我们搞清楚了入参后，接下来我们就点开copyFrom()方法看下吧，此时会看到如下代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302141039988.png)

可以看到，其实它就是将入参对象的一些属性设置给了proxyFactory自己

比如这个proxyTargetClass属性和optimize属性，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302141039701.png)

此时我们发现proxyTargetClass属性和optimize属性都是在一个叫做ProxyConfig的类中，而不是ProxyFactory中。

那这个ProxyConfig和ProxyFactory之间到底是什么关系呢？

这个其实简单，我们看一眼ProxyFactory的继承关系就都知道了，如下图

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302141040438.png)

此时我们发现，其实ProxyFactory是ProxyConfig的子类，所以ProxyFactory是可以从父类ProxyConfig继承过来属性的，比如proxyTargetClass属性和optimize属性。

那通过copyFrom()方法设置的proxyTargetClass属性和optimize属性到底是干嘛的呢？这个我们现在还不知道，不过看源码就是这样，前边设置的一些属性可能是为了给后边使用的，所以这里我们就先跳过，接着往下看还会设置哪些属性吧。

---

## 为ProxyFactory设置proxyTargetClass标识

接着我们继续往下看，此时就会看到下边这块代码

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302141057622.png)

通过上边这张图，可以看到，这里就是先看下proxyTargetClass属性是否为true，这个属性的名字翻译过来是“代理目标类”，我们从名字中就可以判断出来它就是基于类代理的意思，因为我们知道动态代理有两种，分别是jdk代理和cglib代理，而jdk代理是基于接口的，而cglib代理是基于类的，所以这个proxyTargetClass属性，就代表你是不是要基于目标类进行代理，也可以翻译为是否使用cglib代理，都是一个意思。

好，我们接着往下看，如果当前不是基于类代理的，也就是基于接口代理的，那么就会进入这个if分支，在这个if分支中又会来执行shouldProxyTargetClass(beanClass, beanName)方法，此时我们点进来这个方法看一眼，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302141057881.png)

通过上边这张图，可以看到，这里其实主要就是调用shouldProxyTargetClass()方法完成了判断，那我们接着来看下这个方法中是怎么玩儿的，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302141057104.png)

此时我们发现，其实这里就是从BeanDefinition中取出一个PRESERVE_TARGET_CLASS_ATTRIBUTE属性，看一下这个属性是否配置为了true。

而这个PRESERVE_TARGET_CLASS_ATTRIBUTE的定义如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302141058146.png)

可以看到，其实这个PRESERVE_TARGET_CLASS_ATTRIBUTE真正代表的参数名字是preserveTargetClass，说白了这个shouldProxyTargetClass()方法就是来看一下BeanDefinition中的preserveTargetClass属性是否被配置为了true。

如果preserveTargetClass配置为了true，那么就将proxyTargetClass设置为true，代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302141058749.png)

说白了就是除了proxyTargetClass属性可以控制是基于类代理还是基于接口代理，Spring在BeanDefinition中还定义了一个preserveTargetClass属性，它也可以控制基于类代理和基于接口代理，相当于给自己留了一个“后门”。

然后我们接着往下看，如果proxyTargetClass和preserveTargetClass都为false，那么说明此时是基于接口代理的，那么此时就会执行evaluateProxyInterfaces()方法，代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302141058871.png)

我们可以看到，这里首先获取了目标类中的所有接口，然后依次处理这些接口，处理的时候调用了isConfigurationCallbackInterface()方法和isInternalLanguageInterface()方法，这两个方法很简单，代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302141058407.png)

其实就是看下这些接口是不是回调接口或者是内部语言的接口，也就是确保这些接口是用户自己定义的有效接口

如果存在有效接口的话，并且接口中存在方法的话，那么就将hasReasonableProxyInterface设置为true，接着就会将有效接口添加到proxyFactory的interfaces属性中

说白了这里就是将代理要实现的接口先保存起来，后边基于接口生成代理的时候就会使用到！

而如果不存在有效接口的话，那么此时就只能基于类进行代理了，就会将proxyTargetClass属性设置为true

---

## 为ProxyFactory设置拦截器

到了这里，我们发现前边我们千辛万苦得到的拦截器还没有用到，不过没事儿，我们继续往下看，此时就会看到一个buildAdvisors()方法，一看这个方法的名字，就必然和拦截器脱不了干系，这个buildAdvisors()方法的代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302141106287.png)

可以看到，这里主要就是会先去解析普通拦截器，如果存在普通拦截器的话，就将普通拦截器和之前获取的增强拦截器合并到一起。

最后对合并后的拦截器进行统一再封装，即统一封装为Advisor类型，此时就会调用下边这个wrap()方法

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302141106684.png)

通过上边这张图，可以看到，在使用wrap()方法进行统一封装的时候，会先看一下当前要封装的对象是不是Advisor类型，如果本身人家就是Advisor类型的话，那这里就不用再多此一举了，此时直接返回原来的对象就可以了。

需要注意的是这个wrap()方法只能包装Advisor类型和Advice类型，如果要包装的对象不是这两种类型，那么就直接抛异常进行提示，而如果是这两种类型之一的话，那么就统一包装成DefaultPointcutAdvisor对象，最后将统一包装好的advisors返回。

接着就将包装好的advisors通过addAdvisors()方法添加到proxyFactory中，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302141106277.png)

这个时候就将之前我们千辛万苦获取到的拦截器，给设置到了ProxyFactory中，这样后边创建代理时，就可以从ProxyFactory中获取到拦截器了！

---

## ProxyFactory扩展点介绍

设置完拦截器后，我们再接着往下看，此时可以看到一个ProxyFactory的扩展点，那就是customizeProxyFactory()方法，如下图

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302141115538.png)

我们再进一步看下这个customizeProxyFactory()方法的定义，代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302141115729.png)

可以看到，这里其实就是一个空实现，说白了就是ProxyFactory为我们留的一个扩展点，我们可以使用子类来重写这个方法，这样就可以定制自己的ProxyFactory了

然后我们再往下看，发现最后还会设置一个preFiltered标识，代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302141115872.png)

通过上边的代码，可以看到，这里调用了一个advisorsPreFiltered()方法，那么我们就点进去看下这个方法看下呗

但是此时我们发现这个方法有2个实现，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302141115756.png)

那现在问题来了，到底应该走哪个实现呢？

其实这个也简单，走哪个实现取决于当前的this是谁，在开头的时候我们说过，当前的this是AnnotationAwareAspectJAutoProxyCreator类的一个实例，而AnnotationAwareAspectJAutoProxyCreator的继承关系如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302141115000.png)

通过上边的类图，可以看出，上边的AbstractAdvisorAutoProxyCreator和AbstractAutoProxyCreator都算是AnnotationAwareAspectJAutoProxyCreator的“父类”，其中AbstractAdvisorAutoProxyCreator和AbstractAutoProxyCreator都有advisorsPreFiltered()方法的实现。

但是AbstractAdvisorAutoProxyCreator重写了AbstractAutoProxyCreator中的advisorsPreFiltered()方法，所以对于AnnotationAwareAspectJAutoProxyCreator的实例来说，应该要执行AbstractAdvisorAutoProxyCreator类的advisorsPreFiltered()方法，此时代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302141115338.png)

通过上边的代码，可以发现这里永远返回true

既然advisorsPreFiltered()方法返回true，那么就会执行if分支中的代码，说白了就是会执行下边这行代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302141115276.png)

说白了就是将ProxyFactory中的preFiltered标识设置为true

那这个preFiltered标识有什么用呢？

其实从名字来看，这个preFiltered标识是预过滤的意思，但是目前为止，我们还真不清楚它的作用，我们猜测这个preFiltered标识应该在后边某个地方会用到，所以这个preFiltered标识有个大概印象就可以了，我们继续往下分析。

好了，到这里为止ProxyFactory的核心属性就都设置完成了，也就是创建代理的准备工作都完成了

属性设置完成之后，接着就会来执行这行代码proxyFactory.getProxy(getProxyClassLoader())，如下图

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302141115033.png)

这里就会使用ProxyFactory来创建代理了，我们知道创建动态代理时有两种常用的方式，分别是基于接口的jdk代理和基于类的cglib代理。

那大家思考一下Spring在创建动态代理时，在jdk代理和cglib代理之间到底是怎么选择的呢？下篇文章我们会详细分析这块

---

## 总结

一张图来梳理下AOP代理的创建流程

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/202302141115373.png)

上图是目前为止，我们分析的AOP代理创建流程的源码图，其中红色背景的部分就是我们今天新分析的内容。

我们来总结一下，今天主要分析了下代理工厂ProxyFactory，说白了它就是专门负责创建代理的，在构造好ProxyFactory后，Spring还会为ProxyFactory设置一些核心属性，比如拦截器advisors和代理目标类targetSource等，这些核心属性后边都会使用到的。

到这里为止创建代理的准备工作就已经完成了，接下来就要开始真正创建代理了，但是创建代理有两种常用的方式，分别是jdk代理和cglib代理，那Spring到底是怎么选择的呢？这个我们下篇文章继续来分析。
