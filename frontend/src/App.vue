<template>
  <div class="app">
    <header class="header">
      <h1>📋 浏览器历史记录备份</h1>
      <div class="header-actions">
        <span class="total-count">共 {{ totalCount }} 条记录</span>
        <button
          v-if="selectedIds.length > 0"
          class="btn btn-wechat"
          @click="sendToWeChat"
          :disabled="sending"
        >
          {{ sending ? '发送中...' : '📤 发送选中到公众号' }}
        </button>
        <button class="btn btn-backup" @click="triggerBackup" :disabled="backuping">
          {{ backuping ? '备份中...' : '🔄 立即备份' }}
        </button>
      </div>
    </header>

    <!-- 查询区域 -->
    <section class="search-section">
      <div class="search-row">
        <input
          v-model="keyword"
          type="text"
          placeholder="搜索标题或 URL..."
          class="input search-input"
          @keyup.enter="search"
        />
        <input
          v-model="startDate"
          type="datetime-local"
          class="input date-input"
        />
        <span class="date-sep">至</span>
        <input
          v-model="endDate"
          type="datetime-local"
          class="input date-input"
        />
        <button class="btn btn-search" @click="search">🔍 查询</button>
        <button class="btn btn-clear" @click="resetSearch">清空</button>
        <label class="select-all-label">
          <input type="checkbox" v-model="selectAll" @change="toggleSelectAll" :disabled="records.length === 0" />
          全选
        </label>
      </div>
    </section>

    <!-- 提示信息 -->
    <div v-if="message" :class="['message', messageType]">
      {{ message }}
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading">加载中...</div>

    <!-- 数据列表 -->
    <div v-else class="table-wrapper" ref="tableWrapper">
      <table class="history-table" v-if="records.length > 0">
        <thead>
          <tr>
            <th class="col-cb"><input type="checkbox" v-model="selectAll" @change="toggleSelectAll" /></th>
            <th class="col-id">#</th>
            <th class="col-title">标题</th>
            <th class="col-url">URL</th>
            <th class="col-time">访问时间</th>
            <th class="col-browser">浏览器</th>
            <th class="col-action">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(record, index) in records" :key="record.id" :class="{ selected: selectedIds.includes(record.id) }">
            <td class="col-cb">
              <input type="checkbox" :checked="selectedIds.includes(record.id)" @change="toggleRow(record.id)" />
            </td>
            <td class="col-id">{{ index + 1 + page * size }}</td>
            <td class="col-title">
              <a :href="record.url" target="_blank" rel="noopener" :title="record.title">
                {{ truncate(record.title, 50) }}
              </a>
            </td>
            <td class="col-url">
              <a :href="record.url" target="_blank" rel="noopener" :title="record.url">
                {{ truncate(record.url, 40) }}
              </a>
            </td>
            <td class="col-time">{{ formatTime(record.visitTime) }}</td>
            <td class="col-browser">{{ record.browser }}</td>
            <td class="col-action">
              <button class="btn btn-danger-sm" @click="deleteRecord(record.id)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-else-if="searched" class="empty">暂无数据，请点击"立即备份"导入浏览器历史记录</div>

      <!-- 分页 -->
      <div class="pagination" v-if="totalPages > 0">
        <button :disabled="page <= 0" @click="goPage(page - 1)">上一页</button>
        <span class="page-info">第 {{ page + 1 }} / {{ totalPages }} 页</span>
        <button :disabled="page >= totalPages - 1" @click="goPage(page + 1)">下一页</button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import html2canvas from 'html2canvas'

const API_BASE = '/api/history'

export default {
  name: 'App',
  data() {
    return {
      keyword: '',
      startDate: '',
      endDate: '',
      records: [],
      page: 0,
      size: 20,
      totalPages: 0,
      totalCount: 0,
      loading: false,
      searched: false,
      backuping: false,
      sending: false,
      message: '',
      messageType: '',
      selectedIds: [],
      selectAll: false
    }
  },
  mounted() {
    this.loadStats()
  },
  methods: {
    showMessage(msg, type = 'info') {
      this.message = msg
      this.messageType = type
      setTimeout(() => { this.message = '' }, 5000)
    },

    toggleRow(id) {
      const idx = this.selectedIds.indexOf(id)
      if (idx >= 0) {
        this.selectedIds.splice(idx, 1)
      } else {
        this.selectedIds.push(id)
      }
      this.selectAll = this.selectedIds.length === this.records.length && this.records.length > 0
    },

    toggleSelectAll() {
      if (this.selectAll) {
        this.selectedIds = this.records.map(r => r.id)
      } else {
        this.selectedIds = []
      }
    },

    async sendToWeChat() {
      if (this.selectedIds.length === 0) {
        this.showMessage('请先选择要发送的记录', 'error')
        return
      }
      this.sending = true
      try {
        // 1. 使用 html2canvas 截图表格区域
        const tableWrapper = this.$refs.tableWrapper
        if (!tableWrapper) {
          this.showMessage('❌ 未找到表格区域', 'error')
          return
        }

        // 清除选中样式确保截图干净
        const canvas = await html2canvas(tableWrapper, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          allowTaint: true,
          logging: false
        })

        const imageData = canvas.toDataURL('image/png')
        const imageSize = Math.round((imageData.length * 3) / 4 / 1024)

        // 2. 发送到后端（由后端处理微信上传与草稿创建）
        const res = await axios.post(`${API_BASE}/wechat/send`, {
          imageData: imageData,
          selectedIds: this.selectedIds,
          keyword: this.keyword || ''
        })

        if (res.data.success) {
          this.showMessage(`✅ 截图已发送到公众号草稿！文章ID: ${res.data.articleId}（截图 ${imageSize} KB）`, 'success')
          this.selectedIds = []
          this.selectAll = false
        } else {
          this.showMessage('❌ 发送失败: ' + (res.data.message || '未知错误'), 'error')
        }
      } catch (e) {
        this.showMessage('❌ 发送失败: ' + (e.response?.data?.message || '后端服务未启动或截图出错: ' + e.message), 'error')
      } finally {
        this.sending = false
      }
    },

    async loadStats() {
      try {
        const res = await axios.get(`${API_BASE}/stats`)
        this.totalCount = res.data.totalCount
      } catch (e) {
        // ignore
      }
    },

    async search() {
      this.loading = true
      this.searched = true
      this.selectedIds = []
      this.selectAll = false
      try {
        const params = { page: this.page, size: this.size }
        if (this.keyword) params.keyword = this.keyword
        if (this.startDate) params.startDate = new Date(this.startDate).toISOString()
        if (this.endDate) params.endDate = new Date(this.endDate).toISOString()

        const res = await axios.get(API_BASE, { params })
        this.records = res.data.content
        this.totalPages = res.data.totalPages
        this.totalCount = res.data.totalElements
      } catch (e) {
        this.showMessage('查询失败: ' + (e.response?.data?.message || e.message), 'error')
      } finally {
        this.loading = false
      }
    },

    async triggerBackup() {
      this.backuping = true
      try {
        const res = await axios.post(`${API_BASE}/backup`)
        this.showMessage(`备份完成，导入 ${res.data.imported} 条新记录`, 'success')
        this.loadStats()
        this.search()
      } catch (e) {
        this.showMessage('备份失败: ' + (e.response?.data?.message || e.message), 'error')
      } finally {
        this.backuping = false
      }
    },

    async deleteRecord(id) {
      if (!confirm('确定删除这条记录？')) return
      try {
        await axios.delete(`${API_BASE}/${id}`)
        this.showMessage('删除成功', 'success')
        this.selectedIds = this.selectedIds.filter(sid => sid !== id)
        this.search()
      } catch (e) {
        this.showMessage('删除失败', 'error')
      }
    },

    goPage(p) {
      this.page = p
      this.search()
    },

    resetSearch() {
      this.keyword = ''
      this.startDate = ''
      this.endDate = ''
      this.page = 0
      this.search()
    },

    formatTime(t) {
      if (!t) return '-'
      return t.replace('T', ' ').slice(0, 19)
    },

    truncate(str, len) {
      if (!str) return '-'
      return str.length > len ? str.slice(0, len) + '...' : str
    }
  }
}
</script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f5f7fa;
  color: #333;
}

.app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #e8ecf1;
}

.header h1 { font-size: 24px; color: #1a1a2e; }

.header-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

.total-count { color: #666; font-size: 14px; }

.search-section {
  background: #fff;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  margin-bottom: 16px;
}

.search-row {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.input {
  padding: 8px 12px;
  border: 1px solid #d0d5dd;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.input:focus { border-color: #4f6ef7; }

.search-input { flex: 1; min-width: 200px; }

.date-input { min-width: 180px; }

.date-sep { color: #999; }

.select-all-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  user-select: none;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-search { background: #4f6ef7; color: #fff; }
.btn-search:hover:not(:disabled) { background: #3d5ce5; }

.btn-clear { background: #e8ecf1; color: #666; }
.btn-clear:hover { background: #d0d5dd; }

.btn-backup { background: #10b981; color: #fff; }
.btn-backup:hover:not(:disabled) { background: #059669; }

.btn-wechat { background: #07c160; color: #fff; font-weight: 600; }
.btn-wechat:hover:not(:disabled) { background: #06ad56; }

.btn-danger-sm {
  padding: 4px 10px;
  background: #ef4444;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}
.btn-danger-sm:hover { background: #dc2626; }

.message { padding: 10px 16px; border-radius: 6px; margin-bottom: 12px; font-size: 14px; }
.message.info { background: #e0f2fe; color: #0369a1; }
.message.success { background: #d1fae5; color: #065f46; }
.message.error { background: #fee2e2; color: #991b1b; }

.loading {
  text-align: center;
  padding: 40px;
  color: #999;
  font-size: 16px;
}

.empty {
  text-align: center;
  padding: 60px 20px;
  color: #999;
  font-size: 15px;
  background: #fff;
  border-radius: 8px;
}

.table-wrapper {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  overflow: hidden;
}

.history-table {
  width: 100%;
  border-collapse: collapse;
}

.history-table th {
  background: #f8fafc;
  padding: 12px 10px;
  text-align: left;
  font-weight: 600;
  font-size: 13px;
  color: #666;
  border-bottom: 1px solid #e8ecf1;
}

.history-table td {
  padding: 10px;
  border-bottom: 1px solid #f0f2f5;
  font-size: 13px;
  vertical-align: middle;
}

.history-table tr:hover td { background: #f8fafc; }
.history-table tr.selected td { background: #eef2ff; }

.col-cb { width: 40px; text-align: center; }
.col-id { width: 50px; text-align: center; color: #999; }
.col-title { min-width: 180px; }
.col-url { min-width: 200px; }
.col-time { min-width: 160px; white-space: nowrap; color: #666; }
.col-browser { width: 70px; color: #666; }
.col-action { width: 60px; text-align: center; }

.history-table a {
  color: #4f6ef7;
  text-decoration: none;
}
.history-table a:hover { text-decoration: underline; color: #3d5ce5; }

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  padding: 16px;
}

.pagination button {
  padding: 6px 14px;
  border: 1px solid #d0d5dd;
  background: #fff;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}
.pagination button:disabled { opacity: 0.4; cursor: not-allowed; }
.pagination button:hover:not(:disabled) { background: #f0f2f5; }

.page-info { font-size: 13px; color: #666; }
</style>
