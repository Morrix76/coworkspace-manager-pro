import React, { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  Layout as AntLayout,
  Menu,
  Button,
  Avatar,
  Dropdown,
  Breadcrumb,
  Badge
} from 'antd'
import {
  DashboardOutlined,
  HomeOutlined,
  UserOutlined,
  CalendarOutlined,
  FileTextOutlined,
  DollarOutlined,
  BarChartOutlined,
  SettingOutlined,
  LogoutOutlined,
  BellOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons'
import { logout } from '../../store/slices/authSlice'

const { Header, Sider, Content } = AntLayout

function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const { user } = useSelector(state => state.auth)

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard'
    },
    {
      key: '/spaces',
      icon: <HomeOutlined />,
      label: 'Spaces'
    },
    {
      key: '/clients',
      icon: <UserOutlined />,
      label: 'Clients'
    },
    {
      key: '/bookings',
      icon: <CalendarOutlined />,
      label: 'Bookings'
    },
    {
      key: '/contracts',
      icon: <FileTextOutlined />,
      label: 'Contracts'
    },
    {
      key: '/billing',
      icon: <DollarOutlined />,
      label: 'Billing'
    },
    {
      key: '/reports',
      icon: <BarChartOutlined />,
      label: 'Reports'
    }
  ]

  const userMenuItems = [
    {
      key: 'profile',
      label: 'Profile',
      icon: <UserOutlined />,
      onClick: () => navigate('/profile')
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: <SettingOutlined />,
      onClick: () => navigate('/settings')
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      label: 'Logout',
      icon: <LogoutOutlined />,
      onClick: handleLogout
    }
  ]

  function handleLogout() {
    dispatch(logout())
    navigate('/login')
  }

  const handleMenuClick = ({ key }) => {
    navigate(key)
  }

  const getBreadcrumbItems = () => {
    const pathnames = location.pathname.split('/').filter(x => x)
    const breadcrumbItems = [
      {
        title: 'Home',
        href: '/dashboard'
      }
    ]

    pathnames.forEach((name, index) => {
      const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`
      const isLast = index === pathnames.length - 1
      
      let title = name.charAt(0).toUpperCase() + name.slice(1)
      
      breadcrumbItems.push({
        title: isLast ? title : <a href={routeTo}>{title}</a>
      })
    })

    return breadcrumbItems
  }

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={{
          background: '#ffffff',
          borderRight: '1px solid #f0f0f0'
        }}
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          paddingLeft: collapsed ? 0 : 24,
          fontWeight: 700,
          fontSize: 18,
          background: 'linear-gradient(135deg, #4F46E5, #06B6D4)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          {!collapsed && 'CoworkSpace Pro'}
        </div>
        
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ border: 'none', marginTop: 16 }}
        />
      </Sider>
      
      <AntLayout>
        <Header style={{
          padding: '0 24px',
          background: '#ffffff',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: 16 }}
            />
            
            <Breadcrumb items={getBreadcrumbItems()} />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Badge count={3} size="small">
              <Button
                type="text"
                icon={<BellOutlined />}
                style={{ fontSize: 16 }}
              />
            </Badge>
            
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              trigger={['click']}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                padding: '8px 12px',
                borderRadius: 8,
                transition: 'background-color 0.2s'
              }}>
                <Avatar size="small" style={{ backgroundColor: '#4F46E5' }}>
                  {user?.name?.charAt(0) || 'U'}
                </Avatar>
                <span style={{ fontWeight: 500 }}>
                  {user?.name || 'User'}
                </span>
              </div>
            </Dropdown>
          </div>
        </Header>
        
        <Content style={{
          margin: 24,
          padding: 24,
          background: '#ffffff',
          borderRadius: 8,
          minHeight: 280
        }}>
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  )
}

export default Layout