## 目前问题

不断刷新“购物车” 页面，会不断发请求，数量会不断增长：

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202401/b3905e96d34076b5d4c9c27d6484108a.png#id=AZ5Zh&originHeight=340&originWidth=1357&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

---

## 问题解决

解决方法：

- 以前商品添加到购物车会跳转到“购物车列表” 页面，现在我们修改成重定向到另一个接口，查询跳转到成功页面的数据

### Controller

`cfmall-cart/src/main/java/com/gyz/cfmall/controller/CartController.java`

RedirectAttributes的`addFlashAttribut()`方法：将对象存储在Session中且只能使用一次，再次刷新就消失

RedirectAttributes的`addAttribut()`方法：将对象拼接在url中

```java
    @GetMapping("/addCartItem")
    public String addCartItem(@RequestParam("skuId") Long skuId,
                              @RequestParam("num") Integer num,
                              Model model,
                              RedirectAttributes redirectAttributes) throws ExecutionException, InterruptedException {
        CartItemVo cartItemVo = cartService.addCartItem(skuId, num);
        redirectAttributes.addAttribute("skuId", skuId);
        return "redirect:http://cart.cfmall.com/addCartItmSuccess.html";
    }

    @GetMapping("/addCartItmSuccess.html")
    public String addCartItmSuccess(@RequestParam("skuId") Long skuId, Model model) {
        CartItemVo cartItemOne = cartService.getCartItem(skuId);
        model.addAttribute("cartItem", cartItemOne);
        return "success";
    }
```

### Service

`cfmall-cart/src/main/java/com/gyz/cfmall/service/impl/CartServiceImpl.java`

```java
@Override
public CartItemVo getCartItem(Long skuId) {
    //拿到要操作的购物车信息
    BoundHashOperations<String, Object, Object> cartOps = getCartOpts();

    String redisValue = (String) cartOps.get(skuId.toString());

    CartItemVo cartItemVo = JSON.parseObject(redisValue, CartItemVo.class);

    return cartItemVo;
}
```

### success.html

`cfmall-cart/src/main/resources/templates/success.html`

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202401/7e1fec87624fb7d35d24a24446b01f0e.png#id=O0VEr&originHeight=381&originWidth=759&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

```html
<div th:if="${cartItem==null}" class="mc success-cont">
    <h2>购物车中无此商品</h2>
    <a href="http://cfmall.com/">去购物</a>
</div>
```

---

## 效果演示

不断刷新购物车页面，数量始终不变

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202401/1d022aef1959488922fb076d7ae58859.gif#id=gUWvu&originHeight=348&originWidth=1048&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)
