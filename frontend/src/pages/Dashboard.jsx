import React, { useState } from 'react'
import { Typography, Row, Col, Card, Space, Button, Avatar, Progress, message } from 'antd'
import {
  RiseOutlined,
  TeamOutlined,
  ShopOutlined,
  CalendarOutlined,
  LineChartOutlined,
  UserAddOutlined,
  DollarOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

const { Title, Text } = Typography

function Dashboard() {
  const navigate = useNavigate()

  const [stats, setStats] = useState({
    todayRevenue: 1250.50,
    todayBookings: 8,
    totalClients: 45,
    totalSpaces: 12,
    revenueGrowth: 12.5,
    occupancyRate: 78,
    newClients: 3,
    completedBookings: 6
  })

  const formatCurrency = (amount) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount || 0);
  const getGrowthColor = (growth) => growth >= 0 ? '#52c41a' : '#ff4d4f';
  const getOccupancyColor = (rate) => rate < 50 ? '#faad14' : rate < 80 ? '#1890ff' : '#52c41a';

  const cardConfigs = [
    { key: 'revenue', title: "Today's Revenue", value: stats.todayRevenue, formatter: formatCurrency, icon: <DollarOutlined />, gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', growth: stats.revenueGrowth, subtitle: `+${stats.revenueGrowth}% vs yesterday` },
    { key: 'bookings', title: "Today's Bookings", value: stats.todayBookings, icon: <CalendarOutlined />, gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', progress: (stats.completedBookings / stats.todayBookings) * 100, subtitle: `${stats.completedBookings}/${stats.todayBookings} completed` },
    { key: 'clients', title: "Total Clients", value: stats.totalClients, icon: <TeamOutlined />, gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', badge: stats.newClients, subtitle: `${stats.newClients} new this week` },
    { key: 'spaces', title: "Active Spaces", value: stats.totalSpaces, icon: <ShopOutlined />, gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', progress: stats.occupancyRate, subtitle: `${stats.occupancyRate}% occupancy rate` }
  ];

  return (
    <div className="page-enter">
      <Row justify="space-between" align="middle" style={{ marginBottom: 32 }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>Dashboard</Title>
          <Text type="secondary" style={{ fontSize: 16 }}>
            Welcome back! Here's your daily overview.
          </Text>
        </Col>
        <Col>
          <Space>
            <Button size="large" type="primary" icon={<CalendarOutlined />} onClick={() => navigate('/bookings')}>
              View Bookings
            </Button>
            <Button size="large" icon={<LineChartOutlined />} onClick={() => navigate('/reports')}>
              Analytics
            </Button>
          </Space>
        </Col>
      </Row>
      
      <Row gutter={[24, 24]}>
        {cardConfigs.map((config) => (
          <Col xs={24} sm={12} lg={6} key={config.key}>
            {/* CORREZIONE 1: 'bodyStyle' è stato sostituito con 'styles' */}
            <Card hoverable styles={{ body: { padding: 0 } }}>
                <div style={{ background: config.gradient, padding: '24px 20px 16px', position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <Avatar size={48} style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }} icon={config.icon} />
                    {config.badge && <div style={{ backgroundColor: 'rgba(255,255,255,0.9)', color: '#4F46E5', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>+{config.badge} new</div>}
                  </div>
                  <Title level={4} style={{ color: 'white', margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>{config.title}</Title>
                </div>
              <div style={{ padding: '20px' }}>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>{config.formatter ? config.formatter(config.value) : config.value}</div>
                  <Text type="secondary" style={{ fontSize: 14 }}>{config.subtitle}</Text>
                </div>
                {config.growth !== undefined && (<div style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', backgroundColor: '#f6ffed', borderRadius: 8, border: '1px solid #d9f7be' }}><RiseOutlined style={{ color: getGrowthColor(config.growth), marginRight: 6 }} /><Text style={{ color: getGrowthColor(config.growth), fontSize: 13, fontWeight: 600 }}>{config.growth >= 0 ? '+' : ''}{config.growth}% growth</Text></div>)}
                {config.progress !== undefined && (<div style={{ marginTop: 12 }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}><Text style={{ fontSize: 13, fontWeight: 500 }}>{config.key === 'spaces' ? 'Occupancy' : 'Completion'}</Text><Text style={{ fontSize: 13, fontWeight: 600, color: config.key === 'spaces' ? getOccupancyColor(config.progress) : '#4F46E5' }}>{Math.round(config.progress)}%</Text></div>
                {/* CORREZIONE 2: 'strokeWidth={6}' è stato sostituito con 'size={[0, 6]}' */}
                <Progress percent={config.progress} strokeColor={config.key === 'spaces' ? getOccupancyColor(config.progress) : '#4F46E5'} showInfo={false} size={[0, 6]} />
                </div>)}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row style={{ marginTop: 32 }}>
        <Col span={24}>
          <Card>
            <Title level={4} style={{ marginBottom: 20 }}>Quick Actions</Title>
            <Space size="large">
              <Button type="primary" size="large" icon={<CalendarOutlined />} onClick={() => navigate('/bookings')}>
                New Booking
              </Button>
              <Button size="large" icon={<UserAddOutlined />} onClick={() => navigate('/clients')}>
                Add Client
              </Button>
              <Button size="large" icon={<ShopOutlined />} onClick={() => navigate('/spaces')}>
                Manage Spaces
              </Button>
              <Button size="large" icon={<LineChartOutlined />} onClick={() => navigate('/reports')}>
                View Reports
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard

