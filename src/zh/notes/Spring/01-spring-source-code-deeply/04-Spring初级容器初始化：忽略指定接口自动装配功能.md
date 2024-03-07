---
title: 04_Spring初级容器初始化：忽略指定接口自动装配功能
category:
  - Spring源码
star: true
date: 2023-03-30
---

<!-- more -->



> 当Spring容器获取到资源之后，下一步会干些什么事情呢？这一节主要分为以下几个环节：

1. 首先，我们会随着`XmlBeanFactory`的构造方法一路跟进去看下里面都有哪些逻辑

2. 根据我们看到的代码，先来认识下Spring中的`感知接口`又是什么

3. 然后我们会来演示下感知接口一般都是如何使用的，先直观体验一下

4. 最后我们再结合源码分析一下，为什么Spring需要忽略这些感知接口

---

## 初探ignoreDependencyInterface方法

我们继续看到之前的demo代码：

```java
@SuppressWarnings("all")
public class BeanFactoryDemo {

    public static void main(String[] args) {

        XmlBeanFactory xmlBeanFactory = new XmlBeanFactory(new ClassPathResource("applicationContext.xml"));
        Student student = (Student) xmlBeanFactory.getBean("student");
        System.out.println(student.getName());
    }
}
```

可以看到，当`applicationContext.xml`经过`ClassPathResource`封装之后，会作为`XmlBeanFactory`的构造方法参数传递进去，现在，我们就顺着`XmlBeanFactory`的构造方法来看一下。

进入到XmlBeanFactory的构造方法之后，可以看到调用了XmlBeanFactory另外一个构造方法 `XmlBeanFactory(Resource, BeanFactory)`：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202211081509414.png" />

其中，参数parentBeanFactory的值默认为null。

而且，我们可以预感到XmlBeanFactory初始化时，核心逻辑应该在`this.reader.loadBeanDefinitions(resource)`这行代码中，但是XmlBeanFactory首先调用了super方法，也就是父类的构造方法。

所以，我们先来看下XmlBeanFactory的父类构造方法中，会干些什么事情：

- 我们从XmlBeanFactory的构造方法开始，一路跟进到到父类`AbstractAutowireCapableBeanFactory`的构造方法时才发现了点东西，如下图所示：

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202211081509415.png"/>

- 可以看到，这个时候会通过`ignoreDependencyInterface`方法设置了一些类，而且设置这些类之前还会再次调用super父类构造方法，我们简单看下：

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202211081509416.png"/>

- 还好，AbstractAutowireCapableBeanFactory的父类AbstractBeanFactory的无参构造方法中，其实什么事也没干。

> 所以，现在最让人困惑的地方就在于，`ignoreDependencyInterface`方法是干什么的呢？为什么在初始化XmlBeanFactory的时候就要调用它呢？

---

## Spring中的感知接口又是什么呢？

现在，我们继续看下`ignoreDependencyInterface`方法，如下图所示：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202211081509417.png"/>

可以看到，在`AbstractAutowireCapableBeanFactory`的构造方法中，连续调用了三次的`ignoreDependencyInterface`方法，分别设置了`BeanNameAware.class`、`BeanFactoryAware.class`和`BeanClassLoaderAware.class`这三个类。

我们到`ignoreDependencyInterface`方法中看下，如下图所示：

![image-20220304164234029](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202211081509418.png)

很简单，就是将这三个类都放到了`ignoredDependencyInterfaces`中，而`ignoredDependencyInterfaces`其实就是一个`Set`集合：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202211081509419.png"/>

现在让人疑惑的点还挺多的，首先`BeanNameAware.class`、`BeanFactoryAware.class`和`BeanClassLoaderAware.class`这三个类分别是什么呢？`ignoredDependencyInterfaces`方法的作用又是什么呢？

简单看了下发现，`BeanNameAware.class`、`BeanFactoryAware.class`和`BeanClassLoaderAware.class`这个三个类都是接口，并且都是继承接口`Aware`，如下图所示：

![image-20220304170245412](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202211081509420.png)

我们可以看到，这个三个接口类中都有自己的方法。

这三个接口中的方法名称，和相应类的名称极度的相似，其实，**Aware接口也称为感知接口**，**当bean实现了这些感知接口时，Spring在实例化这些bean的时候，就会调用感知接口中的方法注入相应的数据。**

我们可以用之前的Student类来演示一下：

```java
public class Student implements BeanNameAware {

    private String name = "ruyuan";

    public void setName(String name) {
        this.name = name;
    }

    public String getName() {
        return name;
    }

    @Override
    public void setBeanName(String name) {
        System.out.println("beanName：" + name);
    }
    
}
```

可以看到，Student类实现了BeanNameAware接口，这样的话，当Student类在初始化时，Spring就会调用setBeanName方法，注入当前bean的名称了。

`applicationContext.xml`配置文件和相应的测试类，和之前一样：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
       http://www.springframework.org/schema/beans/spring-beans.xsd">

    <bean id="student" class="com.gyz.container.entity.Student" />

</beans>
```

```java
@SuppressWarnings("all")
public class BeanFactoryDemo {

    public static void main(String[] args) {

        XmlBeanFactory xmlBeanFactory = new XmlBeanFactory(new ClassPathResource("applicationContext.xml"));
        Student student = (Student) xmlBeanFactory.getBean("student");
        System.out.println(student.getName());
    }
}
```

然后，我们运行一下看下结果：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202211081509421.png"/>

可以看到，`BeanNameAware`接口的方法`setBeanName`被调用，并且name的值，就是xml中的bean标签里配置的id属性值student。

可能有些同学会有些疑惑，Student类为什么实现了BeanNameAware接口就可以得到beanName呢？setBeanName方法又是在什么时候调用的呢？

其实，大家暂时可以不用太纠结，后面我们讲到`bean的实例化`时，就可以看到Spring内部会调用这些感知接口的方法，为实现感知接口的bean注入相应的数据了。

---

## ignoreDependencyInterface方法是干什么的呢？

了解完这三个感知接口之后，我们再来看下`ignoreDependencyInterface`方法到底有什么作用，如下图所示：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202211081509422.png" />

通过方法上的注释，我们大概可以知道**`ignoreDependencyInterface`**方法的功能，就是**在自动装配时忽略指定接口的依赖**，简单看注释确实还看不出什么，我们直接来看下`ignoredDependencyInterfaces`集合在代码中的作用吧。

简单找了下发现，`ignoredDependencyInterfaces`集合只在方法`isExcludedFromDependencyCheck`中被调用了，我们来看下：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202211081509423.png" />

根据`isExcludedFromDependencyCheck`方法的注释，初步的意思就是明确**一个bean中的属性是否要从依赖检查中排除掉**。

> 也就是说你有一个bean，bean中的某个属性是否能被注入对应的依赖，还得要看你这个属性对应的类是否实现了BeanNameAware、BeanFactoryAware、BeanClassLoaderAware这些接口。

但是，这也只是我们的初步猜测，我们还得要到`AutowireUtils`类中的`isSetterDefinedInInterface`方法中，进一步分析一下：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202211081509424.png" />

可以看到，在`isSetterDefinedInInterface`方法中，简单来说就是判断两点：

- 一是bean的属性对应的类，是否实现了BeanNameAware、BeanFactoryAware或BeanClassLoaderAware中的某个接口；
- 二是这个bean属性对应的setter方法，在这三个感知接口中是否也存在相同的方法。

**如果同时满足以上两点的话，方法`isSetterDefinedInInterface`就会返回true，Spring在自动装配也就是创建这个bean时，就不会给该属性注入值了**。

这个概念可能会有点晦涩，我们可以通过一个简单的案例来帮助我们理解一下，比如我们创建一个bean如`BeanNameAwareImpl`，并且实现接口`BeanNameAware`：

```java
public class BeanNameAwareImpl implements BeanNameAware {

    private String beanName;

    public String getBeanName() {
        return beanName;
    }

    @Override
    public void setBeanName(String beanName) {
        this.beanName = beanName;
    }

}
```

可以看到，之所以让String类型的字段名称为beanName，就是要模拟出beanName的setter方法为setBeanName，这样的话，就同时满足setBeanName方法既是beanName属性的setter方法，同时该方法在BeanNameAware感知接口中也存在。

所以的话，同时满足了这两个条件之后，再根据我们刚才的分析，也就是Spring不会为bean BeanNameAwareImpl中的beanName属性注入任何的值。

然后，我们在applicationContext.xml中，配置BeanNameAwareImpl这个bean：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
       http://www.springframework.org/schema/beans/spring-beans.xsd">

    <bean id="beanNameAwareImpl" class="com.gyz.container.service.impl.BeanNameAwareImpl">
        <property name="beanName" value="beanName"/>
    </bean>

</beans>
```

可以看到的是，我们特意为beanName字段，设置值 “beanName”，可以预料到的是，“beanName”这个值，也就不能自动装配到BeanNameAwareImpl中的beanName属性中了。

然后，我们通过BeanFactoryDemo，从容器中获取beanNameAwareImpl这个bean：

```java
@SuppressWarnings("all")
public class BeanFactoryDemo {

    public static void main(String[] args) {

        XmlBeanFactory xmlBeanFactory = new XmlBeanFactory(new ClassPathResource("applicationContext.xml"));
        BeanNameAwareImpl beanNameAware = (BeanNameAwareImpl) xmlBeanFactory.getBean("beanNameAwareImpl");
        System.out.println(beanNameAware.getBeanName());
//        Student student = (Student) xmlBeanFactory.getBean("student");
//        System.out.println(student.getName());
    }
}
```

运行一下，可以看到打印结果为：

![image-20220304174312587](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202211081509425.png)

果然，我们可以发现，就算在applicationContext.xml中为beanName属性设置了“beanName”，最终也不能注入到bean的属性beanName中，反而得到的结果是beanNameAwareImpl。

而这个结果，其实就是Spring内部调用了BeanNameAware接口的setBeanName方法，为BeanNameAwareImpl设置了beanName属性的值。

> 分析到这里也就真相大白了，也就是说如果一个bean实现了BeanNameAware、BeanFactoryAware或BeanClassLoaderAware接口的话，那这个bean中的属性如果想要通过Spring进行自动装配赋值的话，这个属性对应的setter方法，就不能和感知接口中的方法相同。
>
> 如果相同的话，Spring就不会为该属性自动装配赋值，而是让Spring内部调用这些感知接口的方法，来为这些属性设置值。

这也是这些感知接口存在的意义，毕竟，bean都实现了这些感知接口了，而感知接口恰好已经通过方法ignoreDependencyInterface添加到忽略感知接口的集合中了，这就相当于这些属性的赋值权利交给Spring内部来决定了。

Spring这样的设计其实也有一定的合理性，比如你实现了BeanNameAware接口，对应的beanName属性的值，当然就是当前这个bean在Spring容器中的名称啊。

此时，如果你从外部的xml或者注解中注入了一个其它的名称，Spring理所应当就会忽略掉这个外来值的自动装配了，**确保bean名称的唯一性**。

---

## 总结

第一，通过一路跟进XmlBeanFactory的构造方法，发现首先会通过方法ignoreDependencyInterface，设置一系列的感知接口，并且了解了一下感知接口的类继承体系。

第二，然后，我们了解了bean如果实现了这些感知接口，Spring就会在bean实例化时调用这些感知接口中的方法，为bean注入bean的名称BeanName、容器BeanFactory或者是bean的类加载器BeanClassLoader这些资源。

第三，接着我们通过对源码的分析了解到，原来**ignoreDependencyInterface方法的作用，是为了让那些实现了感知接口的bean属性只能由Spring容器赋值，而不是可以人为的从外部随意的注入进来**。
