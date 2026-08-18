import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Row,
  Col,
  DatePicker,
  Button,
  Space,
  Table,
  Progress,
  message,
  Avatar,
  Spin,
  Empty
} from 'antd'
import {
  BarChartOutlined,
  LineChartOutlined,
  DownloadOutlined,
  CalendarOutlined,
  DollarCircleOutlined,
  UserOutlined,
  HomeOutlined,
  TeamOutlined
} from '@ant-design/icons'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import dayjs from 'dayjs'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { handleDemoRestriction, isDemoRestriction } from '../utils/demoError'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

const API_URL = import.meta.env.VITE_API_URL

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`
})

const ChartEmpty = ({ description }) => (
  <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <Empty description={description} image={Empty.PRESENTED_IMAGE_SIMPLE} />
  </div>
)

function Reports() {
  const { t, i18n } = useTranslation()
  const formatCurrency = (amount) =>
    new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'EUR' }).format(amount || 0)

  const [dateRange, setDateRange] = useState([dayjs().subtract(30, 'days'), dayjs()])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState(null)
  const [overview, setOverview] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    activeClients: 0,
    totalSpaces: 0,
    occupancyRate: 0
  })
  const [revenueDaily, setRevenueDaily] = useState([])
  const [revenueByType, setRevenueByType] = useState([])
  const [occupancyDaily, setOccupancyDaily] = useState([])
  const [topClients, setTopClients] = useState([])
  const [topSpaces, setTopSpaces] = useState([])
  const [spaceTypes, setSpaceTypes] = useState([])

  const rangeParams = useMemo(() => {
    if (!dateRange?.[0] || !dateRange?.[1]) return null
    return {
      startDate: dateRange[0].startOf('day').toISOString(),
      endDate: dateRange[1].endOf('day').toISOString()
    }
  }, [dateRange])

  const loadReports = useCallback(async () => {
    if (!rangeParams) return

    setLoading(true)
    setError(null)
    try {
      const [overviewRes, revenueRes, occupancyRes, clientsRes, spacesRes] = await Promise.all([
        axios.get(`${API_URL}/reports/overview`, { params: rangeParams, headers: authHeaders() }),
        axios.get(`${API_URL}/reports/revenue`, { params: rangeParams, headers: authHeaders() }),
        axios.get(`${API_URL}/reports/occupancy`, { params: rangeParams, headers: authHeaders() }),
        axios.get(`${API_URL}/reports/clients`, { params: rangeParams, headers: authHeaders() }),
        axios.get(`${API_URL}/reports/spaces`, { params: rangeParams, headers: authHeaders() })
      ])

      setOverview({
        totalRevenue: overviewRes.data?.totalRevenue || 0,
        totalBookings: overviewRes.data?.totalBookings || 0,
        activeClients: overviewRes.data?.activeClients || 0,
        totalSpaces: overviewRes.data?.totalSpaces || 0,
        occupancyRate: overviewRes.data?.occupancyRate || 0
      })

      setRevenueDaily(Array.isArray(revenueRes.data?.daily) ? revenueRes.data.daily : [])
      const byType = revenueRes.data?.byType || {}
      setRevenueByType(
        Object.entries(byType).map(([type, revenue]) => ({
          type,
          name: t(`enums.spaceType.${type}`, { defaultValue: type }),
          revenue
        }))
      )

      setOccupancyDaily(Array.isArray(occupancyRes.data?.daily) ? occupancyRes.data.daily : [])
      setTopClients(
        (Array.isArray(clientsRes.data?.topClients) ? clientsRes.data.topClients : []).map((client, index) => ({
          ...client,
          rank: index + 1,
          revenue: client.totalRevenue,
          bookings: client.bookingsCount
        }))
      )
      setTopSpaces(Array.isArray(spacesRes.data?.topSpaces) ? spacesRes.data.topSpaces : [])
      setSpaceTypes(
        (Array.isArray(spacesRes.data?.types) ? spacesRes.data.types : []).map((item) => ({
          ...item,
          label: t(`enums.spaceType.${item.name}`, { defaultValue: item.name })
        }))
      )
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
  }, [rangeParams, t])

  useEffect(() => {
    loadReports()
  }, [loadReports])

  const handleExport = async () => {
    if (!rangeParams) return
    setExporting(true)
    try {
      const response = await axios.get(`${API_URL}/reports/export`, {
        params: { type: 'revenue', ...rangeParams },
        headers: authHeaders(),
        responseType: 'blob'
      })

      const blob = response.data
      const text = await blob.text()

      // Backend export helpers are stubs; fall back to client-side CSV from loaded data
      const csv = text && text.trim().length > 0
        ? text
        : [
            'date,revenue',
            ...revenueDaily.map((row) => `${row.date},${row.revenue}`)
          ].join('\n')

      if (!csv || csv === 'date,revenue') {
        message.warning(t('reports.exportEmpty'))
        return
      }

      const url = window.URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute(
        'download',
        `revenue_report_${dateRange[0].format('YYYY-MM-DD')}_${dateRange[1].format('YYYY-MM-DD')}.csv`
      )
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      message.success(t('reports.exported', { format: 'CSV' }))
    } catch (err) {
      if (isDemoRestriction(err) || handleDemoRestriction(err)) return
      message.error(err.response?.data?.message || err.response?.data?.error || t('common.errorLoading'))
    } finally {
      setExporting(false)
    }
  }

  const topClientsColumns = [
    {
      title: t('reports.colRank'),
      dataIndex: 'rank',
      key: 'rank',
      width: 60,
      render: (rank) => (
        <div style={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: rank <= 3 ? '#faad14' : '#f0f0f0',
          color: rank <= 3 ? 'white' : '#666',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          fontWeight: 'bold'
        }}>
          {rank}
        </div>
      )
    },
    {
      title: t('reports.colClient'),
      key: 'name',
      render: (_, record) => record.name || record.company || '—'
    },
    {
      title: t('reports.colRevenue'),
      dataIndex: 'revenue',
      key: 'revenue',
      render: (revenue) => formatCurrency(revenue)
    },
    {
      title: t('reports.colBookings'),
      dataIndex: 'bookings',
      key: 'bookings'
    }
  ]

  const maxSpaceBookings = Math.max(...topSpaces.map((s) => s.bookingsCount || 0), 1)

  const statsCardsConfig = [
    {
      key: 'revenue',
      title: t('reports.totalRevenue'),
      value: formatCurrency(overview.totalRevenue),
      icon: <DollarCircleOutlined />,
      gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
      subtitle: t('reports.inSelectedPeriod')
    },
    {
      key: 'bookings',
      title: t('reports.totalBookings'),
      value: overview.totalBookings,
      icon: <CalendarOutlined />,
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      subtitle: t('reports.completedReservations')
    },
    {
      key: 'occupancy',
      title: t('reports.occupancyRate'),
      value: `${Number(overview.occupancyRate || 0).toFixed(1)}%`,
      icon: <HomeOutlined />,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      subtitle: t('reports.avgUtilization')
    },
    {
      key: 'clients',
      title: t('reports.activeClients'),
      value: overview.activeClients,
      icon: <TeamOutlined />,
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      subtitle: t('reports.activeClientsHint')
    }
  ]

  const cardStyle = { borderRadius: 16, border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }

  return (
    <div style={{ padding: '24px' }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 32 }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            <BarChartOutlined style={{ marginRight: 12, color: '#1890ff' }} />
            {t('reports.title')}
          </Title>
          <Text type="secondary" style={{ fontSize: 16 }}>
            {t('reports.subtitle')}
          </Text>
        </Col>
        <Col>
          <Space size="middle" wrap>
            <RangePicker
              size="large"
              value={dateRange}
              onChange={(range) => {
                if (range?.[0] && range?.[1]) setDateRange(range)
              }}
              allowClear={false}
            />
            <Button
              size="large"
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleExport}
              loading={exporting}
            >
              {t('common.export')}
            </Button>
          </Space>
        </Col>
      </Row>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px' }}>
          <Spin size="large" />
          <Text style={{ marginTop: 16, display: 'block' }}>{t('reports.loading')}</Text>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '80px' }}>
          <Title level={3}>{t('common.errorLoading')}</Title>
          <Text style={{ display: 'block', marginBottom: 24 }}>{error}</Text>
          <Button type="primary" onClick={loadReports}>{t('reports.retry')}</Button>
        </div>
      ) : (
        <>
          <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
            {statsCardsConfig.map((config) => (
              <Col xs={24} sm={12} lg={6} key={config.key}>
                <Card hoverable styles={{ body: { padding: 0 } }} style={{ borderRadius: 16, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                  <div style={{ background: config.gradient, padding: '24px', borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
                    <Avatar size={48} style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }} icon={config.icon} />
                    <Title level={4} style={{ color: 'white', margin: '12px 0 0', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                      {config.title}
                    </Title>
                  </div>
                  <div style={{ padding: '20px' }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: '#262626', marginBottom: 4 }}>{config.value}</div>
                    <Text type="secondary" style={{ fontSize: 14 }}>{config.subtitle}</Text>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>

          <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
            <Col xs={24} lg={16}>
              <Card title={t('reports.revenueTrend')} extra={<LineChartOutlined />} style={cardStyle}>
                {revenueDaily.length === 0 ? (
                  <ChartEmpty description={t('reports.noChartData')} />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={revenueDaily}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1890ff" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#1890ff" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" tickFormatter={(value) => dayjs(value).format('DD/MM')} />
                      <YAxis />
                      <CartesianGrid strokeDasharray="3 3" />
                      <Tooltip
                        labelFormatter={(value) => dayjs(value).format('DD/MM/YYYY')}
                        formatter={(value) => [formatCurrency(value), t('reports.tooltipRevenue')]}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#1890ff" fillOpacity={1} fill="url(#colorRevenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title={t('reports.revenueByType')} extra={<BarChartOutlined />} style={cardStyle}>
                {revenueByType.length === 0 ? (
                  <ChartEmpty description={t('reports.noChartData')} />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={revenueByType} layout="vertical" margin={{ left: 24 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" width={100} />
                      <Tooltip formatter={(value) => [formatCurrency(value), t('reports.tooltipRevenue')]} />
                      <Bar dataKey="revenue" fill="#4F46E5" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Card>
            </Col>
          </Row>

          <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
            <Col span={24}>
              <Card title={t('reports.occupancyTrend')} extra={<HomeOutlined />} style={cardStyle}>
                {occupancyDaily.length === 0 ? (
                  <ChartEmpty description={t('reports.noChartData')} />
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={occupancyDaily}>
                      <XAxis dataKey="date" tickFormatter={(value) => dayjs(value).format('DD/MM')} />
                      <YAxis domain={[0, 100]} unit="%" />
                      <CartesianGrid strokeDasharray="3 3" />
                      <Tooltip
                        labelFormatter={(value) => dayjs(value).format('DD/MM/YYYY')}
                        formatter={(value) => [`${Number(value).toFixed(1)}%`, t('reports.occupancyRate')]}
                      />
                      <Area type="monotone" dataKey="occupancyRate" stroke="#52c41a" fill="#b7eb8f" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </Card>
            </Col>
          </Row>

          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <Card title={t('reports.topClients')} extra={<UserOutlined />} style={cardStyle}>
                {topClients.length === 0 ? (
                  <Empty description={t('reports.noTableData')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
                ) : (
                  <Table
                    columns={topClientsColumns}
                    dataSource={topClients}
                    pagination={false}
                    size="small"
                    rowKey="id"
                  />
                )}
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title={t('reports.spacePerformance')} style={cardStyle}>
                {topSpaces.length === 0 && spaceTypes.length === 0 ? (
                  <Empty description={t('reports.noTableData')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
                ) : (
                  <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    {topSpaces.map((space) => {
                      const percent = Math.round(((space.bookingsCount || 0) / maxSpaceBookings) * 100)
                      return (
                        <div key={space.id}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <Text>
                              {space.name}
                              <Text type="secondary"> · {t(`enums.spaceType.${space.type}`, { defaultValue: space.type })}</Text>
                            </Text>
                            <Text strong>
                              {space.bookingsCount} · {formatCurrency(space.revenue)}
                            </Text>
                          </div>
                          <Progress
                            percent={percent}
                            showInfo={false}
                            strokeColor={percent > 80 ? '#52c41a' : percent > 40 ? '#faad14' : '#ff4d4f'}
                          />
                        </div>
                      )
                    })}
                    {spaceTypes.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <Text type="secondary">{t('reports.bookingsByType')}</Text>
                        {spaceTypes.map((item) => (
                          <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                            <Text>{item.label}</Text>
                            <Text strong>{item.bookings}</Text>
                          </div>
                        ))}
                      </div>
                    )}
                  </Space>
                )}
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  )
}

export default Reports
