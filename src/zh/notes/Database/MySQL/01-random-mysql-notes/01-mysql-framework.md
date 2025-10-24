---
title: 01-Mysql架构介绍
category:
  - MySQL
date: 2023-02-27
---

<!-- more -->

# 1、Linux下安装MySQL

## 1.1 安装

1、执行安装命令前，先执行查询命令：

- 在opt文件下：  `rpm -qa|grep mysql`
- 如果存在mysql-libs的旧版本包，请先执行卸载命令：`rpm -e --nodeps  mysql-libs`

2、安装：

- 在mysql的安装文件目录下执行：

  ```
  rpm -ivh MySQL-server-5.5.54-1.linux2.6.x86_64.rpm  //-ivh 查看进度条
  rpm -ivh MySQL-client-5.5.54-1.linux2.6.x86_64.rpm
  ```

- 查看MySQL安装版本：可以执行 `mysqladmin --version` 命令，类似java -version如果打出消息，即为成功。

- mysql服务的启动停止：`service mysql start/stop`

- 安装完成后会提示出如下的提示：

  在mysql首次登录前要给 root 账号设置密码。

  启动服务后，执行命令 ：`/usr/bin/mysqladmin -u root  password '123123'`

  然后通过 mysql -u root -p 123123 进行登录

  查看安装目录：ps -ef|grep mysql

- 开机自启动mysql服务 ： `chkconfig mysql on`
  查看是否设置成功：1、ntsysv  //古老查看法    2、chkconfig --list|grep mysql
        

3、参数路径解释备注：

```
## 相关命令目录mysqladmin mysqldump等命令
--basedir /usr/bin  
## mysql数据库文件的存放路径  
--datadir/var/lib/mysql/ 	 
## 插件存放路径
--plugin-dir/usr/lib64/mysql/pluginmysql  
## 错误日志路径
--log-error/var/lib/mysql/jack.atguigu.errmysql 
## 进程pid文件
--pid-file/var/lib/mysql/jack.atguigu.pid   
## 本地连接时用的unix套接字文件
--socket/var/lib/mysql/mysql.sock  
## 配置文件目录mysql脚本及配置文件/etc/init.d/mysql服务启停相关脚本
/usr/share/mysql    
```



## 1.2 修改字符集为utf-8

1、修改my.cnf:

- 在/usr/share/mysql/ 中找到my.cnf的配置文件，拷贝其中的 my-huge.cnf 到 /etc/  并命名为my.cnf : `cp my-huge.cnf /etc/my.cnf`
  mysql 优先选中 /etc/ 下的配置文件，然后修改my.cnf(以下均为新增):

  ```
  [client]
  default-character-set=utf8
  [mysqld]
  character_set_server=utf8
  character_set_client=utf8
  collation-server=utf8_general_ci
  [mysql]
  default-character-set=utf8
  ```

2、重新启动mysql

- 但是原库的设定不会发生变化，参数修改之对新建的数据库生效

3、已生成的库表字符集如何变更修改数据库的字符集
`mysql> alter database mytest character set 'utf8';`

4、修改数据表的字符集
`mysql> alter table user convert to  character set 'utf8';`

 但是原有的数据如果是用非'utf8'编码的话，数据本身不会发生改变。



***

# 2、MySQL逻辑架构

<a name="MySQL架构图">MySQL架构图</a>

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151311134.png" alt="image-20210609151605375" />



**概述**

和其它数据库相比，MySQL有点与众不同，它的架构可以在多种不同场景中应用并发挥良好作用。主要体现在存储引擎的架构上，插件式的存储引擎架构将查询处理和其它的系统任务以及数据的存储提取相分离。这种架构可以根据业务的需求和实际需要选择合适的存储引擎。

1. **连接层**

   最上层是一些客户端和连接服务，包含本地sock通信和大多数基于客户端/服务端工具实现的类似于tcp/ip的通信。主要完成一些类似于`连接处理`、`授权认证`、及相关的`安全方案`。在该层上引入了线程池的概念，为通过认证安全接入的客户端提供线程。同样在该层上可以实现基于SSL的安全链接。服务器也会为安全接入的每个客户端验证它所具有的操作权限。

   

2. **服务层**

- **Management Serveices & Utilities：** 系统管理和控制工具

- **SQL Interface*: SQL接口**

  接受用户的SQL命令，并且返回用户需要查询的结果。比如select from就是调用SQL Interface

- **Parser：解析器**

  SQL命令传递到解析器的时候会被解析器验证和解析。 

- **Optimizer: 查询优化器** 

  SQL语句在查询之前会使用查询优化器对查询进行优化。用一个例子就可以理解： `select uid,name from user where gender= 1;`优化器来决定先投影还是先过滤。

- **Cache和Buffer：查询缓存**

  如果查询缓存有命中的查询结果，查询语句就可以直接去查询缓存中取数据。这个缓存机制是由一系列小缓存组成的。比如表缓存，记录缓存，key缓存，权限缓存等缓存是负责读，缓冲负责写。

- **引擎层**

  存储引擎层，存储引擎真正的负责了MySQL中数据的存储和提取，服务器通过API与存储引擎进行通信。不同的存储引擎具有的功能不同，这样我们可以根据自己的实际需要进行选取。

- **存储层**

   数据存储层，主要是将数据存储在运行于裸设备的文件系统之上，并完成与存储引擎的交互。



***

# 3、各种存储引擎简介

## 3.1 引擎简介

1. InnoDB存储引擎

   InnoDB是MySQL的默认事务型引擎，它被设计用来处理大量的短期(short-lived)事务。除非有非常特别的原因需要使用其他的存储引擎，否则应该优先考虑InnoDB引擎。**行级锁，适合高并发情况**。

   

2. MyISAM存储引擎

   MyISAM提供了大量的特性，包括全文索引、压缩、空间函数(GIS)等，但MyISAM不支持事务和行级锁（**myisam改表时会将整个表全锁住**），**有一个毫无疑问的缺陷就是崩溃后无法安全恢复。**

   

3. Archive引擎

   - Archive存储引擎只支持INSERT和SELECT操作，在MySQL5.1之前不支持索引。

   - Archive表适合日志和数据采集类应用。适合低访问量大数据等情况。

   - 根据英文的测试结论来看，Archive表比MyISAM表要小大约75%，比支持事务处理的InnoDB表小大约83%。

   

4. Blackhole引擎

   Blackhole引擎没有实现任何存储机制，它会丢弃所有插入的数据，不做任何保存。但服务器会记录Blackhole表的日志，所以可以用于复制数据到备库，或者简单地记录到日志。但这种应用方式会碰到很多问题，因此并不推荐。

   

5. CSV引擎

   - CSV引擎可以将普通的CSV文件作为MySQL的表来处理，但不支持索引。

   - CSV引擎可以作为一种数据交换的机制，非常有用。

   - CSV存储的数据直接可以在操作系统里，用文本编辑器，或者excel读取。

   

6. Memory引擎

   如果需要快速地访问数据，并且这些数据不会被修改，重启以后丢失也没有关系，那么使用Memory表是非常有用。Memory表至少比MyISAM表要快一个数量级。(使用专业的内存数据库更快，如Redis)

   

7. Federated引擎

   Federated引擎是访问其他MySQL服务器的一个代理，尽管该引擎看起来提供了一种很好的跨服务器的灵活性，但也经常带来问题，因此默认是禁用的。

   

## 3.2 MyISAM 和 InnoDB对比

| **对比项** | **MyISAM**                                                 | **InnoDB**                                                   |
| :--------: | ---------------------------------------------------------- | ------------------------------------------------------------ |
|   主外键   | 不支持                                                     | 支持                                                         |
|    事务    | 不支持                                                     | 支持                                                         |
|   行表锁   | 表锁，即使操作一条记录也会锁住整张表，不适合高并发的操作。 | 行锁，操作时只锁住一行，不对其他行有影响。适合高并发操作。   |
|    缓存    | 只缓存索引，不缓存真实数据。                               | 不仅缓存索引，而且缓存真实数据，对内存要求较高，而且内存大小对性能有绝对影响。 |
|   表空间   | 小                                                         | 大                                                           |
|   关注点   | 性能                                                       | 事务                                                         |
|  默认安装  | Y                                                          | Y                                                            |



***

# 4、MySQL日志

在任何一种数据库中，都会有各种各样的日志，记录着数据库工作的方方面面，以帮助数据库管理员追踪数据库曾
经发生过的各种事件。MySQL 也不例外，在 MySQL 中，有 4 种不同的日志，分别是**错误日志**、**二进制日志**
（BINLOG 日志）、**查询日志**和**慢查询日志**，这些日志记录着数据库在不同方面的踪迹。  

## 4.1 错误日志  

错误日志是 MySQL 中最重要的日志之一，它记录了当 mysqld 启动和停止时，以及服务器在运行过程中发生任何
严重错误时的相关信息。当数据库出现任何故障导致无法正常使用时，可以首先查看此日志。  

该日志是默认开启的 ， 默认存放目录为 mysql 的数据目录（var/lib/mysql）, 默认的日志文件名为
hostname.err（hostname是主机名）。  

查看日志位置指令 ：  

```
show variables like 'log_error%';
```

![image-20210610155001998](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151311135.png)

查看日志内容 ：  

```
tail -f /var/lib/mysql/xaxh-server.err
```

![image-20210610155052154](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151311136.png)



## 4.2 二进制日志  

### 4.2.1 概述  

- 二进制日志（BINLOG）记录了所有的 DDL（数据定义语言）语句和 DML（数据操纵语言）语句，但是不包括数
  据查询语句。此日志对于灾难时的数据恢复起着极其重要的作用，MySQL的主从复制， 就是通过该binlog实现的。  

- 二进制日志，默认情况下是没有开启的，需要到MySQL的配置文件中开启，并配置MySQL日志的格式。  

  配置文件位置 :` /usr/my.cnf  `

  日志存放位置 : 配置时，给定了文件名但是没有指定路径，日志默认写入Mysql的数据目录。  

  ```
  ## 配置开启binlog日志， 日志的文件前缀为 mysqlbin -----> 生成的文件名如 :
  mysqlbin.000001,mysqlbin.000002
  log_bin=mysqlbin
  ## 配置二进制日志的格式
  binlog_format=STATEMENT
  ```

### 4.2.2 日志格式  

- **STATEMENT**

  该日志格式在日志文件中记录的都是SQL语句（statement），每一条对数据进行修改的SQL都会记录在日志文件
  中，通过Mysql提供的mysqlbinlog工具，可以清晰的查看到每条语句的文本。主从复制的时候，从库（slave）会
  将日志解析为原文本，并在从库重新执行一次。 

- **ROW**

  该日志格式在日志文件中记录的是每一行的数据变更，而不是记录SQL语句。比如，执行SQL语句 ： update
  tb_book set status='1' , 如果是STATEMENT 日志格式，在日志中会记录一行SQL文件； 如果是ROW，由于是对全
  表进行更新，也就是每一行记录都会发生变更，ROW 格式的日志中会记录每一行的数据变更。  

- **MIXED**  

  这是目前MySQL默认的日志格式，即混合了STATEMENT 和 ROW两种格式。默认情况下采用STATEMENT，但是在
  一些特殊情况下采用ROW来进行记录。MIXED 格式能尽量利用两种模式的优点，而避开他们的缺点 。

### 4.2.3 日志读取  

由于日志以二进制方式存储，不能直接读取，需要用mysqlbinlog工具来查看，语法如下 ：  

```
mysqlbinlog log-file；
```

**查看STATEMENT格式日志**  

执行插入语句 ：  

```
insert into tb_book values(null,'Lucene','2088-05-01','0');
```

查看日志文件 ：  

![image-20210610155956208](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151311137.png)

mysqlbin.index : 该文件是日志索引文件 ， 记录日志的文件名；  

查看日志内容 ：  mysqlbing.000001（日志文件）

```
mysqlbinlog mysqlbing.000001；
```



### 4.2.4 日志删除  

对于比较繁忙的系统，由于每天生成日志量大 ，这些日志如果长时间不清楚，将会占用大量的磁盘空间。下面我们
将会讲解几种删除日志的常见方法 ：  

- 方式一  

  通过 Reset Master 指令删除全部 binlog 日志，删除之后，日志编号，将从 xxxx.000001重新开始 。
  查询之前 ，先查询下日志文件 ：  

  ![image-20210610160201485](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151311138.png)

  执行删除日志指令：  

  ```
  Reset Master
  ```

  执行之后， 查看日志文件 ：  

  ![image-20210610160232114](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151311139.png)

- 方式二  

  执行指令 purge master logs to 'mysqlbin.******' ，该命令将删除 ****** 编号之前的所有日志。  

- 方式三  

  执行指令 `purge master logs before 'yyyy-mm-dd hh24:mi:ss' `，该命令将删除日志为 "yyyy-mm-dd
  hh24:mi:ss" 之前产生的所有日志 。  

- 方式四  

  设置参数 --expire_logs_days=# ，此参数的含义是设置日志的过期天数， 过了指定的天数后日志将会被自动删
  除，这样将有利于减少DBA 管理日志的工作量。配置如下 ：  

  ![image-20210610160339614](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151311140.png)



## 4.3 查询日志  

查询日志中记录了客户端的所有操作语句，而二进制日志不包含查询数据的SQL语句。
默认情况下， 查询日志是未开启的。如果需要开启查询日志，可以设置以下配置 ：  

```
# 该选项用来开启查询日志 ， 可选值 ： 0 或者 1 ； 0 代表关闭， 1 代表开启
general_log=1
# 设置日志的文件名 ， 如果没有指定， 默认的文件名为 host_name.log
general_log_file=file_name
```

在 mysql 的配置文件 /usr/my.cnf 中配置如下内容 ：  

![image-20210610160549569](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151311141.png)

配置完毕之后，在数据库执行以下操作 ：  

```sql
select * from tb_book;
select * from tb_book where id = 1;
update tb_book set name = 'lucene入门指南' where id = 5;
select * from tb_book where id < 8;
```

执行完毕之后， 再次来查询日志文件 ：  

![image-20210610160623791](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151311142.png)



## 4.4 慢查询日志  (重要)

慢查询日志记录了所有执行时间超过参数 long_query_time 设置值并且扫描记录数不小于
`min_examined_row_limit` 的所有的SQL语句的日志。`long_query_time` 默认为 10 秒，最小为 0， 精度可以到微秒。  

### 4.4.1 文件位置和格式  

慢查询日志默认是关闭的 。可以通过两个参数来控制慢查询日志 ：  

```
# 该参数用来控制慢查询日志是否开启， 可取值： 1 和 0 ， 1 代表开启， 0 代表关闭
slow_query_log=1
# 该参数用来指定慢查询日志的文件名
slow_query_log_file=slow_query.log
# 该选项用来配置查询的时间限制， 超过这个时间将认为值慢查询， 将需要进行日志记录， 默认10s
long_query_time=10
```

### 4.4.2 日志的读取  

和错误日志、查询日志一样，慢查询日志记录的格式也是纯文本，可以被直接读取。

1） 查询long_query_time 的值。  

![image-20210610160800828](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151311143.png)

2） 执行查询操作  

```sql
select id, title,price,num ,status from tb_item where id = 1;
```

![image-20210610160843475](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151311144.png)

由于该语句执行时间很短，为0s ， 所以不会记录在慢查询日志中。  

```
select * from tb_item where title like '%阿尔卡特 (OT-927) 炭黑 联通3G手机 双卡双待165454%' ;
```

![image-20210610160917802](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151311145.png)

该SQL语句 ， 执行时长为 26.77s ，超过10s ， 所以会记录在慢查询日志文件中  。

3） 查看慢查询日志文件  

直接通过cat 指令查询该日志文件 ：  

![image-20210610161003258](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151311146.png)

如果慢查询日志内容很多， 直接查看文件，比较麻烦， 这个时候可以借助于mysql自带的 mysqldumpslow 工
具， 来对慢查询日志进行分类汇总。  

![image-20210610161015932](https://studyimages.oss-cn-beijing.aliyuncs.com/img/SpringCloud/202207151311147.png)

