---
title: ✅P110-118_全文检索-ElasticSearch-进阶-两种查询方式
category:
  - 谷粒商城
date: 2024-02-13
---

<!-- more -->

## 1、SearchAPI

ES 支持两种基本方式检索 :

- 一个是通过使用 REST request URI 发送搜索参数（uri+检索参数）
- 另一个是通过使用 REST request body 来发送它们（uri+请求体）

### 1.1 检索信息

> **一切检索从_search 开始**

| GET bank/_search | 检索 bank 下所有信息， 包括 type 和 docs |
| --- | --- |
| GET bank/_search?q=*&sort=account_number:asc | 请求参数方式检索 |


响应结果解释：

- `took`：Elasticsearch 执行搜索的时间（ 毫秒）
- `time_out`：告诉我们搜索是否超时
- `_shards`：告诉我们多少个分片被搜索了， 以及统计了成功/失败的搜索分片
- `hits`：搜索结果
- `hits.total`：搜索结果
- `hits.hits`：实际的搜索结果数组（ 默认为前 10 的文档）
- `sort`：结果的排序 key（ 键） （ 没有则按 score 排序）
- `score` 和 `max_score`：相关性得分和最高得分（ 全文检索用）

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311241738644.png#id=jVkPB&originHeight=760&originWidth=1677&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

> **uri+请求体进行检索**


测试内容

```json
GET bank/_search
{
  "query": {
    "match_all": {}
  },
  "sort": [
    {
      "account_number": {
        "order": "desc"
      }
    }
  ]
}
```

测试结果

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311241739109.png#id=tsP4H&originHeight=903&originWidth=1920&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

> **注意**


-  HTTP 客户端工具（ POSTMAN） ， get 请求不能携带请求体， 我们变为 post 也是一样的。我们 POST 一个 JSON 风格的查询请求体到 _search API。 
-  需要了解， 一旦搜索的结果被返回， Elasticsearch 就完成了这次请求， 并且不会维护任何服务端的资源或者结果的 cursor（ 游标） 

---

## 2、Query DSL

### 2.1 基本语法格式

**Elasticsearch** 提供了一个可以执行查询的 Json 风格的 **DSL（ domain-specific language 领域特定语言）** 。 这个被称为 Query DSL。 该查询语言非常全面，真正学好它的方法是从一些基础的示例开始的。

> **一个查询语句的典型结构**


```json
{
	QUERY_NAME: {
		ARGUMENT: VALUE,
		ARGUMENT: VALUE,...
	}
}
```

> **如果是针对某个字段， 那么它的结构如下**


```
{
	QUERY_NAME: {
		FIELD_NAME: {
			ARGUMENT: VALUE,
			ARGUMENT: VALUE,...
		}
	}
}
```

1、query 定义如何查询，
2、match_all 查询类型【代表查询所有的所有】 ， es 中可以在 query 中组合非常多的查询类型完成复杂查询
3、除了 query 参数之外， 我们也可以传递其它的参数以改变查询结果。 如 sort， size
4、from+size 限定， 完成分页功能
5、sort 排序， 多字段排序， 会在前序字段相等时后续字段内部排序， 否则以前序为准
```json
GET bank/_search
{
  "query": {
    "match_all": {}
  },
  "from": 0,
  "size": 5, 
  "sort": [
    {
      "account_number": {
        "order": "desc"
      }
    }
  ]
}
```

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311241740427.png#id=BywNX&originHeight=903&originWidth=1920&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

### 2.2 返回部分字段

```
GET bank/_search
{
  "query": {
    "match_all": {}
  },
  "from": 0,
  "size": 5, 
  "_source":["firstname","age"]
}
```

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311241740429.png#id=ijzrR&originHeight=903&originWidth=1920&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

### 2.3 match【 匹配查询】

match 返回 account_number=20 的

```
GET bank/_search
{
  "query": {
    "match": {
      "account_number": "20"
    }
  }
}
```

字符串， 全文检索。

最终查询出 address 中包含 mill 单词的所有记录。

match 当搜索字符串类型的时候， 会进行全文检索， 并且每条记录有相关性得分。

```
GET bank/_search
{
  "query": {
    "match": {
      "address": "mill"
    }
  }
}
```

字符串， 多个单词（ 分词+全文检索）。

最终查询出 address 中包含 mill 或者 road 或者 mill road 的所有记录， 并给出相关性得分。

```
GET bank/_search
{
  "query":{
    "match": {
      "address": "mill road"
    }
  }
}
```

### 2.4 match_phrase【 短语匹配】

将需要匹配的值当成一个整体单词（ 不分词） 进行检索。

查出 address 中包含 mill road 的所有记录， 并给出相关性得分。

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311241740663.png#id=eeYHx&originHeight=903&originWidth=1920&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

> 注意

`字段.keyword` 精确value

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311241740046.png#id=ahDq9&originHeight=903&originWidth=1920&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

### 2.5 multi_match【 多字段匹配】

state 或者 address 包含 mill

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311241740267.png#id=iAwbn&originHeight=903&originWidth=1920&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

### 2.6 bool【 复合查询】

- bool 用来做复合查询：
- 复合语句可以合并任何其它查询语句，包括复合语句，了解这一点是很重要的。这就意味着， 复合语句之间可以互相嵌套，可以表达非常复杂的逻辑。

> **must： 必须达到 must 列举的所有条件**


```json
GET bank/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "match": {
            "address": "mill"
          }
        },
        {
          "match": {
            "gender": "M"
          }
        }
      ]
    }
  }
}
```

> should： 应该达到 should 列举的条件， 如果达到会增加相关文档的评分， **并不会改变查询的结果**。 如果 query 中只有 should 且只有一种匹配规则， 那么 should 的条件就会被作为默认匹配条件而去改变查询结果


```json
GET bank/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "match": {
            "address": "mill"
          }
        },
        {
          "match": {
            "gender": "M"
          }
        }
      ],
      "should": [
        {
          "match": {
            "address": "lane"
          }
        }
      ]
    }
  }
}
```

> **must_not 必须不是指定的情况**


address 包含 mill， 并且 gender 是 M， 如果 address 里面有 lane 最好不过， 但是 email 必须不包含 baluba.com

```json
GET bank/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "match": {
            "address": "mill"
          }
        },
        {
          "match": {
            "gender": "M"
          }
        }
      ],
      "should": [
        {
          "match": {
            "address": "lane"
          }
        }
      ],
      "must_not": [
        {
          "match": {
            "email": "baluba.com"
          }
        }
      ]
    }
  }
}
```

### 2.7 filter【结果过滤】

并不是所有的查询都需要产生分数， 特别是那些仅用于 “filtering”（过滤） 的文档。 为了不计算分数 Elasticsearch 会自动检查场景并且优化查询的执行。

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311241741553.png#id=r41Ym&originHeight=903&originWidth=1920&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

### 2.8 term

和 match 一样。 匹配某个属性的值。

- 全文检索字段用 match（address字段）
- 其他非 text 字段匹配用 term（如age精确值）。
- term查询是完全匹配
- term查询不会再进行分词，而是直接去分词库进行完全匹配查询；

terms 特点：

- 查询某个字段里含有多个关键词的文档
- 相对于term来，terms是在针对一个字段包含多个值的时候使用
- 通俗来说就是term查询一次可以匹配一个条件，terms一个可以匹配多个条件；

```json
GET bank/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "term": {
            "age": {
              "value": "28"
            }
          }
        },
        {
          "match": {
            "address": "990 Mill Road"
          }
        }
      ]
    }
  }
}
```

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311241741054.png#id=H39ka&originHeight=903&originWidth=1920&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

### 2.9 aggregations（ 执行聚合）

聚合提供了从数据中分组和提取数据的能力。 最简单的聚合方法大致等于 SQL `GROUP BY` 和 SQL `聚合函数`。 在 Elasticsearch 中， 您有执行搜索返回 `hits`（ 命中结果） ， 并且同时返回聚合结果， 把一个响应中的所有 hits（ 命中结果） 分隔开的能力。 这是非常强大且有效的，您可以执行查询和多个聚合， 并且在一次使用中得到各自的（ 任何一个的） 返回结果， 使用一次简洁和简化的 API 来避免网络往返。

> **聚合语法如下**


```json
"aggs": {
		"aggs_name 这次聚合的名字， 方便展示在结果集中": {
			"AGG_TYPE 聚合的类型（ avg,term,terms） ": {}
		}
},
```

> **搜索 address 中包含 mill 的所有人的年龄分布以及平均年龄， 但不显示这些人的详情**

- size： 0 不显示搜索数据,如果size有值或者不加size： 0，那么将看不到聚合结果
- aggs： 执行聚合
```json
GET bank/_search
{
  "query": {
    "match": {
      "address": "mill"
    }
  },
  "aggs": {
    "group_by_age": {
      "terms": {
        "field": "age"
       }
      },
      "avg_age":{
        "avg": {
          "field": "age"
        }
      }
  },
  "size": 0
}
```

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311241741795.png#id=B3NjC&originHeight=748&originWidth=1874&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

> **按照年龄聚合， 并且请求这些年龄段的这些人的平均薪资**


```json
GET bank/_search
{
  "query": {
    "match_all": {}
  },
  "aggs": {
    "aggs_age": {
      "terms": {
        "field": "age",
        "size": 100
      },
      "aggs": {
        "aggs_balance": {
          "avg": {
            "field": "balance"
          }
        }
      }
    }
  },
  "size": 0
}
```

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311241741509.png#id=bpeNp&originHeight=903&originWidth=1920&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

> **复杂： 查出所有年龄分布， 并且这些年龄段中 M 的平均薪资和 F 的平均薪资以及这个年龄段的总体平均薪资**


类似于套娃，先查出年龄分布信息，在年龄分布中聚合出性别信息，在性别中聚合M和F的平均工资，总体平均薪资和性别聚合在一个层级上！
"field": "gender.keyword" gender是txt没法聚合 必须加.keyword精确替代
```json
GET bank/_search
{
  "query": {
    "match_all": {}
  },
  "aggs": {
    "age_Aggs": {
      "terms": {
        "field": "age",
        "size": 100
      },
      "aggs": {
        "sex_Aggs": {
          "terms": {
            "field": "gender.keyword"
          },
          "aggs": {
            "balance_Avg_Aggs": {
              "avg": {
                "field": "balance"
              }
            }
          }
        },
        "total_avg_balance_Aggs":{
          "avg": {
            "field": "balance"
          }
        }
      }
    }
  },
  "size": 0
}
```

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311241741365.png#id=yEKse&originHeight=903&originWidth=1920&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)
