<h1 align="center">35_Spring注解源码解析：@Component</h1>

## 开篇

通过前面几节内容，我们了解了一下注解的本质，并且也模拟了一下Spring是如何通过注解来加载bean的，

从这一节开始，我们开始深入到Spring源码，看下我们常用注解的背后是如何发挥作用的。

我们先从注解@Component开始分析，这一节，主要包括以下几个部分：

1. 先通过一个案例，简单来看下注解@Component是如何使用的

2. 然后以案例作为源码分析的入口，先找下扫描注解的入口在哪里

3. 再看下Spring是如何筛选出标注了注解@Component的类

4. 再看下Spring是如何将扫描到的类封装为BeanDefinition，并注入到Spring容器中的

5. 最后来看下注解@Controller、@Service和@Repository和注解@Component有什么关系

---

## @Component如何使用呢？

在分析之前和前面一样，我们先来体验下注解@Component是如何使用：

```java
@Component
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

先创建一个Student类，和之前不同的是，现在我们并不需要将Student类配置在applicationContext.xml中，取而代之的是，我们只需要在Student类上添加注解@Component即可。

然后，我们通过一段代码来加载一下Student类对应的bean：

```java
public class ApplicationContextDemo {

	public static void main(String[] args) throws Exception {
		AnnotationConfigApplicationContext ctx =
          new AnnotationConfigApplicationContext("com.ruyuan.container.annotation.component");
		Student student = (Student) ctx.getBean("student");
		System.out.println(student);
	}

}
```

因为现在我们分析的是注解相关的操作，所以我们这里采用的是Spring容器的类型是AnnotationConfigApplicationContext，表示的是和注解相关的Spring容器。

和高级容器ClassPathXmlApplicationContext类似，AnnotationConfigApplicationContext同样也实现了接口ApplicationContext，同样属于Spring高级容器中的一种。

------

可以看到，在AnnotationConfigApplicationContext的构造方法中需要传入Student类的包路径，Spring默认就会到该路径下解析被注解@Component标注的类，然后将解析到的BeanDefinition注入到Spring容器中。

而当我们调用getBean方法时，Spring就会像我们前面分析的一样加载bean的实例，我们运行下代码，看下效果：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302011116451.png)

果然，我们可以看到Student对应的bean加载成功了。

---

## 寻找注解扫描的入口

了解完注解@Component的简单使用之后，接下来，我们沿着AnnotationConfigApplicationContext的构造方法，看下Spring在源码层面又是如何处理标注了注解@Component的类：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302011517962.png)

在构造方法中，我们发现了熟悉的方法refresh，从这里我们可以知道虽然Spring容器的种类挺多，但是核心的逻辑其实都是通用的。

------

我们先到方法this()中看下：![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302011517477.png)

可以看到，这里初始化了两个成员变量this.reader和this.scanner，既然在构造方法中这么刻意的初始化它们，很有可能这两个成员变量的初始化逻辑中，隐藏着一些关键的逻辑。

我们先到AnnotatedBeanDefinitionReader的构造方法中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302011517153.png)

在构造法方法中，我们还是发现一些有价值的东西，可以看到首先会初始化BeanDefinitionRegistry类型的成员变量registry。

前面我们在解析并注册xml中的BeanDefinition时，已经了解过BeanDefinitionRegistry接口是Spring容器底层实现的一个接口，封装了注册BeanDefinition以及其他关于BeanDefinition相关的操作。

------

然后，我们发现还特意的调用了AnnotationConfigUtils类中的方法registerAnnotationConfigProcessors，我们也可以跟进到方法中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302011517562.png)

虽然方法registerAnnotationConfigProcessors中的逻辑挺多的，但是总的来看也就在注册一些类的BeanDefinition到Spring容器中。

并且这些类名称上来看大多都是一些后处理器，应该是Spring注解相关的一些后处理器以及其他相关的组件，当然，这些细节我们初步了解下即可。

------

了解完成员变量this.reader的初始化之后，我们再来看下另外一个成员变量也就是this.scanner对应的ClassPathBeanDefinitionScanner的初始化：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302011517360.png)

以构造方法的起始位置作为入口，我们经过了好几层重载构造方法的调用，虽然暂时还只是看到ClassPathBeanDefinitionScanner是在做一些初始化相关的工作。

除去一些无关紧要的代码，如设置环境变量组件environment及相应的资源加载器resourceLoader，最终我们还是看到了一些重要的逻辑，如方法registerDefaultFilters。

------

可以看到，方法registerDefaultFilters中很明显是在注册一些东西，而且参数useDefaultFilters的默认值为true，所以，方法registerDefaultFilters默认是会执行的，我们到方法中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302011517746.png)

在方法registerDefaultFilters中，我们发现主要就是往集合includeFilters中注册一些AnnotationTypeFilter，而通过AnnotationTypeFilter的名称，我们大概可以知道这是一个注解过滤器，是用来**过滤指定类型的注解**的。

而且，在方法起始位置注册的注解过滤器AnnotationTypeFilter中，还特意指定了Component.class，而Component不就是我们目前正在分析的注解类型吗？

------

分析到这里，我们大概有些明白了，而且，我们通过ClassPathBeanDefinitionScanner的名称，不难猜出它是用来扫描BeanDefinition的扫描器。

而集合includeFilters中注册了注解@Component的过滤器，刚好可以帮我们把带有@Component注解的类给过滤出来，毕竟在同一包路径下，是会同时扫描出没有添加注解@Component的普通类的。

------

了解完这个两个成员变量之后，我们继续往后面看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302011518285.png)

refresh方法前面我们已经分析过了，现在就剩方法scan了，很明显方法scan是用来扫描我们指定包路径下的类，而且，AnnotationConfigApplicationContext还支持我们传入多个包名，我们赶紧到方法scan中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302011518423.png)

可以看到，Spring接下来会把扫描的任务委托给成员变量this.scanner处理，而this.scanner刚刚我们也看到了它的初始化，实际类型为ClassPathBeanDefinitionScanner。

------

接下来，我们再到ClassPathBeanDefinitionScanner类中方法scan中看下吧：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302011518488.png)

可以看到，注册BeanDefinition相关的代码，比我们之前解析xml文件时来得要早一些。

这块代码现在我们应该已经很熟悉了，首先通过成员变量this.registry的方法getBeanDefinitionCount，获取Spring容器当前已经注册BeanDefinition的个数。

然后在方法最后，用当前Spring容器中BeanDefinition的数量，减去初始Spring容器中BeanDefinition数量，得到本次方法执行时一共注册了多少个BeanDefinition。

------

而代码 AnnotationConfigUtils.registerAnnotationConfigProcessors(this.registry)， 前面我们在分析AnnotatedBeanDefinitionReader的初始化时已经看过了，其实就是在注册Spring内部要用到的后处理器相关的BeanDefinition。

所以现在最关键的，就是方法**doScan**中的逻辑。

---

## 扫描指定包中符合条件的类

我们到方法doScan中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302011519930.png)

可以看到，方法doScan会遍历所有包路径，依次到这些包路径下扫描并加载BeanDefinition，那Spring具体会如何加载呢？我们接着到方法findCandidateComponents中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302011519577.png)

默认情况下，成员变量this.componentsIndex的值为null，所以，我们再到方法scanCandidateComponents中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302011519565.png)

方法scanCandidateComponents果然开始扫描指定路径下的类了，首先会对我们传进去的包路径basePackage进行一些拼接处理，其中，ResourcePatternResolver.CLASSPATH_ALL_URL_PREFIX的值为“classpath*”，this.resourcePattern默认值为“**/*.class”。

再加上我们设置的basePackage值为“com.ruyuan.container.annotation.component”，所以，我们可以很容易的得到packageSearchPath的值为：classpath*:com.ruyuan.container.annotation.component/**/*.class，也就是扫描该路径下的所有类，每个类我们都可以得到相应的资源Resource。

------

接下来会通过for循环来遍历这些Resource，可以看到，在for循环中会将resource封装成MetadataReader，当然，我们现在没必要把每个组件都详细的care一遍，继续往下看吧。

紧接着就会调用方法isCandidateComponent，判断当前的resource是否满足条件，那具体会怎么判断呢？我们再到方法isCandidateComponent中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302011519967.png)

看到这里大家应该就明白了，果然和我们前面预测的一样，Spring是通过注解过滤器来过滤资源的，可以看到方法中会通过封装了注解过滤器的集合this.includeFilters，来过滤封装了Resource的MetadataReader。

前面我们已经看到了，因为this.includeFilter中添加了注解@Component的过滤器，所以，这里只会将标注了@Component注解的类给留下来，而成员变量this.excludeFilters很明显也是用来存放注解的过滤器，只不过它存放的注解过滤器，是用来剔除掉指定类型的注解过滤器的。

------

了解完方法isCandidateComponent之后，我们再返回回去继续看：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302011519988.png)

可以看到，接下来会将metadataReader封装到ScannedGenericBeanDefinition中，ScannedGenericBeanDefinition应该是和注解相关的BeanDefinition，我们可以到ScannedGenericBeanDefinition中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302011519065.png)

可以看到，ScannedGenericBeanDefinition非常的关键，因为它不仅继承了GenericBeanDefinition，而且还实现了接口AnnotatedBeanDefinition。

------

AnnotatedBeanDefinition不知道大家还记得不，我们可以来简单回忆下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302011519304.png)

**前面我们提到过，如果BeanDefinition实现了接口AnnotatedBeanDefinition，那这个BeanDefinition一般是用来存放注解相关的bean定义信息的，而ScannedGenericBeanDefinition同时兼备了注解以及xml的BeanDefinition特性**。

------

了解完这个，我们继续看下后面的逻辑：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302011520303.png)

可以看到，接下来会通过方法isCandidateComponent，对BeanDefinition进行最后的一次的筛选，如果筛选成功，BeanDefinition就会添加到集合candidates中并返回。

那方法isCandidateComponent中的逻辑会是什么呢？我们再来看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302011520833.png)

可以看到，方法isCandidateComponent中也只是判断下当前类，是否符合实例化的条件，比如，当前类是否是独立的不依赖其他类，并且，当前类既不是接口也不是抽象类。

------

如果是抽象类也可以，但是得要添加了注解@Lookup，并且注解@Lookup中指定了需要覆盖的方法，其中，注解@Lookup的功能和我们前面讲解的子标签lookup-method，在功能上是类似的，只不过一个是标签一个是注解。

而前面我们也通过案例演示过了，如果一个类是抽象类，但是，如果我们通过lookup-method标签指定了抽象方法对应哪个子类bean，抽象类也是可以正常实例化的。

---

## 封装并注册BeanDefinition

现在，指定包路径下的类对应的BeanDefinition我们已经获取到了，我们继续往后面看：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302011520028.png)

可以看到，接下来会遍历每个BeanDefinition，首先会调用成员变量this.scopeMetadataResolver中的方法resolveScopeMetadata。

------

那this.scopeMetadataResolver又是什么呢？我们在类中寻找一下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302011520103.png)

可以看到this.scopeMetadataResolver的类型默认为AnnotationScopeMetadataResolver，那我们就到AnnotationScopeMetadataResolver中的方法resolveScopeMetadata看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302011520709.png)

可以看到，如果当前BeanDefinition是注解类型的，就会执行if分支中的逻辑。

------

其中，我们来看下成员变量this.scopeAnnotationType是什么：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302011520268.png)

看到这里我们应该就明白了，原来**方法resolveScopeMetadata主要就做一件事，也就是从BeanDefinition中获取注解@Scope相关的属性信息**，注解@Scope其实就是和bean作用域相关的一个注解。

比如，我们之前提及到**bean的类型有单例、prototype等类型**，且bean的类型是可以通过注解@Scope来指定的，但是，我们这里暂时并没有添加注解@Scope，所以注解属性attributes结果为空，方法resolveScopeMetadata返回的是默认的ScopeMetaData。

------

我们再回到上一层方法调用的位置看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302011520420.png)

可以看到，这里只不过是为BeanDefinition设置默认的作用域。

之前我们也知道，Spring中bean的作用域默认就是单例类型的，为了验证这个想法在注解中是否也成立，我们可以到scopeMetadata的getScopeName方法中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302011520319.png)

果然，我们可以看到在注解中，bean的默认类型也是单例的。

------

接下来就是一些细节代码了，如果判定当前BeanDefinition为AbstractBeanDefinition的实例，就会执行方法postProcessBeanDefinition，因为当前BeanDefinition继承了GenericBeanDefinition，所以成立，我们到方法中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302011520480.png)

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302011520022.png)

很明显，这里就是在为BeanDefinition设置一些默认的属性值，我们再到方法applyDefaults中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302011521474.png)

果然，在方法applyDefaults中是在为BeanDefinition设置属性默认的初始值。

------

接着，我们再往后面看：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302011521850.png)

如果判定当前BeanDefinitiion是注解类型的，会做哪些初始化的操作呢？我们到方法processCommonDefinitionAnnotations中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302011521256.png)

可以看到，这里就是在解析类中的一些注解信息了，比如注解@Lazy、@Primary、@DependsOn、@Role以及@Description。

确实，如果我们通过注解来开发的话，很多配置信息是没必要配置到xml中了，所以就需要这些注解来配置相应的属性，和我们之前解析xml文件中的各种各样的属性其实是类似的，最终得要把解析到的属性信息设置到BeanDefinition中。

------

我们再来看下最后的一些逻辑：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302011521810.png)

和之前注册BeanDefinition的逻辑类似，此时会将BeanDefinition封装到BeanDefinitionHolder中，然后调用方法registerBeanDefinition给注册到Spring容器中，这些逻辑前面我们都分析过了。

从这里我们可以发现，原来被注解@Component标注的类，最后还是的要封装成BeanDefinition并注册到Spring容器中，这样的话，当我们调用getBean方法获取bean时，Spring才能根据我们注册的BeanDefinition信息来加载bean。

---

## @Controller、@Service、@Repository的本质

了解完注解@Component是如何被扫描注册之后，可能有些同学就有些疑问了，在Spring中好像还有几个注解和@Component的效果是类似的，分别是@Controller、@Service以及@Repository，它们和注解@Component有什么关系吗？

是时候来看一下了：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302011545897.png)

可以看到，其实注解@Controller也没什么特别的，本质还是基于@Component注解来实现功能的，当Spring在扫描标注了注解@Controller的类时，也还是会被@Component注解的过滤器给过滤出来，然后将解析到BeanDefinition给注册到Spring容器中。

那注解@Service和@Repository又是怎样的呢？我们也来看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302011545263.png)

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302011545401.png)

可以看到，和注解@Controller一样，**注解@Service、@Repository本质上还是基于@Component注解来实现功能**的。

---

## 总结

好了，今天的知识点我们就讲到这里了，我们来总结一下吧。

通过一张图来梳理下流程：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302011546600.png)

首先，Spring会去我们指定包路径下扫描出符合条件的类，而且，这里比较关键的是，Spring默认会在组件ClassPathBeanDefinitionScanner中，为注解@Component注册相应的注解过滤器，这样方便Spring筛选出那些标注了注解@Component的类，而且，我们在源码中也看到了Spring确实也是这样来过滤筛选的。

------

另外，我们发现添加了注解@Component的类最后也会封装为BeanDefinition，只不过BeanDefinition是注解类型的ScannedGenericBeanDefinition，ScannedGenericBeanDefinition不但继承了GenericBeanDefinition，同时也实现了接口AnnotatedBeanDefinition。

所以，我们看到Spring不仅为BeanDefinition设置了一些默认的属性信息，而且，Spring还进一步的解析类中的其他注解的信息，并且，将所有的注解信息都统一封装到了BeanDefinition中，然后将BeanDefinition注册到Spring容器里，核心思想和我们之前解析xml文件是类似的。

------

最后，我们又看了几个和注解@Component类似的注解，如注解@Controller、@Service和@Repository，最后发现它们底层也是通过注解@Component来实现功能的，本质和注解@Component是类似的，标注了这些注解的类同样也是会被Spring扫描到的。