<h1 align="center">06-Spring初级容器初始化：加载XML的Document</h1>

## 开篇

上一节，我们从XmlBeanFactory的构造方法出发，发现Resource资源的加载交给了XmlBeanDefinitionReader，并且，我们看到的暂时都是一些数据准备工作，比如将Resource封装为具有字符集和编码功能的EncodedResource，然后通过Resource中的输入流InputStream，又封装了InputSource。

我们可以知道的是，资源Resource的核心加载环节一直都还没有开始，从这一节开始我们来看下Resource是如何加载的，主要包括以下几个部分：

1. 沿着上节课的思路继续分析，看下Spring具体是如何解析xml的
2. 通过一个简单的案例，体验下解析xml文件的一种方式也就是DOM解析
3. 回过头来看下源码，看下Spring是通过什么样的方式来加载xml文件的

---

## Spring是如何解析XML的呢？

好了，我们接着上一节的方法doLoadBeanDefinitions继续分析：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202303311045529.png)

我们可以看到，在方法doLoadBeanDefinitions中，首先将封装好的inputSource及资源resource传递进了doLoadDocument方法中，通过方法的名称应该是把resource资源加载成一个Document对象，确实我们也看到了它返回了一个Document对象。

我们先到doLoadDocument方法中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202303311045935.png)

可以看到，XmlBeanDefinitionReader又将加载资源resource的任务，委托给了成员变量documentLoader来完成。那documentLoader又是什么呢？我们可以来看下这个成员变量：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202303311045723.png)

可以看到，成员变量documentLoader的类型为DefaultDocumentLoader，通过类的名称，我们初步可以推测出它就是用来加载Document的一个组件。当然现在我们连Document都不是很了解，这些我们先留着等下来揭秘。

我们顺势到loadDocument方法中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202303311045304.png)

看到这里几乎就真相大白了，Spring其实就是通过DOM来解析xml文件的，可能有些同学之前还不太了解DOM，接下来，我们通过一个案例带大家来体验一下DOM是如何解析XML文件的。

---

## XML解析的示例：DOM解析

首先，我们先写一个简单的类Student：

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202303311111591.png)

可以看到非常的简单，Student类中就两个字段，分别是String类型的name，和int类型的age，然后我们再定义一个xml文件student.xml，内容如下：

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202303311111523.png)

可以看到，在student.xml中，我们自定义了一些标签，其中student、name和age，分别对应Student类中的name和age字段。

接下来，我们再通过代码来演示下如何用DOM来解析student.xml：

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202303311111920.png)

首先，将xml文件的的绝对路径，也就是xml文件在磁盘的位置，作为方法getDocument参数传递进去，然后通过DocumentBuilderFactory的newInstance方法，创建出一个DocumentBuilderFactory，再通newDocumentBuilder方法得到DocumentBuilder对象。

可以看到，通过DocumentBuilder的parse方法解析xml文件，可以得到xml文件对应的Document对象，Document对象中就包含了student.xml中配置的所有信息。

方法getDocument暂时只是将指定路径下的xml文件加载成了Document对象，那具体如何解析Document对象，获取xml中配置的信息呢？我们再通过另外一个方法来解析下Document：

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202303311112258.png)

可以看到，在getStudents方法中，我们调用刚才的getDocument方法先获取student.xml对应的Document对象，然后获取配置文件中的所有student标签依次来遍历它们，通过对student标签的解析获取标签中name标签和age标签中的数据，并封装到Student对象中返回。

最后，我们再测试下刚才写的这些方法：

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202303311112307.png)

运行之后，打印结果如下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202303311112617.png)

可以发现，通过DOM已经成功解析了student.xml配置文件，并将标签中的信息封装到了Student对象中并打印了出来。

关于DOM其他更高阶的API大家可以网上搜索一下，通过DOM方式解析xml文件其实无非也这样，而Spring对标签的解析，如bean标签其实也是通过这样的方式，因为Spring中定义的标签种类非常的多，所以Spring相比于我们这个案例而言，解析xml的过程会复杂的多。

在后面的源码分析环节，我们会跟大家一起来研究下Spring是如何解析各种让人眼花缭乱的标签的。

------

## Spring是如何加载Resource的呢？

了解完DOM解析xml文件是怎么回事之后，我们再回到刚才的Spring源码位置：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202303311112925.png)

可以看到，Spring源码中的DOM相关的代码和刚才案例中的代码几乎是一样的。

首先创建DocumentBuilderFactory，然后通过DocumentBuilderFactory来进一步将inputSource封装成Document，inputSource上一节我们看到了，里面是封装了xml对应的输入流InputStream的。

最后还有一个疑问，那就是方法createDocumentBuilder被调用的时候，参数entityResolver是什么呢？

如果要回答这个问题，就会涉及到另外一个重要的知识点，也就是Spring的xml文件的校验，毕竟你没有按照一定的规范和格式去配置xml文件，Spring在解析xml文件的时候很有可能就会出错，所以在正式解析xml之前Spring需要校验下xml，下一节，我们专门来看下这块内容。

------

## 总结

好了，今天的知识点，我们就讲到这里了，我们来总结一下吧。

这一节，我们开始分析Spring是如何解析xml文件的，我们通过一个案例，体验了一下DOM解析的过程是怎么样的，我们发现其实Spring也是通过DOM来解析xml文件的。

后面，我们会详细来看下Spring是如何解析xml中各种各样的标签，但是，最终的目的还是将解析到的bean相关的信息注入到Spring容器中。