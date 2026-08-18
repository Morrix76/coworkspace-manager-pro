import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Table, Button, Input, Modal, Form, Select, Space, Tag,
  Popconfirm, message, Row, Col, Card, Tooltip, Avatar, Progress, Typography, Checkbox
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined,
  PhoneOutlined, MailOutlined, TeamOutlined,
  CheckCircleOutlined, RiseOutlined, StopOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { handleDemoRestriction, isDemoRestriction } from '../utils/demoError';

const { Search, TextArea } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

const API_URL = import.meta.env.VITE_API_URL;

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`
});

function Clients() {
  const { t } = useTranslation();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState(undefined);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [form] = Form.useForm();

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/clients`, {
        params: { limit: 1000 },
        headers: authHeaders()
      });
      setClients(Array.isArray(response.data?.clients) ? response.data.clients : []);
    } catch (err) {
      if (isDemoRestriction(err) || handleDemoRestriction(err)) {
        setError(err.response?.data?.message || t('common.errorLoading'));
        return;
      }
      const errorMessage = err.response?.data?.message || err.response?.data?.error || t('common.errorLoading');
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const stats = useMemo(() => {
    const now = dayjs();
    return {
      total: clients.length,
      active: clients.filter((client) => client.active !== false).length,
      inactive: clients.filter((client) => client.active === false).length,
      new: clients.filter((client) => dayjs(client.createdAt).isAfter(now.subtract(30, 'days'))).length
    };
  }, [clients]);

  const filteredClients = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return clients.filter((client) => {
      if (activeFilter === true && client.active === false) return false;
      if (activeFilter === false && client.active !== false) return false;
      if (!query) return true;
      return [client.name, client.email, client.company]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query));
    });
  }, [clients, searchTerm, activeFilter]);

  const handleSubmit = async (values) => {
    setSaving(true);
    try {
      const payload = {
        name: values.name,
        email: values.email,
        phone: values.phone,
        company: values.company,
        vatNumber: values.vatNumber,
        address: values.address,
        notes: values.notes,
        active: values.active
      };

      if (editingClient) {
        await axios.put(`${API_URL}/clients/${editingClient.id}`, payload, {
          headers: authHeaders()
        });
        message.success(t('clients.updated'));
      } else {
        await axios.post(`${API_URL}/clients`, payload, {
          headers: authHeaders()
        });
        message.success(t('clients.created'));
      }

      setModalVisible(false);
      form.resetFields();
      setEditingClient(null);
      await fetchClients();
    } catch (err) {
      if (isDemoRestriction(err) || handleDemoRestriction(err)) return;
      message.error(err.response?.data?.message || err.response?.data?.error || t('common.errorLoading'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/clients/${id}`, {
        headers: authHeaders()
      });
      message.success(t('clients.deleted'));
      await fetchClients();
    } catch (err) {
      if (isDemoRestriction(err) || handleDemoRestriction(err)) return;
      message.error(err.response?.data?.message || err.response?.data?.error || t('clients.deleted'));
    }
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    form.setFieldsValue({
      name: client.name,
      email: client.email,
      phone: client.phone,
      company: client.company,
      vatNumber: client.vatNumber,
      address: client.address,
      notes: client.notes,
      active: client.active !== false
    });
    setModalVisible(true);
  };

  const handleCreate = () => {
    setEditingClient(null);
    form.resetFields();
    form.setFieldsValue({ active: true });
    setModalVisible(true);
  };

  const columns = [
    {
      title: t('clients.colClient'),
      key: 'client',
      render: (_, record) => (
        <Space>
          <Avatar style={{ backgroundColor: record.active === false ? '#8c8c8c' : '#4F46E5' }} icon={<UserOutlined />} />
          <div>
            <Text strong>{record.name}</Text>
            <br />
            <Text type="secondary">{record.company || t('common.personal')}</Text>
          </div>
        </Space>
      )
    },
    {
      title: t('clients.colContact'),
      key: 'contact',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Space align="center" size="small">
            <MailOutlined style={{ color: '#8c8c8c' }} />
            <Text copyable={{ text: record.email }} style={{ fontSize: 13 }}>{record.email}</Text>
          </Space>
          {record.phone && (
            <Space align="center" size="small">
              <PhoneOutlined style={{ color: '#8c8c8c' }} />
              <Text copyable={{ text: record.phone }} style={{ fontSize: 13 }}>{record.phone}</Text>
            </Space>
          )}
        </Space>
      )
    },
    {
      title: t('clients.colStatus'),
      dataIndex: 'active',
      key: 'active',
      render: (active) => (
        <Tag color={active === false ? 'red' : 'green'}>
          {active === false ? t('common.inactive') : t('common.active')}
        </Tag>
      )
    },
    {
      title: t('clients.colActivity'),
      key: 'activity',
      render: (_, record) => {
        const totalActivity = (record._count?.bookings || 0) + (record._count?.contracts || 0);
        const percent = Math.min((totalActivity / 20) * 100, 100);
        return (
          <div style={{ width: 120 }}>
            <Tooltip title={t('clients.activityTooltip', { count: totalActivity })}>
              <Progress percent={percent} showInfo={false} strokeColor="#1890ff" />
            </Tooltip>
          </div>
        );
      }
    },
    {
      title: t('clients.colCreated'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => dayjs(date).format('DD/MM/YYYY')
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
          <Popconfirm title={t('clients.confirmDelete')} onConfirm={() => handleDelete(record.id)}>
            <Tooltip title={t('common.delete')}>
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const statsCardsConfig = [
    { key: 'total', title: t('clients.totalClients'), value: stats.total, icon: <TeamOutlined />, gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', subtitle: t('clients.allRegistered') },
    { key: 'active', title: t('clients.activeClients'), value: stats.active, icon: <CheckCircleOutlined />, gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', subtitle: t('clients.currentlyActive') },
    { key: 'new', title: t('clients.newThisMonth'), value: stats.new, icon: <RiseOutlined />, gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', subtitle: t('clients.registeredLast30') },
    { key: 'inactive', title: t('clients.inactiveClients'), value: stats.inactive, icon: <StopOutlined />, gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', subtitle: t('clients.currentlyInactive') }
  ];

  return (
    <div className="page-enter" style={{ padding: '24px' }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 32 }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}><TeamOutlined style={{ marginRight: 12, color: '#4F46E5' }} />{t('clients.title')}</Title>
          <Text type="secondary" style={{ fontSize: 16 }}>{t('clients.subtitle')}</Text>
        </Col>
        <Col><Button type="primary" size="large" icon={<PlusOutlined />} onClick={handleCreate}>{t('clients.addClient')}</Button></Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
        {statsCardsConfig.map((config) => (
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
          <Col flex="auto">
            <Search
              placeholder={t('clients.searchPlaceholder')}
              size="large"
              allowClear
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              onSearch={setSearchTerm}
            />
          </Col>
          <Col>
            <Select
              placeholder={t('common.filterByStatus')}
              style={{ width: 200 }}
              size="large"
              allowClear
              value={activeFilter}
              onChange={setActiveFilter}
            >
              <Option value={true}>{t('common.active')}</Option>
              <Option value={false}>{t('common.inactive')}</Option>
            </Select>
          </Col>
        </Row>

        {error ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <TeamOutlined style={{ fontSize: 48, marginBottom: 16, color: '#ff4d4f' }} />
            <Title level={3}>{t('common.errorLoading')}</Title>
            <Text style={{ fontSize: 16, display: 'block', marginBottom: 24 }}>{error}</Text>
            <Button type="primary" onClick={fetchClients}>{t('clients.retry')}</Button>
          </div>
        ) : !loading && clients.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <TeamOutlined style={{ fontSize: 48, marginBottom: 16, color: '#4F46E5' }} />
            <Title level={3}>{t('clients.emptyTitle')}</Title>
            <Text style={{ fontSize: 16 }}>{t('clients.emptyText')}</Text>
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={filteredClients}
            rowKey="id"
            loading={loading}
            locale={{ emptyText: t('clients.emptyTitle') }}
          />
        )}
      </Card>

      <Modal
        title={editingClient ? t('clients.editClient') : t('clients.addNewClient')}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 24 }} initialValues={{ active: true }}>
          <Form.Item name="name" label={t('clients.name')} rules={[{ required: true, message: t('common.required') }]}>
            <Input />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="email" label={t('common.email')} rules={[{ required: true, type: 'email', message: t('common.required') }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label={t('common.phone')}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="company" label={t('common.company')}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="vatNumber" label={t('clients.vatNumber')}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="address" label={t('clients.address')}>
            <Input />
          </Form.Item>
          <Form.Item name="notes" label={t('common.notes')}>
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item name="active" valuePropName="checked">
            <Checkbox>{t('common.active')}</Checkbox>
          </Form.Item>
          <Row justify="end">
            <Space>
              <Button onClick={() => setModalVisible(false)}>{t('common.cancel')}</Button>
              <Button type="primary" htmlType="submit" loading={saving}>
                {editingClient ? t('common.update') : t('common.create')}
              </Button>
            </Space>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}

export default Clients;
