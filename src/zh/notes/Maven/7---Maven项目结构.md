---
title: Maven项目结构
category:
  - Maven
order: 7
date: 2023-11-29
---

<!-- more -->

## 标准目录结构

![image-20231129112657274](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Maven/202311/202311291126517.png)

### src/main/java  

这个目录下储存java源代码

### src/main/resources 

储存主要的资源文件。比如xml配置文件和properties文件

### src/test/java 

储存测试用的类，比如JUNIT的测试一般就放在这个目录下面

因为测试类本身实际是不属于项目的，所以放在任何一个包下都显得很尴尬，所以maven专门创建了一个测试包

用于存放测试的类

### src/test/resources 

可以自己创建你，储存测试环境用的资源文件

### src

包含了项目所有的源代码和资源文件，以及其他项目相关的文件。

### target 

编译后内容放置的文件夹

### pom.xml 

是Maven的基础配置文件。配置项目和项目之间关系，包括配置依赖关系等等

---

## 结构图

```
--MavenDemo 项目名
  --.idea 项目的配置，自动生成的，无需关注。
  --src
    -- main 实际开发内容
         --java 写包和java代码，此文件默认只编译.java文件
         --resource 所有配置文件。最终编译把配置文件放入到classpath中。
    -- test  测试时使用，自己写测试类或junit工具等
        --java 储存测试用的类
  pom.xml 整个maven项目所有配置内容。
```

注意：目录名字不可以随便改，因为maven进行编译或者jar包生成操作的时候，是根据这个目录结构来找的，你若轻易动，那么久找不到了。

![image-20231129112850242](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Maven/202311/202311291128574.png)