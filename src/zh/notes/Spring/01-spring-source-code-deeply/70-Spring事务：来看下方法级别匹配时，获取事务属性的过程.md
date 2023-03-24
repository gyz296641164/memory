---
title: 70_Spring事务：来看下方法级别匹配时，获取事务属性的过程
category:
  - Spring源码
star: true
sticky: true
date: 2023-03-24
---

<!-- more -->

## 开篇

大家好，上节我们分析了TransactionInterceptor增强的匹配过程，现在我们知道，其实在匹配的时候，和之前的AOP一样，也分为了类级别的方法级别的匹配。

并且通过上节的分析，我们知道，在方法级别匹配的时候，判断方法级别是否匹配成功，依赖于是否获取到事务属性，而获取事务属性的过程，我们上节由于篇幅原因，没有详细进行分析。

那么这节呢，我们就来分析下，在方法级别匹配时，获取事务属性的过程。

本节的内容主要如下：

1. 首先我们会从源码级别，来分析下非public方法上，添加@Transactional事务失效的原因
2. 接着会来看下Spring在方法上，是如何获取@Transactional事务属性的
3. 最后会来看下，当方法上获取不到事务属性时，在目标类上又是怎么来获取@Transactional事务属性的

---

## 源码级别来看下非public方法事务失效的原因

我们知道，在非public方法上，添加@Transactional注解会导致事务失效，但是对于事务失效的原因，可能大家都没有深入研究，其实通过今天的源码分析，大家就会知道，非public方法事务失效的底层原因了！

好了，接下来开始本节的内容吧。

那现在，我们就接着上节，继续往下分析吧，那么分析的入口就是下边这行代码，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303231124402.png)

大家可以看到，上图红框中的代码，就是上节分析方法级别匹配时，获取事务属性的代码了。

那么接下来，我们就直接进去getTransactionAttribute()方法看看呗，此时我们会看到下边的代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303231428267.png)

上边代码呢，就是获取事务属性的代码了，代码逻辑相对来说，还是比较清晰的，接下来，我们就一点一点来分析吧。

在进入这个getTransactionAttribute()方法后，首先执行的就是下边这两行代码了，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303231428948.png)

可以看到，上边的代码非常简单，首先通过目标方法method和目标类targetClass构建一个缓存key，然后通过这个缓存key，从缓存attributeCache中获取事务属性。

而构造缓存key的逻辑，也非常简单，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303231428327.png)

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303231428384.png)

通过上边的代码，可以看到，所谓的缓存key，其实就是将目标方法和目标类简单设置到缓存对象内部了，非常的简单。

那么第一次进来的时候，这个缓存中肯定是获取不到事务属性的，说白了就是第一次执行的时候cached = null，那么这个时候就会执行else分支中的代码，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303231428036.png)

可以看到，在上边的代码中，首先调用了computeTransactionAttribute()方法，从名字上来看是“计算事务属性”的意思，那这下就有意思了，“计算”事务属性？这个是什么鬼？反正看起来这个方法挺重要的样子

并且我们可以看到，这个computeTransactionAttribute()方法还返回了事务属性TransactionAttribute，那也就是说，这个computeTransactionAttribute()方法就是获取事务属性的核心方法！

那还有啥说的，我们直接“干”进去研究一波呗，此时computeTransactionAttribute()方法代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303231428922.png)

可以看到，获取事务的核心逻辑就在这里了，那么我们就按照老办法，一点一点来分析上边的代码吧。

在进入computeTransactionAttribute()方法后，首当其冲的就是会执行下边这块代码，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303231428142.png)

可以看到，如果上边if语句中的布尔表达式满足的话，就会执行返回null，那么结合上节的文章，我们知道，如果这里返回null的话，那么就代表当前方法不支持事务，最重要的TransactionInterceptor增强就不会生效，由此看来，这个应该是在获取事务属性之前的一个校验条件。**这就是非public方法事务失效的根本原因**。

那么这个校验条件到底是何含义呢？

我们接下来就一起来研究下，首先我们来看下第一个布尔条件allowPublicMethodsOnly()方法的代码，如下图：

```java
@SuppressWarnings("serial")
public class AnnotationTransactionAttributeSource extends AbstractFallbackTransactionAttributeSource
		implements Serializable {

	//省略部分代码
    
    // 无参构造方法
	public AnnotationTransactionAttributeSource() {
		this(true);
	}

	public AnnotationTransactionAttributeSource(boolean publicMethodsOnly) {
		this.publicMethodsOnly = publicMethodsOnly;
		//省略部分代码
	}

    // 省略部分代码

    // 第一个布尔条件的方法
	@Override
	protected boolean allowPublicMethodsOnly() {
		return this.publicMethodsOnly;
	}

	// 省略部分代码

}
```

通过上边的代码，我们可以看到，其实allowPublicMethodsOnly()方法只是简单的将变量publicMethodsOnly的值返回了而已。

并且我们可以看到，其实这个publicMethodsOnly的值，在无参构造方法中被默认设置为了true，那么这个publicMethodsOnly是什么含义呢？

其实从名字上来看，它是“仅限public方法”的意思，其实就是一个标识罢了，默认为true。

ok，搞清楚了第一个布尔表达式之后，我们来看第二个布尔表达式，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303231428704.png)

这个布尔表达式就很简单了，首先method.getModifiers()其实就是获取方法的修饰符，比如这个方法是public修饰的还是private修饰的，就是这个意思。

而这个Modifier.isPublic()方法呢，代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303231428533.png)

从注释来看，如果参数中包含public修饰符，就返回true，其他情况返回false。

到这里，Modifier.isPublic()方法的意思就非常明显了，说白了就是用来判断当前方法是不是public方法，如果是public方法就返回true，否则返回false。

那么，我们最后结合着这两个布尔条件来分析下，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303231428348.png)

分析到这里，答案就呼之欲出了，上边的代码说白了就是，在默认情况下，只允许public方法进行事务处理，所以当目标方法不是public方法时，那么红框中的表达式就为true，此时就会返回null。

我们知道，这里一旦返回null，那么当前正在匹配的BeanFactoryTransactionAttributeSourceAdvisor增强就不会加入到eligibleAdvisors中，从而导致TransactionInterceptor增强不会生效，那么此时就表示，该目标类不需要被代理，也就是不会添加事务管理的功能。

这个其实就是在非public方法上，添加@Transactional事务失效的底层原因！

---

## 获取目标方法上@Transactional事务属性

刚才呢，我们分析的是，在方法上顺利找到@Transactional注解的情况，那么另外一种情况，那就是可能在目标方法上是找不到@Transactional注解的，那么这种情况下，Spring又是怎么处理的呢？

我们此时假设，在目标方法上没有找到@Transactional注解，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303231459536.png)

也就是说，当在方法上找不到@Transactional注解时，那么txAttr就为null，那此时txAttr != null的结果就为false，那此时代码就会继续往下执行，也就是会执行上边红框中的代码。

并且我们可以看到，这里调用的还是findTransactionAttribute()方法，和刚才在目标方法寻找事务属性是同一个方法，我们看下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303231459745.png)

通过上图，我们可以看到，方法名是一样的，而入参不一样，之前在目标方法上寻找事务属性时，入参传递的是目标方法本身，而这里在目标类上寻找事务属性时，入参传的是目标类本身，所以我们猜测这个findTransactionAttribute()方法可能是有两个重载方法，说白了就是方法名相同，但方法参数类型不同。

那到底是不是如我们猜测的那样呢？

我们进去看下就知道了，此时我们跟着进去`findTransactionAttribute(specificMethod.getDeclaringClass())`方法，会看到下边的代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303231459750.png)

这一看，还真的是我们猜测的那样，我们可以看到，此时调用的findTransactionAttribute()方法入参是Class类型的，接着就调用了determineTransactionAttribute()方法。

到这里我们就有疑问了，我们之前在目标方法上找事务注解时，不就是调用的这个determineTransactionAttribute()方法吗？我们看下边这张图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303231459827.png)

我们可以看到， 上边的代码中，一个是在目标类级别上找事务属性的方法，一个是在目标方法级别找事务属性的方法，可以看到，它们都同时调用了determineTransactionAttribute()方法。

这就奇怪了，为啥这里在目标类上，寻找事务注解还是调用这个方法呢？难道是这个determineTransactionAttribute()方法同时支持在类上和方法上查找注解？

带着这个疑问，我们可以再次看下determineTransactionAttribute()方法的定义，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303231459472.png)

这个时候，我们注意到，其实这个方法的入参是AnnotatedElement类型，从名字上来看，这个AnnotatedElement是“注释元素”的意思，那么这个AnnotatedElement到底代表哪些元素呢？

这个简单，其实我们点进去，来看下AnnotatedElement的定义就知道了，我们看下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303231459280.png)

点进去之后，我们发现，其实这个AnnotatedElement就是一个接口罢了，而这个接口有很多的实现类，比如常见的Class和Method。

那我们这里呢，就简单来介绍几个AnnotatedElement接口的实现类，我们看下边的类继承图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303231500079.png)

通过上图，我们可以看到，其实我们平常经常使用的Class和Method，甚至Field和Constructor，它们都是AnnotatedElement接口的实现类，也就是说，它们都属于“注释元素”。

说白了，这个AnnotatedElement接口的一个实例，就表示当前JVM中的一个“被注解元素”，而这个被注解的元素可以是Class、Method、Field、Constructor等等。

所以话说回来，由于这个determineTransactionAttribute()方法处理的AnnotatedElement接口类型，也就是说人家处理的是“被注解的元素”，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303231500974.png)

既然处理的是被注解的元素，那当然就包含了Class、Method、Field、Constructor等元素，所以人家当然既可以来处理类上的事务属性和方法上的事务属性啦。

所以一句话，在类上寻找事务注解的逻辑，和在方法上寻找事务注解的逻辑是一模一样的，它们都是通过调用determineTransactionAttribute()方法来完成的！而最后，其实就是通过SpringTransactionAnnotationParser事务注解解析器来完成解析的。

假如我们此时在类上找到了事务属性，那么这个时候就会将事务属性给返回，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303231500538.png)

那大家思考下，现在这个情况，大概是一个怎样的业务场景呢？

其实啊，这个业务场景就是，@Transactional注解没有加在方法上，而是加在了类上！

虽然我们在工作中，一般不会加在类上，但是@Transactional注解本身，人家是既支持加在方法上，也支持加在类上的，所以在解析@Transactional注解的时候，Spring会优先从方法上获取事务属性，如果方法上找不到事务属性的话，那么接着就会看下方法所在的类上，是否加了@Transactional注解，就是这个意思。

---

## 总结

### @Transactional的原理

好了，今天的知识点，我们就讲到这里了，我们来总结一下吧。

一张图来梳理下@Transactional的原理

![2023-03-23_150130](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303231501214.png)

上图是目前为止，我们分析的@Transactional的源码流程图，其中红色背景的部分就是我们今天新分析的内容。

我们来一起总结一下，我们今天，首先是从源码级别，分析了非public方法事务失效的原因，说白了就是在方法级别匹配时，会通过Modifier.isPublic()方法，来校验下目标方法是不是被public修饰符给修饰的，如果目标方法没有被public修饰，那么就认为这个方法不需要被代理，当然就会导致事务失效了。

接着我们分析了，在目标方法和目标类上查找事务属性的过程，说白了，它们都是通过SpringTransactionAnnotationParser事务注解解析器来完成解析的。

只不过在执行顺序上，Spring会优先在方法上寻找@Transactional事务属性，而如果在方法上，没有找到@Transactional事务属性的话，那么就会接着来看下方法所在的类上，有没有@Transactional事务属性，如果有的话就返回@Transactional事务属性，此时代表这个类需要被代理。

ok，到现在为止，事务增强已经匹配出来了，那接下来就是AOP代理的创建和执行了，那下节我们就来看下，事务代理的创建和执行流程。

### 代码写法study

这么写能比较"null"的值，直接赋值的话是null。

```java
	/**
	 * Canonical value held in cache to indicate no transaction attribute was
	 * found for this method, and we don't need to look again.
	 */
	@SuppressWarnings("serial")
	private static final TransactionAttribute NULL_TRANSACTION_ATTRIBUTE = new DefaultTransactionAttribute() {
		@Override
		public String toString() {
			return "null";
		}
	};
```

