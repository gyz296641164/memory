# SpringBoot源码面试题

## 1.谈谈你对SpringBoot的理解

1. 为什么会出现SpringBoot：

SSM：添加相关的依赖『依赖很大。版本兼容性问题』添加各自的配置文件，还有添加相关的整合文件。web.xml中配置每个项目都得干这些事情。---》有很多重复性的工作 --》约定由于配置--》SpringBoot【脚手架】

2. SpringBoot的发展

- 2014 1.x  
- 2018  2.x  
- 2022 3.x

3. 从技术发展演变过程介绍SpringBoot ：Spring注解编程的发展

4. Spring和SpringBoot的关系

---

## 2. 介绍下SpringBoot的工作原理

SpringBoot：IoC，需要清楚Spring的加载过程

1. run方法干了什么事情 --》 IoC
2. SpringBootApplication注解做了什么事情  --》 通过EnableAutoConfiguration注解实现加载 `META-INF/spring.factories` 文件中的配置类
3. 1和2是怎么关联的

BeanFactoryPostProcessor完成对@Configuration注解的加载解析

---

## 3. 介绍下@Import注解的作用

1. @Import注解的由来： xml  import标签--> 配置类转变 3.0 @Configuration @Import替换import标签的作用  3.1 扫描注解
2. @Import注解的作用：SpringBoot的自动装配
   - 导入第三方的其他配置类 
   - 可以直接将某个Class的对象注入到容器中 @Import(User.class) 
   - 动态注入，注入的类型如果实现了下面的接口。就不会把该类型的对象注入进去
     - ImportSelector接口：把selectImports方法返回的字符串数组的类型注入到容器中
     - ImportBeanDefinitionRegistrar接口：在抽象方法中直接提供了注册器。我们在方法体中完成注入
     - ImportSelector 和 ImportBeanDefinitionRegistrar的区别

---

## 4. SpringBoot中为什么用的DeferredImportSelector?

为什么? 为什么要延迟加载？  本身逻辑代码是在BeanFactory的后置处理器中完成的

BeanFactory的后置处理器本身的作用就是要完善BeanDefinition的定义。所以我们需要在所有对应都完成了定义信息的加载后再去注入实例到容器中

---

## 5. SpringBoot和SpringMVC的关系

SpringBoot是一个基于Spring的脚手架工具。我们要创建一个Web项目。那么我们需要引入spring-boot-starter-web 这个依赖。在这个依赖中会完成相关的SpringMVC和Spring的关联配置

---

## 6. SpringBoot和Tomcat的关系

通过SpringBoot构建一个Web项目。默认依赖的Web容器就是Tomcat

---

## 7. SpringMVC的工作原理

https://cloud.fynote.com/share/s/IXvrMNIN

---

## 8. SpringSecurity中是如何实现自定义认证的

1. 回答具体的应用过程
2. SpringSecurity的工作原理：过滤器

