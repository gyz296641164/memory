---
title: 20_Spring高级容器初始化：Spring是如何基于事件驱动的呢
category:
  - Spring源码
star: true
date: 2023-03-31
---

<!-- more -->

## 开篇

上一节，我们了解了Spring如果想要控制一个bean的实例化过程，比如我们想要按照自己的意愿来控制bean的实例化，可以通过自定义BeanPostProcessor来实现。

当自定义的BeanPostProcessor注册到Spring容器后，bean在实例化开始前和结束后分别都会调用BeanPostProcessor接口中的方法，从而实现介入bean的实例化的过程，让我们有机会控制bean的实例化过程。

而且，我们也看到了在Spring高级容器ApplicationContext初始化时，暂时也只是将各种BeanPostProcessor注册到Spring容器中，BeanPostProcessor接口中的方法调用时机，我们还得在后面的章节bean实例化时才能看到。

接下来，我们沿着上节课的分析，继续来看下后面会再为Spring容器beanFactory扩展一些什么样的功能，这一节主要包括以下内容：

1. 看下Application是如何初始化消息源的
2. 接下来再看下Spring中是如何初始化事件广播器的
3. 然后来看下如何利用Spring中的广播器来发布自定义的事件
4. 最后再来看下Spring中的广播器是如何通过监听器来处理事件的

------

## 初始化消息源MessageSource

我们继续看到refresh方法后面的一些逻辑：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070132839.png)

我们到initMessageSource方法中看下：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070132721.png)

可以看到，方法initMessageSource中的逻辑还是比较简单的，首先通过getBeanFactory方法获取Spring容器beanFactory，然后通过containsLocalBean方法判断Spring容器中是否存在名称为MESSAGE_SOURCE_BEAN_NAME的bean。

那MESSAGE_SOURCE_BEAN_NAME是什么呢，我们可以简单找一下：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070132313.png)

可以看到，MESSAGE_SOURCE_BEAN_NAME其实就是AbstractApplicationContext中的常量，值为“messageSource”。

这就意味着，如果我们要在xml中配置MessageSource，id属性的值也得要配置为“messageSource”，这样的话容器beanFactory才能从容器中获取到。

但是，如果我们没有在xml中配置MessageSource时，接下来就会来到else分支中：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070132714.png)

可以看到在else分支中，其实就是初始化了一个DelegatingMessageSource类型的对象，然后将该对象注册到了Spring中，并且该对象的名称就为messageSource。

其实，Spring中的MessageSource就是处理国际化的，那什么是国际化呢？比如一段文字，在不同的国家肯定是需要使用不同的语言来显示的，就算你是在同一个国家如中国，不同地区的文字也是有差异的如大陆和台湾，对于我们系统而言，就需要根据当前系统选择的国家地区，用相应的文字来显示了。

但是，在日常开发过程当中对于国际化的处理，使用Spring中的MessageSource来支持国际化的场景已经是很少了，所以这里暂时不再过多的探讨，大家了解下即可。

------

## 初始化广播器ApplicationEventMulticaster

接下来，我们看到refresh方法中的下一个方法initApplicationEventMulticaster：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070132306.png)

我们到方法initApplicationEventMulticaster里面看下：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070133652.png)

可以看到逻辑都是类似的，这里主要是看下容器beanFactory中是否存在名称为APPLICATION_EVENT_MULTICASTER_BEAN_NAME也就是名称为applicationEventMulticaster的bean。

如果存在的话，直接从容器中获取出来并赋值给成员变量applicationEventMulticaster，否则直接创建一个SimpleApplicationEventMulticaster类型的对象并设置到Spring容器beanFactory中。

那什么是SimpleApplicationEventMulticaster呢？刚才我们从beanFactory中获取对象时，主要是根据接口类型为ApplicationEventMulticaster去获取的，而ApplicationEventMulticaster在Spring中被称为是事件的广播器。

在Spring中和事件广播器ApplicationEventMulticaster息息相关的另外一个组件，就是监听器ApplicationListener。

在Spring中，广播器ApplicationEventMulticaster中可以注册多个监听器ApplicationListener，当特定的事件ApplicationEvent发生时，就会触发广播器ApplicationEventMulticaster来遍历各个监听器ApplicationListener中的方法，看下到底是哪个监听器负责监听的事件发生了，让指定的监听器来处理。

接下来，我们通过一个案例来看下在Spring中，是如何通过广播器和监听器来完成功能的。

------

## 如何基于Spring内部广播器发布事件

首先，我们需要自定义一个事件类，在Spring中可以通过继承抽象类ApplicationEvent创建：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070133851.png)

然后，我们在事件类MyEvent中自定义一个方法event，方便触发该事件时，监听器可以回调该方法执行相关的逻辑，当然方法的名称大家可以自行定义，只要记得在处理事件时调用自定义的方法即可。

接着，我们再创建一个监听事件MyEvent的监听器MyListener，监听器需要实现Spring提供的接口ApplicationListener：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070133967.png)

然后，在onApplicationEvent方法中，我们可以决定监听器要对那些事件进行监听，可以看到在MyListener监听器中的onApplicationEvent方法中，我们规定只会处理MyEvent事件。

接着，我们需要将监听器配置到xml文件中，这样Spring在扫描xml文件时，MyListener最终会被注册到Spring容器中：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070133250.png)

然后，我们来看下效果：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070133008.png)

可以看到，当ClassPathXmlApplicationContext初始化之后，可以通过调用ClassPathXmlApplicationContext的publishEvent方法，触发我们定义好的MyEvent事件，我们运行一下看下：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070133773.png)

可以看到，自定义的事件MyEvent的中的event方法成功被调用了。

看到这里，虽然我们已经通过一个案例简单体验了一下在Spring中，是如何自定义监听器和事件的，但是我们目前对于广播器ApplicationEventMulticaster在这一过程中的作用，还是处于模棱两可的状态。

要了解广播器的功能呢，我们得要沿着案例中的publishEvent方法，看下自定义事件MyEvent是如何发布且最终被处理的。

------

## Spring中事件是如何发布的呢？

我们以ClassPathXmlApplicationContext中的publishEvent方法作为入口，来看下事件MyEvent是如何发布的：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070133742.png)

我们跟进到重载方法publishEvent中：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070133803.png)

可以看到，首先我们传进来的event类型，根据刚才的案例可以知道肯定就是ApplicationEvent的实例，毕竟MyEvent就是继承ApplicationEvent接口的，所以接下来会将Object类型的event对象，转换为ApplicationEvent类型的applicationEvent。

接着，我们发现会调用getApplicationEventMulticaster().multicastEvent(applicationEvent, eventType)，其中，getApplicationEventMulticaster方法获取的不就是我们前面看到的广播器吗？而广播器的类型我们前面也看到了，默认是为SimpleApplicationEventMulticaster。

所以，我们可以推测代码下一步，就要进入到SimpleApplicationEventMulticaster中的multicastEvent方法了，现在，我们直接到SimpleApplicationEventMulticaster中的方法multicastEvent里面，看下广播器是如何处理事件的：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070133446.png)

在方法multicastEvent中默认是没有设置线程池的，所以executor为空。

接着，我们看到会通过getApplicationListeners方法获取Spring容器中的所有监听器，然后依次遍历处理这些监听器，从这里我们初步可以知道，广播器的作用其实就是当一个事件发生时，通知Spring容器中的所有注册的监听器，然后让每个监听器决定是否要处理这个事件。

我们接着到invokeListener方法中看下：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070133911.png)

看到这里，大家应该就明白了，最终就会调用监听器中的onApplicationEvent方法执行监听器中的逻辑。

因为目前只有我们自定义的监听器才会处理事件MyEvent，所以其他的监听器就算执行了onApplicationEvent方法，也会选择无视这个事件。

也就是说广播器接收到一个事件之后，会将事件通知到所有Spring容器中的所有监听器，并且调用监听器中的onApplicationEvent方法来处理相应的事件。

Spring这套基于事件驱动的机制，相信大家现在应该也比较清楚了，主要就是通过广播器ApplicationEventMulticaster和监听器ApplicationListener来实现的，大家也可以理解为是发布-订阅模式，ApplicationEventMulticaster用来广播发布事件，ApplicationListener监听订阅事件，每种监听器负责处理一种或多种事件。

而且，如果大家冷静分析一下会发现，其实Spring这套发布订阅的模式，采用的就是设计模式中的观察者模式，ApplicationEventMulticaster作为广播事件的subject，属于被观察者，ApplicationListener作为Observer观察者，最终是用来处理相应的事件的，属于观察者Observer。

---

## 总结

好了，今天的知识点我们就讲到这里了，我们来总结一下吧。

第一，我们了解了Spring初始化时消息源MessageSource是如何初始化的。

第二，接下来我们又看了下Spring中的广播器ApplicationEventMulticaster的初始化过程，默认就是创建了一个SimpleApplicationEventMulticaster类型的对象。

第三，我们自定义了事件和监听器，体验了一下如何基于Spring内部的广播器发布一个自定义的事件，并且通过自定义的监听器来监听并处理这个事件。

第四，我们分析了一下Spring源码之后了解到Spring在发布事件时，会通过Spring内部的广播器来遍历所有注册的监听器，并执行这些监听器中的方法，在监听器中处理这些事件。