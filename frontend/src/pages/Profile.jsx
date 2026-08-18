import React, { useState } from 'react'
import {
  Typography,
  Card,
  Form,
  Input,
  Button,
  Upload,
  Avatar,
  Space,
  Row,
  Col,
  Divider,
  message,
  Select,
  DatePicker,
  Switch,
  Tag,
  Statistic
} from 'antd'
import {
  UserOutlined,
  EditOutlined,
  UploadOutlined,
  SaveOutlined,
  KeyOutlined,
  MailOutlined,
  PhoneOutlined,
  CalendarOutlined,
  TeamOutlined,
  TrophyOutlined,
  ClockCircleOutlined
} from '@ant-design/icons'
import { useSelector } from 'react-redux'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'

const { Title, Text } = Typography
const { Option } = Select

function Profile() {
  const { t, i18n } = useTranslation()
  const formatCurrency = (amount) => new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'EUR' }).format(amount || 0)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()
  
  const user = useSelector(state => state.auth.user) || {
    id: 1,
    name: 'Admin User',
    email: 'admin@opuscentersrl.it',
    role: 'ADMIN',
    phone: '+39 02 1234567',
    department: 'Amministrazione',
    joinDate: '2024-01-15',
    lastLogin: dayjs().subtract(2, 'hours').toISOString(),
    avatar: null
  }

  const userStats = {
    totalBookings: 145,
    thisMonthBookings: 23,
    totalRevenue: 45600.00,
    avgSessionTime: '2h 15m'
  }

  const handleSave = async (values) => {
    setLoading(true)
    try {
      setTimeout(() => {
        message.success(t('profile.updated'))
        setEditing(false)
        setLoading(false)
      }, 1000)
    } catch (error) {
      message.error(t('profile.saveError'))
      setLoading(false)
    }
  }

  const uploadProps = {
    name: 'avatar',
    action: '/upload/avatar',
    showUploadList: false,
    beforeUpload: (file) => {
      const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png'
      if (!isJpgOrPng) {
        message.error(t('profile.uploadJpgPng'))
      }
      const isLt2M = file.size / 1024 / 1024 < 2
      if (!isLt2M) {
        message.error(t('profile.imageTooLarge'))
      }
      return isJpgOrPng && isLt2M
    },
    onChange: (info) => {
      if (info.file.status === 'done') {
        message.success(t('profile.avatarUpdated'))
      }
    }
  }

  const getRoleColor = (role) => {
    const colors = {
      ADMIN: 'red',
      MANAGER: 'orange',
      RECEPTIONIST: 'blue',
      MAINTENANCE: 'green'
    }
    return colors[role] || 'default'
  }

  return (
    <div>
      <Title level={2} style={{ marginBottom: 24 }}>
        <UserOutlined /> {t('profile.title')}
      </Title>

      <Row gutter={24}>
        <Col span={16}>
          <Card
            title={t('profile.personalInfo')}
            extra={
              <Button 
                type="primary" 
                icon={<EditOutlined />}
                onClick={() => setEditing(!editing)}
              >
                {editing ? t('common.cancel') : t('common.edit')}
              </Button>
            }
          >
            <Form
              form={form}
              layout="vertical"
              initialValues={user}
              onFinish={handleSave}
            >
              <Row gutter={24}>
                <Col span={24} style={{ textAlign: 'center', marginBottom: 24 }}>
                  <Space direction="vertical" align="center">
                    <Avatar 
                      size={100} 
                      src={user.avatar} 
                      icon={<UserOutlined />}
                    />
                    {editing && (
                      <Upload {...uploadProps}>
                        <Button icon={<UploadOutlined />} size="small">
                          {t('profile.changeAvatar')}
                        </Button>
                      </Upload>
                    )}
                    <div>
                      <Title level={3} style={{ margin: 0 }}>
                        {user.name}
                      </Title>
                      <Tag color={getRoleColor(user.role)}>
                        {t(`enums.role.${user.role}`, { defaultValue: user.role })}
                      </Tag>
                    </div>
                  </Space>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="name"
                    label={t('profile.fullName')}
                    rules={[{ required: true, message: t('profile.nameRequired') }]}
                  >
                    <Input disabled={!editing} />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="email"
                    label={t('common.email')}
                    rules={[
                      { required: true, message: t('profile.emailRequired') },
                      { type: 'email', message: t('profile.emailInvalid') }
                    ]}
                  >
                    <Input disabled={!editing} prefix={<MailOutlined />} />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item name="phone" label={t('common.phone')}>
                    <Input disabled={!editing} prefix={<PhoneOutlined />} />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item name="department" label={t('profile.department')}>
                    <Select disabled={!editing}>
                      <Option value="Amministrazione">{t('profile.deptAdmin')}</Option>
                      <Option value="Vendite">{t('profile.deptSales')}</Option>
                      <Option value="Marketing">{t('profile.deptMarketing')}</Option>
                      <Option value="Operativo">{t('profile.deptOps')}</Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item name="joinDate" label={t('profile.joinDate')}>
                    <DatePicker 
                      disabled={!editing} 
                      style={{ width: '100%' }}
                      format="DD/MM/YYYY"
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item label={t('profile.lastLogin')}>
                    <Input 
                      value={dayjs(user.lastLogin).format('DD/MM/YYYY HH:mm')} 
                      disabled 
                      prefix={<ClockCircleOutlined />}
                    />
                  </Form.Item>
                </Col>
              </Row>

              {editing && (
                <>
                  <Divider />
                  <Form.Item>
                    <Space>
                      <Button 
                        type="primary" 
                        htmlType="submit" 
                        loading={loading}
                        icon={<SaveOutlined />}
                      >
                        {t('profile.saveChanges')}
                      </Button>
                      <Button onClick={() => setEditing(false)}>
                        {t('common.cancel')}
                      </Button>
                    </Space>
                  </Form.Item>
                </>
              )}
            </Form>
          </Card>

          <Card title={t('profile.security')} style={{ marginTop: 24 }}>
            <Form layout="vertical">
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="currentPassword" label={t('settings.currentPassword')}>
                    <Input.Password />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item 
                    name="newPassword" 
                    label={t('settings.newPassword')}
                    rules={[
                      { min: 8, message: t('profile.minChars') }
                    ]}
                  >
                    <Input.Password />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item 
                    name="confirmPassword" 
                    label={t('settings.confirmPassword')}
                    dependencies={['newPassword']}
                    rules={[
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('newPassword') === value) {
                            return Promise.resolve()
                          }
                          return Promise.reject(t('profile.passwordMismatch'))
                        }
                      })
                    ]}
                  >
                    <Input.Password />
                  </Form.Item>
                </Col>
              </Row>
              <Button type="primary" icon={<KeyOutlined />}>
                {t('profile.changePassword')}
              </Button>
            </Form>
          </Card>
        </Col>

        <Col span={8}>
          <Card title={t('profile.myStats')} style={{ marginBottom: 24 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Statistic
                title={t('profile.totalBookings')}
                value={userStats.totalBookings}
                prefix={<CalendarOutlined />}
              />
              <Divider />
              <Statistic
                title={t('profile.thisMonth')}
                value={userStats.thisMonthBookings}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
              <Divider />
              <Statistic
                title={t('profile.managedRevenue')}
                value={userStats.totalRevenue}
                formatter={(value) => formatCurrency(value)}
                prefix={<TrophyOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
              <Divider />
              <Statistic
                title={t('profile.avgSession')}
                value={userStats.avgSessionTime}
                prefix={<ClockCircleOutlined />}
              />
            </Space>
          </Card>

          <Card title={t('profile.recentActivity')}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>{t('profile.activityLogin')}</Text>
                <Text type="secondary">{t('profile.hoursAgo', { count: 2 })}</Text>
              </div>
              <Divider />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>{t('profile.activityBooking')}</Text>
                <Text type="secondary">{t('profile.hoursAgo', { count: 4 })}</Text>
              </div>
              <Divider />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>{t('profile.activityClient')}</Text>
                <Text type="secondary">{t('profile.daysAgo', { count: 1 })}</Text>
              </div>
              <Divider />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>{t('profile.activityInvoice')}</Text>
                <Text type="secondary">{t('profile.daysAgo', { count: 2 })}</Text>
              </div>
              <Divider />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>{t('profile.activityReport')}</Text>
                <Text type="secondary">{t('profile.daysAgo', { count: 3 })}</Text>
              </div>
            </Space>
          </Card>

          <Card title={t('profile.preferences')} style={{ marginTop: 24 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t('profile.emailNotifications')}</Text>
                <Switch defaultChecked />
              </div>
              <Divider />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t('profile.pushNotifications')}</Text>
                <Switch />
              </div>
              <Divider />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t('profile.darkTheme')}</Text>
                <Switch />
              </div>
              <Divider />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t('profile.autoLogout')}</Text>
                <Switch defaultChecked />
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Profile
