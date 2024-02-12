---
title: 29_bean的加载：为刚刚实例化的bean填充属性(上)
category:
  - Spring源码
star: true
date: 2023-03-31
---

<!-- more -->

## 开篇

上一节，我们初步分析下Spring是如何实例化bean的，也看到了Spring默认就是通过反射来实例化bean的，但是，我们暂时也只看到了bean刚实例化出来，那Spring会对刚实例化好的bean做怎样的处理呢？

接下来，我们沿着上节课的足迹继续来看下，这一节主要分为以下几个部分：

1. 首先来了解下Spring是如何对BeanDefinition的信息做进一步的完善处理的

2. 然后来重点看下早期单例的bean，具体是如何通过缓存暴露给外界访问的

3. 最后来看下Spring又是如何通过后处理器，为bean属性的修改提供扩展点的

---

## 通过后处理器合并BeanDefinition

我们先回到上节分析的位置：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202212131511600.png)

如图，现在我们已经通过方法createBeanInstance得到实例化好的bean实例了，并且bean实例目前是包装在instanceWrapper中。

可以看到，因为BeanDefinition中postProcessed属性值默认是false，所以，接下来会来到if分支中调用方法applyMergedBeanDefinitionPostProcessors，通过方法的名称我们大概可以知道是在执行后处理器的方法，而且这个后处理器中的逻辑是和BeanDefinition相关的。

------

我们到applyMergedBeanDefinitionPostProcessors方法看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202212131511417.png)

可以看到，方法中主要就是遍历并且执行所有MergedBeanDefinitionPostProcessor中的postProcessMergedBeanDefinition方法。

其中，MergedBeanDefinitionPostProcessor是继承BeanPostProcessor

的，所以，MergedBeanDefinitionPostProcessor也是一个后处理器，其实，MergedBeanDefinitionPostProcessor的主要职责，就是用来合并一些信息到BeanDefinition中的，尤其是bean的属性上添加了注解@Autoired、@Resource等，这些注解上面的信息当然也是需要被纳入到BeanDefinition中的。

比如，MergedBeanDefinitionPostProcessor有很多实现类都是和解析注解上的BeanDefinition信息有关的，如CommonAnnotationBeanPostProcessor、AutowiredAnnotationBeanPostProcessor、RequiredAnnotationBeanPostProcessor等，这里我们暂时先了解MergedBeanDefinitionPostProcessor的核心思想，注解相关的源码后面我们单独来分析。

---

## 通过缓存提前曝光早期单例bean

接下来的一段逻辑非常的关键，和循环依赖的解决密切相关，我们来看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202212131511431.png)

首先，我们可以看到会通过一段逻辑运算得到earlySingletonExposure的值。

逻辑运算当中有两个我们已经很熟悉了，一个因为BeanDefinition默认是单例的，所以mbd.isSingleton()为true，另一个是当前的bean确实也是处于正在创建的状态，所以isSingletonCurrentlyInCreation(beanName)也为true。

而最后一个成员变量的值，也就是this.allowCircularReferences默认的值就是true，也就是说Spring默认是允许循环依赖的，所以，现在我们可以得到earlySingletonExposure的值为true，也就是允许早期单例bean的曝光，所以，接下来会调用方法addSingletonFactory。

------

方法addSingletonFactory的入参有两个，一个是当前正在实例化bean的名称beanName，另外一个是实现了方法getEarlyBeanReference的匿名内部类，可以看到getEarlyBeanReference方法应该就是获取一个早期bean的方法。

而且大家发现没有，Spring还特意把刚刚创建好的bean实例作为参数，传入到方法getEarlyBeanReference中了，而当前的bean实例不就是早期单例bean吗，bean实例中的其他很多事情都还没来得及做，比如给属性赋值、初始化方法的执行这些事情都还没有开始，这个单例bean就不是一个完完整整的单例bean。

------

难道Spring就是通过方法getEarlyBeanReference，来暴露早期单例bean的吗？我们进去看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202212131512517.png)

可以看到，在方法getEarlyBeanReference中，主要就是执行后处理器SmartInstantiationAwareBeanPostProcessor中的方法，当然，默认情况下是没有注册相应SmartInstantiationAwareBeanPostProcessor的后处理器。

那如果注册了SmartInstantiationAwareBeanPostProcessor类型的后处理器，默认会做些什么事呢？我们到SmartInstantiationAwareBeanPostProcessor中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202212131512099.png)

可以看到，Spring默认就把我们刚创建好的bean实例直接返回了。

说到底，这里同样是Spring留给我们的一个扩展点的，希望我们自定义实现接口SmartInstantiationAwareBeanPostProcessor，然后重写方法getEarlyBeanReference，自定义早期单例的bean应该需要哪些东西，好让其他bean实例化时，得到符合需求的早期单例bean。

------

了解完参数之后，我们再到方法addSingletonFactory中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202212131512764.png)

果然，Spring就是在这里，将封装好了早期单例bean的ObjectFactory，添加到了三级缓存也就是单例工厂缓存singletonFactories中。

又因为缓存singletonFactories中的数据才刚添加，所以需要将二级缓存earlySingletonObjects中关于beanName的信息都清除掉，因为早期单例缓存earlySingletonObjects中的数据，需要自于三级缓存singletonFactories，这个前面我们都看到了。

------

看到这里，前面解决循环依赖时的最后一个盲点我们也解决了，正是因为bean在实例化时，提前将还未完全实例化好的早期单例bean通过缓存向外界曝光，这样的话，当其他bean在实例化才能有机会尽早获取到早期单例，进而解决循环依赖的问题。

---

## 初步为bean的实例填充属性

现在，bean的实例只不过刚刚诞生，算是一个早期的单例，离完整的一个单例bean还差一段距离，我们继续来看下后面的一些逻辑：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202212131512170.png)

接下来会调用方法populateBean，方法populateBean从字面上来看就是填充bean的意思，说白了就是为刚实例化好的bean填充各种属性的值。

但是，bean属性相关的信息都存放在BeanDefinition中，毕竟BeanDefinition是bean的定义，存放了关于bean的几乎一切信息，所以，接下来Spring会调用方法populateBean获取BeanDefintion中的属性信息，然后填充到bean的实例当中。

------

但实际的过程肯定没有我们想的那么轻描淡写，接下来，我们具体到方法populateBean中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202212131512239.png)

首先，参数bw当前是不为空的，所以第一个if分支暂时可以跳过，在第二个if分支中，我们又看到了一些熟悉的代码了。

前面我们分析过，Spring可以通过调用后处理器InstantiationAwareBeanPostProcessor中的方法postProcessBeforeInstantiation来实例化bean，当然，如果方法postProcessBeforeInstantiation中没有定义实例化bean的逻辑，那在另外一个方法postProcessAfterInstantiation中，可能还是会有一些逻辑的。

只不过现在，Spring已经默认实例化了一个bean出来了，所以，此时调用方法postProcessAfterInstantiation，最多也只是Spring来为刚实例化好的bean，设置一些属性的值而已，而且默认情况下，InstantiationAwareBeanPostProcessor的一些实现类其实都是一些空实现，默认都是返回true的，我们依然可以理解为这是Spring提供为我们的扩展点而已。

------

我们继续往后面看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202212131512945.png)

可以看到，接下来就是按照bean定义好的模式，对bean中的属性进行赋值。

比如到底是通过属性的名称，还是通过属性的类型进行赋值呢？下一节，我们重点来看下这块的内容。

---

## 总结

### 概述

第一，我们了解了Spring还会基于BeanDefinition的**后处理器MergedBeanDefinitionPostProcessor**，将bean相关的信息都合并到BeanDefinition中，方便下一步为bean的属性赋值做好准备。

第二，同时我们也看到了，初步实例化好的早期单例bean，会通过匿名内部类的方式封装一个ObjectFactory，并添加到单例工厂缓存singletonFactories中，相当于提前通过缓存曝光给了外界，这也就是为什么Spring可以解决循环依赖的关键。

第三，我们初步了解了Spring是如何为bean填充属性值的，最开始也是做一些准备的工作，比如，我们看到Spring还为我们提供了**后处理器InstantiationAwareBeanPostProcessor**这样的扩展点，方便我们自定义为指定的bean填充或提供相应的属性信息。

### 关键方法

**为bean设置各种属性**

```
populateBean(beanName, mbd, instanceWrapper);
```

**根据名称来注入**

```java
autowireByName(beanName, mbd, bw, newPvs);
```

**根据类型来注入**

```java
autowireByType(beanName, mbd, bw, newPvs);
```



