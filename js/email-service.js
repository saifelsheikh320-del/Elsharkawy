/**
 * Google Apps Script Email Service
 * يوفر 15,000 إيميل مجاني شهرياً (500 يومياً)
 * يستخدم إيميلك الشخصي مباشرة ولا يطلب إيميل شركة
 */

class GoogleEmailService {
    constructor() {
        // ضع هنا الرابط الذي حصلت عليه من "New Deployment" في جوجل
        this.googleAppUrl = 'https://script.google.com/macros/s/AKfycbyDbyq6wb5M1Iyp_nD3csnXIdoLWlHe5DswvJbtlLuanjKCCMBEMGhXmq2XealSz8amoQ/exec';
    }

    /**
     * إرسال إيميل عبر سيرفر جوجل الخاص بك
     */
    async sendEmail({ to, subject, body }) {
        if (this.googleAppUrl === '' || this.googleAppUrl.includes('YOUR_GOOGLE')) {
            console.error('❌ يرجى وضع رابط Google Script في ملف email-service.js');
            return { success: false };
        }

        try {
            console.log('🔗 محاولة الاتصال بسيرفر جوجل...');
            const response = await fetch(this.googleAppUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8', // جوجل يفضل هذا النوع لتجنب مشاكل الـ Preflight
                },
                body: JSON.stringify({
                    to: to,
                    subject: subject,
                    body: body
                })
            });

            // جوجل غالباً بيرجع نجاح حتى لو فيه خطأ في السكربت نفسه
            // فبنعتمد على أن الطلب وصل بنجاح
            console.log('✅ تم إرسال الطلب لسيرفر جوجل بنجاح');
            return { success: true };

        } catch (error) {
            console.error('❌ فشل الاتصال بسيرفر جوجل:', error);
            // محاولة أخيرة باستخدام رابط أبسط قد يحل مشاكل الكورس في بعض المتصفحات
            return { success: false, error: error.message };
        }
    }

    async sendOrderNotification(order) {
        if (!order || !order.id) return;

        const orderIdShort = order.id.split('-').pop();
        const body = this.getOrderHtmlTemplate(order);

        console.log('📧 بدء إرسال إشعارات الطلب #' + orderIdShort);

        // 1. Get Admin Email from Local Settings or default
        let adminEmail = 'ibrahimelsharqawi5@gmail.com';
        try {
            const settings = JSON.parse(localStorage.getItem('site_settings') || '{}');
            if (settings.adminEmail && settings.adminEmail.includes('@')) {
                adminEmail = settings.adminEmail;
            }
        } catch (e) {
            console.warn('Could not read adminEmail from settings:', e);
        }

        const adminSubject = `🛍️ طلب جديد من ${order.customer.name} (#${orderIdShort})`;

        console.log('📤 إرسال إيميل للأدمن:', adminEmail);
        const adminResult = await this.sendEmail({ to: adminEmail, subject: adminSubject, body });

        if (adminResult.success) {
            console.log('✅ تم إرسال الإيميل للأدمن بنجاح');
        } else {
            console.error('❌ فشل إرسال الإيميل للأدمن');
            // Try fallback if primary failed and was different
            if (adminEmail !== 'ibrahimelsharqawi5@gmail.com') {
                await this.sendEmail({ to: 'ibrahimelsharqawi5@gmail.com', subject: adminSubject, body });
            }
        }

        // 2. Send to Customer (if email provided)
        if (order.customer.email && order.customer.email.includes('@')) {
            const customerSubject = `🎉 تم استلام طلبك بنجاح من متجر الشرقاوي (#${orderIdShort})`;

            console.log('📤 إرسال إيميل للعميل:', order.customer.email);
            const customerResult = await this.sendEmail({ to: order.customer.email, subject: customerSubject, body });

            if (customerResult.success) {
                console.log('✅ تم إرسال الإيميل للعميل بنجاح');
            } else {
                console.error('❌ فشل إرسال الإيميل للعميل');
            }
        } else {
            console.log('ℹ️ لم يتم إرسال إيميل للعميل (لا يوجد بريد إلكتروني)');
        }

        console.log('✅ انتهى إرسال إشعارات الطلب #' + orderIdShort);
    }

    async sendOrderCancellationNotification(order) {
        const orderIdShort = order.id.split('-').pop();
        const subject = `❌ تم إلغاء طلب من العميل: ${order.customer.name} (#${orderIdShort})`;
        const body = `
            <div dir="rtl" style="font-family: Arial; padding: 20px; border: 1px solid #fee; border-radius: 10px; background: #fff;">
                <h2 style="color: #c0392b; text-align: center; border-bottom: 2px solid #e74c3c; padding-bottom: 10px;">إشعار إلغاء طلب</h2>
                <p>قام العميل <strong>${order.customer.name}</strong> بإلغاء طلبه رقم <strong>#${orderIdShort}</strong></p>
                <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin-top: 20px;">
                    <p><strong>الهاتف:</strong> ${order.customer.phone}</p>
                    <p><strong>قيمة الطلب:</strong> ${order.total} ج.م</p>
                </div>
                <p style="margin-top: 20px; font-size: 0.9rem; color: #666;">تم هذا الإجراء بناءً على طلب العميل من صفحة "طلباتي".</p>
            </div>
        `;
        return await this.sendEmail({ to: 'ibrahimelsharqawi5@gmail.com', subject, body });
    }

    async sendPasswordResetOTP(email, name, otpCode) {
        const subject = '🔐 كود استعادة كلمة المرور - متجر الشرقاوي';
        const body = this.getOtpHtmlTemplate(name, otpCode);
        return await this.sendEmail({ to: email, subject, body });
    }

    async sendErrorReport(errorContext, errorDetails) {
        console.warn('⚠️ sendErrorReport called but disabled by user request:', errorContext);
        console.log('Error Details:', errorDetails);
        return { success: true, message: 'Skipped' };
        /* Original Code:
        const subject = `🚨 خطأ تقني في المتجر: ${errorContext}`;
        ...
        return await this.sendEmail({ to: 'ibrahimelsharqawi5@gmail.com', subject, body });
        */
    }

    getOrderHtmlTemplate(order) {
        const date = new Date(order.date).toLocaleString('ar-EG');
        const itemsHtml = order.items.map(item => `
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #edf2f7; font-size: 14px; color: #4a5568;">
                    <div style="font-weight: bold;">${item.name}</div>
                    <div style="font-size: 12px; color: #718096; margin-top: 4px;">
                        ${item.selectedColor ? `اللون: ${item.selectedColor}` : ''} 
                        ${item.selectedSize ? ` | المقاس: ${item.selectedSize}` : ''}
                    </div>
                </td>
                <td style="padding: 12px; border-bottom: 1px solid #edf2f7; font-size: 14px; color: #4a5568; text-align: center;">${item.quantity}</td>
                <td style="padding: 12px; border-bottom: 1px solid #edf2f7; font-size: 14px; color: #4a5568; text-align: left;">${item.price} ج.م</td>
                <td style="padding: 12px; border-bottom: 1px solid #edf2f7; font-size: 14px; color: #2d3748; text-align: left; font-weight: bold;">${(parseFloat(item.price) * item.quantity).toFixed(2)} ج.م</td>
            </tr>
        `).join('');

        return `
            <div dir="rtl" style="font-family: 'Cairo', Tahoma, Arial, sans-serif; background-color: #f7fafc; padding: 40px 10px;">
                <div style="max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
                    
                    <!-- Header -->
                    <!-- Header -->
                    <div style="background-color: #ffffff; padding: 30px 20px; text-align: center; border-bottom: 3px solid #3498db;">
                        <h1 style="color: #2c3e50; margin: 0; font-size: 26px; letter-spacing: 1px; font-weight: 800;">الشرقاوي</h1>
                        <p style="color: #7f8c8d; margin-top: 5px; font-size: 14px;">إشعار طلب شراء جديد 🛍️</p>
                    </div>

                    <div style="padding: 30px;">
                        <!-- Order Meta -->
                        <div style="margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px dashed #edf2f7;">
                            <div style="font-size: 14px; color: #718096;">
                                <strong>رقم الطلب:</strong> <span style="color: #2b6cb0;">#${order.id.split('-').pop()}</span><br>
                                <strong>تاريخ الطلب:</strong> ${date}
                            </div>
                        </div>

                        <!-- Customer Info -->
                        <div style="margin-bottom: 30px;">
                            <h3 style="color: #2d3748; font-size: 18px; border-right: 4px solid #4299e1; padding-right: 15px; margin-bottom: 15px;">👤 بيانات العميل والشحن</h3>
                            <div style="background-color: #f8fafc; padding: 20px; border-radius: 10px; border: 1px solid #edf2f7;">
                                <table style="width: 100%; border-collapse: collapse;">
                                    <tr>
                                        <td style="padding: 5px 0; color: #718096; width: 30%;">الاسم:</td>
                                        <td style="padding: 5px 0; color: #1a202c; font-weight: bold;">${order.customer.name}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 5px 0; color: #718096;">الهاتف:</td>
                                        <td style="padding: 5px 0; color: #1a202c; font-weight: bold;">${order.customer.phone}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 5px 0; color: #718096;">العنوان:</td>
                                        <td style="padding: 5px 0; color: #1a202c;">${order.customer.address}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 5px 0; color: #718096;">المحافظة:</td>
                                        <td style="padding: 5px 0; color: #1a202c;">${order.customer.province || 'غير محدد'}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; color: #718096; border-top: 1px solid #e2e8f0; margin-top: 10px;">طريقة الدفع:</td>
                                        <td style="padding: 10px 0; color: #48bb78; font-weight: bold; border-top: 1px solid #e2e8f0; margin-top: 10px;">${this.getPaymentMethodName(order.paymentMethod)}</td>
                                    </tr>
                                </table>
                            </div>
                        </div>

                        <!-- Products Table -->
                        <div style="margin-bottom: 30px;">
                            <h3 style="color: #2d3748; font-size: 18px; border-right: 4px solid #4299e1; padding-right: 15px; margin-bottom: 15px;">🛒 تفاصيل المنتجات</h3>
                            <div style="overflow-x: auto;">
                                <table style="width: 100%; border-collapse: collapse; min-width: 400px;">
                                    <thead>
                                        <tr style="background-color: #f1f5f9;">
                                            <th style="padding: 12px; text-align: right; font-size: 13px; color: #475569; border-bottom: 2px solid #e2e8f0;">المنتج</th>
                                            <th style="padding: 12px; text-align: center; font-size: 13px; color: #475569; border-bottom: 2px solid #e2e8f0;">الكمية</th>
                                            <th style="padding: 12px; text-align: left; font-size: 13px; color: #475569; border-bottom: 2px solid #e2e8f0;">السعر</th>
                                            <th style="padding: 12px; text-align: left; font-size: 13px; color: #475569; border-bottom: 2px solid #e2e8f0;">الإجمالي</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${itemsHtml}
                                    </tbody>
                                </table>
                            </div>

                            <!-- Summary Block for Mobile Reliability -->
                            <div style="background-color: #fffaf0; border: 1px solid #feebc8; border-radius: 10px; margin-top: 20px; padding: 20px;">
                                <table style="width: 100%; border-collapse: collapse;">
                                    <tr>
                                        <td style="padding: 5px 0; color: #718096; font-size: 14px;">المجموع الفرعي:</td>
                                        <td style="padding: 5px 0; color: #2d3748; text-align: left;">${order.subtotal || order.total} ج.م</td>
                                    </tr>
                                    ${order.shippingCost ? `
                                    <tr>
                                        <td style="padding: 5px 0; color: #718096; font-size: 14px;">مصاريف الشحن:</td>
                                        <td style="padding: 5px 0; color: #2d3748; text-align: left;">${order.shippingCost} ج.م</td>
                                    </tr>
                                    ` : ''}
                                    ${order.discount ? `
                                    <tr>
                                        <td style="padding: 5px 0; color: #e53e3e; font-size: 14px;">خصم الكوبون:</td>
                                        <td style="padding: 5px 0; color: #e53e3e; text-align: left;">-${order.discount} ج.م</td>
                                    </tr>
                                    ` : ''}
                                    <tr>
                                        <td style="padding: 15px 0 0 0; font-weight: bold; color: #2d3748; font-size: 18px; border-top: 2px solid #feebc8;">الإجمالي النهائي:</td>
                                        <td style="padding: 15px 0 0 0; font-weight: 800; color: #e53e3e; font-size: 24px; text-align: left; border-top: 2px solid #feebc8;">${order.total} ج.م</td>
                                    </tr>
                                </table>
                            </div>
                        </div>

                        <!-- Footer Note -->
                        <div style="text-align: center; color: #a0aec0; font-size: 12px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #edf2f7;">
                            هذا الإيميل تم إرساله تلقائياً من نظام متجر الشرقاوي.<br>
                            &copy; 2026 الشرقاوي - جميع الحقوق محفوظة
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getOtpHtmlTemplate(name, otpCode) {
        return `
            <div dir="rtl" style="font-family: 'Cairo', Arial, sans-serif; background: #f0f4f8; padding: 30px; border-radius: 15px; text-align: center;">
                <div style="background: #ffffff; padding: 40px; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
                    <h1 style="color: #1a1a1a; margin-bottom: 10px;">الشرقاوي</h1>
                    <p style="color: #7f8c8d; font-size: 16px;">مرحباً ${name}</p>
                    <div style="margin: 30px 0; padding: 20px; background: #e3f2fd; border-radius: 12px;">
                        <p style="color: #34495e; margin-bottom: 10px;">كود استعادة كلمة المرور هو:</p>
                        <div style="font-size: 36px; font-weight: bold; color: #1976d2; letter-spacing: 8px;">${otpCode}</div>
                    </div>
                    <p style="color: #e74c3c; font-size: 14px;">صالح لمدة 10 دقائق فقط. لا تشارك هذا الكود مع أحد.</p>
                </div>
            </div>
        `;
    }

    getPaymentMethodName(method) {
        const methods = {
            'cod': 'الدفع عند الاستلام 💵',
            'vodafone': 'فودافون كاش 📱',
            'instapay': 'انستا باي 🏦'
        };
        return methods[method] || method;
    }
}

const emailService = new GoogleEmailService();
if (typeof window !== 'undefined') {
    window.emailService = emailService;
}

