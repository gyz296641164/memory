---
title: 34_Spring注解源码解析：动手来模拟下@Component注解的功能
category:
  - Spring源码
star: true
date: 2023-03-31
---

<!-- more -->

<h1 align="center">34_Spring注解源码解析：动手来模拟下@Component注解的功能</h1>

## 开篇

通过上篇文章，我们知道了注解的本质就是一个接口，只不过是一个继承了Annotation接口的接口，同时我们也知道了注解本身是没有任何功能的，顶多就是一个标记的功能，如果想给注解添加特定功能的话，那么需要单独写代码来处理这个注解才行。

为了让大家对注解有个更深入的理解，这篇文章我们就一起来动手模拟下Spring中@Component注解的功能。

因此本篇文章大概分为下边几个步骤来进行讲解：

1. 首先我们会观察下Spring中@Component注解的定义
2. 接着来分析下我们自定义的@MyComponent注解，要实现和@Component注解一样的功能，也就是为添加了注解的类创建对应的实例出来，到底该怎么设计
3. 最后就是动手撸代码为@MyComponent注解添加功能了

那么我们废话不多说，直接开干吧。

---

## 先近距离观察下@Component注解的定义

在实现@MyComponent注解之前，我们先来看下Spring中的@Component注解的定义

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301311807671.png)

大家可以看到，@Component注解上也加了元注解，只不过这里同时加了4个元注解，比如这个@Retention元注解，我们前边是讲过的，它可以控制定义的这个@Component注解在什么时候有效，这里指定为RetentionPolicy.RUNTIME的意思是在代码运行时有效

至于其他的元注解，我们可以暂时不用关心是什么含义，因为现在对于我们来说不是重点

通过观察Spring的@Component注解的定义，我们发现这个@Component注解其实和我们之前定义的@MyComponent注解是差不多的

并且我们现在还知道，不管@Component注解还是@MyComponent注解，它们本身都是没有任何功能的，想实现功能的话、都必须写额外的代码来支持

不过在动手撸代码之前，我们先来提纲挈领的梳理下@MyComponent注解的实现思路

---

## @MyComponent注解的实现思路

在动手写代码之前，我们先来梳理下@MyComponent注解实现思路，我们看这里

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301311808197.png)

首先呢，我们肯定是会指定一个包路径的，比如包路径 com.ruyuan.container.annotation.model

接着就需要来扫描这个com.ruyuan.container.annotation.model包路径下的class文件了，这里就会将com.ruyuan.container.annotation.model目录及其子目录下的class文件全部给扫描出来，比如Student.class和Teacher.class

所有的class都扫描出来了，那么下一步我们要做什么呢？

那当然是为class创建对应的实例出来了，但是我们总不能为所有的class都创建一个实例出来吧？总得有个条件吧？也就是说符合某个条件后，我们才为这个class创建实例，那这个条件是啥呢？

其实很简单，这个条件就是只有加了@MyComponent注解的class，才算是符合条件，此时才会为这个class创建对应的实例出来。

说白了就是我们需要来看一下这些class文件，有哪些是加了@MyComponent注解的，对加了@MyComponent注解的类，我们就需要通过反射来创建类对应的实例，并将实例放入到IOC容器中，这个IOC容器说白了就是一个Map的数据结构

那如果class文件没有加@MyComponent注解，那么就说明这个类不需要创建对应的实例出来，此时这个类我们就不做任何处理

这个就是我们实现@MyComponent注解功能的思路，那接下来我们直接开始动手撸代码吧

---

## 动手撸代码

#### 1、自定义@MyComponent注解

首先第一步当然是创建一个我们自己的注解啦，也就是@MyComponent注解，这个在上篇文章我们已经创建过了，这个很简单，代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301311808279.png)

#### 2、在Student类上添加@MyComponent注解

接着将定义好的@MyComponent注解添加到Student类上，代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301311808633.png)

另外再搞一个Teacher类出来，而这个Teacher类上不用加@MyComponent注解，目的是为了和Student类做一个对比

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301311808269.png)



#### 3、为@MyComponent注解添加功能

这里我们专门新建一个ApplicationContext类，在这个类中为@MyComponent注解添加功能，ApplicationContext部分代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301311808763.png)

我们可以看到，这里首先有一个构造方法，这个构造方法的入参是一个包路径，这个包路径说白了就是需要扫描的包路径，也就是Student类和Teacher类所在的包路径，即com.ruyuan.container.annotation.model

然后在构造方法中调用了一个scanPackage(packagePath)方法，这个scanPackage(packagePath)方法是专门做扫表包路径这件事儿的，它里边最核心的逻辑有2块，第一块是会调用getClassFiles(packagePath)方法来获取packagePath目录下所有的class文件

而第二块逻辑是会调用processClassFiles(packagePath, classFiles)来处理扫描出来的class文件，说白了就是为加了@MyComponent注解的类创建实例，并放入到IOC容器中

那么我们先来看第一块逻辑，来看下getClassFiles(packagePath)方法是怎么来扫描指定目录下的class文件的，getClassFiles(packagePath)方法的相关代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301311808838.png)

其实也很简单，在getClassFiles(packagePath)方法中，首先会调用getFile(packagePath)方法，来获取packagePath路径对应的file对象，接着调用filterClassFiles(packagePath, file)方法来处理这个file对象，说白了就是来过滤出所有的class文件

这个filterClassFiles(packagePath, file)的逻辑其实很简单，就是会看下当前的file对象是目录类型还是文件类型，如果是目录类型，那么就递归调用scanPackage(packagePath)方法，那如果file对象是文件，那么就过滤出来class文件

这样就可以将指定目录下的所有class文件扫描出来了，比如将com.ruyuan.container.annotation.model目录下的class文件全部都扫描出来了

那么现在class文件有了，下一步该做什么了呢？

其实很简单，下一步就是来看下这个class上是否添加了@MyComponent注解，如果添加了@MyComponent注解，那么我们就使用反射来创建类对应的实例，并将创建好的实例放入到IOC容器中，如果这个class没有添加@MyComponent注解，那么我们不处理就可以了

其实代码写起来也很简单，我们看这里

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301311808314.png)

因为我们要使用到反射，所以我们要提前拼接出来类的全限定类名fullyClassName，为了方便，我们这里顺便将beanName也给处理好了，这个beanName后边会作为IOC容器的key来使用

当fullyClassName和beanName都处理好后，最后会调用createBean(beanName, fullyClassName)方法来完成bean的创建，这个createBean(beanName, fullyClassName)其实也很简单，代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301311808510.png)

大家可以看到，首先使用Class.*forName*(fullyClassName)拿到了全限定类名对应的class对象，然后调用了class对象的isAnnotationPresent(MyComponent.**class**)方法，来判断当前的class是否添加了@MyComponent注解

如果当前的class没有添加@MyComponent注解，那么isAnnotationPresent(MyComponent.**class**)方法就会返回false，此时就不会对这个class做任何处理

另外一种情况，如果当前的class添加了@MyComponent注解，那么就会通过反射来创建类对应的实例，也就是会执行这行代码 Object instance = c.newInstance()

最后将创建好的实例instance放入IOC容器**iocMap**中，这个**iocMap**的定义为Map<String, Object> **iocMap** = **new** ConcurrentHashMap<>()，其实就是一个Map，这个**iocMap**的key是beanName，而value就是刚创建好的实例instance

这样其实就完成了一个bean的创建，未来通过getBean(String beanName)方法获取bean时，直接从这个**iocMap**获取就可以了，代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301311809582.png)

到这里位置，整个ApplicationContext类的代码我们就写完了。

#### 4、测试一下

最后编写一个测试类，从我们自己的IOC容器中获取实例，并调用实例的方法

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301311809044.png)

运行main()方法后打印结果如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301311809277.png)

通过打印结果我们可以知道，没有加@MyComponent注解的Teacher类，没有创建实例，而加了@MyComponent注解的Student类，通过反射创建了实例，并被放到了IOC容器中，且可以从IOC容器中获取到实例，并可以正常调用实例的eat()方法

好了，到这里为止，我们仿照Spring中@Component注解的功能，自己手撸了一个@MyComponent注解，这个@MyComponent注解的功能和Spring中@Component注解的功能是完全一样的，通过手撸这个代码，我们了解了注解的真正玩儿法，更重要的是，它对我们即将要来剖析的注解源码来说，有着非常重要的意义。

---

## 总结

好了，今天的知识点，我们就讲到这里了，我们来总结一下吧。

其实我们这节的重点，主要就是实现了自己的@MyComponent注解，而实现的思路，简单来说有以下几个步骤：

1. 首先会对指定的包路径做扫描，说白了就是会将这个包路径下的class全部扫描出来
2. 然后再判断class上有没有加@MyComponent注解，如果没加的话就不用管这个类了，但是如果加了的话，那么就会使用反射对加了@MyComponent注解的类创建对应的实例出来
3. 接着将上个步骤创建的实例放到IOC容器中，说白了就是放到一个Map中
4. 最后通过getBean(String beanName)方法获取bean时，直接从这个Map来获取就可以了