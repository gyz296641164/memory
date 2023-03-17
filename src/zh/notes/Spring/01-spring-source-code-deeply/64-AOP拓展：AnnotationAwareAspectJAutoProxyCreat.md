<h1 align="center">64_AOP拓展：AnnotationAwareAspectJAutoProxyCreat</h1>

## 开篇

大家好，我们这节继续来分析AnnotationAwareAspectJAutoProxyCreator的注入流程。

上节呢，我们分析到AOP命名空间处理器AopNamespaceHandler已经构建好了，并且AopNamespaceHandler执行了初始化操作，这个时候，其实就是往parsers这个Map中放入了一些解析器，其中就包含了AspectJAutoProxyBeanDefinitionParser这个解析器，这个解析器对应的key为aspectj-autoproxy。

完成初始化后，接着就要执行解析操作了，那么这节呢，我们就接着上节，继续往下进行分析。

那么在分析之前，先给大家介绍下本节的主要内容，如下：

1. 首先我们会来分析下，解析时使用的解析器的获取流程
2. 然后会接着来分析，AnnotationAwareAspectJAutoProxyCreator注册到beanDefinitionMap中的过程
3. 最后会来分析下，核心属性proxyTargetClass和exposeProxy设置到BeanDefinition中的过程

---

## 获取aspectj-autoproxy标签对应的解析器

经过上节的分析呢，接下来就该执行这行代码了，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303171622772.png)

那么上边这行代码呢，明显是在做解析处理，所以我们很有必要跟踪进去一探究竟。

那现在没啥好说的，就是干，此时parse()方法如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303171622504.png)

通过上图，我们可以看到，上边一共有2行代码，第一行代码呢，调了findParserForElement()方法，而这个方法，从名字上来看，好像是“为标签元素寻找解析器”的意思，并且我们还发现，在调用这个方法之后，方法还返回了一个解析器parser，接着就调用了返回的这个解析器parser的parse()方法。

那现在看来这个findParserForElement()方法极为重要，那还有啥好说的，我们跟踪进来看下呗，此时findParserForElement()方法的代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303171622347.png)

通过上图，我们可以看到，这个findParserForElement()方法在获取解析器时，竟然是从parsers这个Map中获取的！

这下巧了，上节我们分析代码时，知道在初始化的时候，其实就会在parsers这个Map中放入一些解析器，而在这个findParserForElement()方法中，就直接使用到parsers这个Map了，也就是从parsers直接获取解析器了，可想而知，上节在初始化时放入的解析器，其实就是为了这里而准备的！

并且我们还可以看到，在刚进入上边的findParserForElement()方法时，就获取了标签元素的名称并赋值给了localName变量，那这个localName变量的值是长什么样子呢？

这个标签名称非常简单，比如我们现在分析的是aop:aspectj-autoproxy标签，那么这个标签对应的名称就是aspectj-autoproxy，说白了就是localName变量的值就是aspectj-autoproxy。

根据上边代码的逻辑，那么接下来，就会将aspectj-autoproxy作为key，直接从parsers中获取对应的拦截器了。

那大家记得在初始化时，都向这个parsers中添加了哪些解析器吗？

哈哈，大家忘记的话也没关系，我们再回头看下初始化的代码，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303171622017.png)

通过上图，我们可以看到，在初始化时，往parsers中放入的解析器中，有一个解析器就是AspectJAutoProxyBeanDefinitionParser，而它对应的key就为aspectj-autoproxy。

那这下就巧了，刚才上边的localName变量的值就是aspectj-autoproxy，所以下边的代码，获取到的其实就是AspectJAutoProxyBeanDefinitionParser解析器，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303171622728.png)

而在获取到AspectJAutoProxyBeanDefinitionParser解析器之后，接下来就会执行下边这行代码，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303171622179.png)

由于此时获取的解析器是AspectJAutoProxyBeanDefinitionParser，所以上边的代码说白了，就是调用AspectJAutoProxyBeanDefinitionParser类的parse()方法。

---

## AnnotationAwareAspectJAutoProxyCreator是如何注册到beanDefinitionMap中的？

那现在就好办了，我们直接来看下AspectJAutoProxyBeanDefinitionParser类的parse()方法，代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303171623079.png)

这个时候我们从上图中，就看到了极为重要的一行代码，那就是AopNamespaceUtils.registerAspectJAnnotationAutoProxyCreatorIfNecessary(parserContext, element)

可以看到，这行代码其实就是调了一个叫做registerAspectJAnnotationAutoProxyCreatorIfNecessary的方法，从名字上来看，这个方法大概意思是“如果有必要的话，就注册一个AnnotationAutoProxyCreator”，看来离注入AnnotationAwareAspectJAutoProxyCreator的地方不远了

那这个时候还有啥好说的，我们跟进去这个registerAspectJAnnotationAutoProxyCreatorIfNecessary()方法一探究竟吧，此时会看到下边的代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303171623529.png)

通过上图，我们看到，这里其实又调了AopConfigUtils中的registerAspectJAnnotationAutoProxyCreatorIfNecessary()方法完成了注册，那我们继续往下跟踪呗，此时会看到这块代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303171623306.png)

通过上图，我们可以看到，这里其实又调用了registerOrEscalateApcAsRequired()方法来完成功能，不过此时，我们看到了心心念的AnnotationAwareAspectJAutoProxyCreator！我们可以看到，AnnotationAwareAspectJAutoProxyCreator被作为入参，传递到了registerOrEscalateApcAsRequired()方法中，那也就是说注入的核心逻辑，其实就是在registerOrEscalateApcAsRequired()方法中！

到这里为止，我们终于找到了AnnotationAwareAspectJAutoProxyCreator注入的核心逻辑，真是功夫不负有心人，哈哈哈。

好，那接下来，我们就来看看registerOrEscalateApcAsRequired()方法是怎么来进行处理的，我们跟踪进去后，会看到下边的代码，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303171623107.png)

通过上图，我们可以看到，入参cls其实就代表AnnotationAwareAspectJAutoProxyCreator的Class对象，这里的处理呢，首先将cls构建为一个BeanDefinition，接着调用registerBeanDefinition()方法，来完成BeanDefinition的注册，注册的时候对应的beanName就是AUTO_PROXY_CREATOR_BEAN_NAME这个静态常量，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303171623419.png)

通过上图，我们可以看到，其实这个静态常量的值为org.springframework.aop.config.internalAutoProxyCreator

也就是说，注册AnnotationAwareAspectJAutoProxyCreator对应的BeanDefinition时，对应的beanName就是`org.springframework.aop.config.internalAutoProxyCreator`

接下来，让我们来看下注册BeanDefinition的逻辑，代码如下：

```java
    @Override
	public void registerBeanDefinition(String beanName, BeanDefinition beanDefinition)
			throws BeanDefinitionStoreException {
        // 省略部分代码
        
        BeanDefinition existingDefinition = this.beanDefinitionMap.get(beanName);
		if (existingDefinition != null) {
			// 省略部分代码
            
			this.beanDefinitionMap.put(beanName, beanDefinition);
		}
		else {
			if (hasBeanCreationStarted()) {
				// 省略部分代码
			}
			else {
				// Still in startup registration phase
				// 将AnnotationAwareAspectJAutoProxyCreator放入beanDefinitionMap
				// 此时beanName为org.springframework.aop.config.internalAutoProxyCreator
				this.beanDefinitionMap.put(beanName, beanDefinition);
				this.beanDefinitionNames.add(beanName);
				removeManualSingletonName(beanName);
			}
			this.frozenBeanDefinitionNames = null;
		}

		// 省略部分代码
	}
```

为了突出核心代码，所以上边忽略了部分代码，此时大家可以看到，其实注册BeanDefinition的时候，说白了就是将BeanDefinition放入到了beanDefinitionMap中！

而这个beanDefinitionMap有什么作用，在IOC部分已经详细讲过了，这里就不再赘述了。此时一旦将BeanDefinition注册到beanDefinitionMap，那么就代表注册完成了。

---

## 设置proxyTargetClass和exposeProxy属性

好，我们继续往下看，当完成注册后，接下来就会执行到下边这块代码，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303171623248.png)

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303171623740.png)

通过上图，我们可以看到，在注册完毕后呢，就会执行useClassProxyingIfNecessary()这个方法了

而useClassProxyingIfNecessary()方法的逻辑呢，其实很简单，就是读取标签中proxy-target-class和expose-proxy属性配置的值，如果配置的值为true的话，那么就调用相应的方法进行处理

比如我们现在的标签配置如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303171623303.png)

此时我们可以看到，上边的配置中，proxy-target-class属性就被配置为了true，那么此时按照上边的代码逻辑，那么就会来执行forceAutoProxyCreatorToUseClassProxying()方法了。

而forceAutoProxyCreatorToUseClassProxying()方法的代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303171624070.png)

其中静态常量AUTO_PROXY_CREATOR_BEAN_NAME的定义如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303171624446.png)

其中containsBeanDefinition()方法的实现如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303171624196.png)

其中getBeanDefinition()方法的实现如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303171624939.png)

综合上边的代码，我们可以知道，其实forceAutoProxyCreatorToUseClassProxying()方法的逻辑非常简单，就是首先会看下注册表beanDefinitionMap中有没有`org.springframework.aop.config.internalAutoProxyCreator`这个beanName对应的BeanDefinition。

如果有的话，那么就获取到这个BeanDefinition，而获取的这个BeanDefinition说白了就是AnnotationAwareAspectJAutoProxyCreator对应的BeanDefinition，最后呢，就会往这个BeanDefinition的属性中添加名字叫做proxyTargetClass的属性，并且这个属性对应的值为Boolean.TRUE。

一旦添加了这个属性，那么后续在处理这个BeanDefinition时，就可以读取到这个proxyTargetClass属性的值了，而这个proxyTargetClass属性，在Spring创建代理时，就会来读取proxyTargetClass属性，拿来作为判断是创建jdk代理还是cglib代理的条件。

其实从forceAutoProxyCreatorToUseClassProxying()这个方法的名字来看，它的意思是“强制使用类代理”的意思，说白了就是使用cglib代理的意思，所以从这个方法的名字上，我们也是可以看出一些端倪的。

同理，另外一个forceAutoProxyCreatorToExposeProxy()方法，从名字上来看是“强制暴露代理”的意思，代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303171624332.png)

可以看到，上边这个方法其实和刚才分析的forceAutoProxyCreatorToUseClassProxying()方法的套路完全相同，只不过它处理的是exposeProxy属性罢了，这里就不再赘述了。

好了，到这里为止，AnnotationAwareAspectJAutoProxyCreator中的proxyTargetClass和exposeProxy属性就都处理好了，并且对应的BeanDefinition也注册到beanDefinitionMap中了。

那么后续流程，就是从beanDefinitionMap中，先获取AnnotationAwareAspectJAutoProxyCreator的BeanDefinition定义，然后进一步完成AnnotationAwareAspectJAutoProxyCreator的实例化和初始化，最后在创建AOP代理时，就可以愉快的使用AnnotationAwareAspectJAutoProxyCreator这个bean了！

---

## 总结

好了，今天的知识点，我们就讲到这里了，我们来总结一下吧。

一张图来梳理下AnnotationAwareAspectJAutoProxyCreator的注入流程

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303171625614.png)

上图是目前为止，我们分析的AnnotationAwareAspectJAutoProxyCreator注入流程，其中红色背景的部分就是我们今天新分析的内容。

我们来总结一下，在完成初始化后，此时在parsers这个Map中就放入了多个解析器，其中就包括这个AspectJAutoProxyBeanDefinitionParser解析器

然后在解析的过程中，会通过标签的名字从parsers获取相应的解析器，比如我们这里要处理aspectj-autoproxy标签的话，那么对应的解析器就是AspectJAutoProxyBeanDefinitionParser

接着在AspectJAutoProxyBeanDefinitionParser解析器的处理中，首先会将AnnotationAwareAspectJAutoProxyCreator注册到beanDefinitionMap中，接着根据标签中配置的`proxy-target-class`和`expose-proxy`属性的值，进一步设置AnnotationAwareAspectJAutoProxyCreator的proxyTargetClass和exposeProxy属性

最后就是根据AnnotationAwareAspectJAutoProxyCreator的BeanDefinition定义，完成AnnotationAwareAspectJAutoProxyCreator这个bean的实例化和初始化了。

而一旦AnnotationAwareAspectJAutoProxyCreator完成了bean的实例化和初始化，那么在创建AOP代理的时候，就可以愉快的来使用AnnotationAwareAspectJAutoProxyCreator这个bean了。