---
title: 13_Spring初级容器初始化：BeanDefinition是如何注册到Spring容器
category:
  - Spring源码
star: true
date: 2023-03-31
---

<!-- more -->

## 开篇

上一节，我们分析了bean标签下的各种子标签的解析，包括meta标签、lookup-method标签、replaced-method标签、constructor-arg标签、property标签等。

同时，我们也看到了对于constructor-arg标签和property标签而言，会进一步解析各种属性的子标签，如set标签、list标签、map标签等，不管怎么样，最终都是将这些标签解析到的信息封装到BeanDefinition中。

但是，现在还有最后一些问题，那就是Spring容器是个什么东西呢？BeanDefinition又是如何注册到Spring容器中的呢？这一节我们一起来看下，主要包含以下几个部分：

1. xml标签解析到的BeanDefinition，是在哪里注册到Spring容器中的
2. 然后来看下BeanDefinition注册到Spring容器前，会做哪些准备性的工作
3. 再看下Spring容器到底是什么东西，并且看下BeanDefinition是如何注册到Spring容器中的
4. 最后来看下BeanDefinition注册到Spring容器后，如何注册别名以及其完成其他的一些收尾工作

---

## BeanDefinition注册的入口

我们回到上一节源码分析的位置：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11-15/202211151428340.png)

可以看到，当解析完各种标签后直接就将BeanDefinition返回了。

我们再往前，退回到调用方法parseBeanDefinitionElement的位置看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11-15/202211151428980.png)

可以看到，前面解析bean标签下的各种属性和标签都是在方法parseBeanDefinitionElement中完成了，然后得到GenericBeanDefinition类型的beanDefinition。

最后，我们可以看到parseBeanDefinitionElement方法其实就是将beanDefinition，连带着解析得到的别名aliasesArray一起封装到了BeanDefinitionHolder中，BeanDefinitionHolder我们可以理解为是持有BeanDefinition的一个对象而已。

接下来，我们再往前回退到上一个方法的位置看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11-15/202211151428599.png)

可以看到，方法parseBeanDefinitionElement返回了我们刚才封装好的BeanDefinitionHolder。

方法decorateBeanDefinitionIfRequired其实是对标签进行进一步的检测，如果发现bean标签中还存在自定义标签，就对自定义标签进行解析，当然自定义标签的解析我们这里不再深究，接下来，我们重点来看下BeanDefinitionReaderUtils中的registerBeanDefinition方法里面的逻辑，也就是BeanDefinition是如何注册到Spring容器中的。

---

## BeanDefinition注册前的检查

我们跟进到方法registerBeanDefinition中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11-15/202211151428418.png)

可以看到在registerBeanDefinition方法中，首先会从BeanDefinitionHolder中取出beanName以及BeanDefinition，然后调用registerBeanDefinition方法进行注册。

我们继续到方法registerBeanDefinition中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11-15/202211151428725.png)

方法中的代码量比较多，我们依次来看下，首先，beanDefinition肯定是AbstractBeanDefinition的实例，所以调用方法validate进行最后一次校验。

我们到validate方法中看下是如何校验的：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11-15/202211151428488.png)

可以看到，在方法validate中不允许methodOverrides属性和factoryMethodName属性同时设置，这是为什么呢？

不知道大家还记得，在上一节在解析lookup-method标签和replaced-method标签时，会将这两个标签需要覆盖的方法名设置到MethodOverrides中，一旦MethodOverrides不为空，这就意味着Spring创建出来bean还要重新覆写这些方法。

而factoryMethodName属性也就是工厂方法的名称，了解过工厂设计模式的同学应该都知道，通过工厂方法也可以创建一个bean出来，但是这相比于Spring默认的创建方式而言，算是一种不允许外界覆盖bean中方法的创建方式了。

也就是说要么你通过工厂方法创建bean，要么就按Spring普通的方式来创建bean，两者选其一，当然这些后面我们在bean的加载环节会详细讲解，暂时只需要知道这两种创建bean的方式是不一样的，我们这里只能存在其中一种。

------

接下来，方法prepareMethodOverrides就是对MethodOverrides的一些准备工作了，我们可以简单进去看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11-15/202211151428745.png)

可以看到，在prepareMethodOverrides方法中如果存在MethodOverrides属性的话，就会通过方法prepareMethodOverride依次预处理这些需要覆盖的方法。

------

预处理的方式也比较简单，就是在方法prepareMethodOverride中判断一下，如果lookup-method标签或replaced-method标签中配置了bean中需要覆盖的方法，就将MethodOverride中的overloaded属性值设置为false。

为什么要这样设置overloaded属性值为false呢？当然是为了提高性能，也就是告诉Spring MethodOverride中记录的那些需要覆盖的方法，在bean中是没有重载方法的，这样的话，Spring就不需要额外根据参数去检查bean中是否存在其他重载方法了，避免了一定的性能损耗。

---

## BeanDefinition注册到Spring容器中

对BeanDefinition最后的一轮检查，说白了就是看下是否有异常的配置，并且设置一些参数提高创建bean时的效率。

接下来，我们继续回到方法registerBeanDefinition中：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11-15/202211151428668.png)

可以看到，beanDefinitionMap根据beanName获取BeanDefinition，我们看下beanDefinitionMap是什么：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11-15/202211151428239.png)

可以看到，beanDefinitionMap就是一个ConcurrentHashMap类型的Map，我们之前或多或少都听说过Spring容器就是一个Map，确实，beanDefinitionMap就是大名鼎鼎Spring容器，Spring容器从本质上来说就是一个Map。

因为beanDefinitionMap是成员变量，难免会有并发安全问题，所以这里使用多线程安全的ConcurrentHashMap作为Spring的容器。

------

我们继续往后看：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11-15/202211151429951.png)

可以看到，在BeanDefinition第一次来注册时，从beanDefinitionMap中肯定是获取不到任何东西的。

而且，BeanDefinition对应的bean也还没来得及创建，可以看到，第一次直接将beanName及对应的beanDefinition设置到beanDefinitionMap中，同时将beanName记录到beanDefinitionNames中。

------

假设刚才注册的bean名称为beanName1，这个时候如果又有一个bean过来注册，并且bean的名称也为beanName1，那会发生什么事情呢？会不会覆盖之前注册的beanName1对应的value值呢？

我们接着来看下代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11-15/202211151429803.png)

可以看到，首先在if分支上有一个方法isAllowBeanDefinitionOverriding在约束着，通过方法的名称我们可以知道，它是用来判断beanDefinitionMap中的元素是否可以被覆盖的。

如果方法isAllowBeanDefinitionOverriding返回结果为true，也就是允许相同名称BeanDefinition覆盖Spring容器的Map，可以看到就会将当前bean的名称beanName1，以及相应的BeanDefinition设置到beanDefinitionMap中了。

------

当然，这一切取决于方法isAllowBeanDefinitionOverriding方法返回的结果是什么，我们进去看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11-15/202211151429834.png)

可以看到方法isAllowBeanDefinitionOverriding的返回结果，取决于成员变量allowBeanDefinitionOverriding，我们再看下allowBeanDefinitionOverriding：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11-15/202211151429287.png)

可以看到，成员变量allowBeanDefinitionOverriding的默认值为true。

也就是说在默认情况下，如果出现相同名称的多个bean来注册，在Spring容器对应的beanDefinitionMap中是允许被覆盖的，所以这也在暗示我们在配置bean的时候，尽量不要出现相同名称的bean，否则会被覆盖。

------

最后一点收尾的代码，我们也来看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11-15/202211151429755.png)

可以看到，如果发现当前不是这个名称beanName第一次来注册，或者当前beanName还没有创建相应的单例时，将会调用方法resetBeanDefinition重置和beanName相关的一系列缓存。

当然，这些都是一些很细节代码了，比如，这里都已经涉及到单例对象等和bean的加载相关的一些特性了，后面我们在分析bean的加载时，会看到各种各样和bean单例创建相关的一系列缓存。

---

## BeanDefinition别名alias的注册

最后，我们再回到上一个方法中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11-15/202211151429101.png)

可以看到，现在就剩最后一个环节了也就是注册bean的别名，也就是从BeanDefinitionHolder中获取之前解析到的别名，然后依次遍历注册它们。

------

我们到方法registerAlias中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11-15/202211151429264.png)

可以看到，如果需要注册的别名alias，和bean的名称name相同，这就没必要注册了，并且会从aliasMap中删除该别名。

其中，aliasMap的key为bean的别名，value为bean在Spring容器中的实际名称，也就是我们之前看到的beanName。

如果alias和name不相同，此时会先从aliasMap中，根据alias获取registeredName，如果registeredName和name相同，这就意味着名称为name的别名已经被其他的bean注册了，就不需要重复注册了。

------

我们继续往下看：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11-15/202211151429544.png)

如果registeredName和name不相同，而且因为根据别名alias从aliasMap成功获取了一个非空的bean的名称registeredName了，这就意味着别名alias已经注册了一个bean名称为registeredName了。

此时，如果方法allowAliasOverriding返回false，也就是不允许别名被覆盖，也就是说一个别名alias只能注册一个bean的名称不能注册多个bean的名称，事与愿违，这个时候直接就会抛异常了。

------

另外，我们可以看到还有一个方法checkForAliasCircle：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11-15/202211151429359.png)

它主要是为了检查是否存在别名循环的问题，比如，别名alias1对应bean的名称为name1，但是，如果同时还存在别名alias1对应bean的名称为name2，而name2又是bean name1的别名。

相当于同时存在：alias1到name1，alias1到name2，name2再到name1这两个关系，出现了两个起点和重点都相同的循环了，这样就造成了别名循环的问题就会抛异常。

------

现在，BeanDefinition注册到Spring容器的核心环节已经结束了，我们来看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11-15/202211151429550.png)

最后，当BeanDefinition注册到Spring容器之后会调用fireComponentRegistered方法，发布一个BeanDefinition已经被注册的事件通知而已，当然，一般我们都不需要监听这方面的事件。

------

## 总结

好了，今天的知识点，我们就讲到这里了，我们来总结一下吧。

一张图来梳理下当前的流程：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11-15/202211151429979.png)

这一节，我们找到BeanDefinition注册的入口，发现了Spring容器其实就是一个Map，将bean注册到Spring容器中的过程很简单，就是以bean的名称为key，以bean对应的BeanDefinition为value注册到beanDefinitionMap这个Map中。

另外，考虑到多线程安全问题，Spring容器对应的Map也就是beanDefinitionMap，其实是多线程安全类型的ConcurrentHashMap。

------

到这里为止，初级的Spring容器也就是XmlBeanFactory的初始化环节已经结束，XmlBeanFactory毕竟是初级的Spring容器，但是ApplicationContext这样的高级容器相比于BeanFactory而言，扩展了哪些更高级别的功能呢？

接下来的章节，我们好好来看下ApplicationContext的初始化是怎样的。