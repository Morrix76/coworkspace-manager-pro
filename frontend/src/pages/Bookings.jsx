import React, { useState, useEffect, useMemo } from 'react'
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
  Avatar
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

dayjs.extend(isBetween)
dayjs.locale('en')

const { Title, Text } = Typography
const { Option } = Select

// --- MOCK DATA & API CONFIG ---
const mockClients = [
  { id: 1, name: 'Innovate Corp', email: 'contact@innovate.com' },
  { id: 2, name: 'Quantum Solutions', email: 'hello@quantum.dev' },
  { id: 3, name: 'Synergy Labs', email: 'info@synergylabs.io' }
]

const mockSpaces = [
  { id: 1, name: 'Executive Suite', type: 'OFFICE', hourlyRate: 45 },
  { id: 2, name: 'The Think Tank', type: 'MEETING_ROOM', hourlyRate: 60 },
  { id: 3, name: 'Collaboration Hub', type: 'COWORKING', hourlyRate: 25 },
  { id: 4, name: 'Focus Pod Alpha', type: 'OFFICE', hourlyRate: 30 },
]

const mockBookings = [
  { id: 1, clientId: 1, spaceId: 1, startTime: dayjs().add(1, 'day').hour(9).minute(0).toISOString(), endTime: dayjs().add(1, 'day').hour(17).minute(0).toISOString(), status: 'CONFIRMED', notes: 'Full-day strategy session.' },
  { id: 2, clientId: 2, spaceId: 2, startTime: dayjs().hour(14).minute(0).toISOString(), endTime: dayjs().hour(16).minute(0).toISOString(), status: 'PENDING', notes: 'Client presentation rehearsal.' },
  { id: 3, clientId: 3, spaceId: 3, startTime: dayjs().subtract(1, 'day').hour(10).minute(0).toISOString(), endTime: dayjs().subtract(1, 'day').hour(13).minute(0).toISOString(), status: 'COMPLETED', notes: 'Team collaboration.' },
  { id: 4, clientId: 1, spaceId: 4, startTime: dayjs().hour(10).minute(0).toISOString(), endTime: dayjs().hour(12).minute(0).toISOString(), status: 'CONFIRMED', notes: 'Interview.' }
]

// --- UTILITY FUNCTIONS ---
const STATUS_CONFIG = {
  PENDING: { label: 'Pending', color: 'gold', icon: <ClockCircleOutlined /> },
  CONFIRMED: { label: 'Confirmed', color: 'blue', icon: <CheckCircleOutlined /> },
  COMPLETED: { label: 'Completed', color: 'green', icon: <CheckCircleOutlined /> },
  CANCELLED: { label: 'Cancelled', color: 'red', icon: <CloseCircleOutlined /> }
}

const getStatusDetails = (status) => STATUS_CONFIG[status] || { label: status, color: 'default' }

// --- DATA HOOK ---
const useBookingData = () => {
  const [bookings, setBookings] = useState([])
  const [clients, setClients] = useState([])
  const [spaces, setSpaces] = useState([])
  const [loading, setLoading] = useState(true)

  const enrichBookings = (bookingsData, clientsData, spacesData) => {
    return bookingsData.map(booking => {
      const client = clientsData.find(c => c.id === booking.clientId)
      const space = spacesData.find(s => s.id === booking.spaceId)
      const duration = dayjs(booking.endTime).diff(dayjs(booking.startTime), 'hour', true)
      const totalAmount = space ? duration * space.hourlyRate : 0
      return { ...booking, clientName: client?.name || 'Unknown Client', spaceName: space?.name || 'Unknown Space', totalAmount }
    })
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const enriched = enrichBookings(mockBookings, mockClients, mockSpaces)
        setBookings(enriched)
        setClients(mockClients)
        setSpaces(mockSpaces)
      } catch (error) {
        message.error('Error loading data. Using fallback mock data.')
        const enriched = enrichBookings(mockBookings, mockClients, mockSpaces)
        setBookings(enriched)
        setClients(mockClients)
        setSpaces(mockSpaces)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const updateBooking = (updatedBooking) => {
    setBookings(prev => prev.map(b => b.id === updatedBooking.id ? updatedBooking : b))
  }

  const addBooking = (newBooking) => {
    const enrichedNewBooking = enrichBookings([newBooking], clients, spaces)[0]
    setBookings(prev => [...prev, { ...enrichedNewBooking, id: Date.now() }])
  }

  return { bookings, clients, spaces, loading, updateBooking, addBooking }
}

// --- UI COMPONENTS ---
const BookingStats = ({ bookings }) => {
  const todayBookings = useMemo(() => bookings.filter(b => dayjs(b.startTime).isSame(dayjs(), 'day')), [bookings])
  const pendingBookings = useMemo(() => bookings.filter(b => b.status === 'PENDING'), [bookings])
  const todayRevenue = useMemo(() => todayBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0), [todayBookings])

  const statsCardsConfig = [
    { key: 'today', title: "Today's Bookings", value: todayBookings.length, icon: <CalendarOutlined />, gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', subtitle: 'Scheduled for today' },
    { key: 'pending', title: "Pending Confirmation", value: pendingBookings.length, icon: <ClockCircleOutlined />, gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', subtitle: 'Awaiting your approval' },
    { key: 'revenue', title: "Today's Estimated Revenue", value: `$${todayRevenue.toFixed(2)}`, icon: <DollarCircleOutlined />, gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', subtitle: 'Based on confirmed bookings' }
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

const BookingModal = ({ open, onCancel, onFinish, booking, clients, spaces }) => {
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
          status: booking.status,
          notes: booking.notes
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
           status: 'PENDING'
        });
      }
    }
  }, [open, booking, isEditing, form]);

  const handleFinish = (values) => {
    console.log('Form values:', values);
    if (!values.date || !values.timeRange || !values.clientId || !values.spaceId) {
      message.error('Please fill all required fields');
      return;
    }
    const startTime = values.date
      .hour(values.timeRange[0].hour())
      .minute(values.timeRange[0].minute())
      .second(0);
    const endTime = values.date
      .hour(values.timeRange[1].hour())
        .minute(values.timeRange[1].minute())
      .second(0);
    const bookingData = {
      clientId: values.clientId,
      spaceId: values.spaceId,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      status: values.status || 'PENDING',
      notes: values.notes || ''
    };
    onFinish(bookingData, booking?.id);
  };

  return (
    <Modal
       open={open}
      title={isEditing ? 'Edit Booking' : 'Create New Booking'}
      onCancel={onCancel}
      footer={null}
      width={600}
      destroyOnHidden // Corretto da destroyOnClose
    >
      <Form
         form={form}
         layout="vertical"
         onFinish={handleFinish}
        preserve={false}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
               name="clientId"
               label="Client"
               rules={[{ required: true, message: 'Please select a client' }]}
            >
              <Select
                 placeholder="Select a client"
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
               label="Workspace"
               rules={[{ required: true, message: 'Please select a workspace' }]}
            >
              <Select
                 placeholder="Select a workspace"
                allowClear
              >
                {spaces && spaces.map(space => (
                  <Option key={space.id} value={space.id}>
                    {space.name} (${space.hourlyRate}/hr)
                  </Option> // <-- ERRORE DI BATTITURA CORRETTO
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
               name="date"
               label="Date"
               rules={[{ required: true, message: 'Please select a date' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
               name="timeRange"
               label="Time"
               rules={[{ required: true, message: 'Please select time range' }]}
            >
              <TimePicker.RangePicker
                 format="HH:mm"
                 style={{ width: '100%' }}
                 minuteStep={15}
              />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item
           name="status"
           label="Status"
          rules={[{ required: true, message: 'Please select a status' }]}
        >
          <Select>
            {Object.entries(STATUS_CONFIG).map(([key, { label }]) => (
              <Option key={key} value={key}>{label}</Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="notes" label="Notes">
          <Input.TextArea
             rows={3}
             placeholder="Add any relevant notes..."
             maxLength={500}
          />
        </Form.Item>
        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
          <Space>
            <Button onClick={onCancel}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              {isEditing ? 'Update Booking' : 'Create Booking'}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

const BookingCalendarView = ({ bookings }) => {
    const cellRender = (current) => {
        const dayBookings = bookings.filter(b => dayjs(b.startTime).isSame(current, 'day'));
        const popoverContent = (
            <div style={{ maxWidth: 300 }}>
                <Space direction="vertical">
                    {dayBookings.map(item => (
                        <div key={item.id}>
                           <Tag color={getStatusDetails(item.status).color}>{dayjs(item.startTime).format('HH:mm')} - {dayjs(item.endTime).format('HH:mm')}</Tag>
                           <br/>
                           <Text strong>{item.spaceName}</Text> - <Text>{item.clientName}</Text>
                        </div>
                    ))}
                </Space>
            </div>
        );
        if (dayBookings.length > 0) {
            return (
                <Popover content={popoverContent} title={`Bookings for ${current.format('MMMM D')}`} trigger="hover">
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                        {dayBookings.map(item => (<li key={item.id}><Badge status={getStatusDetails(item.status).color} text={`${item.spaceName.substring(0, 15)}...`} /></li>))}
                    </ul>
                </Popover>
            );
        }
        return null;
    };
    return <Calendar cellRender={cellRender} />;
};

const BookingsListView = ({ bookings, loading, onEdit, onStatusChange }) => {
  const columns = [
    { title: 'Client & Space', dataIndex: 'clientName', key: 'client', sorter: (a, b) => a.clientName.localeCompare(b.clientName), render: (text, record) => (<div><Text strong><UserOutlined style={{ marginRight: 8 }}/>{record.clientName}</Text><br/><Text type="secondary">{record.spaceName}</Text></div>) },
    { title: 'Date & Time', key: 'datetime', sorter: (a, b) => dayjs(a.startTime).unix() - dayjs(b.startTime).unix(), render: (_, record) => (<div><Text>{dayjs(record.startTime).format('ddd, MMM D, YYYY')}</Text><br/><Text type="secondary">{dayjs(record.startTime).format('HH:mm')} - {dayjs(record.endTime).format('HH:mm')}</Text></div>) },
    { title: 'Status', dataIndex: 'status', key: 'status', filters: Object.entries(STATUS_CONFIG).map(([key, { label }]) => ({ text: label, value: key })), onFilter: (value, record) => record.status === value, render: (status) => { const { label, color, icon } = getStatusDetails(status); return <Tag icon={icon} color={color}>{label}</Tag> } },
    { title: 'Amount', dataIndex: 'totalAmount', key: 'amount', sorter: (a, b) => a.totalAmount - b.totalAmount, render: (amount) => `$${(amount || 0).toFixed(2)}` },
    {
      title: 'Action',
      key: 'action',
      align: 'right',
      render: (_, record) => {
        const menuItems = {
          items: [
            { key: 'edit', label: 'Edit', onClick: () => onEdit(record) },
            {
              key: 'status',
              label: 'Change Status',
              children: Object.entries(STATUS_CONFIG).map(([key, { label }]) => ({
                key: key,
                label: label,
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
  return <Table columns={columns} dataSource={bookings} loading={loading} rowKey="id" pagination={{ pageSize: 8, showSizeChanger: false }} scroll={{ x: 800 }} />;
};

// --- MAIN COMPONENT ---
function Bookings() {
  const { bookings, clients, spaces, loading, updateBooking, addBooking } = useBookingData()
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingBooking, setEditingBooking] = useState(null)
  const [viewMode, setViewMode] = useState('list')

  const handleEdit = (booking) => { setEditingBooking(booking); setIsModalVisible(true); }
  const handleAdd = () => { setEditingBooking(null); setIsModalVisible(true); }

  const handleModalFinish = (bookingData, bookingId) => {
    try {
      if (bookingId) {
        const existingBooking = bookings.find(b => b.id === bookingId);
        updateBooking({ ...existingBooking, ...bookingData });
        message.success('Booking updated successfully!');
      } else {
        addBooking(bookingData);
        message.success('Booking created successfully!');
      }
      setIsModalVisible(false);
    } catch (error) { message.error('Failed to save booking.'); }
  }
  
  const handleStatusChange = (booking, newStatus) => {
     updateBooking({ ...booking, status: newStatus });
     message.success(`Booking status changed to ${STATUS_CONFIG[newStatus].label}`);
  }

  return (
    <div className="page-enter" style={{ padding: '24px' }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 32 }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            <CalendarOutlined style={{ marginRight: 12, color: '#4F46E5' }} />
            Workspace Bookings
          </Title>
          <Text type="secondary" style={{ fontSize: 16 }}>
            Manage, view, and schedule all your bookings.
          </Text>
        </Col>
        <Col>
          <Space size="middle">
             <Radio.Group value={viewMode} onChange={(e) => setViewMode(e.target.value)} optionType="button" buttonStyle="solid">
                <Radio.Button value="list"><BarsOutlined /> List</Radio.Button>
                <Radio.Button value="calendar"><CalendarOutlined /> Calendar</Radio.Button>
            </Radio.Group>
            <Button type="primary" size="large" icon={<PlusOutlined />} onClick={handleAdd}>
              New Booking
            </Button>
          </Space>
        </Col>
      </Row>

      <BookingStats bookings={bookings} />

      <Card style={{ borderRadius: 16, border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        {viewMode === 'list' ? (
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
        onCancel={() => setIsModalVisible(false)}
        onFinish={handleModalFinish}
        booking={editingBooking}
        clients={clients}
        spaces={spaces}
      />
    </div>
  )
}

export default Bookings;

