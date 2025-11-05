/**
 * 费用导出服务
 * 支持导出为Excel和CSV格式
 */

import * as XLSX from 'xlsx';
import type { Expense, ExpenseCategory } from '../types';

// 类别中文映射
const CATEGORY_MAP: Record<ExpenseCategory, string> = {
  transportation: '交通',
  accommodation: '住宿',
  food: '餐饮',
  ticket: '门票',
  shopping: '购物',
  entertainment: '娱乐',
  other: '其他',
};

// 支付方式中文映射
const PAYMENT_METHOD_MAP: Record<string, string> = {
  cash: '现金',
  credit_card: '信用卡',
  debit_card: '借记卡',
  mobile_payment: '移动支付',
  other: '其他',
};

/**
 * 导出费用为Excel
 */
export const exportExpensesToExcel = (
  expenses: Expense[],
  tripName: string,
  totalAmount: number,
  budget: number
) => {
  // 准备导出数据
  const data = expenses.map((expense, index) => ({
    序号: index + 1,
    日期: expense.expense_date,
    类别: CATEGORY_MAP[expense.category],
    金额: expense.amount,
    描述: expense.description || '-',
    支付方式: expense.payment_method
      ? PAYMENT_METHOD_MAP[expense.payment_method]
      : '-',
    备注: expense.notes || '-',
  }));

  // 添加汇总行
  data.push({
    序号: 0,
    日期: '',
    类别: '总计',
    金额: totalAmount,
    描述: '',
    支付方式: '',
    备注: '',
  });

  data.push({
    序号: 0,
    日期: '',
    类别: '预算',
    金额: budget,
    描述: '',
    支付方式: '',
    备注: '',
  });

  data.push({
    序号: 0,
    日期: '',
    类别: budget - totalAmount >= 0 ? '剩余' : '超支',
    金额: Math.abs(budget - totalAmount),
    描述: '',
    支付方式: '',
    备注: '',
  });

  // 创建工作表
  const ws = XLSX.utils.json_to_sheet(data);

  // 设置列宽
  ws['!cols'] = [
    { wch: 6 },  // 序号
    { wch: 12 }, // 日期
    { wch: 10 }, // 类别
    { wch: 10 }, // 金额
    { wch: 30 }, // 描述
    { wch: 12 }, // 支付方式
    { wch: 30 }, // 备注
  ];

  // 创建工作簿
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '费用明细');

  // 生成文件名
  const fileName = `${tripName}_费用明细_${new Date().toISOString().slice(0, 10)}.xlsx`;

  // 下载文件
  XLSX.writeFile(wb, fileName);
};

/**
 * 导出费用为CSV
 */
export const exportExpensesToCSV = (
  expenses: Expense[],
  tripName: string,
  totalAmount: number,
  budget: number
) => {
  // 准备CSV内容
  const headers = ['序号', '日期', '类别', '金额', '描述', '支付方式', '备注'];
  
  const rows = expenses.map((expense, index) => [
    index + 1,
    expense.expense_date,
    CATEGORY_MAP[expense.category],
    expense.amount,
    expense.description || '-',
    expense.payment_method ? PAYMENT_METHOD_MAP[expense.payment_method] : '-',
    expense.notes || '-',
  ]);

  // 添加汇总行
  rows.push(['', '', '总计', totalAmount, '', '', '']);
  rows.push(['', '', '预算', budget, '', '', '']);
  rows.push([
    '',
    '',
    budget - totalAmount >= 0 ? '剩余' : '超支',
    Math.abs(budget - totalAmount),
    '',
    '',
    '',
  ]);

  // 转换为CSV字符串
  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  // 添加BOM以支持中文
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

  // 创建下载链接
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${tripName}_费用明细_${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * 导出费用统计报告为Excel
 */
export const exportExpenseReportToExcel = (
  expenses: Expense[],
  tripName: string,
  totalAmount: number,
  budget: number,
  categoryStats: Array<{ category: string; amount: number; count: number; percentage: number }>
) => {
  // 创建工作簿
  const wb = XLSX.utils.book_new();

  // 1. 费用明细表
  const detailData = expenses.map((expense, index) => ({
    序号: index + 1,
    日期: expense.expense_date,
    类别: CATEGORY_MAP[expense.category],
    金额: expense.amount,
    描述: expense.description || '-',
    支付方式: expense.payment_method ? PAYMENT_METHOD_MAP[expense.payment_method] : '-',
  }));
  const wsDetail = XLSX.utils.json_to_sheet(detailData);
  XLSX.utils.book_append_sheet(wb, wsDetail, '费用明细');

  // 2. 分类统计表
  const categoryData = categoryStats.map((stat, index) => ({
    序号: index + 1,
    类别: CATEGORY_MAP[stat.category as ExpenseCategory],
    笔数: stat.count,
    金额: stat.amount,
    占比: `${stat.percentage.toFixed(1)}%`,
  }));
  const wsCategory = XLSX.utils.json_to_sheet(categoryData);
  XLSX.utils.book_append_sheet(wb, wsCategory, '分类统计');

  // 3. 预算汇总表
  const summaryData = [
    { 项目: '预算', 金额: budget },
    { 项目: '实际支出', 金额: totalAmount },
    { 项目: budget - totalAmount >= 0 ? '剩余' : '超支', 金额: Math.abs(budget - totalAmount) },
    { 项目: '使用率', 金额: `${((totalAmount / budget) * 100).toFixed(1)}%` },
  ];
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, '预算汇总');

  // 生成文件名
  const fileName = `${tripName}_费用报告_${new Date().toISOString().slice(0, 10)}.xlsx`;

  // 下载文件
  XLSX.writeFile(wb, fileName);
};
