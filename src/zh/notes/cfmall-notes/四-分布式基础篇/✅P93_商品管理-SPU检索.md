---
title: ✅P93_商品管理-SPU检索
category:
  - 谷粒商城
date: 2024-02-13
---

<!-- more -->

## 接口信息
### 接口地址

```java
GET:/product/spuinfo/list
```

### 请求参数

```shell
{
   page: 1,//当前页码
   limit: 10,//每页记录数
   sidx: 'id',//排序字段
   order: 'asc/desc',//排序方式
   key: '华为',//检索关键字
   catelogId: 6,//三级分类id
   brandId: 1,//品牌id 
   status: 0,//商品状态
}

```
> 分页数据


### 响应数据

```shell
{
	"msg": "success",
	"code": 0,
	"page": {
		"totalCount": 0,
		"pageSize": 10,
		"totalPage": 0,
		"currPage": 1,
		"list": [{

			"brandId": 0, //品牌id
			"brandName": "品牌名字",
			"catalogId": 0, //分类id
			"catalogName": "分类名字",
			"createTime": "2019-11-13T16:07:32.877Z", //创建时间
			"id": 0, //商品id
			"publishStatus": 0, //发布状态
			"spuDescription": "string", //商品描述
			"spuName": "string", //商品名字
			"updateTime": "2019-11-13T16:07:32.877Z", //更新时间
			"weight": 0 //重量

		}]
	}
}

```

---

## 前端代码
### spu.vue

“商品管理”-> “spu管理”
`src\views\modules\product\spu.vue`
```vue
<template>
  <div>
    <el-row>
      <el-col :span="24">
        <el-form :inline="true" :model="dataForm">
          <el-form-item label="分类">
            <category-cascader :catelogPath.sync="catelogPath"></category-cascader>
          </el-form-item>
          <el-form-item label="品牌">
            <brand-select style="width:160px"></brand-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select style="width:160px" v-model="dataForm.status" clearable>
              <el-option label="新建" :value="0"></el-option>
              <el-option label="上架" :value="1"></el-option>
              <el-option label="下架" :value="2"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="检索">
            <el-input style="width:160px" v-model="dataForm.key" clearable></el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="searchSpuInfo">查询</el-button>
          </el-form-item>
        </el-form>
      </el-col>
      <el-col :span="24">
        <spuinfo :catId="catId"></spuinfo>
      </el-col>
    </el-row>
  </div>
</template>

<script>
  //这里可以导入其他文件（比如：组件，工具js，第三方插件js，json文件，图片文件等等）
  //例如：import 《组件名称》 from '《组件路径》';
  import CategoryCascader from "../common/category-cascader";
  import BrandSelect from "../common/brand-select";
  import Spuinfo from "./spuinfo";
  export default {
    //import引入的组件需要注入到对象中才能使用
    components: { CategoryCascader, Spuinfo, BrandSelect },
    props: {},
    data() {
      //这里存放数据
      return {
        catId: 0,
        catelogPath: [],
        dataForm: {
          status: "",
          key: "",
          brandId: 0,
          catelogId: 0
        },
        catPathSub: null,
        brandIdSub: null

      };
    },
    //计算属性 类似于data概念
    computed: {},
    //监控data中的数据变化
    watch: {},
    //方法集合
    methods: {
      searchSpuInfo() {
        console.log("搜索条件", this.dataForm);
        this.PubSub.publish("dataForm",this.dataForm);
      }
    },
    //生命周期 - 创建完成（可以访问当前this实例）
    created() {},
    //生命周期 - 挂载完成（可以访问DOM元素）
    mounted() {
      this.catPathSub = PubSub.subscribe("catPath", (msg, val) => {
        this.dataForm.catelogId = val[val.length-1];
      });
      this.brandIdSub = PubSub.subscribe("brandId", (msg, val) => {
        this.dataForm.brandId = val;
      });
    },
    beforeCreate() {}, //生命周期 - 创建之前
    beforeMount() {}, //生命周期 - 挂载之前
    beforeUpdate() {}, //生命周期 - 更新之前
    updated() {}, //生命周期 - 更新之后
    beforeDestroy() {
      PubSub.unsubscribe(this.catPathSub); 
      PubSub.unsubscribe(this.brandIdSub); 
    }, //生命周期 - 销毁之前
    destroyed() {}, //生命周期 - 销毁完成
    activated() {} //如果页面有keep-alive缓存功能，这个函数会触发
  };
</script>
<style scoped>
</style>
```
### brand-select.vue
`src\views\modules\common\brand-select.vue`
```vue
<template>
  <div>
    <el-select placeholder="请选择" v-model="brandId" filterable clearable>
      <el-option
        v-for="item in brands"
        :key="item.brandId"
        :label="item.brandName"
        :value="item.brandId"
      ></el-option>
    </el-select>
  </div>
</template>

<script>
//这里可以导入其他文件（比如：组件，工具js，第三方插件js，json文件，图片文件等等）
//例如：import 《组件名称》 from '《组件路径》';
import PubSub from 'pubsub-js';
export default {
  //import引入的组件需要注入到对象中才能使用
  components: {},
  props: {},
  data() {
    //这里存放数据
    return {
      catId: 0,
      brands: [
        {
          label: "a",
          value: 1
        }
      ],
      brandId: "",
      subscribe: null
    };
  },
  //计算属性 类似于data概念
  computed: {},
  //监控data中的数据变化
  watch: {
    brandId(val) {
      PubSub.publish("brandId", val);
    }
  },
  //方法集合
  methods: {
    getCatBrands() {
      this.$http({
        url: this.$http.adornUrl("/product/categorybrandrelation/brands/list"),
        method: "get",
        params: this.$http.adornParams({
          catId: this.catId
        })
      }).then(({ data }) => {
        this.brands = data.data;
      });
    }
  },
  //生命周期 - 创建完成（可以访问当前this实例）
  created() {},
  //生命周期 - 挂载完成（可以访问DOM元素）
  mounted() {
    //监听三级分类消息的变化
    this.subscribe = PubSub.subscribe("catPath", (msg, val) => {
      this.catId = val[val.length - 1];
      this.getCatBrands();
    });
  },
  beforeCreate() {}, //生命周期 - 创建之前
  beforeMount() {}, //生命周期 - 挂载之前
  beforeUpdate() {}, //生命周期 - 更新之前
  updated() {}, //生命周期 - 更新之后
  beforeDestroy() {
    PubSub.unsubscribe(this.subscribe); //销毁订阅
  }, //生命周期 - 销毁之前
  destroyed() {}, //生命周期 - 销毁完成
  activated() {} //如果页面有keep-alive缓存功能，这个函数会触发
};
</script>
<style scoped>
</style>
```
### spuinfo.vue
`src\views\modules\product\spuinfo.vue`
```vue
<template>
  <div class="mod-config">
    <el-table
      :data="dataList"
      border
      v-loading="dataListLoading"
      @selection-change="selectionChangeHandle"
      style="width: 100%;"
    >
      <el-table-column type="selection" header-align="center" align="center" width="50"></el-table-column>
      <el-table-column prop="id" header-align="center" align="center" label="id"></el-table-column>
      <el-table-column prop="spuName" header-align="center" align="center" label="名称"></el-table-column>
      <el-table-column prop="spuDescription" header-align="center" align="center" label="描述"></el-table-column>
      <el-table-column prop="catalogId" header-align="center" align="center" label="分类"></el-table-column>
      <el-table-column prop="brandId" header-align="center" align="center" label="品牌"></el-table-column>
      <el-table-column prop="weight" header-align="center" align="center" label="重量"></el-table-column>
      <el-table-column prop="publishStatus" header-align="center" align="center" label="上架状态">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.publishStatus == 0">新建</el-tag>
          <el-tag v-if="scope.row.publishStatus == 1">已上架</el-tag>
          <el-tag v-if="scope.row.publishStatus == 2">已下架</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" header-align="center" align="center" label="创建时间"></el-table-column>
      <el-table-column prop="updateTime" header-align="center" align="center" label="修改时间"></el-table-column>
      <el-table-column fixed="right" header-align="center" align="center" width="150" label="操作">
        <template slot-scope="scope">
          <el-button
            v-if="scope.row.publishStatus == 0"
            type="text"
            size="small"
            @click="productUp(scope.row.id)"
          >上架</el-button>
          <el-button type="text" size="small" @click="attrUpdateShow(scope.row)">规格</el-button>
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
export default {
  data() {
    return {
      dataSub: null,
      dataForm: {},
      dataList: [],
      pageIndex: 1,
      pageSize: 10,
      totalPage: 0,
      dataListLoading: false,
      dataListSelections: [],
      addOrUpdateVisible: false
    };
  },
  props: {
    catId: {
      type: Number,
      default: 0
    }
  },
  components: {},
  activated() {
    this.getDataList();
  },
  methods: {
    productUp(id) {
      this.$http({
        url: this.$http.adornUrl("/product/spuinfo/" + id + "/up"),
        method: "post"
      }).then(({ data }) => {
        if (data && data.code === 0) {
          this.$message({
            message: "操作成功",
            type: "success",
            duration: 1500,
            onClose: () => {
              this.getDataList();
            }
          });
        } else {
          this.$message.error(data.msg);
        }
      });
    },
    attrUpdateShow(row) {
      console.log(row);
      this.$router.push({
        path: "/product-attrupdate",
        query: { spuId: row.id, catalogId: row.catalogId }
      });
    },
    // 获取数据列表
    getDataList() {
      this.dataListLoading = true;
      let param = {};
      Object.assign(param, this.dataForm, {
        page: this.pageIndex,
        limit: this.pageSize
      });
      this.$http({
        url: this.$http.adornUrl("/product/spuinfo/list"),
        method: "get",
        params: this.$http.adornParams(param)
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
    },
    // 新增 / 修改
    addOrUpdateHandle(id) {}
  },
  mounted() {
    this.dataSub = PubSub.subscribe("dataForm", (msg, val) => {
      console.log("~~~~~", val);
      this.dataForm = val;
      this.getDataList();
    });
  },
  beforeDestroy() {
    PubSub.unsubscribe(this.dataSub);
  }
};
</script>
```

---

## 后端代码

### Controller
`cfmall-product/src/main/java/com/gyz/cfmall/product/controller/SpuInfoController.java`
```java
    @Autowired
    private SpuInfoService spuInfoService;

	/**
     * 列表
     */
@RequestMapping("/list")
public R list(@RequestParam Map<String, Object> params) {
    PageUtils page = spuInfoService.queryPageByCondtion(params);

    return R.ok().put("page", page);
}
```
### Service
`cfmall-product/src/main/java/com/gyz/cfmall/product/service/impl/SpuInfoServiceImpl.java`
```java
    /**
     * spu检索
     * @param params
     * @return
     */
    @Override
    public PageUtils queryPageByCondtion(Map<String, Object> params) {

        //构造查询条件
        QueryWrapper<SpuInfoEntity> queryWrapper = new QueryWrapper<>();

        String key = (String) params.get("key");
        if (!StringUtils.isEmpty(key)) {
            queryWrapper.and(wrapper -> {
                wrapper.eq("id", key).or().like("spu_name", key);
            });
        }

        String status = (String) params.get("status");
        if (!org.apache.commons.lang.StringUtils.isEmpty(status)) {
            queryWrapper.eq("publish_status", status);
        }

        String brandId = (String) params.get("brandId");
        if (!org.apache.commons.lang.StringUtils.isEmpty(brandId) && !"0".equalsIgnoreCase(brandId)) {
            queryWrapper.eq("brand_id", brandId);
        }

        String catelogId = (String) params.get("catelogId");
        if (!org.apache.commons.lang.StringUtils.isEmpty(catelogId) && !"0".equalsIgnoreCase(catelogId)) {
            queryWrapper.eq("catalog_id", catelogId);
        }

        IPage<SpuInfoEntity> page = this.page(
                new Query<SpuInfoEntity>().getPage(params),
                queryWrapper
        );

        return new PageUtils(page);
    }
```

---

## 时间格式化
`cfmall-product/src/main/resources/application.yml`
```yaml
spring:
  jackson:
    date-format: yyyy-MM-dd HH:mm:ss  # 时间格式化
  //其它代码省略....
```

---

## 测试
页面效果

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311241328586.png#id=g9Mz2&originHeight=489&originWidth=1661&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)
