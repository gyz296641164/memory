---
title: 12_Spring初级容器初始化：bean的各种子标签解析
category:
  - Spring源码
star: true
date: 2023-03-31
---

<!-- more -->

## 开篇

上一节，我们了解了Spring是如何解析bean标签上各种各样的属性的，然后将解析到的属性值设置到BeanDefinition中。

bean标签中，除了属性之外当然还包括各种各样的子标签，比如property标签、constructor-arg标签等，接下来，我们就来看下这些子标签是如何解析的吧，这一节主要包括以下几个部分：

1. 先来看下Spring中的各种标签是在哪里开始解析的

2. 然后我们通过一个案例使用下标签constructor-arg

3. 接下来看下constructor-arg标签是如何解析的

4. 最后再来看下property标签又是如何将解析的

---

## 子标签：meta、lookup-method和replaced-method

我们从上一节课看到的位置，继续来分析下：

![image-20221108143859649](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202211081438755.png)

可以看到，bean标签的解析现在就差这些子标签元素element的解析了，首先，我们看到的是解析子标签meta、lookup-method和replaced-method标签。

我们先来看下meta子标签是如何解析的：

![image-20221108143926877](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202211081439924.png)

可以看到解析的过程也是非常简单，就是从bean标签下遍历获取meta标签，然后将解析到属性key和属性value的值封装到`BeanMetadataAtrribute`中。

最后将`BeanMetadataAtrribute`记录到`BeanMetadataAttributeAccessor`中，`BeanMetadataAtrribute`和`BeanMetadataAttributeAccessor`，我们可以理解为是Bean封装属性和访问属性的底层类。

::: info 注意
 lookup-method和replaced-method标签的解析也是类似
::: 

![image-20221108144116716](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202211081441766.png)

![image-20221108144137115](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202211081441189.png)

正如我们看到的一样，`meta`、`lookup-method`和`replaced-method`标签的解析过程也就这样，可能有些同学都不太明白这几个子标签到底有什么用，其实，**这几个标签我们在日常开发中确实也几乎都用不到，所以，我们简单看下就行了**。

相比于标签meta、lookup-method和replaced-method而言，constructor-arg标签和property标签在工作中用到的概率还会更大一些，接下来，我们重点来看下这两个标签是如何解析的。

---

## constructor-arg标签的使用

我们先来简单看一下constructor-arg标签是如何使用的，首先，我们写一个简单的java类，还是以Student类举例：

![image-20221108144425675](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202211081444741.png)

可以看到，Student类非常的简单，包括一个String类型的变量name，和一个int类型的变量age，另外，还添加了一个包含name和age参数的构造方法。

而`constructor-arg`标签的功能，就是在Spring在创建bean的时候，给bean的构造方法传入参数。

接下来，我们在applicationContext.xml中配置下Student类：

![image-20221108144453998](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202211081444046.png)

可以看到，在bean标签下我们添加了constructor-arg标签，标签中的属性就是构造方法中的参数名称，而value标签配置的为参数的值，可以看到我们配置了两个constructor-arg标签，对应构造方法中的两个参数。

其实，constructor-arg标签也支持我们按照参数index，也就是参数位置来指定参数的值：

![image-20221108144511279](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202211081445329.png)

可以看到，在constructor-arg标签中，因为index属性是从0作为起始下标的，index为0表示第一个参数name，index为1为第二个参数age。

最后，我们再通过代码来测试下：

![image-20221108144530130](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202211081445179.png)

运行一下代码，看下效果：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202211081445317.png)

可以看到，构造方法的参数name和age的值，成功通过constructor-arg标签传入，constructor-arg标签的使用无非也就是这样，接下来，我们再来针对性的看下Spring是如何解析constructor-arg标签的吧。

---

## constructor-arg标签的解析

接下来，我们再回到之前分析的地方:

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202211081446277.png)

首先，我们到方法parseConstructorArgElements中看下constructor-arg标签是如何解析的：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202211081446572.png)

可以看到，先从bean标签下获取所有的子节点，然后找到名称为constructor-arg的标签，再调用方法parseConstructorArgElement进一步解析。

我们跟进到方法parseConstructorArgElement中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202211081447546.png)

可以看到方法中的东西还是蛮多的，一眼看过去可能晕，但是，仔细看了下发现无非也做了几件事而已，首先将constructor-arg标签中的属性index、type和name的值都解析出来。

接着可以看到，首先会判断属性indexAttr属性是否存在，然后因为我们刚才在案例中也看到了，在constructor-arg标签中，要么使用index属性来配置参数，要么就是用name属性来配置参数，所以，根据是否配置了indexAttr属性，我们可以看到出现 了两个分支。

在这两个分支中分别有对应的解析方式，且最终解析出来的结果和我们之前分析的一样，都封装在了BeanDefinition中。

---

## constructor-arg标签属性的解析

在方法parseConstructorArgElement中的两个分支中，有一个相同的方法也就是parsePropertyValue，它就是用来解析constructor-arg标签下的所有子标签和属性的。

在xml的constructor-arg标签下，可能会配置各种各样的属性值，除了刚才案例中看到的name、index属性以及value标签之外，还有其他数据结构对应的子标签，如array标签、list标签、set标签、map标签、props标签等，这些属性标签都可能在constructor-arg标签下，为什么呢？

因为一个bean的构造方法的参数类型是多种多样的，bean构造方法中参数类型为List、Set、Map等都是合情合理且大概率可能会出现的，Spring对这些情况都会极尽考虑，所以在方法parsePropertyValue中会依次去解析各种各样的子标签的值。

那Spring具体是如何解析的呢，我们就要到方法parsePropertyValue中看下了：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202211081448966.png)

关于标签解析这部分的代码，可以看到，一方面细节确实是太多了，容易让人头晕，我们快速过一遍把握那些关键的点和主流程就可以了。

在parsePropertyValue方法中，首先是获取constructor-arg标签下的所有子节点nl，然后在遍历这些子节点时，将description和meta标签剔除掉不处理。

一旦发现有这两个类型之外的标签存在时，就记录到子标签元素subElement中，准备进一步的解析，当然这里subElement指的就是我们刚才提到的array标签、list标签、set标签等子标签。

我们继续看下去：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202211081448331.png)

可以看到，接下来开始判断在constructor-arg标签中，是否配置了属性ref和属性value的值。

属性ref和value我们都比较熟悉，ref是引用另外一个bean依赖的，而value是配置具体的值的，两者只能同时出现其中一个，ref属性和value属性在使用时只能二选一，当然，我们在代码中也看到了如果两者同时存在就会报错提示。

然后开始对ref属性和value属性分别进行解析处理，将解析到的属性值封装到BeanDefinition中，但是，如果既没有配置ref属性，也没有配置value属性，甚至还没有配置子标签的话，这是不允许的，在最后的一个else分支中，我们也看到了会报错。

但是，如果constructor-arg标签配置了子标签的话，也就是我们刚才记录的subElement不为空，就会调用方法parsePropertySubElement进行进一步的解析子标签元素subElement。

很显然，这里才是解析子标签的关键，我们进去看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202211081448243.png)

可以看到，在方法parsePropertySubElement中又调用了一个重载方法parsePropertySubElement，我们继续进去看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202211081448367.png)

终于，我们看到了在方法parsePropertySubElement在解析各种各样的标签，同时，Spring考虑子标签的周全程度，也远超乎我们的想象。

包括ref标签、idref标签、value标签、null标签等，当然，我们刚才提到的array标签、list标签、set标签、map标签、props标签也都在解析的范围之内，具体怎么解析，其实相关的API调用也大差不差，如果没有一些特定的需求的话，我们看到这个程度也就差不多了。

---

## property标签的解析

回到之前解析constructor-arg标签位置：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202211081448751.png)

最后，再来看下property标签是如何解析的，我们到parsePropertyElements方法中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202211081448658.png)

可以看到，和之前解析constructor-arg标签一样，先获取bean标签下的所有子标签，然后从这些子标签中找到property标签进行解析。

我们再到parsePropertyElement方法中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202211081449719.png)

可以看到，property标签的解析理解起来就比较简单了。

首先获取property标签中的name属性的值，如果发现之前已经解析过相同名称的property标签是会报错的，也就是说在同一个bean标签中，是不允许存在相同名称的property标签的。

然后，我们可以看到调用了方法parsePropertyValue方法：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202211081449026.png)

方法parsePropertyValue我们刚才已经分析过了，其实就是在解析各种各样的子标签而已。

然后可以看到，会将解析到的结果封装为PropertyValue，再将PropertyValue添加到BeanDefinition相应的数据结构中。

总的来说，标签的解析过程虽然细节非常的多，当然，我们也没必要强迫自己记住每个环节，了解它解析了哪些东西就差不多了，如果哪天需要深入的分析某个标签的解析，我们也可以回过头来针对性的研究。

不管怎么样，我们现在已经了解了在xml配置文件中那些让人眼花缭乱的标签配置，其实在Spring源码中都是有实实在在代码解析的。

------

## 总结

好了，今天的知识点，我们就讲到这里了，我们来总结一下吧。

一张图来梳理下当前的流程：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202211081449547.png)

这一节，我们看了下bean标签中的各种子标签的解析，而且我们发现光是标签中的属性解析，代码量就恐怖的吓人，但是不管怎么样，我们也算是看到这些标签在哪里解析的了，并且解析得到的信息也都是封装在BeanDefinition中的。

接下来，就差最后一步了，也就是说我们千辛万苦将bean标签的各种属性、各种子标签的信息都封装到了BeanDefinition之后，BeanDefinition又是如何注册到Spring容器中的呢，下一节我们来揭晓这块内容。