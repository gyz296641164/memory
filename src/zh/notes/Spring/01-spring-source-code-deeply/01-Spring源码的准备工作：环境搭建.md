---
title: 01-Spring源码的准备工作：环境搭建
category:
  - Spring源码
star: true
date: 2023-03-30
---

<!-- more -->

## 写在前面

- IDEA版本最好选用比较新的（本文 **IntelliJ IDEA 2021.3.1**），我在以前用 **IntelliJ IDEA 2019.3.3** 版本构建的时候始终报莫名奇妙的错误。
- 在选用`v 2021.3`版本后按照如下步骤即可成功完成编译过程。

---

## 从github拉取Spring的源码

Spring源码目前是在github上托管的，我们通过链接：https://spring.io/projects/spring-framework，到spring官网看一下：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202210201535463.png" alt="img"/>

通过点击图片右上角的猫头图标，我们可以定位到spring源码在github上的位置：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202210201535465.png" alt="img"/>

Spring源码默认是位于main分支上的，本文采用的是`v5.2.6.RELEASE`这个版本的代码，所以先切换到分支5.2.x：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202210201535466.png" alt="img"/>

然后基于分支5.2.x再切换到v5.2.6.RELEASE这个tag上：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202210201535467.png" alt="img"/>

然后，我们可以下载这个tag下对应的Spring源码ZIP包：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202210201535468.png" alt="img"/>

或者直接在本地的git上拉取spring的源码：

```
git clone https://github.com/spring-projects/spring-framework.git
```

当我们成功从github拉取源码到本地之后，再通过checkout命令，切换到`v5.2.6.RELEASE`这个tag中：

```
git checkout v5.2.6.RELEASE
```

---

## Gradle的下载和环境配置

> 注意：采用gradle 5.6.4 版本直接构建成功，使用gradle 6.5 报gradle版本过高错误

我们可以通过链接 https://gradle.org/releases/ ，到Gradle官网看下：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202210201535469.png" alt="img"/>

我们选择下载`v5.6.4`这个版本，然后在解压到本地目录中：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202210201535470.png" alt="img"/>

然后，我们还需要在电脑高级系统设置配置下Gradle的环境变量，并将Gradle的bin目录添加到**Path**路径中：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202210201535471.png" alt="img"/>

```
%GRADLE_HOME%\bin
```

接着，我们打开命令窗口，输入命令“gradle -version”再回车，如果看到如下图一样的Gradle版本信息，就说明Gradle在本地安装成功了：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202210201535472.png" alt="img"/>

---

## 将Spring源码导入IDEA中

Spring源码导入IDEA导入IDEA之前，我们需要修改一下Spring源码中，关于构建Gradle的一些配置，方便后续Spring源码的构建。

我们在`spring-framework`源码目录下，可以找到`gradle.properties`、`settings.gradle`和`build.gradle`这三个配置文件，我们需要调整下这些配置的参数，方便Gradle编译Spring源码。

其中，`gradle.properties`配置文件调整后如下：

```
version=5.2.6.RELEASE
## Gradle编译时，会下载很多东西，占用内存较大，建议适当调大点
org.gradle.jvmargs=-Xmx2048M
## 开启Gradle的缓存
org.gradle.caching=true
## 开启Gradle并行编译
org.gradle.parallel=true
## 开启Gradle守护进程模式
org.gradle.daemon=true
```

而在`settings.gradle`配置文件中的`repositories`配置项，需要再添加阿里云的仓库地址，这样可以加快Gradle构建Spring源码的速度：

```
maven { url "https://maven.aliyun.com/repository/public" }
```

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202210201535473.png)

而在build.gradle配置文件中的repositores配置项中，也需要添加阿里云仓库的配置：

```
maven { url 'https://maven.aliyun.com/nexus/content/groups/public/' }
maven { url 'https://maven.aliyun.com/nexus/content/repositories/jcenter'}
```

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202210201535474.png" alt="img"/>

同时，我们需要注释以下的配置，因为在Gradle构建`v5.2.6.RELEASE`版本的Spring源码时，相应的jar包可能下载不到了，如果不注释掉的话可能会导致Gradle构建失败，这个坑大家需要注意下：

![img](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202210201535475.png)

最后，我们只需要将spring源码导入到IDEA中即可，Gradle默认就会启动后台的进程来构建Spring源码了。



---

## 出现错误

由于我原来采用Gradle版本是` v6.5`，在源码编译过程报如下错误，即Gradle版本过高

```
An exception occurred applying plugin request [id: 'com.gradle.build-scan', version: '3.2']
> Failed to apply plugin [id 'com.gradle.build-scan']
   > The build scan plugin is not compatible with Gradle 6.0 and later.
     Please use the Gradle Enterprise plugin instead.
```

---

## 解决办法

如下图所示，将Gradle改成`gradle-5.6.4`版本。

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202210201535476.png" alt="img"/>

注意：在IDEA中如果不是采用 `gradle-wrapper.properties` 中默认的gradle版本，则必须进行以下配置：选择`Specified location`，在后边选择gradle文件位置。

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202210201535477.png" alt="img" />

---

## 部署成功

最终部署成功如下图所示。

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Spring/202210201535478.png" alt="img" />
