export type InsightKey =
  | 'top_category_spend'
  | 'spending_dropped'
  | 'fast_log_milestone'
  | 'most_expensive_day'
  | 'subscription_check'
  | 'no_spend_count'
  | 'net_positive_streak'
  | 'transaction_speed_avg'
  | 'mystery_pattern';

export interface InsightBody {
  title: string;
  description: string;
  icon: string; // lucide icon name
}

export interface InsightData {
  topCategory?: { name: string; amount: number };
  droppedCategory?: { name: string; pct: number };
  fastLogPct?: number;
  mostExpensiveDay?: string;
  subscriptionAmount?: number;
  noSpendCount?: number;
  netPositiveWeeks?: number;
  avgMinutes?: number;
  mysteryDay?: string;
  mysteryDayAmount?: number;
}

export function renderInsightBody(key: InsightKey, data: InsightData): InsightBody {
  switch (key) {
    case 'top_category_spend':
      return {
        title: data.topCategory?.name ?? 'Spending',
        description: `Your biggest category this week at ฿${Math.round(data.topCategory?.amount ?? 0).toLocaleString()}.`,
        icon: 'BarChart2',
      };
    case 'spending_dropped':
      return {
        title: 'Spending dropped',
        description: `You spent ${data.droppedCategory?.pct ?? 0}% less on ${data.droppedCategory?.name ?? 'that category'} compared to last week.`,
        icon: 'TrendingDown',
      };
    case 'fast_log_milestone':
      return {
        title: 'Quick capture',
        description: `You logged ${data.fastLogPct ?? 0}% of transactions within 5 minutes this week.`,
        icon: 'Zap',
      };
    case 'most_expensive_day':
      return {
        title: data.mostExpensiveDay ?? 'Big day',
        description: `Your most expensive day this week.`,
        icon: 'Calendar',
      };
    case 'subscription_check':
      return {
        title: 'Subscriptions',
        description: `You've spent ฿${Math.round(data.subscriptionAmount ?? 0).toLocaleString()} on subscriptions this month.`,
        icon: 'Repeat',
      };
    case 'no_spend_count':
      return {
        title: `${data.noSpendCount} no-spend day${(data.noSpendCount ?? 0) !== 1 ? 's' : ''}`,
        description: 'Days this week where you chose not to spend.',
        icon: 'Leaf',
      };
    case 'net_positive_streak':
      return {
        title: `${data.netPositiveWeeks} weeks net-positive`,
        description: "You've kept income above expenses every week in this streak.",
        icon: 'TrendingUp',
      };
    case 'transaction_speed_avg':
      return {
        title: 'Logging speed',
        description: `On average, you logged ${data.avgMinutes ?? 0} minutes after each purchase this week.`,
        icon: 'Timer',
      };
    case 'mystery_pattern':
      return {
        title: `${data.mysteryDay ?? 'Interesting'}s`,
        description: `You tend to spend more on ${data.mysteryDay ?? 'this day'} — ฿${Math.round(data.mysteryDayAmount ?? 0).toLocaleString()} average.`,
        icon: 'Sparkles',
      };
  }
}
