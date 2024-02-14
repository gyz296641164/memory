---
title: ✅P209_商城业务-商品详情-sku组合切换
category:
  - 谷粒商城
date: 2024-02-14
---

<!-- more -->

## 实现步骤

1. 为点击的元素添加上自定义的属性，为了识别是刚被点击的
2. 封装当前被点击元素的skuIds
3. 去掉同一行中的checked
4. 封装其它被选中元素的skuIds
5. 求交集
6. 路径跳转

`cfmall-product/src/main/resources/templates/item.html`

```html
<script>
	$(".sku_attr_value").click(function () {
		var skus = new Array();
		//1、为点击的元素添加自定义属性，为了识别刚被点击
		$(this).addClass("clicked");
		//2、获取当前点击的skuIds
		var curr = $(this).attr("skus").split(",");
		skus.push(curr);
		//3、去掉同一行中的checked
		$(this).parent().parent().find(".sku_attr_value").removeClass("checked");
		//4、封装其它被选中元素的skuIds
		$("a[class='sku_attr_value checked']").each(function () {
			skus.push($(this).attr("skus").split(","));
		});
		console.log(skus);
		//5、求交集
		let filterEle = skus[0];
		for (let i = 1; i < skus.length; i++) {
			filterEle = $(filterEle).filter(skus[i]);
		}
		console.log(filterEle);
		//6、路径跳转
		location.href = "http://item.cfmall.com/" + filterEle[0] + ".html";
	});

	$(function () {
		$(".sku_attr_value").parent().css({"border": "solid 1px #CCC"});
		$("a[class='sku_attr_value checked']").parent().css({"border": "solid 1px red"});
	});
</script>
```

---

## 实现效果

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202312/cad1ab144af92ed62d988a5f89ce7918.gif#id=hVNU4&originHeight=375&originWidth=720&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

注意：在测试时，千万保证数据库不要有脏数据，否则销售属性显示会有问题，条件组合也会显示失败。
