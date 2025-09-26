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

const { Title } = Typography
const { Option } = Select
const { TextArea } = Input
const { TabPane } = Tabs

function Settings() {
  const [loading, setLoading] = useState(false)
  const [generalForm] = Form.useForm()
  const [notificationForm] = Form.useForm()
  const [securityForm] = Form.useForm()

  const [settings, setSettings] = useState({
    // Impostazioni Generali
    companyName: 'Opus Center SRL',
    companyAddress: 'Via Roma 123, Milano',
    companyPhone: '+39 02 1234567',
    companyEmail: 'info@opuscentersrl.it',
    companyWebsite: 'www.opuscentersrl.it',
    timezone: 'Europe/Rome',
    currency: 'EUR',
    language: 'it',
    
    // Orari di Apertura
    openingTime: dayjs().hour(8).minute(0),
    closingTime: dayjs().hour(20).minute(0),
    
    // Prezzi Default
    defaultHourlyRate: 25.00,
    defaultDailyRate: 180.00,
    defaultMonthlyRate: 3500.00,
    
    // Notifiche
    emailNotifications: true,
    smsNotifications: false,
    newBookingNotification: true,
    paymentNotification: true,
    reminderNotification: true,
    
    // Sicurezza
    twoFactorAuth: false,
    sessionTimeout: 60,
    passwordExpiry: 90,
    
    // Sistema
    autoBackup: true,
    backupFrequency: 'daily',
    maintenanceMode: false
  })

  const handleSave = async (formType, values) => {
    setLoading(true)
    try {
      setSettings({ ...settings, ...values })
      message.success(`Impostazioni ${formType} salvate con successo`)
    } catch (error) {
      message.error('Errore nel salvataggio')
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
        message.error('Puoi caricare solo file JPG/PNG!')
      }
      const isLt2M = file.size / 1024 / 1024 < 2
      if (!isLt2M) {
        message.error('L\'immagine deve essere inferiore a 2MB!')
      }
      return isJpgOrPng && isLt2M
    },
    onChange: (info) => {
      if (info.file.status === 'done') {
        message.success('Logo caricato con successo')
      }
    }
  }

  return (
    <div>
      <Title level={2} style={{ marginBottom: 24 }}>
        <SettingOutlined /> Impostazioni
      </Title>

      <Tabs defaultActiveKey="general" type="card">
        {/* Tab Generale */}
        <TabPane 
          tab={
            <span>
              <GlobalOutlined />
              Generale
            </span>
          } 
          key="general"
        >
          <Card>
            <Form
              form={generalForm}
              layout="vertical"
              initialValues={settings}
              onFinish={(values) => handleSave('generali', values)}
            >
              <Row gutter={24}>
                <Col span={24}>
                  <Title level={4}>Informazioni Azienda</Title>
                </Col>
                
                <Col span={12}>
                  <Form.Item
                    name="companyName"
                    label="Nome Azienda"
                    rules={[{ required: true, message: 'Nome obbligatorio' }]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                
                <Col span={12}>
                  <Form.Item name="companyEmail" label="Email Aziendale">
                    <Input />
                  </Form.Item>
                </Col>
                
                <Col span={12}>
                  <Form.Item name="companyPhone" label="Telefono">
                    <Input />
                  </Form.Item>
                </Col>
                
                <Col span={12}>
                  <Form.Item name="companyWebsite" label="Sito Web">
                    <Input />
                  </Form.Item>
                </Col>
                
                <Col span={24}>
                  <Form.Item name="companyAddress" label="Indirizzo">
                    <TextArea rows={2} />
                  </Form.Item>
                </Col>
              </Row>

              <Divider />

              <Row gutter={24}>
                <Col span={24}>
                  <Title level={4}>Logo Aziendale</Title>
                </Col>
                <Col span={24}>
                  <Space align="center">
                    <Avatar size={64} icon={<UserOutlined />} />
                    <Upload {...uploadProps}>
                      <Button icon={<UploadOutlined />}>Carica Logo</Button>
                    </Upload>
                  </Space>
                </Col>
              </Row>

              <Divider />

              <Row gutter={24}>
                <Col span={24}>
                  <Title level={4}>Localizzazione</Title>
                </Col>
                
                <Col span={8}>
                  <Form.Item name="timezone" label="Fuso Orario">
                    <Select>
                      <Option value="Europe/Rome">Europa/Roma</Option>
                      <Option value="Europe/London">Europa/Londra</Option>
                      <Option value="America/New_York">America/New York</Option>
                    </Select>
                  </Form.Item>
                </Col>
                
                <Col span={8}>
                  <Form.Item name="currency" label="Valuta">
                    <Select>
                      <Option value="EUR">Euro (€)</Option>
                      <Option value="USD">Dollaro ($)</Option>
                      <Option value="GBP">Sterlina (£)</Option>
                    </Select>
                  </Form.Item>
                </Col>
                
                <Col span={8}>
                  <Form.Item name="language" label="Lingua">
                    <Select>
                      <Option value="it">Italiano</Option>
                      <Option value="en">Inglese</Option>
                      <Option value="fr">Francese</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Divider />

              <Row gutter={24}>
                <Col span={24}>
                  <Title level={4}>Orari di Apertura</Title>
                </Col>
                
                <Col span={12}>
                  <Form.Item name="openingTime" label="Apertura">
                    <TimePicker format="HH:mm" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                
                <Col span={12}>
                  <Form.Item name="closingTime" label="Chiusura">
                    <TimePicker format="HH:mm" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Divider />

              <Row gutter={24}>
                <Col span={24}>
                  <Title level={4}>Prezzi Default</Title>
                </Col>
                
                <Col span={8}>
                  <Form.Item name="defaultHourlyRate" label="Tariffa Oraria (€)">
                    <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                
                <Col span={8}>
                  <Form.Item name="defaultDailyRate" label="Tariffa Giornaliera (€)">
                    <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                
                <Col span={8}>
                  <Form.Item name="defaultMonthlyRate" label="Tariffa Mensile (€)">
                    <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
                  Salva Impostazioni Generali
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>

        {/* Tab Notifiche */}
        <TabPane 
          tab={
            <span>
              <BellOutlined />
              Notifiche
            </span>
          } 
          key="notifications"
        >
          <Card>
            <Form
              form={notificationForm}
              layout="vertical"
              initialValues={settings}
              onFinish={(values) => handleSave('notifiche', values)}
            >
              <Row gutter={24}>
                <Col span={24}>
                  <Title level={4}>Canali di Notifica</Title>
                </Col>
                
                <Col span={12}>
                  <Form.Item name="emailNotifications" valuePropName="checked">
                    <Space>
                      <Switch />
                      <span>Notifiche Email</span>
                    </Space>
                  </Form.Item>
                </Col>
                
                <Col span={12}>
                  <Form.Item name="smsNotifications" valuePropName="checked">
                    <Space>
                      <Switch />
                      <span>Notifiche SMS</span>
                    </Space>
                  </Form.Item>
                </Col>
              </Row>

              <Divider />

              <Row gutter={24}>
                <Col span={24}>
                  <Title level={4}>Tipi di Notifica</Title>
                </Col>
                
                <Col span={8}>
                  <Form.Item name="newBookingNotification" valuePropName="checked">
                    <Space>
                      <Switch />
                      <span>Nuove Prenotazioni</span>
                    </Space>
                  </Form.Item>
                </Col>
                
                <Col span={8}>
                  <Form.Item name="paymentNotification" valuePropName="checked">
                    <Space>
                      <Switch />
                      <span>Pagamenti</span>
                    </Space>
                  </Form.Item>
                </Col>
                
                <Col span={8}>
                  <Form.Item name="reminderNotification" valuePropName="checked">
                    <Space>
                      <Switch />
                      <span>Promemoria</span>
                    </Space>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
                  Salva Impostazioni Notifiche
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>

        {/* Tab Sicurezza */}
        <TabPane 
          tab={
            <span>
              <SecurityScanOutlined />
              Sicurezza
            </span>
          } 
          key="security"
        >
          <Card>
            <Form
              form={securityForm}
              layout="vertical"
              initialValues={settings}
              onFinish={(values) => handleSave('sicurezza', values)}
            >
              <Row gutter={24}>
                <Col span={24}>
                  <Title level={4}>Autenticazione</Title>
                </Col>
                
                <Col span={12}>
                  <Form.Item name="twoFactorAuth" valuePropName="checked">
                    <Space>
                      <Switch />
                      <span>Autenticazione a Due Fattori</span>
                    </Space>
                  </Form.Item>
                </Col>
                
                <Col span={12}>
                  <Form.Item name="sessionTimeout" label="Timeout Sessione (minuti)">
                    <InputNumber min={5} max={480} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                
                <Col span={12}>
                  <Form.Item name="passwordExpiry" label="Scadenza Password (giorni)">
                    <InputNumber min={30} max={365} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Divider />

              <Row gutter={24}>
                <Col span={24}>
                  <Title level={4}>Sistema</Title>
                </Col>
                
                <Col span={12}>
                  <Form.Item name="autoBackup" valuePropName="checked">
                    <Space>
                      <Switch />
                      <span>Backup Automatico</span>
                    </Space>
                  </Form.Item>
                </Col>
                
                <Col span={12}>
                  <Form.Item name="backupFrequency" label="Frequenza Backup">
                    <Select>
                      <Option value="daily">Giornaliero</Option>
                      <Option value="weekly">Settimanale</Option>
                      <Option value="monthly">Mensile</Option>
                    </Select>
                  </Form.Item>
                </Col>
                
                <Col span={12}>
                  <Form.Item name="maintenanceMode" valuePropName="checked">
                    <Space>
                      <Switch />
                      <span>Modalità Manutenzione</span>
                    </Space>
                  </Form.Item>
                </Col>
              </Row>

              <Divider />

              <Row gutter={24}>
                <Col span={24}>
                  <Title level={4}>Cambio Password</Title>
                </Col>
                
                <Col span={8}>
                  <Form.Item name="currentPassword" label="Password Attuale">
                    <Input.Password />
                  </Form.Item>
                </Col>
                
                <Col span={8}>
                  <Form.Item name="newPassword" label="Nuova Password">
                    <Input.Password />
                  </Form.Item>
                </Col>
                
                <Col span={8}>
                  <Form.Item name="confirmPassword" label="Conferma Password">
                    <Input.Password />
                  </Form.Item>
                </Col>
              </Row>

              <Space>
                <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
                  Salva Impostazioni Sicurezza
                </Button>
                <Button icon={<KeyOutlined />}>
                  Cambia Password
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