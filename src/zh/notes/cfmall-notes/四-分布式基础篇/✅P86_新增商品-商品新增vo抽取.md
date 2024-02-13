---
title: ✅P86_新增商品-商品新增vo抽取
category:
  - 谷粒商城
date: 2024-02-13
---

<!-- more -->

## 商品新增页面操作

1、填写基本信息

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311221106382.png#id=eDZMi&originHeight=860&originWidth=1092&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

2、设置基本参数

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311221359003.png#id=LIJqd&originHeight=281&originWidth=527&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

3、设置销售属性，

4、设置sku信息

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311221401006.png#id=KxGAf&originHeight=801&originWidth=1450&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

5、保存商品信息

点击“下一步：保存商品信息”后，控制台打印请求数据如下，

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311221415944.png#id=EknoI&originHeight=317&originWidth=1894&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

转化JSON结果：

```json
{
	"spuName": "Apple iPhone 15 Pro Max",
	"spuDescription": "Apple iPhone 15 Pro Max (A3108) 256GB 原色钛金属 支持移动联通电信5G 双卡双待手机",
	"catalogId": 225,
	"brandId": 3,
	"weight": 0.5,
	"publishStatus": 0,
	"decript": ["https://cfmall-hello.oss-cn-beijing.aliyuncs.com/2023-11-22/eb2f5142-7bb2-448f-86cd-3a04c0f14a63_73366cc235d68202.jpg"],
	"images": ["https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/others/2023-11-22/5e3d0a82-4496-4d45-8820-2b3f03a23c4d_e3284f319e256a5d.jpg", "https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/others/2023-11-22/8a0abc4f-bad1-4766-84fb-399a5a73334d_e07b540657023162.jpg"],
	"bounds": {
		"buyBounds": 0,
		"growBounds": 0
	},
	"baseAttrs": [{
		"attrId": 2,
		"attrValues": "5.5",
		"showDesc": 1
	}, {
		"attrId": 6,
		"attrValues": "白",
		"showDesc": 1
	}],
	"skus": [{
		"attr": [{
			"attrId": 5,
			"attrName": "上市年份",
			"attrValue": "2018,2019"
		}],
		"skuName": "Apple iPhone 15 Pro Max 2018,2019",
		"price": "6000",
		"skuTitle": "Apple iPhone 15 Pro Max 2018,2019",
		"skuSubtitle": "双卡双待手机",
		"images": [{
			"imgUrl": "https://cfmall-hello.oss-cn-beijing.aliyuncs.com/images/others/2023-11-22/5e3d0a82-4496-4d45-8820-2b3f03a23c4d_e3284f319e256a5d.jpg",
			"defaultImg": 1
		}, {
			"imgUrl": "",
			"defaultImg": 0
		}],
		"descar": ["2018,2019"],
		"fullCount": 50,
		"discount": 0.09,
		"countStatus": 0,
		"fullPrice": 50000,
		"reducePrice": 500,
		"priceStatus": 0,
		"memberPrice": [{
			"id": 1,
			"name": "普通会员",
			"price": 5500
		}, {
			"id": 2,
			"name": "金牌会员",
			"price": 5000
		}]
	}]
}
```

将解析的JSON数据转化为JavaBean即我们需要的VO

---

## 新增VO

将上面JSON数据结构转化为JavaBaen，工具：[在线JSON字符串转Java实体类(JavaBean、Entity)](http://www.ab173.com/gongju/json/json2javapojo.php)

将生成的JavaBean复制到项目中，并且将可能值为小数的属性的数据类型改为BigDecimal，将id改为Long

`cfmall-product` 服务`com.gyz.cfmall.product.vo`新增如下VO：

- `BaseAttrs.java`
- `Bounds.java`
- `Images.java`
- `MemberPrice.java`
- `Skus.java`
- `SpuSaveVo.java``
- `Attr.java`



---

## 问题

**问题描述：**

在“发布商品”页面填写信息时浏览器控制台报错：

Unchecked runtime.lastError: The message port closed before a response was received.

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311221328901.png#id=VFB7t&originHeight=392&originWidth=809&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

经过查找后发现是迅雷插件扩展造成的，把它关闭之后就好了，大家注意一下，也有可能不是迅雷，主要原因可能还是插件写法问题，异步未结束就开始了新的导致的，加一段这个就行 if(chrome.runtime.lastError){}，所以其他插件也有可能代码不严谨、规范，同样也会报这样的错误。

Chrome 浏览器的扩展程序在运行时报错。具体的说，是在调用chrome.runtime.sendMessage() 或 chrome.runtime.sendNativeMessage() 时触发这个报错。

**解决方法：**

在 Chrome 浏览器中访问 chrome://extensions/ 打开扩展程序界面，逐个关闭扩展以排查出问题所在。

已知会引起这个问题的插件：

- 1Password
- Pinterest
- 迅雷下载支持3.32
- jsonView
- 油猴插件

一般要不升级扩展程序，安装最新版本的扩展，要不就关闭扩展就可以了。
