---
title: 33_Spring注解源码解析：注解的本质是什么
category:
  - Spring源码
star: true
date: 2023-03-31
---

<!-- more -->

<h1 align="center">33_Spring注解源码解析：注解的本质是什么？</h1>

## 开篇

到目前为止，我们对Spring 容器的初始化和bean的加载过程都做了源码级的剖析，尤其是bean的创建过程，比如bean的实例化和初始化，以及当使用到bean时，bean的整个加载过程是怎样的，只要大家一步一步跟着学习，相信大家都是可以掌握的。

不过呢，之前我们剖析源码的入口是xml配置文件和BeanFactory，在实际项目中，其实我们很少会直接在xml中配置bean，也很少会使用BeanFactory来直接获取bean。

那我们使用最多的方式是什么呢？

那当然是使用Spring提供的各种注解了，比如@Configuration、@Bean、@Component、@Controller、@Service、@Repository、@Autowired、@PostConstruct、@PreDestory等注解，这些注解的源码，我们也会带着大家一步一步的剖析的，等搞定这些注解的源码后，大家会发现，其实不管是xml方式还是注解方式，它们的原理都是一样的。

从这篇文章开始，我们就进入Spring注解源码剖析的章节了，本篇作为注解的第一篇文章，还是比较轻松的，那么我们这篇文章聊什么呢？

其实主要会从下边几个点聊起：

1. 首先大家想过没，平常我们用的注解，它的本质到底是什么？
2. 为啥一旦加了注解，就可以完成一些特定的功能？
3. 在注解中使用的元注解又是什么？

好了，那现在就开始我们今天的内容吧

---

## 注解的本质是什么？

大家可以看到，我们这里定义了一个名字叫做MyComponent的注解

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301301729314.png)

其实呢，注解的本质就是一个接口，只不过是一个继承了Annotation接口的接口罢了

那问题来了，这个要怎么来证明呢？

其实证明过程也很简单，我们直接将@MyComponent注解的class文件反编译看一下不就知道了吗？首先@MyComponent注解的class文件如下

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301301729570.png)

接着我们来反编译一下class文件，通过javap -c命令反编译的结果如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301301729602.png)

大家可以很清晰的看到，我们自定义的这个@MyComponent注解，本质就是一个接口，并且还是一个继承了Annotation接口的接口

并且我们注意到，在反编译的结果中有一个value()方法，那这个value()方法的作用是什么呢？

其实很简单，注解的本质是接口，我们知道在接口中是可以定义常量和方法的，其实在注解中定义的方法就是注解的属性，说白了就是这里定义的value()方法，可以理解为是注解的value属性，就是这个意思

根据经验，我们也知道，当我们使用注解时，是可以选择给注解设置一些属性的，比如value属性，此时其实就是通过value()方法来设置value属性的

所以我们在定义注解时，是可以选择为注解定义一些属性的，比如这个@MyComponent注解，我们就定义了一个value属性，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301301729085.png)

并且每个属性还可以设置默认值，比如这个value属性的默认值我们就设置为了空

说白了就是这个@MyComponent注解中定义了一个value属性，如果使用这个注解时，不给value属性设置值的话，那么这个value属性就默认为空

好了，到这里，我们已经知道了注解的本质，其实就是一个继承了Annotation接口的接口

我们还知道，每个注解都是有一些特定功能的，那么这些特定功能又是怎么和注解“绑定”在一起的呢？我们新增的这个@MyComponent注解的功能又是什么呢？

是这样的，其实每个注解刚定义出来是没有任何功能的，如果想给注解“绑定”一些特定功能，我们需要自己“写代码”来实现，否则这些注解就是一个“标记”的作用，就跟注释一样，没有实际的功能，所以它也不会影响代码的运行结果。

好，那接下来我们就为@MyComponent注解“添加”一些功能吧

---

## 为注解添加功能

先问大家一个问题，那就是注解定义出来是干嘛的？

有的同学会说：那当然是使用的，比如我们可以在类上或属性上添加注解

回答的非常正确，假设我们自定义的这个@MyComponent注解主要是在类上使用的，那么首先我们需要定义出来一个类来使用这个@MyComponent注解，定义好的类代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301301729121.png)

大家可以看到，我们定义的这个@MyComponent注解，直接就加在了这个Student类上，并且给@MyComponent注解的value属性指定了值 test-value

那这个Student类加了@MyComponent注解后，有什么特殊效果吗？说白了就是我们自定义的这个@MyComponent注解有什么功能呢？

其实目前为止，@MyComponent注解还没有任何功能，那不妨我们现在就给@MyComponent注解，“添加”一些逻辑吧

测试类代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301301729281.png)

其实这里代码很简单，首先我们获取Student类的class对象，然后调用class对象的isAnnotationPresent()方法就可以判断类上有没有加指定的注解，比如这里我们就可以判断出在Student类上有没有加@MyComponent注解。

如果Student类加了@MyComponent注解，那么Student类就是我们要处理的目标类，此时我们可以加一些特定的逻辑来处理这个Student类。

不过我们这里的处理非常简单，只是调用了class对象的getAnnotation()方法获取了指定注解的元信息，比如这里就获取到了@MyComponent注解的value属性的值，最后只是打印了一句话，还顺便把@MyComponent注解的value属性的值也给打印了出来

此时我们来执行一下这个main方法来看下效果

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301301729959.png)

看到这个结果，大家是不是很意外？

明明这个Student类上加了@MyComponent注解，但是这里isAnnotationPresent()方法为啥返回false？就好像这个@MyComponent注解没生效一样？

其实呢，我们自定义注解时，必须要搭配元注解一起使用才行，那么元注解又是什么呢？

---

## 元注解又是什么？

元注解其实很简单，说白了元注解就是用于修饰注解的注解，通常用在注解的定义上，java已经帮我们定义了一些元注解，我们直接使用元注解就行了，我们看这里

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301301729921.png)

这个@Retention注解就是一个元注解，它可以控制我们定义的这个@MyComponent注解在什么时候有效，这里指定为RetentionPolicy.RUNTIME的意思是在代码运行时有效

因为平常我们自定义注解，都是要在代码运行时读取这个注解的，所以一定要加上这个@Retention元注解

当然除了这个@Retention元注解外，还有其他的元注解，但是这个元注解不是我们这里的重点，所以这里大家了解下就可以了，如果想深入了解元注解这块，大家可以自行找资料来补充这块的知识，其实元注解是很简单的

好了，给@MyComponent注解添加上@Retention元注解后，我们再来运行main方法来看下效果

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301301729273.png)

大家看到了吧，这个结果符合我们的预期

说白了就是，我们可以通过class对象提供的isAnnotationPresent()方法，来判断指定类上有没有加特定的注解，如果加了特定的注解。同时我们可以通过getAnnotation()方法获取了特定注解的元信息，这样我们就可以根据注解的元信息，很方便的对加了注解的这个类，单独加一些特殊的逻辑，比如打印注解的value值

虽然我们这里的代码很简单，但是足以说明注解的本质了，简单说注解就是一个实现了Annotation接口的接口，它只是一个标记的作用，就跟注释一样，我们可以灵活的给注解“绑定”上一些功能，来方便我们的日常开发。

为了让大家更进一步的理解注解，我们下篇文章会继续来聊注解，不过下节课呢，我们会为@MyComponent注解“绑定”很cool的功能，这里剧透一下，就是模拟Spring提供的@Component注解的功能，我们下篇文章再见。

---

## 总结

好了，今天的知识点，我们就讲到这里了，我们来总结一下吧。

第一，注解的本质就是一个接口，只不过是一个继承了Annotation接口的接口

第二，注解本身是没有任何功能的，顶多就是一个标记的功能，如果想给注解添加特定功能的话，那么需要单独写代码来处理这个注解才行

第三，元注解就是用于修饰注解的注解，通常用在注解的定义上，java已经帮我们定义了一些元注解，我们直接使用元注解就行了