---
title: 22_bean的加载：转换并获取bean的名称
category:
  - Spring源码
star: true
date: 2023-03-31
---

<!-- more -->


## 开篇

根据前面的学习，Spring容器初始化的这条主线我们已经研究完毕，对于初次接触Spring源码的同学而言，Spring容器初始化理解到这个程度就差不多了，接下来我们即将开始bean加载这条新主线的研究。

在bean加载的这条新主线里，我们会看到前面注册到Spring容器中的BeanDefinition，是如何用来实例化也就是创建一个bean的，同时，我们也会看到前面在ApplicationContext初始化时，那些一时半会让我们搞不懂的高级特性是如何在bean加载这个环节发挥作用的。

接下来，我们开始bean的加载环节的分析吧，这一节的内容主要包括以下几个部分：

1. 先看下bean的加载是如何进行的，并且初步找下bean加载的入口位置
2. 初步来看下Spring是如何转换解析并最终获取bean的实际名称的

---

## 寻找加载bean的入口方法

既然现在我们要开始分析bean的加载，那我们得要先找到bean加载的入口在哪，其实Spring的加载时机我们之前已经提到过了，最简单的最直接的方式就是调用Spring容器的getBean方法。

我们来看下前面章节的一段代码：

```java
public class ApplicationContextDemo {

	public static void main(String[] args) throws Exception {
		ApplicationContext ctx = new ClassPathXmlApplicationContext("applicationContext.xml");
		Student student = (Student) ctx.getBean("student");
		System.out.println(student.getName());
	}

}
```

可以看到这是之前我们分析ApplicationContext写的一段代码，其中，bean的加载其实就是从getBean方法开始的，我们可以以getBean方法作为入口，开始分析下Spring是如何加载bean的。

首先，我们以ApplicationContext的getBean方法为入口看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11/20221124193541.png)

可以看到,我们首先来到了AbstractApplicationContext的getBean方法中，方法中也就两行代码，我们先到方法`assertBeanFactoryActive`中瞧一下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11/20221124193555.png)

可以看到在方法`assertBeanFactoryActive`中，只不过是判断下当前的Spring容器，是否被激活了或者是否被关闭了，如果容器还未被激活或发现容器已经关闭了就会抛出异常。

这样做也是合情合理的，毕竟如果Spring容器关闭了或者还未初始化，也就没法让它去加载bean了，至于Spring容器ApplicationContext激活相关的细节代码，之前我们在ApplicationContext初始化环节中的refresh方法里已经看到过了，这里就不重复了。

接下来，我们再回到刚才的位置：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11/20221124193600.png)

可以看到，接下来会通过getBeanFactory方法获取ApplicationContext中的Spring初级容器BeanFactory，然后再调用BeanFactory中的`getBean`方法去加载bean。

首先，通过getBeanFactory方法获取Spring初级容器这一点，在我们前面分析ApplicationContext初始化时，已经看到BeanFactory是如何初始化的了，这一点我们应该不会陌生，而且，现在我们也明白了ApplicationContext其实是通过BeanFactory的`getBean`方法来加载bean的。

有些同学可能会疑惑我们为什么不从初级容器XmlBeanFactory加载bean开始讲解，看到这里，我们可以看到其实**加载bean的核心逻辑**，对于初级容器和高级容器而言其实都是一样的，最后**都是从初级容器的`getBean`方法开始的**。

所以，接下来我们到初级容器的getBean方法中看下吧：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11/20221124193604.png)

看到这里，我们发现了一个比较关键的方法`doGetBean`，前面我们也总结过一点，也就是以do为前缀的方法差不多就是核心方法了，很明显方法doGetBean就是加载bean的核心方法的入口了。

---

## 转换并获取bean的名称

接下来，我们到`doGetBean`方法中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11/20221124193606.png)

可以看到，`doGetBean`方法代码量之多，甚至都已经超过前面处理工厂后处理器BeanFactoryPostProcessor的方法了。

这里需要吐槽一下的就是，Spring的源码中偶尔是会有这样的情况的，一个方法中的代码量动辄几百行，但是，从我们目前分析Spring源码的情况上来看，Spring大部分源码还是层次分明的， 上一层的方法的名称是下一层系列方法的注释比较清晰。

但是不管怎么样，Spring中bean加载的核心逻辑现在都在`doGetBean`方法中，接下来，我们会像之前分析ApplicationContext初始化时的refresh方法一样，通过未来的几讲内容一点点把这块内容逐个来分析清楚。

现在，我们开始来看下`doGetBean`中代码逻辑吧：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11/20221124193610.png)

首先，我们可以看到调用了方法transformedBeanName来处理我们传进来的bean名称，为什么首先要处理bean的名称呢？bean的名称有什么需要处理的地方吗？

带着这些疑惑，我们到方法transformedBeanName中看下是如何处理的：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11/20221124193614.png)

可以看到在方法transformedBeanName中，首先会通过容器的工具类BeanFactoryUtils调用`transformedBeanName`方法来处理name，我们进去看下吧：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11/20221124193616.png)

可以看到，在BeanFactoryUtils的方法`transformedBeanName`中其实就干了一件事，如果发现name以一个或多个符号“&”为前缀，那就剔除掉name前缀中的“&”，直到name前缀中的符号“&”都剔除干净了才返回name。

那为什么要这样干呢？这里先姑且卖个关子，在后面的章节中我们分析到相应的逻辑时再来看，现在我们都不知道为什么要这样做，接下来我们回到上一个方法：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11/20221124193620.png)

已经获取到了剔除前缀符号“&”的name之后，可以看到，现在又把返回值交给了方法`canonicalName`处理，那`canonicalName`方法又会对name做怎样的处理呢？我们到方法里面看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11/20221124193622.png)

可以看到，在方法`canonicalName`中，其实就是通过参数传进来的name，到别名缓存`alilasMap`中获取bean的实际名称，之前我们在BeanDefinition注册到Spring容器之后，也看到了别名的注册逻辑。

canonicalName方法的处理也比较好理解，因为我们是通过getBean方法，让Spring来实例化name对应的bean，那Spring肯定要确保你传进来的bean名称name，得要尽最大的可能获取到Spring容器中的BeanDefinition。

当然，如果用户调用getBean方法时传进来一些错误的name，Spring是无可奈何的，肯定是获取不到相应的BeanDefinition来实例化bean的，但是，如果你传进来的name是bean的别名，那Spring还是有一定的纠错能力的，而**方法`canonicalName`就是Spring将别名转换为bean实际名称的一个方法**。

比如当bean在注册BeanDefinition时，BeanDefinition相应注册的名称为student，但是，如果这个bean的别名同时又被设置为student1，这个时候如果你通过student1这个别名，去Spring容器中获取BeanDefinition当然就获取不到了。

因为在别名缓存`aliasMap`中，存放了bean的别名student1到bean的实际名称student的映射，所以，在方法`canonicalName`中，就可以通过别名缓存`aliasMap`，根据别名student1获取bean的实际名称student，这样Spring再拿着bean的实际名称student，就可以从Spring容器中获取到bean的BeanDefinition了。

---

## 总结

好了，今天的知识点我们就讲到这里了，我们来总结一下吧。

这一节的知识点并不多，作为bean加载的第一篇文章，我们主要找到了bean加载的入口方法，并且初步分析了bean的名称解析并转换相关的代码逻辑，从下一节开始，我们就要开始bean加载的核心逻辑分析了。