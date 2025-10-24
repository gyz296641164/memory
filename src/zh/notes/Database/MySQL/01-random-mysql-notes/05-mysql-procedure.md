---
title: 05-存储过程
category:
  - MySQL
date: 2023-02-27
---

<!-- more -->

## 1. 存储过程和函数概述

- 存储过程和函数是事先经过编译并存储在数据库中的一段 SQL 语句的集合，调用存储过程和函数可以简化应用开发人员的很多工作，减少数据在数据库和应用服务器之间的传输，对于提高数据处理的效率是有好处的。
- **存储过程和函数的区别在于函数必须有返回值，而存储过程没有**。

***

## 2. 创建存储过程

**语法：**

```sql
CREATE PROCEDURE procedure_name ([proc_parameter[,...]])
begin
    -- SQL语句
end;
```

**示例 ：**

```sql
delimiter $
create procedure pro_test1()
begin
    select  'Hello World' ;
end$
delimiter;
```

`DELIMITER`：

- 该关键字用来声明SQL语句的分隔符 , 告诉 MySQL 解释器，该段命令是否已经结束了，mysql是否可以执行了。
- 默认情况下，delimiter是分号; 在命令行客户端中，如果有一行命令以分号结束，那么回车后，mysql将会执行该命令。

***

## 3. 调用存储过程

```
call procedure_name();
```

***

## 4. 查看存储过程

```sql
-- 查询db_name数据库中的所有的存储过程
select name from mysql.proc where db='db_name';

-- 查询存储过程的状态信息
show procedure status;

-- 查询某个存储过程的定义
show create procedure test.pro_test1 \G;
```

***

## 5. 删除存储过程

```
DROP PROCEDURE [IF_EXISTS] sp_name ;
```





