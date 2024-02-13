---
title: ✅P171_缓存-SpringCache-@CacheEvict
category:
  - 谷粒商城
date: 2024-02-13
---

<!-- more -->

## 分区数据准备

一级分类数据
> `cfmall-product/src/main/java/com/gyz/cfmall/product/service/impl/CategoryServiceImpl.java`

```java
/**
 * @return
 * @Cacheable(value = {"category"}, key = "#root.method.name")
 * 代表当前方法的结果需要缓存。如果缓存中有，方法不用调用。如果缓存中没有，会调用方法，最后将方法的结果放入缓存。
 */
@Cacheable(value = {"category"}, key = "#root.method.name")
@Override
public List<CategoryEntity> listCategory() {
    System.out.println("listCategory......从数据库查询一级类目");
    List<CategoryEntity> categoryEntityList = this.baseMapper.selectList(new QueryWrapper<CategoryEntity>().eq("parent_cid", 0));
    return categoryEntityList;
}
```

所有分类数据

```java
    @Cacheable(value = {"category"}, key = "'categoryJson'")
    @Override
    public Map<String, List<Catelog2Vo>> getCatalogJson() {
        Map<String, List<Catelog2Vo>> dataFromDb = getDataFromDb();
        return dataFromDb;
    }


    private Map<String, List<Catelog2Vo>> getDataFromDb() {
        //得到锁后,我们应该再去缓存查询一次,如果没有才需要继续查询
        String catalogJSON = stringRedisTemplate.opsForValue().get("catelogJSON");
        if (!StringUtils.isEmpty(catalogJSON)) {
            Map<String, List<Catelog2Vo>> result = JSON.parseObject(catalogJSON, new TypeReference<Map<String, List<Catelog2Vo>>>() {
            });
            return result;
        }
        System.out.println("查询了数据库.....");
        // 一次性获取所有数据
        List<CategoryEntity> selectList = baseMapper.selectList(null);
        // 1）、所有1级分类
        List<CategoryEntity> level1Categorys = getParent_cid(selectList, 0L);
        // 2）、封装数据
        Map<String, List<Catelog2Vo>> collect = level1Categorys.stream().collect(Collectors.toMap(k -> k.getCatId().toString(), level1 -> {
            // 查到当前1级分类的2级分类
            List<CategoryEntity> category2level = getParent_cid(selectList, level1.getCatId());
            List<Catelog2Vo> catalog2Vos = null;
            if (category2level != null) {
                catalog2Vos = category2level.stream().map(level12 -> {
                    // 查询当前2级分类的3级分类
                    List<CategoryEntity> category3level = getParent_cid(selectList, level12.getCatId());
                    List<Catelog2Vo.Category3Vo> catalog3Vos = null;
                    if (category3level != null) {
                        catalog3Vos = category3level.stream().map(level13 -> {
                            return new Catelog2Vo.Category3Vo(level12.getCatId().toString(), level13.getCatId().toString(), level13.getName());
                        }).collect(Collectors.toList());
                    }
                    return new Catelog2Vo(level1.getCatId().toString(), catalog3Vos, level12.getCatId().toString(), level12.getName());
                }).collect(Collectors.toList());
            }
            return catalog2Vos;
        }));
        String newCategoryJson = JSON.toJSONString(collect);
        // 设置过期时间，解决缓存雪崩
        stringRedisTemplate.opsForValue().set("catelogJSON", newCategoryJson, 1, TimeUnit.DAYS);
        return collect;
    }
```

> **注意**：
>  
> - 在进行获取数据操作前，一定要先将Redis缓存中key值为`CACHE_categoryJson`、`CACHE_listCategory`数据删除
> - 否则会出现这种情况：方法`getDataFromDb()`中有设置`catelogJSON`这个键值的操作，那么key为`CACHE_categoryJson`的值为NULL


分别访问：http://localhost:8200/，[http://localhost:8200/index/catalog.json](http://localhost:8200/index/catalog.json)

发现缓存中存储了数据，key值为我们手动设置的：`CACHE_categoryJson`、`CACHE_listCategory`

> 注意：


![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202312/7a7f45d9fe0183652c3936e9ab9b42ee.png#id=VEHzG&originHeight=555&originWidth=1165&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

---

## 删除一个分区的缓存数据

测试：在后端管理页面“分类维护”下，修改分类数据，会发现缓存中key为`listCategory`的数据被清空。再次访问数据时，缓存中会被存放数据

```java
/**
 * 删除指定key值的缓存
 *
 * @param category
 */
@Transactional
@CacheEvict(value = {"category"}, key = "'listCategory'")
@Override
public void updateCascade(CategoryEntity category) {
    this.updateById(category);
    categoryBrandRelationService.updateCategory(category.getCatId(), category.getName());
}
```

---

## 删除多个分区的缓存数据

```java
@Caching(evict = {
    @CacheEvict(value = "category", key = "'listCategory'"),
    @CacheEvict(value = "category", key = "'categoryJson'"),
})
public void updateCascade(CategoryEntity category) {
    this.updateById(category);
    categoryBrandRelationService.updateCategory(category.getCatId(), category.getName());
}
```

---

## 删除指定分区的缓存数据

```java
// 删除某个分区下的缓存数据，也就是清除模式
@CacheEvict(value = "category",allEntries = true)
public void updateCascade(CategoryEntity category) {
    this.updateById(category);
    categoryBrandRelationService.updateCategory(category.getCatId(), category.getName());
}
```

---

## 失效模式or双写模式

`@Cacheable`：标注方法上：当前方法的结果存入缓存，如果缓存中有，方法不调用

`@CacheEvict`：触发将数据从缓存删除的操作【删除缓存】【可实现失效模式】

`@CachePut`：不影响方法执行更新缓存【更新缓存】【可实现双写模式】

`@Caching`：组合以上多个操作【实现双写+失效模式】

`@CacheConfig`：在类级别共享缓存的相同配置
