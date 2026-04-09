import React from 'react';
import { Link } from 'react-router-dom';
import './Terms.css';

const Terms = () => {
    return (
        <div className="legal-page animate-fade">
            <header className="page-header">
                <div className="container">
                    <h1 style={{ color: '#fff' }}>Terms and Conditions</h1>
                    <p>Please read these terms carefully before using our services.</p>
                </div>
            </header>

            <section className="section">
                <div className="container">
                    <div className="legal-content">
                        <div className="legal-section">
                            <h2>1. Acceptance of Terms</h2>
                            <p>By accessing and using the NEW BALAN Medical & Clinic website and services, you accept and agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services.</p>
                            <p>We reserve the right to modify these terms at any time. Your continued use of our services after such modifications constitutes acceptance of the updated terms.</p>
                        </div>

                        <div className="legal-section">
                            <h2>2. Use of Services</h2>
                            <p>Our services are provided for lawful purposes only. You agree to:</p>
                            <ul>
                                <li>Use our services only for legitimate medical and healthcare needs</li>
                                <li>Provide accurate and truthful information when placing orders</li>
                                <li>Comply with all applicable laws and regulations</li>
                                <li>Not misuse our services for any illegal or unauthorized purpose</li>
                                <li>Not attempt to gain unauthorized access to our systems or data</li>
                                <li>Not interfere with or disrupt the operation of our services</li>
                            </ul>
                        </div>

                        <div className="legal-section">
                            <h2>3. Account Registration</h2>
                            <p>To use certain features of our services, you may need to create an account. You agree to:</p>
                            <ul>
                                <li>Provide accurate, current, and complete information during registration</li>
                                <li>Maintain and update your account information as necessary</li>
                                <li>Maintain the security of your account credentials</li>
                                <li>Accept responsibility for all activities that occur under your account</li>
                                <li>Notify us immediately of any unauthorized use of your account</li>
                            </ul>
                        </div>

                        <div className="legal-section">
                            <h2>4. Prescription Requirements</h2>
                            <p>For prescription medicines, you must:</p>
                            <ul>
                                <li>Provide a valid prescription from a licensed medical practitioner</li>
                                <li>Upload clear, legible images or PDFs of your prescription</li>
                                <li>Ensure the prescription is current and not expired</li>
                                <li>Provide accurate prescription details when placing orders</li>
                            </ul>
                            <p>We reserve the right to:</p>
                            <ul>
                                <li>Verify prescriptions with prescribing doctors</li>
                                <li>Refuse orders if prescriptions are invalid or unclear</li>
                                <li>Request additional information or clarification when needed</li>
                                <li>Cancel orders that do not meet prescription requirements</li>
                            </ul>
                        </div>

                        <div className="legal-section">
                            <h2>5. Order Placement and Processing</h2>
                            <p><strong>Order Confirmation:</strong> When you place an order, you will receive an order confirmation. This confirmation does not guarantee order acceptance. We reserve the right to accept or reject any order at our discretion.</p>
                            <p><strong>Order Cancellation:</strong> You may cancel an order before it is processed. Once an order is processed and dispatched, cancellation may not be possible. Contact us immediately if you need to cancel an order.</p>
                            <p><strong>Order Modifications:</strong> We may modify or cancel orders due to:</p>
                            <ul>
                                <li>Product unavailability</li>
                                <li>Pricing errors</li>
                                <li>Prescription verification issues</li>
                                <li>Fraudulent activity</li>
                                <li>Technical errors</li>
                            </ul>
                        </div>

                        <div className="legal-section">
                            <h2>6. Pricing and Payment</h2>
                            <p><strong>Pricing:</strong> All prices are displayed in Indian Rupees (₹) and are subject to change without notice. We strive to maintain accurate pricing, but errors may occur. We reserve the right to correct pricing errors.</p>
                            <p><strong>Payment Methods:</strong> We accept various payment methods including:</p>
                            <ul>
                                <li>Credit/Debit cards</li>
                                <li>Card, UPI and Net Banking (via Razorpay)</li>
                                <li>Net banking</li>
                                <li>Cash on delivery (where available)</li>
                            </ul>
                            <p><strong>Payment Processing:</strong> Payments are processed securely through third-party payment gateways. We do not store your complete payment card information.</p>
                            <p>
                                <strong>Refunds:</strong> Refund and cancellation rules are set out in our{' '}
                                <Link to="/refund-policy">Refund &amp; Cancellation Policy</Link>. Refunds, when approved,
                                are typically processed to the original payment method within 7–14 business days, subject
                                to banks and payment partners.
                            </p>
                        </div>

                        <div className="legal-section">
                            <h2>7. Delivery Terms</h2>
                            <p><strong>Delivery Areas:</strong> We provide delivery services in specified areas. Delivery availability is subject to change.</p>
                            <p><strong>Delivery Time:</strong> Estimated delivery times are provided for guidance only. Actual delivery times may vary due to factors beyond our control.</p>
                            <p><strong>Delivery Charges:</strong> Delivery charges apply as specified at checkout. Free delivery may be available for orders above a certain amount.</p>
                            <p><strong>Delivery Restrictions:</strong> Some medicines may have delivery restrictions based on:</p>
                            <ul>
                                <li>Prescription requirements</li>
                                <li>Storage conditions</li>
                                <li>Regulatory restrictions</li>
                                <li>Geographic limitations</li>
                            </ul>
                            <p><strong>Failed Delivery:</strong> If delivery cannot be completed, we will attempt to contact you. Orders may be cancelled if delivery cannot be completed after multiple attempts.</p>
                        </div>

                        <div className="legal-section">
                            <h2>8. Return and Refund Policy</h2>
                            <p><strong>Returns:</strong> Due to the nature of pharmaceutical products, returns are generally not accepted except in cases of:</p>
                            <ul>
                                <li>Defective or damaged products</li>
                                <li>Wrong products delivered</li>
                                <li>Expired products</li>
                                <li>Products not matching the description</li>
                            </ul>
                            <p><strong>Return Process:</strong> To initiate a return, contact us within 24 hours of delivery. Returns must be in original, unopened condition with all packaging intact.</p>
                            <p><strong>Refunds:</strong> Refunds will be processed after verification of the returned product. Refund processing may take 7-14 business days.</p>
                        </div>

                        <div className="legal-section">
                            <h2>9. Intellectual Property</h2>
                            <p>All content on our website, including text, graphics, logos, images, and software, is the property of NEW BALAN Medical & Clinic or its licensors and is protected by copyright and trademark laws.</p>
                            <p>You may not:</p>
                            <ul>
                                <li>Reproduce, distribute, or modify our content without permission</li>
                                <li>Use our trademarks or logos without authorization</li>
                                <li>Copy or reverse engineer our website or software</li>
                            </ul>
                        </div>

                        <div className="legal-section">
                            <h2>10. Limitation of Liability</h2>
                            <p>To the maximum extent permitted by law:</p>
                            <ul>
                                <li>We are not liable for any indirect, incidental, or consequential damages</li>
                                <li>Our total liability is limited to the amount you paid for the specific product or service</li>
                                <li>We are not responsible for delays or failures due to circumstances beyond our control</li>
                                <li>We do not guarantee uninterrupted or error-free service</li>
                            </ul>
                            <p>This limitation does not affect your statutory rights as a consumer.</p>
                        </div>

                        <div className="legal-section">
                            <h2>11. Medical Disclaimer</h2>
                            <p><strong>Important:</strong> Our services provide access to medicines and healthcare products. We are not a substitute for professional medical advice, diagnosis, or treatment.</p>
                            <p>You should:</p>
                            <ul>
                                <li>Consult qualified healthcare professionals for medical advice</li>
                                <li>Not use our services for emergency medical situations</li>
                                <li>Follow prescribed dosages and usage instructions</li>
                                <li>Report adverse reactions to medicines immediately</li>
                            </ul>
                            <p>We are not liable for any health consequences resulting from the use of products purchased through our services.</p>
                        </div>

                        <div className="legal-section">
                            <h2>12. Prohibited Activities</h2>
                            <p>You agree not to:</p>
                            <ul>
                                <li>Use our services for any illegal purpose</li>
                                <li>Attempt to purchase prescription medicines without valid prescriptions</li>
                                <li>Resell products purchased from us</li>
                                <li>Use automated systems to access our services</li>
                                <li>Interfere with or disrupt our services</li>
                                <li>Impersonate others or provide false information</li>
                                <li>Violate any applicable laws or regulations</li>
                            </ul>
                        </div>

                        <div className="legal-section">
                            <h2>13. Termination</h2>
                            <p>We reserve the right to:</p>
                            <ul>
                                <li>Suspend or terminate your account at any time for violation of these terms</li>
                                <li>Refuse service to anyone at our discretion</li>
                                <li>Modify or discontinue services without prior notice</li>
                            </ul>
                            <p>You may terminate your account at any time by contacting us or using account deletion features.</p>
                        </div>

                        <div className="legal-section">
                            <h2>14. Governing Law</h2>
                            <p>These Terms and Conditions are governed by the laws of India. Any disputes arising from these terms or our services shall be subject to the exclusive jurisdiction of the courts in Thoothukudi, Tamil Nadu, India.</p>
                        </div>

                        <div className="legal-section">
                            <h2>15. Contact Information</h2>
                            <p>For questions about these Terms and Conditions, please contact us:</p>
                            <ul>
                                <li><strong>Email:</strong> newbalanmedicals@gmail.com</li>
                                <li><strong>Phone:</strong> +91 9894880598</li>
                                <li><strong>Address:</strong> 120/a Poobalarayapuram 2nd street, Thoothukudi, Tamil Nadu 628001</li>
                            </ul>
                        </div>

                        <div className="legal-footer">
                            <p>
                                <Link to="/privacy">Privacy Policy</Link>
                                {' · '}
                                <Link to="/refund-policy">Refund Policy</Link>
                            </p>
                            <p><strong>Last Updated:</strong> January 2026</p>
                            <p>These Terms and Conditions are effective as of the date stated above and apply to all users of NEW BALAN Medical & Clinic services.</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Terms;
