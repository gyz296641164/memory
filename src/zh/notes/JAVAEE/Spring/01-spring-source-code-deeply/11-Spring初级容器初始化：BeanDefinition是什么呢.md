---
title: 11_Spring初级容器初始化：BeanDefinition是什么呢？
category:
  - Spring源码
star: true
date: 2023-03-31
---

<!-- more -->

## 开篇

上一节，我们已经分析到了bean标签具体解析的环节了，也初步解析了bean标签属性的值，如id、name、class和parent，而且Spring还单独创建了GenericBeanDefinition来存放这些属性的值。

但是，我们可以确定以上的解析只是开始，在继续分析源码之前我们有必要来了解下GenericBeanDefinition，方便我们后续理解Spring其他各个环节的源码，这一节主要包括以下几个部分：

1. 了解下BeanDefinition的类继承体系，看下常见的都有哪些BeanDefinition实现类
2. 再来简单看下常见两个BeanDefinition实现类都有什么样的区别，为什么要这样设计这些实现类
3. 最后我们简单看下BeanDefinition中有哪些东西，并沿着上节课的源码分析，看下后续的解析流程是怎样的

---

## BeanDefinition的继承体系

要了解GenericBeanDefinition，我们还得要先从BeanDefinition开始：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202304041538193.png)

可以看到，BeanDefinition其实就是一个接口。

我们之前说过，在Spring容器中的每一个对象都称为bean，每个bean在Spring容器中都是以BeanDefinition的形式存在的，BeanDefinition设计的初衷就是为了存放了bean的信息的，也就是bean的定义。

但是，我们也发现BeanDefinition终究是一个接口，有了接口就有对应的实现类，那常见的BeanDefinition接口实现类的都有哪些呢？不同的BeanDefinition接口实现类都封装了怎样的bean信息呢？

我们结合BeanDefinition的类继承图来了解一下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202304041538803.png)

可以看到，直接实现BeanDefinition接口的为抽象类AbstractBeanDefinition，而继承抽象类AbstractBeanDefinition的有三个类，分别是RootBeanDefinition、ChildrenBeanDefinition和GenericBeanDefinition，其中就有我们前面看到的GenericBeanDefinition。

其中，单个bean标签解析后在Spring容器中，起初是通过RootBeanDefinition来表示的，就像这样：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202304041538512.png)

因为bean标签中没有设置parent属性的值，也就是说它没有指定自己的父bean，所以可以使用RootBeanDefinition来封装该标签的信息，表示存放的是bean标签的根节点信息。

另外，我们可以看到在RootBeanDefinition的setParentName方法中，如果参数parentName不为空还会报错：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202304041538249.png)

很显然，通过RootBeanDefinition来封装bean的信息时，就不允许再有“父亲”了。

但是，如果bean标签中设置了parent属性，就像这样：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202304041538287.png)

可以看到，id属性值为child的bean标签，将parent属性的值设置为student，也就是说它将id为student的bean标签作为自己的父标签，这个时候Spring就会将id为child的bean标签的信息，封装在ChildBeanDefinition这个类中。

---

## GenericBeanDefinition和AnnotatedGenericBeanDefinition

RootBeanDefinition和ChildBeanDefinition在早期的Spring版本中，大概也就是这样来使用的，但是，随着Spring后续版本的迭代，Spring更加的推荐我们使用GenericBeanDefinition：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202304041542766.png)

可以看到，从Spring 2.5版本开始，Spring就推荐我们使用GenericBeanDefinition来替代RootBeanDefinition和ChildBeanDefinition，如果是子标签，GenericBeanDefinition也可以通过调用setParentName方法来设置parent属性值。

GenericBeanDefinition包含了RootBeanDefinition和ChildBeanDefinition的所有公共属性和方法，是一个更通用更一站式的BeanDefinition，上一节我们也看到，当下Spring版本中创建的BeanDefinition就是GenericBeanDefinition类型了。

最后，我们再看到刚才的类继承图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202304041542479.png)

那AnnotatedGenericBeanDefinition是什么呢？其实，RootBeanDefinition、ChildrenBeanDefinition和GenericBeanDefinition都是用来封装从xml中解析来的bean信息，而AnnotatedGenericBeanDefinition从名称上我们也可以看出一点，那就是用来封装和注解相关的bean。

也就是说，**`AnnotatedGenericBeanDefinition`专门是用来封装从注解扫描解析来的bean**，比如@Bean、@Component、@Service、@Repository这些注解标注的类，后面我们分析到注解那块源码再详细来看下吧。

---

## BeanDefinition中有哪些东西

现在我们已经知道了BeanDefinition中都包含了bean的所有信息，也大概了解了一下BeanDefinition都有哪些实现类，那BeanDefinition中都有哪些东西呢，我们来看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202304041559832.png)

可以看到，在BeanDefinition中，都只是一些属性相关的方法而已。

因为我们现在已经知道了，xml中的所有配置都是封装在GenericBeanDefinition中的，但是，毕竟GenericBeanDefinition只是一个实现类，考虑到几乎所有的BeanDefinition都继承了抽象类AbstractBeanDefinition，一些通用的属性还是保存在AbstractBeanDefinition中的。

我们再到AbstractBeanDefinition类中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202304041559568.png)

可以看到，在AbstractBeanDefinition中果然封装了很多公共的属性。

不管我们是否认识它们，我们现在心里都有一个把握了，那就是Spring容器中的每个bean中的信息都是封装在BeanDefinition中的，其中AbstractBeanDefinition作为实现了BeanDefinition接口的抽象类，包含了xml以及注册类型bean的大量公共属性和方法。

但是，如果现在要把AbstractBeanDefinition中的每个属性，都研究的非常透彻也是非常困难的，毕竟我们得要到具体的代码逻辑中才能更好的理解，比如后面我们在bean加载的环节，这里面的各种属性才会派上用场。

好了，接下来我们接着上一节的源码流程，继续来看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202304041559933.png)

可以看到，上一节我们通过createBeanDefinition方法创建了GenericBeanDefinition对象。

接下来，我们接着看下parseBeanDefinitionAttributes方法在干什么，从方法名称我们应该可以猜到应该就是要解析所有的属性了：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202304041559921.png)

可以看到，方法parseBeanDefinitionAttributes中果然在解析各种各样的属性，当然我们并不需要死记硬背这些属性，只需要知道都是在这个环节解析出来就行了，并且这些属性和id、name、class和parent一样都会封装在GenericBeanDefinition中。

当bean标签的各种属性解析完了之后，接着就会开始解析bean标签下的各种子标签了：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202304041559612.png)

可以看到，在这些子标签中，包括meta、lookup-method、replaced-method、constructor-args、property和qualifier，其中我们比较熟悉的还是标签constructor-args和property，下一节，我们就来看下Spring是如何解析这些子标签元素的。

------

## 总结

好了，今天的知识点，我们就讲到这里了，我们来总结一下吧。

这一节，我们主要来了解了下BeanDefinition接口体系大概都有哪些类，包括用来封装xml中bean信息的RootBeanDefinition和ChildBeanDefinition，后续为了方便统一改用GenericBeanDefinition来封装xml解析后的bean。

最后，我们还看了下BeanDefinition中包含各种各样的属性，也从Spring的源码中看到各种各样的属性解析和封装过程。

下一节，我们看下Spring中常见的一些标签是如何解析的，到时候大家对于xml中，各种眼花缭乱的标签配置的处理，心里大概也就有个底了。