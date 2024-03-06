---
title: 17_Spring高级容器初始化：BeanFactoryPostProcessor是什么呢
category:
  - Spring源码
star: true
date: 2023-03-31
---

<!-- more -->

## 开篇

上一节，我们看到了ApplicationContext对BeanFactory扩展的一些功能点，包括对SPEL语言的支持、添加属性编辑器的注册器、添加新的一批感知接口并忽略这些感知接口以及添加接口指定的依赖。

这一节，我们接着上一节的分析继续来看下ApplicationContext对初级容器BeanFactory的一些其他功能扩展点，主要为一下几个部分：

1. 看下空实现的工厂后处理方法，到底有哪些特别的含义和作用
2. 接着来自定义实现下工厂后处理器方法，演示一把看下效果
3. 接着再来看下BeanFactoryPostProcessor又是什么东西
4. 并且我们也自定义实现下BeanFactoryPostProcessor，看下具体是怎么玩的

------

## 空实现的工厂后处理方法

我们接着分析之前的refresh方法，如下图：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070126685.png)

上一节，我们已经看到了方法prepareBeanFactory，接下来，我们从方法postProcessBeanFactory开始入手，到方法里面看下：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070126951.png)

可以看到方法postProcessBeanFactory是一个空实现，而且和我们之前看到的很多空实现方法一样，方法postProcessBeanFactory也是由protected关键字修饰的，毫无疑问，该方法也是Spring提供给我们的一个扩展点。

那方法postProcessBeanFactory留给子类具体是要去实现什么样的功能呢？通过方法的注释我们可以知道，方法postProcessBeanFactory是Spring暴露给子类去修改容器beanFactory的。

那允许子类在什么时候修改beanFactory呢？可以看到在注释中描述了修改的时机，也就是在所有的bean的BeanDefinition都注册到BeanFactory中，但还没有进行实例化的时候进行修改，什么意思呢？

我们前面花费了大量的篇幅，其实就是在讲解Spring如何从xml中解析bean标签，然后将解析到的BeanDefinition注入到Spring容器中，这个过程顶多算是bean属性信息的一个初始化。

而bean的实例化说白了就是创建一个bean对象，触发实例化最常见的一个场景就是我们直接调用Spring容器的getBean方法，这个时候，Spring就会获取容器中的BeanDefinition，利用BeanDefinition中的各种属性和值去创建一个bean出来，这个过程就是bean的实例化。

所以，相当于方法postProcessBeanFactory给了我们一个机会，在实例化bean之前修改bean的一些属性信息，因为我们根据方法postProcessBeanFactory的参数beanFactory，就可以获取到所有注册的bean的信息了。

------

## 自定义空实现工厂后处理方法

接下来，我们可以来演示下在bean初始化之前，如何通过覆盖方法postProcessBeanFactory来修改bean的信息：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070126570.png)

可以看到，我们可以自己写一个类MyClassPathXmlApplicationContext继承了ClassPathXmlApplicationContext，然后重写方法postProcessBeanFactory。

通过方法postProcessBeanFactory中的参数beanFactory，我们可以获取到名称为student的BeanDefinition，然后，我们可以在这里对BeanDefinition进行定制化的修改。

相当于bean在实例化之前，我们就偷偷的修改BeanDefinition的信息了，比如，我们这里修改bean的类型为非单例的BeanDefinition.SCOPE_PROTOTYPE。

------

然后，写一个类来测试下：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070126714.png)

可以看到，代码中的其它的一切和之前一样，只是将ClassPathXmlApplicationContext修改成了MyClassPathXmlApplicationContext，然后我们运行下方法，看下效果：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070126155.png)

可以看到，果然在调用到refresh方法中的postProcessBeanFactory方法时，回调了子类MyClassPathXmlApplicationContext中覆盖的postProcessBeanFactory方法。

------

当然，我们可以打开我们的脑洞想下，既然在方法postProcessBeanFactory中都能获取到beanFactory了，我们能做的事情当然也不仅仅只是局限于修改BeanDefinition的信息，而是整个容器beanFactory级别的信息都可以修改了，这也是诸多第三方框架基于Spring开发时一个非常重要的扩展手段。

------

## BeanFactoryPostProcessor是什么呢？

接下来，我们继续往后看：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070126403.png)

可以看到，接下来开始调用方法invokeBeanFactoryPostProcessors，我们到方法里面看下：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070126586.png)

通过方法的注释，我们可以知道是要实例化并且调用所有的BeanFactoryPostProcessor，那什么是BeanFactoryPostProcessor呢？

------

我们到BeanFactoryPostProcessor中看下：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070126732.png)

可以看到，BeanFactoryPostProcessor中的方法和我们刚才看到的空实现方法postProcessBeanFactory几乎是一模一样的，目的也是一样的，也就是给了我们一次机会，允许我们通过参数beanFactory去获取相应的BeanDefinition并修改相应的信息。

------

## 自定义BeanFactoryPostProcessor

但是从使用方式上，和刚才空实现的postProcessBeanFactory方法稍微有些不同的，就是需要额外实现BeanFactoryPostProcessor接口。

同样的，我们通过一个小案例来演示下如何使用：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070127238.png)

可以看到，首先我们自定义一个类MyBeanFactoryPostProcessor并且实现接口BeanFactoryPostProcessor，和刚才一样，可以在方法postProcessBeanFactory中，通过参数beanFactory在容器级别修改一些信息，比如我们这里修改名称为“student”的BeanDefinition信息。

然后，我们需要将MyBeanFactoryPostProcessor配置在applicationContext.xml中：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070127750.png)

可以看到，和我们之前的student对象一样，同样通过bean标签配置好了MyBeanFactoryPostProcessor类。

将MyBeanFactoryPostProcessor配置在xml之后，MyBeanFactoryPostProcessor会像普通的bean一样注册到Spring容器中，后面才可以从Spring容器中获取并调用它里面的方法。

------

最后，我们写一个类来测试一下，看下方法postProcessBeanFactory是否会执行，如下所示：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070127622.png)

可以看到，代码和我们的最初的代码没有任何区别，我们运行下看下：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403070127619.png)

可以看到，果然Spring就运行了postProcessBeanFactory方法，打印出了我们想要的信息。

------

看到这里，大家可能心里会有一个疑惑，既然我们在refresh方法中就可以通过继承空实现方法postProcessBeanFactory来修改beanFactory容器级别的信息，Spring为什么还要给我们提供接口BeanFactoryPostProcessor呢？

个人觉得，如果我们要修改beanFactory中的很多种信息，而且每种修改操作的逻辑都非常的复杂，这些逻辑势必会耦合在一个方法中，这样也不太好。

现在有了BeanFactoryPostProcessor接口之后，我们可以为每种修改操作分别创建一个类来实现接口BeanFactoryPostProcessor，这样的话至少在代码逻辑上是解耦的。

------

## 总结

好了，今天的知识点我们就讲到这里了，我们来总结一下吧。

这一节，我们主要了解了一下refresh方法中，空实现方法postProcessBeanFactory的作用，同时，我们也初步了解了一下工厂后处理BeanFactoryPostProcessor是什么。

很简单，其实就是在所有bean实例化之前，为我们提供了一个可以修改容器中BeanDefinition的机会，下一节，我们具体来看下Spring是如何执行BeanFactoryPostProcessor中的方法的。