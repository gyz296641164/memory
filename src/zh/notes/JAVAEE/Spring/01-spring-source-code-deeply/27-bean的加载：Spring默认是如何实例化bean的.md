---
title: 27_bean的加载：Spring默认是如何实例化bean的
category:
  - Spring源码
star: true
date: 2023-03-31
---

<!-- more -->

## 开篇

上节课，我们从第一次调用getBean方法的视角，从零开始分析了Spring是如何创建一个单例bean的，截止目前，我们只是初步看到了一些准备工作。

比如检查下是否存在prototype类型的bean在创建，标记下当前的bean开始创建了，获取bean对应的BeanDefinition以及提前初始化bean依赖的那些bean等。

------

好在我们在上节课的最后，总算是找到实例化bean的入口了，这一节，我们沿着上节课的入口，来分析下单例bean是如何创建的，这一节主要分为以下几个部分：

1. 先来简单看下Spring在实例化bean前后都会做些什么事情，寻找下真正实例化bean的入口在哪
2. 然后来看下Spring在实例化之前，会做哪些准备工作
3. 最后来看下Spring又是如何在bean实例化之前，提供一个机会让外界去介入bean的实例化过程的

---

## 初探getSingleton方法逻辑

我们接着上节课找到的bean实例化入口，继续来看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/20221204134727.png)

可以看到，实例化单例bean的代码结构和我们前面看到的比较类似，先通过方法getSingleton获取单例bean的实例sharedInstance，然后进一步通过方法getObjectForBeanInstance，检查下当前的bean是否需要通过FactoryBean来创建。

------

当然，这里的getSingleton方法就不是从缓存中获取bean的实例了，而是从零开始创建一个单例bean，可以看到在调用方法getSingleton时，除了将bean的名称beanName传进去之外，还添加了一个匿名内部类作为参数，而且在匿名内部类中有一个方法createBean。

根据方法的名称，我们初步可以判定在createBean方法中，应该就包含了实例化bean的核心逻辑了，接下来，我们先从getSingleton方法开始分析：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/20221204134733.png)

可以看到，前面匿名内部类传进来之后变成了ObjectFactory类型的参数singletonFactory，那ObjectFactory是什么呢？我们可以到ObjectFactory中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/20221204134736.png)

可以看到ObjectFactory其实就是一个接口，接口中只提供了一个方法getObject，而且我们刚刚也看到了，Spring默认会通过匿名内部类的方式来实现getObject方法，在getObject方法中添加了createBean方法来实例化bean。

可能有些同学也意识到了，通过实现ObjectFactory中的getObject方法来实例化bean，这不就是使用了普通工厂设计模式吗，这也是为什么Spring一直被称为专门是用来创建bean的工厂的原因。

而且虽然ObjectFactory和我们前面讲的FactoryBean，在名称上来看确实还挺像的，但是实际上的差异还是很大的，如果一个bean没有实现FactoryBean接口，Spring默认就会通过ObjectFactory中封装的这套逻辑来实例化bean。

但是，如果说bean实现了FactoryBean接口，那Spring虽然默认会通过ObjectFactory中的逻辑先实例化一个bean，但是最终得到的单例bean的实例，还是会以FactoryBean中getObject方法获得的单例bean实例为准，这些我们前面都讲过了。

---

## 从全局视角看bean的实例化

接下来，我们继续来看下getSingleton方法：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/20221204140257.png)

可以看到，方法getSingleton虽然有一定的代码量，但是从逻辑上来讲其实并不多，而且很多都是我们之前分析过的，首先，Spring在实例化bean之前，会调用方法beforeSingletonCreation记录当前的beanName对应的bean正在创建，接着和我们刚才的判断一致，Spring会调用singletonFactory中的getObject方法来实例化bean。

而在bean实例化之后，Spring又会调用afterSingletonCreation方法，来记录当前的bean已经创建好了，并且将创建好的单例bean通过addSingleton方法添加到相应的缓存中。

------

其中，beforeSingletonCreation方法和afterSingletonCreation方法前面我们已经分析过了，我们可以来回顾下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/20221204140303.png)

可以看到，这两个方法分别就是在bean实例化之前，添加beanName到集合singletonsCurrentlyInCreation中，表示当前bean正在创建，而在bean实例化完成之后，再从集合singletonsCurrentlyInCreation中移除，表示当前bean已经创建完毕。

而集合inCreationCheckExclusions主要是用来检查bean是否可能会被重复创建，这个集合我们暂时了解下就行了，关键是集合singletonsCurrentlyInCreation，前面我们也看到了它被用到的地方还是蛮多的。

------

前面还剩一个方法addSingleton，我们再来看下在方法addSingleton中，Spring是如何将实例化好的bean添加到缓存中的：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/20221204140308.png)

大家现在再看到这几个缓存，是不是就还挺亲切的呢？可以看到直接将单例bean添加到单例缓存singletonObjects中了。

------

既然单例bean的实例都已经得到了，那还要早期单例缓存earlySingletonObjects以及单例工厂缓存singletonFactories中的数据干什么呢，所以直接就从这两个缓存中删除beanName对应的信息了。

最后这里还有一个缓存registeredSingletons，通过名称我们就可以轻易知道，缓存registeredSingletons就是用来记录Spring容器中已经创建好的单例bean的名称。

------

可能有些同学就有疑惑了，之前不是说Spring的bean在实例化时，会提前将创建了一半的早期单例bean提前曝光，并封装在工厂缓存singletonFactories中吗？怎么这里一下子就得到了单例bean了呢？

大家不用太着急，难道大家忘了这行代码了吗：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/20221204140317.png)

因为目前我们还只是从全局的视角来分析bean的实例化，但是，bean具体是如何实例化的，目前还像一个黑盒一样隐藏在ObjectFactory中的getObject方法中。

---

## 预先处理需要覆盖的方法

为了彻底搞懂Spring默认是如何实例化bean的，我们先回退到调用getSingleton方法的位置：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/20221204150750.png)

而ObjectFactory类中getObject方法中的逻辑，如图所示，其实就是在匿名内部类中封装的，而且刚才我们也看到了，Spring默认就是通过这部分的逻辑来实例化单例bean的，所以，关于单例bean的实例化，一切的一切都是围绕着这部分代码来展开的。

可以看到在匿名内部类中，首先会通过方法createBean来实例化一个bean，如果实例化的过程当中出现异常，就会调用方destroySingleton方法，来清除单例bean相关的一系列缓存信息。

------

当然，我们先从createBean方法开始入手分析：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/20221204150800.png)

在createBean方法中，我们可以看到依然还是在做一些bean实例化前的准备工作，比如，在resolveBeanClass方法中先获取单例bean的Class对象，然后调用mbdToUse也就是BeanDefinition的prepareMethodOverrides方法，提前标记下需要覆盖的方法。

------

对于prepareMethodOverrides方法，前面我们在BeanDefinition注册到Spring容器时已经讲解过了，如果bean标签中配置了属性`lookup-method`以及属性`replaced-method`的值，这就意味着bean中的某些方法就需要被覆写了。

可能有些同学对lookup-method标签以及replaced-method标签有点疑惑，这里我们通过一个案例来了解下：

```java
public abstract class BaseStudent {

	public void sayHello() {
		getStudent().sayHello();
	}

	public abstract BaseStudent getStudent();

}
```

首先，我们创建一个抽象类BaseStudent，里面有一个抽象方法getStudent，然后在方法sayHello中调用抽象方法getStudent，接着，我们再创建一个类Student1：

```java
public class Student1 extends BaseStudent {

	@Override
	public void sayHello() {
		System.out.println("hello student1...");
	}

	@Override
	public BaseStudent getStudent() {
		return new Student1();
	}

}
```

可以看到，Student1继承了BaseStudent，且实现了抽象方法getStudent，同时自己也实现了方法sayHello。

------

我们再将它们配置到xml中：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="
                           http://www.springframework.org/schema/beans
                           http://www.springframework.org/schema/beans/spring-beans.xsd">
  
  <bean id="baseStudent" class="com.ruyuan.container.methodoverrides.BaseStudent">
    <lookup-method name="getStudent" bean="student1"/>
  </bean>
  
  <bean id="student1" class="com.ruyuan.container.methodoverrides.Student1"/>
  
</beans>
```

在xml中我们将抽象类BaseStudent配置上去，同时也给它添加了子标签lookup-method，在lookup-method标签中，指定了抽象方法getStudent的实现，以Student1中的为准，也就是说，后面在调用BaseStudent的getStudent方法时，实际上是动态调用Student1中的getStudent方法。

我们通过代码来看下：

```java
public class ApplicationContextDemo {
    
    public static void main(String[] args) throws Exception {
        ApplicationContext ctx = new ClassPathXmlApplicationContext("applicationContext.xml");
        BaseStudent student = (BaseStudent) ctx.getBean("baseStudent");
        student.sayHello();
    }
   
}
```

运行下看下效果：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/20221204150813.png)

可以看到，果然最终就是调用了Student1中的方法。

如果哪天，我们要替换方法sayHello的逻辑，完全可以再写一个子类，然后在标签lookup-method中替换上去，lookup-method标签的使用大概就是这样。

------

接下来我们再了解下标签replaced-method的使用：

```java
public class Student {

	public void sayHello() {
		System.out.println("hello...");
	}

}
```

我们也创建一个类Student，类中包括一个方法sayHello，然后我们再写一个类StudentReplacer：

```java
public class StudentReplacer implements MethodReplacer {

	@Override
	public Object reimplement(Object obj, Method method, Object[] args) throws Throwable {
		System.out.println("方法替换了...");
		return null;
	}
}
```

可以看到，StudentReplacer实现了Spring提供的一个接口MethodReplacer，MethodReplacer是专门是用来替换方法的一个接口，然后我们在接口方法reimplement中，重新实现方法的逻辑。

再把这两个类配置到xml中：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="
                           http://www.springframework.org/schema/beans
                           http://www.springframework.org/schema/beans/spring-beans.xsd">
  
  <bean id="student" class="com.ruyuan.container.methodoverrides.Student">
    <replaced-method name="sayHello" replacer="replacer"/>
  </bean>
  
  <bean id="replacer" class="com.ruyuan.container.methodoverrides.StudentReplacer"/>
  
</beans>
```

可以看到，在Student标签下添加了子标签replaced-method，标签中的属性name为方法名称sayHello，属性replacer值为id为replacer，这就表示Student中的sayHello方法，在调用时会被StudentReplacer中的reimplement方法替换了。

我们通过代码来看下效果：

```java
public class ApplicationContextDemo {
    
    public static void main(String[] args) throws Exception {
        ApplicationContext ctx = new ClassPathXmlApplicationContext("applicationContext.xml");
        Student student = (Student) ctx.getBean("student");
        student.sayHello();
    }
    
}
```

运行一下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/20221204150823.png)

可以看到，方法替换成功。

lookup-method是用来寻找方法的，而replacer-method主要就是替换方法的，使用方式大概也就是这样，但是，现在我们在实际开发过程中已经很少它们两了。

------

我们继续看到刚才的源码位置：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/20221204150829.png)

这个时候，Spring首先会在bean中找到属性lookup-method以及属性replace-method配置的方法，然后才能覆盖它们对不对？但是，Spring在寻找方法时会担心，万一这些方法还有其他重载的方法该怎么办呢？

所以，Spring在寻找方法时，就会根据参数或其他手段去这些重载方法中匹配寻找，比如一个bean中某个需要覆盖的方法，同时存在多个重载方法，这个寻找匹配的过程是比较耗时的，所以，Spring为了加快在bean中寻找目标方法的速度，我们来看下Spring都做了什么事情：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/20221204150833.png)

Spring会遍历bean中所有需要覆写的方法，然后再通过prepareMethodOverrides方法进行检查和预处理，那怎么处理呢？

------

可以看到在prepareMethodOverrides方法中，如果通过ClassUtils中getMethodCountForName方法，判断出bean中相同名称的方法数量就一个，同一个名称的方法就一个，那就证明该方法根本就没有重载方法了。

此时，Spring就会提前通过代码mo.setOverloaded(false)，设置该方法不需要去重载方法中寻找，到时候要覆盖这个方法时，直接根据方法名称到bean中寻找即可，避免了在重载方法中寻找匹配方法的性能损耗。

话说回来，bean标签中的属性lookup-method及属性replace-method，在日常开发中用的都已经很少了，所以这块的原理我们重在了解下。

---

## 给后处理器一个实例化bean的机会

接下来，我们继续看下createBean后面的逻辑：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/20221204164401.png)

可以看到，接下来会调用方法resolveBeforeInstantiation获取bean的实例，而且，如果bean不为空直接就返回了。

这可就有意思了，难道这里也有可能是Spring实例化bean的一个时机吗？通过注释，我们可以知道方法resolveBeforeInstantiation是Spring提供给bean后处理器BeanPostProcessor来创建一个代理对象的机会。

------

之前在学习BeanPostProcessor时提到过，我们可以通过自定义实现BeanPostProcessor，这样就可以介入bean的实例化，而现在正好就看到了第一个介入的入口了，这也是Spring给我们提供的一个重要的扩展点。

现在，我们基本上可以预测到在方法resolveBeforeInstantiation中，就是提供了这样一个机会，一个可以通过执行后处理器BeanPostProcessor中的方法来实例化一个bean的机会。

而且我们可以看到，在方法resolveBeforeInstantiation返回bean之后，Spring同时也比较贴心的判断，如果按照我们自定义的BeanPostProcessor创建出来的bean不为空，就直接return返回了，就不会走下面Spring默认实例化bean的一系列逻辑了。

------

基于我们目前的分析，我们现在可以到方法resolveBeforeInstantiation中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/20221204164412.png)

默认情况下，BeanDefinition中的属性beforeInstantiationResolved为null，并且，我们最开始也没有注册任何相关的后处理器，所以方法hasInstantiationAwareBeanPostProcessors返回的结果也是false，所以方法resolveBeforeInstantiation直接就return掉了。

当然，受到好奇心的驱使，我们还是来看下这两个方法在干什么：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/20221204164415.png)

通过方法的名称，我们可以知道很明显在这两个方法中，就是在执行BeanPostProcessor中的前置以及后置处理方法来实例化bean。

我们先到方法applyBeanPostProcessorsBeforeInstantiation中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/20221204164418.png)

可以看到，方法applyBeanPostProcessorsBeforeInstantiation其实也没什么特殊的，首先会获取Spring容器中已经注册好的后处理器BeanPostProcessor，并且只会对类型为InstantiationAwareBeanPostProcessor的后处理器进行处理。

------

通过名称InstantiationAwareBeanPostProcessor，我们可以知道这是一个能够感知到bean实例化的后置处理器，那InstantiationAwareBeanPostProcessor又是什么呢？我们来看：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/20221204164422.png)

可以看到，因为InstantiationAwareBeanPostProcessor继承了接口BeanPostProcessor，所以InstantiationAwareBeanPostProcessor从本质上来说也是一个bean的后处理器。

而且，InstantiationAwareBeanPostProcessor在BeanPostProcessor接口基础之上又新增好几个方法，其中，方法postProcessBeforeInstantiation和postProcessAfterInstantiation，主要是在bean实例化之前和之后，添加一些自定义实例化bean的逻辑，而postProcessProperties方法主要是为bean的实例化提供一些属性信息。

总的来说，最底层的BeanPostProcessor重在定义初始化bean的操作，而InstantiationAwareBeanPostProcessor重在定义实例化bean的操作，实例化可以理解为是从0到1创建一个bean出来，而初始化可以理解为为bean填充属性赋值等过程。

------

我们再看到刚才调用方法applyBeanPostProcessorsBeforeInstantiation的位置：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/20221204164430.png)

因为我们当前正是出于bean实例化之前，可以看到，此时Spring就会调用bean实例化之前的前置处理方法postProcessBeforeInstantiation尝试一下，一旦这个方法实例化bean成功了，Spring就会直接返回实例化好的bean，而不会走Spring默认实例化bean的逻辑了。

所以，我们完全可以自定义InstantiationAwareBeanPostProcessor的实现类，在方法postProcessBeforeInstantiation中定义bean实例化的逻辑，这样的话，Spring就会按照我们定义好的逻辑来实例化bean了。

大家现在应该发现了，Spring中的大量扩展点都是通过BeanPostProcessor辐射出来的，只要理解了基础的BeanPostProcessor用法，BeanPostProcessor子类的用法其实是非常丰富的，而且非常的灵活。

------

我们再回到刚才调用方法applyBeanPostProcessorsBeforeInstantiation的位置：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/20221204164437.png)

和我们刚说的一样，如果通过前置处理方法applyBeanPostProcessorsBeforeInstantiation得到bean的实例不为空，此时就会调用方法applyBeanPostProcessorsBeforeInstantiation。

我们再到方法applyBeanPostProcessorsAfterInitialization中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/20221204164444.png)

可以看到，这里调用的方法applyBeanPostProcessorsAfterInitialization，就不是接口InstantiationAwareBeanPostProcessor中的实例化bean的后置处理方法了，而是BeanPostProcessor中的后置处理方法，只是做一些简单的初始化操作，正是因为bean已经实例化好了，才有必要进行下一步的初始化操作。

------

因为默认情况下是没有注册后处理器InstantiationAwareBeanPostProcessor的，所以这块逻辑我们暂时是不会执行的，但是Spring给我们提供了这样的一套框架，让我们在需要扩展Spring功能的时候有了非常好的切入点。

我们接着往后看：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/20221204164448.png)

可以看到，接下来会调用方法doCreateBean，现在我们看到以do为前缀的方法，基本都快形成条件反射了，可以确定Spring默认实例化bean的逻辑，就在doCreateBean方法中。

而Spring具体是如何通过doCreateBean方法来实例化bean的，我们下一节再来分析。

------

## 总结

好了，今天的知识点我们就讲到这里了，我们来总结一下吧。

通过一张图来梳理下当前的流程：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/20221204164456.png)

这一节，我们初步分析了一下Spring中的单例bean，默认是如何实例化的，而且，我们也找到了实例化bean的入口了，其实就是将核心实例化bean的逻辑，通过匿名内部类的方式封装成了一个ObjectFactory。

然后通过ObjectFactory中的getObject方法来实例化bean，这也是简单工厂设计模式在Spring中的一个应用。

------

然后，我们看到Spring通过ObjectFactory获取到bean的实例之后，会将单例bean添加到单例缓存中，分析到这里，我们算是和之前的多级缓存关联起来了。

最后，我们以ObjectFactory中的getObject方法作为入口，初步分析了下Spring是如何实例化bean的，一开始只不过是一些简单的准备工作，而且，我们还发现在实例化bean之前，Spring还提供了一个扩展点，允许我们通过自定义后处理器来实例化一个bean。