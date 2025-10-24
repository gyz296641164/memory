---
title: 08_Spring初级容器初始化：获取声明文件和校验类型
category:
  - Spring源码
star: true
date: 2023-03-31
---

<!-- more -->

## 开篇

上一节，我们了解了Spring对xml的校验有两种校验方式，分别是DTD和XSD，并且，这两种校验方式都有对应的解析器来获取jar包中的声明文件。

这一节，我们就来看下这两个解析器，也就是BeansDtdResolver和PluggableSchemaResolver分别是如何从jar包中获取相应的声明文件的，只要有以下几个部分：

1. 首先我们会到BeansDtdResolver类中，看下它是如何解析获取DTD的声明文件的
2. 再到PluggableSchemaResolver类中，看下相应的XSD声明文件是如何获取的
3. 最后来看下Spring是如何判定当前xml文件，它到底应该用哪种方式来校验呢？

---

## 如何获取dtd声明文件呢？

我们先到BeansDtdResolver这个类中，看下DTD声明文件是如何获取的：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202303311541593.png)

进入到BeansDtdResolver类中，简单寻找了一下果然就发现了一个方法resolveEntity，很显然它就是解析并获取DTD文件的方法，可以看到方法resolveEntity需要传入两个参数，分别是publicId和systemId。

其实这两个参数都是从xml文件获取的，我们来先看下刚才包含dtd声明的xml文件：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202303311541690.png)

Spring在解析xml文件时，会从xml文件中获取到这两个参数的值，分别如下：

- publicId：-//SPRING//DTD BEAN//EN

- systemId：http://www.springframework.org/dtd/spring-beans.dtd

了解完这个之后，我们再回到刚才解析dtd文件的方法resolveEntity：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202303311541067.png)

可以看到在resolveEntity方法中，当判断systemId非空并且是以.dtd为后缀时，就会默认拼接并获取dtd声明文件的名称dtdFile，也就是spring-beans.dtd。

然后通过ClassPathResource类，从classpath路径下加载spring-beans.dtd声明文件，最后将publicId、systemId和ClassPathResource中的输入流，都封装成InputSource返回。

现在基本已经弄清楚了，我们可以到的spring-beans的源码项目的classpath路径下看下，那具体到classpath下的哪个路径下寻找呢？

不知道大家刚才有没有注意到，在创建ClassPathResource时，还通过方法getClass传入了当前的类也就是BeansDtdResolver，这样的话ClassPathResource就会从classpath路径下，到和BeansDtdResolver类相同包名的路径下，寻找相应的spring-beans.dtd文件，我们来看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202303311541108.png)

果然，因为BeansDtdResolver的包名为org.springframework.beans.factory.xml，相应的，我们也在classpath下的相应包中找到了spring-beans.dtd声明文件。

---

## 如何获取xsd声明文件呢？

​    DTD声明文件如何获取我们已经清楚了，现在我们再到PluggableSchemaResolver类中，看下如何获取XSD声明文件的：

![img](http://wechatapppro-1252524126.cdn.xiaoeknow.com/apppuKyPtrl1086/image/ueditor/69702500_1645261103.png?imageView2/2/q/80%7CimageMogr2/ignore-error/1)

​    可以看到，在PluggableSchemaResolver类中也存在相应的resolveEntity方法，而且也需要传递参数publicId和systemId。

------



​    我们再来看下XSD校验类型的xml文件：

![img](http://wechatapppro-1252524126.cdn.xiaoeknow.com/apppuKyPtrl1086/image/ueditor/10303400_1645261104.png?imageView2/2/q/80%7CimageMogr2/ignore-error/1)

​    Spring在解析XSD校验类型的xml文件时，同样也会获取到publicId和systemId这两个参数的值：



publicId：null

systemId：http://www.springframework.org/schema/beans/spring-beans.xsd



​    通过对比DTD的参数发现，publicId这个参数的值只有DTD校验类型才有的，而参数systemId其实就是声明文件的下载地址，DTD和XSD都有相应的地址。

------



​    获取到参数之后，我们回过头来看下方法resolveEntity是如何获取XSD声明文件的：

![img](http://wechatapppro-1252524126.cdn.xiaoeknow.com/apppuKyPtrl1086/image/ueditor/45559600_1645261104.png?imageView2/2/q/80%7CimageMogr2/ignore-error/1)

​    可以看到，首先参数systemId肯定非空，此时就会调用getSchemaMappings方法，通过传入参数systemId获取到资源的位置resourceLocation。



​    那getSchemaMapping方法是干什么的呢？我们先到getSchemaMapping方法中看下：

![img](http://wechatapppro-1252524126.cdn.xiaoeknow.com/apppuKyPtrl1086/image/ueditor/77100500_1645261104.png?imageView2/2/q/80%7CimageMogr2/ignore-error/1)

​    可以看到，在getSchemaMappings方法中，成员变量schemaMappings一开始肯定为空，所以，我们可以看到通过PropertiesLoaderUtils的loadAllProperties方法，会加载schemaMappingsLocation中的所有属性。

------



​    那schemaMappingsLocation又是什么呢，我们继续来看下：

![img](http://wechatapppro-1252524126.cdn.xiaoeknow.com/apppuKyPtrl1086/image/ueditor/10633100_1645261105.png?imageView2/2/q/80%7CimageMogr2/ignore-error/1)

​    可以看到，默认情况下PluggableSchemaResolver类在构造方法中，会给成员变量schemaMappingsLocation赋值为“META-INF/spring.schemas”。



​    这就好办了，也就是说PropertiesLoaderUtils的loadAllProperties方法就是加载spring.schemas中的所有属性，那具体加载什么属性呢，我们到spring-beans项目中的META-INF目录中看一下：

![img](http://wechatapppro-1252524126.cdn.xiaoeknow.com/apppuKyPtrl1086/image/ueditor/42903800_1645261105.png?imageView2/2/q/80%7CimageMogr2/ignore-error/1)

​    果然，我们在META-INF目录中找到了spring.schemas文件，我们看下spring.schemas文件中是什么：

![img](http://wechatapppro-1252524126.cdn.xiaoeknow.com/apppuKyPtrl1086/image/ueditor/78887300_1645261105.png?imageView2/2/q/80%7CimageMogr2/ignore-error/1)

​    看到这里我们算是明白了，原来在spring.schemas文件中，存放的就是以systemId为key，以XSD声明文件在项目中的包名路径作为value，所以我们通过systemId：



http://www.springframework.org/schema/beans/spring-beans.xsd



​    可以获取到对应的value值：



org/springframework/beans/factory/xml/spring-beans.xsd



​    原来相比于DTD声明文件的获取方式，XSD声明文件的获取，还要根据具体的配置配置来寻找。

------



​    了解完这些之后，我们再回到getSchemaMappings方法：

![img](http://wechatapppro-1252524126.cdn.xiaoeknow.com/apppuKyPtrl1086/image/ueditor/18262900_1645261106.png?imageView2/2/q/80%7CimageMogr2/ignore-error/1)

​    也就是说，最后会把spring.schemas中的所有属性封装成一个Map然后返回去，接下来我们可以猜到的就是会通过参数systemId的值，获取XSD文件在项目中的路径去获取XSD文件，这个我们刚才都看过的，所以接下来无非也就是这样。



​    我们再回到resolveEntity方法：

![img](http://wechatapppro-1252524126.cdn.xiaoeknow.com/apppuKyPtrl1086/image/ueditor/76618400_1645261106.png?imageView2/2/q/80%7CimageMogr2/ignore-error/1)

​    可以看到，通过systemId到schemaMappings中获取相应的resourceLocation，刚才我们看到了systemId对应的value值就是org/springframework/beans/factory/xml/spring-beans.xsd，也就是spring-beans.xsd声明文件在项目中的位置。



​    我们可以看到接下来会通过ClassPathResource，到classpath路径下的resourceLocation位置加载资源，和DTD类似也是将结果封装为InputSource返回。

------



​    那在classpath路径下，我们能不能找到相应的XSD声明文件呢，我们再来看下：

![img](http://wechatapppro-1252524126.cdn.xiaoeknow.com/apppuKyPtrl1086/image/ueditor/6901800_1645261107.png?imageView2/2/q/80%7CimageMogr2/ignore-error/1)

​    果然，在classpath路径下的包名路径中，我们也找到相应的XSD声明文件。

------

## 如何获取xml的校验类型呢？

分析到这里，DTD和XSD声明文件也都通过相应的EntityResolver实现类，都已经找到了，最后还有一个问题，那就是Spring是如何知道当前的解析的xml文件，是DTD类型的还是XSD类型的呢？

要回答这个问题，我们得要再回到方法doLoadDocument中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202303311556670.png)

可以看到，在调用loadDocument方法时不仅调用getEntityResolver方法，传入声明文件的解析器的同时，还调用getValidationModeForResource方法来获取当前xml文件的校验类型。

我们到getValidationModeForResource方法中，看下xml文件的校验类型是如何判断的：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202303311556680.png)

首先，会通过getValidationMode方法获取默认的校验模式，我们可以进去看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202303311556114.png)

可以看到，默认的校验类型，就是VALIDATION_AUTO，第一个if分支条件不符。

接下来，我们就直接来到到detectValidationMode方法中，看下它是如何自动检测xml校验类型的：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202303311556727.png)

可以看到，在detectValidationMode方法中，首先获取Resource资源的输入流，然后立马又委托给了XmlValidationModeDetector的validationModeDetector方法去检测了。

我们继续跟进一下validationModeDetector方法：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202303311557280.png)

可以看到，首先会将输入流InputStream封装为一个可以缓冲的字符输入流，方便读取InputStream，可以看到方法中，关键在于while循环中的hasDoctype方法，我们到hasDoctype方法中看下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202303311557959.png)

尘埃落定，也就是说只要检测到xml的内容中，包含“DOCTYPE”字符串，就认定xml文件的校验方式为DTD，否则就是XSD。

这样的话Spring就可以根据具体的校验类型，分别使用不同的解析器去获取相应的校验文件，xml文件在解析时，至少对xml文件的基本格式和规范就可以得到保障了。

---

## 总结

好了，今天的知识点，我们就讲到这里了，我们来总结一下吧。

一张图来梳理下当前的流程：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/images/Spring/202303/202303311557267.png)

这一节，我们主要了解了两部分的内容，一部分是DTD和XSD对应的解析器EntityResolver，看下它们是如何从jar包中获取对应的声明文件的，有了这样的机制存在，Spring在校验xml文件时，就不需要从网上临时下载声明文件，避免了因为断网或网络抖动对程序影响。

另外一点，我们也了解了Spring是如何判定xml文件，到底该使用DTD还是XSD校验方式，通过源码的分析我们知道，其实就是根据xml文件中是否存在“DOCTYPE”字符串来判定的，很简单如果xml中存在字符串“DOCTYPE”就是DTD校验方式，否则就是XSD校验方式。

接下来，具体如何根据DTD或XSD的解析器去校验xml文件，那就要交给DOM相关的API去校验了，关于DTD和XSD相关的东西，我们了解到这里也就差不多了。

接下来，我们就要正式来看下Spring，到底是如何一步步解析Document中的各种标签元素，然后将解析到的信息注入到Spring容器中的，后续的章节我们拭目以待。