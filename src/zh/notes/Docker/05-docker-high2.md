---
title: DockerFile & 网络
category:
  - Docker
date: 2023-02-27
---

<!-- more -->

## DockerFile解析

### 是什么

- Dockerfile是用来构建Docker镜像的文本文件，是由一条条构建镜像所需的指令和参数构成的脚本。

- 概述

  ![image-20220410230935990](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220410230935990.png)

- 官网： https://docs.docker.com/engine/reference/builder/

- 构建三步骤

  - 编写Dockerfile文件
  - docker build命令构建镜像
  - docker run依镜像运行容器实例

---

### DockerFile构建过程解析

Dockerfile内容基础知识

1. 每条保留字指令都必须为大写字母且后面要跟随至少一个参数
2. 指令按照从上到下，顺序执行
3. #表示注释
4. 每条指令都会创建一个新的镜像层并对镜像进行提交

Docker执行Dockerfile的大致流程

1. docker从基础镜像运行一个容器
2. 执行一条指令并对容器作出修改
3. 执行类似docker commit的操作提交一个新的镜像层
4. docker再基于刚提交的镜像运行一个新容器
5. 执行dockerfile中的下一条指令直到所有指令都执行完成

---

### 小总结

从应用软件的角度来看，Dockerfile、Docker镜像与Docker容器分别代表软件的三个不同阶段：

- Dockerfile是软件的原材料
- Docker镜像是软件的交付品
- Docker容器则可以认为是软件镜像的运行态，也即依照镜像运行的容器实例

Dockerfile面向开发，Docker镜像成为交付标准，Docker容器则涉及部署与运维，三者缺一不可，合力充当Docker体系的基石。

![image-20220410231425134](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220410231425134.png)

- **Dockerfile**：需要定义一个Dockerfile，Dockerfile定义了进程需要的一切东西。Dockerfile涉及的内容包括执行代码或者是文件、环境变量、依赖包、运行时环境、动态链接库、操作系统的发行版、服务进程和内核进程(当应用进程需要和系统服务和内核进程打交道，这时需要考虑如何设计namespace的权限控制)等等;
- **Docker镜像**：在用Dockerfile定义一个文件之后，docker build时会产生一个Docker镜像，当运行 Docker镜像时会真正开始提供服务;
- **Docker容器**：容器是直接提供服务的。

---

## DockerFile常用保留字指令

> 参考tomcat8的dockerfile入门：https://github.com/docker-library/tomcat

### FROM

基础镜像，当前新镜像是基于哪个镜像的，指定一个已经存在的镜像作为模板，第一条必须是from。

### MAINTAINER

镜像维护者的姓名和邮箱地址。

### RUN

- 容器构建时需要运行的命令

- 两种格式

  - shell格式

    ![image-20220410231836232](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220410231836232.png)

    RUN yum -y install vim

  - exec格式

    - ![image-20220410231905208](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220410231905208.png)
    - RUN是在 docker build时运行

### EXPOSE

当前容器对外暴露出的端口

### WORKDIR

指定在创建容器后，终端默认登陆的进来工作目录，一个落脚点

### USER

指定该镜像以什么样的用户去执行，如果都不指定，默认是root

### ENV

用来在构建镜像过程中设置环境变量。

- `ENV MY_PATH /usr/mytest`
  - 这个环境变量可以在后续的任何RUN指令中使用，这就如同在命令前面指定了环境变量前缀一样；也可以在其它指令中直接使用这些环境变量，
  - 比如：WORKDIR $MY_PATH

### ADD

将宿主机目录下的文件拷贝进镜像且会自动处理URL和解压tar压缩包。

### COPY

- 类似ADD，拷贝文件和目录到镜像中。 将从构建上下文目录中 <源路径> 的文件/目录复制到新的一层的镜像内的 <目标路径> 位置。
- COPY src dest
- COPY ["src", "dest"]
  - <src源路径>：源文件或者源目录
  - <dest目标路径>：容器内的指定路径，该路径不用事先建好，路径不存在的话，会自动创建。

### VOLUME

容器数据卷，用于数据保存和持久化工作。

### CMD

指定容器启动后的要干的事情。

![image-20220411105913577](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220411105913577.png)

**注意**

- Dockerfile 中可以有多个 CMD 指令，但**只有最后一个生效，CMD 会被 docker run 之后的参数替换**

- 参考官网Tomcat的dockerfile演示讲解

  ![image-20220411110025332](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220411110025332.png)

- 官网最后一行命令

  ![image-20220411110043990](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220411110043990.png)

它和前面RUN命令的区别

- CMD是在docker run 时运行。
- RUN是在 docker build时运行。

### ENTRYPOINT

**也是用来指定一个容器启动时要运行的命令**。

- 类似于 CMD 指令，但是ENTRYPOINT**不会被docker run后面的命令覆盖**， 而且这些命令行参数**会被当作参数送给 ENTRYPOINT 指令指定的程序**

**命令格式和案例说明**

- 命令格式：

  ![image-20220411110229914](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220411110229914.png)

- ENTRYPOINT可以和CMD一起用，一般是变参才会使用 CMD ，这里的 CMD 等于是在给 ENTRYPOINT 传参。

- 当指定了ENTRYPOINT后，CMD的含义就发生了变化，不再是直接运行其命令而是将CMD的内容作为参数传递给ENTRYPOINT指令，他两个组合会变成`<ENTRYPOINT><CMD>`

**案例如下：**

假设已通过 Dockerfile 构建了 nginx:test 镜像：

![image-20220411110406059](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220411110406059.png)

| 是否传参         | 按照dockerfile编写执行         | 传参运行                                     |
| ---------------- | ------------------------------ | -------------------------------------------- |
| Docker命令       | docker run nginx:test          | docker run nginx:test -c /etc/nginx/new.conf |
| 衍生出的实际命令 | nginx -c /etc/nginx/nginx.conf | nginx -c /etc/nginx/new.conf                 |

**优点**

在执行docker run的时候可以指定 ENTRYPOINT 运行所需的参数。

**注意**

**如果 Dockerfile 中如果存在多个 ENTRYPOINT 指令，仅最后一个生效**。

### 小总结

![image-20220411110550617](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220411110550617.png)

---

## 案例

### 自定义镜像mycentosjava8

> **要求**

- Centos7镜像具备vim+ifconfig+jdk8

- JDK的下载镜像地址

  - 官网（下载太慢）：https://www.oracle.com/java/technologies/downloads/#java8

  - 国内最全的Java JDK镜像站：http://www.sousou88.com/spec/java.html

    ![image-20220412233805384](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220412233805384.png)

- 编写Dockerfile文件(大写字母D)

  ![image-20220412233900703](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220412233900703.png)

  ```
  FROM centos:7
  MAINTAINER gong_yuzhuo
   
  ENV MYPATH /usr/local
  WORKDIR $MYPATH
   
  #安装vim编辑器
  RUN yum -y install vim
  #安装ifconfig命令查看网络IP
  RUN yum -y install net-tools
  #安装java8及lib库
  RUN yum -y install glibc.i686
  RUN mkdir /usr/local/java
  #ADD 是相对路径jar,把jdk-8u171-linux-x64.tar.gz添加到容器中,安装包必须要和Dockerfile文件在同一位置
  ADD jdk-8u171-linux-x64.tar.gz /usr/local/java/
  #配置java环境变量
  ENV JAVA_HOME /usr/local/java/jdk1.8.0_171
  ENV JRE_HOME $JAVA_HOME/jre
  ENV CLASSPATH $JAVA_HOME/lib/dt.jar:$JAVA_HOME/lib/tools.jar:$JRE_HOME/lib:$CLASSPATH
  ENV PATH $JAVA_HOME/bin:$PATH
   
  EXPOSE 80
   
  CMD echo $MYPATH
  CMD echo "success--------------ok"
  CMD /bin/bash
  ```

- 构建：`docker build -t 新镜像名字:TAG .`
  - docker build -t centosjava8:1.5 .
  - 注意，上面TAG后面有个空格，有个点
- 运行：`docker run -it 新镜像名字:TAG`
  - `docker run -it centosjava8:1.5 /bin/bash`
  - ![image-20220412234232565](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220412234232565.png)

> **再体会下UnionFS（联合文件系统）**

UnionFS（联合文件系统）：Union文件系统（UnionFS）是一种分层、轻量级并且高性能的文件系统，它支持对文件系统的修改作为一次提交来一层层的叠加，同时可以将不同目录挂载到同一个虚拟文件系统下(unite several directories into a single virtual filesystem)。Union 文件系统是 Docker 镜像的基础。镜像可以通过分层来进行继承，基于基础镜像（没有父镜像），可以制作各种具体的应用镜像。

特性：一次同时加载多个文件系统，但从外面看起来，只能看到一个文件系统，联合加载会把各层文件系统叠加起来，这样最终的文件系统会包含所有底层的文件和目录。

---

## Docker微服务实战

### 通过IDEA新建一个普通微服务模块

**建Module**：docker_boot

**改POM**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">

    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.1.3.RELEASE</version>
        <relativePath/> <!-- lookup parent from repository -->
    </parent>

    <groupId>com.gyz.docker</groupId>
    <artifactId>docker_boot</artifactId>
    <version>0.0.1-SNAPSHOT</version>

    <properties>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <maven.compiler.source>1.8</maven.compiler.source>
        <maven.compiler.target>8</maven.compiler.target>
        <junit.version>4.12</junit.version>
        <log4j.version>1.2.17</log4j.version>
        <lombok.version>1.16.18</lombok.version>
        <mysql.version>5.1.47</mysql.version>
        <druid.version>1.1.16</druid.version>
        <mapper.version>4.1.5</mapper.version>
        <mybatis.spring.boot.version>1.3.0</mybatis.spring.boot.version>
    </properties>

    <dependencies>
        <!--SpringBoot通用依赖模块-->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
        <!--test-->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-resources-plugin</artifactId>
                <version>3.1.0</version>
            </plugin>
        </plugins>
    </build>

</project>
```

**写YML**

```yaml
server.port=6001
```

**主启动**

```java
package com.gyz.docker;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * @Description:
 * @Author: gong_yuzhuo
 * @Date: 2022/4/13
 */
@SpringBootApplication
public class DockerBootApplication {
    public static void main(String[] args) {
        SpringApplication.run(DockerBootApplication.class, args);
    }
}

```

**业务类**

```java
package com.gyz.docker.order;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * @Description:
 * @Author: gong_yuzhuo
 * @Date: 2022/4/13
 */
@RestController
public class OrderController {

    @Value("${server.port}")
    private String port;

    @RequestMapping("/order/docker")
    public String helloDocker() {
        return "hello docker" + "\t" + port + "\t" + UUID.randomUUID().toString();
    }

    @RequestMapping(value = "/order/index", method = RequestMethod.GET)
    public String index() {
        return "服务端口号: " + "\t" + port + "\t" + UUID.randomUUID().toString();
    }

}

```

---

### 通过Dockerfile发布微服务部署到docker容器

**IDEA工具里面搞定微服务jar包**

`docker_boot-0.0.1-SNAPSHOT.jar`

![image-20220413155428360](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220413155428360.png)

**编写Dockerfile内容**

```
# 基础镜像使用java
FROM java:8
# 作者
MAINTAINER gongyuzhuo
# VOLUME 指定临时文件目录为/tmp，在主机/var/lib/docker目录下创建了一个临时文件并链接到容器的/tmp
VOLUME /tmp
# 将jar包添加到容器中并更名为gongyuzhuo_docker.jar
ADD docker_boot-0.0.1-SNAPSHOT.jar gongyuzhuo_docker.jar
# 运行jar包
RUN bash -c 'touch /gongyuzhuo_docker.jar'
ENTRYPOINT ["java","-jar","/gongyuzhuo_docker.jar"]
#暴露6001端口作为微服务
EXPOSE 6001
```

**将微服务jar包和Dockerfile文件上传到同一个目录下/mydocker**

![image-20220413155554741](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220413155554741.png)

**构建镜像**

`docker build -t gongyuzhuo_docker:1.6 .`

![image-20220413155658759](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220413155658759.png)

**运行容器**

`docker run -d -p 6001:6001 gongyuzhuo_docker:1.6`

![image-20220413155748199](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220413155748199.png)

**访问测试**

![image-20220413155844472](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220413155844472.png)

---

## Docker网络

### 是什么

> **docker不启动，默认网络情况**

先停止docker

- 执行 `systemctl stop docker` 后提示“Warning: Stopping docker.service, but it can still be activated by: docker.socket”
- 这是docker在关闭状态下被访问自动唤醒机制，即这时再执行任意docker命令会直接启动
- 希望docker被访问自动唤醒，执行 `systemctl stop docker` 后再执行`systemctl stop docker.socket`即可

默认网络情况

- ens33
- lo
- virbr0

![image-20220414143957140](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220414143957140.png)

在CentOS7的安装过程中如果有选择相关虚拟化的的服务安装系统后，启动网卡时会发现有一个以网桥连接的私网地址的**virbr0**网卡(virbr0网卡：它还有一个固定的**默认IP地址192.168.122.1**)，是做虚拟机网桥的使用的，其作用是为连接其上的虚机网卡提供 NAT访问外网的功能。

我们之前学习Linux安装，勾选安装系统的时候附带了libvirt服务才会生成的一个东西，如果不需要可以直接将libvirtd服务卸载：`yum remove libvirt-libs.x86_64`

> **docker启动后，网络情况**

会产生一个名为**docker0**的虚拟网桥。

![image-20220414144408701](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220414144408701.png)

查看docker网络模式命令：docker network ls

![image-20220414144539096](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220414144539096.png)

默认创建3大网络模式。

---

### 常用基本命令

> **更多参考**：https://m.php.cn/manual/view/36067.html

**常用命令**

| 命令                      | 描述                         |
| :------------------------ | :--------------------------- |
| docker network connect    | 将容器连接到网络             |
| docker network create     | 创建一个网络                 |
| docker network disconnect | 从网络断开容器               |
| docker network inspect    | 显示一个或多个网络的详细信息 |
| docker network ls         | 列出网络                     |
| docker network prune      | 删除所有未使用的网络         |
| docker network rm         | 删除一个或多个网络           |

**查看网络**

```
docker network ls
```

**查看网络源数据**

```
docker network inspect  XXX网络名字
```

**删除网络**

```
docker network rm XXX网络名字
```

**案例**

`docker network create -d bridge my-bridge-network`

![image-20220414150050044](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220414150050044.png)

---

### 能干嘛

- 容器间的互联和通信以及端口映射

- 容器IP变动时候可以通过服务名直接网络通信而不受到影响

---

### 网络模式

#### 总体介绍

![image-20220414151213376](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220414151213376.png)

- bridge模式：使用--network  bridge指定，默认使用docker0
- host模式：使用--network host指定
- none模式：使用--network none指定
- container模式：使用--network container:NAME或者容器ID指定

---

#### 容器实例内默认网络IP生产规则

**说明**

- 1、先启动两个ubuntu容器实例

  ![image-20220414153917515](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220414153917515.png)

- 2、docker inspect 容器ID or 容器名字

- u1容器

  ![image-20220414154325265](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220414154325265.png)

  u2容器

  ![image-20220414154530472](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220414154530472.png)

  关闭u2实例，新建u3，查看ip变化

  ![image-20220414154835337](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220414154835337.png)

**结论**

docker容器内部的ip是有可能会发生改变的。

---

#### 案例说明

> **bridge**

- Docker 服务默认会创建一个 docker0 网桥（其上有一个 docker0 内部接口），该桥接网络的名称为docker0，它在内核层连通了其他的物理或虚拟网卡，这就将所有容器和本地主机都放到**同一个物理网络**。Docker 默认指定了 docker0 接口 的 IP 地址和子网掩码，**让主机和容器之间可以通过网桥相互通信**。

- 查看 bridge 网络的详细信息，并通过 grep 获取名称项

  ```
  docker network inspect bridge | grep name
  ```

  ![image-20220414155223131](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220414155223131.png)

- ifconfig

  ![image-20220414155304974](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220414155304974.png)

**案例**

- 说明

  - Docker使用Linux桥接，在宿主机虚拟一个Docker容器网桥(docker0)，Docker启动一个容器时会根据Docker网桥的网段分配给容器一个IP地址，称为**Container-IP**，同时Docker网桥是每个容器的默认网关。因为在同一宿主机内的容器都接入同一个网桥，这样容器之间就能够通过容器的Container-IP直接通信。
  - docker run 的时候，没有指定network的话默认使用的网桥模式就是bridge，使用的就是docker0。在宿主机ifconfig,就可以看到docker0和自己create的network(后面讲)eth0，eth1，eth2……代表网卡一，网卡二，网卡三……，lo代表127.0.0.1，即localhost，inet addr用来表示网卡的IP地址
  - 网桥docker0创建一对对等虚拟设备接口一个叫**veth**，另一个叫**eth0**，成对匹配。
    - 整个宿主机的网桥模式都是docker0，类似一个交换机有一堆接口，每个接口叫veth，在本地主机和容器内分别创建一个虚拟接口，并让他们彼此联通（这样一对接口叫veth pair）；
    - 每个容器实例内部也有一块网卡，每个接口叫eth0；
    - docker0上面的每个veth匹配某个容器实例内部的eth0，两两配对，一 一匹配。

- 通过上述，将宿主机上的所有容器都连接到这个内部网络上，两个容器在同一个网络下,会从这个网关下各自拿到分配的ip，此时两个容器的网络是互通的。

  ![image-20220414155956271](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220414155956271.png)

**代码**

- 没有billygoo/tomcat8-jdk8镜像的先拉取：`docker pull billygoo/tomcat8-jdk8`
- docker run -d -p 8081:8080 --name tomcat81 billygoo/tomcat8-jdk8
- docker run -d -p 8082:8080 --name tomcat82 billygoo/tomcat8-jdk8
- 两两匹配验证
  - ![image-20220414171439647](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220414171439647.png)
  - ![image-20220414171552210](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220414171552210.png)

> **host**

- 直接使用宿主机的 IP 地址与外界进行通信，不再需要额外进行NAT 转换。

- 容器将**不会获得**一个独立的Network Namespace， 而是和宿主机共用一个Network Namespace。**容器将不会虚拟出自己的网卡而是使用宿主机的IP和端口**。

  ![image-20220414171915922](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220414171915922.png)

- 代码

  docker run -d -p 8083:8080 --network host --name tomcat83 billygoo/tomcat8-jdk8

  ![image-20220414191254297](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220414191254297.png)

  问题：

  - docke启动时总是遇见标题中的警告

  原因：

  - docker启动时指定--network=host或-net=host，如果还指定了-p映射端口，那这个时候就会有此警告，并且通过-p设置的参数将不会起到任何作用，端口号会以主机端口号为主，重复时则递增。

  解决:

  - 解决的办法就是使用docker的其他网络模式，例如--network=bridge，这样就可以解决问题，或者直接无视。

  正确：

  - docker run -d --network host --name tomcat84 billygoo/tomcat8-jdk8

  - ![image-20220414191540126](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220414191540126.png)

  - 无之前的配对显示了，看容器实例内部

    ![image-20220414191647011](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220414191647011.png)

  - 没有设置-p的端口映射了，如何访问启动的tomcat83？

    - http://宿主机IP:8080/
    - 在CentOS里面用默认的火狐浏览器访问容器内的tomcat83看到访问成功，因为此时容器的IP借用主机的，所以容器共享宿主机网络IP，这样的好处是外部主机与容器可以直接通信。

> **none**

在none模式下，并不为Docker容器进行任何网络配置。 也就是说，这个Docker容器没有网卡、IP、路由等信息，只有一个lo需要我们自己为Docker容器添加网卡、配置IP等。

禁用网络功能，只有lo标识(就是127.0.0.1表示本地回环)。

**案例**

`docker run -d -p 8084:8080 --network none --name tomcat85 billygoo/tomcat8-jdk8`

![image-20220414200339849](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220414200339849.png)

在容器外部查看

![image-20220414200429657](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220414200429657.png)

> **container**

**container⽹络模式**

**新建的容器和已经存在的一个容器共享一个网络ip配置而不是和宿主机共享**。新创建的容器不会创建自己的网卡，配置自己的IP，而是和一个指定的容器共享IP、端口范围等。同样，两个容器除了网络方面，其他的如文件系统、进程列表等还是隔离的。

![image-20220414202557638](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220414202557638.png)

**案例1**

- docker run -d -p 8085:8080 --name tomcat86 billygoo/tomcat8-jdk8
- docker run -d -p 8087:8080 --network container:tomcat86 --name tomcat87 billygoo/tomcat8-jdk8
- ![image-20220414203128520](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220414203128520.png)
- 相当于tomcat87和tomcat86公用同一个ip同一个端口，导致端口冲突本案例用tomcat演示不合适。。。演示坑。换一个镜像给大家演示。

**案例2**

Alpine操作系统是一个面向安全的轻型 Linux发行版。

- Alpine Linux 是一款独立的、非商业的通用 Linux 发行版，专为追求安全性、简单性和资源效率的用户而设计。 
- 可能很多人没听说过这个 Linux 发行版本，但是经常用 Docker 的朋友可能都用过，因为他小，简单，安全而著称，所以作为基础镜像是非常好的一个选择，可谓是麻雀虽小但五脏俱全，镜像非常小巧，不到 6M的大小，所以特别适合容器打包。

演示

- `docker run -it --name alpine1 alpine /bin/sh`
- `docker run -it --network container:alpine1 --name alpine2 alpine /bin/sh`
- 运行结果，验证共用搭桥
  - ![image-20220414204604771](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220414204604771.png)

- 假如此时关闭alpine1，再看看alpine2。发现29: eth0@if30: 消失了。

  ![image-20220414204733595](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220414204733595.png)



> **自定义网络**

**过时的link**

![image-20220414205636480](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220414205636480.png)

**案例**

- before

  - docker run -d -p 8081:8080   --name tomcat81 billygoo/tomcat8-jdk8

  - docker run -d -p 8082:8080   --name tomcat82 billygoo/tomcat8-jdk8

  - 上述成功启动并用docker exec进入各自容器实例内部

  - 按照IP地址ping是OK的

    ![image-20220414210153070](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220414210153070.png)

    ![image-20220414210236590](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220414210236590.png)

  - 按照服务名ping不同

    ![image-20220414210327119](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220414210327119.png)

- after

  - 自定义桥接网络,自定义网络默认使用的是**桥接网络bridge**

  - 新建自定义网络：docker network create -d bridge gyz-network

    ![image-20220414210937966](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220414210937966.png)

  - 新建容器加入上一步新建的自定义网络

    - docker run -d -p 8088:8080 --network gyz-network --name tomcat88 billygoo/tomcat8-jdk8
    - docker run -d -p 8089:8080 --network gyz-network --name tomcat89 billygoo/tomcat8-jdk8

  - 互相ping测试

    ![image-20220414211106316](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220414211106316.png)

    ![image-20220414211136834](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220414211136834.png)

**问题结论**

- **自定义网络本身就维护好了主机名和ip的对应关系（ip和域名都能通）。**

---

## Docker平台架构图解

### 整体架构

![image-20220414211351620](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220414211351620.png)

### 整体说明

从其架构和运行流程来看，Docker 是一个 C/S 模式的架构，后端是一个松耦合架构，众多模块各司其职。

Docker 运行的基本流程为：

1. 用户是使用 **Docker Client** 与 **Docker Daemon** 建立通信，并发送请求给后者。
2. Docker Daemon 作为 Docker 架构中的主体部分，首先提供 Docker Server 的功能使其可以接受 Docker Client 的请求。
3. **Docker Engine** 执行 Docker 内部的一系列工作，每一项工作都是以一个 Job 的形式的存在。
4. Job 的运行过程中，当需要容器镜像时，则从 **Docker Registry** 中下载镜像，并通过镜像管理驱动 **Graph driver**将下载镜像以Graph的形式存储。
5. 当需要为 Docker 创建网络环境时，通过网络管理驱动 **Network driver** 创建并配置 Docker 容器网络环境。
6. 当需要限制 Docker 容器运行资源或执行用户指令等操作时，则通过 **Execdriver** 来完成。
7. **Libcontainer**是一项独立的容器管理包，Network driver以及Exec driver都是通过Libcontainer来实现具体对容器进行的操作。
