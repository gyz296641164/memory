---
title: 16_Spring高级容器初始化：初步添加扩展功能点
category:
  - Spring源码
star: true
date: 2023-03-31
---

<!-- more -->

## 开篇

上一节，我们了解了ApplicationContext在初始化环节中对环境变量的一些初始化工作，并且，我们已经发现创建了Spring初级容器BeanFactory，并且和之前一样的是，ApplicationContext中的初级容器初始化也是委托给XmlBeanDefinitionReader完成的。

至此，ApplicationContext中的初级容器BeanFactory初始化工作就已经完成了，这一节，我们再来看下在ApplicationContext的初始化过程中，是如何对初级容器BeanFactory做一些功能拓展的，主要包括以下几个部分：

1. 先来看下什么是SPEL语言，并且Spring是如何支持SPEL语言的
2. 然后看下Spring注册的属性编辑器是干什么的，具体有什么用
3. 接着来看下ApplicationContext中又添加哪些感知接口
4. 最后来看下Spring是如何对一些接口指定它们的依赖的

------

## 添加SPEL语言的支持

我们继续回到主流程refresh方法中：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070122162.png)

上一节我们看到了方法obtainFreshBeanFactory，发现是在初始化Spring的初级容器BeanFactory，方便后续为其扩展各种各样的功能。

接下来，我们紧接着再到方法prepareBeanFactory里面看下：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070122320.png)

可以看到，在方法prepareBeanFactory中也是做一些准备的工作，当然，相比于我们之前看到的prepareRefresh方法准备一些环境变量信息而言，这里更多是对容器beanFactory做的一些功能扩展，我们依次来看下。

------

首先，我们可以看到prepareBeanFactory方法为刚刚创建好的beanFactory，设置当前上下文当中的类加载器，然后beanFactory调用方法setBeanExpressionResolver设置了一个StandardBeanExpressionResolver：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070122232.png)

其中，StandardBeanExpressionResolver其实就是表达式解析器，也就是让beanFactory支持表达式语言，这是ApplicationContext为beanFactory做的第一个功能扩展点。

那什么是表达式语言呢？具体又让beanFactory支持哪种表达式语言呢？我们可以到StandardBeanExpressionResolver构造方法中简单来看下：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070122744.png)

可以看到，在StandardBeanExpressionResolver的构造方法中初始化了一个对象SpelExpressionParser，翻译一下就是SPEL的表达式解析器，SPEL全称为Spring Expression Language也就是我们刚说的Spring表达式语言。

------

那表达式语言长什么样子呢？我们在StandardBeanExpressionResolver的类中也可以看到一些端倪：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070122544.png)

可以看到，默认的表达式前缀为“#{”，后缀为“}”，拼接起来不就是“#{}”吗，瞬间想起了以前在xml中经常配置的一个场景：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070122197.png)

可以看到，通过表达式“#{}”配置数据源的属性算是早期使用Spring开发时，比较经典的一个场景了，为了避免数据源配置信息耦合在xml文件中，我们可以单独写一个配置文件db.properties，然后通过表达式“#{}”配置在xml中相应的value属性中。

------

那Spring会在什么时候使用StandardBeanExpressionResolver来解析xml中的“#{}”这样的SPEL表达式呢？很简单，也就是在我们利用注册好的BeanDefinition创建实例bean的时候。

在Spring创建实例bean时，如果发现bean的某个属性值存在表达式“#{}”，就会利用StandardBeanExpressionResolver来解析，后续我们分析到bean的实例化时就可以看到了。

不管怎么样，我们目前毕竟还处于Spring容器的初始化阶段，在这个阶段看到的所有功能拓展，包括之前beanFactory解析xml文件、注册BeanDefinition到Spring容器中，其实都是在初始化Spring容器。

这些初始化工作都是在为后续创建实例bean提供“原料”和扩展功能的支持，所以，大家从现在开始，需要留意一些功能扩展点的代码，方便后续bean加载环节的源码理解。

------

## 添加属性编辑器的注册器ResourceEditorRegistrar

接下来，我们再来下一个方法：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070122985.png)

可以看到，接下来又为容器beanFactory设置了对象ResourceEditorRegistrar，翻译一下大概是编辑资源的注册器，那到底什么是注册器呢？我们可以到ResourceEditorRegistrar中看一下：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070123776.png)

简单浏览了之后，我们可以很容易的知道方法registerCustomEditors是ResourceEditorRegistrar类中最关键的一个方法。

可以看到，方法registerCustomEditors的参数的类型为PropertyEditorRegistry，翻译下就是属性编辑器的注册器，也就是用来注册各种属性编辑器PropertyEditor的。

那为什么需要注册属性编辑器呢？我们继续来看下：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070123078.png)

可以看到在registerCustomEditors方法中多次调用了doRegisterEditor方法来注册一些编辑器Editor，比如InputStream类型的InputStreamEditor、File类型的FileEditor、URL类型的URLEditor等。

我们再到方法doRegisterEditor中看下：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070123620.png)

可以看到，最后会将各种属性类型及对应的属性编辑器都注册到registry中。

那Spring为什么要注册这些属性编辑器呢？我们还得要到这些属性编辑器中寻找答案，看下它们里面到底在干些什么事情，比如，我们可以选择到InputStreamEditor中看下：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070123362.png)

看到这里大家应该就明白了吧，首先会通过InputStreamEditor中的setAsText方法传进来一个String类型的参数text，然后通过各种解析得到了InputStream。

也就是说，InputStreamEditor的功能是将字符串解析并转换为InputStream的一个编辑器，同理，我们可以很容易的推测出FileEditor、URLEditor等其他编辑器Editor是用来将String解析转换为相应的对象的。

那为什么我们需要这些属性编辑器，来将字符串String转换为各种对象呢？其实这和xml配置文件的局限性有关。

比如一个bean中有一个属性is，类型为InputStream也就是一个输入流，如果你想要在bean初始化时就给InputStream类型的属性is设置值，就很难在xml中配置InputStream，毕竟我们都知道在xml中只能配置字符串类型的属性值。

这个时候，InputStreamEditor就可以像我们看到的一样通过字符串去解析资源，从而获取到对应的InputStream，然后再设置到bean相应的属性上，其他各种类型的属性也都有相应属性编辑器。

像我们刚才看到的一样，Spring会在容器初始化环节就会注册各种各样的属性编辑器，当bean在实例化需要设置相应的属性值时，这些属性编辑器就会根据需要将相应字符串String解析并转换为相应对象了，并为bean的这些属性赋值，完成bean的实例化。

------

## 添加ApplicationContextAwareProcessor

了解完Spring中的属性编辑器后，我们继续往后面看：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070123815.png)

可以看到，接下来会初始化一个ApplicationContextAwareProcessor类型的对象，并添加到了beanFactory中。

我们隐约可以感觉到ApplicationContextAwareProcessor和我们之前讲过的感知接口Aware有点关系，那ApplicationContextAwareProcessor具体是干什么的呢？我们进去看下：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070123300.png)

可以看到，ApplicationContextAwareProcessor一进来就发现了一个非常显眼的方法postProcessBeforeInitialization，很明显它是ApplicationContextAwareProcessor类中最关键的方法。

可以看到方法中，如果传进来对象bean不是EnvironmentAware、EmbeddedValueResolverAware、ResourceLoaderAware、ApplicationEventPublisherAware、MessageSourceAware、ApplicationContextAware中的任意一个接口实现类，直接就返回这个bean了。

很显然，方法postProcessBeforeInitialization是专门处理这六个接口对应的实现类的，我们可以先来研究下这个六个接口：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070123911.png)

通过类继承图，我们可以看到这六个接口全都继承Aware接口，也就是说这六个接口都是感知接口。

之前讲过，如果一个bean实现了感知接口，Spring容器在实例化bean时就会调用感知接口的方法，将容器内部的对象注入到感知接口方法中，这样的话实现了感知接口的bean拿到了这些Spring内部对象，就可以对Spring容器做自定义功能改造了。

比如说，我们经常要在很多地方用到Spring的容器，通过容器获取到一些bean，我们就可以让bean预先实现ApplicationContextAware接口。

Spring在实例化bean的时候会通过调用方法setApplicationContext，将ApplicationContext注入到bean中了，bean获取到ApplicationContext之后，容器中的所有bean就都可以获取了。

我们回过头来再看下，那postProcessBeforeInitialization方法中的核心逻辑是什么呢？我们继续看下：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070123672.png)

抛开一些琐碎的代码，我们可以看到方法invokeAwareInterfaces比较关键，进去看下：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070123584.png)

看到这里我们应该就都明白了，其实就是在调用这些感知接口的方法，将容器内部的一些对象设置进去，前面的一些推测也都实锤了。

而且，如果大家留意的话可以发现，ApplicationContextAwareProcessor其实是继承BeanPostProcessor接口的，BeanPostProcessor接口其实是Spring的后处理器接口，它是Spring提供的一个非常出色的扩展点。

我们刚看到的逻辑其实都位于方法postProcessBeforeInitialization中，方法postProcessBeforeInitialization是接口BeanPostProcessor中的前置处理方法，Spring在实例化bean之前会统一执行所有后处理器的前置处理方法，大家暂时可能会听着云里雾里，没关系，接下来几讲我们马上就要来详细讲解这块内容了。

------

## 添加需要忽略的感知接口

我们继续看下方法prepareBeanFactory后面的逻辑：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070123430.png)

熟悉的一幕又出现了，ignoreDependencyInterface方法不知道大家还记得不，我们在最开始讲解XmlBeanFactory初始化的环节就已经详细分析了，大家如果忘了可以去前面复习下。

简单来说，如果一个bean实现了传入ignoreDependencyInterface方法的这些感知接口，Spring是不允许外界注入任何的依赖到bean中的，只允许Spring容器内部调用感知接口的方法来注入相应的依赖。

------

## 添加接口指定的依赖

和忽略感知接口方法ignoreDependencyInterface相对应的，beanFactory会调用方法registerResolvableDependency来指定一批接口一定要注入指定的对象：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070123463.png)

可以看到，beanFactory调用方法registerResolvableDependency，指定了接口以及接口对应的依赖。

如方法registerResolvableDependency指定了接口BeanFactory的实现类为当前的beanFactory，ResourceLoader、ApplicationEventPublisher、ApplicationContext接口的实现类，都为this也就是当前的对象。

为什么要为这些接口指定依赖呢？目的也很简单，如果要从Spring容器中获取一个bean，如果这个bean实现的接口是BeanFactory、ResourceLoader、ApplicationEventPublisher、ApplicationContext中的任意一个，就会直接返回方法registerResolvableDependency中设置进去的对象。

比如，你要从Spring容器中获取一个bean，恰好bean实现了接口ApplicationContext，此时就算你自己写了一个实现ApplicationContext接口的类注入到Spring容器中，Spring最终也会忽略掉你写的那个bean，而使用方法registerResolvableDependency中设置设置进去的beanFactory给你。

这样的话，Spring就可以保证Spring中的一些关键的接口，它们实现类只能是Spring内部指定的一些对象了。

在方法prepareBeanFactory的最后，就是一些其他琐碎的代码了：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070124736.png)

比如注册监听器探查相关的后处理器的ApplicationListenerDetector、注册和AspectJ织入相关的后处理器LoadTimeWeaverAwareProcessor以及注册和上下文环境相关的一些对象，这些我们简单了解下就行了。

------

## 总结

好了，今天的知识点我们就讲到这里了，我们来总结一下吧。

一张图来梳理下当前的流程：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070124312.png)

这一节，我们初步了解了一下ApplicationContext对beanFactory扩展的一些功能点，比较重要的几点包括对SPEL表达式语言的支持、添加解析特定对象属性的属性编辑器、注册调用感知接口方法的后处理器、添加需要忽略的感知接口以及制定接口对应的依赖。

我们刚看到的ApplicationContext对beanFactory提供的一些功能扩展点虽然比较零散，但是在实例化bean的时候还是比较有用的。

接下来，我们即将要分析到Spring的后处理器了，虽然我们前面已经看到Spring为我们预留了很多的功能扩展点，但是远没有后处理器来的直接，接下来我们好好来看下这块内容。