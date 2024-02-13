---
title: ✅P180_商城业务-检索服务-SearchRquest构建-排序-分页-高亮&测试
category:
  - 谷粒商城
date: 2024-02-13
---

<!-- more -->

**SearchRequest构建-排序、分页、高亮**

```
{@link MallSearchServiceImpl#buildSearchQuest(com.gyz.cfmall.search.vo.SearchParam)}
```

---

## 1、构建排序

```java
//排序,形式为sort=hotScore_asc/desc
if (!StringUtils.isEmpty(param.getSort())) {
    String sort = param.getSort();
    String[] sortFileds = sort.split("_");
    SortOrder sortOrder = "asc".equalsIgnoreCase(sortFileds[1]) ? SortOrder.ASC : SortOrder.DESC;
    searchSourceBuilder.sort(sortFileds[0], sortOrder);
}
```

---

## 2、构建分页

默认页码为1，页码大小为2方便测试

```java
//分页
searchSourceBuilder.from((param.getPageNum() - 1) * EsConstant.PRODUCT_PAGESIZE);
searchSourceBuilder.size(EsConstant.PRODUCT_PAGESIZE);
```

```java
public class EsConstant {

    //在es中的索引
    public static final String PRODUCT_INDEX = "cfmall_product";

    public static final Integer PRODUCT_PAGESIZE = 2;
}
```

---

## 3、构建高亮

```java
//高亮
if (!StringUtils.isEmpty(param.getKeyword())) {
    HighlightBuilder highlightBuilder = new HighlightBuilder();
    highlightBuilder.field("skuTitle");
    highlightBuilder.preTags("<b style='color:red'>");
    highlightBuilder.postTags("</b>");
    searchSourceBuilder.highlighter(highlightBuilder);
}
```

---

## 4、完整代码

`cfmall-search/src/main/java/com/gyz/cfmall/search/service/impl/MallSearchServiceImpl.java`

```java
/**
 * 准备检索请求。dsl语句构建参考：dsl.json
 * 模糊匹配，过滤（按照属性，分类，品牌，价格区间，库存），排序，分页，高亮，聚合分析
 * GET请求参数：keyword=小米&sort=saleCount_desc/asc&hasStock=0/1&skuPrice=400_1900&brandId=1&catalog3Id=1&attrs=1_3G:4G:5G&attrs=2_骁龙845&attrs=4_高清屏
 *
 * @return
 */
private SearchRequest buildSearchQuest(SearchParam param) {
    SearchSourceBuilder searchSourceBuilder = new SearchSourceBuilder();
    /**
     * 一、模糊匹配，过滤（按照属性，分类，品牌，价格区间，库存）
     */
    // 1.构建bool查询
    BoolQueryBuilder boolQueryBuilder = new BoolQueryBuilder();

    //2. 构建must查询
    if (!org.springframework.util.StringUtils.isEmpty(param.getKeyword())) {
        boolQueryBuilder.must(QueryBuilders.matchQuery("skuTitle", param.getKeyword()));
    }

    //3. 构建filter中三级分类查询
    if (null != param.getCatalog3Id()) {
        boolQueryBuilder.filter(QueryBuilders.termQuery("catalogId", param.getCatalog3Id()));
    }

    //4.构建filter中的品牌查询
    if (null != param.getBrandId() && param.getBrandId().size() > 0) {
        boolQueryBuilder.filter(QueryBuilders.termsQuery("brandId", param.getBrandId()));
    }

    //5.构建filter中的库存查询
    if (StringUtils.isNotEmpty(String.valueOf(param.getHasStock()))) {
        boolQueryBuilder.filter(QueryBuilders.termQuery("hasStock", param.getHasStock() == 1 ? true : false));
    }

    //6.构建filter中的价格区间查询
    if (!org.springframework.util.StringUtils.isEmpty(param.getSkuPrice())) {
        //skuPrice形式为：1_500或_500或500_
        RangeQueryBuilder rangeQueryBuilder = QueryBuilders.rangeQuery("skuPrice");
        String[] price = param.getSkuPrice().split("_");
        if (price.length == 2) {
            rangeQueryBuilder.gte(price[0]).lte(price[1]);
        } else if (price.length == 1) {
            if (param.getSkuPrice().startsWith("_")) {
                rangeQueryBuilder.lte(price[1]);
            }
            if (param.getSkuPrice().endsWith("_")) {
                rangeQueryBuilder.gte(price[0]);
            }
        }
        boolQueryBuilder.filter(rangeQueryBuilder);
    }

    //7. 构建filter中的属性查询
    if (param.getAttrs() != null && param.getAttrs().size() > 0) {
        param.getAttrs().forEach(item -> {
            //attrs=1_5寸:8寸&2_16G:8G
            BoolQueryBuilder boolQuery = QueryBuilders.boolQuery();
            //attrs=1_5寸:8寸
            String[] s = item.split("_");
            String attrId = s[0];
            String[] attrValues = s[1].split(":");//这个属性检索用的值
            boolQuery.must(QueryBuilders.termQuery("attrs.attrId", attrId));
            boolQuery.must(QueryBuilders.termsQuery("attrs.attrValue", attrValues));

            NestedQueryBuilder nestedQueryBuilder = QueryBuilders.nestedQuery("attrs", boolQuery, ScoreMode.None);
            boolQueryBuilder.filter(nestedQueryBuilder);
        });
    }

    //封装所有的查询条件
    searchSourceBuilder.query(boolQueryBuilder);

    /**
     * 二、排序，分页，高亮
     */

    //排序,形式为sort=hotScore_asc/desc
    if (!StringUtils.isEmpty(param.getSort())) {
        String sort = param.getSort();
        String[] sortFileds = sort.split("_");
        SortOrder sortOrder = "asc".equalsIgnoreCase(sortFileds[1]) ? SortOrder.ASC : SortOrder.DESC;
        searchSourceBuilder.sort(sortFileds[0], sortOrder);
    }

    //分页
    searchSourceBuilder.from((param.getPageNum() - 1) * EsConstant.PRODUCT_PAGESIZE);
    searchSourceBuilder.size(EsConstant.PRODUCT_PAGESIZE);

    //高亮
    if (!StringUtils.isEmpty(param.getKeyword())) {
        HighlightBuilder highlightBuilder = new HighlightBuilder();
        highlightBuilder.field("skuTitle");
        highlightBuilder.preTags("<b style='color:red'>");
        highlightBuilder.postTags("</b>");
        searchSourceBuilder.highlighter(highlightBuilder);
    }

    log.info("构建的DSL语句 {}", searchSourceBuilder.toString());

    SearchRequest searchRequest = new SearchRequest(new String[]{EsConstant.PRODUCT_INDEX}, searchSourceBuilder);
    return searchRequest;
}
```

---

## 5、测试

注意：

- 将`SearchParam.java`中的默认页码和库存设为1，防止空指针
- 页码大小为5方便测试，记得还原为16

```java
// SearchParam.java
private Integer pageNum = 1; 	//页码
private Integer hasStock=1;     //是否只显示有货 v 0(无库存) 1(有库存)

// EsConstant.ajva
public static final Integer PRODUCT_PAGESIZE = 5;
```

测试情形：

1. 参数为空的情况下进行测试；
2. 参数为以下条件进行测试，查看构建的DSL语句，并验证结果是否准确
3. GET：`http://localhost:8400/list.html?keyword=努比亚&catalog3Id=225&attrs=1_3G:4G:5G&skuPrice=1000_7900&sort=skuPrice_desc&brandId=2`

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202312/4a44cbfb17eb38d4e36e71963e4c955f.png#id=GDZc0&originHeight=639&originWidth=1217&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

attrs的value拼接方式为：`attrId"+"attrValue`，也可以是别的什么值，例如：7_A2217:2019

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202312/88cfebe7f88206d876667dd4f0421c38.png#id=JuTVj&originHeight=903&originWidth=1920&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)
