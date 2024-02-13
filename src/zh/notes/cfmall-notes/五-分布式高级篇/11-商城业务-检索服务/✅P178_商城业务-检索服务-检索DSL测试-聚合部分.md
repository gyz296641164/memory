---
title: ✅P178_商城业务-检索服务-检索DSL测试-聚合部分
category:
  - 谷粒商城
date: 2024-02-13
---

<!-- more -->

## DSL语句结构

如果是嵌入式的属性，查询，聚合，分析都应该是嵌入式（nested）的。

编写下方filter过滤语句没有提示，可以把条件单独拿出来去写，然后粘贴到数组里。

加入聚合部分的DSL语句如下 :

**1、品牌聚合**

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202312/37e2ac3897126a18567a9aa9f79f4de3.png#id=LpIST&originHeight=532&originWidth=1320&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

**2、分类聚合**

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202312/581c874df2a8da16facff3402127220e.png#id=FBCvP&originHeight=398&originWidth=913&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

**3、属性聚合,应使用嵌入式聚合**

参考[Nested Aggregations文档](https://www.elastic.co/guide/en/elasticsearch/guide/2.x/nested-aggregation.html#nested-aggregation)

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202312/321e1df18371e471986a0c0df2dac383.png#id=uDeIl&originHeight=543&originWidth=927&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

---

## 完整DSL语句如下

```json
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
  "size": 5,
  "highlight": {  
    "fields": {"skuTitle": {}}, # 高亮的字段
    "pre_tags": "<b style='color:red'>",  # 前缀
    "post_tags": "</b>"
  },
  "aggs": { # 查完后聚合
    "brandAgg": {
      "terms": {
        "field": "brandId",
        "size": 10
      },
      "aggs": { # 子聚合
        "brandNameAgg": {  # 每个商品id的品牌
          "terms": {
            "field": "brandName",
            "size": 10
          }
        },
      
        "brandImgAgg": {
          "terms": {
            "field": "brandImg",
            "size": 10
          }
        }
      }
    },
    "catalogAgg":{
      "terms": {
        "field": "catalogId",
        "size": 10
      },
      "aggs": {
        "catalogNameAgg": {
          "terms": {
            "field": "catalogName",
            "size": 10
          }
        }
      }
    },
    "attrs":{
      "nested": {"path": "attrs" },
      "aggs": {
        "attrIdAgg": {
          "terms": {
            "field": "attrs.attrId",
            "size": 10
          },
          "aggs": {
            "attrNameAgg": {
              "terms": {
                "field": "attrs.attrName",
                "size": 10
              }
            }
          }
        }
      }
    }
  }
}
```

---

## 项目中保存DSL语句和映射
![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202312/1cea7e4ce6813532070a1d99d2687f1e.png#id=rza7d&originHeight=289&originWidth=304&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)
