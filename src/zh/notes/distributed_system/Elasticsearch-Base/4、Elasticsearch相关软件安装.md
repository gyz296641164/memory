---
title: 4、Elasticsearch相关软件安装
category:
  - Elasticsearch
date: 2025-09-09
---

<!-- more -->

## Windows安装elasticsearch

### 安装JDK

至少1.8.0_73以上版本，验证：`java -version`

### 下载和解压缩Elasticsearch安装包

下载：

- https://www.elastic.co/cn/downloads/elasticsearch
- 历史版本：https://www.elastic.co/cn/downloads/past-releases/

查看目录结构：

- bin：脚本目录，包括：启动、停止等可执行脚本
- config：配置文件目录
- data：索引目录，存放索引文件的地方
- logs：日志目录
- modules：模块目录，包括了es的功能模块
- plugins：插件目录，es支持插件机制

### 配置文件

#### 位置

ES的配置文件的地址根据安装形式的不同而不同，

- 使用zip、tar安装，配置文件的地址在安装目录的config下。
- 使用RPM安装，配置文件在/etc/elasticsearch下。
- 使用MSI安装，配置文件的地址在安装目录的config下，并且会自动将config目录地址写入环境变量ES_PATH_CONF。

#### elasticsearch.yml

配置格式是YAML，可以采用如下两种方式：

方式1：层次方式

```yaml
path:
    data: /var/lib/elasticsearch
    logs: /var/log/elasticsearch
```

方式2：属性方式

```yaml
path.data: /var/lib/elasticsearch
path.logs: /var/log/elasticsearch
```

常用的配置项如下：

```yaml
cluster.name: 
	配置elasticsearch的集群名称，默认是elasticsearch。建议修改成一个有意义的名称。
node.name:
	节点名，通常一台物理服务器就是一个节点，es会默认随机指定一个名字，建议指定一个有意义的名称，方便管理
	一个或多个节点组成一个cluster集群，集群是一个逻辑的概念，节点是物理概念，后边章节会详细介绍。
path.conf: 
	设置配置文件的存储路径，tar或zip包安装默认在es根目录下的config文件夹，rpm安装默认在/etc/elasticsearch
path.data:
	设置索引数据的存储路径，默认是es根目录下的data文件夹，可以设置多个存储路径，用逗号隔开。
path.logs:
	设置日志文件的存储路径，默认是es根目录下的logs文件夹
path.plugins: 
	设置插件的存放路径，默认是es根目录下的plugins文件夹
bootstrap.memory_lock: true
	设置为true可以锁住ES使用的内存，避免内存与swap分区交换数据。
network.host: 
	设置绑定主机的ip地址，设置为0.0.0.0表示绑定任何ip，允许外网访问，生产环境建议设置为具体的ip。
http.port: 9200
	设置对外服务的http端口，默认为9200。
transport.tcp.port: 9300  集群结点之间通信端口
node.master: 
	指定该节点是否有资格被选举成为master结点，默认是true，如果原来的master宕机会重新选举新的master。
node.data: 
	指定该节点是否存储索引数据，默认为true。
discovery.zen.ping.unicast.hosts: ["host1:port", "host2:port", "..."]
	设置集群中master节点的初始列表。
discovery.zen.ping.timeout: 3s
	设置ES自动发现节点连接超时的时间，默认为3秒，如果网络延迟高可设置大些。
discovery.zen.minimum_master_nodes:
	主结点数量的最少值 ,此值的公式为：(master_eligible_nodes / 2) + 1 ，比如：有3个符合要求的主节点，那么这里要设置为2。
node.max_local_storage_nodes: 
	单机允许的最大存储结点数，通常单机启动一个结点建议设置为1，开发环境如果单机启动多个节点可设置大于1。
```

#### jvm.options

设置最小及最大的JVM堆内存大小：

在jvm.options中设置 -Xms和-Xmx：

1. 两个值设置为相等
2. 将Xmx 设置为不超过物理内存的一半。

#### log4j2.properties

日志文件设置，ES使用log4j，注意日志级别的配置。

### 启动Elasticsearch

`bin\elasticsearch.bat`，es的特点就是开箱即，无需配置，启动即可。

注意：es7 windows版本不支持机器学习，所以elasticsearch.yml中添加如下几个参数：

```
node.name: node-1  
cluster.initial_master_nodes: ["node-1"]  
xpack.ml.enabled: false 
http.cors.enabled: true
http.cors.allow-origin: /.*/
```

### 检查ES是否启动成功

浏览器访问：http://localhost:9200/?Pretty

```json
{
    "name": "node-1",
    "cluster_name": "elasticsearch",
    "cluster_uuid": "HqAKQ_0tQOOm8b6qU-2Qug",
    "version": {
        "number": "7.3.0",
        "build_flavor": "default",
        "build_type": "zip",
        "build_hash": "de777fa",
        "build_date": "2019-07-24T18:30:11.767338Z",
        "build_snapshot": false,
        "lucene_version": "8.1.0",
        "minimum_wire_compatibility_version": "6.8.0",
        "minimum_index_compatibility_version": "6.0.0-beta1"
    },
    "tagline": "You Know, for Search"
}
```

**解释：**

- name: node名称，取自机器的hostname
- cluster_name: 集群名称（默认的集群名称就是elasticsearch）
- version.number: 7.3.0，es版本号
- version.lucene_version：封装的lucene版本号

### 查询集群状态

浏览器访问 http://localhost:9200/_cluster/health

```java
{
    "cluster_name": "elasticsearch",
    "status": "green",
    "timed_out": false,
    "number_of_nodes": 1,
    "number_of_data_nodes": 1,
    "active_primary_shards": 0,
    "active_shards": 0,
    "relocating_shards": 0,
    "initializing_shards": 0,
    "unassigned_shards": 0,
    "delayed_unassigned_shards": 0,
    "number_of_pending_tasks": 0,
    "number_of_in_flight_fetch": 0,
    "task_max_waiting_in_queue_millis": 0,
    "active_shards_percent_as_number": 100
}
```

**解释：**

Status：集群状态。Green 所有分片可用。Yellow所有主分片可用。Red主分片不可用，集群不可用。

---

## Windows安装Kibana

1、kibana是es数据的前端展现，数据分析时，可以方便地看到数据。作为开发人员，可以方便访问es。

2、下载，解压kibana。

3、启动Kibana：bin\kibana.bat

4、浏览器访问 http://localhost:5601 进入Dev Tools界面。像plsql一样支持代码提示。

5、发送get请求，查看集群状态GET _cluster/health。相当于浏览器访问。

TODO：补充图形化界面

---

## Windows安装postman

是什么：postman是一个模拟http请求的工具。能够非常细致地定制化各种http请求。如get]\post\pu\delete,携带body参数等。

为什么：在没有kibana时，可以使用postman调试。

怎么用：

- Get： http://localhost:9200/
- 测试一下Get方式查询集群状态：http://localhost:9200/_cluster/health

---

## Windows安装head插件

head插件是ES的一个可视化管理插件，用来监视ES的状态，并通过head客户端和ES服务进行交互，比如创建映射、创建索引等，head的项目地址在https://github.com/mobz/elasticsearch-head 。

从ES6.0开始，head插件支持使得node.js运行。

> **1、安装node.js**

```
https://blog.csdn.net/qq_48485223/article/details/122709354
```

> **2、下载head并运行**

```
git clone git://github.com/mobz/elasticsearch-head.git 
cd elasticsearch-head 
npm install 
npm run start 
```

浏览器打开: http://localhost:9100/

> **3、运行**

![image-20230630163047408](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Elasticsearch/202306301630450.png)

打开浏览器调试工具发现报错：

`Origin null is not allowed by Access-Control-Allow-Origin.`

原因是：

- head插件作为客户端要连接ES服务（localhost:9200），此时存在跨域问题，elasticsearch默认**不允许跨域**访问。

解决方案：

- 设置elasticsearch允许跨域访问。

- 在config/elasticsearch.yml 后面增加以下参数：

  ```
  #开启cors跨域访问支持，默认为false   
  http.cors.enabled: true   
  #跨域访问允许的域名地址，(允许所有域名)以上使用正则   
  http.cors.allow-origin: /.*/
  ```

- 注意：将config/elasticsearch.yml另存为utf-8编码格式。

成功连接ES

![image-20230630163214554](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Elasticsearch/202306301632579.png)

注意：kibana\postman\head插件选择自己喜欢的一种使用即可。

本教程使用kibana的dev tool，因为地址栏省略了http://localhost:9200。