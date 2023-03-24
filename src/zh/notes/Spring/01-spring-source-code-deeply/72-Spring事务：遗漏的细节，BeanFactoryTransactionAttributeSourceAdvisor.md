---
title: 72_Spring事务：遗漏的细节，BeanFactoryTransactionAttributeSourceAdvisor
category:
  - Spring源码
star: true
sticky: true
date: 2023-03-24
---

<!-- more -->

## 开篇

大家好，经过前边几节的讲解，我们知道，@Transactional的核心其实就是BeanFactoryTransactionAttributeSourceAdvisor这个Advisor了。

而这个BeanFactoryTransactionAttributeSourceAdvisor中有几个极为重要的方法，比如getPointcut()方法会返回切点信息，用于匹配判断一个bean在初始化过程中是否需要创建代理对象，再比如getAdvice方法会返回TransactionInterceptor拦截器，事务处理的核心逻辑都在TransactionInterceptor拦截器中完成的。

所以这个BeanFactoryTransactionAttributeSourceAdvisor是非常非常重要的，我们在分析源码的时候，会发现这个bean在我们用的时候，就已经存在于IOC容器中了，我们是直接可以使用的。

由于这个BeanFactoryTransactionAttributeSourceAdvisor实在太重要了，所以我们非常有必要来研究一下它的注入时机和注入过程，只有这样，大家才能真正把握住Spring事务整体原理，要不总会感觉哪里缺少了一点东西。

ok，那现在废话不多说，本节的主要内容如下：

1. 我们首先会来看下，BeanFactoryTransactionAttributeSourceAdvisor的注册时机
2. 然后会来看下，事务命名空间URI是什么
3. 接着再来看下，通过事务命名空间URI，获取命名空间处理器全限定类名的过程
4. 在获取到命名空间处理器全限定类名后，接着来看下，创建命名空间处理器实例的过程
5. 在一切准备就绪后，来看下通过annotation-driven标签，获取对应解析器的过程
6. 最后就是来看下解析器的解析过程了，说白了就是将BeanFactoryTransactionAttributeSourceAdvisor注册到beanDefinitionMap的过程

---

## BeanFactoryTransactionAttributeSourceAdvisor的注册时机

首先我们要来分析的就是BeanFactoryTransactionAttributeSourceAdvisor的注入时机了，在分析之前，我们可以来类比一下。

其实之前我们分析AOP的时候，里边有一个非常重要的bean，那就是AnnotationAwareAspectJAutoProxyCreator，它是创建AOP代理的核心组件，那么大家还记得这个bean的注入时机吗？

这个我们之前专门讲过哦，如果大家这里想不起来的话，可以回头在复习下，其实上边这个bean的注入时机，就是需要配置aop:aspectj-autoproxy标签，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303231755567.png)

因为只有配置了aop:aspectj-autoproxy标签，那么才会开启AOP代理的功能，那么此时注入AnnotationAwareAspectJAutoProxyCreator才是有意义的，那如果人家压根都不需要创建AOP代理，那么还注入AnnotationAwareAspectJAutoProxyCreator不就多此一举了吗？

其实呢，事务这块也是一样的！

对于事务来说，想要开启事务功能的话，需要配置tx:annotation-driven标签才行，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303231755264.png)

说白了就是，在xml中配置了tx:annotation-driven标签后，那么就说明需要开启事务功能，这个时候就需要将事务Advisor，也就是BeanFactoryTransactionAttributeSourceAdvisor注入到IOC容器中以备后用啦，就是这个意思。

**所以BeanFactoryTransactionAttributeSourceAdvisor这个Advisor的注入时机，其实就是一旦配置了`tx:annotation-driven`标签，那么就表示需要被注入**。

---

## 事务命名空间URI是什么？

在知道了BeanFactoryTransactionAttributeSourceAdvisor的注入IOC的时机后，那么接下来，我们来看下它的一个注入过程是什么样的。

那么现在问题来了，我们应该从哪里开始分析呢？

其实很简单，既然tx:annotation-driven是一个标签，那么我们当然是从解析标签的位置，开始进行分析啦，其实就是下边这块代码，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303231935172.png)

我们之前讲过，像`tx:annotation-driven`这种标签其实属于自定义标签，所以会走自定义标签的解析处理。

而上边的代码呢，相信大家都记得，上边红框中的代码，就是解析自定义标签的入口，我们之前详细分析过解析自定义标签的整个过程，那么今天呢，我们就当做复习，来看下`tx:annotation-driven`标签解析的全过程。

首先我们从parseCustomElement()方法开始，代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303231936272.png)

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303231936402.png)

我们知道，上边的代码呢，首先就是获取标签元素对应的命名空间URI，也就是namespaceUri，对于`tx:annotation-driven`标签来说，namespaceUri的值其实为`http://www.springframework.org/schema/tx`，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303231936794.png)

我们可以看到，事务命名空间URI其实就是http://www.springframework.org/schema/tx，我们只有只有引入这个事务的命名空间URI，才能使用事务相关的标签，比如`tx:annotation-driven`标签。

---

## 通过spring.handlers获取命名空间处理器全限定类名

好了，知道什么是命名空间URI后，我们接着往下进行分析，我们来看下边这张图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303232006929.png)

我们可以看到，上边红框中的代码呢，主要就是在获取到命名空间URI后，调用了resolve()方法。

我们知道，通过这个resolve()方法，就可以通过命名空间URI获取到相应的命名空间处理器，那么接下来，我们就来看下resolve()方法的处理流程，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303232006017.png)

上边就是resolve()方法的代码了，之前我们都讲过，这里我们来简单复习一把。

首先刚进入这个方法时，会执行下边这行代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303232006097.png)

大家还记得上边这行代码在干嘛吗？

忘记的话也没关系，我们跟踪进去来看下，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303232006588.png)

我们可以看到，上边红框中的代码，在读取配置文件，而读取的配置文件路径其实就是handlerMappingsLocation变量的值。

那大家还记得，handlerMappingsLocation变量是怎么被赋值的吗？

其实是在，构造方法中进行赋值的，我们看下边这张图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303232006849.png)

通过上边的代码，我们可以看到，其实handlerMappingsLocation是在构造方法中被赋值的，而这个DefaultNamespaceHandlerResolver一共有3个构造方法。

而默认呢，就会将handlerMappingsLocation变量的值赋值为META-INF/spring.handlers。

那也就是说，上边红框的代码，其实就是要读取META-INF/spring.handlers配置文件。

那现在就好办了，我们来找下spring.handlers配置文件呗，那我们项目引入的jar包这么多，重点到哪个jar包找呢？

其实也非常简单，我们现在是在找事务相关的配置文件，那当然要去Spring的tx包下去找啦，然后我们就找到了这个配置文件，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303232006116.png)

通过上图，可以看到，在tx包下的spring.handlers配置文件中，有一条核心配置，而配置的key为http\://www.springframework.org/schema/tx，这个key其实就是xml中事务的命名空间URI

然后对应的value为org.springframework.transaction.config.TxNamespaceHandler，我们知道，这个其实就是事务命名空间处理器的全限定类名。

我们继续往下看，在获取到上边的配置后，就会执行下边这行代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303232006252.png)

我们知道，上边代码中的handlerMappings，其实就是spring.handlers中配置的映射关系。

同时我们知道这个namespaceUri，其实就是事务的命名空间URI，也就是http://www.springframework.org/schema/tx

说白了，这里就是将http://www.springframework.org/schema/tx作为key，从spring.handlers中配置的映射关系中，获取到对应的命名空间处理器的全限定类名，而此时获取到的全限定类名就是`org.springframework.transaction.config.TxNamespaceHandler`。

---

## 利用反射创建命名空间处理器实例

ok，我们接着往下看，在获取到全限定类名org.springframework.transaction.config.TxNamespaceHandler之后，接下来就会执行这块代码了，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303232014590.png)

上边的代码呢，我们之前都是讲过呢，所以就不展开详细讲了，我们挑重点的来讲一下。

在上边的代码中，说白了主要干了两件事儿，第一件事儿就是实例化命名空间处理器，相关代码如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303232014189.png)

可以看到，上边其实就是通过，命名空间处理器的全限定类名，首先利用反射获取到了TxNamespaceHandler类的Class对象，接着通过instantiateClass()方法完成了命名空间处理器TxNamespaceHandler的创建。

而第二件事儿，就是在TxNamespaceHandler实例创建好之后，进行初始化操作，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303232014781.png)

说白了，上边就是在执行TxNamespaceHandler类的init()方法进行初始化。

然后当我们跟踪进去init()方法后，会看到下边这块代码，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303232014642.png)

我们从上图的代码中，看到了非常熟悉的annotation-driven，这个就是我们在xml文件中，配置的用于开启事务的标签。

有了前边解析自定义标签的经验后，我们知道，其实上边的代码呢，就是注册了三个解析器，比如这个annotation-driven对应的解析器就是AnnotationDrivenBeanDefinitionParser。

而所谓的注册解析器，说白了就是将annotation-driven作为key，同时new出来一个AnnotationDrivenBeanDefinitionParser的实例作为value，放入到了一个Map中罢了，我们看下边的代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303232014850.png)

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303232014306.png)

我们可以看到，其实registerBeanDefinitionParser()方法，就是往一个叫做parsers的Map中添加键值对罢了，非常的简单。

ok，在完成初始化操作后，那么resolve()方法就会将命名空间处理器作为结果返回，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303232014679.png)

到这里，resolve()方法的任务就完成了。

---

## 获取annotation-driven标签对应的解析器

当通过resolve()方法拿到命名空间处理器之后，接下来就会执行下边这行代码，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303232019735.png)

那么上边这行代码呢，明显是在做解析处理。

那现在我们就趁热打铁，来看下parse()方法内部是怎么玩儿的，此时parse()方法代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303232020628.png)

可以看到，上边的代码，首先调了findParserForElement()方法，而之前我们讲过，通过这个findParserForElement()方法，可以找到标签元素相应的解析器。

在获取到解析器parser之后，就会使用这个解析器来解析标签元素了，其实就是会执行解析器的parse()方法。

首先，我们来看下findParserForElement()方法是怎么来获取解析器的，findParserForElement()方法代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303232020916.png)

通过上图，我们可以看到，其实在获取解析器时，是从parsers这个Map中获取的。

而当前解析的标签呢，我们知道是annotation-driven标签，所以此时就会从parsers这个Map中获取到相应的解析器实例。

我们再回头来看下，在注册解析器时，annotation-driven标签对应的是哪个解析器，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303232020369.png)

通过上图，我们可以看到，在初始化时，annotation-driven标签对应的解析器是AnnotationDrivenBeanDefinitionParser。

而在获取到AnnotationDrivenBeanDefinitionParser解析器之后，接下来就会真正开始执行解析标签的操作了，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303232020766.png)

我们知道，此时获取的解析器是AnnotationDrivenBeanDefinitionParser，所以上边的代码说白了，就是调用AnnotationDrivenBeanDefinitionParser类的parse()方法。

---

## 将BeanFactoryTransactionAttributeSourceAdvisor注册到beanDefinitionMap中

那现在就好办了，我们直接来看下AnnotationDrivenBeanDefinitionParser类的parse()方法，代码如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303232032202.png)

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303232032308.png)

通过上边的代码，我们可以看到，其实核心代码都在AopAutoProxyConfigurer类的configureAutoProxyCreator()方法中。

在这个configureAutoProxyCreator()方法中，我们看到了心心念的TransactionInterceptor和BeanFactoryTransactionAttributeSourceAdvisor。

可以看到，在这个方法中，主要干了四件事儿，第一件事儿，就是创建事务拦截器TransactionInterceptor的beanDefinition，并且为beanDefinition完善了属性。

第二件事儿，就是创建BeanFactoryTransactionAttributeSourceAdvisor对应的beanDefinition，而BeanFactoryTransactionAttributeSourceAdvisor这个advisor就是@Transactional中最核心的组件！

第三件事儿，就是将TransactionInterceptor拦截器设置到了BeanFactoryTransactionAttributeSourceAdvisor的adviceBeanName属性中，而这个adviceBeanName就表示增强的beanName。

第四件事儿，就是将构建好的BeanFactoryTransactionAttributeSourceAdvisor放入beanDefinitionMap中，而具体的注册代码如下：

```java
@Override
	public void registerBeanDefinition(String beanName, BeanDefinition beanDefinition)
			throws BeanDefinitionStoreException {

        // 省略部分代码
        
		//判断beanDefinitionMap中是否存在名称为beanName的BeanDefinition：beanDefinitionMap就是Spring容器
		BeanDefinition existingDefinition = this.beanDefinitionMap.get(beanName);
		if (existingDefinition != null) {
			//如果配置BeanDefinition不能被覆盖，此时就会报错
			if (!isAllowBeanDefinitionOverriding()) {
				throw new BeanDefinitionOverrideException(beanName, beanDefinition, existingDefinition);
			}
            
			// 省略部分代码
            
            //将BeanDefinition放入到beanDefinitionMap中
			this.beanDefinitionMap.put(beanName, beanDefinition);
		}
		else {
			// 省略部分代码
            
            // Still in startup registration phase
            //将BeanDefinition放入到beanDefinitionMap中
            this.beanDefinitionMap.put(beanName, beanDefinition);
            //记录beanName
            this.beanDefinitionNames.add(beanName);
            removeManualSingletonName(beanName);
			
		}

		// 省略部分代码
	}
```

通过上边代码，我们可以看到，其实核心呢，就是将BeanFactoryTransactionAttributeSourceAdvisor对应的beanDefinition放入到了beanDefinitionMap中，而一旦将beanDefinition注册到beanDefinitionMap中，那么就代表注册完成了。

可以看到，在将beanDefinition放入beanDefinitionMap中时，使用的beanName是通过入参传进来的，我们知道，后边在使用的时候，就是通过beanName来使用BeanFactoryTransactionAttributeSourceAdvisor这个bean的，所以这个beanName非常重要。

那我们现在就来看下，在传参的时候，这个beanName传进来的是什么，我们看下边的代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303232032157.png)

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303232032485.png)

通过上边的代码，我们可以看到，其实BeanFactoryTransactionAttributeSourceAdvisor对应的beanName是通过一个静态常量赋值的，而这个静态常量的值为`org.springframework.transaction.config.internalTransactionAdvisor`。

这下就全搞通了，正是因为在这里，完成了BeanFactoryTransactionAttributeSourceAdvisor的注册，所以在增强匹配阶段，才可以直接从IOC容器中，通过`org.springframework.transaction.config.internalTransactionAdvisor`这个beanName获取到BeanFactoryTransactionAttributeSourceAdvisor这个advisor！

---

## 总结

好了，今天的知识点，我们就讲到这里了，我们来总结一下吧。

一张图来梳理下@Transactional的原理

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202303/202303232033191.png)

上图是目前为止，我们分析的@Transactional的源码流程图，我们来一起总结一下。

今天我们主要分析了BeanFactoryTransactionAttributeSourceAdvisor注册到IOC容器的过程，其实就是上边源码流程图左上角部分的内容，其中绝大部分内容之前都讲过，这里就借着这个机会又复习了一遍，经过这遍复习，相信大家对自定义标签的解析掌握的更扎实了。

其实说白了，就是从tx:annotation-driven自定义标签解析开始处理，首先就是基于spring.handlers配置文件，通过事务的命名空间URI从spring.handlers配置文件中，获取命名空间处理器全限定类名org.springframework.transaction.config.TxNamespaceHandler。

接着基于全限定类名通过反射创建TxNamespaceHandler实例，然后TxNamespaceHandler在初始化的时候，就会注册AnnotationDrivenBeanDefinitionParser解析器，最后通过这个AnnotationDrivenBeanDefinitionParser解析器将BeanFactoryTransactionAttributeSourceAdvisor注册到了beanDefinitionMap中，从而完成了注册。