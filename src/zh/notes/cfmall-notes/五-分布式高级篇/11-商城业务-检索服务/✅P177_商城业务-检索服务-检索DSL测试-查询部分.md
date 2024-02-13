---
title: ✅P177_商城业务-检索服务-检索DSL测试-查询部分
category:
  - 谷粒商城
date: 2024-02-13
---

<!-- more -->

## cfmall_product映射修改

由于之前设置的映射设置一些字段的 doc_value 为 false，导致后面聚合查询时报错，

查询出来的数据为`商品上架`时保存到ES中的，

**注意**：skuPrice类型，视频中是keyword，应该为Long才能够范围查询。

**创建新的索引，创建新的映射**

```json
PUT /cfmall_product
{
    "mappings": {
        "properties": {
            "skuId": {
                "type": "long"
            },
            "spuId": {
                "type": "long"
            },
            "skuTitle": {
                "type": "text",
                "analyzer": "ik_smart"
            },
            "skuPrice": {
                "type": "long"
            },
            "skuImg": {
                "type": "keyword"
            },
            "saleCount": {
                "type": "long"
            },
            "hasStock": {
                "type": "boolean"
            },
            "hotScore": {
                "type": "long"
            },
            "brandId": {
                "type": "long"
            },
            "catalogId": {
                "type": "long"
            },
            "brandName": {
                "type": "keyword"
            },
            "brandImg": {
                "type": "keyword"
            },
            "catalogName": {
                "type": "keyword"
            },
            "attrs": {
                "type": "nested",
                "properties": {
                    "attrId": {
                        "type": "long"
                    },
                    "attrName": {
                        "type": "keyword"
                    },
                    "attrValue": {
                        "type": "keyword"
                    }
                }
            }
        }
    }
}
```

---

## 修改代码常量值

修改完映射 mapping 要同步修改检索服务中的常量类中的 es 索引常量。

`cfmall-search/src/main/java/com/gyz/cfmall/search/constant/EsConstant.java`

```java
public static final String PRODUCT_INDEX = "cfmall_product";
```

---

## DSL语句

首先，这是一个复合查询即bool查询，将需要评分的检索条件写在must中，不需要评分的检索条件写在filter中

查询结构：

1. keyword的全文检索，例如：keyword=iphone
```json
GET /cfmall_product/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "match": {
            "skuTitle": "努比亚"
          }
        }
      ]
    }
  }
}
```

2. 手机分类的检索，例如: catalogId=225 ，非文本字段检索用term
> 注：编写下方filter过滤语句没有提示，可以把条件单独拿出来去写，然后粘贴到数组里。

```json
GET /cfmall_product/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "match": {
            "skuTitle": "努比亚"
          }
        }
      ],
      "filter": [
        {
          "term": {
            "catalogId": "225"
          }
        }
      ]
    }
  }
}
```

3. 是否有库存
```json
GET /cfmall_product/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "match": {
            "skuTitle": "努比亚"
          }
        }
      ],
      "filter": [
        {
          "term": {
            "catalogId": "225"
          }
        },
        {
          "term": {
            "hasStock": false
          }
        }
      ]
    }
  }
}
```

4. 价格区间检索
```json
GET /cfmall_product/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "match": {
            "skuTitle": "努比亚"
          }
        }
      ],
      "filter": [
        {
          "term": {
            "catalogId": "225"
          }
        },
        {
          "term": {
            "hasStock": false
          }
        },
        {
          "range": {
            "skuPrice": {
              "gte": 1000,
              "lte": 7000
            }
          }
        }
      ]
    }
  }
}
```

5. 根据属性检索，属性未防止扁平化处理声明为nested，因此，需要使用nested查询，[nested query文档地址](https://www.elastic.co/guide/en/elasticsearch/reference/8.2/query-dsl-nested-query.html)
```json
GET /cfmall_product/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "match": {
            "skuTitle": "努比亚"
          }
        }
      ],
      "filter": [
        {
          "term": {
            "catalogId": "225"
          }
        },
        {
          "term": {
            "hasStock": false
          }
        },
        {
          "range": {
            "skuPrice": {
              "gte": 1000,
              "lte": 7000
            }
          }
        },
        {
          "nested": {
            "path": "attrs",
            "query": {
              "bool": {
                "must": [
                  {
                    "term": {
                      "attrs.attrId": "6"
                    }
                  }
                ]
              }
            }
          }
        }
      ]
    }
  }
}
```

6. 排序
```json
GET /cfmall_product/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "match": {
            "skuTitle": "努比亚"
          }
        }
      ],
      "filter": [
        {
          "term": {
            "catalogId": "225"
          }
        },
        {
          "term": {
            "hasStock": false
          }
        },
        {
          "range": {
            "skuPrice": {
              "gte": 1000,
              "lte": 7000
            }
          }
        },
        {
          "nested": {
            "path": "attrs",
            "query": {
              "bool": {
                "must": [
                  {
                    "term": {
                      "attrs.attrId": "6"
                    }
                  }
                ]
              }
            }
          }
        }
      ]
    }
  },
  "sort": [
    {
      "skuPrice": {
        "order": "desc"
      }
    }
  ]
}
```

7. 分页
```json
GET /cfmall_product/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "match": {
            "skuTitle": "努比亚"
          }
        }
      ],
      "filter": [
        {
          "term": {
            "catalogId": "225"
          }
        },
        {
          "term": {
            "hasStock": false
          }
        },
        {
          "range": {
            "skuPrice": {
              "gte": 1000,
              "lte": 7000
            }
          }
        },
        {
          "nested": {
            "path": "attrs",
            "query": {
              "bool": {
                "must": [
                  {
                    "term": {
                      "attrs.attrId": "6"
                    }
                  }
                ]
              }
            }
          }
        }
      ]
    }
  },
  "sort": [
    {
      "skuPrice": {
        "order": "desc"
      }
    }
  ],
  "from": 0,
  "size": 10
}
```

8. 高亮，标题内容含有搜索内容则标题中含有的搜索内容标红
```json
GET /cfmall_product/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "match": {
            "skuTitle": "努比亚"
          }
        }
      ],
      "filter": [
        {
          "term": {
            "catalogId": "225"
          }
        },
        {
          "term": {
            "hasStock": false
          }
        },
        {
          "range": {
            "skuPrice": {
              "gte": 1000,
              "lte": 7000
            }
          }
        },
        {
          "nested": {
            "path": "attrs",
            "query": {
              "bool": {
                "must": [
                  {
                    "term": {
                      "attrs.attrId": "6"
                    }
                  }
                ]
              }
            }
          }
        }
      ]
    }
  },
  "sort": [
    {
      "skuPrice": {
        "order": "desc"
      }
    }
  ],
  "from": 0,
  "size": 10,
  "highlight": {
    "fields": {
      "skuTitle": {}
    },
    "pre_tags": "<b style='color:red'>",
    "post_tags": "</b>"
  }
}
```

测试
![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202312/5f6aeeb4f1c7f0e839bfa75599a9bc74.gif#id=f0DzI&originHeight=364&originWidth=720&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)
完整DSL语句
```java
GET cfmall_product/_search
{
  "query": {
    "bool": {
      "must": [ {"match": {  "skuTitle": "华为" }} ], # 检索出华为
      "filter": [ # 过滤
        { "term": { "catalogId": "225" } },
        { "terms": {"brandId": [ "2"] } }, 
        { "term": { "hasStock": "false"} },
        {
          "range": {
            "skuPrice": { # 价格1K~7K
              "gte": 1000,
              "lte": 7000
            }
          }
        },
        {
          "nested": {
            "path": "attrs", # 聚合名字
            "query": {
              "bool": {
                "must": [
                  {
                    "term": { "attrs.attrId": { "value": "6"} }
                  },
                  {
                    "terms": { "attrs.attrValue": [ "5G","4G" ] }
                  }
                ]
              }
            }
          }
        }
      ]
    }
  },
  "sort": [ {"skuPrice": {"order": "desc" } } ],
  "from": 0,
  "size": 10,
  "highlight": {  
    "fields": {"skuTitle": {}}, # 高亮的字段
    "pre_tags": "<b style='color:red'>",  # 前缀
    "post_tags": "</b>"
  }
}
```
