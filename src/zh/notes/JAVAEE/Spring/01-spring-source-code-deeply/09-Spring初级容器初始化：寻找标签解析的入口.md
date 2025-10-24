---
title: 09_Spring初级容器初始化：寻找标签解析的入口
category:
  - Spring源码
star: true
date: 2023-03-31
---

<!-- more -->

## 开篇

截止目前，我们依然处于applicationContext.xml加载和解析的这条路上，值的庆幸的是，我们对这个过程逐渐的明朗起来了。

首先，我们将applicationContext.xml封装为资源ClassPathResource，然后再通过EncodedResource和InputSource的进一步封装之后，交给DOM的API进行解析并获取xml对应的Document。

并且，我们也了解到，Spring在解析xml文件前还需要对xml文件进行校验，光是校验方式我们就了解了DTD和XSD这两种，并且，我们还分析了不同的校验方式的判定方式，以及如何通过程序获取相应的声明文件。

确实，Spring在这块做的比较严谨，也无愧于它是一款风靡世界的框架，好了，现在对xml文件的校验环节结束之后，我们通过DOM的API也得到了xml的Document。

接下来，我们沿着之前的位置，继续来看下Spring是如何解析xml文件的吧，这一节主要分为以下几个部分：

1. 首先沿着上一节的源码，看下Document的解析是在什么位置开始的
2. 然后再来看下Spring中，具体是由哪个组件负责解析Document的，先找到解析的入口
3. 最后我们再来看下xml中，标签的解析都有哪些类型，并且是如何判定这些标签类型的

---

## Document解析的入口

这一节，我们再回到之前doLoadBeanDefinitions方法中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202303311757247.png)

可以看到，现在我们通过doLoadDocument方法已经获取到了xml对应的Document对象。

下一步，我们就要来看下Spring是如何解析Document的了，我们可以跟进到registerBeanDefinitions方法中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202303311757033.png)

可以看到，首先调用createBeanDefinitionDocumentReader方法，创建BeanDefinitionDocumentReader类型的对象documentReader。

因为BeanDefinitionDocumentReader只是一个接口，那documentReader具体是什么类型呢？我们到createBeanDefinitionDocumentReader方法中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202303311757449.png)

很明显，BeanUtils的instantiateClass方法就是通过documentReaderClass类来创建对象，那documentReaderClass类又是谁呢，我们继续来看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202303311757783.png)

可以看到，原来documentReader的实际类型为DefaultBeanDefinitionDocumentReader。

我们回到刚才registerBeanDefinitions方法的位置：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202303311757102.png)

创建完DefaultBeanDefinitionDocumentReader之后，下一步可以看到通过getRegistry方法进一步调用getBeanDefinitionCount方法，其实，方法的目的也就是看下之前Spring容器中已经注册了多少个bean了，方便registerBeanDefinitions方法最后返回本次注册bean的数量。

可以看到，接着就通过documentReader调用registerBeanDefinitions方法正式解析Document了，我们到方法registerBeanDefinitions中继续来看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202303311757687.png)

发现这一步并没有什么特别的地方，通过观察我们可以发现在Spring源码中，但凡你看到以do为方法名前缀的方法时，基本上就快接近核心逻辑了。

可以看到，doc调用getDocumentElement获取Document的文档元素，我们可以理解为就是获取applicationContext.xml中整个根标签也就是beans标签，然后将它传入doRegisterBeanDefinitions方法中。

---

## 委托BeanDefinitionParserDelegate来解析

可以想象到的是，在方法doRegisterBeanDefinitions中才会开始正式解析Document，所以，我们继续到方法doRegisterBeanDefinitions中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202303311758753.png)

在方法doRegisterBeanDefinitions方法中，首先，我们来看下成员变量delegate是什么，我们再到方法createDelegate中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202303311758061.png)

可以看到，成员变量delegate的类型其实就是BeanDefinitionParserDelegate，从名称上大概可以猜到，BeanDefinitionParserDelegate是解析Document并封装BeanDefinition的一个代理类。

我们再回到doRegisterBeanDefinitions方法看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202303311758178.png)

前面一些琐碎的代码无关紧要，但是，最后这三个方法看起来比较关键，我们挨个来看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202303311758321.png)

简单看了下发现，方法preProcessXml和方法postProcessXml都是空实现。

其实，我们从方法preProcessXml和postProcessXml被protected关键字修饰的这个细节，大概可以推断出这两个方法应该是留给继承DefaultBeanDefinitionDocumentReader的子类去拓展的。

现在，我们的目标就很清晰了，直接到parseBeanDefinitions方法中看下吧：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202303311758779.png)

可以看到，Document元素的解析就全权交给BeanDefinitionParserDelegate来处理了。

---

## 默认标签和自定义标签的判定

首先delegate调用方法isDefaultNamespace，来判断当前解析的元素root是否是默认的命名空间，什么意思呢？我们到方法isDefaultNamespace中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202303311758092.png)

可以看到在方法isDefaultNamespace中，会继续调用isDefaultNamespace方法，在isDefaultNamespace方法中判定的方式也比较简单，只要namespaceUri为空或namespaceUri为：`http://www.springframework.org/schema/beans`

只要满足以上任意一个条件，就认为当前解析的标签为默认标签，否则具有其他类型的namespaceUri标签都会被认为是自定义标签。

Spring自定义标签是相对于默认标签`<bean/>`而言的，比如Spring内部也自定义了很多自定义标签，如`<context:component-scan/>` 、`<tx:annotation-driven/>`等。

那namespaceUri是从哪里来的呢？不知道大家还记得不，我们来看下applicationContext.xml文件：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202303311758673.png)

也就是说，当我们解析bean标签时，bean标签对应的命名空间的URI即namespaceURI其实就是：[http://www.springframework.org/schema/beans](http://www.springframework.org/schema/beans)， 来自于图中beans标签上的xmlns属性。

同时，我们到方法getNamespaceURI中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202303311758916.png)

可以看到参数namespaceUri的值是通过方法getNamesapceURI获取的，命名空间的URI其实就是从Node中获取的一个属性，而Node就是DOM API中表示具体标签的一个节点，比如每个bean标签中的信息也会封装在一个Node中。

我们再回到parseBeanDefinitions方法中：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202303311759096.png)

因为我们在xml中配置的就是默认的标签bean，所以，下一步我们就要进入到解析标签的核心环节了，也就是parseDefaultElement方法，考虑到目前Spring基于注解开发用的比较多，所以，我们这里重点分析Spring中最核心的默认标签。

分析到了这里我们及时总结下，从XmlBeanFactory将资源Resource交给XmlBeanDefinitionReader开始，中间经历的几次重要的任务委托，我们结合XmlBeanDefinitionReader的类继承图来看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202303311759171.png)

首先，XmlBeanDefinitionReader经过Resource资源的各种封装之后，将资源交给了DocumentLoader来处理，DocumentLoader负责将Resource加载成一个Document对象。

然后，XmlBeanDefinitionReader又将Document的解析任务交给了BeanDefinitionDocumentReader来处理，BeanDefinitionDocumentReader的实现类DefaultBeanDefinitionDocumentReader，又将Document中的各种标签解析任务，全权交给了BeanDefinitionParserDelegate来处理。

---

## 总结

好了，今天的知识点，我们就讲到这里了，我们来总结一下吧。

我们来梳理下目前Spring源码分析的流程：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202303311759520.png)

这一节，我们从解析Document开始，发现Document中的元素解析任务都交给BeanDefinitionParserDelegate来处理，并且，我们发现在Spring中标签的解析是分为默认标签和自定义标签的，而且我们也已经找到解析标签的入口了。

下一节，我们就顺着Spring自定义标签解析的入口方法parseDefaultElement开始分析，看下Spring是如何解析各种各样的标签的。