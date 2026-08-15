import React, { useEffect, useState } from 'react'
import { Typography, Button, Row, Col, Card, Tag, Spin, message, Avatar, Progress, Badge, Space, Tooltip } from 'antd'
import { 
  PlusOutlined, HomeOutlined, TeamOutlined, DesktopOutlined, PhoneOutlined, CalendarOutlined,
  WifiOutlined, CoffeeOutlined, PlayCircleOutlined, CarOutlined, ThunderboltOutlined, StarOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

const { Title, Text } = Typography

function Spaces({ spacesData = [] }) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const getTypeConfig = (type) => {
    const configs = {
      OFFICE: { label: 'Office', icon: <HomeOutlined />, gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
      MEETING_ROOM: { label: 'Meeting Room', icon: <TeamOutlined />, gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
      COWORKING: { label: 'Coworking', icon: <DesktopOutlined />, gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
      PHONE_BOOTH: { label: 'Phone Booth', icon: <PhoneOutlined />, gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
      EVENT_SPACE: { label: 'Event Space', icon: <CalendarOutlined />, gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
    };
    return configs[type] || { label: type, icon: <HomeOutlined />, gradient: 'linear-gradient(135deg, #d3d3d3 0%, #e6e6e6 100%)' };
  };

  const formatAmenities = (amenitiesString) => (amenitiesString ? amenitiesString.split(',').map(a => a.trim()).filter(a => a) : []);
  
  const getAmenityIcon = (amenity) => {
    const lowerAmenity = amenity.toLowerCase();
    if (lowerAmenity.includes('wifi')) return <WifiOutlined />;
    if (lowerAmenity.includes('coffee')) return <CoffeeOutlined />;
    if (lowerAmenity.includes('projector')) return <PlayCircleOutlined />;
    if (lowerAmenity.includes('parking')) return <CarOutlined />;
    if (lowerAmenity.includes('power')) return <ThunderboltOutlined />;
    return <StarOutlined />;
  };
  
  const calculateOccupancyRate = () => Math.floor(Math.random() * (95 - 40 + 1)) + 40;
  const getOccupancyColor = (rate) => rate < 60 ? '#faad14' : rate < 85 ? '#1890ff' : '#52c41a';

  const handleNewSpace = () => {
    console.log('Navigating to /spaces/new');
    navigate('/spaces/new');
  };

  return (
    <div className="page-enter">
      <Row justify="space-between" align="middle" style={{ marginBottom: 32 }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            <HomeOutlined style={{ marginRight: 12, color: '#4F46E5' }} />
            Spaces ({spacesData.length})
          </Title>
          <Text type="secondary" style={{ fontSize: 16 }}>
            Manage and monitor your workspace areas
          </Text>
        </Col>
        <Col>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            size="large" 
            onClick={handleNewSpace}
          >
            New Space
          </Button>
        </Col>
      </Row>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px' }}>
          <Spin size="large" />
          <Text style={{ marginTop: 16, display: 'block' }}>Loading spaces...</Text>
        </div>
      ) : spacesData.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '60px' }}>
          <HomeOutlined style={{ fontSize: 48, marginBottom: 16, color: '#4F46E5' }} />
          <Title level={3}>No spaces found</Title>
          <Text style={{ fontSize: 16 }}>Create your first workspace to get started.</Text>
        </Card>
      ) : (
        <Row gutter={[24, 24]}>
          {spacesData.map((space) => {
            const typeConfig = getTypeConfig(space.type);
            const amenities = formatAmenities(space.amenities);
            const occupancyRate = calculateOccupancyRate();
            const occupancyColor = getOccupancyColor(occupancyRate);
            
            return (
              <Col xs={24} md={12} lg={8} key={space.id}>
                <Badge.Ribbon text={space.isActive ? 'Active' : 'Inactive'} color={space.isActive ? 'green' : 'red'}>
                  <Card hoverable styles={{ body: { padding: 0 } }}>
                    <div style={{ background: typeConfig.gradient, padding: '24px 24px 16px', position: 'relative' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <Avatar size={48} style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }} icon={typeConfig.icon} />
                        <Tag color="rgba(255,255,255,0.2)" style={{ color: 'white', border: '1px solid rgba(255,255,255,0.5)' }}>
                          {typeConfig.label}
                        </Tag>
                      </div>
                      <Title level={3} style={{ color: 'white', margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                        {space.name}
                      </Title>
                    </div>
                    <div style={{ padding: '20px 24px' }}>
                      <Row justify="space-between" style={{ marginBottom: 16 }}>
                        <Col>
                          <Text type="secondary">Capacity</Text>
                          <div style={{ fontSize: 18, fontWeight: 600 }}>
                            <TeamOutlined style={{ marginRight: 6 }} />
                            {space.capacity} people
                          </div>
                        </Col>
                        <Col style={{ textAlign: 'right' }}>
                          <Text type="secondary">Hourly Rate</Text>
                          <div style={{ fontSize: 18, fontWeight: 600 }}>
                            ${space.hourlyRate}
                          </div>
                        </Col>
                      </Row>
                      
                      <div style={{ marginBottom: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <Text strong>Current Occupancy</Text>
                          <Text style={{ color: occupancyColor, fontWeight: 600 }}>
                            {occupancyRate}%
                          </Text>
                        </div>
                        <Progress percent={occupancyRate} strokeColor={occupancyColor} showInfo={false} size={[0, 8]} />
                      </div>
                      
                      {amenities.length > 0 && (
                        <div style={{ marginBottom: 24 }}>
                          <Text strong style={{ marginBottom: 8, display: 'block' }}>Top Amenities</Text>
                          <Space wrap>
                            {amenities.slice(0, 4).map((amenity, index) => (
                              <Tag key={index} icon={getAmenityIcon(amenity)}>
                                {amenity}
                              </Tag>
                            ))}
                            {amenities.length > 4 && <Tag>+{amenities.length - 4}</Tag>}
                          </Space>
                        </div>
                      )}
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
                        <Space>
                          <CalendarOutlined />
                          <Text strong>{space._count?.bookings || 0}</Text>
                          <Text type="secondary">total bookings</Text>
                        </Space>
                        <Button onClick={() => navigate(`/spaces/edit/${space.id}`)}>
                          View & Edit
                        </Button>
                      </div>
                    </div>
                  </Card>
                </Badge.Ribbon>
              </Col>
            );
          })}
        </Row>
      )}
    </div>
  );
}

export default Spaces;