---
title: 02_Spring源码的准备工作：Spring的简单使用和原理分析
category:
  - Spring源码
star: true
date: 2023-03-30
---

<!-- more -->

# Spring基础容器XmlBeanFactory的简单使用

为了方便大家理解，我们先从一个最简单的demo开始，作为Spring源码分析的入口，首先，我们在IDEA中创建一个简单的Maven工程，引入如下依赖：

```xml
 <dependencies>
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-context</artifactId>
            <version>5.2.6.RELEASE</version>
        </dependency>
    </dependencies>
```

因为我们暂时只研究Spring容器模块的源码，初步引入spring-context模块的依赖就足够了。

大家或多或少都听说过，Spring其实就是一个容器，容器中装的就是一个个的bean，bean其实不需要特别的复杂，毕竟Spring的初衷就是想要让bean成为一个简单的java对象，比如，我们可以创建一个Student类作为Spring的bean：

```java
public class Student {

    private String name = "ruyuan";

    public void setName(String name) {
        this.name = name;
    }

    public String getName() {
        return name;
    }

}

```

Student这个bean创建好之后，又该如何添加到Spring容器中呢？我们可以在resources目录下，创建一个xml文件applicationContext.xml，然后在applicationContext.xml中通过bean标签配置Student类：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
       http://www.springframework.org/schema/beans/spring-beans.xsd">

    <bean id="student" class="com.gyz.demo.entity.Student" />

</beans>
```

可以看到，通过bean标签中的class属性，我们配置了Student类的全限定名，而id属性的值就是告诉Spring容器这个bean名称是什么，方便后续从Spring容器中获取这个bean。

现在bean已经准备好了，并且已经配置到xml文件中了，这个时候我们就需要扫描xml文件，将xml文件中配置好的bean也就是Student类，给加载到Spring容器中：

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

可以看到，首先我们通过ClassPathResource封装了applicationContext.xml配置文件，然后将ClassPathResource作为XmlBeanFactory的构造方法的参数创建XmlBeanFactory，XmlBeanFactory可以理解为就是Spring的容器，是用来存放bean的地方。

接着，我们从XmlBeanFactory容器中，获取名称为 student的bean，运行一下就可以在控制台上打印出字符串“ruyuan ”，Spring容器XmlBeanFactory最基础的使用也就是这样了。

---

# XmlBeanFactory和ApplicationContext的对比

XmlBeanFactory大家可能会觉得比较陌生，毕竟我们在公司开发的过程中，一般都是以ApplicationContext作为Spring的容器，大家暂时可以将XmlBeanFactory理解为是一个基础的Spring容器，它功能比较简单，而ApplicationContext相比于XmlBeanFactory而言算是一个高级的容器了。

ApplicationContext在XmlBeanFactory的基础上，添加了非常多的扩展功能和特性，所以，为了方便我们分析Spring的核心源码，我们当然要先从更基础、更简单的容器XmlBeanFactory开始研究了，当我们了解了XmlBeanFactory的一些核心机制之后，后面过渡到ApplicationContext就比较简单了。

当我们把Spring基于xml配置的这一套机制搞清楚了之后，后面我们会再来单独分析Spring是如何基于注解扫描解析的，最后大家会发现，其实不管是基于xml配置的形式还是基于注解的形式，这些都只是表层的形式而已，核心逻辑都是通用的。

---

# XmlBeanFactory的工作原理分析

最后，我们可以简单来分析下前面demo的功能，我们看下这张图：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202211081508160.png"/>

首先，通过ClassPathResource将applicationContext.xml配置文件封装起来，我们可以知道的是，ClassPathResource肯定会从resources目录下解析配置文件，从配置文件中解析bean标签，并获取bean标签上的id属性和class属性的值。

通过class属性的值即类全限定名称，就可以通过反射创建bean，也就是创建了一个Student对象出来，然后再将Student对象放到Spring容器当中，Student对象在容器中的名称为属性id的值，Spring容器的初始化简单来说也就是干这些事。

然后，当我们调用getBean方法时就会从Spring容器中加载bean了，Spring会根据给定bean的名称到Spring容器中获取bean，比如，demo中就是通过student这个名称，从Spring容器中获取Student对象。

简单来说，Spring的核心功能就是这么回事，但是，不管是配置文件的解析，还是从Spring容器中获取bean，这每一个步骤都涉及到非常复杂的流程。

所以，接下来我们会以这个demo作为分析Spring源码的入口，带大家一起看下Spring源码为何如此强大以及受欢迎的，大家准备好了吗，接下来，我们即将要开始一场深度的Spring冒险之旅了。

---

# 总结

- 第一，我们简单带大家写了一个demo，体验了一下Spring基础容器XmlBeanFactory的使用

- 第二，然后我们对比了XmlBeanFactory和ApplicationContext，初步了解到XmlBeanFactory是Spring中比较基础的容器，而ApplicationContext在XmlBeanFactory的基础之上又扩展了非常多的功能，算是一个高级容器了

- 第三，最后基于demo中的代码分析了一下XmlBeanFactory的工作原理，包括加载xml文件、解析xml中的bean标签生成相应的bean，并将bean注入到Spring容器中，最后通过getBean方法从容器中获取bean来使用

