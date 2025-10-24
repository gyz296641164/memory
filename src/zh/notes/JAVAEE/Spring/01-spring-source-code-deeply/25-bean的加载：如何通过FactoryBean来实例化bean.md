---
title: 25_bean的加载：如何通过FactoryBean来实例化bean
category:
  - Spring源码
star: true
date: 2023-03-31
---

<!-- more -->


## 开篇

前面我们已经分析了下Spring是如何通过多级缓存来解决循环依赖的，其实思路也是挺简单的，就是将还未完全创建好的bean先暴露在缓存中，这样的话，当其他bean实例化需要依赖bean时，可以提前从缓存中获取还未实例化好的bean，从而解决循环依赖的问题。

这一节，我们继续沿着doGetBean方法的主流程分析下后面的逻辑，这一节主要包括以下几个部分：

1. 首先来看下Spring是如何判定单例bean是否为工厂引用的
2. 然后通过一个案例，了解并体验下FactoryBean是怎么玩的
3. 最后来看下Spring是如何通过FactoryBean来实例化bean的

---

## 判断单例是否为工厂引用

截止目前，我们已经看到了Spring是如何从缓存中获取单例bean的了，那Spring从缓存中获取到单例bean之后，直接就返回了吗？

我们继续来看下Spring对我们获取到的单例bean，还会做哪些后续的处理，如下图：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11/20221129181253.png)

前面我们已经看到了，如果一个单例bean实例化好了，或者在实例化过程中提前暴露在对象工厂缓存中了，

我们就可以通过方法getSingleton，从缓存中获取单例对象。

因为本次的分析，我们假设是可以从缓存中获取到单例bean的，也就是说bean的实例化过程已经经过一轮了，所以sharedInstance不为空，且参数args在doGetBean方法传进来时默认就是为空的，所以if分支条件成立，接下来就会调用方法getObjectForBeanInstance，进一步处理单例sharedInstance。

需要留个心眼的是，在方法getObjectForBeanInstance传进去的参数中，name是在调用getBean方法时传入的、最原始bean的名称，而beanName是name转换后bean的名称，且参数mbd默认值为null，这些参数的值我们先有个印象，方便后续逻辑的分析。

------

既然现在我们已经获取到了单例bean，那单例bean为什么不能直接拿来用呢？方法getObjectForBeanInstance还需要对单例bean做一些其他什么处理呢？我们到方法getObjectForBeanInstance里面看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11/20221129181256.png)

可以看到，首先会通过BeanFactoryUtils的方法isFactoryDereference，对bean原始的名称name进行判断，我们进去看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11/20221129181259.png)

可以看到，这里我们又看到了类似的逻辑，也就是判断name是否以符号“&”为前缀的，现在我们就不得不想一下了，要是我们通过调用getBean方法传进来的name，如果是以符号“&”为前缀的会怎样呢？

通过isFactoryDereference方法中的注释我们可以初步断定，getBean方法传入的name如果以符号“&”为前缀，目的是要获取一个工厂的引用也就是获取一个工厂bean，那什么是工厂bean呢？

---

## FactoryBean是什么呢？

提到工厂bean，我们就得要提到Spring中比较重要的一个接口FactoryBean，我们可以通过实现FactoryBean接口中的getObject方法，在getObject方法中定义该如何创建一个对象，而实现了FactoryBean接口的实现类，就是这里的工厂bean。

如果说前面的bean后处理器BeanPostProcessor，是通过实现BeanPostProcessor接口中的方法，来实现对bean实例化的过程的控制，这个控制如果说只是初步介入了bean的实例化过程，那FactoryBean可以说是全盘操办了bean的实例化了。

------

我们先来了解下FactoryBean接口：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11/20221129181301.png)

可以看到，FactoryBean接口中的东西并不多，主要提供了几个比较简单的方法，并且FactoryBean是支持泛型的。

其中，isSingleton方法是用来判断实例化的bean是否为单例类型，getObjectType用来获取bean的类型，而getObject方法，就是专门用来定义bean实例化逻辑的，我们再到FactoryBean接口中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11/20221129181303.png)

可以看到方法isSingleton的返回值，默认为true，也就是说FactoryBean默认是实例化单例类型的bean。

------

那如何通过FactoryBean来实例化一个bean呢？我们通过一个简单的案例来体验下：

```java
public class Student {

	private String name;

	private int age;

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public int getAge() {
		return age;
	}

	public void setAge(int age) {
		this.age = age;
	}

	@Override
	public String toString() {
		return "Student{" +
				"name='" + name + '\'' +
				", age=" + age +
				'}';
	}

}
```

为了方便演示，我们还是通过Student类来举例，很简单，Student类中只有name和age两个属性。

然后，我们创建一个实例化Student对象的FactoryBean：

```java
public class StudentFactoryBean implements FactoryBean {

	@Override
	public Object getObject() throws Exception {
		System.out.println("通过FactoryBean创建Student，开始...");

		Student student = new Student();
		student.setName("tom");
		student.setAge(17);
		return student;
	}

	@Override
	public Class<?> getObjectType() {
		return Student.class;
	}

}
```

可以看到，StudentFactoryBean实现了接口FactoryBean，同时，StudentFactoryBean实现了getObject方法以及getObjectType方法，其中，getObjectType方法返回的是bean的类型也就是Student.class，而getObject方法则包含了创建Student对象的核心逻辑。

在getObject方中，我们暂时就采用了最朴素的一种方式，也就是直接new了一个Student对象，赋值后就直接返回了，当然，我们可以根据自己业务需求，创建符合业务场景下的bean实例。

------

接下来，我们再把StudentFactoryBean配置到applicationContext.xml中：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
	   xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="
			http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd">

	<bean id="student" class="com.ruyuan.container.factorybean.StudentFactoryBean"/>

</beans>
```

最后，我们来测试下：

```java
public class StudentFactoryBeanDemo {

	public static void main(String[] args) {
		ApplicationContext ctx = new ClassPathXmlApplicationContext("applicationContext.xml");

		Student student = (Student) ctx.getBean("student");
		Object studentFactoryBean = ctx.getBean("&student");

		System.out.println(student);
		System.out.println(studentFactoryBean);
	}

}
```

测试的方法很简单，直接从容器中获取bean即可，注意，我们这里不仅通过名称“student”来获取bean，同时，我们还手动在名称“student”前面添加了符号“&”。

那添加符号“&”会获取到什么呢？这也是我们之前疑惑的一个点，我们运行下代码看下结果：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11/20221129181306.png)

可以看到通过名称student，Spring内部就会通过StudentFactoryBean的getObject方法，为我们创建一个对象，也就是Student对象，而这个Student对象的创建逻辑，完全是由我们自己自定义的。

而我们在名称“student”前添加了符号“&”之后，直接就获取到了创建Student对象的工厂bean，也就是StudentFactoryBean对象。

------

原来如此，之前我们一直比较困惑的符号“&”，原来是在纠结到底获取的是bean对象本身，还是获取实例化bean的FactoryBean对象啊。

---

## 将bean实例转换为FactoryBean

了解完FactoryBean以及如何通过FactoryBean实例化bean之后，我们再回到刚才的方法：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11/20221129181308.png)

刚才我们已经看到了，第一个if分支中的判断逻辑，其实就是来判断name是否以符号“&”为前缀。

------

首先，我们假设现在name就是以符号“&”为前缀的，比如name为“&student”，根据刚才的案例，现在就是要获取创建bean的工厂bean，也就是实现了FactoryBean接口的对象。

我们看下Spring具体是怎么处理的：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11/20221129181310.png)

可以看到逻辑并不复杂，如果获取到的单例beanInstance是NullBean的实例就直接返回，接着会判断，如果beanInstance不是FactoryBean的实现类，此时就会抛出一个异常。

从这里我们可以总结出**在Spring中，如果一个单例bean的名称以“&”为前缀，那它必须是FactoryBean接口的实现类，这是Spring内部的一个约定，否则就会报错**。

接下来我们可以看到，如果name以“&”为前缀，且同时是FactoryBean接口的实例，此时就会将单例beanInstance返回了，和我们刚才案例中看到的结果是一致的，直接就返回这个FactoryBean的实现类了。

那FactoryBean的实例不是用来实例化bean的吗？确实，如果我们要通过FactoryBean来实例化一个bean，就要剔除bean名称name的前缀符号“&”，同时，如果这个name对应的bean实现了FactoryBean接口，就会通过getObject方法实例化一个bean，同样的，我们也来看下Spring是如何处理的：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11/20221129181312.png)

可以看到，如果bean的名称name不是以“&”为前缀的，此时就会来到下一个if分支中，这里如果判断出beanInstance不是FactoryBean的实例，直接就将beanInstance返回了。

也就是说，一个bean的名称既不是以“&”为前缀的，同时也不是接口FactoryBean的实现类，此时Spring就会认为这个bean没有定义相关的FactoryBean来自定义实例化bean，这个bean就是一个非常普通的bean了，就会将bean实例返回了。

从这里，我们同样可以得到一些信息，也就是说在默认情况下，我们是不需要根据FactoryBean来实例化bean的，只有当我们需要全权控制bean的实例化时，才需要像案例中一样自定义FactoryBean的实现类，并且在getObject方法中定义好bean的实例化的逻辑。

那现在，我们就假设当前的bean在业务当中非常的特殊，Spring默认的实例化bean的方式已经满足不了需求了，必须得要自己来定义bean的实例化过程，这个时候，我们再来看下Spring会怎样处理：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11/20221129181317.png)

可以看到，接下来会标记当前的mbd的类型，也就是将BeanDefinition的属性isFactoryBean值设置为true，表名当前BeanDefinition为工厂bean了。

前面我们也看到了参数mbd的值为null，所以mbd.isFactoryBean = true 的这行代码，在本次的逻辑中是不会执行的，而是执行方法getCachedObjectForFactoryBean。

通过方法getCachedObjectForFactoryBean的名称我们可以猜到，这里应该是尝试先从缓存中，获取FactoryBean实例化好的bean实例，我们可以进去看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11/20221129181319.png)

可以看到，这里就是通过beanName到缓存factoryBeanObjectCache中获取单例，第一次来获取，缓存中当然也是没有的，所以返回结果为空。

我们接着往后面看：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11/20221129181322.png)

从缓存获取不到bean时，此时object为空并来到了下一个if分支，可以看到接下来果然将beanInstance强转为FactoryBean了，刚才我们已经知道参数mbd传进来的时候是空的，而方法containsBeanDefinition则是判断Spring容器中，是否存在beanName对应的BeanDefinition。

如前面案例一样，beanName对应的BeanDefinition，其实就是FactoryBean实现类对应的BeanDefinition，且因为我们在配置文件中，已经配置好了FactoryBean对应的实现类了，所以在Spring容器初始化时，就会解析并将FactoryBean对应的BeanDefinition注册到Spring容器中。

------

所以，方法containsBeanDefinition的返回结果为true，接着就会调用方法getMergedLocalBeanDefinition获取FactoryBean对应的BeanDefinition，接着会调用方法getObjectFromFactoryBean，其中，getMergedLocalBeanDefinition方法中的逻辑在后面章节中还会再次出现，我们后续再来详细分析。

为了方便方法getObjectFromFactoryBean中的逻辑分析，我们有必要了解下参数的值，对于boolean类型的参数synthetic，因为mbd此时不为空，且在RootBeanDefinition中方法isSynthetic的返回值默认为false，所以传递到方法getObjectFromFactoryBean中的  !synthetic 值为 true。

---

## 通过FactoryBean来实例化bean

既然现在，我们已经获取到了FactoryBean的实现类了，并且我们完全可以预估到在方法getObjectFromFactoryBean中，其实就是通过FactoryBean中的getObject方法来实例化bean的。

带着这个想法，我们到方法getObjectFromFactoryBean中一探究竟：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11/20221129181325.png)

前面我们已经知道了，FactoryBean中的isSingleton方法返回值默认为true，且当前在单例缓存中是存在beanName对应的单例bean的，if分支成立。

------

接下来，我们可以看到会调用方法doGetObjectFromFactoryBean，我们进去看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11/20221129181328.png)

果然，我们终于看到了最为关键的一行代码，也就是调用FactoryBean的getObject方法实例化bean，至此我们之前的想法得要验证了。

我们再回退到上一步，看下还会做哪些收尾的工作：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11/20221129181330.png)

因为目前是FactoryBean是第一次创建实例，所以FactoryBean的实例缓存中是没有数据的，所以会来到分支 if (shouldPostProcess) 上，其中参数shouldPostProcess，前面我们已经了解过了为true，所以会进入分支中。

在方法isSingletonCurrentlyInCreation，是用来判断当前是否有名称为beanName的bean正在实例化，现在这里暂时是没有的，继续往后看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11/20221129181331.png)可以看到接下来有三个方法，我们先来看下方法beforeSingletonCreation和afterSingletonCreation的逻辑：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11/20221129181335.png)

其实就是在bean开始实例化时，先将beanName记录到集合inCreationCheckExclusions和集合singletonsCurrentlyInCreation中。

其中，一旦bean开始实例化，就会将bean的名称添加到集合inCreationCheckExclusions中，很明显这个集合是用来去重的，避免同一个bean重复被实例化；而集合singletonsCurrentlyInCreation，则是用来存放的当前正在创建的bean的名称，用来检查bean是否处于正在创建的状态，这两个集合还是挺有用的，后面我们还会在很多其他地方碰到。

可以看到，在afterSingletonCreation方法中相应的就会将beanName，从集合singletonsCurrentlyInCreation中移除，表示当前这个bean已经实例化好了。

------

最后，我们再来看下中间的那个方法，也就是方法postProcessObjectFromFactoryBean：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11/20221129181337.png)

可以看到，方法postProcessObjectFromFactoryBean默认就将对象object返回了，也没干些特别的事啊，都是一些校验和判断相关的逻辑。

我们再来看下最后的一些逻辑：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11/20221129181339.png)

可以看到，最后会把FactoryBean创建好的实例bean，存放在FactoryBean的实例缓存factoryBeanObjectCache中，然后直接就返回了。

------

看到这里，通过FactoryBean来实例化bean的这条分支逻辑，我们已经了解完了，虽然上面的一些逻辑，初次看上去比较杂乱无章，包括一些缓存机制、bean是否开始实例化的判断等等，但是，这些是Spring在实例化一个bean时非常关键的一些辅助机制。

接下来，我们即将要来分析Spring默认实例化bean的逻辑，在分析的过程中，我们会看到这些机制是如何发挥作用的，渐渐的也会认识到这些操作的意义，不管怎么样，我们想要确认的东西已经全部确认完毕。

---

## 总结

好了，今天的知识点我们就讲到这里了，我们来总结一下吧。

通过一张图来梳理下当前的流程：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11/20221129181341.png)

首先，通过Spring默认实例化bean的方式创建了单例bean之后，如果单例bean不是FactoryBean的实现类，就会直接返回这个单例bean。

但是，如果这个单例bean实现了FactoryBean接口，这个时候又有两种情况，如果你是通过以符号“&”为前缀的名称来获取bean的，那直接会将FactoryBean接口的实现类返回回去。

如果你通过不含有以符号“&”为前缀的名称来获取bean时，且你配置的bean就是FactoryBean接口的实现类，此时就会通过FactoryBean的getObject方法来创建一个实例bean。
