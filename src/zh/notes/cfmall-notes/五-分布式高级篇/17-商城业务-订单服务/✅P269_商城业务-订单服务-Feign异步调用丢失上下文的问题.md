> **续：订单确认页业务逻辑**


使用异步编排，各个任务彼此之间互不相关，但是需要等待各个任务处理完成

```java
    @Autowired
    private ThreadPoolExecutor threadPoolExecutor;

	@Override
    public OrderConfirmVo confirmOrder() throws ExecutionException, InterruptedException {
        //构建OrderConfirmVo
        OrderConfirmVo confirmVo = new OrderConfirmVo();
        //获取当前用户登录的信息
        MemberResponseVo memberResponseVo = LoginUserInterceptor.loginUser.get();

        //开启第一个异步任务
        CompletableFuture<Void> addressFuture = CompletableFuture.runAsync(() -> {
            //1、远程查询所有的收获地址列表
            List<MemberAddressVo> address = memberFeignService.getAddress(memberResponseVo.getId());
            confirmVo.setMemberAddressVos(address);
        }, threadPoolExecutor);

        //开启第二个异步任务
        CompletableFuture<Void> cartInfoFuture = CompletableFuture.runAsync(() -> {
            //2、远程查询购物车所有选中的购物项
            List<OrderItemVo> currentCartItems = cartFeignService.getCurrentCartItems();
            confirmVo.setItems(currentCartItems);
        }, threadPoolExecutor);
        //3、查询用户积分
        Integer integration = memberResponseVo.getIntegration();
        confirmVo.setIntegration(integration);
        //4、等待任务执行完成
        CompletableFuture.allOf(addressFuture, cartInfoFuture).get();

        return confirmVo;
    }
```

出现问题： 异步任务执行远程调用时会丢失请求上下文，oldRequest会为null

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202401/579d6194838482ad05578170b1a804c1.png#id=ZE8oQ&originHeight=692&originWidth=1345&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

> **问题原因**


由于`RequestContextHolder`底层使用的是`ThreadLocal<RequestAttributes>`存储请求对象，线程共享数据的域是当前线程下，线程之间是不共享的。所以在开启异步后，异步线程获取不到主线程请求的信息，自然也就无法共享cookie。

> **解决方案**


![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202401/ccf0d4dfb7a6771de36c8856ef17a3f7.png#id=qVwzh&originHeight=532&originWidth=963&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

每个新建的线程都设置之前请求的信息

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202401/ca020f734ef0126bcbb759cce58f0c83.png#id=i0Mwn&originHeight=916&originWidth=982&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)
