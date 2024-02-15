---
title: 8_Maven工程关系
category:
  - Maven
order: 8
date: 2023-11-29
---

<!-- more -->


**POM模式-Maven工程关系**

---

## 1、开篇

Maven工具基于POM（Project Object Model，项目对象模型）模式实现的。在Maven中每个项目都相当于是一个对象，对象（项目）和对象（项目）之间是有关系的。关系包含了：依赖、继承、聚合，实现Maven项目可以更加方便的实现导jar包、拆分项目等效果。

---

## 2、依赖

### 2.1 概述

#### 2.1.1 依赖关系

即A工程开发或运行过程中需要B工程提供支持，则代表A工程依赖B工程。

在这种情况下，需要在A项目的pom.xml文件中增加下属配置定义依赖关系。

![image-20231129132308099](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Maven/202311/202311291323321.png)

通俗理解：就是导jar包。

B工程可以是自己的项目打包后的jar包，也可以是中央仓库的jar包。

#### 2.1.2 如何注入依赖呢

在pom.xml文件 根元素project下的 dependencies标签中，配置依赖信息，内可以包含多个 dependence元素，以声明多个依赖。每个依赖dependence标签都应该包含以下元素：`groupId`, `artifactId`, `version` : 依赖的基本坐标， 对于任何一个依赖来说，基本坐标是最重要的， Maven根据坐标才能找到需要的依赖。

![image-20231129132350657](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Maven/202311/202311291323952.png)

#### 2.1.3 依赖的好处

省去了程序员手动添加jar包的操作，省事！！

可以帮我们解决jar包冲突问题：

![image-20231129132408541](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Maven/202311/202311291324876.png)

### 2.2 特性_依赖的传递性

传递性依赖是Maven2.0的新特性。假设你的项目依赖于一个库，而这个库又依赖于其他库。你不必自己去找出所有这些依赖，你只需要加上你直接依赖的库，Maven会隐式的把这些库间接依赖的库也加入到你的项目中。这个特性是靠解析从远程仓库中获取的依赖库的项目文件实现的。一般的，这些项目的所有依赖都会加入到项目中，或者从父项目继承，或者通过传递性依赖。

如果A依赖了B，那么C依赖A时会自动把A和B都导入进来。

![image-20231129132518472](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Maven/202311/202311291325698.png)

创建A项目后，选择IDEA最右侧Maven面板lifecycle，双击install后就会把项目安装到本地仓库中，其他项目就可以通过坐标引用此项目。

> **案例**

项目1：MavenDemo项目依赖了Mybatis的内容：

![image-20231129132541533](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Maven/202311/202311291325892.png)

注意：请将项目1打包为jar包---》重新打包

再创建项目2，让项目2依赖项目1，

![image-20231129132612125](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Maven/202311/202311291326423.png)

从上面可以证明：项目2依赖项目1，项目1依赖Mybatis工程，--》传递性---》项目2可以直接使用Mybatis工程

### 2.3 原则_两个原则

#### 2.3.1 第一原则：最短路径优先原则

“最短路径优先”意味着项目依赖关系树中路径最短的版本会被使用。

例如，假设A、B、C之间的依赖关系是A->B->C->D(2.0)  和A->E->(D1.0)，那么D(1.0)会被使用，因为A通过E到D的路径更短。

#### 2.3.2 第二原则：最先声明原则

依赖路径长度是一样的的时候，第一原则不能解决所有问题，比如这样的依赖关系：A–>B–>Y(1.0)，A–>C–>Y(2.0)，Y(1.0)和Y(2.0)的依赖路径长度是一样的，都为2。那么到底谁会被解析使用呢？在maven2.0.8及之前的版本中，这是不确定的，但是maven2.0.9开始，为了尽可能避免构建的不确定性，maven定义了依赖调解的第二原则：第一声明者优先。在依赖路径长度相等的前提下，在POM中依赖声明的顺序决定了谁会被解析使用。顺序最靠前的那个依赖优胜。

### 2.4 排除依赖

**exclusions**

用来排除传递性依赖 其中可配置多个exclusion标签，每个exclusion标签里面对应的有groupId, artifactId, version三项基本元素。注意：不用写版本号。

比如：A--->B--->C (Mybatis.jar) 排除C中的Mybatis.jar 

![image-20231129133626419](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Maven/202311/202311291336732.png)

### 2.5 依赖范围

依赖范围就决定了你依赖的坐标 在什么情况下有效，什么情况下无效：

#### 2.5.1 compile

这是默认范围。如果没有指定，就会使用该依赖范围。表示该依赖在编译和运行时都生效。

![image-20231129133834975](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Maven/202311/202311291338200.png)

#### 2.5.2 provided

已提供依赖范围。使用此依赖范围的Maven依赖。典型的例子是servlet-api，编译和测试项目的时候需要该依赖，但在运行项目的时候，由于容器已经提供，就不需要Maven重复地引入一遍(如：servlet-api)

（自己总结：编译和运行的时候我们手动导入servlet-api依赖，但是在运行时，Tomcat本身内置了servlet-api依赖，如果我们手动导入的依赖也被Maven引入，此时有两个servlet-api依赖，Tomcat不知道用哪个，导致错误出现。所以此时配置`<scope>`provided`</scope>`依赖范围，Tomcat就会直接使用内置servlet-api依赖运行服务）

#### 2.5.3 runtime

runtime范围表明编译时不需要生效，而**只在运行时生效**。典型的例子是JDBC驱动实现，项目主代码的编译只需要JDK提供的JDBC接口，只有在执行测试或者运行项目的时候才需要实现上述接口的具体JDBC驱动。

#### 2.5.4 system

系统范围与provided类似，不过你必须显式指定一个**本地系统路径的JAR**，此类依赖应该一直有效，Maven也不会去仓库中寻找它。但是，使用system范围依赖时必须通过**systemPath**元素显式地指定依赖文件的路径。

(自己总结：就是有一个systemPath路径，里面放着依赖，使用时去这里找就行)

#### 2.5.5 test

test范围表明使用此依赖范围的依赖，只在**编译测试代码和运行测试的时候需要**，应用的正常运行不需要此类依赖。典型的例子就是JUnit，它只有在编译测试代码及运行测试的时候才需要。Junit的jar包就在测试阶段用就行了，你导出项目的时候没有必要把junit的东西到处去了就，所在在junit坐标下加入scope-test

#### 2.5.6 Import

import范围只适用于pom文件中的`<dependencyManagement>`部分。表明指定的POM必须使用`<dependencyManagement>`部分的依赖。

注意：import只能用在dependencyManagement的scope里。

(自己总结：如果父工程加入score-import 相当于强制的指定了版本号，子工程在使用父工程依赖时，依赖版本号不可修改，强制使用父工程中定义的)

定义一个父工程--》POM工程：

![image-20231129140756138](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Maven/202311/202311291407490.png)

注意：工程1要打成自己的jar包

定义一个子工程：

![image-20231129140816320](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Maven/202311/202311291408681.png)

如果父工程中加入score-import 相当于强制的指定了版本号：

![image-20231129140839559](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Maven/202311/202311291408804.png)

---

## 3、继承

如果A工程继承B工程，则代表A工程默认依赖B工程依赖的所有资源，且可以应用B工程中定义的所有资源信息。

被继承的工程（B工程）只能是POM工程。

注意：在父项目中放在`<dependencyManagement>`中的内容时不被子项目继承，不可以直接使用

放在`<dependencyManagement>`中的内容主要目的是进行版本管理。里面的内容在子项目中依赖时坐标只需要填写

 `<group id>`和`<artifact id>`即可。（注意：如果子项目不希望使用父项目的版本，可以明确配置version）。

父工程是一个POM工程：

![image-20231129141006542](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Maven/202311/202311291410883.png)

创建子工程：

![image-20231129141021659](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Maven/202311/202311291410992.png)

本质上：POM文件的继承 

---

## 4、聚合

当我们开发的工程拥有2个以上模块的时候，每个模块都是一个独立的功能集合。比如某大学系统中拥有搜索平台，学习平台，考试平台等。开发的时候每个平台都可以独立编译，测试，运行。这个时候我们就需要一个聚合工程。

在创建聚合工程的过程中，总的工程必须是一个POM工程（Maven Project）（聚合项目必须是一个pom类型的项目，jar项目war项目是没有办法做聚合工程的），各子模块可以是任意类型模块（Maven Module）。

**前提：继承**

聚合包含了继承的特性

聚合时多个项目的本质还是一个项目。这些项目被一个大的父项目包含。且这时父项目类型为pom类型。同时在父项目的pom.xml中出现`<modules>`表示包含的所有子模块。

总项目：一般总项目：POM项目

![image-20231129141453851](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Maven/202311/202311291414203.png)

具体模块：

![image-20231129141517511](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Maven/202311/202311291415856.png)