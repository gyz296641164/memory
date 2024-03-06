---
title: Spring源码面试题
category:
  - Spring
date: 2024-02-28
---

<!-- more -->

## 1. 谈谈你对Spring框架的理解?

Spring 是一个开源的应用程序框架，它起源于 Rod Johnson 在其著名的 Spring Framework 专著中提出的一个轻量级框架的观念。下面是 Spring 的发展历史：

1. 2002 年，Rod Johnson 发表了他的专著 “Expert One-On-One J2EE Design and Development”，提出了 Spring 框架的思想。
2. 2003 年，Johnson 和一些开发者创建了 Spring Framework 项目，并在 SourceForge 上发布了第一个版本。
3. 2004 年，Spring Framework 1.0 版本发布，包括核心容器、AOP 模块、DAO 模块、JDBC 模块和 Web 模块等组成部分。
4. 2006 年，Spring Framework 2.0 版本发布，增加了对注解的支持、Web Services 支持、异步执行能力等新特性。
5. 2009 年，Spring Framework 3.0 版本发布，引入了对 Java 5、Java 6 特性的支持，包括泛型、注解、并发等。
6. 2013 年，Spring Framework 4.0 版本发布，提供对 Java 8 的支持，包括 lambda 表达式、Stream API 等。
7. 2015 年，Spring Framework 4.2 版本发布，增加了对 WebSocket 和 STOMP 协议的支持。
8. 2017 年，Spring Framework 5.0 版本发布，对响应式编程提供了支持，并对代码库进行了大规模升级和剪裁，去掉了过时和不必要的模块和类。

自从 2003 年发布以来，Spring Framework 在 Java 开发社区中变得越来越流行，并成为了多个企业级应用开发的首选框架之一。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Interview/202402/4c2906e38ca9d608.png)

---

## 2. Spring Framework的IoC容器实现原理是什么？

1. 控制翻转
2. Spring中IoC的实现：管理Bean对象的容器 ==》 容器是如何管理Bean对象 ==》 容器创建添加Bean对象 ==》Bean的定义。Bean定义的管理。Bean的生命周期

&emsp;&emsp;Bean的定义==》 BeanDefinition  ==》 BeanFactory【存储了所有的BeanDefinition】==》BeanDefinitionRegistry ==》 Bean实例有两种类型 单例，原型  单例==》容器初始化的时候==》完成对应的实例。单例Bean保存在一级缓存中。  原型Bean  在我们获取Bean的时候getBean()会完成对象的实例化

&emsp;&emsp;Spring的IoC（Inversion of Control，控制反转）是一种设计模式，它的核心思想是将对象的创建、组装和管理过程交给框架来完成，而不是由应用程序直接控制。这种模式通过将应用程序的控制权交给框架来提高应用程序的可扩展性、灵活性和可维护性。

&emsp;&emsp;在Spring中，IoC容器负责管理和组装应用程序中的组件。IoC容器可以通过XML配置文件、Java注解和Java代码来配置和组装对象。Spring IoC容器的实现类包括BeanFactory和ApplicationContext，其中ApplicationContext是BeanFactory的子接口，提供了更多的功能和便利的特性。

&emsp;&emsp;在源码层面，Spring IoC的核心组件是BeanFactory和BeanDefinition。BeanFactory是IoC容器的接口，它提供了管理和获取bean的方法。BeanDefinition是描述bean的元数据对象，包括bean的类型、作用域、依赖项和初始化参数等信息。BeanFactory通过BeanDefinition来创建、组装和管理bean。

&emsp;&emsp;在Spring中，BeanFactory和ApplicationContext之间的区别在于ApplicationContext在BeanFactory的基础上提供了更多的特性，例如国际化、事件机制、AOP和自动装配等功能。此外，ApplicationContext还可以管理生命周期和资源，提供了更方便的方法来管理Spring应用程序。

&emsp;&emsp;在源码中，Spring IoC通过使用反射、动态代理和BeanPostProcessor等技术来实现依赖注入和组件的创建和管理。在创建bean时，IoC容器会解析BeanDefinition，然后通过反射创建bean实例，设置bean的属性并执行初始化方法。对于需要注入其他bean的属性，容器会自动查找相应的bean实例并进行注入。在完成bean的创建和依赖注入后，容器将bean放入自己的容器中进行管理，同时可以根据需要进行销毁或重置。

---

## 3. Spring Framework的Bean生命周期是怎样的？

Spring的Bean的生命周期

Servlet的生命周期

Filter的生命周期

Vue 生命周期

....

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Interview/202402/9f32e3217760d927.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Interview/202402/5b5eb174a8950aa9.png)

### 简化版本

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202403/202403061928549.png)

**检查Aware(感知接口)：**

- Aware接口也称为感知接口，当bean实现了这些感知接口时，Spring在实例化这些bean的时候，就会调用感知接口中的方法注入相应的数据。
- 如果同时满足以下两点的话：
  - 一是bean的属性对应的类，是否实现了BeanNameAware、BeanFactoryAware或BeanClassLoaderAware中的某个接口；
  - 二是这个bean属性对应的setter方法，在这三个感知接口中是否也存在相同的方法。
- 方法`isSetterDefinedInInterface`就会返回true，Spring在自动装配也就是创建这个bean时，就不会给该属性注入值了。[案例参考](https://www.yznotes.cn/zh/notes/Spring/01-spring-source-code-deeply/04-Spring%E5%88%9D%E7%BA%A7%E5%AE%B9%E5%99%A8%E5%88%9D%E5%A7%8B%E5%8C%96%EF%BC%9A%E5%BF%BD%E7%95%A5%E6%8C%87%E5%AE%9A%E6%8E%A5%E5%8F%A3%E8%87%AA%E5%8A%A8%E8%A3%85%E9%85%8D%E5%8A%9F%E8%83%BD.html#spring%E4%B8%AD%E7%9A%84%E6%84%9F%E7%9F%A5%E6%8E%A5%E5%8F%A3%E5%8F%88%E6%98%AF%E4%BB%80%E4%B9%88%E5%91%A2)



---

## 4. Spring Framework AOP的实现原理是什么？

AOP：面向切面编程，  ==补充==》OOP：面向对象编程

1、你们公司中对AOP的应用

2、在Spring中AOP的使用方式

3、AOP中的核心概念

4、SpringAOP的实现

核心概念讲解：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Interview/202402/d359776450579d48.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Interview/202402/0b5a34ea666d8fad.png)

---

## 5. Spring Framework事务管理的实现原理是什么？

1、事务特性--》 事务的传播属性和事务的隔离级别  serviceA  事务管理a(){serviceB.b()}   serviceB   b();

serviceA  a(){proxy.b();}  b()

2、Spring中的事务的设计

3、基于AOP的事务实现

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Interview/202402/c90b369d38d21d36.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Interview/202402/461dad4a4530f2b9.png)

---

## 6. Spring Framework的事件机制是怎样的？

1、设计模式：发布订阅模式【观察者模式】

2、事件涉及到的核心概念：

- Spring中的事件机制是基于观察者设计模式的实现。它包含三个核心组件：事件、事件监听器和事件发布器。

- 在Spring中，事件是一个普通的Java对象，通过继承 `ApplicationEvent`类来实现，它可以包含任意的数据。事件监听器是一个接口，只有一个方法 `onApplicationEvent()`，用来处理事件。事件发布器是 `ApplicationEventPublisher`接口的实现类，用来发布事件。

- 当一个事件发布器发布一个事件时，它会通知所有注册了对应事件类型的监听器。监听器会按照注册的顺序一次处理事件。如果事件处理抛出了异常，发布器会捕获并打印异常信息。

- Spring事件机制的优点在于它可以实现模块之间的解耦合，一个模块只需要发布事件，而不需要知道哪些其他模块会对此事件进行处理。同时，使用Spring事件机制也可以实现事务的控制，例如在事件处理方法上添加 `@Transactional`注解，就可以保证整个事件在一个事务中执行。

---

## 7. Spring Framework中常用的设计模式有哪些？

Spring框架是一个基于多种设计模式的框架，以下是Spring中常用的几种设计模式：

1. 依赖注入（Dependency Injection）：也称为控制反转（Inversion of Control），通过控制反转，将对象的创建和依赖关系的管理交给Spring容器来处理，实现松散耦合和易于测试的目标。
2. AOP（Aspect-Oriented Programming）：面向切面编程，通过将横切关注点（如事务、安全、日志等）抽取出来，与业务代码分离，实现模块化开发、代码复用，提高系统的可维护性和可扩展性。
3. 工厂模式（Factory Pattern）：通过抽象工厂接口来统一管理对象的创建，增加新的实现类时不需要修改已有代码，只需要添加新的实现类，符合开闭原则。
4. 单例模式（Singleton Pattern）：通过单例模式确保一个类只有一个对象，提高系统性能和资源使用效率。
5. 模板方法模式（Template Method Pattern）：将一个操作中的算法框架固定，将具体实现延迟到子类中，实现了代码复用和扩展的目标。
6. 观察者模式（Observer Pattern）：定义一种一对多的关系，当一个对象的状态发生改变时，通知其他对象更新自己的状态，常用于事件处理等场景中。

通过以上常用的设计模式，Spring框架实现了松散耦合、面向切面、工厂化、可扩展、易于测试等优秀的特性，提高了系统的可维护性和可扩展性。

---

## 8. Spring Framework中常用的注解有哪些？

Spring框架中常用的注解有：

1. @Autowired：自动装配，将需要的依赖注入到类中。通过使用不同的方式注入（如构造器注入、Setter注入、字段注入等）来指定要注入的实例对象。
2. @Component：声明一个组件，将会由Spring框架进行扫描，并将其实例化作为一个Bean纳入Spring容器管理。
3. @Controller：声明一个MVC控制器，标记该类为Spring的控制器，处理Web请求。
4. @Service：声明一个服务类，标记该类为Spring的服务类，用于处理业务逻辑。
5. @Repository：声明一个数据访问类，标记该类为Spring的数据访问类，用于进行数据库操作。
6. @Configuration：声明一个Java配置类，其内部包含了若干个@Bean注解用于声明Bean对象。
7. @Bean：声明一个Bean，用于在Java配置类中定义需要注入IOC容器中的Bean实例对象。
8. @RequestMapping：用于将HTTP请求映射到对应的控制器中的处理方法上。
9. @Value：用于将配置文件中的属性值注入到Spring Bean中的字段属性中。

以上是Spring框架中常用的注解，可以帮助开发者快速实现依赖注入、Bean管理、Spring MVC等功能。

---

## 9. Spring Framework中如何处理循环依赖问题？

1、什么是循环依赖？ A--》 B    B--》 A

构造注入：是解决不了循环依赖的

设值注入：是可以解决循环依赖的--》 提前暴露

2、Spring中的循环依赖是怎么处理？

三级缓存

3、为什么要三级缓存？  

如果没有代理对象。二级缓存是足够的

二级缓存提前暴露的是 Bean的真实对象。但是后面我们返回的其实是代理对象

4、为什么Spring没有使用二级缓存来解决。

5、Spring中一级缓存能处理循环依赖吗？

Spring中一级缓存存储的是单例bean

6、Spring支持对原型对象的循环依赖的支持吗？

原型对象==》有很多个。那么我就需要缓存 原型对象。

Spring容器支持处理循环依赖，即A对象依赖了B对象，而B对象又依赖了A对象的情况。

当Spring容器在创建一个Bean实例时，会记录该Bean实例的创建过程，当发生了循环依赖时，Spring会将该Bean实例的先前创建请求暂存到一个“早期引用”中，这时Spring容器并未将完全构造的Bean实例提供给请求它的对象，而是返回一个代理对象，等到该Bean实例构造完成后，将“早期引用”中的Bean实例注入到对应的属性中。

要注意的是，Spring只能处理单例模式下的循环依赖，因为每个单例Bean在Spring容器只会被创建一次，而在原型模式下，每次请求新的Bean实例时，Spring容器都会进行一次完整的Bean实例化过程，这样循环依赖就不存在了。

当存在循环依赖时，Spring容器会抛出BeanCurrentlyInCreationException异常，表明当前Bean正在创建中，此时可以通过调整Bean的依赖关系，或使用构造器注入等方式解决循环依赖问题。
