---
title: Docker简介 & 安装 & 常用命令
category:
  - Docker
date: 2023-02-27
---

<!-- more -->


## 1. Docker简介

### 1.1. 是什么

#### 1.1.1. 为什么会有docker出现

假定您在开发一个尚硅谷的谷粒商城，您使用的是一台笔记本电脑而且您的开发环境具有特定的配置。其他开发人员身处的环境配置也各有不同。您正在开发的应用依赖于您当前的配置且还要依赖于某些配置文件。此外，您的企业还拥有标准化的测试和生产环境，且具有自身的配置和一系列支持文件。您希望尽可能多在本地模拟这些环境而不产生重新创建服务器环境的开销。

请问？您要如何确保应用能够在这些环境中运行和通过质量检测？并且在部署过程中不出现令人头疼的版本、配置问题，也无需重新编写代码和进行故障修复？

- 答案就是使用容器。Docker之所以发展如此迅速，也是因为它对此给出了一个标准化的解决方案-----**系统平滑移植，容器虚拟化技术**。

- 环境配置相当麻烦，换一台机器，就要重来一次，费力费时。很多人想到，能不能从根本上解决问题，软件可以带环境安装？也就是说，**安装的时候，把原始环境一模一样地复制过来。开发人员利用 Docker 可以消除协作编码时“在我的机器上可正常工作”的问题**。

![image-20220401231243484](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/image-20220401231243484.png)

Docker的出现使得Docker得以打破过去「程序即应用」的观念。透过镜像(images)将作业系统核心除外，运作应用程式所需要的系统环境，由下而上打包，达到应用程式跨平台间的无缝接轨运作。

#### 1.1.2. docker理念

Docker是基于Go语言实现的云开源项目。Docker的主要目标是“Build，Ship and Run Any App,Anywhere”，也就是通过对应用组件的封装、分发、部署、运行等生命周期的管理，使用户的APP（可以是一个WEB应用或数据库应用等等）及其运行环境能够做到“**一次镜像，处处运行**”。

![image-20220401231638483](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/image-20220401231638483.png)

Linux容器技术的出现就解决了这样一个问题，而 Docker 就是在它的基础上发展过来的。将应用打成镜像，通过镜像成为运行在Docker容器上面的实例，而 Docker容器在任何操作系统上都是一致的，这就实现了跨平台、跨服务器。**只需要一次配置好环境，换到别的机子上就可以一键部署好**，大大简化了操作。

> **一句话**

**解决了运行环境和配置问题的软件容器， 方便做持续集成并有助于整体发布的容器虚拟化技术。**

---

### 1.2. 容器与虚拟机比较

#### 1.2.1. 容器发展简史

![image-20220401231844373](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/image-20220401231844373.png)

![image-20220401231849472](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/image-20220401231849472.png)

#### 1.2.2. 传统虚拟机技术

虚拟机（virtual machine）就是带环境安装的一种解决方案。

它可以在一种操作系统里面运行另一种操作系统，比如在Windows10系统里面运行Linux系统CentOS7。应用程序对此毫无感知，因为虚拟机看上去跟真实系统一模一样，而对于底层系统来说，虚拟机就是一个普通文件，不需要了就删掉，对其他部分毫无影响。这类虚拟机完美的运行了另一套系统，能够使应用程序，操作系统和硬件三者之间的逻辑不变。  

![image-20220401232026296](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/image-20220401232026296.png)

![image-20220401232031311](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/image-20220401232031311.png)

**虚拟机的缺点：**

- 资源占用多
- 冗余步骤多 
- 启动慢

#### 1.2.3. 容器虚拟化技术

由于前面虚拟机存在某些缺点，Linux发展出了另一种虚拟化技术：

- Linux容器(Linux Containers，缩写为 LXC)
- Linux容器是与系统其他部分隔离开的一系列进程，从另一个镜像运行，并由该镜像提供支持进程所需的全部文件。容器提供的镜像包含了应用的所有依赖项，因而在从开发到测试再到生产的整个过程中，它都具有可移植性和一致性。
- **Linux 容器不是模拟一个完整的操作系统**而是对进程进行隔离。有了容器，就可以将软件运行所需的所有资源打包到一个隔离的容器中。容器与虚拟机不同，不需要捆绑一整套操作系统，只需要软件工作所需的库资源和设置。系统因此而变得高效轻量并保证部署在任何环境中的软件都能始终如一地运行。

![image-20220401232343631](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/image-20220401232343631.png)

![image-20220401232349062](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/image-20220401232349062.png)

#### 1.2.4. 对比

![image-20220401232434028](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/image-20220401232434028.png)

比较了 Docker 和传统虚拟化方式的不同之处：

- 传统虚拟机技术是虚拟出一套硬件后，在其上运行一个完整操作系统，在该系统上再运行所需应用进程；
- 容器内的应用进程直接运行于宿主的内核，容器内没有自己的内核且也没有进行硬件虚拟。因此容器要比传统虚拟机更为轻便。
- 每个容器之间互相隔离，每个容器有自己的文件系统 ，容器之间进程不会相互影响，能区分计算资源。

---

### 1.3. 能干嘛

**技术职级变化**

- coder
- programmer
- software engineer
- DevOps engineer

**开发/运维（DevOps）新一代开发工程师**

- 一次构建、随处运行
- 更快速的应用交付和部署
- 传统的应用开发完成后，需要提供一堆安装程序和配置说明文档，安装部署后需根据配置文档进行繁杂的配置才能正常运行。Docker化之后只需要交付少量容器镜像文件，在正式生产环境加载镜像并运行即可，应用安装配置在镜像里已经内置好，大大节省部署配置和测试验证时间。

**更便捷的升级和扩缩容**

随着微服务架构和Docker的发展，大量的应用会通过微服务方式架构，应用的开发构建将变成搭乐高积木一样，每个Docker容器将变成一块“积木”，应用的升级将变得非常容易。当现有的容器不足以支撑业务处理时，可通过镜像运行新的容器进行快速扩容，使应用系统的扩容从原先的天级变成分钟级甚至秒级。

**更简单的系统运维**

应用容器化运行后，生产环境运行的应用可与开发、测试环境的应用高度一致，容器会将应用程序相关的环境和状态完全封装起来，不会因为底层基础架构和操作系统的不一致性给应用带来影响，产生新的BUG。当出现程序异常时，也可以通过测试环境的相同容器进行快速定位和修复。

**更高效的计算资源利用**

Docker是**内核级虚拟化**，其不像传统的虚拟化技术一样需要额外的Hypervisor支持，所以在一台物理机上可以运行很多个容器实例，可大大提升物理服务器的CPU和内存的利用率。

**Docker应用场景**

![image-20220401233004067](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/image-20220401233004067.png)

**哪些企业在使用**

新浪

![image-20220401233035737](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/image-20220401233035737.png)

![image-20220401233056826](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/image-20220401233056826.png)

![image-20220401233116695](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/image-20220401233116695.png)

![image-20220401233123215](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/image-20220401233123215.png)

美团

![image-20220401233135205](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/image-20220401233135205.png)

![image-20220401233141078](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/image-20220401233141078.png)

蘑菇街

![image-20220401233154212](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/image-20220401233154212.png)

![image-20220401233202086](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/image-20220401233202086.png)

---

### 1.4. 去哪下

官网

- docker官网：http://www.docker.com

仓库

- Docker Hub官网: https://hub.docker.com/

---

### 1.5. Docker的基本组成

#### 1.5.1. 镜像(image)

- Docker 镜像（Image）就是一个只读的模板。镜像可以用来创建 Docker 容器，一个镜像可以创建很多容器。

- 它也相当于是一个root文件系统。比如官方镜像 centos:7 就包含了完整的一套 centos:7 最小系统的 root 文件系统。

- 相当于容器的“源代码”，**docker镜像文件类似于Java的类模板，而docker容器实例类似于java中new出来的实例对象**。

![image-20220401234109670](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/image-20220401234109670.png)

#### 1.5.2. 容器(container)

- 从面向对象角度
  - Docker 利用容器（Container）独立运行的一个或一组应用，应用程序或服务运行在容器里面，容器就类似于一个虚拟化的运行环境，容器是用镜像创建的运行实例。
  - 就像是Java中的类和实例对象一样，镜像是静态的定义，容器是镜像运行时的实体。容器为镜像提供了一个标准的和隔离的运行环境，它可以被启动、开始、停止、删除。每个容器都是相互隔离的、保证安全的平台
- 从镜像容器角度
  - 可以把容器看做是一个简易版的 Linux 环境（包括root用户权限、进程空间、用户空间和网络空间等）和运行在其中的应用程序。

#### 1.5.3. 仓库(repository)

- 仓库（Repository）是集中存放镜像文件的场所。

- 类似于Maven仓库，存放各种jar包的地方；github仓库，存放各种git项目的地方；

- Docker公司提供的官方registry被称为Docker Hub，存放各种镜像模板的地方。

- 仓库分为公开仓库（Public）和私有仓库（Private）两种形式。最大的公开仓库是 Docker Hub(https://hub.docker.com/)，存放了数量庞大的镜像供用户下载。国内的公开仓库包括阿里云 、网易云等

#### 1.5.4. 小总结

**需要正确的理解仓库/镜像/容器这几个概念**

- Docker 本身是一个容器运行载体或称之为管理引擎。我们把应用程序和配置依赖打包好形成一个可交付的运行环境，这个打包好的运行环境就是image镜像文件。
- 只有通过这个镜像文件才能生成Docker容器实例(类似Java中new出来一个对象)。
- image文件可以看作是容器的模板。Docker 根据 image 文件生成容器的实例。同一个 image 文件，可以生成多个同时运行的容器实例。

**镜像文件**

- image 文件生成的容器实例，本身也是一个文件，称为镜像文件。

**容器实例**

- 一个容器运行一种服务，当我们需要的时候，就可以通过docker客户端创建一个对应的运行实例，也就是我们的容器。

**仓库**

就是放一堆镜像的地方，我们可以把镜像发布到仓库中，需要的时候再从仓库中拉下来就可以了。

---

### 1.6. Docker平台架构图解(架构版)

首次懵逼正常，后续深入，先有大概轮廓，混个眼熟。

整体架构及底层通信原理简述。

- Docker 是一个 **C/S** 模式的架构，后端是一个松耦合架构，众多模块各司其职。 
- ![image-20220401234727303](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/image-20220401234727303.png)
- ![image-20220401234938078](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/image-20220401234938078.png)

---

## 2. Docker安装

```
sudo yum remove docker \
                  docker-client \
                  docker-client-latest \
                  docker-common \
                  docker-latest \
                  docker-latest-logrotate \
                  docker-logrotate \
                  docker-engine
                  
                  sudo yum install -y yum-utils
                  
                  yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
                  
                  yum makecache fast
                  
                  yum -y install docker-ce docker-ce-cli containerd.io
                  
                  启动docker
                  systemctl start docker
                  
                  ·测试
                  docker version
                  
                  docker run hello-world
```

### 2.1. 安装步骤

>  **CentOS7安装Docker**

官网地址：https://docs.docker.com/engine/install/centos/

确定你是CentOS7及以上版本：`cat /etc/redhat-release`

- 卸载旧版本

  ```
  sudo yum remove docker \
                    docker-client \
                    docker-client-latest \
                    docker-common \
                    docker-latest \
                    docker-latest-logrotate \
                    docker-logrotate \
                    docker-engine
  ```

- yum安装gcc相关

  ```
  sudo yum -y install gcc
  sudo yum -y install gcc-c++
  ```

- 安装需要的软件包

  ```
  sudo yum install -y yum-utils
  ```

- 设置stable镜像仓库

  - 大坑。执行官网如下命令可能会报错：

    ```
    yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
    ```

    ```
    [Errno 14] curl#35 - TCP connection reset by peer
    [Errno 12] curl#35 - Timeout
    [Errno 14] curl#35 - TCP connection reset by peer
    [Errno 12] curl#35 - Timeout
    ```

  - 推荐如下：

    ```
    sudo yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
    ```

- 更新yum软件包索引

  ```
  sudo yum makecache fast
  ```

- 安装DOCKER CE

  ```
  sudo yum install docker-ce docker-ce-cli containerd.io
  ```

- 启动docker

  ```
  systemctl start docker
  ```

- 测试

  ```
  docker version
  ```

### 2.2. Docker卸载

```
systemctl stop docker
sudo yum remove docker-ce docker-ce-cli containerd.io
sudo rm -rf /var/lib/docker
sudo rm -rf /var/lib/containerd
```

### 2.3. 阿里云镜像加速

> 查看方式

阿里云官网->控制台->选择容器镜像服务->镜像工具->镜像加速器

![image-20220406233225442](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/image-20220406233225442.png)

![image-20220406233439963](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/image-20220406233439963.png)

![image-20220406233517898](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/image-20220406233517898.png)

![image-20220406233559893](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/image-20220406233559893.png)

> **配置脚本**

命令

```
mkdir -p /etc/docker
vim /etc/docker/daemon.json
```

输入内容

```
#阿里云
{
  "registry-mirrors": ["https://｛自已的编码｝.mirror.aliyuncs.com"]
}
```

> **重启服务器**

命令

```
systemctl daemon-reload
systemctl restart docker
```

### 2.4. 永远的HelloWorld

**启动Docker后台容器(测试运行 hello-world)**

- docker run hello-world

  ![image-20220406234058745](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/image-20220406234058745.png)

- 输出这段提示以后，hello world就会停止运行，容器自动终止。

**run干了什么**

![image-20220406234151898](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/image-20220406234151898.png)

### 2.5. 底层原理

**为什么Docker会比VM虚拟机快**

1. docker有着比虚拟机更少的抽象层

   - 由于docker不需要Hypervisor(虚拟机)实现硬件资源虚拟化,运行在docker容器上的程序直接使用的都是实际物理机的硬件资源。因此在CPU、内存利用率上docker将会在效率上有明显优势。

2. docker利用的是宿主机的内核,而不需要加载操作系统OS内核

   - 当新建一个容器时,docker不需要和虚拟机一样重新加载一个操作系统内核。进而避免引寻、加载操作系统内核返回等比较费时费资源的过程,当新建一个虚拟机时,虚拟机软件需要加载OS,返回新建过程是分钟级别的。而docker由于直接利用宿主机的操作系统,则省略了返回过程,因此新建一个docker容器只需要几秒钟。

3. 虚拟机与Docker架构对比图

   ![image-20220406234419671](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/image-20220406234419671.png)

   ![image-20220406234430602](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/image-20220406234430602.png)



---

## 3. Docker常用命令

### 3.1. 帮助启动类命令

- 启动docker： `systemctl start docker`

- 停止docker： `systemctl stop docker`

- 重启docker： `systemctl restart docker`

- 查看docker状态： `systemctl status docker`

- 开机启动： `systemctl enable docker`

- 查看docker概要信息： `docker info`
- 查看docker总体帮助文档： `docker --help`
- 查看docker命令帮助文档： docker 具体命令 --help

---



### 3.2. 镜像命令

#### 3.2.1. 列出本地主机上的镜像

- 列出本地主机上的镜像：`docker images`
  - 各个选项说明
    - REPOSITORY：表示镜像的仓库源
    - TAG：镜像的标签版本号
    - IMAGE ID：镜像ID
    - CREATED：镜像创建时间
    - SIZE：镜像大小
    
  - 同一仓库源可以有多个 TAG版本，代表这个仓库源的不同个版本，我们使用 REPOSITORY:TAG 来定义不同的镜像。如果你不指定一个镜像的版本标签，例如你只使用 ubuntu，docker 将默认使用 ubuntu:latest 镜像。
  
    - `docker tag IMAGEID REPOSITORY:TAG`
  
      ![image-20220408102534859](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/image-20220408102534859.png)
  
  - OPTIONS说明：
    - -a :列出本地所有的镜像（含历史映像层）
    - q :只显示镜像ID
  
- 列出具体的镜像

  - docker images redis:latest
  - ![image-20220408140706090](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Base2/image-20220408140706090.png)

#### 3.2.2. 查找镜像

- docker search [OPTIONS] 镜像名字
  - OPTIONS说明：
    - --limit : 只列出N个镜像，默认25个
    - docker search --limit 5 redis

#### 3.2.3. 下载镜像

- docker pull 某个XXX镜像名字
  - docker pull 镜像名字[:TAG]
  - docker pull 镜像名字
  - 没有TAG就是最新版
  - 等价于
    - docker pull 镜像名字:latest
  - docker pull ubuntu

#### 3.2.4. 查看镜像/容器/数据卷所占的空间

- docker system df 

#### 3.2.5. 删除镜像

- docker rmi 某个XXX镜像名字ID
  - 删除单个：docker rmi  -f 镜像ID
  - 删除多个：docker rmi -f 镜像名1:TAG 镜像名2:TAG
  - 删除全部：docker rmi -f $(docker images -qa)
- 强制删除正在被使用的镜像
  - docker rmi -f 镜像名/镜像id:TAG
  - 会造成虚悬镜像

#### 3.2.6. 虚悬镜像

**什么是虚悬镜像**

仓库名、标签都是**none**的镜像，俗称虚悬镜像`dangling image`。如下图：

![image-20220407130731770](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/image-20220407130731770.png)

**造成原因**

在镜像服务运行时 ，直接强制删除该镜像，就会造成docker中出现虚悬镜像。

![image-20220408105949341](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/image-20220408105949341.png)

**如何删除**

查找虚悬镜像进程ID：docker ps

![image-20220408110346640](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/image-20220408110346640.png)

停止该进程：dcoker stop [CONTAINER ID]

![image-20220408110421827](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/image-20220408110421827.png)

查看虚悬镜像ID：docker images

![image-20220408110445580](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/image-20220408110445580.png)

根据镜像ID删除该虚悬镜像：docker rmi -f [IMAGE ID]

![image-20220408110513212](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/image-20220408110513212.png)

---

### 3.3. 容器命令

#### 3.3.1. 拉取ubuntu镜像

有镜像才能创建容器， 这是根本前提(下载一个CentOS或者ubuntu镜像演示)

- 说明

![image-20220407225010540](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/image-20220407225010540.png)

- docker pull centos

- docker pull ubuntu

  ![image-20220407225350391](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/image-20220407225350391.png)

- 本次演示用ubuntu演示

#### 3.3.2. 新建+启动容器

- docker run [OPTIONS] IMAGE [COMMAND] [ARG...]

- OPTIONS说明

  -  OPTIONS说明（常用）：有些是一个减号，有些是两个减号

    --name="容器新名字"    为容器指定一个名称；

    -d: 后台运行容器并返回容器ID，也即启动守护式容器(后台运行)；

    **-i：以交互模式运行容器，通常与 -t 同时使用；**

    **-t：为容器重新分配一个伪输入终端，通常与 -i 同时使用**；也即启动交互式容器(前台有伪终端，等待交互)；

    -P: 随机端口映射，大写P

    -p: 指定端口映射，小写p

    ![image-20220407225838988](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/image-20220407225838988.png)

- 启动交互式容器(前台命令行)

  - ![image-20220408111722421](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/image-20220408111722421.png)
  - 使用镜像centos:latest以交互模式启动一个容器,在容器内执行/bin/bash命令。
  - `docker run -it ubuntu /bin/bash`
  - 参数说明：
    - -i: 交互式操作。
    - -t: 终端。
    - centos : centos 镜像。
    - /bin/bash：放在镜像名后的是命令，这里我们希望有个交互式 Shell，因此用的是 /bin/bash。
    - 要退出终端，直接输入 exit。会导致容器停止运行。

  

#### 3.3.3. 列出当前所有正在运行的容器

- docker ps [OPTIONS]。不带参数列出所有在运行的容器信息。
- OPTIONS说明（常用）
  - -a :列出当前所有正在运行的容器+历史上运行过的
  - -l :显示最近创建的容器。
  - -n：显示最近n个创建的容器。
  - -q :静默模式，只显示容器编号。
- 输出详情介绍：
  - CONTAINER ID: 容器 ID。
  - IMAGE: 使用的镜像。
  - COMMAND: 启动容器时运行的命令。
  - CREATED: 容器的创建时间。
  - STATUS: 容器状态。（状态有7种）
    - created（已创建）
    - restarting（重启中）
    - running（运行中）
    - removing（迁移中）
    - paused（暂停）
    - exited（停止）
    - dead（死亡）

#### 3.3.4. 退出容器

两种退出方式

- **exit**
  - run进去容器，exit退出，**容器停止**
- **ctrl+p+q**
  - run进去容器，ctrl+p+q退出，**容器不停止**

#### 3.3.5. 启动已停止运行的容器

docker start 容器ID或者容器名

#### 3.3.6. 重启容器

docker restart 容器ID或者容器名

#### 3.3.7. 停止容器

docker stop 容器ID或者容器名

#### 3.3.8. 强制停止容器

docker kill 容器ID或容器名

#### 3.3.9. 删除已停止的容器

- docker rm 容器ID
- 一次性删除多个容器实例
  - docker rm -f $(docker ps -a -q)。-f：强制删除，包括正在运行的容器
  - docker ps -a -q | xargs docker rm。不会删除正在运行的容器

#### 3.3.10. 重要

- 有镜像才能创建容器，这是根本前提(下载一个Redis6.0.8镜像演示)。

- 启动守护式容器(后台服务器)

- 在大部分的场景下，我们希望 docker 的服务是在后台运行的， 我们可以过 -d 指定容器的后台运行模式。

- docker run -d 容器名
  - 使用镜像centos:latest以后台模式启动一个容器
  - docker run -d centos
  - 问题：然后docker ps -a 进行查看, 会发现容器已经退出
  - 很重要的要说明的一点: **Docker容器后台运行,就必须有一个前台进程.**
  - 容器运行的命令如果不是那些一直挂起的命令（比如运行top，tail），就是会自动退出的。
  - 这个是docker的机制问题,比如你的web容器,我们以nginx为例，正常情况下,我们配置启动服务只需要启动响应的service即可。例如service nginx start但是,这样做,nginx为后台进程模式运行,就导致docker前台没有运行的应用,这样的容器后台启动后,会立即自杀因为他觉得他没事可做了。
  - 所以，最佳的解决方案是,**将你要运行的程序以前台进程的形式运行，常见就是命令行模式，表示我还有交互操作，别中断**。

**redis 前后台启动演示case**

- 前台交互式启动： `docker run -it redis:6.0.8`

- 后台守护式启动：`docker run -d redis:6.0.8`

- 查看容器日志：`docker logs 容器ID`

- 查看容器内运行的进程：`docker top 容器ID`

- 查看容器内部细节：`docker inspect 容器ID`

- 进入正在运行的容器并以命令行交互：`docker exec -it 容器ID /bin/bash`

  ![image-20220407233212318](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/image-20220407233212318.png)

- 重新进入：docker attach 容器ID

- 上述两个区别

  - **attach** 直接进入容器启动命令的终端，不会启动新的进程 用exit退出，会**导致容器的停止**。
  - **exec** 是在容器中打开新的终端，并且可以启动新的进程 用exit退出，**不会导致容器的停止**。
  - 推荐大家使用 docker exec 命令，因为退出容器终端，不会导致容器的停止。

**从容器内拷贝文件到主机上（容器→主机）**

`docker cp  容器ID:容器内路径 目的主机路径`

**导入和导出容器**

- export 导出容器的内容留作为一个tar归档文件[对应import命令]

- import 从tar包中的内容创建一个新的文件系统再导入为镜像[对应export]

- 案例

  - docker export 容器ID > 文件名.tar

    ![image-20220407235334913](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/image-20220407235334913.png)
  
  - cat 文件名.tar | docker import - 镜像用户/镜像名:镜像版本号
  
    ![image-20220407235538082](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/image-20220407235538082.png)

#### 3.3.11. 小总结

![image-20220407234533572](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/image-20220407234533572.png)

```
attach    Attach to a running container                 # 当前 shell 下 attach 连接指定运行镜像

build     Build an image from a Dockerfile              # 通过 Dockerfile 定制镜像

commit    Create a new image from a container changes   # 提交当前容器为新的镜像

cp        Copy files/folders from the containers filesystem to the host path   #从容器中拷贝指定文件或者目录到宿主机中

create    Create a new container                        # 创建一个新的容器，同 run，但不启动容器

diff      Inspect changes on a container's filesystem   # 查看 docker 容器变化

events    Get real time events from the server          # 从 docker 服务获取容器实时事件

exec      Run a command in an existing container        # 在已存在的容器上运行命令

export    Stream the contents of a container as a tar archive   # 导出容器的内容流作为一个 tar 归档文件[对应 import ]

history   Show the history of an image                  # 展示一个镜像形成历史

images    List images                                   # 列出系统当前镜像

import    Create a new filesystem image from the contents of a tarball # 从tar包中的内容创建一个新的文件系统映像[对应export]

info      Display system-wide information               # 显示系统相关信息

inspect   Return low-level information on a container   # 查看容器详细信息

kill      Kill a running container                      # kill 指定 docker 容器

load      Load an image from a tar archive              # 从一个 tar 包中加载一个镜像[对应 save]

login     Register or Login to the docker registry server    # 注册或者登陆一个 docker 源服务器

logout    Log out from a Docker registry server          # 从当前 Docker registry 退出

logs      Fetch the logs of a container                 # 输出当前容器日志信息

port      Lookup the public-facing port which is NAT-ed to PRIVATE_PORT    # 查看映射端口对应的容器内部源端口

pause     Pause all processes within a container        # 暂停容器

ps        List containers                               # 列出容器列表

pull      Pull an image or a repository from the docker registry server   # 从docker镜像源服务器拉取指定镜像或者库镜像

push      Push an image or a repository to the docker registry server    # 推送指定镜像或者库镜像至docker源服务器

restart   Restart a running container                   # 重启运行的容器

rm        Remove one or more containers                 # 移除一个或者多个容器

rmi       Remove one or more images       # 移除一个或多个镜像[无容器使用该镜像才可删除，否则需删除相关容器才可继续或 -f 强制删除]

run       Run a command in a new container              # 创建一个新的容器并运行一个命令

save      Save an image to a tar archive                # 保存一个镜像为一个 tar 包[对应 load]

search    Search for an image on the Docker Hub         # 在 docker hub 中搜索镜像

start     Start a stopped containers                    # 启动容器

stop      Stop a running containers                     # 停止容器

tag       Tag an image into a repository                # 给源中镜像打标签

top       Lookup the running processes of a container   # 查看容器中运行的进程信息

unpause   Unpause a paused container                    # 取消暂停容器

version   Show the docker version information           # 查看 docker 版本号

wait      Block until a container stops, then print its exit code   # 截取容器停止时的退出状态值
```



