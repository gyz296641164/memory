---
title: 哨兵
category:
  - Redis
date: 2023-02-28
---

<!-- more -->

## Redis Sentinel（哨兵）   

Redis的主从复制模式下，一旦主节点由于故障不能提供服务，就会发生群龙无首的情况，如果在主机宕机时，能够在从机中选出一个来充当主机，那么就不用我们每次去手动重启主机了，Redis从2.8开始正式提供了Redis Sentinel（哨兵） 架构来解决这个问题 。

## 1、基本概念  



<div align='center'>Redis Sentinel相关名词解释</div>

| 名词             | 逻辑结构           | 物理结构            |
| ---------------- | ------------------ | ------------------- |
| 主节点（master） | Redis主服务/数据库 | 一个独立的Redis进程 |
| 从节点（slave）  | Redis从服务/数据库 | 一个独立的Redis进程 |



| 名词             | 逻辑结构                   | 物理结构                            |
| ---------------- | -------------------------- | ----------------------------------- |
| Redis数据节点    | 主节点和从节点             | 主节点和从节点的进程                |
| Sentinel节点     | 监控Redis数据节点          | 一个独立的Sentinel进程              |
| Sentinel节点集合 | 若干Sentinel节点的抽象组合 | 若干Sentinel节点进程                |
| Redis Sentinel   | Redis高可用实现方案        | Sentinel节点集合和Redis数据节点进程 |
| 应用方           | 泛指一个或多个客户端       | 一个或者多个客户端进程或线程        |



### 1.1 主从复制的问题

Redis的主从复制模式可以将主节点的数据改变同步给从节点，这样从节点就可以起到两个作用：第一，作为主节点的一个备份，一旦主节点除了故障不可达的情况，从节点可以作为后备顶上来，并且保证数据尽量不丢失（主从复制是最终一致性）。第二，从节点可以扩展主节点的读能力，一旦主节点不能支撑住大并发量的读操作，从节点可以在一定程度上帮助主节点分担读压力。

但是主从复制也带来了以下问题：  

- 一旦主节点出现故障， 需要手动将一个从节点晋升为主节点， 同时需要修改应用方的主节点地址， 还需要命令其他从节点去复制新的主节点， 整个过程都需要人工干预。  
- 主节点的写能力受到单机的限制。  
- 主节点的存储能力受到单机的限制 。

其中第一个问题就是Redis的高可用问题 ，将在以下进行介绍。第二、 三个问题属于Redis的分布式问题 。



### 1.2 高可用  

Redis主从复制模式下， 一旦主节点出现了故障不可达，对于应用方来说无法及时感知到主节点的变化， 必然会造成一定的写数据丢失和读数据错误， 甚至可能造成应用方服务不可用。图1-1到图1-2展示了一个1主2从的Redis主从复制模式下的主节点出现故障后， 是如何进行故障转移的， 过程如下所示。     

1）主节点发生故障后，客户端（client）连接主节点失败，两个从节点与主节点连接失败造成复制中断。

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084714.png" alt="image-20210524233933622" />

2） 如果主节点无法正常启动， 需要选出一个从节点（slave-1） ， 对其执行slaveof no one命令使其成为新的主节点。  

![image-20210524234028672](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084715.png)



3）原来的从节点（slave-1） 成为新的主节点后， 更新应用方的主节点信息， 重新启动应用方。  

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084716.png" alt="image-20210524234057278" />

4）客户端命令另一个从节点（slave-2） 去复制新的主节点（new-master）  

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084717.png" alt="image-20210524234208542" />

5）待原来的主节点恢复后， 让它去复制新的主节点。  

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084718.png" alt="image-20210524234241368" />

上述处理过程就可以认为整个服务或者架构的设计不是高可用的， 因为整个故障转移的过程需要人介入。即使把上述流程自动化了， 但是仍然存在如下问题：  

- **第一， 判断节点不可达的机制是否健全和标准。**   
- **第二， 如果有多个从节点， 怎样保证只有一个被晋升为主节点。**   
- **第三，通知客户端新的主节点机制是否足够健壮。** 

Redis Sentinel正是用于解决这些问题 ！



### 1.3 Redis Sentinel的高可用性

当主节点出现故障时， Redis Sentinel能自动完成故障发现和故障转移，并通知应用方， 从而实现真正的高可用。  

**注意**

- Redis Sentinel（Redis高可用实现方案）是一个分布式架构，其中包含若干个`Sentinel`节点和`Redis数据节点`，每个Sentinel节点会对数据节点和其余Sentinel节点进行监控，当它发现节点不可达时，会对节点做下线标识。如果被标识的是主节点，它还会和其他Sentinel节点进行“协商”，当大多数Sentinel节点都认为主节点不可达时，它们会选举出一个Sentinel节点来完成自动故障转移的工作， 同时会将这个变化实时通知给Redis应用方。 整个过程完全是自动的， 不需要人工来介入， 所以这套方案很有效地解决了Redis的高可用问题。  

- 这里的分布式是指：Redis数据节点、Sentinel节点集合、客户端分布在多个物理节点的架构，不要与Redis Cluster分布式混淆。

- Redis Sentinel与Redis主从复制模式**只是多了若干Sentinel节点**， 所以Redis Sentinel并没有针对Redis节点做了特殊处理，   

  Redis主从复制与Redis Sentinel架构的区别

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084719.png" alt="image-20210525000448572" />


从逻辑架构上看， Sentinel节点集合会定期对所有节点进行监控， 特别是对主节点的故障实现自动转移。  

下面以1个主节点、 2个从节点、 3个Sentinel节点组成的Redis Sentinel为例子进行说明， 拓扑结构如图所示。  

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084720.png" alt="image-20210525000654700" />


整个故障转移的处理逻辑有下面4个步骤：  

1. 如图所示， 主节点出现故障， 此时两个从节点与主节点失去连接， 主从复制失败。  

   <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084721.png" alt="image-20210525001600460" />


2. 每个Sentinel节点通过定期监控发现主节点出现了故障。  

   <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084722.png" alt="image-20210525001716060" />

3. 多个Sentinel节点对主节点的故障达成一致， 选举出sentinel-3节点作为领导者负责故障转移。  

   <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084723.png" alt="image-20210525001828064" />

4. Sentinel领导者节点执行了故障转移， 整个过程和高可用一样的，只不过是自动化的。

   <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084724.png" alt="image-20210525002011869" />

5. 故障转移后整个Redis Sentinel的拓扑结构图。  

   <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084725.png" alt="image-20210525002106871" />

通过上面介绍的Redis Sentinel逻辑架构以及故障转移的处理， 可以看出Redis Sentinel具有以下几个功能：  

- 监控： Sentinel节点会定期检测Redis数据节点、 其余Sentinel节点是否可达。  
- 通知： Sentinel节点会将故障转移的结果通知给应用方。  
- 主节点故障转移： 实现从节点晋升为主节点并维护后续正确的主从关系。  
- 配置提供者： 在Redis Sentinel结构中， 客户端在初始化的时候连接的是Sentinel节点集合， 从中获取主节点信息。  

同时看到， Redis Sentinel包含了若个Sentinel节点， 这样做也带来了两个好处： 

- 对于节点的故障判断是由多个Sentinel节点共同完成， 这样可以有效地防止误判。  
- Sentinel节点集合是由若干个Sentinel节点组成的， 这样即使个别Sentinel节点不可用， 整个Sentinel节点集合依然是健壮的。  

但是Sentinel节点本身就是独立的Redis节点， 只不过它们有一些特殊，它们不存储数据， 只支持部分命令。   

***

## 2、安装和部署

### 2.1 部署拓扑结构  

以3个Sentinel节点、 1个主节点、 2个从节点组成一个RedisSentinel进行说明， 拓扑结构如图所示。  

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084726.png" alt="image-20210525222026897" />



具体的物理部署如表所示。

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084727.png" alt="image-20210525222140497" />



### 2.2 部署Redis数据节点  

Redis Sentinel中Redis数据节点没有做任何特殊配置，  以一个比较简单的配置进行说明。  

1. 启动主节点  

   - 配置：  

     ```
     redis-6379.conf
     port 6379
     daemonize yes
     logfile "6379.log"
     dbfilename "dump-6379.rdb"
     dir "/opt/soft/redis/data/"
     ```
   
   - 启动主节点：  

     ```
     redis-server redis-6379.conf
     ```

   - 确认是否启动。 一般来说只需要ping命令检测一下就可以， 确认Redis数据节点是否已经启动。  
   
     ```
     $ redis-cli -h 127.0.0.1 -p 6379 ping
     PONG
     ```
   
     
   
2. 启动两个从节点  

   - 配置：
     两个从节点的配置是完全一样的， 下面以一个从节点为例子进行说明，和主节点的配置不一样的是添加了slaveof配置。  
   
     ```
     redis-6380.conf
     port 6380
     daemonize yes
     logfile "6380.log"
     dbfilename "dump-6380.rdb"
     dir "/opt/soft/redis/data/"
     slaveof 127.0.0.1 6379
     ```
   
   - 启动两个从节点：  

     ```
     redis-server redis-6380.conf
     redis-server redis-6381.conf
     ```
   
   - 验证：  
   
     ```
     $ redis-cli -h 127.0.0.1 -p 6380 ping
     PONG
     $ redis-cli -h 127.0.0.1 -p 6381 ping
     PONG
     ```
   
     
   
   3. 确认主从关系 
   
      主节点的视角， 它有两个从节点， 分别是127.0.0.1： 6380和127.0.0.1：6381

      ```
      $ redis-cli -h 127.0.0.1 -p 6379 info replication
      # Replication
      role:master
      connected_slaves:2
      slave0:ip=127.0.0.1,port=6380,state=online,offset=281,lag=1
      slave1:ip=127.0.0.1,port=6381,state=online,offset=281,lag=0
      .................
      ```
      
      从节点的视角， 它的主节点是127.0.0.1： 6379：  
   
      ```
      $ redis-cli -h 127.0.0.1 -p 6380 info replication
      # Replication
      role:slave
      master_host:127.0.0.1
      master_port:6379
      master_link_status:up
      .................
      ```
      
      此时拓扑结构如图所示。  
      
      ​	<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084728.png" alt="image-20210525224231878" />

添加两个从节点。



### 2.3 部署Sentinel节点  

3个Sentinel节点的部署方法是完全一致的（端口不同） ， 下面以sentinel-1节点的部署为例子进行说明。  

1. 配置Sentinel节点  

   

   ```
   redis-sentinel-26379.conf
   port 26379
   daemonize yes
   logfile "26379.log"
   dir /opt/soft/redis/data
   sentinel monitor mymaster 127.0.0.1 6379 2
   sentinel down-after-milliseconds mymaster 30000
   sentinel parallel-syncs mymaster 1
   sentinel failover-timeout mymaster 180000
   ```

   - Sentinel节点的默认端口是26379。
   - sentinel monitor mymaster127.0.0.1 6379 2配置代表sentinel-1节点需要监控127.0.0.1： 6379这个主节点， 2代表判断主节点失	   败至少需要2个Sentinel节点同意， mymaster是主节点的别名。

   

2. 启动Sentinel节点  

   Sentinel节点的启动方法有两种：  

   - 方法一， 使用redis-sentinel命令：  

     ```
    redis-sentinel redis-sentinel-26379.conf
     ```
   
   - 方法二， 使用redis-server命令加--sentinel参数：  

     ```
      redis-server redis-sentinel-26379.conf --sentinel
     ```
   
     两种方法本质上是一样的。 

     

3. 确认  

   从下面info命令查询的Sentinel片段来看，Sentinel节点找到了主节点127.0.0.1： 6379， 发现了它的两个从节点， 同时发现Redis Sentinel一共有3个Sentinel节点。 这里只需要了解Sentinel节点能够彼此感知到对方， 同时能够感知到Redis数据节点就可以了：  

   ```
   $ redis-cli -h 127.0.0.1 -p 26379 info Sentinel
   # Sentinel
   sentinel_masters:1
   sentinel_tilt:0
   sentinel_running_scripts:0
   sentinel_scripts_queue_length:0
   master0:name=mymaster,status=ok,address=127.0.0.1:6379,slaves=2,sentinels=3
   ```

   当三个Sentinel节点都启动后， 整个拓扑结构如图所示。  

   <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084729.png" alt="image-20210525230746759" />

### 2.4 配置优化  

> 配置说明和优化  

```
port 26379
dir /opt/soft/redis/data
sentinel monitor mymaster 127.0.0.1 6379 2
sentinel down-after-milliseconds mymaster 30000
sentinel parallel-syncs mymaster 1
sentinel failover-timeout mymaster 180000
#sentinel auth-pass <master-name> <password>
#sentinel notification-script <master-name> <script-path>
#sentinel client-reconfig-script <master-name> <script-path>
```

**（1） sentinel monitor**

 配置如下： 

```
sentinel monitor <master-name> <ip> <port> <quorum>
```

本配置说明Sentinel节点要监控的是一个名字叫做“master-name”， ip地址和端口为标签“ip”标签“port”的主节点。 **标签quorum代表要判定主节点最终不可达所需要的票数。**但实际上**Sentinel节点会对所有节点进行监控**， 但是在Sentinel节点的配置中没有看到有关从节点和其余Sentinel节点的配置， 那是因为**Sentinel节点会从主节点中获取有关从节点以及其余Sentinel节点的相关信息**。

例如某个Sentinel初始节点配置如下：  

```
port 26379
daemonize yes
logfile "26379.log"
dir /opt/soft/redis/data
sentinel monitor mymaster 127.0.0.1 6379 2
sentinel down-after-milliseconds mymaster 30000
sentinel parallel-syncs mymaster 1
sentinel failover-timeout mymaster 180000
```

 当所有节点启动后， 配置文件中的内容发生了变化， 体现在三个方面：  

- Sentinel节点自动发现了从节点、 其余Sentinel节点。
- 去掉了默认配置， 例如parallel-syncs、 failover-timeout参数。
- 添加了配置纪元相关参数。  

启动后变化为：  

```
port 26379
daemonize yes
logfile "26379.log"
dir "/opt/soft/redis/data"
sentinel monitor mymaster 127.0.0.1 6379 2
sentinel config-epoch mymaster 0
sentinel leader-epoch mymaster 0
#发现两个slave节点
sentinel known-slave mymaster 127.0.0.1 6380
sentinel known-slave mymaster 127.0.0.1 6381
#发现两个sentinel节点
sentinel known-sentinel mymaster 127.0.0.1 26380 282a70ff56c36ed56e8f7ee6ada741
24140d6f53
sentinel known-sentinel mymaster 127.0.0.1 26381 f714470d30a61a8e39ae031192f1fe
ae7eb5b2be
sentinel current-epoch 0
```

​		标签quorum还与Sentinel节点的领导者选举有关， 至少要有 `max（quorum， num（sentinels） /2+1）` 个Sentinel节点参与选举， 才能选出领导者Sentinel， 从而完成故障转移。 例如有5个Sentinel节点， quorum=4， 那么至少要有max（quorum， num（sentinels） /2+1） =4个在线Sentinel节点才可以进行领导者选举。  

**（2） sentinel down-after-milliseconds**  

配置如下：  

```
sentinel down-after-milliseconds 标签master-name 标签times
```

​		每个Sentinel节点都要通过定期发送ping命令来判断Redis数据节点和其余Sentinel节点是否可达， **如果超过了down-after-milliseconds配置的时间且没有有效的回复， 则判定节点不可达**， 标签times（单位为毫秒） 就是超时时间。 这个配置是对节点失败判定的重要依据。  

​		优化说明： down-after-milliseconds越大， 代表Sentinel节点对于节点不可达的条件越宽松， 反之越严格。 条件宽松有可能带来的问题是节点确实不可达了， 那么应用方需要等待故障转移的时间越长， 也就意味着应用方故障时间可能越长。 条件严格虽然可以及时发现故障完成故障转移， 但是也存在一定的误判率。  

**（3） sentinel parallel-syncs**  

配置如下：  

```
sentinel parallel-syncs <master-name> <nums>
```

​		`parallel-syncs`就是用来限制在一次故障转移之后， 每次向新的主节点发起复制操作的从节点个数。 如果这个参数配置的比较大， 那么多个从节点会向新的主节点同时发起复制操作， 尽管复制操作通常不会阻塞主节点，但是同时向主节点发起复制， 必然会对主节点所在的机器造成一定的网络和磁盘IO开销。   

​		parallelsyncs=3会同时发起复制， parallel-syncs=1时从节点会轮询发起复制。  

​		<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084730.png" alt="image-20210525233048986" />



**（4） sentinel failover-timeout**  

配置如下（部署文档时总是提示标签缺失，所以用中文代替）：  

```
sentinel failover-timeout 标签master-name 标签times
```

failover-timeout通常被解释成故障转移超时时间， **但实际上它作用于故障转移的各个阶段：**

a） 选出合适从节点。
b） 晋升选出的从节点为主节点。
c） 命令其余从节点复制新的主节点。
d） 等待原主节点恢复后命令它去复制新的主节点。  

failover-timeout的作用具体体现在四个方面：  

1） 如果Redis Sentinel对一个主节点故障转移失败， 那么下次再对该主节点做故障转移的起始时间是failover-timeout的2倍。

2） 在b） 阶段时， 如果Sentinel节点向a） 阶段选出来的从节点执行slaveof no one一直失败（例如该从节点此时出现故障） ， 当此过程超过failover-timeout时， 则故障转移失败。  

3） 在b） 阶段如果执行成功， Sentinel节点还会执行info命令来确认a）阶段选出来的节点确实晋升为主节点， 如果此过程执行时间超过	  failovertimeout时， 则故障转移失败。

4） 如果c） 阶段执行时间超过了failover-timeout（不包含复制时间） ，则故障转移失败。 注意即使超过了这个时间， Sentinel节点也会	  最终配置从节点去同步最新的主节点。  



**（5） sentinel auth-pass**  

配置如下：  

```
sentinel auth-pass <master-name> <password>
```

如果Sentinel监控的主节点配置了密码， sentinel auth-pass配置通过添加主节点的密码， 防止Sentinel节点对主节点无法监控。  

**（6） sentinel notification-script**

配置如下：  

```
sentinel notification-script <master-name> <script-path>
```

sentinel notification-script的作用是在故障转移期间， 当一些警告级别的Sentinel事件发生（指重要事件， 例如-sdown： 客观下线、 -odown： 主观下线） 时， 会触发对应路径的脚本， 并向脚本发送相应的事件参数。  

**（7） sentinel client-reconfig-script**  

配置如下：

```
sentinel client-reconfig-script <master-name> <script-path>  
```

sentinel client-reconfig-script的作用是在故障转移结束后， 会触发对应路径的脚本， 并向脚本发送故障转移结果的相关参数。   



> 如何监控多个主节点  

Redis Sentinel可以同时监控多个主节点。配置方法也比较简单， 只需要指定多个masterName来区分不同的主节点即可， 例如下面的配置监控monitor master-business-1（10.10.xx.1： 6379） 和monitor master-business-2（10.10.xx.2： 6379） 两个主节点：

```
sentinel monitor master-business-1 10.10.xx.1 6379 2
sentinel down-after-milliseconds master-business-1 60000
sentinel failover-timeout master-business-1 180000
sentinel parallel-syncs master-business-1 1
sentinel monitor master-business-2 10.16.xx.2 6380 2
sentinel down-after-milliseconds master-business-2 10000
sentinel failover-timeout master-business-2 180000
sentinel parallel-syncs master-business-2 1
```

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084731.png" alt="image-20210525233735172" />



> 调整配置  

和普通的Redis数据节点一样， Sentinel节点也支持动态地设置参数， 而且和普通的Redis数据节点一样并不是支持所有的参数， 具体使用方法如下：  

```
sentinel set <param> <value>
```

sentinel set命令支持的参数  

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084732.png" alt="image-20210525233900346" />

有几点需要注意一下：  

1） sentinel set命令只对当前Sentinel节点有效。
2） sentinel set命令如果执行成功会立即刷新配置文件，这点和Redis普通数据节点设置配置需要执行config rewrite刷新到配置文件不同。
3） 建议所有Sentinel节点的配置尽可能一致， 这样在故障发现和转移时比较容易达成一致。  

4） Sentinel对外不支持config命令。  

***

## 3、客户端连接

### 3.1 Java操作Redis Sentinel  

Jedis针对Redis Sentinel给出了一个JedisSentinelPool， 很显然这个连接池保存的连接还是针对主节点的。 Jedis给出很多构造方法， 其中最全的如下所示：  

```
public JedisSentinelPool(String masterName, Set<String> sentinels,
	final GenericObjectPoolConfig poolConfig, final int connectionTimeout,
	final int soTimeout,
	final String password, final int database,
	final String clientName)
```

具体参数含义如下：

- masterName——主节点名。
- sentinels——Sentinel节点集合。
- poolConfig——common-pool连接池配置。
- connectTimeout——连接超时。
- soTimeout——读写超时。
- password——主节点密码。
- database——当前数据库索引。  
- clientName——客户端名。  

例如要想通过简单的几个参数获取JedisSentinelPool， 可以直接按照下面方式进行JedisSentinelPool的初始化。  

```
JedisSentinelPool jedisSentinelPool = new JedisSentinelPool(masterName,
sentinelSet, poolConfig, timeout);
```

此时timeout既代表连接超时又代表读写超时， password为空， database默认使用0， clientName为空。   

我们在使用JedisSentinelPool时也要尽可能按照common-pool的标准模式进行代码的书写，   

```
Jedis jedis = null;
	try {
		jedis = jedisSentinelPool.getResource();
		// jedis command
	} catch (Exception e) {
		logger.error(e.getMessage(), e);
	} finally {
		if (jedis != null)
		//并不是关闭Jedis连接。
		jedis.close();
}
```



***

## 4、本章重点回顾

1. Redis Sentinel是Redis的高可用实现方案： 故障发现、 故障自动转移、 配置中心、 客户端通知。
2. Redis Sentinel从Redis2.8版本开始才正式生产可用， 之前版本生产不可用。
3. 尽可能在不同物理机上部署Redis Sentinel所有节点。
4. Redis Sentinel中的Sentinel节点个数应该为大于等于3且最好为奇数。
5. Redis Sentinel中的数据节点与普通数据节点没有区别。
6. 客户端初始化时连接的是Sentinel节点集合， 不再是具体的Redis节点， 但Sentinel只是配置中心不是代理。
7. Redis Sentinel通过三个定时任务实现了Sentinel节点对于主节点、 从节点、 其余Sentinel节点的监控。
8. Redis Sentinel在对节点做失败判定时分为主观下线和客观下线。
9. 看懂Redis Sentinel故障转移日志对于Redis Sentnel以及问题排查非常有帮助。
10. Redis Sentinel实现读写分离高可用可以依赖Sentinel节点的消息通知， 获取Redis数据节点的状态变化。  

**遗漏补缺：**

- 领导者Sentinel节点选举 实现原理
- 故障转移 实现原理
- 故障转移日志分析   
