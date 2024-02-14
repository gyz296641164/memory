## 问题分析

问题：Feign远程调用的时候会丢失请求头

原因：远程调用是一个新的请求，不携带之前请求的cookie，导致购物车服务得不到请求头cookie里的登录信息。

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202401/59b8e452fa95d51457cd73847055a73a.png#id=CNWzm&originHeight=383&originWidth=957&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

解决：Feign在创建RequestTemplate之前会调用很多RequestInterceptor，可以利用RequestInterceptor将cookie信息携带

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202401/911a42f2d412259f2deee98e91d0f6a8.png#id=EQiPf&originHeight=519&originWidth=942&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

---

## 配置类

新请求同步cookie到请求头里

`cfmall-order/src/main/java/com/gyz/cfmall/order/config/CfFeignConfig.java`

```java
package com.gyz.cfmall.order.config;

import feign.RequestInterceptor;
import feign.RequestTemplate;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import javax.servlet.http.HttpServletRequest;

/**
 * @author gong_yz
 * @Description
 * @Date 2024-01-09
 */
@Configuration
public class CfFeignConfig {
    @Bean
    public RequestInterceptor requestInterceptor() {
        return new RequestInterceptor() {
            @Override
            public void apply(RequestTemplate requestTemplate) {
                //1、使用RequestContextHolder拿到刚进来的请求数据
                ServletRequestAttributes requestAttributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();

                if (requestAttributes != null) {
                    //老请求
                    HttpServletRequest request = requestAttributes.getRequest();
                    if (request != null) {
                        //2、同步请求头的数据（主要是cookie）
                        //把老请求的cookie值放到新请求上来，进行一个同步
                        String cookie = request.getHeader("Cookie");
                        requestTemplate.header("Cookie", cookie);
                    }
                }
            }
        };
    }
}
```
