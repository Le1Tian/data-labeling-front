<template>
  <div class="home">
    <el-container>
      <el-header style="height: 20%">
        <h1>数据标注系统</h1>
      </el-header>

      <el-main>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-card>
              <div slot="header">
                <span>数据集管理</span>
                <el-button style="float: right; padding: 3px 0" type="text" @click="showAddDatasetDialog = true">
                  新建数据集
                </el-button>
              </div>

              <el-table :data="datasets" style="width: 100%">
                <el-table-column prop="datasetName" label="数据集名称"></el-table-column>
                <el-table-column prop="datasetType" label="类型"></el-table-column>
                <el-table-column prop="status" label="状态">
                  <template slot-scope="scope">
                    <el-tag :type="getStatusType(scope.row.status)">
                      {{ getStatusText(scope.row.status) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="操作">
                  <template slot-scope="scope">
                    <el-button size="mini" @click="goToAnnotation(scope.row)">标注</el-button>
                    <el-button size="mini" type="danger" @click="deleteDataset(scope.row)">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </el-col>

<!--          <el-col :span="12">-->
<!--            <el-card>-->
<!--              <div slot="header">-->
<!--                <span>快速操作</span>-->
<!--              </div>-->

<!--              <el-button type="primary" @click="goToAnnotation()" style="width: 100%; margin-bottom: 10px;">-->
<!--                开始标注-->
<!--              </el-button>-->

<!--              <el-button type="success" @click="exportData" style="width: 100%; margin-bottom: 10px;">-->
<!--                导出数据-->
<!--              </el-button>-->

<!--              <el-button type="warning" @click="importData" style="width: 100%;">-->
<!--                导入数据-->
<!--              </el-button>-->
<!--            </el-card>-->
<!--          </el-col>-->
        </el-row>
      </el-main>
    </el-container>

    <!-- 新建数据集对话框 -->
    <el-dialog title="新建数据集" :visible.sync="showAddDatasetDialog" width="500px">
      <el-form :model="newDataset" :rules="datasetRules" ref="datasetForm" label-width="100px">
        <el-form-item label="数据集名称" prop="datasetName">
          <el-input v-model="newDataset.datasetName" placeholder="请输入数据集名称"></el-input>
        </el-form-item>

        <el-form-item label="数据集描述" prop="datasetDesc">
          <el-input type="textarea" v-model="newDataset.datasetDesc" placeholder="请输入数据集描述"></el-input>
        </el-form-item>

        <el-form-item label="数据集类型" prop="datasetType">
          <el-select v-model="newDataset.datasetType" placeholder="请选择数据集类型" style="width: 100%">
            <el-option label="分类" value="分类"></el-option>
            <el-option label="检测" value="检测"></el-option>
            <el-option label="分割" value="分割"></el-option>
          </el-select>
        </el-form-item>
      </el-form>

      <div slot="footer" class="dialog-footer">
        <el-button @click="showAddDatasetDialog = false">取 消</el-button>
        <el-button type="primary" @click="addDataset">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'Home',
  data() {
    return {
      datasets: [],
      showAddDatasetDialog: false,
      newDataset: {
        datasetName: '',
        datasetDesc: '',
        datasetType: '',
        projectSpaceId: 1
      },
      datasetRules: {
        datasetName: [
          { required: true, message: '请输入数据集名称', trigger: 'blur' }
        ],
        datasetType: [
          { required: true, message: '请选择数据集类型', trigger: 'change' }
        ]
      }
    }
  },

  mounted() {
    this.fetchDatasets()
  },

  methods: {
    async fetchDatasets() {
      try {
        const response = await this.$http.post('/datasetInfo/page', {
          current: 1,
          size: 100
        })
        if (response.code === 200) {
          this.datasets = response.data.records
          console.log('获取的数据集',this.datasets)
        }
      } catch (error) {
        this.$message.error('获取数据集失败')
      }
    },

    getStatusType(status) {
      const types = {
        0: 'info',
        1: 'warning',
        2: 'success'
      }
      return types[status] || 'info'
    },

    getStatusText(status) {
      const texts = {
        0: '未开始',
        1: '标注中',
        2: '已完成'
      }
      return texts[status] || '未知'
    },

    goToAnnotation(dataset = null) {
      console.log('点击标注按钮，传递的dataset:', dataset) // 添加调试日志
      if (dataset !== null) {
        this.$store.commit('SET_CURRENT_DATASET', dataset)
        console.log('已存储到Vuex的dataset:', this.$store.state.currentDataset)
      }
      this.$router.push('/annotation')
    },

    async addDataset() {
      try {
        const response = await this.$http.post('/datasetInfo/add', this.newDataset)
        if (response.code === 200) {
          this.$message.success('创建成功')
          this.showAddDatasetDialog = false
          this.fetchDatasets()
          this.newDataset = {
            datasetName: '',
            datasetDesc: '',
            datasetType: '',
            projectSpaceId: 1
          }
        } else {
          this.$message.error(response.message)
        }
      } catch (error) {
        this.$message.error('创建失败')
      }
    },

    async deleteDataset(dataset) {
      try {
        await this.$confirm('确定要删除这个数据集吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })

        const response = await this.$http.delete(`/datasetInfo/${dataset.id}`)
        if (response.code === 200) {
          this.$message.success('删除成功')
          this.fetchDatasets()
        } else {
          this.$message.error(response.message)
        }
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('删除失败')
        }
      }
    },

    exportData() {
      this.$message.info('导出功能开发中...')
    },

    importData() {
      this.$message.info('导入功能开发中...')
    }
  }
}
</script>

<style scoped>
.home {
  height: 100vh;
}

.el-header {
  background-color: #409EFF;
  color: white;
  text-align: center;
  line-height: 60px;
}

.el-main {
  padding: 20px;
}

.el-card {
  margin-bottom: 20px;
}
</style>