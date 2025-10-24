---
title: 40_Spring AOP简介：一个例子告诉你AOP可以解决哪些问题
category:
  - Spring源码
star: true
sticky: true # 置顶文章在博客列表上
date: 2023-03-10
---

<!-- more -->

## 开篇

到这里为止，我们已经将Spring IOC容器这一块给搞定了，主要包括了Spring容器的初始化、bean的实例化和初始化、bean的加载过程等内容，学习完了这一块，相信同学们对Spring IOC这块会有更深的理解。

我们都知道，其实在使用Spring时，主要就是使用IOC和AOP这两大功能，既然我们现在已经搞定了IOC，那么接下来当然是要开搞AOP啦。其实剖析AOP的源码是非常有意义的，因为我们使用AOP可以做很多事儿，比如我们可以使用AOP来实现日志框架，也可以使用AOP来实现事务管理，都是可以的，因此AOP的重要性不言而喻。

那么本篇作为AOP系列的第一篇文章，会通过一个例子告诉你AOP可以用来解决哪些问题，因为在研究一门技术的时候，首先要搞清楚的就是这门技术是为解决哪些问题而生的，这个搞清楚了，那么这门技术的核心功能你就掌握了，那么再去剖析这门技术的源码时，就带着目的来研究了，这样看源码的效果是最好的。

所以本篇文章会通过一个例子，来讲解AOP可以为我们解决什么问题，本篇文章大概有下边几个部分：

1. 首先我们会引入统一为方法添加日志的场景，来看下使用最原始的方式会有什么问题
2. 为了解决重复代码的问题，我们会将记录日志的逻辑进行封装，来看下优化过后能否彻底解决当下的问题
3. 最后我们使用AOP进一步做了优化，这样既可以解决重复代码的问题，又可以使类之间完成解耦

那废话不多说，现在就开始本节的内容吧。

---

## 原始版本：想统一记录日志怎么办？

好，这里先给出一个场景，就是我们在调用service层的方法时，想将被调用方法的入参和出参给统一记录下来，那么大家一般会怎么做呢？

为了说明问题，这里直接先给出一个最low的代码版本，大家先看一眼。

service接口声明如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302081612070.png)

可以看到，这个ProductService中主要有2个方法，一个是添加商品的addProduct()方法，另外一个是查询商品 的getProductById()方法。

然后service实现类代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302081612384.png)

我们可以看到在实现类WithoutAopProductServiceImpl中，直接在方法体开始和结束的地方记录了入参和出参。

对应的测试类代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302081612479.png)

大家可以看到，这个测试类很简单，就是根据beanName从IOC容器中获取实例，然后调用实例的addProduct()方法和getProductById()方法，最后打印结果如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302081612536.png)

看完这个例子，相信大家也都看出问题了，这里最大的问题就是：在每个方法中都存在记录日志的代码，造成了大量的重复代码，这些重复的代码会极大的增加未来的维护成本。

那怎么办呢？有没有什么办法可以优化一下？

可能有的同学会说：“那简单啊，既然都是重复代码，那我们将重复代码抽取出来不就行了？比如抽取到一个单独的类中”

好，那我们就按照这个思路来优化一版代码，看下到底能不能真正解决这个问题。

---

## 优化版本：将日志逻辑进行统一

此时我们将记录日志的代码统一抽取到单独的类中，代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302081612983.png)

然后我们在service的实现类中，直接调用这个LoggingUtils类中的方法来记录日志，代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302081612471.png)

对应的测试类代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302081613701.png)

测试类的打印结果如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302081613533.png)

这个优化过的版本大家感觉咋样？

有的同学会说：“重复代码的问题现在已经不存在了，这样感觉还可以啊”

其实呢，现在是没有重复代码的问题了，但是引入了一个新的问题，那就是service的实现类和LoggingUtils类耦合在了一起，未来当LoggingUtils类发生一些改变时，是会影响到service实现类的。

那么有没有什么办法，既可以解决重复代码的问题，又可以使类之间完成解耦呢？最好还可以当我们需要时，能随意地加入这些代码。

既然话都说到了这个份上，那当然是有的啦，其实这种将特定代码片段切入到指定类的指定方法中的编程思想就是面向切面的编程，也就是AOP。

接下来我们就用AOP来改造一下。

---

## AOP版本：在统一日志逻辑的基础上实现解耦

首先我们将日志功能的代码抽取到一个切面中，切面代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302081613987.png)

大家可以看到，在这个LoggingAspect类上加了一个@Aspect注解，这个Aspect就是切面的意思，所以这个LoggingAspect类就是一个切面，它里边包含了切点Pointcut和通知Advice，而这个切面的核心就是日志代码片段了。

为了和切点Pointcut、通知Advice的概念区分开，大家可以将切入到指定类指定方法的代码片段理解为是一个切面，也就是这里的日志代码片段其实就是一个切面。

接着在LoggingAspect中通过@Pointcut注解定义了一个切点，这个切点是一个表达式，它代表的意思是要将日志代码片段切入到哪些类的哪些方法中，这里的切点表达式为execution(public * com.ruyuan.aop.service.ProductServiceImpl.*(..))，意思是将日志代码片段切入到ProductServiceImpl类中的所有方法中

切点Pointcut定义好之后，我们可以看到在@Before注解和@AfterReturning注解中直接调用了pointcut()方法，说白了就是引用了切点

这个@Before注解和@AfterReturning注解在AOP中叫做Advice（通知），这个Advice说白了就是增强，也就是这个切面（日志代码片段）你期望在哪个阶段生效，是在执行目标方法前生效呢，还是在执行目标方法后生效呢，就是这个意思。

使用了AOP后，service的实现类就再也不用关心记录日志这件事儿了，它只需要关注自己的核心业务逻辑就可以了，此时service的实现类代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302081613145.png)

可以看到在service的实现类中，没有日志相关的代码。

对应的测试类代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302081613872.png)

测试类执行后的打印结果如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302081613195.png)

大家看到了吧？使用AOP之后，service的实现类根本不用关心记录日志这件事儿了，这样业务逻辑和日志记录这件事儿就完全解耦了，并且重复代码的问题也不存在了，这样的结果是不是皆大欢喜？

最重要的是，AOP可以在我们需要的时候再切入日志逻辑，当我们不需要时，就不会切入日志逻辑，此时我们只需要调整AOP的切点表达式就可以了，根本不需要改动代码，是不是很爽？

---

## 总结

第一，为了解决重复代码和类与类耦合这两个问题，我们可以使用AOP，AOP说白了就是将重复的代码抽取到一个切面中，然后在我们需要的时候，将这个切面切入到指定位置，从而改变目标类和目标方法原有的行为。

第二，在AOP中，我们一般将切入到指定类指定方法的代码片段叫做切面，而将切入到哪些类和哪些方法的规则叫做切点。

最后留个小问题给大家，那就是大家还记得Spring AOP是通过什么技术实现的吗？

这里提示一下，这个技术可是Java中最基础的技术哈，大家先想一想，答案将在下篇文章进行揭晓。