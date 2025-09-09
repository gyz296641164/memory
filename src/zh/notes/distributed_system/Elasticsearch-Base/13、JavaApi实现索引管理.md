---
title: 13、JavaApi实现索引管理
category:
  - Elasticsearch
date: 2025-09-09
---

<!-- more -->

## 代码

```java
package com.gyz.elasticsearch;

import org.elasticsearch.action.ActionListener;
import org.elasticsearch.action.DocWriteResponse;
import org.elasticsearch.action.admin.indices.alias.Alias;
import org.elasticsearch.action.admin.indices.close.CloseIndexRequest;
import org.elasticsearch.action.admin.indices.delete.DeleteIndexRequest;
import org.elasticsearch.action.admin.indices.open.OpenIndexRequest;
import org.elasticsearch.action.admin.indices.open.OpenIndexResponse;
import org.elasticsearch.action.bulk.BulkItemResponse;
import org.elasticsearch.action.bulk.BulkRequest;
import org.elasticsearch.action.bulk.BulkResponse;
import org.elasticsearch.action.delete.DeleteRequest;
import org.elasticsearch.action.delete.DeleteResponse;
import org.elasticsearch.action.get.GetRequest;
import org.elasticsearch.action.get.GetResponse;
import org.elasticsearch.action.index.IndexRequest;
import org.elasticsearch.action.index.IndexResponse;
import org.elasticsearch.action.support.ActiveShardCount;
import org.elasticsearch.action.support.master.AcknowledgedResponse;
import org.elasticsearch.action.update.UpdateRequest;
import org.elasticsearch.action.update.UpdateResponse;
import org.elasticsearch.client.IndicesClient;
import org.elasticsearch.client.RequestOptions;
import org.elasticsearch.client.RestHighLevelClient;
import org.elasticsearch.client.indices.CreateIndexRequest;
import org.elasticsearch.client.indices.CreateIndexResponse;
import org.elasticsearch.client.indices.GetIndexRequest;
import org.elasticsearch.common.settings.Settings;
import org.elasticsearch.common.unit.TimeValue;
import org.elasticsearch.common.xcontent.XContentType;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import javax.annotation.Resource;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@SpringBootTest
class ElasticsearchApplicationTests {

    @Resource
    RestHighLevelClient restHighLevelClient;

    @Test
    void contextLoads() {
        System.out.println(restHighLevelClient);
    }

    /**
     * 创建索引
     */
    @Test
    void createIndex() throws IOException {
        CreateIndexRequest createIndexRequest = new CreateIndexRequest("it_book");
        //设置主副分片
        createIndexRequest.settings(Settings.builder().put("number_of_shards", "1").put("number_of_replicas", "0"));
                
        //设置映射
        Map<String, Object> message = new HashMap<>();
        message.put("type", "text");
        Map<String, Object> properties = new HashMap<>();
        properties.put("message", message);
        Map<String, Object> mapping = new HashMap<>();
        mapping.put("properties", properties);
        createIndexRequest.mapping(mapping);
        
                //指定映射2
//        createIndexRequest.mapping(" {\n" +
//                " \t\"properties\": {\n" +
//                "            \"name\":{\n" +
//                "             \"type\":\"keyword\"\n" +
//                "           },\n" +
//                "           \"description\": {\n" +
//                "              \"type\": \"text\"\n" +
//                "           },\n" +
//                "            \"price\":{\n" +
//                "             \"type\":\"long\"\n" +
//                "           },\n" +
//                "           \"pic\":{\n" +
//                "             \"type\":\"text\",\n" +
//                "             \"index\":false\n" +
//                "           }\n" +
//                " \t}\n" +
//                "}", XContentType.JSON);
  
         //指定映射3
//        XContentBuilder builder = XContentFactory.jsonBuilder();
//        builder.startObject();
//        {
//            builder.startObject("properties");
//            {
//                builder.startObject("message");
//                {
//                    builder.field("type", "text");
//                }
//                builder.endObject();
//            }
//            builder.endObject();
//        }
//        builder.endObject();
//        createIndexRequest.mapping(builder);

        //设置别名
        createIndexRequest.alias(new Alias("it_book+new"));
        //设置超时时间
        createIndexRequest.setTimeout(TimeValue.timeValueMinutes(2));
        //设置主节点超时时间
        createIndexRequest.setMasterTimeout(TimeValue.timeValueMinutes(1));
        //在创建索引API返回响应之前等待的活动分片副本的数量，以int形式表示
        createIndexRequest.waitForActiveShards(ActiveShardCount.from(2));
        createIndexRequest.waitForActiveShards(ActiveShardCount.DEFAULT);
        //操作索引的客户端

        //执行创建索引库
        IndicesClient indices = restHighLevelClient.indices();
        CreateIndexResponse createIndexResponse = indices.create(createIndexRequest, RequestOptions.DEFAULT);
        System.out.println(createIndexResponse);

        //得到响应（全部）
        boolean acknowledged = createIndexResponse.isAcknowledged();
        //得到响应 指示是否在超时前为索引中的每个分片启动了所需数量的碎片副本
        boolean shardsAcknowledged = createIndexResponse.isShardsAcknowledged();

        System.out.println("!!!!!!!!!!!!!!!!!!!!!!!!!!!" + acknowledged);
        System.out.println(shardsAcknowledged);
    }

    //>>>>>>>>>>>>>>>>>>>>>>>>>>>异步新增索引>>>>>>>>>>>>>>>>>>>>>>>>>>>

    @Test
    void createIndexAync() {
        //创建索引
        CreateIndexRequest indexAync = new CreateIndexRequest("indexaync");
        //设置属性
        indexAync.settings(Settings.builder().put("number_of_shards", "1").put("number_of_replicas", "0"));
        //指定映射
        Map<String, Object> message = new HashMap<>(16);
        message.put("type", "text");
        Map<String, Object> properties = new HashMap<>(16);
        properties.put("message", message);
        Map<String, Object> mapping = new HashMap<>(16);
        mapping.put("properties", properties);
        indexAync.mapping(mapping);

        ActionListener<CreateIndexResponse> listener = new ActionListener<CreateIndexResponse>() {

            @Override
            public void onResponse(CreateIndexResponse createIndexResponse) {
                System.out.println("创建索引成功");
                System.out.println(createIndexResponse.toString());
            }

            @Override
            public void onFailure(Exception e) {
                System.out.println("创建索引失败");
                e.printStackTrace();
            }
        };

        IndicesClient indicesClient = restHighLevelClient.indices();
        indicesClient.createAsync(indexAync, RequestOptions.DEFAULT, listener);

        try {
            Thread.sleep(3000);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    //删除索引库
    @Test
    void deleteIndex() throws IOException {
        DeleteIndexRequest deleteRequest = new DeleteIndexRequest("indexaync");
        IndicesClient indices = restHighLevelClient.indices();
        AcknowledgedResponse deleteResponse = indices.delete(deleteRequest, RequestOptions.DEFAULT);
        boolean acknowledged = deleteResponse.isAcknowledged();
        System.out.println("是否删除响应：" + acknowledged);
    }

    //异步删除索引
    @Test
    void deleteIndexAync() {
        DeleteIndexRequest deleteIndexAync = new DeleteIndexRequest("indexaync");
        IndicesClient indices = restHighLevelClient.indices();
        ActionListener<AcknowledgedResponse> deleteResponseActionListener = new ActionListener<AcknowledgedResponse>() {

            @Override
            public void onResponse(AcknowledgedResponse acknowledgedResponse) {
                System.out.println("删除索引成功");
                System.out.println(acknowledgedResponse);
            }

            @Override
            public void onFailure(Exception e) {
                System.out.println("删除索引失败");
                e.printStackTrace();
            }
        };
        indices.deleteAsync(deleteIndexAync, RequestOptions.DEFAULT, deleteResponseActionListener);
        try {
            Thread.sleep(5000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }

    // Indices Exists API
    @Test
    void testExistsIndex() throws IOException {
        GetIndexRequest getIndexRequest = new GetIndexRequest("indexaync");
        //从主节点返回本地信息或检索状态
        getIndexRequest.local(false);
        //以适合人类的格式返回结果
        getIndexRequest.humanReadable(true);
        //是否返回每个索引的所有默认设置
        getIndexRequest.includeDefaults(false);
        boolean exists = restHighLevelClient.indices().exists(getIndexRequest, RequestOptions.DEFAULT);
        System.out.println(exists);
    }

    // Indices Open API
    @Test
    public void testOpenIndex() throws IOException {
        OpenIndexRequest request = new OpenIndexRequest("indexaync");

        OpenIndexResponse openIndexResponse = restHighLevelClient.indices().open(request, RequestOptions.DEFAULT);
        boolean acknowledged = openIndexResponse.isAcknowledged();
        System.out.println("!!!!!!!!!" + acknowledged);
    }

    // Indices Close API
    @Test
    public void testCloseIndex() throws IOException {
        CloseIndexRequest request = new CloseIndexRequest("index");
        AcknowledgedResponse closeIndexResponse = restHighLevelClient.indices().close(request, RequestOptions.DEFAULT);
        boolean acknowledged = closeIndexResponse.isAcknowledged();
        System.out.println("!!!!!!!!!" + acknowledged);
    }

}
```



---

## 报错

### 问题复现

Maven 依赖：

```xml
 <dependency>
     <groupId>org.elasticsearch.client</groupId>
     <artifactId>elasticsearch-rest-high-level-client</artifactId>
     <version>7.3.0</version>
     <exclusions>
         <exclusion>
             <groupId>org.elasticsearch</groupId>
             <artifactId>elasticsearch</artifactId>
         </exclusion>
     </exclusions>
 </dependency>
 <dependency>
     <groupId>org.elasticsearch</groupId>
     <artifactId>elasticsearch</artifactId>
     <version>7.3.0</version>
 </dependency>
```

### 异常

执行创建索引测试时报错：`java.lang.NoSuchMethodError: org.elasticsearch.client.RestClient.performRequestAsync`

### 问题定位及分析

通常出现`java.lang.NoSuchMethodError` 异常说明项目中出现了jar包冲突，项目运行时调用了版本A中的某个类的方法，但实际上classLoader加载的是版本B的类文件，而版本B中并没有实际调用的方法签名，导致异常出现。

经全局搜索发现RestClient类在`elasticsearch-rest-client:7.3.0`包中。

![image-20230717134152660](https://studyimages.oss-cn-beijing.aliyuncs.com/img/Elasticsearch/202307171341704.png)

导入`elasticsearch-rest-client`依赖，问题解决。

```xml
 <dependency>
     <groupId>org.elasticsearch.client</groupId>
     <artifactId>elasticsearch-rest-client</artifactId>
     <version>7.3.0</version>
 </dependency>
```

