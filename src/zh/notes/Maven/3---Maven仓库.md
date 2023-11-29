---
title: Maven仓库
category:
  - Maven
order: 3
date: 2023-11-29
---

<!-- more -->

## Maven仓库概念

Maven仓库是基于简单文件系统存储的，集中化管理Java API资源（构件）的一个服务。

仓库中的任何一个构件都有其唯一的坐标，根据这个**坐标**可以定义其在仓库中的唯一存储路径。得益于 Maven 的坐标机制，任何 Maven项目使用任何一个构件的方式都是完全相同的。

Maven 可以在某个位置统一存储所有的 Maven 项目共享的构件，这个统一的位置就是仓库，项目构建完毕后生成的构件也可以安装或者部署到仓库中，供其它项目使用。

对于Maven来说，仓库分为两类：本地仓库和远程仓库。

---

## 远程仓库

不在本机中的一切仓库，都是远程仓库：分为中央仓库 和  本地私服仓库

远程仓库指通过各种协议如file://和http://访问的其它类型的仓库。这些仓库可能是第三方搭建的真实的远程仓库，用来提供他们的构件下载（例如`repo.maven.apache.org`和`uk.maven.org`是Maven的中央仓库）。其它“远程”仓库可能是你的公司拥有的建立在文件或HTTP服务器上的内部仓库(不是Apache的那个中央仓库，而是你们**公司的私服**，你们自己在局域网搭建的maven仓库)，用来在开发团队间共享私有构件和管理发布的。

默认的远程仓库使用的Apache提供的中央仓库：https://mvnrepository.com/

![image-20231129111341878](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Maven/202311/202311291113275.png)

![image-20231129111349824](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Maven/202311/202311291113219.png)

---

## 本地仓库

本地仓库指本机的一份拷贝，用来缓存远程下载，包含你尚未发布的临时构件。

---

## 仓库配置

### 配置本地仓库

在`settings.xml`文件中配置本地仓库

本地仓库是开发者本地电脑中的一个目录，用于缓存从远程仓库下载的构件。默认的本地仓库是`${user.home}/.m2/repository`。用户可使用`settings.xml`文件修改本地仓库。具体内容如下：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<settings xmlns="http://maven.apache.org/SETTINGS/1.0.0"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.0.0 http://maven.apache.org/xsd/settings-1.0.0.xsd">
  <!-- 本地仓库配置 -->
  <localRepository>具体本地仓库位置</localRepository>
  <!-- 省略，具体信息参考后续内容。 -->
</settings>
```

### 配置镜像仓库

在`settings.xml`文件中配置镜像仓库

如果仓库A可以提供仓库B存储的所有内容，那么就可以认为A是B的一个镜像。例如：在国内直接连接中央仓库下载依赖，由于一些特殊原因下载速度非常慢。这时，我们可以使用阿里云提供的镜像http://maven.aliyun.com/nexus/content/groups/public/来替换中央仓库http://repol.maven.org/maven2/。修改maven的`setting.xml`文件，具体内容如下：


```xml
  <mirror> 
            <!-- 指定镜像ID（可自己改名） -->
            <id>nexus-aliyun</id> 
            <!-- 匹配中央仓库（阿里云的仓库名称，不可以自己起名，必须这么写）-->
            <mirrorOf>central</mirrorOf>
            <!-- 指定镜像名称（可自己改名）  -->   
            <name>Nexus aliyun</name> 
            <!-- 指定镜像路径（镜像地址） -->
            <url>http://maven.aliyun.com/nexus/content/groups/public</url> 
    </mirror>
```

### 仓库优先级问题

优先级别：

![image-20231129111634733](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Maven/202311/202311291116981.png)