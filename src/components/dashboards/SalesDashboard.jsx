import React from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Package, Users } from 'lucide-react';
import Tooltip from '../common/Tooltip';

const SalesDashboard = ({ data }) => {
    if (!data || !data.kpis) {
        return (
            <div className="dashboard-container">
                <div className="dashboard-loading">Loading sales dashboard data…</div>
            </div>
        );
    }

    const { kpis, charts } = data;

    return (
        <div className="dashboard-container">
            {/* KPIs */}
            <div className="stats-grid" style={{ marginBottom: '2rem' }}>
                <div className="stat-card">
                    <div className="stat-icon purple">
                        <Package size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <h4>Total Sales Quantity</h4>
                            <Tooltip 
                                text="Total number of units sold across all products during the selected time period."
                                icon={true}
                                position="top"
                            />
                        </div>
                        <p className="stat-value">{kpis.total_sales_quantity || 0} units</p>
                    </div>
                </div>
                {kpis.top_selling_product && (
                    <div className="stat-card">
                        <div className="stat-icon blue">
                            <TrendingUp size={24} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                <h4>Top Selling Product</h4>
                                <Tooltip 
                                    text="The product with the highest sales quantity during the selected period."
                                    icon={true}
                                    position="top"
                                />
                            </div>
                            <p className="stat-value subdued">{kpis.top_selling_product}</p>
                        </div>
                    </div>
                )}
                {kpis.sales_growth_rate && (
                    <div className="stat-card">
                        <div className="stat-icon green">
                            <TrendingUp size={24} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                <h4>Sales Growth Rate</h4>
                                <Tooltip 
                                    text="Percentage change in sales compared to the previous period. Positive values indicate growth, negative values indicate decline."
                                    icon={true}
                                    position="top"
                                />
                            </div>
                            <p className="stat-value">{parseFloat(kpis.sales_growth_rate).toFixed(2)}%</p>
                        </div>
                    </div>
                )}
                {kpis.average_sales_per_day && (
                    <div className="stat-card">
                        <div className="stat-icon orange">
                            <Package size={24} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                <h4>Avg Sales Per Day</h4>
                                <Tooltip 
                                    text="Average number of units sold per day, calculated by dividing total sales by the number of days in the period."
                                    icon={true}
                                    position="top"
                                />
                            </div>
                            <p className="stat-value">{parseFloat(kpis.average_sales_per_day).toFixed(0)} units/day</p>
                        </div>
                    </div>
                )}
                <div className="stat-card">
                    <div className="stat-icon purple">
                        <Users size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <h4>Customer Count</h4>
                            <Tooltip 
                                text="Total number of unique customers who made purchases during the selected time period."
                                icon={true}
                                position="top"
                            />
                        </div>
                        <p className="stat-value">{kpis.customer_count || 0}</p>
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="dashboard-grid-activity">
                {charts.top_products && charts.top_products.length > 0 && (
                    <div className="admin-table-card">
                        <div className="chart-header">
                            <h3 className="chart-title">Top Selling Products</h3>
                            <Tooltip 
                                text="Products ranked by total sales quantity. Helps identify best-performing products and focus marketing efforts."
                                icon={true}
                                position="top"
                            />
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={charts.top_products} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                    type="number"
                                    label={{ value: 'Sales Quantity', position: 'insideBottom', offset: -5 }}
                                />
                                <YAxis 
                                    dataKey="label" 
                                    type="category" 
                                    width={150}
                                    tick={{ fontSize: 12 }}
                                />
                                <RechartsTooltip 
                                    formatter={(value) => [`${value} units`, 'Sales Quantity']}
                                    labelFormatter={(label) => `Product: ${label}`}
                                    contentStyle={{ backgroundColor: '#1e293b', color: '#fff', border: 'none', borderRadius: '6px' }}
                                />
                                <Legend />
                                <Bar 
                                    dataKey="quantity" 
                                    fill="#8884d8"
                                    name="Sales Quantity"
                                    radius={[0, 8, 8, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {charts.sales_by_category && charts.sales_by_category.length > 0 && (
                    <div className="admin-table-card">
                        <div className="chart-header">
                            <h3 className="chart-title">Sales by Category</h3>
                            <Tooltip 
                                text="Sales distribution across different product categories. Helps understand which categories drive the most sales."
                                icon={true}
                                position="top"
                            />
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={charts.sales_by_category}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                    dataKey="label"
                                    angle={-45}
                                    textAnchor="end"
                                    height={80}
                                    label={{ value: 'Category', position: 'insideBottom', offset: -5 }}
                                />
                                <YAxis 
                                    label={{ value: 'Sales Quantity', angle: -90, position: 'insideLeft' }}
                                />
                                <RechartsTooltip 
                                    formatter={(value) => [`${value} units`, 'Sales Quantity']}
                                    labelFormatter={(label) => `Category: ${label}`}
                                    contentStyle={{ backgroundColor: '#1e293b', color: '#fff', border: 'none', borderRadius: '6px' }}
                                />
                                <Legend />
                                <Bar 
                                    dataKey="quantity" 
                                    fill="#82ca9d"
                                    name="Sales Quantity"
                                    radius={[8, 8, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {charts.sales_trend && charts.sales_trend.length > 0 && (
                    <div className="admin-table-card">
                        <div className="chart-header">
                            <h3 className="chart-title">Sales Trend</h3>
                            <Tooltip 
                                text="Shows sales quantity and revenue trends over time. Helps identify patterns, seasonal trends, and growth trajectories."
                                icon={true}
                                position="top"
                            />
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={charts.sales_trend}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                    dataKey="date"
                                    label={{ value: 'Date', position: 'insideBottom', offset: -5 }}
                                />
                                <YAxis 
                                    yAxisId="left"
                                    label={{ value: 'Quantity', angle: -90, position: 'insideLeft' }}
                                />
                                {charts.sales_trend[0]?.revenue && (
                                    <YAxis 
                                        yAxisId="right"
                                        orientation="right"
                                        label={{ value: 'Revenue (₹)', angle: 90, position: 'insideRight' }}
                                    />
                                )}
                                <RechartsTooltip 
                                    formatter={(value, name) => {
                                        if (name === 'Revenue') {
                                            return [`₹${parseFloat(value).toLocaleString('en-IN')}`, name];
                                        }
                                        return [`${value} units`, name];
                                    }}
                                    labelFormatter={(label) => `Date: ${label}`}
                                    contentStyle={{ backgroundColor: '#1e293b', color: '#fff', border: 'none', borderRadius: '6px' }}
                                />
                                <Legend />
                                <Line 
                                    yAxisId="left"
                                    type="monotone" 
                                    dataKey="quantity" 
                                    stroke="#8884d8" 
                                    strokeWidth={2} 
                                    name="Quantity"
                                    dot={{ r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                                {charts.sales_trend[0]?.revenue && (
                                    <Line 
                                        yAxisId="right"
                                        type="monotone" 
                                        dataKey="revenue" 
                                        stroke="#82ca9d" 
                                        strokeWidth={2} 
                                        name="Revenue"
                                        dot={{ r: 4 }}
                                        activeDot={{ r: 6 }}
                                    />
                                )}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {charts.sales_by_dosage_form && charts.sales_by_dosage_form.length > 0 && (
                    <div className="admin-table-card">
                        <div className="chart-header">
                            <h3 className="chart-title">Sales by Dosage Form</h3>
                            <Tooltip 
                                text="Sales distribution across different dosage forms (e.g., Tablets, Capsules, Syrups). Helps understand customer preferences."
                                icon={true}
                                position="top"
                            />
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={charts.sales_by_dosage_form}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                    dataKey="label"
                                    angle={-45}
                                    textAnchor="end"
                                    height={80}
                                    label={{ value: 'Dosage Form', position: 'insideBottom', offset: -5 }}
                                />
                                <YAxis 
                                    label={{ value: 'Sales Quantity', angle: -90, position: 'insideLeft' }}
                                />
                                <RechartsTooltip 
                                    formatter={(value) => [`${value} units`, 'Sales Quantity']}
                                    labelFormatter={(label) => `Dosage Form: ${label}`}
                                    contentStyle={{ backgroundColor: '#1e293b', color: '#fff', border: 'none', borderRadius: '6px' }}
                                />
                                <Legend />
                                <Bar 
                                    dataKey="quantity" 
                                    fill="#ffc658"
                                    name="Sales Quantity"
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

export default SalesDashboard;
