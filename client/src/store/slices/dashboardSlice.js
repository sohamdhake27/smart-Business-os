import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getInsights } from '../../api/ai.api';
import { getChartData } from '../../api/analytics.api';
import { getTransactions, getTransactionSummary } from '../../api/transaction.api';

const initialState = {
  summary: null,
  chartData: null,
  recentTransactions: [],
  insights: null,
  loading: false,
  error: null
};

export const fetchDashboardData = createAsyncThunk(
  'dashboard/fetchDashboardData',
  async ({ period, chartView }, { rejectWithValue }) => {
    try {
      const [summaryRes, chartRes, transactionsRes, insightsRes] = await Promise.all([
        getTransactionSummary(period),
        getChartData({ view: chartView }),
        getTransactions({ limit: 5, sortBy: 'date', sortOrder: 'desc' }),
        getInsights()
      ]);

      return {
        summary: summaryRes.data.data,
        chartData: chartRes.data.data,
        recentTransactions: transactionsRes.data.data,
        insights: insightsRes.data.data
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Dashboard load failed');
    }
  }
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.summary = action.payload.summary;
        state.chartData = action.payload.chartData;
        state.recentTransactions = action.payload.recentTransactions;
        state.insights = action.payload.insights;
        state.loading = false;
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export default dashboardSlice.reducer;
