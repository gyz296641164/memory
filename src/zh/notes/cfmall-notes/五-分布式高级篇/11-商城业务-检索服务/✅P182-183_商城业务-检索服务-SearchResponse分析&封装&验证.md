---
title: ✅P182-183_商城业务-检索服务-SearchResponse分析&封装&验证
category:
  - 谷粒商城
date: 2024-02-13
---

<!-- more -->

## 封装响应结果内容

- 返回的所有查询到的商品
- 当前所有商品涉及到的所有属性信息
- 保存当前商品所涉及的所有品牌信息
- 保存当前商品所涉及的所有分类信息
- 分页信息

---

## 实现逻辑

根据返回的 response 封装响应结果

`com.gyz.cfmall.search.service.impl.MallSearchServiceImpl#buildSearchResult`

```java
    /**
     * 构建结果数据
     * 模糊匹配，过滤（按照属性、分类、品牌，价格区间，库存），完成排序、分页、高亮,聚合分析功能
     *
     * @param response
     * @return
     */
    private SearchResult buildSearchResult(SearchResponse response, SearchParam param) {
    	SearchResult result = new SearchResult();
        //代码...
    	return result;
    }
```

### 1、封装所有查询到的商品

```java
//1、返回的所有查询到的商品
SearchHits hits = response.getHits();
List<SkuEsModel> esModels = new ArrayList<>();
//遍历所有商品信息
if (hits.getHits() != null && hits.getHits().length > 0) {
    for (SearchHit hit : hits.getHits()) {
        String sourceAsString = hit.getSourceAsString();
        SkuEsModel esModel = JSON.parseObject(sourceAsString, SkuEsModel.class);
        esModels.add(esModel);
    }
}
result.setProducts(esModels);
```

设置关键字高亮，待会测试用

```java
//1、返回的所有查询到的商品
SearchHits hits = response.getHits();
List<SkuEsModel> esModels = new ArrayList<>();
//遍历所有商品信息
if (hits.getHits() != null && hits.getHits().length > 0) {
    for (SearchHit hit : hits.getHits()) {
        String sourceAsString = hit.getSourceAsString();
        SkuEsModel esModel = JSON.parseObject(sourceAsString, SkuEsModel.class);
        //判断是否按关键字检索，若是就显示高亮，否则不显示
        if (!StringUtils.isEmpty(param.getKeyword())) {
            //拿到高亮信息显示标题
            HighlightField skuTitle = hit.getHighlightFields().get("skuTitle");
            String skuTitleValue = skuTitle.getFragments()[0].string();
            esModel.setSkuTitle(skuTitleValue);
        }
        esModels.add(esModel);
    }
}
result.setProducts(esModels);
```

### 2、封装属性信息

```java
//2、当前商品涉及到的所有属性信息
List<SearchResult.AttrVo> attrVos = new ArrayList<>();
//获取属性信息的聚合
ParsedNested attrsAgg = response.getAggregations().get("attr_agg");
ParsedLongTerms attrIdAgg = attrsAgg.getAggregations().get("attr_id_agg");
for (Terms.Bucket bucket : attrIdAgg.getBuckets()) {
    SearchResult.AttrVo attrVo = new SearchResult.AttrVo();
    //1、得到属性的id
    long attrId = bucket.getKeyAsNumber().longValue();
    attrVo.setAttrId(attrId);

    //2、得到属性的名字
    ParsedStringTerms attrNameAgg = bucket.getAggregations().get("attr_name_agg");
    String attrName = attrNameAgg.getBuckets().get(0).getKeyAsString();
    attrVo.setAttrName(attrName);

    //3、得到属性的所有值
    ParsedStringTerms attrValueAgg = bucket.getAggregations().get("attr_value_agg");
    List<String> attrValues = attrValueAgg.getBuckets().stream().map(item -> item.getKeyAsString()).collect(Collectors.toList());
    attrVo.setAttrValue(attrValues);

    attrVos.add(attrVo);
}
result.setAttrs(attrVos);
```

### 3、封装品牌信息

```java
//3、当前商品涉及到的所有品牌信息
List<SearchResult.BrandVo> brandVos = new ArrayList<>();
//获取到品牌的聚合
ParsedLongTerms brandAgg = response.getAggregations().get("brand_agg");
for (Terms.Bucket bucket : brandAgg.getBuckets()) {
    SearchResult.BrandVo brandVo = new SearchResult.BrandVo();

    //1、得到品牌的id
    long brandId = bucket.getKeyAsNumber().longValue();
    brandVo.setBrandId(brandId);

    //2、得到品牌的名字
    ParsedStringTerms brandNameAgg = bucket.getAggregations().get("brand_name_agg");
    String brandName = brandNameAgg.getBuckets().get(0).getKeyAsString();
    brandVo.setBrandName(brandName);

    //3、得到品牌的图片
    ParsedStringTerms brandImgAgg = bucket.getAggregations().get("brand_img_agg");
    String brandImg = brandImgAgg.getBuckets().get(0).getKeyAsString();
    brandVo.setBrandImg(brandImg);

    brandVos.add(brandVo);
}
result.setBrands(brandVos);
```

### 4、封装分类信息

```java
//4、当前商品涉及到的所有分类信息
//获取到分类的聚合
List<SearchResult.CatalogVo> catalogVos = new ArrayList<>();
ParsedLongTerms catalogAgg = response.getAggregations().get("catalog_agg");
for (Terms.Bucket bucket : catalogAgg.getBuckets()) {
    SearchResult.CatalogVo catalogVo = new SearchResult.CatalogVo();
    //得到分类id
    String keyAsString = bucket.getKeyAsString();
    catalogVo.setCatalogId(Long.parseLong(keyAsString));

    //得到分类名
    ParsedStringTerms catalogNameAgg = bucket.getAggregations().get("catalog_name_agg");
    String catalogName = catalogNameAgg.getBuckets().get(0).getKeyAsString();
    catalogVo.setCatalogName(catalogName);
    catalogVos.add(catalogVo);
}
result.setCatalogs(catalogVos);
```

### 5、封装页码

```java
//5、分页信息-页码
result.setPageNum(param.getPageNum());
```

### 6、封装总记录数

```java
//5、1分页信息、总记录数
long total = hits.getTotalHits().value;
result.setTotal(total);
```

### 7、封装总页数

```java
//5、2分页信息-总页码-计算
int totalPages = (int) total % EsConstant.PRODUCT_PAGESIZE == 0 ?
        (int) total / EsConstant.PRODUCT_PAGESIZE : ((int) total / EsConstant.PRODUCT_PAGESIZE + 1);
result.setTotalPages(totalPages);
```

### 8、完整代码

`cfmall-search/src/main/java/com/gyz/cfmall/search/service/impl/MallSearchServiceImpl.java`

```java
    /**
     * 构建结果数据
     * 模糊匹配，过滤（按照属性、分类、品牌，价格区间，库存），完成排序、分页、高亮,聚合分析功能
     *
     * @param response
     * @return
     */
    private SearchResult buildSearchResult(SearchResponse response, SearchParam param) {

        SearchResult result = new SearchResult();

        //1、返回的所有查询到的商品
        SearchHits hits = response.getHits();
        List<SkuEsModel> esModels = new ArrayList<>();
        //遍历所有商品信息
        if (hits.getHits() != null && hits.getHits().length > 0) {
            for (SearchHit hit : hits.getHits()) {
                String sourceAsString = hit.getSourceAsString();
                SkuEsModel esModel = JSON.parseObject(sourceAsString, SkuEsModel.class);
                esModels.add(esModel);
            }
        }
        result.setProducts(esModels);

        //2、当前商品涉及到的所有属性信息
        List<SearchResult.AttrVo> attrVos = new ArrayList<>();
        //获取属性信息的聚合
        ParsedNested attrsAgg = response.getAggregations().get("attr_agg");
        ParsedLongTerms attrIdAgg = attrsAgg.getAggregations().get("attr_id_agg");
        for (Terms.Bucket bucket : attrIdAgg.getBuckets()) {
            SearchResult.AttrVo attrVo = new SearchResult.AttrVo();
            //1、得到属性的id
            long attrId = bucket.getKeyAsNumber().longValue();
            attrVo.setAttrId(attrId);

            //2、得到属性的名字
            ParsedStringTerms attrNameAgg = bucket.getAggregations().get("attr_name_agg");
            String attrName = attrNameAgg.getBuckets().get(0).getKeyAsString();
            attrVo.setAttrName(attrName);

            //3、得到属性的所有值
            ParsedStringTerms attrValueAgg = bucket.getAggregations().get("attr_value_agg");
            List<String> attrValues = attrValueAgg.getBuckets().stream().map(item -> item.getKeyAsString()).collect(Collectors.toList());
            attrVo.setAttrValue(attrValues);

            attrVos.add(attrVo);
        }
        result.setAttrs(attrVos);

        //3、当前商品涉及到的所有品牌信息
        List<SearchResult.BrandVo> brandVos = new ArrayList<>();
        //获取到品牌的聚合
        ParsedLongTerms brandAgg = response.getAggregations().get("brand_agg");
        for (Terms.Bucket bucket : brandAgg.getBuckets()) {
            SearchResult.BrandVo brandVo = new SearchResult.BrandVo();

            //1、得到品牌的id
            long brandId = bucket.getKeyAsNumber().longValue();
            brandVo.setBrandId(brandId);

            //2、得到品牌的名字
            ParsedStringTerms brandNameAgg = bucket.getAggregations().get("brand_name_agg");
            String brandName = brandNameAgg.getBuckets().get(0).getKeyAsString();
            brandVo.setBrandName(brandName);

            //3、得到品牌的图片
            ParsedStringTerms brandImgAgg = bucket.getAggregations().get("brand_img_agg");
            String brandImg = brandImgAgg.getBuckets().get(0).getKeyAsString();
            brandVo.setBrandImg(brandImg);

            brandVos.add(brandVo);
        }
        result.setBrands(brandVos);

        //4、当前商品涉及到的所有分类信息
        //获取到分类的聚合
        List<SearchResult.CatalogVo> catalogVos = new ArrayList<>();
        ParsedLongTerms catalogAgg = response.getAggregations().get("catalog_agg");
        for (Terms.Bucket bucket : catalogAgg.getBuckets()) {
            SearchResult.CatalogVo catalogVo = new SearchResult.CatalogVo();
            //得到分类id
            String keyAsString = bucket.getKeyAsString();
            catalogVo.setCatalogId(Long.parseLong(keyAsString));

            //得到分类名
            ParsedStringTerms catalogNameAgg = bucket.getAggregations().get("catalog_name_agg");
            String catalogName = catalogNameAgg.getBuckets().get(0).getKeyAsString();
            catalogVo.setCatalogName(catalogName);
            catalogVos.add(catalogVo);
        }
        result.setCatalogs(catalogVos);

        //===============以上可以从聚合信息中获取====================//
        //5、分页信息-页码
        result.setPageNum(param.getPageNum());
        //5、1分页信息、总记录数
        long total = hits.getTotalHits().value;
        result.setTotal(total);

        //5、2分页信息-总页码-计算
        int totalPages = (int) total % EsConstant.PRODUCT_PAGESIZE == 0 ?
                (int) total / EsConstant.PRODUCT_PAGESIZE : ((int) total / EsConstant.PRODUCT_PAGESIZE + 1);
        result.setTotalPages(totalPages);

        return result;
    }
```

---

## 验证封装结果正确性

Postman测试：

- GET：`http://localhost:8400/list.html?keyword=努比亚`

在IDEA中打断点查看高亮部分是否成功赋值，

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202312/2d2ebadd0c61a1ac09e8ff8b30037790.png#id=TPk6F&originHeight=558&originWidth=939&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)
