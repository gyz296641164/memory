---
title: 38_Spring注解源码解析：@Autowired
category:
  - Spring源码
star: true
date: 2023-03-31
---

<!-- more -->

<h1 align="center">38_Spring注解源码解析：@Autowired</h1>

## 开篇

通过前面几节课的内容，我们了解注解@Configuration是如何与注解@Bean一起来使用的，同时，在bean的这个层面，前面我们还了解了注解@Component、@Controller、@Service以及@Repository，在注解层面配置bean，常用的也就是这些注解了。

------

这一节，我们将粒度缩小到bean中的属性的级别，看下Spring是如何通过注解@Autowired，为bean中的属性注入值的，同时也来看下Spring底层又是如何处理注解@Autowired的，这一节主要分为以下几个部分：

1. 首先我们先简单使用下注解@Autowired

2. 然后寻找下注解@Autowired源码分析的入口是在哪

3. 再看下解析注解@Autowired是在什么时候开始解析的

4. 接着再看下添加到字段或者方法上的注解具体是如何解析的

5. 最后再来看下解析到的注解信息，又是如何处理设置到相应的字段或方法上的

---

## @Autowired的简单使用

和之前一样，在分析注解@Autowired的源码之前，我们先简单使用一下：

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

先创建一个java类Student，然后我们再创建一个StudentConfig类，通过注解@Configuration和@Bean配置一下：

```java
@Configuration
public class StudentConfig {

	@Bean
	public Student student() {
		return new Student();
	}

}
```

前面我们已经分析过这块了，当Spring会为添加了注解@Configuration的类，以及添加了注解@Bean的类分别都实例化相应的bean实例。

------

接下来，我们再创建一个依赖Student的StudentComponent类：

```java
@Component
public class StudentComponent {

	@Autowired
	private Student student;

	public Student getStudent() {
		return student;
	}

	public void setStudent(Student student) {
		this.student = student;
	}

	@Override
	public String toString() {
		return "StudentComponent{" +
				"student=" + student +
				'}';
	}

}
```

可以看到，在StudentComponent类中添加了注解@Component，这样的话，Spring底层就会通过注解过滤器，扫描到StudentComponent类，并且为它在Spring容器中注册相应的BeanDefinition。

然后，当StudentComponent类对应的bean，在实例化填充属性时，因为我们在属性student上添加注解@Autowired，此时Spring会根据student的类型去容器中匹配Student，看下Spring容器中是否存在Student类型的bean实例，如果存在就会获取bean实例并设置到属性student上。

------

我们通过代码来测试下：

```java
public class ApplicationContextDemo {

	public static void main(String[] args) throws Exception {
		AnnotationConfigApplicationContext ctx =
				new AnnotationConfigApplicationContext(
						"com.ruyuan.container.annotation.autowired");
		StudentComponent studentComponent = (StudentComponent) 
            ctx.getBean("studentComponent");
		System.out.println(studentComponent);
	}

}
```

我们直接根据名称“studentComponent”获取StudentComponent的bean实例，重点看下StudentComponent中的属性student是否已经注入相应的值了。

运行下代码看下效果：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302081330552.png)

可以看到，StudentComponent中的属性student的值注入成功。

和之前通过xml自动注入的方式不一样，通过注解@Autowired进行属性的自动注入时，我们可以不需要属性的setter方法。

------

当然，我们不仅可以将注解@Autowired添加到属性上，也可以将注解@Autowired添加到方法上：

```java
@Component
public class StudentComponent {

	private Student student;

	public Student getStudent() {
		return student;
	}

	@Autowired
	public void setStudent(Student student) {
		this.student = student;
	}

	@Override
	public String toString() {
		return "StudentComponent{" +
				"student=" + student +
				'}';
	}

}
```

我们将注解@Autowired添加到方法setStudent中，也是可以完成属性值的注入，运行下刚才的测试代码效果是一样的。

------

但是，如果StudentComponent依赖的属性student，如果在Spring容器中寻找不到相应的bean实例，此时就会报错，我们可以将StudentConfig中的方法student给删除掉，模拟一下找不到bean实例的情况，就像这样：

```java
@Configuration
public class StudentConfig {

}
```

然后再运行下刚才的测试代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302081331553.png)

果然，因为Spring在实例化StudentComponent时，发现容器中没有Student类型的实例，此时就无法完成自动装配就会报错，这是Spring强制要求的。

------

如果我们不想局限于Spring的强制要求，也就是说Spring容器中如果没有这个bean实例，那我最多不为StudentComponent的bean实例注入属性student的值可以吗？

其实也是可以的，我们只需要在注解@Autowired中，将属性required的值设置为false，就像这样：

```java
@Component
public class StudentComponent {

	private Student student;

	public Student getStudent() {
		return student;
	}

	@Autowired(required = false)
	public void setStudent(Student student) {
		this.student = student;
	}

	@Override
	public String toString() {
		return "StudentComponent{" +
				"student=" + student +
				'}';
	}

}
```

注解@Autowired的属性required的值，默认为true，如果我们改成false之后，再运行下刚才的测试代码看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302081331141.png)

可以看到StudentComponent的实例可以实例化完成，只不过属性student的值为null而已，当然，我们在工作中，一般都不需要改动属性required的值的。

---

## 寻找@Autowired源码分析的入口

涉及方法：

- `org.springframework.beans.factory.annotation.AutowiredAnnotationBeanPostProcessor.postProcessProperties(PropertyValues pvs, Object bean, String beanName)`

要分析注解@Autowired的源码，同样的，我们还得要到注解@Autowired类中寻找源码入口的线索：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302081331903.png)

在注解@Autowired类中简单寻找了一下，发现AutowiredAnnotationBeanPostProcessor应该就是注解@Autowired的解析入口。

那AutowiredAnnotationBeanPostProcessor是什么呢？我们可以看下AutowiredAnnotationBeanPostProcessor：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302081331507.png)

可以看到，其实AutowiredAnnotationBeanPostProcessor是一个Bean的后处理器，前面我们在讲解后处理器时，已经了解过了，后处理器接口BeanPostProcessor中提供了两个方法，分别是方法`postProcessBeforeInitialization`和方法`postProcessAfterInitialization`。

所以，我们首先可以到AutowiredAnnotationBeanPostProcessor中，看下这两个方法有没有特别的实现：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302081332743.png)

可惜的是，我们在AutowiredAnnotationBeanPostProcessor类中并没有找到这两个方法的具体实现，但是，却在它的父类InstantiationAwareBeanPostProcessorAdapter中，发现了这两个方法的实现。

可以看到，在InstantiationAwareBeanPostProcessorAdapter中这两个方法默认并没有什么逻辑，都是空实现，这就证明后处理器AutowiredAnnotationBeanPostProcessor的核心逻辑，并不是围绕着接口BeanPostProcessor中的两个方法展开的。

------

那我们就要到其他地方寻找线索了，可以看到，AutowiredAnnotationBeanPostProcessor类的继承体系中，继承接口BeanPostProcessor的还有接口InstantiationAwareBeanPostProcessor，我们可以退而求其次，以接口InstantiationAwareBeanPostProcessor中的接口方法为新的切入点：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302081332145.png)

可以看到，接口InstantiationAwareBeanPostProcessor中有四个接口方法，分别是方法postProcessBeforeInstantiation、postProcessAfterInstantiation以及postProcessProperties，其中方法postProcessPropertyValues官方已经弃用了，我们就不管它了。

------

那我们就到AutowiredAnnotationBeanPostProcessor中，看下接口InstantiationAwareBeanPostProcessor中的哪个方法有特别的实现：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302081332585.png)

果然，我们在AutowiredAnnotationBeanPostProcessor中就找到方法postProcessProperties的具体实现。

而方法postProcessBeforeInstantiation以及postProcessAfterInstantiation的具体实现，和前面的BeanPostProcessor中的两个接口一样，在InstantiationAwareBeanPostProcessorAdapter中虽然找到了具体实现，不过也都是空实现。

------

所以，我们这次分析注解@Autowired的源码的入口算是找到了，也就是AutowiredAnnotationBeanPostProcessor中的方法postProcessProperties。

而且，我们回过头来看下方法postProcessProperties的名称，不就是处理属性信息吗？而注解@Autowired就是添加在属性上的啊，所以，从方法的名称上也说的过去，接下来我们一点点来分析下。

---

## 什么时候解析@Autowired的呢？

涉及方法：

- `org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory.populateBean(String beanName, RootBeanDefinition mbd, @Nullable BeanWrapper bw)`

我们来正式看下方法postProcessProperties：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302081415684.png)

不知道大家看到方法postProcessProperties中的一些信息时会想到什么？其中，方法postProcessProperties的返回值类型为PropertyValues，也就是说当前是在解析属性的信息。

而前面我们在分析bean加载的逻辑时，有一个环节就是为刚实例化出来的bean填充属性，在属性信息填充之前，会将各种各样的属性信息封装到PropertyValues中，大家还记得吗？所以，我们怀疑**方法postProcessProperties是在为bean实例填充属性时被调用的**。

------

不知道大家还记得位置不，我们可以临时去看一眼：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302081416652.png)

可以看到，前面专门为实例化好的bean填充属性的方法就是populateBean，简单在方法中寻找了一下发现，果然后处理器中的方法postProcessProperties就是在这里被调用的。

当然，如果大家觉得这样根据经验和记忆力的方式去寻找，有点不太靠谱，我们还可以在方法postProcessProperties中打上一个断点，然后一步步调试出来，看下到底是哪个位置在调用方法postProcessProperties的，当然，调试的结果也证明方法postProcessProperties，确实就是在这里被调用的。

---

## 初探方法postProcessProperties

涉及方法：

- `org.springframework.beans.factory.annotation.AutowiredAnnotationBeanPostProcessor.findAutowiringMetadata(String beanName, Class<?> clazz, @Nullable PropertyValues pvs)`

现在，我们已经知道了方法postProcessProperties是在为bean实例填充属性时被调用的，接下来的分析就更具有针对性了，我们再来看下方法postProcessProperties：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302081428691.png)

首先会调用方法findAutowiringMetadata，我们进去看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302081428019.png)

从整体结构上来看，方法findAutowiringMetadata中的逻辑并不算太复杂，首先获取cacheKey，如果beanName不为空，就以beanName为cacheKey，否则以类的全限定名为cacheKey。

然后尝试从缓存injectionMetadataCache中，根据cacheKey获取InjectionMetadata类型的metadata，InjectionMetadata根据名称，我们大致可以理解为是可以注入到bean实例中的注解元数据，里面封装了@Autowired对应属性或方法参数的值。

------

首次执行该方法，获取到的注解元数据metadata当然为null，所以，接下来会经过一个典型的双重检查，最后委托方法buildAutowiringMetadata，到类clazz中从零开始加载注解的元数据信息。

那if分支中的逻辑具体是如何检查的呢？我们可以到InjectionMetadata对应的方法needsRefresh中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302081428125.png)

可以看到，如果metadata为null，或者当成员变量this.targetClass记录的类和参数携带的类clazz不一样时，就会返回true，当然，这块逻辑好像不是特别重要。

------

接下来，我们再到方法buildAutowiringMetadata中，看下是具体是如何解析并获取clazz上的注解信息的：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302081428520.png)

现在我们对这么长的方法，已经见怪不怪了，而且方法buildAutowiringMetadata中的逻辑还是蛮关键的，和之前一样，接下来我们分段来看下方法中的逻辑。

---

## 判断当前bean的类型是否符合条件

涉及方法：

- `org.springframework.beans.factory.annotation.AutowiredAnnotationBeanPostProcessor.buildAutowiringMetadata(Class<?> clazz)`
- `org.springframework.core.annotation.AnnotationUtils.isCandidateClass(Class<?> clazz, Collection<Class<? extends Annotation>> annotationTypes)`
- `org.springframework.core.annotation.AnnotationUtils.isCandidateClass(Class<?> clazz, Class<? extends Annotation> annotationType)`
- `org.springframework.core.annotation.AnnotationUtils.isCandidateClass(Class<?> clazz, String annotationName)`

我们先来看下方法buildAutowiringMetadata中的第一段代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302081500500.png)

可以看到，首先会通过AnnotationUtils中的方法isCandidateClass，判断当前bean实例的类clazz是否符合条件。

------

其中，在调用方法isCandidateClass时，除了传入clazz之外还会传入this.autowiredAnnotationTypes，看名称好像是注解的类型，我们可以简单寻找下看下它的初始值是什么：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302081500474.png)

原来在AutowiredAnnotationBeanPostProcessor初始化时，就会为成员变量this.autowiredAnnotationTypes添加一些初始化元素，而且，我们可以发现竟然就是我们的目标注解@Autowired，同时还包含了注解@Value。

相信使用过注解@Value的同学应该很清楚，注解@Value其实就是通过SPEL表达式，将配置文件中的一些配置信息，用类似@Autowired注解的方式给注入到属性中。

------

原来@Autowired注解在解析的同时，还会顺便解析注解@Value啊，get到这点之后，我们再回到刚才的位置：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302081500998.png)

接下来，我们到方法isCandidateClass中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302081500559.png)

可以看到，方法isCandidateClass中会遍历每个注解，然后调用方法isCandidateClass的重载方法，我们跟进到重载方法中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302081500351.png)

在重载方法中好像也没干什么事，就是获取注解类的全限定名，并且再次调用方法isCandidateClass的另外一个重载方法。

如果发现注解类的全限定名是以“java.”为前缀的，表示当前是符合条件的，否则再通过AnnotationsScanner中的方法hasPlainJavaAnnotationsOnly判定一下，我们也来看下吧：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302081500596.png)

在方法hasPlainJavaAnnotationsOnly中，如果发现bean class的全限定名是以“java.”为前缀，或者bean的类型为Ordered，则不满足候选条件。

------

从目前我们分析的逻辑来看下，注解类@Autowired以及@Value的类名既不是以“java.”为前缀，bean实例的类名也不是以“java.”为前缀，且bean实例的类型也不是Ordered，所以当前的类还是符合候选条件的。

---

## 解析字段和方法上的注解信息

涉及方法：

- `org.springframework.beans.factory.annotation.AutowiredAnnotationBeanPostProcessor.findAutowiredAnnotation(AccessibleObject ao)`：寻找字段上的注解
- `org.springframework.beans.factory.annotation.AutowiredAnnotationBeanPostProcessor.determineRequiredStatus(MergedAnnotation<?> ann)`：获取注解中required的值
- `org.springframework.beans.factory.annotation.InjectionMetadata.forElements(Collection<InjectedElement> elements, Class<?> clazz)`：将解析到的注解信息elements封装为InjectionMetadata

我们继续看下方法buildAutowiringMetadata后面的逻辑：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302081524323.png)

这里的逻辑就清晰多了，首先对类中的每个字段进行解析，可以看到会**调用方法findAutowiredAnnotation，寻找字段上的注解**，我们到方法findAutowiredAnnotation中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302081524307.png)

前面初始化的成员变量this.autowiredAnnotationTypes，在这里总算是派上用场了。

可以看到，这里会遍历this.autowiredAnnotationTypes中的每个注解，其实也就是注解@Autowired和注解@Value，如果发现字段中存在这这两个注解就返回它们，这些都是反射底层的API，大家理解起来应该问题不大。

------

我们继续往后面看：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302081524426.png)

接下来会判断字段是否被static关键字修饰了，如果是的话添加的注解将会失效，这也警示我们不能在静态属性中添加@Autowired或@Value。

然后会调用方法determineRequiredStatus，我们同样到方法中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302081524243.png)

可以看到，在方法determineRequiredStatus中又会获取注解中的属性信息，然后再调用方法determineRequiredStatus的重载方法，在重载方法中，其实也就是返回属性required的值，它是注解@Autowired中的一个属性。

------

前面我们在案例中也看到了，如果Spring没有匹配到属性类型的信息时，就会报错，如果将属性required的值设置为false，就算Spring没有为属性匹配到信息也不会报错，顶多属性的值为null而已。

这里判断，如果注解中不存在属性required表示的是注解@Value；如果存在属性required，则表示当前是注解@Autowired，并且返回属性required的值，默认值为true。

------

我们再回到方法buildAutowiringMetadata中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302081524442.png)

可以看到，最后会将类中所有字段解析到的注解信息，添加到集合currElements中。

------

了解完字段上的注解信息解析，我们再继续看下方法buildAutowiringMetadata后面的逻辑：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302081525136.png)

接下来就是要解析类中每个方法上的注解信息，其实解析的流程和步骤和前面解析字段上的流程是差不多的。

首先，从方法上获取注解信息，然后判断下方法是否是静态方法，这里也是**不允许在静态方法上添加@Autowired和@Value**的，然后获取属性required的值，最终设置到集合currElements中。

当然，和字段注解的解析不同的是，这里还额外判断了下方法的参数个数，如果参数个数为0也是不允许的，因为这样Spring就不知道你需要注入的值要设置到哪个属性上了。

------

我们再来看下最后的一些逻辑：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302081525701.png)

当类中的方法和字段中的注解信息都解析完毕之后，此时还会继续解析父类上的注解，最后将解析到的所有注解信息，通过InjectionMetadata封装为InjectionMetadata并返回。

我们可以到InjectionMetadata中的方法forElements中看下封装细节：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302081525323.png)

可以看到，方法forElements其实就是将我们解析得到的注解信息elements，直接封装到了InjectionMetadata中的成员变量this.injectedElements中，并没有什么特别的地方。

---

## 给字段或方法注入属性的值

现在类中的注解信息我们已经获取到了，我们再回到方法postProcessProperties中：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302081531459.png)

可以看到，接下来就是要把解析到的注解信息注入到相应属性pvs上，我们再到metadata的方法inject中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302081531668.png)

在方法inject中，会遍历我们前面解析到的注解信息，然后调用element的方法inject。

------

我们再到inject方法中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202302081532724.png)

看到这里我们基本就明白了，如果注解是字段上的，那就给具体字段注入值；如果注解是方法上的，那就执行方法来注入参数的值，注解@Autowired和注解@Value底层自动注入的逻辑，也就是这样通过反射API来完成属性值的注入。

------

## 总结

第一，我们通过一个案例简单使用了下注解@Autowired，也了解了注解@Autowired不仅可以添加到字段上，而且可以添加到方法上。

------

第二，为了寻找注解@Autowired的源码入口，我们到@Autowired类中看了下，发现AutowiredAnnotationBeanPostProcessor类很有可能就是处理注解的类，而且，我们也认识了一下它，发现AutowiredAnnotationBeanPostProcessor其实就是一个Bean的后处理器，专门用来解析注解@Autowired的。

而且，经过我们的分析和推断，解析注解@Autowired的时机，其实就是在为bean实例填充属性的时候，会调用AutowiredAnnotationBeanPostProcessor中的方法postProcessProperties，为bean实例解析注解并填充属性信息。

第三，然后，我们以方法postProcessProperties为入口，看了下注解@Autowired是如何解析的，其实就是获取类中所有字段以及方法上的注解，注解包括@Autowired以及@Value；但是，添加了注解的字段或方法是不允许static关键字修饰的，而且，添加注解的方法也不允许是无参方法，否则字段的值无法注入。

第四，最后，我们可以看到解析到的所有注解信息，最后都会被设置到相应的字段和方法中。





