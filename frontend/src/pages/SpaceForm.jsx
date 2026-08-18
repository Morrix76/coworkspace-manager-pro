import React, { useState, useEffect } from 'react';
import { Form, Input, Select, InputNumber, Button, Card, message, Spin, Space, Checkbox, Row, Col, Typography } from 'antd';
import { SaveOutlined, ArrowLeftOutlined, HomeOutlined, TeamOutlined, DesktopOutlined, CalendarOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { handleDemoRestriction, isDemoRestriction } from '../utils/demoError';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const API_URL = import.meta.env.VITE_API_URL;

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`
});

const spaceTypeIcons = {
  OFFICE: <HomeOutlined />,
  MEETING_ROOM: <TeamOutlined />,
  COWORKING: <DesktopOutlined />,
  EVENT_SPACE: <CalendarOutlined />,
};

const spaceTypeValues = ['OFFICE', 'MEETING_ROOM', 'COWORKING', 'EVENT_SPACE'];

const amenityOptionsConfig = [
  { value: 'WiFi', key: 'wifi' },
  { value: 'Coffee/Kitchen', key: 'coffeeKitchen' },
  { value: 'Projector/Screen', key: 'projectorScreen' },
  { value: 'Parking', key: 'parking' },
  { value: 'Power Outlets', key: 'powerOutlets' },
  { value: 'Whiteboard', key: 'whiteboard' },
  { value: 'Air Conditioning', key: 'airConditioning' },
];

function SpaceForm() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { spaceId } = useParams();
  const [loading, setLoading] = useState(false);
  const isEditing = !!spaceId;
  const { t } = useTranslation();

  const pageTitle = isEditing ? t('spaceForm.editTitle') : t('spaceForm.createTitle');

  useEffect(() => {
    if (!isEditing) return;

    const loadSpace = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`${API_URL}/spaces/${spaceId}`, {
          headers: authHeaders()
        });
        form.setFieldsValue({
          name: data.name,
          type: data.type,
          description: data.description,
          capacity: data.capacity,
          hourlyRate: data.hourlyRate,
          dailyRate: data.dailyRate,
          monthlyRate: data.monthlyRate,
          amenities: Array.isArray(data.amenities) ? data.amenities : [],
          active: data.active !== false
        });
      } catch (error) {
        if (isDemoRestriction(error) || handleDemoRestriction(error)) return;
        message.error(error.response?.data?.message || error.response?.data?.error || t('common.errorLoading'));
      } finally {
        setLoading(false);
      }
    };

    loadSpace();
  }, [isEditing, spaceId, form, t]);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const payload = {
        name: values.name,
        type: values.type,
        capacity: values.capacity,
        hourlyRate: values.hourlyRate,
        dailyRate: values.dailyRate,
        monthlyRate: values.monthlyRate,
        description: values.description,
        amenities: Array.isArray(values.amenities) ? values.amenities : [],
        active: values.active
      };

      if (isEditing) {
        await axios.put(`${API_URL}/spaces/${spaceId}`, payload, {
          headers: authHeaders()
        });
        message.success(t('spaceForm.updated'));
      } else {
        await axios.post(`${API_URL}/spaces`, payload, {
          headers: authHeaders()
        });
        message.success(t('spaceForm.created'));
      }

      navigate('/spaces');
    } catch (error) {
      if (isDemoRestriction(error) || handleDemoRestriction(error)) return;
      message.error(error.response?.data?.message || error.response?.data?.error || t('spaceForm.saving'));
    } finally {
      setLoading(false);
    }
  };

  const amenityOptions = amenityOptionsConfig.map(({ value, key }) => ({
    value,
    label: t(`enums.amenity.${key}`)
  }));

  return (
    <div className="page-enter">
      <Row justify="space-between" align="middle" style={{ marginBottom: 32 }}>
        <Col>
          <Space align="center">
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/spaces')} style={{ fontSize: 20, padding: 0 }} />
            <Title level={2} style={{ margin: 0 }}>{pageTitle}</Title>
          </Space>
          <Text type="secondary" style={{ marginLeft: 44, fontSize: 16 }}>{t('spaceForm.subtitle')}</Text>
        </Col>
      </Row>
      <Spin spinning={loading}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Card style={{ marginBottom: 24 }}>
            <Title level={4}>{t('spaceForm.basicInfo')}</Title>
            <Row gutter={24}>
              <Col span={12}><Form.Item name="name" label={t('spaceForm.spaceName')} rules={[{ required: true, message: t('common.required') }]}><Input placeholder={t('spaceForm.spaceNamePlaceholder')} /></Form.Item></Col>
              <Col span={12}><Form.Item name="type" label={t('spaceForm.spaceType')} rules={[{ required: true, message: t('common.required') }]}><Select placeholder={t('spaceForm.selectType')}>{spaceTypeValues.map(value => <Option key={value} value={value}><Space>{spaceTypeIcons[value]}{t(`enums.spaceType.${value}`)}</Space></Option>)}</Select></Form.Item></Col>
            </Row>
            <Form.Item name="description" label={t('spaceForm.description')}><TextArea rows={3} /></Form.Item>
          </Card>
          <Card style={{ marginBottom: 24 }}>
            <Title level={4}>{t('spaceForm.detailsPricing')}</Title>
            <Row gutter={24}>
              <Col span={6}><Form.Item name="capacity" label={t('spaceForm.capacity')} rules={[{ required: true, message: t('common.required') }]}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item></Col>
              <Col span={6}><Form.Item name="hourlyRate" label={t('spaceForm.hourlyRate')} rules={[{ required: true, message: t('common.required') }]}><InputNumber min={0} step={0.5} style={{ width: '100%' }} /></Form.Item></Col>
              <Col span={6}><Form.Item name="dailyRate" label={t('spaceForm.dailyRate')}><InputNumber min={0} step={1} style={{ width: '100%' }} /></Form.Item></Col>
              <Col span={6}><Form.Item name="monthlyRate" label={t('spaceForm.monthlyRate')}><InputNumber min={0} step={1} style={{ width: '100%' }} /></Form.Item></Col>
            </Row>
          </Card>
          <Card style={{ marginBottom: 24 }}>
            <Title level={4}>{t('spaceForm.amenitiesStatus')}</Title>
            <Form.Item name="amenities" label={t('spaceForm.availableAmenities')}><Checkbox.Group options={amenityOptions} /></Form.Item>
            <Form.Item name="active" valuePropName="checked" initialValue={true}><Checkbox>{t('spaceForm.isActive')}</Checkbox></Form.Item>
          </Card>
          <Row justify="end"><Space><Button size="large" onClick={() => navigate('/spaces')}>{t('common.cancel')}</Button><Button type="primary" size="large" htmlType="submit" icon={<SaveOutlined />} loading={loading}>{isEditing ? t('spaceForm.saveChanges') : t('spaceForm.createSpace')}</Button></Space></Row>
        </Form>
      </Spin>
    </div>
  );
}

export default SpaceForm;
