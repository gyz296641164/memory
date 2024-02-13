---
title: ✅P94_商品管理-SKU检索
category:
  - 谷粒商城
date: 2024-02-13
---

<!-- more -->

## 接口信息
### 接口地址

```java
GET:/product/skuinfo/list
```

### 请求参数

```shell
{
page: 1,//当前页码
limit: 10,//每页记录数
sidx: 'id',//排序字段
order: 'asc/desc',//排序方式
key: '华为',//检索关键字
catelogId: 0,
brandId: 0,
min: 0,
max: 0
}

```

> 分页数据

### 响应数据

```shell
{
	"msg": "success",
	"code": 0,
	"page": {
		"totalCount": 26,
		"pageSize": 10,
		"totalPage": 3,
		"currPage": 1,
		"list": [{
			"skuId": 1,
			"spuId": 11,
			"skuName": "华为 HUAWEI Mate 30 Pro 星河银 8GB+256GB",
			"skuDesc": null,
			"catalogId": 225,
			"brandId": 9,
			"skuDefaultImg": "https://gulimall-hello.oss-cn-beijing.aliyuncs.com/2019-11-26/60e65a44-f943-4ed5-87c8-8cf90f403018_d511faab82abb34b.jpg",
			"skuTitle": "华为 HUAWEI Mate 30 Pro 星河银 8GB+256GB麒麟990旗舰芯片OLED环幕屏双4000万徕卡电影四摄4G全网通手机",
			"skuSubtitle": "【现货抢购！享白条12期免息！】麒麟990，OLED环幕屏双4000万徕卡电影四摄；Mate30系列享12期免息》",
			"price": 6299.0000,
			"saleCount": 0
		}]
	}
}

```

---

## 前端代码
菜单：“商品管理”
### manager.vue
`src\views\modules\product\manager.vue`
```vue
<template>
  <div class="mod-config">
    <el-form :inline="true" :model="dataForm" @keyup.enter.native="getDataList()">
      <el-form :inline="true" :model="dataForm">
        <el-form-item label="分类">
          <category-cascader :catelogPath.sync="catelogPath"></category-cascader>
        </el-form-item>
        <el-form-item label="品牌">
          <brand-select style="width:160px"></brand-select>
        </el-form-item>
        <el-form-item label="价格">
          <el-input-number style="width:160px" v-model="dataForm.price.min" :min="0"></el-input-number>-
          <el-input-number style="width:160px" v-model="dataForm.price.max" :min="0"></el-input-number>
        </el-form-item>
        <el-form-item label="检索">
          <el-input style="width:160px" v-model="dataForm.key" clearable></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchSkuInfo">查询</el-button>
        </el-form-item>
      </el-form>
    </el-form>
    <el-table
      :data="dataList"
      border
      v-loading="dataListLoading"
      @selection-change="selectionChangeHandle"
      style="width: 100%;"
      @expand-change="getSkuDetails"
      >
      <el-table-column type="expand">
        <template slot-scope="scope">
          商品标题：{{scope.row.skuTitle}}
          

          商品副标题：{{scope.row.skuSubtitle}}
          

          商品描述：{{scope.row.skuDesc}}
          

          分类ID：{{scope.row.catalogId}}
          

          SpuID：{{scope.row.spuId}}
          

          品牌ID：{{scope.row.brandId}}
          

        </template>
                     </el-table-column>
                       <el-table-column type="selection" header-align="center" align="center" width="50"></el-table-column>
                       <el-table-column prop="skuId" header-align="center" align="center" label="skuId"></el-table-column>
                       <el-table-column prop="skuName" header-align="center" align="center" label="名称"></el-table-column>
                       <el-table-column prop="skuDefaultImg" header-align="center" align="center" label="默认图片">
                       <template slot-scope="scope">
                       <img :src="scope.row.skuDefaultImg" style="width:80px;height:80px;" />
                       </template>
                       </el-table-column>
                       <el-table-column prop="price" header-align="center" align="center" label="价格"></el-table-column>
                       <el-table-column prop="saleCount" header-align="center" align="center" label="销量"></el-table-column>
                       <el-table-column fixed="right" header-align="center" align="center" width="150" label="操作">
                       <template slot-scope="scope">
                       <el-button type="text" size="small" @click="previewHandle(scope.row.skuId)">预览</el-button>
                       <el-button type="text" size="small" @click="commentHandle(scope.row.skuId)">评论</el-button>
                       <el-dropdown
          @command="handleCommand(scope.row,$event)"
          size="small"
          split-button
          type="text"
            >
            更多
            <el-dropdown-menu slot="dropdown">
            <el-dropdown-item command="uploadImages">上传图片</el-dropdown-item>
            <el-dropdown-item command="seckillSettings">参与秒杀</el-dropdown-item>
              <el-dropdown-item command="reductionSettings">满减设置</el-dropdown-item>
              <el-dropdown-item command="discountSettings">折扣设置</el-dropdown-item>
              <el-dropdown-item command="memberPriceSettings">会员价格</el-dropdown-item>
              <el-dropdown-item command="stockSettings">库存管理</el-dropdown-item>
              <el-dropdown-item command="couponSettings">优惠劵</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      @size-change="sizeChangeHandle"
      @current-change="currentChangeHandle"
      :current-page="pageIndex"
      :page-sizes="[10, 20, 50, 100]"
      :page-size="pageSize"
      :total="totalPage"
      layout="total, sizes, prev, pager, next, jumper"
    ></el-pagination>
  </div>
</template>

<script>
import CategoryCascader from "../common/category-cascader";
import BrandSelect from "../common/brand-select";
export default {
  data() {
    return {
      catPathSub: null,
      brandIdSub: null,
      dataForm: {
        key: "",
        brandId: 0,
        catelogId: 0,
        price: {
          min: 0,
          max: 0
        }
      },
      dataList: [],
      pageIndex: 1,
      pageSize: 10,
      totalPage: 0,
      dataListLoading: false,
      dataListSelections: [],
      addOrUpdateVisible: false,
      catelogPath: []
    };
  },
  components: {
    CategoryCascader,
    BrandSelect
  },
  activated() {
    this.getDataList();
  },
  methods: {
    getSkuDetails(row, expand) {
      //sku详情查询
      console.log("展开某行...", row, expand);
    },
    //处理更多指令
    handleCommand(row, command) {
      console.log("~~~~~", row, command);
      if ("stockSettings" == command) {
        this.$router.push({ path: "/ware-sku", query: { skuId: row.skuId } });
      }
    },
    searchSkuInfo() {
      this.getDataList();
    },
    // 获取数据列表
    getDataList() {
      this.dataListLoading = true;
      this.$http({
        url: this.$http.adornUrl("/product/skuinfo/list"),
        method: "get",
        params: this.$http.adornParams({
          page: this.pageIndex,
          limit: this.pageSize,
          key: this.dataForm.key,
          catelogId: this.dataForm.catelogId,
          brandId: this.dataForm.brandId,
          min: this.dataForm.price.min,
          max: this.dataForm.price.max
        })
      }).then(({ data }) => {
        if (data && data.code === 0) {
          this.dataList = data.page.list;
          this.totalPage = data.page.totalCount;
        } else {
          this.dataList = [];
          this.totalPage = 0;
        }
        this.dataListLoading = false;
      });
    },
    // 每页数
    sizeChangeHandle(val) {
      this.pageSize = val;
      this.pageIndex = 1;
      this.getDataList();
    },
    // 当前页
    currentChangeHandle(val) {
      this.pageIndex = val;
      this.getDataList();
    },
    // 多选
    selectionChangeHandle(val) {
      this.dataListSelections = val;
    }
  },
  mounted() {
    this.catPathSub = PubSub.subscribe("catPath", (msg, val) => {
      this.dataForm.catelogId = val[val.length - 1];
    });
    this.brandIdSub = PubSub.subscribe("brandId", (msg, val) => {
      this.dataForm.brandId = val;
    });
  },
  beforeDestroy() {
    PubSub.unsubscribe(this.catPathSub);
    PubSub.unsubscribe(this.brandIdSub);
  } //生命周期 - 销毁之前
};
</script>
```

---

## 后端代码
### Controlelr
`cfmall-product/src/main/java/com/gyz/cfmall/product/controller/SkuInfoController.java`

```java
@Autowired
private SkuInfoService skuInfoService;

/**
 * 列表
 */
@RequestMapping("/list")
public R list(@RequestParam Map<String, Object> params){
    PageUtils page = skuInfoService.queryPageCondition(params);

    return R.ok().put("page", page);
}
```
### Service
`cfmall-product/src/main/java/com/gyz/cfmall/product/service/impl/SkuInfoServiceImpl.java`
```java
    /**
     * sku检索
     *
     * @param params
     * @return
     */
    @Override
    public PageUtils queryPageCondition(Map<String, Object> params) {

        QueryWrapper<SkuInfoEntity> queryWrapper = new QueryWrapper<>();

        String key = (String) params.get("key");
        if (!StringUtils.isEmpty(key) && !"0".equalsIgnoreCase(key)) {
            queryWrapper.and((wrapper) -> {
                wrapper.eq("sku_id", key).or().like("sku_name", key);
            });
        }

        String catelogId = (String) params.get("catelogId");
        if (!StringUtils.isEmpty(catelogId) && !"0".equalsIgnoreCase(catelogId)) {
            queryWrapper.eq("catalog_id", catelogId);
        }

        String brandId = (String) params.get("brandId");
        if (!StringUtils.isEmpty(brandId) && !"0".equalsIgnoreCase(brandId)) {
            queryWrapper.eq("brand_id", brandId);
        }

        //queryWrapper.ge("price", min);  ge: >=
        String min = (String) params.get("min");
        if (!StringUtils.isEmpty(min)) {
            queryWrapper.ge("price", min);
        }

        String max = (String) params.get("max");
        // le: <=
        if (!StringUtils.isEmpty(max)) {
            try {
                BigDecimal bigDecimal = new BigDecimal(max);
                if (bigDecimal.compareTo(BigDecimal.ZERO) == 1) {
                    queryWrapper.le("price", max);
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        // key:
        // catelogId: 225
        // brandId: 9
        // min: 0
        // max: 0

        IPage<SkuInfoEntity> page = this.page(
                new Query<SkuInfoEntity>().getPage(params),
                queryWrapper
        );

        return new PageUtils(page);
    }
```

---

## 测试

页面效果

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311241349854.png#id=Zy6t0&originHeight=425&originWidth=1660&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)
