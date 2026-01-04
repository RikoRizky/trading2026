// Import SweetAlert2 directly - ensure it's available
import Swal from 'sweetalert2';

// Fallback function using browser alert
const fallbackAlert = (message: string, title: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
  if (typeof window !== 'undefined') {
    const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
    alert(`${emoji} ${title}\n\n${message}`);
  }
};

// Custom configuration for SweetAlert2 with fallback
export const showSuccess = (message: string, title: string = 'Berhasil!'): Promise<any> => {
  if (typeof window === 'undefined') {
    console.log(`[SUCCESS] ${title}: ${message}`);
    return Promise.resolve();
  }

  try {
    return Swal.fire({
      icon: 'success',
      title: title,
      text: message,
      confirmButtonColor: '#6366f1',
      confirmButtonText: 'OK',
      timer: 3000,
      timerProgressBar: true,
      allowOutsideClick: true,
      allowEscapeKey: true,
      customClass: {
        popup: 'swal2-popup-custom',
        confirmButton: 'swal2-confirm-custom'
      },
      didOpen: () => {
        // Ensure SweetAlert2 is on top
        const container = document.querySelector('.swal2-container') as HTMLElement;
        if (container) {
          container.style.zIndex = '99999';
        }
      }
    });
  } catch (e) {
    console.error('SweetAlert2 error:', e);
    fallbackAlert(message, title, 'success');
    return Promise.resolve();
  }
};

export const showError = (message: string, title: string = 'Error!') => {
  if (typeof window === 'undefined') {
    console.error(`[ERROR] ${title}: ${message}`);
    return;
  }

  try {
    Swal.fire({
      icon: 'error',
      title: title,
      text: message,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'OK',
      allowOutsideClick: true,
      allowEscapeKey: true,
      customClass: {
        popup: 'swal2-popup-custom',
        confirmButton: 'swal2-confirm-custom'
      },
      didOpen: () => {
        // Ensure SweetAlert2 is on top
        const container = document.querySelector('.swal2-container') as HTMLElement;
        if (container) {
          container.style.zIndex = '99999';
        }
      }
    });
  } catch (e) {
    console.error('SweetAlert2 error:', e);
    fallbackAlert(message, title, 'error');
  }
};

export const showWarning = (message: string, title: string = 'Peringatan!') => {
  if (typeof window === 'undefined') {
    console.warn(`[WARNING] ${title}: ${message}`);
    return;
  }

  try {
    Swal.fire({
      icon: 'warning',
      title: title,
      text: message,
      confirmButtonColor: '#d97706',
      confirmButtonText: 'OK',
      allowOutsideClick: true,
      allowEscapeKey: true,
      customClass: {
        popup: 'swal2-popup-custom',
        confirmButton: 'swal2-confirm-custom'
      },
      didOpen: () => {
        // Ensure SweetAlert2 is on top
        const container = document.querySelector('.swal2-container') as HTMLElement;
        if (container) {
          container.style.zIndex = '99999';
        }
      }
    });
  } catch (e) {
    console.error('SweetAlert2 error:', e);
    fallbackAlert(message, title, 'warning');
  }
};

export const showInfo = (message: string, title: string = 'Info') => {
  if (typeof window === 'undefined') {
    console.info(`[INFO] ${title}: ${message}`);
    return;
  }

  try {
    Swal.fire({
      icon: 'info',
      title: title,
      text: message,
      confirmButtonColor: '#3b82f6',
      confirmButtonText: 'OK',
      allowOutsideClick: true,
      allowEscapeKey: true,
      customClass: {
        popup: 'swal2-popup-custom',
        confirmButton: 'swal2-confirm-custom'
      },
      didOpen: () => {
        // Ensure SweetAlert2 is on top
        const container = document.querySelector('.swal2-container') as HTMLElement;
        if (container) {
          container.style.zIndex = '99999';
        }
      }
    });
  } catch (e) {
    console.error('SweetAlert2 error:', e);
    fallbackAlert(message, title, 'info');
  }
};

export const showConfirm = (
  message: string,
  title: string = 'Konfirmasi',
  confirmText: string = 'Ya',
  cancelText: string = 'Tidak'
) => {
  return Swal.fire({
    icon: 'question',
    title: title,
    text: message,
    showCancelButton: true,
    confirmButtonColor: '#6366f1',
    cancelButtonColor: '#6b7280',
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    customClass: {
      popup: 'swal2-popup-custom',
      confirmButton: 'swal2-confirm-custom',
      cancelButton: 'swal2-cancel-custom'
    }
  });
};

