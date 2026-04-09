import React from 'react';
import { Link } from 'react-router-dom';
import './Terms.css';

const RefundPolicy = () => {
    return (
        <div className="legal-page animate-fade">
            <header className="page-header">
                <div className="container">
                    <h1 style={{ color: '#fff' }}>Refund &amp; Cancellation Policy</h1>
                    <p>How we handle cancellations, failed payments, and refunds for medicine orders.</p>
                </div>
            </header>

            <section className="section">
                <div className="container">
                    <div className="legal-content">
                        <div className="legal-section">
                            <h2>1. Scope</h2>
                            <p>
                                This policy applies to orders placed through NEW BALAN Medical &amp; Clinic&apos;s website
                                for pharmacy (medicine) products and related online payments processed via our payment
                                partner (e.g. Razorpay). It should be read together with our{' '}
                                <Link to="/terms">Terms &amp; Conditions</Link>.
                            </p>
                        </div>

                        <div className="legal-section">
                            <h2>2. Order cancellation (before dispatch)</h2>
                            <p>
                                You may request cancellation of an order before it is verified and dispatched, subject to
                                stock, prescription validation, and legal requirements for scheduled or controlled
                                products. If we accept cancellation before dispatch, any successful online payment will be
                                refunded as described in section 5.
                            </p>
                            <p>
                                Once an order has been dispatched or handed over to the courier, cancellation may not be
                                possible; contact us immediately and we will advise based on the situation and applicable
                                law.
                            </p>
                        </div>

                        <div className="legal-section">
                            <h2>3. Prescription and compliance holds</h2>
                            <p>
                                Orders that include prescription-only medicines require a valid prescription. If a
                                prescription is missing, unclear, or cannot be verified, we may delay or cancel the order.
                                If payment was already captured, a refund will be initiated where applicable.
                            </p>
                        </div>

                        <div className="legal-section">
                            <h2>4. Failed or duplicate payments</h2>
                            <p>
                                If a payment fails at checkout, no charge should appear on your account. If money was
                                debited but our system did not confirm success (e.g. network or gateway timeout), the
                                bank or payment provider usually reverses the amount automatically within a few business
                                days.
                            </p>
                            <p>
                                If you believe you were charged twice for the same order, contact us with your order
                                reference and payment details so we can reconcile with the gateway.
                            </p>
                        </div>

                        <div className="legal-section">
                            <h2>5. Refund method and timeline</h2>
                            <p>
                                Approved refunds for online payments are typically credited to the original payment method
                                (card / UPI / net banking) used at checkout. Timelines depend on your bank or wallet
                                provider; many refunds complete within <strong>7–14 business days</strong>, and in some
                                cases may take longer as per RBI and partner rules.
                            </p>
                            <p>We do not guarantee instant refunds; we will provide reference IDs when available.</p>
                        </div>

                        <div className="legal-section">
                            <h2>6. Non-returnable or restricted items</h2>
                            <p>
                                For reasons of safety and law, opened medicines, temperature-sensitive items, or products
                                that cannot be resold may not be eligible for return or refund except where required by
                                law or at our discretion for genuine errors on our part.
                            </p>
                        </div>

                        <div className="legal-section">
                            <h2>7. Contact</h2>
                            <p>
                                For refund or cancellation queries, use the contact details on our{' '}
                                <Link to="/contact">Contact</Link> page or the phone / email shown in the site footer.
                            </p>
                        </div>

                        <div className="legal-footer">
                            <p>
                                <Link to="/terms">Terms &amp; Conditions</Link>
                                {' · '}
                                <Link to="/privacy">Privacy Policy</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default RefundPolicy;
