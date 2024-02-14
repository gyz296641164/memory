## 问题解决

调用 `GET http://localhost:8900/toTrade` 接口，

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202401/b92b8f1d1193873b71778fdc11cb813f.png#id=NhxnO&originHeight=331&originWidth=875&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

报错：feign.FeignException$InternalServerError: status 500 reading CartFeignService#getCurrentCartItems()

解决：getCurrentCartItems()方法上加@ResponseBody注解，让数据以JSON形式返回，

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202401/cefe620742298cb82a8ec94c0c50831b.png#id=BAEkY&originHeight=359&originWidth=707&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

---

## @ResponseBody用法详解

### 概念性理解

[@ResponseBody ](/ResponseBody ) 注解的作用是将Controller的方法返回的对象，通过适当的转换器转换为指定的格式之后，写入到response对象的body区，通常用来返回JSON数据或者是XML数据。 

### 本质

@ResponseBody的作用其实是将java对象转为json格式的数据，然后直接写入HTTP response 的body中；一般在异步获取数据时使用

### 注意

在使用此注解之后不会再走视图处理器，而是直接将数据写入到输入流中，他的效果等同于通过response对象输出指定格式的数据。

- [@ResponseBody ](/ResponseBody ) 是作用在方法上的； 
- [@ResponseBody ](/ResponseBody ) 表示该方法的返回结果直接写入 HTTP response body中，一般在异步获取数据时使用【也就是AJAX】； 

在使用 @RequestMapping后，返回值通常解析为跳转路径，但是加上 [@ResponseBody ](/ResponseBody ) 后返回结果不会被解析为跳转路径，而是直接写入 HTTP response body 中。 比如异步获取 json 数据，加上 [@ResponseBody ](/ResponseBody ) 后，会直接返回 json 数据。[@RequestBody ](/RequestBody ) 将 HTTP 请求正文插入方法中，使用适合的HttpMessageConverter 将请求体写入某个对象。 
