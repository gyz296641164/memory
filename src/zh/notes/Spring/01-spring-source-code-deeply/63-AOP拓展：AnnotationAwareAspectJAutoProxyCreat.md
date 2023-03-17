<h1 align="center">63_AOP拓展：AnnotationAwareAspectJAutoProxyCreat</h1>

## 开篇

大家好，到目前为止，jdk代理和cglib代理的创建流程和执行流程就全部分析完毕了，那么这节我们讲什么呢？其实我们这节需要填前边的一个坑。

大家还记得我们分析AOP的入口吗？

如果大家不记得，也没关系，我们看下边这张图：![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/25993900_1647063296.png)

当时我们找创建AOP代理的入口时，通过debug，发现了上边几个beanPostProcessor，然后我们通过名字，猜测AnnotationAwareAspectJAutoProxyCreator这个beanPostProcessor很有可能就是创建AOP代理的入口，因为这个beanPostProcessor的名字实在是太具象了，还好最后它没有辜负我们，创建AOP代理的入口还真的是AnnotationAwareAspectJAutoProxyCreator。

那么大家有没有思考过一个问题，那就是AnnotationAwareAspectJAutoProxyCreator也是Spring中的一个bean，那么这个bean在什么条件下才会注入进来？它的注入过程又是怎么样的呢？

可能之前，大家的精力都放在了AOP代理源码本身了，而忽略了这个知识点，不过没关系，因为这节，我们就是要来分析AnnotationAwareAspectJAutoProxyCreator的注入过程。

那么在开始分析之前，先来介绍下本节的主要内容，如下：

1. 首先我们会先来看下AnnotationAwareAspectJAutoProxyCreator的注入时机
2. 然后会介绍下命名空间URI到底是什么
3. 接着会看下，通过spring.handlers获取命名空间处理器全限定类名的过程
4. 最后会来看下，利用反射创建命名空间处理器的过程

---

## AnnotationAwareAspectJAutoProxyCreator的注册时机

现在呢，我们要来分析的是，创建AOP代理的入口，也就是AnnotationAwareAspectJAutoProxyCreator这个bean的注入过程，那么大家还记得，创建AOP的开关是哪个配置项吗？

此时可能有的同学说：那还不简单，就是下边这个配置项啊

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303171607322.png)

同学，你说的不错，开启AOP的功能确实是上边这个aop:aspectj-autoproxy标签，其实换句话说，只有配置了aop:aspectj-autoproxy标签，就表示要打开AOP功能，那么此时才会创建AOP代理。

那么下边重点来了，既然AnnotationAwareAspectJAutoProxyCreator是创建AOP代理的入口，那这个AnnotationAwareAspectJAutoProxyCreator和aop:aspectj-autoproxy标签之间有什么关系？

其实呢，关系很简单，那就是只有配置了aop:aspectj-autoproxy标签，IOC容器中才会注入AnnotationAwareAspectJAutoProxyCreator这个bean

而如果xml中没有配置aop:aspectj-autoproxy标签，那么对不起，此时表示不需要创建AOP代理，那自然也就用不到AnnotationAwareAspectJAutoProxyCreator这个bean了，既然用不到，那当然不用来注册这个bean啦，就这么简单

那怎么证明这个结论呢？

其实很简单，我们使用debug大法来看下就知道了

当配置aop:aspectj-autoproxy标签时，debug结果如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303171609472.png)

当未配置aop:aspectj-autoproxy标签时，debug结果如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303171609269.png)

通过上边两张图，可以看到，只有配置了aop:aspectj-autoproxy标签的情况下，才会注入AnnotationAwareAspectJAutoProxyCreator这个bean。

那么这是通过debug的方法简单粗暴得到的结论，那么在配置aop:aspectj-autoproxy标签时，AnnotationAwareAspectJAutoProxyCreator的注入过程到底是怎么样的呢？

这个就需要我们一点一点来进行分析了。

---

## AOP标签的命名空间URI是什么？

好，那接下来，我们就来分析下AnnotationAwareAspectJAutoProxyCreator的注入过程吧

现在我们知道，既然aop:aspectj-autoproxy标签配置与否，会决定AnnotationAwareAspectJAutoProxyCreator是否应该注入，那么我们分析的入口必然就是aop:aspectj-autoproxy标签，这个标签就是我们的突破口。

那接下来我们就从aop:aspectj-autoproxy标签开始分析，既然要分析标签，那么必然就要从标签的解析开始看起啦。

说起标签的解析呢，我们之前在IOC部分给大家详细讲解过，大家看下边这张图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303171609368.png)

上图呢，是当时我们分析标签解析的一个方法，我们就从这个地方开始分析，通过我们之前对标签的讲解，我们知道aop:aspectj-autoproxy标签其实是属于自定义标签，所以接下来，当然会走自定义标签的解析处理啦，也就是parseCustomElement()方法。

那接下来，我们就来看下parseCustomElement()方法中，是怎么解析自定义标签的吧，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303171609794.png)

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303171609529.png)

通过上边的图，我们可以看到，首先就是获取标签元素对应的命名空间URI，也就是namespaceUri，那么这个命名空间URI又是什么呢？

我们来看下图：![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303171609513.png)

其实上图红框中的http://www.springframework.org/schema/aop就是AOP的命名空间URI，因为我们只有引入这个AOP的命名空间URI，才能使用AOP相关的标签，比如`aop:aspectj-autoproxy`标签。

---

## 通过spring.handlers获取命名空间处理器全限定类名

好了，知道什么是命名空间URI后，我们接着往下看代码，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303171609775.png)

通过上图，我们可以看到，在获取到命名空间URI后，就会执行resolve()方法了，并且将命名空间URI作为入参传递了进去，最后这个resolve()方法返回了一个命名空间处理器NamespaceHandler。

那也就是说，通过这个resolve()方法，可以获取到命名空间URI对应的命名空间处理器，那么resolve()方法的处理过程到底是怎么样的呢？

接下来我们就进入resolve()方法一探究竟，此时我们会看到下边的代码，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303171609980.png)

大家可以看到，上图就是通过命名空间URI获取命名空间处理器的代码了，那么我们接下来一点一点来分析。

首先刚进入这个方法时，会执行下边这行代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303171610397.png)

那么上边这行代码在干嘛呢，我们跟踪进去看下吧，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303171610062.png)

通过上图，大家可以看到，其实最核心的还是红框中的代码，其他的代码明显是将读取到的配置进行了缓存，说白了就是使用缓存做了优化，不用每次都来读取一遍配置，不过这个不是重点，重点还是红框中的那行代码。

可以看到，这行代码明显是来读取配置文件的，那读取的到底是哪个配置文件呢？

其实答案就隐藏在handlerMappingsLocation这个变量中，那这个handlerMappingsLocation变量的值是多少呢？

我们一起来找一下这个handlerMappingsLocation变量是在哪里进行赋值的，此时我们会找到下边这块代码，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303171610477.png)

通过上图，我们可以看到，其实handlerMappingsLocation是在构造方法中被赋值的，而这个DefaultNamespaceHandlerResolver一共有3个构造方法

默认呢，就会将静态常量DEFAULT_HANDLER_MAPPINGS_LOCATION的值赋值给handlerMappingsLocation变量，而静态常量DEFAULT_HANDLER_MAPPINGS_LOCATION的值为META-INF/spring.handlers，说白了handlerMappingsLocation的值其实就为META-INF/spring.handlers

那我们现在回到主线，看下我们目前分析的代码，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303171610748.png)

现在呢，我们知道handlerMappingsLocation的值其实就为META-INF/spring.handlers，那也就是说，上边红框的代码，其实就是要读取META-INF/spring.handlers配置文件！

既然知道配置文件的目录了，那我们就来找下这个配置文件呗，此时我们就会发现下图中的配置文件

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303171610579.png)

通过上图，可以看到，在aop的jar包下有一个spring.handlers配置文件，而spring.handlers配置文件中呢，有一条配置，这条配置的key呢，为http\://www.springframework.org/schema/aop，这个我们刚讲过，其实就是xml中AOP的命名空间URI

然后对应的value呢，是org.springframework.aop.config.AopNamespaceHandler，这明显就是一个全限定类名，但是它是用来干嘛的，我们目前不知道，不过没关系，我们现在只要知道这个spring.handlers配置文件中有一个映射关系，key为AOP的命名空间URI，而value是一个全限定类名就足够了，最后呢，还会将这个映射关系作为结果返回。

那获取到这个配置后，我们继续往下看，此时我们会看到这块代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303171610890.png)

看到上边的代码，这就有意思了，我们知道，这个handlerMappings就是刚才获取到的映射关系，而namespaceUri呢，就是AOP的命名空间URI，也就是http://www.springframework.org/schema/aop

那现在这行代码要做的事儿，其实就是将http://www.springframework.org/schema/aop作为key，从刚才的映射中获取对应的value，那这下巧了，我们刚获取到的映射，马上就要用到了，那此时就会从映射中，获取到全限定类名org.springframework.aop.config.AopNamespaceHandler。

---

## 利用反射创建命名空间处理器实例

好，那我们接着往下看，在获取到全限定类名org.springframework.aop.config.AopNamespaceHandler之后，接下来就会执行这块代码了，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303171610201.png)

那此时就会看下这个全限定类名handlerOrClassName是不是为空，那此时当然不为空啦，接着会看下handlerOrClassName是不是NamespaceHandler类型，那此时当然也不是啦，因为NamespaceHandler明显是一个String类型蛮，所以此时就会执行最后一个else分支中的代码

那么接下来，就会执行下边这块代码，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303171610437.png)

通过上图，可以看到，这里会将全限定类名强转为String类型并赋值给变量className，接着又调用了一个ClassUtils.forName()方法获取到了一个Class对象并赋值给handlerClass变量，这个方法乍一看，还以为是Class类中的forName()方法呢，但其实ClassUtils就是一个工具类。

那这个ClassUtils工具类中的forName()方法有做了什么事儿呢？

我们接下来继续跟进ClassUtils工具类的forName()方法，此时我们会看到下边的代码：

```java
	public static Class<?> forName(String name, @Nullable ClassLoader classLoader)
			throws ClassNotFoundException, LinkageError {

		// 省略部分代码
		try {
			// 使用反射获取全限定类名的Class对象
			return Class.forName(name, false, clToUse);
		}
		catch (ClassNotFoundException ex) {
			// 省略部分代码
			throw ex;
		}
	}
```

为了让大家看到重点，所以上边将一些非核心的代码给忽略了，此时大家可以看到，其实ClassUtils工具类的forName()方法呢，核心就一行代码，那就是Class.forName(name, false, clToUse)这行代码，说白了就是使用反射获取到指定全限定类名的Class对象！

因为我们主要是分析aop:aspectj-autoproxy标签的解析过程，所以假设我们这里获取到的是org.springframework.aop.config.AopNamespaceHandler对应的Class对象，也就是AopNamespaceHandler类的Class对象。

在获取到AopNamespaceHandler类的Class对象之后，接着会执行下边的代码，我们看这里：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303171610217.png)

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303171610355.png)

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303171610809.png)

通过上边的代码，我们可以看到，其实BeanUtils.instantiateClass(handlerClass)这行代码，最后还是使用反射，通过构造方法创建了AopNamespaceHandler类的实例，说白了还是jdk中反射的使用，所以大家知道基础的重要性了吧，分析源码的前提，需要先要夯实基础才行。

好了，我们继续往下看，AopNamespaceHandler类的实例创建好之后呢，就要执行下边这行代码了，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303171610036.png)

我们知道，其实上图中的命名空间处理器namespaceHandler，其实就是一个AopNamespaceHandler类的实例，所以呢，上边这行代码的意思，说白了就是执行AopNamespaceHandler类的init()方法进行初始化。

那么AopNamespaceHandler的初始化操作都会做哪些事儿呢？

那我们当然要继续乘胜追击，这个时候呢，我们就会看到下边这块代码

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303171610915.png)

我们从上图的代码中，看到了非常熟悉的aspectj-autoproxy，这个就是我们在xml文件中，配置的用于开启AOP的标签，给我们的感觉，这个地方就是我们心心念要找的，将AnnotationAwareAspectJAutoProxyCreator注入到IOC容器中的入口了！

我们可以看到，上边调用了registerBeanDefinitionParser()方法，入参不仅传了aspectj-autoproxy，还new出来一个AspectJAutoProxyBeanDefinitionParser类的实例传了进去，那这里到底要做什么事儿呢？

我们跟进来看看就知道了，我们看下边的代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303171610013.png)

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303171610288.png)

通过上边的两张图，我们可以看到，其实呢，registerBeanDefinitionParser()方法就是向一个叫做parsers的Map中，添加一组键值对，对应的key就是aspectj-autoproxy，而对应的value其实就是AspectJAutoProxyBeanDefinitionParser类的一个实例，看名字，这个AspectJAutoProxyBeanDefinitionParser类是一个专门解析BeanDefinition的解析器。

通过init()方法的代码，我们可以发现，其实所谓的初始化操作，就是为了往parsers这个Map中放入一些解析器，没啥特殊的逻辑，所以我们猜测，核心逻辑其实在后边的流程，而这里只是做了一些准备工作而已。

好了，接着当初始化操作完成后，那么就会将命名空间处理器作为结果返回，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303171610934.png)

拿到命名空间处理器之后，接下来就会执行下边这行代码，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303171611160.png)

通过上边红框中的代码，我们可以看出，这行代码就是在做解析的事情，那么这里解析的时候，会不会使用我们刚才注册的那个AspectJAutoProxyBeanDefinitionParser解析器呢？而这个AspectJAutoProxyBeanDefinitionParser解析器到底有什么作用呢？

鉴于本节的篇幅，这个我们下节再来继续分析。

---

## 总结

好了，今天的知识点，我们就讲到这里了，我们来总结一下吧。

一张图来梳理下AnnotationAwareAspectJAutoProxyCreator的注入流程

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303171611483.png)

上图就是我们这节分析的AnnotationAwareAspectJAutoProxyCreator的注入流程，我们来总结一下

首先只有我们在xml中配置了aop:aspectj-autoproxy标签时，才会来注入AnnotationAwareAspectJAutoProxyCreator这个bean，然后我们以aop:aspectj-autoproxy标签作为突破口，开始了分析。

我们发现，在解析`aop:aspectj-autoproxy`标签的时候，会获取这个AOP标签对应的命名空间URI，接着会读取一个非常重要的配置文件，那就是`META-INF/spring.handlers`，然后基于这个`spring.handlers`配置文件，我们可以通过命名空间URI，获取到对应的AOP命名空间处理器的全限定类名`org.springframework.aop.config.AopNamespaceHandler`。

接着通过这个全限定类名，使用反射就创建出来了一个AOP命名空间处理器，也就是一个AopNamespaceHandler类的实例，接着调用AopNamespaceHandler的init()方法进行初始化操作，而在初始化的时候，主要就是向解析器Map，即parsers中注册了一些解析器，其中就注册了一个非常重要的解析器AspectJAutoProxyBeanDefinitionParser。

上边就是我们这节所讲的内容，我们这节暂时先讲到这里，下节我们再来接着分析。