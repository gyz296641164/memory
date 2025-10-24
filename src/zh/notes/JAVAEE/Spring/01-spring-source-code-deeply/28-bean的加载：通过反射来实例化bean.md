---
title: 28_bean的加载：通过反射来实例化bean
category:
  - Spring源码
star: true
date: 2023-03-31
---

<!-- more -->

## 开篇

上一节，我们初步了解了一下Spring默认是如何实例化bean的，可以感觉到Spring在实例化bean之前，还是做了非常多的准备工作的，在上一篇文章最后，我们总算是找到Spring实例化bean的核心位置也就是方法doCreateBean。

接下来，我们就从方法doCreateBean开始，分析下Spring是如何实例化bean的，这一节主要分为以下几个部分：

1. 先来看下Spring在实例化bean之前还会做哪些准备和检查

2. 然后通过两个案例体验下在Spring中，如何通过工厂方法实例化bean的

3. 最后我们再来深入探究一下Spring默认究竟是如何实例化一个bean的

---

## 检查Class是否符合条件

我们从上篇文章分析到的方法doCreateBean开始，继续往后面看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/20221206154931.png)

可以看到方法doCreateBean中的代码量也是蛮恐怖的，但是不管怎么样bean的实例化现在我们就差最后这一个方法了，所以在接下来几讲的文章中，我们的目标就是要把这个方法中的一些关键点给吃透。

------

接下来，我们一点点来分析：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/20221206154937.png)

首先，如果发现BeanDefinition为单例类型，就会从factoryBeanInstanceCache中获取一个BeanWrapper，默认BeanDefinition的类型为单例且factoryBeanInstanceCache是为空的，所以，我们获取到的instanceWrapper最终也是为null。

其中，factoryBeanInstanceCache就是一个缓存，是用来存放FactoryBean实例对应的BeanWrapper，而BeanWrapper我们可以理解为就是bean实例的一个包装类而已，再得到bean的最终实例之前，bean的实例化还得要依附于BeanWrapper，在接下来的源码中，我们即将会看到相关的痕迹。

------

接下来可以看到，如果从缓存factoryBeanInstanceCache中获取不到instanceWrapper之后，Spring就会调用createBeanInstance方法来创建一个BeanWrapper。

那BeanWrapper是如何创建的呢？并且为什么要创建BeanWrapper呢？我们到方法createBeanInstance里面看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/20221206154943.png)

可以看到方法createBeanInstance中的逻辑依旧是蛮多的，但是，我们重点关注我们想要看到的一些重要逻辑。

首先会调用方法resolveBeanClass，从BeanDefinition mbd中解析并获取Class，还记得前面我们已经调用过一次方法resolveBeanClass，并成功获取过一次bean的Class了，而Spring之所以在这里重复调用一次该方法，只不过是想要确认bean的Class一定是能解析成功的，毕竟bean的进程都到这节骨眼上了。

而且可以看到在第一个if分支中，Spring会判断bean对应的Class如果不是被public关键字修饰的，并且也没有通过反射机制来设置这个Class是可以访问的，就会抛出异常中止bean的实例化，从这里我们基本就可以推断出Spring，默认就是通过反射机制来实例化bean的。

------

这样来看的话，我们大概也就知道方法后续的逻辑是在干什么了，其实就是一些和反射API相关的的操作了，目的就是通过反射来创建一个对象出来，我们继续往后面看：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/20221206154951.png)

接下来可以看到会通过方法getFactoryMethodName，判断下bean对应的BeanDefinition中，是否存在属性factoryMethodName的值，那属性factoryMethodName是干什么的呢？

---

## 通过工厂方法来实例化bean

说到BeanDefinition中的属性factoryMethodName，这里又要牵扯出暨BeanPostProcessor、FactoryBean、ObjectFactory之后，Spring的第四种实例化bean的方式了，也就是通过工厂方法来实例化bean。

那Spring又是如何通过工厂方法来实例化bean的呢？我们先通过案例来体验下，首先我们先创建一个bean：

```java
public class Student {
    
    private String name = "factoryMethodStudent";
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
}
```

然后我们再创建一个StudentFactory类：

```java
public class StudentFactory {

	public static Student getStudentObject() {
		return new Student();
	}

}
```

很简单，StudentFactory类中就只有一个方法getStudentObject，而getStudentObject方法中的逻辑也很简单，就是通过new关键字创建了一个Student类型的对象，当然，实际我们可以根据自己的需求，来自定义bean的实例化逻辑。

需要注意的是，这里getStudentObject方法为static关键字修饰的静态方法，现在我们可以认为StudentFactory就是专门生产Student实例的一个静态工厂。

------

然后，我们再将StudentFactory类配置到applicationContext.xml中：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="
               http://www.springframework.org/schema/beans 
               http://www.springframework.org/schema/beans/spring-beans.xsd">
  
  <bean id="student" class="com.ruyuan.container.factorymethod.StudentFactory"
        factory-method="getStudentObject"/>
  
</beans>
```

在bean标签中，通过class属性配置好了StudentFactory类，而且，我们还特意配置了属性factory-method的值，属性factory-method指定的静态工厂方法就是getStudentObject。

这样的话，当我们从Spring容器中获取名称为student的bean时，Spring就会调用StudentFactory类中的getStudentObject方法，来实例化一个Student类型的bean了。

------

了解了基本实例化过程之后，我们最后来看下效果：

```java
public class FactoryMethodDemo {
    
    public static void main(String[] args) throws Exception {
        ApplicationContext ctx = 
            new ClassPathXmlApplicationContext("applicationContext.xml");
        Student student = (Student) ctx.getBean("student");
        System.out.println(student.getName());
    }
    
}
```

再运行下代码看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/20221206155028.png)

果然和我们刚才的预期一致，完美通过getStudentObject方法实例化了一个Student类型的对象。

------

那有些同学可能就要问了，Spring既然可以通过静态工厂方法来实例化bean，那能不能通过实例工厂方法来实例化bean呢？也就是通过不带static关键修饰的工厂方法？答案当然也是可以的，我们只需要简单修改下代码以及相应的xml配置：

```java
public class StudentFactory {

	public  Student getStudentObject() {
		return new Student();
	}

}
```

首先，我们将StudentFactory中，getStudentObject方法前面的static关键字去掉，让getStudentObject方法成为一个实例方法，然后再调整下applicationContext.xml中的配置：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="
                    http://www.springframework.org/schema/beans 
                    http://www.springframework.org/schema/beans/spring-beans.xsd">
  
  <bean id="studentFactory" class="com.ruyuan.container.factorymethod.StudentFactory"/>
  <bean id="student" factory-bean="studentFactory" factory-method="getStudentObject"/>
  
</beans>
```

可以看到，我们将StudentFactory类单独配置在一个bean标签中，然后通过另外一个bean标签中的factory-method属性引用了StudentFactory这个bean，但是，关键的factory-method属性是必须要配置的，表示指定哪个工厂方法来实例化bean。

然后，我们再运行下刚才的测试代码，可以发现看到的效果是一样的，但是实例化过程稍微有些不同。

当我们从Spring中获取名称为student的bean时，Spring首先会找到factory-bean属性指定的bean，先实例化这个bean，然后调用factory-bean对应的bean的getStudentObject方法，得到最终实例化好的bean。

------

通过上面的两个小案例，我们可以意识到Spring既可以通过静态工厂来实例化bean，也可以通过实例工厂来实例化bean，Spring果然妥妥的是一个创建bean的大工厂。

现在，我们再来回顾下刚才的代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/20221206155039.png)

其中，getFactoryMethodName方法获取的，就是bean标签中factory-method属性配置的工厂方法名称，如果getFactoryMethodName方法的返回值不为null，Spring就会按照我们刚才案例中看到的那样，调用工厂方法来实例化bean了，就不会走Spring的默认实例化bean的逻辑了，可以看到这里同样也是我们可以利用的一个扩展点。

而接下来的方法instantiateUsingFactoryMethod中的逻辑，大家了解下就可以了，因为方法instantiateUsingFactoryMethod中的代码逻辑，本质上就是一些反射相关的操作，而且代码极为的冗长和乏味，但核心就是像我们刚才分析的一样，就是判断一下当前是通过静态工厂方法，还是通过实例工厂方法来实例化bean的实例。

---

## 通过反射实例化一个bean

接下来，我们继续往后面看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/20221206155114.png)

初次实例化bean时，BeanDefinition中的resolvedConstructorOrFactoryMethod属性默认是为空的，所以该部分的代码初次是不会执行的，我们再看到下面这部分的代码：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/20221206155117.png)

其实这块代码也没什么特别重要的逻辑，其实就是通过determineConstructorsFromBeanPostProcessors方法，执行一些后处理器BeanPostProcessor中的逻辑，而这些后处理器中的逻辑，主要是获取Class中的多个重载构造方法ctors。

在if分支中，其中有一个判断逻辑为 mbd.getResolvedAutowireMode() == AUTOWIRE_CONSTRUCTOR，虽然我们不太清楚AUTOWIRE_CONSTRUCTOR是什么，但是通过AUTOWIRE_CONSTRUCTOR的名称，我们大概可以感觉到它应该和@Autowired注解有关系。

确实，if分支里面的方法autowireConstructor，主要是为了实例化构造方法上添加了@Autowired注解的bean，而这块逻辑我们后面分析到@Autowired注解时再来仔细分析下。

------

而且，在我们当前要实例化的bean中，确实也是没有其他重载的构造方法，所以，接下来代码就会来到最后一个方法instantiateBean中。

通过方法instantiateBean上的注释，我们可以大概知道方法instantiateBean是用来专门处理无参构造方法的bean，正好符合我们当前的状况，我们进去看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/20221206155125.png)

可以看到，方法instantiateBean中的代码结构比较清晰，首先会通过方法instantiate实例化一个实例beanInstance，然后将bean的实例封装到BeanWrapper中。

------

从这里我们就发现了，原来BeanWrapper其实就是简单包装了一下bean的实例而已，没什么特别的，那bean的实例beanInstance具体是如何创建的呢？我们直接到方法instantiateBean中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/20221206155129.png)

如果if分支不成立，也就是当前的bean标签中配置了属性lookup-method或者replace-method，前面我们也提到了，配置了这两属性就意味着实例化bean的时需要覆写bean中的方法，而具体如何覆写的呢？

可以看到，Spring默认会调用方法instantiateWithMethodInjection，我们可以到方法instantiateWithMethodInjection里面看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/20221206155133.png)

可以看到，接下来会来到CglibSubclassingInstantiationStrategy类中，我们再到CglibSubclassCreator中的方法instantiate看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/20221206155136.png)

可以看到，方法最后确实是对lookup-method和replace-method指定需要覆盖的方法，添加了方法拦截器LookupOverrideMethodInterceptor和ReplaceOverrideMethodInterceptor进行增强处理，也就是达到一个覆写方法的效果。

我们再到createEnhancedSubclass方法中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/20221206155139.png)

看到这里大家应该都明白了吧，Spring底层对于需要覆写方法的那些bean的实例化，其实就是通过cglib这套API来玩的。

------

了解完这个之后，我们及时回到主线上来，因为我们当前探索的bean是不需要覆写方法的，所以，if分支成立：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/20221206155143.png)

其中一些特别细节的边缘代码，我们可以不用太在意，但是，我们发现方法instantiateBean应该是特别关键的，跟进去看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/20221206155147.png)

果然，前面的一些猜测性的话现在都尘埃落定了，Spring默认就是通过反射来实例化一个bean的。

---

## 总结

好了，今天的知识点我们就讲到这里了，我们来总结一下吧。

通过一张图来梳理下当前的流程：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/20221206155202.png)

这一节，我们主要了解了一下实际在bean实例化时，会再次加载bean的Class，确保Class一定是能够解析到的，并判断Class是否满足bean实例化的条件。

然后在分析源码时，我们也了解了BeanDefinition中属性factoryMethodName的作用，其实就是通过工厂方法来实例化bean，而且我们还通过两个简单的小案例，体验了一下在Spring中是如何通过静态工厂方法以及实例工厂方法来创建bean的。

最后，我们总算是看到了Spring实例化bean的方式，默认就是通过反射机制来实现的。

------

下一节，我们来看下当通过反射机制创建好了bean的实例之后，接下来还会对这个刚创建好的bean实例干些什么事情呢？如果大家对之前的内容很熟悉的话，是不是已经猜到一些了呢？