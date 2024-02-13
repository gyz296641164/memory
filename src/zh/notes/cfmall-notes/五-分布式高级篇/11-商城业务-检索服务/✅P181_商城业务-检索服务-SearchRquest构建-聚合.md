---
title: ✅P181_商城业务-检索服务-SearchRquest构建-聚合
category:
  - 谷粒商城
date: 2024-02-13
---

<!-- more -->

`{@link MallSearchServiceImpl#buildSearchQuest(com.gyz.cfmall.search.vo.SearchParam)}`

---

## 1、品牌聚合

```java
//1. 按照品牌进行聚合
TermsAggregationBuilder brand_agg = AggregationBuilders.terms("brand_agg");
brand_agg.field("brandId").size(50);

//1.1 品牌的子聚合-品牌名聚合
brand_agg.subAggregation(AggregationBuilders.terms("brand_name_agg").field("brandName").size(1));
//1.2 品牌的子聚合-品牌图片聚合
brand_agg.subAggregation(AggregationBuilders.terms("brand_img_agg").field("brandImg").size(1));
searchSourceBuilder.aggregation(brand_agg);
```

---

## 2、分类聚合

```java
//2. 按照分类信息进行聚合
TermsAggregationBuilder catalog_agg = AggregationBuilders.terms("catalog_agg");
catalog_agg.field("catalogId").size(20);
catalog_agg.subAggregation(AggregationBuilders.terms("catalog_name_agg").field("catalogName").size(1));
searchSourceBuilder.aggregation(catalog_agg);
```

---

## 3、属性聚合

```java
//2. 按照属性信息进行聚合
NestedAggregationBuilder attr_agg = AggregationBuilders.nested("attr_agg", "attrs");
//2.1 按照属性ID进行聚合
TermsAggregationBuilder attr_id_agg = AggregationBuilders.terms("attr_id_agg").field("attrs.attrId");
attr_agg.subAggregation(attr_id_agg);
//2.1.1 在每个属性ID下，按照属性名进行聚合
attr_id_agg.subAggregation(AggregationBuilders.terms("attr_name_agg").field("attrs.attrName").size(1));
//2.1.1 在每个属性ID下，按照属性值进行聚合
attr_id_agg.subAggregation(AggregationBuilders.terms("attr_value_agg").field("attrs.attrValue").size(50));
searchSourceBuilder.aggregation(attr_agg);
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

    /**
     * 三、聚合分析
     */
    //1. 按照品牌进行聚合
    TermsAggregationBuilder brand_agg = AggregationBuilders.terms("brand_agg");
    brand_agg.field("brandId").size(50);


    //1.1 品牌的子聚合-品牌名聚合
    brand_agg.subAggregation(AggregationBuilders.terms("brand_name_agg")
            .field("brandName").size(1));
    //1.2 品牌的子聚合-品牌图片聚合
    brand_agg.subAggregation(AggregationBuilders.terms("brand_img_agg")
            .field("brandImg").size(1));

    searchSourceBuilder.aggregation(brand_agg);

    //2. 按照分类信息进行聚合
    TermsAggregationBuilder catalog_agg = AggregationBuilders.terms("catalog_agg");
    catalog_agg.field("catalogId").size(20);
    catalog_agg.subAggregation(AggregationBuilders.terms("catalog_name_agg").field("catalogName").size(1));
    searchSourceBuilder.aggregation(catalog_agg);

    //2. 按照属性信息进行聚合
    NestedAggregationBuilder attr_agg = AggregationBuilders.nested("attr_agg", "attrs");
    //2.1 按照属性ID进行聚合
    TermsAggregationBuilder attr_id_agg = AggregationBuilders.terms("attr_id_agg").field("attrs.attrId");
    attr_agg.subAggregation(attr_id_agg);
    //2.1.1 在每个属性ID下，按照属性名进行聚合
    attr_id_agg.subAggregation(AggregationBuilders.terms("attr_name_agg").field("attrs.attrName").size(1));
    //2.1.1 在每个属性ID下，按照属性值进行聚合
    attr_id_agg.subAggregation(AggregationBuilders.terms("attr_value_agg").field("attrs.attrValue").size(50));
    searchSourceBuilder.aggregation(attr_agg);

    log.info("构建的DSL语句 {}", searchSourceBuilder.toString());

    SearchRequest searchRequest = new SearchRequest(new String[]{EsConstant.PRODUCT_INDEX}, searchSourceBuilder);
    return searchRequest;
}
```
