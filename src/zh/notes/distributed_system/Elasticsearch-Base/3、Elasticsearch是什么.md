---
title: 3、Elasticsearch是什么
category:
  - Elasticsearch
date: 2025-09-09
---

<!-- more -->

## 搜索是什么

概念：用户输入想要的关键词，返回含有该关键词的所有信息。

场景：

1. 互联网搜索：谷歌、百度、各种新闻首页
2. 站内搜索（垂直搜索）：企业OA查询订单、人员、部门，电商网站内部搜索商品（淘宝、京东）场景。

---

## 数据库做搜索弊端

### 站内搜索（垂直搜索）：数据量小，简单搜索，可以使用数据库。

问题出现：

- 存储问题。电商网站商品上亿条时，涉及到单表数据过大必须拆分表,数据库磁盘占用过大必须分库(mycat)。
- 性能问题:解决上面问题后，查询“笔记本电脑"等关键词时，上亿条数据的商品名字段逐行扫描，性能跟不上。
- 不能分词。如搜索"笔记本电脑”，只能搜索完全和关键词一样的数据，那么数据量小时,搜索"笔记电脑”，“电脑"数据要不要给用户。

### 互联网搜索，肯定不会使用数据库搜索。数据量太大。PB级。

---

## 全文检索、倒排索引和Lucene

### 全文检索

`倒排索引`。数据存储时，经行分词建立term索引库。见画图。

![image-20230630152816528](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Elasticsearch/202306301528573.png)

倒排索引源于实际应用中需要根据属性的值来查找记录。这种索引表中的每一项都包括一个属性值和具有该属性值的各记录的地址。由于不是由记录来确定属性值，而是由属性值来确定记录的位置，因而称为倒排索引(inverted index)。带有倒排索引的文件我们称为倒排[索引文件](https://baike.baidu.com/item/索引文件)，简称[倒排文件](https://baike.baidu.com/item/倒排文件/4137688)(inverted file)。

### Lucene

就是一个jar包,里面封装了全文检索的引擎、搜索的算法代码。开发时，引入lucen的jar包，通过api开发搜索相关业务。底层会在磁盘建立索引库。

---

## 什么是Elasticsearch

### 简介

ElasticSearch是一个基于Lucene的搜索服务器。它提供了一个分布式多用户能力的全文搜索引擎，基于RESTful web接口。Elasticsearch是用Java语言开发的，并作为Apache许可条款下的开放源码发布，是一种流行的企业级搜索引擎。ElasticSearch用于云计算中，能够达到实时搜索，稳定，可靠，快速，安装使用方便。官方客户端在Java、.NET(C#)、PHP、Python,Apache Groovy、Ruby和许多其他语言中都是可用的。根据DB-Engines的排名显示，Elasticsearch是最受欢迎的企业挑索引擎,其次是Apache Solr，也是基于Lucene。

官网：https://www.elastic.co/cn/products/elasticsearch

### Elasticsearch的功能

**分布式的搜索引擎和数据分析引擎**

- 搜索:互联网搜索、电商网站站内搜索、OA系统查询
- 数据分析:电商网站查询近一周哪些品类的图书销售前十;新闻网站，最近3天阅读量最高的十个关键词,舆情分析。

**全文检索，结构化检索，数据分析**

- 全文检索：搜索商品名称包含java的图书select * from books where book_name like "%java%".。结构化检索:搜索商品分类为spring的图书都有哪些,select * from books where category_id='spring'
- 数据分析：分析每一个分类下有多少种图书，select category_id,count(*) from books group bycategory_id

**对海量数据进行近实时的处理**

- 分布式:ES自动可以将海量数据分散到多台服务器上去存储和检索，经行并行查询，提高搜索效率。相对的，Lucene是单机应用。
- 近实时:数据库上亿条数据查询，搜索一次耗时几个小时，是批处理(batch-processing)。而es只需秒级即可查询海量数据,所以叫近实时。秒级。

### Elasticsearch的使用场景

国外：

- 维基百科，类似百度百科，“网络七层协议”的维基百科，全文检索，高亮，搜索推荐
- Stack Overflow（国外的程序讨论论坛），相当于程序员的贴吧。遇到it问题去上面发帖，热心网友下面回帖解答。
- GitHub（开源代码管理），搜索上千亿行代码。
- 电商网站，检索商品
- 日志数据分析，logstash采集日志，ES进行复杂的数据分析（ELK技术，elasticsearch+logstash+kibana）
- 商品价格监控网站，用户设定某商品的价格阈值，当低于该阈值的时候，发送通知消息给用户，比如说订阅《java编程思想》的监控，如果价格低于27块钱，就通知我，我就去买。
- BI系统，商业智能（Business Intelligence）。大型连锁超市，分析全国网点传回的数据，分析各个商品在什么季节的销售量最好、利润最高。成本管理，店面租金、员工工资、负债等信息进行分析。从而部署下一个阶段的战略目标。

国内：

- 百度搜索，第一次查询，使用es。
- OA、ERP系统站内搜索。

### Elasticsearch的特点

- 可拓展性：大型分布式集群（数百台服务器）技术，处理PB级数据，大公司可以使用。小公司数据量小，也可以部署在单机。大数据领域使用广泛。
- 技术整合：将全文检索、数据分析、分布式相关技术整合在一起：lucene（全文检索），商用的数据分析软件（BI软件），分布式数据库（mycat）
- 部署简单：开箱即用，很多默认配置不需关心，解压完成直接运行即可。拓展时，只需多部署几个实例即可，负载均衡、分片迁移集群内部自己实施。
- 接口简单：使用restful api经行交互，跨语言。
- 功能强大：Elasticsearch作为传统数据库的一个补充，提供了数据库所不不能提供的很多功能，如全文检索，同义词处理，相关度排名。

![image-20230630153633100](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Elasticsearch/202306301536129.png)

![image-20230630153741201](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Elasticsearch/202306301537226.png)

---

## elasticsearch核心概念

### lucene和elasticsearch的关系

Lucene：最先进、功能最强大的搜索库，直接基于lucene开发，非常复杂，api复杂

Elasticsearch：基于lucene，封装了许多lucene底层功能，提供简单易用的restful api接口和许多语言的客户端，如java的高级客户端（Java High Level REST Client）和底层客户端（Java Low Level REST Client）

Elasticsearch使用的是标准的REESTfuI风格的APT和JSON。此外，我们还构建和唯护了很多其他语言的高户端，例Java，Python，.NET，SQL和PHP。与此同时，我们的社区也贡献了很多客户端。这些客户端用起来简单自然，而目就像 Easticsearh一样，不会对您的使用方式进行限制。

起源：Shay Banon。2004年失业，陪老婆去伦敦学习厨师。失业在家帮老婆写一个菜谱搜索引擎。封装了lucene的开源项目，compass。找到工作后，做分布式高性能项目，再封装compass，写出了elasticsearch，使得lucene支持分布式。现在是Elasticsearch创始人兼Elastic首席执行官。

### elasticsearch的核心概念

#### NRT（Near Realtime）：近实时

两方面：

- 写入数据时，过1秒才会被搜索到，因为内部在分词、录入索引。
- es搜索时：搜索和分析数据需要秒级出结果。

#### Cluster：集群

包含一个或多个启动着es实例的机器群。通常一台机器起一个es实例。同一网络下，集名一样的多个es实例自动组成集群，自动均衡分片等行为。默认集群名为“elasticsearch”。

#### Node：节点

每个es实例称为一个节点。节点名自动分配，也可以手动配置。

#### Index：索引

包含一堆有相似结构的文档数据。

索引创建规则：

- 仅限小写字母
- 不能包含`\、/、 *、?、"、<、>、|、#`以及空格符等特殊符号
- 从7.0版本开始不再包含冒号
- 不能以`-`、`_`或`+`开头
- 不能超过255个字节（注意它是字节，因此多字节字符将计入255个限制）

#### Document：文档

es中的最小数据单元。一个document就像数据库中的一条记录。通常以json格式显示。多个document存储于一个索引（Index）中。

```json
book document

{
  "book_id": "1",
  "book_name": "java编程思想",
  "book_desc": "从Java的基础语法到最高级特性（深入的[面向对象](https://baike.baidu.com/item/面向对象)概念、多线程、自动项目构建、单元测试和调试等），本书都能逐步指导你轻松掌握。",
  "category_id": "2",
  "category_name": "java"
}
```

#### Field:字段

就像数据库中的列（Columns），定义每个document应该有的字段。

#### Type：类型

每个索引里都可以有一个或多个type，type是index中的一个逻辑数据分类，一个type下的document，都有相同的field。

**注意**：6.0之前的版本有type（类型）概念，type相当于关系数据库的表，ES官方将在ES9.0版本中彻底删除type。本教程typy都为_doc。

#### shard：分片

index数据过大时，将index里面的数据，分为多个shard，分布式的存储在各个服务器上面。可以支持海量数据和高并发，提升性能和吞吐量，充分利用多台机器的cpu。

#### replica：副本

在分布式环境下，任何一台机器都会随时宕机，如果宕机，index的一个分片没有，导致此index不能搜索。所以，为了保证数据的安全，我们会将每个index的分片经行备份，存储在另外的机器上。保证少数机器宕机es集群仍可以搜索。

能正常提供查询和插入的分片我们叫做主分片（primary shard），其余的我们就管他们叫做备份的分片（replica shard）。

es6默认新建索引时，5分片，2副本，也就是一主一备，共10个分片。所以，es集群最小规模为两台。

### elasticsearch核心概念 vs. 数据库核心概念

| **关系型数据库（比如Mysql）** | **非关系型数据库（Elasticsearch）** |
| ----------------------------- | ----------------------------------- |
| 数据库Database                | 索引Index                           |
| 表Table                       | 索引Index（原为Type）               |
| 数据行Row                     | 文档Document                        |
| 数据列Column                  | 字段Field                           |
| 约束 Schema                   | 映射Mapping                         |