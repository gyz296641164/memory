---
title: 03_Spring初级容器初始化：Resource到底是个什么玩意儿？
category:
  - Spring源码
star: true
date: 2023-03-30
---

<!-- more -->



## 开篇

我们先从配置文件`applicationContext.xml`的加载入手，开始Spring容器初始化的分析，这一节总体的思路如下：

1. 从ClassPathResource加载`applicationContext.xml`开始，了解下ClassPathResource是什么，ClassPathResource对应的类继承体系又是怎样的。

2. 在ClassPathResource类继承体系中，Resource接口和InputStreamSource接口中都有哪些东西呢？这样设计的好处是什么呢？

3. 最后，我们再来看下常见的一些Resource接口实现类，在底层一般是如何加载资源的呢？

---

## 初识ClassPathResource

我们先来看下上一节demo的代码：

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

可以看到，一开始Spring配置文件applicationContext.xml就被封装成了ClassPathResource，那ClassPathResource是什么呢？

要了解ClassPathResource是什么，我们先来看下它的类继承图（查看方法见附录）：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202211081508424.png"/>



- 可以看到，ClassPathResource其实就是一个实现了Resource接口的实现类而已
- 和`ClassPathResource`类似的还有`UrlResource`、`FileSystemResource`、`ByteArrayResource`和`InputStreamResource`，它们都实现了Resource接口，而Resource接口又实现了`InputStreamSource`接口。

Resource接口是什么的呢？InputStreamSource接口又是什么呢？各种Resource的实现类之间又有什么区别呢？接下来，我们一点点来看下。

---

## Resource和InputStreamSource

首先，我们先来回答第一个问题，也就是什么是Resource接口，Spring统一把所有使用到的资源都抽象成了Resource，不同来源的资源对应着不同的Resource实现类。

我们可以来看一下Resource接口中，都有哪些方法：

![image-20220304135625218](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202211081508425.png)

- 可以看到，在Resource接口中，首先它定义了对资源状态判断的方法，如`exists`方法判断资源是否存在、`isFile`方法判断资源是否是文件类型的、`isOpen`方法判断资源是否处于打开的状态、`isReadable`方法判断资源是否是可读状态的。

- 而且，Resource接口还分别提供了资源到File、URI以及URL的转换方法，如getFile方法可以将资源转换为File，getURI方法可以将资源转换为URI，getURL方法可以将资源转换为URL。
- Resource接口还提供了获取文件名称的`getFilename`方法、获取资源的描述信息的`getDescription`方法，`getDescription`方法一般它可以用于日志信息的打印。

我们再看下第二个问题，`InputStreamSource`接口是什么呢？我们来看下接口`InputStreamSource`：

![image-20220304140053718](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202211081508426.png)

- 可以看到，InputStreamSource接口中只有一个方法`getInputStream`，而且方法返回的就是一个输入流`InputStream`。

- 从前面的类继承图中我们也看到了，Resource是继承了InputStreamSource接口的，所以，这也就意味着所有资源只要封装成了Resource，就可以通过调用InputStreamSource中的getInpustream方法，获取资源对应的输入流InputStream了。
- 而资源的来源又是多种多样的，比如，我们在demo中的applicationContext.xml，则是存放在classpath路径下的xml文件，ClassPathResource就是用来加载classpath路径下的资源文件的。
- 而UrlResource、FileSystemResource、ByteArrayResource和InputStreamResource，它们分别是加载URL、文件、Byte数组和InputStream的Resource实现类。

---

## 各种Resource是如何加载资源的呢？

我们再来看下最后一个问题，各种Resource的实现类之间的区别是什么呢？我们再来回顾下Resource的类继承图：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202211081508427.png"/>

可以看到，不同的Resource接口实现类都实现了Resource接口，而Resource接口的那些方法我们刚才也看到了，其实就是一些方便我们对资源操作而已，这些Resource实现类的区别主要在于它们的资源来源，以及相应的加载方式。

我们可以很容易的想到，因为Resource接口继承了InputStreamSource接口，所以不管你是什么类型的资源，一旦封装成Resource类，都可以通过**调用InputStreamSource中的getInputStream方法，获取对应资源的输入流InputStream**，而我们一旦获取到了资源的输入流，再进行正常的开发就容易的多了。

> 所以，通过观察获取输入流的方式，我们或许可以知道不同的Resource实现类是如何加载资源的，我们先来看下ClassPathResource中的getInputStream方法

如下图所示：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202211081508428.png"/>

可以看到，**ClassPathResource中的getInputStream方法加载资源的方式比较简单，就是通过class或classLoader的底层方法来加载的**，没什么特别的地方。

> 再来看下FileSystemResource

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202211081508429.png"/>

更简单无非就是**通过JDK底层方法，根据文件的路径去加载资源的InputStream**。

> 而UrlResource、ByteArrayResource和InputStreamResource是如何获取相应的InputStream，想必我们应该都能猜到了，我们可以分别来看下

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202211081508430.png"/>

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202211081508431.png"/>

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202211081508432.png"/>

可以看到，UrlResource通过连接对应URL的去获取InputStream，ByteArrayResource通过Byte类型数组去获取对应的InputStream，而InputStreamResource本身就是包含InputStream的，直接返回它就可以了。

---

## 总结

通过本节的学习，我们了解了Resource的继承体系，并且知道了Resource就是Spring内部对各种资源的一个抽象,而InputStreamResource接口的实现，使得我们对各种来源的资源都可以轻松获取对应的输入流InputStream。

然后，我们也看了下各个Resource实现类获取InputStream的源码，可以看到它们加载资源的方式都是不同的。



---

## 附录

> **IDEA查看类继承关系图**

1. 选中想要看的类，鼠标右键选择“Diagrams”，再次点击“Show Diagrams... ”即可查看类继承关系（或者通过快捷键`Ctrl+Alt+Shift+U`）。

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202211081508434.png"/>

2. 如果展示出类的信息很少，也可以手动进行添加，操作如下

   - 选中类，鼠标右键点击 “Show Implementations” ，选中要展示出来的类即可

     <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202211081508435.png" />

     展示如下：

     ![image-20220304135105357](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202211081508436.png)

