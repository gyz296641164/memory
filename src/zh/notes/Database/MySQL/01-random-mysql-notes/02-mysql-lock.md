---
title: 02-MySQL锁
category:
  - MySQL
date: 2023-02-27
---

<!-- more -->

# 1. 锁概述

锁是计算机协调多个进程或线程并发访问某一资源的机制（避免争抢）。

在数据库中，除传统的计算资源（如 CPU、RAM、I/O 等）的争用以外，数据也是一种供许多用户共享的资源。如何保证数据并发访问的一致性、有效性是所有数据库必须解决的一个问题，锁冲突也是影响数据库并发访问性能的一个重要因素。从这个角度来说，锁对数据库而言显得尤其重要，也更加复杂。



***

# 2. 锁分类



## 2.1. 从对数据库得粒度分：

1. 表锁：操作时，会锁定整个表
2. 行锁：操作时，会锁定当前操作行

## 2.2. 从对数据的操作类型分：

1. 读锁(共享锁)：针对同一份数据，多个读操作可以同时进行相互不影响
2. 写锁(排他锁)：当前操作没有完成之前，它会阻断其他写锁和读锁。

## 2.3. 从程序员角度分为两种：

1. 悲观锁
2. 乐观锁



***

# 3. 发生锁的必要条件

## 3.1. 数据库锁表的四个必要条件：

1. **互斥条件**：指进程对所分配到的资源进行排他性使用，即在一段时间内某资源只由一个进程占用。如果此时还有其他进程请求资源，则请求者等待，直至占有资源的进程用完释放后其他进行才能使用。
2. **请求和保持条件**：指进程已经保持至少一个资源，但又提出了新得资源请求，而该资源已被其它进程占有，此时请求进程阻塞，但又对自己已获得的其它资源保持不释放的状态。
3. **不剥夺条件**：指进程已获得的资源，在未使用完之前不能被剥夺，只能在使用完时由自己释放。
4. **环路等待条件**：指在发生死锁时，必然存在一个进程——资源的环形链，即进程集合{P0，P1，P2，···，Pn}中的P0正在等待一个P1占用的资源；P1正在等待P2占用的资源，……，Pn正在等待已被P0占用的资源。

***

# 4. Mysql 锁

相对其他数据库而言，MySQL的锁机制比较简单，其最显著的特点是不同的存储引擎支持不同的锁机制。下表中罗列出了各存储引擎对锁的支持情况：

| 存储引擎 | 表级锁 | 行级锁 | 页面锁 |
| -------- | ------ | ------ | ------ |
| MyISAM   | 支持   | 不支持 | 不支持 |
| InnoDB   | 支持   | 支持   | 不支持 |
| MEMORY   | 支持   | 不支持 | 不支持 |
| BDB      | 支持   | 不支持 | 支持   |

MySQL这3种锁的特性可大致归纳如下 ：

| 锁类型 |                             特点                             |
| ------ | :----------------------------------------------------------: |
| 表级锁 | 偏向MyISAM 存储引擎，开销小，加锁快；不会出现死锁；锁定粒度大，发生锁冲突的概率最高,并发度最低 |
| 行级锁 | 偏向InnoDB 存储引擎，开销大，加锁慢；会出现死锁；锁定粒度最小，发生锁冲突的概率最低,并发度也最高 |
| 页面锁 | 开销和加锁时间界于表锁和行锁之间；会出现死锁；锁定粒度界于表锁和行锁之间，并发度一般 |

**备注**：

- MyISAM总是一次性获得所需的全部锁，要么全部满足，要么全部等待，因此不会产生死锁。
- InnoDB下的表级锁：
  - InnoDB中如果是执行insert语句使用的是表级锁，因此insert操作不会出现死锁问题；
  - 如果执行select查询语句没有走主键和辅助索引使用的也是表级锁，这种操作也不会出现死锁问题。
- **死锁主要出现在InnoDB引擎中使用行级锁的情况：**
  - 基于当前读（for update）的走索引的查询使用的是行级锁，可能会出现死锁；
  - 更新操作使用的也是行级锁，可能会出现死锁。

从上述特点可见，很难笼统地说哪种锁更好，只能就具体应用的特点来说哪种锁更合适！仅从锁的角度来说：

- 表级锁更适合于以查询为主，只有少量按索引条件更新数据的应用，如Web 应用；
- 而行级锁则更适合于有大量按索引条件并发更新少量不同数据，同时又有并查询的应用，如一些在线事务处理（OLTP）系统。

***

# 5. MyISAM 表锁

MyISAM 存储引擎只支持表锁，这也是MySQL开始几个版本中唯一支持的锁类型。

## 5.1. 如何加表锁

MyISAM 在执行查询语句（SELECT）前，会自动给涉及的所有表加读锁，在执行更新操作（UPDATE、DELETE、INSERT 等）前，会自动给涉及的表加写锁，这个过程并不需要用户干预，因此，用户一般不需要直接用 `LOCK TABLE `命令给 MyISAM 表显式加锁。

显式加表锁语法：

```sql
-- 加读锁
lock table table_name read;
-- 加写锁
lock table table_name write;
```



## 5.2. 读锁案例

**准备环境**

```sql
create database demo_03 default charset=utf8mb4;
use demo_03;
CREATE TABLE `tb_book` (
`id` INT(11) auto_increment,
`name` VARCHAR(50) DEFAULT NULL,
`publish_time` DATE DEFAULT NULL,
`status` CHAR(1) DEFAULT NULL,
PRIMARY KEY (`id`)
) ENGINE=myisam DEFAULT CHARSET=utf8 ;

INSERT INTO tb_book (id, name, publish_time, status) VALUES(NULL,'java编程思想','2088-08-01','1');
INSERT INTO tb_book (id, name, publish_time, status) VALUES(NULL,'solr编程思想','2088-08-08','0');

CREATE TABLE `tb_user` (
`id` INT(11) auto_increment,
`name` VARCHAR(50) DEFAULT NULL,
PRIMARY KEY (`id`)
) ENGINE=myisam DEFAULT CHARSET=utf8 ;

INSERT INTO tb_user (id, name) VALUES(NULL,'令狐冲');
INSERT INTO tb_user (id, name) VALUES(NULL,'田伯光');
```

> **客户端 一** 

1）获得tb_book 表的读锁

```
lock table tb_book read;
```

2） 执行查询操作

```
select * from tb_book;
```

![image-20210610135835628](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151314682.png)

可以正常执行，查询出数据。

> **客户端二** 

3） 执行查询操作

```
select * from tb_book;
```

![image-20210610135843354](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151314683.png)

> **客户端 一**

4）查询未锁定的表

```
select name from tb_seller;
```

![image-20210610135921364](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151314685.png)

> **客户端二**

5）查询未锁定的表

```
select name from tb_seller;
```

 ![image-20210610135950963](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151314686.png)

可以正常查询出未锁定的表；

> **客户端一** 

6） 执行插入操作

```
insert into tb_book values(null,'Mysql高级','2088-01-01','1');
```

![image-20210610140033772](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151314687.png)

执行插入，直接报错，由于当前tb_book 获得的是读锁，不能执行更新操作。

> **客户端二** 

7） 执行插入操作

```
insert into tb_book values(null,'Mysql高级','2088-01-01','1');
```

![image-20210610140107792](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151314688.png)

当在客户端一中释放锁指令 unlock tables 后 ， 客户端二中的 inesrt 语句，立即执行。



## 5.3. 写锁案例

> **客户端一** 

1）获得tb_book表的写锁

```
lock table tb_book write ;
```

2）执行查询操作

```
select * from tb_book ;
```

![image-20210610140154314](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151314689.png)

查询操作执行成功；

3）执行更新操作

```
update tb_book set name = 'java编程思想（第二版）' where id = 1;
```

![image-20210610140223051](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151314690.png)

更新操作执行成功。

> **客户端二** 

4）执行查询操作

```
select * from tb_book ;
```

![image-20210610140258321](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151314691.png)

当在客户端一中释放锁指令 unlock tables 后，客户端二中的 select 语句，立即执行 ；

![image-20210610140309104](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151314692.png)



## 5.4. 结论

锁模式的相互兼容性如表中所示：

![image-20210610140345969](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151314693.png)

由上表可见：

1. 对MyISAM 表的读操作，不会阻塞其他用户对同一表的读请求，但会阻塞对同一表的写请求；

2. 对MyISAM 表的写操作，则会阻塞其他用户对同一表的读和写操作；

   简而言之，就是读锁会阻塞写，但是不会阻塞读。而写锁，则既会阻塞读，又会阻塞写。

此外，MyISAM 的读写锁调度是写优先，这也是MyISAM不适合做写为主的表的存储引擎的原因。因为写锁后，其他线程不能做任何操作，大量的更新会使查询很难得到锁，从而造成永远阻塞。



## 5.5. 查看锁的争用情况

```sql
show open tables;
```

![image-20210610140748873](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151314694.png)

1. **In_use** : 表当前被查询使用的次数。如果该数为零，则表是打开的，但是当前没有被使用。
2. **Name_locked**：表名称是否被锁定。名称锁定用于取消表或对表进行重命名等操作。

```
show status like 'Table_locks%';
```

![image-20210610140952321](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151314695.png)

1. **Table_locks_immediate** ： 指的是能够立即获得表级锁的次数，每立即获取锁，值加1。
2. **Table_locks_waited** ： 指的是不能立即获取表级锁而需要等待的次数，每等待一次，该值加1，此值高说明存在着较为严重的表级锁争用情况。



***

# 6. InnoDB 行锁

## 6.1. 行锁介绍

行锁特点 ：偏向InnoDB 存储引擎，开销大，加锁慢；会出现死锁；锁定粒度最小，发生锁冲突的概率最低，并发度也最高。

`InnoDB 与 MyISAM 的最大不同有两点：一是支持事务；二是采用了行级锁`

## 6.2. 背景知识（事务相关）

> 事务及其ACID属性

事务是由一组SQL语句组成的逻辑处理单元，具有以下4个特性：

| ACID属性             | 含义                                                         |
| -------------------- | ------------------------------------------------------------ |
| 原子性（Atomicity）  | 事务是一个原子操作单元，其对数据的修改，要么全部成功，要么全部失败 |
| 一致性（Consistent） | 在事务开始和完成时，数据必须保持一致状态                     |
| 隔离性（Isolation）  | 数据库提供一定的隔离机制，保证事务在不受外部并发操作影响的“独立”环境下运行 |
| 持久性（Durable）    | 事务完成后，对数据的修改是持久的                             |



> **并发事务处理带来的问题**

如下表所示：

| 问题                              | 含义                                                         |
| --------------------------------- | ------------------------------------------------------------ |
| 丢失更新（Lost Update）           | 当两个或多个事务选择同一行，最初的事务修改得值，会被后面的事务修改的值覆盖 |
| 脏读（Dirty Reads）               | 当一个事务正在访问数据，并且对数据进行了修改，而这种修改还没有提交到数据库中，这时，另外一个事务也访问这个修改的数据，然后使用了这个数据 |
| 不可重复读（Non Repeatable Rads） | 一个事务在读取某些数据后的某个时间，再次读取以前度过的数据，却发现和以前读出的数据不一致 |
| 幻读（Phantom Reads）             | 一个事务按照相同的查询条件重新读取以前查询过的数据，却发现其他事务插入了满足其查询条件的新数据 |

**注意：**

**幻读** 和 **不可重复读** 很容易混淆。前者是指读到了其他事务已经新增的数据，而后者是指读到了已经提交事务的更改数据（更改或删除），为了避免这两种情况，采取的对策是不同的。**防止读取到更改数据，只需要对操作的数据添加行级锁**，阻止操作中的数据发生变化。而**防止读取到新增数据，则往往需要添加表级锁**。

**举例：**

- **更新丢失**

  两个事务更新相同数据，如果一个事务提交，另一个事务回滚，第一个事务的更新会被回滚。

  ![image-20210610143609940](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151314696.png)



- **脏读（在oracle中不会出现）**

  第二个事务查询到第一个事务未提交的更新数据。第二个事务根据该数据执行，但第一个事务回滚，第二个事务操作脏数据。

  ![image-20210610144407751](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151314697.png)

- **幻读**

  一个事务查询到了另一个事务已经 `提交的新数据`，导致多次查询数据不一致。

  ![image-20210610144515165](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151314698.png)

- **不可重复读**

  一个事务查询到另一个事务 `已经修改的数据`，导致多次查询数据不一致。

  ![image-20210610144543011](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151314699.png)



> **事务隔离级别**

为了解决上述提到的事务并发问题，数据库提供一定的事务隔离机制来解决这个问题。数据库的事务隔离越严格，并发副作用越小，但付出的代价也就越大，因为事务隔离实质上就是使用事务在一定程度上“串行化” 进行，这显然与“并发” 是矛盾的。

数据库的隔离级别有4个，由低到高依次为`Read uncommitted`、`Read committed`、`Repeatable read`、
`Serializable`，这四个级别可以逐个解决脏写、脏读、不可重复读、幻读这几类问题。

| 隔离级别                | 丢失更新 | 脏读 | 不可重复读 | 幻读 |
| ----------------------- | -------- | ---- | ---------- | ---- |
| Read uncommitted        | ×        | √    | √          | √    |
| Read committed          | ×        | ×    | √          | √    |
| Repeatable read（默认） | ×        | ×    | ×          | √    |
| Serializable            | ×        | ×    | ×          | ×    |

`备注 ： √ 代表可能出现 ， × 代表不会出现 。`

Mysql 的数据库的默认隔离级别为 Repeatable read ， 查看方式：

```
show variables like 'tx_isolation';
```

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151314700.png" alt="image-20210610145117643" />



## 6.3. InnoDB 的行锁模式

InnoDB 实现了以下两种类型的行锁：

- **共享锁（S）**：又称为读锁，简称S锁，共享锁就是多个事务对同一数据可以共享一把锁，都能访问到数据，但是不能修改。
- **排他锁（X）**：又称为写锁，简称X锁，排他锁不能与其它锁并存，如一个事务获取了一个数据行的排他锁，其他事务就不能获取改行的其它锁，包括共享锁和排他锁，但是获取排他锁的事务可以对改行数据进行修改和查询操作。

1. 对于UPDATE、DELETE和INSERT语句，InnoDB会自动给涉及数据集加排他锁（X)；
2. **对于普通SELECT语句，InnoDB不会加任何锁**；区别于MyISAM在SELECT时会自动加读锁。

可以通过以下语句显示给记录集加共享锁或排他锁：

```sql
-- 加共享锁（S）：
SELECT * from table_name WHERE ... LOCK IN SHARE MODE;
-- 排他锁（X）：
SELECT * FROM table_name WHERE ... FOR UPDATE;
```



## 6.4. 案例准备工作

### 6.4.1. 建表

```sql
create table test_innodb_lock(
id int(11),
name varchar(16),
sex varchar(1)
)engine = innodb default charset=utf8;

insert into test_innodb_lock values(1,'100','1');
insert into test_innodb_lock values(3,'3','1');
insert into test_innodb_lock values(4,'400','0');
insert into test_innodb_lock values(5,'500','1');
insert into test_innodb_lock values(6,'600','0');
insert into test_innodb_lock values(7,'700','0');
insert into test_innodb_lock values(8,'800','1');
insert into test_innodb_lock values(9,'900','1');
insert into test_innodb_lock values(1,'200','0');

create index idx_test_innodb_lock_id on test_innodb_lock(id);
create index idx_test_innodb_lock_name on test_innodb_lock(name);
```

### 6.4.2. 行锁基本演示

![image-20210610145702885](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151314701.png)



### 6.4.3. 无索引行锁升级为表锁

如果不通过索引条件检索数据，那么InnoDB将对表中的所有记录加锁，实际效果跟表锁一样。

查看当前表的索引 ： `show index from test_innodb_lock ;`

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151314702.png" alt="image-20210610145846954" />

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151314703.png" alt="image-20210610145904541"/>

由于执行更新时 ，name字段本来为varchar类型，我们是作为数组类型使用，存在类型转换，索引失效，最终行锁变为表锁 ；

### 6.4.4. 间隙锁危害

当我们用范围条件，而不是使用相等条件检索数据，并请求共享或排他锁时，InnoDB会给符合条件的已有数据进行加锁； 对于键值在条件范围内但并不存在的记录，叫做 **间隙（GAP）**， InnoDB也会对这个 "间隙" 加锁，这种锁机制就是所谓的 **间隙锁（Next-Key锁）**。

**示例：**

![image-20210610150115088](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151314704.png)



### 6.4.5. InnoDB 行锁争用情况

```
show status like 'innodb_row_lock%';
```

![image-20210610150139551](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151314705.png)

1. **Innodb_row_lock_current_waits**:：当前正在等待锁定的数量
2. **Innodb_row_lock_time**：从系统启动到现在锁定总时间长度
3. **Innodb_row_lock_time_avg**：每次等待所花平均时长
4. **Innodb_row_lock_time_max**：从系统启动到现在等待最长的一次所花的时间
5. **Innodb_row_lock_waits**：系统启动后到现在总共等待的次数

当等待的次数很高，而且每次等待的时长也不小的时候，我们就需要分析系统中为什么会有如此多的等待，然后根
据分析结果着手制定优化计划。



***

# 7. 悲观锁

- **悲观锁：**

  即悲观并发控制(Pessimistic Concurrency Controller，缩写PCC)。悲观锁是指在数据处理过程中，使数据处于锁定状态，一般使用数据库的锁机制实现。**即每次去获取数据的时候都认为别人会修改，所以每次在拿数据的时候都会上锁，这样别人拿这个数据就会block（阻塞），直到它拿到锁。** 传统的关系数据库里用到了很多这种锁机制，比如行锁、表锁、读锁、写锁等，都是在操作之前先上锁。

- **注意：**

  在MySQL中使用悲观锁，**必须关闭MySQL的自动提交**，即`set autocommit=0`。MySQL默认使用自动提交autocommit模式，即执行一个更新操作，MySQL会自动将结果提交。

***

# 8. 乐观锁

**乐观锁（Optimistic Lock）：**

**每次去拿数据的时候都认为别人不会修改，所以不会上锁**。但是在更新的时候会判断一下在此期间别人有没有更新这个数据，可以使用`版本号`、`时间戳`等机制去判断是否被更新过。

1. **版本号（记为version）**

   就是给数据增加一个版本标识，在数据库上就是表中增加一个version字段，每次更新把这个字段加1，读取数据的时候把version读出来，更新的时候比version，如果还是开始读取的version就可以更新了，如果现在的version比老的version大，说明有其他事务更新了该数据，并增加了版本号，这时候得到一个无法更新的通知，用户自行根据这个通知来决定怎么处理，比如重新开始一遍。这里的关键是判断version和更新两个动作需要作为一个原子单元执行，否则在你判断可以更新以后正式更新之前有别的事务修改了version，这个时候你再去更新就可能会覆盖前一个事务做的更新，造成第二类丢失更新，所以你可以使用update … where … and version=”old version”这样的语句，根据返回结果是0还是非0来得到通知，如果是0说明更新没有成功，因为version被改了，如果返回非0说明更新成功。

2. **时间戳（timestamp，使用数据库服务器的时间戳）**

   和版本号基本一样，只是通过时间戳来判断而已，注意时间戳要使用数据库服务器的时间戳不能是业务系统的时间。

3. **待更新字段**

   和版本号方式相似，只是不增加额外字段，直接使用有效数据字段做版本控制信息，因为有时候我们可能无法改变旧系统的数据库表结构。假设有个待更新字段叫count,先去读取这个count,更新的时候去比较数据库中count的值是不是我期望的值（即开始读的值），如果是就把我修改的count的值更新到该字段，否则更新失败。

4. **所有字段**

   和待更新字段类似，只是使用所有字段做版本控制信息，只有所有字段都没变化才会执行更新。



***

# 9. 发生锁的原因

1. 字段不加索引:在执行事务的时候，如果表中没有索引，会执行全表扫描，如果这时候有其他的事务过来，就会发生锁表。
2. 事务处理时间长:事务处理时间较长，当越来越多事务堆积的时候，会发生锁表。
3. 关联操作太多:涉及到很多张表的修改等，在并发量大的时候，会造成大量表数据被锁。

***

# 10. 解决锁出现的方法

1. 通过相关的sql语句可以查出是否被锁定，和被锁定的数据。
2. 为加锁进行时间限定，防止无限死锁。
3. 加索引，避免全表扫描。
4. 尽量顺序操作数据。
5. 根据引擎选择合理的锁粒度。
6. 事务中的处理时间尽量短。

生产中出现死锁等问题是比较严重的问题，因为通常死锁没有明显的错误日志，只有在发现错误的时候才能后知后觉的处理，所以，一定要尽力避免。



***

# 11. 锁定时间的长短

> **锁保持的时间长度为保护所请求级别上的资源所需的时间长度。**

**用于保护读取操作的共享锁的保持时间取决于事务隔离级别。**

- 采用`READ COMMITTED`的默认事务隔离级别时，只在读取页的期间内控制共享锁。在扫描中，直到在扫描内的下一页上获取锁时才释放锁。如果指定HOLDLOCK提示或者将事务隔离级别设置为`REPEATABLE READ`或`SERIALIZABLE`，则直到事务结束才释放锁。
- 根据为游标设置的并发选项，游标可以获取共享模式的滚动锁以保护提取。当需要滚动锁时，直到下一次提取或关闭游标（以先发生者为准）时才释放滚动锁。但是，如果指定HOLDLOCK，则直到事务结束才释放滚动锁。

**用于保护更新的排它锁将直到事务结束才释放。**

- 如果一个连接试图获取一个锁，而该锁与另一个连接所控制的锁冲突，则试图获取锁的连接将一直阻塞到：将冲突锁释放而且连接获取了所请求的锁。 连接的超时间隔已到期。默认情况下没有超时间隔，但是一些应用程序设置超时间隔以防止无限期等待。

***

# 12. 如何锁表或锁表的某一行

## 12.1. 锁一个表的某一行

```sql
-- 设置事务隔离级别为读未提交
SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED ;
SELECT * FROM table ROWLOCK WHERE id = 1 ;
```

## 12.2. 锁定数据库的一个表

```sql
SELECT * FROM table WITH (HOLDLOCK)
```

- **HOLDLOCK**持有共享锁，直到整个事务完成，应该在被锁对象不需要时立即释放等于SERIALIZABLE事务隔离级别。
- **NOLOCK** 语句执行时不发出共享锁，允许脏读 ，等于READ UNCOMMITTED事务隔离级别。
- **PAGLOCK** 使用一个表锁的地方用多个页锁。
- **ROWLOCK** 强制使用行锁。
- **TABLOCKX** 强制使用独占表级锁，这个锁在事务期间阻止任何其他事务使用这个表。
- **UPLOCK** 强制在读表时使用更新而不用共享锁。

***

# 13. 总结

- InnoDB存储引擎由于实现了行级锁定，虽然在锁定机制的实现方面带来了性能损耗可能比表锁会更高一些，但是
  在整体并发处理能力方面要远远由于MyISAM的表锁的。当系统并发量较高的时候，InnoDB的整体性能和MyISAM
  相比就会有比较明显的优势。
- 但是，InnoDB的行级锁同样也有其脆弱的一面，当我们使用不当的时候，可能会让InnoDB的整体性能表现不仅不
  能比MyISAM高，甚至可能会更差。
- **优化建议：**
  - 尽可能让所有数据检索都能通过索引来完成，避免无索引行锁升级为表锁。
  - 合理设计索引，尽量缩小锁的范围
  - 尽可能减少索引条件，及索引范围，避免间隙锁
  - 尽量控制事务大小，减少锁定资源量和时间长度
  - 尽可使用低级别事务隔离（但是需要业务层面满足需求）