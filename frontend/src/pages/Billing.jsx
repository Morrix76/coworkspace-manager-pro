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
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  DollarCircleOutlined,
  EditOutlined,
  StopOutlined,
  DownloadOutlined,
  MailOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { handleDemoRestriction, isDemoRestriction } from '../utils/demoError'

const { Title, Text } = Typography
const { Option } = Select

const API_URL = import.meta.env.VITE_API_URL

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`
})

const STATUS_CONFIG = {
  PENDING: { color: 'gold', icon: <ClockCircleOutlined /> },
  PAID: { color: 'green', icon: <CheckCircleOutlined /> },
  OVERDUE: { color: 'red', icon: <ExclamationCircleOutlined /> },
  CANCELLED: { color: 'default', icon: <StopOutlined /> }
}

const getStatusDetails = (status, t) => {
  const config = STATUS_CONFIG[status] || { color: 'default' }
  return { ...config, label: t(`enums.invoiceStatus.${status}`, { defaultValue: status }) }
}

const invoiceTotal = (invoice) => (invoice.amount || 0) + (invoice.taxAmount || 0)

const isOverdueInvoice = (invoice) => {
  if (invoice.status === 'OVERDUE') return true
  return invoice.status === 'PENDING' && dayjs(invoice.dueDate).isBefore(dayjs(), 'day')
}

function Billing() {
  const { t, i18n } = useTranslation()
  const formatCurrency = (amount) => new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'EUR' }).format(amount || 0)

  const [invoices, setInvoices] = useState([])
  const [clients, setClients] = useState([])
  const [bookings, setBookings] = useState([])
  const [stats, setStats] = useState({ paidAmount: 0, pendingAmount: 0, overdueAmount: 0 })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState(null)
  const [filterStatus, setFilterStatus] = useState(null)
  const [form] = Form.useForm()
  const selectedClientId = Form.useWatch('clientId', form)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [invoicesRes, clientsRes, bookingsRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/billing/invoices`, { params: { limit: 1000 }, headers: authHeaders() }),
        axios.get(`${API_URL}/clients`, { params: { limit: 1000 }, headers: authHeaders() }),
        axios.get(`${API_URL}/bookings`, { params: { limit: 1000 }, headers: authHeaders() }),
        axios.get(`${API_URL}/billing/stats`, { headers: authHeaders() })
      ])

      const invoiceRows = Array.isArray(invoicesRes.data?.data)
        ? invoicesRes.data.data
        : Array.isArray(invoicesRes.data) ? invoicesRes.data : []
      const clientRows = Array.isArray(clientsRes.data?.clients)
        ? clientsRes.data.clients
        : Array.isArray(clientsRes.data) ? clientsRes.data : []
      const bookingRows = Array.isArray(bookingsRes.data?.data)
        ? bookingsRes.data.data
        : Array.isArray(bookingsRes.data) ? bookingsRes.data : []

      setInvoices(invoiceRows)
      setClients(clientRows)
      setBookings(bookingRows)

      const overdueAmount = invoiceRows
        .filter(isOverdueInvoice)
        .reduce((sum, inv) => sum + invoiceTotal(inv), 0)

      setStats({
        paidAmount: statsRes.data?.paidAmount || 0,
        pendingAmount: statsRes.data?.pendingAmount || 0,
        overdueAmount
      })
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
    setEditingInvoice(null)
    form.resetFields()
    form.setFieldsValue({
      dueDate: dayjs().add(30, 'days'),
      taxAmount: 0
    })
    setIsModalVisible(true)
  }

  const handleEdit = (invoice) => {
    setEditingInvoice(invoice)
    form.setFieldsValue({
      clientId: invoice.clientId,
      bookingId: invoice.bookingId || undefined,
      amount: invoice.amount,
      taxAmount: invoice.taxAmount || 0,
      dueDate: dayjs(invoice.dueDate)
    })
    setIsModalVisible(true)
  }

  const handleMarkPaid = async (invoice) => {
    try {
      await axios.patch(`${API_URL}/billing/invoices/${invoice.id}/pay`, {}, {
        headers: authHeaders()
      })
      message.success(t('billing.markedPaid'))
      await loadData()
    } catch (err) {
      if (isDemoRestriction(err) || handleDemoRestriction(err)) return
      message.error(err.response?.data?.message || err.response?.data?.error || t('billing.saveError'))
    }
  }

  const handleDownloadPDF = async (invoice) => {
    try {
      const response = await axios.get(`${API_URL}/billing/invoices/${invoice.id}/pdf`, {
        headers: authHeaders(),
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `invoice_${invoice.number}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      message.success(t('billing.pdfDownloaded', { number: invoice.number }))
    } catch (err) {
      if (isDemoRestriction(err) || handleDemoRestriction(err)) return
      message.error(err.response?.data?.message || err.response?.data?.error || t('billing.saveError'))
    }
  }

  const handleSendEmail = async (invoice) => {
    try {
      await axios.post(`${API_URL}/billing/invoices/${invoice.id}/send`, {}, {
        headers: authHeaders()
      })
      message.success(t('billing.emailSent', { name: invoice.client?.name || invoice.clientName || '' }))
    } catch (err) {
      if (isDemoRestriction(err) || handleDemoRestriction(err)) return
      message.error(err.response?.data?.message || err.response?.data?.error || t('billing.saveError'))
    }
  }

  const handleSubmit = async (values) => {
    setSaving(true)
    try {
      const payload = {
        clientId: values.clientId,
        bookingId: values.bookingId || null,
        amount: values.amount,
        taxAmount: values.taxAmount || 0,
        dueDate: values.dueDate.toISOString()
      }

      if (editingInvoice) {
        await axios.put(`${API_URL}/billing/invoices/${editingInvoice.id}`, {
          amount: payload.amount,
          taxAmount: payload.taxAmount,
          dueDate: payload.dueDate
        }, { headers: authHeaders() })
        message.success(t('billing.updated'))
      } else {
        await axios.post(`${API_URL}/billing/invoices`, payload, {
          headers: authHeaders()
        })
        message.success(t('billing.created'))
      }

      setIsModalVisible(false)
      setEditingInvoice(null)
      form.resetFields()
      await loadData()
    } catch (err) {
      if (isDemoRestriction(err) || handleDemoRestriction(err)) return
      message.error(err.response?.data?.message || err.response?.data?.error || t('billing.saveError'))
    } finally {
      setSaving(false)
    }
  }

  const filteredInvoices = useMemo(() => {
    if (!filterStatus) return invoices
    if (filterStatus === 'OVERDUE') return invoices.filter(isOverdueInvoice)
    return invoices.filter((inv) => inv.status === filterStatus)
  }, [invoices, filterStatus])

  const clientBookings = useMemo(() => {
    if (!selectedClientId) return bookings
    return bookings.filter((b) => b.clientId === selectedClientId)
  }, [bookings, selectedClientId])

  const statsCardsConfig = [
    {
      key: 'collected',
      title: t('billing.collected'),
      value: formatCurrency(stats.paidAmount),
      icon: <CheckCircleOutlined />,
      gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
      subtitle: t('billing.totalPaid')
    },
    {
      key: 'pending',
      title: t('billing.pending'),
      value: formatCurrency(stats.pendingAmount),
      icon: <ClockCircleOutlined />,
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      subtitle: t('billing.awaitingPayment')
    },
    {
      key: 'overdue',
      title: t('billing.overdue'),
      value: formatCurrency(stats.overdueAmount),
      icon: <ExclamationCircleOutlined />,
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      subtitle: t('billing.pastDue')
    }
  ]

  const columns = [
    {
      title: t('billing.colNumber'),
      dataIndex: 'number',
      key: 'number',
      sorter: (a, b) => a.number.localeCompare(b.number),
      render: (number) => <Text strong>{number}</Text>
    },
    {
      title: t('common.client'),
      key: 'client',
      sorter: (a, b) => (a.client?.name || '').localeCompare(b.client?.name || ''),
      render: (_, record) => record.client?.name || t('bookings.unknownClient')
    },
    {
      title: t('billing.colIssueDate'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => dayjs(date).format('DD/MM/YYYY'),
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix()
    },
    {
      title: t('billing.colDueDate'),
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (date, record) => (
        <Text type={isOverdueInvoice(record) ? 'danger' : undefined}>
          {dayjs(date).format('DD/MM/YYYY')}
        </Text>
      ),
      sorter: (a, b) => dayjs(a.dueDate).unix() - dayjs(b.dueDate).unix()
    },
    {
      title: t('billing.colAmount'),
      key: 'totalAmount',
      render: (_, record) => formatCurrency(invoiceTotal(record)),
      sorter: (a, b) => invoiceTotal(a) - invoiceTotal(b)
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => {
        const displayStatus = isOverdueInvoice(record) && status === 'PENDING' ? 'OVERDUE' : status
        const { label, color, icon } = getStatusDetails(displayStatus, t)
        return <Tag color={color} icon={icon}>{label}</Tag>
      },
      filters: Object.keys(STATUS_CONFIG).map((key) => ({
        text: t(`enums.invoiceStatus.${key}`),
        value: key
      })),
      onFilter: (value, record) => {
        if (value === 'OVERDUE') return isOverdueInvoice(record)
        return record.status === value
      }
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
          {record.status !== 'PAID' && (
            <Tooltip title={t('billing.markPaid')}>
              <Button type="text" icon={<CheckCircleOutlined />} onClick={() => handleMarkPaid(record)} />
            </Tooltip>
          )}
          <Tooltip title={t('common.downloadPdf')}>
            <Button type="text" icon={<DownloadOutlined />} onClick={() => handleDownloadPDF(record)} />
          </Tooltip>
          <Tooltip title={t('common.sendEmail')}>
            <Button type="text" icon={<MailOutlined />} onClick={() => handleSendEmail(record)} />
          </Tooltip>
        </Space>
      )
    }
  ]

  return (
    <div style={{ padding: '24px' }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 32 }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            <DollarCircleOutlined style={{ marginRight: 12, color: '#1890ff' }} />
            {t('billing.title')}
          </Title>
          <Text type="secondary" style={{ fontSize: 16 }}>
            {t('billing.subtitle')}
          </Text>
        </Col>
        <Col>
          <Button type="primary" size="large" icon={<PlusOutlined />} onClick={handleAdd}>
            {t('billing.newInvoice')}
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
                  {t(`enums.invoiceStatus.${key}`)}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>

        {loading && invoices.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px' }}>
            <Spin size="large" />
            <Text style={{ marginTop: 16, display: 'block' }}>{t('billing.loading')}</Text>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <DollarCircleOutlined style={{ fontSize: 48, marginBottom: 16, color: '#ff4d4f' }} />
            <Title level={3}>{t('common.errorLoading')}</Title>
            <Text style={{ fontSize: 16, display: 'block', marginBottom: 24 }}>{error}</Text>
            <Button type="primary" onClick={loadData}>{t('billing.retry')}</Button>
          </div>
        ) : !loading && invoices.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <DollarCircleOutlined style={{ fontSize: 48, marginBottom: 16, color: '#4F46E5' }} />
            <Title level={3}>{t('billing.emptyTitle')}</Title>
            <Text style={{ fontSize: 16 }}>{t('billing.emptyText')}</Text>
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={filteredInvoices}
            loading={loading}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total, range) => t('billing.pagination', { from: range[0], to: range[1], total })
            }}
            locale={{ emptyText: t('billing.emptyTitle') }}
          />
        )}
      </Card>

      <Modal
        title={editingInvoice ? t('billing.editInvoice') : t('billing.newInvoice')}
        open={isModalVisible}
        onCancel={() => !saving && setIsModalVisible(false)}
        width={700}
        footer={null}
        destroyOnClose
        maskClosable={!saving}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 24 }}>
          <Form.Item name="clientId" label={t('common.client')} rules={[{ required: true, message: t('common.required') }]}>
            <Select
              showSearch
              optionFilterProp="children"
              placeholder={t('billing.selectClient')}
              onChange={() => form.setFieldValue('bookingId', undefined)}
              disabled={!!editingInvoice}
            >
              {clients.map((c) => (
                <Option key={c.id} value={c.id}>{c.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="bookingId" label={t('billing.booking')}>
            <Select
              allowClear
              showSearch
              optionFilterProp="children"
              placeholder={t('billing.selectBooking')}
              disabled={!!editingInvoice}
            >
              {clientBookings.map((b) => (
                <Option key={b.id} value={b.id}>
                  {(b.space?.name || t('bookings.unknownSpace'))} — {dayjs(b.startDateTime).format('DD/MM/YYYY HH:mm')}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="dueDate" label={t('billing.colDueDate')} rules={[{ required: true, message: t('common.required') }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="amount" label={t('billing.amount')} rules={[{ required: true, message: t('common.required') }]}>
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="0.00" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="taxAmount" label={t('billing.taxAmount')} initialValue={0}>
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="0.00" />
              </Form.Item>
            </Col>
          </Row>
          <Row justify="end">
            <Space>
              <Button onClick={() => setIsModalVisible(false)} disabled={saving}>{t('common.cancel')}</Button>
              <Button type="primary" htmlType="submit" loading={saving}>
                {editingInvoice ? t('common.update') : t('common.create')}
              </Button>
            </Space>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}

export default Billing
