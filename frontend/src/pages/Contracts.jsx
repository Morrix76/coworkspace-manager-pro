import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Table,
  Button,
  Tag,
  Space,
  Row,
  Col,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  message,
  Tooltip,
  Avatar,
  Spin
} from 'antd'
import {
  PlusOutlined,
  FileTextOutlined,
  EditOutlined,
  CheckCircleOutlined,
  StopOutlined,
  FileDoneOutlined,
  DollarCircleOutlined,
  ExclamationCircleOutlined,
  FormOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { handleDemoRestriction, isDemoRestriction } from '../utils/demoError'

const { Title, Text } = Typography
const { Option } = Select
const { TextArea } = Input

const API_URL = import.meta.env.VITE_API_URL

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`
})

const STATUS_CONFIG = {
  ACTIVE: { color: 'green', icon: <CheckCircleOutlined /> },
  EXPIRED: { color: 'red', icon: <StopOutlined /> },
  CANCELLED: { color: 'default', icon: <ExclamationCircleOutlined /> }
}

const CONTRACT_TYPES = ['DOMICILIATION', 'VIRTUAL_OFFICE', 'LONG_TERM_RENTAL']

const getStatusDetails = (status, t) => {
  const config = STATUS_CONFIG[status] || { color: 'default' }
  return { ...config, label: t(`enums.contractStatus.${status}`, { defaultValue: status }) }
}

function Contracts() {
  const { t, i18n } = useTranslation()
  const formatCurrency = (amount) => new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'EUR' }).format(amount || 0)

  const [contracts, setContracts] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingContract, setEditingContract] = useState(null)
  const [filterStatus, setFilterStatus] = useState(null)
  const [form] = Form.useForm()

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [contractsRes, clientsRes] = await Promise.all([
        axios.get(`${API_URL}/contracts`, { headers: authHeaders() }),
        axios.get(`${API_URL}/clients`, { params: { limit: 1000 }, headers: authHeaders() })
      ])

      const contractRows = Array.isArray(contractsRes.data) ? contractsRes.data : []
      const clientRows = Array.isArray(clientsRes.data?.clients)
        ? clientsRes.data.clients
        : Array.isArray(clientsRes.data) ? clientsRes.data : []

      setContracts(contractRows)
      setClients(clientRows)
    } catch (err) {
      if (isDemoRestriction(err) || handleDemoRestriction(err)) {
        setError(err.response?.data?.message || t('common.errorLoading'))
        return
      }
      const errorMessage = err.response?.data?.message || err.response?.data?.error || t('common.errorLoading')
      setError(errorMessage)
      message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleAdd = () => {
    setEditingContract(null)
    form.resetFields()
    form.setFieldsValue({
      startDate: dayjs(),
      type: 'DOMICILIATION',
      status: 'ACTIVE'
    })
    setIsModalVisible(true)
  }

  const handleEdit = (contract) => {
    setEditingContract(contract)
    form.setFieldsValue({
      clientId: contract.clientId,
      type: contract.type,
      status: contract.status,
      startDate: dayjs(contract.startDate),
      endDate: contract.endDate ? dayjs(contract.endDate) : null,
      amount: contract.amount,
      content: contract.content,
      signedDate: contract.signedDate ? dayjs(contract.signedDate) : null
    })
    setIsModalVisible(true)
  }

  const handleSign = async (contractId) => {
    try {
      await axios.patch(`${API_URL}/contracts/${contractId}/sign`, {}, { headers: authHeaders() })
      message.success(t('contracts.signed'))
      await loadData()
    } catch (err) {
      if (isDemoRestriction(err) || handleDemoRestriction(err)) return
      message.error(err.response?.data?.message || err.response?.data?.error || t('contracts.saveError'))
    }
  }

  const handleSubmit = async (values) => {
    setSaving(true)
    try {
      const payload = {
        clientId: values.clientId,
        type: values.type,
        startDate: values.startDate.toISOString(),
        endDate: values.endDate ? values.endDate.toISOString() : null,
        amount: values.amount,
        content: values.content,
        status: values.status,
        signedDate: values.signedDate ? values.signedDate.toISOString() : null
      }

      if (editingContract) {
        await axios.put(`${API_URL}/contracts/${editingContract.id}`, payload, {
          headers: authHeaders()
        })
        message.success(t('contracts.updated'))
      } else {
        await axios.post(`${API_URL}/contracts`, payload, {
          headers: authHeaders()
        })
        message.success(t('contracts.created'))
      }

      setIsModalVisible(false)
      setEditingContract(null)
      form.resetFields()
      await loadData()
    } catch (err) {
      if (isDemoRestriction(err) || handleDemoRestriction(err)) return
      message.error(err.response?.data?.message || err.response?.data?.error || t('contracts.saveError'))
    } finally {
      setSaving(false)
    }
  }

  const filteredContracts = filterStatus
    ? contracts.filter((c) => c.status === filterStatus)
    : contracts

  const statsCardsConfig = useMemo(() => [
    {
      key: 'active',
      title: t('contracts.activeContracts'),
      value: contracts.filter((c) => c.status === 'ACTIVE').length,
      icon: <FileDoneOutlined />,
      gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
      subtitle: t('contracts.currentlyInEffect')
    },
    {
      key: 'expired',
      title: t('contracts.expiredContracts'),
      value: contracts.filter((c) => c.status === 'EXPIRED').length,
      icon: <StopOutlined />,
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      subtitle: t('contracts.noLongerValid')
    },
    {
      key: 'revenue',
      title: t('contracts.activeAmount'),
      value: formatCurrency(
        contracts
          .filter((c) => c.status === 'ACTIVE')
          .reduce((sum, c) => sum + (c.amount || 0), 0)
      ),
      icon: <DollarCircleOutlined />,
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      subtitle: t('contracts.activeContractsTotal')
    }
  ], [contracts, formatCurrency, t])

  const columns = [
    {
      title: t('common.client'),
      key: 'client',
      sorter: (a, b) => (a.client?.name || '').localeCompare(b.client?.name || ''),
      render: (_, record) => record.client?.name || record.client?.company || t('bookings.unknownClient')
    },
    {
      title: t('contracts.colType'),
      dataIndex: 'type',
      key: 'type',
      render: (type) => <Tag>{t(`enums.contractType.${type}`, { defaultValue: type })}</Tag>
    },
    {
      title: t('contracts.colPeriod'),
      key: 'period',
      render: (_, record) => (
        <div>
          <Text>{dayjs(record.startDate).format('DD/MM/YYYY')}</Text>
          <Text type="secondary">
            <br />
            {record.endDate ? dayjs(record.endDate).format('DD/MM/YYYY') : '—'}
          </Text>
        </div>
      )
    },
    {
      title: t('contracts.colAmount'),
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => formatCurrency(amount),
      sorter: (a, b) => (a.amount || 0) - (b.amount || 0)
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const { label, color, icon } = getStatusDetails(status, t)
        return <Tag color={color} icon={icon}>{label}</Tag>
      },
      filters: Object.keys(STATUS_CONFIG).map((key) => ({
        text: t(`enums.contractStatus.${key}`),
        value: key
      })),
      onFilter: (value, record) => record.status === value
    },
    {
      title: t('common.actions'),
      key: 'actions',
      align: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title={t('common.edit')}>
            <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          </Tooltip>
          {!record.signedDate && (
            <Tooltip title={t('contracts.sign')}>
              <Button type="text" icon={<FormOutlined />} onClick={() => handleSign(record.id)} />
            </Tooltip>
          )}
        </Space>
      )
    }
  ]

  return (
    <div style={{ padding: '24px' }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 32 }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            <FileTextOutlined style={{ marginRight: 12, color: '#1890ff' }} />
            {t('contracts.title')}
          </Title>
          <Text type="secondary" style={{ fontSize: 16 }}>
            {t('contracts.subtitle')}
          </Text>
        </Col>
        <Col>
          <Button type="primary" size="large" icon={<PlusOutlined />} onClick={handleAdd}>
            {t('contracts.newContract')}
          </Button>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
        {statsCardsConfig.map((config) => (
          <Col xs={24} sm={12} md={8} key={config.key}>
            <Card hoverable styles={{ body: { padding: 0 } }} style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
              <div style={{ background: config.gradient, padding: '24px', borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
                <Avatar size={48} style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }} icon={config.icon} />
                <Title level={4} style={{ color: 'white', margin: '12px 0 0', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>{config.title}</Title>
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#262626', marginBottom: 4 }}>{config.value}</div>
                <Text type="secondary" style={{ fontSize: 14 }}>{config.subtitle}</Text>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Card style={{ borderRadius: 16, border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <Row style={{ marginBottom: 24 }}>
          <Col>
            <Select
              placeholder={t('common.filterByStatus')}
              style={{ width: 200 }}
              value={filterStatus}
              onChange={setFilterStatus}
              allowClear
              size="large"
            >
              {Object.entries(STATUS_CONFIG).map(([key, { icon }]) => (
                <Option key={key} value={key}>
                  {React.cloneElement(icon, { style: { marginRight: 8 } })}
                  {t(`enums.contractStatus.${key}`)}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>

        {loading && contracts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px' }}>
            <Spin size="large" />
            <Text style={{ marginTop: 16, display: 'block' }}>{t('contracts.loading')}</Text>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <FileTextOutlined style={{ fontSize: 48, marginBottom: 16, color: '#ff4d4f' }} />
            <Title level={3}>{t('common.errorLoading')}</Title>
            <Text style={{ fontSize: 16, display: 'block', marginBottom: 24 }}>{error}</Text>
            <Button type="primary" onClick={loadData}>{t('contracts.retry')}</Button>
          </div>
        ) : !loading && contracts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <FileTextOutlined style={{ fontSize: 48, marginBottom: 16, color: '#4F46E5' }} />
            <Title level={3}>{t('contracts.emptyTitle')}</Title>
            <Text style={{ fontSize: 16 }}>{t('contracts.emptyText')}</Text>
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={filteredContracts}
            loading={loading}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total, range) => t('contracts.pagination', { from: range[0], to: range[1], total })
            }}
            locale={{ emptyText: t('contracts.emptyTitle') }}
          />
        )}
      </Card>

      <Modal
        title={editingContract ? t('contracts.editContract') : t('contracts.newContract')}
        open={isModalVisible}
        onCancel={() => !saving && setIsModalVisible(false)}
        width={800}
        footer={null}
        destroyOnClose
        maskClosable={!saving}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 24 }}>
          <Form.Item name="clientId" label={t('common.client')} rules={[{ required: true, message: t('common.required') }]}>
            <Select showSearch optionFilterProp="children" placeholder={t('contracts.selectClient')}>
              {clients.map((c) => (
                <Option key={c.id} value={c.id}>{c.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="type" label={t('contracts.contractType')} rules={[{ required: true, message: t('common.required') }]}>
                <Select>
                  {CONTRACT_TYPES.map((k) => (
                    <Option key={k} value={k}>{t(`enums.contractType.${k}`)}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label={t('common.status')}>
                <Select allowClear>
                  {Object.keys(STATUS_CONFIG).map((key) => (
                    <Option key={key} value={key}>{t(`enums.contractStatus.${key}`)}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="startDate" label={t('contracts.startDate')} rules={[{ required: true, message: t('common.required') }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="endDate" label={t('contracts.endDate')}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="amount" label={t('contracts.amount')} rules={[{ required: true, message: t('common.required') }]}>
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="0.00" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="signedDate" label={t('contracts.signedDate')}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="content" label={t('contracts.content')} rules={[{ required: true, message: t('common.required') }]}>
            <TextArea rows={4} placeholder={t('contracts.contentPlaceholder')} />
          </Form.Item>
          <Row justify="end">
            <Space>
              <Button onClick={() => setIsModalVisible(false)} disabled={saving}>{t('common.cancel')}</Button>
              <Button type="primary" htmlType="submit" loading={saving}>
                {editingContract ? t('common.update') : t('common.create')}
              </Button>
            </Space>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}

export default Contracts
