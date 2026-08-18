import React, { useState } from 'react'
import {
  Typography,
  Card,
  Form,
  Input,
  Button,
  Switch,
  Select,
  InputNumber,
  Space,
  Row,
  Col,
  Divider,
  message,
  Upload,
  Avatar,
  TimePicker,
  Tabs
} from 'antd'
import {
  SettingOutlined,
  UserOutlined,
  BellOutlined,
  SecurityScanOutlined,
  GlobalOutlined,
  UploadOutlined,
  SaveOutlined,
  KeyOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'

const { Title } = Typography
const { Option } = Select
const { TextArea } = Input
const { TabPane } = Tabs

function Settings() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [generalForm] = Form.useForm()
  const [notificationForm] = Form.useForm()
  const [securityForm] = Form.useForm()

  const [settings, setSettings] = useState({
    companyName: 'Opus Center SRL',
    companyAddress: 'Via Roma 123, Milano',
    companyPhone: '+39 02 1234567',
    companyEmail: 'info@opuscentersrl.it',
    companyWebsite: 'www.opuscentersrl.it',
    timezone: 'Europe/Rome',
    currency: 'EUR',
    language: 'it',
    
    openingTime: dayjs().hour(8).minute(0),
    closingTime: dayjs().hour(20).minute(0),
    
    defaultHourlyRate: 25.00,
    defaultDailyRate: 180.00,
    defaultMonthlyRate: 3500.00,
    
    emailNotifications: true,
    smsNotifications: false,
    newBookingNotification: true,
    paymentNotification: true,
    reminderNotification: true,
    
    twoFactorAuth: false,
    sessionTimeout: 60,
    passwordExpiry: 90,
    
    autoBackup: true,
    backupFrequency: 'daily',
    maintenanceMode: false
  })

  const handleSave = async (formType, values) => {
    setLoading(true)
    try {
      setSettings({ ...settings, ...values })
      message.success(t(`settings.saved${formType}`))
    } catch (error) {
      message.error(t('settings.saveError'))
    } finally {
      setLoading(false)
    }
  }

  const uploadProps = {
    name: 'logo',
    action: '/upload',
    showUploadList: false,
    beforeUpload: (file) => {
      const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png'
      if (!isJpgOrPng) {
        message.error(t('settings.uploadJpgPng'))
      }
      const isLt2M = file.size / 1024 / 1024 < 2
      if (!isLt2M) {
        message.error(t('settings.imageTooLarge'))
      }
      return isJpgOrPng && isLt2M
    },
    onChange: (info) => {
      if (info.file.status === 'done') {
        message.success(t('settings.logoUploaded'))
      }
    }
  }

  return (
    <div>
      <Title level={2} style={{ marginBottom: 24 }}>
        <SettingOutlined /> {t('settings.title')}
      </Title>

      <Tabs defaultActiveKey="general" type="card">
        <TabPane 
          tab={
            <span>
              <GlobalOutlined />
              {t('settings.tabGeneral')}
            </span>
          } 
          key="general"
        >
          <Card>
            <Form
              form={generalForm}
              layout="vertical"
              initialValues={settings}
              onFinish={(values) => handleSave('General', values)}
            >
              <Row gutter={24}>
                <Col span={24}>
                  <Title level={4}>{t('settings.companyInfo')}</Title>
                </Col>
                
                <Col span={12}>
                  <Form.Item
                    name="companyName"
                    label={t('settings.companyName')}
                    rules={[{ required: true, message: t('settings.companyNameRequired') }]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                
                <Col span={12}>
                  <Form.Item name="companyEmail" label={t('settings.companyEmail')}>
                    <Input />
                  </Form.Item>
                </Col>
                
                <Col span={12}>
                  <Form.Item name="companyPhone" label={t('settings.companyPhone')}>
                    <Input />
                  </Form.Item>
                </Col>
                
                <Col span={12}>
                  <Form.Item name="companyWebsite" label={t('settings.companyWebsite')}>
                    <Input />
                  </Form.Item>
                </Col>
                
                <Col span={24}>
                  <Form.Item name="companyAddress" label={t('settings.companyAddress')}>
                    <TextArea rows={2} />
                  </Form.Item>
                </Col>
              </Row>

              <Divider />

              <Row gutter={24}>
                <Col span={24}>
                  <Title level={4}>{t('settings.companyLogo')}</Title>
                </Col>
                <Col span={24}>
                  <Space align="center">
                    <Avatar size={64} icon={<UserOutlined />} />
                    <Upload {...uploadProps}>
                      <Button icon={<UploadOutlined />}>{t('settings.uploadLogo')}</Button>
                    </Upload>
                  </Space>
                </Col>
              </Row>

              <Divider />

              <Row gutter={24}>
                <Col span={24}>
                  <Title level={4}>{t('settings.localization')}</Title>
                </Col>
                
                <Col span={8}>
                  <Form.Item name="timezone" label={t('settings.timezone')}>
                    <Select>
                      <Option value="Europe/Rome">{t('settings.tzRome')}</Option>
                      <Option value="Europe/London">{t('settings.tzLondon')}</Option>
                      <Option value="America/New_York">{t('settings.tzNewYork')}</Option>
                    </Select>
                  </Form.Item>
                </Col>
                
                <Col span={8}>
                  <Form.Item name="currency" label={t('settings.currency')}>
                    <Select>
                      <Option value="EUR">{t('settings.currencyEur')}</Option>
                      <Option value="USD">{t('settings.currencyUsd')}</Option>
                      <Option value="GBP">{t('settings.currencyGbp')}</Option>
                    </Select>
                  </Form.Item>
                </Col>
                
                <Col span={8}>
                  <Form.Item name="language" label={t('settings.language')}>
                    <Select>
                      <Option value="it">{t('language.it')}</Option>
                      <Option value="en">{t('language.en')}</Option>
                      <Option value="de">{t('language.de')}</Option>
                      <Option value="es">{t('language.es')}</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Divider />

              <Row gutter={24}>
                <Col span={24}>
                  <Title level={4}>{t('settings.openingHours')}</Title>
                </Col>
                
                <Col span={12}>
                  <Form.Item name="openingTime" label={t('settings.opening')}>
                    <TimePicker format="HH:mm" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                
                <Col span={12}>
                  <Form.Item name="closingTime" label={t('settings.closing')}>
                    <TimePicker format="HH:mm" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Divider />

              <Row gutter={24}>
                <Col span={24}>
                  <Title level={4}>{t('settings.defaultPrices')}</Title>
                </Col>
                
                <Col span={8}>
                  <Form.Item name="defaultHourlyRate" label={t('settings.hourlyRate')}>
                    <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                
                <Col span={8}>
                  <Form.Item name="defaultDailyRate" label={t('settings.dailyRate')}>
                    <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                
                <Col span={8}>
                  <Form.Item name="defaultMonthlyRate" label={t('settings.monthlyRate')}>
                    <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
                  {t('settings.saveGeneral')}
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>

        <TabPane 
          tab={
            <span>
              <BellOutlined />
              {t('settings.tabNotifications')}
            </span>
          } 
          key="notifications"
        >
          <Card>
            <Form
              form={notificationForm}
              layout="vertical"
              initialValues={settings}
              onFinish={(values) => handleSave('Notifications', values)}
            >
              <Row gutter={24}>
                <Col span={24}>
                  <Title level={4}>{t('settings.notificationChannels')}</Title>
                </Col>
                
                <Col span={12}>
                  <Form.Item name="emailNotifications" valuePropName="checked">
                    <Space>
                      <Switch />
                      <span>{t('settings.emailNotifications')}</span>
                    </Space>
                  </Form.Item>
                </Col>
                
                <Col span={12}>
                  <Form.Item name="smsNotifications" valuePropName="checked">
                    <Space>
                      <Switch />
                      <span>{t('settings.smsNotifications')}</span>
                    </Space>
                  </Form.Item>
                </Col>
              </Row>

              <Divider />

              <Row gutter={24}>
                <Col span={24}>
                  <Title level={4}>{t('settings.notificationTypes')}</Title>
                </Col>
                
                <Col span={8}>
                  <Form.Item name="newBookingNotification" valuePropName="checked">
                    <Space>
                      <Switch />
                      <span>{t('settings.newBookings')}</span>
                    </Space>
                  </Form.Item>
                </Col>
                
                <Col span={8}>
                  <Form.Item name="paymentNotification" valuePropName="checked">
                    <Space>
                      <Switch />
                      <span>{t('settings.payments')}</span>
                    </Space>
                  </Form.Item>
                </Col>
                
                <Col span={8}>
                  <Form.Item name="reminderNotification" valuePropName="checked">
                    <Space>
                      <Switch />
                      <span>{t('settings.reminders')}</span>
                    </Space>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
                  {t('settings.saveNotifications')}
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>

        <TabPane 
          tab={
            <span>
              <SecurityScanOutlined />
              {t('settings.tabSecurity')}
            </span>
          } 
          key="security"
        >
          <Card>
            <Form
              form={securityForm}
              layout="vertical"
              initialValues={settings}
              onFinish={(values) => handleSave('Security', values)}
            >
              <Row gutter={24}>
                <Col span={24}>
                  <Title level={4}>{t('settings.authentication')}</Title>
                </Col>
                
                <Col span={12}>
                  <Form.Item name="twoFactorAuth" valuePropName="checked">
                    <Space>
                      <Switch />
                      <span>{t('settings.twoFactor')}</span>
                    </Space>
                  </Form.Item>
                </Col>
                
                <Col span={12}>
                  <Form.Item name="sessionTimeout" label={t('settings.sessionTimeout')}>
                    <InputNumber min={5} max={480} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                
                <Col span={12}>
                  <Form.Item name="passwordExpiry" label={t('settings.passwordExpiry')}>
                    <InputNumber min={30} max={365} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Divider />

              <Row gutter={24}>
                <Col span={24}>
                  <Title level={4}>{t('settings.system')}</Title>
                </Col>
                
                <Col span={12}>
                  <Form.Item name="autoBackup" valuePropName="checked">
                    <Space>
                      <Switch />
                      <span>{t('settings.autoBackup')}</span>
                    </Space>
                  </Form.Item>
                </Col>
                
                <Col span={12}>
                  <Form.Item name="backupFrequency" label={t('settings.backupFrequency')}>
                    <Select>
                      <Option value="daily">{t('settings.freqDaily')}</Option>
                      <Option value="weekly">{t('settings.freqWeekly')}</Option>
                      <Option value="monthly">{t('settings.freqMonthly')}</Option>
                    </Select>
                  </Form.Item>
                </Col>
                
                <Col span={12}>
                  <Form.Item name="maintenanceMode" valuePropName="checked">
                    <Space>
                      <Switch />
                      <span>{t('settings.maintenanceMode')}</span>
                    </Space>
                  </Form.Item>
                </Col>
              </Row>

              <Divider />

              <Row gutter={24}>
                <Col span={24}>
                  <Title level={4}>{t('settings.changePassword')}</Title>
                </Col>
                
                <Col span={8}>
                  <Form.Item name="currentPassword" label={t('settings.currentPassword')}>
                    <Input.Password />
                  </Form.Item>
                </Col>
                
                <Col span={8}>
                  <Form.Item name="newPassword" label={t('settings.newPassword')}>
                    <Input.Password />
                  </Form.Item>
                </Col>
                
                <Col span={8}>
                  <Form.Item name="confirmPassword" label={t('settings.confirmPassword')}>
                    <Input.Password />
                  </Form.Item>
                </Col>
              </Row>

              <Space>
                <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
                  {t('settings.saveSecurity')}
                </Button>
                <Button icon={<KeyOutlined />}>
                  {t('settings.changePasswordBtn')}
                </Button>
              </Space>
            </Form>
          </Card>
        </TabPane>
      </Tabs>
    </div>
  )
}

export default Settings
