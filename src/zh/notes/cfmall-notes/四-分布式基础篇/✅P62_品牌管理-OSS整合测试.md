---
title: ✅P62_品牌管理-OSS整合测试
category:
  - 谷粒商城
date: 2024-02-13
---

<!-- more -->

## 对象存储 OSS-SDK示例

将如下代码粘贴至测试方法：

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311101820180.png#id=QTOG6&originHeight=769&originWidth=1574&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

其中 **Endpoint（地域节点）**为红色框所示：

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311101820137.png#id=cyK6s&originHeight=757&originWidth=1864&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

## 开通阿里云账号AccessKey

点击“Accesskey管理”：

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311131530383.png#id=pBrfl&originHeight=422&originWidth=1704&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

新建子账号：

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311101821179.png#id=VSciC&originHeight=263&originWidth=644&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

勾选“Open API调用访问”，生成 **AccessKeyId **和**AccessKeySecret **

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311101822209.png#id=jmm9T&originHeight=501&originWidth=949&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

分配权限：

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311101824841.png#id=hN8aM&originHeight=649&originWidth=1616&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

> 如果提示：
> - 阿里云账号AccessKey拥有所有API的访问权限，风险很高。强烈建议您创建并使用RAM用户进行API访问或日常运维，请登录RAM控制台创建RAM用户。
> - 言外之意就是别用阿里云账号的AccessKey。
> 
操作：
> 1. 登录[RAM控制台](https://ram.console.aliyun.com/)。
> 2. 在左侧导航栏，选择**身份管理 > 用户**。
> 3. 在**用户**页面，单击目标RAM用户名称。
> 4. 在**用户AccessKey**区域，单击**创建AccessKey**。
> 5. 根据界面提示完成安全验证。
> 6. 在**创建AccessKey**对话框，查看AccessKey ID和AccessKey Secret。您可以单击**下载CSV文件**，下载AccessKey信息。单击**复制**，复制AccessKey信息。


---

## 测试上传

测试代码：`cfmall-product/src/test/java/com/gyz/cfmall/product/CfmallProductApplicationTests.java`

```javascript
    @Test
    public void testUpload() throws FileNotFoundException {
        // yourEndpoint填写Bucket所在地域对应的Endpoint。以华东1（杭州）为例，Endpoint填写为https://oss-cn-hangzhou.aliyuncs.com。
        String endpoint = "oss-cn-beijing.aliyuncs.com";
        // 阿里云账号AccessKey拥有所有API的访问权限，风险很高。强烈建议您创建并使用RAM用户进行API访问或日常运维，请登录RAM控制台创建RAM用户。
        String accessKeyId = "填写自己的accessKeyId";
        String accessKeySecret = "填写自己的accessKeySecret";

        // 创建OSSClient实例。
        OSS ossClient = new OSSClientBuilder().build(endpoint, accessKeyId, accessKeySecret);

        // 填写本地文件的完整路径。如果未指定本地路径，则默认从示例程序所属项目对应本地路径中上传文件流。
        InputStream inputStream = new FileInputStream("E:\\SSM_study\\picture\\center.jpg");
        // 依次填写Bucket名称（例如examplebucket）和Object完整路径（例如exampledir/exampleobject.txt）。Object完整路径中不能包含Bucket名称。
        ossClient.putObject("cfmall-hello", "center.jpg", inputStream);

        // 关闭OSSClient。
        ossClient.shutdown();
        System.out.println("上传完成");
    }
```

上传成功：

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311101826783.png#id=ZUVaJ&originHeight=456&originWidth=1916&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

正常访问：

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311101827751.png#id=Rqqjk&originHeight=46&originWidth=687&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

---

## 使用 [SpringCloud Alibaba-OSS](https://www.aliyun.com/product/oss)

> [阿里云OSS案例](https://github.com/alibaba/aliyun-spring-boot/tree/master/aliyun-spring-boot-samples/aliyun-oss-spring-boot-sample)


`cfmall-common` 工程引入OSS的jar

```xml
<!-- https://mvnrepository.com/artifact/com.alibaba.cloud/spring-cloud-starter-alicloud-oss -->
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alicloud-oss</artifactId>
    <version>2.2.0.RELEASE</version>
</dependency>
```

在 `cfmall-product`的 `application.yml`中配置 accessKeyId、secretAccessKey 和 endpoint。

```yaml
spring:
  datasource:
   ......
  cloud:
    nacos:
      discovery:
        server-addr: 127.0.0.1:8848
    alicloud:
      access-key:  AccessKey ID
      secret-key:  AccessKey Secret
      oss:
        endpoint: oss-cn-beijing.aliyuncs.com
```

测试代码：
`cfmall-product/src/test/java/com/gyz/cfmall/product/CfmallProductApplicationTests.java`
```java
	@Autowired
	OSSClient ossClient;

	@Test
    public void testUpload() throws FileNotFoundException {
        // 填写本地文件的完整路径。如果未指定本地路径，则默认从示例程序所属项目对应本地路径中上传文件流。
        InputStream inputStream = new FileInputStream("E:\\SSM_study\\picture\\lala.jpg");
        // 依次填写Bucket名称（例如examplebucket）和Object完整路径（例如exampledir/exampleobject.txt）。Object完整路径中不能包含Bucket名称。
        ossClient.putObject("cfmall-hello", "lala.jpg", inputStream);

        // 关闭OSSClient。
        ossClient.shutdown();
        System.out.println("上传完成");
    }
```

上传成功

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311101830687.png#id=ys0Wa&originHeight=478&originWidth=1913&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)
