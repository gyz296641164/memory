---
title: JDK配置
category:
  - Maven
order: 4
date: 2023-11-29
---

<!-- more -->

当你的idea中有多个jdk的时候，就需要指定你编译和运行的jdk，

在`settings.xml`中配置：

```xml
	<profile>
                <!-- settings.xml中的id不能随便起的 -->
                <!-- 告诉maven我们用jdk1.8 -->
                <id>jdk-1.8</id>
                <!-- 开启JDK的使用 -->
                <activation>
                      <activeByDefault>true</activeByDefault>
                      <jdk>1.8</jdk>
                </activation>
                <properties>
                      <!-- 配置编译器信息 -->
                      <maven.compiler.source>1.8</maven.compiler.source>
                      <maven.compiler.target>1.8</maven.compiler.target>
                      <maven.compiler.compilerVersion>1.8</maven.compiler.compilerVersion>
                </properties>
    </profile>
```

配置的前提是你的idea中要有1.8的jdk

**总结**

在settings.xml中，配置了三个信息：

1. 本地仓库
2. 镜像仓库
3. JDK