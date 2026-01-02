/* =================================================================
   CAIROOM - PDF Generation Utility
   أداة توليد ملفات PDF مع دعم العربية
   ================================================================= */

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * تحويل عنصر HTML إلى PDF مع دعم العربية
 * @param element - العنصر المراد تحويله
 * @param filename - اسم الملف
 */
export async function generatePDFFromElement(
    element: HTMLElement,
    filename: string
): Promise<void> {
    try {
        // إنشاء صورة من العنصر
        const canvas = await html2canvas(element, {
            scale: 2, // جودة عالية
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,
        });

        // حساب أبعاد الـ PDF
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // إنشاء PDF
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
        });

        // إضافة الصورة للـ PDF
        const imgData = canvas.toDataURL('image/png');

        // التعامل مع الصفحات المتعددة إذا كان المحتوى طويل
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        // حفظ الملف
        pdf.save(`${filename}.pdf`);
    } catch (error) {
        console.error('Error generating PDF:', error);
        throw error;
    }
}
