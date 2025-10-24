---
title: 21_Spring高级容器初始化：初始化非延迟加载单例bean
category:
  - Spring源码
star: true
date: 2023-03-31
---

<!-- more -->

## 开篇

上一节，我们了解了在Spring中是如何基于事件驱动开发的，其实就是将监听器注册到事件广播器中，然后当Spring发布事件时，事件广播器会遍历所有注册的监听器，并通过监听该事件的监听器来处理事件。

这一节，我们主要来了解下一下ApplicationContext初始化过程中最后的一些逻辑，主要包括以下几个部分：

1. 看下ApplicationContext是如何注册监听器的
2. 看下ApplicationContext是如何初始化非延迟加载单例的
3. 最后来看下ApplicationContext是如何开启Spring的生命周期的

------

## 注册监听器ApplicationListener

接下来，我们继续回到refresh方法中来：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070137687.png)

可以看到，在前面的方法initApplicationEventMulticaster分析完之后，我们接着再到方法onRefresh中看下：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070137638.png)

可以看到方法onRefresh也是一个空实现方法，和之前很多的空实现方法一样，方法onRefresh也是由关键字protected修饰的，也就是说方法onRefresh也是Spring留给子类的一个扩展方法。

我们继续往后面看：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070138656.png)

可以看到，通过方法registerListeners的名称，我们大概可以知道应该是要注册一些监听器了，那具体是如何注册的呢？可以到方法registerListeners里面看下：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070138025.png)

可以看到，在方法registerListeners中也没有什么特别的东西，比较关键的无非也就是将参数中的监听器以及从Spring容器中获取到的监听器，分别都注册到广播器中。

从这里我们可以知道在上一节的内容中，为什么我们可以从广播器中获取到监听器了。

------

## 初始化非延迟加载的单例

其实分析到这里，ApplicationContext的初始化环节已经差不多快结束了，我们把后面一些收尾的地方来看下，再次回到refresh方法：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070138321.png)

跟进到方法finishBeanFactoryInitialization中看下：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070138719.png)

可以看到，在finishBeanFactoryInitialization方法中，其实就是初始化了一些比较琐碎的东西，我们重点来看下beanFactory调用的方法preInstantiateSingletons：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070138269.png)

可以看到，在方法preInstantiateSingletons中，首先会遍历所有注册到Spring容器中的BeanDefinition，如果BeanDefinition的属性scope的值为singleton也就是单例的，同时属性lazyInit的值为false，说明该BeanDefinition对应的bean是不允许懒加载的单例。

既然bean不允许懒加载，那当然就要立马去加载它了，所以，我们可以看到接下来就会调用getBean方法去实例化bean了，又因为bean的属性scope值为singleton，也就是bean是单例的，所以，Spring会把实例化好的bean放一份到单例缓存中。

这样的话，当Spring下一次要用到bean的实例时，就可以直接从单例缓存中获取bean的实例了，默认情况下配置的bean都是不会在Spring容器初始化时加载的。

但是，如果你希望自己配置的bean不要懒加载，而是在Spring容器初始化时就率先去加载它，那你完全可以为这个bean配置属性lazyInit的值为false，就像这样：

```xml
<bean id="student" class="com.ruyuan.container.Student" lazy-init="false"/>
```

------

## 开启Spring的生命周期

最后，refresh方法中还剩最后一块逻辑，我们来看下：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070138206.png)

我们跟进到finishRefresh方法中看下：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070138058.png)

可以看到finishRefresh方法中其实也就没有太多东西了，主要初始化和生命周期相关的一些组件，我们可以先到initLifecycleProcessor方法，看下做了哪些事情：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070138559.png)

可以看到，在方法initLifecycleProcessor中，首先就是到Spring容器中看下是否存在名称为lifecycleProcessor的bean。

如果存在的话，直接从Spring容器中获取出来，并赋值给成员变量lifecycleProcessor，如果不存在的话默认会创建一个DefaultLifecycleProcessor类型的对象，并赋值给成员变量lifecycleProcessor，最后再注入到Spring容器中，那DefaultLifecycleProcessor又是什么呢？

其实DefaultLifecycleProcessor是Spring中，处理Spring生命周期相关的一个组件，Spring提供生命周期的接口Lifecycle，这块我们可以结合DefaultLifecycleProcessor的类继承图看下：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070138294.png)

可以看到，DefaultLifecycleProcessor最终也是实现接口Lifecycle的，而LifecycleProcessor接口也只不过是Lifecycle接口的一个扩展接口而已，我们可以看下这两个接口中的方法：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070138074.png)

在Spring中如果bean实现了接口Lifecycle，Spring会保证在容器启动时，就会调用这些bean中的start方法开启它们的生命周期，当然，在Spring关闭的时候也会调用stop方法来结束它们的生命周期。

而LifecycleProcessor在Lifecycle的基础上，又添加了两个方法onRefresh和onClose，主要就是对相应的bean做状态更新，关于onRefresh方法的逻辑，我们可以来看下：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070138892.png)

可以看到，接下来会调用LifecycleProcessor中的onRefresh方法，我们到onRefresh方法中看下：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070138499.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070138404.png)

可以看到在onRefresh方法中，像我们刚才分析的一样，就会从Spring容器中获取所有实现了Lifecycle接口的bean，然后调用start方法来开启它们的生命周期，也就是开启Spring的生命周期了。

最后，方法finishRefresh的一些逻辑我们也来看下：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070138623.png)

可以看到，其实就是发布了一个刷新上下文的事件ContextRefreshedEvent。

根据我们前面的源码分析，事件ContextRefreshedEvent将会注册到广播器中，广播器会把该事件广播器相应的监听器去处理，这个事件相当于告诉Spring整个容器已经刷新了，也就说Spring容器ApplicationContext已经初始化完毕了。

------

## 总结

这一节，主要有以下几个重要的点：

通过一张图来梳理下这两节课的内容：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070138993.png)

上一节，我们看到了ApplicationContext初始化了消息源以及事件广播器，而且通过一个案例我们对广播器如何结合监听器以及事件的使用，也有了一定的认识了。

这一节，我们陆续又了解了Spring是如何注册监听器的，同时是如何初始化非延迟加载的单例bean，相当于在Spring容器初始化环节就预先加载这些bean了，这样在使用这些bean的时候，我们可以尽早获取到这些bean的实例。

当所有东西都初始化好之后，Spring容器也就初始化完成了，这个时候Spring会初始化生命周期组件LifecycleProcessor，并且通过onRefresh方法，对那些实现了Lifecycle接口的bean开启生命周期，最后并发布一个事件，通知Spring容器刷新即容器初始化这件事已经完成了。