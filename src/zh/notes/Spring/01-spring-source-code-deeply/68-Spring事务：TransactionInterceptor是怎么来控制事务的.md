---
title: 68_Spring事务：TransactionInterceptor是怎么来控制事务的？
category:
  - Spring源码
star: true
sticky: true
date: 2023-03-24
---

<!-- more -->

## 开篇

大家好，从这节开始呢，我们就要来分析Spring事务的源码了，这里呢，简单介绍一下Spring事务这块的一个讲解思路，其实呢，这个专栏的重点主要是IOC和AOP部分，因为这两块是Spring的重中之重，而Spring事务的定位，主要作为AOP的一个经典应用案例来讲的。

所以我们预计会花五节，基于之前讲过的AOP源码，带你打通Spring事务源码的核心链路，这个就是Spring事务章节的一个讲解思路。

好了，那现在废话也不多说了，直接上干货，下边开始本节的内容。

现在我们知道，其实@Transactional注解就是基于AOP来实现的，核心就是针对@Transactional注解所在的类会创建一个代理对象，而当代理中的方法被调用时，就会执行代理中的增强逻辑，说白了就是执行拦截器链中的逻辑。

而我们知道，针对@Transactional注解来说，在拦截器链中只有一个拦截器，那就是TransactionInterceptor，上节我们看到，其实控制事务的核心逻辑就在TransactionInterceptor中。

那么今天呢，我们就接着上节，来探索下TransactionInterceptor控制事务的内部细节，本节的主要内容如下：

1. 首先我们会来回顾下，在数据库中，我们是怎么来控制事务的
2. 然后会来看下，开启事务的本质，其实就是通过**Connection.setAutoCommit(false)**来完成的
3. 事务开启后，会来看下调用目标方法的过程
4. 接着会来看下，提交事务的本质，其实就是通过**Connection.commit()**来完成的
5. 最后会来看下，在发生异常时，回滚事务的本质，其实就是通过**Connection.rollback()**来完成的

---

## 在数据库中是怎么来控制事务的？

在分析TransactionInterceptor控制事务的内部细节之前，我们先来回顾下，在数据库层面，我们是怎么来控制事务的，我们看下边这张图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303211041813.png)

通过上图，可以看到，如果我们在数据库层面，想执行多条增删改sql时，可以直接使用相应的命令来实现。

比如在执行sql之前，我们可以通过start transaction来开启一个事务，然后再来执行多条增删改sql，当sql执行完毕后，我们可以选择使用commit来提交事务，或者使用rollback来回滚事务，非常简单。

上边数据库事务相关的知识，是数据库中的基础哈，如果大家记不太清楚的话，可以简单找些入门资料复习下，这里就不再赘述了。

ok，那这里为什么要来提一下数据库事务呢？

因为它对于我们分析@Transactional注解的源码是有帮助的。

我们知道，平时使用@Transactional注解，通常是来控制数据库事务的，在数据库层面，人家有自己的一套玩儿法，而@Transactional注解是Spring框架中定义的一个注解罢了，说白了就是一份java代码，那问题来了，为什么一份java代码就可以控制数据库层面的事务呢？

那我们猜测，这份java代码必然和数据库之间是有联系的，只有这样，这份java代码，也就是@Transactional注解才能来控制数据库层面的事务。

那我们再想一下，java代码和数据库之间的联系，那到底是什么呢？

那这里给个提示，大家还记得吗？通常我们java代码想操作数据库的话，第一步就是必须和数据库之间建立一个jdbc连接才行，也就是Connection。

分析到这里，我们大胆猜测，这个@Transactional注解控制数据库事务，有极大的可能是通过这个Connection来完成的！

上边只是我们的猜测，那么真想到底如何呢？下边我们就一起来扒代码探索吧。

---

## 开启事务的本质：Connection.setAutoCommit(false)

那现在我们就接着上节，继续往下分析，上节我们分析到了下边这块代码：

```java
    @Nullable
	protected Object invokeWithinTransaction(Method method, @Nullable Class<?> targetClass,
			final InvocationCallback invocation) throws Throwable {

		// 省略部分代码

		if (txAttr == null || !(ptm instanceof CallbackPreferringPlatformTransactionManager)) {
			// Standard transaction demarcation with getTransaction and commit/rollback calls.
			// 开启事务
			TransactionInfo txInfo = createTransactionIfNecessary(ptm, txAttr, joinpointIdentification);

			Object retVal;
			try {
				// This is an around advice: Invoke the next interceptor in the chain.
				// This will normally result in a target object being invoked.
				// 调用目标方法
				retVal = invocation.proceedWithInvocation();
			}
			catch (Throwable ex) {
				// target invocation exception
				// 回滚事务
				completeTransactionAfterThrowing(txInfo, ex);
				throw ex;
			}
			finally {
				cleanupTransactionInfo(txInfo);
			}

			if (vavrPresent && VavrDelegate.isVavrTry(retVal)) {
				// Set rollback-only in case of Vavr failure matching our rollback rules...
				TransactionStatus status = txInfo.getTransactionStatus();
				if (status != null && txAttr != null) {
					retVal = VavrDelegate.evaluateTryFailure(retVal, txAttr, status);
				}
			}

			// 提交事务
			commitTransactionAfterReturning(txInfo);
			return retVal;
		}

		else {
			//省略部分代码
		}
	}
```

可以看到，上边的代码，就是事务中的核心逻辑，其实就是负责控制事务的开启、回滚和提交的。那么首先大家要注意的是，这个invokeWithinTransaction()方法其实不在TransactionInterceptor中，而是在它的父类TransactionAspectSupport中，这个点需要注意一下。

ok，那现在我们就开始分析事务内部实现的细节吧，首先我们从开启事务开始分析，也就是createTransactionIfNecessary()方法，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303211119680.png)![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303211119256.png)

上边就是createTransactionIfNecessary()方法的代码，其中非常关键的一行代码就是tm.getTransaction(txAttr)，看名字这行代码是获取到了一个事务。

为了搞清楚这个getTransaction()方法，我们继续往下深入，此时会看到下边这块代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303211119781.png)

通过上图，我们发现了一行极为重要的代码，那就是startTransaction()，从名字上来看是“开启事务”的意思，现在看来开启事务的逻辑必然就在这个startTransaction()方法中了。

那现在还有啥好说的，我们跟进去这个startTransaction()方法来看下呗，此时我们会看到下边的代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303211119264.png)

此时我们发现，在startTransaction()方法中调用了一个极为重要的方法，那就是doBegin()方法，看方法的名字是“开始”的意思。看来开启事务的逻辑大概率就在这个doBegin()方法中了，此时doBegin()方法的代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303211120252.png)

在上边的代码中，我们看到了极为重要的一行代码，那就是con.setAutoCommit(false)，而这个con就是Connection类型，说白了就是一个jdbc连接！

也就是说，开启事务的本质，竟然真的是通过Connection来完成的！这个和我们刚才的猜测的结果完全吻合。

---

## 目标方法调用的过程

ok，到现在为止，事务已经开启成功了，那么接下来就就要执行目标方法了，也就是下边这行代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303211128462.png)

通过上图，可以看到，其实就是通过invocation.proceedWithInvocation()这行代码，来执行目标方法的，而这个invocation我们可以看到，其实是从外边传进来的。

而我们知道，其实是在TransactionInterceptor拦截器中调用的invokeWithinTransaction()方法，那现在我们再回头来看下TransactionInterceptor拦截器的代码，主要就是来看下在调用invokeWithinTransaction()方法时，入参invocation传递的是什么，此时会看到下边的代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303211128767.png)

通过上图，我们可以看到，在调用invokeWithinTransaction()方法时，最后一个参数传进去的是invocation::proceed，说白了就是将拦截器的核心实现传递了入参invocation，而所谓的核心实现，其实就是下边这个proceed()方法，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303211129320.png)

也就是说，执行invokeWithinTransaction()方法中的retVal = invocation.proceedWithInvocation()这行代码时，其实就会调用到ReflectiveMethodInvocation中的proceed()方法。

而此时如果满足条件的话，就会通过invokeJoinpoint()方法来执行目标方法了，这块的细节在AOP部分已经讲过了，这里就不再赘述了。

---

## 提交事务的本质：Connection.commit()

我们知道，由于执行目标方法这行代码，做了try catch处理，所以会根据执行目标方法是否发生异常，来做不同的处理。

我们先假设此时没有发生异常，那么这个时候就会执行提交事务的操作，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303211331855.png)

我们现在知道了，在开启事务的时候，本质就是通过Connection来完成的，那么这里提交事务的时候必然也是通过Connection来完成的。

不过呢，我们还是要眼见为实的，那这个时候，我们还是深入这个commitTransactionAfterReturning()方法，来验证一下吧。

其实呢，经过一通深入的跟踪，我们最终会看到下边这行代码，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303211331459.png)

通过上边的代码，我们可以知道，在提交事务的时候，和开启事务一样，其实本质也是通过Connection来完成的。

那有的同学可能会问：“你上边的代码是怎么一步一步调用进来的？”

是这样的，由于调用链路中，大多都不是核心代码，所以就没贴出来了，如果大家想知道完整的调用链路，那么可以参考下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303211331741.png)

上边这张图呢，就是完整的调用链路了 ，需要的同学可以直接拿来做参考。

需要注意的是，前提是使用专栏提供的源码版本哈，因为源码中添加了大量的注释，所以会导致代码行数发生变化，这个需要注意一下。

---

## 回滚事务的本质：Connection.rollback()

ok，刚才我们讲了正常的情况，那么我们知道，如果发生异常的话，会导致事务回滚，那么我们这里就来模拟一下发生异常的场景，其实还是老办法，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303211332048.png)

我们还是利用除数不能为0的特性，来模拟发生异常的情况。

那么这个时候，就会执行下边这行代码来回滚事务了，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303211332697.png)

其实现在大家已经可以猜到了，在回滚事务的时候，必然也是通过Connection来完成的。

那么经过跟踪，我们最终会看到下边这行代码，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303211332424.png)

通过上图，可以看到，回滚事务时，同样是通过Connection来完成的，这个已经在我们的意料之中了。

而对应的完整调用链路如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303211332900.png)

同样的，大家需要注意，要使用专栏提供的源码版本哈，因为源码中添加了大量的注释，所以会导致行数发生变化，这个需要注意一下。

---

## 总结

好了，今天的知识点，我们就讲到这里了，我们来总结一下吧。

一张图来梳理下@Transactional注解的原理

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303211332518.png)

上图是我们分析的@Transactional注解的原理流程图，我们来总结一下，首先针对加了@Transactional注解所在的类，会创建出来一个动态代理。

而当调用这个代理中的方法时，那么就会调用到拦截器TransactionInterceptor中，而拦截器TransactionInterceptor会调用父类TransactionAspectSupport的invokeWithinTransaction()方法进行处理。

在处理的时候，首先会通过Connection.setAutoCommit(false)来开启一个事务。

事务开启后，再调用目标方法，而在调用目标方法时，其实走的还是AOP拦截器链那一套，说白了就是还会再次调用到ReflectiveMethodInvocation的proceed()方法，从而完成目标方法的调用。

最后，会根据执行目标方法是否发生异常，来选择提交事务还是回滚事务，**如果未发生异常，那么就通过Connection.commit()来完成事务提交，而如果发生异常的话，那么就通过Connection.rollback()来回滚掉事务**。

::: warning 注意

加重部分在图中画反啦！

:::