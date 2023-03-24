---
title: 69_Spring事务：来看下TransactionInterceptor增强的匹配过程
category:
  - Spring源码
star: true
sticky: true
date: 2023-03-24
---

<!-- more -->

## 开篇

大家好，上节我们分析了TransactionInterceptor控制事务的内部实现细节，简单一句话来总结的话，那就是TransactionInterceptor其实是通过jdbc的API来控制数据库事务的。

那么到目前为止，我们知道，@Transactional注解是基于AOP来实现的，而我们知道AOP的核心，就是为目标方法“添加”一些增强，比如TransactionInterceptor增强，那怎么判断，“应该”为目标方法“添加”哪些增强呢？

其实啊，“应该”添加哪些增强，是通过与目标类和目标方法匹配的结果来判断的，比如我们之前就讲过，在创建AOP代理之前，就会做一轮匹配，此时会为目标类匹配出合适的增强。

而关于增强与目标类的匹配过程，我们之前也讲过，但是对于事务来说，这个匹配过程是不是完全通用呢？比如在匹配TransactionInterceptor增强时，这个匹配过程和之前分析的是不是完全通用呢？

这个我们目前是不知道的，但是我们猜测，大致的匹配思路应该不会变，也就是说，在匹配TransactionInterceptor增强时，肯定也是首先在类级别进行匹配，然后在方法级别进行匹配，而具体匹配的细节，可能有特殊的处理。

ok，猜测归猜测，我们知道，实践是检验真理的唯一标准，那我们今天就通过“实践”来检验我们的猜测，所以这节我们就一起来探索下TransactionInterceptor的匹配过程，顺便也复习一下创建AOP代理时，为目标类匹配增强的过程。

本节的主要内容如下：

1. 在匹配之前，会先讲下获取所有增强的过程，这里以复习为主，当然也会加入一些新的内容
2. 在获取到所有增强后，就要开始为目标类匹配增强了，这里会站在@Transactional的角度，来分析下类级别的匹配过程
3. 在类级别匹配满足后，就会来遍历目标类中的方法，依次来进行匹配，此时只要有一个方法满足匹配，那么就代表这个方法所在的类需要被代理，所以这里会站在@Transactional的角度，来分析下方法级别的匹配过程

::: info 重点方法

- `org.springframework.aop.framework.autoproxy.AbstractAutoProxyCreator#wrapIfNecessary`：AOP匹配增强

:::

---

## 来看下获取所有增强advisors的过程

那么我们从哪里开始分析呢？

其实非常简单，因为@Transactional的原理是基于AOP的，所以匹配TransactionInterceptor增强的逻辑，其实就是AOP匹配增强的地方，也就是下边这行代码，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303221633489.png)

大家可以看到，上边就是在创建AOP代理之前，为目标类匹配增强的入口，那么我们就从这里开始分析吧。

我们来看下边这块代码，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303221633183.png)

上边的代码，其实我们之前在AOP章节都讲过，我们知道，在匹配增强的时候，首先就是要找到所有的增强。

所以我们首先就来复习一下，在匹配之前，是怎么找到所有增强的，我们知道，声明增强有两种方式，一种是xml的方式，另一种是注解的方式，而在寻找增强的过程中，首先就是来加载xml中配置的增强，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303221633597.png)

通过上图，可以看到，这里调用的是父类中的findCandidateAdvisors()方法来获取xml中配置的增强，之前我们在AOP章节，没有详细来分析获取xml增强的代码，那么我们这里就顺道给补上。

那么接下来，我们就来看下父类中的findCandidateAdvisors()方法，代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303221633444.png)

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303221633802.png)

通过上边的代码，可以看到，其实在findCandidateAdvisors()方法中呢，是依赖findAdvisorBeans()方法完成xml增强的查找。

而这个findAdvisorBeans()方法，可以看到，主要有三大步骤，首先就是通过工具类BeanFactoryUtils的beanNamesForTypeIncludingAncestors()方法获取到所有增强Advisor的bean名称。

然后遍历处理这些增强Advisor的bean名称，处理的时候，其实就是直接通过getBean()方法获取指定name的bean实例，并且将获取到的bean实例放入advisors集合中，最后将advisors集合作为结果进行返回。

接下来，我们就debug来看下，这个advisors集合中都会获取到哪些xml增强，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303221634036.png)

通过上图，我们可以看到，在advisors集合中只有一个增强，那就是BeanFactoryTransactionAttributeSourceAdvisor，从名字上来看，这个增强应该和事务有关系，这个增强对应的name为org.springframework.transaction.config.internalTransactionAdvisor。

这个BeanFactoryTransactionAttributeSourceAdvisor增强的作用，我们目前还不得而知，所以我们先抓大放小，继续往下分析代码。

在获取完xml中配置的增强后，那么接下来呢，就要来获取@Aspect注解声明的增强了，也就是下边这行代码，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303221634789.png)

大家可以看到，其实上边的代码呢，主要就是调用了buildAspectJAdvisors()方法，而这个buildAspectJAdvisors()方法，会获取到所有通过@Aspect注解声明的增强，这块代码呢，之前我们都详细分析过，这里就不再赘述了。

我们直接来看下，buildAspectJAdvisors()方法执行完毕后，advisors集合中都有哪些增强吧，我们看下边这张图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303221634403.png)

通过上图，大家可以看到，在获取到@Aspect注解声明的增强后，advisors集合中一共有12个增强，需要注意的是，除了第一个增强是BeanFactoryTransactionAttributeSourceAdvisor类型外，其余的11个增强全部是InstantiationModelAwarePointcutAdvisorImpl类型。

---

## 站在@Transactional的角度，来看下类级别的匹配过程

好了，在获取到所有的增强后，我们知道，下一步就是为目标类匹配可用的增强了，说白了就是会执行下边这行代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303221645880.png)

之前在AOP章节，我们详细分析过匹配增强的整个过程，这里我们就当复习了，我们接着往下看，经过我们一路跟踪上边红框中的findAdvisorsThatCanApply()方法，发现最终会调到下边这行代码，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303221645115.png)

那么上边这行代码呢，我们也是很熟悉的，其实就是普通增强的匹配逻辑，而canApply()方法的代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303221645702.png)

而上边这块代码呢，我们也是非常熟悉的，其实就是匹配增强的核心逻辑，简单来说，主要分为类级别的匹配和方法级别的匹配。

刚才我们看到，在增强集合advisors中，排在第一个的是BeanFactoryTransactionAttributeSourceAdvisor增强，所以首先过来匹配的就是这个BeanFactoryTransactionAttributeSourceAdvisor增强了。

那么接下来，我们先来看下这个BeanFactoryTransactionAttributeSourceAdvisor增强，在类级别是怎么来进行匹配的，其实就是分析下边这块代码，如下图：![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303221645701.png)

那这个时候，我们通过debug跟进去，发现上边调用的其实是TransactionAttributeSourceClassFilter

类的matches()方法，代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303221645038.png)

通过上图，可以看到，在这个matches()方法中又调用了一个isCandidateClass()方法来完成匹配。

我们通过debug继续跟踪下去，发现isCandidateClass()方法的代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303221645677.png)

通过上图，我们可以看到，上边这个for循环，会遍历所有的事务注解解析器来匹配目标类，而只要目标类满足任何一个事务注解解析器的匹配，那么就说明目标类满足类级别的匹配。

此时通过debug，我们可以看到，这个时候其实只有一个注解解析器，那就是SpringTransactionAnnotationParser注解解析器，那这个SpringTransactionAnnotationParser解析器是怎么完成匹配的呢？

接下来，我们就来看下SpringTransactionAnnotationParser解析器的isCandidateClass()方法，代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303221645032.png)

通过上边的代码，可以看到，这里通过工具类AnnotationUtils来完成了最终的匹配，而比较关键的是，这里将@Transactional注解的Class对象作为入参传递了进去。

现在看来，核心逻辑其实就在工具类AnnotationUtils的isCandidateClass()方法中了，此时我们跟踪进去，就会看到下图中的代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303221645129.png)

通过上图，可以看到，其实呢，真正的逻辑是在isCandidateClass(Class<?> clazz, String annotationName)方法中的。

而进入这个方法后，首选要判断的，就是注解名称annotationName是不是“java.”开头的，说白了就是看下这个注解是不是java自己的注解，那么此时这个annotationName的值是多少呢？

其实在上图中，我们可以看到，**此时annotationName的值为org.springframework.transaction.annotation.Transactional**，同时可以看到clazz就是目标类OrderServiceImpl。

可以看到，此时这个annotationName不是“java.”开头的，所以代码会继续往下走，此时就会执行这行代码，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303221645700.png)

可以看到，上边的代码主要就是调用了hasPlainJavaAnnotationsOnly()方法，同时将目标类clazz，也就是OrderServiceImpl作为入参传递了进去，而hasPlainJavaAnnotationsOnly()方法的代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303221645484.png)

此时我们可以看到，上边的代码，就是**先看下目标类是不是“java.”开头的，然后再看下目标类是不是Ordered接口类型**，很显然，由于此时的目标类，就是我们自己创建的OrderServiceImpl，所以这两个条件都是不满足的，所以这里会返回false。

而一旦上边的hasPlainJavaAnnotationsOnly()方法返回false，那么就会执行下边这行代码，直接返回true了，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303221645155.png)

那此时，就代表目标类OrderServiceImpl是满足类级别匹配的！

好了，分析到这里，让我们来简单总结下：其实对于@Transactional注解类级别的匹配来说，只要目标类既不是java自己的类，也不是Spring里的Ordered接口类型，那么此时就表示目标类是满足类级别匹配的。

所以可以看到，通常来说，在我们自己编写的类中添加@Transactional注解，类级别匹配都是满足的。

那么当类级别匹配完成后，就表示下边这个matches()方法会返回true，如下图：![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303221645754.png)

可以看到，当满足类级别的匹配后，代码就会继续往下执行，来进一步完成方法级别的匹配。

---

## 站在@Transactional的角度，来看下方法级别的匹配过程

我们知道，当前正在匹配的增强是BeanFactoryTransactionAttributeSourceAdvisor，那么在类级别完成匹配之后，我们继续往下看，此时就会看到下边这块代码，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303221708607.png)

通过上图，我们可以看到，上边会看下这个methodMatcher是不是IntroductionAwareMethodMatcher类型，如果是的话，就将methodMatcher强转为IntroductionAwareMethodMatcher类型，并赋值给introductionAwareMethodMatcher变量。

而这个introductionAwareMethodMatcher变量，在后边进行方法匹配的时候，可是有大用处的，那么这个时候我们可以通过debug来看一眼，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303221708910.png)

通过上图，我们可以看到，此时methodMatcher明显不是IntroductionAwareMethodMatcher类型，所以methodMatcher instanceof IntroductionAwareMethodMatcher的结果为false，那么此时introductionAwareMethodMatcher变量就不会被赋值，说白了就是introductionAwareMethodMatcher变量还是个null。

ok，那我们继续往下看，此时就要开始进行方法级别的匹配了，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303221708578.png)

我们可以看到，上边红框中的代码呢，其实是一个三元表达式，这个时候我们知道introductionAwareMethodMatcher为null，因此introductionAwareMethodMatcher != null的结果为false，所以此时就会执行methodMatcher.matches(method, targetClass)来进行方法的匹配了。

然后我们继续往下跟踪，就会看到matches()方法的代码，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303221708927.png)

通过上边的代码，大家可以看到，这里主要就是调用了getTransactionAttribute()方法，而这个方法从名字上来看是“获取事务属性”的意思。

同时通过红框中的代码，我们可以看到，如果获取到的事务属性不为null的话，就会返回true，而一旦这个matches()方法返回true，此时就代表方法级别匹配成功，说明当前方法所在的类需要被代理，那么当前匹配成功的BeanFactoryTransactionAttributeSourceAdvisor增强就会被添加到“合格增强”集合中，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303221708958.png)

一旦这个BeanFactoryTransactionAttributeSourceAdvisor增强被加入eligibleAdvisors中，就意味着事务功能添加成功了！

那有的同学会问：“什么？我到现在还是没看到TransactionInterceptor增强啊”

其实呢，大家注意看上图中的红框，我们会发现在BeanFactoryTransactionAttributeSourceAdvisor中，有一个属性叫做adviceBeanName，而这个adviceBeanName的值就是TransactionInterceptor的全限定类名！

所以，**我们心心念的TransactionInterceptor，其实就是BeanFactoryTransactionAttributeSourceAdvisor中的一个属性罢了**，只不过这里是一个全限定类名，但是到后边一定会通过这个全限定类名来构建TransactionInterceptor实例的。

上边呢，是获取事务属性不为null的情况，下边我们来看下另外一种情况，那就是获取到的事务属性为null的情况。

如果获取到的事务属性为null的话，则会返回false，那么此时BeanFactoryTransactionAttributeSourceAdvisor就不会加入到eligibleAdvisors中，从而导致TransactionInterceptor增强不会生效，那么此时就表示该目标方法不会被代理，也就是不会添加事务管理的功能。

所以对于@Transactional注解来说，在方法级别的匹配，说白了就是，看下能不能获取到@Transactional注解中配置的属性。

如果可以**获取到事务属性的话，那么就表示BeanFactoryTransactionAttributeSourceAdvisor增强匹配成功，此时就会按照配置的事务属性来管理事务了**。

而**如果获取不到事务属性的话，那么BeanFactoryTransactionAttributeSourceAdvisor增强就不会生效，此时就说明当前目标方法所在的类不需要被代理，所以也就没有事务管理的功能了**。

而由于篇幅的原因，具体获取事务属性的过程，我们下节再来接着分析。

---

## 总结

好了，今天的知识点，我们就讲到这里了，我们来总结一下吧。

一张图来梳理下@Transactional的原理

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303221709340.png)

上图是目前为止，我们分析的@Transactional的源码流程图，其中红色背景的部分就是我们今天新分析的内容。

我们来一起总结一下，在为事务创建AOP代理之前，会为@Transactional注解所在的类匹配出合适的增强。

而匹配增强的第一步，就是要先获取到所有的增强advisors，其中包括xml和@Aspect注解两种方式声明的增强，这里比较重要的就是BeanFactoryTransactionAttributeSourceAdvisor增强了，在获取到所有增强后，接着就会分别在类级别和方法级别进行匹配。

类级别的匹配，说白了就是，只要目标类既不是java自己的类，也不是Spring里的Ordered接口类型，那么此时就表示目标类是满足类级别匹配的。

而**方法级别的匹配，说白了就是，只要能获取到@Transactional注解中配置的事务属性，那么就代表方法级别匹配成功**。

最后如果类级别和方法级别都匹配成功的话，那么BeanFactoryTransactionAttributeSourceAdvisor增强，就将作为目标类适用的增强，来为@Transactional注解所在的类创建AOP代理了。
