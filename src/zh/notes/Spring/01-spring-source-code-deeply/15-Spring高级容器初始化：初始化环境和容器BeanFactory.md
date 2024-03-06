---
title: 15_Spring高级容器初始化：初始化环境和容器BeanFactory
category:
  - Spring源码
star: true
date: 2023-03-31
---

<!-- more -->

## 开篇

上一节，我们对容器ApplicationContext的初始化环节开始了分析，经过初步的探查后，我们已经找到了初始化的核心方法refresh。

接下来，我们再来看下在refresh方法中做了哪些事情，这一节主要包括以下几个部分：

1. 首先来看下在ApplicationContext中，会如何初始化当前容器上下文的信息
2. 接下来看下在ApplicationContext中，是如何初始化初级容器BeanFactory的
3. 最后来看下初级容器BeanFactory，在高级容器ApplicationContext中是如何加载xml文件的

------

## 初始化容器上下文环境

我们回到refresh方法：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/202403/5a2b63cc6130eeb7.png)

可以看到在refresh方法中，首先调用prepareRefresh方法，根据方法名称我们可以初步知道是在为容器的初始化做一些准备工作。

------

具体在准备些什么事呢？我们到方法prepareRefresh中看下：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403061613493.png)

可以看到，在prepareRefresh方法中大多都是一些初始化工作，比如设置容器开始初始化的时间startupDate、设置容器状态closed为未关闭状态、以及容器状态active设置为激活状态等，当然这些都是一些细节了。

其中，方法initPropertySources首先引起了我们的注意，我们进去看下：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403061614413.png)

可以看到，在方法initPropertySources里面却是空的，但是，我们惊奇的发现方法initPropertySources是通过protected关键字修饰的。

显然，这又是Spring为我们提供的又一个扩展点，是留给子类去扩展实现的，大家从这些小细节也能看出来，Spring为什么是一个易扩展的框架了吧。

------

既然方法initPropertySources是留给子类去实现的，那具体是实现什么功能呢？我们从方法的注释中可以知道，是为了用实际的值来替换掉占位符。

也就是说可能在xml文件中，也有类似“${...}”这样的占位符存在，可以通过方法initPropertySources为这些占位符中的参数初始化一些属性值，方便后续解析xml文件中的信息。

------

比如，我们可以自己写个子类来实现方法initPropertySources：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403061614541.png)

可以看到，我们写了一个类NewClassPathXmlApplicationContext继承ClassPathXmlApplicationContext，并且重写了方法initPropertySources。

其中，我们可以在系统属性中添加属性username，值为zhangsan，这样的话，如果xml文件中存在占位符“${username}”，Spring就可以拿着这个属性的值去替换占位符了，简单来说方法initPropertySources存在的意义也就是这样。

------

接下来，我们来看下prepareRefresh方法中的下一个方法：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403061615233.png)

根据方法validateRequiredProperties的名称，大概也可以知道该方法是用来校验是否需要某个属性的，当然这样直接翻译未免有些牵强，我们直接到方法里面一探究竟：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403061615209.png)

可以看到，方法validateRequiredProperties将校验的任务委托给了成员变量propertyResolver的方法validateRequiredProperties了。

我们跟进到validateRequiredProperties中的方法validateRequiredProperties中看下：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403061615894.png)

可以看到，此时会遍历集合requiredProperties，我们可以理解requiredProperties存放的是属性，比如环境变量，如果哪个环境变量的值不存在，就会记录到MissingRequiredPropertiesException中。

当for循环结束后会再次检查，如果ex.getMissingRequiredProperties不为空，也就是说存在某个属性缺少对应的值就会抛异常。

------

根据这个特性，我们在日常的开发过程当中，可以用它来判断某个环境变量是否配置，比如，我们可以用它来判定java的环境变量是否配置了：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403061615445.png)

可以看到还是刚才的方法，如果我们在方法initPropertySources中，通过方法setRequiredProperties指定必须设置环境变量名称为“JAVA_HOME”。

------

也就是说，既然我设置了一定需要属性“JAVA_HOME”，那该环境变量的值一定得要存在，否则getEnvironment().validateRequiredProperties()方法就会去判断名称为“JAVA_HOME”的这个环境变量是否存在对应的值。

如果不存在相应的环境变量值，就像我们刚才看到的一样就会抛出一个异常，很显然我们通过这个功能特性，就可以在Spring容器初始化的时候，及时检测出哪些必要的环境变量有没有配置好，及时发现并排除隐患。

------

为了方便我们梳理思路，我们及时通过流程图来记录一下当前分析流程：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403061615456.png)

------

## 初始化容器BeanFactory

好了，prepareRefresh方法暂时分析到这里，我们再回到主流程中的refresh方法上：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403061615486.png)

接下来，我们再到obtainFreshBeanFactory方法中看下：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403061615590.png)

可以看到，在obtainFreshBeanFactory方法中有两个方法，分别是refreshBeanFactory和getBeanFactory。

------

refreshBeanFactory方法好像比较复杂，可以选择先到getBeanFactory方法中看一眼：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403061615950.png)

可以看到方法getBeanFactory中，其实就是直接获取beanFactory了，为什么能直接获取到beanFactory呢，我们推测肯定是在getBeanFactory方法前面的refreshBeanFactory方法中就把beanFactory这个Spring初级容器给初始化完成了。

这样来说的话在不远处，我们应该就可以看到beanFactory初始化相关的代码了，事不宜迟，我们赶紧回到前面的方法refreshBeanFactory中看下：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403061615865.png)

可以看到，首先在if语句中调用方法hasBeanFactory，应该是判断beanFactory是否存在，我们可以进去瞧一下：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403061615764.png)

可以看到，果然就是在对成员变量beanFactory进行非空的一个判定，很显然第一次我们来是没有创建beanFactory的，所以返回false。

------

if语句既然不成立，我们直接后面的try语句中看下：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403061616924.png)

可以看到，方法createBeanFactory创建了一个DefaultListableBeanFactory对象，我们到createBeanFactory方法中看下：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403061616031.png)

可以看到，在createBeanFactory中就是简单创建了一个DefaultListableBeanFactory类型的对象。

------

DefaultListableBeanFactory这个类对于我们而言可能会有点陌生，其实，它就是我们之前分析的Spring初级容器XmlBeanFactory的直接继承的父类，我们来看一张类继承图：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403061616523.png)

光是Spring初级容器XmlBeanFactory，就有那么多错综复杂类继承体系，可以看到XmlBeanFactory直接继承的类就是DefaultListableBeanFactory，所以，我们也可以将DefaultListableBeanFactory理解为就是一个Spring的初级容器了。

所以，看到这里我们就发现了，ApplicationContext中果然是包含了Spring初级容器的，但是ApplicationContext接下来会在这个初级容器上扩展什么样的功能呢？我们继续往后面看下。

------

我们继续往后面看下：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403061616560.png)

接下来，我们可以看到调用了方法customizeBeanFactory，看样子是来定制化刚刚创建好的容器beanFactory了，我们进去看下：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403061616373.png)

可以看到，在方法customizeBeanFactory中，其实就是为我们刚创建好的容器beanFactory设置两个属性，分别是allowBeanDefinitionOverriding和allowCircularReferences。

------

而且，我们仔细看的话还发现了一些熟悉的东西，比如参数allowBeanDefinitionOverriding，这不是就是我们之前在Spring容器中注册BeanDefinition时，用来判断相同名称的BeanDefinition是否允许在容器beanDefinitionMap中被覆盖的吗。

而另外的一个参数allowCircularReferences，则是后面我们研究到bean的加载环节时，用来判定是否允许多个bean之间存在循环依赖引用的，这块内容我们后面再来分析，大家可以先留个印象。

------

## 加载XML中的BeanDefinition

接下来，我们再来看下refreshBeanFactory方法中的最后一个方法：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403061616130.png)

光是看着方法loadBeanDefinitions的名称，大家是不是就觉的异常熟悉了，和我们之前分析过的Spring初级容器初始化的某些地方越来越类似了。

我们到loadBeanDefinitions方法中看下：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403061616293.png)

果然，我们又找到了ApplicationContext复用Spring初级容器BeanFactory的证据了，在方法loadBeanDefinitions中居然和XmlBeanFactory的底层逻辑一样，也是通过XmlBeanDefinitionReader来解析xml文件的，后面的剧情相信大家都能猜到了吧。

------

我们可以看到，接下来会为beanDefinitionReader设置一些环境对象、类加载器，当然我们还看到了它设置了EntityResolver为ResourceEntityResolver。

不知道大家还记得前面，我们看到了在ResourceEntityResolver的构造方法中，为DTD和XSD这两种xml校验类型，分别指定了不同类型的解析器去jar包中获取对应的校验文件，大家如果忘记了可以先去前面温习一下。

------

接下来，我们再到方法initBeanDefinitionReader中看下：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403061616089.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403061616368.png)

可以看到，在方法initBeanDefinitionReader中其实也没有什么东西。

但是我们发现了它也是被protected关键字修饰的，这就意味着方法initBeanDefinitionReader也是Spring为我们提供的一个扩展点，方便子类去实现用于自定义XmlBeanDefinitionReader的。

------

我们看到loadBeanDefinitions的最后一个方法：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403061616021.png)

可以看到，最后将beanDefinitionReader作为参数传入了方法loadBeanDefinitions中了，我们进去看下：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403061617758.png)

可以看到，在loadBeanDefinitions方法中先通过方法getConfigResources获取资源，可以看到方法getConfigResources默认返回null。

接下来，我们终于可以看到前面封装好的xml对应的String数组获取出来了，并且reader调用loadBeanDefinitions方法继续处理了，可以预感到接下来就要到我们熟悉的解析xml的位置了。

------

我们继续跟进到方法loadBeanDefinitions中看下：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403061617717.png)

可以看到，此时依次遍历处理String数组中的每个location也就是xml路径名称，一路跟下去看看：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403061617802.png)

可以看到，最后跟到重载方法loadBeanDefinitions(String, Set<Resource>)时，发现就会根据xml文件路径加载xml对应的Resource资源了。

------

没有任何悬念的，紧接着又调用另外一个重载方法，我们再来看下：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403061617376.png)

终于，我们总算是跟到头了，果然这里就回到了我们之前XmlBeanFactory解析的主流程上来了。

------

到这里，我们前面的那个猜想也就成立了，也就是说ApplicationContext最终也会去加载applicationContext.xml这个xml文件。

我们可以回忆一下，接下来肯定是根据Resource去加载对应的Document对象，然后解析Document对象，再解析xml中的各种各样的属性和标签，然后将解析到的属性和方法的信息封装在BeanDefinition中，最后再注册到Spring容器beanDefinitionMap中。

------

好了，现在我们再回到之前refreshBeanFactory方法中看下：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403061617642.png)

可以看到，最终会把beanFactory赋值给成员变量beanFactory了，果然，最开始外层的getBeanFactory方法才能获取到它，又一个猜想印证了。

------

而且，我们可以看到下一次再调用refreshBeanFactory方法时，方法hasBeanFactory肯定就会检测到beanFactory已经存在了，此时if分支中的hasBeanFactory方法返回的结果就为true。

此时就会先调用destoryBeans方法，将Spring容器中所有已经创建好的bean全都销毁掉，并且调用closeBeanFactory方法关闭掉当前的Spring容器beanFactory。

最后和我们刚分析的一样，重新从try分支开始创建和初始化新的一个Spring容器beanFactory，这个过程我们可以理解为像是refresh刷新了Spring容器一样。

------

## 总结

好了，今天的知识点我们就讲到这里了，我们来总结一下吧。

一张图来梳理下当前的流程：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403061617092.png)

这一节，我们了解了一下如何初始化ApplicationContext的环境，当然都是一些环境变量的设置，方便后面用于解析xml中相应的占位符。

最为关键的是，我们看到了在ApplicationContext的初始化当中，会拿着之前设置好的xml文件名称到classpath路径下加载相应的资源Resource，然后和我们之前看到的XmlBeanFactory初始化一样，委托XmlBeanDefinitionReader去解析并注册相应的beanDefinition。

分析到这里，一个初级的Spring容器BeanFactory已经得到了，而且xml文件的解析也都在这个初级Spring容器中完成了，接下来ApplicationContext会为这个初级容器beanFactory扩展哪些高阶的功能呢？下一节，我们继续来看下。

