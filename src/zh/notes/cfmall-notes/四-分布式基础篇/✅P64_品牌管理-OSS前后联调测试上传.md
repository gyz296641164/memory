---
title: ✅P64_品牌管理-OSS前后联调测试上传
category:
  - 谷粒商城
date: 2024-02-13
---

<!-- more -->

## 单/多文件上传组件

将课件中`分布式基础\代码\前端组件\upload`上传文件组件复制到项目中，

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311141404489.png#id=kGjKZ&originHeight=283&originWidth=297&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

### policy.js 上传函数封装

```javascript
import http from '@/utils/httpRequest.js'
export function policy() {
    return new Promise((resolve, reject) => {
        http({
            url: http.adornUrl('/thirdparty/oss/policy'),
            method: 'get',
            params: http.adornParams({}),
        }).then(({ data }) => {
            resolve(data);
        })
    });
}
```

### singleUpload.vue单文件上传组件

修改请求地址为：action="[http://cfmall-hello.oss-cn-beijing.aliyuncs.com](http://cfmall-hello.oss-cn-beijing.aliyuncs.com)"

```vue
<template>
  <div>
    <el-upload action="http://cfmall-hello.oss-cn-beijing.aliyuncs.com" 
      :data="dataObj" 
      list-type="picture"
      :multiple="false" 
      :show-file-list="showFileList" 
      :file-list="fileList" 
      :before-upload="beforeUpload"
      :on-remove="handleRemove" 
      :on-success="handleUploadSuccess" 
      :on-preview="handlePreview">
      <el-button size="small" type="primary">点击上传</el-button>
      <div slot="tip" class="el-upload__tip">
        只能上传jpg/png文件，且不超过10MB
      </div>
    </el-upload>
    <el-dialog :visible.sync="dialogVisible">
      <img width="100%" :src="fileList[0].url" alt="" />
    </el-dialog>
  </div>
</template>
<script>
import { policy } from "./policy";
import { getUUID } from "@/utils";

export default {
  name: "singleUpload",
  props: {
    value: String,
  },
  computed: {
    imageUrl() {
      return this.value;
    },
    imageName() {
      if (this.value != null && this.value !== "") {
        return this.value.substr(this.value.lastIndexOf("/") + 1);
      } else {
        return null;
      }
    },
    fileList() {
      return [
        {
          name: this.imageName,
          url: this.imageUrl
        },
      ];
    },
    showFileList: {
      get: function () {
        return (
          this.value !== null && this.value !== "" && this.value !== undefined
        );
      },
      set: function (newValue) { },
    },
  },
  data() {
    return {
      dataObj: {
        policy: "",
        signature: "",
        key: "",
        ossaccessKeyId: "",
        dir: "",
        host: ""
        // callback:'',
      },
      dialogVisible: false
    };
  },
  methods: {
    emitInput(val) {
      this.$emit("input", val);
    },
    handleRemove(file, fileList) {
      this.emitInput("");
    },
    handlePreview(file) {
      this.dialogVisible = true;
    },
    beforeUpload(file) {
      let _self = this;
      return new Promise((resolve, reject) => {
        policy()
          .then((response) => {
            console.log("响应的数据", response);
            _self.dataObj.policy = response.data.policy;
            _self.dataObj.signature = response.data.signature;
            _self.dataObj.ossaccessKeyId = response.data.accessid;
            _self.dataObj.key = response.data.dir + getUUID() + "_${filename}";
            _self.dataObj.dir = response.data.dir;
            _self.dataObj.host = response.data.host;
            console.log("响应的数据222。。。", _self.dataObj);
            resolve(true);
          })
          .catch((err) => {
            reject(false);
          });
      });
    },
    handleUploadSuccess(res, file) {
      console.log("上传成功...");
      this.showFileList = true;
      this.fileList.pop();
      this.fileList.push({
        name: file.name,
        url:
          this.dataObj.host +
          "/" +
          this.dataObj.key.replace("${filename}", file.name),
      });
      this.emitInput(this.fileList[0].url);
    }
  }
};
</script>
<style></style>
```

### multiUpload.vue多文件上传组件

修改请求地址为：[http://cfmall-hello.oss-cn-beijing.aliyuncs.com](http://cfmall-hello.oss-cn-beijing.aliyuncs.com)"

```vue
<template>
  <div>
    <el-upload
      action="http://cfmall-hello.oss-cn-beijing.aliyuncs.com"
      :data="dataObj"
      :list-type="listType"
      :file-list="fileList"
      :before-upload="beforeUpload"
      :on-remove="handleRemove"
      :on-success="handleUploadSuccess"
      :on-preview="handlePreview"
      :limit="maxCount"
      :on-exceed="handleExceed"
      :show-file-list="showFile"
    >
      <i class="el-icon-plus"></i>
    </el-upload>
    <el-dialog :visible.sync="dialogVisible">
      <img width="100%" :src="dialogImageUrl" alt />
    </el-dialog>
  </div>
</template>
<script>
import { policy } from "./policy";
import { getUUID } from "@/utils";
export default {
  name: "multiUpload",
  props: {
    //图片属性数组
    value: Array,
    //最大上传图片数量
    maxCount: {
      type: Number,
      default: 30,
    },
    listType: {
      type: String,
      default: "picture-card",
    },
    showFile: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      dataObj: {
        policy: "",
        signature: "",
        key: "",
        ossaccessKeyId: "",
        dir: "",
        host: "",
        uuid: ""
      },
      dialogVisible: false,
      dialogImageUrl: null,
    };
  },
  computed: {
    fileList() {
      let fileList = [];
      for (let i = 0; i < this.value.length; i++) {
        fileList.push({ url: this.value[i] });
      }

      return fileList;
    },
  },
  mounted() {},
  methods: {
    emitInput(fileList) {
      let value = [];
      for (let i = 0; i < fileList.length; i++) {
        value.push(fileList[i].url);
      }
      this.$emit("input", value);
    },
    handleRemove(file, fileList) {
      this.emitInput(fileList);
    },
    handlePreview(file) {
      this.dialogVisible = true;
      this.dialogImageUrl = file.url;
    },
    beforeUpload(file) {
      let _self = this;
      return new Promise((resolve, reject) => {
        policy()
          .then((response) => {
            console.log("这是什么${filename}");
            _self.dataObj.policy = response.data.policy;
            _self.dataObj.signature = response.data.signature;
            _self.dataObj.ossaccessKeyId = response.data.accessid;
            _self.dataObj.key = response.data.dir + getUUID() + "_${filename}";
            _self.dataObj.dir = response.data.dir;
            _self.dataObj.host = response.data.host;
            resolve(true);
          })
          .catch((err) => {
            console.log("出错了...", err);
            reject(false);
          });
      });
    },
    handleUploadSuccess(res, file) {
      this.fileList.push({
        name: file.name,
        // url: this.dataObj.host + "/" + this.dataObj.dir + "/" + file.name； 替换${filename}为真正的文件名
        url: this.dataObj.host + "/" + this.dataObj.key.replace("${filename}", file.name),
      });
      this.emitInput(this.fileList);
    },
    handleExceed(files, fileList) {
      this.$message({
        message: "最多只能上传" + this.maxCount + "张图片",
        type: "warning",
        duration: 1000,
      });
    },
  },
};
</script>
<style>
</style>
```

### 导入组件

在`src\views\modules\product\brand-add-or-update.vue`页面引入组件，

```vue
//在<script>标签中导入组件
import singleUpload from "@/components/upload/singleUpload"
 
//在export default中声明要用到的组件
  components:{
    singleUpload
  },
```

使用组件替换LOGO地址的输入框，

```vue
      <el-form-item label="品牌logo地址" prop="logo">
        <singleUpload v-model="dataForm.logo"></singleUpload>
      </el-form-item>
```

---

## 修改CORS允许跨域访问

[阿里云官方介绍修改CORS](https://help.aliyun.com/document_detail/91868.htm?spm=a2c4g.11186623.0.0.1607c927DS55Ol#concept-ahk-rfz-2fb)

从前端8002端口转到阿里云的bucket域名，会有跨域问题。跨域都是目标地址需要配置规则，所以在阿里云配置跨域规则，

操作步骤如下：

点击Bucket，点击“数据安全”->“跨域设置”

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311141414785.png#id=cQTk2&originHeight=415&originWidth=861&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

创建规则，

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311141415547.png#id=olsaL&originHeight=827&originWidth=778&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

---

## 测试

“品牌管理”->“新增”

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311141418987.png#id=wpyev&originHeight=666&originWidth=945&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)

点击确定后，发现OSS管理控制台图片上传成功

![](https://cfmall-hello.oss-cn-beijing.aliyuncs.com/img/202311/202311141419607.png#id=iptFh&originHeight=581&originWidth=608&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)
