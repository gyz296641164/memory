---
title: 本地镜像发布 & 容器数据卷
category:
  - Docker
date: 2023-02-27
---

<!-- more -->

## 1. 本地镜像发布到阿里云

### 1.1. 本地镜像发布到阿里云流程

![image-20220409212913497](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Base2/image-20220409212913497.png)

### 1.2. 镜像的生成方法

基于当前容器创建一个新的镜像，新功能增强 `docker commit [OPTIONS] 容器ID [REPOSITORY[:TAG]]`

- OPTIONS说明：
  - -a :提交的镜像作者；
  - -m :提交时的说明文字；

![image-20220409215154372](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Base2/image-20220409215154372.png)

---

### 1.3. 将本地镜像推送到阿里云

**本地镜像素材原型**

![image-20220409215317229](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Base2/image-20220409215317229.png)

**阿里云开发者平台**

- 官网地址：https://promotion.aliyun.com/ntms/act/kubernetes.html
- ![image-20220409215527928](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Base2/image-20220409215527928.png)

- 创建仓库镜像

  ![image-20220409220039063](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Base2/image-20220409220039063.png)

- 创建步骤

  - 选择控制台，进入容器镜像服务

    ![image-20220409220236904](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Base2/image-20220409220236904.png)

  - 选择个人实例

    ![image-20220409220544025](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Base2/image-20220409220544025.png)

  - 命名空间

    ![image-20220409220553841](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Base2/image-20220409220553841.png)

  - 继续

    ![image-20220409220606178](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Base2/image-20220409220606178.png)

  - 仓库名称

    ![image-20220409220622560](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Base2/image-20220409220622560.png)

  - 继续

    ![image-20220409220645129](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Base2/image-20220409220645129.png)

    ![image-20220409220651368](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Base2/image-20220409220651368.png)

  - 进入管理界面获得脚本

    ![image-20220409220709465](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Base2/image-20220409220709465.png)

**将镜像推送到阿里云**

- 将镜像推送到阿里云registry

  ![image-20220409223014692](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Base2/image-20220409223014692.png)

- 管理界面脚本

  ```
  docker login --username=自己用户名 registry.cn-hangzhou.aliyuncs.com
  docker tag e5d423d23b83 registry.cn-hangzhou.aliyuncs.com/gongyuzhuo_docker/mycentos:1.4
  docker push registry.cn-hangzhou.aliyuncs.com/gongyuzhuo_docker/mycentos:1.4
  ```

  ![image-20220409222835648](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Base2/image-20220409222835648.png)

---

### 1.4. 将阿里云上的镜像下载到本地

命令

```
docker pull registry.cn-hangzhou.aliyuncs.com/gongyuzhuo_docker/mycentos:1.4
```

下载到本地

![image-20220409223318440](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Base2/image-20220409223318440.png)

---

## 2. 本地镜像发布到私有库

### 2.1. 本地镜像发布到私有库流程

阿里云ECS Docker生态如下图所示：

![image-20220410104018017](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Base2/image-20220410104018017.png)

---

### 2.2. 是什么

官方Docker Hub地址：https://hub.docker.com/，中国大陆访问太慢了且准备被阿里云取代的趋势，不太主流。

Dockerhub、阿里云这样的公共镜像仓库可能不太方便，涉及机密的公司不可能提供镜像给公网，所以需要创建一个本地私人仓库供给团队使用，基于公司内部项目构建镜像。

**Docker Registry**是官方提供的工具，可以用于构建私有镜像仓库。

---

### 2.3. 将本地镜像推送到私有库

> **下载镜像Docker Registry**

```
docker pull registry
```

![image-20220410122327708](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Base2/image-20220410122327708.png)

> **运行私有库Registry，相当于本地有个私有Docker hub**

```
docker run -d -p 5000:5000 -v /gongyz/myregistry/:/tmp/registry --privileged=true registry
```

默认情况，仓库被创建在容器的/var/lib/registry目录下，建议自行用容器卷映射，方便于宿主机联调。

![image-20220410122848105](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Base2/image-20220410122848105.png)

> **案例演示创建一个新镜像，ubuntu安装ifconfig命令**

从Hub上下载ubuntu镜像到本地并成功运行。

原始的Ubuntu镜像是不带着ifconfig命令的。

![image-20220410123114938](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Base2/image-20220410123114938.png)

**外网连通的情况下，安装ifconfig命令并测试通过**

docker容器内执行上述两条命令：

```
apt-get update
apt-get install net-tools
```

![image-20220410123308069](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Base2/image-20220410123308069.png)

![image-20220410123327841](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Base2/image-20220410123327841.png)

![image-20220410123400702](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Base2/image-20220410123400702.png)

**安装完成后，commit我们自己的新镜像**

- 公式：

  docker commit -m="提交的描述信息" -a="作者" 容器ID 要创建的目标镜像名:[标签名]

- 命令**在容器外执行**

  ```
  docker commit -m="commit my ubuntu image" -a="gongyz" 83ab7a734c1e myubuntu:1.2
  ```

  ![image-20220410123604997](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Base2/image-20220410123604997.png)

**启动我们的新镜像并和原来的对比**

- 官网是默认下载的Ubuntu没有ifconfig命令。

- 我们自己commit构建的新镜像，新增加了ifconfig功能，可以成功使用。

  ![image-20220410123719771](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Base2/image-20220410123719771.png)

**curl验证私服库上有什么镜像**

```
curl -XGET 192.168.189.133:5000/v2/_catalog
```

可以看到，目前私服库没有任何镜像上传过。

![image-20220410123848552](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Base2/image-20220410123848552.png)

将新镜像`myubuntu:1.2`修改符合私服规范的Tag。

按照公式：

```
docker tag 镜像:Tag Host:Port/Repository:Tag
```

命令：

```
docker tag myubuntu:1.2 192.168.189.133:5000/myubuntu:1.2
```

![image-20220410124326800](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Base2/image-20220410124326800.png)

修改配置文件使之支持http

![image-20220410124512339](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Base2/image-20220410124512339.png)

- registry-mirrors 配置的是国内阿里提供的镜像加速地址，不用加速的话访问官网的会很慢。
- 2个配置中间有个逗号 '**,**'别漏了，这个配置是json格式的。

vim命令新增如下红色内容：`vim /etc/docker/daemon.json`

```
// 内容填写自己的
{
  "registry-mirrors": ["https://aa25jngu.mirror.aliyuncs.com"],
  "insecure-registries": ["192.168.111.162:5000"]
}
```

上述理由：docker默认不允许http方式推送镜像，通过配置选项来取消这个限制。====> **修改完后如果不生效，建议重启docker**。`systemctl restart docker`

**push推送到私服库**

```
docker push 192.168.189.133:5000/myubuntu:1.2
```

![image-20220410124907394](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Base2/image-20220410124907394.png)

**注意**：推送时查看私有库容器是否在运行！如果没有运行，推送会失败！

![image-20220410125047135](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Base2/image-20220410125047135.png)

**curl验证私服库上有什么镜像**

```
curl -XGET http://192.168.189.133:5000/v2/_catalog
```

![image-20220410125134453](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Base2/image-20220410125134453.png)

**pull到本地并运行**

```
docker pull 192.168.189.133:5000/myubuntu:1.2
```

![image-20220410125244098](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Base2/image-20220410125244098.png)

```
docker run -it 镜像ID /bin/bash
```

![image-20220410125315542](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Base2/image-20220410125315542.png)

---

## 3. Docker容器数据卷

### 3.1. 容器卷记得加入 --privileged=true

### 3.2. why

- Docker挂载主机目录访问如果出现`cannot open directory : Permission denied`

- 解决办法：在挂载目录后多加一个--privileged=true参数即可
- 如果是CentOS7安全模块会比之前系统版本加强，不安全的会先禁止，所以目录挂载的情况被默认为不安全的行为，在SELinux里面挂载目录被禁止掉了额，如果要开启，我们一般使用--privileged=true命令，扩大容器的权限解决挂载目录没有权限的问题，也即使用该参数，container内的root拥有真正的root权限，否则，container内的root只是外部的一个普通用户权限。

---

### 3.3. 回顾参数V

默认情况，仓库被创建在容器的/var/lib/registry目录下，建议自行用容器卷映射，方便与宿主机联调

![image-20220410131345386](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Base2/image-20220410131345386.png)

---

### 3.4. 是什么

卷就是目录或文件，存在于一个或多个容器中，由docker挂载到容器，但不属于联合文件系统，因此能够绕过Union File System提供一些用于持续存储或共享数据的特性；

卷的设计目的就是**数据的持久化**，完全独立于容器的生存周期，因此Docker不会在容器删除时删除其挂载的数据卷。

- 一句话：有点类似我们Redis里面的rdb和aof文件

- 将docker容器内的数据保存进宿主机的磁盘中

- 运行一个带有容器卷存储功能的容器实例

  `docker run -it --privileged=true -v /宿主机绝对路径目录:/容器内目录   镜像名`

---

### 3.5. 能干嘛

将运用与运行的环境打包镜像，run后形成容器实例运行 ，但是我们对数据的要求希望是持久化的；

Docker容器产生的数据，如果不备份，那么当容器实例删除后，容器内的数据自然也就没有了。为了能保存数据在docker中我们使用卷。

特点：

1. 数据卷可在容器之间共享或重用数据
2. 卷中的更改可以直接实时生效，爽
3. 数据卷中的更改不会包含在镜像的更新中
4. 数据卷的生命周期一直持续到没有容器使用它为止

---

## 4. 数据卷案例

### 4.1. 宿主vs容器之间映射添加容器卷

**直接命令添加**

- 公式：`docker run -it -v /宿主机目录:/容器内目录 ubuntu /bin/bash`
- `docker run -it --name myu3 --privileged=true -v /tmp/myHostData:/tmp/myDockerData ubuntu /bin/bash`

![image-20220410132438408](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Base2/image-20220410132438408.png)

**宿主机目录**

![image-20220410132317556](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Base2/image-20220410132317556.png)

**容器内目录**

![image-20220410132409920](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Base2/image-20220410132409920.png)

**查看数据卷是否挂载成功**

- docker inspect 容器ID
- 容器外执行

![image-20220410132516793](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Base2/image-20220410132516793.png)



### 4.2. 容器和宿主机之间数据共享

- docker修改，主机同步获得 
- 主机修改，docker同步获得
- docker容器stop，主机修改，docker容器重启看数据是否同步。

### 4.3. 读写规则映射添加说明

- **读写(默认)：rw = read + write**

  ![image-20220410133239744](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Base2/image-20220410133239744.png)

  -  `docker run -it --privileged=true -v /宿主机绝对路径目录:/容器内目录:rw 镜像名`

  - 默认同上案例，默认就是rw

- **只读**
  - 容器实例内部被限制，只能读取不能写
  -  docker run -it --privileged=true -v /宿主机绝对路径目录:/容器内目录:ro 镜像名
- **卷的继承和共享**
  - 容器1完成和宿主机的映射
    - `docker run -it --privileged=true -v /mydocker/u:/tmp --name u1 ubuntu`
    - ![image-20220410133800867](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Base2/image-20220410133800867.png)
  - 容器2继承容器1的卷规则
    - **docker run -it  --privileged=true --volumes-from 父类  --name u2 ubuntu**
    - ![image-20220410133948873](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Base2/image-20220410133948873.png)



---

## 5. Docker常规安装简介

### 5.1. 总体步骤

- 搜索镜像
- 拉取镜像
- 查看镜像
- 启动镜像
  - 服务端口映射
- 停止容器
- 移除容器

---

### 5.2. 安装tomcat

**docker hub上面查找tomcat镜像**

- docker search tomcat

  ![image-20220413104046293](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220413104046293.png)

- 从docker hub上拉取tomcat镜像到本地

  - docker pull tomcat

- docker images查看是否有拉取到的tomcat

  ![image-20220413104259629](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220413104259629.png)

- 使用tomcat镜像创建容器实例(也叫运行镜像)

  - `docker run -it -p 8080:8080 tomcat`

    - -p 小写，主机端口:docker容器端口
    - -P 大写，随机分配端口
    - i:交互
    - t:终端
    - d:后台

  - ![image-20220413104402507](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220413104402507.png)

  - 访问猫首页

    - 问题

      ![image-20220413104530307](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220413104530307.png)

    - 解决

      - 可能没有映射端口或者没有关闭防火墙
      - 把webapps.dist目录换成webapps
      - 先成功启动tomcat
      - ![image-20220413104702357](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220413104702357.png)
      - 查看webapps 文件夹查看为空
      - ![image-20220413104744286](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Docker/Advance1/image-20220413104744286.png)

**免修改版说明**

- docker pull billygoo/tomcat8-jdk8
- docker run -d -p 8080:8080 --name mytomcat8 billygoo/tomcat8-jdk8

---

### 5.3. 安装mysql

**1、下载镜像文件** 

```java
docker pull mysql:5.7
```


 **2、创建实例并启动 (root用户下执行)**

```java
docker run -p 3306:3306 --name mysql \
-v /mydata/mysql/log:/var/log/mysql \
-v /mydata/mysql/data:/var/lib/mysql \
-v /mydata/mysql/conf:/etc/mysql \
-e MYSQL_ROOT_PASSWORD=root \
-d mysql:5.7
    
 参数说明
-p 3306:3306： 将容器的 3306 端口映射到主机的 3306 端口
-v /mydata/mysql/conf:/etc/mysql： 将配置文件夹挂载到主机
-v /mydata/mysql/log:/var/log/mysql： 将日志文件夹挂载到主机
-v /mydata/mysql/data:/var/lib/mysql/： 将配置文件夹挂载到主机
-e MYSQL_ROOT_PASSWORD=root： 初始化 root 用户的密码   
```


**3、MySQL 配置** 

```
vi /mydata/mysql/conf/my.cnf 
[client]
default-character-set=utf8
[mysql]
default-character-set=utf8
[mysqld]
init_connect='SET collation_connection = utf8_unicode_ci'
init_connect='SET NAMES utf8'
character-set-server=utf8
collation-server=utf8_unicode_ci
skip-character-set-client-handshake
skip-name-resolve
```

**注意**： 解决 MySQL 连接慢的问题

- 在配置文件中加入如下内容并重启 mysql：

  ```
  [mysqld]
  skip-name-resolve
  ```

- 解释：skip-name-resolve 跳过域名解析 ！

**4、通过容器的 mysql 命令行工具连接** 

```
docker exec -it mysql mysql -uroot -proot

```

**5、进入容器文件系统**

```
docker exec -it mysql /bin/bash
```

---

### 5.4. 安装 redis

**1、下载镜像文件** 

```
docker pull redis
```

**2、创建实例并启动**

```
mkdir -p /mydata/redis/conf

touch /mydata/redis/conf/redis.conf

docker run -p 6379:6379 --name redis -v /mydata/redis/data:/data \
	-v /mydata/redis/conf/redis.conf:/etc/redis/redis.conf \
	-d redis redis-server /etc/redis/redis.conf
```

redis 自描述文件：https://raw.githubusercontent.com/antirez/redis/4.0/redis.conf 

同时开启持久化，在redis.conf文件加入如下内容，默认开启AOF模式：

```
appendonly yes
```

**3、使用 redis 镜像执行 redis-cli 命令连接** 

```
docker exec -it redis redis-cli
```

**4、验证持久化**

```
--在cli下: 
set a b

-- 重启redis
docker restart redis

-- get a 查看是否还有b值
```

**5、其它redis.conf配置**

- 开启redis验证（可选）：requirepass 123
- 允许redis外地连接必须注释掉：\# bind 127.0.0.1
- daemonize no：将daemonize yes注释起来或者 daemonize no设置，因为该配置和docker run中-d参数冲突，会导致容器一直启动失败
