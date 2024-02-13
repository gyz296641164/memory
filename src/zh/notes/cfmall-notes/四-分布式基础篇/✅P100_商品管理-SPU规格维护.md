---
title: ✅P100_商品管理-SPU规格维护
category:
  - 谷粒商城
date: 2024-02-13
---

<!-- more -->

## spu规格路由跳转问题

### 问题

在点击“规格”时跳转不到响应页面

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311241653532.png#id=JSddC&originHeight=499&originWidth=1668&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

### 解决

在数据库`gulimall_admin`数据库中执行以下sql

```java
INSERT INTO sys_menu (menu_id, parent_id, name, url, perms, type, icon, order_num) VALUES (76, 37, '规格维护', 'product/attrupdate', '', 2, 'log', 0);
```

在 `/src/router/index.js` 中mainRoutes对象的children属性里面加上如下内容：

```java
{ path: '/product-attrupdate', component: _import('modules/product/attrupdate'), name: 'attr-update', meta: { title: '规格维护', isTab: true } }
```

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311241655097.png#id=UxzdX&originHeight=353&originWidth=1153&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

并将 `src\views\modules\product\attrupdate.vue` 中的 `<el-select>` 标签中的 `:multiple="attr.valueType == 1"` 属性删除

```java
 				 <el-select
                    v-model="dataResp.baseAttrs[gidx][aidx].attrValues"
                    :multiple="attr.valueType == 1"
                    filterable
                    allow-create
                    default-first-option
                    placeholder="请选择或输入值"
                  >
```

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311241657172.png#id=GrP2r&originHeight=267&originWidth=444&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

---

## 获取spu规格

### 接口信息

#### 接口地址

```shell
GET	product/attr/base/listforspu/{spuId}
```

#### 响应数据

```json
{
	"msg": "success",
	"code": 0,
	"data": [{
		"id": 43,
		"spuId": 11,
		"attrId": 7,
		"attrName": "入网型号",
		"attrValue": "LIO-AL00",
		"attrSort": null,
		"quickShow": 1
	}]
}
```

### 后端代码

`cfmall-product/src/main/java/com/gyz/cfmall/product/controller/AttrController.java`

```java
    /**
     *  获取spu规格
     */
    @GetMapping("/base/listforspu/{spuId}")
    public R baseAttrlistforspu(@PathVariable("spuId") Long spuId) {

        List<ProductAttrValueEntity> entities = productAttrValueService.baseAttrListforspu(spuId);

        return R.ok().put("data", entities);
    }
```

`cfmall-product/src/main/java/com/gyz/cfmall/product/service/impl/ProductAttrValueServiceImpl.java`

```java
    @Override
    public List<ProductAttrValueEntity> baseAttrListforspu(Long spuId) {

        List<ProductAttrValueEntity> attrValueEntityList = this.baseMapper.selectList(
                new QueryWrapper<ProductAttrValueEntity>().eq("spu_id", spuId));

        return attrValueEntityList;
    }
```

---

## 修改商品规格

### 接口信息

#### 接口地址

```shell
POST	product/attr/update/{spuId}
```

#### 请求参数

```shell
[{
	"attrId": 7,
	"attrName": "入网型号",
	"attrValue": "LIO-AL00",
	"quickShow": 1
}, {
	"attrId": 14,
	"attrName": "机身材质工艺",
	"attrValue": "玻璃",
	"quickShow": 0
}, {
	"attrId": 16,
	"attrName": "CPU型号",
	"attrValue": "HUAWEI Kirin 980",
	"quickShow": 1
}]
```

#### 响应数据

```shell
{
	"msg": "success",
	"code": 0
}
```

### 后端代码

`cfmall-product/src/main/java/com/gyz/cfmall/product/controller/AttrController.java`

```java
    ///product/attr/update/{spuId}
    @PostMapping("/update/{spuId}")
    public R updateSpuAttr(@PathVariable("spuId") Long spuId,
                           @RequestBody List<ProductAttrValueEntity> entities){

        productAttrValueService.updateSpuAttr(spuId,entities);

        return R.ok();
    }
```

```
void updateSpuAttr(Long spuId, List<ProductAttrValueEntity> entities);
```

`cfmall-product/src/main/java/com/gyz/cfmall/product/service/impl/ProductAttrValueServiceImpl.java`

```java
    /**
     * 修改商品规格
     * @param spuId
     * @param entities
     */
    @Transactional(rollbackFor = Exception.class)
    @Override
    public void updateSpuAttr(Long spuId, List<ProductAttrValueEntity> entities) {
        //1、删除spuId之前对应的所有属性
        this.baseMapper.delete(new QueryWrapper<ProductAttrValueEntity>().eq("spu_id", spuId));

        //2、添加商品规格信息
        List<ProductAttrValueEntity> collect = entities.stream().map(item -> {
            item.setSpuId(spuId);
            return item;
        }).collect(Collectors.toList());

        //批量新增
        this.saveBatch(collect);
    }
```
