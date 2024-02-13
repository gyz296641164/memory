---
title: ✅P70_商品服务-概念-SPU-SKU-规格参数-销售属性
category:
  - 谷粒商城
date: 2024-02-13
---

<!-- more -->

自己整理的原件搞丢了，参考下面文章吧！

---

## 什么是SPU

Standard Product Unit(标准化产品单元)：是商品信息聚合的最小单位，是一组可复用、易检索的标注化信息的集合，该集合描述了一个产品的特征

例如：Apple iPhone 13 就是一个SPU

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202402/1cc028e74eb8b23a.png#id=UtzFg&originHeight=791&originWidth=1369&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

存放SPU的表结构：pms_spu_info

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202402/ab18afc80fc19eea.png#id=yGv1Z&originHeight=404&originWidth=1044&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

---

## 什么是SKU

Stock Keeping Unit(库存量单位)，即库存进出计量的基本单位，可以是件，盒，托盘等为单位。现在已经被引申为产品统一编号的简称，每种产品均对应有唯一的SKU号

例如：Apple iPhone 13 粉色 256G 可以确定商品的价格和库存的集合我们称为SPU

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202402/fa7681327fd8de7e.png#id=yQ9Yn&originHeight=812&originWidth=1414&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

存放SKU的表结构：pms_sku_info

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202402/3347d9c0222b281f.png#id=OV2Fs&originHeight=435&originWidth=1033&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

这就好像SKU是一个类，SPU就是这个类中的一个个对象

---

## 规格参数

例如：手机分类下的产品都会有一个规格与包装属性，也就是我们常说的规格参数

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202402/cb89c848d20b21d5.png#id=VSE6k&originHeight=1259&originWidth=989&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

规格参数由**属性组**和**属性**组成

左侧第一栏即**属性组**，中间一栏即**属性**，右侧一栏即**属性的值**

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202402/e0b98d16fea8ca99.png#id=XooGh&originHeight=455&originWidth=1117&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

属性组的数据库中表的结构：pms_attr_group

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202402/c79f1054ccb9596b.png#id=IPwhl&originHeight=356&originWidth=1117&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

通过catlog_id来关联属于那个商品分类

属性的数据库中表的结构：pms_attr

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202402/2def3e54997d2b2b.png#id=F579t&originHeight=400&originWidth=1305&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

关联属性组和属性的数据库中表结构： pms_attr_attrgroup_relation

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202402/52fefe4f270a6eda.png#id=vNtpW&originHeight=310&originWidth=986&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

---

## 销售属性

以下括起来的都是销售属性

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202402/55cedad9236e3f57.png#id=JColf&originHeight=803&originWidth=1338&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

每个分类下的商品共享规格参数和销售属性，只是有些商品不一定要用这个分类下全部的属性。

**说明：**

1. 属性是以三级分类组织起来的
2. 规格参数中有些是可以提供检索的
3. 规格参数也是基本属性，他们具有自己的分组
4. 属性的分组也是由三级分类组织起来的
5. 属性名确定的，但是值每一个商品不同来决定的

---

## 三级分类-属性组-属性的关联关系

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202402/9175e6e8aa65d646.png#id=NmV6F&originHeight=378&originWidth=794&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

---

## SPU-属性&SKU-属性的关联关系

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202402/f0475730dea5c449.png#id=QuwXU&originHeight=393&originWidth=799&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

---

## 预期效果

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202402/dd3a9a57042d17a7.png#id=stt3M&originHeight=594&originWidth=1192&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)
