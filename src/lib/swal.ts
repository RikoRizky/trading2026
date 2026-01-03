import Swal from 'sweetalert2';

// Custom configuration for SweetAlert2
export const showSuccess = (message: string, title: string = 'Berhasil!') => {
  return Swal.fire({
    icon: 'success',
    title: title,
    text: message,
    confirmButtonColor: '#6366f1',
    confirmButtonText: 'OK',
    timer: 3000,
    timerProgressBar: true,
    customClass: {
      popup: 'swal2-popup-custom',
      confirmButton: 'swal2-confirm-custom'
    }
  });
};

export const showError = (message: string, title: string = 'Error!') => {
  return Swal.fire({
    icon: 'error',
    title: title,
    text: message,
    confirmButtonColor: '#dc2626',
    confirmButtonText: 'OK',
    customClass: {
      popup: 'swal2-popup-custom',
      confirmButton: 'swal2-confirm-custom'
    }
  });
};

export const showWarning = (message: string, title: string = 'Peringatan!') => {
  return Swal.fire({
    icon: 'warning',
    title: title,
    text: message,
    confirmButtonColor: '#d97706',
    confirmButtonText: 'OK',
    customClass: {
      popup: 'swal2-popup-custom',
      confirmButton: 'swal2-confirm-custom'
    }
  });
};

export const showInfo = (message: string, title: string = 'Info') => {
  return Swal.fire({
    icon: 'info',
    title: title,
    text: message,
    confirmButtonColor: '#3b82f6',
    confirmButtonText: 'OK',
    customClass: {
      popup: 'swal2-popup-custom',
      confirmButton: 'swal2-confirm-custom'
    }
  });
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

