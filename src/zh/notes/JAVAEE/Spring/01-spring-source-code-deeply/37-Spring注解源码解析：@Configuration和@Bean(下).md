---
title: 37_Spring注解源码解析：@Configuration和@Bean(下)
category:
  - Spring源码
star: true
date: 2023-03-31
---

<!-- more -->

<h1 align="center">37_Spring注解源码解析：@Configuration和@Bean（下）</h1>

## 开篇

上一节，我们了解了注解@Configuration是如何结合注解@Bean使用的了，而且我们也知道Spring在初始化时，会执行工厂后处理器ConfigurationClassPostProcessor中的方法，来处理注解@Configuration标注的注解配置类了。

经过方法postProcessBeanDefinitionRegistry的分析，我们知道了Spring首先会过滤出这些添加了注解@Configuration的注解配置类，然后为注解配置类中的每个注解@Bean标注的方法，都创建一个BeanDefinition并注册到Spring容器中。

------

但是，注解@Configuration以及注解@Bean对应的bean实例，它们分别如何创建的呢？这一节我们来了解下这块内容，主要分为以下几个部分：

1. 先看下如何从Spring容器中，筛选出符合条件的注解配置类的BeanDefinition

2. 然后看下Spring又是如何对注解配置类的class进行增强处理的

3. 再来看下拦截器BeanFactoryAwareMethodInterceptor中都有什么逻辑

4. 接着来看下Spring是如何为注解@Bean对应的bean实例指定bean的名称的

5. 得到bean的名称之后，如果该名称可以从Spring容器中匹配到FactoryBean，再看下又是如何对FactoryBean进行二次增强的呢

6. 最后来看下注解@Bean对应的bean如果是普通类型的话，最终又是如何在增强中获取bean的实例的

---

## 筛选出符合条件的注解配置类

涉及方法：

- `org.springframework.context.annotation.ConfigurationClassPostProcessor#postProcessBeanFactory(ConfigurableListableBeanFactory beanFactory)`
- `org.springframework.context.annotation.ConfigurationClassPostProcessor#enhanceConfigurationClasses(ConfigurableListableBeanFactory beanFactory)`

接下来，我们再来看下第二个接口方法，也就是ConfigurationClassPostProcessor中，工厂后处理器的原生接口BeanFactoryPostProcessor中的postProcessBeanFactory方法：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302071109949.png)

可以看到方法postProcessBeanFactory开始位置的一些代码，和方法postProcessBeanDefinitionRegistry中的逻辑是类似的，都是通过容器获取到一个hash code。

------

然后通过集合factoriesPostProcessed，**判断方法postProcessBeanFactory是否已经被执行过**了，集合factoriesPostProcessed同样也是用来防止方法postProcessBeanFactory被重复执行的，在正式执行postProcessBeanFactory方法的核心逻辑之前，同样会判断下集合registriesPostProcessed中是否已经存在factoryId了。

也就是说这里会**检查下前面的方法postProcessBeanDefinitionRegistry是否已经执行过**了，如果还没有执行过的话，这里还会调用方法processConfigBeanDefinitions，保证postProcessBeanDefinitionRegistry方法的核心逻辑，必须在方法postProcessBeanFactory的核心逻辑执行之前执行。

------

接下来，在方法postProcessBeanFactory中最为关键的逻辑，就是方法enhanceConfigurationClasses了，通过方法名称我们可以知道，方法**enhanceConfigurationClasses**是**对配置类进行一些增强的处理**，这样就离我们前面案例看到的cglib代理类的核心逻辑，越来越近了。

我们到方法enhanceConfigurationClasses中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302071109470.png)

可以看到，在方法enhanceConfigurationClasses中，首先遍历Spring容器中的所有BeanDefinition，并从BeanDefinition中获取属性“*org.springframework.context.annotation.ConfigurationClassPostProcessor.configurationClass*”的值。

前面我们已经看到了，该属性的值为CONFIGURATION_CLASS_FULL，也就是“full”，所以configClassAttr不为空，然后，因为BeanDefinition的确是注解类型的，所以会将BeanDefinition强转为AnnotatedBeanDefinition，并通过方法getFactoryMethodMetadata，获取工厂方法相关的注解信息，当然，我们这里是没有该注解信息的。

------

我们继续往后面看：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302071109612.png)

接下来，因为属性值configClassAttr不为空，且beanDef是AbstractBeanDefinition的实例，所以，if分支逻辑成立，但是里面好像没有什么关键的代码，就是简单判断下BeanDefinition中的类是否存在，如果不存在此时就要通过类加载器加载一下。

然后，我们可以看到，如果发现属性值configClassAttr等于ConfigurationClassUtils.CONFIGURATION_CLASS_FULL，确实，前面我们已经看到了configClassAttr设置的就是该值，所以，接下来就会将符合增强条件的BeanDefinition添加到configBeanDefs中。

而且，我们可以发现如果configBeanDefs为空，直接就会return返回了。

---

## 对注解配置类进行增强操作

涉及方法：

- `org.springframework.context.annotation.ConfigurationClassEnhancer#enhance(Class<?> configClass, @Nullable ClassLoader classLoader)`
- `org.springframework.context.annotation.ConfigurationClassEnhancer#transform(ClassGenerator cg)`
- `org.springframework.context.annotation.ConfigurationClassEnhancer#createClass(Enhancer enhancer)`

我们继续看下方法后面的一些逻辑：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302071321656.png)

可以看到，这里先创建了一个ConfigurationClassEnhancer类型的组件enhancer，通过类名我们可以知道，它应该就是对注解配置类进行增强的组件了。

接下来会遍历configBeanDefs中的每个元素也就是BeanDefinition，通过enhancer组件对注解配置类configClass进行增强，最后将增强好的类enhancedClass重新再设置到BeanDefinition中。

------

所以，核心的增强逻辑应该就是在enhancer中的enhance方法里，我们到方法enhance中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302071321451.png)

看到这里我们应该就能明白了，Spring底层对添加了注解@Configuration注解的类，使用的就是cglib的方式进行增强的。

最终会通过cglib动态代理方式创建一个动态代理出来，这也就是为什么我们案例中，在打印出来的对象信息中含有“CGLIB”这样标识的原因。

------

我们继续看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302071321044.png)

可以看到，在newEnhancer方法中，其中还为enhancer设置了一个策略类BeanFactoryAwareGeneratorStrategy，我们可以到这里类中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302071322211.png)

可以看到，在策略类BeanFactoryAwareGeneratorStrategy中，在增强注解配置类的时候会在原来类的基础之上，添加一个BeanFactory类型的字段，字段名称为“$$beanFactory。”

------

了解完这个之后，我们再到方法createClass中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302071322494.png)

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302071322799.png)

可以看到，这里还为增强的子类添加了一些回调接口，我们看下回调接口CALLBACKS到底是什么：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302071322480.png)

原来回调接口CALLBACKS，其实就是一些拦截器而已。

---

## BeanFactoryAwareMethodInterceptor

我们先看下拦截器BeanFactoryAwareMethodInterceptor中的逻辑：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302071350659.png)

刚才我们看到了，注解配置类增强之后，会添加一个BeanFactory类型的字段，字段名称为“$$beanFactory”。

而我们看到在方法intercept中，果然这里就会检查一下增强后的注解配置类中，是否存在名称为“$$beanFactory”的字段，如果存在的话就会通过反射API为该字段赋值，这样的话，增强后的注解配置类就得到了Spring容器BeanFactory的一个引用了。

---

## 获取@Bean对应bean的名称

涉及方法：

- `org.springframework.context.annotation.ConfigurationClassEnhancer.BeanMethodInterceptor.intercept(Object enhancedConfigInstance, Method beanMethod, Object[] beanMethodArgs, MethodProxy cglibMethodProxy) throws Throwable`
- `org.springframework.context.annotation.ConfigurationClassEnhancer.BeanMethodInterceptor.getBeanFactory(Object enhancedConfigInstance)`
- `org.springframework.context.annotation.BeanAnnotationHelper.determineBeanNameFor(Method beanMethod)`

然后，我们再看下另外一个拦截器，也就是方法拦截器BeanMethodInterceptor：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302071402903.png)

可以看到，首先会调用getBeanFactory方法，从增强的注解配置类实例中获取容器BeanFactory，我们可以到方法getBeanFactory中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302071402961.png)

获取beanFactory的逻辑很简单，就是从我们刚才设置的字段$$beanFactory中获取容器BeanFactory。

------

我们接着往后面看：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302071402758.png)

很明显，BeanAnnotationHelper中的方法determineBeanNameFor，其实就是要获取@Bean对应bean的名称了，我们到方法determineBeanNameFor中，看下bean的名称是如何决定的：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302071402550.png)

看到这里我们就明白了，**Spring默认会使用方法的名称作为bean的名称**。

这和我们案例中看到的现象是一致的，但是，**如果我们在注解@Bean中指定了属性name的值，这个时候Spring优先会使用注解@Bean中name属性的值作为bean的名称**。

---

## 增强FactoryBean类型的bean

涉及方法：

- `org.springframework.context.annotation.ConfigurationClassEnhancer.BeanMethodInterceptor.intercept(Object enhancedConfigInstance, Method beanMethod, Object[] beanMethodArgs, MethodProxy cglibMethodProxy) throws Throwable`
- `org.springframework.context.annotation.ConfigurationClassEnhancer.BeanMethodInterceptor.enhanceFactoryBean(Object factoryBean, Class<?> exposedType, ConfigurableBeanFactory beanFactory, String beanName)`
- `org.springframework.context.annotation.ConfigurationClassEnhancer.BeanMethodInterceptor.createInterfaceProxyForFactoryBean(Object factoryBean, Class<?> interfaceType, ConfigurableBeanFactory beanFactory, String beanName)`
- `org.springframework.context.annotation.ConfigurationClassEnhancer.BeanMethodInterceptor.createCglibProxyForFactoryBean(Object factoryBean, ConfigurableBeanFactory beanFactory, String beanName)`

我们再回到方法intercept中：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302071443081.png)

可以看到，接下来会通过方法factoryContainsBean，判断Spring容器中是否存在名称为beanName的bean，以及在beanName前添加前缀符号“&”后，看下对应的FactoryBean是否存在。

之前我们在分析bean的加载时，已经详细了解过了，如果beanName前面加上符号“&”，就表示要获取该bean对应的FactoryBean。

可以看到，如果这两个条件都满足的话，此时就会从Spring容器中获取factoryBean，然后调用方法enhanceFactoryBean对FactoryBean进行进一步的增强。

------

毕竟，现在我们是要对@Bean对应的bean进行增强，但是，现在却发现通过从@Bean对应的bean上获取的bean名称，居然还可以获取到相应的FactoryBean，此时就需要对它进行进一步的增强处理。

那我们就到方法enhanceFactoryBean中，看下到底是如何对FactoryBean增强的吧：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302071443835.png)

在方法enhanceFactoryBean中，首先判断factoryBean这个类中，类名和方法getObject是否被final关键字修饰，如果factoryBean对应的类或者是方法getObject中，有一个是被final关键字修饰的，则if分支成立。

接下来，会判断exposedType也就是@Bean标注方法的返回值类型、同时也是@Bean对应bean的类型，如果发现bean是接口类型的话，此时会调用方法createInterfaceProxyForFactoryBean创建动态代理，如果不是接口类型的话，直接返回factoryBean了。

------

那方法createInterfaceProxyForFactoryBean中是如何创建动态代理的呢？我们进去看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302071443255.png)

可以看到，方法createInterfaceProxyForFactoryBean中，其实就是通过jdk动态代理来创建动态代理的，当动态代理执行方法时，如果执行方法的名称是“getObject”，此时就会从Spring容器中获取beanName对应的bean实例。

而如果动态代理执行方法名称不是“getObject”时，此时会执行RelectionUtils中的方法invokeMethod方法，我们方法方法invokeMethod中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302071443932.png)

很简单，此时动态代理就会执行FactoryBean中的该方法了。

------

那如果FactoryBean中的类名或方法名，都不是final关键字修饰的，此时会怎么样呢？我们来看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302071443283.png)

可以看到，此时就会执行方法createCglibProxyForFactoryBean，看样子是要创建cglib动态代理，我们进去看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302071443461.png)

方法createCglibProxyForFactoryBean果然就是通过cglib的方式来创建动态代理。

可以看到，首先会创建一个增强的代理类fbClass，然后通过反射API，利用无参构造方法来实例化了一个代理对象fbProxy，最后再为动态代理设置了一个回调接口，也就是方法拦截器MethodInterceptor。

在方法拦截器中的逻辑，和前面的jdk动态代理是类似的，如果当前bean执行的方法名称为“getObject”，此时就会根据名称beanName从Spring容器中获取bean的实例，而如果当前bean执行其他方法，此时就会委托FactoryBean去执行该方法了。

---

## 获取普通类型的bean的增强

涉及方法：

- `org.springframework.context.annotation.ConfigurationClassEnhancer.BeanMethodInterceptor.isCurrentlyInvokedFactoryMethod(Method method)`
- `org.springframework.cglib.proxy.MethodProxy.invokeSuper(Object obj, Object[] args) throws Throwable`
- `org.springframework.context.annotation.ConfigurationClassEnhancer.BeanMethodInterceptor.resolveBeanReference(Method beanMethod, Object[] beanMethodArgs, ConfigurableBeanFactory beanFactory, String beanName)`

我们回到刚才对FactoryBean增强的位置：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302071459781.png)

接下来，我们到方法isCurrentlyInvokedFactoryMethod中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302071459854.png)

这里就会获取工厂方法currentlyInvoked，关于工厂方法我们之前已经讲解过了，如果一个bean配置了属性factory-method，此时可能是通过静态工厂方法来实例化bean，也可以通过实例工厂方法来实例化bean。

如果当前标注了注解@Bean的方法恰好是bean的工厂方法，且方法名称和参数类型都是一致的，此时就返回true。

------

我们看下接下来会干什么事：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302071500985.png)

可以看到，如果被注解@Bean标注的方法，同时还指定了工厂方法，且工厂方法就是当前的@Bean标注的方法，此时就会让当前方法的代理对象cglibMethodProxy去执行invokeSuper方法，调用工厂方法来实例化bean实例。

而如果当前被注解@Bean标注的方法，它的名称既不能在Spring容器中找到对应的FactoryBean，同时当前被注解@Bean标注的方法也没有指定工厂方法，此时就会执行方法resolveBeanReference，我们到方法resolveBeanReference中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302071500445.png)

可以看到，方法resolveBeanReference其实就是通过beanName，从Spring容器中获取bean的实例。

所以，我们可以知道在**注解@Configuration的注解配置类下，不仅会为每个添加了注解@Bean的方法创建cglib动态代理，而且底层动态代理获取到的bean实例的方式，默认的方式还是从Spring容器中获取到的**。

------

至于这些被注解@Bean标注的方法对应的bean实例，究竟是怎么初始化的呢？前面我们也看到了，**添加了注解@Bean的每个方法，都会被封装为BeanDefinition并注册到Spring容器中，而Spring高级容器在初始化阶段，就会将这些非延迟初始化的bean实例给提前初始化好**。

所以，在我们实际要用到这些通过注解@Bean指定的bean时，底层的动态代理就会直接从Spring容器中，获取bean的实例了。

---

## 总结

一张图来梳理下当前的流程：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302071504950.png)

上一节我们分析了工厂后处理器ConfigurationClassPostProcessor中，接口BeanDefinitionRegistryPostProcessor中的方法`postProcessBeanDefinitionRegistry`，方法`postProcessBeanDefinitionRegistry`执行完毕之后，紧接会执行接口BeanFactoryPostProcessor中的方法`postProcessBeanFactory`。

所以，这一节我们继续**从ConfigurationClassPostProcessor中的postProcessBeanFactory方法开始入手分析**，首先也是从Spring容器中，筛选出符合条件的注解配置类对应的BeanDefinition，这次判断的条件，主要是看下BeanDefinition中的属性`org.springframework.context.annotation.ConfigurationClassPostProcessor.configurationClass`的值，是否为`CONFIGURATION_CLASS_FULL`，也就是“full”，上一节我们已经看到过了，**默认情况下，注解@Configuration标注的类对应的BeanDefinition，该属性的值都会被设置为“full”**。

------

然后，我们发现Spring会对添加了注解@Configuration的注解配置类，底层会通过cglib的API来增强生成一个cglib动态代理，而且，我们可以看到在代理类中会多出一个BeanFactory类型的字段“$$beanFactory”，并且还会为代理类设置两个拦截器，分别是`BeanFactoryAwareMethodInterceptor`以及`BeanMethodInterceptor`。

其中，**在拦截器BeanFactoryAwareMethodInterceptor中，主要就是为注解配置类的动态代理类中的字段“$$beanFactory”设置属性值，也就是注入Spring容器**。

------

而**拦截器BeanMethodInterceptor主要就是对注解配置类中，每个标注了注解@Bean方法对应的bean进行增强的**，在BeanMethodInterceptor中，首先会获取每个注解@Bean对应方法bean的名称，默认情况下是以方法名称作为bean的名称，如果注解@Bean中的属性name指定了bean的名称，则bean的名称优先以注解@Bean中的name属性值为准。

接下来，如果发现@Bean标注的方法对应的bean，可以通过刚刚得到的名称获取到FactoryBean，也就是说同时还配置了该bean的FactoryBean来实例化该bean，此时会对当前的bean进行二次增强。

在二次增强的逻辑中，如果FactoryBean的类或者方法getObject被关键字final修饰，此时，如果@Bean标注的方法的返回值是接口类型的，就会通过jdk动态代理方式来生成FactoryBean的动态代理，否则，就会直接返回FactoryBean。

------

但是，如果FactoryBean的类或者方法getObject都没有被关键字final修饰，此时会对FactoryBean使用cglib动态代理的方式为FactoryBean生成一个动态代理。

当然，不管是jdk动态代理还是cglib动态代理，如果当前bean实例调用的方法的名称是“getObject”，此时会根据bean的名称，从Spring容器中获取bean的实例。

------

如果注解@Bean对应的bean实例执行的方法是工厂方法，此时也会交给cglib的动态代理来执行，但是，在默认情况下注解@Bean对应的bean实例，它们在Spring容器中都注册了相应的BeanDefinition的。

Spring容器初始化时就会提前实例化好它们，当我们需要用到这些实例时，默认会从Spring容器根据名称来获取这些bean实例。