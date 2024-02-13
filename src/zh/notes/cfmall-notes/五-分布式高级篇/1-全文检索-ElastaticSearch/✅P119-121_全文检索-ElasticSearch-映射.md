---
title: ✅P119-121_全文检索-ElasticSearch-映射
category:
  - 谷粒商城
date: 2024-02-13
---

<!-- more -->

## Mapping映射

Mapping（映射） 是用来定义一个文档（ document） ， 以及它所包含的属性（ field） 是如何存储和索引的。 比如， 使用 mapping 来定义：

- 哪些字符串属性应该被看做全文本属性（full text fields）
- 哪些属性包含数字， 日期或者地理位置
- 文档中的所有属性是否都能被索引（_all 配置）
- 日期的格式
- 自定义映射规则来执行动态添加属性
- 查看 mapping 信息：`GET bank/_mapping`
- 修改 mapping 信息

官方文档：[https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping.html](https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping.html)

自动猜测的映射类型

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311241743951.png#id=TbJOl&originHeight=338&originWidth=813&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

---

## 字段类型

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311241743462.png#id=m3UxQ&originHeight=825&originWidth=907&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

---

## 新版本改变

**Es7 及以上移除了 type 的概念**

关系型数据库中两个数据表示是独立的， 即使他们里面有相同名称的列也不影响使用，但 ES 中不是这样的。 elasticsearch 是基于 Lucene 开发的搜索引擎， 而 ES 中不同 type下名称相同的 filed 最终在 Lucene 中的处理方式是一样的。

- 两个不同 type 下的两个 user_name， 在 ES 同一个索引下其实被认为是同一个 filed，你必须在两个不同的 type 中定义相同的 filed 映射。 否则， 不同 type 中的相同字段名称就会在处理中出现冲突的情况， 导致 Lucene 处理效率下降。
- 去掉 type 就是为了提高 ES 处理数据的效率。

**Elasticsearch 7.x**

URL 中的 type 参数为可选。 比如， 索引一个文档不再要求提供文档类型。

**Elasticsearch 8.x**

不再支持 URL 中的 type 参数。

解决：

- 将索引从多类型迁移到单类型， 每种类型文档一个独立索引
- 将已存在的索引下的类型数据， 全部迁移到指定位置即可。 详见 [数据迁移]

---

## 创建映射

创建索引并指定映射

```json
PUT /my_index
{
  "mappings": {
    "properties": {
      "age": {
        "type": "integer"
      },
      "email": {
        "type": "keyword"
      },
      "name": {
        "type": "text"
      }
    }
  }
}
```

测试结果

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311241744157.png#id=Pdj7z&originHeight=903&originWidth=1920&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

### 添加新的字段映射

这里的`"index": false`，表明新增的字段不能被检索。默认是true

```json
PUT /my_index/_mapping
{
  "properties": {
    "employee-id": {
      "type": "keyword",
      "index": false
    }
  }
}
```

测试结果

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311241744939.png#id=UbIHZ&originHeight=903&originWidth=1920&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

### 查询添加字段映射后的信息

```json
GET /my_index/_mapping
```

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311241744635.png#id=oDeWu&originHeight=903&originWidth=1920&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

---

## 更新映射

对于已经存在的映射字段， 我们不能更新。 更新必须创建新的索引进行`数据迁移`。

---

## 数据迁移

### 无type数据迁移

POST _reindex【固定写法】

```json
POST _reindex
{
  "source": {
    "index": "twitter"
  },
  "dest": {
    "index": "new_twitter"
  }
}
```

### 有type数据迁移

```json
POST _reindex
{
  "source": {
    "index": "twitter",
    "type": "tweet"
  },
  "dest": {
    "index": "tweets"
  }
}
```

### 数据迁移案例

> **查看索引 bank 当前字段映射类型**


```json
GET bank/_mapping
```

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311241745556.png#id=zl4Yg&originHeight=903&originWidth=1920&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

> **创建新索引 newbank 并修改字段类型**


```json
PUT /newbank
{
  "mappings": {
    "properties": {
      "account_number": {
        "type": "long"
      },
      "address": {
        "type": "text"
      },
      "age": {
        "type": "integer"
      },
      "balance": {
        "type": "long"
      },
      "city": {
        "type": "keyword"
      },
      "email": {
        "type": "keyword"
      },
      "employer": {
        "type": "keyword"
      },
      "firstname": {
        "type": "text"
      },
      "gender": {
        "type": "keyword"
      },
      "lastname": {
        "type": "text",
        "fields": {
          "keyword": {
            "type": "keyword",
            "ignore_above": 256
          }
        }
      },
      "state": {
        "type": "keyword"
      }
    }
  }
}
```

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311241745895.png#id=o7mTm&originHeight=903&originWidth=1920&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

> **将索引 bank、类型 account 迁移到索引 newbank**


```json
POST _reindex
{
  "source": {
    "index": "bank",
    "type": "account"
  },
  "dest": {
    "index": "newbank"
  }
}
```

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311241745766.png#id=kol1e&originHeight=903&originWidth=1920&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

### 查看迁移后的数据

迁移后 type 统一为 _doc 移除 type

```json
GET newbank/_search
```

查询结果

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311241745381.png#id=JTck1&originHeight=903&originWidth=1920&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)
