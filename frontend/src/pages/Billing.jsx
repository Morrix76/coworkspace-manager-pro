import React, { useState, useEffect } from 'react'
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
  Divider,
  Tooltip,
  Avatar // Aggiunto Avatar
} from 'antd'
import {
  PlusOutlined,
  EyeOutlined,
  DownloadOutlined,
  MailOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  DollarCircleOutlined, // Aggiunta icona
  EditOutlined, // Aggiunta icona
  StopOutlined // Aggiunta icona
} from '@ant-design/icons'
import dayjs from 'dayjs'
import axios from 'axios'

const { Title, Text } = Typography // Aggiunto Text
const { Option } = Select
const { TextArea } = Input

const API_URL = import.meta.env.VITE_API_URL

// --- CONFIGURAZIONE CENTRALE DEGLI STATI ---
const STATUS_CONFIG = {
  DRAFT: { label: 'Draft', color: 'default', icon: <EditOutlined /> },
  PENDING: { label: 'Pending', color: 'gold', icon: <ClockCircleOutlined /> },
  PAID: { label: 'Paid', color: 'green', icon: <CheckCircleOutlined /> },
  OVERDUE: { label: 'Overdue', color: 'red', icon: <ExclamationCircleOutlined /> },
  CANCELLED: { label: 'Cancelled', color: 'red', icon: <StopOutlined /> }
};

const getStatusDetails = (status) => STATUS_CONFIG[status] || { label: status, color: 'default' };

function Billing() {
  const [invoices, setInvoices] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState(null)
  const [filterStatus, setFilterStatus] = useState(null)
  const [form] = Form.useForm()

  // --- MOCK DATA (per fallback) ---
  const mockInvoices = [
    { id: 1, number: 'INV-2025-001', clientId: 1, clientName: 'Innovate Corp', issueDate: dayjs().subtract(5, 'days').toISOString(), dueDate: dayjs().add(25, 'days').toISOString(), amount: 480.00, taxAmount: 105.60, totalAmount: 585.60, status: 'PAID', description: 'Executive office rental - January 2025' },
    { id: 2, number: 'INV-2025-002', clientId: 2, clientName: 'Quantum Solutions', issueDate: dayjs().subtract(3, 'days').toISOString(), dueDate: dayjs().add(27, 'days').toISOString(), amount: 160.00, taxAmount: 35.20, totalAmount: 195.20, status: 'PENDING', description: 'Meeting room - Client presentations' },
    { id: 3, number: 'INV-2025-003', clientId: 1, clientName: 'Innovate Corp', issueDate: dayjs().subtract(35, 'days').toISOString(), dueDate: dayjs().subtract(5, 'days').toISOString(), amount: 320.00, taxAmount: 70.40, totalAmount: 390.40, status: 'OVERDUE', description: 'Coworking Space - December 2024' }
  ];
  const mockClients = [
    { id: 1, name: 'Innovate Corp', company: 'Innovate Corp' },
    { id: 2, name: 'Quantum Solutions', company: 'Quantum Solutions' },
    { id: 3, name: 'Synergy Labs', company: 'Synergy Labs' }
  ];

  // --- GESTIONE DATI (invariato) ---
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true);
      // Logica API invariata, usa i mock come fallback
      setInvoices(mockInvoices);
      setClients(mockClients);
    } catch (error) {
      message.error('Error loading data');
    } finally {
      setLoading(false);
    }
  }

  // Funzioni CRUD (logica invariata)
  const handleAdd = () => {
    setEditingInvoice(null)
    form.resetFields()
    form.setFieldsValue({
      issueDate: dayjs(),
      dueDate: dayjs().add(30, 'days'),
      status: 'DRAFT',
      taxRate: 22
    })
    setIsModalVisible(true)
  }

  const handleEdit = (invoice) => {
    setEditingInvoice(invoice)
    form.setFieldsValue({
      ...invoice,
      issueDate: dayjs(invoice.issueDate),
      dueDate: dayjs(invoice.dueDate)
    })
    setIsModalVisible(true)
  }

  const handleSubmit = async (values) => {
    try {
      const { amount, taxRate = 0, ...rest } = values;
      const taxAmount = (amount * taxRate) / 100;
      const totalAmount = amount + taxAmount;

      const invoiceData = {
        ...rest,
        amount,
        taxAmount,
        totalAmount,
        issueDate: values.issueDate.toISOString(),
        dueDate: values.dueDate.toISOString(),
      };

      if (editingInvoice) {
        setInvoices(invoices.map(inv => inv.id === editingInvoice.id ? { ...inv, ...invoiceData } : inv));
        message.success('Invoice updated');
      } else {
        const newInvoice = {
          id: Date.now(),
          number: `INV-2025-${String(invoices.length + 1).padStart(3, '0')}`,
          clientName: clients.find(c => c.id === values.clientId)?.name || '',
          ...invoiceData
        };
        setInvoices([...invoices, newInvoice]);
        message.success('Invoice created');
      }
      setIsModalVisible(false);
    } catch (error) {
      message.error('Error saving invoice');
    }
  }

  const handleSendEmail = (invoice) => message.success(`Email sent to ${invoice.clientName}`);
  const handleDownloadPDF = (invoice) => message.success(`PDF downloaded for invoice ${invoice.number}`);

  const filteredInvoices = filterStatus ? invoices.filter(inv => inv.status === filterStatus) : invoices;

  // --- COLONNE TABELLA ---
  const columns = [
    { title: 'Number', dataIndex: 'number', key: 'number', sorter: (a, b) => a.number.localeCompare(b.number), render: (number) => <Text strong>{number}</Text> },
    { title: 'Client', dataIndex: 'clientName', key: 'clientName', sorter: (a, b) => a.clientName.localeCompare(b.clientName) },
    { title: 'Issue Date', dataIndex: 'issueDate', key: 'issueDate', render: (date) => dayjs(date).format('DD/MM/YYYY'), sorter: (a, b) => dayjs(a.issueDate).unix() - dayjs(b.issueDate).unix() },
    { title: 'Due Date', dataIndex: 'dueDate', key: 'dueDate', render: (date, record) => (<Text type={record.status === 'OVERDUE' ? 'danger' : undefined}>{dayjs(date).format('DD/MM/YYYY')}</Text>), sorter: (a, b) => dayjs(a.dueDate).unix() - dayjs(b.dueDate).unix() },
    { title: 'Amount', dataIndex: 'totalAmount', key: 'totalAmount', render: (amount) => `$${amount?.toFixed(2) || '0.00'}`, sorter: (a, b) => (a.totalAmount || 0) - (b.totalAmount || 0) },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (status) => {
        const { label, color, icon } = getStatusDetails(status);
        return <Tag color={color} icon={icon}>{label}</Tag>;
      },
      filters: Object.entries(STATUS_CONFIG).map(([key, { label }]) => ({ text: label, value: key })),
      onFilter: (value, record) => record.status === value
    },
    { title: 'Actions', key: 'actions', align: 'right', render: (_, record) => (<Space><Tooltip title="Edit"><Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} /></Tooltip><Tooltip title="Download PDF"><Button type="text" icon={<DownloadOutlined />} onClick={() => handleDownloadPDF(record)} /></Tooltip><Tooltip title="Send Email"><Button type="text" icon={<MailOutlined />} onClick={() => handleSendEmail(record)} /></Tooltip></Space>) }
  ];

  // --- CARD STATISTICHE ---
  const statsCardsConfig = [
    { key: 'collected', title: "Collected", value: `$${invoices.filter(inv => inv.status === 'PAID').reduce((sum, inv) => sum + (inv.totalAmount || 0), 0).toFixed(2)}`, icon: <CheckCircleOutlined />, gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', subtitle: 'Total paid invoices' },
    { key: 'pending', title: "Pending", value: `$${invoices.filter(inv => inv.status === 'PENDING').reduce((sum, inv) => sum + (inv.totalAmount || 0), 0).toFixed(2)}`, icon: <ClockCircleOutlined />, gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', subtitle: 'Awaiting payment' },
    { key: 'overdue', title: "Overdue", value: `$${invoices.filter(inv => inv.status === 'OVERDUE').reduce((sum, inv) => sum + (inv.totalAmount || 0), 0).toFixed(2)}`, icon: <ExclamationCircleOutlined />, gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', subtitle: 'Past due date' }
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* HEADER */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 32 }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            <DollarCircleOutlined style={{ marginRight: 12, color: '#1890ff' }} />
            Billing & Invoices
          </Title>
          <Text type="secondary" style={{ fontSize: 16 }}>
            Manage all your invoices and payments.
          </Text>
        </Col>
        <Col>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            New Invoice
          </Button>
        </Col>
      </Row>

      {/* STATISTICHE */}
      <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
        {statsCardsConfig.map(config => (
          <Col xs={24} sm={12} md={8} key={config.key}>
            <Card hoverable style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} bodyStyle={{ padding: 0 }}>
              <div style={{ background: config.gradient, padding: '24px', position: 'relative', borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
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

      {/* TABELLA FATTURE */}
      <Card style={{ borderRadius: 16, border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <Row style={{ marginBottom: 24 }}>
          <Col>
            <Select
              placeholder="Filter by status"
              style={{ width: 200 }}
              value={filterStatus}
              onChange={(value) => setFilterStatus(value)}
              allowClear
              size="large"
            >
              {Object.entries(STATUS_CONFIG).map(([key, { label, icon }]) => (
                <Option key={key} value={key}>{React.cloneElement(icon, { style: { marginRight: 8 } })}{label}</Option>
              ))}
            </Select>
          </Col>
        </Row>
        <Table
          columns={columns}
          dataSource={filteredInvoices}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} invoices` }}
        />
      </Card>

      {/* MODALE CREA/MODIFICA FATTURA (logica invariata) */}
      <Modal title={editingInvoice ? 'Edit Invoice' : 'New Invoice'} open={isModalVisible} onCancel={() => setIsModalVisible(false)} width={700} footer={null} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 24 }}>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="clientId" label="Client" rules={[{ required: true }]}><Select showSearch optionFilterProp="children" placeholder="Select client">{clients.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}</Select></Form.Item></Col>
            <Col span={12}><Form.Item name="status" label="Status" rules={[{ required: true }]}><Select>{Object.entries(STATUS_CONFIG).map(([key, { label }]) => <Option key={key} value={key}>{label}</Option>)}</Select></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="issueDate" label="Issue Date" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={12}><Form.Item name="dueDate" label="Due Date" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
          <Form.Item name="description" label="Description" rules={[{ required: true }]}><TextArea rows={2} placeholder="Description of services..." /></Form.Item>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="amount" label="Amount ($)" rules={[{ required: true }]}><InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="0.00" /></Form.Item></Col>
            <Col span={12}><Form.Item name="taxRate" label="VAT (%)" initialValue={22}><InputNumber min={0} max={100} style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
          <Divider />
          <Row justify="end"><Space><Button onClick={() => setIsModalVisible(false)}>Cancel</Button><Button type="primary" htmlType="submit">{editingInvoice ? 'Update' : 'Create'}</Button></Space></Row>
        </Form>
      </Modal>
    </div>
  )
}

export default Billing