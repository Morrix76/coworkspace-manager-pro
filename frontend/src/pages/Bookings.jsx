import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Typography,
  Card,
  Calendar,
  Button,
  Table,
  Tag,
  Space,
  Row,
  Col,
  Modal,
  Form,
  Select,
  DatePicker,
  TimePicker,
  Input,
  message,
  Badge,
  Popover,
  Dropdown,
  Radio,
  Avatar,
  Spin
} from 'antd'
import {
  PlusOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EllipsisOutlined,
  DollarCircleOutlined,
  BarsOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import 'dayjs/locale/en'
import isBetween from 'dayjs/plugin/isBetween'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { handleDemoRestriction, isDemoRestriction } from '../utils/demoError'

dayjs.extend(isBetween)
dayjs.locale('en')

const { Title, Text } = Typography
const { Option } = Select

const API_URL = import.meta.env.VITE_API_URL

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`
})

const isConflictError = (error) => {
  if (error?.response?.status !== 400) return false
  const payload = error.response.data || {}
  if (payload.conflictingBooking) return true
  const text = String(payload.error || payload.message || '')
  return /non disponibile|already booked|not available/i.test(text)
}

const STATUS_CONFIG = {
  CONFIRMED: { color: 'blue', icon: <CheckCircleOutlined /> },
  CHECKED_IN: { color: 'gold', icon: <ClockCircleOutlined /> },
  CHECKED_OUT: { color: 'green', icon: <CheckCircleOutlined /> },
  CANCELLED: { color: 'red', icon: <CloseCircleOutlined /> }
}

const getStatusDetails = (status, t) => {
  const config = STATUS_CONFIG[status] || { color: 'default' }
  return { ...config, label: t(`enums.bookingStatus.${status}`, { defaultValue: status }) }
}

const normalizeBooking = (booking, t) => ({
  ...booking,
  startTime: booking.startDateTime || booking.startTime,
  endTime: booking.endDateTime || booking.endTime,
  clientName: booking.client?.name || booking.clientName || t('bookings.unknownClient'),
  spaceName: booking.space?.name || booking.spaceName || t('bookings.unknownSpace'),
  totalAmount: booking.totalAmount || 0
})

const useBookingData = () => {
  const { t } = useTranslation()
  const [bookings, setBookings] = useState([])
  const [clients, setClients] = useState([])
  const [spaces, setSpaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [bookingsRes, spacesRes, clientsRes] = await Promise.all([
        axios.get(`${API_URL}/bookings`, { params: { limit: 1000 }, headers: authHeaders() }),
        axios.get(`${API_URL}/spaces`, { headers: authHeaders() }),
        axios.get(`${API_URL}/clients`, { params: { limit: 1000 }, headers: authHeaders() })
      ])

      const bookingRows = Array.isArray(bookingsRes.data?.data)
        ? bookingsRes.data.data
        : Array.isArray(bookingsRes.data) ? bookingsRes.data : []
      const spaceRows = Array.isArray(spacesRes.data) ? spacesRes.data : []
      const clientRows = Array.isArray(clientsRes.data?.clients)
        ? clientsRes.data.clients
        : Array.isArray(clientsRes.data) ? clientsRes.data : []

      setBookings(bookingRows.map((booking) => normalizeBooking(booking, t)))
      setSpaces(spaceRows)
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
    reload()
  }, [reload])

  return { bookings, clients, spaces, loading, error, reload }
}

const BookingStats = ({ bookings }) => {
  const { t, i18n } = useTranslation()
  const formatCurrency = (amount) => new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'EUR' }).format(amount || 0)
  const todayBookings = useMemo(() => bookings.filter(b => b.status !== 'CANCELLED' && dayjs(b.startTime).isSame(dayjs(), 'day')), [bookings])
  const confirmedBookings = useMemo(() => bookings.filter(b => b.status === 'CONFIRMED'), [bookings])
  const todayRevenue = useMemo(() => todayBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0), [todayBookings])

  const statsCardsConfig = [
    { key: 'today', title: t('bookings.todayBookings'), value: todayBookings.length, icon: <CalendarOutlined />, gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', subtitle: t('bookings.scheduledToday') },
    { key: 'pending', title: t('bookings.pendingConfirmation'), value: confirmedBookings.length, icon: <ClockCircleOutlined />, gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', subtitle: t('bookings.awaitingApproval') },
    { key: 'revenue', title: t('bookings.todayRevenue'), value: formatCurrency(todayRevenue), icon: <DollarCircleOutlined />, gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', subtitle: t('bookings.basedOnConfirmed') }
  ];

  return (
    <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
      {statsCardsConfig.map(config => (
        <Col xs={24} sm={12} md={8} key={config.key}>
          <Card hoverable styles={{ body: { padding: 0 } }}>
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
  );
};

const BookingModal = ({ open, onCancel, onFinish, booking, clients, spaces, saving }) => {
  const { t, i18n } = useTranslation()
  const formatCurrency = (amount) => new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'EUR' }).format(amount || 0)
  const [form] = Form.useForm();
  const isEditing = !!booking;
  useEffect(() => {
    if (open && form) {
      if (isEditing && booking) {
        form.setFieldsValue({
          clientId: booking.clientId,
          spaceId: booking.spaceId,
          date: dayjs(booking.startTime),
          timeRange: [dayjs(booking.startTime), dayjs(booking.endTime)],
          notes: booking.notes
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, booking, isEditing, form]);

  const handleFinish = (values) => {
    if (!values.date || !values.timeRange || !values.clientId || !values.spaceId) {
      message.error(t('bookings.fillRequired'));
      return;
    }
    const startDateTime = values.date
      .hour(values.timeRange[0].hour())
      .minute(values.timeRange[0].minute())
      .second(0)
      .millisecond(0);
    const endDateTime = values.date
      .hour(values.timeRange[1].hour())
      .minute(values.timeRange[1].minute())
      .second(0)
      .millisecond(0);
    onFinish({
      clientId: values.clientId,
      spaceId: values.spaceId,
      startDateTime: startDateTime.toISOString(),
      endDateTime: endDateTime.toISOString(),
      notes: values.notes || ''
    }, booking?.id);
  };

  return (
    <Modal
       open={open}
      title={isEditing ? t('bookings.editBooking') : t('bookings.createBooking')}
      onCancel={onCancel}
      footer={null}
      width={600}
      destroyOnHidden
      maskClosable={!saving}
    >
      <Form
         form={form}
         layout="vertical"
         onFinish={handleFinish}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
               name="clientId"
               label={t('common.client')}
               rules={[{ required: true, message: t('bookings.selectClientRequired') }]}
            >
              <Select
                 placeholder={t('bookings.selectClient')}
                showSearch
                allowClear
                optionFilterProp="children"
              >
                {clients && clients.map(client => (
                  <Option key={client.id} value={client.id}>
                    {client.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
               name="spaceId"
               label={t('bookings.workspace')}
               rules={[{ required: true, message: t('bookings.selectWorkspaceRequired') }]}
            >
              <Select
                 placeholder={t('bookings.selectWorkspace')}
                allowClear
              >
                {spaces && spaces.map(space => (
                  <Option key={space.id} value={space.id}>
                    {t('bookings.hourlyRate', { name: space.name, rate: formatCurrency(space.hourlyRate) })}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
               name="date"
               label={t('common.date')}
               rules={[{ required: true, message: t('bookings.selectDateRequired') }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
               name="timeRange"
               label={t('bookings.time')}
               rules={[{ required: true, message: t('bookings.selectTimeRequired') }]}
            >
              <TimePicker.RangePicker
                 format="HH:mm"
                 style={{ width: '100%' }}
                 minuteStep={15}
              />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="notes" label={t('common.notes')}>
          <Input.TextArea
             rows={3}
             placeholder={t('bookings.notesPlaceholder')}
             maxLength={500}
          />
        </Form.Item>
        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
          <Space>
            <Button onClick={onCancel} disabled={saving}>
              {t('common.cancel')}
            </Button>
            <Button type="primary" htmlType="submit" loading={saving}>
              {isEditing ? t('bookings.updateBooking') : t('bookings.createBookingBtn')}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

const BookingCalendarView = ({ bookings }) => {
    const { t } = useTranslation()
    const cellRender = (current) => {
        const dayBookings = bookings.filter(b => dayjs(b.startTime).isSame(current, 'day'));
        const popoverContent = (
            <div style={{ maxWidth: 300 }}>
                <Space direction="vertical">
                    {dayBookings.map(item => (
                        <div key={item.id}>
                           <Tag color={getStatusDetails(item.status, t).color}>{dayjs(item.startTime).format('HH:mm')} - {dayjs(item.endTime).format('HH:mm')}</Tag>
                           <br/>
                           <Text strong>{item.spaceName}</Text> - <Text>{item.clientName}</Text>
                        </div>
                    ))}
                </Space>
            </div>
        );
        if (dayBookings.length > 0) {
            return (
                <Popover content={popoverContent} title={t('bookings.bookingsFor', { date: current.format('MMMM D') })} trigger="hover">
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                        {dayBookings.map(item => (<li key={item.id}><Badge status={getStatusDetails(item.status, t).color} text={`${(item.spaceName || '').substring(0, 15)}...`} /></li>))}
                    </ul>
                </Popover>
            );
        }
        return null;
    };
    return <Calendar cellRender={cellRender} />;
};

const BookingsListView = ({ bookings, loading, onEdit, onStatusChange }) => {
  const { t, i18n } = useTranslation()
  const formatCurrency = (amount) => new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'EUR' }).format(amount || 0)
  const columns = [
    { title: t('bookings.colClientSpace'), dataIndex: 'clientName', key: 'client', sorter: (a, b) => a.clientName.localeCompare(b.clientName), render: (text, record) => (<div><Text strong><UserOutlined style={{ marginRight: 8 }}/>{record.clientName}</Text><br/><Text type="secondary">{record.spaceName}</Text></div>) },
    { title: t('bookings.colDateTime'), key: 'datetime', sorter: (a, b) => dayjs(a.startTime).unix() - dayjs(b.startTime).unix(), render: (_, record) => (<div><Text>{dayjs(record.startTime).format('ddd, MMM D, YYYY')}</Text><br/><Text type="secondary">{dayjs(record.startTime).format('HH:mm')} - {dayjs(record.endTime).format('HH:mm')}</Text></div>) },
    { title: t('common.status'), dataIndex: 'status', key: 'status', filters: Object.keys(STATUS_CONFIG).map((key) => ({ text: t(`enums.bookingStatus.${key}`), value: key })), onFilter: (value, record) => record.status === value, render: (status) => { const { label, color, icon } = getStatusDetails(status, t); return <Tag icon={icon} color={color}>{label}</Tag> } },
    { title: t('bookings.colAmount'), dataIndex: 'totalAmount', key: 'amount', sorter: (a, b) => a.totalAmount - b.totalAmount, render: (amount) => formatCurrency(amount) },
    {
      title: t('common.actions'),
      key: 'action',
      align: 'right',
      render: (_, record) => {
        const menuItems = {
          items: [
            { key: 'edit', label: t('common.edit'), onClick: () => onEdit(record) },
            {
              key: 'status',
              label: t('bookings.changeStatus'),
              children: Object.keys(STATUS_CONFIG).map((key) => ({
                key: key,
                label: t(`enums.bookingStatus.${key}`),
                onClick: () => onStatusChange(record, key),
                disabled: record.status === key
              }))
            }
          ]
        };
        return (
          <Dropdown menu={menuItems} trigger={['click']}>
            <Button type="text" icon={<EllipsisOutlined style={{ fontSize: 20 }} />} />
          </Dropdown>
        );
      }
    }
  ];
  return <Table columns={columns} dataSource={bookings} loading={loading} rowKey="id" pagination={{ pageSize: 8, showSizeChanger: false }} scroll={{ x: 800 }} locale={{ emptyText: t('bookings.emptyTitle') }} />;
};

function Bookings() {
  const { t } = useTranslation()
  const { bookings, clients, spaces, loading, error, reload } = useBookingData()
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingBooking, setEditingBooking] = useState(null)
  const [viewMode, setViewMode] = useState('list')
  const [saving, setSaving] = useState(false)

  const handleEdit = (booking) => { setEditingBooking(booking); setIsModalVisible(true); }
  const handleAdd = () => { setEditingBooking(null); setIsModalVisible(true); }

  const handleModalFinish = async (bookingData, bookingId) => {
    setSaving(true)
    try {
      if (bookingId) {
        await axios.put(`${API_URL}/bookings/${bookingId}`, bookingData, {
          headers: authHeaders()
        })
        message.success(t('bookings.updated'))
      } else {
        await axios.post(`${API_URL}/bookings`, bookingData, {
          headers: authHeaders()
        })
        message.success(t('bookings.created'))
      }
      setIsModalVisible(false)
      setEditingBooking(null)
      await reload()
    } catch (err) {
      if (isDemoRestriction(err) || handleDemoRestriction(err)) return
      if (isConflictError(err)) {
        message.error(t('bookings.conflict'))
        return
      }
      message.error(err.response?.data?.error || err.response?.data?.message || t('bookings.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (booking, newStatus) => {
    try {
      if (newStatus === 'CHECKED_IN') {
        await axios.patch(`${API_URL}/bookings/${booking.id}/checkin`, {}, { headers: authHeaders() })
      } else if (newStatus === 'CHECKED_OUT') {
        await axios.patch(`${API_URL}/bookings/${booking.id}/checkout`, {}, { headers: authHeaders() })
      } else if (newStatus === 'CANCELLED') {
        await axios.delete(`${API_URL}/bookings/${booking.id}`, { headers: authHeaders() })
      } else {
        message.error(t('bookings.saveFailed'))
        return
      }
      message.success(t('bookings.statusChanged', { status: t(`enums.bookingStatus.${newStatus}`) }))
      await reload()
    } catch (err) {
      if (isDemoRestriction(err) || handleDemoRestriction(err)) return
      message.error(err.response?.data?.error || err.response?.data?.message || t('bookings.saveFailed'))
    }
  }

  return (
    <div className="page-enter" style={{ padding: '24px' }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 32 }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            <CalendarOutlined style={{ marginRight: 12, color: '#4F46E5' }} />
            {t('bookings.title')}
          </Title>
          <Text type="secondary" style={{ fontSize: 16 }}>
            {t('bookings.subtitle')}
          </Text>
        </Col>
        <Col>
          <Space size="middle">
             <Radio.Group value={viewMode} onChange={(e) => setViewMode(e.target.value)} optionType="button" buttonStyle="solid">
                <Radio.Button value="list"><BarsOutlined /> {t('bookings.list')}</Radio.Button>
                <Radio.Button value="calendar"><CalendarOutlined /> {t('bookings.calendar')}</Radio.Button>
            </Radio.Group>
            <Button type="primary" size="large" icon={<PlusOutlined />} onClick={handleAdd}>
              {t('bookings.newBooking')}
            </Button>
          </Space>
        </Col>
      </Row>

      <BookingStats bookings={bookings} />

      <Card style={{ borderRadius: 16, border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        {loading && bookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px' }}>
            <Spin size="large" />
            <Text style={{ marginTop: 16, display: 'block' }}>{t('bookings.loading')}</Text>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <CalendarOutlined style={{ fontSize: 48, marginBottom: 16, color: '#ff4d4f' }} />
            <Title level={3}>{t('common.errorLoading')}</Title>
            <Text style={{ fontSize: 16, display: 'block', marginBottom: 24 }}>{error}</Text>
            <Button type="primary" onClick={reload}>{t('bookings.retry')}</Button>
          </div>
        ) : !loading && bookings.length === 0 && viewMode === 'list' ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <CalendarOutlined style={{ fontSize: 48, marginBottom: 16, color: '#4F46E5' }} />
            <Title level={3}>{t('bookings.emptyTitle')}</Title>
            <Text style={{ fontSize: 16 }}>{t('bookings.emptyText')}</Text>
          </div>
        ) : viewMode === 'list' ? (
          <BookingsListView
              bookings={bookings}
              loading={loading}
              onEdit={handleEdit}
              onStatusChange={handleStatusChange}
          />
        ) : (
          <BookingCalendarView bookings={bookings} />
        )}
      </Card>

      <BookingModal
        open={isModalVisible}
        onCancel={() => !saving && setIsModalVisible(false)}
        onFinish={handleModalFinish}
        booking={editingBooking}
        clients={clients}
        spaces={spaces}
        saving={saving}
      />
    </div>
  )
}

export default Bookings;
