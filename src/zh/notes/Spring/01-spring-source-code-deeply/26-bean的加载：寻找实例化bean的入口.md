---
title: 26-bean的加载：寻找实例化bean的入口
category:
  - Spring源码
star: true
date: 2023-03-31
---

<!-- more -->

## 开篇

上一节，我们了解了Spring另外的一种实例化bean的方式，也就是通过实现FactoryBean接口中的getObject方法，来自定义bean实例化的逻辑，而且，我们也通过一个简单的案例体验了一下。

当然，通过实现FactoryBean接口来自定义bean的实例化的方式，除非是一些特殊的场景有这方面的需求，我们才会通过这样的方式来实例化bean，否则，Spring默认实例化bean的方式基本上就能满足绝大多数场景的需要了。

------

从这一节开始，我们就来看下Spring默认是如何来实例化bean的，这一节主要分为以下几个部分：

1. 先来看下Spring如果发现prototype类型bean正在创建会怎样
2. 然后来看下Spring是如何从父类容器中获取bean的实例的
3. 接着来看下Spring是如何从容器中获取，并封装bean对应的BeanDefinition的
4. 最后来看下Spring对于自己依赖的那些bean是如何判定是否存在循环依赖，并提前实例化它们的

---

## 检查prototype类型的bean是否正在创建

我们先来看下前面分析的代码区域：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/20221201170052.png)

如图所示，前面几节我们主要是围绕doGetBean方法中的这一部分的内容在讲解，也就是说，我们**假定当前已经不是第一次调用getBean方法来获取bean的实例了**。

**在这个前提下**，我们分析了一下Spring是如何基于单例缓存、早期单例缓存以及工厂缓存来获取bean的实例的，并且，我们借着Spring这三级缓存也分析了一下Spring中的循环依赖是怎么回事，并且如何通过这三级缓存来解决循环依赖。

紧接着，当我们从缓存获取到单例bean时，还需要判断下该单例bean是否是FactoryBean的实例，如果是的话，我们还得要判断下当前要获取的实例bean，是否应该是通过FactoryBean来创建的。

如果通过FactoryBean来创建的话，那最终得到的bean实例，就是单纯根据我们自己定义逻辑创建的了，和Spring默认的创建方式就没太大关系了。

------

接下来， 我们切换到第一次调用getBean方法的场景，来看下Spring默认是如何一步步来创建一个单例bean的：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/20221201170058.png)

在第一次调用getBean方法时，缓存中肯定是获取不到bean实例的，所以sharedInstance为空并来到else分支中。

可以看到，首先会调用方法isPrototypeCurrentlyInCreation进行判断，简单观察了下发现这个方法的名称，竟然还有些眼熟，这不就和我们之前分析过的方法isSingletonCurrentlyInCreation类似的吗。

------

我们到方法isPrototypeCurrentlyInCreation中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/20221201170058.png)

可以看到，在方法isPrototypeCurrentlyInCreation中有一个集合prototypesCurrentlyInCreation，主要的逻辑就是判断下集合中是否存在beanName，看到这里我们基本就明白是怎么回事了。

因为前面我们已经知道了方法isSingletonCurrentlyInCreation是用来判断当前在Spring中，是否存在名称为beanName的单例bean正在创建，类似的，方法isPrototypeCurrentlyInCreation则是用来判断当前Spring中，是否存在prototype类型的，且名称为beanName的bean正在创建。

------

Spring创建的bean的类型默认为单例，接下来我们马上就会看到这块逻辑了，对于单例的bean Spring在容器中仅仅只会保留一份bean的实例，而prototype类型的bean，大家可以理解为每次调用getBean方法时都会去创建一个崭新的bean实例出来。

正是因为prototype类型的bean，每次来获取时都会创建一个新的bean实例，所以Spring也就没必要为这种类型的bean进行缓存，所以prototype类型的bean自然也就没有单例bean一样的缓存待遇了。

对于循环依赖问题，单例类型的bean可以通过三级缓存来解决，但是prototype类型的bean因为是没有缓存的，所以**prototype类型的bean是无法解决循环依赖的，哪怕是setter循环依赖**。

------

而且，不知道大家还记得前面在getSingleton方法中看到的逻辑，我们简单来看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/20221201170152.png)

可以看到，对于单例类型的bean而言，就算方法isSingletonCurrentlyInCreation返回true，也就是存在相同名称的单例bean正在创建，我们也可以通过三级缓存singletonFactories获取beanName对应的ObjectFactory，再通过ObjectFactory的getObject方法获取提前暴露的bean对象。

而prototype类型的bean实例，因为是没有缓存存放的，所以，一旦发现名称为beanName的bean正在创建，就会抛出异常来终止本次bean的创建。

---

## 尝试从父类容器获取bean的实例

我们第一次过来获取bean的实例时，默认创建的是单例类型的bean，所以第一个检查可以跳过，我们继续往后看：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/20221201172036.png)

可以看到，接下来这里还做了一个兜底的准备，通过if分支中的判断条件可以知道，如果当前Spring容器中不存在beanName对应的BeanDefinition，并且当前的Spring容器的父类容器是存在的，就会到Spring的父类容器中获取bean的实例了。

我们简单来看下if分支中的这块逻辑，先到方法originalBeanName中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/20221201172047.png)

逻辑很简单，也就是在转换得到bean的实际名称beanName之后，再判断传进来的name是否有前缀“&”，如果有的话，就在bean的实际名称beanName前添加符号“&”。

根据这个细节点，我们马上就可以意识到通过方法originalBeanName修饰过的名称，要不就是从Spring容器中获取一个普通的bean，要不就是获取一个实现了接口FactoryBean的bean实例，而不可能通过FactoryBean的getObject方法来创建对象。

------

我们再回到刚才的位置：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/20221201172042.png)

可以看到，接下来的逻辑就容易理解的多了，就是通过父类容器去获取bean的实例了。

当然，不知道大家注意到没有，之前不管是在初级容器XmlBeanFactory初始化时，还是在高级容器ClassPathXmlApplicationContext初始化时，父类容器对应的参数parent的值，默认都是null，也就是**Spring容器默认没有设置父类工厂**，所以这块逻辑在我们本次分析的流程中是不会执行的。

---

## 获取并封装bean的BeanDefinition

了解完父类容器如何获取bean实例之后，我们继续往后看：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/20221201175959.png)

其中参数typeCheckOnly在方法doGetBean被调用时就会传入，默认值为false，接下来，我们到方法markBeanAsCreated里面看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/20221201180001.png)

可以看到在方法markBeanAsCreated中，首先判断集合alreadyCreated中是否存在beanName，首次过来肯定什么东西都没有的，而且结合alreadyCreated的名称我们可以猜测到，alreadyCreated是用来记录已经创建了的bean的名称。

而且，在方法markBeanAsCreated内部还搞了一个double check，当然这也是为了避免多线程并发的问题，方法中最为关键的，就是在集合alreadyCreated中添加beanName，并且清除了beanName对应BeanDefinition相关的信息，可以看到这里依旧是做一些准备相关的工作。

------

我们继续往后面看：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/20221201180007.png)

接下来，我们看到了一行关键的代码，通过方法getMergedLocalBeanDefinition的名称，我们可以基本知道方法是用来获取beanName对应的BeanDefinition，有点奇怪的是，方法getMergedLocalBeanDefinition返回了类型为RooBeanDefinition的BeanDefinition。

不知道大家还记得不，前面Spring在解析xml标签信息之后，Spring默认是通过GenericBeanDefinition类型的BeanDefinition来封装bean的信息的。

------

那在方法getMergedLocalBeanDefinition中，到底干了些什么事呢？我们进去看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/20221201180012.png)

可以看到，方法getMergedLocalBeanDefinition中也有一个缓存mergedBeanDefinitions，它是用来存放beanName以及相应的BeanDefinition，同样的，初次到访缓存中也是什么都没有，也就是mbd为空。

而在调用getMergedBeanDefinition方法的同时也调用了方法getBeanDefinition，通过传入beanName来获取Spring容器中的BeanDefinition，看到这里，我们总算是等到了BeanDefinition发挥作用的时候了，也就是通过BeanDefinition中记录的bean的一系列信息，创建一个bean实例。

------

那我们来看下在方法getMergedBeanDefinition中，还会干些什么事情吧：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/20221201180016.png)

可以看到，Spring时不时的还真的会给我们一点惊喜，一眼看过去这个方法中的逻辑还真够呛的，其实，以我们目前的知识储备来分析的话，这个方法中的逻辑其实也能看懂，主要就干了以下几件事：

（1）通过创建一个RootBeanDefinition，封装从Spring容器中获取到的BeanDefinition，因为容器中的BeanDefinition是GenericBeanDefinition类型的，是没有记录父子bean标签的关系的，Spring在实例化前需要通过RootBeanDefinition来组织一下。

（2）如果说当前的bean配置了父类bean，那就先封装父类bean的RootBeanDefinition，否则的话，直接封装当前bean对应的BeanDefinition即可。

（3）将RootBeanDefinition中的类型设置为单例的，从这里就可以印证我们之前说的，也就是Spring中bean默认的类型就是单例的。

（4）最后，Spring会将封装好的RootBeanDefinition添加到缓存中。

------

所以，这个方法我们了解到这个程度就差不多了，其实就是初始化和封装好bean的BeanDefinition，准备接下来实例化bean。

---

## 提前实例化依赖的那些bean

现在bean的定义BeanDefinition已经获取到了，接下来会干些什么事情呢？我们继续来看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/20221201181239.png)

可以看到，接下来会调用方法checkMergedBeanDefinition，我们进去看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/20221201181244.png)

可以看到，在方法checkMergedBeanDefinition中，只不过是判断下BeanDefinition对应的bean是否是一个抽象类的BeanDefinition，抽象类当然就不能实例化对象啊就会抛出异常，所以这里依然还是Spring的一些检查操作，给Spring的严谨精神点赞。

大家发现没，随着bean实例化逻辑一点点的分析，慢慢的，我们对BeanDefinition中的各种属性的作用就开始理解了。

------

我们继续往后面看：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/20221201181247.png)

可以看到，首先会通过getDependsOn方法获取属性dependsOn的值。在分析后续逻辑之前，我们先结合xml中的配置，来看下BeanDefinition中的dependsOn是什么：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
	   xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="
			http://www.springframework.org/schema/beans 
      http://www.springframework.org/schema/beans/spring-beans.xsd">
  
	<bean id="student1" class="com.ruyuan.container.cycle.setter.Student1"/>
	<bean id="student2" class="com.ruyuan.container.cycle.setter.Student2" 
       						 																						depends-on="student1"/>
</beans>
```

比如，我们当前要实例化的bean是student2，而student2标签中配置了属性depends-on的值为student1，表示student2的这个bean在实例化时，需要依赖student1这个bean。

所以在实例化student2之前，Spring会先实例化student1这个bean，其中，BeanDefinition中的getDependsOn方法获取的值，就是标签中的属性depends-on的值student1。

------

简单了解完属性dependsOn之后，我们再来继续分析下代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/20221201181258.png)

可以看到，首先会遍历bean依赖的所有bean的名称dep，我们进去看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/20221201181301.png)

可以看到，接下来会在进入到重载方法isDependent中，而且，重载方法中的逻辑也比较简单，首先会从dependentBeanMap中获取beanName对应的集合dependentBeans。

我们可以知道的是，dependentBeans其实就是beanName依赖的那些bean名称的集合，统一都被缓存在了集合dependentBeanMap中，可以看到，接下来会判断下当前bean依赖的dependentBeanName，是否已经存在于beanName依赖的集合dependentBeans中。

------

我们可以举个例子，假如当前的beanName依赖的bean的集合元素为：beanName1、beanName2和beanName3，它们存放于集合dependentBeans中，如果dependentBeanName的名称为beanName1，此时就和集合dependentBeans中的元素重复了，所以就直接返回true了，这是第一种情况。

dependentBeanName除了会被检查是否在beanName依赖的范围之内，还会进一步的进行深度检查：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/20221201181307.png)

可以看到，接下来会遍历beanName依赖的那些bean的名称dependentBeans。

我们还是以刚才的例子来看，beanName依赖bean的名称为beanName1、beanName2和beanName3，假如beanName1依赖的bean集合元素为：beanName11、beanName12和beanName13。

此时，我们假设dependentBeanName的值为beanName11，首先就可以避开beanName直接依赖集合的检查，代码会执行到for循环这里，此时，在第一轮遍历时就会发现dependentBeanName的名称，与beanName1依赖集合中的beanName11重复了，同样也会返回true。

------

分析到这里大家应该也感觉到了，只要传进来受检查的dependentBeanName位于beanName bean的依赖链上，就会返回true，表示beanName的依赖链上已经存在这个依赖了，当前bean配置的依赖就是不合理的，相当于也是一种循环依赖的判断。

了解完这点之后，我们再回到前面的方法中：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/20221201181314.png)

可以看到，isDependent方法返回结果为true时，就会抛异常中断这个操作。

如果bean配置的依赖都通过了检查，接着会调用方法registerDependentBean：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/20221201181317.png)

可以看到在方法registerDependentBean中，会将bean的名称以及和它依赖的那些bean的名称，都注册到相应的的缓存中。

而且，正是因为dependsOn是bean依赖的那些bean，所以在实例化bean之前，Spring会提前调用getBean方法来实例化依赖的这些bean。

------

当我们继续往后看时，终于发现了创建单例bean的入口了：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/20221201181324.png)

可以看到，首先会判断BeanDefinition中的bean类型是否为单例的，前面我们都看到了默认就是单例的，接下来就会通过方法getSingleton来实例化单例bean。

至于具体如何实例化的呢，我们下一节来好好看下，不管怎样，这一节，我们总算是找到实例化bean的入口了。

------

## 总结

好了，今天的知识点我们就讲到这里了，我们来总结一下吧。

通过一张图来梳理下当前的流程：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/20221201181331.png)

这一节，我们了解了Spring是如何检查prototype类型的bean正在创建的，因为prototype类型的bean不像单例bean一样可以缓存，所以，一旦发现有prototype类型的bean正在创建，就会直接抛异常了。

而且我们也看到了，如果为Spring容器设置父类容器，那Spring在找不到当前bean的BeanDefinition时，就会到父类容器中获取bean的实例了。

------

接着，我们看到Spring最终会获取我们前面注册好的BeanDefinition，将GenericBeanDefinition封装为RootBeanDefinition，并且我们也看到了bean默认的类型就是单例的。

而且，如果bean配置了依赖的bean的名称，首先会检查下配置的依赖，是否已经处于bean依赖的引用链上了，如果没有处于bean依赖引用链上，就会提前来实例化bean依赖的那些bean。

------

可以感觉到这一节的内容，整体都比较的零散，很明显这些都是在为bean的实例化做一些准备的工作，下一节，我们来看下Spring是如何来实例化bean的。
