<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Refresh, Search, Plus, OfficeBuilding,
  FolderOpened, Folder, Edit,
  CircleClose, Delete,
} from '@element-plus/icons-vue'
import PageHeader from '@/components/common/PageHeader.vue'
import EmptyPlaceholder from '@/components/common/EmptyPlaceholder.vue'
import {
  getSchoolOrgSummaryApi,
  getSchoolOrgTreeApi,
  getSchoolOrgDetailApi,
  createSchoolOrgApi,
  updateSchoolOrgApi,
  disableSchoolOrgApi,
  deleteSchoolOrgApi,
  getSchoolOrgStaffOptionsApi,
  checkOrgCodeUniqueApi,
  checkOrgDisableRisksApi,
  teachingOrgTypeMap,
  serviceOrgTypeMap,
} from '@/api/schoolOrg'

defineOptions({ name: 'SchoolOrgView' })

const userStore = useUserStore()
const tenantId = computed(() => userStore.userInfo?.tenant_id || userStore.userInfo?.school_id || 2)

// ==================== 状态 ====================
const loading = ref(false)
const activeType = ref('teaching') // teaching | service
const treeData = ref([])
const summary = ref({})
const selectedOrg = ref(null)
const detailData = ref(null)
const detailLoading = ref(false)
const searchKeyword = ref('')

// 抽屉
const drawerVisible = ref(false)
const drawerMode = ref('create') // create | edit
const drawerFormRef = ref(null)
const drawerForm = ref({})
const drawerLoading = ref(false)
const staffOptions = ref([])

// 表单校验
const drawerRules = {
  name: [
    { required: true, message: '请填写组织名称', trigger: 'blur' },
    { min: 2, max: 50, message: '组织名称 2-50 字', trigger: 'blur' },
  ],
  code: [
    { required: true, message: '请填写组织编码', trigger: 'blur' },
    { min: 2, max: 30, message: '组织编码 2-30 字', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_-]+$/, message: '只允许字母、数字、下划线、中划线', trigger: 'blur' },
  ],
  org_type: [{ required: true, message: '请选择组织类型', trigger: 'change' }],
}

// 组织类型选项
const teachingTypeOptions = Object.entries(teachingOrgTypeMap).map(([value, label]) => ({ value, label }))
const serviceTypeOptions = Object.entries(serviceOrgTypeMap).map(([value, label]) => ({ value, label }))
const currentTypeOptions = computed(() => activeType.value === 'teaching' ? teachingTypeOptions : serviceTypeOptions)

// ==================== 数据加载 ====================
async function loadData() {
  loading.value = true
  try {
    const [tree, summ] = await Promise.all([
      getSchoolOrgTreeApi(tenantId.value, activeType.value),
      getSchoolOrgSummaryApi(tenantId.value, activeType.value),
    ])
    treeData.value = tree
    summary.value = summ
  } catch (e) {
    console.error('加载组织数据失败', e)
  } finally {
    loading.value = false
  }
}

async function loadDetail(orgId) {
  if (!orgId) { detailData.value = null; return }
  detailLoading.value = true
  try {
    detailData.value = await getSchoolOrgDetailApi(tenantId.value, activeType.value, orgId)
  } catch (e) {
    console.error('加载详情失败', e)
  } finally {
    detailLoading.value = false
  }
}

function selectOrg(node) {
  selectedOrg.value = node
  loadDetail(node.id)
}

// ==================== 搜索过滤 ====================
function filterNode(keyword, data) {
  if (!keyword) return true
  const kw = keyword.toLowerCase()
  return (data.name || '').toLowerCase().includes(kw) || (data.code || '').toLowerCase().includes(kw)
}

const filteredTree = computed(() => {
  if (!searchKeyword.value) return treeData.value
  return filterTree(treeData.value, searchKeyword.value)
})

function filterTree(nodes, kw) {
  const result = []
  for (const node of nodes) {
    const childrenMatch = node.children?.length ? filterTree(node.children, kw) : []
    if (filterNode(kw, node) || childrenMatch.length > 0) {
      result.push({ ...node, children: childrenMatch.length > 0 ? childrenMatch : node.children?.filter(() => false) || [] })
    }
  }
  return result
}

// ==================== 类型切换 ====================
function switchType(type) {
  activeType.value = type
  selectedOrg.value = null
  detailData.value = null
  searchKeyword.value = ''
  loadData()
}

// ==================== 抽屉操作 ====================
function openCreateDrawer(parentOrg = null) {
  drawerMode.value = 'create'
  drawerForm.value = {
    name: '',
    code: '',
    org_type: '',
    parent_id: parentOrg?.id || null,
    parent_name: parentOrg?.name || '',
    sort_order: 0,
    manager_user_id: null,
    phone: '',
    description: '',
    status: 'active',
  }
  drawerVisible.value = true
  loadStaffOptions()
}

function openEditDrawer(org) {
  drawerMode.value = 'edit'
  drawerForm.value = {
    id: org.id,
    name: org.name || '',
    code: org.code || '',
    org_type: org.type || '',
    parent_id: org.parent_id || null,
    parent_name: '',
    sort_order: org.sort_order || 0,
    manager_user_id: org.manager_user_id || null,
    phone: org.phone || '',
    description: org.description || '',
    status: org.status || 'active',
  }
  // 查找上级名称
  if (org.parent_id) {
    const flatList = flattenTreeData(treeData.value)
    const parent = flatList.find(n => n.id === org.parent_id)
    drawerForm.value.parent_name = parent?.name || ''
  }
  drawerVisible.value = true
  loadStaffOptions()
}

function flattenTreeData(nodes, result = []) {
  nodes.forEach(n => { result.push(n); if (n.children?.length) flattenTreeData(n.children, result) })
  return result
}

async function loadStaffOptions() {
  try {
    staffOptions.value = await getSchoolOrgStaffOptionsApi()
  } catch { staffOptions.value = [] }
}

async function saveOrg() {
  if (!drawerFormRef.value) return
  await drawerFormRef.value.validate()

  // 编码唯一校验
  const isUnique = await checkOrgCodeUniqueApi(tenantId.value, activeType.value, drawerForm.value.code, drawerMode.value === 'edit' ? drawerForm.value.id : null)
  if (!isUnique) {
    ElMessage.error('组织编码已存在，请更换')
    return
  }

  drawerLoading.value = true
  try {
    const payload = { ...drawerForm.value, operator_id: userStore.userInfo?.user_id }
    if (drawerMode.value === 'create') {
      await createSchoolOrgApi(tenantId.value, activeType.value, payload)
      ElMessage.success('组织创建成功')
    } else {
      await updateSchoolOrgApi(tenantId.value, activeType.value, drawerForm.value.id, payload)
      ElMessage.success('组织更新成功')
    }
    drawerVisible.value = false
    await loadData()
    if (selectedOrg.value) loadDetail(selectedOrg.value.id)
  } catch (e) {
    ElMessage.error(e.message || '保存失败')
  } finally {
    drawerLoading.value = false
  }
}

// ==================== 停用 ====================
async function handleDisable(org) {
  try {
    const warnings = await checkOrgDisableRisksApi(tenantId.value, activeType.value, org.id)
    if (warnings.length > 0) {
      ElMessageBox.alert(
        `<div style="line-height:1.8">${warnings.map(w => `<div style="color:var(--color-warning)">⚠ ${w}</div>`).join('')}</div>`,
        '无法停用该组织',
        { dangerouslyUseHTMLString: true, confirmButtonText: '知道了' }
      )
      return
    }
  } catch { /* continue */ }

  try {
    await ElMessageBox.confirm(
      '停用后该组织将不再作为新增账号、课程或服务项目的可选归属，历史数据仍保留。',
      '确认停用该组织？',
      { confirmButtonText: '确认停用', cancelButtonText: '取消', type: 'warning' }
    )
    await disableSchoolOrgApi(tenantId.value, activeType.value, org.id, org.name)
    ElMessage.success('组织已停用')
    await loadData()
    if (selectedOrg.value?.id === org.id) loadDetail(org.id)
  } catch (e) {
    if (e !== 'cancel') ElMessage.error(e.message || '停用失败')
  }
}

// ==================== 删除 ====================
async function handleDelete(org) {
  // 检查子组织和关联数据
  if (org.children?.length > 0) {
    ElMessage.warning('该组织下存在子组织，请先删除子组织')
    return
  }
  try {
    await ElMessageBox.confirm(
      '删除后数据将标记为无效，不可恢复。确定要删除吗？',
      '确认删除该组织？',
      { confirmButtonText: '确认删除', cancelButtonText: '取消', type: 'warning', confirmButtonClass: 'el-button--danger' }
    )
    await deleteSchoolOrgApi(tenantId.value, activeType.value, org.id, org.name)
    ElMessage.success('组织已删除')
    if (selectedOrg.value?.id === org.id) { selectedOrg.value = null; detailData.value = null }
    await loadData()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error(e.message || '删除失败')
  }
}

// ==================== 节点操作菜单 ====================
function handleNodeCommand(command, node) {
  switch (command) {
    case 'addChild': openCreateDrawer(node); break
    case 'edit': openEditDrawer(node); break
    case 'disable': handleDisable(node); break
    case 'delete': handleDelete(node); break
  }
}

// ==================== 统计卡 ====================
const summaryCards = computed(() => {
  if (activeType.value === 'teaching') {
    return [
      { title: '教学组织数', value: summary.value.orgCount || 0, icon: OfficeBuilding, color: 'primary' },
      { title: '课程数', value: summary.value.courseCount || 0, icon: FolderOpened, color: 'info' },
      { title: '教职工数', value: summary.value.staffCount || 0, icon: Folder, color: 'warning' },
      { title: '启用组织数', value: summary.value.activeCount || 0, icon: FolderOpened, color: 'success' },
    ]
  }
  return [
    { title: '服务部门数', value: summary.value.orgCount || 0, icon: OfficeBuilding, color: 'primary' },
    { title: '服务项目数', value: summary.value.itemCount || 0, icon: FolderOpened, color: 'info' },
    { title: '负责人员数', value: summary.value.staffCount || 0, icon: Folder, color: 'warning' },
    { title: '启用组织数', value: summary.value.activeCount || 0, icon: FolderOpened, color: 'success' },
  ]
})

// ==================== 日志动作映射 ====================
const logActionMap = {
  create: '新增组织',
  update: '编辑组织',
  disable: '停用组织',
  delete: '删除组织',
}

// ==================== 初始化 ====================
onMounted(() => { loadData() })
watch(activeType, () => { loadData() })
</script>

<template>
  <div class="page-container">
    <!-- 页面标题 -->
    <PageHeader
      title="组织架构"
      description="维护本校院系、教学部门与校园服务部门，为账号归属、评价对象和权限范围提供基础数据"
    >
      <template #actions>
        <el-button :icon="Refresh" @click="loadData">刷新</el-button>
        <el-button type="primary" :icon="Plus" @click="openCreateDrawer()">新增组织</el-button>
      </template>
    </PageHeader>

    <!-- 组织类型切换 -->
    <div class="org-type-tabs">
      <div
        class="org-type-tab" :class="{ active: activeType === 'teaching' }"
        @click="switchType('teaching')"
      >教学组织</div>
      <div
        class="org-type-tab" :class="{ active: activeType === 'service' }"
        @click="switchType('service')"
      >服务组织</div>
    </div>

    <!-- 统计卡 -->
    <div class="summary-cards">
      <div v-for="card in summaryCards" :key="card.title" class="summary-card">
        <div class="summary-icon" :class="'tone-' + card.color">
          <el-icon :size="22"><component :is="card.icon" /></el-icon>
        </div>
        <div class="summary-body">
          <div class="summary-value">{{ card.value }}</div>
          <div class="summary-title">{{ card.title }}</div>
        </div>
      </div>
    </div>

    <!-- 主体：左树 + 右详情 -->
    <div class="org-main">
      <!-- 左侧组织树 -->
      <div class="org-tree-panel">
        <div class="tree-search">
          <el-input
            v-model="searchKeyword" placeholder="搜索组织名称或编码"
            :prefix-icon="Search" clearable size="default"
          />
        </div>
        <div class="tree-body" v-loading="loading">
          <template v-if="filteredTree.length">
            <div v-for="node in filteredTree" :key="node.id" class="tree-root">
              <OrgTreeNode
                :node="node" :selected-id="selectedOrg?.id"
                @select="selectOrg" @command="handleNodeCommand"
              />
            </div>
          </template>
          <EmptyPlaceholder v-else :text="searchKeyword ? '未找到匹配的组织' : '暂无组织数据'" description="你可以新增本校教学组织或服务部门" />
        </div>
      </div>

      <!-- 右侧组织详情 -->
      <div class="org-detail-panel" v-loading="detailLoading">
        <template v-if="detailData">
          <!-- 基础信息 -->
          <div class="detail-section">
            <h3 class="detail-section-title">基础信息</h3>
            <div class="detail-grid">
              <div class="detail-item"><span class="detail-label">组织名称</span><span class="detail-value">{{ detailData.name || '-' }}</span></div>
              <div class="detail-item"><span class="detail-label">组织编码</span><span class="detail-value code">{{ detailData.code || '-' }}</span></div>
              <div class="detail-item"><span class="detail-label">组织类型</span><span class="detail-value">{{ detailData.type_label || '-' }}</span></div>
              <div class="detail-item"><span class="detail-label">上级组织</span><span class="detail-value">{{ detailData.parent_name || '无' }}</span></div>
              <div class="detail-item">
                <span class="detail-label">状态</span>
                <span class="detail-value">
                  <el-tag :type="detailData.status === 'active' ? 'success' : 'info'" size="small" effect="light">
                    {{ detailData.status_label || (detailData.status === 'active' ? '启用' : '停用') }}
                  </el-tag>
                </span>
              </div>
              <div class="detail-item"><span class="detail-label">排序号</span><span class="detail-value">{{ detailData.sort_order || 0 }}</span></div>
              <div class="detail-item"><span class="detail-label">创建时间</span><span class="detail-value">{{ detailData.created_at ? new Date(detailData.created_at).toLocaleDateString('zh-CN') : '-' }}</span></div>
              <div class="detail-item"><span class="detail-label">更新时间</span><span class="detail-value">{{ detailData.updated_at ? new Date(detailData.updated_at).toLocaleDateString('zh-CN') : '-' }}</span></div>
            </div>
          </div>

          <!-- 组织说明 -->
          <div class="detail-section" v-if="detailData.description">
            <h3 class="detail-section-title">组织说明</h3>
            <p class="detail-desc">{{ detailData.description }}</p>
          </div>

          <!-- 关联数据 -->
          <div class="detail-section">
            <h3 class="detail-section-title">关联数据概览</h3>
            <div class="related-cards">
              <template v-if="activeType === 'teaching'">
                <div class="related-card"><span class="related-num">{{ detailData.staffCount || 0 }}</span><span class="related-label">关联教职工</span></div>
                <div class="related-card"><span class="related-num">{{ detailData.courseCount || 0 }}</span><span class="related-label">关联课程</span></div>
                <div class="related-card"><span class="related-num">{{ detailData.formCount || 0 }}</span><span class="related-label">关联评价表单</span></div>
              </template>
              <template v-else>
                <div class="related-card"><span class="related-num">{{ detailData.staffCount || 0 }}</span><span class="related-label">负责人员</span></div>
                <div class="related-card"><span class="related-num">{{ detailData.itemCount || 0 }}</span><span class="related-label">关联服务项目</span></div>
                <div class="related-card"><span class="related-num">{{ detailData.formCount || 0 }}</span><span class="related-label">关联评价表单</span></div>
                <div class="related-card"><span class="related-num">{{ detailData.complaintCount || 0 }}</span><span class="related-label">关联反馈工单</span></div>
              </template>
            </div>
          </div>

          <!-- 操作记录 -->
          <div class="detail-section" v-if="detailData.logs?.length">
            <h3 class="detail-section-title">近期操作记录</h3>
            <div class="log-timeline">
              <div v-for="log in detailData.logs" :key="log.id" class="log-item">
                <span class="log-dot" :class="'tone-' + (log.action === 'create' ? 'success' : log.action === 'disable' || log.action === 'delete' ? 'danger' : 'info')"></span>
                <span class="log-text">{{ logActionMap[log.action] || log.action }}</span>
                <span class="log-time">{{ log.created_at ? new Date(log.created_at).toLocaleDateString('zh-CN') : '' }}</span>
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="detail-actions">
            <el-button type="primary" plain :icon="Edit" @click="openEditDrawer(detailData)">编辑</el-button>
            <el-button v-if="detailData.status === 'active'" type="warning" plain :icon="CircleClose" @click="handleDisable(detailData)">停用</el-button>
            <el-button type="danger" plain :icon="Delete" @click="handleDelete(detailData)">删除</el-button>
          </div>
        </template>
        <div v-else class="detail-empty">
          <EmptyPlaceholder text="请选择左侧组织查看详情" />
        </div>
      </div>
    </div>

    <!-- 新增/编辑抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      :title="drawerMode === 'create' ? (activeType === 'teaching' ? '新增教学组织' : '新增服务组织') : '编辑组织'"
      size="560px" direction="rtl" :close-on-click-modal="false"
    >
      <el-form ref="drawerFormRef" :model="drawerForm" :rules="drawerRules" label-width="90px" label-position="top">
        <el-form-item label="组织类型" prop="org_type">
          <el-select v-model="drawerForm.org_type" placeholder="请选择组织类型" style="width:100%">
            <el-option v-for="opt in currentTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="组织名称" prop="name">
          <el-input v-model="drawerForm.name" placeholder="请输入组织名称" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="组织编码" prop="code">
          <el-input v-model="drawerForm.code" placeholder="字母、数字、下划线、中划线" maxlength="30" show-word-limit />
        </el-form-item>
        <el-form-item label="上级组织">
          <el-input :model-value="drawerForm.parent_name || '无（顶级组织）'" disabled />
        </el-form-item>
        <el-form-item label="排序号">
          <el-input-number v-model="drawerForm.sort_order" :min="0" :max="999" controls-position="right" style="width:100%" />
        </el-form-item>
        <el-form-item label="负责人">
          <el-select v-model="drawerForm.manager_user_id" placeholder="请选择负责人" clearable filterable style="width:100%">
            <el-option v-for="s in staffOptions" :key="s.user_id" :label="s.real_name" :value="s.user_id" />
          </el-select>
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="drawerForm.phone" placeholder="请输入联系电话" maxlength="20" />
        </el-form-item>
        <el-form-item label="组织说明">
          <el-input v-model="drawerForm.description" type="textarea" :rows="3" placeholder="请输入组织说明" maxlength="200" show-word-limit />
        </el-form-item>
        <el-form-item label="状态" v-if="drawerMode === 'edit'">
          <el-radio-group v-model="drawerForm.status">
            <el-radio value="active">启用</el-radio>
            <el-radio value="disabled">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="drawerVisible = false">取消</el-button>
        <el-button type="primary" :loading="drawerLoading" @click="saveOrg">保存</el-button>
      </template>
    </el-drawer>
  </div>
</template>

<!-- 树节点递归组件 -->
<script>
import { defineComponent, h } from 'vue'
import { ElDropdown, ElDropdownMenu, ElDropdownItem, ElTag, ElIcon } from 'element-plus'
import { MoreFilled as MoreFilledIcon, Folder as FolderIcon, FolderOpened as FolderOpenedIcon } from '@element-plus/icons-vue'

const OrgTreeNode = defineComponent({
  name: 'OrgTreeNode',
  props: {
    node: { type: Object, required: true },
    selectedId: { type: [Number, null], default: null },
    depth: { type: Number, default: 0 },
  },
  emits: ['select', 'command'],
  setup(props, { emit }) {
    return () => {
      const isSelected = props.selectedId === props.node.id
      const hasChildren = props.node.children?.length > 0

      const nodeEl = h('div', {
        class: ['tree-node', { 'is-selected': isSelected }],
        style: { paddingLeft: `${props.depth * 20 + 12}px` },
        onClick: () => emit('select', props.node),
      }, [
        h('span', { class: 'tree-node-icon' }, h(ElIcon, { size: 16 }, () => h(hasChildren ? FolderOpenedIcon : FolderIcon))),
        h('span', { class: 'tree-node-name' }, props.node.name),
        h(ElTag, { size: 'small', effect: 'light', type: 'info', class: 'tree-node-type' }, () => props.node.type_label || props.node.type),
        h(ElTag, {
          size: 'small', effect: 'light',
          type: props.node.status === 'active' ? 'success' : 'info',
          class: 'tree-node-status',
        }, () => props.node.status === 'active' ? '启用' : '停用'),
        h(ElDropdown, {
          trigger: 'click',
          onCommand: (cmd) => { emit('command', cmd, props.node) },
          onClick: (e) => e.stopPropagation(),
          class: 'tree-node-more',
        }, {
          default: () => h(ElIcon, { size: 16 }, () => h(MoreFilledIcon)),
          dropdown: () => h(ElDropdownMenu, null, () => [
            h(ElDropdownItem, { command: 'addChild' }, () => '新增下级'),
            h(ElDropdownItem, { command: 'edit' }, () => '编辑'),
            h(ElDropdownItem, { command: 'disable', divided: true }, () => '停用'),
            h(ElDropdownItem, { command: 'delete' }, () => h('span', { style: 'color:var(--color-danger)' }, '删除')),
          ]),
        }),
      ])

      const children = hasChildren
        ? props.node.children.map(child =>
            h(OrgTreeNode, {
              node: child,
              selectedId: props.selectedId,
              depth: props.depth + 1,
              onSelect: (n) => emit('select', n),
              onCommand: (cmd, n) => emit('command', cmd, n),
            })
          )
        : []

      return h('div', { class: 'tree-node-wrapper' }, [nodeEl, ...children])
    }
  },
})

export default { components: { OrgTreeNode } }
</script>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

/* 类型切换 Tab */
.org-type-tabs {
  display: flex;
  gap: var(--space-1);
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-1);
  box-shadow: var(--shadow-card);
}
.org-type-tab {
  flex: 1;
  text-align: center;
  padding: var(--space-3) 0;
  border-radius: var(--radius-md);
  font-size: var(--font-base);
  font-weight: 500;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}
.org-type-tab:hover { color: var(--color-primary); background: var(--color-primary-50); }
.org-type-tab.active {
  color: #fff;
  background: var(--color-primary);
  box-shadow: 0 2px 8px rgba(0,128,96,0.2);
}

/* 统计卡 */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
}
.summary-card {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-5);
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
}
.summary-icon {
  width: 44px; height: 44px;
  border-radius: var(--radius-md);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.tone-primary { background: var(--color-primary-50); color: var(--color-primary); }
.tone-info { background: var(--color-info-light, #e8eaed); color: var(--color-info, #606266); }
.tone-warning { background: var(--color-warning-light, #fdf6ec); color: var(--color-warning); }
.tone-success { background: var(--color-success-light, #f0f9eb); color: var(--color-success); }
.tone-danger { background: var(--color-danger-light, #fef0f0); color: var(--color-danger); }
.summary-value { font-size: 24px; font-weight: var(--font-weight-bold); color: var(--color-text-primary); line-height: 1.2; }
.summary-title { font-size: var(--font-sm); color: var(--color-text-secondary); margin-top: 2px; }

/* 主体布局 */
.org-main {
  display: flex;
  gap: var(--space-5);
  min-height: 500px;
}

/* 左侧树 */
.org-tree-panel {
  width: 360px;
  flex-shrink: 0;
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.tree-search { padding: var(--space-4); border-bottom: 1px solid var(--color-border-lighter, #ebeef5); }
.tree-body { flex: 1; overflow-y: auto; padding: var(--space-2) 0; }

/* 树节点 */
.tree-node-wrapper { }
.tree-node {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  cursor: pointer;
  transition: background 0.15s;
  border-left: 3px solid transparent;
}
.tree-node:hover { background: var(--color-bg-page); }
.tree-node.is-selected {
  background: var(--color-primary-50);
  border-left-color: var(--color-primary);
}
.tree-node-icon { color: var(--color-text-placeholder); flex-shrink: 0; }
.tree-node-name { font-size: var(--font-sm); color: var(--color-text-title); flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tree-node-type { flex-shrink: 0; }
.tree-node-status { flex-shrink: 0; }
.tree-node-more { flex-shrink: 0; cursor: pointer; color: var(--color-text-placeholder); padding: 2px; border-radius: 4px; }
.tree-node-more:hover { background: var(--color-bg-page); color: var(--color-text-title); }

/* 右侧详情 */
.org-detail-panel {
  flex: 1;
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  padding: var(--space-6);
  overflow-y: auto;
}
.detail-empty { display: flex; align-items: center; justify-content: center; min-height: 400px; }

.detail-section { margin-bottom: var(--space-6); }
.detail-section-title {
  font-size: var(--font-base);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-title);
  margin: 0 0 var(--space-4);
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--color-border-lighter, #ebeef5);
}
.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3) var(--space-6);
}
.detail-item { display: flex; flex-direction: column; gap: 2px; }
.detail-label { font-size: var(--font-xs); color: var(--color-text-placeholder); }
.detail-value { font-size: var(--font-sm); color: var(--color-text-title); }
.detail-value.code { font-family: 'Courier New', monospace; background: var(--color-bg-page); padding: 1px 6px; border-radius: 4px; font-size: var(--font-xs); }
.detail-desc { font-size: var(--font-sm); color: var(--color-text-body); line-height: 1.6; margin: 0; }

/* 关联数据卡 */
.related-cards { display: flex; gap: var(--space-4); flex-wrap: wrap; }
.related-card {
  display: flex; flex-direction: column; align-items: center;
  padding: var(--space-4) var(--space-5);
  background: var(--color-bg-page);
  border-radius: var(--radius-md);
  min-width: 100px;
}
.related-num { font-size: 22px; font-weight: var(--font-weight-bold); color: var(--color-primary); }
.related-label { font-size: var(--font-xs); color: var(--color-text-secondary); margin-top: 2px; }

/* 操作日志 */
.log-timeline { display: flex; flex-direction: column; gap: var(--space-3); }
.log-item { display: flex; align-items: center; gap: var(--space-2); }
.log-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; background: var(--color-text-placeholder); }
.log-dot.tone-success { background: var(--color-success); }
.log-dot.tone-danger { background: var(--color-danger); }
.log-dot.tone-info { background: var(--color-primary); }
.log-text { font-size: var(--font-sm); color: var(--color-text-body); }
.log-time { font-size: var(--font-xs); color: var(--color-text-placeholder); margin-left: auto; }

/* 操作按钮 */
.detail-actions { display: flex; gap: var(--space-3); margin-top: var(--space-6); padding-top: var(--space-4); border-top: 1px solid var(--color-border-lighter, #ebeef5); }

/* 响应式 */
@media (max-width: 1400px) {
  .summary-cards { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 1000px) {
  .org-main { flex-direction: column; }
  .org-tree-panel { width: 100%; }
  .detail-grid { grid-template-columns: 1fr; }
}
</style>
