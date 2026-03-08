/**
 * Generates and prints a professional invoice for an order.
 * @param {Object} order - The order object containing details.
 */
export const downloadInvoice = (order) => {
    const printWindow = window.open('', '', 'width=800,height=600');

    if (!printWindow) {
        alert('Please allow popups to download the invoice.');
        return;
    }

    const companyDetails = {
        name: 'New Balan Medical Shop',
        address: '123 Health Street, Wellness Nagar',
        city: 'Chennai',
        pincode: '600001',
        phone: '+91 98765 43210',
        email: 'support@newbalan.com',
        website: 'www.newbalan.com'
    };

    const styles = `
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
            body { 
                font-family: 'Inter', sans-serif; 
                padding: 40px; 
                color: #1f2937; 
                line-height: 1.5;
                max-width: 800px;
                margin: 0 auto;
            }
            .header { 
                display: flex; 
                justify-content: space-between; 
                border-bottom: 2px solid #e5e7eb; 
                padding-bottom: 20px; 
                margin-bottom: 30px;
            }
            .logo { 
                font-size: 24px; 
                font-weight: 800; 
                color: #0056b3; 
                margin-bottom: 5px;
            }
            .company-info { font-size: 14px; color: #6b7280; }
            .invoice-title { 
                text-align: right; 
            }
            .invoice-heading { 
                font-size: 32px; 
                font-weight: 700; 
                color: #111827; 
                margin: 0;
            }
            .invoice-details { 
                margin-top: 10px; 
                font-size: 14px; 
            }
            .bill-to { 
                margin-bottom: 30px; 
                background: #f9fafb; 
                padding: 20px; 
                border-radius: 8px; 
            }
            .bill-to h3 { 
                margin: 0 0 10px; 
                font-size: 16px; 
                color: #374151; 
                text-transform: uppercase; 
                letter-spacing: 0.05em;
            }
            table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-bottom: 30px; 
            }
            th { 
                background: #f3f4f6; 
                padding: 12px; 
                text-align: left; 
                font-weight: 600; 
                font-size: 14px;
                color: #374151;
            }
            td { 
                padding: 12px; 
                border-bottom: 1px solid #e5e7eb; 
                font-size: 14px;
            }
            .totals { 
                display: flex; 
                justify-content: flex-end; 
            }
            .totals-table { 
                width: 300px; 
            }
            .totals-table td { 
                text-align: right; 
                border: none; 
                padding: 8px 12px;
            }
            .total-final { 
                font-weight: 800; 
                font-size: 18px; 
                color: #0056b3; 
                border-top: 2px solid #e5e7eb !important;
                padding-top: 15px !important;
            }
            .footer { 
                margin-top: 50px; 
                text-align: center; 
                font-size: 12px; 
                color: #9ca3af; 
                border-top: 1px solid #e5e7eb; 
                padding-top: 20px;
            }
            @media print {
                body { padding: 0; }
                .no-print { display: none; }
            }
        </style>
    `;

    const itemsHtml = order.items.map(item => `
        <tr>
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>₹${item.price}</td>
            <td style="text-align: right;">₹${(item.price * item.quantity).toFixed(2)}</td>
        </tr>
    `).join('');

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Invoice #${order.id}</title>
            ${styles}
        </head>
        <body>
            <div class="header">
                <div>
                    <div class="logo">${companyDetails.name}</div>
                    <div class="company-info">
                        ${companyDetails.address}<br>
                        ${companyDetails.city} - ${companyDetails.pincode}<br>
                        ${companyDetails.phone} | ${companyDetails.email}
                    </div>
                </div>
                <div class="invoice-title">
                    <h1 class="invoice-heading">INVOICE</h1>
                    <div class="invoice-details">
                        <strong>Invoice #:</strong> ${order.id}<br>
                        <strong>Date:</strong> ${order.date}<br>
                        <strong>Payment Method:</strong> ${order.paymentMethod ? order.paymentMethod.toUpperCase() : 'Online'}
                    </div>
                </div>
            </div>

            <div class="bill-to">
                <h3>Bill To</h3>
                <strong>${order.customerName}</strong><br>
                ${order.phone}<br>
                ${order.customerEmail !== 'N/A' ? order.customerEmail + '<br>' : ''}
                <div style="margin-top: 5px; color: #6b7280; font-size: 13px;">${order.address}</div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Item Description</th>
                        <th>Qty</th>
                        <th>Unit Price</th>
                        <th style="text-align: right;">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>

            <div class="totals">
                <table class="totals-table">
                    <tr>
                        <td>Subtotal:</td>
                        <td>₹${order.subtotal}</td>
                    </tr>
                    ${order.deliveryFee > 0 ? `
                    <tr>
                        <td>Delivery:</td>
                        <td>₹${order.deliveryFee}</td>
                    </tr>` : ''}
                    ${order.discount > 0 ? `
                    <tr>
                        <td>Discount:</td>
                        <td style="color: #22c55e;">- ₹${order.discount}</td>
                    </tr>` : ''}
                    <tr>
                        <td class="total-final">Total:</td>
                        <td class="total-final">₹${order.total}</td>
                    </tr>
                </table>
            </div>

            <div class="footer">
                Thank you for your business!<br>
                This is a computer-generated invoice and does not require a signature.
            </div>

            <script>
                window.onload = function() { window.print(); }
            </script>
        </body>
        </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
};
