import React, { useCallback, useEffect, useState } from 'react'
import { Typography, Row, Col, Card, Space, Button, Avatar, Spin, message } from 'antd'
import {
  TeamOutlined,
  ShopOutlined,
  CalendarOutlined,
  LineChartOutlined,
  UserAddOutlined,
  DollarOutlined,
  FileTextOutlined,
  FileDoneOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import axios from 'axios'
import { handleDemoRestriction, isDemoRestriction } from '../utils/demoError'

const { Title, Text } = Typography

const API_URL = import.meta.env.VITE_API_URL

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`
})

function Dashboard() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({
    todayRevenue: 0,
    todayBookings: 0,
    totalClients: 0,
    totalSpaces: 0,
    activeContracts: 0,
    pendingInvoices: 0
  })

  const formatCurrency = (amount) =>
    new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'EUR' }).format(amount || 0)

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await axios.get(`${API_URL}/reports/dashboard`, {
        headers: authHeaders()
      })
      setStats({
        todayRevenue: data.todayRevenue || 0,
        todayBookings: data.todayBookings || 0,
        totalClients: data.totalClients || 0,
        totalSpaces: data.totalSpaces || 0,
        activeContracts: data.activeContracts || 0,
        pendingInvoices: data.pendingInvoices || 0
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
    loadDashboard()
  }, [loadDashboard])

  const cardConfigs = [
    {
      key: 'revenue',
      title: t('dashboard.todayRevenue'),
      value: formatCurrency(stats.todayRevenue),
      icon: <DollarOutlined />,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      subtitle: t('dashboard.todayRevenueHint')
    },
    {
      key: 'bookings',
      title: t('dashboard.todayBookings'),
      value: stats.todayBookings,
      icon: <CalendarOutlined />,
      gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
      subtitle: t('dashboard.todayBookingsHint')
    },
    {
      key: 'clients',
      title: t('dashboard.totalClients'),
      value: stats.totalClients,
      icon: <TeamOutlined />,
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      subtitle: t('dashboard.activeClientsHint')
    },
    {
      key: 'spaces',
      title: t('dashboard.activeSpaces'),
      value: stats.totalSpaces,
      icon: <ShopOutlined />,
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      subtitle: t('dashboard.activeSpacesHint')
    },
    {
      key: 'contracts',
      title: t('dashboard.activeContracts'),
      value: stats.activeContracts,
      icon: <FileDoneOutlined />,
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      subtitle: t('dashboard.activeContractsHint')
    },
    {
      key: 'invoices',
      title: t('dashboard.pendingInvoices'),
      value: stats.pendingInvoices,
      icon: <FileTextOutlined />,
      gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
      subtitle: t('dashboard.pendingInvoicesHint')
    }
  ]

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px' }}>
        <Spin size="large" />
        <Text style={{ marginTop: 16, display: 'block' }}>{t('dashboard.loading')}</Text>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '80px' }}>
        <Title level={3}>{t('common.errorLoading')}</Title>
        <Text style={{ display: 'block', marginBottom: 24 }}>{error}</Text>
        <Button type="primary" onClick={loadDashboard}>{t('dashboard.retry')}</Button>
      </div>
    )
  }

  return (
    <div className="page-enter">
      <Row justify="space-between" align="middle" style={{ marginBottom: 32 }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>{t('dashboard.title')}</Title>
          <Text type="secondary" style={{ fontSize: 16 }}>
            {t('dashboard.welcome')}
          </Text>
        </Col>
        <Col>
          <Space>
            <Button size="large" type="primary" icon={<CalendarOutlined />} onClick={() => navigate('/bookings')}>
              {t('dashboard.viewBookings')}
            </Button>
            <Button size="large" icon={<LineChartOutlined />} onClick={() => navigate('/reports')}>
              {t('dashboard.analytics')}
            </Button>
          </Space>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        {cardConfigs.map((config) => (
          <Col xs={24} sm={12} lg={8} key={config.key}>
            <Card hoverable styles={{ body: { padding: 0 } }}>
              <div style={{ background: config.gradient, padding: '24px 20px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Avatar size={48} style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }} icon={config.icon} />
                </div>
                <Title level={4} style={{ color: 'white', margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                  {config.title}
                </Title>
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>{config.value}</div>
                <Text type="secondary" style={{ fontSize: 14 }}>{config.subtitle}</Text>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row style={{ marginTop: 32 }}>
        <Col span={24}>
          <Card>
            <Title level={4} style={{ marginBottom: 20 }}>{t('dashboard.quickActions')}</Title>
            <Space size="large" wrap>
              <Button type="primary" size="large" icon={<CalendarOutlined />} onClick={() => navigate('/bookings')}>
                {t('dashboard.newBooking')}
              </Button>
              <Button size="large" icon={<UserAddOutlined />} onClick={() => navigate('/clients')}>
                {t('dashboard.addClient')}
              </Button>
              <Button size="large" icon={<ShopOutlined />} onClick={() => navigate('/spaces')}>
                {t('dashboard.manageSpaces')}
              </Button>
              <Button size="large" icon={<FileDoneOutlined />} onClick={() => navigate('/contracts')}>
                {t('dashboard.viewContracts')}
              </Button>
              <Button size="large" icon={<DollarOutlined />} onClick={() => navigate('/billing')}>
                {t('dashboard.viewBilling')}
              </Button>
              <Button size="large" icon={<LineChartOutlined />} onClick={() => navigate('/reports')}>
                {t('dashboard.viewReports')}
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
