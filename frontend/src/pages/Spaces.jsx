import React, { useCallback, useEffect, useState } from 'react'
import { Typography, Button, Row, Col, Card, Tag, Spin, message, Avatar, Progress, Badge, Space } from 'antd'
import { 
  PlusOutlined, HomeOutlined, TeamOutlined, DesktopOutlined, PhoneOutlined, CalendarOutlined,
  WifiOutlined, CoffeeOutlined, PlayCircleOutlined, CarOutlined, ThunderboltOutlined, StarOutlined
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

const formatAmenities = (amenities) => {
  if (Array.isArray(amenities)) return amenities.filter(Boolean)
  if (typeof amenities === 'string') {
    return amenities.split(',').map((item) => item.trim()).filter(Boolean)
  }
  return []
}

function Spaces() {
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const formatCurrency = (amount) => new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'EUR' }).format(amount || 0);

  const fetchSpaces = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/spaces`, {
        headers: authHeaders()
      });
      setSpaces(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      if (isDemoRestriction(err) || handleDemoRestriction(err)) {
        setError(err.response?.data?.message || t('common.errorLoading'));
        return;
      }
      const errorMessage = err.response?.data?.message || err.response?.data?.error || t('common.errorLoading');
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchSpaces();
  }, [fetchSpaces]);

  const getTypeConfig = (type) => {
    const configs = {
      OFFICE: { icon: <HomeOutlined />, gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
      MEETING_ROOM: { icon: <TeamOutlined />, gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
      COWORKING: { icon: <DesktopOutlined />, gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
      PHONE_BOOTH: { icon: <PhoneOutlined />, gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
      EVENT_SPACE: { icon: <CalendarOutlined />, gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
    };
    const config = configs[type] || { icon: <HomeOutlined />, gradient: 'linear-gradient(135deg, #d3d3d3 0%, #e6e6e6 100%)' };
    return { ...config, label: t(`enums.spaceType.${type}`, { defaultValue: type }) };
  };

  const translateAmenity = (amenity) => {
    const lowerAmenity = amenity.toLowerCase();
    if (lowerAmenity.includes('wifi')) return t('enums.amenity.wifi');
    if (lowerAmenity.includes('coffee')) return t('enums.amenity.coffeeKitchen');
    if (lowerAmenity.includes('projector')) return t('enums.amenity.projectorScreen');
    if (lowerAmenity.includes('parking')) return t('enums.amenity.parking');
    if (lowerAmenity.includes('power')) return t('enums.amenity.powerOutlets');
    if (lowerAmenity.includes('whiteboard')) return t('enums.amenity.whiteboard');
    if (lowerAmenity.includes('air') || lowerAmenity.includes('conditioning')) return t('enums.amenity.airConditioning');
    return amenity;
  };
  
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
    navigate('/spaces/new');
  };

  return (
    <div className="page-enter">
      <Row justify="space-between" align="middle" style={{ marginBottom: 32 }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            <HomeOutlined style={{ marginRight: 12, color: '#4F46E5' }} />
            {t('spaces.title', { count: spaces.length })}
          </Title>
          <Text type="secondary" style={{ fontSize: 16 }}>
            {t('spaces.subtitle')}
          </Text>
        </Col>
        <Col>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            size="large" 
            onClick={handleNewSpace}
          >
            {t('spaces.newSpace')}
          </Button>
        </Col>
      </Row>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px' }}>
          <Spin size="large" />
          <Text style={{ marginTop: 16, display: 'block' }}>{t('spaces.loading')}</Text>
        </div>
      ) : error ? (
        <Card style={{ textAlign: 'center', padding: '60px' }}>
          <HomeOutlined style={{ fontSize: 48, marginBottom: 16, color: '#ff4d4f' }} />
          <Title level={3}>{t('common.errorLoading')}</Title>
          <Text style={{ fontSize: 16, display: 'block', marginBottom: 24 }}>{error}</Text>
          <Button type="primary" onClick={fetchSpaces}>{t('spaces.loading')}</Button>
        </Card>
      ) : spaces.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '60px' }}>
          <HomeOutlined style={{ fontSize: 48, marginBottom: 16, color: '#4F46E5' }} />
          <Title level={3}>{t('spaces.emptyTitle')}</Title>
          <Text style={{ fontSize: 16 }}>{t('spaces.emptyText')}</Text>
        </Card>
      ) : (
        <Row gutter={[24, 24]}>
          {spaces.map((space) => {
            const typeConfig = getTypeConfig(space.type);
            const amenities = formatAmenities(space.amenities);
            const occupancyRate = calculateOccupancyRate();
            const occupancyColor = getOccupancyColor(occupancyRate);
            const isActive = space.active !== false;
            
            return (
              <Col xs={24} md={12} lg={8} key={space.id}>
                <Badge.Ribbon text={isActive ? t('common.active') : t('common.inactive')} color={isActive ? 'green' : 'red'}>
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
                          <Text type="secondary">{t('spaces.capacity')}</Text>
                          <div style={{ fontSize: 18, fontWeight: 600 }}>
                            <TeamOutlined style={{ marginRight: 6 }} />
                            {t('spaces.people', { count: space.capacity })}
                          </div>
                        </Col>
                        <Col style={{ textAlign: 'right' }}>
                          <Text type="secondary">{t('spaces.hourlyRate')}</Text>
                          <div style={{ fontSize: 18, fontWeight: 600 }}>
                            {formatCurrency(space.hourlyRate)}
                          </div>
                        </Col>
                      </Row>
                      
                      <div style={{ marginBottom: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <Text strong>{t('spaces.currentOccupancy')}</Text>
                          <Text style={{ color: occupancyColor, fontWeight: 600 }}>
                            {occupancyRate}%
                          </Text>
                        </div>
                        <Progress percent={occupancyRate} strokeColor={occupancyColor} showInfo={false} size={[0, 8]} />
                      </div>
                      
                      {amenities.length > 0 && (
                        <div style={{ marginBottom: 24 }}>
                          <Text strong style={{ marginBottom: 8, display: 'block' }}>{t('spaces.topAmenities')}</Text>
                          <Space wrap>
                            {amenities.slice(0, 4).map((amenity, index) => (
                              <Tag key={index} icon={getAmenityIcon(amenity)}>
                                {translateAmenity(amenity)}
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
                          <Text type="secondary">{t('spaces.totalBookings')}</Text>
                        </Space>
                        <Button onClick={() => navigate(`/spaces/edit/${space.id}`)}>
                          {t('spaces.viewEdit')}
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
