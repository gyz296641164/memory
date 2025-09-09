---
title: 23、Elasticsearch7.x 配置文件详解
category:
  - Elasticsearch
date: 2025-09-09
---

<!-- more -->

## 1.配置文件(elasticsearch.yml)

```yaml
#ES集群名称，同一个集群内的所有节点集群名称必须保持一致
cluster.name: ES-Cluster

#ES集群内的节点名称，同一个集群内的节点名称要具备唯一性
node.name: ES-master-01

#允许节点是否可以成为一个master节点，ES是默认集群中的第一台机器成为master，如果这台机器停止就会重新选举
node.master: true

#允许该节点存储索引数据（默认开启）
node.data: true

#数据存储路径(path可以指定多个存储位置,分散存储，有助于性能提升)
#目录还要对elasticsearch的运行用户有写入权限
path.data: /usr/local/elasticsearch-cluster/elasticsearch-a/data
path.logs: /usr/local/elasticsearch-cluster/elasticsearch-a/logs

#在ES运行起来后锁定ES所能使用的堆内存大小，锁定内存大小一般为可用内存的一半左右；锁定内存后就不会使用交换分区
#如果不打开此项，当系统物理内存空间不足，ES将使用交换分区，ES如果使用交换分区，那么ES的性能将会变得很差
bootstrap.memory_lock: true

#es绑定地址，支持IPv4及IPv6，默认绑定127.0.0.1；es的HTTP端口和集群通信端口就会监听在此地址上
network.host: 192.168.3.21

#是否启用tcp无延迟，true为启用tcp不延迟，默认为false启用tcp延迟
network.tcp.no_delay: true
#是否启用TCP保持活动状态，默认为true
network.tcp.keep_alive: true
#是否应该重复使用地址。默认true，在Windows机器上默认为false
network.tcp.reuse_address: true
#tcp发送缓冲区大小，默认不设置
network.tcp.send_buffer_size: 128mb
#tcp接收缓冲区大小，默认不设置
network.tcp.receive_buffer_size: 128mb

#设置集群节点通信的TCP端口，默认是9300
transport.tcp.port: 9301
#设置是否压缩TCP传输时的数据，默认为false
transport.tcp.compress: true
#设置http请求内容的最大容量，默认是100mb
http.max_content_length: 200mb

#是否开启跨域访问
http.cors.enabled: true
#开启跨域访问后的地址限制，*表示无限制
http.cors.allow-origin: "*"
#定义ES对外调用的http端口，默认是9200
http.port: 9201

#Elasticsearch7.x新增参数，写入候选主节点的设备地址，来开启服务时就可以被选为主节点,由discovery.zen.ping.unicast.hosts:参数改变而来
discovery.seed_hosts: ["192.168.3.21:9301", "192.168.3.22:9301","192.168.3.23​:9301"]
#Elasticsearch7新增参数，写入候选主节点的设备地址，来开启服务时就可以被选为主节点
cluster.initial_master_nodes: ["192.168.3.21​:9301", "192.168.3.22:9301","192.168.3.23:9301"]

#Elasticsearch7新增参数，设置每个节点在选中的主节点的检查之间等待的时间。默认为1秒
cluster.fault_detection.leader_check.interval: 2s 
#Elasticsearch7新增参数，启动后30秒内，如果集群未形成，那么将会记录一条警告信息，警告信息未master not fount开始，默认为10秒
discovery.cluster_formation_warning_timeout: 30s 
#Elasticsearch7新增参数，节点发送请求加入集群后，在认为请求失败后，再次发送请求的等待时间，默认为60秒
cluster.join.timeout: 30s
#Elasticsearch7新增参数，设置主节点等待每个集群状态完全更新后发布到所有节点的时间，默认为30秒
cluster.publish.timeout: 90s 
#集群内同时启动的数据任务个数，默认是2个
cluster.routing.allocation.cluster_concurrent_rebalance: 32
#添加或删除节点及负载均衡时并发恢复的线程个数，默认4个
cluster.routing.allocation.node_concurrent_recoveries: 32
#初始化数据恢复时，并发恢复线程的个数，默认4个
cluster.routing.allocation.node_initial_primaries_recoveries: 32

# 开启xpack安全验证
xpack.security.enabled: true
xpack.license.self_generated.type: basic
xpack.security.transport.ssl.enabled: true
# 证书配置
xpack.security.transport.ssl.verification_mode: certificate
xpack.security.transport.ssl.keystore.path: certs/elastic-certificates.p12
xpack.security.transport.ssl.truststore.path: certs/elastic-certificates.p12
```

更多配置请看官网：[传送门](https://www.elastic.co/guide/en/elasticsearch/reference/master/modules-discovery-settings.html)

---

## 2.JVM配置

jvm配置在conf目录下 vim jvm.options 。

ES默认JVM配置 `Xms(minimum heap size)=1g,Xmx(maxmimum heap size)=1g`

生产环境，这个配置就比较重要了，需要确保 ES 有足够堆空间可用。

注意：Xms 和 Xmx 不能大于你物理机内存的 50%**。**

```properties
#堆内存配置
#Xms表示ES堆内存初始大小
-Xms16g
#Xmx表示ES堆内存的最大可用空间
-Xmx16g                                      
#GC配置
-XX:+UseConcMarkSweepGC
#使用CMS内存收集
-XX:CMSInitiatingOccupancyFraction=75
#使用CMS作为垃圾回收使用，75%后开始CMS收集
-XX:+UseCMSInitiatingOccupancyOnly
#使用手动定义初始化开始CMS收集
```

