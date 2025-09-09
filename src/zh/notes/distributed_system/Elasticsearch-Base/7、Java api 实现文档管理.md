---
title: 7、Java api 实现文档管理
category:
  - Elasticsearch
date: 2025-09-09
---

<!-- more -->

## es技术特点

1、es技术比较特殊，不像其他分布式、大数据课程，haddop、spark、hbase。es代码层面很好写，难的是概念的理解。

2、es最重要的是他的rest api。跨语言的。在真实生产中，探查数据、分析数据，使用rest更方便。

3、本课程将会大量讲解内部原理及rest api。java代码会在重要的api后学习。

---

## java 客户端简单获取数据

java api 文档： https://www.elastic.co/guide/en/elasticsearch/client/java-rest/7.3/java-rest-overview.html

low : 偏向底层。

high：高级封装，足够。

### 1、导包

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

### 2、代码

步骤

1. 获取连接客户端
2. 构建请求
3. 执行
4. 获取结果

```java
    //获取连接客户端
    RestHighLevelClient client = new RestHighLevelClient(
            RestClient.builder(
                    new HttpHost("localhost", 9200, "http")));
    //构建请求
    GetRequest getRequest = new GetRequest("book", "1");
    // 执行
    GetResponse getResponse = client.get(getRequest, RequestOptions.DEFAULT);
    // 获取结果
    if (getResponse.isExists()) {
        long version = getResponse.getVersion();
        String sourceAsString = getResponse.getSourceAsString();//检索文档(String形式)
        System.out.println(sourceAsString);
    }
```

---

## 结合spring-boot-test测试文档查询

### 1、为什么使用spring boot test

- 当今趋势
-  方便开发
-  创建连接交由spring容器，避免每次请求的网络开销。

### 2、导包

```xml
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter</artifactId>
            <version>2.0.6.RELEASE</version>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
            <version>2.0.6.RELEASE</version>
        </dependency>
```

### 3、配置application.yml

```yaml
spring:
  application:
    name: service-search
heima:
  elasticsearch:
    hostlist: 127.0.0.1:9200 #多个结点中间用逗号分隔
```

### 4、代码

主类

配置类

测试类

```java
@SpringBootTest
@RunWith(SpringRunner.class)
//查询文档
       @Test
    public void testGet() throws IOException {
        //构建请求
        GetRequest getRequest = new GetRequest("test_post", "1");

        //========================可选参数 start======================
        //为特定字段配置_source_include
//        String[] includes = new String[]{"user", "message"};
//        String[] excludes = Strings.EMPTY_ARRAY;
//        FetchSourceContext fetchSourceContext = new FetchSourceContext(true, includes, excludes);
//        getRequest.fetchSourceContext(fetchSourceContext);

        //为特定字段配置_source_excludes
//        String[] includes1 = new String[]{"user", "message"};
//        String[] excludes1 = Strings.EMPTY_ARRAY;
//        FetchSourceContext fetchSourceContext1 = new FetchSourceContext(true, includes1, excludes1);
//        getRequest.fetchSourceContext(fetchSourceContext1);

        //设置路由
//        getRequest.routing("routing");

        // ========================可选参数 end=====================


        //查询 同步查询
      GetResponse getResponse = client.get(getRequest, RequestOptions.DEFAULT);

        //异步查询
//        ActionListener<GetResponse> listener = new ActionListener<GetResponse>() {
//            //查询成功时的立马执行的方法
//            @Override
//            public void onResponse(GetResponse getResponse) {
//                long version = getResponse.getVersion();
//                String sourceAsString = getResponse.getSourceAsString();//检索文档(String形式)
//                System.out.println(sourceAsString);
//            }
//
//            //查询失败时的立马执行的方法
//            @Override
//            public void onFailure(Exception e) {
//                e.printStackTrace();
//            }
//        };
//        //执行异步请求
//        client.getAsync(getRequest, RequestOptions.DEFAULT, listener);
//        try {
//            Thread.sleep(5000);
//        } catch (InterruptedException e) {
//            e.printStackTrace();
//        }

        // 获取结果
        if (getResponse.isExists()) {
            long version = getResponse.getVersion();

            String sourceAsString = getResponse.getSourceAsString();//检索文档(String形式)
            System.out.println(sourceAsString);
            byte[] sourceAsBytes = getResponse.getSourceAsBytes();//以字节接受
            Map<String, Object> sourceAsMap = getResponse.getSourceAsMap();
            System.out.println(sourceAsMap);

        }else {

        }

    }
```

---

## 结合spring-boot-test测试文档新增

### rest api

```json
PUT test_post/_doc/2
{
  "user":"tomas",
  "postDate":"2019-07-18",
  "message":"trying out es1"
}
```

### 代码

```java
@Test
    public void testAdd() throws IOException {
//        1构建请求
        IndexRequest request=new IndexRequest("test_posts");
        request.id("3");
//        =======================构建文档============================
//        构建方法1
        String jsonString="{\n" +
                "  \"user\":\"tomas J\",\n" +
                "  \"postDate\":\"2019-07-18\",\n" +
                "  \"message\":\"trying out es3\"\n" +
                "}";
        request.source(jsonString, XContentType.JSON);

//        构建方法2
//        Map<String,Object> jsonMap=new HashMap<>();
//        jsonMap.put("user", "tomas");
//        jsonMap.put("postDate", "2019-07-18");
//        jsonMap.put("message", "trying out es2");
//        request.source(jsonMap);

//        构建方法3
//        XContentBuilder builder= XContentFactory.jsonBuilder();
//        builder.startObject();
//        {
//            builder.field("user", "tomas");
//            builder.timeField("postDate", new Date());
//            builder.field("message", "trying out es2");
//        }
//        builder.endObject();
//        request.source(builder);
//        构建方法4
//        request.source("user","tomas",
//                    "postDate",new Date(),
//                "message","trying out es2");
//
//        ========================可选参数===================================
        //设置超时时间
        request.timeout(TimeValue.timeValueSeconds(1));
        request.timeout("1s");

        //自己维护版本号
//        request.version(2);
//        request.versionType(VersionType.EXTERNAL);



//        2执行
        //同步
        IndexResponse indexResponse = client.index(request, RequestOptions.DEFAULT);
        //异步
//        ActionListener<IndexResponse> listener=new ActionListener<IndexResponse>() {
//            @Override
//            public void onResponse(IndexResponse indexResponse) {
//
//            }
//
//            @Override
//            public void onFailure(Exception e) {
//
//            }
//        };
//        client.indexAsync(request,RequestOptions.DEFAULT, listener );
//        try {
//            Thread.sleep(5000);
//        } catch (InterruptedException e) {
//            e.printStackTrace();
//        }


//        3获取结果
        String index = indexResponse.getIndex();
        String id = indexResponse.getId();
        //获取插入的类型
        if(indexResponse.getResult()== DocWriteResponse.Result.CREATED){
            DocWriteResponse.Result result=indexResponse.getResult();
            System.out.println("CREATED:"+result);
        }else if(indexResponse.getResult()== DocWriteResponse.Result.UPDATED){
            DocWriteResponse.Result result=indexResponse.getResult();
            System.out.println("UPDATED:"+result);
        }

        ReplicationResponse.ShardInfo shardInfo = indexResponse.getShardInfo();
        if(shardInfo.getTotal()!=shardInfo.getSuccessful()){
            System.out.println("处理成功的分片数少于总分片！");
        }
        if(shardInfo.getFailed()>0){
           for (ReplicationResponse.ShardInfo.Failure failure:shardInfo.getFailures()) {
               String reason = failure.reason();//处理潜在的失败原因
               System.out.println(reason);
           }
        }
    }
```

---

## 结合spring-boot-test测试文档修改

### rest api

```json
post /test_posts/_doc/3/_update 
{
   "doc": {
      "user"："tomas J"
   }
}
```

### 代码

```java
  @Test
    public void testUpdate() throws IOException {
//        1构建请求
        UpdateRequest request = new UpdateRequest("test_posts", "3");
        Map<String, Object> jsonMap = new HashMap<>();
        jsonMap.put("user", "tomas JJ");
        request.doc(jsonMap);
//===============================可选参数==========================================
        request.timeout("1s");//超时时间

        //重试次数
        request.retryOnConflict(3);

        //设置在继续更新之前，必须激活的分片数
//        request.waitForActiveShards(2);
        //所有分片都是active状态，才更新
//        request.waitForActiveShards(ActiveShardCount.ALL);

//        2执行
//        同步
        UpdateResponse updateResponse = client.update(request, RequestOptions.DEFAULT);
//        异步

//        3获取数据
        updateResponse.getId();
        updateResponse.getIndex();

        //判断结果
        if (updateResponse.getResult() == DocWriteResponse.Result.CREATED) {
            DocWriteResponse.Result result = updateResponse.getResult();
            System.out.println("CREATED:" + result);
        } else if (updateResponse.getResult() == DocWriteResponse.Result.UPDATED) {
            DocWriteResponse.Result result = updateResponse.getResult();
            System.out.println("UPDATED:" + result);
        }else if(updateResponse.getResult() == DocWriteResponse.Result.DELETED){
            DocWriteResponse.Result result = updateResponse.getResult();
            System.out.println("DELETED:" + result);
        }else if (updateResponse.getResult() == DocWriteResponse.Result.NOOP){
            //没有操作
            DocWriteResponse.Result result = updateResponse.getResult();
            System.out.println("NOOP:" + result);
        }
    }
```

---

## 结合spring-boot-test测试文档删除

### rest api

```
DELETE /test_posts/_doc/3
```

### 代码

```java
 @Test
    public void testDelete() throws IOException {
//        1构建请求
        DeleteRequest request =new DeleteRequest("test_posts","3");
        //可选参数

//        2执行
        DeleteResponse deleteResponse = client.delete(request, RequestOptions.DEFAULT);

//        3获取数据
        deleteResponse.getId();
        deleteResponse.getIndex();

        DocWriteResponse.Result result = deleteResponse.getResult();
        System.out.println(result);
}
```

---

## 结合spring-boot-test测试文档bulk

rest api

```
POST /_bulk
{"action": {"metadata"}}
{"data"}
```

代码

```java
@Test
    public void testBulk() throws IOException {
//        1创建请求
        BulkRequest request = new BulkRequest();
//        request.add(new IndexRequest("post").id("1").source(XContentType.JSON, "field", "1"));
//        request.add(new IndexRequest("post").id("2").source(XContentType.JSON, "field", "2"));

        request.add(new UpdateRequest("post","2").doc(XContentType.JSON, "field", "3"));
        request.add(new DeleteRequest("post").id("1"));

//        2执行
        BulkResponse bulkResponse = client.bulk(request, RequestOptions.DEFAULT);

        for (BulkItemResponse itemResponse : bulkResponse) {
            DocWriteResponse itemResponseResponse = itemResponse.getResponse();

            switch (itemResponse.getOpType()) {
                case INDEX:
                case CREATE:
                    IndexResponse indexResponse = (IndexResponse) itemResponseResponse;
                    indexResponse.getId();
                    System.out.println(indexResponse.getResult());
                    break;
                case UPDATE:
                    UpdateResponse updateResponse = (UpdateResponse) itemResponseResponse;
                    updateResponse.getIndex();
                    System.out.println(updateResponse.getResult());
                    break;
                case DELETE:
                    DeleteResponse deleteResponse = (DeleteResponse) itemResponseResponse;
                    System.out.println(deleteResponse.getResult());
                    break;
            }
        }
    }
```

