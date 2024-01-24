---
title: Maven仓库
category:
  - Maven
order: 2
date: 2023-11-29
---

<!-- more -->

## IDEA默认整合了Maven

![image-20231129110821661](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Maven/202311/202311291108027.png)

## 下载地址

http://maven.apache.org/

![image-20231129110855914](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Maven/202311/202311291108293.png)

![image-20231129110907189](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Maven/202311/202311291109465.png)

## 目录结构

![image-20231129110919051](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Maven/202311/202311291109249.png)

bin：存放的是执行文件，命令 

在IDEA中可以直接集成Maven：

![image-20231129110945253](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Maven/202311/202311291109590.png)

conf目录：下面有一个非常重要的配置文件--》`settings.xml` ---》maven的核心配置文件/全局配置文件。

如果没有.m2目录 ，自己手动执行mvn命令：`mvn help:system`