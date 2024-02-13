---
title: ✅P102_全文检索-ElasticSearch简介
category:
  - 谷粒商城
date: 2024-02-13
---

<!-- more -->

## 简介

> [官网地址](https://www.elastic.co/cn/what-is/elasticsearch)


全文搜索属于最常见的需求， 开源的 Elasticsearch 是目前全文搜索引擎的首选。
它可以快速地储存、 搜索和分析海量数据。 维基百科、 Stack Overflow、 Github 都采用它。
![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311241722964.png#id=czLKG&originHeight=311&originWidth=894&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

Elastic 的底层是开源库 Lucene。 但是， 你没法直接用 Lucene， 必须自己写代码去调用它的
接口。 Elastic 是 Lucene 的封装， 提供了 REST API 的操作接口， 开箱即用。

REST API： 天然的跨平台。

- 官方文档：[https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)
- 官方中文：[https://www.elastic.co/guide/cn/elasticsearch/guide/current/foreword_id.html](https://www.elastic.co/guide/cn/elasticsearch/guide/current/foreword_id.html)
- 社区中文： 
   - [https://es.xiaoleilu.com/index.html](https://es.xiaoleilu.com/index.html)
   - [http://doc.codingdict.com/elasticsearch/0/](http://doc.codingdict.com/elasticsearch/0/)

---

## 基本概念

### 1、Index（索引）

动词， 相当于 MySQL 中的 insert；
名词， 相当于 MySQL 中的 Database

### 2、Type（类型）

在 Index（索引） 中， 可以定义一个或多个类型。
类似于 MySQL 中的 Table； 每一种类型的数据放在一起；

### 3、Document（文档）

保存在某个索引（Index） 下， 某种类型（Type） 的一个数据（Document） ， 文档是 JSON 格式的， Document 就像是 MySQL 中的某个 Table 里面的内容；

### 4、倒排索引机制

参考官方文档：[https://www.elastic.co/guide/cn/elasticsearch/guide/current/inverted-index.html](https://www.elastic.co/guide/cn/elasticsearch/guide/current/inverted-index.html)

Elasticsearch 使用一种称为 `倒排索引` 的结构，它适用于快速的全文搜索。一个倒排索引由文档中所有`不重复词`的列表构成，对于其中每个词，有一个包含它的文档列表。

例如，假设我们有两个文档，每个文档的 content 域包含如下内容：

1. The quick brown fox jumped over the lazy dog
2. Quick brown foxes leap over lazy dogs in summer

为了创建倒排索引，我们首先将每个文档的 content 域拆分成单独的 词（我们称它为 `词条` 或 `tokens` ），创建一个包含所有不重复词条的排序列表，然后列出每个词条出现在哪个文档。结果如下所示：

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311241722040.png#id=mun8L&originHeight=553&originWidth=316&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

现在，如果我们想搜索 quick brown ，我们只需要查找包含每个词条的文档：

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311241723528.png#id=WEMqJ&originHeight=205&originWidth=299&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311241723461.png#id=JNqSW&originHeight=570&originWidth=985&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

---

## ElasticSearch7-去掉type概念

关系型数据库中两个数据表示是独立的，即使他们里面有相同名称的列也不影响使用，但ES 中不是这样的。elasticsearch是基于Lucene开发的搜索引擎，而ES中不同type下名称相同 的filed最终在Lucene中的处理方式是一样的。

- 两个不同type下的两个user_name，在ES同一个索引下其实被认为是同一个filed，你必 须在两个不同的type中定义相同的filed映射。否则，不同type中的相同字段名称就会在 处理中出现冲突的情况，导致Lucene处理效率下降。
- 去掉type就是为了提高ES处理数据的效率。

Elasticsearch 7.x

- URL中的type参数为可选。比如，索引一个文档不再要求提供文档类型。

Elasticsearch 8.x

- 不再支持URL中的type参数。

解决：将索引从多类型迁移到单类型，每种类型文档一个独立索引

---

## Es-数组的扁平化处理

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311241723157.png#id=eNMvu&originHeight=457&originWidth=1148&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

---

## 云服务环境es架构

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311241723766.png#id=hE5ML&originHeight=412&originWidth=1056&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)
