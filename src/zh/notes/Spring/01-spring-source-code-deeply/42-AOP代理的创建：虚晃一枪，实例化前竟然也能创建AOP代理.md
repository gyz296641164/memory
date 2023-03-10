---
title: 42_AOP代理的创建：虚晃一枪，实例化前竟然也能创建AOP代理？
category:
  - Spring源码
star: true
sticky: true
date: 2023-03-10
---

<!-- more -->

## 开篇

上一篇文章，我们分别介绍了静态代理、jdk动态代理、cglib动态代理的特点和实现方式，内容比较简单，相信大家都已经掌握了。

同时呢，在上篇文章的末尾我们留了一个小思考题，那就是Spring AOP的动态代理到底是在哪个阶段生成的？没有思考出答案的同学也不用气馁，这篇文章我们就一起来探索一下AOP动态代理生成的时机。

在开始探索之前，这里先简单介绍一下本篇文章的讲解思路，会包含以下几部分：

1. 在探索AOP源码前，我们会先回顾一下之前AOP的入门案例代码
2. 熟悉完AOP入门案例代码后，我们会从**context.getBean()方法开启AOP源码**的探索之旅
3. 在探索源码的过程中，我们会发现AOP自动代理时机之一， 那就是postProcessBeforeInstantiation

---

## 回顾下AOP入门示例

在AOP系列的第一篇文章中，我们曾使用AOP实现了一个日志功能，我们简单回顾下，首先切面定义如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302101525554.png)

切面中的一些注解我们都讲过了，很简单，这里就不赘述了

service的实现类代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302101526137.png)

对应的测试类代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302101526757.png)

测试类执行后的打印结果如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302101526732.png)

这样我们就使用AOP切入了日志代码片段，新增了额外的功能（记录日志），非常的简单。

重要的是我们现在知道AOP是通过动态代理实现的，而增强逻辑肯定是放在回调程序的invoke()方法或intercept()方法中，具体在哪个方法中，这个取决于使用jdk动态代理还是cglib动态代理，不过这个我们现在不用去深究。

那么现在可以确认的一点就是测试类中context.getBean("productServiceImpl")返回的一定是一个动态代理对象，因为**只有调用动态代理中的方法，才能对目标类的功能进行增强，所以这里返回的productService，一定是一个动态代理对象**。

我们知道context.getBean("productServiceImpl")，是根据beanName从IOC容器中获取了一个bean实例，既然是从IOC容器中获取的bean实例，为啥又变成动态代理对象了？

那这里我们做一个大胆的猜测，那就是**在从IOC容器中获取bean实例的时候，AOP肯定在某个阶段做了特殊处理**，这个特殊处理会将bean实例给“替换”为动态代理对象。

那怎么来证明这个猜测呢？

那简单啊，实践是检验真理的唯一标准，我们来实地探索一下不就知道啦，好，那我们现在就开干。

---

## 开启AOP自动代理时机的探索之旅

涉及方法：

- `org.springframework.beans.factory.support.AbstractBeanFactory.doGetBean(String name, @Nullable Class<T> requiredType, @Nullable Object[] args, boolean typeCheckOnly) throws BeansException`
- `org.springframework.beans.factory.support.AbstractBeanFactory.createBean(String beanName, RootBeanDefinition mbd, @Nullable Object[] args) throws BeanCreationException`
- `org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory.resolveBeforeInstantiation(String beanName, RootBeanDefinition mbd)`

那现在就带着我们的猜测，开启探索之旅吧，我们先来看一下探索之旅的入口，我们看这张图

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302101710387.png)

既然现在动态代理对象是由context.getBean("productServiceImpl")返回的，那么context.getBean("productServiceImpl")当然就是我们剖析源码的入口啦。

首先我们点进去getBean()方法看下

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302101710445.png)

我们发现这里其实没啥逻辑，而是又调用了BeanFactory的getBean()方法，那我们接着点getBean()方法进去看看

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302101710148.png)

我们发现这个AbstractBeanFactory#getBean(java.lang.String)中直接调用了一个doGetBean()方法，那我们直接点doGetBean()方法进去看看

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302101710330.png)

这个时候我们就看到了一大堆的代码，这里比较重要的就是Object sharedInstance = getSingleton(beanName);这行代码了，这行代码我们在bean加载时讲过，它主要是从缓存中获取bean实例用的，所以这个和我们AOP的流程无关

然后我们继续往下看，会发现一行比较重要的代码，我们看这里

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302101711898.png)

大家可以看到，这一块是对单例bean的处理，bean默认其实都是单例的，所以是会走这里来创建bean的。

这个时候我们点createBean()方法进去看下，看能不能找到一些AOP的蛛丝马迹

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302101711066.png)

此时我们发现了一行极为关键的代码，那就是Object bean = resolveBeforeInstantiation(beanName, mbdToUse)，看这行代码的注释大概意思是“让 BeanPostProcessors 有机会返回一个目标bean的代理对象”，瞬间感觉发现了新大陆，这个不就是为bean创建一个代理对象的意思吗？此时我们就欣喜若狂的点了进去

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302101711769.png)

点进去之后，我们发现resolveBeforeInstantiation()方法会先看一下这个bean在实例化之前是够解析过，那么第一次进来的话这个mbd.beforeInstantiationResolved变量为null，所以整个条件为true。

第一个条件满足后，紧接着又会看下这个bean是不是合成的，并且是否存在实现了InstantiationAwareBeanPostProcessor接口的beanPostProcessor，一般这2个条件都会成立，所以会代码会继续往下走，接着就会调用`applyBeanPostProcessorsBeforeInstantiation()`方法

---

## AOP自动代理时机之一：postProcessBeforeInstantiation

涉及方法：

- `AnnotationAwareAspectJAutoProxyCreator#postProcessBeforeInstantiation()`
- `AbstractAutoProxyCreator#postProcessBeforeInstantiation()#getCustomTargetSource(beanClass, beanName)`：只有指定了targetSource才会在这里创建代理，遗憾的是我们一般是不会指定targetSource的，也就是一般是不会在这里创建代理

我们接着点进去applyBeanPostProcessorsBeforeInstantiation()方法，可以看到下边的代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302101752880.png)

我们看到，这里其实就是调用了一个getBeanPostProcessors()方法获取到了所有的BeanPostProcessor，然后循环调用了BeanPostProcessor的postProcessBeforeInstantiation()方法，也就是实例化前的处理。

那么这些BeanPostProcessor中有没有AOP相关的呢？

这个就尤为重要了，那这个时候就需要看下这个getBeanPostProcessors()方法了，那我们就点进去看下呗

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302101752472.png)

点进去之后就比较失望了，这里直接返回了beanPostProcessors这个List数据结构，这就尴尬了，因为我们现在不好确定这个beanPostProcessors里边到底有哪些beanPostProcessor。

那现在只有使用我们的终极大招了，那就是debug大法，通过debug我们发现这个getBeanPostProcessors()方法会返回7个beanPostProcessor，分别如下：![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302101752171.png)

看着这7个beanPostProcessor，大家觉得哪个beanPostProcessor最有可能和AOP相关呢？

此时我们一眼望去，通过名字我们发现，这些beanPostProcessor要不就是和容器相关的，要不就是和bean注册相关的，不过我们眼前一亮，发现了一个叫AnnotationAwareAspectJAutoProxyCreator的beanPostProcessor，这个名字一看就是针对AspectJ注解的自动代理创建器，历经九九八十一难，我们终于找到了AOP相关的beanPostProcessor，那我们赶紧点进去这个AnnotationAwareAspectJAutoProxyCreator，看看它的postProcessBeforeInstantiation()方法到底是干什么用的

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302101752683.png)

但遗憾的是我们在AnnotationAwareAspectJAutoProxyCreator中没有找到postProcessBeforeInstantiation()方法，此时我们发现这个AnnotationAwareAspectJAutoProxyCreator继承了AspectJAwareAdvisorAutoProxyCreator类，那这个postProcessBeforeInstantiation()方法是不是从父类继承过来的呢？

这个时候我们看一下AnnotationAwareAspectJAutoProxyCreator的类结构就知道了，类结构如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302101752705.png)

通过上边这张图，我们可以清晰的看到是从AbstractAutoProxyCreator这个类继承过来了postProcessBeforeInstantiation()方法，这个时候我们来看下AnnotationAwareAspectJAutoProxyCreator的类图，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302101752761.png)

我们可以发现AnnotationAwareAspectJAutoProxyCreator的父类是AspectJAwareAdvisorAutoProxyCreator，而AspectJAwareAdvisorAutoProxyCreator的父类是AbstractAdvisorAutoProxyCreator，然后AbstractAdvisorAutoProxyCreator的父类才是这个AbstractAutoProxyCreator类。

而AnnotationAwareAspectJAutoProxyCreator正是从这个AbstractAutoProxyCreator继承过来了postProcessBeforeInstantiation()方法，也就是说真正的处理逻辑，其实是在AbstractAutoProxyCreator的postProcessBeforeInstantiation()方法中。

说白了就是当调用AnnotationAwareAspectJAutoProxyCreator的postProcessBeforeInstantiation()方法时，其实真正调用的是AbstractAutoProxyCreator类的postProcessBeforeInstantiation()方法

那这个时候我们就来看下这个AbstractAutoProxyCreator类的postProcessBeforeInstantiation()方法吧，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302101752247.png)

这个时候我们看到了非常关键的一行代码TargetSource targetSource = getCustomTargetSource(beanClass, beanName)，这行代码上边注释的意思大概是“如果我们指定了targetSource，那么就在这里创建一个代理”，这里我们得到了一个非常关键的信息，那就是只有指定了targetSource才会在这里创建代理。

遗憾的是我们一般是不会指定targetSource的，也就是一般是不会在这里创建代理的，但是也不能说我们就白费了半天功夫，因为这里确实是一个创建代理的时机之一，只不过一般是不会通过这里来创建代理的。

那我们现在继续往下看代码吧，此时由于我们没有指定targetSource，所以getCustomTargetSource(beanClass, beanName)方法得到的targetSource为null，最终这个postProcessBeforeInstantiation()方法返回的是个null。

然后我们再次回到主线上，大家还记得这个postProcessBeforeInstantiation()方法是在哪里调用的吗？其实是在这里

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302101753489.png)

此时这行代码ibp.postProcessBeforeInstantiation(beanClass, beanName)返回null之后，就会去执行其他的beanPostProcessor的postProcessBeforeInstantiation()方法，还记得吗？这里一共有7个beanPostProcessor，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302101753470.png)

其实呢，一般这些beanPostProcessor的postProcessBeforeInstantiation()方法都会返回null

所以最终applyBeanPostProcessorsBeforeInstantiation()方法返回的就是null，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302101753318.png)

此时发现这个bean为null，那么这个bean != null的条件就不满足，所以一般这行代码bean = applyBeanPostProcessorsAfterInitialization(bean, beanName)一般是不会执行的，说白了就是只在特定条件下才会执行，这个特定条件就是我们指定了targetSource的情况。

那么这个applyBeanPostProcessorsAfterInitialization(bean, beanName)方法到底有什么作用呢？

这个我们可以先跳过，先留个悬念在这里，因为我们现在先抓主线，说白了就是抓大放小，这些一般不会走到的代码，我们就先跳过，我们先把握住AOP自动代理时机这条主线，这样可以帮助大家理清源码的主脉络。

那这个时候resolveBeforeInstantiation()方法就执行完毕了，由于我们没有指定targetSource，所以此时bean为null，因此resolveBeforeInstantiation()方法返回的也是null，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302101753263.png)

也就是说此时Object bean = resolveBeforeInstantiation(beanName, mbdToUse)这行代码执行完之后，此时这个bean为null，那么bean != null的条件就不满足，此时就不会直接返回bean，那这个时候代码就会继续往下运行，那接下来就开始执行Object beanInstance = doCreateBean(beanName, mbdToUse, args)这行代码了，也就是开始正常的进行bean的实例化和初始化过程。

那我们来思考下，这个resolveBeforeInstantiation()方法的意义到底是什么？

其实呢，很简单，它的意思就是说，如果我们指定了targetSource，那么可以在这里创建一个代理直接返回，就不需要走下边的实例化和初始化阶段了，因为指定了targetSource后，这个bean就由开发人员自己负责完成创建了。而如果没有指定targetSource，那么就按照正常流程往下执行bean的实例化和初始化，说白了就是人家注释上说的：“给你一个返回代理的机会”

不过一般我们都不会指定targetSource，所以代码会继续往下运行，此时就会来运行doCreateBean()这个方法来创建bean了，那AOP真正的自动代理时机会不会在这个doCreateBean()方法中呢？这个我们下节课再来接着探索。

---

## 总结

我们首先回顾了AOP的入门示例代码，然后开启了源码探索之旅，为了方便复习，这里就用一张图来梳理下AOP代理的创建流程，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302101806776.png)

通过上边的源码流程图，可以看到，我们在使用getBean("productServiceImpl")获取bean实例的时候，首先会去缓存中查找一下，如果缓存中存在这个bean，那么就直接将这个bean作为结果返回，而如果缓存中不存在，那么就开始bean的创建流程。

在创建bean时，首先会执行bean实例化前的处理，其实调用入口就是我们今天分析的resolveBeforeInstantiation()方法，这个实例化前处理postProcessBeforeInstantiation是AOP自动代理的时机之一，它会判断一下当前是否指定了targetSource，如果指定的话，就会跳过bean的实例化和初始化流程，也就是会直接创建AOP代理。而如果没有指定targetSource的话，那么就会正常执行bean的实例化和初始化流程了。

其实**一般我们是不会指定targetSource的**，所以代码会继续往下运行，也就是会正常开始bean的实例化和初始化的流程，说白了就是会执行到doCreateBean()方法。

因此，虽然bean实例化前的处理postProcessBeforeInstantiation是AOP自动代理的时机之一，但是一般是不会在这个阶段创建AOP代理的，那么AOP自动代理的真正时机，会不会在接下来要执行的doCreateBean()方法中呢？这个我们下篇文章接着进行探索。

