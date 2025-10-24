---
title: 71_Spring事务：来看下@Transactional事务代理创建和执行流程
category:
  - Spring源码
star: true
sticky: true
date: 2023-03-24
---

<!-- more -->

## 开篇

大家好，经过前边几节的分析，我们知道，@Transactional是基于AOP实现的，而在创建事务代理之前呢，会为@Transactional所在的类匹配相应的增强，匹配的时候呢，会分别在类级别和方法级别进行匹配。

而在类级别和方法级别都满足后，就会将匹配成功的增强返回，而这里返回的**增强其实就是BeanFactoryTransactionAttributeSourceAdvisor**，我们知道，**在BeanFactoryTransactionAttributeSourceAdvisor中有一个非常关键的属性，那就是adviceBeanName，它的值就是TransactionInterceptor类的全限定类名**，而这个TransactionInterceptor的重要性，我们这里就不再赘述了。

ok，那么为@Transactional所在的类匹配出来BeanFactoryTransactionAttributeSourceAdvisor增强后，那么下一步，就是为@Transactional所在的类创建代理了。

那这节，我们就从为@Transactional所在的类创建代理开始，接着往下分析，那么本节的内容主要如下：

1. 首先我们会来看下，事务AOP代理的创建流程
2. 在事务AOP代理创建完成后，我们接着来看下，事务代理在执行时，是怎么来匹配BeanFactoryTransactionAttributeSourceAdvisor增强的
3. 在匹配完增强后，紧接着，我们会来看下，事务代理是怎么进一步获取到TransactionInterceptor拦截器的

---

## 事务AOP代理是怎么创建的？

现在呢，事务增强BeanFactoryTransactionAttributeSourceAdvisor已经准备就绪了，那么我们就先来看下事务代理的创建过程吧，我们看下边这张图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303231531791.png)

通过上图，我们可以看到，在创建事务代理时，匹配出来的specificInterceptors中，只有一个BeanFactoryTransactionAttributeSourceAdvisor增强。

ok，我们继续往下看，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303231532026.png)

可以看到，上边其实就是通过proxyFactory来创建代理的，和之前AOP是一模一样的，也就是说在创建事务代理时，和之前创建AOP是一模一样的逻辑，这里没啥特殊逻辑

而唯一不一样的就是，给proxyFactory设置的advisors增强不一样，对于@Transactional事务代理来说，设置的增强是BeanFactoryTransactionAttributeSourceAdvisor增强，其他的处理就没啥区别了。

当@Transactional事务代理创建成功后，就可以看到，从IOC容器中获取的orderService其实就是AOP代理了，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303231532511.png)

通过上图，我们可以看到，从IOC容器中获取出来的orderService，其实就是一个代理对象。

那么我们知道，一旦调用代理对象中的方法，那么就会交给代理相应的逻辑进行处理，比如jdk代理的话，就会交给JdkDynamicAopProxy的invoke()方法来进行处理。

---

## 事务AOP代理是怎么来匹配BeanFactoryTransactionAttributeSourceAdvisor增强的？

那我们这里，就以jdk代理为例，当调用代理对象中的方法时，就会调用到JdkDynamicAopProxy的invoke()方法，而invoke()方法的核心代码如下：

```java
	public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
		// 省略部分代码
		try {
			// 省略部分代码
            
			// 获取当前要调用方法的拦截器链，advised就是一个ProxyFactory
			List<Object> chain = this.advised.getInterceptorsAndDynamicInterceptionAdvice(method, targetClass);

			// 处理拦截器链
			if (chain.isEmpty()) {
                // 如果拦截器链为空，则使用反射调用目标方法
				Object[] argsToUse = AopProxyUtils.adaptArgumentsIfNecessary(method, args);
				retVal = AopUtils.invokeJoinpointUsingReflection(target, method, argsToUse);
			}
			else {
				// 如果拦截器链不为空，则将拦截器统一封装为MethodInvocation，同时传入目标对象target和目标方法method，后续反射调用目标方法会使用到
				MethodInvocation invocation =
						new ReflectiveMethodInvocation(proxy, target, method, args, targetClass, chain);
				// 处理拦截器链，也就是依次执行每一个拦截器
				retVal = invocation.proceed();
			}

			// 省略部分代码
            
			// 将返回值作为结果返回
			return retVal;
		}
		finally {
			// 省略部分代码
		}
	}
```

其实JdkDynamicAopProxy的invoke()方法，我们在AOP章节详细分析过，这里呢，主要是站在事务代理的角度，来分析下事务代理的执行过程。

通过上边代码，可以看到，其实invoke()方法核心逻辑就两块，一个是获取拦截器链，一个是执行拦截器链，而执行拦截器链，在一开始讲@Transactional注解的时候就分析过了，下边我们主要来看下获取拦截器链的逻辑。

其实这也算是一次复习了，那我们现在就来看下getInterceptorsAndDynamicInterceptionAdvice()方法吧，代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303231558984.png)

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303231558737.png)

通过上边代码，我们可以看到，其实在获取拦截器链的时候，一共有四大步骤，我们就作为复习了，这里简单再回顾下。

1. 首先第一步，就是从代理配置ProxyFactory中，获取到当时设置的增强，也就是BeanFactoryTransactionAttributeSourceAdvisor。

2. 然后第二步，就是在类级别进行匹配，这个前边我们刚讲过的哈，其实对于@Transactional注解类级别的匹配来说，只要目标类既不是java自己的类，也不是Spring里的Ordered接口类型，那么此时就表示目标类是满足类级别匹配的。

3. 如果在类级别匹配成功的话，那么就进行第三步的处理，其实第三步的话，就是在方法级别进行匹配，匹配逻辑呢，前边我们刚讲过，其实就是看下目标方法或目标方法所在的类上有没有加@Transactional注解，如果加的话，那么就说明在方法级别匹配成功。

4. 最后第四步的话，就是为匹配成功的增强构建拦截器了。

---

## 事务AOP代理是怎么进一步获取TransactionInterceptor拦截器的？

整个获取拦截器链的过程，核心就是上边的四大步骤，前三个步骤没啥好说的，非常简单，我们主要来看下第四个步骤吧，也就是为匹配成功的增强，构建其对应的拦截器，也就是registry.getInterceptors(advisor)这个方法，而对应的代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303231616800.png)

通过上图，可以看到，进入这个方法后，首先执行的就是advisor.getAdvice()这行代码了，而此时的advisor是BeanFactoryTransactionAttributeSourceAdvisor，所以其实这里就是要执行BeanFactoryTransactionAttributeSourceAdvisor的getAdvice()方法了。

但当我们看到BeanFactoryTransactionAttributeSourceAdvisor的定义后，发现其实它里边根本没有getAdvice()方法，但是我们从它的类结构中会发现，其实它从父类中继承过来了getAdvice()方法（选中Show Inherited，即小锁头右边的按钮），如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303231617209.png)

也就是说，其实真正调用的是AbstractBeanFactoryPointcutAdvisor类中的getAdvice()方法了，那现在我们就趁热打铁，来看下getAdvice()方法的代码吧，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303231617001.png)

通过上图，可以看到，这里的代码量其实不多，我们一块代码一块代码来分析。

其实从getAdvice()方法的名字来看，这个方法就是用来获取Advice的，而首先刚进入方法时，会执行下边的代码，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303231617111.png)

上边这块代码就非常简单了，因为getAdvice()方法就是为了返回advice蛮，只不过上边在返回之前做了一个非空处理，即如果获取到的advice不为null时，才返回这个advice。

ok，那如果恰好此时获取到的advice是null，那么上边就不会返回这个advice了，而是继续往下执行代码，其实就是下边这块代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303231617470.png)

我们知道，通常呢，Spring中的bean都是单例模式，所以这个时候，就会进入上边的if分支进行处理，也就是会执行下边的代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303231617915.png)

上边的代码就有意思了，这里会将this.adviceBeanName作为beanName，从IOC容器中获取bean，那这个时候this.adviceBeanName的值就至关重要了。

要搞清楚这个this.adviceBeanName的值是多少，那么首先要确定的就是当前这个this是哪个对象。

其实确定这个简单，大家还记得吗？其实上边的代码，一开始是通过advisor.getAdvice()这行代码进来的，而当前匹配的增强advisor是BeanFactoryTransactionAttributeSourceAdvisor，所以当前的this当然是BeanFactoryTransactionAttributeSourceAdvisor啦。

所以这下就简单了，我们在前边的文章中提到过，在BeanFactoryTransactionAttributeSourceAdvisor中有一个非常关键的属性，那就是adviceBeanName，而这个adviceBeanName的值其实就是TransactionInterceptor的全限定类名，也就是org.springframework.transaction.interceptor.TransactionInterceptor，说白了adviceBeanName代表的就是事务的核心处理组件TransactionInterceptor。

ok，在确定了this.adviceBeanName的值之后呢，我们再回到刚才分析的代码上，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303231617787.png)

那现在来看，上边的代码意思就很清楚了，说白了就是将 org.springframework.transaction.interceptor.TransactionInterceptor 作为beanName，从IOC容器中获取到TransactionInterceptor实例，而获取到的这个TransactionInterceptor实例其实就是需要返回的增强。

那么这个时候，getAdvice()方法就会将TransactionInterceptor增强返回，而这个TransactionInterceptor增强是实现了MethodInterceptor接口的，所以这个TransactionInterceptor增强会被直接添加到拦截器链中，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303231617024.png)![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303231617379.png)

那么在获取拦截器链之后，就是执行拦截器链了，其实就是下边这块了：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303231617104.png)

**对于事务AOP代理来说，其实拦截器链chain中只有一个TransactionInterceptor拦截器**，而TransactionInterceptor拦截器执行的整个过程，我们在事务源码分析的开头，就已经分析过了，所以这里就不再赘述了，说白了TransactionInterceptor拦截器就是基于jdbc的API来控制数据库事务的。

---

## 总结

好了，今天的知识点，我们就讲到这里了，我们来总结一下吧。

一张图来梳理下@Transactional的原理

![2023-03-23_161833](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303231618881.png)

上图是目前为止，我们分析的@Transactional的源码流程图，我们来一起总结一下。

今天我们主要讲了事务AOP代理的创建和执行流程，说白了，就是借着讲解事务，顺便复习了下AOP代理的创建和执行流程。

其实对于事务来说，和AOP的处理流程相比，唯一不同的就是，在创建事务AOP代理时，会将事务增强BeanFactoryTransactionAttributeSourceAdvisor放入到proxyFactory中。

而在执行目标方法时，会从proxyFactory中获取BeanFactoryTransactionAttributeSourceAdvisor增强，接着进行类级别和方法级别的匹配，最后匹配成功后，就会从BeanFactoryTransactionAttributeSourceAdvisor中获取到TransactionInterceptor拦截器，接着TransactionInterceptor拦截器就会基于jdbc的API来控制数据库事务。

说白了就是，@Transactional就是基于AOP这一套来玩儿的，只不过@Transactional有自己专用的增强，那就是BeanFactoryTransactionAttributeSourceAdvisor，所以@Transactional的核心其实就是BeanFactoryTransactionAttributeSourceAdvisor。

到现在为止呢，我们已经分析了BeanFactoryTransactionAttributeSourceAdvisor的匹配过程，但是我们发现，其实在匹配之前，BeanFactoryTransactionAttributeSourceAdvisor这个bean就已经存在于IOC容器中了。

那我们心中不免有个疑问，那就是BeanFactoryTransactionAttributeSourceAdvisor这个bean是在什么时候注册到IOC容器中的？注册的过程又是怎么样的？

大家可以先开动脑筋思考下，答案将在下节进行揭晓。