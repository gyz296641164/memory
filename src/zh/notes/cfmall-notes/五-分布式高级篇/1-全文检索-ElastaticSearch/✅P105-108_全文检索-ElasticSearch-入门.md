---
title: ✅P105-108_全文检索-ElasticSearch-入门
category:
  - 谷粒商城
date: 2024-02-13
---

<!-- more -->

## 1、_cat

### GET /_cat/nodes

`GET /_cat/nodes`： 查看所有节点

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311271344831.png#id=J4Ghq&originHeight=319&originWidth=505&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

### GET /_cat/health

`GET /_cat/health`： 查看 es 健康状况

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311271345679.png#id=i6kaC&originHeight=333&originWidth=620&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

### GET /_cat/master

`GET /_cat/master`： 查看主节点

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311271349211.png#id=EIxFk&originHeight=342&originWidth=618&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

### GET /_cat/indices

`GET /_cat/indices`： 查看所有索引，类似MySQL的`show databases`

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311271352215.png#id=MJjTJ&originHeight=344&originWidth=659&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

---

## 2、索引一个文档（保存）

### PUT&POST

接口地址：[http://192.168.56.10:9200/customer/external/1](http://192.168.56.10:9200/customer/external/1)

保存一个数据， 保存在哪个索引的哪个类型下， 指定用哪个唯一标识

`PUT customer/external/1`； 在 customer 索引下的 `external`类型下保存 1 号数据为

```shell
PUT http://192.168.17.130:9200/customer/external/2

{
    "name": "Jack"
}
```

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311271436837.png#id=AuCvs&originHeight=574&originWidth=617&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

PUT 和 POST方式请求都可以

POST 新增，如果不指定 id， 会自动生成 id。 指定 id 就会修改这个数据， 并新增版本号

```shell
POST：http://192.168.56.10:9200/customer/external/
```

执行过程发生如下错误：

```shell
index [xxx] blocked by: [FORBIDDEN/12/index read-only / allow delete (api)];
```

原因：当es检测到磁盘使用超过95%的时候，es索引保持只读状态

解决：

- 扩容磁盘，或删除掉多余文件即可。让es检测到磁盘占用到95%以下即可。
- [https://blog.csdn.net/fxtxz2/article/details/104774473/](https://blog.csdn.net/fxtxz2/article/details/104774473/)

**PUT 可以新增可以修改。 PUT 必须指定 id； 由于 PUT 需要指定 id， 我们一般都用来做修改操作， 不指定 id 会报错。**

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311271438157.png#id=OPaWD&originHeight=415&originWidth=775&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

---

## 3、查询文档

URL

```shell
GET http://192.168.56.10:9200/customer/external/1
```

结果：

```json
{
  "_index": "customer", //在哪个索引
  "_type": "external", //在哪个类型
  "_id": "1", //记录 id
  "_version": 2, //版本号
  "_seq_no": 1, //并发控制字段， 每次更新就会+1， 用来做乐观锁
  "_primary_term": 1, //同上， 主分片重新分配， 如重启， 就会变化
  "found": true,
  "_source": { //真正的内容
    "name": "John Doe"
  }
}
```

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311271441793.png#id=S8hsL&originHeight=466&originWidth=524&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

### 模拟并发操作

一条请求想将name修改为XXX，一条请求想将name修改为RRR，判断依据就是：`?if_seq_no=0&if_primary_term=1`

不知道`?if_seq_no=0&if_primary_term=1`可以先查询一下索引，

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311271457473.png#id=eiKSR&originHeight=225&originWidth=736&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311271457937.png#id=aRMoG&originHeight=211&originWidth=695&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

假设第一条请求先到达ES，

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311271457487.png#id=hqYUr&originHeight=595&originWidth=638&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

第二条请求达到ES，更新失败

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311271458689.png#id=r2MCE&originHeight=642&originWidth=1087&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

而修改**_seq_no**成功，

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311271500668.png#id=UxRLs&originHeight=563&originWidth=640&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

---

## 4、更新文档

```shell
POST customer/external/1/_update

{
	"doc": {
		"name": "John Doew"
	}
}
```

或者

```shell
POST customer/external/1
{
	"name": "John Doe2"
}
```

或者

```shell
PUT customer/external/1
{
	"name": "John Doe"
}
```

**不同之处：**

- POST 操作会对比源文档数据， 如果相同不会有什么操作， 文档 version 不增加；
- PUT 操作总会将数据重新保存并增加 version 版本；

带_update 对比元数据如果一样就不进行任何操作，看场景；

- 对于大并发更新， 不带 update；
- 对于大并发查询偶尔更新， 带 update； 对比更新， 重新计算分配规则。

更新同时增加属性

```shell
POST customer/external/1/_update
{
	"doc": { "name": "Jane Doe", "age": 20 }
}
```

PUT 和 POST 不带_update 也可以。

---

## 5、删除文档&索引

```json
DELETE customer/external/1
DELETE customer
```
