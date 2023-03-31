---
title: 07-Spring初级容器初始化：XML文件的校验模式
category:
  - Spring源码
star: true
date: 2023-03-31
---

<!-- more -->

## 开篇

上一节，我们了解了一下Spring是如何解析xml文件的，其实也就是通过DOM方式来解析，但是解析的过程肯定不是像我们的案例中那么简单。

比如说，xml配置文件是否按照规定的格式来配置呢？否则，你要是在xml文件中随意配置的话，Spring在解析的时候肯定就会出错。

所以这一节，我们来看下Spring是如何对xml文件进行格式校验的，主要有一下几个部分：

1. 在加载Document的同时，看下EntityResolver实际是什么数据类型
2. 然后再了解下在Spring对xml文件的校验都有哪些方式
3. 最后来看下Spring中，分别是哪些组件来支持这些校验方式的

---

## EntityResolver的初始化

我们回到上节调用loadDocument方法的位置：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202303311307854.png)

可以看到，在loadDocument方法中传入了EntityResolver类型的参数entityResolver，我们继续上一节的问题，也就是参数entityResolver到底是什么呢？

我们回过头来到上一步方法doLoadDocument中，看下参数entityResolver是从哪里传进来的：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202303311307752.png)

可以看到，参数entityResolver其实是通过方法getEntityResolver创建的，我们到getEntityResolver方法中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202303311307458.png)

发现entityResolver果然是在getEntityResolver方法中初始化的，但是现在又有一个问题了，entityResolver的实际类型到底是ResourceEntityResolver还是DelegatingEntityResolver呢？

从代码中可以看到，这就取决于getResourceLoader方法的返回结果resourceLoader是否为空，如果resourceLoader为空，entityResolver就初始化为ResourceEntityResolver，否则entityResolver就初始化为DelegatingEntityResolver。

当然，我们可以简单调试下就知道它是否为空，但是，我们还是有必要分析下的，可以到getResourceLoader方法中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202303311307847.png)

可以看到直接就返回成员变量resourceLoader，现在问题在于resourceLoader是否为空呢？那我们就要看下成员变量resourceLoader到底是在哪里初始化的。

简单看了下发现，在成员变量resourceLoader所在类AbstractBeanDefinitionReader的构造方法中，发现了resourceLoader初始化的痕迹：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202303311307562.png)

那我们可以想一下，AbstractBeanDefinitionReader类是在什么时候初始化的呢？如果我们找到AbstractBeanDefinitionReader的初始化的位置，这样的话或许我们就可以知道参数registry的类型了，进而可以知道成员变量resourceLoader的类型了。

仔细想了下之后发现，AbstractBeanDefinitionReader会不会是XmlBeanDefinitionReader的父类呢？

虽然AbstractBeanDefinitionReader我们不是很熟悉，但是XmlBeanDefinitionReader我们前面可是看到过初始化的，大家还有印象吗，我们来回忆一下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202303311307062.png)

可以看到，我们前面刚进入到XmlBeanFactory构造方法中时，就会初始化XmlBeanDefinitionReader，并且将Resource的加载交给它处理了。

然后，我们一步步跟进到XmlBeanDefinitionReader的构造方法中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202303311307375.png)

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202303311307325.png)

果然，我们刚才的猜想是正确的，AbstractBeanDefinitionReader其实就是XmlBeanDefinitionReader的父类，而resourceLoader正是在AbstractBeanDefinitionReader的构造方法中被初始化的。

因为这里的参数registry，其实就是通过XmlBeanDefinitionReader通过构造方法参数this传进来的，而this其实就是指XmlBeanFactory，因为XmlBeanFactory是实现了接口BeanDefinitionRegistry的。

然后，我们继续看到AbstractBeanDefinitionReader的构造方法，现在我们可以很容易知道XmlBeanFactory并不是ResourceLoader的实例，所以resourceLoader的具体类型就是PathMatchingResourcePatternResolver。

我们再回到刚才的getEntityResolver方法：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202303311307747.png)

不管怎么样，现在我们已经知道了成员变量resourceLoader并不为空，那成员变量entityResolver也可以确定是ResourceEntityResolver的类型了。

那下一个问题是，EntityResolver到底有什么作用呢？接下来，我们就有必要来了解下Spring配置文件的校验方式了。

------

## XML的校验方式：DTD和XSD

相信早期使用Spring的xml文件方式开发过同学，有一点是比较迷惑的，那就是Spring xml配置文件上的那些网址是干什么的，我们来看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202303311307599.png)

可以看到，在beans标签中的这些属性，如xmlns、xmlns:xsi、xsi:schemaLocation，都有比较多的一些网址。

其实Spring通过这些网址能下载到一些文件，比如spring-beans.xsd，而xml文件的组成不光是xml文件本身，而且还包括它的约束语言，比如spring-beans.xsd就是xml约束语言XSD所规定的声明文件。

XSD翻译成英文就是XML Schemas Definition，也就是XML模式的定义，通过XSD的声明文件可以约束你在xml文件中不能随便乱写，以保证xml文件格式的正确性。

那XSD具体是如何约束的呢？我们刚也看到了，在beans标签中的属性xsi:schemaLocation里，有如下网址：

http://www.springframework.org/schema/beans/spring-beans.xsd

Spring在解析xml文件的时候就可以通过该网址，从网上下载到XSD的声明文件spring-beans.xsd。

spring-beans.xsd在声明文件中规定了关于bean标签相关的一些约束操作，如果我们没有按照正确的规则去写的话，Spring对xml文件的校验就会失败，同时也无法保证xml文件的格式正确性，Spring当然也就没必要继续处理下去了。

除了XSD之外，Spring还支持另外一种约束语言，也就是DTD，DTD翻译英文就是Document Type Definition，也就是文档类型的定义，在xml文件中的定义就像这样：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202303311308855.png)

可以看到，DTD在xml文件中是通过额外的一段配置来体现，当然，我们也可以注意到在DTD模式下也会配置相应的网址：

http://www.springframework.org/dtd/spring-beans.dtd

通过这样网址，Spring会去下载对应的DTD的声明文件spring-beans.dtd，以便来约束我们按照一定的格式来配置xml文件。

DTD和XSD的具体规则的细节我们这里不再深究，现在我们来思考一个问题，既然我们已经在xml配置文件中给出了具体的XSD和DTD文件的下载网址了，那在实际的开发中会出现什么问题呢？

可能有的同学已经想到了，那就是如果我们要运行一个基于Spring开发的应用程序，但是，程序在运行的时候一旦断网了，就会导致Spring没法从网上下载相应的DTD或XSD声明文件，那xml文件是否符合我们预期的格式也就无从得知了，另外，如果网速不好的话也会影响我们程序的稳定性，这是无法接受的。

所以，Spring的研发团队也考虑到这个问题了，索性就把相应的DTD和XSD文件都放到Spring对应的jar包中，这样的话当Spring程序运行的时候，只需要通过相应的代码程序，从jar包中获取相应的DTD或XSD声明文件就可以了，就不需要那么费力的从网上下载了。

------

## 初始化DTD和XSD的解析器

那现在问题在于，我们如何根据xml文件中的配置，获取到对应的DTD或XSD声明文件呢？现在，我们就可以回答刚才哪个问题了，这件事就是EntityResolver干的了。

我们再回到刚才源码分析的位置：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202303311308816.png)

刚才我们看到，因为resourceLoader不为空，所以成员变量entityResolver被初始化为了ResourceEntityResolver类型，而ResourceEntityResolver就是从jar包中，获取xml文件对应的DTD或XSD声明文件的。

那ResourceEntityResolver是如何获取的呢，我们继续到ResourceEntityResolver的构造方法中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202303311308821.png)

可以发现，resourceLoader赋给了ResourceEntityResolver的成员变量resourceLoader，但是，ResourceEntityResolver的父类构造方法中又干了些什么事呢，我们继续看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202303311308268.png)

看到这里大家应该就明白了，从类的名称我们就可以推断出，**BeansDtdResolver就是用来获取DTD声明文件的解析器，而PluggableSchemaResolver是用来获取XSD声明文件的解析器**。

------

## 总结

好了，今天的知识点，我们就讲到这里了，我们来总结一下吧。

一张图来梳理下当前的流程：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202303311308377.png)

这一节，我们看了一下EntityResolver类型的参数entityResolver初始化的过程，同时，也了解了Spring源码中校验xml文件的两种方式也就是DTD和XSD，它们分别都有对应的声明文件来规范和校验xml的格式。

并且，我们也看到对于不同校验类型的xml文件，Spring分别准备了不同的解析器去校验它们，BeansDtdResolver负责获取DTD的声明文件，PluggableSchemaResolver负责获取XSD的声明文件。

下一节，我们就来看下这两种解析器，它们是如何获取对应的声明文件及如何获取xml校验类型的吧。