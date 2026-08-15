import React, { useState, useEffect } from 'react';
import { Form, Input, Select, InputNumber, Button, Card, message, Spin, Space, Checkbox, Row, Col, Typography } from 'antd';
import { SaveOutlined, ArrowLeftOutlined, HomeOutlined, TeamOutlined, DesktopOutlined, PhoneOutlined, CalendarOutlined, StarOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const spaceTypes = [
  { value: 'OFFICE', label: 'Office', icon: <HomeOutlined /> },
  { value: 'MEETING_ROOM', label: 'Meeting Room', icon: <TeamOutlined /> },
  { value: 'DESK', label: 'Desk', icon: <DesktopOutlined /> },
  { value: 'COWORKING', label: 'Coworking', icon: <DesktopOutlined /> },
  { value: 'PHONE_BOOTH', label: 'Phone Booth', icon: <PhoneOutlined /> },
  { value: 'EVENT_SPACE', label: 'Event Space', icon: <CalendarOutlined /> },
  { value: 'COMMON_AREA', label: 'Common Area', icon: <StarOutlined /> },
];
const allAmenities = ['WiFi', 'Coffee/Kitchen', 'Projector/Screen', 'Parking', 'Power Outlets', 'Whiteboard', 'Air Conditioning'];

// La funzione ora riceve `onSave` e `spacesData` da App.jsx
function SpaceForm({ onSave, spacesData }) {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { spaceId } = useParams();
  const [loading, setLoading] = useState(false);
  const isEditing = !!spaceId;

  const pageTitle = isEditing ? 'Edit Space' : 'Create New Space';

  useEffect(() => {
    if (isEditing && spacesData) {
      const spaceToEdit = spacesData.find(s => s.id === parseInt(spaceId, 10));
      if (spaceToEdit) {
        form.setFieldsValue({
            ...spaceToEdit,
            amenities: spaceToEdit.amenities ? spaceToEdit.amenities.split(',').map(a => a.trim()) : []
        });
      }
    }
  }, [isEditing, spaceId, form, spacesData]);

  const handleSubmit = (values) => {
    setLoading(true);
    message.loading({ content: 'Saving...', key: 'save' });
    
    const payload = {
        ...values,
        amenities: values.amenities ? values.amenities.join(', ') : ''
    };

    if (isEditing) {
        onSave(parseInt(spaceId, 10), payload); // Passa ID e dati per la modifica
    } else {
        onSave(payload); // Passa solo i dati per la creazione
    }

    setTimeout(() => {
      message.success({ content: isEditing ? 'Space updated!' : 'Space created!', key: 'save' });
      setLoading(false);
      navigate('/spaces');
    }, 500);
  };

  return (
    <div className="page-enter">
      <Row justify="space-between" align="middle" style={{ marginBottom: 32 }}>
        <Col>
          <Space align="center">
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/spaces')} style={{ fontSize: 20, padding: 0 }} />
            <Title level={2} style={{ margin: 0 }}>{pageTitle}</Title>
          </Space>
          <Text type="secondary" style={{ marginLeft: 44, fontSize: 16 }}>Fill in the details to configure the workspace.</Text>
        </Col>
      </Row>
      <Spin spinning={loading}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Card style={{ marginBottom: 24 }}>
            <Title level={4}>Basic Information</Title>
            <Row gutter={24}>
              <Col span={12}><Form.Item name="name" label="Space Name" rules={[{ required: true }]}><Input placeholder="e.g., The Innovation Hub" /></Form.Item></Col>
              <Col span={12}><Form.Item name="type" label="Space Type" rules={[{ required: true }]}><Select placeholder="Select a type">{spaceTypes.map(t => <Option key={t.value} value={t.value}><Space>{t.icon}{t.label}</Space></Option>)}</Select></Form.Item></Col>
            </Row>
            <Form.Item name="description" label="Description"><TextArea rows={3} /></Form.Item>
          </Card>
          <Card style={{ marginBottom: 24 }}>
            <Title level={4}>Details & Pricing</Title>
            <Row gutter={24}>
              <Col span={8}><Form.Item name="capacity" label="Capacity (people)" rules={[{ required: true }]}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item></Col>
              <Col span={8}><Form.Item name="hourlyRate" label="Hourly Rate ($)"><InputNumber min={0} step={0.5} style={{ width: '100%' }} /></Form.Item></Col>
              <Col span={8}><Form.Item name="dailyRate" label="Daily Rate ($)"><InputNumber min={0} step={1} style={{ width: '100%' }} /></Form.Item></Col>
            </Row>
          </Card>
          <Card style={{ marginBottom: 24 }}>
            <Title level={4}>Location</Title>
             <Row gutter={24}>
              <Col span={8}><Form.Item name="building" label="Building"><Input /></Form.Item></Col>
              <Col span={8}><Form.Item name="floor" label="Floor"><Input /></Form.Item></Col>
              <Col span={8}><Form.Item name="room" label="Room/Number"><Input /></Form.Item></Col>
            </Row>
          </Card>
          <Card style={{ marginBottom: 24 }}>
            <Title level={4}>Amenities & Status</Title>
            <Form.Item name="amenities" label="Available Amenities"><Checkbox.Group options={allAmenities} /></Form.Item>
            <Form.Item name="isActive" valuePropName="checked" initialValue={true}><Checkbox>This space is active and bookable</Checkbox></Form.Item>
          </Card>
          <Row justify="end"><Space><Button size="large" onClick={() => navigate('/spaces')}>Cancel</Button><Button type="primary" size="large" htmlType="submit" icon={<SaveOutlined />} loading={loading}>{isEditing ? 'Save Changes' : 'Create Space'}</Button></Space></Row>
        </Form>
      </Spin>
    </div>
  );
}

export default SpaceForm;

