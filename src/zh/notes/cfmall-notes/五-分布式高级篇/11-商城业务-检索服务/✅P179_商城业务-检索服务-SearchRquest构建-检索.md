---
title: ✅P179_商城业务-检索服务-SearchRquest构建-检索
category:
  - 谷粒商城
date: 2024-02-13
---

<!-- more -->

## 导入依赖

`cfmall-search/pom.xml`

```xml
<dependency>
    <groupId>org.elasticsearch.client</groupId>
    <artifactId>elasticsearch-rest-high-level-client</artifactId>
</dependency>
```

---

## Nacos创建命名空间

页面地址：[http://localhost:8848/nacos](http://localhost:8848/nacos)

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202312/f186adc3a62e0c554b2ead36bc97cc7d.png#id=B3WRK&originHeight=416&originWidth=1908&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

将生成的命名空间ID配置到`bootstrap.properties`中，

```properties
# cfmall-search/src/main/resources/bootstrap.properties
spring.cloud.nacos.config.server-addr=127.0.0.1:8848
spring.cloud.nacos.config.namespace=73720dde-7eb6-4657-9875-269998ee38d2
```

---

## 检索条件构建
> 参照 [P177、商城业务-检索服务-检索DSL测试-查询部分](https://www.yuque.com/lasted_memory/uoi5s5/gqctn7ki6c2p6414) 完整DSL语句进行构建

### Controller

`cfmall-search/src/main/java/com/gyz/cfmall/search/controller/SearchController.java`

```java
/**
 * @author: gongyuzhuo
 * @description:
 */
@Controller
public class SearchController {
    @Autowired
    MallSearchService mallSearchService;

    /**
     * 自动将页面提交过来的所有请求查询参数封装成指定的对象
     * @param param
     * @param model
     * @return
     */
    @GetMapping(value = "/list.html")
    public String listPage(SearchParam param, Model model) {
        SearchResult result = mallSearchService.search(param);
        model.addAttribute("result", result);
        return "list";
    }
}
```

### Service

`cfmall-search/src/main/java/com/gyz/cfmall/search/service/MallSearchService.java`

```java
package com.gyz.cfmall.search.service;

import com.gyz.cfmall.search.vo.SearchParam;
import com.gyz.cfmall.search.vo.SearchResult;

/**
 * @author: gongyuzhuo
 * @description:
 */
public interface MallSearchService {
    /**
     * 检索的所有参数
     * @param param
     * @return 返回检索结果，里面包含页面需要的所有信息
     */
    SearchResult search(SearchParam param);
}
```

### ServiceImpl

开始封装DSL：

1.  构建bool查询 
2.  构建must查询 
3.  构建filter中三级分类查询 
4.  构建filter中的品牌查询 
5.  构建filter中的库存查询，`SearchParam.java`给个默认值1 
```java
/**
 * 是否显示有货:0-没货，1-有货
 */
private Integer hasStock = 1;
```
 

6.  构建filter中的价格区间查询 
7.  构建filter中的属性查询 

`cfmall-search/src/main/java/com/gyz/cfmall/search/service/impl/MallSearchServiceImpl.java`

```java
/**
 * @author: gongyuzhuo
 * @description:
 */
@Slf4j
@Service
public class MallSearchServiceImpl implements MallSearchService {

    @Autowired
    RestHighLevelClient esRestClient;

    @Override
    public SearchResult search(SearchParam param) {
        //1、动态构建出查询需要的DSL语句
        SearchResult result = null;
        SearchRequest searchRequest = buildSearchQuest(param);

        try {
            //2、执行检索请求
            SearchResponse response = esRestClient.search(searchRequest, CfMallElasticSearchConfig.COMMON_OPTIONS);
            //3、分析响应数据，封装成我们需要的格式
            result = buildSearchResult(response, param);
        } catch (Exception ex) {
            ex.printStackTrace();
        }

        return result;
    }

    /**
     * 构建结果数据
     * 模糊匹配，过滤（按照属性、分类、品牌，价格区间，库存），完成排序、分页、高亮,聚合分析功能
     *
     * @param response
     * @return
     */
    private SearchResult buildSearchResult(SearchResponse response, SearchParam param) {
    	//先置为null，后续会分析逻辑
        return null;
    }

    /**
     * 准备检索请求。dsl语句构建参考：dsl.json
     * 模糊匹配，过滤（按照属性，分类，品牌，价格区间，库存），排序，分页，高亮，聚合分析
     *
     * @return
     */
    private SearchRequest buildSearchQuest(SearchParam param) {
        SearchSourceBuilder searchSourceBuilder = new SearchSourceBuilder();
        /**
         * 模糊匹配，过滤（按照属性，分类，品牌，价格区间，库存）
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
        
        searchSourceBuilder.query(boolQueryBuilder);

        log.debug("构建的DSL语句 {}", searchSourceBuilder.toString());
        SearchRequest searchRequest = new SearchRequest(new String[]{EsConstant.PRODUCT_INDEX}, searchSourceBuilder);
        return searchRequest;
    }
}
```

---

## 报错：IDEA 找不到或无法加载主类

主启动配置没问题，重新`rebuild project`
