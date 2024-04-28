---
title: 03_Mysql性能优化
category:
  - MySQL
date: 2024-03-05
---

<!-- more -->

## 1. 索引下推是什么？

索引下推是索引下推是 MySQL 5.6 及以上版本上推出的，用于对查询进行优化。

索引下推是把本应该在 server 层进行筛选的条件，下推到存储引擎层来进行筛选判断，这样能有效减少回表。

举例说明：

首先使用联合索引（name，age），现在有这样一个查询语句：

```
select *  from t_user where name like 'L%' and age = 17;
```

这条语句从最左匹配原则上来说是不符合的，原因在于只有name用的索引，但是age并没有用到。

不用索引下推的执行过程：

1. 第一步：利用索引找出name带'L'的数据行：LiLei、Lili、Lisa、Lucy 这四条索引数据
2. 第二步：再根据这四条索引数据中的 id 值，逐一进行回表扫描，从聚簇索引中找到相应的行数据，将找到的行数据返回给 server 层。
3. 第三步：在server层判断age = 17,进行筛选，最终只留下 Lucy 用户的数据信息。

使用索引下推的执行过程：

1. 第一步：利用索引找出name带'L'的数据行：LiLei、Lili、Lisa、Lucy 这四条索引数据
2. 第二步：根据 age = 17 这个条件，对四条索引数据进行判断筛选，最终只留下 Lucy 用户的数据信息。
   （注意：这一步不是直接进行回表操作，而是根据 age = 17 这个条件，对四条索引数据进行判断筛选）
3. 第三步：将符合条件的索引对应的 id 进行回表扫描，最终将找到的行数据返回给 server 层。

比较二者的第二步我们发现，索引下推的方式极大的减少了回表次数。

索引下推需要注意的情况：

下推的前提是索引中有 age 列信息，如果是其它条件，如 gender = 0，这个即使下推下来也没用

开启索引下推：

索引下推是 MySQL 5.6 及以上版本上推出的，用于对查询进行优化。默认情况下，索引下推处于启用状态。我们可以使用如下命令来开启或关闭。

```
set optimizer_switch='index_condition_pushdown=off';  -- 关闭索引下推
set optimizer_switch='index_condition_pushdown=on';  -- 开启索引下推
```

### 1.1. 分库分表

垂直分库，减少并发压力。水平分表，解决存储瓶颈。

垂直分库的做法，把一个数据库按照业务拆分成不同的数据库：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/202403/ea4f5b32795fe655.png)

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/202403/965d8e487838a6ec.png)

水平分库分表的做法，把单张表的数据按照一定的规则分布到多个数据库。

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/202403/7fa4a302c66867f3.png)

以上是架构层面的优化，可以用缓存，主从，分库分表

---

## 2. 如何进行慢SQL查询

[`https://dev.mysql.com/doc/refman/5.7/en/slow-query-log.html`](https://dev.mysql.com/doc/refman/5.7/en/slow-query-log.html)

### 2.1. 打开慢日志开关**

因为开启慢查询日志是有代价的（跟 bin log、optimizer-trace 一样），所以它默认是关闭的：

```sql
show variables like 'slow_query%';
```

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/202403/0f1bcc8c5244405d.png)

除了这个开关，还有一个参数，控制执行超过多长时间的 SQL 才记录到慢日志，默认是 10 秒。

除了这个开关，还有一个参数，控制执行超过多长时间的 SQL 才记录到慢日志，默认是 10 秒。

```sql
show variables like '%long_query%';
```

可以直接动态修改参数（重启后失效）。

```sql
set @@global.slow_query_log=1; -- 1 开启，0 关闭，重启后失效 
set @@global.long_query_time=3; -- mysql 默认的慢查询时间是 10 秒，另开一个窗口后才会查到最新值 

show variables like '%long_query%'; 
show variables like '%slow_query%';
```

或者修改配置文件 my.cnf。

以下配置定义了慢查询日志的开关、慢查询的时间、日志文件的存放路径。

```sql
slow_query_log = ON 
long_query_time=2 
slow_query_log_file =/var/lib/mysql/localhost-slow.log
```

模拟慢查询：

```sql
select sleep(10);
```

查询 user_innodb 表的 500 万数据（检查是不是没有索引）。

```sql
SELECT * FROM `user_innodb` where phone = '136';
```

### 2.2. 慢日志分析

**1、日志内容**

```sql
show global status like 'slow_queries'; -- 查看有多少慢查询 
show variables like '%slow_query%'; -- 获取慢日志目录
```

```sql
cat /var/lib/mysql/ localhost-slow.log
```

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/202403/7cbabf21972dc9f7.png)

有了慢查询日志，怎么去分析统计呢？比如 SQL 语句的出现的慢查询次数最多，平均每次执行了多久？人工肉眼分析显然不可能。

**2、mysqldumpslow**

`https://dev.mysql.com/doc/refman/5.7/en/mysqldumpslow.html`

MySQL 提供了 mysqldumpslow 的工具，在 MySQL 的 bin 目录下。

```sql
mysqldumpslow --help
```

例如：查询用时最多的 10 条慢 SQL：

```sql
mysqldumpslow -s t -t 10 -g 'select' /var/lib/mysql/localhost-slow.log
```

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/202403/23d090904cba6f25.png)

- Count 代表这个 SQL 执行了多少次；
- Time 代表执行的时间，括号里面是累计时间；
- Lock 表示锁定的时间，括号是累计；
- Rows 表示返回的记录数，括号是累计。

除了慢查询日志之外，还有一个 SHOW PROFILE 工具可以使用

## 3. 如何查看执行计划

你们的导向图：https://www.processon.com/view/link/643c031f6dcb245472ab26c9

[https://dev.mysql.com/doc/refman/5.7/en/explain-output.html](https://dev.mysql.com/doc/refman/5.7/en/explain-output.html)

我们先创建三张表。一张课程表，一张老师表，一张老师联系方式表（没有任何索引）。

我们先创建三张表。一张课程表，一张老师表，一张老师联系方式表（没有任何索引）。

```sql
DROP TABLE
IF
	EXISTS course;

CREATE TABLE `course` ( `cid` INT ( 3 ) DEFAULT NULL, `cname` VARCHAR ( 20 ) DEFAULT NULL, `tid` INT ( 3 ) DEFAULT NULL ) ENGINE = INNODB DEFAULT CHARSET = utf8mb4;

DROP TABLE
IF
	EXISTS teacher;

CREATE TABLE `teacher` ( `tid` INT ( 3 ) DEFAULT NULL, `tname` VARCHAR ( 20 ) DEFAULT NULL, `tcid` INT ( 3 ) DEFAULT NULL ) ENGINE = INNODB DEFAULT CHARSET = utf8mb4;

DROP TABLE
IF
	EXISTS teacher_contact;

CREATE TABLE `teacher_contact` ( `tcid` INT ( 3 ) DEFAULT NULL, `phone` VARCHAR ( 200 ) DEFAULT NULL ) ENGINE = INNODB DEFAULT CHARSET = utf8mb4;

INSERT INTO `course`
VALUES
	( '1', 'mysql', '1' );

INSERT INTO `course`
VALUES
	( '2', 'jvm', '1' );

INSERT INTO `course`
VALUES
	( '3', 'juc', '2' );

INSERT INTO `course`
VALUES
	( '4', 'spring', '3' );

INSERT INTO `teacher`
VALUES
	( '1', 'bobo', '1' );

INSERT INTO `teacher`
VALUES
	( '2', '老严', '2' );

INSERT INTO `teacher`
VALUES
	( '3', 'dahai', '3' );

INSERT INTO `teacher_contact`
VALUES
	( '1', '13688888888' );

INSERT INTO `teacher_contact`
VALUES
	( '2', '18166669999' );

INSERT INTO `teacher_contact`
VALUES
	( '3', '17722225555' );
```

explain 的结果有很多的字段，我们详细地分析一下。

先确认一下环境：

```sql
select version(); 
show variables like '%engine%';
```

### 3.1. id

```
id 是查询序列编号。
```

**id 值不同**

```
id 值不同的时候，先查询 id 值大的（先大后小）。
```

```sql
-- 查询 mysql 课程的老师手机号
EXPLAIN SELECT
	tc.phone 
FROM
	teacher_contact tc 
WHERE
	tcid = ( SELECT tcid FROM teacher t WHERE t.tid = ( SELECT c.tid FROM course c WHERE c.cname = 'mysql' ) );
```

```
查询顺序：course c——teacher t——teacher_contact tc。
```

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/202403/ce09ab0b025d1399.png)

```
先查课程表，再查老师表，最后查老师联系方式表。子查询只能以这种方式进行，只有拿到内层的结果之后才能进行外层的查询。
```

**id 值相同（从上往下）**

```sql
-- 查询课程 ID 为 2，或者联系表 ID 为 3 的老师 
EXPLAIN SELECT
	t.tname,
	c.cname,
	tc.phone 
FROM
	teacher t,
	course c,
	teacher_contact tc 
WHERE
	t.tid = c.tid 
	AND t.tcid = tc.tcid 
	AND ( c.cid = 2 OR tc.tcid = 3 );
```

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/202403/6b6f3a077c1c4359.png)

```
id 值相同时，表的查询顺序是
```

**从上往下**顺序执行。例如这次查询的 id 都是 1，查询的顺序是 teacher t（3 条）——course c（4 条）——teacher_contact tc（3 条）。

**既有相同也有不同**

```
如果 ID 有相同也有不同，就是 ID 不同的先大后小，ID 相同的从上往下。
```

### 3.2. select type查询类型

```
这里并没有列举全部（其它：DEPENDENT UNION、DEPENDENT SUBQUERY、MATERIALIZED、UNCACHEABLE SUBQUERY、UNCACHEABLE UNION）。
```

```
下面列举了一些常见的查询类型：
```

**SIMPLE**

```
简单查询，不包含子查询，不包含关联查询 union。
```

```sql
EXPLAIN SELECT * FROM teacher;
```

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/202403/6bba5bbd6a9df8db.png)

再看一个包含子查询的案例：

```sql
-- 查询 mysql 课程的老师手机号 
EXPLAIN SELECT
	tc.phone 
FROM
	teacher_contact tc 
WHERE
	tcid = ( SELECT tcid FROM teacher t WHERE t.tid = ( SELECT c.tid FROM course c WHERE c.cname = 'mysql' ) );
```

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/202403/8d1161193b2cdc5d.png)

**PRIMARY**

子查询 SQL 语句中的主查询，也就是最外面的那层查询。

**SUBQUERY**

子查询中所有的内层查询都是 SUBQUERY 类型的。

**DERIVED**

衍生查询，表示在得到最终查询结果之前会用到临时表。例如：

```sql
-- 查询 ID 为 1 或 2 的老师教授的课程
EXPLAIN SELECT
	cr.cname 
FROM
	( SELECT * FROM course WHERE tid = 1 UNION SELECT * FROM course WHERE tid = 2 ) cr;
```

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/202403/01cf247424b3a75f.png)

对于关联查询，先执行右边的 table（UNION），再执行左边的 table，类型是DERIVED

**UNION**

用到了 UNION 查询。同上例。

**UNION RESULT**

主要是显示哪些表之间存在 UNION 查询。<union2,3>代表 id=2 和 id=3 的查询存在 UNION。同上例。

### 3.3. type 连接类型

https://dev.mysql.com/doc/refman/5.7/en/explain-output.html#explain-join-types

所有的连接类型中，上面的最好，越往下越差。

在常用的链接类型中：system > const > eq_ref > ref > range > index > all

这 里 并 没 有 列 举 全 部 （ 其 他 ： fulltext 、 ref_or_null 、 index_merger 、unique_subquery、index_subquery）。

以上访问类型除了 all，都能用到索引。

**const**

主键索引或者唯一索引，只能查到一条数据的 SQL。

```sql
DROP TABLE
IF
	EXISTS single_data;
CREATE TABLE single_data ( id INT ( 3 ) PRIMARY KEY, content VARCHAR ( 20 ) );
INSERT INTO single_data
VALUES
	( 1, 'a' );
EXPLAIN SELECT
	* 
FROM
	single_data a 
WHERE
	id = 1;
```

**system**

system 是 const 的一种特例，只有一行满足条件。例如：只有一条数据的系统表。

```sql
EXPLAIN SELECT * FROM mysql.proxies_priv;
```

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/202403/4afcb480553fe8d4.png)

**eq_ref**

通常出现在多表的 join 查询，表示对于前表的每一个结果,，都只能匹配到后表的一行结果。一般是唯一性索引的查询（UNIQUE 或 PRIMARY KEY）。

eq_ref 是除 const 之外最好的访问类型。

先删除 teacher 表中多余的数据，teacher_contact 有 3 条数据，teacher 表有 3条数据。

```sql
DELETE 
FROM
	teacher 
WHERE
	tid IN ( 4, 5, 6 );
COMMIT;
-- 备份
INSERT INTO `teacher`
VALUES
	( 4, '老严', 4 );
INSERT INTO `teacher`
VALUES
	( 5, 'bobo', 5 );
INSERT INTO `teacher`
VALUES
	( 6, 'seven', 6 );
COMMIT;
```

为 teacher_contact 表的 tcid（第一个字段）创建主键索引。

```sql
-- ALTER TABLE teacher_contact DROP PRIMARY KEY; 
ALTER TABLE teacher_contact ADD PRIMARY KEY(tcid);
```

为 teacher 表的 tcid（第三个字段）创建普通索引。

```sql
-- ALTER TABLE teacher DROP INDEX idx_tcid;
ALTER TABLE teacher ADD INDEX idx_tcid (tcid);
```

执行以下 SQL 语句：

```sql
select t.tcid from teacher t,teacher_contact tc where t.tcid = tc.tcid;
```

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/202403/55e884f996dd3f30.png)

此时的执行计划（teacher_contact 表是 eq_ref）：

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/202403/90ffeb72681095c3.png)

**小结：**

以上三种 system，const，eq_ref，都是可遇而不可求的，基本上很难优化到这个状态。

**ref**

查询用到了非唯一性索引，或者关联操作只使用了索引的最左前缀。

例如：使用 tcid 上的普通索引查询：

```sql
explain SELECT * FROM teacher where tcid = 3;
```

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/202403/adb41da61fad0681.png)

**range**

索引范围扫描。

如果 where 后面是 between and 或 <或 > 或 >= 或 <=或 in 这些，type 类型就为 range。

不走索引一定是全表扫描（ALL），所以先加上普通索引。

```sql
-- ALTER TABLE teacher DROP INDEX idx_tid; 
ALTER TABLE teacher ADD INDEX idx_tid (tid);
```

执行范围查询（字段上有普通索引）：

```sql
EXPLAIN SELECT * FROM teacher t WHERE t.tid <3; 
-- 或
EXPLAIN SELECT * FROM teacher t WHERE tid BETWEEN 1 AND 2;
```

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/202403/4693e0aebf27e34c.png)

IN 查询也是 range（字段有主键索引）

```sql
EXPLAIN SELECT * FROM teacher_contact t WHERE tcid in (1,2,3);
```

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/202403/b4577d179ea39800.png)

**index**

Full Index Scan，查询全部索引中的数据（比不走索引要快）。

```sql
EXPLAIN SELECT tid FROM teacher;
```

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/202403/05d1ad1c3cdaeb1a.png)

**all**

Full Table Scan，如果没有索引或者没有用到索引，type 就是 ALL。代表全表扫描。

**小结：**

一般来说，需要保证查询至少达到 range 级别，最好能达到 ref。

ALL（全表扫描）和 index（查询全部索引）都是需要优化的。

### 3.4. possible_key、key

可能用到的索引和实际用到的索引。如果是 NULL 就代表没有用到索引。

possible_key 可以有一个或者多个，可能用到索引不代表一定用到索引。

反过来，possible_key 为空，key 可能有值吗？

表上创建联合索引：

```sql
ALTER TABLE user_innodb DROP INDEX comidx_name_phone; 
ALTER TABLE user_innodb add INDEX comidx_name_phone (name,phone);
```

执行计划（改成 select name 也能用到索引）：

```sql
explain select phone from user_innodb where phone='126';
```

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/202403/133263917085bbee.png)

结论：是有可能的（这里是覆盖索引的情况）。

如果通过分析发现没有用到索引，就要检查 SQL 或者创建索引。

### 3.5. key_len

索引的长度（使用的字节数）。跟索引字段的类型、长度有关。

表上有联合索引：KEY

`comidx_name_phone` (`name`,`phone`)

```sql
explain select * from user_innodb where name ='jim';
```

### 3.6. rows

MySQL 认为扫描多少行才能返回请求的数据，是一个预估值。一般来说行数越少越好。

### 3.7. filtered

这个字段表示存储引擎返回的数据在 server 层过滤后，剩下多少满足查询的记录数量的比例，它是一个百分比。

### 3.8. ref

使用哪个列或者常数和索引一起从表中筛选数据。

### 3.9. Extra

执行计划给出的额外的信息说明。

**using index**

用到了覆盖索引，不需要回表。

```sql
EXPLAIN SELECT tid FROM teacher ;
```

**using where**

使用了 where 过滤，表示存储引擎返回的记录并不是所有的都满足查询条件，需要在 server 层进行过滤（跟是否使用索引没有关系）。

```sql
EXPLAIN select * from user_innodb where phone ='13866667777';
```

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/202403/6896c9bad9a47f92.png)

**using filesort**

不能使用索引来排序，用到了额外的排序（跟磁盘或文件没有关系）。需要优化。（复合索引的前提）

```sql
ALTER TABLE user_innodb DROP INDEX comidx_name_phone; 
ALTER TABLE user_innodb add INDEX comidx_name_phone (name,phone);
```

```sql
EXPLAIN select * from user_innodb where name ='jim' order by id;
```

```
（order by id 引起）
```

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/202403/4ccf63ee8c6e85a4.png)

**using temporary**

用到了临时表。例如（以下不是全部的情况）：

1、distinct 非索引列

```sql
EXPLAIN select DISTINCT(tid) from teacher t;
```

2、group by 非索引列

```sql
EXPLAIN select tname from teacher group by tname;
```

3、使用 join 的时候，group 任意列

```sql
EXPLAIN select t.tid from teacher t join course c on t.tid = c.tid group by t.tid;
```

需要优化，例如创建复合索引。

**总结一下：**

模拟优化器执行 SQL 查询语句的过程，来知道 MySQL 是怎么处理一条 SQL 语句的。通过这种方式我们可以分析语句或者表的性能瓶颈。

分析出问题之后，就是对 SQL 语句的具体优化。

---

## 4. 我们为什么需要分库分表

在分库分表之前，就需要考虑为什么需要拆分。我们做一件事，肯定是有充分理由的。所以得想好分库分表的理由是什么。我们现在就从两个维度去思考它，**为什么要分库？为什么要分表？**

### 4.1. 为什么要分库

如果业务量剧增，数据库可能会出现性能瓶颈，这时候我们就需要考虑拆分数据库。从这两方面来看：

磁盘存储：业务量剧增，MySQL单机磁盘容量会撑爆，拆成多个数据库，磁盘使用率大大降低。

并发连接支撑：我们知道数据库连接数是有限的。在高并发的场景下，大量请求访问数据库，MySQL单机是扛不住的！高并发场景下，会出现too many connections报错。

当前非常火的微服务架构出现，就是为了应对高并发。它把订单、用户、商品等不同模块，拆分成多个应用，并且把单个数据库也拆分成多个不同功能模块的数据库（订单库、用户库、商品库），以分担读写压力。

### 4.2. 为什么要分表

假如你的单表数据量非常大，存储和查询的性能就会遇到瓶颈了，如果你做了很多优化之后还是无法提升效率的时候，就需要考虑做分表了。一般千万级别数据量，就需要分表。

这是因为即使SQL命中了索引，如果表的数据量超过一千万的话，查询也是会明显变慢的。这是因为索引一般是B+树结构，数据千万级别的话，B+树的高度会增高，查询就变慢啦。MySQL的B+树的高度怎么计算的呢？跟大家复习一下：

InnoDB存储引擎最小储存单元是页，一页大小就是16k。B+树叶子存的是数据，内部节点存的是键值+指针。索引组织表通过非叶子节点的二分查找法以及指针确定数据在哪个页中，进而再去数据页中找到需要的数据，B+树结构图如下：

假设B+树的高度为2的话，即有一个根结点和若干个叶子结点。这棵B+树的存放总记录数为=根结点指针数*单个叶子节点记录行数。

> 如果一行记录的数据大小为1k，那么单个叶子节点可以存的记录数 =16k/1k =16. 非叶子节点内存放多少指针呢？我们假设主键ID为bigint类型，长度为8字节(面试官问你int类型，一个int就是32位，4字节)，而指针大小在InnoDB源码中设置为6字节，所以就是 8+6=14 字节，16k/14B =16*1024B/14B = 1170
>
> 因此，一棵高度为2的B+树，能存放1170 * 16=18720条这样的数据记录。同理一棵高度为3的B+树，能存放1170 *1170 *16 =21902400，大概可以存放两千万左右的记录。B+树高度一般为1-3层，如果B+到了4层，查询的时候会多查磁盘的次数，SQL就会变慢。

因此单表数据量太大，SQL查询会变慢，所以就需要考虑分表啦。

---

## 5. 什么时候考虑分库分表？

对于MySQL，InnoDB存储引擎的话，单表最多可以存储10亿级数据。但是的话，如果真的存储这么多，性能就会非常差。一般数据量千万级别，B+树索引高度就会到3层以上了，查询的时候会多查磁盘的次数，SQL就会变慢。

阿里巴巴的《Java开发手册》提出：

> 单表行数超过500万行或者单表容量超过2GB，才推荐进行分库分表。

那我们是不是等到数据量到达五百万，才开始分库分表呢？

> 不是这样的，我们应该提前规划分库分表，如果估算3年后，你的表都不会到达这个五百万，则不需要分库分表。

MySQL服务器如果配置更好，是不是可以超过这个500万这个量级，才考虑分库分表？

> 虽然配置更好，可能数据量大之后，性能还是不错，但是如果持续发展的话，还是要考虑分库分表

一般什么类型业务表需要才分库分表？

> 通用是一些流水表、用户表等才考虑分库分表，如果是一些配置类的表，则完全不用考虑，因为不太可能到达这个量级。

---

## 6. 如何选择分表键

分表键，即用来分库/分表的字段，换种说法就是，你以哪个维度来分库分表的。比如你按用户ID分表、按时间分表、按地区分表，这些用户ID、时间、地区就是分表键。

一般数据库表拆分的原则，需要先找到业务的主题。比如你的数据库表是一张企业客户信息表，就可以考虑用了客户号做为分表键。

为什么考虑用客户号做分表键呢？  Saas

这是因为表是基于客户信息的，所以，需要将同一个客户信息的数据，落到一个表中，避免触发全表路由。

---

## 7. 非分表键如何查询

分库分表后，有时候无法避免一些业务场景，需要通过非分表键来查询。

假设一张用户表，根据userId做分表键，来分库分表。但是用户登录时，需要根据用户手机号来登陆。这时候，就需要通过手机号查询用户信息。而手机号是非分表键。

非分表键查询，一般有这几种方案：

- 遍历：最粗暴的方法，就是遍历所有的表，找出符合条件的手机号记录（不建议）
- 将用户信息冗余同步到ES，同步发送到ES，然后通过ES来查询（推荐）
- 其实还有基因法：比如非分表键可以解析出分表键出来，比如常见的，订单号生成时，可以包含客户号进去，通过订单号查询，就可以解析出客户号。但是这个场景除外，手机号似乎不适合冗余userId。

---

## 8. 分表策略如何选择

### 8.1. range范围

`range`，即范围策略划分表。比如我们可以将表的主键 `order_id`，按照从 `0~300万`的划分为一个表，`300万~600万`划分到另外一个表。

有时候我们也可以按时间范围来划分，如不同年月的订单放到不同的表，它也是一种range的划分策略。

优点： Range范围分表，有利于扩容。

缺点： 可能会有热点问题。因为订单id是一直在增大的，也就是说最近一段时间都是汇聚在一张表里面的。比如最近一个月的订单都在300万~600万之间，平时用户一般都查最近一个月的订单比较多，请求都打到order_1表啦。

### 8.2. hash取模

hash取模策略：

指定的路由key（一般是user_id、order_id、customer_no作为key）对分表总数进行取模，把数据分散到各个表中。

比如原始订单表信息，我们把它分成4张分表：

比如：

- id=1，对4取模，就会得到1，就把它放到t_order_1;
- id=3，对4取模，就会得到3，就把它放到t_order_3;

一般，我们会取哈希值，再做取余：

```
Math.abs(orderId.hashCode()) % table_number
```

**优点：**hash取模的方式，不会存在明显的热点问题。

**缺点：**如果未来某个时候，表数据量又到瓶颈了，需要扩容，就比较麻烦。所以一般建议提前规划好，一次性分够。（可以考虑一致性哈希）

### 8.3. 一致性Hash

如果用hash方式分表，前期规划不好，需要扩容二次分表，表的数量需要增加，所以hash值需要重新计算，这时候需要迁移数据了。

比如我们开始分了10张表，之后业务扩展需要，增加到20张表。那问题就来了，之前根据orderId取模10后的数据分散在了各个表中，现在需要重新对所有数据重新取模20来分配数据

为了解决这个扩容迁移问题，可以使用一致性hash思想来解决。

一致性哈希：在移除或者添加一个服务器时，能够尽可能小地改变已存在的服务请求与处理请求服务器之间的映射关系。一致性哈希解决了简单哈希算法在分布式哈希表存在的动态伸缩等问题

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/202403/d46f8b97ab1f1b30.png)

---

## 9. 分库后，事务问题如何解决

分库分表后，假设两个表在不同的数据库，那么**本地事务已经无效**啦，需要使用**分布式事务**了。

常用的分布式事务解决方案有：

* 两阶段提交
* 三阶段提交
* TCC
* 本地消息表
* 最大努力通知
* saga

---

## 10. 跨节点Join关联问题

在单库未拆分表之前，我们如果要使用join关联多张表操作的话，简直so easy啦。但是分库分表之后，两张表可能都不在同一个数据库中了，那么如何跨库join操作呢？

**跨库Join的几种解决思路：**

- **字段冗余：**把需要关联的字段放入主表中，避免关联操作；比如订单表保存了卖家ID（sellerId），你把卖家名sellerName也保存到订单表，这就不用去关联卖家表了。这是一种空间换时间的思想。
- **全局表：**比如系统中所有模块都可能会依赖到的一些基础表（即全局表），在每个数据库中均保存一份。
- **数据抽象同步：**比如A库中的a表和B库中的b表有关联，可以定时将指定的表做同步，将数据汇合聚集，生成新的表。一般可以借助ETL工具。
- **应用层代码组装：**分开多次查询，调用不同模块服务，获取到数据后，代码层进行字段计算拼装。

---

## 11. order by,group by等聚合函数问题

跨节点的 `count,order by,group by`以及聚合函数等问题，都是一类的问题，它们一般都需要基于全部数据集合进行计算。可以分别在各个节点上得到结果后，再在应用程序端进行合并。

---

## 12. 分库分表后的分页问题

**方案1（全局视野法）：**

在各个数据库节点查到对应结果后，在代码端汇聚再分页。这样优点是业务无损，精准返回所需数据；缺点则是会返回过多数据，增大网络传输，也会造成空查，

> 比如分库分表前，你是根据创建时间排序，然后获取第2页数据。如果你是分了两个库，那你就可以每个库都根据时间排序，然后都返回2页数据，然后把两个数据库查询回来的数据汇总，再根据创建时间进行内存排序，最后再取第2页的数据。

**方案2（业务折衷法-禁止跳页查询）：**

这种方案需要业务妥协一下，只有上一页和下一页，不允许跳页查询了。

> 这种方案，查询第一页时，是跟全局视野法一样的。但是下一页时，需要把当前最大的创建时间传过来，然后每个节点，都查询大于创建时间的一页数据，接着汇总，内存排序返回。

---

## 13. 分库分表选择哪种中间件

目前流行的分库分表中间件比较多：

* Sharding-JDBC：当当开源，好用，建议
* cobar：阿里巴巴产品，不支持读写分离
* Mycat：建议，比较重，但是好用
* Atlas：360开源产品，不支持分布式分表，所有表同库
* TDDL：阿里巴巴产品，非代理式，不支持读写分离
* vitess：谷歌产品，还可以，但是用的少，支持高并发 ZK管理  PRC方式进行处理数据，重

---

## 14. 如何评估分库数量

对于MySQL来说的话，一般单库超过5千万记录，DB的压力就非常大了。所以分库数量多少，需要看单库处理记录能力有关。

如果分库数量少，达不到分散存储和减轻DB性能压力的目的；如果分库的数量多，对于跨多个库的访问，应用程序需要访问多个库。

一般是建议分4~10个库，一般建议10个库以下，不然不好管理

---

## 15. 垂直分库、水平分库、垂直分表、水平分表的区别

水平分库：以字段为依据，按照一定策略（hash、range等），将一个库中的数据拆分到多个库中。

水平分表：以字段为依据，按照一定策略（hash、range等），将一个表中的数据拆分到多个表中。

垂直分库：以表为依据，按照业务归属不同，将不同的表拆分到不同的库中。

垂直分表：以字段为依据，按照字段的活跃性，将表中字段拆到不同的表（主表和扩展表）中

---

## 16. 分表要停服嘛？不停服怎么做？

不用停服。不停服的时候，应该怎么做呢，主要分五个步骤：

1. 编写代理层，加个开关（控制访问新的DAO还是老的DAO，或者是都访问），灰度期间，还是访问老的DAO。
2. 发版全量后，开启双写，既在旧表新增和修改，也在新表新增和修改。
3. 日志或者临时表记下新表ID起始值，旧表中小于这个值的数据就是存量数据，这批数据就是要迁移的。
4. 通过脚本把旧表的存量数据写入新表。
5. 停读旧表改读新表，此时新表已经承载了所有读写业务，但是这时候不要立刻停写旧表，需要保持双写一段时间。当读写新表一段时间之后，如果没有业务问题，就可以停写旧表啦
