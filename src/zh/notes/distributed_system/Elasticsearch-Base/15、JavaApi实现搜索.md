---
title: 15、JavaApi实现搜索
category:
  - Elasticsearch
date: 2025-09-09
---

<!-- more -->

## 查询全部

DSL：

```
GET book/_search
{
  "query": {
    "match_all": {}
  }
}
```

RestClient查询：

```java
    @Test
    void searchAll() throws IOException {
        SearchRequest searchRequest = new SearchRequest("book");
        SearchSourceBuilder searchSourceBuilder = new SearchSourceBuilder();
        searchSourceBuilder.query(QueryBuilders.matchAllQuery());
        searchRequest.source(searchSourceBuilder);

        //查看DSL语句
        System.out.println(searchSourceBuilder);
        
        SearchResponse searchResponse = restHighLevelClient.search(searchRequest, RequestOptions.DEFAULT);
        SearchHits hits = searchResponse.getHits();
        for (SearchHit hit : hits.getHits()) {
            String jsonSource = hit.getSourceAsString();
            System.out.println(jsonSource);
        }
    }
```

查询全部带分页

```java
    /**
     * 查询全部带分页
     *
     * @throws IOException
     */
    @Test
    void testSearchResult() throws IOException {

        int page = 1;//几页
        int size = 3;//几条

        SearchRequest searchRequest = new SearchRequest("book");
        SearchSourceBuilder searchSourceBuilder = new SearchSourceBuilder();
        searchSourceBuilder.query(QueryBuilders.matchAllQuery());

        //只是获取name字段
//        searchSourceBuilder.fetchSource(new String[]{"name"},new String[]{});
        searchSourceBuilder.from((page - 1) * size);
        searchSourceBuilder.size(size);

        searchRequest.source(searchSourceBuilder);

        SearchResponse searchResponse = restHighLevelClient.search(searchRequest, RequestOptions.DEFAULT);
        SearchHits hits = searchResponse.getHits();
        for (SearchHit hit : hits.getHits()) {
            String jsonSource = hit.getSourceAsString();
            System.out.println(jsonSource);
        }
    }
```

## Ids 搜索

```java
    /**
     * Ids 搜索
     */
    @Test
    void searchIds() throws IOException {
        SearchRequest idsRequest = new SearchRequest("book");
        SearchSourceBuilder searchSourceBuilder = new SearchSourceBuilder();
        searchSourceBuilder.query(QueryBuilders.idsQuery().addIds("1", "3"));
        idsRequest.source(searchSourceBuilder);

        SearchResponse idsResponse = restHighLevelClient.search(idsRequest, RequestOptions.DEFAULT);
        SearchHits hits = idsResponse.getHits();
        for (SearchHit hit : hits.getHits()) {
            System.out.println(hit);
        }
    }
```

## 关键词搜索Match搜索

DSL语句：

```
GET book/_search
{
  "query": {
    "match": {
      "name": "spring"
    }
  }
}
```

JAVA代码

```java
    @Test
    void matchSearch() throws IOException {
        SearchRequest matchRequest = new SearchRequest("book");
        SearchSourceBuilder sourceBuilder = new SearchSourceBuilder();
        sourceBuilder.query(QueryBuilders.matchQuery("name", "spring"));
        matchRequest.source(sourceBuilder);

        SearchResponse matchResponse = restHighLevelClient.search(matchRequest, RequestOptions.DEFAULT);
        SearchHits hits = matchResponse.getHits();
        for (SearchHit hit : hits.getHits()) {
            String jsonSource = hit.getSourceAsString();
            System.out.println(jsonSource);
        }
    }
```

## multi_match搜索：多字段搜索

DSL语句：

```
GET book/_search
{
  "query": {
    "multi_match": {
      "query": "java",
      "fields": ["description","name"]
    }
  }
}
```

JAVA代码：

```java
    @Test
    void multiMatchSearch() throws IOException {
        SearchRequest multiMatchRequest = new SearchRequest("book");
        SearchSourceBuilder searchSourceBuilder = new SearchSourceBuilder();
        //"description", "name"为字段，"java"为要查找的内容
        searchSourceBuilder.query(QueryBuilders.multiMatchQuery("java", "description", "name"));
        multiMatchRequest.source(searchSourceBuilder);

        System.out.println(searchSourceBuilder);

        SearchResponse multiMatchResponse = restHighLevelClient.search(multiMatchRequest, RequestOptions.DEFAULT);
        SearchHits hits = multiMatchResponse.getHits();
        for (SearchHit hit : hits.getHits()) {
            String jsonSource = hit.getSourceAsString();
            System.out.println(jsonSource);
        }
    }
```

## bool(布尔)查询

DSL语句：

```json
GET website/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "match": {
            "title": "elasticsearch"
          }
        }
      ],
      "should": [
        {
          "match": {
            "content": "elasticsearch"
          }
        }
      ],
      "must_not": [
        {
          "match": {
            "author_id": 111
          }
        }
      ]
    }
  }
}
```

JAVA代码

```java
    /**
     * 复杂查询 bool查询
     */
    @Test
    void boolSearch() throws IOException {
        //请求
        SearchRequest searchRequest = new SearchRequest("book");
        SearchSourceBuilder searchSourceBuilder = new SearchSourceBuilder();

        BoolQueryBuilder boolQueryBuilder = new BoolQueryBuilder();
        boolQueryBuilder.must(QueryBuilders.matchQuery("title", "elasticsearch"));
        boolQueryBuilder.should(QueryBuilders.matchQuery("content", "elasticsearch"));
        boolQueryBuilder.mustNot(QueryBuilders.matchQuery("author_id", 111));

        searchSourceBuilder.query(boolQueryBuilder);
        searchRequest.source(searchSourceBuilder);
        System.out.println("bool查询请求体：" + searchSourceBuilder);

        //执行
        SearchResponse searchResponse = restHighLevelClient.search(searchRequest, RequestOptions.DEFAULT);

        //看结果
        SearchHits hits = searchResponse.getHits();
        for (SearchHit hit : hits.getHits()) {
            String json = hit.getSourceAsString();
            System.out.println("打印_source中的结果：" + json);
        }
    }
```

## filter bool 复杂查询增加过滤器查询

DSL语句：

```json
GET book/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "match": {
            "description": "java程序员"
          }
        }
      ],
      "filter": [
        {
          "range": {
            "price": {
              "gte": 80,
              "lte": 90
            }
          }
        }
      ],
      "should": [
        {
          "match": {
            "name": "java"
          }
        }
      ]
    }
  }
}
```

JAVA代码：

```java
    @Test
    void filterBoolSearch() throws IOException {
        //请求
        SearchRequest searchRequest = new SearchRequest("book");
        SearchSourceBuilder searchSourceBuilder = new SearchSourceBuilder();
        BoolQueryBuilder bqb = new BoolQueryBuilder();
        MultiMatchQueryBuilder mmqb = QueryBuilders.multiMatchQuery("java", "name", "description");
        bqb.must(mmqb);
        bqb.should(QueryBuilders.matchQuery("name", "java"));
        bqb.filter(QueryBuilders.rangeQuery("price").gte(80).lte(90));

        searchSourceBuilder.query(bqb);
        System.out.println(searchSourceBuilder);

        searchRequest.source(searchSourceBuilder);
        //执行
        SearchResponse searchResponse = restHighLevelClient.search(searchRequest, RequestOptions.DEFAULT);

        //看结果
        SearchHits hits = searchResponse.getHits();
        for (SearchHit hit : hits.getHits()) {
            String json = hit.getSourceAsString();
            System.out.println("打印_source中的结果：" + json);
        }
    }
```

## 复杂查询加排序

DSL语句：

```json
GET /book/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "multi_match": {
            "query": "java",
            "fields": [
              "description",
              "name"
            ]
          }
        }
      ],
      "filter": [
        {
          "range": {
            "price": {
              "from": 60,
              "to": 90
            }
          }
        }
      ],
      "should": [
        {
          "match": {
            "name": {
              "query": "java"
            }
          }
        }
      ]
    }
  },
  "sort": [
    {
      "price": {
        "order": "asc"
      }
    }
  ]
}
```

JAVA代码：

```java
    @Test
    public void sortSearch() throws IOException {
        //请求
        SearchRequest searchRequest = new SearchRequest("book");
        SearchSourceBuilder searchSourceBuilder = new SearchSourceBuilder();
        BoolQueryBuilder bqb = new BoolQueryBuilder();
        MultiMatchQueryBuilder mmqb = QueryBuilders.multiMatchQuery("java", "name", "description");
        bqb.must(mmqb);
        bqb.should(QueryBuilders.matchQuery("name", "java"));
        bqb.filter(QueryBuilders.rangeQuery("price").gte(60).lte(90));

        searchSourceBuilder.query(bqb);
        searchSourceBuilder.sort("price", SortOrder.ASC);
        System.out.println(searchSourceBuilder);

        searchRequest.source(searchSourceBuilder);

        //执行
        SearchResponse searchResponse = restHighLevelClient.search(searchRequest, RequestOptions.DEFAULT);

        //看结果
        SearchHits hits = searchResponse.getHits();
        for (SearchHit hit : hits.getHits()) {
            String json = hit.getSourceAsString();
            System.out.println("打印_source中的结果：" + json);
        }
    }
```

