import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { 
  Form, 
  Input, 
  Button, 
  Card, 
  Typography, 
  Layout,
  Space,
  message
} from 'antd'
import { 
  UserOutlined, 
  LockOutlined,
  LoginOutlined,
  RocketOutlined
} from '@ant-design/icons'
import { login } from '../store/slices/authSlice'
import axios from 'axios'

const { Title, Text } = Typography
const { Content } = Layout

const API_URL = import.meta.env.VITE_API_URL

function Login() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const handleSubmit = async (values) => {
    setLoading(true)
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email: values.email,
        password: values.password
      })

      const { token, user } = response.data
      localStorage.setItem('token', token)
      
      dispatch(login({ user, token }))
      message.success('Login successful')
      navigate('/dashboard')
    } catch (error) {
      message.error(error.response?.data?.message || 'Login error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Particelle animate di sfondo */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 25% 25%, rgba(79, 70, 229, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 75% 75%, rgba(6, 182, 212, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.05) 0%, transparent 50%)
        `,
        animation: 'float 20s ease-in-out infinite'
      }} />
      
      {/* Floating elements */}
      <div style={{
        position: 'absolute',
        top: '10%',
        right: '10%',
        width: '100px',
        height: '100px',
        background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.1), rgba(6, 182, 212, 0.1))',
        borderRadius: '50%',
        filter: 'blur(40px)',
        animation: 'floatRight 15s ease-in-out infinite'
      }} />
      
      <div style={{
        position: 'absolute',
        bottom: '20%',
        left: '15%',
        width: '150px',
        height: '150px',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(245, 158, 11, 0.1))',
        borderRadius: '50%',
        filter: 'blur(60px)',
        animation: 'floatLeft 18s ease-in-out infinite'
      }} />

      <Content style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '50px',
        position: 'relative',
        zIndex: 10
      }}>
        <Card 
          style={{ 
            width: 450,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: `
              0 25px 50px rgba(0, 0, 0, 0.15),
              0 0 0 1px rgba(255, 255, 255, 0.1) inset
            `,
            overflow: 'hidden'
          }}
          bodyStyle={{ padding: '40px' }}
        >
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Logo/Header futuristico */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{
                width: 80,
                height: 80,
                background: 'linear-gradient(135deg, #4F46E5 0%, #06B6D4 50%, #10B981 100%)',
                borderRadius: '20px',
                margin: '0 auto 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 25px rgba(79, 70, 229, 0.3)',
                position: 'relative'
              }}>
                <RocketOutlined style={{ 
                  fontSize: 32, 
                  color: 'white',
                  animation: 'pulse 2s ease-in-out infinite'
                }} />
                
                {/* Glow effect */}
                <div style={{
                  position: 'absolute',
                  top: '-2px',
                  left: '-2px',
                  right: '-2px',
                  bottom: '-2px',
                  background: 'linear-gradient(135deg, #4F46E5, #06B6D4, #10B981)',
                  borderRadius: '22px',
                  zIndex: -1,
                  filter: 'blur(8px)',
                  opacity: 0.6
                }} />
              </div>
              
              <Title level={1} style={{ 
                margin: '0 0 8px 0',
                background: 'linear-gradient(135deg, #1F2937 0%, #4F46E5 50%, #06B6D4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontSize: '28px',
                fontWeight: 700,
                letterSpacing: '-0.5px'
              }}>
                CoworkSpace Pro
              </Title>
              
              <Text style={{ 
                fontSize: '16px',
                color: '#64748B',
                fontWeight: 500 
              }}>
                The future of coworking starts here
              </Text>
            </div>

            {/* Form con stile futuristico */}
            <Form
              name="login"
              onFinish={handleSubmit}
              layout="vertical"
              size="large"
              style={{ marginTop: '20px' }}
            >
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: 'Please enter your email' },
                  { type: 'email', message: 'Invalid email format' }
                ]}
                style={{ marginBottom: '24px' }}
              >
                <Input 
                  prefix={<UserOutlined style={{ color: '#4F46E5' }} />} 
                  placeholder="Email"
                  autoComplete="email"
                  style={{
                    height: '52px',
                    borderRadius: '12px',
                    border: '2px solid #E2E8F0',
                    background: 'rgba(248, 250, 252, 0.8)',
                    fontSize: '16px',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[{ required: true, message: 'Please enter your password' }]}
                style={{ marginBottom: '32px' }}
              >
                <Input.Password 
                  prefix={<LockOutlined style={{ color: '#4F46E5' }} />} 
                  placeholder="Password"
                  autoComplete="current-password"
                  style={{
                    height: '52px',
                    borderRadius: '12px',
                    border: '2px solid #E2E8F0',
                    background: 'rgba(248, 250, 252, 0.8)',
                    fontSize: '16px'
                  }}
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: '24px' }}>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  block
                  icon={<LoginOutlined />}
                  style={{ 
                    height: '52px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
                    border: 'none',
                    fontSize: '16px',
                    fontWeight: 600,
                    boxShadow: '0 8px 25px rgba(79, 70, 229, 0.3)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <span style={{ position: 'relative', zIndex: 2 }}>
                    Access the Future
                  </span>
                </Button>
              </Form.Item>
            </Form>

            {/* Demo Credentials con stile moderno */}
            <div style={{ 
              background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.05) 0%, rgba(6, 182, 212, 0.05) 100%)',
              padding: '20px', 
              borderRadius: '16px',
              border: '1px solid rgba(79, 70, 229, 0.1)',
              textAlign: 'center',
              backdropFilter: 'blur(10px)'
            }}>
              <Text style={{ 
                fontSize: '13px',
                color: '#64748B',
                display: 'block',
                marginBottom: '8px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Demo Credentials
              </Text>
              <Text style={{ 
                fontSize: '14px',
                color: '#374151',
                display: 'block',
                fontFamily: 'monospace',
                lineHeight: '1.6'
              }}>
                <strong>Email:</strong> admin@opuscentersrl.it<br />
                <strong>Password:</strong> admin123
              </Text>
            </div>
          </Space>
        </Card>
      </Content>
      
      {/* CSS per animazioni */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        @keyframes floatRight {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-30px) translateX(20px); }
        }
        
        @keyframes floatLeft {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(25px) translateX(-15px); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        /* Hover effects per input */
        .ant-input:focus,
        .ant-input-password:focus {
          border-color: #4F46E5 !important;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1) !important;
          background: rgba(255, 255, 255, 0.9) !important;
        }
        
        /* Button hover effect */
        .ant-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 35px rgba(79, 70, 229, 0.4) !important;
        }
        
        .ant-btn-primary:active {
          transform: translateY(0px);
        }
      `}</style>
    </Layout>
  )
}

export default Login