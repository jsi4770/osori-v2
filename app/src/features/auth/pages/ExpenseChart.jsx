import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import styles from './MyAccountBook.module.css';

ChartJS.register(ArcElement, Tooltip, Legend);

function ExpenseChart({ transactions = [], currentDate }) {
  if (!currentDate || !(currentDate instanceof Date)) return null;
  const targetYear = currentDate.getFullYear();
  const targetMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
  const targetYM = `${targetYear}-${targetMonth}`;

  const expenses = transactions.filter(t => 
    t.type?.toUpperCase() === 'OUT' && 
    t.date.startsWith(targetYM)
  );

  const VALID_CATEGORIES = ['식비', '생활/마트', '쇼핑', '의료/건강', '교통', '문화/여가', '교육', '기타'];

  const analysisData = expenses.reduce((acc, curr) => {
    const category = VALID_CATEGORIES.includes(curr.category) ? curr.category : '기타';
    
    acc[category] = (acc[category] || 0) + Math.abs(curr.amount);
    return acc;
  }, {});

  const labels = VALID_CATEGORIES.filter(cat => analysisData[cat] > 0);
  const dataValues = labels.map(cat => analysisData[cat]);

  const totalExpenditure = dataValues.reduce((sum, val) => sum + val, 0);

  const data = {
    labels: labels,
    datasets: [
      {
        data: dataValues,
        backgroundColor: [
          '#FF6384', '#4BC0C0', '#FFCE56', '#36A2EB', '#9966FF', '#FF9F40', '#65be71', '#C9CBCF'
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        align: 'center',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          font: { size: 12, weight: 'bold' }
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => ` ${context.label}: ${context.raw.toLocaleString()}원`
        }
      }
    },
    layout: { padding: { left: 10, right: 10 } }
  };

  if (expenses.length === 0) {
    return (
      <div className={styles['chart-card']}>
        <h3>📊 카테고리 별 소비 분석</h3>
        <p style={{ padding: '50px 0', color: '#888', textAlign: 'center' }}>분석할 지출 내역이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className={styles['chart-card']}>
      <h3>📊 카테고리 별 소비 분석</h3>
      <div className={styles['chart-main-container']}>
        <Doughnut data={data} options={options}/>
      </div>
      <div className={styles['chart-summary']}>
          총 지출: <strong> {totalExpenditure.toLocaleString()}원 </strong>
      </div>
    </div>
  );
}

export default ExpenseChart;