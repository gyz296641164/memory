---
title: ✅P338_Sleuth-链路追踪-Zipkin页面分析
category:
  - 谷粒商城
date: 2024-04-17
---

<!-- more -->

## Zipkin 数据持久化

Zipkin 默认是将监控数据存储在内存的，如果 Zipkin 挂掉或重启的话，那么监控数据就会丢失。所以如果想要搭建生产可用的 Zipkin，就需要实现监控数据的持久化。而想要实现数据持久化，自然就是得将数据存储至数据库。好在 Zipkin 支持将数据存储至：

- 内存（默认）
- MySQL
- Elasticsearch
- Cassandra

Zipkin 数据持久化相关的官方文档地址如下：https://github.com/openzipkin/zipkin#storage-component

Zipkin 支持的这几种存储方式中，内存显然是不适用于生产的，这一点开始也说了。而使用MySQL 的话，当数据量大时，查询较为缓慢，也不建议使用。Twitter 官方使用的是 Cassandra作为 Zipkin 的存储数据库，但国内大规模用 Cassandra 的公司较少，而且 Cassandra 相关文档也不多。

综上，故采用 Elasticsearch 是个比较好的选择，关于使用 Elasticsearch 作为 Zipkin 的存储数据库的官方文档如下：

- elasticsearch-storage：https://github.com/openzipkin/zipkin/tree/master/zipkin-server#elasticsearch-storage
- zipkin-storage/elasticsearch：https://github.com/openzipkin/zipkin/tree/master/zipkin-storage/elasticsearch

通过 docker 的方式：

```
docker run --env STORAGE_TYPE=elasticsearch --env ES_HOSTS=192.168.190.129:9200 openzipkin/zipkin-dependencies
```

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/NetWork/202403/66b5e2a6cbedcd55.png)

使用 es 时 Zipkin Dependencies 支持的环境变量

![](https://studyimages.oss-cn-beijing.aliyuncs.com/img/NetWork/202403/4d133f88286dec38.png)

---

## 页面分析

参考：https://blog.csdn.net/nandao158/article/details/108666460