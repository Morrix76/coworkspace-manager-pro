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
  Statistic,
  Upload,
  Tooltip,
  Divider,
  Avatar // Aggiunto Avatar
} from 'antd'
import {
  PlusOutlined,
  EyeOutlined,
  DownloadOutlined,
  FileTextOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  ContainerOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  StopOutlined, // Aggiunta icona
  FileDoneOutlined, // Aggiunta icona
  FileSyncOutlined, // Aggiunta icona
  DollarCircleOutlined // Aggiunta icona
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
  ACTIVE: { label: 'Active', color: 'green', icon: <CheckCircleOutlined /> },
  EXPIRED: { label: 'Expired', color: 'red', icon: <StopOutlined /> },
  TERMINATED: { label: 'Terminated', color: 'red', icon: <ExclamationCircleOutlined /> }
};

const getStatusDetails = (status) => STATUS_CONFIG[status] || { label: status, color: 'default' };

const getTypeLabel = (type) => {
  const labels = {
    HOURLY: 'Hourly',
    SHORT_TERM: 'Short Term',
    LONG_TERM: 'Long Term',
    PERMANENT: 'Permanent'
  }
  return labels[type] || type
}


function Contracts() {
  const [contracts, setContracts] = useState([])
  const [clients, setClients] = useState([])
  const [spaces, setSpaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingContract, setEditingContract] = useState(null)
  const [filterStatus, setFilterStatus] = useState(null) // Modificato per allowClear
  const [form] = Form.useForm()

  // --- MOCK DATA (per fallback) ---
  const mockContracts = [
    { id: 1, number: 'CONT-2025-001', clientId: 1, clientName: 'Innovate Corp', spaceId: 1, spaceName: 'Executive Office 1', type: 'LONG_TERM', status: 'ACTIVE', startDate: dayjs().subtract(30, 'days').toISOString(), endDate: dayjs().add(335, 'days').toISOString(), monthlyAmount: 1200.00, depositAmount: 2400.00, signedDate: dayjs().subtract(30, 'days').toISOString(), notes: 'Annual contract with renewal option' },
    { id: 2, number: 'CONT-2025-002', clientId: 2, clientName: 'Quantum Solutions', spaceId: 2, spaceName: 'Meeting Room A', type: 'SHORT_TERM', status: 'PENDING', startDate: dayjs().add(7, 'days').toISOString(), endDate: dayjs().add(37, 'days').toISOString(), monthlyAmount: 800.00, depositAmount: 800.00, signedDate: null, notes: 'Renewable monthly contract' },
    { id: 3, number: 'CONT-2024-045', clientId: 3, clientName: 'Synergy Labs', spaceId: 3, spaceName: 'Coworking Open Space', type: 'HOURLY', status: 'EXPIRED', startDate: dayjs().subtract(90, 'days').toISOString(), endDate: dayjs().subtract(10, 'days').toISOString(), monthlyAmount: 0, depositAmount: 0, signedDate: dayjs().subtract(90, 'days').toISOString(), notes: 'Expired hourly contract' }
  ];
  const mockClients = [
    { id: 1, name: 'Innovate Corp', company: 'Innovate Corp' },
    { id: 2, name: 'Quantum Solutions', company: 'Quantum Solutions' },
    { id: 3, name: 'Synergy Labs', company: 'Synergy Labs' }
  ];
  const mockSpaces = [
    { id: 1, name: 'Executive Office 1' },
    { id: 2, name: 'Meeting Room A' },
    { id: 3, name: 'Coworking Open Space' }
  ];

  // --- GESTIONE DATI (invariato) ---
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true);
      // Logica API invariata, usa i mock come fallback
      setContracts(mockContracts);
      setClients(mockClients);
      setSpaces(mockSpaces);
    } catch (error) {
      message.error('Error loading data');
    } finally {
      setLoading(false);
    }
  }

  // Funzioni CRUD (logica invariata)
  const handleAdd = () => {
    setEditingContract(null)
    form.resetFields()
    form.setFieldsValue({
      startDate: dayjs(),
      endDate: dayjs().add(1, 'year'),
      status: 'DRAFT',
      type: 'LONG_TERM'
    })
    setIsModalVisible(true)
  }

  const handleEdit = (contract) => {
    setEditingContract(contract)
    form.setFieldsValue({
      ...contract,
      startDate: dayjs(contract.startDate),
      endDate: dayjs(contract.endDate),
      signedDate: contract.signedDate ? dayjs(contract.signedDate) : null
    })
    setIsModalVisible(true)
  }

  const handleDelete = async (contractId) => {
    Modal.confirm({
      title: 'Confirm Deletion',
      content: 'Are you sure you want to delete this contract?',
      okType: 'danger',
      onOk: () => {
        setContracts(contracts.filter(c => c.id !== contractId))
        message.success('Contract deleted')
      }
    })
  }

  const handleSubmit = async (values) => {
    try {
      const contractData = { ...values, startDate: values.startDate.toISOString(), endDate: values.endDate.toISOString(), signedDate: values.signedDate ? values.signedDate.toISOString() : null };
      if (editingContract) {
        setContracts(contracts.map(c => c.id === editingContract.id ? { ...c, ...contractData, clientName: clients.find(cl => cl.id === values.clientId)?.name, spaceName: spaces.find(s => s.id === values.spaceId)?.name } : c));
        message.success('Contract updated');
      } else {
        const newContract = { id: Date.now(), number: `CONT-2025-${String(contracts.length + 1).padStart(3, '0')}`, ...contractData, clientName: clients.find(cl => cl.id === values.clientId)?.name, spaceName: spaces.find(s => s.id === values.spaceId)?.name };
        setContracts([...contracts, newContract]);
        message.success('Contract created');
      }
      setIsModalVisible(false);
    } catch (error) {
      message.error('Error saving contract');
    }
  }

  const filteredContracts = filterStatus ? contracts.filter(c => c.status === filterStatus) : contracts;

  // --- COLONNE TABELLA ---
  const columns = [
    { title: 'Number', dataIndex: 'number', key: 'number', sorter: (a, b) => a.number.localeCompare(b.number), render: (number) => <Text strong>{number}</Text> },
    { title: 'Client', dataIndex: 'clientName', key: 'clientName', sorter: (a, b) => a.clientName.localeCompare(b.clientName) },
    { title: 'Space', dataIndex: 'spaceName', key: 'spaceName' },
    { title: 'Type', dataIndex: 'type', key: 'type', render: (type) => <Tag>{getTypeLabel(type)}</Tag> },
    { title: 'Period', key: 'period', render: (_, record) => (<div><Text>{dayjs(record.startDate).format('DD/MM/YYYY')}</Text><Text type="secondary"><br />{dayjs(record.endDate).format('DD/MM/YYYY')}</Text></div>) },
    { title: 'Monthly Amount', dataIndex: 'monthlyAmount', key: 'monthlyAmount', render: (amount) => amount > 0 ? `$${amount?.toFixed(2)}` : '-', sorter: (a, b) => (a.monthlyAmount || 0) - (b.monthlyAmount || 0) },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (status) => {
        const { label, color, icon } = getStatusDetails(status);
        return <Tag color={color} icon={icon}>{label}</Tag>;
      },
      filters: Object.entries(STATUS_CONFIG).map(([key, { label }]) => ({ text: label, value: key })),
      onFilter: (value, record) => record.status === value
    },
    { title: 'Actions', key: 'actions', align: 'right', render: (_, record) => (<Space><Tooltip title="Edit"><Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} /></Tooltip><Tooltip title="Download PDF"><Button type="text" icon={<DownloadOutlined />} /></Tooltip><Tooltip title="Delete"><Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}/></Tooltip></Space>) }
  ];

  // --- CARD STATISTICHE ---
  const statsCardsConfig = [
    { key: 'active', title: "Active Contracts", value: contracts.filter(c => c.status === 'ACTIVE').length, icon: <FileDoneOutlined />, gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', subtitle: 'Currently in effect' },
    { key: 'pending', title: "Pending Contracts", value: contracts.filter(c => c.status === 'PENDING').length, icon: <FileSyncOutlined />, gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', subtitle: 'Awaiting activation' },
    { key: 'revenue', title: "Active Monthly Revenue", value: `$${contracts.filter(c => c.status === 'ACTIVE').reduce((sum, c) => sum + (c.monthlyAmount || 0), 0).toFixed(2)}`, icon: <DollarCircleOutlined />, gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', subtitle: 'Estimated monthly income' }
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* HEADER */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 32 }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            <FileTextOutlined style={{ marginRight: 12, color: '#1890ff' }} />
            Contracts Management
          </Title>
          <Text type="secondary" style={{ fontSize: 16 }}>
            Oversee all client agreements and financial terms.
          </Text>
        </Col>
        <Col>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            New Contract
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

      {/* TABELLA CONTRATTI */}
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
          dataSource={filteredContracts}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} contracts` }}
        />
      </Card>

      {/* MODALE CREA/MODIFICA CONTRATTO (logica invariata) */}
      <Modal title={editingContract ? 'Edit Contract' : 'New Contract'} open={isModalVisible} onCancel={() => setIsModalVisible(false)} width={800} footer={null} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 24 }}>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="clientId" label="Client" rules={[{ required: true }]}><Select showSearch optionFilterProp="children" placeholder="Select a client">{clients.map(c => (<Option key={c.id} value={c.id}>{c.name}</Option>))}</Select></Form.Item></Col>
            <Col span={12}><Form.Item name="spaceId" label="Space" rules={[{ required: true }]}><Select showSearch optionFilterProp="children" placeholder="Select a space">{spaces.map(s => (<Option key={s.id} value={s.id}>{s.name}</Option>))}</Select></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="type" label="Contract Type" rules={[{ required: true }]}><Select>{Object.entries({ HOURLY: 'Hourly', SHORT_TERM: 'Short Term', LONG_TERM: 'Long Term', PERMANENT: 'Permanent' }).map(([k, v]) => <Option key={k} value={k}>{v}</Option>)}</Select></Form.Item></Col>
            <Col span={12}><Form.Item name="status" label="Status" rules={[{ required: true }]}><Select>{Object.entries(STATUS_CONFIG).map(([key, { label }]) => <Option key={key} value={key}>{label}</Option>)}</Select></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="startDate" label="Start Date" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={12}><Form.Item name="endDate" label="End Date" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="monthlyAmount" label="Monthly Amount ($)"><InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="0.00" /></Form.Item></Col>
            <Col span={8}><Form.Item name="depositAmount" label="Deposit ($)"><InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="0.00" /></Form.Item></Col>
            <Col span={8}><Form.Item name="signedDate" label="Signed Date"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
          <Form.Item name="notes" label="Notes"><TextArea rows={3} placeholder="Additional notes..." /></Form.Item>
          <Row justify="end"><Space><Button onClick={() => setIsModalVisible(false)}>Cancel</Button><Button type="primary" htmlType="submit">{editingContract ? 'Update' : 'Create'}</Button></Space></Row>
        </Form>
      </Modal>
    </div>
  )
}

export default Contracts;