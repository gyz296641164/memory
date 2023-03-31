---
title: 05-Spring初级容器初始化：基础数据的准备
category:
  - Spring源码
star: true
date: 2023-03-30
---

<!-- more -->

## 开篇

上一节，我们以XmlBeanFactory的构造方法作为入口，到它的父类中看了一下，发现它通过方法ignoreDependencyInterface将BeanNameAware、BeanFactoryAware和BeanClassLoaderAware这个三个感知接口添加到一个Set集合中。

目的也是非常简单，就是让BeanName、BeanFactory和BeanClassLoader这些资源，只能通过Spring内部调用这些接口方法来注入，而不能通过xml配置文件或其他的方式注入。

接下来，我们继续看下XmlBeanFactory的构造方法中还有哪些逻辑，这一节主要包括以下几个部分：

1. 继续沿着XmlBeanFactory初始化的这条主线，看下资源Resource在哪里被加载的
2. 看下EncodedResource是什么，为什么需要它来包装原始的Resource资源
3. 最后看下实际加载Resource资源之前，还需要准备那些基础数据

---

## 初探资源Resource加载的入口

现在，我们再回到XmlBeanFactory的构造方法中看下：

![image-20230330174301949](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202303301743026.png)

可以看到，下一步就是委托成员变量reader也就是XmlBeanDefinitionReader中的loadBeanDefinition来加载Resource资源了。

为了方便大家理解方法loadBeanDefinition的语义，在Spring容器中的每个bean的属性、普通方法、构造方法等bean相关的信息，都会封装在数据结构BeanDefinition中。

bean在最初注册到Spring容器时是以BeanDefinition的形式存在的，后面我们对BeanDefinition会更进一步的讲解的。

---

## EncodedResource是什么呢？

我们继续沿着loadBeanDefinitions方法，一步步来看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202303302050484.png)

可以看到，在loadBeanDefinition方法中，首先将Resource资源封装为了EncodedResource，那EncodedResource有什么特别的地方呢？我们进去看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202303302050537.png)

可以看到，在EncodedResource类中包含了三个成员变量，分别是Resource类型的resource，很明显resource就是用来存放我们传递进来的资源的。

最关键的就在于encoding和charset这个两个成员变量，通过名称我们可以知道就是编码和字符集，加上EncodedResource的命名方式，我们可以推断出这个类就是在确定Resource资源的编码和字符集信息。

我们进入到EncodedResoruce的构造方法中来看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202303302050805.png)

可以看到，EncodedResource的构造方法中，其实就是将resource对象设置到自己的成员变量resource中，同时还传了两个null值给到构造方法，也就是说encoding和charset默认值为null。

简单到EncodedResource类中看一下发现，使用到encoding和charset的也就是一个地方也就是getReader方法：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202303302050101.png)

可以看到在getReader方法中，首先会通过getInputStream方法获取resource的输入流，同时会指定字符集或者编码来创建InputStreamReader。

但是，现在我们传入的charset和encoding都为null，所以创建的就是一个没有指定字符集和编码的InputStreamReader了。

InputStreamReader大家或多或少都了解过一点，就是Java SE IO流中将字节输入流转换为字符输入流的API，很明显接下来Spring将会以字符流的方式，读取我们的资源Resource。

------

## 基础数据的准备工作

了解完EncodedResource之后，我们再继续回到刚才的位置：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202303302050283.png)

可以看到，将Resource资源封装为带字符集和编码类型的EncodedResource之后，现在继续调用XmlBeanDefinitionReader中的另外一个重载方法loadBeanDefinitions，我们进去看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202303302050173.png)

前面的一些琐碎的代码，我们可以先跳过，可以看到首先会通过encodedResource调用getResource方法，获取我们刚才设置进去的Resource。

而前面我们通过Resource的类继承图可以知道，Resource是继承了InputStreamSource的，所以我们可以调用InputStreamSource中的getInputStream方法，获取Resource资源中的输入流，接下来，我们可以看到**将输入流封装为了InputSource**，然后再调用doLoadBeanDefinitions方法。

直到这一步，我们的数据准备工作才算完成了，从doLoadBeanDefinitions方法开始，我们就要正式开始解析xml配置文件了。

我们先一睹为快，看下doLoadBeanDefinitions方法里在干些什么事情：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202303302051843.png)

可以看到，doLoadBeanDefinitions方法中大体来说就干了两件事，一是通过我们传进来的参数inputSource和resource创建xml文件的Document对象，另外就是解析Document对象将解析到的bean注入到Spring的容器中。

至于Document是什么以及如何解析，我们后面会详细讲解，并且这两个步骤涉及到的逻辑也是比较复杂的。

------

## 总结

好了，今天的知识点，我们就讲到这里了，我们来总结一下吧。

一张图来梳理下当前的流程：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202303302051565.png)

这一节，我们继续跟进XmlBeanFactory的构造方法，除了上一节提到了的，将一些感知接口添加到集合中之外，我们还发现XmlBeanFactory会将Resource的加载任务委托给XmlBeanDefinitionReader。

XmlBeanDefinitionReader首先会将Resource封装为EncodedResource，EncodedResource相比于我们传进来的Resource只不过多了一些字符集和编码相关的设置，然后通过Resource中的输入流创建了InputSource，接下来进入到真正加载资源的方法doLoadBeanDefinitions中。

下一节，我们来看下Spring到底是如何加载资源Resource的吧。