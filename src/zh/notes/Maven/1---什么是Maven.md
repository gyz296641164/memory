---
title: Maven基础
category:
  - Maven
order: 1
date: 2023-11-29
---

<!-- more -->

## 什么是Maven

目前无论使用IDEA还是Eclipse等其他IDE，使用里面ANT工具。ANT工具帮助我们进行编译，打包运行等工作。

Apache基于ANT进行了升级，研发出了全新的自动化构建工具Maven。

Maven是Apache的一款开源的项目管理工具。

以后无论是普通javase项目还是javaee项目，我们都创建的是Maven项目。

Maven使用项目对象模型(POM-Project Object Model,项目对象模型)的概念，可以通过一小段描述信息来管理项目的构建，报告和文档的软件项目管理工具。在Maven中每个项目都相当于是一个对象，对象（项目）和对象（项目）之间是有关系的。关系包含了：依赖、继承、聚合，实现Maven项目可以更加方便的实现导jar包、拆分项目等效果。