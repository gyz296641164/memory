---
title: ✅P88-92_新增商品-保存SPU和SKU基本信息
category:
  - 谷粒商城
date: 2024-02-13
---

<!-- more -->

## 开篇

点击直接跳转目录：

[保存SPU基本信息](#%E4%BF%9D%E5%AD%98SPU%E5%9F%BA%E6%9C%AC%E4%BF%A1%E6%81%AF)

[保存SKU基本信息](#%E4%BF%9D%E5%AD%98SKU%E5%9F%BA%E6%9C%AC%E4%BF%A1%E6%81%AF)

[远程调用服务保存优惠券等信息](#%E8%BF%9C%E7%A8%8B%E8%B0%83%E7%94%A8%E6%9C%8D%E5%8A%A1%E4%BF%9D%E5%AD%98%E4%BC%98%E6%83%A0%E5%88%B8%E7%AD%89%E4%BF%A1%E6%81%AF)

---

## 新增商品接口

`POST：/product/spuinfo/save`

请求参数：商品新增vo抽取章节已经分析过了

```json
{
	"spuName": "Apple XR",
	"spuDescription": "Apple XR",
	"catalogId": 225,
	"brandId": 12,
	"weight": 0.048,
	"publishStatus": 0,
	"decript": ["https://gulimall-hello.oss-cn-beijing.aliyuncs.com/2019-11-22//66d30b3f-e02f-48b1-8574-e18fdf454a32_f205d9c99a2b4b01.jpg"],
	"images": ["https://gulimall-hello.oss-cn-beijing.aliyuncs.com/2019-11-22//dcfcaec3-06d8-459b-8759-dbefc247845e_5b5e74d0978360a1.jpg", "https://gulimall-hello.oss-cn-beijing.aliyuncs.com/2019-11-22//5b15e90a-a161-44ff-8e1c-9e2e09929803_749d8efdff062fb0.jpg"],
	"bounds": {
		"buyBounds": 500,
		"growBounds": 6000
	},
	"baseAttrs": [{
		"attrId": 7,
		"attrValues": "aaa;bb",
		"showDesc": 1
	}, {
		"attrId": 8,
		"attrValues": "2019",
		"showDesc": 0
	}],
	"skus": [{
		"attr": [{
			"attrId": 9,
			"attrName": "颜色",
			"attrValue": "黑色"
		}, {
			"attrId": 10,
			"attrName": "内存",
			"attrValue": "6GB"
		}],
		"skuName": "Apple XR 黑色 6GB",
		"price": "1999",
		"skuTitle": "Apple XR 黑色 6GB",
		"skuSubtitle": "Apple XR 黑色 6GB",
		"images": [{
			"imgUrl": "https://gulimall-hello.oss-cn-beijing.aliyuncs.com/2019-11-22//dcfcaec3-06d8-459b-8759-dbefc247845e_5b5e74d0978360a1.jpg",
			"defaultImg": 1
			}, {
			"imgUrl": "https://gulimall-hello.oss-cn-beijing.aliyuncs.com/2019-11-22//5b15e90a-a161-44ff-8e1c-9e2e09929803_749d8efdff062fb0.jpg",
			"defaultImg": 0
		}],
		"descar": ["黑色", "6GB"],
		"fullCount": 5,
		"discount": 0.98,
		"countStatus": 1,
		"fullPrice": 1000,
		"reducePrice": 10,
		"priceStatus": 0,
		"memberPrice": [{
			"id": 1,
			"name": "aaa",
			"price": 1998.99
		}]
		}, {
		"attr": [{
			"attrId": 9,
			"attrName": "颜色",
			"attrValue": "黑色"
		}, {
			"attrId": 10,
			"attrName": "内存",
			"attrValue": "12GB"
		}],
		"skuName": "Apple XR 黑色 12GB",
		"price": "2999",
		"skuTitle": "Apple XR 黑色 12GB",
		"skuSubtitle": "Apple XR 黑色 6GB",
		"images": [{
			"imgUrl": "",
			"defaultImg": 0
		}, {
			"imgUrl": "",
			"defaultImg": 0
		}],
		"descar": ["黑色", "12GB"],
		"fullCount": 0,
		"discount": 0,
		"countStatus": 0,
		"fullPrice": 0,
		"reducePrice": 0,
		"priceStatus": 0,
		"memberPrice": [{
			"id": 1,
			"name": "aaa",
			"price": 1998.99
		}]
	}, {
		"attr": [{
			"attrId": 9,
			"attrName": "颜色",
			"attrValue": "白色"
		}, {
			"attrId": 10,
			"attrName": "内存",
			"attrValue": "6GB"
		}],
		"skuName": "Apple XR 白色 6GB",
		"price": "1998",
		"skuTitle": "Apple XR 白色 6GB",
		"skuSubtitle": "Apple XR 黑色 6GB",
		"images": [{
			"imgUrl": "",
			"defaultImg": 0
		}, {
			"imgUrl": "",
			"defaultImg": 0
		}],
		"descar": ["白色", "6GB"],
		"fullCount": 0,
		"discount": 0,
		"countStatus": 0,
		"fullPrice": 0,
		"reducePrice": 0,
		"priceStatus": 0,
		"memberPrice": [{
			"id": 1,
			"name": "aaa",
			"price": 1998.99
		}]
	}, {
		"attr": [{
			"attrId": 9,
			"attrName": "颜色",
			"attrValue": "白色"
		}, {
			"attrId": 10,
			"attrName": "内存",
			"attrValue": "12GB"
		}],
		"skuName": "Apple XR 白色 12GB",
		"price": "2998",
		"skuTitle": "Apple XR 白色 12GB",
		"skuSubtitle": "Apple XR 黑色 6GB",
		"images": [{
			"imgUrl": "",
			"defaultImg": 0
		}, {
			"imgUrl": "",
			"defaultImg": 0
		}],
		"descar": ["白色", "12GB"],
		"fullCount": 0,
		"discount": 0,
		"countStatus": 0,
		"fullPrice": 0,
		"reducePrice": 0,
		"priceStatus": 0,
		"memberPrice": [{
			"id": 1,
			"name": "aaa",
			"price": 1998.99
		}]
	}]
}
```

> 分页数据


响应数据

```
{
	"msg": "success",
	"code": 0
}
```

---

## 保存SPU相关信息

`cfmall-product/src/main/java/com/gyz/cfmall/product/service/impl/SpuInfoServiceImpl.java`

### 保存spu基本信息

保存spu基本信息：`pms_spu_info`

```java
        //1、保存spu基本信息：pms_spu_info
        SpuInfoEntity spuInfoEntity = new SpuInfoEntity();
        BeanUtils.copyProperties(vo, spuInfoEntity);
        spuInfoEntity.setCreateTime(new Date());
        spuInfoEntity.setUpdateTime(new Date());
        this.saveBaseSpuInfo(spuInfoEntity);
```

### 保存spu的描述图片

保存spu的描述图片：`pms_spu_info_desc`

```java
        //2、保存spu的描述图片：pms_spu_info_desc
        List<String> decript = vo.getDecript();
        SpuInfoDescEntity spuInfoDescEntity = new SpuInfoDescEntity();
        spuInfoDescEntity.setSpuId(spuInfoEntity.getId());
        spuInfoDescEntity.setDecript(String.join(",", decript));
        spuInfoDescService.saveSpuInfoDesc(spuInfoDescEntity);
```

### 保存spu的图片集

保存spu的图片集：`pms_spu_images`

```java
        //3、保存spu的图片集：pms_spu_images
        List<String> images = vo.getImages();
        spuImagesService.saveImages(spuInfoEntity.getId(), images);
```

### 保存spu的规格参数

保存spu的规格参数：`pms_product_attr_value`

```java
        //4、保存spu的规格参数：pms_product_attr_value
        List<BaseAttrs> baseAttrs = vo.getBaseAttrs();
        List<ProductAttrValueEntity> collect = baseAttrs.stream().map(attr -> {
            ProductAttrValueEntity valueEntity = new ProductAttrValueEntity();
            valueEntity.setAttrId(attr.getAttrId());

            //查询attr属性名
            AttrEntity byId = attrService.getById(attr.getAttrId());

            valueEntity.setAttrName(byId.getAttrName());
            valueEntity.setAttrValue(attr.getAttrValues());
            valueEntity.setQuickShow(attr.getShowDesc());
            valueEntity.setSpuId(spuInfoEntity.getId());
            return valueEntity;
        }).collect(Collectors.toList());
        productAttrValueService.saveProductAttr(collect);
```

### 保存spu的积分信息

由于需要保存的积分、折扣、满减等信息都在优惠券服务中，因此，涉及服务与服务之间的调用，看 [远程调用服务保存优惠券等信息](#%E8%BF%9C%E7%A8%8B%E8%B0%83%E7%94%A8%E6%9C%8D%E5%8A%A1%E4%BF%9D%E5%AD%98%E4%BC%98%E6%83%A0%E5%88%B8%E7%AD%89%E4%BF%A1%E6%81%AF) 章节

```java
        //5、保存spu的积分信息：gulimall_sms--->sms_spu_bounds
        Bounds bounds = vo.getBounds();
        SpuBoundTo spuBoundTo = new SpuBoundTo();
        BeanUtils.copyProperties(bounds, spuBoundTo);
        spuBoundTo.setSpuId(spuInfoEntity.getId());
        R r = couponFeignService.saveSpuBounds(spuBoundTo);

        if (r.getCode() != 0) {
            log.error("远程保存spu积分信息失败");
        }
```

---

## 保存SKU基本信息

`cfmall-product/src/main/java/com/gyz/cfmall/product/service/impl/SpuInfoServiceImpl.java`

```java
        //6、保存当前spu对应的所有sku信息：pms_sku_info
        //6、1）、sku的基本信息:pms_sku_info
        List<Skus> skus = vo.getSkus();
        if (skus != null && skus.size() > 0) {
            skus.forEach(item -> {
                String defaultImg = "";
                for (Images image : item.getImages()) {
                    if (image.getDefaultImg() == 1) {
                        defaultImg = image.getImgUrl();
                    }
                }

                SkuInfoEntity skuInfoEntity = new SkuInfoEntity();
                BeanUtils.copyProperties(item, skuInfoEntity);
                skuInfoEntity.setBrandId(spuInfoEntity.getBrandId());
                skuInfoEntity.setCatalogId(spuInfoEntity.getCatalogId());
                skuInfoEntity.setSaleCount(0L);
                skuInfoEntity.setSpuId(spuInfoEntity.getId());
                skuInfoEntity.setSkuDefaultImg(defaultImg);
                skuInfoService.saveSkuInfo(skuInfoEntity);

                Long skuId = skuInfoEntity.getSkuId();

                List<SkuImagesEntity> imagesEntities = item.getImages().stream().map(img -> {
                    SkuImagesEntity skuImagesEntity = new SkuImagesEntity();
                    skuImagesEntity.setSkuId(skuId);
                    skuImagesEntity.setImgUrl(img.getImgUrl());
                    skuImagesEntity.setDefaultImg(img.getDefaultImg());
                    return skuImagesEntity;
                }).filter(entity -> {
                    //返回true就是需要，false就是剔除
                    return !StringUtils.isEmpty(entity.getImgUrl());
                }).collect(Collectors.toList());

                //6、2）、sku的图片信息：pms_sku_images
                skuImagesService.saveBatch(imagesEntities);

                //6、3）、sku的销售属性：pms_sku_sale_attr_value
                List<Attr> attr = item.getAttr();
                List<SkuSaleAttrValueEntity> skuSaleAttrValueEntities = attr.stream().map(a -> {
                    SkuSaleAttrValueEntity skuSaleAttrValueEntity = new SkuSaleAttrValueEntity();
                    BeanUtils.copyProperties(a, skuSaleAttrValueEntity);
                    skuSaleAttrValueEntity.setSkuId(skuId);
                    return skuSaleAttrValueEntity;
                }).collect(Collectors.toList());

                skuSaleAttrValueService.saveBatch(skuSaleAttrValueEntities);

                //6、4）、sku的优惠、满减等信息：gulimall_sms--->sms_sku_ladder、sms_sku_full_reduction、sms_member_price
                SkuReductionTo skuReductionTo = new SkuReductionTo();
                BeanUtils.copyProperties(item, skuReductionTo);
                skuReductionTo.setSkuId(skuId);
                if (skuReductionTo.getFullCount() > 0 || skuReductionTo.getFullPrice().compareTo(BigDecimal.ZERO) == 1) {
                    R r1 = couponFeignService.saveSkuReduction(skuReductionTo);
                    if (r1.getCode() != 0) {
                        log.error("远程保存sku积分信息失败");
                    }
                }
            });
        }
```

---

## 新增商品完整代码

### SpuSaveVo

`cfmall-product/src/main/java/com/gyz/cfmall/product/vo/SpuSaveVo.java`

```java
@Data
public class SpuSaveVo {

  private String spuName;
  private String spuDescription;
  private Long catalogId;
  private Long brandId;
  private BigDecimal weight;
  private int publishStatus;
  private List<String> decript;
  private List<String> images;
  private Bounds bounds;
  private List<BaseAttrs> baseAttrs;
  private List<Skus> skus;
}
```

### Controller

`cfmall-product/src/main/java/com/gyz/cfmall/product/controller/SpuInfoController.java`

```java
    /**
     * 保存
     */
    @RequestMapping("/save")
    public R save(@RequestBody SpuSaveVo vo) {
        spuInfoService.savesupInfo(vo);

        return R.ok();
    }
```

### Service

`cfmall-product/src/main/java/com/gyz/cfmall/product/service/impl/SpuInfoServiceImpl.java`

```java
@Service("spuInfoService")
public class SpuInfoServiceImpl extends ServiceImpl<SpuInfoDao, SpuInfoEntity> implements SpuInfoService {

    @Autowired
    private SpuInfoDescService spuInfoDescService;

    @Autowired
    private SpuImagesService spuImagesService;

    @Autowired
    private AttrService attrService;

    @Autowired
    private ProductAttrValueService productAttrValueService;

    @Autowired
    private SkuInfoService skuInfoService;

    @Autowired
    private SkuImagesService skuImagesService;

    @Autowired
    private SkuSaleAttrValueService skuSaleAttrValueService;

    @Autowired
    private CouponFeignService couponFeignService;

    @Autowired
    private BrandService brandService;

    @Autowired
    private CategoryService categoryService;

    @Resource
    private WareFeignService wareFeignService;

    @Autowired
    private SearchFeignService searchFeignService;

	/**
     *  新增商品
     * @param vo :
     * @return void
     */
    @Override
    public void savesupInfo(SpuSaveVo vo) {
        //1、保存spu基本信息：pms_spu_info
        SpuInfoEntity spuInfoEntity = new SpuInfoEntity();
        BeanUtils.copyProperties(vo, spuInfoEntity);
        spuInfoEntity.setCreateTime(new Date());
        spuInfoEntity.setUpdateTime(new Date());
        this.saveBaseSpuInfo(spuInfoEntity);

        //2、保存spu的描述图片：pms_spu_info_desc
        List<String> decript = vo.getDecript();
        SpuInfoDescEntity spuInfoDescEntity = new SpuInfoDescEntity();
        spuInfoDescEntity.setSpuId(spuInfoEntity.getId());
        spuInfoDescEntity.setDecript(String.join(",", decript));
        spuInfoDescService.saveSpuInfoDesc(spuInfoDescEntity);

        //3、保存spu的图片集：pms_spu_images
        List<String> images = vo.getImages();
        spuImagesService.saveImages(spuInfoEntity.getId(), images);

        //4、保存spu的规格参数：pms_product_attr_value
        List<BaseAttrs> baseAttrs = vo.getBaseAttrs();
        List<ProductAttrValueEntity> collect = baseAttrs.stream().map(attr -> {
            ProductAttrValueEntity valueEntity = new ProductAttrValueEntity();
            valueEntity.setAttrId(attr.getAttrId());

            //查询attr属性名
            AttrEntity byId = attrService.getById(attr.getAttrId());

            valueEntity.setAttrName(byId.getAttrName());
            valueEntity.setAttrValue(attr.getAttrValues());
            valueEntity.setQuickShow(attr.getShowDesc());
            valueEntity.setSpuId(spuInfoEntity.getId());
            return valueEntity;
        }).collect(Collectors.toList());
        productAttrValueService.saveProductAttr(collect);

        //5、保存spu的积分信息：gulimall_sms--->sms_spu_bounds
        Bounds bounds = vo.getBounds();
        SpuBoundTo spuBoundTo = new SpuBoundTo();
        BeanUtils.copyProperties(bounds, spuBoundTo);
        spuBoundTo.setSpuId(spuInfoEntity.getId());
        R r = couponFeignService.saveSpuBounds(spuBoundTo);

        if (r.getCode() != 0) {
            log.error("远程保存spu积分信息失败");
        }

        //5、保存当前spu对应的所有sku信息：pms_sku_info
        //5、1）、sku的基本信息:pms_sku_info
        List<Skus> skus = vo.getSkus();
        if (skus != null && skus.size() > 0) {
            skus.forEach(item -> {
                String defaultImg = "";
                for (Images image : item.getImages()) {
                    if (image.getDefaultImg() == 1) {
                        defaultImg = image.getImgUrl();
                    }
                }

                SkuInfoEntity skuInfoEntity = new SkuInfoEntity();
                BeanUtils.copyProperties(item, skuInfoEntity);
                skuInfoEntity.setBrandId(spuInfoEntity.getBrandId());
                skuInfoEntity.setCatalogId(spuInfoEntity.getCatalogId());
                skuInfoEntity.setSaleCount(0L);
                skuInfoEntity.setSpuId(spuInfoEntity.getId());
                skuInfoEntity.setSkuDefaultImg(defaultImg);
                skuInfoService.saveSkuInfo(skuInfoEntity);

                Long skuId = skuInfoEntity.getSkuId();

                List<SkuImagesEntity> imagesEntities = item.getImages().stream().map(img -> {
                    SkuImagesEntity skuImagesEntity = new SkuImagesEntity();
                    skuImagesEntity.setSkuId(skuId);
                    skuImagesEntity.setImgUrl(img.getImgUrl());
                    skuImagesEntity.setDefaultImg(img.getDefaultImg());
                    return skuImagesEntity;
                }).filter(entity -> {
                    //返回true就是需要，false就是剔除
                    return !StringUtils.isEmpty(entity.getImgUrl());
                }).collect(Collectors.toList());

                //5、2）、sku的图片信息：pms_sku_images
                skuImagesService.saveBatch(imagesEntities);

                //5、3）、sku的销售属性：pms_sku_sale_attr_value
                List<Attr> attr = item.getAttr();
                List<SkuSaleAttrValueEntity> skuSaleAttrValueEntities = attr.stream().map(a -> {
                    SkuSaleAttrValueEntity skuSaleAttrValueEntity = new SkuSaleAttrValueEntity();
                    BeanUtils.copyProperties(a, skuSaleAttrValueEntity);
                    skuSaleAttrValueEntity.setSkuId(skuId);
                    return skuSaleAttrValueEntity;
                }).collect(Collectors.toList());

                skuSaleAttrValueService.saveBatch(skuSaleAttrValueEntities);

                //5、4）、sku的优惠、满减等信息：gulimall_sms--->sms_sku_ladder、sms_sku_full_reduction、sms_member_price
                SkuReductionTo skuReductionTo = new SkuReductionTo();
                BeanUtils.copyProperties(item, skuReductionTo);
                skuReductionTo.setSkuId(skuId);
                if (skuReductionTo.getFullCount() > 0 || skuReductionTo.getFullPrice().compareTo(BigDecimal.ZERO) == 1) {
                    R r1 = couponFeignService.saveSkuReduction(skuReductionTo);
                    if (r1.getCode() != 0) {
                        log.error("远程保存sku积分信息失败");
                    }
                }
            });
        }
    }
    
}
```

`cfmall-product/src/main/java/com/gyz/cfmall/product/service/impl/SpuInfoServiceImpl.java`

```java
    private void saveBaseSpuInfo(SpuInfoEntity spuInfoEntity) {
        this.baseMapper.insert(spuInfoEntity);
    }
```

`cfmall-product/src/main/java/com/gyz/cfmall/product/service/impl/SpuInfoDescServiceImpl.java`

```java
    @Override
    public void saveSpuInfoDesc(SpuInfoDescEntity spuInfoDescEntity) {

        this.baseMapper.insert(spuInfoDescEntity);
    }
```

`cfmall-product/src/main/java/com/gyz/cfmall/product/service/SpuImagesService.java`

```
void saveImages(Long id, List<String> images);
```

`cfmall-product/src/main/java/com/gyz/cfmall/product/service/impl/SpuImagesServiceImpl.java`

```java
    @Override
    public void saveImages(Long id, List<String> images) {
        if (images == null || images.size() == 0) {

        } else {
            List<SpuImagesEntity> collect = images.stream().map(img -> {
                SpuImagesEntity spuImagesEntity = new SpuImagesEntity();
                spuImagesEntity.setSpuId(id);
                spuImagesEntity.setImgUrl(img);
                return spuImagesEntity;
            }).collect(Collectors.toList());

            this.saveBatch(collect);
        }
    }
```

`cfmall-product/src/main/java/com/gyz/cfmall/product/service/impl/ProductAttrValueServiceImpl.java`

```java
    @Override
    public void saveProductAttr(List<ProductAttrValueEntity> collect) {
        this.saveBatch(collect);
    }
```

`cfmall-product/src/main/java/com/gyz/cfmall/product/service/impl/SkuInfoServiceImpl.java`

```java
    @Override
    public void saveSkuInfo(SkuInfoEntity skuInfoEntity) {
        this.baseMapper.insert(skuInfoEntity);
    }
```

---

## 远程调用服务保存优惠券等信息

由于需要保存的积分、折扣、满减等信息都在优惠券服务中，因此，涉及服务与服务之间的调用

远程服务调用的前提是：服务必须注册到注册中心中

### 编写feign接口

`cfmall-product/src/main/java/com/gyz/cfmall/product/feign/CouponFeignService.java`

使用SpuBoundsEntity就要在`cfmall-product`模块导入`cfmall-coupon`模块依赖，因此，服务与服务之间的耦合就增加了。因此，将TO写在`cfmall-common`公共模块里，方便服务之间的调用；

**保存SPU和SKU的折扣、满减、会员价格等信息**

```java
@FeignClient("cfmall-coupon")
public interface CouponFeignService {

    /**
     * 1、CouponFeignService.saveSpuBounds(spuBoundTo);
     *      1）、@RequestBody将这个对象转为json。
     *      2）、找到cfmall-coupon服务，给/coupon/spubounds/save发送请求。
     *          将上一步转的json放在请求体位置，发送请求；
     *      3）、对方服务收到请求。请求体里有json数据。
     *          (@RequestBody SpuBoundsEntity spuBounds)；将请求体的json转为SpuBoundsEntity；
     * 只要json数据模型是兼容的。双方服务无需使用同一个to
     * @param spuBoundTo
     * @return
     */
    @PostMapping("/coupon/spubounds/save")
    R saveSpuBounds(@RequestBody SpuBoundTo spuBoundTo);
    
    @PostMapping("/coupon/skufullreduction/saveinfo")
    R saveSkuReduction(@RequestBody SkuReductionTo skuReductionTo);    
    
}
```

`cfmall-common/src/main/java/com/gyz/common/to/SpuBoundTo.java`

```java
package com.gyz.common.to;

import lombok.Data;

import java.math.BigDecimal;


@Data
public class SpuBoundTo {

    private Long spuId;

    private BigDecimal buyBounds;

    private BigDecimal growBounds;

}
```

`cfmall-common/src/main/java/com/gyz/common/to/SkuReductionTo.java`

```java
@Data
public class SkuReductionTo {

    private Long skuId;
    private int fullCount;
    private BigDecimal discount;
    private int countStatus;
    private BigDecimal fullPrice;
    private BigDecimal reducePrice;
    private int priceStatus;
    private List<MemberPrice> memberPrice;

}
```

### Controller

`cfmall-coupon/src/main/java/com/gyz/cfmall/coupon/controller/SpuBoundsController.java`

```java
    @Autowired
    private SpuBoundsService spuBoundsService;

	/**
     * 保存
     */
    @RequestMapping("/save")
    public R save(@RequestBody SpuBoundsEntity spuBounds){
		spuBoundsService.save(spuBounds);

        return R.ok();
    }
```

`cfmall-coupon/src/main/java/com/gyz/cfmall/coupon/controller/SkuFullReductionController.java`

```java
    @Autowired
    private SkuFullReductionService skuFullReductionService;

	@PostMapping("/saveinfo")
    public R saveInfo(@RequestBody SkuReductionTo skuReductionTo){
        skuFullReductionService.saveSkuReduction(skuReductionTo);

        return R.ok();
    }
```

```java
    @Override
    public void saveSkuReduction(SkuReductionTo skuReductionTo) {
        //1、保存满减打折、会员价
        //1、1）、sku的优惠、满减等信息：gulimall_sms--->sms_sku_ladder、sms_sku_full_reduction、sms_member_price
        SkuLadderEntity skuLadderEntity = new SkuLadderEntity();
        BeanUtils.copyProperties(skuReductionTo, skuLadderEntity);
        skuLadderEntity.setAddOther(skuReductionTo.getCountStatus());

        if (skuReductionTo.getFullCount() > 0) {
            skuLadderService.save(skuLadderEntity);
        }

        //2、sms_sku_full_reduction
        SkuFullReductionEntity skuFullReductionEntity = new SkuFullReductionEntity();
        BeanUtils.copyProperties(skuReductionTo, skuFullReductionEntity);
        if (skuFullReductionEntity.getFullPrice().compareTo(BigDecimal.ZERO) == 1) {
            this.save(skuFullReductionEntity);
        }


        //3、sms_member_price
        List<MemberPrice> memberPrice = skuReductionTo.getMemberPrice();

        List<MemberPriceEntity> collect = memberPrice.stream().map(mem -> {
            MemberPriceEntity memberPriceEntity = new MemberPriceEntity();
            memberPriceEntity.setSkuId(skuReductionTo.getSkuId());
            memberPriceEntity.setMemberLevelId(mem.getId());
            memberPriceEntity.setMemberLevelName(mem.getName());
            memberPriceEntity.setMemberPrice(mem.getPrice());
            memberPriceEntity.setAddOther(1);
            return memberPriceEntity;
        }).filter(item -> {
            return item.getMemberPrice().compareTo(BigDecimal.ZERO) == 1;
        }).collect(Collectors.toList());

        memberPriceService.saveBatch(collect);
    }
```

### 开启OpenFeign

`@EnableFeignClients(basePackages = "com.gyz.cfmall.product.feign")`

```java
@SpringBootApplication
@MapperScan("com.gyz.cfmall.product.dao")
@EnableDiscoveryClient
@EnableFeignClients(basePackages = "com.gyz.cfmall.product.feign")
@EnableRedisHttpSession
public class CfmallProductApplication {

    public static void main(String[] args) {
        SpringApplication.run(CfmallProductApplication.class, args);
    }

}
```

---

## 测试
启动如下服务：

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311241412144.png#id=hMQh1&originHeight=170&originWidth=431&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

### 基本信息
在选择“商品介绍”和“商品图集”时，图片会上传到第三方服务OSS中！

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311241119070.png#id=ff8Ek&originHeight=854&originWidth=1496&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

### 规格参数

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311241119698.png#id=iZIkR&originHeight=353&originWidth=724&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

### 销售属性

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311241120586.png#id=slfyW&originHeight=287&originWidth=698&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

### SKU信息

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311241121039.png#id=lJyCh&originHeight=804&originWidth=1140&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

### 保存商品

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311241122496.png#id=Ue164&originHeight=331&originWidth=797&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)
