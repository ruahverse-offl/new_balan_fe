import React from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { ShoppingCart, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import Tooltip from '../common/Tooltip';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'];

const OrdersDashboard = ({ data }) => {
    if (!data || !data.kpis) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                <p>Loading orders dashboard data...</p>
            </div>
        );
    }

    const { kpis, alerts, charts } = data;

    return (
        <div className="dashboard-container">
            {/* KPIs */}
            <div className="stats-grid" style={{ marginBottom: '2rem' }}>
                <div className="stat-card">
                    <div className="stat-icon purple">
                        <ShoppingCart size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <h4>Total Orders</h4>
                            <Tooltip 
                                text="Total number of orders placed in the system during the selected time period, including all statuses."
                                icon={true}
                                position="top"
                            />
                        </div>
                        <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--admin-text-main)', margin: 0 }}>
                            {kpis.total_orders || 0}
                        </p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon blue">
                        <ShoppingCart size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <h4>Today's Orders</h4>
                            <Tooltip 
                                text="Number of orders placed today. Helps track daily order volume and operational workload."
                                icon={true}
                                position="top"
                            />
                        </div>
                        <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--admin-text-main)', margin: 0 }}>
                            {kpis.today_orders || 0}
                        </p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon green">
                        <CheckCircle size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <h4>Completed Orders</h4>
                            <Tooltip 
                                text="Orders that have been successfully delivered and completed. This represents fulfilled customer orders."
                                icon={true}
                                position="top"
                            />
                        </div>
                        <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--admin-text-main)', margin: 0 }}>
                            {kpis.completed_orders || 0}
                        </p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon orange">
                        <Clock size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <h4>Pending Orders</h4>
                            <Tooltip 
                                text="Orders that are currently being processed but not yet completed. These require attention to ensure timely fulfillment."
                                icon={true}
                                position="top"
                            />
                        </div>
                        <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--admin-text-main)', margin: 0 }}>
                            {kpis.pending_orders || 0}
                        </p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon purple">
                        <Clock size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <h4>Approval Pending</h4>
                            <Tooltip 
                                text="Orders waiting for administrative approval before they can be processed. These may require prescription verification or special handling."
                                icon={true}
                                position="top"
                            />
                        </div>
                        <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--admin-text-main)', margin: 0 }}>
                            {kpis.approval_pending || 0}
                        </p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon blue">
                        <XCircle size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <h4>Cancelled Orders</h4>
                            <Tooltip 
                                text="Orders that have been cancelled by customers or the system. High cancellation rates may indicate issues that need attention."
                                icon={true}
                                position="top"
                            />
                        </div>
                        <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--admin-text-main)', margin: 0 }}>
                            {kpis.cancelled_orders || 0}
                        </p>
                    </div>
                </div>
                {kpis.average_processing_time_hours && (
                    <div className="stat-card">
                        <div className="stat-icon green">
                            <Clock size={24} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                <h4>Avg Processing Time</h4>
                                <Tooltip 
                                    text="Average time taken from order placement to completion. Lower values indicate better operational efficiency."
                                    icon={true}
                                    position="top"
                                />
                            </div>
                            <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--admin-text-main)', margin: 0 }}>
                                {parseFloat(kpis.average_processing_time_hours).toFixed(1)} hrs
                            </p>
                        </div>
                    </div>
                )}
                {kpis.fulfillment_rate && (
                    <div className="stat-card">
                        <div className="stat-icon orange">
                            <CheckCircle size={24} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                <h4>Fulfillment Rate</h4>
                                <Tooltip 
                                    text="Percentage of orders successfully completed. Higher rates indicate better order fulfillment performance."
                                    icon={true}
                                    position="top"
                                />
                            </div>
                            <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--admin-text-main)', margin: 0 }}>
                                {parseFloat(kpis.fulfillment_rate).toFixed(1)}%
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Alerts */}
            {alerts && alerts.length > 0 && (
                <div className="admin-table-card" style={{ marginBottom: '2rem' }}>
                    <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <AlertTriangle size={20} color="orange" />
                        Alerts
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {alerts.map((alert, idx) => (
                            <div key={idx} style={{ 
                                padding: '1rem', 
                                background: alert.severity === 'CRITICAL' ? '#fee' : '#fff4e6',
                                borderRadius: '8px',
                                borderLeft: `4px solid ${alert.severity === 'CRITICAL' ? '#f00' : '#ff9800'}`
                            }}>
                                <strong>{alert.type.replace(/_/g, ' ')}</strong>: {alert.message}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Charts */}
            <div className="dashboard-grid-activity">
                {charts.orders_over_time && charts.orders_over_time.length > 0 && (
                    <div className="admin-table-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                            <h3>Orders Over Time</h3>
                            <Tooltip 
                                text="Shows the trend of order volume over time. Helps identify patterns, peak periods, and growth trends."
                                icon={true}
                                position="top"
                            />
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={charts.orders_over_time}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                    dataKey="date"
                                    label={{ value: 'Date', position: 'insideBottom', offset: -5 }}
                                />
                                <YAxis 
                                    label={{ value: 'Number of Orders', angle: -90, position: 'insideLeft' }}
                                />
                                <RechartsTooltip 
                                    formatter={(value) => [`${value} orders`, 'Orders']}
                                    labelFormatter={(label) => `Date: ${label}`}
                                    contentStyle={{ backgroundColor: '#1e293b', color: '#fff', border: 'none', borderRadius: '6px' }}
                                />
                                <Legend />
                                <Line 
                                    type="monotone" 
                                    dataKey="orders" 
                                    stroke="#8884d8" 
                                    strokeWidth={2}
                                    name="Orders"
                                    dot={{ r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {charts.order_status_distribution && charts.order_status_distribution.length > 0 && (
                    <div className="admin-table-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                            <h3>Order Status Distribution</h3>
                            <Tooltip 
                                text="Visual breakdown of orders by status (Pending, Completed, Cancelled, etc.). Helps understand order pipeline health."
                                icon={true}
                                position="top"
                            />
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={charts.order_status_distribution}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="count"
                                >
                                    {charts.order_status_distribution.map((entry, index) => (
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

                {charts.orders_by_source && charts.orders_by_source.length > 0 && (
                    <div className="admin-table-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                            <h3>Orders by Source</h3>
                            <Tooltip 
                                text="Distribution of orders by their origin (e.g., Online, Walk-in, Phone). Helps understand customer acquisition channels."
                                icon={true}
                                position="top"
                            />
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={charts.orders_by_source}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                    dataKey="label"
                                    label={{ value: 'Order Source', position: 'insideBottom', offset: -5 }}
                                />
                                <YAxis 
                                    label={{ value: 'Number of Orders', angle: -90, position: 'insideLeft' }}
                                />
                                <RechartsTooltip 
                                    formatter={(value) => [`${value} orders`, 'Orders']}
                                    labelFormatter={(label) => `Source: ${label}`}
                                    contentStyle={{ backgroundColor: '#1e293b', color: '#fff', border: 'none', borderRadius: '6px' }}
                                />
                                <Legend />
                                <Bar 
                                    dataKey="count" 
                                    fill="#82ca9d"
                                    name="Orders"
                                    radius={[8, 8, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {charts.processing_time_analysis && charts.processing_time_analysis.length > 0 && (
                    <div className="admin-table-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                            <h3>Processing Time Analysis</h3>
                            <Tooltip 
                                text="Average processing time by order status or category. Helps identify bottlenecks and optimize order fulfillment processes."
                                icon={true}
                                position="top"
                            />
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={charts.processing_time_analysis}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                    dataKey="label"
                                    angle={-45}
                                    textAnchor="end"
                                    height={80}
                                    label={{ value: 'Category/Status', position: 'insideBottom', offset: -5 }}
                                />
                                <YAxis 
                                    label={{ value: 'Average Time (hours)', angle: -90, position: 'insideLeft' }}
                                />
                                <RechartsTooltip 
                                    formatter={(value) => [`${value} hours`, 'Average Processing Time']}
                                    labelFormatter={(label) => `Category: ${label}`}
                                    contentStyle={{ backgroundColor: '#1e293b', color: '#fff', border: 'none', borderRadius: '6px' }}
                                />
                                <Legend />
                                <Bar 
                                    dataKey="average_time" 
                                    fill="#ffc658"
                                    name="Average Time"
                                    radius={[8, 8, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrdersDashboard;
