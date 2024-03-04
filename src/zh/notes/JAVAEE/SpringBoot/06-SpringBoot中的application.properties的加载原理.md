---
title: 06_SpringBoot中application.properties的加载原理
category:
  - SpringBoot
date: 2024-03-03
---

<!-- more -->

## 开篇

首先我们来看一个问题。就是我们在创建SpringBoot项目的时候会在对应的application.properties或者application.yml文件中添加对应的属性信息，我们的问题是这些属性文件是什么时候被加载的？如果要实现自定义的属性文件怎么来实现呢？本文来给大家揭晓答案：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/e7a6f3b14749bb12.png)

## 1.找到入口

结合我们前面介绍的SpringBoot中的监听事件机制，我们首先看下SpringApplication.run()方法，在该方法中会针对SpringBoot项目启动的不同的阶段来发布对应的事件。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/8d0d1999164ba1ce.png)

处理属性文件加载解析的监听器是 `ConfigFileApplicationListener` ,这个监听器监听的事件有两个。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/3fbc1baa725fefb4.png)

而我们进入SpringApplication.prepareEnvironment()方法中发布的事件其实就是ApplicationEnvironmentPreparedEvent事件。进入代码查看。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/b85e63bdd411515b.png)

进行进入

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/ea16b650498d0a6c.png)

继续进入会看到对应的发布事件：ApplicationEnvironmentPreparedEvent

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/07c3065df02ab318.png)

结合上篇文件的内容，我们知道在initialMulticaster中是有ConfigFileApplicationListener这个监听器的。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/b03ea34423d262ab.png)

那么在此处触发了配置环境的监听器，后续的逻辑就应该进入对应的

---

## 2.ConfigFileApplicationListener

### 2.1 主要流程分析

接下来我们看下ConfigFileApplicationListener中具体的如何来处理配置文件的加载解析的。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/4276af67be2700df.png)

根据逻辑我们直接进入onApplicationEnvironmentPreparedEvent()方法中。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/59d77593b8a7d7a4.png)

系统提供那4个不是重点，重点是 ConfigFileApplicationListener 中的这个方法处理.

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/5fc77085080cb6fd.png)

直接进入ConfigFileApplicationListener.postProcessEnvironment()方法。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/2c9b0abca210fb11.png)

在进入addPropertySources()方法中会完成两个核心操作，1。创建Loader对象，2。调用Loader对象的load方法，

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/6a090757635ad65c.png)

### 2.2 Loader构造器

现在我们来看下在Loader构造器中执行了什么操作。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/01ed5130a1f2f54c.png)

通过源码我们可以发现在其中获取到了属性文件的加载器、从spring.factories文件中获取，对应的类型是 `PropertySourceLoader`类型。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/e37d834239e1832d.png)

而且在loadFactories方法中会完成对象的实例化。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/f3644a8a1a6c3322.png)

到这Loader的构造方法执行完成了，然后来看下load()方法的执行。先把代码贴上

```java
void load() {
			FilteredPropertySource.apply(this.environment, DEFAULT_PROPERTIES, LOAD_FILTERED_PROPERTY,
					(defaultProperties) -> {
						// 创建默认的profile 链表
						this.profiles = new LinkedList<>();
						// 创建已经处理过的profile 类别
						this.processedProfiles = new LinkedList<>();
						// 默认设置为未激活
						this.activatedProfiles = false;
						// 创建loaded对象
						this.loaded = new LinkedHashMap<>();
						// 加载配置 profile 的信息，默认为 default
						initializeProfiles();
						// 遍历 Profiles，并加载解析
						while (!this.profiles.isEmpty()) {
							// 从双向链表中获取一个profile对象
							Profile profile = this.profiles.poll();
							// 非默认的就加入，进去看源码即可清楚
							if (isDefaultProfile(profile)) {
								addProfileToEnvironment(profile.getName());
							}
							load(profile, this::getPositiveProfileFilter,
									addToLoaded(MutablePropertySources::addLast, false));
							this.processedProfiles.add(profile);
						}
						// 解析 profile
						load(null, this::getNegativeProfileFilter, addToLoaded(MutablePropertySources::addFirst, true));
						// 加载默认的属性文件 application.properties
						addLoadedPropertySources();
						applyActiveProfiles(defaultProperties);
					});
		}
```

然后我们进入具体的apply()方法中来查看。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/35a60344526e8644.png)

中间的代码都有注释，主要是处理profile的内容。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/e701d90bcd7cd894.png)

首先是getSearchLocations()方法，在该方法中会查询默认的会存放对应的配置文件的位置，如果没有自定义的话，路径就是 `file:./config/`、 `file:./`、 `classpath:/config/`、 `classpath:/` 这4个

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/b14954128d39f55c.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/4ca80a41b5cda4a8.png)

然后回到load方法中，遍历4个路径，然后加载对应的属性文件。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/bae11aa824b9278d.png)

getSearchNames()获取的是属性文件的名称。如果自定义了就加载自定义的

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/825b214aa860eac1.png)

否则加载默认的application文件。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/d87a9b66f2a08a86.png)

再回到前面的方法

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/d37903996d43a983.png)

进入load方法，会通过前面的两个加载器来分别加载application.properties和application.yml的文件。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/0d00ed9520ac83cb.png)

loader.getFileExtensions()获取对应的加载的文件的后缀。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/6c708c26e0a4a8aa.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/e5a2227749ef3221.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/6f919b6b568e4a2d.png)

进入loadForFileExtension()方法，对profile和普通配置分别加载

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/14087567d11ee6c8.png)

继续进入load方法

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/5a961cfc9d424f28.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/272e5c58bb591c9b.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/0eefd6dbe4e6228f.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/d95062dd6d67ffb2.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/a82c10f240caa762.png)

开始加载我们存在的application.properties文件。

### 2.3 properties加载

在找到了要加载的文件的名称和路径后，我们来看下资源加载器是如何来加载具体的文件信息的。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/77b1f24242721d8a.png)

进入loadDocuments方法中，我们会发现会先从缓存中查找，如果缓存中没有则会通过对应的资源加载器来加载了。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/3f4064ab2c57acb8.png)

此处是PropertiesPropertySourceLoader来加载的。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/e774eb63f92a3915.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/7929b8f18d11c19d.png)

进入loadProperties方法

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/ea484f355ea0b0ce.png)

之后进入load()方法看到的就是具体的加载解析properties文件中的内容了。感兴趣的可以看下具体的逻辑，本文就给大家介绍到这里了。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringBoot/202403/6401e4fa4c3b173b.png)
