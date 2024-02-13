---
title: ✅P109_全文检索-bulk批量操作导入样本测试数据
category:
  - 谷粒商城
date: 2024-02-13
---

<!-- more -->

## bulk-批量操作数据

### 语法格式

```shell
{ action: { metadata }}\n
{ request body }\n
{ action: { metadata }}\n
{ request body }\n
```

### 测试bulk 批量操作数据

在Kibana中使用`dev-tools`测试批量数据，测试地址：[http://192.168.17.130:5601/](http://192.168.17.130:5601/)

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311271518786.png#id=iRbQ5&originHeight=922&originWidth=784&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311271518899.png#id=yGjE1&originHeight=580&originWidth=233&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

插入批量数据：

```json
POST customer/external/_bulk

{"index":{"_id":"1"}}
{"name": "John Doe" }
{"index":{"_id":"2"}}
{"name": "Jane Doe" }
```

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311241731605.png#id=FhlPB&originHeight=903&originWidth=1920&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

### 复杂实例

```json
POST /_bulk
{ "delete": { "_index": "website", "_type": "blog", "_id": "123" }}
{ "create": { "_index": "website", "_type": "blog", "_id": "123" }}
{ "title": "My first blog post" }
{ "index": { "_index": "website", "_type": "blog" }}
{ "title": "My second blog post" }
{ "update": { "_index": "website", "_type": "blog", "_id": "123"}}
{ "doc" : {"title" : "My updated blog post"}}
```

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311241731654.png#id=nyslb&originHeight=903&originWidth=1920&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

- bulk API 以此按顺序执行所有的 action（动作） 。
- 如果一个单个的动作因任何原因而失败，它将继续处理它后面剩余的动作。
- 当 bulk API 返回时， 它将提供每个动作的状态（与发送的顺序相同） ， 所以您可以检查是否一个指定的动作是不是失败了。

---

## 导入样本测试数据

准备一份顾客银行账户信息的虚构的 JSON 文档样本。 每个文档都有下列的 schema（模式） :

```json
{
"account_number": 0,
"balance": 16623,
"firstname": "Bradshaw",
"lastname": "Mckenzie",
"age": 29,
"gender": "F",
"address": "244 Columbus Place",
"employer": "Euron",
"email": "bradshawmckenzie@euron.com",
"city": "Hobucken",
"state": "CO"
}
```

> 接口：`POST bank/account/_bulk`


> 测试数据获取：[https://github.com/elastic/elasticsearch/blob/v7.4.2/docs/src/test/resources/accounts.json](https://github.com/elastic/elasticsearch/blob/v7.4.2/docs/src/test/resources/accounts.json)


如果从Github下载失败，点击此处获取：[bulk测试数据.txt](https://www.yuque.com/attachments/yuque/0/2023/txt/22392275/1701071193871-4020be77-8f75-438b-9b02-bff901d4ace9.txt?_lake_card=%7B%22src%22%3A%22https%3A%2F%2Fwww.yuque.com%2Fattachments%2Fyuque%2F0%2F2023%2Ftxt%2F22392275%2F1701071193871-4020be77-8f75-438b-9b02-bff901d4ace9.txt%22%2C%22name%22%3A%22bulk%E6%B5%8B%E8%AF%95%E6%95%B0%E6%8D%AE.txt%22%2C%22size%22%3A244846%2C%22ext%22%3A%22txt%22%2C%22source%22%3A%22%22%2C%22status%22%3A%22done%22%2C%22download%22%3Atrue%2C%22type%22%3A%22text%2Fplain%22%2C%22taskId%22%3A%22u8192805b-1247-4bbe-9456-ed8de6ee4eb%22%2C%22taskType%22%3A%22upload%22%2C%22mode%22%3A%22title%22%2C%22id%22%3A%22u3e90cdf7%22%2C%22card%22%3A%22file%22%7D)

注意：粘贴到Dev Tools后不要格式化，直接执行即可，否则报错！

快捷键：

- 快速定位到Dev Tools末尾：`Ctrl + End`
- 快速定位到Dev Tools开头：`Ctrl + Home`

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311241732026.png#id=VSWXG&originHeight=903&originWidth=1920&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)
