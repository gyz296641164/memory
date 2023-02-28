---
title: 初识Redis
category:
  - Redis
date: 2023-02-28
---

<!-- more -->

## 安装Redis

### 在Linux上安装Redis  

源码的方式进行安装， 整个安装只需以下六步即可完成， 以3.0.7版本为例：  

```
$ wget http://download.redis.io/releases/redis-3.0.7.tar.gz
$ tar xzf redis-3.0.7.tar.gz
$ ln -s redis-3.0.7 redis
$ cd redis
$ make
$ make install
```

1. 下载Redis指定版本的源码压缩包到当前目录。
2. 解压缩Redis源码压缩包。
3.  建立一个redis目录的软连接， 指向redis-3.0.7。
4.  进入redis目录。
5. 编译（编译之前确保操作系统已经安装gcc） 。
6. 安装。  

这里有两点要注意： 第一， 第3步中建立了一个redis目录的软链接， 这样做是为了不把redis目录固定在指定版本上， 有利于Redis未来版本升级，算是安装软件的一种好习惯。 第二， 第6步中的安装是将Redis的相关运行文件放到/usr/local/bin/下， 这样就可以在任意目录下执行Redis的命令。 例如安装后， 可以在任何目录执行redis-cli–v查看Redis的版本。  

```
$ redis-cli -v
redis-cli 3.0.7
```



### 配置、 启动、 操作、 关闭Redis  

Redis安装之后， src和/usr/local/bin目录下多了几个以redis开头可执行文件， 我们称之为Redis Shell， 这些可执行文件可以启动和停止Redis、 可以检测和修复Redis的持久化文件， 还可以检测Redis的性能。   



<div align="center">Redis可执行文件说明  </div>

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084428.png" alt="image-20210530230103003" />



#### 1、启动Redis

有三种方法启动Redis： 默认配置、 运行配置、 配置文件启动。  

（1） 默认配置  

这种方法会使用Redis的默认配置来启动， 下面就是redis-server执行后输出的相关日志：  

```
$ redis-server
```

因为直接启动无法自定义配置， 所以**这种方式是不会在生产环境中使用的**。  



（2） 运行启动

redis-server加上要修改配置名和值（可以是多对） ， 没有设置的配置将使用默认配置：  

```
# redis-server --configKey1 configValue1 --configKey2 configValue2
```

例如， 如果要用6380作为端口启动Redis， 那么可以执行：  

```
# redis-server --port 6380
```

虽然运行配置可以自定义配置， 但是**如果需要修改的配置较多或者希望将配置保存到文件中， 不建议使用这种方式。**  



（3） 配置文件启动  

将配置写到指定文件里， 例如我们将配置写到了/opt/redis/redis.conf中， 那么只需要执行如下命令即可启动Redis：  

```
# redis-server /opt/redis/redis.conf
```



#### 2、Redis命令行客户端  

redis-cli可以使用两种方式连接Redis服务器。  

- 第一种是交互式方式： 通过 `redis-cli-h{host}-p{port}` 的方式连接到Redis服务， 之后所有的操作都是通过交互的方式实现， 不需要再执行redis-cli了， 例如：  

  ```
  redis-cli -h 127.0.0.1 -p 6379
  127.0.0.1:6379> set hello world
  OK
  127.0.0.1:6379> get hello
  "world"
  ```

- 第二种是命令方式： 用 `redis-cli-h ip{host}-p{port}{command}` 就可以直接得到命令的返回结果， 例如：  

  ```
  redis-cli -h 127.0.0.1 -p 6379 get hello
  "world"
  ```

**注意:**

- 如果没有-h参数， 那么默认连接127.0.0.1； 如果没有-p， 那么默认6379端口， 也就是说如果-h和-p都没写就是连接
  127.0.0.1：6379这个Redis实例。 
- redis-cli是学习Redis的重要工具，同时redis-cli还提供了很多有价值的参数， 可以帮助解决很多问题。

#### 3、停止Redis服务  

Redis提供了shutdown命令来停止Redis服务， 例如要停掉127.0.0.1上6379端口上的Redis服务， 可以执行如下操作。  

```
$ redis-cli shutdown
```

**注意:**  

- Redis关闭的过程： 断开与客户端的连接、 持久化文件生成， 是一种相对优雅的关闭方式。

- 除了可以通过shutdown命令关闭Redis服务以外， 还可以通过kill进程号的方式关闭掉Redis， 但是不要粗暴地使用kill-9强制杀死Redis服务， 不但不会做持久化操作， 还会造成缓冲区等资源不能被优雅关闭， 极端情况会造成AOF和复制丢失数据的情况。

- shutdown还有一个参数， 代表是否在关闭Redis前， 生成持久化文件：  

  ```
  redis-cli shutdown nosave|save
  ```



***



## 1、慢查询分析

所谓慢查询日志就是系统在命令执行前后计算每条命令的执行时间，当超过预设阈值，就将这条命令的相关信息（例如：发生时间，耗时，命令的详细信息）记录下来，Redis也提供了类似的功能。

如图所示， Redis客户端执行一条命令分为如下4个部分：  

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084429.png" alt="image-20210530130021191" />

1. 发送命令
2. 命令排队
3. 执行命令
4. 返回结果

需要注意， 慢查询只统计步骤3 的时间， 所以没有慢查询并不代表客户端没有超时问题。  



### 1.1 慢查询的两个配置参数

对于慢查询功能， 需要明确两件事：  

- 预设阀值怎么设置？
- 慢查询记录存放在哪？  

Redis提供了 `slowlog-log-slower-than` 和 `slowlog-max-len`配置来解决这两个问题。`slowlog-log-slower-than` 就是那个预设阈值，它的单位是微秒（1秒=1000毫秒=100000微秒），默认值是10000，假如执行了一条“很慢”的命令（例如keys*），如果他的执行时间超过了10000微秒，那么它将被记录在慢查询日志中。

**提示**：如果slowlog-log-slower-than=0会记录所有的命令， slowlog-log-slowerthan<0对于任何命令都不会进行记录。  

Redis使用了一个列表来存储慢查询日志， `slowlog-max-len` 就是列表的最大长度。 一个新的命令满足慢查询条件时被插入到这个列表中， 当慢查询日志列表已处于其最大长度时， 最早插入的一个命令将从列表中移出， 例如 `slowlog-max-len` 设置为5， 当有第6条慢查询插入的话， 那么队头的第一条数据就出列， 第6条慢查询就会入列。  



### 1.2 两种修改慢查询配置的方法

一种是修改配置文件， 另一种是使用config set命令动态修改。 例如下面使用config set命令将`slowlog-log-slower-than` 设置为20000微秒，`slowlog-max-len`  设置为1000：    

```
config set slowlog-log-slower-than 20000
config set slowlog-max-len 1000
config rewrite
```

如果要Redis将配置持久化到本地配置文件， 需要执行config rewrite命令， 如图所示。  

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084430.png" alt="image-20210530135648796" />

虽然慢查询日志是存放在Redis内存列表中的， 但是**Redis并没有暴露这个列表的键**， 而是通过一组命令来实现对慢查询日志的访问和管理。 下面介绍这几个命令。  

（1） 获取慢查询日志  

```
slowlog get [n]
```

下面操作返回当前Redis的慢查询， 参数n可以指定条数：  

```
127.0.0.1:6379> slowlog get
1) 1) (integer) 666
   2) (integer) 1456786500
   3) (integer) 11615
   4) 1) "BGREWRITEAOF"
2) 1) (integer) 665
   2) (integer) 1456718400
   3) (integer) 12006
   4) 1) "SETEX"
   	  2) "video_info_200"
      3) "300"
      4) "2"
...
```

慢查询日志由4个属性组成， 分别是慢查询日志的 `标识id` 、 `发生时间戳`、 `命令耗时`、 `执行命令和参数`， 慢查询列表如图所示。 

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084431.png" alt="image-20210530140949992" /> 

（2） 获取慢查询日志列表当前的长度  

```
slowlog len
```

例如， 当前Redis中有45条慢查询：  

```
127.0.0.1:6379> slowlog len
(integer) 45
```

（3） 慢查询日志重置  

```
slowlog reset
```

实际是对列表做清理操作， 例如：  

```
127.0.0.1:6379> slowlog len
(integer) 45
127.0.0.1:6379> slowlog reset
OK
127.0.0.1:6379> slowlog len
(integer) 0
```



### 1.3 最佳实践  

慢查询功能可以有效地帮助我们找到Redis可能存在的瓶颈， 但在实际使用过程中要注意以下几点：  

- slowlog-max-len配置建议：线上建议调大慢查询列表， 记录慢查询时Redis会对长命令做截断操作， 并不会占用大量内存。 增大慢查询列表可以减缓慢查询被剔除的可能， 例如线上可设置为1000以上。  

- slowlog-log-slower-than配置建议： 默认值超过10毫秒判定为慢查询，需要根据Redis并发量调整该值。 由于Redis采用单线程响应命令， 对于高流量的场景， 如果命令执行时间在1毫秒以上， 那么Redis最多可支撑OPS（即operation per second 每秒操作次数）不到1000。 因此对于高OPS场景的Redis建议设置为1毫秒。  

- 慢查询只记录命令执行时间， 并不包括命令排队和网络传输时间。 因此客户端执行命令的时间会大于命令实际执行时间。 因为命令执行排队机制， 慢查询会导致其他命令级联阻塞， 因此当客户端出现请求超时， 需要检查该时间点是否有对应的慢查询， 从而分析出是否为慢查询导致的命令级联阻塞。  

- 由于慢查询日志是一个先进先出的队列， 也就是说如果慢查询比较多的情况下， 可能会丢失部分慢查询命令， 为了防止这种情况发生， 可以定期执行slow get命令将慢查询日志持久化到其他存储中（例如MySQL），然后可以制作可视化界面（Redis私有云CacheCloud  ）进行查询。

  

***

## 2、事务与Lua

### 2.1 事务

简单地说， 事务表示一组动作， 要么全部执行， 要么全部不执行。  

Redis提供了简单的事务功能， 将一组需要一起执行的命令放到multi和exec两个命令之间。 multi命令代表事务开始， exec命令代表事务结束， 它们之间的命令是原子顺序执行的， 例如下面操作实现了上述用户关注问题。  

```
127.0.0.1:6379> multi
OK
127.0.0.1:6379> sadd user:a:follow user:b
QUEUED
127.0.0.1:6379> sadd user:b:fans user:a
QUEUED
```

可以看到sadd命令此时的返回结果是QUEUED， 代表命令并没有真正执行， 而是暂时保存在Redis中。 如果此时另一个客户端执行sismember user：a： follow user： b返回结果应该为0。  

```
127.0.0.1:6379> sismember user:a:follow user:b
(integer) 0
```

只有当exec执行后， 用户A关注用户B的行为才算完成， 如下所示返回的两个结果对应sadd命令。  

```
127.0.0.1:6379> exec
1) (integer) 1
2) (integer) 1
127.0.0.1:6379> sismember user:a:follow user:b
(integer) 1
```

如果要停止事务的执行， 可以使用discard命令代替exec命令即可。

```
127.0.0.1:6379> discard
OK
127.0.0.1:6379> sismember user:a:follow user:b
(integer) 0
```

 如果事务中的命令出现错误， Redis的处理机制也不尽相同。  

1. 命令错误  

   例如下面操作错将set写成了sett， 属于语法错误， 会造成整个事务无法执行， key和counter的值未发生变化：  

   ```
   127.0.0.1:6388> mget key counter
   1) "hello"
   2) "100"
   127.0.0.1:6388> multi
   OK
   127.0.0.1:6388> sett key world
   (error) ERR unknown command 'sett'
   127.0.0.1:6388> incr counter
   QUEUED
   127.0.0.1:6388> exec
   (error) EXECABORT Transaction discarded because of previous errors.
   127.0.0.1:6388> mget key counter
   1) "hello"
   2) "100"
   ```



2. 运行时错误  

   例如用户B在添加粉丝列表时， 误把sadd命令写成了zadd命令， 这种就是运行时命令， 因为语法是正确的：  

   ```
   127.0.0.1:6379> multi
   OK
   127.0.0.1:6379> sadd user:a:follow user:b
   QUEUED
   127.0.0.1:6379> zadd user:b:fans 1 user:a
   QUEUED
   127.0.0.1:6379> exec
   1) (integer) 1
   2) (error) WRONGTYPE Operation against a key holding the wrong kind of value
   127.0.0.1:6379> sismember user:a:follow user:b
   (integer) 1
   ```

   可以看到Redis并不支持回滚功能， `sadd user： a： follow user： b` 命令已经执行成功， 开发人员需要自己修复这类问题 ! 



有些应用场景需要在事务之前， 确保事务中的key没有被其他客户端修改过， 才执行事务， 否则不执行（类似乐观锁） 。 Redis提供了watch命令来解决这类问题， 下表展示了两个客户端执行命令的时序。  

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084432.png" alt="image-20210530145145336" />

可以看到“客户端-1”在执行multi之前执行了watch命令， “客户端-2”在“客户端-1”执行exec之前修改了key值， 造成事务没有执行（exec结果为nil） ， 整个代码如下所示：  

```
#T1： 客户端1
127.0.0.1:6379> set key "java"
OK
#T2： 客户端1
127.0.0.1:6379> watch key
OK
#T3： 客户端1
127.0.0.1:6379> multi
OK
#T4： 客户端2
127.0.0.1:6379> append key python
(integer) 11
#T5： 客户端1
127.0.0.1:6379> append key jedis
QUEUED
#T6： 客户端1
127.0.0.1:6379> exec
(nil)
#T7： 客户端1
127.0.0.1:6379> get key
"javapython"
```

Redis提供了简单的事务， 主要是因为它不支持事务中的回滚特性， 同时无法实现命令之间的逻辑关系计算， 当然也体现了Redis的“keep it simple”的特性，   



### 2.2 Lua用法简述  （待续。。。）

1、在Redis中使用Lua  

在Redis中执行Lua脚本有两种方法： eval和evalsha。  

（1） eval  

```
eval 脚本内容 key个数 key列表 参数列表
```

下面例子使用了key列表和参数列表来为Lua脚本提供更多的灵活性：

```
127.0.0.1:6379> eval 'return "hello " .. KEYS[1] .. ARGV[1]' 1 redis world "hello redisworld"
```

此时KEYS[1]="redis"， ARGV[1]="world"， 所以最终的返回结果是"hello redisworld"。  

eval命令和--eval参数本质是一样的， 客户端如果想执行Lua脚本， 首先在客户端编写好Lua脚本代码， 然后把脚本作为字符串发送给服务端， 服务端会将执行结果返回给客户端， 整个过程如图所示。  

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084433.png" alt="image-20210530211249539" />



​																	..........................................

***

## 3、发布订阅  

在“发布/订阅”模式下，消息发布者和订阅者不进行直接通信，发布者客户端向指定的频道（channel）发布消息，订阅该频道的每个客户端都可以收到该消息，如下图所示。



<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084434.png" alt="image-20210530221010913" />

<div align="center">Redis发布订阅模型  </div>



### 3.1 发布订阅命令行实现

Redis主要提供了发布消息、 订阅频道、 取消订阅以及按照模式订阅和取消订阅等命令。  



#### **1、发布消息**  

```
publish channel  message
```

下面操作会向channel： sports频道发布一条消息“Tim won the championship”， 返回结果为订阅者个数， 因为此时没有订阅， 所以返回结果为0：  

````
127.0.0.1:6379> publish channel:sports "Tim won the championship"
(integer) 0
````



#### **2、订阅信息**

```
subscribe channel [channel ...]
```

订阅者可以订阅一个或多个频道， 下面操作为当前客户端订阅了channel： sports频道：  

```
127.0.0.1:6379> subscribe channel:sports
Reading messages... (press Ctrl-C to quit)
1) "subscribe"
2) "channel:sports"
3) (integer) 1
```

此时另一个客户端发布一条消息：  

```
127.0.0.1:6379> publish channel:sports "James lost the championship"
(integer) 1
```

当前订阅者客户端会收到如下消息：  

```
127.0.0.1:6379> subscribe channel:sports
Reading messages... (press Ctrl-C to quit)
...
1) "message"
2) "channel:sports"
3) "James lost the championship"
```

如果有多个客户端同时订阅了channel： sports， 整个过程如图所示。

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084435.png" alt="image-20210530221810916" />  

<div align="center">多个客户端同时订阅频道channel： sports  </div>



**有关订阅命令有两点需要注意：**  

- 客户端在执行订阅命令之后进入了订阅状态，只能接收`subscribe`、`psubscribe`、`unsubscribe`、`punsubscribe`的四个命令。
- 新开启的订阅客户端，无法收到该频道之前的消息，因为Redis不会对发布的消息进行持久化。

**开发提示**  

和很多专业的消息队列系统（例如Kafka、 RocketMQ） 相比， Redis的发布订阅略显粗糙， 例如**无法实现消息堆积和回溯**。 但胜在足够简单， 如果当前场景可以容忍的这些缺点， 也不失为一个不错的选择。  



#### 3、取消订阅  

```
unsubscribe [channel [channel ...]]
```

客户端可以通过unsubscribe命令取消对指定频道的订阅， 取消成功后，不会再收到该频道的发布消息：  

```
127.0.0.1:6379> unsubscribe channel:sports
1) "unsubscribe"
2) "channel:sports"
3) (integer) 0
```



#### 4、按照模式订阅和取消订阅  

```
psubscribe pattern [pattern...]
```

除了subcribe和unsubscribe命令，Redis命令还支持glob风格的订阅命令psubscribe和取消订阅命令punsubscribe，例如下面操作订阅以it开头的所有频道：

```
127.0.0.1:6379> psubscribe it*
Reading messages... (press Ctrl-C to quit)
1) "psubscribe"
2) "it*"
3) (integer) 1
```



#### 5、查询订阅

（1）查看活跃的频道

```
pubsub channels [pattern]
```

所谓活跃的频道是指当前频道至少有一个订阅者， 其中[pattern]是可以指定具体的模式：  

```
127.0.0.1:6379> pubsub channels
1) "channel:sports"
2) "channel:it"
3) "channel:travel"
127.0.0.1:6379> pubsub channels channel:*r*
1) "channel:sports"
2) "channel:travel"
```

（2） 查看频道订阅数  

```
pubsub numsub [channel ...]
```

当前channel： sports频道的订阅数为2：  

```
127.0.0.1:6379> pubsub numsub channel:sports
1) "channel:sports"
2) (integer) 2
```

（3） 查看模式订阅数  

```
pubsub numpat
```

当前只有一个客户端通过模式来订阅：  

```
127.0.0.1:6379> pubsub numpat
(integer) 1
```



### 3.2 使用场景

如下图所示， 图中有两套业务， 上面为视频管理系统， 负责管理视频信息； 下面为视频服务面向客户， 用户可以通过各种客户端（手机、 浏览器、 接口） 获取到视频信息。  

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/Redis/20220716084436.png" alt="image-20210530224106974" />

<div align="center">发布订阅用于视频信息变化通知  </div>



假如视频管理员在视频管理系统中对视频信息进行了变更， 希望及时通知给视频服务端， 就可以采用发布订阅的模式， 发布视频信息变化的消息到指定频道， 视频服务订阅这个频道及时更新视频信息， 通过这种方式可以有效解决两个业务的耦合性。  

- 视频服务订阅video： changes频道如下：  

  ```
  subscribe video:changes
  ```

- 视频管理系统发布消息到video： changes频道如下：  

  ```
  publish video:changes "video1,video3,video5"
  ```

- 当视频服务收到消息， 对视频信息进行更新， 如下所示：  

  ```
  for video in video1,video2,video5
  	update {video}
  ```

  









