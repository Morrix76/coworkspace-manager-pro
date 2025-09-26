import React, { useState } from 'react'
import {
  Typography,
  Card,
  Row,
  Col,
  Select,
  DatePicker,
  Button,
  Space,
  Statistic,
  Table,
  Progress,
  Divider,
  message, // Aggiunto message
  Avatar // Aggiunto Avatar
} from 'antd'
import {
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  DownloadOutlined,
  CalendarOutlined,
  DollarCircleOutlined, // Cambiato da EuroCircleOutlined
  UserOutlined,
  HomeOutlined,
  RiseOutlined, // Aggiunta icona
  TeamOutlined // Aggiunta icona
} from '@ant-design/icons'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import dayjs from 'dayjs'

const { Title, Text } = Typography // Aggiunto Text
const { RangePicker } = DatePicker
const { Option } = Select

// --- MOCK DATA (invariato) ---
const revenueData = [
    { name: 'Jan', revenue: 8500, bookings: 45, clients: 12 }, { name: 'Feb', revenue: 9200, bookings: 52, clients: 15 }, { name: 'Mar', revenue: 7800, bookings: 38, clients: 10 }, { name: 'Apr', revenue: 10500, bookings: 58, clients: 18 }, { name: 'May', revenue: 11200, bookings: 65, clients: 22 }, { name: 'Jun', revenue: 9800, bookings: 48, clients: 16 }
];
const spaceUtilizationData = [
    { name: 'Offices', value: 85, count: 12 }, { name: 'Meeting Rooms', value: 68, count: 8 }, { name: 'Coworking', value: 92, count: 5 }, { name: 'Event Spaces', value: 45, count: 3 }
];
const clientSegmentData = [
    { name: 'VIP', value: 35, color: '#ff4d4f' }, { name: 'Business', value: 45, color: '#faad14' }, { name: 'Casual', value: 20, color: '#52c41a' }
];
const topClientsData = [
    { name: 'Innovate Corp', revenue: 2400, bookings: 12, rank: 1 }, { name: 'Quantum Solutions', revenue: 1800, bookings: 9, rank: 2 }, { name: 'Synergy Labs', revenue: 1600, bookings: 8, rank: 3 }, { name: 'Alpha Group', revenue: 1400, bookings: 7, rank: 4 }, { name: 'Beta Industries', revenue: 1200, bookings: 6, rank: 5 }
];
const monthlyStats = {
    totalRevenue: 57000, totalBookings: 316, averageBookingValue: 180.38, occupancyRate: 78, newClients: 93
};

function Reports() {
  const [dateRange, setDateRange] = useState([dayjs().subtract(30, 'days'), dayjs()])
  const [reportType, setReportType] = useState('overview')
  const [loading, setLoading] = useState(false)

  const handleExport = (format) => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      message.success(`Report exported in ${format.toUpperCase()} format`)
    }, 1000)
  }

  // Colonne tabella (invariato)
  const topClientsColumns = [
    { title: 'Rank', dataIndex: 'rank', key: 'rank', width: 60, render: (rank) => (<div style={{ width: 24, height: 24, borderRadius: '50%', background: rank <= 3 ? '#faad14' : '#f0f0f0', color: rank <= 3 ? 'white' : '#666', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>{rank}</div>) },
    { title: 'Client', dataIndex: 'name', key: 'name' },
    { title: 'Revenue', dataIndex: 'revenue', key: 'revenue', render: (revenue) => `$${revenue.toFixed(2)}` },
    { title: 'Bookings', dataIndex: 'bookings', key: 'bookings' }
  ];

  // --- CARD STATISTICHE (KPI) ---
  const statsCardsConfig = [
    { key: 'revenue', title: "Total Revenue", value: `$${(monthlyStats.totalRevenue / 1000).toFixed(1)}k`, icon: <DollarCircleOutlined />, gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', subtitle: 'In the selected period' },
    { key: 'bookings', title: "Total Bookings", value: monthlyStats.totalBookings, icon: <CalendarOutlined />, gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', subtitle: 'Completed reservations' },
    { key: 'occupancy', title: "Occupancy Rate", value: `${monthlyStats.occupancyRate}%`, icon: <HomeOutlined />, gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', subtitle: 'Average space utilization' },
    { key: 'clients', title: "New Clients", value: monthlyStats.newClients, icon: <TeamOutlined />, gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', subtitle: 'First-time customers' }
  ];

  const cardStyle = { borderRadius: 16, border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' };

  return (
    <div style={{ padding: '24px' }}>
      {/* HEADER */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 32 }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            <BarChartOutlined style={{ marginRight: 12, color: '#1890ff' }} />
            Reports & Analytics
          </Title>
          <Text type="secondary" style={{ fontSize: 16 }}>
            Visualize your business performance and key metrics.
          </Text>
        </Col>
        <Col>
          <Space size="middle">
            <Select value={reportType} onChange={setReportType} style={{ width: 150 }} size="large">
              <Option value="overview">Overview</Option>
              <Option value="financial">Financial</Option>
              <Option value="occupancy">Occupancy</Option>
              <Option value="clients">Clients</Option>
            </Select>
            <RangePicker size="large" value={dateRange} onChange={setDateRange} />
            <Button size="large" type="primary" icon={<DownloadOutlined />} onClick={() => handleExport('pdf')} loading={loading}>
              Export
            </Button>
          </Space>
        </Col>
      </Row>

      {/* KPI CARDS */}
      <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
        {statsCardsConfig.map(config => (
          <Col xs={24} sm={12} lg={6} key={config.key}>
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

      {/* GRAFICI PRINCIPALI */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col span={16}>
          <Card title="Revenue Trend" extra={<LineChartOutlined />} style={cardStyle}>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}><defs><linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1890ff" stopOpacity={0.8}/><stop offset="95%" stopColor="#1890ff" stopOpacity={0}/></linearGradient></defs><XAxis dataKey="name" /><YAxis /><CartesianGrid strokeDasharray="3 3" /><Tooltip formatter={(value) => [`$${value}`, 'Revenue']} /><Area type="monotone" dataKey="revenue" stroke="#1890ff" fillOpacity={1} fill="url(#colorRevenue)" /></AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Client Segmentation" extra={<PieChartOutlined />} style={cardStyle}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart><Pie data={clientSegmentData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">{clientSegmentData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}</Pie><Tooltip formatter={(value) => [`${value}%`, 'Percentage']} /><Legend /></PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        {/* TABELLE E DETTAGLI */}
        <Col span={12}>
          <Card title="Top 5 Clients" extra={<UserOutlined />} style={cardStyle}>
            <Table columns={topClientsColumns} dataSource={topClientsData} pagination={false} size="small" rowKey="rank" />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Space Performance" style={cardStyle}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {spaceUtilizationData.map((space, index) => (
                <div key={index}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text>{space.name}</Text>
                    <Text strong>{space.value}%</Text>
                  </div>
                  <Progress percent={space.value} showInfo={false} strokeColor={space.value > 80 ? '#52c41a' : space.value > 60 ? '#faad14' : '#ff4d4f'}/>
                </div>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Reports