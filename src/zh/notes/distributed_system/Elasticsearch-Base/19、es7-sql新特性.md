---
title: 19、es7-sql新特性
category:
  - Elasticsearch
date: 2025-09-09
---

<!-- more -->

## 快速入门

```
POST /_sql?format=txt
{
    "query": "SELECT * FROM tvs "
}
```

---

## 启动方式

1、http 请求

2、客户端：elasticsearch-sql-cli.bat

3、代码

---

## 显示方式

![image-20230724140751522](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Elasticsearch/202307241407590.png)

---

## sql翻译

```
POST /_sql/translate
{
    "query": "SELECT * FROM tvs "
}
```

返回：

```
{
  "size" : 1000,
  "_source" : false,
  "stored_fields" : "_none_",
  "docvalue_fields" : [
    {
      "field" : "brand"
    },
    {
      "field" : "color"
    },
    {
      "field" : "price"
    },
    {
      "field" : "sold_date",
      "format" : "epoch_millis"
    }
  ],
  "sort" : [
    {
      "_doc" : {
        "order" : "asc"
      }
    }
  ]
}
```

---

## 与其他DSL结合

```
POST /_sql?format=txt
{
    "query": "SELECT * FROM tvs",
    "filter": {
        "range": {
            "price": {
                "gte" : 1200,
                "lte" : 2000
            }
        }
    }
}
```

---

## java 代码实现sql功能

### 1、前提

es拥有白金版功能

kibana中管理-》许可管理 开启白金版试用

### 2、导入依赖

```xml
    <dependency>
        <groupId>org.elasticsearch.plugin</groupId>
        <artifactId>x-pack-sql-jdbc</artifactId>
        <version>7.3.0</version>
    </dependency>
    
    <repositories>
        <repository>
            <id>elastic.co</id>
            <url>https://artifacts.elastic.co/maven</url>
        </repository>
    </repositories>
```

### 3、代码

```java
public static void main(String[] args) {
        try  {
            Connection connection = DriverManager.getConnection("jdbc:es://http://localhost:9200");
            Statement statement = connection.createStatement();
            ResultSet results = statement.executeQuery(
                    "select * from tvs");
            while(results.next()){
                System.out.println(results.getString(1));
                System.out.println(results.getString(2));
                System.out.println(results.getString(3));
                System.out.println(results.getString(4));
                System.out.println("============================");
            }
        }catch (Exception e){
            e.printStackTrace();
        }
```

大型企业可以购买白金版，增加Machine Learning、高级安全性x-pack。
