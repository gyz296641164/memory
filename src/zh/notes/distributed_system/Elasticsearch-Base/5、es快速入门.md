---
title: 5、es快速入门
category:
  - Elasticsearch
date: 2025-09-09
---

<!-- more -->

## 文档（document）的数据格式

（1）应用系统的数据结构都是面向对象的，具有复杂的数据结构

（2）对象存储到数据库，需要将关联的复杂对象属性插到另一张表，查询时再拼接起来。

（3）es面向文档，文档中存储的数据结构，与对象一致。所以一个对象可以直接存成一个文档。

（4）es的document用json数据格式来表达。

例如：班级和学生关系

```java
public class Student {
  private String id;
  private String name;
  
  private String classInfoId;  
}

private class ClassInfo {
  private String id;
  private String className;
  //....
}
```

数据库中要设计所谓的一对多，多对一的两张表，外键等。查询出来时，还要关联，mybatis写映射文件，很繁琐。

而在es中，一个学生存成文档如下：

```json
{
    "id":"1",
    "name": "张三",
    "last_name": "zhang",
    "classInfo": {
        "id": "1",
        "className": "三年二班",     
    }
}
```

---

## 图书网站商品管理案例：背景介绍

有一个售卖图书的网站，需要为其基于ES构建一个后台系统，提供以下功能：

（1）对商品信息进行CRUD（增删改查）操作

（2）执行简单的结构化查询

（3）可以执行简单的全文检索，以及复杂的phrase（短语）检索

（4）对于全文检索的结果，可以进行高亮显示

（5）对数据进行简单的聚合分析

---

## 简单的集群管理

### 快速检查集群的健康状况

es提供了一套api，叫做cat api，可以查看es中各种各样的数据

`GET /_cat/health?v`

```
epoch      timestamp cluster       status node.total node.data shards pri relo init unassign pending_tasks max_task_wait_time active_shards_percent
1688362307 05:31:47  elasticsearch yellow          1         1      3   3    0    0        1             0                  -                 75.0%
```

如何快速了解集群的健康状况？green、yellow、red？

- green：每个索引的primary shard和replica shard都是active状态的
- yellow：每个索引的primary shard都是active状态的，但是部分replica shard不是active状态，处于不可用的状态
- red：不是所有索引的primary shard都是active状态的，部分索引有数据丢失了

### 快速查看集群中有哪些索引

`GET /_cat/indices?v`

```
health status index                uuid                   pri rep docs.count docs.deleted store.size pri.store.size
green  open   .kibana_task_manager CTH8K6nvTneKFyuFrLFH-w   1   0          2            0     45.5kb         45.5kb
yellow open   book                 7H7YvjPrSYe15CHcf4Qs9w   1   1          2            0     41.8kb         41.8kb
green  open   .kibana_1            rMdc3HoSTbahY1XMAhEnmg   1   0          5            0     28.3kb         28.3kb
```

### 简单的索引操作

创建索引：`PUT /demo_index?pretty`

```json
{
  "acknowledged" : true,
  "shards_acknowledged" : true,
  "index" : "demo_index"
}
```

删除索引：

`DELETE /demo_index?pretty`

---

## 商品的CRUD操作（document CRUD操作）

### 新建图书索引

首先建立图书索引 book，语法：`put /index`

`PUT /book`

![image-20230703133749574](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Elasticsearch/202307031337675.png)

### 新增图书 :新增文档

语法：`PUT /index/type/id`

```json
PUT /book/_doc/1
{
"name": "Bootstrap开发",
"description": "Bootstrap是由Twitter推出的一个前台页面开发css框架，是一个非常流行的开发框架，此框架集成了多种页面效果。此开发框架包含了大量的CSS、JS程序代码，可以帮助开发者（尤其是不擅长css页面开发的程序人员）轻松的实现一个css，不受浏览器限制的精美界面css效果。",
"studymodel": "201002",
"price":38.6,
"timestamp":"2019-08-25 19:11:35",
"pic":"group1/M00/00/00/wKhlQFs6RCeAY0pHAAJx5ZjNDEM428.jpg",
"tags": [ "bootstrap", "dev"]
}
```

```java
PUT /book/_doc/2
{
"name": "java编程思想",
"description": "java语言是世界第一编程语言，在软件开发领域使用人数最多。",
"studymodel": "201001",
"price":68.6,
"timestamp":"2019-08-25 19:11:35",
"pic":"group1/M00/00/00/wKhlQFs6RCeAY0pHAAJx5ZjNDEM428.jpg",
"tags": [ "java", "dev"]
}
```

```json
PUT /book/_doc/3
{
"name": "spring开发基础",
"description": "spring 在java领域非常流行，java程序员都在用。",
"studymodel": "201001",
"price":88.6,
"timestamp":"2019-08-24 19:11:35",
"pic":"group1/M00/00/00/wKhlQFs6RCeAY0pHAAJx5ZjNDEM428.jpg",
"tags": [ "spring", "java"]
}
```

结果

```json
{
  "_index" : "book",
  "_type" : "_doc",
  "_id" : "1",
  "_version" : 1,
  "result" : "created",
  "_shards" : {
    "total" : 2,
    "successful" : 1,
    "failed" : 0
  },
  "_seq_no" : 0,
  "_primary_term" : 1
}
```

###  查询图书：检索文档

语法：`GET /index/type/id`

查看图书：`GET /book/_doc/2` 就可看到json形式的文档。方便程序解析。

```json
{
  "_index" : "book",
  "_type" : "_doc",
  "_id" : "2",
  "_version" : 1,
  "_seq_no" : 1,
  "_primary_term" : 1,
  "found" : true,
  "_source" : {
    "name" : "java编程思想",
    "description" : "java语言是世界第一编程语言，在软件开发领域使用人数最多。",
    "studymodel" : "201001",
    "price" : 68.6,
    "timestamp" : "2019-08-25 19:11:35",
    "pic" : "group1/M00/00/00/wKhlQFs6RCeAY0pHAAJx5ZjNDEM428.jpg",
    "tags" : [
      "java",
      "dev"
    ]
  }
}
```

为方便查看索引中的数据，kibana可以如下操作：

`Kibana`->`discover`->`Create index pattern`-> `Index pattern`填`book`

![image-20230703140103911](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Elasticsearch/202307031401967.png)

![image-20230703140146098](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Elasticsearch/202307031401153.png)

下一步，再点击discover就可看到数据。

![image-20230703140304253](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Elasticsearch/202307031403322.png)

点击json还可以看到原始数据

![image-20230703140334302](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Elasticsearch/202307031403375.png)

### 修改图书：替换操作

```json
PUT /book/_doc/1
{
    "name": "Bootstrap开发教程1",
    "description": "Bootstrap是由Twitter推出的一个前台页面开发css框架，是一个非常流行的开发框架，此框架集成了多种页面效果。此开发框架包含了大量的CSS、JS程序代码，可以帮助开发者（尤其是不擅长css页面开发的程序人员）轻松的实现一个css，不受浏览器限制的精美界面css效果。",
    "studymodel": "201002",
    "price":38.6,
    "timestamp":"2019-08-25 19:11:35",
    "pic":"group1/M00/00/00/wKhlQFs6RCeAY0pHAAJx5ZjNDEM428.jpg",
    "tags": [ "bootstrap", "开发"]
}
```

### 修改图书：更新文档

语法：`POST /{index}/type/{id}/_update`

或者`POST /{index}/_update/{id}`

```json
POST /book/_update/1/ 
{
  "doc": {
   "name": " Bootstrap开发教程高级"
  }
}
```

返回：

```json
{
  "_index" : "book",
  "_type" : "_doc",
  "_id" : "1",
  "_version" : 10,
  "result" : "updated",
  "_shards" : {
    "total" : 2,
    "successful" : 1,
    "failed" : 0
  },
  "_seq_no" : 11,
  "_primary_term" : 1
}
```

### 删除图书：删除文档

语法：`DELETE /book/_doc/1`

返回：

```json
{
  "_index" : "book",
  "_type" : "_doc",
  "_id" : "1",
  "_version" : 11,
  "result" : "deleted",
  "_shards" : {
    "total" : 2,
    "successful" : 1,
    "failed" : 0
  },
  "_seq_no" : 12,
  "_primary_term" : 1
}
```

