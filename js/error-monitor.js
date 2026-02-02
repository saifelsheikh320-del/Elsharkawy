/**
 * Error Monitor for الشرقاوي
 * يراقب الأخطاء ويرسل تقارير للأدمن
 */

(function () {
    // لمنع إرسال نفس الخطأ عدة مرات
    const sentErrors = new Set();
    const MAX_ERRORS_PER_SESSION = 5;
    let errorsCount = 0;

    function reportError(type, message, details) {
        if (errorsCount >= MAX_ERRORS_PER_SESSION) return;

        const errorKey = `${type}:${message}`;
        if (sentErrors.has(errorKey)) return; // تم إرساله من قبل

        sentErrors.add(errorKey);
        errorsCount++;

        console.log('🚨 Caught Error:', message);

        // COMMENTED OUT: User requested to disable error notifications via email
        /*
        if (window.emailService) {
            window.emailService.sendErrorReport(type, `${message}\n\nStack/Details:\n${details || 'No details provided'}`)
                .then(res => {
                    if (res.success) console.log('✅ Error report email sent.');
                })
                .catch(err => console.error('Failed to send error report email', err));
        }
        */
        console.log('ℹ️ Error report skipped (Email notifications disabled for technical errors)');
    }

    // 1. مراقبة أخطاء JavaScript العامة
    window.onerror = function (message, source, lineno, colno, error) {
        // تجاهل أخطاء الإعلانات الشائعة أو الإضافات
        if (message.includes('Script error') || message.includes('extension')) return;

        const details = `File: ${source}\nLine: ${lineno}:${colno}\nStack: ${error ? error.stack : 'N/A'}`;
        reportError('JavaScript Error', message, details);
    };

    // 2. مراقبة الوعود المرفوضة (Promise Rejections) - مثل فشل الشبكة
    window.onunhandledrejection = function (event) {
        const reason = event.reason;
        let message = 'Unhandled Promise Rejection';
        let stack = '';

        if (reason instanceof Error) {
            message = reason.message;
            stack = reason.stack;
        } else {
            message = String(reason);
        }

        // فلترة: لا ترسل أخطاء الشبكة البسيطة إلا إذا كانت متكررة
        reportError('Promise Rejection', message, stack);
    };

    // 3. دالة يدوية للإبلاغ (يمكن استخدامها في try-catch)
    window.reportCriticalError = function (error, context = 'Critical Error') {
        const message = error.message || String(error);
        const stack = error.stack || 'No Stack Trace';
        reportError(context, message, stack);
    };

    console.log('🛡️ Error Monitor Active');

})();

