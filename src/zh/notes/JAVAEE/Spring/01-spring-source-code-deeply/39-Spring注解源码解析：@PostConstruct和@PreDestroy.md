---
title: 39_Spring注解源码解析：@PostConstruct和@PreDestroy
category:
  - Spring源码
star: true
date: 2023-03-31
---

<!-- more -->

<h1 align="center">39_Spring注解源码解析：@PostConstruct和@PreDestroy</h1>

## 开篇

上一节，我们了解了@Autowired注解的底层原理，Spring会通过Bean的后处理器AutowiredAnnotationBeanPostProcessor，解析bean实例中的字段和方法上的注解@Autowired，最后会将对应的注解信息注入到属性或方法参数上。

------

今天，我们再来了解下另外两个注解，也就是注解@PostConstruct和注解@PreDestory，看下Spring底层是如何解析这两个注解的，这一节主要分为以下几个部分：

1. 我们先通过一个案例，体验下注解@PostConstruct和注解@PreDestory是如何使用的

2. 接着寻找下注解@PostConstruct和注解@PreDestory的源码入口是在什么位置

3. 再来看下添加了这两个注解的类，Spring在底层又是如何解析它们的

4. 最后来看下Spring是如何执行注解@PostConstruct对应初始化方法的

------

## @PostConstruct和@PreDestory的使用

同样的，在分析注解@PostConstruct和注解@PreDestory的底层源码之前，我们先来体验下这两个注解是如何使用的：

```java
@Component
public class Student {

	@PostConstruct
	public void init() {
		System.out.println("初始化方法...");
	}

	@PreDestroy
	public void destroy() {
		System.out.println("销毁方法...");
	}

}
```

首先，我们先创建一个简单的java类Student，然后在Student类中添加了两个方法，分别是方法init和方法destroy，然后，我们分别在这两个方法上添加注解@PostConstruct和注解@PreDestroy。

------

看到代码，大家应该就知道这两个注解是怎么回事了；前面我们在bean实例初始化阶段，讲解过bean标签中的属性init-method和destroy-method，它们分别是用来指定bean实例的的初始化方法和销毁方法的，而这两个注解和这两个属性的效果其实是类似的。

当Student对应的bean实例化后，会进入都初始化阶段，初始化时bean实例首先会执行注解@PostConstruct标注的方法，而当Spring容器关闭时bean实例就会销毁，而在bean销毁前会执行注解@PreDestroy标注的方法，简单来说这两个注解的功能就是这样。

------

接下来，我们通过一段代码来测试下：

```java
public class ApplicationContextDemo {

	public static void main(String[] args) throws Exception {
		AnnotationConfigApplicationContext ctx =
				new AnnotationConfigApplicationContext(
						"com.ruyuan.container.annotation.constructordestroy");

		Student student = (Student) ctx.getBean("student");
		System.out.println(student);

		ctx.close();
	}

}
```

我们运行下代码，看下效果：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302081549601.png)

和我们预期的一致，bean对应的实例初始化时执行方法init，当bean销毁之前，执行方法destroy。

------

## 寻找@PostConstruct和@PreDestory的源码分析入口

和之前一样，要分析注解@PostConstruct和注解@PreDestory的底层源码，我们得要先找到源码的入口在哪，那Spring到底是在什么时候解析这两个注解的呢？和之前一样，我们先到这两个注解类中先看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302081549943.png)

比较遗憾的是，不论是在注解@PostConstruct还是注解@PreDestory中都没有找到线索，那就不能直接像分析注解@Autowired一样，有现成的入口可以探索了。

那会不会和解析注解@Autowired的方式类似呢？毕竟注解@PostConstruct和注解@PreDestory有一点是和注解@Autowired类似的，也就是注解是可以添加在方法上的，而前面我们分析注解@Autowired的底层源码时，发现最终是通过Bean的工厂后处理器来处理的。

------

同样的思路，注解@PostConstruct和注解@PreDestory会不会也是交给Bean的后处理器处理的呢？带着这样的想法，我们可以去大概率会用到这两个注解的地方寻找下。

那在什么地方会用到这两个注解呢？对了，也就是在bean实例初始化的时候，bean实例的初始化前面我们已经分析过了，大家还记得在哪个方法吗，我们可以回过头来看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302081549696.png)

方法initializeBean中的逻辑前面已经分析过了，我们可以简单寻找一下，看下哪里会执行Bean后处理器，果然，我们很快就发现在方法initializeBean中，还是有相应的Bean的后处理器执行的。

而且，我们很快就锁定了方法applyBeanPostProcessorsBeforeInitialization和方法applyBeanPostProcessorsAfterInitialization，通过前面的分析我们也知道，这两个方法分别是在执行BeanPostProcessor中的前置和后置处理方法。

------

我们可以先到方法applyBeanPostProcessorsBeforeInitialization中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302081549900.png)

可以看到，这里会执行Bean后处理器中的前置处理方法，我们可以看下大概有哪些Bean的后处理器，看下从类的名称上，能不能找到处理本次注解相关的后处理器：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302081549396.png)

经过一番寻找之后发现，后处理器中InitDestroyAnnotationBeanPostProcessor应该和我们本次的两个注解有关，通过名称我们可以知道，这个Bean的后处理器，应该可以同时处理初始化方法和销毁方法相关的注解信息。

------

我们可以尝试着到InitDestroyAnnotationBeanPostProcessor类中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302081549679.png)

可以看到，InitDestroyAnnotationBeanPostProcessor类中的前置和后置处理方法中，只有前置处理方法postProcessBeforeInitialization是有具体的逻辑实现的，而且，方法中的逻辑结构和前面解析注解@Autowired的逻辑非常的相似。

------

在方法postProcessBeforeInitialization中，我们可以看到通过metadata调用方法invokeInitMethods，很明显方法invokeInitMethods就是在执行初始化相关的方法，这也符合我们前面看到的先执行初始化方法的逻辑，初始化方法的确应也该在这里被执行。

所以，我们初步可以断定Bean后处理器InitDestroyAnnotationBeanPostProcessor，就是用来处理注解@PostConstruct和注解@PreDestory的，接下来，我们一步步来分析下。

------

## 看下方法会处理哪些注解类型

我们回到刚才定位到的方法postProcessBeforeInitialization中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302081550475.png)

我们先从方法findLifecycleMetadata开始：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302081550664.png)

可以看到，方法findLifecycleMetadata的结构，依然和我们前面解析注解@Autowired的方法结构很类似，首先也是去缓存中获取注解的信息，如果没有的话就要重新去解析了。

------

所以，方法findLifecycleMetadata中的逻辑里，最为关键的还是方法buildLifecycleMetadata，我们跟进看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302081550338.png)

方法findLifecycleMetadata一开始先调用AnnotationUtils类中的方法isCandidateClass，判断下当前的类是否符合候选条件。

方法isCandidateClass中的逻辑我们之前已经分析过了，这里，我们重点看下成员变量this.initAnnotationType和this.destroyAnnotationType具体是什么，其实，大家通过这两个成员变量的名称应该就能看出来了，眼见为实我们还是来看下吧：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302081550161.png)

虽然暂时还没有看到这两个成员变量的初始化，但是，我们从它们的setter方法上的注释，基本上可以知道，this.initAnnotationType是用来存放注解@PostConstruct的，而this.destroyAnnotationType则是用来存放注解@PreDestroy的。

------

## 解析方法中的注解信息

了解完这个之后，我们继续往后面看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302081550700.png)

接下来的代码逻辑就简单多了，直接就开始遍历目标类targetClass中的每个方法。

并且，分别会判断下当前方法中，是否存在this.initAnnotationType和this.destroyAnnotationType中的注解类型，也就是判断下方法中是否添加了注解@PostConstruct和注解@PreDestroy。

如果添加了这两个注解，就将方法method封装到LifecycleElement中，然后分别添加到集合currInitMethods和currDestroyMethods中。

------

我们可以看下，在LifecycleElement的构造方法中会如何处理：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302081550272.png)

这里发现了一个比较关键的点，也就是说注解是不允许添加到含参方法中的。

------

了解完这个之后，我们再看下剩下的一些逻辑：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302081550576.png)

可以看到，接下来会将targetClass的父类赋值给targetClass，也就是说接下来在下一轮while循环中，会解析当前类的父类中的注解，最后，将解析到的所有信息封装到组件LifecycleMetadata中并返回。

我们顺便也可以到LifecycleMetadata的构造方法中看一下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302081550779.png)

这里就没什么特别的了，注解@PostConstruct对应的元数据信息，赋值给成员变量this.initMethods，而注解@PreDestory对应的元数据信息，则赋值给成员变量this.destroyMethods。

------

## 执行@PostConstruct对应的初始化方法

解析到了注解的元数据之后，我们再回到方法postProcessBeforeInitialization：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302081550515.png)

接下来，我们再到方法invokeInitMethods中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302081550247.png)

可以看到，方法invokeInitMethods其实就是在遍历注解@PostConstruct相关的信息了，我们可以到element的invoke方法中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302081550977.png)

可以看到，底层其实就是在执行注解@PostConstruct对应的方法，分析到这里，我们应该就能明白原来注解@PostConstruct对应的方法，原来是这样通过反射执行的。

------

## 执行@PreDestroy对应的销毁方法

现在还有最后一个问题，初始化方法我们已经看到了是在哪里执行了，那注解@PreDestory对应的销毁方法是在什么地方执行的呢？

要了解这块，不知道大家还记得bean在实例化的最后，还注册了一个实现了DisposableBean接口的实现类DisposableBeanAdapter，我们可以再到它的destroy方法中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302081550494.png)

果然，我们同样在之前分析过的方法destroy中，找到执行Bean的后处理器的位置。

------

而且，简单对比了下之后，发现前面我们分析的Bean后处理器InitDestroyAnnotationBeanPostProcessor，它同样也是接口DestructionAwareBeanPostProcessor的实现类。

所以，我们可以到InitDestroyAnnotationBeanPostProcessor中的方法postProcessBeforeDestruction看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302081550526.png)

可以看到，这里又重新调用方法findLifecycleMetadata，到bean的类中解析注解@PostConstruct和注解@PreDestory的元数据信息，然后再调用方法invokeDestroyMethods执行注解@PreDestory对应的销毁方法。

看到这里我们基本就明白了，而且，指定初始化和销毁方法有好几种方式，总的来说从执行顺序上，注解指定的方法都是先执行的，接着执行如接口InitializingBean和接口DisposableBean中指定的方法，最后才执行属性init-method和属性destroy-method指定的方法。

------

## 总结

第一，我们先通过一个案例，了解了一下注解@PostConstruct和注解@PreDestory是如何使用的，注解@PostConstruct是用来指定初始化方法的，而注解@PreDestory则是用来指定销毁方法的。

第二，我们寻找了一下解析注解@PostConstruct和注解@PreDestory的源码入口，最终发现是通过Bean的后处理器InitDestroyAnnotationBeanPostProcessor来处理的，而且，在InitDestroyAnnotationBeanPostProcessor中的前置处理方法里，会要解析注解@PostConstruct和注解@PreDestory的信息。

第三，然后，我们也看到了底层其实就是遍历类中的每个方法，并解析方法上的注解信息，其中，我们了解到添加注解@PostConstruct和注解@PreDestory的方法，是不能含有参数的。

第四，最后，我们也看到了在Bean的后处理器InitDestroyAnnotationBeanPostProcessor中，先执行注解@PostConstruct对应的初始化方法，然后在bean销毁时再执行注解@PreDestory对应的销毁方法，这样就符合我们案例中看到的现象了。