---
title: 03-索引优化分析
category:
  - MySQL
date: 2023-02-27
---

<!-- more -->

# 1、一条sql语句执行顺序

手写：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151320375.png" alt="image-20210609153958323" />



机读：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151320377.png" alt="image-20210609154015097" />

**执行顺序总结：**

1. from 子句组装来自不同数据源的数据；
2. where 子句基于指定的条件对记录行进行筛选；
3. group by 子句将数据划分为多个分组；
4. 使用聚集函数进行计算；
5. 使用 having 子句筛选分组；
6. 计算所有的表达式；
7. select 的字段；
8. 使用 order by 对结果集进行排序。



***

# 2、MySQL常见性能瓶颈

## 2.1 常见瓶颈

**CPU** 

- SQL中对大量数据进行比较、关联、排序、分组（最大的压力在于比较）

**IO**

- 实例内存满足不了缓存数据或排序等需要，导致产生大量物理 IO。

- 查询执行效率低，扫描过多数据行。

**锁**

- 不适宜的锁的设置，导致线程阻塞，性能下降。

- 死锁，线程之间交叉调用资源，导致死锁，程序卡住。

**服务器硬件的性能瓶颈：top,free, iostat和vmstat来查看系统的性能状态**

**原因：**

1. 查询数据过多！
2. 关联了太多的表，太多join 。join 原理。用 A 表的每一条数据 扫描 B表的所有数据。所以尽量先过滤。
3. 没有利用到索引。



## 2.2 常见的join查询

**左连接：**

```
SELECT <select_list> From A a LEFT join B b ON a.key=b.key;
```

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151320378.png" alt="image-20210609155013353" />

**右连接：**

```
SELECT <select_list> From A a RIGHT join B b ON a.key=b.key;
```

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151320379.png" alt="image-20210609155108408" />

**交集：**

```
SELECT <select_list> From A a INNER join B b ON a.key=b.key;
```

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151320380.png" alt="image-20210609155131914"/>

**只取A独有部分：**

```
SELECT <select_list> From A a LEFT join B b ON a.key=b.key where b.key is null ;
```

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151320381.png" alt="image-20210609155219344" />

**只取B独有部分：**

```
SELECT <select_list> From A a LEFT join B b ON a.key=b.key where a.key is null ;
```

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151320382.png" alt="image-20210609155256858" />

**A、B并集：**

```
SELECT <select_list> From A a FULL OUTER B b ON a.key=b.key ;
```

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151320383.png" alt="image-20210609155319058" />

**刨除交集：**

```
SELECT <select_list> From A a FULL OUTER B b ON a.key=b.key where a.key is null or b.key is null;
```

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151320384.png" alt="image-20210609155336894" />



***

# 3、索引简介

## 3.1 索引概述

索引可以简单理解为 “**排好序的快速查找数据结构**”。数据本身之外，数据库还维护着一个满足特定查找算法的数据结构，这些数据结构以某种方式指向数据，这样就可以在这些数据结构的基础上实现高级查找算法，这种数据结构就是索引。

下图就是一种可能的索引方式示例：

![image-20210609155657049](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151320385.png)



1. 左边是数据表，一共有两列七条记录，最左边的是数据记录的物理地址（注意逻辑上相邻的记录在磁盘上也并不是一定物理相邻的）。为了加快Col2的查找，可以维护一个右边所示的二叉查找树，每个节点分别包含索引键值和一个指向对应数据记录物理地址的指针，这样就可以运用二叉查找快速获取到相应数据。

2. 一般来说索引本身也很大，不可能全部存储在内存中，因此**索引往往以索引文件的形式存储在磁盘上**。索引是数据库中用来提高性能的最常用的工具。

**二叉树弊端之一：** 二叉树很可能会发生两边不平衡的情况。

**B-TREE: (B:balance)：**会自动根据两边的情况自动调节，使两端无限趋近于平衡状态。可以使性能最稳定(myisam使用的方式)。



## 3.2 索引优劣势

**索引优势**

- 类似大学图书馆建书目索引，提高数据检索的效率，降低数据库的IO成本。
- 通过索引列对数据进行排序，降低数据排序的成本，降低了CPU的消耗。

**索引劣势**

- 实际上索引也是一张表，该表记录了索引字段与主键，并指向实体表的记录，所以索引列也是要占有空间的。
- 虽然索引大大提高了查询速度，同时却会降低更新表的速度，如对表进行INSERT、UPDATE和DELETE操作。因为更新表时MySQL不仅要保存数据，还要保存一下索引文件每次更新添加了索引列的字段，都会调整因为更新所带来的键值变化后的索引信息。



## 3.3 索引分类

### 3.3.1 主键索引

- 设定主键后数据库会自动建立索引，innodb为聚簇索引。

- 语法：

  ```sql
  -- 随表一起建索引：
  CREATE TABLE customer (id INT(10) UNSIGNED  AUTO_INCREMENT ,
                         customer_no VARCHAR(200),
                         customer_name VARCHAR(200),
    					 PRIMARY KEY(id) 
  );
  -- unsigned(无符号的)，
  -- 使用 auto_increment 的列必须有索引（只要有索引就行）
  
  CREATE TABLE customer2 (id INT(10) UNSIGNED,
                          customer_no VARCHAR(200),
                          customer_name VARCHAR(200),
    					  PRIMARY KEY(id) 
  );
  
  -- 单独建索引：
  ALTER TABLE customer2 add PRIMARY KEY Customer(customer_no);
  ALTER TABLE customer drop PRIMARY KEY;
  
  -- 修改建主键索引：必须先drop掉原索引，再add新索引
  ```



### 3.3.2 单值索引

- 即一个索引只包含单个列，一个表可以有多个单列索引。

- 语法：

  ```sql
  -- 随表一起建索引：
  CREATE TABLE customer (id INT(10) UNSIGNED  AUTO_INCREMENT ,
                         customer_no VARCHAR(200),
                         customer_name VARCHAR(200),
    					  PRIMARY KEY(id),
   					  KEY (customer_name)  
  );
  
  -- 随表一起建立的索引, 索引名同列名(customer_name)
  -- 单独建单值索引：
  CREATE  INDEX idx_customer_name ON customer(customer_name); 
   
  -- 删除索引：
  DROP INDEX idx_customer_name ;
  ```



### 3.3.3 唯一索引

- 索引列的值必须唯一，但允许有空值。

- 语法：

  ```sql
  -- 随表一起建索引：
  CREATE TABLE customer (id INT(10) UNSIGNED  AUTO_INCREMENT ,
                         customer_no VARCHAR(200),customer_name VARCHAR(200),
   					 PRIMARY KEY(id),
    					 KEY (customer_name),
    					 UNIQUE (customer_no)
  );
  
  -- 建立唯一索引时必须保证所有的值是唯一的（除了null），若有重复数据，会报错。  
  
  -- 单独建唯一索引：
  CREATE UNIQUE INDEX idx_customer_no ON customer(customer_no); 
   
  -- 删除索引：
  DROP INDEX idx_customer_no on customer ;
  ```



### 3.3.4 复合索引

- 在数据库操作期间，复合索引比单值索引所需要的开销更小(对于相同的多个列建索引)，当表的行数远大于索引列的数目时可以使用复合索引。

- 语法：

  ```sql
  -- 随表一起建索引：
  CREATE TABLE customer (id INT(10) UNSIGNED  AUTO_INCREMENT ,
                         customer_no VARCHAR(200),
                         customer_name VARCHAR(200),
    					 PRIMARY KEY(id),
    					 KEY (customer_name),
    					 UNIQUE (customer_name),
   					 KEY (customer_no,customer_name)
  );
   
  -- 单独建索引：
  CREATE  INDEX idx_no_name ON customer(customer_no,customer_name); 
   
  -- 删除索引：
  DROP INDEX idx_no_name  on customer ;
  ```



### 3.3.5 聚集索引

- 用户数据和索引数据存储在一起就叫聚集索引！

- 在INNODB可以视为聚集索引和主键索引等价！



### 3.3.6 覆盖索引：

该索引和查询的select字段重叠。

例：

```
create index idx_col1_col2 on student(name,course);
```

```
explain select name,course from student ;
```



## 3.4 索引基本语法

```sql
-- 创建：
	ALTER TABLE ADD[UNIQUE] INDEX[indexName] ON(columnname(length))

-- 删除：
	DROP INDEX index_name ON TABLE_NAME
    
-- 查看：
	SHOW INDEX FROM TABLE_NAME	
    
    

-- 有四种方式来添加数据表的索引：

-- 该语句添加一个主键，这意味着索引值必须是唯一的，且不能为NULL。
ALTER TABLE tbl_name ADD PRIMARY KEY (column_list)
-- 这条语句创建索引的值必须是唯一的（除了NULL外，NULL可能会出现多次）。
ALTER TABLE tbl_name ADD UNIQUE index_name (column_list)
-- 添加普通索引，索引值可出现多次。
ALTER TABLE tbl_name ADD INDEX index_name (column_list)
-- 该语句指定了索引为 FULLTEXT ，用于全文索引。
ALTER TABLE tbl_name ADD FULLTEXT index_name (column_list)
     
```



***

# 4、索引底层结构

## 4.1 MySQL索引本质

INNODB存储引擎数据存储在数据页上（数据页大小16kb），读取数据时将磁盘数据放到内存上读取！每查询一次相当于一次IO操作！

- **插入数据**时按主键大小进行顺序存储，即使第一页数据插满了，后续的数据还是会按顺序插入的，如下图所示。

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151320386.png" alt="image-20210609163215519" />

- **单页读取数据**时按页目录进行直接读取，避免按主键顺序逐条读取！

- **多页读取数据**时会利用目录页结构快速定位页的位置。这种结构和B+Tree树非常相似。如下图所示！

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151320387.png" alt="image-20210609163450235" />

  

  **B+Tree特点：**

  1. 元素存在冗余，叶子节点可能包含相同元素。
  2. 叶子节点通过前后指针相连。
  3. 树的高度低，减少查询次数



## 4.2 MySQL索引底层原理

索引是在MySQL的**存储引擎层中实现的，而不是在服务器层实现的**。所以每种存储引擎的索引都不一定完全相同，也不是所有的存储引擎都支持所有的索引类型的。MySQL目前提供了以下4种索引：

- BTREE 索引 ： 最常见的索引类型，大部分索引都支持 B 树索引。
- HASH 索引：只有Memory引擎支持 ，使用场景简单 。
- R-tree 索引（空间索引）：空间索引是MyISAM引擎的一个特殊索引类型，主要用于地理空间数据类型，通常使用较少。
- Full-text （全文索引） ：全文索引也是MyISAM的一个特殊索引类型，主要用于全文索引，InnoDB从Mysql5.6版本开始支持全文索引。

**MyISAM、InnoDB、Memory三种存储引擎对各种索引类型的支持**

| 索引        | InnoDB引擎      | MyISAM引擎 | Memory引擎 |
| ----------- | --------------- | ---------- | ---------- |
| BTREE索引   | 支持            | 支持       | 支持       |
| HASH 索引   | 不支持          | 不支持     | 支持       |
| R-tree 索引 | 不支持          | 支持       | 不支持     |
| Full-text   | 5.6版本之后支持 | 支持       | 不支持     |

**我们平常所说的索引，如果没有特别指明，都是指B+树**（多路搜索树，并不一定是二叉的）结构组织的索引。其中**聚集索引**、**复合索引**、**前缀索引**、**唯一索引**默认都是使用 B+tree 索引，统称为索引。



### 4.2.1 BTREE 结构

BTree又叫**多路平衡搜索树**，一颗m叉的BTree特性如下：

- 树中每个节点最多包含m个孩子。
- 除根节点与叶子节点外，每个节点至少有 `ceil(m/2)` 个孩子。
- 若根节点不是叶子节点，则至少有两个孩子。
- 所有的叶子节点都在同一层。
- 每个非叶子节点由 n 个key与 n+1 个指针组成，其中 `ceil(m/2)-1 <= n <= m-1 `。

以5叉BTree为例，key的数量：公式推导[ceil(m/2)-1] <= n <= m-1。所以 2 <= n <=4 。当n>4时，中间节点分裂到父节点，两边节点分裂。

**示例：**

插入 C N G A H E K Q M F W L T Z D P R X Y S 数据，演变过程如下：

1. 插入前4个字母 C N G A  

   ![image-20210609165413256](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151320388.png)

2. 插入H，n>4，中间元素G字母向上分裂到新的节点

   <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151320389.png" alt="image-20210609165437681" />

3. 插入E，K，Q不需要分裂

   <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151320390.png" alt="image-20210609165519741" />

4. 插入M，中间元素M字母向上分裂到父节点G

   <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151320391.png" alt="image-20210609165548249" />

5. 插入F，W，L，T不需要分裂

   <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151320392.png" alt="image-20210609165622611"/>

6. 插入Z，中间元素T向上分裂到父节点中

   <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151320393.png" alt="image-20210609165650733"/>

7. 插入D，中间元素D向上分裂到父节点中。然后插入P，R，X，Y不需要分裂

   <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151320394.png" alt="image-20210609165713953" />

8. 最后插入S，NPQR节点n>5，中间节点Q向上分裂，但分裂后父节点DGMT的n>5，中间节点M向上分裂

   <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151320395.png" alt="image-20210609165729096" />

到此，该BTREE树就已经构建完成了， BTREE树和二叉树相比，查询数据的效率更高，因为对于相同的数据量来说，BTREE的层级结构比二叉树小，因此搜索速度快！



### 4.2.2 B+TREE 结构

B+Tree为BTree的变种，B+Tree与BTree的区别为：

1. n叉B+Tree最多含有n个key，而BTree最多含有 “n-1” 个key
2. B+Tree除了非叶子节点都可以看做是key的索引部分
3. B+Tree的叶子节点保存所有key的信息，按key的大小顺序排列

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151320396.png" alt="image-20210609170006956" />

由于**B+Tree只有叶子节点保存key信息**，查询任何key都要从root走到叶子。所以B+Tree的查询效率更加稳定！



### 4.2.3 MySQL中的B+Tree

MySql索引数据结构对经典的B+Tree进行了优化。在原B+Tree的基础上，**增加一个指向相邻叶子节点的链表指针**，就形成了带有顺序指针的B+Tree，提高区间访问的性能。如下图所示。

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151320397.png" alt="image-20210609170151858" />



***

# 5、哪些情况要建索引/不建索引

## 5.1 哪些情况需要创建索引

1. 主键自动建立唯一索引
2. 频繁作为查询条件的字段应创建索引（where后面的语句）
3. 查询中与其他表关联的字段，外键关系作为索引
4. 单键/组合索引的选择问题：在高并发情况下选择组合索引
5. 查询中排序的字段，排序字段若通过索引去访问将大大提高查询速度
6. 查询中统计或分组字段



## 5.2 哪些情况不要创建索引

1. 表记录太少。

2. 经常增删改的表：提高了查询速度，同时会降低更新表的速度，如对表进行INSERT、UPDATE、DELETE操作。

   因为在更新表时，不仅更新数据，同时还要更新索引文件。

3. Where条件里用不到的字段不要建索引。

4. 数据重复且分布平均的表字段，因此应该只为最经常查询和最经常排序的数据列建立索引。

**注意：** 如果某个数据列包含许多重复的内容，为它建立索引就没有太大的实际效果。



***

# 6、Explain介绍

## 6.1 Explain是什么？

使用Explain关键字可以模拟优化器执行SQL查询语句，从而知道MySQL是如何执行你的sql语句的。分析你的查询语句或是表结构的性能瓶颈。

**作用**

1. 表的读取顺序
2. 哪些索引可以使用
3. 数据读取操作的操作类型
4. 哪些索引被实际使用
5. 表之间的引用
6. 每张表有多少行被优化器查询

**怎么用？**

**Explain + SQL语句**。执行计划包含的信息：

![image-20210609172420904](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151320398.png)



## 6.2 执行计划信息详解

### 6.2.1 Explain之id介绍

**（一）id相同，执行顺序由上至下**"derive2"

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151320399.png" alt="image-20210609172631617" />

以上SQL执行顺序为 t1、t2、t3。



**（二）如果是子查询，id的序号会递增，id值越大优先级越高，越先被执行**

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151320400.png" alt="image-20210609172744238" />

以上SQL执行顺序为： t3、t1、t2。



**（三）id如果相同，可以认为是一组，从上往下顺序执行；在所有组中，id值越大，优先级越高，越先执行**

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151320401.png" alt="image-20210609172831901" />

以上SQL执行顺序为： t3、"derive2"、t2

1. 限制性括号里面的（优先级最高 | id 值最大【2】），执行完毕后为一个续表，使用"derive2"表示

2. 由于"derive2"和t2表的id都是1，一样，所以按照顺序执行，则为 "derive2"、t2



### 6.2.2 Explain之select_type介绍

表示查询的类型！

[ 演示SQL: Explain之id介绍一文 ]

| **序号** |       **类型**       | **说明**                                                     |
| -------- | :------------------: | ------------------------------------------------------------ |
| 1        |        SIMPLE        | 简单的 select 查询,查询中不包含子查询或者UNION               |
| 2        |       PRIMARY        | 查询中若包含任何复杂的子部分，最外层查询则被标记为Primary    |
| 3        |       DERIVED        | 在FROM列表中包含的子查询被标记为DERIVED(衍生) MySQL会递归执行这些子查询, 把结果放在临时表里。 |
| 4        |       SUBQUERY       | 在SELECT或WHERE列表中包含了子查询                            |
| 5        |  DEPENDENT SUBQUERY  | 在SELECT或WHERE列表中包含了子查询,子查询基于外层             |
| 6        | UNCACHEABLE SUBQUREY | 无法被缓存的子查询                                           |
| 7        |        UNION         | 若第二个SELECT出现在UNION之后，则被标记为UNION； 若UNION包含在FROM子句的子查询中,外层SELECT将被标记为：DERIVED |
| 8        |     UNION RESULT     | 用来从匿名临时表里检索结果的select被标记为union result       |



序号3对应SQL语句：

```sql
select t1.* from (select t2.id from t2 where t2.column_name='') s1, t1 where s1.id=t1.id;
```

序号8对应SQL语句：

```sql
explain SELECT * from course a LEFT JOIN score b on a.c_id = b.c_id 
                UNION SELECT * from course a RIGHT JOIN score b on a.c_id = b.c_id;
```



### 6.2.3 Explain之table介绍

对应行正在访问哪一个表，表名或者别名。

- 关联优化器会为查询选择关联顺序，左侧深度优先

- 当from中有子查询的时候，表名是derivedN的形式，N指向子查询，也就是explain结果中的下一列

- 当有union result的时候，表名是union 1,2等的形式，1,2表示参与union的query id

- **注意：** MySQL对待这些表和普通表一样，但是这些“临时表”是没有任何索引的。

  

### 6.2.4 Explain之type介绍

**type显示的是访问类型，是较为重要的一个指标，结果值从最好到最坏依次是：**

```
system > const > eq_ref > ref > fulltext > ref_or_null > index_merge > unique_subquery > index_subquery > range(尽量保证) > index > ALL
```

**工作中常见以下几种：**

```
system > const>eq_ref > ref > range> index > ALL
```

`一般来说，得保证查询至少达到range级别，最好能达到ref。`

**级别介绍：**

1. **system** ：表只有一行记录（等于系统表），这是const类型的特列，平时不会出现，这个也可以忽略不计！
2. **const** ：表示通过索引一次就找到了,const用于比较primary key或者unique索引。因为只匹配一行数据，所以很快，如将主键置于where列表中，MySQL就能将该查询转换为一个常量 ！
3. **eq_ref** ：唯一性索引扫描，对于每个索引键，表中只有一条记录与之匹配。常见于主键或唯一索引扫描。(例如公司CEO，只有一个)！
4. **ref** ：非唯一性索引扫描，返回匹配某个单独值的所有行.本质上也是一种索引访问，它返回所有匹配某个单独的行，然而，它可能会找到多个符合条件的行，所以他应该属于查找和扫描的混合体。
5. **range** ：
   - 只检索给定范围的行,使用一个索引来选择行。key 列显示使用了哪个索引。
   - 一般就是在你的where语句中出现了*between*、*<*、*>*、*in*等的查询。
   - 这种范围扫描索引扫描比全表扫描要好，因为它只需要开始于索引的某一点，而结束语另一点，不用扫描全部索引。
6. **index** ：Full Index Scan，index与ALL区别为index类型只遍历索引树。这通常比ALL快，因为索引文件通常比数据文件小（也就是说虽然all和Index都是读全表，但index是从索引中读取的，而all是从硬盘中读的）。
7. **ALL** ：Full Table Scan，将遍历全表以找到匹配的行。
8. **index_merge**：在查询过程中需要多个索引组合使用，通常出现在有 or 的关键字的sql中。
9. **ref_or_null**：对于某个字段既需要关联条件，也需要null值得情况下。查询优化器会选择用ref_or_null连接查询。
10. **index_subquery**：利用索引来关联子查询，不再全表扫描。
11. **unique_subquery** ：该联接类型类似于index_subquery。 子查询中的唯一索引。



### 6.2.5 Explain之 possible_keys 和key 和key_len

**possible_keys：**

- 显示可能应用在这张表中的索引，一个或多个。查询涉及到字段上若存在索引，则该索引将被列出，但不一定被查询实际使用。

**key：**

- 实际使用的索引。如果为NULL，则没有使用索引。 查询中若使用了覆盖索引，则该索引和查询的select字段重叠。

 **key_len：**

- 表示索引中使用的字节数，可通过该列计算查询中使用的索引的长度。 在不损失精度的情况下，长度越短越好。
- key_len显示的值为索引字段 的最大可能长度，并非实际使用长度，即key_len根据表定义计算而得，并不是通过表内检索出的。字段能够帮你检查是否充分的利用上了索引。



### 6.2.6 Explain之ref

显示索引的哪一列被使用了，如果可能的话，是一个常数。哪些列或常量被用于查找索引列上的值。

如果是使用的常数等值查询，这里会显示const，如果是连接查询，被驱动表的执行计划这里会显示驱动表的关联字段，如果是条件使用了表达式或者函数，或者条件列发生了内部隐式转换，这里可能显示为func。

例：

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151320402.png" alt="image-20210609180330248" />



### 6.2.7 Explain之rows（重要）

rows 也是一个重要的字段。 这是mysql估算的**需要扫描的行数（不是精确值）**。这个值非常直观显示 SQL 的效率好坏，原则上 rows 越少越好。



### 6.2.8 Explain之extra（重要）

**Using filesort**

- 说明mysql会对数据使用一个外部的索引排序，而不是按照表内的索引顺序进行读取。
- MySQL中无法利用索引完成的排序操作称为“文件排序”（没用索引）

**Using temporary**

- 使了用临时表保存中间结果,MySQL在对查询结果排序时使用临时表。常见于排序 order by 和分组查询 group by。

**USING index**

- "覆盖索引扫描", 表示查询在索引树中就可查找所需数据, 不用扫描表数据文件, 往往说明性能不错。
- **注意：**
  如果要使用覆盖索引，一定要注意select列表中只取出需要的列，不可select *，因为如果将所有字段一起做索引会导致索引文件过大，查询性能下降。

**Using where**

- 表明使用了where过滤

**using join buffer**

使用了连接缓存：

- 表示相应的select操作中使用了覆盖索引(Covering Index)，避免访问了表的数据行，效率不错；
- 如果同时出现using where，表明索引被用来执行索引键值的查找；
- 如果没有同时出现using where，表明索引只是用来读取数据而非利用索引执行查找。

**impossible where**

- where子句的值总是false，不能用来获取任何元组。select tables optimized away



***

# 7、表查询优化

## 7.1 单表查询优化

**建表**

```sql
CREATE TABLE IF NOT EXISTS `article` (
	`id` INT(10) UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
	`author_id` INT(10) UNSIGNED NOT NULL,
	`category_id` INT(10) UNSIGNED NOT NULL,
	`views` INT(10) UNSIGNED NOT NULL,
	`comments` INT(10) UNSIGNED NOT NULL,
	`title` VARBINARY(255) NOT NULL,
	`content` TEXT NOT NULL
);


INSERT INTO `article`(`author_id`, `category_id`, `views`, `comments`, `title`, `content`) VALUES
(1, 1, 1, 1, '1', '1'),
(2, 2, 2, 2, '2', '2'),
(1, 1, 3, 3, '3', '3');

```

 **案例**

查询 category_id 为1 且 comments 大于 1 的情况下,views 最多的 article_id ？

（1）无索引

```sql
EXPLAIN SELECT id,author_id FROM article WHERE category_id = 1 AND comments > 1 ORDER BY views DESC LIMIT 1;
```

<img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151320403.png" alt="image-20210609224006323" />

结论：很显然，type 是 ALL，即最坏的情况。Extra 里还出现了 Using filesort，也是最坏的情况。优化是必须的。



（2）开始优化：

- 新建索引+删除索引

  ```sql
  -- 建立索引方式一
  ALTER TABLE `article` ADD INDEX idx_article_ccv ( `category_id` , `comments`, `views` ); 
  -- 建立索引方式二
  create index idx_article_ccv on article(category_id,comments,views); 
  
  ```

- 第2次EXPLAIN

  ```sql
  EXPLAIN SELECT id,author_id FROM `article` WHERE category_id = 1 AND comments >1 ORDER BY views DESC LIMIT 1;
  ```

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151320404.png" alt="image-20210609224155818" />

  结论：

  1. type 变成了 range,这是可以忍受的。但是 extra 里使用 Using filesort 仍是无法接受的。

  2. 但是我们已经建立了索引,为啥没用呢?

     这是因为按照 BTree 索引的工作原理，先排序 category_id，如果遇到相同的 category_id 则再排序 comments，如果遇到相同的 comments 则再排序 views。当 comments 字段在联合索引里处于中间位置时，因comments > 1 条件是一个范围值(所谓 range)，MySQL 无法利用索引再对后面的 views 部分进行检索，即 range 类型查询字段后面的索引无效。

     

  （3）删除第一次建立的索引

  ```sql
  DROP INDEX idx_article_ccv ON article;
  ```

  - 第2次新建索引

    ```sql
    -- 两种方式
    ALTER TABLE `article` ADD INDEX idx_article_cv ( `category_id` , `views` ) ;
    create index idx_article_cv on article(category_id,views);
    ```

  - 第3次EXPLAIN

    ```
    EXPLAIN SELECT id,author_id FROM article WHERE category_id = 1 AND comments > 1 ORDER BY views DESC LIMIT 1;
    ```

    <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151320405.png" alt="image-20210609224616405" />

    

    结论：可以看到，type 变为了 ref，Extra 中的 Using filesort 也消失了，结果非常理想。



## 7.2 两表、三表优化案例

**建表**

```sql
CREATE TABLE IF NOT EXISTS `class` (
`id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
`card` INT(10) UNSIGNED NOT NULL,
PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `book` (
`bookid` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
`card` INT(10) UNSIGNED NOT NULL,
PRIMARY KEY (`bookid`)
);

CREATE TABLE IF NOT EXISTS `phone` (
     `phoneid` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
     `card` INT(10) UNSIGNED NOT NULL,
     PRIMARY KEY (`phoneid`)
    )ENGINE=INNODB;


INSERT INTO class(card) VALUES(FLOOR(1 + (RAND() * 20)));
INSERT INTO class(card) VALUES(FLOOR(1 + (RAND() * 20)));
INSERT INTO class(card) VALUES(FLOOR(1 + (RAND() * 20)));
INSERT INTO class(card) VALUES(FLOOR(1 + (RAND() * 20)));
INSERT INTO class(card) VALUES(FLOOR(1 + (RAND() * 20)));
INSERT INTO class(card) VALUES(FLOOR(1 + (RAND() * 20)));
INSERT INTO class(card) VALUES(FLOOR(1 + (RAND() * 20)));
INSERT INTO class(card) VALUES(FLOOR(1 + (RAND() * 20)));
INSERT INTO class(card) VALUES(FLOOR(1 + (RAND() * 20)));
INSERT INTO class(card) VALUES(FLOOR(1 + (RAND() * 20)));
INSERT INTO class(card) VALUES(FLOOR(1 + (RAND() * 20)));
INSERT INTO class(card) VALUES(FLOOR(1 + (RAND() * 20)));
INSERT INTO class(card) VALUES(FLOOR(1 + (RAND() * 20)));
INSERT INTO class(card) VALUES(FLOOR(1 + (RAND() * 20)));
INSERT INTO class(card) VALUES(FLOOR(1 + (RAND() * 20)));
INSERT INTO class(card) VALUES(FLOOR(1 + (RAND() * 20)));
INSERT INTO class(card) VALUES(FLOOR(1 + (RAND() * 20)));
INSERT INTO class(card) VALUES(FLOOR(1 + (RAND() * 20)));
INSERT INTO class(card) VALUES(FLOOR(1 + (RAND() * 20)));
INSERT INTO class(card) VALUES(FLOOR(1 + (RAND() * 20)));


INSERT INTO book(card) VALUES(FLOOR(1 + (RAND() * 20)));
INSERT INTO book(card) VALUES(FLOOR(1 + (RAND() * 20)));
INSERT INTO book(card) VALUES(FLOOR(1 + (RAND() * 20)));
INSERT INTO book(card) VALUES(FLOOR(1 + (RAND() * 20)));
INSERT INTO book(card) VALUES(FLOOR(1 + (RAND() * 20)));
INSERT INTO book(card) VALUES(FLOOR(1 + (RAND() * 20)));
INSERT INTO book(card) VALUES(FLOOR(1 + (RAND() * 20)));
INSERT INTO book(card) VALUES(FLOOR(1 + (RAND() * 20)));
INSERT INTO book(card) VALUES(FLOOR(1 + (RAND() * 20)));
INSERT INTO book(card) VALUES(FLOOR(1 + (RAND() * 20)));
INSERT INTO book(card) VALUES(FLOOR(1 + (RAND() * 20)));
INSERT INTO book(card) VALUES(FLOOR(1 + (RAND() * 20)));
INSERT INTO book(card) VALUES(FLOOR(1 + (RAND() * 20)));
INSERT INTO book(card) VALUES(FLOOR(1 + (RAND() * 20)));
INSERT INTO book(card) VALUES(FLOOR(1 + (RAND() * 20)));
INSERT INTO book(card) VALUES(FLOOR(1 + (RAND() * 20)));
INSERT INTO book(card) VALUES(FLOOR(1 + (RAND() * 20)));
INSERT INTO book(card) VALUES(FLOOR(1 + (RAND() * 20)));
INSERT INTO book(card) VALUES(FLOOR(1 + (RAND() * 20)));
INSERT INTO book(card) VALUES(FLOOR(1 + (RAND() * 20)));


INSERT INTO phone(card) VALUES(FLOOR(1 + (RAND() * 20)));
INSERT INTO phone(card) VALUES(FLOOR(1 + (RAND() * 20)));
INSERT INTO phone(card) VALUES(FLOOR(1 + (RAND() * 20)));
INSERT INTO phone(card) VALUES(FLOOR(1 + (RAND() * 20)));
INSERT INTO phone(card) VALUES(FLOOR(1 + (RAND() * 20)));
INSERT INTO phone(card) VALUES(FLOOR(1 + (RAND() * 20)));
INSERT INTO phone(card) VALUES(FLOOR(1 + (RAND() * 20)));
INSERT INTO phone(card) VALUES(FLOOR(1 + (RAND() * 20)));
INSERT INTO phone(card) VALUES(FLOOR(1 + (RAND() * 20)));
INSERT INTO phone(card) VALUES(FLOOR(1 + (RAND() * 20)));
INSERT INTO phone(card) VALUES(FLOOR(1 + (RAND() * 20)));
INSERT INTO phone(card) VALUES(FLOOR(1 + (RAND() * 20)));
INSERT INTO phone(card) VALUES(FLOOR(1 + (RAND() * 20)));
INSERT INTO phone(card) VALUES(FLOOR(1 + (RAND() * 20)));
INSERT INTO phone(card) VALUES(FLOOR(1 + (RAND() * 20)));
INSERT INTO phone(card) VALUES(FLOOR(1 + (RAND() * 20)));
INSERT INTO phone(card) VALUES(FLOOR(1 + (RAND() * 20)));
INSERT INTO phone(card) VALUES(FLOOR(1 + (RAND() * 20)));
INSERT INTO phone(card) VALUES(FLOOR(1 + (RAND() * 20)));
INSERT INTO phone(card) VALUES(FLOOR(1 + (RAND() * 20)));
```



**案例（俩表）**

- 下面开始explain分析。

  ```
  EXPLAIN SELECT * FROM class LEFT JOIN book ON class.card = book.card;
  ```

  结论：type 有All 。

  

- 添加索引优化

  ```sql
  ALTER TABLE `book` ADD INDEX Y ( `card`);
  ```

  第2次explain

  ```sql
  EXPLAIN SELECT * FROM class LEFT JOIN book ON class.card = book.card;
  ```

  ![image-20210609225117380](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151320406.png)

  

  1. 可以看到第二行的 type 变为了 ref,rows 也变成了优化比较明显。
  2. 这是由左连接特性决定的。LEFT JOIN 条件用于确定如何从右表搜索行,左边一定都有,
  3. 所以右边是我们的关键点,一定需要建立索引。

- 删除旧索引 + 新建 + 第3次explain

  ```sql
  DROP INDEX Y ON book;
  ALTER TABLE class ADD INDEX X (card);
  EXPLAIN SELECT * FROM class LEFT JOIN book ON class.card = book.card;
  ```

  <img src="https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151320407.png" alt="image-20210609225218980"  />

**建议**

1. 保证被驱动表的join字段已经被索引【被驱动表 join 后的表为被驱动表 (需要被查询)】

2. left join 时，选择小表作为驱动表，大表作为被驱动表。【但是 left join 时一定是左边是驱动表，右边是被驱动表】

3. inner join 时，mysql会自己帮你把小结果集的表选为驱动表。【mysql 自动选择。小表作为驱动表。因为驱动表无论如何都会被全表扫描。所以扫描次数越少越好】

4. 子查询尽量不要放在被驱动表，有可能使用不到索引。

```sql
select a.name ,bc.name from t_emp a left join
         (select b.id , c.name from t_dept b
         inner join t_emp c on b.ceo = c.id) bc 
         on bc.id = a.deptid ;
```

上段查询中用到了子查询，必然 bc 表没有索引，肯定会进行全表扫描。可以直接使用 两个 left join 优化。

```sql
select a.name , c.name from t_emp a
    left outer join t_dept b on a.deptid = b.id
    left outer join t_emp c on b.ceo=c.id ;
```

所有条件都可以使用到索引。若必须用到子查询，可将子查询设置为驱动表，因为驱动表的type 肯定是 all，而子查询返回的结果表没有索引，必定也是all。

**案例（三表）**

```sql
ALTER table `book` add INDEX Y (`card`);
ALTER table `phone` add INDEX Z (`card`);
EXPLAIN select * from class left join book on class.card=book.card left join phone on book.card=phone.card;
```

![image-20210609225725639](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151320408.png)

后两行的 **type** 都是 **ref且rows** 优化良好。因此索引最好设置在需要经常查询的字段中。

**结论**

join语句的优化：

1.  尽可能减少join语句中的NestedLoop的循环总次数； **永远小结果集驱动大的结果集**
2.  优化 NestedLoop 的内层循环。（鸡蛋壳原理）
3.  保证join语句中被驱动表上Join条件字段已经被索引
4.  当无法保证被驱动表的Join条件字段被索引且内存资源充足的前提下，不要太吝啬JoinBuffer的设置   



***

# 8、索引失效常见情景

## 8.1 建表

```sql
CREATE TABLE `staffs` (
  `id` int(10) NOT NULL,
  `name` varchar(20) NOT NULL,
  `age` int(2) NOT NULL,
  `pos` varchar(20) NOT NULL,
  `add_time` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
); CHARSET utf8;


INSERT INTO staffs(NAME,age,pos,add_time) VALUES('z3',22,'manager',NOW());
INSERT INTO staffs(NAME,age,pos,add_time) VALUES('July',23,'dev',NOW());
INSERT INTO staffs(NAME,age,pos,add_time) VALUES('2000',23,'dev',NOW());
INSERT INTO staffs(NAME,age,pos,add_time) VALUES(null,23,'dev',NOW());
```

**创建索引**

```sql
ALTER TABLE staffs ADD INDEX idx_staffs_nameAgePos(name, age, pos);
```



## 8.2 索引失效几种常见情景案例

若一个字段上有多种索引呢？某一索引失效，可以继续使用其他索引不影响。

> **全值匹配**

索引 `idx_staffs_nameAgePos` 建立索引时 以 name ， age ，pos 的顺序建立的。全值匹配表示按顺序匹配的。

```sql
EXPLAIN SELECT * FROM staffs WHERE NAME = 'July';
EXPLAIN SELECT * FROM staffs WHERE NAME = 'July' AND age = 25;
-- 按顺序匹配
EXPLAIN SELECT * FROM staffs WHERE NAME = 'July' AND age = 25 AND pos = 'dev';                   
```



> **最佳左前缀法则**

如果索引了多列，要遵守最左前缀法则。指的是查询从索引的最左前列开始并且不跳过索引中的列。

**特殊情况：**

当使用覆盖索引的方式时，(select name/age/id from staffs where age=10 (后面没有其他没有索引的字段条件))，即使不是以 name 开头，也会使用 idx_nameAge 索引。既 select后的字段有索引，where 后的字段也有索引，则无关执行顺序。

**示例：**

```sql
EXPLAIN SELECT * FROM staffs WHERE age = 25 AND pos = 'dev'; 
```

![image-20210610094144321](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151320409.png)

```sql
EXPLAIN SELECT * FROM staffs WHERE pos = 'dev';
```

![image-20210610094206905](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151320410.png)

```sql
EXPLAIN SELECT * FROM staffs WHERE name = 'July' AND  age = 23 AND pos = 'dev';                       
```

![image-20210610094238721](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151320411.png)



> **不在索引列上做任何操作（计算、函数、(自动or手动)类型转换），会导致索引失效而转向全表扫描**

```sql
EXPLAIN SELECT * FROM staffs WHERE left(NAME,4) = 'July' ;
```

![image-20210610094323531](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151320412.png)



> **存储引擎不能使用索引中范围条件右边的列**

```sql
EXPLAIN SELECT * FROM staffs WHERE name = 'July' AND  age = 23 
                                              AND pos = 'dev';
```

![image-20210610094421735](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151320413.png)

失效演示：

```sql
EXPLAIN SELECT * FROM staffs WHERE name = 'July' AND  age > 23 
                                              AND pos = 'dev';
```

![image-20210610094452320](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151320414.png)



> **尽量使用覆盖索引(只访问索引的查询(索引列和查询列一致))，减少select * **

测试SQL：

```sql
EXPLAIN SELECT name,age,pos FROM staffs WHERE name = 'July' AND  age = 23   AND pos = 'dev';

EXPLAIN SELECT *  FROM staffs WHERE name = 'July' AND  age = 23   AND pos = 'dev';

EXPLAIN SELECT name,age,pos FROM staffs WHERE name = 'July' AND  age > 23   AND pos = 'dev';
```



> **mysql 在使用不等于(!= 或者<>)的时候无法使用索引会导致全表扫描**

测试SQL：

```sql
explain select * from staffs where name = 'July';
explain select * from staffs where name != 'July';
```

![image-20210610094707847](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151320415.png)



> **is not null 也无法使用索引,但是is null是可以使用索引的**

```sql
explain select * from staffs where name is null;
explain select * from staffs where name is not null;
```

![image-20210610094737943](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151320416.png)



> **like以通配符开头('%abc...')mysql索引失效会变成全表扫描的操作**

`问题：解决like '%字符串%'时索引不被使用的方法？`

用staffs表做案例，索引：

![image-20210610094909663](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151320417.png)

执行以下操作：

- 查询全部

  ```sql
  explain select * from staffs where name like '%aa%';
  ```

  ![image-20210610095001639](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151320418.png)

- id 查询条件

  ```sql
  EXPLAIN SELECT id  FROM tbl_user WHERE NAME LIKE '%aa%';
  ```

  type：index

  ref：null

  Extra：Using where；Using index

- NAME查询条件

  ```sql
  EXPLAIN SELECT NAME  FROM staffs WHERE NAME LIKE '%aa%';
  ```

  ![image-20210610095531808](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151320419.png)

- id，name查询条件

  ```sql
  EXPLAIN SELECT id,NAME FROM staffs WHERE NAME LIKE '%aa%';
  ```

- name，age查询条件

  ```sql
  explain select name,age from staffs where name like '%aa%';
  ```

- id，NAME，age查询条件

  ```sql
  EXPLAIN SELECT id,NAME,age FROM staffs WHERE NAME LIKE '%aa%';
  ```

- id，NAME，age，add_time查询条件

  ```sql
  EXPLAIN SELECT id,NAME,age,add_time FROM staffs WHERE NAME LIKE '%aa%';
  ```

  ![image-20210610100143532](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151320420.png)



> **字符串不加单引号索引失效**

- 没有单引号情况，索引失效

  ```sql
  explain select * from staffs where name = 2000;
  ```

  ![image-20210610100224922](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151320421.png)

- 有单引号用到了索引

  ```sql
  explain select * from staffs where name='2000';
  ```

  ![image-20210610100442974](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151320422.png)



> **少用or,用它来连接时会索引失效**

```sql
explain select * from staffs where name='z3' or name='July';
```

![image-20210610100532733](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151320424.png)



## 8.3 总结

假设index(a,b,c)。序号7 左边定值，所以索引都能用到，序号8 左边值不确定。

| 序列号 | where语句                                       | 索引是否被引用                       |
| ------ | ----------------------------------------------- | ------------------------------------ |
| 1      | where a=3                                       | Y，使用到a                           |
| 2      | where a=3 and b=5                               | Y，使用到a，b                        |
| 3      | where a=3 and b=5 and c=4                       | Y，使用到a，b,，c                    |
| 4      | where b=3 或者 where b=4 and c=5 或者 where c=5 | N                                    |
| 5      | where a=3 and c=5                               | 使用到a，但是c不可以，b中间断了      |
| 6      | where a=3 and b>4 and c=5                       | 使用到a,b c不能作用在范围之后，b断了 |
| 7      | where a=3 and b like 'kk%' and c=5              | a能用，b能用，c能用                  |
| 8      | where a=3 and b like '%kk' and c=5              | Y，只用到a                           |
| 9      | where a=3 and b like '%kk%' and c=5             | Y，只用到a                           |
| 10     | where a=3 and b like 'k%kk%' and c=5            | Y，a,b,c                             |



**【优化口诀】**

- 全值匹配我最爱，最左前缀要遵守；
- 带头大哥不能死，中间兄弟不能断；
- 索引列上少计算，范围之后全失效；
- LIKE百分写最右，覆盖索引不写星；
- 不等空值还有or，索引失效要少用；



***

# 9、查看索引使用情况



```sql
show status like 'Handler_read%';

show global status like 'Handler_read%';
```

![image-20210610101119859](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151320425.png)

1. **Handler_read_first**：索引中第一条被读得次数。如果较高，表示服务器正执行大量全索引扫描（这个值越低越好）。
2. **Handler_read_key**：如果索引正在工作，这个值代表一个行被索引值读得次数，如果值越低，表示索引得到得性能改善不高，因为索引不经常使用（这个值越高越好）。
3. **Handler_read_next**：按照键顺序读下一行得请求数。如果你用范围约束或如果执行索引扫描来查询索引列，该值增加。
4. **Handler_read_prev**：按照键顺序读前一行得请求数。该方法主要用于优化ORDER BY ... DESC。
5. **Handler_read_rnd**：根据固定位置读一行得请求数。如果你正执行大量查询并需要对结果进行排序该值较高。你可能使用了大量需要MySQL扫描整个表得查询或你的连接没有正确使用键。这个值较高，意味着运行效率低，应该建立索引来补救。
6. **Handler_read_rnd_next**：在数据文件中读下一行得请求数。如果你正进行大量的表扫描，该值较高。通常说明你的表索引不正确或写入的查询没有利用索引。



***

# 10、SQL优化

## 10.1 环境准备

**建表**

```sql
CREATE TABLE `tb_user_2` (
	`id` int(11) NOT NULL AUTO_INCREMENT,
	`username` varchar(45) NOT NULL,
	`password` varchar(96) NOT NULL,
	`name` varchar(45) NOT NULL,
	`birthday` datetime DEFAULT NULL,
	`sex` char(1) DEFAULT NULL,
	`email` varchar(45) DEFAULT NULL,
	`phone` varchar(45) DEFAULT NULL,
	`qq` varchar(32) DEFAULT NULL,
	`status` varchar(32) NOT NULL COMMENT '用户状态',
	`create_time` datetime NOT NULL,
	`update_time` datetime DEFAULT NULL,
	PRIMARY KEY (`id`),
	UNIQUE KEY `unique_user_username` (`username`)
) ENGINE = InnoDB DEFAULT CHARSET=utf8 ;

```

当使用load 命令导入数据的时候，适当的设置可以提高导入的效率。

对于 InnoDB 类型的表，有以下几种方式可以提高导入的效率：

- 主键顺序插入

  因为InnoDB类型的表是按照主键的顺序保存的，所以将导入的数据按照主键的顺序排列，可以有效的提高导入数

  据的效率。如果InnoDB表没有主键，那么系统会自动默认创建一个内部列作为主键，所以如果可以给表创建一个

  主键，将可以利用这点，来提高导入数据的效率。

  - 脚本文件介绍 :
    sql1.log ----> 主键有序
    sql2.log ----> 主键无序

  - 插入ID顺序排列数据：

    ![image-20210610102205335](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151320426.png)

  - 插入ID无序排列数据：

    ![image-20210610102222818](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151320427.png)



-  关闭唯一性校验

  在导入数据前执行 `SET UNIQUE_CHECKS=0`，关闭唯一性校验，在导入结束后执行`SET UNIQUE_CHECKS=1`，恢

  复唯一性校验，可以提高导入的效率。

  ![image-20210610102311277](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151320428.png)



- 手动提交事务

  如果应用使用自动提交的方式，建议在导入前执行 `SET AUTOCOMMIT=0`，关闭自动提交，导入结束后再执行 

  `SET AUTOCOMMIT = 1` ，打开自动提交，也可以提高导入的效率。

  ![image-20210610102359930](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151320429.png)



## 10.2 优化语句

### 10.2.1 优化insert语句

当进行数据的insert操作的时候，可以考虑采用以下几种优化方案：

- 如果需要同时对一张表插入很多行数据时，应该尽量使用多个值表的insert语句，这种方式将大大的缩减客户端与数据库之间的连接、关闭等消耗。使得效率比分开执行的单个insert语句快。

  -    示例， 原始方式为：

    ```sql
    insert into tb_test values(1,'Tom');
    insert into tb_test values(2,'Cat');
    insert into tb_test values(3,'Jerry');
    ```

  - 优化后得方案为（感觉实践困难）：

    ```sql
    insert into tb_test values(1,'Tom'),(2,'Cat')，(3,'Jerry');
    ```

- 在事务中进行数据插入

  ```sql
  start transaction;
  insert into tb_test values(1,'Tom');
  insert into tb_test values(2,'Cat');
  insert into tb_test values(3,'Jerry');
  commit;
  ```

- 数据有序插入

  ```sql
  insert into tb_test values(4,'Tim');
  insert into tb_test values(1,'Tom');
  insert into tb_test values(3,'Jerry');
  insert into tb_test values(5,'Rose');
  insert into tb_test values(2,'Cat');
  ```

  - 优化后：

    ```sql
    insert into tb_test values(1,'Tom');
    insert into tb_test values(2,'Cat');
    insert into tb_test values(3,'Jerry');
    insert into tb_test values(4,'Tim');
    insert into tb_test values(5,'Rose');
    ```



### 10.2.2 用in 还是 exists

优化原则：小表驱动大表，即小的数据集驱动大的数据集。

- 当B的数据集必须小于A表的数据集时，用in优于exists。

  ```sql
  select * from A where id in(select id from B);
  -- 等价于：
  for select id from B
  for select * from A where A.id=B.id
  ```

-  当A表的结果集小于B表的数据结果集时，用exists优于in。

  ```sql
  select * from A where exists(select X from B where B.id=A.id)
  -- 等价于：
  for select * from A
  for select * from B where B.id=A.id
  ```

  **注意：A表与B表的ID字段应建立索引**

- **EXISTS**

  ```sql
  SELECT ... From table Where EXISTS(subquery)
  ```

  该语句可以理解为：将主查询的结果放到子查询作为条件验证，根据验证结果TRUE或FALSE来决定结果是否保留。

- **提示**
  1. Exists（subquery）只返回 true或false，因此子查询中的 select * 也可以是select 1 或者select X ，官方的说法实际执行时会忽略SELECT清单，因此没有区别。
  2.  Exists子查询过程可能进行了优化，而不是我们理解的逐条对比，如果担心效率问题，可进行实际校验以确定是否有效率问题。
  3.  Exists子查询往往也可以使用条件表达式，其他子查询或者join来替代，何种最右需具体问题具体分析。



### 10.2.3 优化order by语句

**环境准备**

```sql
CREATE TABLE `emp` (
`id` int(11) NOT NULL AUTO_INCREMENT,
`name` varchar(100) NOT NULL,
`age` int(3) NOT NULL,
`salary` int(11) DEFAULT NULL,
PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

insert into `emp` (`id`, `name`, `age`, `salary`) values('1','Tom','25','2300');
insert into `emp` (`id`, `name`, `age`, `salary`) values('2','Jerry','30','3500');
insert into `emp` (`id`, `name`, `age`, `salary`) values('3','Luci','25','2800');
insert into `emp` (`id`, `name`, `age`, `salary`) values('4','Jay','36','3500');
insert into `emp` (`id`, `name`, `age`, `salary`) values('5','Tom2','21','2200');
insert into `emp` (`id`, `name`, `age`, `salary`) values('6','Jerry2','31','3300');
insert into `emp` (`id`, `name`, `age`, `salary`) values('7','Luci2','26','2700');
insert into `emp` (`id`, `name`, `age`, `salary`) values('8','Jay2','33','3500');
insert into `emp` (`id`, `name`, `age`, `salary`) values('9','Tom3','23','2400');
insert into `emp` (`id`, `name`, `age`, `salary`) values('10','Jerry3','32','3100');
insert into `emp` (`id`, `name`, `age`, `salary`) values('11','Luci3','26','2900');
insert into `emp` (`id`, `name`, `age`, `salary`) values('12','Jay3','37','4500');

-- 建立索引
create index idx_emp_age_salary on emp(age,salary)
```

**两种排序方式**

1. 第一种是通过对返回数据进行排序，也就是通常说的 filesort 排序，所有不是通过索引直接返回排序结果的排序都叫 FileSort 排序。

   ![image-20210610103545713](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151320430.png)

2. 第二种通过有序索引顺序扫描直接返回有序数据，这种情况即为 using index，不需要额外排序，操作效率高。

   ![image-20210610103613671](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151320431.png)

3. **多字段排序**

   ![image-20210610103706228](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151320432.png)

   尽量减少额外的排序，通过索引直接返回有序数据。where 条件和Order by 使用相同的索引，并且**Order By 的顺序和索引顺序相同， 并且Order by 的字段都是升序，或者都是降序**。否则肯定需要额外的操作，这样就会出现FileSort。

- Filesort得优化

  （1）通过创建合适的索引，能够减少 Filesort 的出现，但是在某些情况下，条件限制不能让filesort消失，那就需要加

  快 filesort的排序操作。对于filesort ， MySQL 有两种排序算法：

  - 两次扫描算法 ：

    MySQL4.1 之前，使用该方式排序。首先根据条件取出排序字段和行指针信息，然后在排序区 sort buffer 中排序，如果sort buffer不够，则在临时表 temporary table 中存储排序结果。完成排序之后，再根据行指针回表读取记录，该操作可能会导致大量随机I/O操作。

  - 一次扫描算法：

    一次性取出满足条件的所有字段，然后在排序区 sort buffer 中排序后直接输出结果集。排序时内存开销较大，但是排序效率比两次扫描算法要高。MySQL 通过比较系统变量 `max_length_for_sort_data`的大小和Query语句取出的字段总大小来判定是否那种排序算法，如果`max_length_for_sort_data` 更大，那么使用第二种优化之后的算法；否则使用第一种。

  （2）可以适当提高 sort_buffer_size 和 max_length_for_sort_data 系统变量，来增大排序区的大小，提高排序的效率。

  ![image-20210610104203658](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151320433.png)



### 10.2.4 优化 group by 语句

由于GROUP BY 实际上也同样会进行排序操作，而且与ORDER BY 相比，GROUP BY 主要只是多了排序之后的分组操作。当然，如果在分组的时候还使用了其他的一些聚合函数，那么还需要一些聚合函数的计算。所以，在GROUP BY 的实现过程中，与 ORDER BY 一样也可以利用到索引。

如果查询包含 group by 但是用户想要避免排序结果的消耗， 则可以执行order by null 禁止排序。如下 ：

```sql
drop index idx_emp_age_salary on emp;
explain select age,count(*) from emp group by age;
```

**优化后：**

```sql
explain select age,count(*) from emp group by age order by null;
```

![image-20210610104612113](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151320434.png)

从上面的例子可以看出，第一个SQL语句需要进行" filesort "，而第二个SQL由于order by null 不需要进行" filesort "， 而上文提过Filesort往往非常耗费时间。

**创建索引继续测试：**

```sql
create index idx_emp_age_salary on emp(age,salary)；
```

![image-20210610104751826](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151320435.png)



### 10.2.5 优化嵌套查询

- Mysql4.1版本之后，开始支持SQL的子查询。这个技术可以使用SELECT语句来创建一个单列的查询结果，然后把这个结果作为过滤条件用在另一个查询中。使用子查询可以一次性的完成很多逻辑上需要多个步骤才能完成的SQL操作，同时也可以避免事务或者表锁死，并且写起来也很容易。但是，有些情况下，子查询是可以被更高效的连接（JOIN）替代。

- 连接(Join)查询之所以更有效率一些 ，是因为MySQL不需要在内存中创建临时表来完成这个逻辑上需要两个步骤的查询工作。



### 10.2.6 优化OR条件

对于包含OR的查询子句，如果要利用索引，则OR之间的每个条件列都必须用到索引 ， 而且不能使用到复合索引； 如果没有索引，则应该考虑增加索引。 

**获取 emp 表中的所有的索引 ：**

![image-20210610111450529](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151320436.png)

**示例 ：**

```sql
explain select * from emp where id = 1 or age = 30 ;
```

![image-20210610111528258](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151320437.png)

![image-20210610111544446](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151320438.png)

**建议使用 union 替换 or ：** 

![image-20210610111725458](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151320439.png)

我们来比较下重要指标，发现主要差别是 type 和 ref 这两项:

1. UNION 语句的 type 值为 ref，OR 语句的 type 值为 range，可以看到这是一个很明显的差距。
2. UNION 语句的 ref 值为 const，OR 语句的 type 值为 null，const 表示是常量值引用，非常快。

   **这两项的差距就说明了 UNION 要优于 OR**



### 10.2.7 分页查询

一般分页查询时，通过创建覆盖索引能够比较好地提高性能。

一个常见又非常头疼的问题就是 `limit 2000000,10 `，此时需要MySQL排序前2000010 记录，仅仅返回2000000 - 2000010 的记录，其他记录丢弃，查询排序的代价非常大 。

![image-20210610111952820](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151320440.png)

- 优化思路一

  在索引上完成排序分页操作，最后根据主键关联回原表查询所需要的的其他列内容。

  ```sql
  explain select * from tb_item  t, (select id from tb_item order by id limit 2000000,10) a 
  																where t.id = a.id;
  ```

- 优化思路二

  该方案适用于主键自增的表，可以把Limit 查询转换成某个位置的查询 。

  ```sql
  explain select * from tb_item where id>1000000 limit 10;
  ```

  ![image-20210610112104741](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151320441.png)



### 10.2.8 使用SQL提示 

SQL提示，是优化数据库的一个重要手段，简单来说，就是**在SQL语句中加入一些人为的提示来达到优化操作的目的**。

- USE INDEX 

  在查询语句中表名的后面，添加 use index 来提供希望MySQL去参考的索引列表，就可以让MySQL不再考虑其他可用的索引。

  ```sql
  create index idx_seller_name on tb_seller(name);
  ```

  ![image-20210610112242509](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151320442.png)

- IGNORE INDEX 

  如果用户只是单纯的想让MySQL忽略一个或者多个索引，则可以使用 ignore index 作为 hint 。

  ```sql
  explain select * from tb_seller ignore index(idx_seller_name) where name = '小米科技';
  ```

  ![image-20210610112321231](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151320443.png)

- FORCE INDEX 

  为强制MySQL使用一个特定的索引，可在查询中使用 force index 作为hint 。

  ```sql
  create index idx_seller_address on tb_seller(address);
  ```

  ![image-20210610112443357](https://studyimages.oss-cn-beijing.aliyuncs.com/img/mysql/other/202207151320444.png)
