import React from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { IndianRupee, TrendingUp, ShoppingCart, AlertTriangle } from 'lucide-react';
import Tooltip from '../common/Tooltip';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'];

const FinanceDashboard = ({ data }) => {
    if (!data || !data.kpis) {
        return (
            <div className="dashboard-container">
                <div className="dashboard-loading">Loading finance dashboard data…</div>
            </div>
        );
    }

    const { kpis, alerts, charts } = data;

    return (
        <div className="dashboard-container">
            <section className="dashboard-section">
                <h2 className="dashboard-section-title">Key metrics</h2>
                <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon purple">
                        <IndianRupee size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <h4>Total Revenue</h4>
                            <Tooltip 
                                text="Total revenue generated from all completed orders during the selected time period. This is the sum of all order values."
                                icon={true}
                                position="top"
                            />
                        </div>
                        <p className="stat-value">₹{parseFloat(kpis.total_revenue || 0).toLocaleString('en-IN')}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon blue">
                        <IndianRupee size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <h4>Today's Revenue</h4>
                            <Tooltip 
                                text="Revenue generated from orders completed today. Provides a quick view of daily performance."
                                icon={true}
                                position="top"
                            />
                        </div>
                        <p className="stat-value">₹{parseFloat(kpis.today_revenue || 0).toLocaleString('en-IN')}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon green">
                        <IndianRupee size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <h4>Month Revenue</h4>
                            <Tooltip 
                                text="Total revenue generated in the current month. Helps track monthly financial performance."
                                icon={true}
                                position="top"
                            />
                        </div>
                        <p className="stat-value">₹{parseFloat(kpis.month_revenue || 0).toLocaleString('en-IN')}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon orange">
                        <ShoppingCart size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <h4>Total Orders</h4>
                            <Tooltip 
                                text="Total number of orders that contributed to revenue. This includes all completed orders in the period."
                                icon={true}
                                position="top"
                            />
                        </div>
                        <p className="stat-value">{kpis.total_orders || 0}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon purple">
                        <TrendingUp size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <h4>Average Order Value</h4>
                            <Tooltip 
                                text="Average revenue per order, calculated by dividing total revenue by the number of orders. Higher values indicate better customer spending."
                                icon={true}
                                position="top"
                            />
                        </div>
                        <p className="stat-value">₹{parseFloat(kpis.average_order_value || 0).toLocaleString('en-IN')}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon blue">
                        <TrendingUp size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <h4>Growth Rate</h4>
                            <Tooltip 
                                text="Percentage change in revenue compared to the previous period. Positive values indicate growth, negative values indicate decline."
                                icon={true}
                                position="top"
                            />
                        </div>
                        <p className="stat-value">{parseFloat(kpis.revenue_growth_rate || 0).toFixed(2)}%</p>
                    </div>
                </div>
                </div>
            </section>

            {alerts && alerts.length > 0 && (
                <section className="dashboard-section">
                    <h2 className="dashboard-section-title">Alerts</h2>
                    <div className="admin-table-card">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {alerts.map((alert, idx) => (
                            <div key={idx} className={`alert-item ${alert.severity === 'CRITICAL' ? 'critical' : 'warning'}`}>
                                <strong>{alert.type.replace(/_/g, ' ')}</strong>: {alert.message}
                            </div>
                        ))}
                    </div>
                    </div>
                </section>
            )}

            <section className="dashboard-section">
                <h2 className="dashboard-section-title">Insights</h2>
                <div className="dashboard-grid-activity">
                {charts.revenue_trend && charts.revenue_trend.length > 0 && (
                    <div className="admin-table-card">
                        <div className="chart-header">
                            <h3 className="chart-title">Revenue Trend</h3>
                            <Tooltip 
                                text="Shows revenue trends over time. Helps identify growth patterns, seasonal variations, and performance trends."
                                icon={true}
                                position="top"
                            />
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={charts.revenue_trend}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                    dataKey="date"
                                    label={{ value: 'Date', position: 'insideBottom', offset: -5 }}
                                />
                                <YAxis 
                                    label={{ value: 'Revenue (₹)', angle: -90, position: 'insideLeft' }}
                                />
                                <RechartsTooltip 
                                    formatter={(value) => [`₹${parseFloat(value).toLocaleString('en-IN')}`, 'Revenue']}
                                    labelFormatter={(label) => `Date: ${label}`}
                                    contentStyle={{ backgroundColor: '#1e293b', color: '#fff', border: 'none', borderRadius: '6px' }}
                                />
                                <Legend />
                                <Line 
                                    type="monotone" 
                                    dataKey="revenue" 
                                    stroke="#8884d8" 
                                    strokeWidth={2}
                                    name="Revenue"
                                    dot={{ r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {charts.payment_method_distribution && charts.payment_method_distribution.length > 0 && (
                    <div className="admin-table-card">
                        <div className="chart-header">
                            <h3 className="chart-title">Payment Method Distribution</h3>
                            <Tooltip 
                                text="Breakdown of orders by payment method (Cash, Card, UPI, etc.). Helps understand customer payment preferences."
                                icon={true}
                                position="top"
                            />
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={charts.payment_method_distribution}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="count"
                                >
                                    {charts.payment_method_distribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip 
                                    formatter={(value, name) => [`${value} orders`, name]}
                                    contentStyle={{ backgroundColor: '#1e293b', color: '#fff', border: 'none', borderRadius: '6px' }}
                                />
                                <Legend 
                                    verticalAlign="bottom"
                                    height={36}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {charts.order_status_distribution && charts.order_status_distribution.length > 0 && (
                    <div className="admin-table-card">
                        <div className="chart-header">
                            <h3 className="chart-title">Order Status Distribution</h3>
                            <Tooltip 
                                text="Distribution of orders by status. Helps understand the order pipeline and identify areas needing attention."
                                icon={true}
                                position="top"
                            />
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={charts.order_status_distribution}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                    dataKey="label"
                                    label={{ value: 'Order Status', position: 'insideBottom', offset: -5 }}
                                />
                                <YAxis 
                                    label={{ value: 'Number of Orders', angle: -90, position: 'insideLeft' }}
                                />
                                <RechartsTooltip 
                                    formatter={(value) => [`${value} orders`, 'Orders']}
                                    labelFormatter={(label) => `Status: ${label}`}
                                    contentStyle={{ backgroundColor: '#1e293b', color: '#fff', border: 'none', borderRadius: '6px' }}
                                />
                                <Legend />
                                <Bar 
                                    dataKey="count" 
                                    fill="#8884d8"
                                    name="Orders"
                                    radius={[8, 8, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {charts.monthly_revenue_trend && charts.monthly_revenue_trend.length > 0 && (
                    <div className="admin-table-card">
                        <div className="chart-header">
                            <h3 className="chart-title">Monthly Revenue Trend</h3>
                            <Tooltip 
                                text="Monthly revenue trends over an extended period. Helps identify long-term growth patterns and seasonal trends."
                                icon={true}
                                position="top"
                            />
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={charts.monthly_revenue_trend}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                    dataKey="date"
                                    label={{ value: 'Month', position: 'insideBottom', offset: -5 }}
                                />
                                <YAxis 
                                    label={{ value: 'Revenue (₹)', angle: -90, position: 'insideLeft' }}
                                />
                                <RechartsTooltip 
                                    formatter={(value) => [`₹${parseFloat(value).toLocaleString('en-IN')}`, 'Revenue']}
                                    labelFormatter={(label) => `Month: ${label}`}
                                    contentStyle={{ backgroundColor: '#1e293b', color: '#fff', border: 'none', borderRadius: '6px' }}
                                />
                                <Legend />
                                <Line 
                                    type="monotone" 
                                    dataKey="revenue" 
                                    stroke="#82ca9d" 
                                    strokeWidth={2}
                                    name="Revenue"
                                    dot={{ r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
                </div>
            </section>
        </div>
    );
};

export default FinanceDashboard;
