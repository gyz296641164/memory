---
title: 10_Maven常见命令
category:
  - Maven
order: 10
date: 2023-11-29
---

<!-- more -->

Maven的命令非常多，我们只是讲解常用的几个：（所有命令都可以在控制台运行的）

## install

本地安装， 包含编译，打包，安装到本地仓库

编译 - javac

打包 - jar， 将java代码打包为jar文件

安装到本地仓库 - 将打包的jar文件，保存到本地仓库目录中。

## clean

清除已编译信息。

删除工程中的target目录。

![image-20231129142449081](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Maven/202311/202311291424346.png)

## compile

只编译。 javac命令

## package

打包。 包含编译，打包两个功能。

install和package的区别：

- package命令完成了项目编译、单元测试、打包功能，但没有把打好的可执行jar包（war包或其它形式的包）布署到本地maven仓库和远程maven私服仓库
- install命令完成了项目编译、单元测试、打包功能，同时把打好的可执行jar包（war包或其它形式的包）布署到本地maven仓库，但没有布署到远程maven私服仓库