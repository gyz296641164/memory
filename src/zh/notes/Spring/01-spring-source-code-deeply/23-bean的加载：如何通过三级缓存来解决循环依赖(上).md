---
title: 23_bean的加载:如何通过三级缓存来解决循环依赖(上)
category:
  - Spring源码
star: true
date: 2023-03-31
---

<!-- more -->

## 开篇

上一节，我们初步找到了Spring加载bean的入口方法，并且也看到Spring对bean名称做了一些特殊的转换，目的很简单，就是获取到bean的实际名称。

我们接着上节课的分析，继续来看下Spring是如何加载bean的，这一节主要分为以下几个部分：

1. 首先我们来了解下Spring中单例bean的实例化时机

2. 然后我们初步来看下Spring专门为单例bean设计的多级缓存

3. 最后我们来认识下Spring中常见的几种循环依赖问题是怎样发生的

---

## bean的实例化时机

我们接着上节课分析的位置，继续来看下（注：因为方法`doGetBean`篇幅过长，该方法的截图在后续章节中会随着源码的分析，分段截图演示）：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11/20221124200225.png)

可以看到，接下来会调用方法getSingleton，根据方法getSingleton的名称我们可以知道，接下来应该是要获取beanName对应的单例bean了，我们到方法里面看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11/20221124200227.png)

可以看到，在方法getSingleton中又调用了它的重载方法getSingleton，并且在原来的参数基础上，又添加了一个新的参数`allowEarlyReference`，默认值为true。

------



那参数`allowEarlyReference`有什么特别的作用吗？我们接着到方法里面看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11/20221124200229.png)

可以看到，方法中的代码逻辑比较紧凑，而且我们简单观察下可以发现，方法中用到了很多的成员变量如singletonObjects、earlySingletonObjects和singletonFactories，敏感点的同学可能就意识到了，这不就是从各种缓存吗。

------

有些同学可能就意识到了，缓存中现在是没有bean的实例的，因为我们现在是第一次调用getBean方法来实例化bean，确实，大多数情况下的bean都是在用到时，才会触发bean的实例化，但是有没有特例呢？

我们前面在分析ApplicationContext初始化时，如果bean中的属性`lazyInit`的值设置为了false，就会提前调用`getBean`方法触发bean的实例化，也就是提前初始化这些非延迟加载的bean，而实例化好单例对象就会被缓存在缓存`singletonObjects`中。

除了这种情况，前面我们还看到Spring内部的一些组件，如消息源MessageSource、事件广播器ApplicationEventMulticaster等，在Spring容器ApplicationContext初始化时就会实例化好，其实它们最后也是会注册到缓存`singletonObjects`中的，因为这些组件是Spring功能实现的基础，必须在Spring容器初始化时就提实例化好。

---

## 初探Spring中的多级缓存

但是，我们现在分析的bean加载，主要就是实例化我们自己配置的普通bean，这些bean一般不会在Spring容器初始化时就实例化，一般我们也不会刻意的去配置lazyInit属性，导致bean提前被实例化。

理清楚这个大前提后，接下来，我们继续看到方法getSingleton：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11/20221124200232.png)

当我们初次运行到这个方法时，从这些缓存中根本就找不到我们想要的bean的实例，所以，正确点的做法应该就是往后面找下bean实例化的逻辑，但是来都来了，我们就先来了解下这些缓存的作用吧。

------



首先，我们可以看到在方法getSingleton中，总共也就用到了**三个缓存**，分别是**singletonObjects**、**earlySingletonObjects**和**singletonFactories**，我们看下这些缓存是什么：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11/20221124200236.png)

可以看到，这三个缓存其实就是三个Map，分别用来缓存不同的数据，我们再回到方法getSingleton方法中：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11/20221124200238.png)

可以看到，首先会从singletonObjects中，根据bean的名称beanName来获取单例bean，singletonObjects这个缓存主要是用来存放已经完全实例化好的单例bean。

------

为什么强调singletonObjects是用来存放单例bean，并且是完全实例化好的单例bean呢？我们继续往后面看：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11/20221124200243.png)

可以看到，如果singletonObject为空，也就是singletonObjects中没有缓存名称为beaName的单例，并且方法isSingletonCurrentlyInCreation返回的是true，就会进入到if分支中。

------

那方法isSingletonCurrentlyInCreation是在判断什么呢？我们进去看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11/20221124200248.png)

可以看到，在方法isSingletonCurrentlyInCreation中，其实就是判断集合singletonsCurrentlyInCreation中是否存在beanName。

后面我们看到当bean开始实例化时，Spring就会把bean对应的名称放入到集合singletonsCurrentlyInCreation中，表示这个bean正在实例化，防止bean重复进行实例化，起到一个去重的效果。

同时，当bean实例化完成后就会从集合singletonsCurrentlyInCreation中将bean的名称移除掉，这块逻辑后面我们也会看到的。

---

我们再回到getSingleton方法中继续来看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11/20221124200253.png)

根据我们刚才的分析，如果在缓存singletonObjects中找不到beanName对应的单例bean，同时发现beanName对应的单例正在实例化，接下来就会尝试从缓存earlySingletonObjects中获取单例。

那缓存earlySingletonObjects又是什么呢？其实缓存earlySingletonObjects简单来说，就是用来存放早期单例的，早期单例就是bean的实例对象还没有全部实例化完成，仅仅只是通过反射创建了一个普通的bean对象出来，bean中的很多属性都还没来得及赋值。

为了满足其他地方的需要，就匆匆放到缓存earlySingletonObjects中了，这块逻辑后面我们也会看到的，所以刚才判断单例缓存中没有现成的单例bean，但是发现了bean正在实例化时，我们就在试想能不能从缓存earlySingletonObjects中，提前获取实例化到一半的bean呢？

---

那为什么一个bean都还没有完全实例化完成，就要匆匆放到缓存earlySingletonObjects中，暴露给外界使用呢？这还得说到Spring实例化bean过程中可能会出现的一个问题，也就是**循环依赖**。

---

## 认识下setter注入循环依赖

我们先通过一个简单的案例，来了解下什么是循环依赖：

```java
public class Student1 {

	private Student2 student2;

	public Student2 getStudent2() {
		return student2;
	}

	public void setStudent2(Student2 student2) {
		this.student2 = student2;
	}

	@Override
	public String toString() {
		return "Student1{" +
				"student2=" + student2 +
				'}';
	}

}
```

```java
public class Student2 {

	private Student1 student1;

	public Student1 getStudent1() {
		return student1;
	}

	public void setStudent1(Student1 student1) {
		this.student1 = student1;
	}

	@Override
	public String toString() {
		return "Student2{" +
				"student1=" + student1 +
				'}';
	}

}
```

可以看到，首先我们先创建了两个类Student1和Student2，然后在这个两个类中分别都创建了一个成员变量，Student1的成员变量student2依赖Student2，而Student2中的成员变量student1依赖Student1。

接下来，我们再将这两个类配置到Spring配置文件applicationContext.xml中：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
	   xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="
			http://www.springframework.org/schema/beans 
            http://www.springframework.org/schema/beans/spring-beans.xsd">

	<bean id="student1" class="com.ruyuan.container.cycle.setter.Student1">
		<property name="student2" ref="student2"/>
	</bean>

	<bean id="student2" class="com.ruyuan.container.cycle.setter.Student2">
		<property name="student1" ref="student1"/>
	</bean>

</beans>
```

可以看到，Student1和Student2以及相应的成员变量，都相应地配置好了，因为Student1中的属性student2是依赖Student2的，而Student2中的属性student1是依赖Student1的，所以，当Student1实例化时，为了给属性student2赋值就得要实例化Student2。

而Student2在实例化时，同时也要为属性student1实例化Student1，这样的话就会陷入一个无限循环了，而这就是Spring中的循环依赖问题。

------

接下来，我们通过一段代码来测试下：

```java
public class ApplicationContextDemo {

	public static void main(String[] args) throws Exception {
			ApplicationContext ctx = 
        				new ClassPathXmlApplicationContext("applicationContext.xml");
			Student1 student1 = (Student1) ctx.getBean("student1");
			System.out.println(student1);
	}

}
```

代码很简单，就是看下从Spring容器中能否正常获取student1的实例bean，我们运行下看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11/20221124200259.png)

果然，因为循环依赖的问题，会导致student1在实例化时就陷入了一个死循环中了，最终耗尽栈内存的空间而抛出栈内存溢出的异常。

---

## 认识下构造方法循环依赖

当然，以上的循环依赖问题是在bean实例化为属性赋值时发生的，也被称为是setter循环依赖，而Spring中还可能通过构造器发生循环依赖，我们也通过一个案例来看下：

```java
public class Student1 {

	private Student2 student2;

	public Student1(Student2 student2) {
		this.student2 = student2;
	}

	public Student2 getStudent2() {
		return student2;
	}

	public void setStudent2(Student2 student2) {
		this.student2 = student2;
	}

	@Override
	public String toString() {
		return "Student1{" +
				"student2=" + student2 +
				'}';
	}

}
public class Student2 {

	private Student1 student1;

	public Student2(Student1 student1) {
		this.student1 = student1;
	}

	public Student1 getStudent1() {
		return student1;
	}

	public void setStudent1(Student1 student1) {
		this.student1 = student1;
	}

	@Override
	public String toString() {
		return "Student2{" +
				"student1=" + student1 +
				'}';
	}

}
```

可以看到，我们依然创建了两个类，这两个类中的成员变量和刚才都是一样的，唯一的区别是，我们还添加了构造方法用于注入属性的值。

---

接下来，我们在applicationContext.xml中配置下这两个类：

```java
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
	   xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="
			http://www.springframework.org/schema/beans 
			http://www.springframework.org/schema/beans/spring-beans.xsd">

	<bean id="student1" class="com.ruyuan.container.cycle.constructor.Student1">
		<constructor-arg name="student2" ref="student2"/>
	</bean>

	<bean id="student2" class="com.ruyuan.container.cycle.constructor.Student2">
		<constructor-arg name="student1" ref="student1"/>
	</bean>

</beans>
```

可以看到在配置文件中，唯一和刚才不同的是注入属性的方式，从property标签改成了constructor-arg标签，也就是通过构造方法的方式设置属性的值了。

理解了刚才setter注入循环依赖的问题，现在，我们可以很轻松的知道，通过构造方法的方式注入属性同样也会出现循环依赖的问题，我们同样来看下：

```java
public class ApplicationContextDemo {

	public static void main(String[] args) throws Exception {
		ApplicationContext ctx = new ClassPathXmlApplicationContext("applicationContext.xml");
		Student1 student1 = (Student1) ctx.getBean("student1");
		System.out.println(student1);
	}

}
```

运行下程序看下效果：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/2022-11/20221124200304.png)

没有任何的悬念，出现了循环依赖的报错。

除了我们刚才分析的setter注入循环依赖，以及构造方法循环依赖这两种单例循环依赖之外，prototype作用域的bean在实例化时，同样也会出现循环依赖的问题，当然，这块内容后面我们看到相应的源码时再来分析。

------

## 总结

第一，我们认识了Spring中单例的常见几种实例化时机，在Spring容器初始化时，容器内部的一些核心组件会提前实例化，并且如果我们设置了延迟初始化属性的bean，也会在这个阶段实例化，当然，最为常见的还是我们主动获取bean时才会实例化。

第二，我们简单了解了Spring中的多级缓存，其中Spring多级缓存设计的初衷和循环依赖有关，并且我们又通过两个案例了解了下在Spring中，常见的两种循环依赖是怎样的。

分别是为bean注入属性值时发生的setter注入循环依赖，以及为bean的构造方法填充属性时，发生的构造方法循环依赖，当这两种依赖发生时都会导致实例化bean失败。

------

下一节，我们来看下Spring是如何通过三级缓存来解决循环依赖的问题的。