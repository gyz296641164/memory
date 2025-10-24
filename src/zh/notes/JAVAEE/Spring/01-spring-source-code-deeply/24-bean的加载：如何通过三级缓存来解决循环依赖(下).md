---
title: 24_bean的加载：如何通过三级缓存来解决循环依赖(下)
category:
  - Spring源码
star: true
date: 2023-03-31
---

<!-- more -->


## 开篇

上一节，我们主要了解了Spring中单例bean的实例化时机，并且初步了解了下Spring中常见的两种循环依赖，也就是**setter注入循环依赖**以及**构造方法循环依赖**。

这一节，我们重点来看下Spring是如何来解决循环依赖的，主要分为以下几个部分：

1. 首先来看下Spring中的三级缓存分别完成了什么样的功能
2. 然后来看下Spring具体是如何通过三级缓存来解决循环依赖的
3. 最后来看下Spring中的这三级缓存存在的意义分别是什么

---

## Spring中的三级缓存机制

现在，我们已经了解了Spring中常见的两种循环依赖，接下来，我们再回到getSingleton方法：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11/20221125192904.png)

前面我们分析到了早期单例缓存earlySingletonObjects，并且我们已经知道了earlySingletonObjects其实就是用来存放初步创建好的单例bean，bean中的很多属性都还没来得及设置。

可以看到，如果我们从缓存earlySingletonObjects中获取到的singletonObject为空，并且allowEarlyReference为true，也就是允许使用使用早期单例bean，当然，参数allowEarlyReference默认值，我们前面已经看到为true，所以条件成立，关于参数allowEarlyReference具体是什么意思，我们后面再来分析。

------

现在，我们再来看下getSingleton方法剩下的一些逻辑：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11/20221125192907.png)

可以看到，当早期单例缓存earlySingletonObjects中也还找不到单例bean时，接下来就会寻找第三个缓存也就是singletonFactories，singletonFactories是用来创建早期单例bean的工厂缓存，可以看到我们从singletonFactories中先获取到了bean的对象工厂singleFactory。

对象工厂singletonFactory，我们可以理解为是封装了早期单例bean实例化的方法，通过调用singletonFactory的getObject方法，我们可以获取到早期单例bean，也就是初始化到一半的bean。

------

可以看到，接下来Spring会将创建好的早期单例bean，再放到早期单例缓存earlySingletonObjects中，因为早期单例bean现在已经获取到了，这个时候对象工厂ObjectFactory也就没有存在的意义了，就会从工厂缓存singletonFactories中移除掉，最后将得到单例singletonObject直接返回了。

简单看来，就是一层层地从这三级缓存中获取单例的bean，而Spring正是通过这三级缓存来解决循环依赖的，接下来，我们再来详细看下Spring是如何结合这三级缓存来解决循环依赖的。

---

## Spring是如何解决循环依赖的呢？

在Spring容器中，普通bean的实例化过程至少分为三个步骤，分别是

- **通过反射创建一个实例bean**
- **然后为该实例bean填充属性**
- **最后再为这个bean进行一些初始化操作**

为了方便我们理解接下来的内容，我们先对bean实例化过程有个初步的印象，后续的源码环节中我们还会来具体的分析。

我们来看下Spring是如何解决setter循环依赖的，并且会以前面案例中的Student1和Student2实例化过程为重点分析对象，接下来，我们通过一张流程图，来看下Spring是如何通过这三级缓存来解决循环依赖的：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11/20221125192910.png)

可以看到Student1在实例化时，像我们刚才描述的，首先会通过反射创建一个早期单例的bean，这个bean目前既没有设置属性值，也没有进行任何的初始化操作，也就是是一个早期的单例bean。

紧接着，Student2可能此时也会进行实例化，因为Student1在实例化时，需要依赖Student2的实例为属性赋值，所以Student1的实例化是依赖Student2的实例的。

------

如果按照案例中的方式，Student1的实例在为自己的属性赋值时，就会触发Student2的实例化，而Student2在实例化到填充属性的阶段时，发现自己同样也需要依赖Student1的实例，此时就会陷入循环依赖的无限循环中了。

那有没有一种可能，既能让Student1在实例时获取到Student2的实例，同时Student2又还没有开始为它的属性赋值，只要Student2还没有开始为属性赋值，就不会出现循环依赖的问题了，Student1不就就可以先拿着Student2的早期实例bean，先完成实例化。

当Student2的实例回过神来为自己的属性赋值时，发现自己需要Student1的实例，这个时候Student1的实例已经实例化完了，这样的话Student2的实例，就可以顺利拿到Student1的实例来完成属性值的设置，循环依赖的问题不就解决问题了吗，如果大家觉得这段话有点绕也没关系，我们继续看下后面的流程分析。

------

Spring处理循环依赖的思路大致和上面差不多，我们再回到刚才的流程图来具体分析下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11/20221125192914.png)

首先Student2会把刚刚通过反射初步实例化好的早期单例bean，如图先封装到对象工厂ObjectFactory中，并添加到单例工厂缓存singletonFactories里，这样的话，就相当于Spring把Student2初步实例化的单例bean暴露给外界了。

Student1此时如果要为属性赋值的话，就可以从工厂缓存中获取到Student2的早期单例bean，完成属性赋值，进而完成Student1 bean的实例化，而Student2的bean继续实例化时，发现自己为属性赋值时也需要依赖Student1的bean，这个时候可能Student1的bean已经实例化好了，所以Student2的实例化也可以完成了。

但是，我们可以知道如果要Spring按照我们分析过程来实例化，那Student1和Student2的实例化至少得要并行的实例化，而不是像案例中一样串行实例化了。

------

接下来还有一个问题，Student1是如何从单例工厂缓存singletonFactories中，获取Student2的早期实例的呢？如图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11/20221125192916.png)

Student1的实例在实例化时，当Student1的实例要为属性赋值时，就会通过工厂缓存singletonFactories，获取到Student2的早期单例的对象工厂ObjectFactory，然后通过ObjectFactory的getObject方法获取到Student2的早期单例bean。

因为ObjectFactory存在的意义，就是在我们需要用到早期单例缓存bean时，才会去获取早期单例bean，此时Student2的对象工厂ObjectFactory，就可以从工厂缓存singletonFactories中移除掉了。

------

而当Student1的实例正常实例化完成之后，Student2的实例也会继续实例化，最后把完全实例化好的完整单例bean放到单例缓存singletonObjects中，此时，完整的单例bean就已经得到了，那就没早期单例bean什么事了，最后会把早期单例bean从早期单例缓存earlySingletonObjects中给删除掉。

------

需要注意的是，以上只是Spring解决setter注入循环依赖的方式，而构造方法循环依赖的问题Spring是没有办法解决的，原因也很简单的。

因为Spring费了很大的劲，才设计了这套三级缓存，通过提前暴露bean的早期单例bean，来解决setter注入循环依赖；但是构造方法循环依赖问题，是在反射创建bean时就会发生的，此时Spring是没有办法提前获取到早期单例bean的，因为早期单例bean得要经过反射创建才能获取到，所以，对于构造方法循环依赖，Spring自然是爱莫能助了。

------

而前面的参数allowEarlyReference的含义，想必大家现在应该也清楚了，我们来看下代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11/20221125192918.png)

可以看到，如果参数allowEarlyReference的值为false，也就是不允许早期引用早期单例bean，而这是Spring为了解决setter循环依赖最后的倔强了，所以如果参数为false的话，就无法通过工厂缓存singletonFactories获取到早期单例bean，setter循环依赖就无法解决了。

但是，好在我们前面也看到，getSingleton方法默认传进来参数allowEarlyReference值为true，所以，Spring默认是解决了setter注入的循环依赖的。

---

## Spring中三级缓存存在的意义

到此为止，Spring解决循环依赖的过程已经结束了，可能有些同学对这这三个缓存的作用还是有点模糊，其实这和后面的源码还没有来得及分析有关，后面我们会逐步来看的。

但是关于这三个缓存的作用，我们可以进一步来分析下，我们再回到刚才的代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11/20221125192920.png)

可以看到，这三级缓存分别是单例缓存singletonObjects、早期单例缓存earlySingletonObjects以及单例工厂缓存singletonFactories，毫无疑问这三个缓存都是和单例有关的。

------

Spring中的bean的作用域默认都是单例的，后面我们在源码中也会看到，而了解过单例设计模式的同学都知道，单例对象是要求全局唯一的，所以单例缓存singletonObjects的作用很简单，就是用来存放Spring容器中全局唯一的单例bean。

第二级缓存，也就是早期单例缓存earlySingletonObjects，它的作用现在我们应该也明白了，其实就是在bean还没有实例化完成时，临时用来存放早期单例的bean，因为这样的话，当大量bean实例化都需要依赖另外一个bean实例时，早期单例缓存earlySingletonObjects就可以为其他的bean的实例化提供依赖的bean实例了。

同时，有了缓存earlySingletonObjects，对应的早期单例bean只需要从工厂缓存singletonFactories中，获取一次对象工厂ObjectFactory并创建一次即可，否则的话，你每次要用到早期单例bean时，都需要从singletonFactories获取相应的ObjectFactory来创建，前后这样对比的话，缓存earlySingletonObjects对性能还是有一定的提升的。

而第三级缓存的作用，主要还是提供了一个懒加载的选择，毕竟你通过ObjectFactory的getObject方法获取早期单例bean时，中间还是会有一些方法逻辑的，也就是说会产生一些性能的损耗，所以，ObjectFactory存放在缓存singletonFactories中的一个好处就是，可以让你在用到早期单例缓存时，才来调用ObjectFactory的方法来获取bean。

------

## 总结

好了，今天的知识点我们就讲到这里了，我们来总结一下吧。

通过一张图来梳理下bean加载迄今的一个流程：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11/20221125192922.png)

最开始，我们转换了bean的名称，也就是剔除掉name前缀的符号“&”，并且通过别名的缓存找到bean的实际名称。

然后，我们了解了Spring中的三级缓存的作用，其中单例缓存singletonObjects是用来存放Spring容器级别的单例对象，早期单例缓存earlySingletonObjects是用来存放那些早期的单例bean，而单例工厂缓存singletonFactories是用来存放 创建早期单例bean的对象工厂ObjectFactory的。

------

接着，我们又了解了Spring是如何解决循环依赖的，也就是在bean实例化时，率先将初步实例化好的bean封装到ObjectFactory中，并将ObjectFactory添加到缓存singletonFactories暴露给外界，方便其他bean实例化时，能够尽早获取到自己依赖的bean实例，尽早完成bean的实例化，从而解决循环依赖的问题。

最后，我们还分析了这三级缓存存在的意义，单例缓存singletonObjects比较好理解，就是为了维护bean的全局唯一性，而早期单例缓存earlySingletonObjects主要是为了提高循环依赖问题解决的效率，避免重复调用ObjectFactory的方法获取早期单例bean。

而singletonFactories则是利用了懒加载的思路，只有当你要用到早期单例bean时，才需要从singletonFactories中获取，否则也没必要过早的创建bean了，也可以理解为是提高性能的一种手段。

------

了解到这里，大家对Spring这三级缓存的作用和意义，应该也都了然于胸了吧，现在美中不足的就是大家还没有看到Spring源码中，具体是如何处理这三级缓存的数据的，其实大致的流程与思路和我们刚才分析是差不多的，接下来，我们结合后面的源码来理解就很完整了。
