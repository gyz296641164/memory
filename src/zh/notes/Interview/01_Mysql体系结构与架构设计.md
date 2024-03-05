---
title: 01_Mysql体系结构与架构设计
category:
  - MySQL
date: 2024-03-05
---

<!-- more -->

## Mysql的体系结构是什么样子的（查询语句怎么进行执行的）

mysql的架构：单进程多线程的架构模式，CLient  ----->  Server架构

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/202403/4e0072e831d72014.png)

Mysql的链接方式有没有性能优化的点：2个点

### 查询缓存(Query Cache)

MySQL 内部自带了一个缓存模块。默认是关闭的。主要是因为 MySQL 自带的缓存的应用场景有限，第一个是它要求 SQL 语句必须一模一样。第二个是表里面任何一条数据发生变化的时候，这张表所有缓存都会失效。

在 MySQL 5.8 中，查询缓存已经被移除了。

### 语法解析和预处理(Parser & Preprocessor)

下一步我们要做什么呢？

假如随便执行一个字符串 fkdljasklf ，服务器报了一个 1064 的错：

```
[Err] 1064 - You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near 'fkdljasklf' at line 1
```

服务器是怎么知道我输入的内容是错误的？

或者，当我输入了一个语法完全正确的 SQL，但是表名不存在，它是怎么发现的？

这个就是 MySQL 的 Parser 解析器和 Preprocessor 预处理模块。

这一步主要做的事情是对 SQL 语句进行词法和语法分析和语义的解析。

#### **词法解析**

词法分析就是把一个完整的 SQL 语句打碎成一个个的单词。

比如一个简单的 SQL 语句：

`select name from user where id = 1;`

它会打碎成 8 个符号，记录每个符号是什么类型，从哪里开始到哪里结束。

#### **语法解析**

第二步就是语法分析，语法分析会对 SQL 做一些语法检查，比如单引号有没有闭合，然后根据 MySQL

定义的语法规则，根据 SQL 语句生成一个数据结构。这个数据结构我们把它叫做解析树。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/202403/7e545c04e173c559.png)

#### 预处理器（Preprocessor）

语义解析

如果表名错误，会在预处理器处理时报错。

它会检查生成的解析树，解决解析器无法解析的语义。比如，它会检查表和列名是否存在，检查名字和别名，保证没有歧义。

### 查询优化（Query Optimizer）与查询执行计划

#### 什么优化器？

问题：一条 SQL 语句是不是只有一种执行方式？或者说数据库最终执行的 SQL 是不是就是我们发送 的 SQL？

这个答案是否定的。一条 SQL 语句是可以有很多种执行方式的。但是如果有这么多种执行方式，这些执行方式怎么得到的？最终选择哪一种去执行？根据什么判断标准去选择？

这个就是 MySQL 的查询优化器的模块（Optimizer）。

查询优化器的目的就是根据解析树生成不同的**执行计划**，然后选择一种最优的执行计划，MySQL 里面使用的是基于开销（cost）的优化器，那种执行计划开销最小，就用哪种。

使用如下命令查看查询的开销：

```
--代表需要随机读取几个 4K 的数据页才能完成查找。
show status like 'Last_query_cost'; 
```

如果我们想知道优化器是怎么工作的，它生成了几种执行计划，每种执行计划的 cost 是多少，应该怎么做？

#### 优化器是怎么得到执行计划的？

[https://dev.mysql.com/doc/internals/en/optimizer-tracing.html](https://dev.mysql.com/doc/internals/en/optimizer-tracing.html)

首先我们要启用优化器的追踪（默认是关闭的）：

```
SHOW VARIABLES LIKE 'optimizer_trace'; 

set optimizer_trace="enabled=on"; 
```

注意开启这开关是会消耗性能的，因为它要把优化分析的结果写到表里面，所以不要轻易开启，或者查看完之后关闭它（改成 off）。

接着我们执行一个 SQL 语句，优化器会生成执行计划：

```
select t.tcid from teacher t,teacher_contact tc where t.tcid = tc.tcid; 
```

这个时候优化器分析的过程已经记录到系统表里面了，我们可以查询：

```
select * from information_schema.optimizer_trace\G 
```

expanded_query 是优化后的 SQL 语句。

```
considered_execution_plans 里面列出了所有的执行计划。 
```

记得关掉它：

```
set optimizer_trace="enabled=off"; 

SHOW VARIABLES LIKE 'optimizer_trace'; 
```

#### 优化器可以做什么？

MySQL 的优化器能处理哪些优化类型呢？

比如：

1. 当我们对多张表进行关联查询的时候，以哪个表的数据作为基准表。 
2. `select * from user where a=1 and b=2 and c=3`，如果 c=3 的结果有 100 条，b=2 的结果有 200 条，a=1 的结果有 300 条，你觉得会先执行哪个过滤？ 
3. 如果条件里面存在一些恒等或者恒不等的等式，是不是可以移除。 
4. 查询数据，是不是能直接从索引里面取到值。 
5. count()、min()、max()，比如是不是能从索引里面直接取到值。 
6. 其他。

#### 优化器得到的结果

优化器最终会把解析树变成一个查询执行计划，查询执行计划是一个数据结构。

当然，这个执行计划是不是一定是最优的执行计划呢？不一定，因为 MySQL 也有可能覆盖不到所有的执行计划。

MySQL 提供了一个执行计划的工具。我们在 SQL 语句前面加上 EXPLAIN，就可以看到执行计划的信息。

```
EXPLAIN select name from user where id=1; 
```

---

## MySQL 体系结构总结（知其然，知其所以然）

**架构分层**

总体上，我们可以把 MySQL 分成三层。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/202403/86f5898ce5b03da5.png)

**模块详解**

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/202403/8bcdd36f9dbe714a.png)

1. Connector：用来支持各种语言和 SQL 的交互，比如 PHP，Python，Java 的 JDBC
2. Management  Serveices & Utilities：系统管理和控制工具，包括备份恢复、MySQL 复制、集群等等 
3. Connection Pool：连接池，管理需要缓冲的资源，包括用户密码权限线程等等 
4. SQL Interface：用来接收用户的 SQL 命令，返回用户需要的查询结果 
5. Parser：用来解析 SQL 语句 
6. Optimizer：查询优化器 
7. Cache and Buffer：查询缓存，除了行记录的缓存之外，还有表缓存，Key 缓存，权限缓存等等。 
8. Pluggable Storage Engines：插件式存储引擎，它提供 API 给服务层使用，跟具体的文件打交道。 

---

## Bin log

bin Log：数据恢复、主从复制

MySQL Server 层也有一个日志文件，叫做 binlog，它可以被所有的存储引擎使用。

bin log 以事件的形式记录了所有的 DDL 和 DML 语句（因为它记录的是操作而不是数据值，属于逻辑日志），可以用来做主从复制和数据恢复。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/202403/87d6232cfb7fe429.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/202403/56dc233401c48bea.png)

数据恢复：区别于Redo Log的崩溃恢复，数据恢复是基于业务数据的，比如删库跑路，而崩溃恢复是断电重启的

---

## 什么是预读？

磁盘读写，并不是按需读取，而是按页读取，一次至少读一页数据（一般是4K）但是Mysql的数据页是16K，如果未来要读取的数据就在页中，就能够省去后续的磁盘IO，提高效率。

也可以调整

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/202403/b3802a9f559a796e.png)

---

## 什么是Buffer  Pool？

内存缓冲区、CPU高速缓冲区

缓存表数据与索引数据，把磁盘上的数据加载到缓冲池，避免每次访问都进行磁盘IO，起到加速访问的作用。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/202403/2ffb4d581bfcaffc.png)

---

## Buffer Pool的内存淘汰策略

冷热分区的LRU策略

LRU链表会被拆分成为两部分，一部分为热数据，一部分为冷数据。冷数据占比 3/8，热数据5/8。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/202403/1eb4019b52e3e7fc.png)

**数据页第一次加载进来，放在LRU链表的什么地方？**

放在冷数据区域的头部

**冷数据区域的缓存页什么时候放入热数据区域？**

MySQL设定了一个规则，在 innodb_old_blocks_time 参数中，默认值为1000，也就是1000毫秒。

意味着，只有把数据页加载进缓存里，在经过1s之后再次对此缓存页进行访问才会将缓存页放到LRU链表热数据区域的头部。

**为什么是1秒？**

因为通过预读机制和全表扫描加载进来的数据页通常是1秒内就加载了很多然后对他们访问一下，这些都是1秒内完成，他们会存放在冷数据区域等待刷盘清空，基本上不太会有机会放入到热数据区域，除非在1秒后还有人访问，说明后续可能还会有人访问，才会放入热数据区域的头部。

---

## Redo Log跟Buffer Pool的关系

崩溃恢复  基本保障   系统自动做的

> InnoDB 引入了一个日志文件，叫做 redo log（重做日志），我们把所有对内存数据的修改操作写入日志文件，如果服务器出问题了，我们就从这个日志文件里面读取数据，恢复数据——用它来实现事务的持久性。
>
> redo log 有什么特点？
>
> 1. 记录修改后的值，属于物理日志
>2. redo log 的大小是固定的，前面的内容会被覆盖，所以不能用于数据回滚/数据恢复。
> 3. redo log 是 InnoDB 存储引擎实现的，并不是所有存储引擎都有。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/202403/cabe526e19510171.png)

---

## Mysql的数据恢复怎么做

数据恢复：删库跑路了，我能够去将你的数据进行恢复

备份每天2点，备份今天的所有数据库的数据 防止丢失，bin Log 二进制的日志文件   DDL  dmL

解析Bin Log专门的工具

9点删库跑路：drop  table，首先应该做得就是把数据备份恢复出来，

- 2点之前的
- 2点 - 9点之间的数据  bin Log 重新执行一遍  10分钟

### 查看存储引擎

查看数据库表的存储引擎：

```
show table status from `training`;
```

在 MySQL 里面，我们创建的每一张表都可以指定它的存储引擎，它不是一个数据库只能使用一个存储引擎。而且，创建表之后还可以修改存储引擎。

数据库存放数据的路径：

```
show variables like 'datadir'; 
```

每个数据库有一个自己文件夹，以 trainning 数据库为例。

任何一个存储引擎都有一个 frm 文件，这个是表结构定义文件。

我们在数据库中建了三张表，使用了不同的存储引擎。

不同的存储引擎存放数据的方式不一样，产生的文件也不一样。

### 存储引擎比较

#### 常见存储引擎

在 MySQL 5.5 版本之前，默认的存储引擎是 MyISAM，它是 MySQL 自带的5.5.5 版本之后默认的存储引擎改成了InnoDB，它是第三方公司为MySQL开发的。为什么要改呢？最主要的原因还是InnoDB支持事务，支持行级别的锁，对于业务一致性要求高的场景来说更适合。

#### 数据库支持的存储引擎

我们可以用这个命令查看数据库对存储引擎的支持情况：

```
SHOW ENGINES ; 
```

其中有存储引擎的描述和对事务、XA 协议和 Savepoints 的支持

官网对于存储引擎的介绍：https://dev.mysql.com/doc/refman/5.7/en/storage-engines.html

##### **MyISAM（3个文件）**

```
These tables have a small footprint. Table-level locking limits the performance in read/write workloads, so it is often used in read-only or read-mostly workloads in Web and data warehousing configurations.
```

应用范围比较小。表级锁定限制了读/写的性能，因此在 Web 和数据仓库配置中，它通常用于只读或以读为主的工作。

特点：

* 支持表级别的锁（插入和更新会锁表）。不支持事务。
* 拥有较高的插入（insert）和查询（select）速度。
* 存储了表的行数（count 速度更快）。
* 适合：只读之类的数据分析的项目。

##### **InnoDB（2 个文件）**

> The default storage engine in MySQL 5.7. InnoDB is a transaction-safe (ACID compliant) storage engine for MySQL that has commit, rollback, and crash-recovery capabilities to protect user data. InnoDB row-level locking (without escalation to coarser granularity locks) and Oracle-style consistent nonlocking reads increase multi-user concurrency and performance. InnoDB stores user data in clustered indexes to reduce I/O for common queries based on primary keys. To maintain data integrity, InnoDB also supports FOREIGN KEY referential-integrity constraints.

mysql 5.7 中的默认存储引擎。InnoDB 是一个事务安全（与 ACID 兼容）的 MySQL 存储引擎，它具有提交、回滚和崩溃恢复功能来保护用户数据。InnoDB 行级锁（不升级为更粗粒度的锁）和 Oracle风格的一致非锁读提高了多用户并发性和性能。InnoDB 将用户数据存储在聚集索引中，以减少基于 主键的常见查询的 I/O。为了保持数据完整性，InnoDB 还支持外键引用完整性约束。

特点：

* 支持事务，支持外键，因此数据的完整性、一致性更高。
* 支持行级别的锁和表级别的锁。
* 支持读写并发，写不阻塞读。
* 特殊的索引存放方式，可以减少 IO，提升查询效率。
* 适合：经常更新的表，存在并发读写或者有事务处理的业务系统。

##### Memory（1个文件）

> Stores all data in RAM, for fast access in environments that require quick lookups of non-critical data. This engine was formerly known as the HEAP engine. Its use cases are decreasing; InnoDB with its buffer pool memory area provides a general-purpose and durable way to keep most or all data in memory, and NDBCLUSTER provides fast key-value lookups for huge distributed data sets.

将所有数据存储在 RAM 中，以便在需要快速查找非关键数据的环境中快速访问。这个引擎以前被称为堆引擎。其使用案例正在减少；InnoDB 及其缓冲池内存区域提供了一种通用、持久的方法来 将大部分或所有数据保存在内存中，而 ndbcluster 为大型分布式数据集提供了快速的键值查找。

特点：

- 把数据放在内存里面，读写的速度很快，但是数据库重启或者崩溃，数据会全部消失。只适合 做临时表。默认使用哈希索引。 将表中的数据存储到内存中。

##### **CSV（3个文件）**

> Its tables are really text files with comma-separated values. CSV tables let you import or dump data in CSV format, to exchange data with scripts and applications that read and write that same format. Because CSV tables are not indexed, you typically keep the data in InnoDB tables during normal operation, and only use CSV tables during the import or export stage.

它的表实际上是带有逗号分隔值的文本文件。csv 表允许以 csv 格式导入或转储数据，以便与读写相同格式的脚本和应用程序交换数据。因为 csv 表没有索引，所以通常在正常操作期间将数据保存在 innodb 表中，并且只在导入或导出阶段使用 csv 表。

**特点：**

不允许空行，不支持索引。格式通用，可以直接编辑，适合在不同数据库之间导入导出。

##### **Archive（2 个文件）**

> These compact, unindexed tables are intended for storing and retrieving large amounts of seldom-referenced historical, archived, or security audit information.

这些紧凑的未索引表用于存储和检索大量很少引用的历史、存档或安全审计信息。

**特点：**

不支持索引，不支持 update delete。

**6、执行引擎（Query Execution Engine），返回结果**

执行引擎，它利用存储引擎提供了相应的 API 来完成对存储引擎的操作。最后把数据返回给客户端，即使没有结果也要返回。

---

## 一条更新语句的执行流程

跟 redo log 不一样，它的文件内容是可以追加的，没有固定大小限制。

有了这两个日志之后，我们来看一下一条更新语句是怎么执行的：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/202403/d983b8bad0153806.png)

例如一条语句：update teacher set name='老严' where name =‘666’

1. 先查询到这条数据，如果有缓存，也会用到缓存。
2. 把 name 改成老严，然后调用引擎的 API 接口，写入这一行数据到内存，同时记录 redo log。这时 redo log 进入 prepare 状态，然后告诉执行器，执行完成了，可以随时提交。
3. 执行器收到通知后记录 binlog，然后调用存储引擎接口，设置 redo log 为 commit 状态。
4. 更新完成。

问题：为什么redo Log要用两阶段提交（XA）呢？

**举例：**

如果我们执行的是把 name 改成老严，如果写完 redo log，还没有写 bin log 的时候，MySQL 重启了。

因为 redo log 可以恢复数据，所以写入磁盘的是老严。但是 bin log 里面没有记录这个逻辑日志，所以这时候用 binlog 去恢复数据或者同步到从库，就会出现数据不一致的情况。

所以在写两个日志的情况下，binlog 就充当了一个事务的协调者。通知 InnoDB 来执行 prepare 或commit 或者 rollback。

简单地来说，这里有两个写日志的操作，类似于分布式事务，不用两阶段提交，就不能保证都成功或者都失败。
