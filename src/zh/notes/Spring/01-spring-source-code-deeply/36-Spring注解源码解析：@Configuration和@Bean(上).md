---
title: 36-Spring注解源码解析：@Configuration和@Bean(上)
category:
  - Spring源码
star: true
date: 2023-03-31
---

<!-- more -->

<h1 align="center">36_Spring注解源码解析：@Configuration和@Bean（上）</h1>

## 开篇

上一节，我们已经分析了通过注解来配置bean的一种比较经典的方式，也就是通过@Component注解来配置bean，Spring容器启动时就会到指定的路径下扫描，如果发现某个类上标注了@Component注解，就会像扫描xml中的bean标签一样，将类中的信息封装为BeanDefinition并注册到Spring容器中。

而且，我们也看到了注解@Controller、@Service以及@Repository，这些注解上面也是带有注解@Component的，所以Spring在扫描这些注解时，也会将它们解析成BeanDefinition并注入到Spring容器中的。

------

这一节，我们了解一下另外一种配置bean的方式，也就是通过注解@Configuration搭配注解@Bean来配置bean，这一节主要分为以下几个部分：

1. 先来看下注解@Configuration是如何搭配注解@Bean使用的

2. 然后了解下ConfigurationClassPostProcessor类到底是什么？

3. 接着初步看下ConfigurationClassPostProcessor类中的方法postProcessBeanDefinitionRegistry

4. 再来看下Spring是如何在众多类中筛选出添加了注解@Configuration的注解配置类

5. 筛选出这些注解配置类之后，再看下Spring是如何解析这些注解配置类中的各种注解信息的

6. 再看下Spring又是如何解析注解配置类中，那些添加了注解@Bean的方法的

7. 最后来看下Spring又是如何处理，通过解析@Bean的方法得到的BeanDefinition

---

## @Configuration和@Bean的使用

和前面的注解@Component一样，注解@Configuration和@Bean我们也先来简单使用一下：

```java
public class Student {

	private String name = "ruyuan";

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	@Override
	public String toString() {
		return "Student{" +
				"name='" + name + '\'' +
				'}';
	}

}
```

和之前的一样，先创建一个简单的java类Student，接着，我们再创建一个Student类的注解配置类StudentConfig：

```java
@Configuration
public class StudentConfig {

	@Bean
	public Student student() {
		return new Student();
	}

}
```

可以看到，在StudentConfig类上添加了注解@Configuration，并且在StudentConfig类中还添加了方法student，其中，方法student上添加了注解@Bean，student方法中的逻辑比较简单，就是通过new关键字创建了一个Student对象并返回。

我们可以把添加了注解@Configuration的类，理解为是之前的xml配置文件，而添加了注解@Bean的方法，可以理解为是xml配置文件中的bean标签。

我们可以通过注解@Bean到某个方法，以此来配置我们想要的bean，而且，通过添加注解@Bean来配置bean的方式相比于xml而言更加的灵活，因为可以在方法中自定义bean的实例化方式。

------

然后，我们通过一段代码来看下bean的加载：

```java
public class ApplicationContextDemo {

	public static void main(String[] args) throws Exception {
		AnnotationConfigApplicationContext ctx =
				new AnnotationConfigApplicationContext(
						"com.ruyuan.container.annotation.configuration");

		StudentConfig studentConfig = (StudentConfig) ctx.getBean("studentConfig");
		Student student = (Student) ctx.getBean("student");

		System.out.println(studentConfig);
		System.out.println(student);
	}

}
```

我们运行一下看下效果：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302021336876.png)

可以看到，添加了注解@Configuration和@Bean相应的bean都加载出来了。

------

类似注解@Component，**注解@Configuration标注的类对应bean的名称生成规则，默认是以类名第一个字母小写，其他字母不变的方式生成的**，如StudentConfig对应bean的名称为“studentConfig”，而**注解@Bean标注方法创建出来的bean，默认是以方法名作为bean的名称**，当然，我们**也可以在注解@Bean中的name属性上，指定bean的名称**。

而且，我们仔细观察下打印的信息可以发现，StudentConfig类对应的bean的信息后缀中，包含了字符串“EnhancerBySpringCGLIB$$”。

------

了解动态代理模式的同学可能马上就意识到了，Spring底层其实就是通过cglib动态代理的方式，来实例化添加@Configuration注解类的bean的，而注解@Bean标注的方法对应的bean实例，默认是按照我们在方法中实例化bean的方式创建的。

为什么这两个注解创建出来的bean实例，会有这么大的不同呢？接下来，我们深入到这两个注解的底层源码来一探究竟。

---

## ConfigurationClassPostProcessor是什么呢？

通过案例可以知道，我们依然可以像扫描注解@Component一样，到指定相应的包路径去扫描被注解@Configuration标注的类。

那注解@Configuration和注解Component之间有什么关系呢？我们可以到注解@Configuration中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302021412318.png)

可以看到，注解@Configuration上面居然也添加了@Component注解，难怪添加了注解@Configuration的bean也可以被Spring扫描到，走的其实就是我们上节课分析的逻辑。

------

现在最为关键的，就是要看下Spring是如何处理添加了注解@Configuration的类，其中，生成cglib动态代理的细节是怎么样的，以及注解@Bean标注的方法对应的bean又是如何生成的呢？

既然要分析，我们就要先找到这块源码的入口，因为这一切都是围绕注解@Configuration展开的，所以，我们可以到注解@Configuration对应的类中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302021412315.png)

当我们再次到注解@Configuration中寻找线索时，发现其中有一个类ConfigurationClassPostProcessor比较可疑，通过类的名称我们可以知道，它应该和后处理器脱不开关系。

------

而后处理器前面我们已经了解过了，总共分为工厂级别的后处理器BeanFactoryPostProcessor和Bean的后处理器BeanPostProcessor这两种，那ConfigurationClassPostProcessor到底是属于哪种呢？我们可以分析下ConfigurationClassPostProcessor，先来看下它的类继承关系：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302021412545.png)

可以看到ConfigurationClassPostProcessor是接口BeanFactoryPostProcessor的实现类，也就是说ConfigurationClassPostProcessor本质上来说就是一个工厂级别的后处理器BeanFactoryPostProcessor。

------

我们发现ConfigurationClassPostProcessor，同时也是实现了接口BeanDefinitionRegistryPostProcessor的，之前我们在分析高级容器ApplicationContext初始化时，已经看到了。

如果实现了接口BeanDefinitionRegistryPostProcessor，Spring容器在初始化的refresh方法中，会先执行接口BeanDefinitionRegistryPostProcessor中的postProcessBeanDefinitionRegistry方法，最后统一执行接口BeanFactoryPostProcessor中的postProcessBeanFactory方法。

因为ConfigurationClassPostProcessor还实现了接口PriorityOrdered和Ordered，所以在具体执行时，还会根据优先级进行排序。

------

分析到现在，我们已经初步知道ConfigurationClassPostProcessor类是什么，并且它是在什么时候执行的，那现在还有一个问题，ConfigurationClassPostProcessor这个工厂后处理器，是在什么时候注册到Spring容器中的呢？

这个问题也好办，不知道大家还记得上一篇文章中，在**组件AnnotatedBeanDefinitionReader初始化时注册了一些后处理器**：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302021412363.png)

现在回过头来看，可以发现这些后处理器中，**其中就包括了ConfigurationClassPostProcessor**。

---

## 初探方法postProcessBeanDefinitionRegistry

现在，我们已经知道**ConfigurationClassPostProcessor**，其实就是一个**工厂级别的后处理器BeanFactoryPostProcessor**，并且它同时也实现了接口BeanDefinitionRegistryPostProcessor，接下来我们分析源码的思路就清晰多了。

现在，我们已经知道ConfigurationClassPostProcessor，其实就是一个工厂级别的后处理器BeanFactoryPostProcessor，并且它同时也实现了接口BeanDefinitionRegistryPostProcessor，接下来我们分析源码的思路就清晰多了。

也就是说在Spring容器初始化，**首先会执行ConfigurationClassPostProcessor中，接口BeanDefinitionRegistryPostProcessor中的方法`postProcessBeanDefinitionRegistry`，然后再执行BeanFactoryPostProcessor中的方法`postProcessBeanFactory`**。

------

那我们当然先从ConfigurationClassPostProcessor中，接口BeanDefinitionRegistryPostProcessor中的方法postProcessBeanDefinitionRegistry开始入手分析：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302021518098.png)

可以看到，方法最开始先通过System的方法identityHashCode，获取容器registry对应的hash code，接下来再判断一下集合registriesPostProcessed以及集合factoriesPostProcessed中是否存在该hash code。

通过if分支中的异常信息，我们可以很容易的知道当前这两个if分支中的逻辑，其实是在判断方法postProcessBeanDefinitionRegistry和方法postProcessBeanFactory是否已经被执行过了，而这两个集合的作用主要就是用来避免这两个方法被重复执行的。

------

接下来，我们到方法processConfigBeanDefinitions中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302021518402.png)

方法processConfigBeanDefinitions中的代码量依然是挺大的。

但是，方法processConfigBeanDefinitions中的逻辑还比较关键，添加了注解@Configuration的类的解析，基本上都是以当前方法为入口开始的，所以，我们还是有必要来认真看下这块逻辑的。

------

接下来，我们分段来看下方法processConfigBeanDefinitions中的代码逻辑：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302021518733.png)

首先通过方法getBeanDefinitionNames，从Spring容器registry中，获取已经注册到Spring容器的BeanDefinition的名称，然后在for循环中遍历这些BeanDefinition。

我们继续看下for循环中的逻辑：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302021518686.png)

可以看到，在for循环的第一个if分支中，如果发现BeanDefinition中不存在属性“*org.springframework.context.annotation.ConfigurationClassPostProcessor.configurationClass*”的值时，这就意味着注解配置类的BeanDefinition并没有被处理过。

第一次执行该方法时，默认是没有这个属性值的，所以接下来就会到else if分支中，通过ConfigurationClassUtils的方法**`checkConfigurationClassCandidate`**，看下当前的BeanDefinition是否满足候选条件，也就是**判断是否属于添加了注解@Component的注解配置类**。

------

为什么要筛选出符合条件的BeanDefinition呢？因为我们**在指定路径下，不仅会扫描到添加了注解@Configuration的类，而且也会扫描到其他添加了注解@Component的类**。

这块的原理前面我们上节课都讲解过了，所以，方法**`checkConfigurationClassCandidate`**中，只需要**筛选出添加了注解@Configuration的注解配置类的BeanDefinition**。

---

## 筛选出符合候选条件的注解配置类

我们到方法checkConfigurationClassCandidate中，看下具体的筛选逻辑是什么：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302021550582.png)

如果BeanDefinition中的类名称都为null，或者当前BeanDefinition中配置了工厂方法。

根据前面的学习，我们知道**配置工厂方法，就意味着当前BeanDefinition定义了实例化对象的逻辑了**，所以，在这两种情况下都意味着当前的BeanDefinition，都不符合成为注解配置类BeanDefinition的条件，此时会直接返回false。

------

初步过滤之后，我们继续看后面：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302021550262.png)

接下来会获取BeanDefinition中，所有注解的元数据metadata，可以看到，不管你当前的BeanDefinition是注解AnnotatedBeanDefinition类型的实例，还是普通的类型AbstractBeanDefinition的实例，最终都要获取到BeanDefinition中所有注解的信息。

如果BeanDefinition不是注解类型的，就会通过AnnotationMetadata或MetadataReader来辅助加载注解的元数据metadata，不管怎样，这些逻辑都是在想尽办法来获取注解元数据。

------

获取到BeanDefinition上的注元数据之后，可以猜到的是，接下来肯定要根据注解元数据来进一步判定了，我们继续往后看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302021550885.png)

果然，接下来就会从注解元数据中，尝试获取注解@Configuration的信息，并将信息封装在config中。

如果config不为空，且注解@Configuration中的属性proxyBeanMethods值为true，此时第一个if分支条件成立，此时在BeanDefinition中将属性“*org.springframework.context.annotation.ConfigurationClassPostProcessor.configurationClass*”的值设置为*CONFIGURATION_CLASS_FULL，也就是“full”。*

------

而注解@Configuration中的属性proxyBeanMethods的值，默认就是true，所以，这里默认会将该属性值设置为CONFIGURATION_CLASS_FULL，也就是“full”，最后就没什么了，通过getOrder方法，获取注解元数据中注解@Order的属性值，并设置到BeanDefinition中。

------

可以看到，**方法`checkConfigurationClassCandidate`就是通过是否存在@Configuration注解，且该注解中的属性proxyBeanMethods的值是否为默认的true，以此来判断当前的BeanDefinition是符合条件的注解配置类**。

---

## 如何解析注解配置类的信息呢？

获取到了符合条件的注解配置类之后，我们回到方法processConfigBeanDefinitions中：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302021745612.png)

接下来集合configCandidates通过sort方法，对集合内的元素进行一个排序，排序的规则也比较简单，就是通过解析到的注解@Order中的属性值来排序，值越小优先级越大。

然后判断registry是否是SingletonBeanRegistry的实例，默认registry是SingletonBeanRegistry的实例，接下来会初始化一个组件BeanNameGenerator，主要负责生成bean的名称，这里默认获取到的generator为null。

------

这块逻辑倒没什么特别重要，我们再往后面看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302021745318.png)

可以看到，这里初始化了一个组件ConfigurationClassParser，根据名称我们可以知道，它应该就是解析注解配置类的一个解析器。

确实，我们从接下来的代码可以看到，首先将我们获取到的注解配置类configCandidates，先封装到集合candidates中，然后交给解析器parser解析。

------

我们到解析器ConfigurationClassParser中的方法parser中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302021745959.png)

可以看到，方法parser中的逻辑还是挺清晰的，可以看到在if分支中，分别对注解类型的AnnotatedBeanDefinition、普通类型的AbstractBeanDefinition都有相应的解析逻辑。

当然，我们这里当然是注解类型的AnnotatedBeanDefinition，所以调用的是第一个if分支中的parse方法，可以看到，接下来会将刚才解析到的注解元数据作为参数，传到parse方法中。

------

我们跟进到方法parse中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302021745187.png)

在方法parse中，首先将注解元数据metadata以及bean的名称，都封装到了组件ConfigurationClass中，我们继续跟进看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302021745162.png)

在方法processConfigurationClass中，首选从Map类型的configurationClasses中，根据参数configClass获取value值，初次执行该方法existingClass肯定是为null的。

接下来会执行方法doProcessConfigurationClass，对注解配置类信息configClass进行深度的解析，然后将解析完毕的configClass缓存到configurationClasses中。

------

我们可以到方法doProcessConfigurationClass中简单看一下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302021745735.png)

可以看到，方法doProcessConfigurationClass中的逻辑，主要就是对注解配置类中的各种其他注解进行解析，毕竟添加了注解@Configuration的类当中，可能还会添加其他的注解。

------

比如，在方法doProcessConfigurationClass中会解析注解@PropertySource、@ComponentScans、@ImportResource等，当然，这块我们简单了解下即可。

但是，我们可以发现最终会将解析到的注解信息，都设置到configClass中了，而且，我们在上个方法也看到了，解析得到的configClass最终会被添加到configurationClasses中。

---

## 解析添加了注解@Bean的方法

所以，我们抓住这个细节点继续往后面看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302021802782.png)

果然，我们可以看到，接下来会获取解析器parser中configurationClasses中的元素，并放到集合configClasses中。

同时还初始化了一个组件ConfigurationClassBeanDefinitionReader来解析它们，可以看到，接下来调用的是reader中的方法loadBeanDefinitions。

------

看到方法loadBeanDefinitions我们就要想一下了，添加了注解@Configuration的类肯定早就已经被扫描到，并封装成BeanDefinition注册到Spring容器中了，那现在还有什么类需要注册BeanDefinition吗？

大家可别忘了，添加了注解@Configuration的类，可是相当于一个xml配置文件的，在这个配置类中是可以配置很多其他bean的。

------

比如，我们前面讲过的添加了注解@Bean的方法，这些方法可都是相当于一个个的bean啊，而这些添加注解@Bean的方法，理应也要注册相应的BeanDefinition，而方法loadBeanDefinitions是不是在为方法注册BeanDefinition呢？

所以，我们带着这样的猜想到方法loadBeanDefinition中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302021802693.png)

可以看到，在方法loadBeanDefinitionsForConfigurationClass中，果然开始处理注解配置类中的每个方法，我们再到方法loadBeanDefinitionsForBeanMethod中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302021802205.png)

虽然方法loadBeanDefinitionsForBeanMethod中的逻辑也是挺多的，但是大部分都是我们之前看过的，我们可以快速过一下这个方法。

可以看到在方法中，果然和我们前面猜想的一样开始**解析方法上的注解@Bean，然后为方法创建一个ConfigurationClassBeanDefinition类型的BeanDefinition**。

接下来就是**为BeanDefinition填充各种各样的属性信息**，这些属性大部分我们应该都很熟悉了，**最后通过registry将BeanDefinition注入到Spring容器中**。

---

## 判断并处理刚注册好的BeanDefinition

了解了添加注解@Bean的每个方法，最后都会封装并注册相应的BeanDefinition之后，我们继续往后面看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302021809554.png)

接下来在if分支的逻辑中，如果发现当前Spring容器中注册的BeanDefinition数量，大于candidateNames中的数量，candidateNames其实就是当前方法刚执行时，Spring容器中注册BeanDefinition的数量。

现在，我们解析了注解配置类之后，又为每个添加了注解@Bean的方法封装了BeanDefinition，此时Spring容器中的BeanDefinition数量，肯定是大于之前容器中BeanDefinition的数量啊，所以，接下来我们看下if分支中的逻辑。

------

可以看到，接下来会将已经解析完毕的configClasses，添加到集合alreadyParsedClasses中，然后在for循环中遍历集合newCandidateNames，也就是当前Spring容器中已经注册的那些BeanDefinition的名称。

目的也是很简单，就是想要**看下注解@Bean对应的这些方法解析到的BeanDefinition，是否也存在添加了注解@Configuration的注解配置类，如果存在的话，也是需要添加到集合candidates中，准备开始下一轮while循环的解析的，保证不放过任何一个符合候选条件的注解配置类**。

从while循环的条件中可以发现，直到某一刻candidates为空，也就是没有需要解析处理的注解配置类了，while循环才会退出。

------

我们再来看下最后的一些逻辑：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302021809960.png)

可以看到，最后这里就没什么东西了，就是注册一些单例对象并且清除一些缓存信息，至此，第一个接口方法postProcessBeanDefinitionRegistry的逻辑，我们就先分析到这里了。

------

## 总结

好了，今天的知识点我们就讲到这里了，我们来总结一下吧。

一张图来梳理下当前的流程：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302021809839.png)

这一节，我们首先体验了一下注解@Configuration，一般是如何搭配着注解@Bean使用的，其实注解@Configuration其实就相当于xml配置文件，而注解@Bean则相当于xml中的bean标签，我们可以在@Configuration标注的类中，配置多个带有注解@Bean的方法，每个方法最终都会注册相应的BeanDefinition。

然后，我们到注解@Configuration中看了一下，发现注解@Configuration上面也是添加了注解@Component的，根据我们上节课对@Component注解的分析，添加了注解@Configuration的注解会被注解过滤器过滤出来，并且封装为BeanDefinition注册到Spring容器中。

------

接着，我们从**注解@Configuration中找到源码分析的入口类**，也就是**ConfigurationClassPostProcessor**，并且了解了ConfigurationClassPostProcessor，其实就是一个实现了接口BeanDefinitionRegistryPostProcessor的工厂后处理器BeanFactoryPostProcessor，Spring容器在初始化时就会执行ConfigurationClassPostProcessor中的方法。

所以，我们分析源码的方向就很清晰了，**首先**，我们到ConfigurationClassPostProcessor中，**从接口BeanDefinitionRegistryPostProcessor中的接口方法postProcessBeanDefinitionRegistry开始分析**。

------

在方法postProcessBeanDefinitionRegistry中，首先会遍历Spring容器中所有的BeanDefinition，然后判断这些BeanDefinition中是否存在注解@Configuration，以此来筛选符合条件的注解配置类。

然后，Sping会进一步解析注解配置类，也就是添加了注解@Configuration类中的其他的注解信息，比如`@PropertySources`、`@ComponentScans`、`@ImportResource`等注解。

接着会遍历注解配置类中，每个添加了注解@Bean的方法，然后为每个方法都创建相应的BeanDefinition并注册到Spring容器中。

------

最后，会对这些@Bean生成的BeanDefinition，也进行一下检查，看下它们是否符合注解配置类的候选条件，如果它们也符合注解配置类的候选条件的话，也会对这些方法生成的BeanDefinition进行以上相同流程的处理。