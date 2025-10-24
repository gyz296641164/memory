---
title: 67_Spring事务：@Transactional注解竟然是基于AOP实现的？
category:
  - Spring源码
star: true
sticky: true
date: 2023-03-24
---

<!-- more -->

## 开篇

大家好，从这节开始呢，我们就要开始分析Spring事务源码了，其实主要就是分析@Transactional注解的源码。

我们知道，平常我们使用@Transactional注解，主要就是用来管理数据库事务的，这样在执行多个数据库增删改操作时，就可以保证数据的一致性了。

那么今天我们就来看下，@Transactional注解到底是怎么来支持数据库事务的，本节的主要内容如下：

1. 首先我们会来开发订单接口，来还原真实事务场景
2. 然后分情况来测试下提交订单接口，体验下@Transactional注解的效果
3. 接着开始分析@Transactional注解的源码，此时会发现@Transactional其实就是基于AOP来实现的
4. 最后会来看下实现事务的关键组件：拦截器TransactionInterceptor

---

## 开发订单接口，来还原真实事务场景

其实我们在分析源码时，最好的方法就是首先还原真实的使用场景，然后从这个使用场景出发，来一步一步的分析其源码。

上节呢，我们是以提交订单为背景来模拟事务的，那么这节既然我们要来分析@Transactional源码了，那么我们非常有必要模拟出来一个真实事务场景，说白了就是模拟出，我们平常工作中使用@Transactional注解的业务场景。

那么具体怎么来落地呢？

其实很简单，我们知道，提交订单时，就需要分别将订单数据和订单明细数据分别插入到数据库中，所以我们首先当然要有个表啦，此时我们可以使用下边的sql进行建表，如下：

```sql
create table order_info
(
    id           bigint auto_increment
        primary key,
    order_no     varchar(32)   not null comment '订单号',
    order_amount decimal(8, 2) not null comment '订单金额',
    user_id      bigint        not null comment '用户ID'
)
    comment '订单表';
create table order_item
(
    id         bigint auto_increment comment 'id'
        primary key,
    order_no   varchar(32) not null comment '订单号',
    product_id bigint      not null comment '商品ID'
)
    comment '订单明细表';
```

好了，表建好了之后呢，下一步就是使用mybatis来写sql了，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303201655480.png)

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303201655038.png)

可以看到，上边分别是订单表和订单明细表的mapper文件，其实主要就是插入语句。

ok，sql写完之后，下一步我们在submitOrder()方法中进行调用，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303201656505.png)

通过上图，可以看到，这里就是在submitOrder()方法中，分别调用了订单和订单明细的插入操作，也就是在同一个方法中包含了多个增删改操作，那么我们知道，此时为了保证数据的一致性，这里是需要添加@Transactional注解的，就像上图红框中那样。

---

## 分情况来测试下提交订单接口

好了，一切准备就绪之后，我们来看一下加了@Transactional注解后的效果吧，测试代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303201710293.png)

通过上边的代码，可以看到，其实就是从IOC容器中获取了orderServiceImpl这个bean，也就是加了@Transactional注解方法所在的bean，然后就调用了这个bean的submitOrder()方法。

此时测试类执行结果如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303201710462.png)

可以看到，这里随机生成的订单号是uXKanoozEUTR683，可能有人问这个订单号是怎么生成的。

其实呢，这个订单号是通过测试类中的buildOrderInfo()方法生成的，代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303201710406.png)

可以看到，上边的代码就是用来构造一些测试数据的，非常简单，比如这次构造的订单号就是uXKanoozEUTR683

最后我们在来看下数据库中是否成功插入了，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303201710050.png)

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303201710366.png)

通过上图，可以看到，数据库中成功插入了订单数据和订单明细数据。

上边呢，是正常的情况，那如果发生异常怎么办呢？

这个简单，那我们就来模拟一下异常的情况呗，我们看下边这张图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303201710552.png)

可以看到，和上节一样，我们同样使用除数不能为0的特性，来模拟发生异常的情况。

此时执行结果如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303201711182.png)

通过上图，大家可以看到，订单操作执行完毕后，在执行订单明细插入操作的过程中发生异常了，正常来说，这个时候事务会回滚，那此时订单号p9sT4sdfqsfD300对应的订单是不能插入数据库的。

那这个时候我们来数据库看一下p9sT4sdfqsfD300是否插入成功了，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303201711963.png)

此时我们发现，订单表中并没有这个p9sT4sdfqsfD300订单，说白了就是，此时@Transactional事务是生效的！

---

## @Transactional竟然是基于AOP实现的？

好了，刚才呢，我们模拟了一下真实的事务场景，并且重现了下平时使用@Transactional的场景，那么接下来，就要开始分析源码了。

这个时候，我们可以将测试类作为入口进行分析，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303201712020.png)

通过上边的代码，我们可以知道，这里是直接从IOC容器中拿到了orderService这个bean，接着就调用了orderService的submitOrder()方法，而由于submitOrder()方法上添加了@Transactional注解，所以此时submitOrder()方法是支持事务的。

那么我们来猜测下，@Transactional注解有没有可能是基于AOP实现的呢？

其实通过上节的讲解，我们知道，基于AOP是可以实现@Transactional注解相似的效果，那么有没有可能@Transactional注解就是基于AOP来实现的呢？

因为我们知道，从IOC容器获取bean的时候，是有可能获取到一个代理对象的，也就是说上边获取的orderService这个bean可能就是一个代理对象，然后在这个代理对象中实现了开启事务、回滚事务和提交事务的逻辑！

不过这个只是我们的猜测，有没有办法来验证呢？

其实很简单，那就是使用我们的debug大法，我们可以debug来看下orderService这个bean的真身到底是何方神圣，此时debug结果如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303201712713.png)

通过上图，我们可以看到，这个orderService竟然还真的是一个代理对象，并且还是jdk代理对象。

到这里就真想大白了，其实@Transactional注解就是基于AOP来实现的，也就是说，只要方法上加了@Transactional注解，那么Spring就会为这个方法所在的类创建一个代理出来，而当调用代理对象的方法时，就会执行代理中的增强逻辑来支持事务。

---

## 实现事务的关键拦截器：TransactionInterceptor

那接下来的重点，当然就是要来看下这个增强逻辑中，到底是怎么支持事务的啦，那这个增强逻辑该怎么找呢？

其实这个也好办，因为我们知道，对于jdk代理来说，核心逻辑都在JdkDynamicAopProxy的invoke()方法中，而在invoke()方法中负责执行增强的，就是下边这行代码了，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303201738509.png)

上边这行代码的作用呢，其实就是用来执行拦截器链的，也就是执行增强逻辑，这个之前我们都分析过，这里就不再赘述了。

而真正执行拦截器链的核心逻辑，其实是下边的代码，我们看这里：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303201738622.png)

大家可以看到，这里其实就是不断地调用拦截器链interceptorsAndDynamicMethodMatchers中拦截器的invoke()方法，而这些拦截器其实就是一个一个的增强

那现在问题来了，对于@Transactional注解来说，拦截器链中会有哪些增强呢？

这个也好办，我们同样可以使用debug大法来看下拦截器链interceptorsAndDynamicMethodMatchers中，到底有哪些拦截器，此时debug结果如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303201739524.png)

通过上图，可以看到，其实拦截器链interceptorsAndDynamicMethodMatchers中，只有一个拦截器，那就是TransactionInterceptor。

也就是说对于@Transactional注解来说，拦截器链中其实只有TransactionInterceptor这一个拦截器，那这个TransactionInterceptor都会做些什么事儿呢？

看现在的情况，我们必须要深入TransactionInterceptor拦截器的invoke()方法来一探究竟了，此时我们会看到下边这块代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303201739081.png)

大家可以看到，其实在上边的代码中，关键的是调用了invokeWithinTransaction()方法，这个方法从名字上来看是“在事务内调用”的意思，这明摆着核心逻辑就在这个invokeWithinTransaction()方法中。

那接下来，我们当然是要来看下这个invokeWithinTransaction()方法了，此时代码如下：

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

上边就是invokeWithinTransaction()方法的核心代码了，其中一些不太重要的代码已经省略了

我们可以看到，上边的代码中，首先是调用了一个createTransactionIfNecessary()方法，从这个方法的名字上来看是“创建事务”的意思，其实说白了就是开启事务的意思。

接着调用了retVal = invocation.proceedWithInvocation()这行代码来执行目标方法，而这行代码呢，做了try catch处理，在这个catch语句块中调用了一个completeTransactionAfterThrowing()方法，这个方法从名字来看是“发生异常后完成事务”，其实说白了就是发生异常时回滚事务的意思，并且回滚完事务之后，通过throw ex将异常直接抛了出去。

如果执行目标方法没有发生异常，那么就会调用commitTransactionAfterReturning()方法，从名字上来看这个方法是“返回后提交事务”的意思，其实说白了就是目标方法正常执行结束后，如果没有发生异常，那么就直接提交事务的意思。

大家有没有发现，上边这块代码的逻辑，和上节我们基于AOP模拟事务的代码非常相似？简直就是一个模子里刻出来的。

其实啊，@Transactional注解的本质就是基于AOP来实现的，而实现事务的核心逻辑，其实就是在执行目标方法之前，先开启事务，然后再来执行目标方法，因为目标方法是加了try catch处理的，所以当执行目标方法发生异常时，由catch语句块来做特殊处理，说白了就是回滚事务，如果未发生异常，那么就直接提交事务，就这么简单。

---

## 总结

好了，今天的知识点，我们就讲到这里了，我们来总结一下吧。

今天我们为模拟真实的事务场景，首先开发了提交订单接口，接着在提交订单接口上体验了@Transactional注解的效果，并以此为入口开始了@Transactional源码的分析。

通过分析，我们知道，其实@Transactional注解的本质，就是基于AOP来实现的，其控制事务的核心逻辑就在拦截器TransactionInterceptor中，简单说就是在执行目标方法前，先开启事务，然后在执行目标方法时，发生异常的话就回滚事务，如果没有发生异常，那么就直接提交事务，其实和上节我们模拟@Transactional功能的代码非常相似。

那么在拦截器**TransactionInterceptor**中，开启事务、回滚事务、提交事务的内部细节分别是什么样的？这个我们下节再来接着分析。
