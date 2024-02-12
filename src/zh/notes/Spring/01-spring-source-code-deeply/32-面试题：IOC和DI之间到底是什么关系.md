---
title: 32-面试题：IOC和DI之间到底是什么关系
category:
  - Spring源码
star: true
date: 2023-03-31
---

<!-- more -->

<h1 align="center">32_面试题：IOC和DI之间到底是什么关系？</h1>

## 开篇


要彻底搞清楚IOC和DI的区别，那么就需要从它们要解决的问题入手，所以本篇文章会按照下边的思路进行探讨：

1. 首先我们要知道对象中的依赖关系，到底是什么意思？
2. 然后这种依赖关系会导致什么样的问题？
3. 接着为了解决过度耦合问题，IOC和DI分别扮演着什么样的角色？
4. 最后大名鼎鼎的Spring是怎么支持依赖注入的？

---

## 面试场景再现

现在呢，你正在参加一家互联网公司的面试，你和面试官刚聊完Spring容器的初始化过程，由于你好好学习了本Spring容器的初始化章节，并且自己课下也调试了一遍，所以在面对这个问题时，你侃侃而谈，从而赢得了面试官的好感，接着面试官提出了下一个问题。

面试官：“不错不错，Spring容器的初始化过程研究的非常深入，那我们接着聊下DI吧，你可以说下IOC和DI之间到底是什么关系吗？”

听到这个问题后，你心中想：“这俩玩意儿不是同一个东西吗？有啥子关系？？？”

此时你口中慢慢吐出了句：“IOC就是控制反转，就是创建对象的权利由程序交给了IOC容器，而DI是依赖注入，它俩描述的是同一件事儿”

面试官：“说的稍微含糊了一点，可以具体聊聊IOC和DI之间的关系吗？”

此时你口中慢慢吐了句：“这个，这个我之前没有研究过。。。”

面试官：“好吧，没事儿，我们进入下一个问题”

此时虽然面试官表面上说没事儿，但是你在面试官心中好不容易留下的好印象，就因为这个问题付之东流了，重要的是面试官心中可能开始质疑你了。。。

不过没关系，今天学完了这篇文章，这个问题就再也难不住你了，大家都是程序员，所以最好的沟通方式当然是代码，所以本篇文章直接通过一段非常简单的代码，来讲解IOC和DI的区别

好，那么接下来就show me the code

---

## 什么是依赖关系？

DI的全称是Dependency Injection，中文翻译过来就是依赖注入的意思，要理解DI是什么，那么就需要先了解，依赖注入中的“依赖”到底指的是一种什么样的关系

为了方便解释这个问题，我们来创建一个手机接口Phone和2个实现类，分别是Iphone12和Iphone13，创建好的代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301301551411.png)

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301301551517.png)

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301301551109.png)

接着我们创建一个Student类和一个测试类，代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301301552231.png)

其实代码很简单，在Student类的playGame()方法中，new出来了一个IPhone12对象，然后调用了IPhone12的playGame()方法完成玩游戏的动作

此时手机phone的控制权在Student类的手上，因为是Student类创建出来了phone对象

最后我们搞了一个测试类，代码非常简单，其实就是new出来了一个student对象，然后直接调用student对象的方法，我们就可以看到如下的打印结果

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301301552555.png)

其实像这种学生和手机的关系就是一种依赖关系，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301301552839.png)

大家想下，为什么学生和手机是依赖关系呢？

因为在这个场景中，没有手机是不能玩王者荣耀的，所以学生想玩游戏，必须要先new出来一部手机才行，也就是说学生类必须要依赖于手机类才行，此时依赖的这个手机类就是类IPhone12，这个时候我们通常说Student类依赖IPhone12类

说白了就是，想做一件事儿时必须要依靠另外一个东西，如果没有这个东西的话，这件事儿就办不成，这个就是依赖关系。就比如学生想玩王者荣耀这件事儿就必须要依赖于手机，如果没有手机的话，就没办法玩王者荣耀，就是这个意思

好了，现在依赖关系我们已经知道了，那什么又是依赖注入呢？

---

## 依赖关系会带来什么问题？

在聊依赖注入之前，我们先来看看现在这种做法存在什么问题，我们看这里

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301301552901.png)

大家可以看到，在Student类中直接new出来了一个IPhone12对象，此时Student类严重依赖于IPhone12类

这样就会带来一个问题，那就是当IPhone12类出问题时，比如人家IPhone12改造了自己的构造方法，那Student类中创建IPhone12对象的地方也要跟着改造

这个场景就好比是，张三每天都使用IPhone12这部手机来玩王者荣耀，某天IPhone12这部手机出现了问题，比如开不了机了，此时张三就玩不了王者荣耀了，不过土豪张三哥还有一部IPhone13可以用来玩王者荣耀。

但是现在问题来了，由于之前张三和上部手机IPhone12已经深度耦合了，如果张三要换手机，那么他就需要来改造自己，说白了就是将自己内部所有的IPhone12改造成IPhone13才行，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301301552790.png)

此时张三就可以使用Iphone13玩游戏了，测试类打印结果如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301301552605.png)

但是一想到还要改造自己（也就是改造代码），这个时候土豪张三哥就不爽了，张三哥仰天大吼：“老子手机这么多，想用哪个手机玩就用哪个手机玩，为啥还要改造我自己？”

但是就算土豪张三哥再不爽，也改变不了要改造他自己的事实，这个就是依赖关系带来的过度耦合问题。

说白了就是现在Student类和IPhone12类严重耦合在了一起，未来一旦IPhone12发生了问题，那么Student类内部就需要进行改造，说白了就是改代码，比如将new Iphone12()修改为new Iphone13()

这还是只有Student类和IPhone12类这2个类耦合的情况，如果项目中大部分的类都这样耦合在一起，那么可以想象这是多么可怕的一件事儿

---

## IOC思想的落地，使用DI来完成解耦

那么刚才这个问题有没有什么破解之法呢？

那当然是有的，其实我们可以通过IOC的思想来解决这个问题的，说白了就是控制反转这种思想

其实问题的根本原因，就是由于Student类过度依赖于Iphone12类导致的，控制反转就是说，Student类不用自己亲自来new Iphone12对象了，而是把对这个Iphone12类的控制权交给外部来搞

那现在问题来了，控制反转只是一种思想罢了，具体要怎么来落地呢？也就是要用什么办法才能实现控制反转呢？

此时本篇文章的重点就来了，办法当然是有的，那就是通过依赖注入来落地控制反转的思想，是白了就是通过DI来实现IOC思想

此时我们使用依赖注入来改造Student类的代码，改造后的代码如下

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301301552215.png)

大家可以看到，改造后的Student类不再是自己new手机类了，而是新定义了一个手机变量phone，而这个phone变量是通过构造方法传递进来的

最后我们来看下测试类的main方法是怎么来玩儿的，大家可以看到，在创建这个student对象时，通过构造方法传递进去了一个手机phone，那这个phone是谁呢？我们可以看到phone变量是随机在Iphone12和Iphone13中挑选的

最后这个phone变量被传递进了student对象中，然后我们再执行student对象的playGame()方法，然后我们看下打印结果

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301301553354.png)

大家可以看到，张三随机到了Iphone12来玩游戏，那么我们多执行几次，再看下结果

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301301553841.png)

大家多执行几次就会发现，这次张三又随机到了Iphone13来玩游戏

这个其实就是依赖注入，说白了就是这个手机phone变量不是Student类自己new出来的，而是通过外边，也就是main方法给Student传递进去的，就像给病人体内打针注入药物一样，就将这个phone给注入到Student中了

说白了就是通过这个依赖注入、让控制反转这种思想真正落地了，我们看这里

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301301553319.png)

大家可以看到，通过依赖注入，Student类不用自己关心手机phone的创建了，也就是失去了phone的控制权，而是将这个控制权交给了外部，然后外部创建好这个phone后，直接通过Student类的构造方法注入到Student中去

此时对于张三同学来说，他是不用管这个phone变量究竟是Iphone12还是Iphone13，对于他来说，只要能玩游戏就ok了，其他的他是不管的，你只要将手机交给他就ok了

此时大家明白了IOC和DI的关系了吧？

说白了IOC，也就是控制反转，它只是一种思想，而依赖注入是实现这种思想具体的办法，比如这里就是通过构造方法的方式将依赖的手机phone注入到了Student中，从而实现了Student类和Iphone12类的解耦

那么大家想一下，这样做带来的好处是什么呢？

其实很简单，假如未来Iphone12类过时了，不推荐使用了，那么外部传入phone变量时，由Iphone12类的对象替换为Iphone13类的对象就可以了，因为控制权在外部，而不在于Student类，因此Student类根本不需要进行改造，说白了就是对象之间解耦了，对象替换变得非常简单了

那么依赖注入是不是只有构造方法注入这一种方式呢？

其实并不是，依赖注入主要有构造方法和属性setter 2种方式，其他的方式其实也不常用

好了，到了这里，大家已经搞清楚了IOC和DI的区别了，既然讲到这里了，我们不妨接着来看下Spring是怎么支持依赖注入的吧

---

## Spring是怎么来支持依赖注入的？

Spring支持了多种方式来完成依赖注入，不过我们常用的就是构造方法、setter方法、注解这三种了，以构造方法方式为例，我们来看下Spring是如何支持依赖注入的，首先来看下bean的定义

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301301553441.png)

一旦bean交给Spring容器来管理，那么我们使用时，直接从Spring容器中获取就可以了，如下图

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301301553809.png)

执行测试类的main方法后，打印结果如下

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301301553906.png)

当然在实际开发中，大家常用的依赖注入方式肯定是注解的方式，说白了就是大家常用的@Autowired注解

那么Spring @Autowired注解的原理到底是什么呢？

这个大家不用着急，我们后边会带着大家一步一步的来剖析@Autowired注解的源码的，大家敬请期待。