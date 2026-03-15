import React from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { Package, AlertTriangle, TrendingDown } from 'lucide-react';
import Tooltip from '../common/Tooltip';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'];

const InventoryDashboard = ({ data }) => {
    if (!data || !data.kpis) {
        return (
            <div className="dashboard-container">
                <div className="dashboard-loading">Loading inventory dashboard data…</div>
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
                        <Package size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <h4>Total Stock Value</h4>
                            <Tooltip 
                                text="Total monetary value of all inventory items currently in stock. Calculated as sum of (quantity × unit price) for all products."
                                icon={true}
                                position="top"
                            />
                        </div>
                        <p className="stat-value">₹{parseFloat(kpis.total_stock_value || 0).toLocaleString('en-IN')}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon blue">
                        <Package size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <h4>Total Stock Quantity</h4>
                            <Tooltip 
                                text="Total number of units across all products in inventory. This represents the physical count of items available."
                                icon={true}
                                position="top"
                            />
                        </div>
                        <p className="stat-value">{kpis.total_stock_quantity || 0} units</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon green">
                        <Package size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <h4>Active Products</h4>
                            <Tooltip 
                                text="Number of distinct products that are currently active and available in the inventory system."
                                icon={true}
                                position="top"
                            />
                        </div>
                        <p className="stat-value">{kpis.total_active_products || 0}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon orange">
                        <AlertTriangle size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <h4>Low Stock Items</h4>
                            <Tooltip 
                                text="Products with stock levels below the configured threshold. These items need immediate restocking to avoid stockouts."
                                icon={true}
                                position="top"
                            />
                        </div>
                        <p className="stat-value">{kpis.low_stock_count || 0}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon purple">
                        <TrendingDown size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <h4>Out of Stock</h4>
                            <Tooltip 
                                text="Products that have zero quantity available. These items cannot be sold until restocked."
                                icon={true}
                                position="top"
                            />
                        </div>
                        <p className="stat-value">{kpis.out_of_stock_count || 0}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon blue">
                        <AlertTriangle size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <h4>Expiring Soon</h4>
                            <Tooltip 
                                text="Products that are approaching their expiry date within the configured timeframe (default: 30 days). These need priority selling."
                                icon={true}
                                position="top"
                            />
                        </div>
                        <p className="stat-value">{kpis.expiring_soon_count || 0}</p>
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
                                {alert.medicine_brand_name && <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>Product: {alert.medicine_brand_name}</div>}
                            </div>
                        ))}
                    </div>
                    </div>
                </section>
            )}

            <section className="dashboard-section">
                <h2 className="dashboard-section-title">Insights</h2>
                <div className="dashboard-grid-activity">
                {charts.stock_value_trend && charts.stock_value_trend.length > 0 && (
                    <div className="admin-table-card">
                        <div className="chart-header">
                            <h3 className="chart-title">Stock Value Trend</h3>
                            <Tooltip 
                                text="Shows the trend of total inventory value over time. Helps track inventory investment and identify patterns."
                                icon={true}
                                position="top"
                            />
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={charts.stock_value_trend}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                    dataKey="date" 
                                    label={{ value: 'Date', position: 'insideBottom', offset: -5 }}
                                />
                                <YAxis 
                                    label={{ value: 'Value (₹)', angle: -90, position: 'insideLeft' }}
                                />
                                <RechartsTooltip 
                                    formatter={(value) => [`₹${parseFloat(value).toLocaleString('en-IN')}`, 'Stock Value']}
                                    labelFormatter={(label) => `Date: ${label}`}
                                    contentStyle={{ backgroundColor: '#1e293b', color: '#fff', border: 'none', borderRadius: '6px' }}
                                />
                                <Legend />
                                <Line 
                                    type="monotone" 
                                    dataKey="value" 
                                    stroke="#8884d8" 
                                    strokeWidth={2}
                                    name="Stock Value"
                                    dot={{ r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {charts.stock_by_category && charts.stock_by_category.length > 0 && (
                    <div className="admin-table-card">
                        <div className="chart-header">
                            <h3 className="chart-title">Stock by Category</h3>
                            <Tooltip 
                                text="Distribution of inventory value across different product categories. Helps identify which categories hold the most inventory value."
                                icon={true}
                                position="top"
                            />
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={charts.stock_by_category}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                    dataKey="label" 
                                    angle={-45}
                                    textAnchor="end"
                                    height={80}
                                    label={{ value: 'Category', position: 'insideBottom', offset: -5 }}
                                />
                                <YAxis 
                                    label={{ value: 'Stock Value (₹)', angle: -90, position: 'insideLeft' }}
                                />
                                <RechartsTooltip 
                                    formatter={(value) => [`₹${parseFloat(value).toLocaleString('en-IN')}`, 'Stock Value']}
                                    labelFormatter={(label) => `Category: ${label}`}
                                    contentStyle={{ backgroundColor: '#1e293b', color: '#fff', border: 'none', borderRadius: '6px' }}
                                />
                                <Legend />
                                <Bar 
                                    dataKey="value" 
                                    fill="#82ca9d"
                                    name="Stock Value"
                                    radius={[8, 8, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {charts.top_products && charts.top_products.length > 0 && (
                    <div className="admin-table-card">
                        <div className="chart-header">
                            <h3 className="chart-title">Top Products by Stock Value</h3>
                            <Tooltip 
                                text="Products with the highest inventory value. These represent the most significant investments in stock."
                                icon={true}
                                position="top"
                            />
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={charts.top_products} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                    type="number"
                                    label={{ value: 'Stock Value (₹)', position: 'insideBottom', offset: -5 }}
                                />
                                <YAxis 
                                    dataKey="label" 
                                    type="category" 
                                    width={150}
                                    tick={{ fontSize: 12 }}
                                />
                                <RechartsTooltip 
                                    formatter={(value) => [`₹${parseFloat(value).toLocaleString('en-IN')}`, 'Stock Value']}
                                    labelFormatter={(label) => `Product: ${label}`}
                                    contentStyle={{ backgroundColor: '#1e293b', color: '#fff', border: 'none', borderRadius: '6px' }}
                                />
                                <Legend />
                                <Bar 
                                    dataKey="value" 
                                    fill="#ffc658"
                                    name="Stock Value"
                                    radius={[0, 8, 8, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {charts.stock_distribution && charts.stock_distribution.length > 0 && (
                    <div className="admin-table-card">
                        <div className="chart-header">
                            <h3 className="chart-title">Stock Distribution</h3>
                            <Tooltip 
                                text="Visual representation of how inventory is distributed across different stock status categories (e.g., In Stock, Low Stock, Out of Stock)."
                                icon={true}
                                position="top"
                            />
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={charts.stock_distribution}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="count"
                                >
                                    {charts.stock_distribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip 
                                    formatter={(value, name) => [`${value} items`, name]}
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
                </div>
            </section>
        </div>
    );
};

export default InventoryDashboard;
