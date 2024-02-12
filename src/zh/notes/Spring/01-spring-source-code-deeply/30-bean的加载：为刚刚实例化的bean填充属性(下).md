---
title: 30_bean的加载：为刚刚实例化的bean填充属性(下)
category:
  - Spring源码
star: true
date: 2023-03-31
---

<!-- more -->

<h1 align="center">30_bean的加载：为刚刚实例化的bean填充属性（下）</h1>

## 开篇

上一节，我们初步分析到了为刚实例化好的bean实例，进行属性的填充，现在，我们继续来分析下这块内容，这一节主要包括以下几个部分：

1. 先来了解下Spring中有哪些自动装配的模式

2. 然后通过案例来体验下这些装配模式到底是如何使用的

3. 接下来结合源码，看下Spring是如何处理按名称及类型来装配属性的

4. 最后来看下Spring是如何将解析到的属性信息，填充到bean实例中的

---

## Spring中有哪些装配模式

我们再看到上节课分析的位置：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202212261753939.png)

首先会调用mbd也就是BeanDefinition中的getResolvedAutowireMode方法，获取bean的自动装配模式，那什么是自动装配模式呢？我们到方法getResolvedAutowireMode看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202212261753314.png)

其中，成员变量this.autowireMode表示当前BeanDefinition的自动装配模式，在getResolvedAutowireMode方法中，如果设置了属性autowireMode的值为AUTOWIRE_AUTODETECT，就表示由Spring自动探测当前bean到底该使用哪种装配置模式。

探测的方法也很简单，可以看到Spring会获取Class中的所有构造方法constructors，并且判断是否存在参数个数为0的构造方法，也就是无参构造方法是否存在，如果存在，Spring就会决定使用AUTOWIRE_BY_TYPE的模式去自动装配bean属性的值，否则，Spring就会使用AUTOWIRE_CONSTRUCTOR的模式去自动装配属性的值。

默认情况下，成员变量this.autowireMode的值为AUTOWIRE_NO，表示Spring在xml文件中默认是关闭自动装配功能的。

------

了解完方法getResolvedAutowireMode的基本情况后，我们再来看下Spring中总共有哪些装配模式：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202212261753201.png)

在AbstractBeanDefinition中定义了五种装配模式，可以看到，Spring已经不推荐使用自动探测装配模式AUTOWIRE_AUTODETECT了。

而且AUTOWIRE_AUTODETECT的作用刚才我们已经看到了，如果配置了该模式，就会让Spring来决定到底是根据类型来装配，还是根据构造方法的模式来装配。

---

## 体验下通过xml实现自动装配

接下来，我们通过一些案例，快速体验下这四种装配模式分别有什么样的作用：

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

我们先创建一个简单的java类Student，Student类中只有一个String类型的字段name，接下来，再创建一个依赖Student的类TestA：

```java
public class TestA {

	private Student student;

	public Student getStudent() {
		return student;
	}

	public void setStudent(Student student) {
		this.student = student;
	}

	@Override
	public String toString() {
		return "TestA{" +
				"student=" + student +
				'}';
	}

}
```

我们简单点，TestA也只有一个字段student，类型为Student。

------

接下来，我们的重点就是来关注下TestA中的属性student，到底如何结合Spring的四种自动装配模式来注入相应值的，和之前一样，我们再创建一个xml文件applicationContext.xml：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
	   xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="
			http://www.springframework.org/schema/beans
			http://www.springframework.org/schema/beans/spring-beans.xsd">

	<bean id="student" class="com.ruyuan.container.autowired.Student"/>
	<bean id="testA" class="com.ruyuan.container.autowired.TestA" autowire="byName"/>
</beans>
```

分别将Student和TestA配置到了xml中，其中，在id为“testA”的bean标签中添加了属性autowire，值为“byName”，对应自动装配模式中的AUTOWIRE_BY_NAME，也就是根据属性名称来自动装配属性。

在实例化testA对应的bean时，Spring默认会根据testA中的属性名称，去xml中匹配名称相同的bean，然后给属性注入相应的值，这里的名称我们既可以用属性id也可以用属性name来设置。

大家应该也发现了，TestA中的属性名称为student，刚好和xml中id为“student”的bean，在名称上能匹配的上，所以Spring在实例化testA时会实例化id为“student”的bean，然后将实例化好的bean为testA进行属性赋值，也就是根据属性的名称自动寻找并装配属性的值。

------

接下来，我们通过代码来验证一下：

```java
public class ApplicationContextDemo {
    
    public static void main(String[] args) throws Exception {
        ApplicationContext ctx = 
            new ClassPathXmlApplicationContext("applicationContext.xml");
        TestA testA = (TestA) ctx.getBean("testA");
        System.out.println(testA);
    }
    
}
```

运行一下看下效果：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202212261755902.png)

果然，TestA中属性student自动装配成功了。

------

那如果根据自动装配模式AUTOWIRE_BY_TYPE，也就是根据类型来自动装配会怎样呢？我们调整下xml配置来看下：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="
                           http://www.springframework.org/schema/beans
                           http://www.springframework.org/schema/beans/spring-beans.xsd">
  
  <bean class="com.ruyuan.container.autowired.Student"/>
  <bean id="testA" class="com.ruyuan.container.autowired.TestA" autowire="byType"/>
</beans>
```

我们只需要调整下xml的配置，将autowire的值改为“byType”，对应自动装配模式AUTOWIRE_BY_TYPE，也就是根据属性的类型来装配，同时，我们也将第一个bean标签中的id属性去除掉了，避免可能因为名称而受到干扰。

现在的话，当Spring实例化testA时，如果发现autowired属性的值为“byType”，Spring就会根据属性的类型Student到xml中匹配所有bean，如果匹配到了其他bean中存在Student的类型，同样会将该bean实例化好并拿来为属性student赋值。

------

了解完过程之后，我们将刚才的代码运行一下，结果依然和刚才一样：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202212261755530.png)

另外需要提一点的就是，不论是根据名称进行自动装配，还是根据类型进行自动装配，底层都是bean中存在属性的setter方法，在TestA中也就是需要setStudent方法来完成该属性值的自动装配，大家可以尝试下将TestA中的setStudent方法删除掉，看下属性值是否都能装配成功。

------

而第三种装配方式，也就是通过通过构造方法来自动装配，我们也来看下：

```java
public class TestA {
    
    private Student student;
    
    public TestA(Student student) {
        this.student = student;
    }
    
    @Override
    public String toString() {
        return "TestA{" +
            "student=" + student +
            '}';
    }
    
}
```

可以看到，在TestA中我们将属性student的getter和setter方法都删除了，然后添加了一个含参的构造方法，参数类型为Student，接下来，我们再调整下xml的配置：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="
                           http://www.springframework.org/schema/beans
                           http://www.springframework.org/schema/beans/spring-beans.xsd">
  
  <bean id="student" class="com.ruyuan.container.autowired.Student"/>
  <bean id="testA" class="com.ruyuan.container.autowired.TestA" autowire="constructor"/>
</beans>
```

很简单，只是将autowire属性的值设置为了“constructor”，表示现在是通过构造方法来自动装配属性，对应自动装配模式AUTOWIRE_CONSTRUCTOR。

装配的思路也是类似的，就是在实例化testA对应的bean时，看下xml配置的bean中有没有哪些bean的类型和构造方法参数的类型能匹配上，如果匹配到的话，Spring就会自动实例化该bean并设置到构造方法中，运行下测试的代码，效果也是一样的。

并且我们也发现，通过构造方法进行自动装配，是不需要bean实例中的setter方法的，而且构造方法默认也是通过类型来识别和装配的，但是，如果装配模式为AUTOWIRE_NO，Spring就不会为bean的实例化进行任何的自动装配了，同时，这也是属性autowire的默认值，

------

而且相信大家也感觉到了，案例中我们演示的根据名称、类型和构造方法来自动装配bean，效果就像是在属性上添加了@Autowire注解一样，确实，Spring现在更推荐我们使用注解，来实现属性自动装配的功能，所以，属性autowire的默认值才为AUTOWIRE_NO。

毕竟，如果你一定要通过xml文件配置的方式来实现属性自动装配，弊端也是很明显的，当xml中配置的bean数量非常多时，自动装配的关系就会变得非常复杂且不易于管理，而且，你需要非常熟悉配置在xml中的每个bean，在粒度的把控上就没有注解那么细，所以，现在我们日常工作中，使用注解进行属性自动装配会更常见些。

---

## 通过属性名称进行自动装配

了解完Spring中几种自动装配模式之后，我们继续回到前面源码的位置：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301111359403.png)

如图，我们到方法autowireByName，看下Spring是如何处理根据名称来自动装配的：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301111400682.png)

可以看到，方法中的逻辑和我们刚才的分析是差不多的，首先获取bean中所有符合条件的引用类型属性名称propertyNames，然后依次遍历处理这些属性。

在遍历处理的过程当中，如果发现在Spring容器中，根据属性的名称找到了bean的信息，此时就会率先调用getBean方法来加载bean，方便后面为该属性赋值，并且将属性名称propertyName和对应的实例bean绑定在MutablePropertyValues中。

虽然我们不是特别清楚MutablePropertyValues是什么，但是它一定是和属性值相关的一个重要组件，最后，我们可以看到，会调用之前分析过的方法registerDependentBean，注册属性propertyName和当前实例beanName之前的依赖关系。

------

其中，方法unsatisfiedNonSimpleProperties我们还是有必要看下的：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301111400759.png)

首先会遍历bean中的所有属性信息pds，并决定最终会对哪些属性进行自动装配。

首先可以看到，在for循环中的if分支里会判断属性在bean中，是否存在写方法也就是属性的setter方法，这一点前面我们已经讨论过了，一个属性在bean中如果没有setter方法，不论是根据名称还是根据类型自动装配，都不能实现自动装配的功能。

------

接下来，会通过BeanUtils.isSimpleProperty(pd.getPropertyType())，判断属性的类型是否是引用类型，一般普通的基本数据类型是不会用来自动装配的。

比较关键的就是方法isExcludedFromDependencyCheck，判断当前属性是否要忽略装配，我们可以进去看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301111400784.png)

看到这里，我们总算是将之前忽略感知接口的代码串起来了。

也就是在这里判断，如果发现集合ignoredDependencyInterfaces中添加一些感知接口中，如果存在和bean中属性相同的setter方法，且bean实现了集合中的接口，此时Spring会将该属性排除在自动装配的范畴之外，这快大家如果忘了，可以先去回顾下之前的内容。

------

## 通过属性类型进行自动装配

我们继续往后面看：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301111400438.png)

接下来，我们再来看下Spring是如何对属性的类型进行自动装配的，如图，我们到方法autowireByType中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301111400966.png)

其中，方法autowireByType中的逻辑，从整体结构上来看方法和autowireByName是类似的。

首先通过unsatisfiedNonSimpleProperties方法，获取bean中符合条件的引用类型的属性，然后依次对每个属性进行解析，而解析的目标从前面根据名称来获取bean实例，变成了根据bean的类型来解析获取bean实例。

其中，方法resolveDependency是解析的关键，解析完成之后依然和之前一样，将属性值和属性的名称绑定好，方便后续为bean实例赋值。

------

可能大家比较疑惑的是，为什么这里还需要集合autowiredBeanNames呢？因为现在不是通过属性名称来自动装配，所以，在匹配的过程中，很有可能会同时匹配到多个类型相同的bean，这是一方面。

另外，如果当前bean的属性类型不是Student，而是类似`List<Student>`或`Set<Student>`这样的集合类型，这样的话，如果我们根据类型匹配到多个bean，那当然需要将这些bean的信息，都存放到集合autowiredBeanNames中，方便后续和bean绑定依赖关系。

------

## 将属性信息填充到bean实例中

了解完根据名称和类型进行自动装配之后，我们再看下后续的逻辑：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301111400386.png)

可以看到，这里依然是在处理后处理器InstantiationAwareBeanPostProcessor，只不过这里是调用方法postProcessProperties，提供一些属性信息。

而前面我们也分析过了，InstantiationAwareBeanPostProcessor在这里调用方法postProcessProperties，主要还是用来获取注解上的一些属性信息，如@Autowired、@Resource等，这里我们暂时知道有这回事就可以了。

------

现在，bean实例所需要的所有属性值信息都获取到了，接下来再来看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301111400451.png)

可以看到，Spring最后会将前面解析到的所有属性信息，通过方法applyPropertyValues填充到bean实例中，因为当前bean实例还包裹在BeanWrapper中，所以暂时还是通过BeanWrapper来为bean实例设置属性值的。

而方法applyPropertyValues和前面解析标签property类似，细节特别的繁琐，这块我们不看也罢，知道会将属性设置到BeanWrapper中就可以了。

------

## 总结

好了，今天的知识点我们就讲到这里了，我们来总结一下吧。

通过一张图来梳理下当前的流程：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-12/202301111401200.png)

在上一节的基础之上，我们了解了一下Spring是如何为bean实例填充属性信息的，其中，Spring默认为我们提供了三种自动装配的模式，分别是通过名称、类型以及构造方法来自动装配属性。

而且我们也通过案例来体验了一下这些自动装配模式，分别都有什么样的效果，了解完自动装配模式之后，我们又结合了源码，分析了一下Spring是如何处理这几种装配模式的，需要注意的是Spring在xml文件下默认是关闭自动装配的。

最后，Spring会将我们解析获取到的属性信息，全都装配到bean的实例当中，整体的流程大概就是这样的。