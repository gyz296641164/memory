---
title: 8、图解es内部机制
category:
  - Elasticsearch
date: 2025-09-09
---

<!-- more -->

## 图解es分布式基础

### es对复杂分布式机制的透明隐藏特性

- 分布式机制：分布式数据存储及共享。
- 分片机制：数据存储到哪个分片，副本数据写入。
- 集群发现机制：cluster discovery。新启动es实例，自动加入集群。
- shard负载均衡：大量数据写入及查询，es会将数据平均分配。
- shard副本：新增副本数，分片重分配。

### Elasticsearch的垂直扩容与水平扩容

水平扩容：随着越来越多的节点被添加到同集群 中，现有的分片将在所有的节点中进行负载均衡，因此，在那些分片上的索引和搜索请求都可以从额外增加的节点中获益，以这种方式进行扩展（在节点中 入更多节点）被称为水平扩展。此方式增加更多节点，然后请求被分发到这些节点上，作负载就被分摊了。

垂直扩容：水平扩展的另一个替代方案是垂直扩展，这种方式为 Elasticsearch 的节点增加更多硬件资源，可能是为虚拟机分配更多处理器，或是为物理机增加更多的内存，尽管垂直扩展几乎每次都能提升性能，它并非总是可行的或经济的，使用分片使得你可以进行水平的扩展。

### 增减或减少节点时的数据rebalance

新增或减少es实例时，es集群会将数据重新分配。

### master节点

功能：

- 创建删除节点
- 创建删除索引

### 节点对等的分布式架构

- 节点对等，每个节点都能接收所有的请求
- 自动请求路由
- 响应收集

---

## 图解分片shard、副本replica机制

### shard&replica机制

（1）每个index包含一个或多个shard

（2）每个shard都是一个最小工作单元，承载部分数据，lucene实例，完整的建立索引和处理请求的能力

（3）增减节点时，shard会自动在nodes中负载均衡

（4）primary shard和replica shard，每个document肯定只存在于某一个primary shard以及其对应的replica shard中，不可能存在于多个primary shard

（5）replica shard是primary shard的副本，负责容错，以及承担读请求负载

（6）primary shard的数量在创建索引的时候就固定了，replica shard的数量可以随时修改

（7）默认情况下，每个索引由 5个主要分片（primary shard）组成，而每份主要分片又有一个副本，一共10份分片。如图 2-3 所示。

（8）primary shard不能和自己的replica shard放在同一个节点上（否则节点宕机，primary shard和副本都丢失，起不到容错的作用），但是可以和其他primary shard的replica shard放在同一个节点上。

![image-20230705175555347](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Elasticsearch/202307051755394.png)

---

## 图解单node环境下创建index是什么样子的

（1）单node环境下，创建一个index，有3个primary shard，3个replica shard
（2）集群status是yellow
（3）这个时候，只会将3个primary shard分配到仅有的一个node上去，另外3个replica shard是无法分配的
（4）集群可以正常工作，但是一旦出现节点宕机，数据全部丢失，而且集群不可用，无法承接任何请求

```
PUT /test_index1
{
   "settings" : {
      "number_of_shards" : 3,
      "number_of_replicas" : 1
   }
}
```

---

## 图解2个node环境下replica shard是如何分配的

（1）replica shard分配：3个primary shard，3个replica shard，1 node

将3个primary shard分配到1个node上去，另外3个replica shard分配到另一个node上去

（2）primary —> replica同步

（3）读请求：primary/replica

![image-20230705180936195](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Elasticsearch/202307051809229.png)

---

## 图解横向扩容

https://www.iqiyi.com/v_19ry6yozsk.html

分片自动负载均衡，分片向空闲机器转移。

每个节点存储更少分片，系统资源给与每个分片的资源更多，整体集群性能提高。

扩容极限：节点数大于整体分片数，则必有空闲机器。

超出扩容极限时，可以增加副本数，如设置副本数为2，总共3*3=9个分片。9台机器同时运行，存储和搜索性能更强。容错性更好。

容错性：只要一个索引的所有主分片在，集群就就可以运行。

---

## 图解es容错机制 master选举，replica容错，数据恢复

以3分片，2副本数，3节点为例介绍。

- master node宕机，自动master选举，集群为red
- replica容错：新master将replica提升为primary shard，yellow
- 重启宕机node，master copy replica到该node，使用原有的shard并同步宕机后的修改，green