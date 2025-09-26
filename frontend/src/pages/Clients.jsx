import React, { useState, useEffect } from 'react';
import {
  Table, Button, Input, Modal, Form, Select, Space, Tag,
  Popconfirm, message, Row, Col, Card, Statistic, Divider,
  Upload, Dropdown, DatePicker, Tooltip, Avatar, Progress, Typography, Badge
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined,
  DownloadOutlined, UploadOutlined, MoreOutlined, UserOutlined,
  PhoneOutlined, MailOutlined, HomeOutlined, TeamOutlined,
  StarOutlined, CheckCircleOutlined, RiseOutlined, CrownOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [stats, setStats] = useState({ total: 0, active: 0, new: 0, vip: 0 });
  const [form] = Form.useForm();

  // Mock data for demonstration purposes
  const mockClientsData = [
    { id: 1, firstName: 'Mario', lastName: 'Rossi', company: 'Rossi SRL', email: 'mario.rossi@example.com', phone: '3331234567', segment: 'VIP', _count: { bookings: 5, contracts: 2 }, createdAt: dayjs().subtract(10, 'days').toISOString() },
    { id: 2, firstName: 'Giulia', lastName: 'Bianchi', company: 'Bianchi SPA', email: 'giulia.bianchi@example.com', phone: '3357654321', segment: 'BUSINESS', _count: { bookings: 12, contracts: 1 }, createdAt: dayjs().subtract(45, 'days').toISOString() },
    { id: 3, firstName: 'Luca', lastName: 'Verdi', email: 'luca.verdi@example.com', phone: '3471122334', segment: 'OCCASIONALE', _count: { bookings: 2 }, createdAt: dayjs().subtract(120, 'days').toISOString() },
  ];

  const fetchClients = async () => {
    setLoading(true);
    // Simulate API call with mock data
    setTimeout(() => {
      setClients(mockClientsData);
      setLoading(false);
    }, 500);
  };

  const fetchStats = () => {
     setStats({
        total: mockClientsData.length,
        active: mockClientsData.filter(c => (c._count?.contracts || 0) > 0).length,
        new: mockClientsData.filter(c => dayjs(c.createdAt).isAfter(dayjs().subtract(30, 'days'))).length,
        vip: mockClientsData.filter(c => c.segment === 'VIP').length
      });
  };

  useEffect(() => {
    fetchClients();
  }, []);
  
  useEffect(() => {
    fetchStats();
  }, [clients]);

  const handleSubmit = (values) => {
    message.success(editingClient ? 'Client updated successfully!' : 'Client created successfully!');
    setModalVisible(false);
    // Here you would add the logic to update the mockClientsData array
  };
  const handleDelete = (id) => {
    message.success('Client deleted successfully!');
     // Here you would add the logic to filter the mockClientsData array
  };
  const handleEdit = (client) => {
    setEditingClient(client);
    form.setFieldsValue(client);
    setModalVisible(true);
  };
  const handleCreate = () => {
    setEditingClient(null);
    form.resetFields();
    setModalVisible(true);
  };

  const getSegmentStyle = (segment) => {
    switch (segment) {
      case 'VIP': return { color: '#ff4d4f', icon: <StarOutlined />, tagColor: 'red' };
      case 'BUSINESS': return { color: '#1890ff', icon: <UserOutlined />, tagColor: 'blue' };
      case 'OCCASIONALE': return { color: '#52c41a', icon: <UserOutlined />, tagColor: 'green' };
      default: return { color: '#8c8c8c', icon: <UserOutlined />, tagColor: 'default' };
    }
  };

  const columns = [
    { title: 'Client', key: 'client', render: (_, record) => { const style = getSegmentStyle(record.segment); return (<Space><Avatar style={{ backgroundColor: style.color }} icon={style.icon} /><div><Text strong>{`${record.firstName} ${record.lastName}`}</Text><br /><Text type="secondary">{record.company || 'Personal'}</Text></div></Space>) } },
    { title: 'Contact', key: 'contact', render: (_, record) => (<Space direction="vertical" size={0}><Space align="center" size="small"><MailOutlined style={{ color: '#8c8c8c' }} /><Text copyable={{ text: record.email }} style={{ fontSize: 13 }}>{record.email}</Text></Space>{record.phone && (<Space align="center" size="small"><PhoneOutlined style={{ color: '#8c8c8c' }} /><Text copyable={{ text: record.phone }} style={{ fontSize: 13 }}>{record.phone}</Text></Space>)}</Space>) },
    { title: 'Segment', dataIndex: 'segment', key: 'segment', render: (segment) => { if (!segment) return <Tag>N/A</Tag>; const style = getSegmentStyle(segment); return <Tag color={style.tagColor}>{segment}</Tag> } },
    { title: 'Activity', key: 'activity', render: (_, record) => { const totalActivity = (record._count?.bookings || 0) + (record._count?.contracts || 0); const percent = Math.min((totalActivity / 20) * 100, 100); return (<div style={{ width: 120 }}><Tooltip title={`${totalActivity} total bookings & contracts`}><Progress percent={percent} showInfo={false} strokeColor="#1890ff" /></Tooltip></div>); } },
    { title: 'Created Date', dataIndex: 'createdAt', key: 'createdAt', render: (date) => dayjs(date).format('DD/MM/YYYY') },
    { title: 'Actions', key: 'actions', align: 'right', render: (_, record) => (<Space><Tooltip title="Edit"><Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} /></Tooltip><Popconfirm title="Are you sure?" onConfirm={() => handleDelete(record.id)}><Tooltip title="Delete"><Button type="text" danger icon={<DeleteOutlined />} /></Tooltip></Popconfirm></Space>) }
  ];

  const statsCardsConfig = [
    { key: 'total', title: "Total Clients", value: stats.total, icon: <TeamOutlined />, gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', subtitle: 'All registered clients' },
    { key: 'active', title: "Active Clients", value: stats.active, icon: <CheckCircleOutlined />, gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', subtitle: 'Clients with active contracts' },
    { key: 'new', title: "New This Month", value: stats.new, icon: <RiseOutlined />, gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', subtitle: 'Clients registered in last 30 days' },
    { key: 'vip', title: "VIP Clients", value: stats.vip, icon: <CrownOutlined />, gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', subtitle: 'High-value clients' }
  ];

  return (
    <div className="page-enter" style={{ padding: '24px' }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 32 }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}><TeamOutlined style={{ marginRight: 12, color: '#4F46E5' }} />Clients Management</Title>
          <Text type="secondary" style={{ fontSize: 16 }}>View, manage, and export your client data.</Text>
        </Col>
        <Col><Button type="primary" size="large" icon={<PlusOutlined />} onClick={handleCreate}>Add Client</Button></Col>
      </Row>

       <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
        {statsCardsConfig.map(config => (
          <Col xs={24} sm={12} lg={6} key={config.key}>
            <Card hoverable styles={{ body: { padding: 0 } }}>
              <div style={{ background: config.gradient, padding: '24px', position: 'relative', borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
                <Avatar size={48} style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }} icon={config.icon} />
                <Title level={4} style={{ color: 'white', margin: '12px 0 0', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>{config.title}</Title>
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>{config.value}</div>
                <Text type="secondary" style={{ fontSize: 14 }}>{config.subtitle}</Text>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Card style={{ borderRadius: 16, border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col flex="auto"><Search placeholder="Search clients..." size="large" /></Col>
          <Col><Select placeholder="Filter by segment" style={{ width: 200 }} size="large"><Option value="VIP">VIP</Option><Option value="BUSINESS">Business</Option></Select></Col>
        </Row>
        <Table columns={columns} dataSource={clients} rowKey="id" loading={loading} />
      </Card>

       <Modal title={editingClient ? 'Edit Client' : 'Add New Client'} open={modalVisible} onCancel={() => setModalVisible(false)} footer={null} width={800}>
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 24 }}>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="firstName" label="First Name" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="lastName" label="Last Name" rules={[{ required: true }]}><Input /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="phone" label="Phone"><Input /></Form.Item></Col>
          </Row>
          <Form.Item name="company" label="Company"><Input /></Form.Item>
          <Form.Item name="segment" label="Segment"><Select placeholder="Select a segment"><Option value="VIP">VIP</Option><Option value="BUSINESS">Business</Option><Option value="OCCASIONALE">Occasional</Option></Select></Form.Item>
          <Divider />
          <Row justify="end"><Space><Button onClick={() => setModalVisible(false)}>Cancel</Button><Button type="primary" htmlType="submit" loading={loading}>{editingClient ? 'Update' : 'Create'}</Button></Space></Row>
        </Form>
      </Modal>
    </div>
  );
}

export default Clients;

