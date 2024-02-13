---
title: ✅P125-127_全文检索-ElasticSearch-整合&测试
category:
  - 谷粒商城
date: 2024-02-13
---

<!-- more -->

## Elasticsearch-Rest-Client
### 9300：TCP

> **通过9300(TCP)访问ES，spring-data-elasticsearch:transport-api.jar；**

- springboot 版本不同， transport-api.jar 不同， 不能适配 es 版本
- 7.x 已经不建议使用， 8 以后就要废弃

### 9200：HTTP

> **通过9200(HTTP)访问ES**

- JestClient： 非官方， 更新慢
- RestTemplate： 模拟发 HTTP 请求， ES 很多操作需要自己封装， 麻烦
- HttpClient： 同上
- Elasticsearch-Rest-Client： 官方 RestClient， 封装了 ES 操作， API 层次分明， 上手简单

最终选择 Elasticsearch-Rest-Client（elasticsearch-rest-high-level-client）。
文档地址：[https://www.elastic.co/guide/en/elasticsearch/client/java-rest/current/java-rest-high.html](https://www.elastic.co/guide/en/elasticsearch/client/java-rest/current/java-rest-high.html)

---

## 新建服务检索Moudle
### 新建cfmall-search
![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311241752171.png#id=bRroJ&originHeight=980&originWidth=1133&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

### pom.xml
```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.1.8.RELEASE</version>
        <relativePath/> <!-- lookup parent from repository -->
    </parent>

    <groupId>com.gyz.cfmall</groupId>
    <artifactId>cfmall-search</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>cfmall-search</name>
    <description>Es检索服务</description>

    <properties>
        <java.version>1.8</java.version>
        <elasticsearch.version>7.4.2</elasticsearch.version>
        <spring-cloud.version>Greenwich.SR3</spring-cloud.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>com.gyz.cfmall</groupId>
            <artifactId>cfmall-common</artifactId>
            <version>0.0.1-SNAPSHOT</version>
        </dependency>
        <!-- https://mvnrepository.com/artifact/org.elasticsearch.client/elasticsearch-rest-high-level-client -->
        <dependency>
            <groupId>org.elasticsearch.client</groupId>
            <artifactId>elasticsearch-rest-high-level-client</artifactId>
            <version>7.4.2</version>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-devtools</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
    </dependencies>

    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>org.springframework.cloud</groupId>
                <artifactId>spring-cloud-dependencies</artifactId>
                <version>${spring-cloud.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>

</project>
```
### application.properties
```protobuf
# 应用名称
spring.application.name=cfmall-search
spring.cloud.nacos.config.server-addr=127.0.0.1:8848
server.port=8400
```
### CfmallSearchApplication.java
```java
//禁止 SpringBoot 自动注入数据源配置。
@SpringBootApplication(exclude = DataSourceAutoConfiguration.class)
@EnableDiscoveryClient
public class CfmallSearchApplication {

    public static void main(String[] args) {
        SpringApplication.run(CfmallSearchApplication.class, args);
    }

}
```
### 编写配置类

参见官方文档：[请求选项](https://www.elastic.co/guide/en/elasticsearch/client/java-rest/current/java-rest-low-usage-requests.html#java-rest-low-usage-request-options) 
```java
package com.gyz.cfmall.search.config;

import org.apache.http.HttpHost;
import org.elasticsearch.client.RequestOptions;
import org.elasticsearch.client.RestClient;
import org.elasticsearch.client.RestClientBuilder;
import org.elasticsearch.client.RestHighLevelClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 1、导入依赖
 * 2、编写配置，给容器注入一个restHighLevelClient
 * 3、参照API见官方文档
 * @Author GongYuZhuo
 * @Version 1.0.0
 */
@Configuration
public class CfMallElasticSearchConfig {

    public static final RequestOptions COMMON_OPTIONS;

    static {
        RequestOptions.Builder builder = RequestOptions.DEFAULT.toBuilder();
        // builder.addHeader("Authorization", "Bearer " + TOKEN);
        // builder.setHttpAsyncResponseConsumerFactory(
        //         new HttpAsyncResponseConsumerFactory
        //                 .HeapBufferedResponseConsumerFactory(30 * 1024 * 1024 * 1024));
        COMMON_OPTIONS = builder.build();
    }

    @Bean
    public RestHighLevelClient restHighLevelClient() {
        RestClientBuilder builder = null;
        builder = RestClient.builder(new HttpHost("192.168.56.10", 9200, "http"));
        RestHighLevelClient client = new RestHighLevelClient(builder);

        return client;
    }
}
```

---

## 测试
### 存储数据
```java
	@Test
    public void indexData() throws IOException {
        //创建索引
        IndexRequest indexRequest = new IndexRequest("users");
        indexRequest.id("1");
        //构建对象
        User user = new User();
        user.setUserName("Bob");
        user.setGender("M");
        user.setAge(18);

        String jsonInfo = JSON.toJSONString(user);

        indexRequest.source(jsonInfo, XContentType.JSON);
        //执行新增数据操作
        IndexResponse index = restHighLevelClient.index(indexRequest, CfMallElasticSearchConfig.COMMON_OPTIONS);
        //提取有用的响应数据
        System.out.println(index);
    }
```

### 检索数据
> 参考：[ Search API](https://www.elastic.co/guide/en/elasticsearch/client/java-rest/current/java-rest-high-search.html)

复杂检索：在bank中搜索address中包含mill的所有人的年龄分布以及平均年龄，平均薪资
```java
 	@Test
    public void searchData() throws IOException {
        //1. 创建检索请求
        SearchRequest searchRequest = new SearchRequest();

        //1.1）指定索引
        searchRequest.indices("bank");
        //1.2）构造检索条件
        SearchSourceBuilder sourceBuilder = new SearchSourceBuilder();
        sourceBuilder.query(QueryBuilders.matchQuery("address", "Mill"));


        //1.2.1)按照年龄分布进行聚合
        TermsAggregationBuilder ageAgg = AggregationBuilders.terms("ageAgg").field("age").size(10);
        sourceBuilder.aggregation(ageAgg);

        //1.2.2)计算平均年龄
        AvgAggregationBuilder ageAvg = AggregationBuilders.avg("ageAvg").field("age");
        sourceBuilder.aggregation(ageAvg);
        //1.2.3)计算平均薪资
        AvgAggregationBuilder balanceAvg = AggregationBuilders.avg("balanceAvg").field("balance");
        sourceBuilder.aggregation(balanceAvg);

        System.out.println("检索条件：" + sourceBuilder);
        searchRequest.source(sourceBuilder);
        //2. 执行检索
        SearchResponse searchResponse = client.search(searchRequest, RequestOptions.DEFAULT);
        System.out.println("检索结果：" + searchResponse);

        //3. 将检索结果封装为Bean
        SearchHits hits = searchResponse.getHits();
        SearchHit[] searchHits = hits.getHits();
        for (SearchHit searchHit : searchHits) {
            String sourceAsString = searchHit.getSourceAsString();
            Account account = JSON.parseObject(sourceAsString, Account.class);
            System.out.println(account);

        }

        //4. 获取聚合信息
        Aggregations aggregations = searchResponse.getAggregations();

        Terms ageAgg1 = aggregations.get("ageAgg");

        for (Terms.Bucket bucket : ageAgg1.getBuckets()) {
            String keyAsString = bucket.getKeyAsString();
            System.out.println("年龄：" + keyAsString + " ==> " + bucket.getDocCount());
        }
        Avg ageAvg1 = aggregations.get("ageAvg");
        System.out.println("平均年龄：" + ageAvg1.getValue());

        Avg balanceAvg1 = aggregations.get("balanceAvg");
        System.out.println("平均薪资：" + balanceAvg1.getValue());
    }
```
将执行结果在kibana中执行

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311241753078.png#id=fHVSv&originHeight=903&originWidth=1920&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)
