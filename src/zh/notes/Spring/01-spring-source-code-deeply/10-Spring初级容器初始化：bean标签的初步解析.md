---
title: 10_Spring初级容器初始化：bean标签的初步解析
category:
  - Spring源码
star: true
date: 2023-03-31
---

<!-- more -->

## 开篇

上一节，我们已经寻找到了默认标签解析的入口，也就是方法parseDefaultElement，千辛万苦总算是到了标签的解析环节了。

这一节，我们就顺着方法parseDefaultElement，来看下Spring是如何解析标签的，主要包括以下几个部分：

1. 从parseDefaultElement方法开始，看下解析bean标签解析的入口
2. 再来看下bean标签一开始会解析些什么东西，当然这部分也仅仅只是标签的初步解析
3. 最后我们会看到，在解析bean标签时会创建BeanDefinition来存放标签解析的信息

----

## bean标签解析的入口

这一节，我们沿着上一节分析的位置，继续来看下parseBeanDefinitions方法，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202304041446556.png)

我们到方法parseDefaultElement中，看下Spring是如何解析默认标签的：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202304041446311.png)

可以看到，方法parseDefaultElement的结构就变的挺清晰了，我们看下这几个常量是什么：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202304041446389.png)

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202304041446256.png)

可以看到，这些不就是标签的名称吗，比如标签bean、alias、import、beans。

因为标签alias和标签import在实际开发中现在用的都比较少了，我们的重点还是来分析下最核心的bean标签的解析，我们直接到processBeanDefinition方法中看下吧：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202304041446992.png)

跟进到方法processBeanDefinition里面看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202304041446911.png)

可以看到，果然还是通过我们之前分析的那样委托BeanDefinitionParserDelegate来帮我们解析。

那BeanDefinitionParserDelegate具体会如何解析默认标签bean呢？我们再到delegate的parseBeanDefinitionElement方法中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202304041446482.png)

第一步并没有什么东西，我们继续跟进到方法parseBeanDefinitionElement中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202304041446406.png)

光是看一眼方法，我们就知道bean标签的解析是有多么复杂，但是，这也是值得我们去分析的，接下来，我们就一步步来分析下bean标签解析中的各个环节。

------

## bean标签的初步解析

我们先看到方法parseBeanDefinitionElement中的前两行代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202304041446667.png)

可以看到，首先是获取bean标签中的属性id的值，以及属性name的值nameAttr，这一点我们应该不会很陌生，一般我们在bean标签中都会配置属性id。

接下来，如果name属性的值nameAttr不为空的话，会通过方法`StringUtils.tokenizeToStringArray`进行分割：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202304041447757.png)

其中，MULTI_VALUE_ATTRIBUTE_DELIMITERS的值为 ",; "，也就是说在配置属性name的值时，可以通过“，”或“；”作为分隔符，配置多个name属性值。

比如name属性的值为“student，students”，分割后可以得到nameArr数组为 [“student”，“students”]，然后将数组添加到aliases集合中。

那aliases集合有什么用呢？我们继续看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202304041447443.png)

可以看到，当id属性值为空时，就会从aliases集合中调用方法remove(0) ，来获取第一个元素作为beanName的值，当然，以上都是bean标签解析前的一些准备工作。

我们继续往后看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202304041447702.png)

根据方法名parseBeanDefinitionElement，我们应该也能猜到，差不多这里就是解析bean标签的关键方法了。

不得不再吐槽一点的就是，Spring中方法的各种嵌套对于初次研究源码的人而言，还真的是一个让人头皮发麻的事，但是，既然是研究Spring源码我们就尽可能耐心点来吧。

接下来，我们再到方法parseBeanDefinitionElement中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202304041447957.png)

可以看到，还是继续解析bean标签中的属性，分别获取属性class的值className，及属性parent的值parent，然后将这个两个属性的值传入方法createBeanDefinition中，构建一个AbstractBeanDefinition类型的对象bd。

------

## BeanDefinition的创建

那在createBeanDefinition方法中到底在干什么呢？我们进去看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202304041447003.png)

可以看到，在createBeanDefinition方法中，BeanDefinitionReaderUtils又调用方法createBeanDefinition进一步处理，继续往下看：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202304041447339.png)

可以看到，实际上是创建的BeanDefinition为GenericBeanDefinition，并且将parent和class属性的值都设置到GenericBeanDefinition之后并返回。

那GenericBeanDefinition是什么呢？分析到这里，不知道大家还记得我们前面提到过的，一个bean在Spring容器中其实是以BeanDefinition的形式存在的，也就是说我们在xml中的配置的一个bean标签，在Spring容器中存在的形式就是BeanDefinition。

但是，BeanDefinition只不过是一个接口，我们刚也看到了，Spring在解析bean标签时会为我们创建一个GenericBeanDefinition出来，用于存放bean标签解析出来的各种信息，所以，接下来我们有必要来了解下什么是GenericBeanDefinition。

------

## 总结

好了，今天的知识点，我们就讲到这里了，我们来总结一下吧。

我们及时在整体流程图中记录一下当前的分析情况：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202304041447037.png)

这一节，我们终于找到了bean标签解析的核心入口了，而且，通过我们对方法的层层跟进，发现已经开始解析bean标签中的一些属性了，比如属性id、name、class和parent。

同时，我们也看到了Spring会创建BeanDefinition的实现类GenericBeanDefinition，用于存放bean标签解析结果。

那GenericBeanDefinition是什么呢？BeanDefinition还有其他哪些实现类呢？不同的BeanDefinition接口实现类之间，又有什么区别呢？下一节，我们好好来看下BeanDefinition。