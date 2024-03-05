---
title: 03_SpringBoot初始化核心流程源码分析
category:
  - SpringBoot
date: 2024-03-02
---

<!-- more -->

## 一、AutoConfigurationImportSelector

### 1.问题分析

我们之前在分析SpringBoot自动装配源码的时候讲过在 `@EnableAutoConfiguration`注解上通过 `@Import`注解导入了一个 `ImportSelector`接口的实现类 `AutoConfigurationImportSelector`。按照之前对 `@Import` 注解的理解，应该会执行重写的 `selectImports` 方法，但调试的时候，执行的流程好像和我们期待的不一样哦，没有走 `selectImports`方法。

通过Debug模式，端点定位我们能够发现进入到了getAutoConfigurationEntry方法中。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/360b831ed0f17d8b.png)

但是没有进入selectImports方法。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/5a6a40536183dd40.png)

这是什么原因呢？他不是实现了ImportSelector接口吗？怎么和我们之前理解的不一样呢？这就需要我们再来细说下@Import注解了。

### 2.@Import

我们前面介绍过@Import注解可以根据添加的不同类型做出不同的操作

| 导入类型                                | 注入方式                                                            |
| --------------------------------------- | ------------------------------------------------------------------- |
| 实现了ImportSelector接口                | 不注入该类型的对象，调用selectImports方法，将返回的数据注入到容器中 |
| 实现了ImportBeanDefinitionRegistrar接口 | 不注入该类型的对象，调用registerBeanDefinitions方法，通过注册器注入 |
| 普通类型                                | 直接注入该类型的对象                                                |

而在自动装配中导入的AutoConfigurationImportSelector这个类型有点特殊。具体看下类图结构

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/1159ec9acd6dea18.png)

那这个DeferredImportSelector这个接口的作用是什么呢？字面含义是延迟导入的意思。具体怎么实现的后面再说，我们先来说下他的作用。

### 3.DeferredImportSelector接口

DeferredImportSelector接口本身也有ImportSelector接口的功能，如果我们仅仅是实现了DeferredImportSelector接口，重写了selectImports方法，那么selectImports方法还是会被执行的，来看代码。

```java
public class MyDeferredImportSelector implements DeferredImportSelector {

    @Override
    public String[] selectImports(AnnotationMetadata importingClassMetadata) {
        System.out.println("selectImports方法执行了---->");
        return new String[0];
    }


}
```

对应的配置启动类

```java
@Configuration
@Import(MyDeferredImportSelector.class)
public class JavaConfig {

    public static void main(String[] args) {
        ApplicationContext ac = new AnnotationConfigApplicationContext(JavaConfig.class);
    }
}
```

启动效果：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/feee57e741067606.png)

但是如果我们重写了DeferredImportSelector中的Group接口，并重写了getImportGroup，那么容器在启动的时候就不会执行selectImports方法了，而是执行getImportGroup方法。进而执行Group中重写的方法。

```java
public class MyDeferredImportSelector implements DeferredImportSelector {

    @Override
    public String[] selectImports(AnnotationMetadata importingClassMetadata) {
        System.out.println("selectImports方法执行了---->");
        return new String[0];
    }

    @Override
    public Class<? extends Group> getImportGroup() {
        System.out.println("getImportGroup");
        return MyDeferredImportSelectorGroup.class;
    }

    public static class MyDeferredImportSelectorGroup implements Group{
        private final List<Entry> imports = new ArrayList<>();
        @Override
        public void process(AnnotationMetadata metadata, DeferredImportSelector selector) {
            System.out.println("MyDeferredImportSelectorGroup.Group");
        }

        @Override
        public Iterable<Entry> selectImports() {
            System.out.println("Group中的：selectImports方法");
            return imports;
        }
    }
}

```

执行效果：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/6c6227a0824a8ebe.png)

通过上面的效果解释了为什么在SpringBoot自动装配的时候没有走selectImports方法。那么DeferredImportSelector接口的作用是什么呢？为什么要这么设计呢？我们接下来继续分析

### 4.DeferredImportSelector的作用

通过前面的类图结构我们知道DeferredImportSelector是ImportSelector接口的一个扩展。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/b1c516b0592f1c82.png)

**ImportSelector**实例的selectImports方法的执行时机，是在@Configguration注解中的其他逻辑被处理之前，所谓的其他逻辑，包括对@ImportResource、@Bean这些注解的处理（注意，这里只是对@Bean修饰的方法的处理，并不是立即调用@Bean修饰的方法，这个区别很重要！)

**DeferredImportSelector**实例的selectImports方法的执行时机，是在@Configguration注解中的其他逻辑被处理完毕之后，所谓的其他逻辑，包括对@ImportResource、@Bean这些注解的处理.

上面的结论我们可以直接在源码中看到对应的答案。首先定位到ConfigurationClassParser中的parse方法。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/43c6b9685c78c264.png)

上面代码有两个非常重要的分支，我们在下面逐一的介绍

#### 4.1 parse方法

我们先看parse方法，也就是解析注解类的方法。进入

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/601a3b99c9a43c3d.png)

看到调用的是processConfigurationClass，翻译过来就比较好理解了，处理配置类

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/a6dfad0a006116a8.png)

再进入到循环的方法中。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/b51ffe7728173f46.png)

继续往下看

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/120d70cc32499e2d.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/bef9c52b4b545ef2.png)

逻辑处理还是非常清楚的。然后我们需要回到上面的处理@Import注解的方法中。在这个方法中我们可以看到@Import注解的实现逻辑

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/ca3fd1894d1acc66.png)

也就是前面给大家回顾的@Import注解的作用

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/f7dc6c451a7b72df.png)

然后来看下导入的类型是ImportSelector接口的逻辑。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/b2e36d548b2ef091.png)

上面的代码重点解决了ImportSelector接口的不同类型的实现。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/0483187a84a397c2.png)

对应的实例存储了起来

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/fd9a96f2f735a3fc.png)

#### 4.2 process方法

好了上面的代码分析清楚了，然后我们再回到process方法中来看下DeferredImportSelectorHandler是如何处理的。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/9b2a2c7229045241.png)

进入process方法

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/9aa8ac0e5bf623f0.png)

先看register方法

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/306b39b0d85cf9d6.png)

然后再看processGroupImports方法。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/7ec8d1b36628b866.png)

进去后我们需要进入getImports方法中。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/2d86585965dd3409.png)

然后我们进入到process方法中，可以看到自动装配的方法被执行了！

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/4f94f2c7c2fabce8.png)

到这儿是不是帮助大家解决了自动装配为什么没有走 `AutoConfigurationImportSelector`中的 `selectImports` 方法了!!!

同时也介绍清楚了ImportSelector与DeferredImportSelector的区别，就是selectImports方法执行时机有差别，这个差别期间，spring容器对此Configguration类做了些其他的逻辑：包括对@ImportResource、@Bean这些注解的处理

---

## 二、SpringBoot源码环境

对于想要研究SpringBoot源码的小伙伴来说，在本地编译源码环境，然后在研究源码的时候可以添加对应的注释是必须的，本文就给大家来介绍下如何来搭建我们的源码环境。

### 1.官方源码下载

首先大家要注意SpringBoot项目在2.3.0之前是使用Maven构建项目的，在2.3.0之后是使用Gradle构建项目的。后面分析的源码以SpringBoot2.2.5为案例，所以本文就介绍下SpringBoot2.2.5的编译过程。

官网地址：https://github.com/spring-projects/spring-boot

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/17093ec89efacce0.png)

直接下载对于的压缩文件即可

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/1137de12c7ecf6cb.png)

下载后直接解压缩即可

### 2.本地源码编译

把解压缩的源码直接导入到IDEA中，修改pom文件中的版本号。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/3d996b2ac1548efb.png)

pom文件中提示 `disable.checks`属性找不到，我们添加一个即可。

```xml
	<properties>
		<revision>2.2.5.snapshot</revision>
		<main.basedir>${basedir}</main.basedir>
		<!-- 添加属性 -->
		<disable.checks>true</disable.checks>
	</properties>
```

然后执行编译命令

```cmd
mvn clean install -DskipTests
```

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/0b3368aa98e9c71a.png)

然后控制台出现如下错误

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/da071853f0ece3e5.png)

按照提示，执行下面的 命令 就好了：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/c2ead46a08ec7edd.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/4982fc8bbbc82161.png)

在执行编译命令就可以了

`mvn clean install -DskipTests`

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/83fd2b817a085e65.png)

### 3.源码环境使用

既然源码已经编译好之后我们就可以在这个项目中来创建我们自己的SpringBoot项目了，我们在 `spring-boot-project`项目下创建 `module`,

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/8e9e596c2ae8cfc6.png)

然后在我们的module中添加对应的start依赖

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/603deecd4f05df0b.png)

然后添加我们的启动类

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/4d618fcbd6a49799.png)

项目能够正常启动

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/678e4e9850d450d2.png)

同时点击run方法进去，我们可以添加注释了：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/df1733d800cf4ca5.png)

在其他项目使用我们编译的源码，这个可能是大家比较感兴趣的一个点了，我们也来介绍下，依赖我们还是可以使用官方的依赖即可，不过最好还是和我们编译的版本保持一致。

主要是关联上我们编译的源码。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/f1fb7a8cf4071f3c.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/1e4387fe5f09fd13.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/9ef34991bb120316.png)

修改代码

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/9a24158b626ea647.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/83be6be62d78af1a.png)

好了到此我们就可以开启SpringBoot的源码探索之旅了哦。

---

## 三、SpringBoot源码主线分析

我们要分析一个框架的源码不可能通过一篇文章就搞定的，本文我们就来分析下SpringBoot源码中的主线流程。先掌握SpringBoot项目启动的核心操作，然后我们再深入每一个具体的实现细节，注：本系列源码都以SpringBoot2.2.5.RELEASE版本来讲解

### 1.SpringBoot启动的入口

当我们启动一个SpringBoot项目的时候，入口程序就是main方法，而在main方法中就执行了一个run方法。

```java
@SpringBootApplication
public class StartApp {

	public static void main(String[] args) {
		SpringApplication.run(StartApp.class);
	}
}
```

### 2.run方法

然后我们进入run()方法中看。代码比较简单

```java
	public static ConfigurableApplicationContext run(Class<?> primarySource, String... args) {
		// 调用重载的run方法，将传递的Class对象封装为了一个数组
		return run(new Class<?>[] { primarySource }, args);
	}
```

调用了重载的一个run()方法，将我们传递进来的类对象封装为了一个数组，仅此而已。我们再进入run()方法。

```java
	public static ConfigurableApplicationContext run(Class<?>[] primarySources, String[] args) {
		// 创建了一个SpringApplication对象，并调用其run方法
		// 1.先看下构造方法中的逻辑
		// 2.然后再看run方法的逻辑
		return new SpringApplication(primarySources).run(args);
	}
```

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/483573ab38e2b6de.png)

在该方法中创建了一个SpringApplication对象。同时调用了SpringApplication对象的run方法。这里的逻辑有分支，先看下SpringApplication的构造方法中的逻辑

### 3.SpringApplication构造器

我们进入SpringApplication的构造方法，看的核心代码为

```java
	public SpringApplication(ResourceLoader resourceLoader, Class<?>... primarySources) {
		// 传递的resourceLoader为null
		this.resourceLoader = resourceLoader;
		Assert.notNull(primarySources, "PrimarySources must not be null");
		// 记录主方法的配置类名称
		this.primarySources = new LinkedHashSet<>(Arrays.asList(primarySources));
		// 记录当前项目的类型
		this.webApplicationType = WebApplicationType.deduceFromClasspath();
		// 加载配置在spring.factories文件中的ApplicationContextInitializer对应的类型并实例化
		// 并将加载的数据存储在了 initializers 成员变量中。
		setInitializers((Collection) getSpringFactoriesInstances(ApplicationContextInitializer.class));
		// 初始化监听器 并将加载的监听器实例对象存储在了listeners成员变量中
		setListeners((Collection) getSpringFactoriesInstances(ApplicationListener.class));
		// 反推main方法所在的Class对象 并记录在了mainApplicationClass对象中
		this.mainApplicationClass = deduceMainApplicationClass();
	}
```

在本方法中完成了几个核心操作

1. 推断当前项目的类型
2. 加载配置在spring.factories文件中的ApplicationContextInitializer中的类型并实例化后存储在了initializers中。
3. 和2的步骤差不多，完成监听器的初始化操作，并将实例化的监听器对象存储在了listeners成员变量中
4. 通过StackTrace反推main方法所在的Class对象

上面的核心操作具体的实现细节我们在后面的详细文章会给大家剖析

### 4.run方法

接下来我们在回到SpringApplication.run()方法中。

```java
	public ConfigurableApplicationContext run(String... args) {
		// 创建一个任务执行观察器
		StopWatch stopWatch = new StopWatch();
		// 开始执行记录执行时间
		stopWatch.start();
		// 声明 ConfigurableApplicationContext 对象
		ConfigurableApplicationContext context = null;
		// 声明集合容器用来存储 SpringBootExceptionReporter 启动错误的回调接口
		Collection<SpringBootExceptionReporter> exceptionReporters = new ArrayList<>();
		// 设置了一个名为java.awt.headless的系统属性
		// 其实是想设置该应用程序,即使没有检测到显示器,也允许其启动.
		//对于服务器来说,是不需要显示器的,所以要这样设置.
		configureHeadlessProperty();
		// 获取 SpringApplicationRunListener 加载的是 EventPublishingRunListener
		// 获取启动时到监听器
		SpringApplicationRunListeners listeners = getRunListeners(args);
		// 触发启动事件
		listeners.starting();
		try {
			// 构造一个应用程序的参数持有类
			ApplicationArguments applicationArguments = new DefaultApplicationArguments(args);
			// 创建并配置环境
			ConfigurableEnvironment environment = prepareEnvironment(listeners, applicationArguments);
			// 配置需要忽略的BeanInfo信息
			configureIgnoreBeanInfo(environment);
			// 输出的Banner信息
			Banner printedBanner = printBanner(environment);
			// 创建应用上下文对象
			context = createApplicationContext();
			// 加载配置的启动异常处理器
			exceptionReporters = getSpringFactoriesInstances(SpringBootExceptionReporter.class,
					new Class[] { ConfigurableApplicationContext.class }, context);
			// 刷新前操作
			prepareContext(context, environment, listeners, applicationArguments, printedBanner);
			// 刷新应用上下文 完成Spring容器的初始化
			refreshContext(context);
			// 刷新后操作
			afterRefresh(context, applicationArguments);
			// 结束记录启动时间
			stopWatch.stop();
			if (this.logStartupInfo) {
				new StartupInfoLogger(this.mainApplicationClass).logStarted(getApplicationLog(), stopWatch);
			}
			// 事件广播 启动完成了
			listeners.started(context);
			callRunners(context, applicationArguments);
		}
		catch (Throwable ex) {
			// 事件广播启动出错了
			handleRunFailure(context, ex, exceptionReporters, listeners);
			throw new IllegalStateException(ex);
		}
		try {
			// 监听器运行中
			listeners.running(context);
		}
		catch (Throwable ex) {
			handleRunFailure(context, ex, exceptionReporters, null);
			throw new IllegalStateException(ex);
		}
		// 返回上下文对象--> Spring容器对象
		return context;
	}
```

在这个方法中完成了SpringBoot项目启动的很多核心的操作，我们来总结下上面的步骤

1. 创建了一个任务执行的观察器，统计启动的时间
2. 声明ConfigurableApplicationContext对象
3. 声明集合容器来存储SpringBootExceptionReporter即启动错误的回调接口
4. 设置java.awt.headless的系统属性
5. 获取我们之间初始化的监听器(EventPublishingRunListener),并触发starting事件
6. 创建ApplicationArguments这是一个应用程序的参数持有类
7. 创建ConfigurableEnvironment这时一个配置环境的对象
8. 配置需要忽略的BeanInfo信息
9. 配置Banner信息对象
10. 创建对象的上下文对象
11. 加载配置的启动异常的回调异常处理器
12. 刷新应用上下文，本质就是完成Spring容器的初始化操作
13. 启动结束记录启动耗时
14. 完成对应的事件广播
15. 返回应用上下文对象。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/1a31ed73413f62bf.png)

到此SpringBoot项目的启动初始化的代码的主要流程就介绍完成了。先挑几个关键的步骤介绍下他们的作用，细节部分后面详细讲解。

**启动&停止计时器**：在代码中，用到stopWatch来进行计时。所以在最开始先要启动计时，在最后要停止计时。这个计时就是最终用来统计启动过程的时长的。最终在应用启动信息输出的实时打印出来，如以下内容：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/a3f15832492de46b.png)

**获取和启动监听器**：这一步从spring.factories中解析初始所有的SpringApplicationRunListener 实例，并通知他们应用的启动过程已经开始。

**装配环境参数**：这一步主要是用来做参数绑定的，prepareEnvironment 方法会加载应用的外部配置。这包括application.properties 或 application.yml 文件中的属性，环境变量，系统属性等。所以，我们自定义的那些参数就是在这一步被绑定的。

**打印Banner**：这一步的作用很简单，就是在控制台打印应用的启动横幅Banner。如以下内容：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/3612b9148554c737.png)

**创建应用上下文：**到这一步就真的开始启动了，第一步就是先要创建一个Spring的上下文出来，只有有了这个上
下文才能进行Bean的加载、配置等工作。

**准备上下文：**这一步非常关键，很多核心操作都是在这一步完成的

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/50e5d274fbe9d2a2.png)

在这一步，会打印启动的信息日志，主要内容如下：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/fc58fe21ba715ad5.png)

**刷新上下文**：这一步，是Spring启动的核心步骤了，这一步骤包括了实例化所有的 Bean、设置它们之间的依赖关系以及执行其他的初始化任务。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/1338f00a2b2c8f26.png)

所以，这一步中，主要就是创建BeanFactory，然后再通过BeanFactory来实例化Bean。

但是，很多人都会忽略一个关键的步骤(网上很多介绍SpringBoot启动流程的都没提到)，那就是Web容器的启动，及Tomcat的启动其实也是在这个步骤。

在refresh->onRefresh中，这里会调用到ServletWebServerApplicationontext的onRefresh中：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/3e64907d69cafe42.png)

这里面的==createWebserver==方法中，调用到`factory.getWebServer(getSelflnitializer();`的时候，factory有三种实现，分别是：

1. JettyServletWebServerFactory、
2. TomcatServletWebServerFactory、
3. UndertowServletWebServerFactory

**默认使用TomcatServletWebServerFactory。**

TomcatServletWebServerFactory的getWebServer方法如下，这里会创建一个Tomcat

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/2f1f8fd25d1dfc89.png)

在最后一步`getTomcatWebServer(tomcat);`的代码中，会创建一个TomcatServer，并且把他启动：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/0a26d26f6870a91e.png)

接下来在initialize中完成了tomcat的启动。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/a802c88a3d8d3940.png)

最后，SpringBoot的启动过程主要流程如下：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/7c0adc379cf09736.png)

---

## 四、SpringApplication构造器

前面给大家介绍了SpringBoot启动的核心流程，本文开始给大家详细的来介绍SpringBoot启动中的具体实现的相关细节。 

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/bbd83244f823974b.png)

首先我们来看下在SpringApplication的构造方法中是如何帮我们完成这4个核心操作的。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/0050c687420e3c69.png)

```java
	@SuppressWarnings({ "unchecked", "rawtypes" })
	public SpringApplication(ResourceLoader resourceLoader, Class<?>... primarySources) {
		// 传递的resourceLoader为null
		this.resourceLoader = resourceLoader;
		Assert.notNull(primarySources, "PrimarySources must not be null");
		// 记录主方法的配置类名称
		this.primarySources = new LinkedHashSet<>(Arrays.asList(primarySources));
		// 记录当前项目的类型
		this.webApplicationType = WebApplicationType.deduceFromClasspath();
		// 加载配置在spring.factories文件中的ApplicationContextInitializer对应的类型并实例化
		// 并将加载的数据存储在了 initializers 成员变量中。
		setInitializers((Collection) getSpringFactoriesInstances(ApplicationContextInitializer.class));
		// 初始化监听器 并将加载的监听器实例对象存储在了listeners成员变量中
		setListeners((Collection) getSpringFactoriesInstances(ApplicationListener.class));
		// 反推main方法所在的Class对象 并记录在了mainApplicationClass对象中
		this.mainApplicationClass = deduceMainApplicationClass();
	}
```

### 1.webApplicationType

首先来看下webApplicationType是如何来推导出当前启动的项目的类型。通过代码可以看到是通过deduceFromClassPath()方法根据ClassPath来推导出来的。

```java
this.webApplicationType = WebApplicationType.deduceFromClasspath();
```

跟踪进去看代码

```java
	static WebApplicationType deduceFromClasspath() {
		if (ClassUtils.isPresent(WEBFLUX_INDICATOR_CLASS, null)
				&& !ClassUtils.isPresent(WEBMVC_INDICATOR_CLASS, null)
				&& !ClassUtils.isPresent(JERSEY_INDICATOR_CLASS, null)) {
			return WebApplicationType.REACTIVE;
		}
		for (String className : SERVLET_INDICATOR_CLASSES) {
			if (!ClassUtils.isPresent(className, null)) {
				return WebApplicationType.NONE;
			}
		}
		return WebApplicationType.SERVLET;
	}
```

在看整体的实现逻辑之前，我们先分别看两个内容，第一就是在上面的代码中使用到了相关的静态变量。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/8001b68b4f96e9c3.png)

这些静态变量其实就是一些绑定的Java类的全类路径。第二个就是 `ClassUtils.isPresent()`方法，该方法的逻辑也非常简单，就是通过反射的方式获取对应的类型的Class对象，如果存在返回true，否则返回false

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/612875506dc4e6e6.png)

所以到此推导的逻辑就非常清楚了

![image.png](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/8dd8202b39444b65.png)

### 2.setInitializers

然后我们再来看下如何实现加载初始化器的。

```java
// 加载配置在spring.factories文件中的ApplicationContextInitializer对应的类型并实例化
		// 并将加载的数据存储在了 initializers 成员变量中。
		setInitializers((Collection) getSpringFactoriesInstances(ApplicationContextInitializer.class));
```

首先所有的初始化器都实现了 `ApplicationContextInitializer`接口,也就是根据这个类型来加载相关的实现类。

```java
public interface ApplicationContextInitializer<C extends ConfigurableApplicationContext> {
    void initialize(C var1);
}
```

然后加载的关键方法是 `getSpringFactoriesInstances()`方法。该方法会加载 `spring.factories`文件中的key为 `org.springframework.context.ApplicationContextInitializer` 的值。

spring-boot项目下

```properties
# Application Context Initializers
org.springframework.context.ApplicationContextInitializer=\
org.springframework.boot.context.ConfigurationWarningsApplicationContextInitializer,\
org.springframework.boot.context.ContextIdApplicationContextInitializer,\
org.springframework.boot.context.config.DelegatingApplicationContextInitializer,\
org.springframework.boot.rsocket.context.RSocketPortInfoApplicationContextInitializer,\
org.springframework.boot.web.context.ServerPortInfoApplicationContextInitializer
```

spring-boot-autoconfigure项目下

```properties
# Initializers
org.springframework.context.ApplicationContextInitializer=\
org.springframework.boot.autoconfigure.SharedMetadataReaderFactoryContextInitializer,\
org.springframework.boot.autoconfigure.logging.ConditionEvaluationReportLoggingListener

```

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/34d808622e0cd56d.png)

具体的加载方法为 `getSpringFacotiesInstance()`方法，我们进入查看

```java
	private <T> Collection<T> getSpringFactoriesInstances(Class<T> type, Class<?>[] parameterTypes, Object... args) {
		// 获取当前上下文类加载器
		ClassLoader classLoader = getClassLoader();
		// 获取到的扩展类名存入set集合中防止重复
		Set<String> names = new LinkedHashSet<>(SpringFactoriesLoader.loadFactoryNames(type, classLoader));
		// 创建扩展点实例
		List<T> instances = createSpringFactoriesInstances(type, parameterTypes, classLoader, args, names);
		AnnotationAwareOrderComparator.sort(instances);
		return instances;
	}
```

先进入 `SpringFactoriesLoader.loadFactoryNames(type, classLoader)`中具体查看加载文件的过程.

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/c8b99bc9b066cfce.png)

然后我们来看下 `loadSpringFactories`方法

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/5d9ffaf4e44854e3.png)

通过Debug的方式查看会更清楚哦

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/39452d8efdb8ed45.png)

通过 `loadSpringFactories` 方法我们看到把 `spring.factories`文件中的所有信息都加载到了内存中了，但是我们现在只需要加载 `ApplicationContextInitializer`类型的数据。这时我们再通过 `getOrDefault()`方法来查看。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/e9c866d330147c12.png)

进入方法中查看

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/305b79889b083348.png)

然后会根据反射获取对应的实例对象。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/836ba0dfd3bfd1a0.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/7cf3f09d932573b9.png)

好了到这其实我们就清楚了 `getSpringFactoriesInstances`方法的作用就是帮我们获取定义在 `META-INF/spring.factories`文件中的可以为 `ApplicationContextInitializer` 的值。并通过反射的方式获取实例对象。然后把实例的对象信息存储在了SpringApplication的 `initializers`属性中。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/219231671137b046.png)

### 3.setListeners

清楚了 `setInitializers()`方法的作用后，再看 `setListeners()`方法就非常简单了，都是调用了 `getSpringFactoriesInstances`方法，只是传入的类型不同。也就是要获取的 `META-INF/spring.factories`文件中定义的不同信息罢了。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/9e3e2e2c4279b704.png)

即加载定义在 `META-INF/spring.factories`文件中声明的所有的监听器，并将获取后的监听器存储在了 `SpringApplication`的 `listeners`属性中。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/840624cfdee8e550.png)

默认加载的监听器为：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/21e62505ec0f8a52.png)

### 4.mainApplicationClass

最后我们来看下 `duduceMainApplicaitonClass()`方法是如何反推导出main方法所在的Class对象的。通过源码我们可以看到是通过 `StackTrace`来实现的。

> StackTrace:
>
> - 我们在学习函数调用时，都知道每个函数都拥有自己的栈空间。
> - 一个函数被调用时，就创建一个新的栈空间。那么通过函数的嵌套调用最后就形成了一个函数调用堆栈

`StackTrace`其实就是记录了程序方法执行的链路。通过Debug方式可以更直观的来呈现。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/34f77925eeec19f1.png)

那么相关的调用链路我们都可以获取到，剩下的就只需要获取每链路判断执行的方法名称是否是 `main`就可以了。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/e48882e66fd55734.png)
