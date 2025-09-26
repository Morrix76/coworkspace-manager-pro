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

const { Title, Text } = Typography
const { Option } = Select

function Profile() {
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()
  
  // Dati utente dal Redux store o mock
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

  // Statistiche utente mock
  const userStats = {
    totalBookings: 145,
    thisMonthBookings: 23,
    totalRevenue: 45600.00,
    avgSessionTime: '2h 15m'
  }

  const handleSave = async (values) => {
    setLoading(true)
    try {
      // Simula salvataggio
      setTimeout(() => {
        message.success('Profilo aggiornato con successo')
        setEditing(false)
        setLoading(false)
      }, 1000)
    } catch (error) {
      message.error('Errore nel salvataggio')
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
        message.success('Avatar aggiornato con successo')
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

  const getRoleLabel = (role) => {
    const labels = {
      ADMIN: 'Amministratore',
      MANAGER: 'Manager',
      RECEPTIONIST: 'Receptionist',
      MAINTENANCE: 'Manutenzione'
    }
    return labels[role] || role
  }

  return (
    <div>
      <Title level={2} style={{ marginBottom: 24 }}>
        <UserOutlined /> Il Mio Profilo
      </Title>

      <Row gutter={24}>
        {/* Colonna Sinistra - Info Profilo */}
        <Col span={16}>
          <Card
            title="Informazioni Personali"
            extra={
              <Button 
                type="primary" 
                icon={<EditOutlined />}
                onClick={() => setEditing(!editing)}
              >
                {editing ? 'Annulla' : 'Modifica'}
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
                          Cambia Avatar
                        </Button>
                      </Upload>
                    )}
                    <div>
                      <Title level={3} style={{ margin: 0 }}>
                        {user.name}
                      </Title>
                      <Tag color={getRoleColor(user.role)}>
                        {getRoleLabel(user.role)}
                      </Tag>
                    </div>
                  </Space>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="name"
                    label="Nome Completo"
                    rules={[{ required: true, message: 'Nome obbligatorio' }]}
                  >
                    <Input disabled={!editing} />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                      { required: true, message: 'Email obbligatoria' },
                      { type: 'email', message: 'Email non valida' }
                    ]}
                  >
                    <Input disabled={!editing} prefix={<MailOutlined />} />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item name="phone" label="Telefono">
                    <Input disabled={!editing} prefix={<PhoneOutlined />} />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item name="department" label="Dipartimento">
                    <Select disabled={!editing}>
                      <Option value="Amministrazione">Amministrazione</Option>
                      <Option value="Vendite">Vendite</Option>
                      <Option value="Marketing">Marketing</Option>
                      <Option value="Operativo">Operativo</Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item name="joinDate" label="Data Assunzione">
                    <DatePicker 
                      disabled={!editing} 
                      style={{ width: '100%' }}
                      format="DD/MM/YYYY"
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item label="Ultimo Accesso">
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
                        Salva Modifiche
                      </Button>
                      <Button onClick={() => setEditing(false)}>
                        Annulla
                      </Button>
                    </Space>
                  </Form.Item>
                </>
              )}
            </Form>
          </Card>

          {/* Card Cambio Password */}
          <Card title="Sicurezza" style={{ marginTop: 24 }}>
            <Form layout="vertical">
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="currentPassword" label="Password Attuale">
                    <Input.Password />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item 
                    name="newPassword" 
                    label="Nuova Password"
                    rules={[
                      { min: 8, message: 'Minimo 8 caratteri' }
                    ]}
                  >
                    <Input.Password />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item 
                    name="confirmPassword" 
                    label="Conferma Password"
                    dependencies={['newPassword']}
                    rules={[
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('newPassword') === value) {
                            return Promise.resolve()
                          }
                          return Promise.reject('Le password non coincidono!')
                        }
                      })
                    ]}
                  >
                    <Input.Password />
                  </Form.Item>
                </Col>
              </Row>
              <Button type="primary" icon={<KeyOutlined />}>
                Cambia Password
              </Button>
            </Form>
          </Card>
        </Col>

        {/* Colonna Destra - Statistiche */}
        <Col span={8}>
          <Card title="Le Mie Statistiche" style={{ marginBottom: 24 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Statistic
                title="Prenotazioni Totali"
                value={userStats.totalBookings}
                prefix={<CalendarOutlined />}
              />
              <Divider />
              <Statistic
                title="Questo Mese"
                value={userStats.thisMonthBookings}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
              <Divider />
              <Statistic
                title="Ricavi Gestiti"
                value={userStats.totalRevenue}
                formatter={(value) => `${value.toFixed(2)}`}
                prefix={<TrophyOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
              <Divider />
              <Statistic
                title="Tempo Sessione Medio"
                value={userStats.avgSessionTime}
                prefix={<ClockCircleOutlined />}
              />
            </Space>
          </Card>

          {/* Card Attività Recenti */}
          <Card title="Attività Recenti">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>Login sistema</Text>
                <Text type="secondary">2 ore fa</Text>
              </div>
              <Divider />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>Prenotazione creata</Text>
                <Text type="secondary">4 ore fa</Text>
              </div>
              <Divider />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>Cliente aggiornato</Text>
                <Text type="secondary">1 giorno fa</Text>
              </div>
              <Divider />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>Fattura generata</Text>
                <Text type="secondary">2 giorni fa</Text>
              </div>
              <Divider />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>Report esportato</Text>
                <Text type="secondary">3 giorni fa</Text>
              </div>
            </Space>
          </Card>

          {/* Card Preferenze */}
          <Card title="Preferenze" style={{ marginTop: 24 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>Notifiche Email</Text>
                <Switch defaultChecked />
              </div>
              <Divider />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>Notifiche Push</Text>
                <Switch />
              </div>
              <Divider />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>Tema Scuro</Text>
                <Switch />
              </div>
              <Divider />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>Auto-logout</Text>
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