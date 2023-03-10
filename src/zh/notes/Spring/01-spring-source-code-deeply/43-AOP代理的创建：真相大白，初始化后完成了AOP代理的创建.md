---
title: 43_AOP代理的创建：真相大白，初始化后完成了AOP代理的创建
category:
  - Spring源码
star: true
sticky: true
date: 2023-03-10
---

<!-- more -->

## 开篇

上篇文章我们将context.getBean("productServiceImpl")作为入口，主要分析了一下`resolveBeforeInstantiation()`方法的源码，那么这篇文章就接着上篇，从`doCreateBean()`方法接着开始探索源码。

为了让大家可以更好的把握主线，在开始分析源码之前，这里先给大家说下本篇文章的主要内容，主要包含如下部分：

1. 首先我们会衔接上节的内容，接着来分析doCreateBean()方法的源码，其实就是bean的实例化和初始化流程
2. 然后我们会重点分析一下bean的初始化流程，首先就是来分析 bean的初始化前处理
3. 接着还会来分析一下 bean的初始化后处理，其实**AOP自动代理的真正时机就在这个初始化后处理中**！

---

## 来看下doCreateBean()方法中都做了什么事儿

> **涉及方法：**

- `org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory#doCreateBean`
- `org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory#createBeanInstance`
- `org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory#applyMergedBeanDefinitionPostProcessors`
- `org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory#initializeBean(java.lang.String, java.lang.Object, org.springframework.beans.factory.support.RootBeanDefinition)`

上篇文章我们看到了Object beanInstance = doCreateBean(beanName, mbdToUse, args)这行代码，对应的代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211100338.png)

大家可以看到，上节我们就分析到了上图红框中的代码，说白了就是要开始bean的实例化和初始化流程了。

那么我们这节呢，就接着从doCreateBean()方法继续往下分析，首先我们点进去来看下doCreateBean()方法的代码吧，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211102814.png)

我们可以看到在doCreateBean()方法中有这么关键的几步：

1. 首先调用createBeanInstance(beanName, mbd, args)创建了一个bean实例
2. 接着调用applyMergedBeanDefinitionPostProcessors(mbd, beanType, beanName)找到了被@Autowired等注解标注的字段和方法, 为下一步的注入做准备
3. 接着调用populateBean(beanName, mbd, instanceWrapper)为bean填充属性
4. 最后调用initializeBean(beanName, exposedObject, mbd)完成bean的初始化

这些核心步骤在前边的IOC部分都讲过，所以这里就不再赘述。那现在我们来分析一下，AOP的代理时机最有可能发生上边哪个核心步骤中？

首先createBeanInstance()被排除，因为根据我们IOC部分的知识知道，这个createBeanInstance()主要就是创建一个bean实例出来，它里边是没有AOP相关的逻辑的。

接着是applyMergedBeanDefinitionPostProcessors()和populateBean()，它们都是和属性注入相关的东西，所以Spring肯定不会将AOP耦合到这种逻辑里边吧？

所以只剩下了initializeBean()，这个是最有可能的，因为通过IOC的知识我们知道，这个initializeBean()方法被beanPostProcessor进行了增强，所以AOP的逻辑极有可能在这个initializeBean()中。

此时我们进去initializeBean()方法后，看到了下边的代码

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211102823.png)

这个时候我们看到了极为关键的两种beanPostProcessor，一个是初始化前处理的beanPostProcessor，另外一个是初始化后处理的beanPostProcessor，我们要找的AOP逻辑极有可能就在这两个beanPostProcessor的其中一个里边。

可能有的同学说除了这两个beanPostProcessor，这里不是还调用了invokeAwareMethods(beanName, bean)和invokeInitMethods(beanName, wrappedBean, mbd)方法吗？难道AOP的逻辑不可能在这两个方法中吗？为啥直接把它俩排除了呢？

因为根据方法的名字，我们大概可以知道这个invokeAwareMethods(beanName, bean)主要是对实现了Aware接口的bean进行特殊处理的。而invokeInitMethods(beanName, wrappedBean, mbd)主要是来调用我们指定的初始化方法的，比如调用我们配置的init-method方法。

所以只能说AOP的逻辑不大可能在这两个方法中，还有按照Spring的编码习惯，它们**肯定是通过beanPostProcessor来扩展AOP逻辑**的，所以我们才说AOP的逻辑，极大概率是在这两个beanPostProcessor其中之一中。

---

## bean初始化前的处理：postProcessBeforeInitialization

> **涉及方法：**

- `org.springframework.beans.factory.config.BeanPostProcessor#postProcessBeforeInitialization`
- `org.springframework.aop.framework.autoproxy.AbstractAutoProxyCreator#postProcessBeforeInitialization`

好，接下来我们就先来看下applyBeanPostProcessorsBeforeInitialization(wrappedBean, beanName)里边是怎么玩儿的吧，点进去这个方法后，代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211104821.png)

我们可以看到，这里的核心逻辑就是遍历所有的BeanPostProcessor，然后分别调用它们的postProcessBeforeInitialization()方法。

那都会遍历哪些BeanPostProcessor呢？

其实就是这个getBeanPostProcessors()来获取的，它获取的就是这个beanPostProcessors，代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211104827.png)

看到这里，大家是不是觉得有点眼熟？上篇文章分析的时候，不也使用到了这个getBeanPostProcessors()方法吗？

对的，就是这个方法，此时再一次使用我们的debug大法，看到了所有的BeanPostProcessor，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211104830.png)

可以看到，和上篇文章一样，都是7个BeanPostProcessor，并且我们还看到了眼熟的AnnotationAwareAspectJAutoProxyCreator，也就是说这里也会调用AnnotationAwareAspectJAutoProxyCreator的postProcessBeforeInitialization()方法。

上篇文章刚开始分析的时候，我们就判断AOP自动代理的逻辑都在这个AnnotationAwareAspectJAutoProxyCreator中。

那我们现在赶紧去AnnotationAwareAspectJAutoProxyCreator中找下postProcessBeforeInitialization()方法呗，此时我们打开AnnotationAwareAspectJAutoProxyCreator的代码，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211104834.png)

尴尬的是在AnnotationAwareAspectJAutoProxyCreator中没有找到postProcessBeforeInitialization()方法。

但是没事儿，通过上节我们知道AnnotationAwareAspectJAutoProxyCreator继承了父类，所以此时这个postProcessBeforeInitialization()方法可能是从父类直接继承过来的，此时我们看下AnnotationAwareAspectJAutoProxyCreator的类结构，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211104839.png)

可以看到，果然是从父类AbstractAutoProxyCreator继承过来的postProcessBeforeInitialization()方法

这个AbstractAutoProxyCreator和AnnotationAwareAspectJAutoProxyCreator的关系大家还记得吗？其实上篇文章我们提到过，不记得也没关系，我们再来复习下，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211104842.png)

看到这张图，相信大家都想起来了，具体细节上篇文章讲过了，这里就不再赘述了，

那我们接着往下看，现在就是说AnnotationAwareAspectJAutoProxyCreator从AbstractAutoProxyCreator继承过来了postProcessBeforeInitialization()方法，所以核心逻辑还是在AbstractAutoProxyCreator中，那我们现在就来看看AbstractAutoProxyCreator中的postProcessBeforeInitialization()方法吧，如下图

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211104845.png)

我们可以看到，在AbstractAutoProxyCreator中的postProcessBeforeInitialization()方法中，没有任何有意义的代码，而是将接收到的bean直接进行了返回，说白了这里根本没有对bean做任何处理，就相当于一个“空实现”，也就是说AOP的逻辑不在初始化前处理中。

---

## bean初始化后的处理：postProcessAfterInitialization

> **涉及方法：**

- `org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory#applyBeanPostProcessorsAfterInitialization`
- `org.springframework.beans.factory.config.BeanPostProcessor#postProcessAfterInitialization`
- `org.springframework.aop.framework.autoproxy.AbstractAutoProxyCreator#wrapIfNecessary`

那么我们现在回到主线上，我们看这里

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211110550.png)

也就是说AOP的逻辑不在这个applyBeanPostProcessorsBeforeInitialization()中。

没关系，那我们再次回到initializeBean()方法，继续往下看

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211110553.png)

说白了现在applyBeanPostProcessorsBeforeInitialization()方法已经被排除了

那我们接着来看下这个applyBeanPostProcessorsAfterInitialization()方法，我们看这里

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211110557.png)

大家可以看到，这里的玩儿法和前边是类似的，同样是遍历所有的BeanPostProcessor，然后调用它们的postProcessAfterInitialization()方法。

我们先来看下都有哪些BeanPostProcessor吧，我们看这里

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211110600.png)

其实呢，还是那7个BeanPostProcessor啦，我们重点看的当然还是这个AnnotationAwareAspectJAutoProxyCreator啦

那我们现在就点进去AnnotationAwareAspectJAutoProxyCreator，然后找下它的postProcessAfterInitialization()方法吧，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211110603.png)

我们发现在AnnotationAwareAspectJAutoProxyCreator中并没有postProcessAfterInitialization()方法，聪明的你一定想到了，它丫的还是从父类继承过来的吧？

哈哈，此时我们一看AnnotationAwareAspectJAutoProxyCreator的类图

![img](http://wechatapppro-1252524126.file.myqcloud.com/apppuKyPtrl1086/image/ueditor/82160600_1647059786.png)

果然，这货还是从人家AbstractAutoProxyCreator继承过来的postProcessAfterInitialization()方法，还是原来的配方，还是熟悉的味道。。。

那现在还有说的，我们直奔AbstractAutoProxyCreator的postProcessAfterInitialization()方法呗，此时我们会看到下边的代码

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211110616.png)

前边的几行代码都是一些常规判断，我们可以暂时忽略掉，此时我们会发现一行极为关键的代码return wrapIfNecessary(bean, beanName, cacheKey)，从名字上来看，这个wrapIfNecessary()方法会对bean进行包装，包装完毕后，直接将包装好的bean给返回了。

那wrapIfNecessary()方法在进行包装的时候，会不会就是将普通的bean给包装成了AOP代理呢？

起码现在看来，这里的嫌疑是非常大的，那我们现在就点进去wrapIfNecessary()方法，来验证下我们的猜想吧，此时我们会看到以下代码

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211110621.png)

此时我们会看到2行极为重要的代码，首先是Object[] specificInterceptors = getAdvicesAndAdvisorsForBean(bean.getClass(), beanName, null)，通过这个方法的名字，我们可以大概猜出，它主要是用来获取当前bean对应的增强。

接着将获取的增强specificInterceptors交给了createProxy(
   bean.getClass(), beanName, specificInterceptors, new SingletonTargetSource(bean))，而这个createProxy()方法会根据这些增强生成代理对象proxy，最后将这个代理对象proxy返回，这样就将一个普通的bean替换为了AOP代理。

这里补充一点，那就是如果这个bean没有相应的增强，**即`specificInterceptors = null`时，是不会给这个bean创建AOP代理的**。

---

## 梳理下AOP代理时机的核心源码流程

通过连着两篇文章的源码探索，我们现在终于搞清楚了AOP代理的时机，详细的流程如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211111255.png)

其实整个流程还是比较简单的，大家都可以在源码中找到流程图中对应的关键组件和方法

需要注意的一点就是，当我们指定了targetSource的时候，除了会调用实例化前处理applyBeanPostProcessorsBeforeInstantiation()外，还会调用初始化后处理applyBeanPostProcessorsAfterInitialization()，对应的代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211111258.png)

在上篇文章分析resolveBeforeInstantiation()方法时，由于targetSource一般都不会指定，从而导致bean != null不会满足，所以我们抓大放小，直接跳过了红框中的这行代码

但是我们今天分析bean初始化后处理时，发现这里竟然调的也是这个applyBeanPostProcessorsAfterInitialization()方法，代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211111303.png)

我们惊奇的发现resolveBeforeInstantiation()和initializeBean()竟然调了相同的方法，那就是applyBeanPostProcessorsAfterInitialization()，而整个创建AOP代理的关键代码就在这个applyBeanPostProcessorsAfterInitialization()中哦。

所以我们现在明白了，不管我们是否指定了targetSource，都会依赖初始化后处理applyBeanPostProcessorsAfterInitialization()来完成AOP代理的创建，就像上边我们梳理的流程图一样，大家可以拿着流程图对照着源码多看几遍，相信大家都会有新的收获。

---

## 总结

一张图来梳理下AOP代理的创建流程

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202302/20230211111325.png)

上图是目前为止，我们分析的AOP代理创建流程的源码图，其中红色背景的部分就是我们今天新分析的内容。

我们来总结一下，首先我们从doCreateBean()方法开始，一路探索到`postProcessBeforeInitialization`和`postProcessAfterInitialization`，然后经过分析发现，原来**AOP是在`postProcessAfterInitialization`中完成了代理对象的创建**。

并且从`wrapIfNecessary()`方法的代码上来看，AOP创建代理对象可以粗略的分为两个步骤，

- 首先调用`getAdvicesAndAdvisorsForBean()`方法获取bean对应的增强，
- 接着调用`createProxy()`方法创建出代理对象。

那么问题来了，AOP到底是怎么来匹配和获取bean对应增强的？在创建代理时，使用的是jdk动态代理还是cglib动态代理？

这个大家不要着急，我们一个一个来解决，下篇文章我们先来解决上边的第一个问题，那就是一起来分析下`getAdvicesAndAdvisorsForBean()`方法，看下它到底是怎么匹配出bean对应增强的。

大家可以先自己思考一下，这里给个小提示，那就是肯定会用到之前我们定义的切面和切点表达式！

