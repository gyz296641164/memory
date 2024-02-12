---
title: 31_bean的加载：看下bean是如何进行初始化的
category:
  - Spring源码
star: true
date: 2023-03-31
---

<!-- more -->

<h1 aliggn="center">31_bean的加载：看下bean是如何进行初始化的</h1>

## 开篇

前面，我们已经了解了Spring是如何为bean填充属性的，而且，在属性填充时还涉及到了三种自动装配模式，分别是根据名称、类型以及构造方法来自动装配bean的属性。

------

在完成了bean的属性填充之后，离bean实例化完成还差最后一步，也就是初始化bean的实例，接下来，我们来看下这块逻辑，这一节主要包括以下几个部分：

1. 首先看下Spring是处理各种感知接口的

2. 然后看下InitializingBean接口是干什么的，并且如何使用

3. 体验下如何自定义bean的初始化方法，同时看下Spring是如何执行的

4. 然后再来看下DisposableBean接口是干什么的，并且如何使用

5. 体验下如何自定义bean的销毁方法，同时了解下Spring又是如何执行的

6. 最后来看下Spring默认注册的DisposableBeanAdapter中会有哪些逻辑

---

## 执行感知接口的方法

接下来，我们再回到之前源码分析的位置：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301301459384.png)

前面我们在方法populateBean中，已经看到了为bean的实例填充属性的相关逻辑了，接下来，我们再来看下方法initializeBean，方法initializeBean的名称，简单翻译一下大概可以知道是要初始化bean的实例了，我们到方法initializeBean中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301301459698.png)

可以看到，在方法initializeBean中，首先会执行方法invokeAwareMethods，我们到方法invokeAwareMethods中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301301500027.png)

看到这里我们算是兑现之前的预测了，也就是说Spring在bean实例化时，最终会调用感知接口中的方法，将Spring容器内相应的组件注入到bean的实例中。

可以看到，原来Spring是在初始化bean的实例时完成这件事的。

---

## InitializingBean是什么呢？

我们继续看下initializeBean方法后面的逻辑：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301301500876.png)

很明显，接下来的三个方法比较关键，我们先来看下方法applyBeanPostProcessorsBeforeInitialization和applyBeanPostProcessorsAfterInitialization：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301301500359.png)

如图，原来这两个方法是在执行后处理器BeanPostProcessor相关的逻辑，而且我们可以发现，这里执行的是最底层接口BeanPostProcessor中的前置和后置处理方法。

前面在分析bean加载的逻辑时，虽然我们也发现了很多后处理器的执行，但是那些后处理器只不过是在执行它们自己拓展的一些后处理器方法而已，而实际底层接口BeanPostProcessor中的方法，却还没有特意统一地去执行。

这里，当bean进行初始化时才会统一执行BeanPostProcessor中的方法，为bean的实例化进行一些初始化的操作，当然，BeanPostProcessor中的逻辑具体是怎样的，得要看你自定义实现的逻辑，这里同样是Spring提供的一个扩展点。

------

而方法invokeInitMethods应该是初始化bean的核心了，我们进去看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301301500815.png)

可以看到，方法invokeInitMethods首先会判断当前bean，是否是接口InitializingBean的实例，如果是的话，就会执行InitializingBean中的方法afterPropertiesSet。

那方法afterPropertiesSet到底是干什么的呢？我们可以看到InitializingBean中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301301500993.png)

可以看到，接口InitializingBean中只有一个方法afterPropertiesSet。

通过注释，我们大概可以知道方法afterPropertiesSet的调用时机，是在bean实例完成所有属性值设置之后，而且，方法afterPropertiesSet的作用，主要是对bean实例进行一些配置和最终的初始化操作。

---

## InitializingBean如何使用呢？

接下来，我们通过一个简单的案例，来体验下InitializingBean是如何使用的：

```java
public class Student implements InitializingBean {
    
    @Override
    public void afterPropertiesSet() throws Exception {
        System.out.println("执行方法afterPropertiesSet，初始化bean...");
    }
    
}
```

首先，我们创建一个类Student，并且让Student实现接口InitializingBean中的方法afterPropertiesSet，然后，在方法afterPropertiesSet中打印一句话。

再将Student配置到配置文件applicationContext.xml中：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="
                           http://www.springframework.org/schema/beans
                           http://www.springframework.org/schema/beans/spring-beans.xsd">
  
  <bean id="student" class="com.ruyuan.container.initbean.Student"/>
</beans>
```

可以知道的是，当Student实例化时，Spring会判断Student是否实现了接口InitializingBean，如果实现了，就会像我们刚才源码看到的一样，在Student对应的bean实例的初始化阶段，执行Student中的方法afterPropertiesSet。

------

接下来，我们通过一段代码来看下效果：

```java
public class ApplicationContextDemo {
    
    public static void main(String[] args) throws Exception {
        ApplicationContext ctx =
            new ClassPathXmlApplicationContext("applicationContext.xml");
        Student student = (Student) ctx.getBean("student");
    }
    
}
```

运行下代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301301501287.png)

和我们预想的一致，在bean初始化时，就会执行InitializingBean接口中的afterPropertiesSet方法。

---

## 执行bean的初始化方法

了解完InitializingBean之后，我们接着来分析下后面的逻辑：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301301501906.png)

可以看到，接下来会通过方法getInitMethodName，从mbd也就是bean的BeanDefinition中获取bean的初始化方法。

------

那bean的初始化方法是什么呢？我们同样也通过一个案例来体验下：

```java
public class Student {

	private String name;

	public void init() {
		System.out.println("执行初始化方法init...");
		this.name = "ruyuan";
	}

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

我们还是通过Student类来演示，这里，我们在Student类中还额外添加了一个方法init，接下来，我们会指定init方法为Student的初始化方法，初始化方法的作用，主要是为bean的实例化做一些初始化的工作。

然后，我们再将Student类配置到applicationContext.xml中：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="
                           http://www.springframework.org/schema/beans
                           http://www.springframework.org/schema/beans/spring-beans.xsd">
  
  <bean id="student" class="com.ruyuan.container.initmethod.Student"
        init-method="init"/>
</beans>
```

可以看到，和前面不同的是，我们在bean标签中还添加了属性init-method，并且指定属性值为init，表示Student的初始化方法为init，这样的话，当Student对应的bean在初始化时，就会调用方法init来初始化bean。

------

我们通过代码来看下：

```java
public class ApplicationContextDemo {
    
    public static void main(String[] args) throws Exception {
        ApplicationContext ctx =
            new ClassPathXmlApplicationContext("applicationContext.xml");
        Student student = (Student) ctx.getBean("student");
        System.out.println(student);
    }
    
}
```

运行下看下实际的效果：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301301501666.png)

果然，和我们刚才的预期一致，初始化bean时执行了我们指定的初始化方法。

------

了解完bean的初始化方法之后，我们继续来到前面分析的位置：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301301501375.png)

这里的initMethodName，其实就是我们在标签中指定的初始化方法，并且，接下来会在方法invokeCustomInitMethod中，执行我们自定义的初始化方法来初始化bean的实例。

我们再跟进到方法invokeCustomInitMethod中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301301501082.png)

抛开一些琐碎的代码，可以看到在方法invokeCustomInitMethod中，逻辑没有那么多弯弯绕绕的，其实就是通过反射来执行初始化方法。

所以，我们可以看到在bean实例化时，首先会判断bean是否实现了接口InitializingBean，如果实现了就先执行InitializingBean中的方法，然后再执行指定的初始化方法，提前做些初始化bean的事情。

---

## 注册DisposableBeanAdapter

了解完InitializingBean以及bean的初始化方法之后，我们再回到doCreateBean方法，看下最后还有哪些逻辑：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301301502053.png)

前面我们已经分析过了，Spring默认是允许曝光早期单例bean的，所以earlySingletonExposure为true，可以看到，接下来会先调用方法getSingleton，从缓存中获取单例bean。

因为参数allowEarlyReference值为false，表示不允许早期引用，也就是不允许从工厂缓存获取早期的单例bean，所以，方法getSingleton初次被调用时，得到的earlySingletonReference为null。

------

接下来，Spring会注册销毁bean相关的方法，我们顺便也来看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301301502959.png)

我们跟进到方法registerDisposableBeanIfNecessary中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301301502751.png)

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301301502686.png)

可以看到，方法registerDisposableBeanIfNecessary主要就是为bean注册DisposableBeanAdapter，而DisposableBeanAdapter就是在bean销毁时发挥作用的。

------

那DisposableBeanAdapter到底是什么呢？我们可以来看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301301502493.png)

可以看到，DisposableBeanAdapter默认实现接口DisposableBean，那接口DisposableBean又是什么呢？

------

我们到接口DisposableBean中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301301502576.png)

可以看到，接口DisposableBean中只有一个方法destory，而且，通过注释我们可以知道方法destory会在bean销毁之前被Spring容器调用执行。

通过接口DisposableBean中的方法destory，我们可以在bean销毁之前做一些事情，比如可以在destory方法中进行垃圾回收，或者释放和bean相关的一些资源等。

---

## DisposableBean及destory方法的使用

接下来，我们也通过一个案例来看下DisposableBean是如何使用的：

```java
public class Student implements DisposableBean {

	@Override
	public void destroy() throws Exception {
		System.out.println("bean销毁前调用destory方法...");
	}

}
```

类似InitializingBean，Student类实现了接口DisposableBean中的destory方法，而且在destory方法中也打印了一句话。

------

然后，我们再将Student类配置到applicationContext.xml中：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="
                           http://www.springframework.org/schema/beans
                           http://www.springframework.org/schema/beans/spring-beans.xsd">
  
  <bean id="student" class="com.ruyuan.container.destorybean.Student"/>
</beans>
```

因为DisposableBean中的destory方法，是在bean销毁时被调用的。

所以，我们可以调用close方法来关闭Spring容器，容器关闭时会销毁所有的bean，同时也会触发方法destory的调用：

```java
public class ApplicationContextDemo {
    
    public static void main(String[] args) throws Exception {
        ClassPathXmlApplicationContext ctx = new ClassPathXmlApplicationContext("applicationContext.xml");
        Student student = (Student) ctx.getBean("student");
        ctx.close();
    }
    
}
```

可以看到，当调用ClassPathXmlApplicationContext的close方法关闭Spring容器时，容器中的所有bean都会被销毁，恰好也满足了方法destory的调用时机。

------

我们运行下代码，看下效果：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301301503053.png)

果然，destory方法调用成功。

------

那既然接口DisposableBean和接口InitializingBean类似，那销毁bean时有没有类似bean标签中属性init-method这样的，可以指定bean中的方法为销毁方法的机制呢？答案当然也是有的，我们也来看下：

```java
public class Student {

	public void destroy() throws Exception {
		System.out.println("普通的destory方法执行...");
	}

}
```

可以看到，现在Student类中只定义了一个方法destory，然后，我们再将Student类配置到applicationContext.xml中：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="
                           http://www.springframework.org/schema/beans
                           http://www.springframework.org/schema/beans/spring-beans.xsd">
  
  <bean id="student" class="com.ruyuan.container.destorymethod.Student"
        destroy-method="destroy"/>
</beans>
```

和属性init-method类似，bean标签也为销毁方法提供了属性destory-method，用来指定bean中的销毁方法，当bean被销毁时，Spring同样会执行bean实例中，属性destory-method指定的销毁方法。

------

我们再通过代码来看下效果：

```java
public class ApplicationContextDemo {
    
    public static void main(String[] args) throws Exception {
        ClassPathXmlApplicationContext ctx = new ClassPathXmlApplicationContext("applicationContext.xml");
        Student student = (Student) ctx.getBean("student");
        ctx.close();
    }
    
}
```

同样的，我们还是通过关闭容器来触发bean的销毁，运行看下效果：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301301503290.png)

果然，bean实例中的destory方法在bean销毁时被执行了。

---

## DisposableBeanAdapter的功能分析

那bean销毁时，到底是DisposableBean接口中的destory方法先执行，还是bean标签中的属性destory-method指定的方法先执行呢？这个，我们还得要到DisposableBeanAdapter寻找答案。

作为DisposableBean接口的实现类，DisposableBeanAdapter当然也实现了destory方法，接下来，我们来看下Spring默认注册的DisposableBeanAdapter，在destory方法中具体干了哪些事情：，

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301301503328.png)

可以看到，在destory方法中，Spring首先给我们提供了一个后处理器的扩展点，也就是自定义实现后处理器DestructionAwareBeanPostProcessor中的方法postProcessBeforeDestruction，这样的话，我们在指定bean销毁前就可以做一些事情了。

------

我们再看下后面的逻辑：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301301503597.png)

如果成员变量invokeDisposableBean为true，且当前bean实例是DisposableBean的实例，就会执行bean的destory方法。

那成员变量invokeDisposableBean的值是否为true呢？我们来看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301301503591.png)

在DisposableBeanAdapter的构造方法中，和我们刚才分析的一致，如果发现当前实例bean是DisposableBean接口的实例，invokeDisposableBean就为true，也就是会执行bean中的destory方法。

------

接下来，我们最后来看下destory方法剩下的一些逻辑：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301301503952.png)

很显然，这里就是执行属性destory-method指定的方法了，和前面执行init-method方法是类似的。

------

截止到这里，bean加载的逻辑基本上都已经分析完毕，我们回到单例bean创建的位置来看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301301503242.png)

可以看到，当单例bean实例化之后，和我们之前从缓存中获取单例bean类似，接下来还会调用方法getObjectForBeanInstance，看下bean是否是FactoryBean的实例，并且是否需要通过FactoryBean来实例化bean，当然，这块逻辑我们之前已经分析过了。

------

最后，就是对单例之外的其他类型bean的实例化了，比如prototype等：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301301504168.png)

其他类型bean的实例化和单例bean的实例化，在主流程上都比较类似的，可以看到，Spring最后会将实例化好的bean直接返回，截止到这里，bean的加载流程算是结束了。

---

## 总结

好了，今天的知识点我们就讲到这里了，我们来总结一下吧。

通过一张图来梳理下bean加载的流程：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301301504051.png)

这一节我们了解了bean初始化时，首先会执行感知接口如BeaNameAware、BeanClassLoaderAware和BeanFactoryAware中的方法，如果bean实现了这些感知接口，Spring就会将容器内部的一些组件注入到bean实例中。

------

然后，Spring会执行后处理器的前置处理方法来初始化实例bean，前置方法处理完之后，接着会执行初始化相关的方法，比如，Spring会检查bean是否实现了接口InitializingBean，如果实现了就会先执行该接口中的方法。

再判断下当前的bean是否指定了初始化方法，如果bean指定了初始化方法，此时也会顺便执行，最后，Spring再后处理器的后置处理器方法，进一步初始化bean的实例。

------

最后，Spring默认会为刚初始化好的bean实例，注册DisposableBean的实现类DisposableBeanAdapter，当bean销毁之前，Spring会通过DisposableBeanAdapter的destory方法判断一下。

如果bean实现了DisposableBean接口，就会调用DisposableBean中的destory方法，同时，如果发现bean也指定了销毁的方法，在DisposableBeanAdapter的destory方法中也会一并执行。

总的来说，在bean初始化时先执行InitializingBean接口的方法，再执行bean指定的初始化方法；同样，在bean销毁时，先执行接口DisposableBean中的方法，再执行bean指定的销毁方法。