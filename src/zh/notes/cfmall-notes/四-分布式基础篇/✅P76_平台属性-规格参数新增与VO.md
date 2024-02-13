---
title: ✅P76_平台属性-规格参数新增与VO
category:
  - 谷粒商城
date: 2024-02-13
---

<!-- more -->

## 导入组件

导入规格参数新增/修改组件

`src\views\modules\product\baseattr.vue`

```vue
import AttrAddOrUpdate from './attr-add-or-update.vue';

//import引入的组件需要注入到对象中才能使用
components: { Category, AttrAddOrUpdate },
```

使用组件

```vue
<!-- 弹窗, 新增/修改 ref="AttrAddOrUpdate" ：使用组件，名称和组件名称定义一样-->
<!-- 标签名称既可以和组件定义名称一样，也可以采用短横方式连接，如下 -->
<attr-add-or-update v-if="addOrUpdateVisible" ref="AttrAddOrUpdate"
    @refreshDataList="getDataList"></attr-add-or-update>
```

---

## 页面优化

针对规格参数列表章节页面显示的优化：以下是部分列表展示的优化

`src\views\modules\product\baseattr.vue`

```vue
<el-table-column v-if="attrtype == 1" prop="searchType" header-align="center" align="center"
    label="可检索">
    <template slot-scope="scope">
        <i class="el-icon-success" v-if="scope.row.searchType == 1"></i>
        <i class="el-icon-error" v-else></i>
    </template>
</el-table-column>

<el-table-column prop="valueType" header-align="center" align="center" label="值类型">
    <template slot-scope="scope">
        <el-tag type="success" v-if="scope.row.valueType == 0">单选</el-tag>
        <el-tag v-else>多选</el-tag>
    </template>
</el-table-column>

<el-table-column prop="enable" header-align="center" align="center" label="启用">
    <template slot-scope="scope">
        <i class="el-icon-success" v-if="scope.row.enable == 1"></i>
        <i class="el-icon-error" v-else></i>
    </template>
</el-table-column>

<el-table-column v-if="attrtype == 1" prop="showDesc" header-align="center" align="center"
    label="快速展示">
    <template slot-scope="scope">
        <i class="el-icon-success" v-if="scope.row.showDesc == 1"></i>
        <i class="el-icon-error" v-else></i>
    </template>
</el-table-column>

props: {
    attrtype: {
        type: Number,
        default: 1
    }
},
```

实现效果

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311202049027.png#id=aV5eG&originHeight=386&originWidth=1662&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

点击菜单，页面初始化数据实现

```vue
//生命周期 - 创建完成（可以访问当前this实例）
created() {
    this.getDataList();
},
```

---

## baseattr.vue

内容详解：

- `v-if="attrtype == 1"`：attrtype 在props中定义
- `/product/attr/${attrType}/list/${this.catId}`：${attrType}用于区分基本属性/销售属性，页面菜单`规格参数`和`销售属性`共用这一个查询接口

```vue
<template>
    <div>
        <el-row :gutter="20">
            <el-col :span="6">
                <!-- 组件名大小写都可以 -->
                <category @node-click="treeNodeClick"></category>
            </el-col>
            <el-col :span="18">
                <div class="mod-config">
                    <el-form :inline="true" :model="dataForm" @keyup.enter.native="getDataList()">
                        <el-form-item>
                            <el-input v-model="dataForm.key" placeholder="参数名" clearable></el-input>
                        </el-form-item>
                        <el-form-item>
                            <el-button @click="getDataList()">查询</el-button>
                            <el-button v-if="isAuth('product:attr:save')" type="primary"
                                @click="addOrUpdateHandle()">新增</el-button>
                            <el-button v-if="isAuth('product:attr:delete')" type="danger" @click="deleteHandle()"
                                :disabled="dataListSelections.length <= 0">批量删除</el-button>
                        </el-form-item>
                    </el-form>
                    <el-table :data="dataList" border v-loading="dataListLoading" @selection-change="selectionChangeHandle"
                        style="width: 100%;">
                        <el-table-column type="selection" header-align="center" align="center" width="50">
                        </el-table-column>
                        <el-table-column prop="attrId" header-align="center" align="center" label="id">
                        </el-table-column>
                        <el-table-column prop="attrName" header-align="center" align="center" label="属性名">
                        </el-table-column>
                        <!-- 参考： -->
                        <el-table-column v-if="attrtype == 1" prop="searchType" header-align="center" align="center"
                            label="可检索">
                            <template slot-scope="scope">
                                <i class="el-icon-success" v-if="scope.row.searchType == 1"></i>
                                <i class="el-icon-error" v-else></i>
                            </template>
                        </el-table-column>
                        <el-table-column prop="valueType" header-align="center" align="center" label="值类型">
                            <template slot-scope="scope">
                                <el-tag type="success" v-if="scope.row.valueType == 0">单选</el-tag>
                                <el-tag v-else>多选</el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column prop="icon" header-align="center" align="center" label="图标">
                        </el-table-column>
                        <el-table-column prop="valueSelect" header-align="center" align="center" label="可选值">
                        </el-table-column>
                        <!-- <el-table-column prop="attrType" header-align="center" align="center"
                            label="属性类型[0-销售属性，1-基本属性，2-既是销售属性又是基本属性]">
                        </el-table-column> -->
                        <el-table-column prop="enable" header-align="center" align="center" label="启用">
                            <template slot-scope="scope">
                                <i class="el-icon-success" v-if="scope.row.enable == 1"></i>
                                <i class="el-icon-error" v-else></i>
                            </template>
                        </el-table-column>
                        <el-table-column prop="catelogName" header-align="center" align="center" label="所属分类">
                        </el-table-column>
                        <el-table-column v-if="attrtype == 1" prop="groupName" header-align="center" align="center"
                            label="所属分组"></el-table-column>
                        <el-table-column v-if="attrtype == 1" prop="showDesc" header-align="center" align="center"
                            label="快速展示">
                            <template slot-scope="scope">
                                <i class="el-icon-success" v-if="scope.row.showDesc == 1"></i>
                                <i class="el-icon-error" v-else></i>
                            </template>
                        </el-table-column>
                        <el-table-column fixed="right" header-align="center" align="center" width="150" label="操作">
                            <template slot-scope="scope">
                                <el-button type="text" size="small"
                                    @click="addOrUpdateHandle(scope.row.attrId)">修改</el-button>
                                <el-button type="text" size="small" @click="deleteHandle(scope.row.attrId)">删除</el-button>
                            </template>
                        </el-table-column>
                    </el-table>
                    <el-pagination @size-change="sizeChangeHandle" @current-change="currentChangeHandle"
                        :current-page="pageIndex" :page-sizes="[10, 20, 50, 100]" :page-size="pageSize" :total="totalPage"
                        layout="total, sizes, prev, pager, next, jumper">
                    </el-pagination>
                    <!-- 弹窗, 新增 / 修改 ref="AttrAddOrUpdate" ：使用组件，名称注意和组件名称定义一样-->
                    <!-- 标签名称既可以和组件定义名称一样，也可以采用短横方式连接，如下 -->
                    <attr-add-or-update v-if="addOrUpdateVisible" ref="AttrAddOrUpdate"
                        @refreshDataList="getDataList"></attr-add-or-update>
                </div>
            </el-col>
        </el-row>
    </div>
</template>

<script>
//这里可以导入其他文件（比如：组件，工具js，第三方插件js，json文件，图片文件等等）
//例如：import 《组件名称》 from '《组件路径》';
import Category from '../common/category.vue';
import AttrAddOrUpdate from './attr-add-or-update.vue';

export default {
    //import引入的组件需要注入到对象中才能使用
    components: { Category, AttrAddOrUpdate },
    props: {
        attrtype: {
            type: Number,
            default: 1
        }
    },
    data() {
        //这里存放数据
        return {
            catId: 0,
            dataForm: {
                key: ''
            },
            dataList: [],
            pageIndex: 1,
            pageSize: 10,
            totalPage: 0,
            dataListLoading: false,
            dataListSelections: [],
            addOrUpdateVisible: false
        };
    },
    //监听属性 类似于data概念
    computed: {},
    //监控data中的数据变化
    watch: {},
    //方法集合
    methods: {


        //子组件传给父组件的参数
        treeNodeClick(data, node, component) {
            console.log("父组件接收到子组件传递过来的数据为：", data, node, component);
            if (node.level == 3) {
                this.catId = data.catId;
                this.getDataList();
            }
        },

        // 获取数据列表
        getDataList() {
            this.dataListLoading = true
            let attrType = this.attrtype == 0 ? "sale" : "base";
            this.$http({
                url: this.$http.adornUrl(`/product/attr/${attrType}/list/${this.catId}`),
                method: 'get',
                params: this.$http.adornParams({
                    'page': this.pageIndex,
                    'limit': this.pageSize,
                    'key': this.dataForm.key
                })
            }).then(({ data }) => {
                if (data && data.code === 0) {
                    this.dataList = data.page.list
                    this.totalPage = data.page.totalCount
                } else {
                    this.dataList = []
                    this.totalPage = 0
                }
                this.dataListLoading = false
            })
        },
        // 每页数
        sizeChangeHandle(val) {
            this.pageSize = val
            this.pageIndex = 1
            this.getDataList()
        },
        // 当前页
        currentChangeHandle(val) {
            this.pageIndex = val
            this.getDataList()
        },
        // 多选
        selectionChangeHandle(val) {
            this.dataListSelections = val
        },
        // 新增 / 修改
        addOrUpdateHandle(id) {
            this.addOrUpdateVisible = true
            this.$nextTick(() => {
                this.$refs.AttrAddOrUpdate.init(id)
            })
        },
        // 删除
        deleteHandle(id) {
            var ids = id ? [id] : this.dataListSelections.map(item => {
                return item.attrId
            })
            this.$confirm(`确定对[id=${ids.join(',')}]进行[${id ? '删除' : '批量删除'}]操作?`, '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                this.$http({
                    url: this.$http.adornUrl('/product/attr/delete'),
                    method: 'post',
                    data: this.$http.adornData(ids, false)
                }).then(({ data }) => {
                    if (data && data.code === 0) {
                        this.$message({
                            message: '操作成功',
                            type: 'success',
                            duration: 1500,
                            onClose: () => {
                                this.getDataList()
                            }
                        })
                    } else {
                        this.$message.error(data.msg)
                    }
                })
            })
        }
    },
    //生命周期 - 创建完成（可以访问当前this实例）
    created() {
        this.getDataList();
    },
}
</script>
<style  scoped></style>
```

---

## 规格参数新增

### 前端代码

#### 回显数据

点击新增按钮，调用`AttrAddOrUpdate`init方法

```javascript
// 新增 / 修改
addOrUpdateHandle(id) {
    this.addOrUpdateVisible = true
    this.$nextTick(() => {
        this.$refs.AttrAddOrUpdate.init(id)
    })
},
```

`AttrAddOrUpdate`组件初始化数据，

```javascript
methods: {
  init(id) {
    this.dataForm.attrId = id || 0;
    this.visible = true;
    this.$nextTick(() => {
      this.$refs['dataForm'].resetFields();
      if (this.dataForm.attrId) {
        this.$http({
          url: this.$http.adornUrl(`/product/attr/info/${this.dataForm.attrId}`),
          method: 'get',
          params: this.$http.adornParams()
        }).then(({ data }) => {
          if (data && data.code === 0) {
            this.dataForm.attrName = data.attr.attrName;
            this.dataForm.searchType = data.attr.searchType;
            this.dataForm.valueType = data.attr.valueType;
            this.dataForm.icon = data.attr.icon;
            this.dataForm.valueSelect = data.attr.valueSelect.split("");
            this.dataForm.attrType = data.attr.attrType;
            this.dataForm.enable = data.attr.enable;
            this.dataForm.catelogId = data.attr.catelogId;
            this.dataForm.showDesc = data.attr.showDesc;
            this.catelogPath = data.attr.catelogPath;
            this.$nextTick(() => {
              this.dataForm.attrGroupId = data.attr.attrGroupId;
            });
          }
        });
      }
    });
  },
 }
```

调用后台`/product/attr/info/${this.dataForm.attrId}`接口获取规格参数详情，

#### 导入级联选择器组件

导入`CategoryCascader`组件

```
import CategoryCascader from "../common/category-cascader.vue";
```

使用组件，

```
<el-form-item label="所属分类" prop="catelogId">
  <category-cascader :catelogPath.sync="catelogPath"></category-cascader>
</el-form-item>
```

`category-cascader.vue`

```vue
<template>
  <!--
使用说明：
1）、引入category-cascader.vue
2）、语法：<category-cascader :catelogPath.sync="catelogPath"></category-cascader>
    解释：
      catelogPath：指定的值是cascader初始化需要显示的值，应该和父组件的catelogPath绑定;
          由于有sync修饰符，所以cascader路径变化以后自动会修改父的catelogPath，这是结合子组件this.$emit("update:catelogPath",v);做的
      -->
  <div>
    <el-cascader
      filterable
      clearable
      placeholder="试试搜索：手机"
      v-model="paths"
      :options="categorys"
      :props="setting"
    ></el-cascader>
  </div>
</template>

<script>
//这里可以导入其他文件（比如：组件，工具js，第三方插件js，json文件，图片文件等等）
//例如：import 《组件名称》 from '《组件路径》';

export default {
  //import引入的组件需要注入到对象中才能使用
  components: {},
  //接受父组件传来的值
  props: {
    catelogPath: {
      type: Array,
      default() {
        return [];
      },
    },
  },
  data() {
    //这里存放数据
    return {
      setting: {
        value: "catId",
        label: "name",
        children: "children",
      },
      categorys: [],
      paths: this.catelogPath,
    };
  },
  watch: {
    catelogPath(v) {
      this.paths = this.catelogPath;
      console.log(this.paths);
    },
    paths(v) {
      this.$emit("update:catelogPath", v);
      //还可以使用pubsub-js进行传值
      PubSub.publish("catPath", v);
    },
  },
  //方法集合
  methods: {
    getCategorys() {
      this.$http({
        url: this.$http.adornUrl("/product/category/list/tree"),
        method: "get",
      }).then(({ data }) => {
        this.categorys = data.data;
      });
    },
  },
  //生命周期 - 创建完成（可以访问当前this实例）
  created() {
    this.getCategorys();
  },
};
</script>
<style scoped>
</style>
```

监听所属分类路径变化

```javascript
watch: {
  catelogPath(path) {
    //监听到路径变化需要查出这个三级分类的分组信息
    console.log("路径变了", path);
    this.attrGroups = [];
    this.dataForm.attrGroupId = "";
    this.dataForm.catelogId = path[path.length - 1];
    if (path && path.length == 3) {
      this.$http({
        url: this.$http.adornUrl(
          `/product/attrgroup/list/${path[path.length - 1]}`
        ),
        method: "get",
        params: this.$http.adornParams({ page: 1, limit: 10000000 })
      }).then(({ data }) => {
        if (data && data.code === 0) {
          this.attrGroups = data.page.list;
        } else {
          this.$message.error(data.msg);
        }
      });
    } else if (path.length == 0) {
      this.dataForm.catelogId = "";
    } else {
      this.$message.error("请选择正确的分类");
      this.dataForm.catelogId = "";
    }
  }
},
```

#### 完整代码：attr-add-or-update.vue

`src\views\modules\product\attr-add-or-update.vue`

内容详解：

- `v-if="type == 1"`：type在props中定义

```vue
<template>
  <el-dialog :title="!dataForm.attrId ? '新增' : '修改'" :close-on-click-modal="false" :visible.sync="visible">
    <el-form :model="dataForm" :rules="dataRule" ref="dataForm" @keyup.enter.native="dataFormSubmit()" label-width="80px">
      <el-form-item label="属性名" prop="attrName">
        <el-input v-model="dataForm.attrName" placeholder="属性名"></el-input>
      </el-form-item>
      <el-form-item label="属性类型" prop="attrType">
        <el-select v-model="dataForm.attrType" placeholder="请选择">
          <el-option label="规格参数" :value="1"></el-option>
          <el-option label="销售属性" :value="0"></el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="值类型" prop="valueType">
        <el-switch v-model="dataForm.valueType" active-text="允许多个值" inactive-text="只能单个值" active-color="#13ce66"
          inactive-color="#ff4949" :inactive-value="0" :active-value="1"></el-switch>
      </el-form-item>
      <!-- 参考Element->Select选择器。multiple：多选  filterable：启用搜索功能-->
      <!-- allow-create：是否允许用户创建新条目，需配合 filterable 使用 -->
      <el-form-item label="可选值" prop="valueSelect">
        <el-select v-model="dataForm.valueSelect" filterable multiple allow-create placeholder="请输入内容"></el-select>
      </el-form-item>
      <el-form-item label="属性图标" prop="icon">
        <el-input v-model="dataForm.icon" placeholder="属性图标"></el-input>
      </el-form-item>
      <el-form-item label="所属分类" prop="catelogId">
        <category-cascader :catelogPath.sync="catelogPath"></category-cascader>
      </el-form-item>
      <el-form-item label="所属分组" prop="attrGroupId" v-if="type == 1">
        <el-select ref="groupSelect" v-model="dataForm.attrGroupId" placeholder="请选择">
          <el-option v-for="item in attrGroups" :key="item.index" :label="item.attrGroupName"
            :value="item.attrGroupId"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="可检索" prop="searchType">
        <el-switch v-model="dataForm.searchType" active-color="#13ce66" inactive-color="#ff4949" :active-value="1"
          :inactive-value="0"></el-switch>
      </el-form-item>
      <el-form-item label="快速展示" prop="showDesc">
        <el-switch v-model="dataForm.showDesc" active-color="#13ce66" inactive-color="#ff4949" :active-value="1"
          :inactive-value="0"></el-switch>
      </el-form-item>
      <el-form-item label="启用状态" prop="enable">
        <el-switch v-model="dataForm.enable" active-color="#13ce66" inactive-color="#ff4949" :active-value="1"
          :inactive-value="0"></el-switch>
      </el-form-item>
    </el-form>
    <span slot="footer" class="dialog-footer">
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="dataFormSubmit()">确定</el-button>
    </span>
  </el-dialog>
</template>

<script>

import CategoryCascader from "../common/category-cascader.vue";

export default {
  components: { CategoryCascader },
  props: {
    type: {
      type: Number,
      default: 1
    }
  },
  watch: {
    catelogPath(path) {
      //监听到路径变化需要查出这个三级分类的分组信息
      console.log("路径变了", path);
      this.attrGroups = [];
      this.dataForm.attrGroupId = "";
      this.dataForm.catelogId = path[path.length - 1];
      if (path && path.length == 3) {
        this.$http({
          url: this.$http.adornUrl(
            `/product/attrgroup/list/${path[path.length - 1]}`
          ),
          method: "get",
          params: this.$http.adornParams({ page: 1, limit: 10000000 })
        }).then(({ data }) => {
          if (data && data.code === 0) {
            this.attrGroups = data.page.list;
          } else {
            this.$message.error(data.msg);
          }
        });
      } else if (path.length == 0) {
        this.dataForm.catelogId = "";
      } else {
        this.$message.error("请选择正确的分类");
        this.dataForm.catelogId = "";
      }
    }
  },
  data() {
    return {
      visible: false,
      catelogPath: [], //所属分类
      attrGroups: [],
      dataForm: {
        attrId: 0,
        attrName: '',
        attrType: 1,
        valueType: 1,
        valueSelect: '',
        icon: '',
        catelogId: '',
        attrGroupId: '',
        searchType: 0,
        showDesc: '',
        enable: ''
      },
      dataRule: {
        attrName: [
          { required: true, message: '属性名不能为空', trigger: 'blur' }
        ],
        searchType: [
          { required: true, message: '是否需要检索[0-不需要，1-需要]不能为空', trigger: 'blur' }
        ],
        valueType: [
          {
            required: true,
            message: "值类型不能为空",
            trigger: "blur"
          }
        ],
        icon: [
          { required: true, message: '属性图标不能为空', trigger: 'blur' }
        ],
        valueSelect: [
          { required: true, message: '可选值列表[用逗号分隔]不能为空', trigger: 'blur' }
        ],
        attrType: [
          { required: true, message: '属性类型[0-销售属性，1-基本属性，2-既是销售属性又是基本属性]不能为空', trigger: 'blur' }
        ],
        enable: [
          { required: true, message: '启用状态[0 - 禁用，1 - 启用]不能为空', trigger: 'blur' }
        ],
        catelogId: [
          { required: true, message: '所属分类不能为空', trigger: 'blur' }
        ],
        showDesc: [
          { required: true, message: '快速展示【是否展示在介绍上；0-否 1-是】，在sku中仍然可以调整不能为空', trigger: 'blur' }
        ]
      }
    };
  },
  methods: {
    init(id) {
      this.dataForm.attrId = id || 0;
      this.visible = true;
      this.$nextTick(() => {
        this.$refs['dataForm'].resetFields();
        if (this.dataForm.attrId) {
          this.$http({
            url: this.$http.adornUrl(`/product/attr/info/${this.dataForm.attrId}`),
            method: 'get',
            params: this.$http.adornParams()
          }).then(({ data }) => {
            if (data && data.code === 0) {
              this.dataForm.attrName = data.attr.attrName;
              this.dataForm.searchType = data.attr.searchType;
              this.dataForm.valueType = data.attr.valueType;
              this.dataForm.icon = data.attr.icon;
              this.dataForm.valueSelect = data.attr.valueSelect.split("");
              this.dataForm.attrType = data.attr.attrType;
              this.dataForm.enable = data.attr.enable;
              this.dataForm.catelogId = data.attr.catelogId;
              this.dataForm.showDesc = data.attr.showDesc;
              this.catelogPath = data.attr.catelogPath;
              this.$nextTick(() => {
                this.dataForm.attrGroupId = data.attr.attrGroupId;
              });

            }
          });
        }
      });
    },
    // 表单提交
    dataFormSubmit() {
      this.$refs['dataForm'].validate((valid) => {
        if (valid) {
          this.$http({
            url: this.$http.adornUrl(`/product/attr/${!this.dataForm.attrId ? 'save' : 'update'}`),
            method: 'post',
            data: this.$http.adornData({
              'attrId': this.dataForm.attrId || undefined,
              'attrName': this.dataForm.attrName,
              'searchType': this.dataForm.searchType,
              'valueType': this.dataForm.valueType,
              'icon': this.dataForm.icon,
              'valueSelect': this.dataForm.valueSelect.join(";"),
              'attrType': this.dataForm.attrType,
              'enable': this.dataForm.enable,
              'catelogId': this.dataForm.catelogId,
              'showDesc': this.dataForm.showDesc,
              'attrGroupId': this.dataForm.attrGroupId
            })
          }).then(({ data }) => {
            if (data && data.code === 0) {
              this.$message({
                message: '操作成功',
                type: 'success',
                duration: 1500,
                onClose: () => {
                  this.visible = false;
                  this.$emit('refreshDataList');
                }
              });
            }
            else {
              this.$message.error(data.msg);
            }
          });
        }
      });
    },
    //获取三级分类
    getCategories() {
      this.dataListLoading = true;
      this.$http({
        url: this.$http.adornUrl('/product/category/list/tree'),
        method: 'get'
      }).then(({ data }) => {
        console.log("获取三级分类数据:", data);
        this.categories = data.data;
      });
    },
  },

}
</script>
```

### 后台代码

#### 获取规格参数详情

`cfmall-product/src/main/java/com/gyz/cfmall/product/controller/AttrController.java`

```java
    /**
     * 信息
     */
    @RequestMapping("/info/{attrId}")
    public R info(@PathVariable("attrId") Long attrId) {
        AttrRespVo respVo = attrService.getAttrInfo(attrId);
        return R.ok().put("attr", respVo);
    }
```

`cfmall-product/src/main/java/com/gyz/cfmall/product/service/impl/AttrServiceImpl.java`

```java
    @Override
    public AttrRespVo getAttrInfo(Long attrId) {
        //查询详细信息
        AttrEntity attrEntity = this.getById(attrId);

        //查询分组信息
        AttrRespVo respVo = new AttrRespVo();
        BeanUtils.copyProperties(attrEntity, respVo);


        //判断是否是基本类型
        if (attrEntity.getAttrType() == ProductConstant.AttrEnum.ATTR_TYPE_BASE.getCode()) {
            //1、设置分组信息
            AttrAttrgroupRelationEntity relationEntity = relationDao.selectOne
                    (new QueryWrapper<AttrAttrgroupRelationEntity>().eq("attr_id", attrId));
            if (relationEntity != null) {
                respVo.setAttrGroupId(relationEntity.getAttrGroupId());
                //获取分组名称
                AttrGroupEntity attrGroupEntity = attrGroupDao.selectById(relationEntity.getAttrGroupId());
                if (attrGroupEntity != null) {
                    respVo.setGroupName(attrGroupEntity.getAttrGroupName());
                }
            }
        }
        //2、设置分类信息
        Long catelogId = attrEntity.getCatelogId();
        Long[] catelogPath = categoryService.findCatelogPath(catelogId);
        respVo.setCatelogPath(catelogPath);

        CategoryEntity categoryEntity = categoryDao.selectById(catelogId);
        if (categoryEntity != null) {
            respVo.setCatelogName(categoryEntity.getName());
        }

        return respVo;
    }
```

`cfmall-product/src/main/java/com/gyz/cfmall/product/vo/AttrRespVo.java`

```java
@Data
public class AttrRespVo extends AttrVo {

    private String catelogName;

    private String groupName;

    private Long[] catelogPath;

}
```

`cfmall-product/src/main/java/com/gyz/cfmall/product/vo/AttrVo.java`

```java
package com.gyz.cfmall.product.vo;

import lombok.Data;

/**
 * @Description
 * @Author GongYuZhuo
 * @Version 1.0.0
 */
@Data
public class AttrVo {
    /**
     * 属性id
     */
    private Long attrId;
    /**
     * 属性名
     */
    private String attrName;
    /**
     * 是否需要检索[0-不需要，1-需要]
     */
    private Integer searchType;
    /**
     * 属性图标
     */
    private String icon;
    /**
     * 可选值列表[用逗号分隔]
     */
    private String valueSelect;
    /**
     * 可选值类型
     */
    private String valueType;
    /**
     * 属性类型[0-销售属性，1-基本属性，2-既是销售属性又是基本属性]
     */
    private Integer attrType;
    /**
     * 启用状态[0 - 禁用，1 - 启用]
     */
    private Long enable;
    /**
     * 快速展示【是否展示在介绍上；0-否 1-是】，在sku中仍然可以调整
     */
    private Integer showDesc;

    /**
     * 属性组id
     */
    private Long attrGroupId;

    /**
     * 属性组id
     */
    private String groupName;

    /**
     * 所属分类
     */
    private Long catelogId;

}
```

枚举类：`cfmall-common/src/main/java/com/gyz/common/constant/ProductConstant.java`

```java
package com.gyz.common.constant;

/**
 * @Description
 * @Author GongYuZhuo
 * @Version 1.0.0
 */
public class ProductConstant {

    public enum AttrEnum {
        ATTR_TYPE_BASE(1, "基本属性"),
        ATTR_TYPE_SALE(0, "销售属性");

        private int code;

        private String msg;

        public int getCode() {
            return code;
        }

        public String getMsg() {
            return msg;
        }

        AttrEnum(int code, String msg) {
            this.code = code;
            this.msg = msg;
        }
    }

}
```

#### 新增规格参数

`cfmall-product/src/main/java/com/gyz/cfmall/product/controller/AttrController.java`

```java
    /**
     * 保存
     */
    @RequestMapping("/save")
    public R save(@RequestBody AttrVo attr) {
        attrService.saveAttr(attr);
        return R.ok();
    }
```

`cfmall-product/src/main/java/com/gyz/cfmall/product/service/impl/AttrServiceImpl.java`

```java
    @Transactional(rollbackFor = Exception.class)
    @Override
    public void saveAttr(AttrVo attr) {
        AttrEntity attrEntity = new AttrEntity();
        BeanUtils.copyProperties(attr, attrEntity);
        //1、保存基本数据
        this.save(attrEntity);

        //2、保存关联关系
        //判断类型，如果是基本属性就设置分组id
        if (attr.getAttrType() == ProductConstant.AttrEnum.ATTR_TYPE_BASE.getCode() && attr.getAttrGroupId() != null) {
            AttrAttrgroupRelationEntity relationEntity = new AttrAttrgroupRelationEntity();
            relationEntity.setAttrGroupId(attr.getAttrGroupId());
            relationEntity.setAttrId(attrEntity.getAttrId());
            relationDao.insert(relationEntity);
        }
    }
```

#### 实现效果

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311202113314.png#id=lbvMx&originHeight=847&originWidth=925&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)
