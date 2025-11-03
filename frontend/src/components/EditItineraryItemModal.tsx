import React, { useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Select, TimePicker, message } from 'antd';
import type { ItineraryItem } from '../types';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

interface EditItineraryItemModalProps {
  visible: boolean;
  item: ItineraryItem | null;
  dayNumber: number;
  onCancel: () => void;
  onSave: (item: ItineraryItem) => void;
  isNew?: boolean;
}

const EditItineraryItemModal: React.FC<EditItineraryItemModalProps> = ({
  visible,
  item,
  dayNumber,
  onCancel,
  onSave,
  isNew = false,
}) => {
  const [form] = Form.useForm();

  // 当 modal 打开或 item 变化时,填充表单
  useEffect(() => {
    if (visible && item) {
      form.setFieldsValue({
        time: item.time ? dayjs(item.time, 'HH:mm') : null,
        type: item.type,
        title: item.title,
        location: item.location,
        description: item.description,
        duration: item.duration,
        cost: item.cost,
        // 可选字段
        ticket_info: item.ticket_info,
        opening_hours: item.opening_hours,
        tips: item.tips,
        cuisine: item.cuisine,
        recommended_dishes: item.recommended_dishes?.join(', '),
      });
    } else if (visible && isNew) {
      // 新建时设置默认值
      form.resetFields();
      form.setFieldsValue({
        type: 'attraction',
        cost: 0,
      });
    }
  }, [visible, item, isNew, form]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      
      // 构造行程项数据
      const updatedItem: ItineraryItem = {
        time: values.time ? values.time.format('HH:mm') : '',
        type: values.type,
        title: values.title,
        location: values.location,
        description: values.description,
        duration: values.duration,
        cost: values.cost || 0,
      };

      // 根据类型添加特定字段
      if (values.type === 'attraction') {
        if (values.ticket_info) updatedItem.ticket_info = values.ticket_info;
        if (values.opening_hours) updatedItem.opening_hours = values.opening_hours;
        if (values.tips) updatedItem.tips = values.tips;
      } else if (values.type === 'restaurant') {
        if (values.cuisine) updatedItem.cuisine = values.cuisine;
        if (values.recommended_dishes) {
          updatedItem.recommended_dishes = values.recommended_dishes
            .split(',')
            .map((dish: string) => dish.trim())
            .filter((dish: string) => dish);
        }
      }

      onSave(updatedItem);
      message.success(isNew ? '添加成功' : '修改成功');
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  const itemType = Form.useWatch('type', form);

  return (
    <Modal
      title={isNew ? `添加 Day ${dayNumber} 行程项` : `编辑 Day ${dayNumber} 行程项`}
      open={visible}
      onCancel={onCancel}
      onOk={handleSave}
      width={700}
      okText={isNew ? '添加' : '保存'}
      cancelText="取消"
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        style={{ marginTop: 24 }}
      >
        <Form.Item
          name="time"
          label="时间"
          rules={[{ required: true, message: '请选择时间' }]}
        >
          <TimePicker format="HH:mm" style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="type"
          label="类型"
          rules={[{ required: true, message: '请选择类型' }]}
        >
          <Select placeholder="选择行程项类型">
            <Option value="attraction">景点</Option>
            <Option value="restaurant">餐厅</Option>
            <Option value="transport">交通</Option>
            <Option value="hotel">酒店</Option>
            <Option value="shopping">购物</Option>
            <Option value="other">其他</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="title"
          label="标题"
          rules={[{ required: true, message: '请输入标题' }]}
        >
          <Input placeholder="例如: 游览故宫" />
        </Form.Item>

        <Form.Item
          name="location"
          label="地点"
          rules={[{ required: true, message: '请输入地点' }]}
        >
          <Input placeholder="例如: 北京市东城区景山前街4号" />
        </Form.Item>

        <Form.Item
          name="description"
          label="描述"
          rules={[{ required: true, message: '请输入描述' }]}
        >
          <TextArea
            rows={3}
            placeholder="简要描述这个行程项的内容和特色"
          />
        </Form.Item>

        <Form.Item
          name="duration"
          label="时长 (分钟)"
        >
          <InputNumber
            min={0}
            style={{ width: '100%' }}
            placeholder="预计停留时长"
          />
        </Form.Item>

        <Form.Item
          name="cost"
          label="费用 (元)"
        >
          <InputNumber
            min={0}
            style={{ width: '100%' }}
            placeholder="预计花费"
          />
        </Form.Item>

        {/* 景点特有字段 */}
        {itemType === 'attraction' && (
          <>
            <Form.Item name="ticket_info" label="门票信息">
              <Input placeholder="例如: 成人票60元,学生票30元" />
            </Form.Item>

            <Form.Item name="opening_hours" label="开放时间">
              <Input placeholder="例如: 8:30-17:00" />
            </Form.Item>

            <Form.Item name="tips" label="游览提示">
              <TextArea
                rows={2}
                placeholder="游览建议和注意事项"
              />
            </Form.Item>
          </>
        )}

        {/* 餐厅特有字段 */}
        {itemType === 'restaurant' && (
          <>
            <Form.Item name="cuisine" label="菜系">
              <Input placeholder="例如: 川菜" />
            </Form.Item>

            <Form.Item name="recommended_dishes" label="推荐菜品">
              <Input placeholder="多个菜品用逗号分隔,例如: 宫保鸡丁, 麻婆豆腐" />
            </Form.Item>
          </>
        )}
      </Form>
    </Modal>
  );
};

export default EditItineraryItemModal;
